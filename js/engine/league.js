/* ============================================================================
 * league.js  —  Competition: fixtures, table, leaderboards
 * ----------------------------------------------------------------------------
 * Generates a double round-robin schedule (everyone plays everyone home & away),
 * maintains the league table from results, and rolls up scorer/assist/clean-sheet
 * leaderboards across the season.
 * ==========================================================================*/
(function (root) {
  root.Gaffer = root.Gaffer || {};
  var G = root.Gaffer;

  function League(id, name, clubIds) {
    this.id = id;
    this.name = name;
    this.clubIds = clubIds.slice();
    this.fixtures = [];      // array of rounds; each round = array of {home, away, played, result}
    this.currentRound = 0;   // index into fixtures
    this.table = {};         // clubId -> row
    this._initTable();
    this.generateFixtures();
  }

  League.prototype._initTable = function () {
    var self = this;
    this.clubIds.forEach(function (id) {
      self.table[id] = { clubId: id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0, form: [] };
    });
  };

  // Circle method for round-robin scheduling, then mirror for the reverse half.
  League.prototype.generateFixtures = function () {
    var ids = this.clubIds.slice();
    if (ids.length % 2 !== 0) ids.push(null); // bye marker
    var n = ids.length;
    var rounds = [];
    var arr = ids.slice();

    for (var r = 0; r < n - 1; r++) {
      var round = [];
      for (var i = 0; i < n / 2; i++) {
        var a = arr[i], b = arr[n - 1 - i];
        if (a !== null && b !== null) {
          // Alternate home/away by round for fairness.
          if ((r + i) % 2 === 0) round.push({ home: a, away: b, played: false, result: null });
          else round.push({ home: b, away: a, played: false, result: null });
        }
      }
      rounds.push(round);
      // Rotate (keep first fixed).
      var fixed = arr[0];
      var rest = arr.slice(1);
      rest.unshift(rest.pop());
      arr = [fixed].concat(rest);
    }

    // Reverse fixtures (swap home/away) for the second half of the season.
    var reverse = rounds.map(function (round) {
      return round.map(function (m) { return { home: m.away, away: m.home, played: false, result: null }; });
    });

    this.fixtures = rounds.concat(reverse);
  };

  League.prototype.totalRounds = function () { return this.fixtures.length; };
  League.prototype.isComplete = function () { return this.currentRound >= this.fixtures.length; };
  League.prototype.roundFixtures = function (roundIndex) {
    return this.fixtures[roundIndex == null ? this.currentRound : roundIndex] || [];
  };

  // Find the round + fixture for a given club (used to know "your next match").
  League.prototype.nextFixtureFor = function (clubId) {
    for (var r = this.currentRound; r < this.fixtures.length; r++) {
      var fx = this.fixtures[r];
      for (var i = 0; i < fx.length; i++) {
        if (!fx[i].played && (fx[i].home === clubId || fx[i].away === clubId)) {
          return { round: r, fixture: fx[i] };
        }
      }
    }
    return null;
  };

  League.prototype.recordResult = function (fixture, result) {
    fixture.played = true;
    fixture.result = { homeScore: result.homeScore, awayScore: result.awayScore };
    this._applyToTable(fixture.home, fixture.away, result.homeScore, result.awayScore);
  };

  League.prototype._applyToTable = function (homeId, awayId, hs, as_) {
    var h = this.table[homeId], a = this.table[awayId];
    if (!h || !a) return;
    h.P++; a.P++;
    h.GF += hs; h.GA += as_; a.GF += as_; a.GA += hs;
    h.GD = h.GF - h.GA; a.GD = a.GF - a.GA;
    if (hs > as_) { h.W++; h.Pts += 3; a.L++; pushForm(h, 'W'); pushForm(a, 'L'); }
    else if (hs < as_) { a.W++; a.Pts += 3; h.L++; pushForm(a, 'W'); pushForm(h, 'L'); }
    else { h.D++; a.D++; h.Pts++; a.Pts++; pushForm(h, 'D'); pushForm(a, 'D'); }
  };

  function pushForm(row, r) { row.form.push(r); if (row.form.length > 5) row.form.shift(); }

  // Sorted table rows (Pts, GD, GF, name).
  League.prototype.standings = function (clubLookup) {
    var rows = Object.keys(this.table).map(function (id) { return this.table[id]; }, this).slice();
    rows.sort(function (a, b) {
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      if (b.GD !== a.GD) return b.GD - a.GD;
      if (b.GF !== a.GF) return b.GF - a.GF;
      var an = clubLookup ? clubLookup(a.clubId).name : a.clubId;
      var bn = clubLookup ? clubLookup(b.clubId).name : b.clubId;
      return an < bn ? -1 : 1;
    });
    return rows;
  };

  // Build scorer/assist leaderboards from a list of all clubs' players.
  League.leaderboards = function (clubs) {
    var scorers = [], assists = [], cleanSheets = [];
    clubs.forEach(function (club) {
      club.players.forEach(function (p) {
        if (p.stats.goals > 0) scorers.push({ name: p.name, club: club.short, value: p.stats.goals, apps: p.stats.apps });
        if (p.stats.assists > 0) assists.push({ name: p.name, club: club.short, value: p.stats.assists, apps: p.stats.apps });
        if (p.line === 'GK' && p.stats.cleanSheets > 0) cleanSheets.push({ name: p.name, club: club.short, value: p.stats.cleanSheets, apps: p.stats.apps });
      });
    });
    function topSort(a, b) { return b.value - a.value || a.apps - b.apps; }
    scorers.sort(topSort); assists.sort(topSort); cleanSheets.sort(topSort);
    return { scorers: scorers.slice(0, 20), assists: assists.slice(0, 20), cleanSheets: cleanSheets.slice(0, 20) };
  };

  G.League = League;
})(typeof window !== 'undefined' ? window : globalThis);
