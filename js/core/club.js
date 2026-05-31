/* ============================================================================
 * club.js  —  The Club model
 * ----------------------------------------------------------------------------
 * Holds a squad of Player objects, club identity (colors/stadium used for UI
 * theming), finances, and the logic to auto-pick a best XI and compute the
 * attack / midfield / defence strengths the match engine consumes.
 * ==========================================================================*/
(function (root) {
  root.Gaffer = root.Gaffer || {};
  var G = root.Gaffer;

  // Formations: each maps to the set of "lines" we need to fill.
  // We keep it simple at the engine level (GK/DEF/MID/ATT counts); the tactics
  // screen will expose the named shapes.
  var FORMATIONS = {
    '4-3-3':   { DEF: 4, MID: 3, ATT: 3 },
    '4-4-2':   { DEF: 4, MID: 4, ATT: 2 },
    '4-2-3-1': { DEF: 4, MID: 5, ATT: 1 },
    '3-5-2':   { DEF: 3, MID: 5, ATT: 2 },
    '3-4-3':   { DEF: 3, MID: 4, ATT: 3 },
    '5-3-2':   { DEF: 5, MID: 3, ATT: 2 },
    '4-1-4-1': { DEF: 4, MID: 5, ATT: 1 }
  };
  G.FORMATIONS = FORMATIONS;

  function Club(data) {
    this.id = data.id;
    this.name = data.name;
    this.short = data.short;          // 3-letter code
    this.league = data.league;        // league id
    this.playable = data.playable !== false;
    this.colors = data.colors || { primary: '#1E40AF', secondary: '#FFFFFF' };
    this.stadium = data.stadium || (this.name + ' Stadium');
    this.capacity = data.capacity || 30000;
    this.reputation = data.reputation || 60; // 0-100, drives finances & AI ambition

    this.players = [];                // Player objects
    this.formation = '4-3-3';
    this.lineup = [];                 // array of 11 player ids (set on match day)

    // Finances (millions, except wages which sum thousands/week).
    this.transferBudget = data.transferBudget != null ? data.transferBudget : estimateBudget(this.reputation);
    this.wageBudget = data.wageBudget != null ? data.wageBudget : Math.round(this.transferBudget * 0.6 + 30); // k/week
    this.balance = 0;

    this.captainId = null;
  }

  function estimateBudget(rep) {
    // Rough mapping of reputation to a summer transfer kitty (millions).
    return Math.max(10, Math.round((rep - 58) * 5.5));
  }

  Club.prototype.addPlayer = function (player) {
    player.clubId = this.id;
    this.players.push(player);
  };

  Club.prototype.removePlayer = function (playerId) {
    var idx = this.players.findIndex(function (p) { return p.id === playerId; });
    if (idx >= 0) return this.players.splice(idx, 1)[0];
    return null;
  };

  Club.prototype.getPlayer = function (playerId) {
    return this.players.find(function (p) { return p.id === playerId; }) || null;
  };

  Club.prototype.wageBillWeekly = function () {
    return this.players.reduce(function (s, p) { return s + p.wage; }, 0); // thousands/week
  };

  Club.prototype.squadOVR = function () {
    if (!this.players.length) return 0;
    var top = this.players.slice().sort(byOVR).slice(0, 16);
    return Math.round(top.reduce(function (s, p) { return s + p.overall; }, 0) / top.length);
  };

  function byOVR(a, b) { return b.overall - a.overall; }

  // Pick the strongest available XI for the current formation.
  Club.prototype.pickBestXI = function (formation) {
    formation = formation || this.formation;
    var need = FORMATIONS[formation] || FORMATIONS['4-3-3'];
    var avail = this.players.filter(function (p) { return p.isAvailable(); });

    var byLine = { GK: [], DEF: [], MID: [], ATT: [] };
    avail.forEach(function (p) { byLine[p.line].push(p); });
    for (var k in byLine) byLine[k].sort(byOVR);

    var xi = [];
    // Goalkeeper.
    if (byLine.GK[0]) xi.push(byLine.GK[0]);
    // Outfield lines.
    ['DEF', 'MID', 'ATT'].forEach(function (line) {
      for (var i = 0; i < need[line] && byLine[line][i]; i++) xi.push(byLine[line][i]);
    });
    // Fill any shortfall (e.g., injuries) with best remaining outfielders.
    if (xi.length < 11) {
      var used = {};
      xi.forEach(function (p) { used[p.id] = true; });
      var rest = avail.filter(function (p) { return !used[p.id] && p.line !== 'GK'; }).sort(byOVR);
      for (var j = 0; xi.length < 11 && rest[j]; j++) xi.push(rest[j]);
    }
    this.lineup = xi.slice(0, 11).map(function (p) { return p.id; });
    this.formation = formation;
    return this.lineup;
  };

  Club.prototype.lineupPlayers = function () {
    var self = this;
    return (this.lineup || []).map(function (id) { return self.getPlayer(id); }).filter(Boolean);
  };

  // ---- Team strengths for the match engine --------------------------------
  // Aggregates the selected XI into attack / midfield / defence / keeper ratings.
  Club.prototype.strengths = function () {
    var xi = this.lineupPlayers();
    if (xi.length < 11) { this.pickBestXI(); xi = this.lineupPlayers(); }

    var gk = xi.find(function (p) { return p.line === 'GK'; });
    var def = xi.filter(function (p) { return p.line === 'DEF'; });
    var mid = xi.filter(function (p) { return p.line === 'MID'; });
    var att = xi.filter(function (p) { return p.line === 'ATT'; });

    function avg(arr, fn) {
      if (!arr.length) return 50;
      return arr.reduce(function (s, p) { return s + fn(p); }, 0) / arr.length;
    }

    // Each line blends its own duty with help from neighbouring lines.
    var attackR = 0.6 * avg(att, function (p) { return p.attack(); })
                + 0.3 * avg(mid, function (p) { return p.attack(); })
                + 0.1 * avg(def, function (p) { return p.attack(); });

    var midfieldR = 0.55 * avg(mid, function (p) { return p.creativity(); })
                  + 0.25 * avg(att, function (p) { return p.creativity(); })
                  + 0.20 * avg(def, function (p) { return p.creativity(); });

    var defenceR = 0.6 * avg(def, function (p) { return p.defence(); })
                 + 0.3 * avg(mid, function (p) { return p.defence(); })
                 + 0.1 * (gk ? gk.overall : 60);

    return {
      attack: attackR,
      midfield: midfieldR,
      defence: defenceR,
      keeper: gk ? gk.keeper() : 55,
      xi: xi
    };
  };

  // Average fitness of the XI — feeds late-game fatigue effects.
  Club.prototype.lineupFitness = function () {
    var xi = this.lineupPlayers();
    if (!xi.length) return 100;
    return xi.reduce(function (s, p) { return s + p.fitness; }, 0) / xi.length;
  };

  G.Club = Club;
})(typeof window !== 'undefined' ? window : globalThis);
