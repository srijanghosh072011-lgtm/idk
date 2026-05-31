/* ============================================================================
 * player.js  —  The Player model
 * ----------------------------------------------------------------------------
 * Built from a compact record + the Ratings engine. Holds the live, mutable
 * state that changes during a career: morale, fitness, injuries, form, contract,
 * and dynamic OVR (from ageing). Static attributes come from Ratings.generate().
 * ==========================================================================*/
(function (root) {
  root.Gaffer = root.Gaffer || {};
  var G = root.Gaffer;
  var R = G.Ratings;

  var _idCounter = 1;

  function Player(rec, clubId) {
    // rec = [name, position, age, nationality, overall, potential, (shirt?)]
    this.id = 'p' + (_idCounter++);
    this.name = rec[0];
    this.position = rec[1];
    this.age = rec[2];
    this.nationality = rec[3];
    this.overall = rec[4];
    this.potential = Math.max(rec[5] || rec[4], rec[4]);
    this.shirt = rec[6] || null;
    this.clubId = clubId || null;

    this.line = R.lineOf(this.position);           // GK / DEF / MID / ATT
    this.group = R.groupOf(this.position);          // archetype group
    this.att = R.generate(this.name, this.position, this.overall);
    this.traits = R.deriveTraits(this.att, this.overall, this.position);

    // Live career state.
    this.morale = 70;          // 0-100
    this.fitness = 100;        // 0-100 (match sharpness / freshness)
    this.form = 0;             // -5..+5 recent-form modifier
    this.injuryDays = 0;       // days until fit
    this.injury = null;        // description string when injured

    // Contract / economics.
    this.contractYears = rec[7] != null ? rec[7] : 3; // years remaining (default 3)
    this.wage = R.weeklyWage(this.overall, this.age);     // thousands/week
    this.value = R.marketValue(this.overall, this.age, this.potential, this.contractYears); // millions

    // Season stats (reset each season).
    this.stats = freshStats();
    this.seasonHistory = [];
  }

  function freshStats() {
    return {
      apps: 0, goals: 0, assists: 0, cleanSheets: 0,
      ratingSum: 0, ratingCount: 0,
      shots: 0, tackles: 0, passesAttempted: 0, passesCompleted: 0,
      yellow: 0, red: 0, motm: 0
    };
  }

  Player.prototype.recalcEconomics = function () {
    this.wage = R.weeklyWage(this.overall, this.age);
    this.value = R.marketValue(this.overall, this.age, this.potential, this.contractYears);
  };

  Player.prototype.avgRating = function () {
    return this.stats.ratingCount ? (this.stats.ratingSum / this.stats.ratingCount) : 0;
  };
  Player.prototype.passAccuracy = function () {
    return this.stats.passesAttempted
      ? Math.round(100 * this.stats.passesCompleted / this.stats.passesAttempted) : 0;
  };

  Player.prototype.isAvailable = function () {
    return this.injuryDays <= 0;
  };

  // ---- Match-engine contributions -----------------------------------------
  // Scaled by current fitness so tired players perform worse.
  Player.prototype.attack = function () {
    return R.attackContribution(this.att, this.overall) * this._fitScale();
  };
  Player.prototype.creativity = function () {
    return R.creativityContribution(this.att, this.overall) * this._fitScale();
  };
  Player.prototype.defence = function () {
    return R.defenceContribution(this.att, this.overall) * this._fitScale();
  };
  Player.prototype.keeper = function () {
    return R.keeperRating(this.att, this.overall) * this._fitScale();
  };
  Player.prototype._fitScale = function () {
    return 0.82 + 0.18 * (this.fitness / 100) + this.form * 0.01;
  };

  // ---- Ageing / development (called once per in-game year) -----------------
  // 16-26: grows toward potential. 27-31: plateau. 32+: decline.
  Player.prototype.ageOneYear = function (devModifier) {
    this.age += 1;
    devModifier = devModifier || 1; // youth-coach / training quality multiplier
    var delta = 0;
    if (this.age <= 26) {
      var room = this.potential - this.overall;
      if (room > 0) delta = Math.max(0, Math.round((0.18 * room + 0.4) * devModifier));
    } else if (this.age <= 31) {
      delta = (Math.random() < 0.25) ? 1 : 0; // slight late bloom chance
    } else if (this.age <= 33) {
      delta = -1;
    } else if (this.age <= 35) {
      delta = -2;
    } else {
      delta = -3;
    }
    this.overall = R.clamp(this.overall + delta, 30, 99);
    // Regenerate attributes around the new overall (keeps shape via the seed).
    this.att = R.generate(this.name, this.position, this.overall);
    if (this.contractYears > 0) this.contractYears -= 0; // contract handled by calendar
    this.recalcEconomics();
    return delta;
  };

  // Should this player retire? (used by the calendar system later)
  Player.prototype.wantsToRetire = function () {
    if (this.age >= 40) return true;
    if (this.age >= 36 && this.overall < 74) return true;
    if (this.age >= 38) return Math.random() < 0.6;
    return false;
  };

  Player.prototype.resetSeasonStats = function () {
    if (this.stats.apps > 0) this.seasonHistory.push(this.stats);
    this.stats = freshStats();
  };

  // Advance recovery over a number of rest days (a league round ~ 7 days).
  // injuryRecoveryRate >1 = better physio/fitness coach (set by staff later).
  Player.prototype.advanceDay = function (days, injuryRecoveryRate) {
    days = days || 1;
    if (this.injuryDays > 0) {
      this.injuryDays -= days * (injuryRecoveryRate || 1);
      if (this.injuryDays <= 0) { this.injuryDays = 0; this.injury = null; this.fitness = Math.max(this.fitness, 75); }
    } else if (this.fitness < 100) {
      this.fitness = Math.min(100, this.fitness + 4 * days);
    }
    // Morale drifts toward neutral-positive over time.
    if (this.morale < 65) this.morale = Math.min(100, this.morale + Math.min(3, days));
  };

  G.Player = Player;
})(typeof window !== 'undefined' ? window : globalThis);
