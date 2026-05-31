/* ============================================================================
 * main.js  —  Game controller / world state
 * ----------------------------------------------------------------------------
 * Builds the game world from the data files, drives the season round by round,
 * runs the user's match in full detail (for highlights) plus the rest of the
 * round, updates the table, recovers players, and handles save/load.
 * The UI layer (ui.js) calls into this; this module never touches the DOM.
 * ==========================================================================*/
(function (root) {
  root.Gaffer = root.Gaffer || {};
  var G = root.Gaffer;

  var Game = {
    world: null,
    managerClubId: null,
    season: '2025-26',
    seasonStartYear: 2025,
    lastRound: null,        // { userResult, others: [results] }
    history: { results: [] }
  };

  // ---- World construction --------------------------------------------------
  Game.buildWorld = function () {
    var clubs = {}, list = [];
    G.DATA.clubs.forEach(function (cd) {
      var club = new G.Club(cd);
      var squad = G.DATA.squads[cd.id] || [];
      squad.forEach(function (rec, i) {
        var p = new G.Player(rec, cd.id);
        p.id = cd.id + '-' + i;                 // stable, deterministic id
        p.contractYears = 2 + (i % 4);          // 2-5 years
        p.recalcEconomics();
        club.addPlayer(p);
      });
      assignShirtsAndCaptain(club);
      club.pickBestXI(club.formation);
      club.tactics = Object.assign({}, G.Match.DEFAULT_TACTICS);
      clubs[cd.id] = club;
      list.push(club);
    });

    var leagueClubIds = list.filter(function (c) { return c.league === 'eng'; }).map(function (c) { return c.id; });
    var league = new G.League('eng', G.DATA.leagues.eng.name, leagueClubIds);

    this.world = { clubs: clubs, list: list, league: league };
    return this.world;
  };

  function assignShirtsAndCaptain(club) {
    // Simple shirt allocation by line, captain = highest OVR outfielder.
    var nextByLine = { GK: 1, DEF: 2, MID: 6, ATT: 9 };
    var used = {};
    club.players.slice().sort(function (a, b) { return b.overall - a.overall; }).forEach(function (p) {
      var n = nextByLine[p.line]++;
      while (used[n]) n++;
      used[n] = true; p.shirt = n;
    });
    var outfield = club.players.filter(function (p) { return p.line !== 'GK'; }).sort(function (a, b) { return b.overall - a.overall; });
    if (outfield[0]) club.captainId = outfield[0].id;
  }

  Game.club = function (id) { return this.world.clubs[id]; };
  Game.managerClub = function () { return this.world.clubs[this.managerClubId]; };
  Game.league = function () { return this.world.league; };

  // ---- New game ------------------------------------------------------------
  Game.startNewGame = function (clubId) {
    this.buildWorld();
    this.managerClubId = clubId;
    this.season = '2025-26';
    this.lastRound = null;
    this.history = { results: [] };
    this.autosave();
    return this.managerClub();
  };

  // ---- Fixtures ------------------------------------------------------------
  Game.nextFixtureForManager = function () {
    return this.world.league.nextFixtureFor(this.managerClubId);
  };

  Game.opponentInfo = function () {
    var nf = this.nextFixtureForManager();
    if (!nf) return null;
    var fx = nf.fixture;
    var isHome = fx.home === this.managerClubId;
    var oppId = isHome ? fx.away : fx.home;
    return { isHome: isHome, opponent: this.club(oppId), round: nf.round + 1, fixture: fx };
  };

  // Pick a random-ish but plausible weather for a match.
  Game.rollWeather = function () {
    var r = Math.random();
    if (r < 0.55) return 'clear';
    if (r < 0.75) return 'rain';
    if (r < 0.85) return 'cloudy';
    if (r < 0.93) return 'fog';
    if (r < 0.98) return 'night';
    return 'snow';
  };

  // ---- Play the current round ---------------------------------------------
  // userOpts: { weather } ; the manager's lineup/tactics are already on the club.
  Game.playRound = function (userOpts) {
    userOpts = userOpts || {};
    var league = this.world.league;
    if (league.isComplete()) return null;
    var roundIdx = league.currentRound;
    var fixtures = league.roundFixtures(roundIdx);
    var self = this;
    var weather = userOpts.weather || this.rollWeather();

    var userResult = null, others = [];

    fixtures.forEach(function (fx) {
      if (fx.played) return;
      var home = self.club(fx.home), away = self.club(fx.away);
      var isUser = (fx.home === self.managerClubId || fx.away === self.managerClubId);

      // AI clubs always field their best XI.
      if (fx.home !== self.managerClubId) home.pickBestXI(home.formation);
      if (fx.away !== self.managerClubId) away.pickBestXI(away.formation);

      var result = G.Match.simulate(home, away, {
        weather: isUser ? weather : self.rollWeather(),
        homeTactics: home.tactics, awayTactics: away.tactics
      });
      league.recordResult(fx, result);
      result.round = roundIdx + 1;

      if (isUser) userResult = result; else others.push(result);
    });

    // Recover everyone for next week (~7 rest days) + advance injuries/morale.
    this.world.list.forEach(function (club) {
      club.players.forEach(function (p) { p.advanceDay(7); });
    });
    // Small chance of a new injury to a manager's player who featured.
    this.maybeInjure();

    league.currentRound++;
    this.lastRound = { userResult: userResult, others: others, weather: weather };
    this.history.results.push({ round: roundIdx + 1, userResult: summarize(userResult), others: others.map(summarize) });
    this.autosave();
    return this.lastRound;
  };

  function summarize(r) {
    if (!r) return null;
    return { h: r.homeShort, a: r.awayShort, hs: r.homeScore, as: r.awayScore, hId: r.homeId, aId: r.awayId };
  }

  Game.maybeInjure = function () {
    var club = this.managerClub();
    if (!club) return;
    var xi = club.lineupPlayers();
    xi.forEach(function (p) {
      if (p.isAvailable() && Math.random() < 0.012) {
        var days = 7 + Math.floor(Math.random() * 35);
        p.injuryDays = days;
        p.injury = days > 28 ? 'Muscle tear' : (days > 14 ? 'Hamstring strain' : 'Knock');
      }
    });
  };

  // ---- Standings & stats ---------------------------------------------------
  Game.standings = function () {
    var self = this;
    return this.world.league.standings(function (id) { return self.club(id); });
  };
  Game.leaderboards = function () {
    var engClubs = this.world.list.filter(function (c) { return c.league === 'eng'; });
    return G.League.leaderboards(engClubs);
  };
  Game.managerPosition = function () {
    var rows = this.standings();
    for (var i = 0; i < rows.length; i++) if (rows[i].clubId === this.managerClubId) return i + 1;
    return null;
  };

  // ---- Save / load ---------------------------------------------------------
  Game.serialize = function () {
    var league = this.world.league;
    var players = {};
    this.world.list.forEach(function (club) {
      club.players.forEach(function (p) {
        players[p.id] = {
          c: p.clubId, o: p.overall, a: p.age, f: Math.round(p.fitness), m: Math.round(p.morale),
          fm: p.form, inj: p.injuryDays, injn: p.injury, cy: p.contractYears, s: p.stats
        };
      });
    });
    var fixturesProgress = league.fixtures.map(function (round) {
      return round.map(function (m) { return m.played ? [1, m.result.homeScore, m.result.awayScore] : [0]; });
    });
    return {
      _meta: { club: this.managerClubId, clubName: this.managerClub().name, season: this.season,
               round: league.currentRound, pos: this.managerPosition() },
      v: 1, managerClubId: this.managerClubId, season: this.season,
      currentRound: league.currentRound, table: league.table,
      fixturesProgress: fixturesProgress, players: players
    };
  };

  Game.applyState = function (s) {
    this.buildWorld();
    this.managerClubId = s.managerClubId;
    this.season = s.season || '2025-26';
    var league = this.world.league;
    league.currentRound = s.currentRound || 0;
    if (s.table) league.table = s.table;
    // Restore fixture results.
    if (s.fixturesProgress) {
      s.fixturesProgress.forEach(function (round, ri) {
        round.forEach(function (m, mi) {
          var fx = league.fixtures[ri] && league.fixtures[ri][mi];
          if (fx && m[0] === 1) { fx.played = true; fx.result = { homeScore: m[1], awayScore: m[2] }; }
        });
      });
    }
    // Restore player dynamic state.
    var self = this;
    if (s.players) {
      Object.keys(s.players).forEach(function (id) {
        var d = s.players[id];
        var club = self.world.clubs[d.c];
        var p = club && club.getPlayer(id);
        if (!p) { // search all clubs (in case of transfer)
          for (var k in self.world.clubs) { p = self.world.clubs[k].getPlayer(id); if (p) break; }
        }
        if (!p) return;
        p.overall = d.o; p.age = d.a; p.fitness = d.f; p.morale = d.m; p.form = d.fm || 0;
        p.injuryDays = d.inj || 0; p.injury = d.injn || null; p.contractYears = d.cy;
        if (d.s) p.stats = d.s;
        p.att = G.Ratings.generate(p.name, p.position, p.overall);
        p.recalcEconomics();
      });
    }
    // Re-pick lineups.
    this.world.list.forEach(function (c) { c.pickBestXI(c.formation); });
    return true;
  };

  Game.autosave = function () { if (G.Save) G.Save.save('auto', this.serialize()); };
  Game.saveToSlot = function (slot) { return G.Save.save(slot, this.serialize()); };
  Game.loadFromSlot = function (slot) {
    var data = G.Save.load(slot);
    if (!data || !data.state) return false;
    this.applyState(data.state);
    return true;
  };

  G.Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
