/* ============================================================================
 * match.js  —  The match simulation engine
 * ----------------------------------------------------------------------------
 * Simulates a 90'(+stoppage) match minute by minute. Each active minute a team
 * may create a chance (weighted by attack vs the opponent's defence, tactics,
 * home advantage and fatigue); chances may become shots, shots may become goals.
 * Produces a final score, a timeline of highlight events, team stats, and
 * per-player match ratings.
 *
 * Tuning constants live at the top so match feel is easy to adjust.
 * ==========================================================================*/
(function (root) {
  root.Gaffer = root.Gaffer || {};
  var G = root.Gaffer;

  var C = {
    BASE_CHANCE: 0.160,   // per active-minute probability of a dangerous chance
    EDGE_K: 0.0042,       // how much an attack-vs-defence edge swings chance rate
    CONVERT_BASE: 0.290,  // baseline probability a chance becomes a goal
    ON_TARGET_BASE: 0.50, // baseline probability a chance is on target
    HOME_ATT: 1.1, HOME_DEF: 1.0, HOME_POSS: 0.025,
    STOPPAGE_MAX: 5
  };

  var DEFAULT_TACTICS = {
    mentality: 'balanced', // attacking | balanced | defensive
    tempo: 'normal',       // slow | normal | high
    pressing: 'normal'     // low | normal | high
  };

  function mentalityMod(t) {
    switch (t.mentality) {
      case 'attacking': return { att: 4, def: -4, chance: 0.02 };
      case 'defensive': return { att: -4, def: 5, chance: -0.03 };
      default: return { att: 0, def: 0, chance: 0 };
    }
  }
  function tempoMod(t) {
    switch (t.tempo) {
      case 'high': return { chance: 0.02, drain: 1.35 };
      case 'slow': return { chance: -0.015, drain: 0.8 };
      default: return { chance: 0, drain: 1.0 };
    }
  }

  function rnd() { return Math.random(); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Weighted random pick of a player for a given role from the XI.
  function pickWeighted(xi, weightFn) {
    var total = 0, weights = [];
    for (var i = 0; i < xi.length; i++) { var w = Math.max(0.01, weightFn(xi[i])); weights.push(w); total += w; }
    var r = rnd() * total;
    for (var j = 0; j < xi.length; j++) { r -= weights[j]; if (r <= 0) return xi[j]; }
    return xi[xi.length - 1];
  }

  function goalScorerWeight(p) {
    // Strikers/attackers score most; midfielders some; defenders rarely.
    var lineBoost = p.line === 'ATT' ? 3.0 : (p.line === 'MID' ? 1.0 : (p.line === 'DEF' ? 0.25 : 0.02));
    return lineBoost * (p.att.isGK ? 0.01 : (p.att.finishing || 50) / 50);
  }
  function assistWeight(p) {
    var lineBoost = p.line === 'MID' ? 2.4 : (p.line === 'ATT' ? 2.0 : (p.line === 'DEF' ? 0.5 : 0.02));
    return lineBoost * (p.att.isGK ? 0.01 : ((p.att.faces ? p.att.faces.pas : 50)) / 50);
  }

  function simulateMatch(home, away, opts) {
    opts = opts || {};
    var ht = Object.assign({}, DEFAULT_TACTICS, opts.homeTactics || home.tactics || {});
    var at = Object.assign({}, DEFAULT_TACTICS, opts.awayTactics || away.tactics || {});
    var weather = opts.weather || 'clear';

    var hs = home.strengths();
    var as_ = away.strengths();
    var hm = mentalityMod(ht), am = mentalityMod(at);
    var htm = tempoMod(ht), atm = tempoMod(at);

    // Effective strengths (apply home advantage, mentality, weather).
    var weatherPenalty = (weather === 'rain' || weather === 'snow') ? 3 : (weather === 'fog' ? 2 : 0);
    var hAtt = hs.attack + C.HOME_ATT + hm.att - weatherPenalty * 0.5;
    var hDef = hs.defence + C.HOME_DEF + hm.def;
    var aAtt = as_.attack + am.att - weatherPenalty * 0.5;
    var aDef = as_.defence + am.def;

    // Possession share from midfield battle + home tilt + tempo/pressing.
    var hMid = hs.midfield + (ht.pressing === 'high' ? 3 : ht.pressing === 'low' ? -2 : 0);
    var aMid = as_.midfield + (at.pressing === 'high' ? 3 : at.pressing === 'low' ? -2 : 0);
    var pHome = clamp(hMid / (hMid + aMid) + C.HOME_POSS, 0.2, 0.8);

    var state = newTeamState(home), away_s = newTeamState(away);
    var events = [];
    var hFitStart = home.lineupFitness(), aFitStart = away.lineupFitness();

    var totalMinutes = 90;
    for (var minute = 1; minute <= totalMinutes; minute++) {
      // Late-game fatigue: tired teams create/defend slightly worse.
      var fatPhase = minute > 60 ? (minute - 60) / 30 : 0;
      var hFat = 1 - fatPhase * (1 - hFitStart / 100) * 0.25 * htm.drain;
      var aFat = 1 - fatPhase * (1 - aFitStart / 100) * 0.25 * atm.drain;

      var homeActive = rnd() < pHome;
      if (homeActive) {
        tryChance(minute, true, home, away, hAtt * hFat, aDef, hs.attack, as_.keeper, hm.chance + htm.chance, state, away_s, events);
      } else {
        tryChance(minute, false, away, home, aAtt * aFat, hDef, as_.attack, hs.keeper, am.chance + atm.chance, away_s, state, events);
      }
    }

    // Stoppage time.
    var stoppage = 1 + Math.floor(rnd() * C.STOPPAGE_MAX);
    for (var s = 1; s <= stoppage; s++) {
      var mm = 90 + s;
      if (rnd() < pHome) tryChance(mm, true, home, away, hAtt, aDef, hs.attack, as_.keeper, hm.chance, state, away_s, events, true);
      else tryChance(mm, false, away, home, aAtt, hDef, as_.attack, hs.keeper, am.chance, away_s, state, events, true);
    }

    // Possession percentage (with a little noise).
    var poss = Math.round(clamp(pHome * 100 + (rnd() * 6 - 3), 25, 75));

    events.sort(function (a, b) { return a.minute - b.minute; });

    var result = {
      homeId: home.id, awayId: away.id,
      homeName: home.name, awayName: away.name,
      homeShort: home.short, awayShort: away.short,
      homeScore: state.goals, awayScore: away_s.goals,
      events: events,
      stats: {
        possessionHome: poss, possessionAway: 100 - poss,
        shotsHome: state.shots, shotsAway: away_s.shots,
        sotHome: state.sot, sotAway: away_s.sot,
        cornersHome: Math.round(state.shots * 0.4 + rnd() * 3),
        cornersAway: Math.round(away_s.shots * 0.4 + rnd() * 3)
      },
      scorersHome: state.scorers,
      scorersAway: away_s.scorers,
      weather: weather
    };

    applyMatchRatingsAndStats(home, away, state, away_s, result);
    return result;
  }

  function newTeamState(club) {
    return { goals: 0, shots: 0, sot: 0, scorers: [], xi: club.lineupPlayers(), ratings: {} };
  }

  function tryChance(minute, isHome, atkClub, defClub, atkStrength, defStrength, rawAttack, keeperRating, chanceMod, atkState, defState, events, isStoppage) {
    var edge = atkStrength - defStrength;
    var pChance = clamp(C.BASE_CHANCE + edge * C.EDGE_K + chanceMod, 0.03, 0.32);
    if (rnd() >= pChance) return;

    atkState.shots++;
    var shooter = pickWeighted(atkState.xi.filter(notGK), goalScorerWeight);

    // Shot quality from shooter finishing vs keeper + defence.
    var finishing = shooter.att.isGK ? 40 : (shooter.att.finishing || 55);
    var q = clamp(0.5 + (finishing - keeperRating) / 90 + (rnd() * 0.3 - 0.15), 0.05, 0.95);
    var onTarget = rnd() < (C.ON_TARGET_BASE + q * 0.25);

    if (!onTarget) {
      if (rnd() < 0.35) events.push(evt(minute, isHome, 'miss', shooter, null, atkClub,
        choose(['drags it wide', 'blazes over the bar', 'sees the effort deflected behind', 'curls just past the post'])));
      return;
    }
    atkState.sot++;

    var pGoal = clamp(C.CONVERT_BASE * (finishing / (keeperRating * 0.55 + defStrength * 0.45)) , 0.04, 0.7);
    if (rnd() < pGoal) {
      atkState.goals++;
      var assister = null;
      if (rnd() < 0.72) {
        var candidates = atkState.xi.filter(function (p) { return p.id !== shooter.id && notGK(p); });
        assister = pickWeighted(candidates, assistWeight);
      }
      atkState.scorers.push({ id: shooter.id, name: shooter.name, minute: minute, assist: assister ? assister.name : null });
      atkState.ratings[shooter.id] = (atkState.ratings[shooter.id] || 0) + 1.1;
      if (assister) atkState.ratings[assister.id] = (atkState.ratings[assister.id] || 0) + 0.6;
      events.push(evt(minute, isHome, 'goal', shooter, assister, atkClub,
        choose(['finds the bottom corner', 'smashes it home', 'slots it past the keeper', 'heads it in', 'fires into the roof of the net'])));
    } else {
      // Saved.
      var keeper = defState.xi.find(function (p) { return p.line === 'GK'; });
      if (keeper) defState.ratings[keeper.id] = (defState.ratings[keeper.id] || 0) + 0.25;
      if (rnd() < 0.4) events.push(evt(minute, isHome, 'save', shooter, null, atkClub,
        choose(['but the keeper gets down well to save', 'denied by a fine save', 'the keeper tips it over'])));
    }
  }

  function notGK(p) { return p.line !== 'GK'; }
  function choose(arr) { return arr[Math.floor(rnd() * arr.length)]; }

  function evt(minute, isHome, type, player, assister, club, phrase) {
    var text;
    if (type === 'goal') {
      text = "GOAL! " + club.short + " — " + player.name + " " + phrase +
             (assister ? " (assist: " + assister.name + ")" : "") + ".";
    } else if (type === 'miss') {
      text = "Chance for " + club.short + "! " + player.name + " " + phrase + ".";
    } else if (type === 'save') {
      text = club.short + " threaten — " + player.name + ", " + phrase + ".";
    } else {
      text = player.name + " — " + phrase + ".";
    }
    return {
      minute: minute, type: type, side: isHome ? 'home' : 'away',
      playerId: player.id, playerName: player.name,
      assistName: assister ? assister.name : null, text: text
    };
  }

  // ---- Post-match: player ratings, fitness drain, stat accrual ------------
  function applyMatchRatingsAndStats(home, away, hState, aState, result) {
    process(home, hState, aState.goals, hState.goals, result, true);
    process(away, aState, hState.goals, aState.goals, result, false);

    function process(club, st, concededByMe, scoredByMe, res, isHome) {
      var xi = st.xi;
      var teamResultMod = scoredByMe > concededByMe ? 0.4 : (scoredByMe < concededByMe ? -0.4 : 0);
      var best = null, bestR = -1;
      xi.forEach(function (p) {
        var base = 6.3 + (rnd() * 0.8 - 0.4) + teamResultMod;
        base += (st.ratings[p.id] || 0);
        if (p.line === 'GK') {
          base += (concededByMe === 0 ? 0.6 : -0.15 * concededByMe);
        } else if (p.line === 'DEF') {
          base += (concededByMe === 0 ? 0.35 : -0.12 * concededByMe);
        }
        var rating = clamp(base, 4.0, 10.0);
        // Accrue season stats.
        p.stats.apps++;
        p.stats.ratingSum += rating; p.stats.ratingCount++;
        var goalsThis = st.scorers.filter(function (s) { return s.id === p.id; }).length;
        var assistsThis = st.scorers.filter(function (s) { return s.assist === p.name; }).length;
        p.stats.goals += goalsThis;
        p.stats.assists += assistsThis;
        if (p.line === 'GK' && concededByMe === 0) p.stats.cleanSheets++;
        if (p.line === 'DEF' && concededByMe === 0) p.stats.cleanSheets++;
        // Plausible secondary stats.
        var passes = Math.round(20 + (p.att.isGK ? 10 : (p.att.faces ? p.att.faces.pas : 50)) * 0.6 + rnd() * 15);
        var acc = clamp((p.att.isGK ? 0.7 : ((p.att.faces ? p.att.faces.pas : 50) / 100) + 0.2) + (rnd() * 0.1 - 0.05), 0.5, 0.97);
        p.stats.passesAttempted += passes;
        p.stats.passesCompleted += Math.round(passes * acc);
        p.stats.shots += goalsThis + (st.shots > 0 && p.line === 'ATT' && rnd() < 0.5 ? 1 : 0);
        if (p.line !== 'ATT') p.stats.tackles += Math.round(rnd() * 4);

        // Fitness drain for playing 90'.
        p.fitness = clamp(p.fitness - (16 + rnd() * 10), 20, 100);
        // Small form/morale nudge.
        if (rating >= 7.5) { p.form = Math.min(5, p.form + 1); p.morale = Math.min(100, p.morale + 2); }
        else if (rating < 6.0) { p.form = Math.max(-5, p.form - 1); }

        res['rating_' + p.id] = Math.round(rating * 10) / 10;
        if (rating > bestR) { bestR = rating; best = p; }
      });
      if (best) { best.stats.motm++; if (isHome) res.motmHome = best.name; else res.motmAway = best.name; }
    }
  }

  G.Match = { simulate: simulateMatch, CONSTANTS: C, DEFAULT_TACTICS: DEFAULT_TACTICS };
})(typeof window !== 'undefined' ? window : globalThis);
