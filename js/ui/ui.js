/* ============================================================================
 * ui.js  —  Screens, navigation, theming, rendering
 * ----------------------------------------------------------------------------
 * Vanilla DOM rendering (no framework, classic scripts so it runs from file://).
 * Builds: Main Menu, Club Selection, and the in-club shell with Squad, Tactics,
 * Match Day, League Table and Stats views. Recolors the whole UI to the chosen
 * club via CSS variables, and reveals match highlights sequentially.
 *
 * Design system: Dark Mode (OLED) + Fira Sans/Code + club-color accent.
 * ==========================================================================*/
(function (root) {
  root.Gaffer = root.Gaffer || {};
  var G = root.Gaffer;
  var Game = G.Game;

  var UI = { state: { view: 'squad' } };
  var APP;

  // ---- Color utilities -----------------------------------------------------
  var Color = {
    rgb: function (hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
      return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
    },
    lum: function (hex) {
      var c = Color.rgb(hex);
      var a = [c.r, c.g, c.b].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    },
    mix: function (hex, withHex, t) {
      var a = Color.rgb(hex), b = Color.rgb(withHex);
      var r = Math.round(a.r + (b.r - a.r) * t), g = Math.round(a.g + (b.g - a.g) * t), bl = Math.round(a.b + (b.b - a.b) * t);
      return '#' + [r, g, bl].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
    },
    // An accent guaranteed to be visible on a near-black background.
    accentFor: function (hex) {
      var l = Color.lum(hex);
      if (l < 0.12) return Color.mix(hex, '#ffffff', 0.55);
      if (l < 0.20) return Color.mix(hex, '#ffffff', 0.30);
      return hex;
    }
  };

  UI.applyTheme = function (club) {
    var accent = Color.accentFor(club.colors.primary);
    var sec = Color.accentFor(club.colors.secondary || '#ffffff');
    var r = document.documentElement.style;
    r.setProperty('--club', accent);
    r.setProperty('--club-2', sec);
    r.setProperty('--club-soft', Color.mix(accent, '#0a0c10', 0.78));
    r.setProperty('--club-glow', Color.mix(accent, '#0a0c10', 0.62));
    r.setProperty('--club-ink', Color.lum(accent) > 0.5 ? '#0a0c10' : '#ffffff');
  };

  // ---- SVG crest + icons ---------------------------------------------------
  UI.crest = function (club, size) {
    size = size || 40;
    var p = club.colors.primary, s = club.colors.secondary || '#ffffff';
    return '<svg class="crest" width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true">' +
      '<path d="M24 2 L44 9 V26 C44 38 35 44 24 47 C13 44 4 38 4 26 V9 Z" fill="' + p + '" stroke="' + s + '" stroke-width="2"/>' +
      '<path d="M24 2 L44 9 V26 C44 38 35 44 24 47 C13 44 4 38 4 26 V9 Z" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="1"/>' +
      '<text x="24" y="29" text-anchor="middle" font-family="Fira Code, monospace" font-size="13" font-weight="700" fill="' +
      (Color.lum(p) > 0.55 ? '#0a0c10' : '#ffffff') + '">' + club.short + '</text></svg>';
  };

  var ICONS = {
    squad: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    tactics: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    match: '<circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/>',
    table: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    stats: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    whistle: '<circle cx="12" cy="12" r="9"/><path d="M12 3v4M8 12h8"/>'
  };
  UI.icon = function (name, size) {
    size = size || 18;
    return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  };

  // ---- Small format helpers ------------------------------------------------
  function money(m) { // millions
    if (m >= 1000) return '€' + (m / 1000).toFixed(2) + 'bn';
    if (m >= 1) return '€' + (Math.round(m * 10) / 10) + 'M';
    return '€' + Math.round(m * 1000) + 'k';
  }
  function wage(k) { return '€' + (k >= 1000 ? (k / 1000).toFixed(0) + 'M' : k + 'k') + '/wk'; }
  function ovrClass(o) { return o >= 85 ? 'elite' : o >= 78 ? 'good' : o >= 70 ? 'ok' : 'low'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function flag(nat) { return '<span class="nat" title="' + nat + '">' + nat + '</span>'; }
  UI.money = money;

  // ---- Mount / events ------------------------------------------------------
  UI.boot = function () {
    APP = document.getElementById('app');
    document.addEventListener('click', UI.onClick);
    document.addEventListener('change', UI.onChange);
    UI.renderMenu();
  };

  UI.onClick = function (e) {
    var t = e.target.closest('[data-action]');
    if (!t) return;
    var action = t.getAttribute('data-action');
    var arg = t.getAttribute('data-arg');
    switch (action) {
      case 'new-game': UI.renderClubSelect(); break;
      case 'continue': if (Game.loadFromSlot('auto')) { UI.applyTheme(Game.managerClub()); UI.enterClub(); } break;
      case 'select-club': Game.startNewGame(arg); UI.applyTheme(Game.managerClub()); UI.enterClub(); break;
      case 'view': UI.showView(arg); break;
      case 'play-match': UI.playMatch(); break;
      case 'set-formation': Game.managerClub().pickBestXI(arg); UI.showView('tactics'); break;
      case 'open-player': UI.openPlayer(arg); break;
      case 'close-modal': UI.closeModal(); break;
      case 'skip-reveal': UI.revealAll && UI.revealAll(); break;
      case 'continue-after-match': UI.closeModal(); UI.showView('matchday'); break;
      case 'save-game': Game.saveToSlot('slot1'); UI.toast('Game saved'); break;
      case 'back-to-menu': UI.renderMenu(); break;
    }
  };
  UI.onChange = function (e) {
    var t = e.target;
    if (t.getAttribute('data-change') === 'formation') { Game.managerClub().pickBestXI(t.value); UI.showView('tactics'); }
    if (t.getAttribute('data-change') === 'tactic') {
      var club = Game.managerClub();
      club.tactics[t.getAttribute('data-key')] = t.value;
    }
    if (t.getAttribute('data-change') === 'squad-sort') { UI.state.squadSort = t.value; UI.showView('squad'); }
  };

  // ---- Main Menu -----------------------------------------------------------
  UI.renderMenu = function () {
    document.documentElement.style.setProperty('--club', '#4f8ff7');
    document.documentElement.style.setProperty('--club-glow', '#16243d');
    var hasAuto = G.Save.has('auto');
    var meta = hasAuto ? (G.Save.load('auto').meta || {}) : {};
    APP.className = 'menu-screen';
    APP.innerHTML =
      '<div class="menu-bg"><div class="menu-stadium"></div><div class="menu-rain"></div></div>' +
      '<div class="menu-inner">' +
        '<div class="brand"><div class="brand-mark">' + UI.icon('trophy', 30) + '</div>' +
          '<h1 class="brand-title">GAFFER</h1>' +
          '<p class="brand-sub">Football Management — 2025/26</p></div>' +
        '<div class="menu-actions">' +
          (hasAuto ? '<button class="btn btn-primary btn-lg" data-action="continue">' + UI.icon('play') +
            ' Continue<span class="btn-meta">' + esc(meta.clubName || '') + ' · ' + (meta.season || '') + '</span></button>' : '') +
          '<button class="btn ' + (hasAuto ? 'btn-secondary' : 'btn-primary') + ' btn-lg" data-action="new-game">' + UI.icon('whistle') + ' New Career</button>' +
        '</div>' +
        '<p class="menu-foot">A management sim · Premier League · more leagues coming</p>' +
      '</div>';
  };

  // ---- Club Selection ------------------------------------------------------
  UI.renderClubSelect = function () {
    var clubs = Game.world ? Game.world.list : null;
    if (!clubs) { Game.buildWorld(); clubs = Game.world.list; }
    var eng = clubs.filter(function (c) { return c.league === 'eng'; })
      .sort(function (a, b) { return b.reputation - a.reputation; });
    APP.className = 'select-screen';
    var cards = eng.map(function (c) {
      var accent = Color.accentFor(c.colors.primary);
      return '<button class="club-card" data-action="select-club" data-arg="' + c.id + '" ' +
        'style="--ca:' + accent + ';--cg:' + Color.mix(accent, '#0a0c10', 0.7) + '">' +
        '<div class="club-card-top">' + UI.crest(c, 44) +
          '<div class="club-card-rep">' + starRating(c.reputation) + '</div></div>' +
        '<div class="club-card-name">' + esc(c.name) + '</div>' +
        '<div class="club-card-meta">' +
          '<span>OVR ' + c.squadOVR() + '</span><span>' + money(c.transferBudget) + '</span></div>' +
        '<div class="club-card-stadium">' + esc(c.stadium) + ' · ' + c.capacity.toLocaleString() + '</div>' +
        '</button>';
    }).join('');
    APP.innerHTML =
      '<header class="select-head"><button class="btn btn-ghost" data-action="back-to-menu">‹ Menu</button>' +
        '<h2>Choose your club</h2><p>Premier League 2025/26 — pick who you’ll manage.</p></header>' +
      '<div class="club-grid">' + cards + '</div>';
  };

  function starRating(rep) {
    var stars = Math.round((rep - 55) / 9); // ~0-5
    stars = Math.max(1, Math.min(5, stars));
    var out = '';
    for (var i = 0; i < 5; i++) out += '<span class="star ' + (i < stars ? 'on' : '') + '">★</span>';
    return out;
  }

  // ---- In-club shell -------------------------------------------------------
  UI.enterClub = function () {
    var club = Game.managerClub();
    APP.className = 'app-shell';
    var nav = [
      ['matchday', 'Match Day', 'match'], ['squad', 'Squad', 'squad'],
      ['tactics', 'Tactics', 'tactics'], ['table', 'Table', 'table'], ['stats', 'Stats', 'stats']
    ].map(function (n) {
      return '<button class="nav-item" data-action="view" data-arg="' + n[0] + '" data-nav="' + n[0] + '">' +
        UI.icon(n[2]) + '<span>' + n[1] + '</span></button>';
    }).join('');
    APP.innerHTML =
      '<aside class="sidebar">' +
        '<div class="sidebar-club">' + UI.crest(club, 46) +
          '<div><div class="sidebar-club-name">' + esc(club.name) + '</div>' +
          '<div class="sidebar-club-sub">' + esc(club.stadium) + '</div></div></div>' +
        '<nav class="nav">' + nav + '</nav>' +
        '<div class="sidebar-foot">' +
          '<button class="nav-item" data-action="save-game">' + UI.icon('save') + '<span>Save</span></button>' +
          '<button class="nav-item" data-action="back-to-menu">' + UI.icon('home') + '<span>Main Menu</span></button>' +
        '</div>' +
      '</aside>' +
      '<main class="content"><header class="topbar" id="topbar"></header><div class="view" id="view"></div></main>';
    UI.showView('matchday');
  };

  UI.renderTopbar = function () {
    var club = Game.managerClub();
    var pos = Game.managerPosition();
    var bar = document.getElementById('topbar');
    if (!bar) return;
    var nf = Game.opponentInfo();
    bar.innerHTML =
      '<div class="tb-left"><span class="tb-season">' + Game.season + '</span>' +
        '<span class="tb-pos">League pos <b>' + (pos ? ordinal(pos) : '—') + '</b></span></div>' +
      '<div class="tb-right">' +
        '<div class="tb-stat"><span>Transfer</span><b>' + money(club.transferBudget) + '</b></div>' +
        '<div class="tb-stat"><span>Wages</span><b>€' + Math.round(club.wageBillWeekly()) + 'k/wk</b></div>' +
        (nf ? '<div class="tb-next">' + (nf.isHome ? 'vs ' : '@ ') + nf.opponent.short + '</div>' : '<div class="tb-next">Season over</div>') +
      '</div>';
  };

  UI.showView = function (name) {
    UI.state.view = name;
    var v = document.getElementById('view');
    if (!v) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (n) {
      n.classList.toggle('active', n.getAttribute('data-nav') === name);
    });
    UI.renderTopbar();
    if (name === 'squad') v.innerHTML = UI.viewSquad();
    else if (name === 'tactics') v.innerHTML = UI.viewTactics();
    else if (name === 'matchday') v.innerHTML = UI.viewMatchday();
    else if (name === 'table') v.innerHTML = UI.viewTable();
    else if (name === 'stats') v.innerHTML = UI.viewStats();
    v.scrollTop = 0;
  };

  // ---- Squad view ----------------------------------------------------------
  UI.viewSquad = function () {
    var club = Game.managerClub();
    var sort = UI.state.squadSort || 'overall';
    var lineOrder = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
    var players = club.players.slice().sort(function (a, b) {
      if (sort === 'overall') return b.overall - a.overall;
      if (sort === 'value') return b.value - a.value;
      if (sort === 'age') return a.age - b.age;
      if (sort === 'position') return (lineOrder[a.line] - lineOrder[b.line]) || (b.overall - a.overall);
      return 0;
    });
    var rows = players.map(function (p) {
      var inj = p.injuryDays > 0 ? '<span class="inj" title="' + esc(p.injury || 'Injured') + '">+' + p.injuryDays + 'd</span>' : '';
      return '<tr class="prow" data-action="open-player" data-arg="' + p.id + '">' +
        '<td class="c-num">' + (p.shirt || '') + '</td>' +
        '<td class="c-pos"><span class="pos pos-' + p.line + '">' + p.position + '</span></td>' +
        '<td class="c-name">' + esc(p.name) + ' ' + inj + (club.captainId === p.id ? '<span class="cap">C</span>' : '') + '</td>' +
        '<td class="c-nat">' + flag(p.nationality) + '</td>' +
        '<td class="c-age">' + p.age + '</td>' +
        '<td class="c-ovr"><span class="ovr ' + ovrClass(p.overall) + '">' + p.overall + '</span></td>' +
        '<td class="c-pot">' + p.potential + '</td>' +
        '<td class="c-fit">' + fitBar(p.fitness) + '</td>' +
        '<td class="c-val">' + money(p.value) + '</td>' +
        '<td class="c-wage">' + wage(p.wage) + '</td></tr>';
    }).join('');
    return '<div class="view-head"><h2>Squad</h2>' +
      '<div class="view-tools"><label class="lbl">Sort' +
      '<select data-change="squad-sort"><option value="overall"' + sel(sort, 'overall') + '>Rating</option>' +
      '<option value="position"' + sel(sort, 'position') + '>Position</option>' +
      '<option value="age"' + sel(sort, 'age') + '>Age</option>' +
      '<option value="value"' + sel(sort, 'value') + '>Value</option></select></label>' +
      '<span class="pill">Squad OVR ' + club.squadOVR() + '</span><span class="pill">' + club.players.length + ' players</span></div></div>' +
      '<div class="table-wrap"><table class="data-table squad-table"><thead><tr>' +
      '<th>#</th><th>Pos</th><th>Name</th><th>Nat</th><th>Age</th><th>OVR</th><th>POT</th><th>Fitness</th><th>Value</th><th>Wage</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  };
  function sel(a, b) { return a === b ? ' selected' : ''; }
  function fitBar(f) {
    var cls = f >= 85 ? 'hi' : f >= 60 ? 'mid' : 'lo';
    return '<span class="bar"><span class="bar-fill ' + cls + '" style="width:' + Math.round(f) + '%"></span></span>';
  }

  // ---- Player profile (modal) ---------------------------------------------
  UI.openPlayer = function (id) {
    var club = Game.managerClub();
    var p = club.getPlayer(id);
    if (!p) return;
    var faces = p.att.isGK
      ? [['DIV', p.att.gk.diving], ['HAN', p.att.gk.handling], ['KIC', p.att.gk.kicking], ['REF', p.att.gk.reflexes], ['SPD', p.att.gk.speed], ['POS', p.att.gk.positioning]]
      : [['PAC', p.att.faces.pac], ['SHO', p.att.faces.sho], ['PAS', p.att.faces.pas], ['DRI', p.att.faces.dri], ['DEF', p.att.faces.def], ['PHY', p.att.faces.phy]];
    var faceHtml = faces.map(function (f) {
      return '<div class="face"><span class="face-v ' + ovrClass(f[1]) + '">' + Math.round(f[1]) + '</span><span class="face-k">' + f[0] + '</span></div>';
    }).join('');
    var traits = p.traits.length ? p.traits.map(function (t) { return '<span class="trait">' + t + '</span>'; }).join('') : '<span class="muted">No special traits</span>';
    var st = p.stats;
    UI.modal(
      '<div class="player-modal">' +
        '<div class="pm-head" style="background:linear-gradient(135deg,var(--club-glow),transparent)">' +
          '<div class="pm-ovr"><span class="ovr-big ' + ovrClass(p.overall) + '">' + p.overall + '</span><span>OVR</span></div>' +
          '<div class="pm-id"><h3>' + esc(p.name) + '</h3>' +
            '<div class="pm-sub">' + p.position + ' · ' + flag(p.nationality) + ' · ' + p.age + ' yrs · #' + (p.shirt || '-') + '</div>' +
            '<div class="pm-sub2">Potential <b>' + p.potential + '</b> · Value <b>' + money(p.value) + '</b> · ' + wage(p.wage) + ' · ' + p.contractYears + 'y left</div>' +
          '</div>' +
          '<button class="modal-x" data-action="close-modal" aria-label="Close">✕</button>' +
        '</div>' +
        '<div class="pm-faces">' + faceHtml + '</div>' +
        '<div class="pm-section"><h4>Condition</h4><div class="pm-grid">' +
          kv('Fitness', Math.round(p.fitness) + '%') + kv('Morale', Math.round(p.morale) + '%') +
          kv('Form', (p.form > 0 ? '+' : '') + p.form) + kv('Status', p.injuryDays > 0 ? esc(p.injury) + ' (' + p.injuryDays + 'd)' : 'Available') +
        '</div></div>' +
        '<div class="pm-section"><h4>Traits</h4><div class="traits">' + traits + '</div></div>' +
        '<div class="pm-section"><h4>This season</h4><div class="pm-grid">' +
          kv('Apps', st.apps) + kv('Goals', st.goals) + kv('Assists', st.assists) +
          kv('Avg rating', st.ratingCount ? p.avgRating().toFixed(2) : '—') +
          kv('Pass %', st.passesAttempted ? p.passAccuracy() + '%' : '—') + kv('Clean sheets', st.cleanSheets) +
        '</div></div>' +
      '</div>'
    );
  };
  function kv(k, v) { return '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>'; }

  // ---- Tactics view --------------------------------------------------------
  UI.viewTactics = function () {
    var club = Game.managerClub();
    var t = club.tactics;
    var formations = Object.keys(G.FORMATIONS).map(function (f) {
      return '<option value="' + f + '"' + sel(club.formation, f) + '>' + f + '</option>';
    }).join('');
    return '<div class="view-head"><h2>Tactics</h2>' +
      '<div class="view-tools"><label class="lbl">Formation<select data-change="formation">' + formations + '</select></label></div></div>' +
      '<div class="tactics-grid">' +
        '<div class="pitch-card">' + UI.pitch(club) + '</div>' +
        '<div class="tactic-controls">' +
          tacticSelect('Mentality', 'mentality', t.mentality, [['defensive', 'Defensive'], ['balanced', 'Balanced'], ['attacking', 'Attacking']]) +
          tacticSelect('Tempo', 'tempo', t.tempo, [['slow', 'Slow'], ['normal', 'Normal'], ['high', 'High']]) +
          tacticSelect('Pressing', 'pressing', t.pressing, [['low', 'Low block'], ['normal', 'Normal'], ['high', 'High press']]) +
          '<p class="hint">Tactics affect chance creation, possession and late-game fatigue. They apply to every match until you change them.</p>' +
        '</div>' +
      '</div>';
  };
  function tacticSelect(label, key, val, opts) {
    return '<label class="lbl block">' + label + '<select data-change="tactic" data-key="' + key + '">' +
      opts.map(function (o) { return '<option value="' + o[0] + '"' + sel(val, o[0]) + '>' + o[1] + '</option>'; }).join('') +
      '</select></label>';
  }

  UI.pitch = function (club) {
    var xi = club.lineupPlayers();
    var lines = { GK: [], DEF: [], MID: [], ATT: [] };
    xi.forEach(function (p) { lines[p.line].push(p); });
    function row(arr, cls) {
      return '<div class="pitch-row ' + cls + '">' + arr.map(function (p) {
        return '<button class="chip" data-action="open-player" data-arg="' + p.id + '">' +
          '<span class="chip-ovr ' + ovrClass(p.overall) + '">' + p.overall + '</span>' +
          '<span class="chip-name">' + esc(lastName(p.name)) + '</span></button>';
      }).join('') + '</div>';
    }
    return '<div class="pitch">' + row(lines.ATT, 'r-att') + row(lines.MID, 'r-mid') + row(lines.DEF, 'r-def') + row(lines.GK, 'r-gk') + '</div>';
  };
  function lastName(n) { var parts = n.split(' '); return parts.length > 1 ? parts.slice(1).join(' ') : n; }

  // ---- Match Day view ------------------------------------------------------
  UI.viewMatchday = function () {
    var club = Game.managerClub();
    var info = Game.opponentInfo();
    if (!info) {
      return '<div class="view-head"><h2>Season Complete</h2></div>' +
        '<div class="empty-card"><p>The ' + Game.season + ' league season is over. Final table is in the Table tab.</p></div>';
    }
    var opp = info.opponent;
    var venue = info.isHome ? club : opp;
    var avgFit = Math.round(club.lineupFitness());
    return '<div class="view-head"><h2>Match Day</h2><span class="pill">Round ' + info.round + '</span></div>' +
      '<div class="md-fixture" style="background:linear-gradient(135deg,var(--club-glow),#0c0f15)">' +
        '<div class="md-team"><div class="md-crest">' + UI.crest(info.isHome ? club : opp, 64) + '</div>' +
          '<div class="md-team-name">' + esc((info.isHome ? club : opp).name) + '</div>' +
          '<div class="md-team-ovr">OVR ' + (info.isHome ? club : opp).squadOVR() + '</div></div>' +
        '<div class="md-vs"><span>' + (info.isHome ? 'HOME' : 'AWAY') + '</span><div class="md-vs-x">VS</div>' +
          '<span class="md-venue">' + esc(venue.stadium) + '</span></div>' +
        '<div class="md-team"><div class="md-crest">' + UI.crest(info.isHome ? opp : club, 64) + '</div>' +
          '<div class="md-team-name">' + esc((info.isHome ? opp : club).name) + '</div>' +
          '<div class="md-team-ovr">OVR ' + (info.isHome ? opp : club).squadOVR() + '</div></div>' +
      '</div>' +
      '<div class="md-cols">' +
        '<div class="md-lineup"><h3>Your XI <span class="muted">(' + club.formation + ')</span></h3>' + UI.pitch(club) +
          '<p class="hint">Lineup is auto-picked as your strongest available XI. Change shape in Tactics.</p></div>' +
        '<div class="md-panel">' +
          '<div class="md-readout"><span>Avg fitness</span>' + fitBar(avgFit) + '<b>' + avgFit + '%</b></div>' +
          '<div class="md-readout"><span>Mentality</span><b>' + cap(club.tactics.mentality) + '</b></div>' +
          '<div class="md-readout"><span>Tempo</span><b>' + cap(club.tactics.tempo) + '</b></div>' +
          '<button class="btn btn-primary btn-block btn-lg" data-action="play-match">' + UI.icon('play') + ' Play Match</button>' +
        '</div>' +
      '</div>';
  };
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

  // ---- Play match + reveal -------------------------------------------------
  UI.playMatch = function () {
    var round = Game.playRound();
    if (!round || !round.userResult) { UI.showView('table'); return; }
    UI.showMatchReveal(round);
  };

  UI.showMatchReveal = function (round) {
    var r = round.userResult;
    var weatherLabel = { clear: 'Clear', rain: 'Rain', cloudy: 'Overcast', fog: 'Foggy', night: 'Night', snow: 'Snow' }[round.weather] || 'Clear';
    var feedItems = r.events.filter(function (e) { return e.type === 'goal' || e.type === 'miss' || e.type === 'save'; });
    UI.modal(
      '<div class="reveal">' +
        '<div class="reveal-head">' +
          '<div class="reveal-scoreline">' +
            '<span class="rs-team">' + esc(r.homeShort) + '</span>' +
            '<span class="rs-score" id="rs-score">0 - 0</span>' +
            '<span class="rs-team">' + esc(r.awayShort) + '</span>' +
          '</div>' +
          '<div class="reveal-sub">' + esc(r.homeName) + ' vs ' + esc(r.awayName) + ' · ' + weatherLabel + '</div>' +
          '<button class="btn btn-ghost btn-sm" data-action="skip-reveal">Skip ▸</button>' +
        '</div>' +
        '<div class="reveal-feed" id="reveal-feed"></div>' +
        '<div class="reveal-foot" id="reveal-foot" style="display:none">' +
          '<div class="reveal-stats" id="reveal-stats"></div>' +
          '<button class="btn btn-primary btn-block" data-action="continue-after-match">Continue ▸</button>' +
        '</div>' +
      '</div>', true
    );
    UI._runReveal(r, feedItems);
  };

  UI._runReveal = function (r, items) {
    var feed = document.getElementById('reveal-feed');
    var scoreEl = document.getElementById('rs-score');
    var h = 0, a = 0, i = 0;
    var timers = [];
    function showItem(ev) {
      if (ev.type === 'goal') {
        if (ev.side === 'home') h++; else a++;
        scoreEl.textContent = h + ' - ' + a;
        scoreEl.classList.remove('pop'); void scoreEl.offsetWidth; scoreEl.classList.add('pop');
      }
      var row = document.createElement('div');
      row.className = 'feed-row ' + ev.type + ' ' + ev.side;
      row.innerHTML = '<span class="feed-min">' + ev.minute + "'</span>" +
        '<span class="feed-ico">' + (ev.type === 'goal' ? '⚽' : ev.type === 'save' ? '🧤' : '✗') + '</span>' +
        '<span class="feed-text">' + esc(ev.text) + '</span>';
      feed.appendChild(row);
      feed.scrollTop = feed.scrollHeight;
    }
    function finish() {
      scoreEl.textContent = r.homeScore + ' - ' + r.awayScore;
      var s = r.stats;
      document.getElementById('reveal-stats').innerHTML =
        statRow('Possession', s.possessionHome + '%', s.possessionAway + '%') +
        statRow('Shots', s.shotsHome, s.shotsAway) +
        statRow('On target', s.sotHome, s.sotAway) +
        (r.motmHome || r.motmAway ? '<div class="motm">MOTM: ' + esc((r.homeScore >= r.awayScore ? r.motmHome : r.motmAway) || r.motmHome || r.motmAway) + '</div>' : '');
      document.getElementById('reveal-foot').style.display = 'block';
    }
    UI.revealAll = function () {
      timers.forEach(clearTimeout);
      while (i < items.length) showItem(items[i++]);
      finish();
      UI.revealAll = null;
    };
    function step() {
      if (i >= items.length) { finish(); return; }
      showItem(items[i++]);
      timers.push(setTimeout(step, 420));
    }
    if (items.length === 0) { finish(); }
    else timers.push(setTimeout(step, 350));
  };
  function statRow(label, h, a) {
    return '<div class="stat-row"><b>' + h + '</b><span>' + label + '</span><b>' + a + '</b></div>';
  }

  // ---- League Table view ---------------------------------------------------
  UI.viewTable = function () {
    var rows = Game.standings();
    var myId = Game.managerClubId;
    var body = rows.map(function (row, i) {
      var club = Game.club(row.clubId);
      var zone = i === 0 ? 'champ' : i < 4 ? 'ucl' : i < 6 ? 'uel' : i >= rows.length - 3 ? 'rel' : '';
      var form = row.form.map(function (f) { return '<span class="form-' + f + '">' + f + '</span>'; }).join('');
      return '<tr class="' + (row.clubId === myId ? 'me' : '') + ' zone-' + zone + '">' +
        '<td class="c-rank">' + (i + 1) + '</td>' +
        '<td class="c-club">' + UI.crest(club, 22) + '<span>' + esc(club.name) + '</span></td>' +
        '<td>' + row.P + '</td><td>' + row.W + '</td><td>' + row.D + '</td><td>' + row.L + '</td>' +
        '<td>' + row.GF + '</td><td>' + row.GA + '</td><td>' + (row.GD > 0 ? '+' : '') + row.GD + '</td>' +
        '<td class="c-pts">' + row.Pts + '</td><td class="c-form">' + form + '</td></tr>';
    }).join('');
    return '<div class="view-head"><h2>' + esc(Game.league().name) + '</h2><span class="pill">Round ' + Game.league().currentRound + ' / ' + Game.league().totalRounds() + '</span></div>' +
      '<div class="table-wrap"><table class="data-table league-table"><thead><tr>' +
      '<th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th>Form</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="legend"><span class="lg champ">Champion</span><span class="lg ucl">Champions League</span><span class="lg uel">Europa</span><span class="lg rel">Relegation</span></div>';
  };

  // ---- Stats view ----------------------------------------------------------
  UI.viewStats = function () {
    var lb = Game.leaderboards();
    function board(title, arr, suffix) {
      var rows = arr.slice(0, 10).map(function (e, i) {
        return '<tr><td class="c-rank">' + (i + 1) + '</td><td>' + esc(e.name) + '</td><td class="muted">' + e.club + '</td><td class="c-pts">' + e.value + '</td></tr>';
      }).join('') || '<tr><td colspan="4" class="muted center">No data yet — play some matches.</td></tr>';
      return '<div class="stat-card"><h3>' + title + '</h3><table class="data-table mini"><tbody>' + rows + '</tbody></table></div>';
    }
    return '<div class="view-head"><h2>Statistics</h2></div>' +
      '<div class="stats-grid">' +
        board('Top Scorers', lb.scorers) + board('Top Assists', lb.assists) + board('Clean Sheets', lb.cleanSheets) +
      '</div>';
  };

  // ---- Modal + toast -------------------------------------------------------
  UI.modal = function (html, persist) {
    UI.closeModal();
    var o = document.createElement('div');
    o.className = 'modal-overlay';
    o.id = 'modal';
    o.innerHTML = '<div class="modal" role="dialog">' + html + '</div>';
    if (!persist) o.addEventListener('click', function (e) { if (e.target === o) UI.closeModal(); });
    document.body.appendChild(o);
    requestAnimationFrame(function () { o.classList.add('show'); });
  };
  UI.closeModal = function () { var m = document.getElementById('modal'); if (m) m.remove(); };
  UI.toast = function (msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 1800);
  };

  function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  G.UI = UI;
})(typeof window !== 'undefined' ? window : globalThis);
