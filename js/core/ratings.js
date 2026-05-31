/* ============================================================================
 * ratings.js  —  The attribute & rating engine
 * ----------------------------------------------------------------------------
 * Every player in the data files is stored compactly as:
 *     [name, position, age, nationality, overall, potential]
 *
 * This module deterministically expands that into the full set of ~30 detailed
 * attributes (pace, finishing, vision, tackling, ...) using position-based
 * "archetype" profiles. Because generation is seeded by the player's name, the
 * same player ALWAYS gets the same attributes — so we never have to store all
 * 30 numbers per player, and saves stay tiny.
 *
 * It also derives: position-weighted OVR, market value, weekly wage, and traits.
 * ==========================================================================*/
(function (root) {
  root.Gaffer = root.Gaffer || {};
  var G = root.Gaffer;
  var R = {};

  // ---- Deterministic RNG ---------------------------------------------------
  // mulberry32: tiny, fast, seedable PRNG so attribute generation is repeatable.
  function hashString(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }
  R.clamp = clamp;

  // ---- Position groups -----------------------------------------------------
  // Detailed positions collapse into archetype groups that share a profile.
  var GROUP = {
    GK: 'GK',
    RB: 'FB', LB: 'FB', RWB: 'FB', LWB: 'FB',
    CB: 'CB', RCB: 'CB', LCB: 'CB',
    CDM: 'DM',
    CM: 'CM', RCM: 'CM', LCM: 'CM',
    RM: 'WM', LM: 'WM',
    CAM: 'AM', CF: 'AM',
    RW: 'W', LW: 'W',
    ST: 'ST'
  };
  R.groupOf = function (pos) { return GROUP[pos] || 'CM'; };

  // Broad lines used by tactics / squad screens.
  R.lineOf = function (pos) {
    var g = R.groupOf(pos);
    if (g === 'GK') return 'GK';
    if (g === 'CB' || g === 'FB') return 'DEF';
    if (g === 'DM' || g === 'CM' || g === 'WM') return 'MID';
    return 'ATT'; // AM, W, ST
  };

  // The six "face" stats (FIFA-style) used for OVR + the match engine.
  var FACES = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];

  // Per-group: how each face sits relative to the player's overall, and how
  // much each face contributes to the position-weighted OVR.
  var PROFILE = {
    CB: { off: { pac: -6, sho: -28, pas: -8, dri: -12, def: 7, phy: 6 },
          w:   { pac: .10, sho: .04, pas: .12, dri: .10, def: .42, phy: .22 } },
    FB: { off: { pac: 6, sho: -14, pas: 0, dri: 1, def: 2, phy: -1 },
          w:   { pac: .20, sho: .05, pas: .18, dri: .17, def: .25, phy: .15 } },
    DM: { off: { pac: -4, sho: -10, pas: 2, dri: -2, def: 6, phy: 5 },
          w:   { pac: .09, sho: .05, pas: .22, dri: .14, def: .30, phy: .20 } },
    CM: { off: { pac: -2, sho: -3, pas: 6, dri: 3, def: 0, phy: 0 },
          w:   { pac: .08, sho: .12, pas: .28, dri: .22, def: .16, phy: .14 } },
    WM: { off: { pac: 7, sho: -2, pas: 1, dri: 6, def: -8, phy: -6 },
          w:   { pac: .22, sho: .14, pas: .20, dri: .26, def: .10, phy: .08 } },
    AM: { off: { pac: 1, sho: 3, pas: 5, dri: 6, def: -12, phy: -5 },
          w:   { pac: .14, sho: .22, pas: .24, dri: .25, def: .06, phy: .09 } },
    W:  { off: { pac: 8, sho: 1, pas: 0, dri: 7, def: -11, phy: -7 },
          w:   { pac: .22, sho: .20, pas: .18, dri: .26, def: .06, phy: .08 } },
    ST: { off: { pac: 4, sho: 7, pas: -6, dri: 2, def: -22, phy: 2 },
          w:   { pac: .18, sho: .34, pas: .10, dri: .20, def: .04, phy: .14 } }
  };

  // GK is its own world.
  var GK_W = { diving: .21, handling: .21, kicking: .11, reflexes: .21, speed: .05, positioning: .21 };

  // ---- OVR calculator (derives overall from the face stats) ----------------
  R.calculateOutfieldOVR = function (faces, group) {
    var w = (PROFILE[group] || PROFILE.CM).w;
    var sum = 0;
    for (var i = 0; i < FACES.length; i++) sum += faces[FACES[i]] * w[FACES[i]];
    return Math.round(sum);
  };
  R.calculateGkOVR = function (gk) {
    var sum = 0;
    for (var k in GK_W) sum += gk[k] * GK_W[k];
    return Math.round(sum);
  };

  // ---- Attribute generation ------------------------------------------------
  function genGK(ovr, rng) {
    var gk = {
      diving: ovr + (rng() * 6 - 3),
      handling: ovr + (rng() * 6 - 4),
      kicking: ovr + (rng() * 10 - 8),
      reflexes: ovr + (rng() * 6 - 3),
      speed: ovr - 22 + (rng() * 8),
      positioning: ovr + (rng() * 6 - 3)
    };
    // Shift so the weighted OVR lands exactly on the authored value.
    var delta = ovr - R.calculateGkOVR(gk);
    for (var k in gk) gk[k] = clamp(gk[k] + delta, 20, 99);
    return gk;
  }

  function genOutfield(ovr, group, rng) {
    var p = PROFILE[group] || PROFILE.CM;
    var faces = {};
    FACES.forEach(function (f) { faces[f] = ovr + p.off[f] + (rng() * 6 - 3); });
    // Normalise so derived OVR == authored OVR.
    var delta = ovr - R.calculateOutfieldOVR(faces, group);
    FACES.forEach(function (f) { faces[f] = clamp(faces[f] + delta, 20, 99); });

    function around(base, spread) { return clamp(base + (rng() * spread * 2 - spread), 10, 99); }
    var a = {
      faces: faces,
      // Pace
      acceleration: around(faces.pac, 4),
      sprintSpeed: around(faces.pac, 4),
      // Shooting
      finishing: around(faces.sho + 2, 5),
      shotPower: around(faces.sho, 6),
      longShots: around(faces.sho - 2, 7),
      volleys: around(faces.sho - 4, 8),
      penalties: around(faces.sho - 1, 7),
      positioning: around(faces.sho, 6),
      // Passing
      shortPass: around(faces.pas + 2, 4),
      longPass: around(faces.pas - 1, 6),
      vision: around(faces.pas, 6),
      crossing: around(faces.pas - 2, 7),
      curve: around(faces.pas - 2, 8),
      // Dribbling
      dribbling: around(faces.dri + 1, 4),
      ballControl: around(faces.dri + 1, 4),
      agility: around(faces.dri, 6),
      balance: around(faces.dri, 7),
      reactions: around(ovr, 5),
      composure: around(ovr, 6),
      // Defending
      defAwareness: around(faces.def, 5),
      standingTackle: around(faces.def, 5),
      slidingTackle: around(faces.def - 3, 7),
      interceptions: around(faces.def, 6),
      heading: around((faces.def + faces.phy) / 2, 8),
      // Physical
      strength: around(faces.phy, 6),
      stamina: around(faces.phy + 3, 6),
      jumping: around(faces.phy, 8),
      aggression: around(faces.phy - 2, 10)
    };
    return a;
  }

  // Public: expand a compact player record into full attributes (deterministic).
  R.generate = function (name, position, ovr) {
    var rng = mulberry32(hashString(name + '#' + position));
    var group = R.groupOf(position);
    if (group === 'GK') {
      return { isGK: true, group: 'GK', gk: genGK(ovr, rng) };
    }
    var att = genOutfield(ovr, group, rng);
    att.isGK = false;
    att.group = group;
    return att;
  };

  // ---- Match-engine rating shortcuts --------------------------------------
  // These aggregate the detailed attributes into the handful of numbers the
  // simulation actually cares about, by line.
  R.attackContribution = function (att, ovr) {
    if (att.isGK) return ovr * 0.1;
    var f = att.faces;
    return (f.sho * 0.45 + f.dri * 0.30 + f.pac * 0.25);
  };
  R.creativityContribution = function (att, ovr) {
    if (att.isGK) return att.gk.kicking * 0.3;
    var f = att.faces;
    return (f.pas * 0.55 + f.dri * 0.30 + f.pac * 0.15);
  };
  R.defenceContribution = function (att, ovr) {
    if (att.isGK) return ovr; // handled separately as keeper
    var f = att.faces;
    return (f.def * 0.6 + f.phy * 0.25 + f.pac * 0.15);
  };
  R.keeperRating = function (att, ovr) {
    if (!att.isGK) return Math.max(30, ovr - 25);
    var gk = att.gk;
    return (gk.reflexes * 0.3 + gk.diving * 0.3 + gk.positioning * 0.25 + gk.handling * 0.15);
  };

  // ---- Economics -----------------------------------------------------------
  // Market value (in millions of currency units). Driven by OVR (steep),
  // age (peak ~24-27), potential headroom, and contract length.
  R.marketValue = function (ovr, age, potential, contractYears) {
    // Base curve: cheap squad players, very expensive elite (steep).
    var base = Math.pow(Math.max(0, ovr - 50) / 10, 4.3) * 0.205; // millions
    // Age factor: young & prime worth more, sharp drop after 31.
    var ageF;
    if (age <= 21) ageF = 1.35;
    else if (age <= 27) ageF = 1.15;
    else if (age <= 30) ageF = 0.9;
    else if (age <= 32) ageF = 0.6;
    else if (age <= 34) ageF = 0.35;
    else ageF = 0.18;
    // Potential headroom adds value for the young.
    var potF = 1 + Math.max(0, (potential - ovr)) * (age < 24 ? 0.035 : 0.015);
    // Contract: short contracts are cheaper (leverage).
    var conF = 0.7 + Math.min(4, contractYears || 2) * 0.1;
    var val = base * ageF * potF * conF;
    // Round to a sensible figure.
    if (val >= 50) return Math.round(val);
    if (val >= 10) return Math.round(val * 2) / 2;
    if (val >= 1) return Math.round(val * 10) / 10;
    return Math.max(0.05, Math.round(val * 20) / 20);
  };

  // Weekly wage (in thousands). Rough mapping from OVR with an age premium.
  R.weeklyWage = function (ovr, age) {
    var base = Math.pow(Math.max(0, ovr - 50) / 8, 2.7) * 1.4; // thousands/week
    var ageF = (age >= 24 && age <= 31) ? 1.15 : (age < 21 ? 0.7 : 1.0);
    var w = base * ageF;
    if (w >= 100) return Math.round(w / 5) * 5;
    if (w >= 10) return Math.round(w);
    return Math.max(1, Math.round(w));
  };

  // ---- Traits --------------------------------------------------------------
  R.deriveTraits = function (att, ovr, position) {
    if (att.isGK) {
      var t = [];
      if (att.gk.reflexes >= 85) t.push('Shot Stopper');
      if (att.gk.kicking >= 80) t.push('Sweeper Keeper');
      if (ovr >= 86) t.push('Leadership');
      return t;
    }
    var f = att.faces, traits = [];
    if (att.longShots >= 87) traits.push('Long Shot Taker');
    if (f.dri >= 88) traits.push('Flair');
    if (f.pac >= 92) traits.push('Speedster');
    if (att.finishing >= 90) traits.push('Clinical Finisher');
    if (f.pas >= 88 && att.vision >= 88) traits.push('Playmaker');
    if (att.aggression >= 86 && f.def >= 82) traits.push('Aggressive');
    if (att.crossing >= 88) traits.push('Crosser');
    if (att.heading >= 86 && f.phy >= 82) traits.push('Aerial Threat');
    if (ovr >= 88) traits.unshift('Leadership'); // elite players carry the team
    return traits.slice(0, 3);
  };

  G.Ratings = R;
})(typeof window !== 'undefined' ? window : globalThis);
