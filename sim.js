'use strict';

// =================================================================
//  UNIVERSE SANDBOX — WEB EDITION
//  N-body gravity, collisions, stellar evolution, climate, tools.
// =================================================================

// ---------- physical constants (SI) ----------
const G        = 6.67430e-11;            // N m² / kg²
const SIGMA    = 5.670374419e-8;          // Stefan-Boltzmann
const C_LIGHT  = 2.99792458e8;
const M_SUN    = 1.98892e30;
const R_SUN    = 6.957e8;
const L_SUN    = 3.828e26;                // W
const T_SUN    = 5778;
const M_EARTH  = 5.972e24;
const R_EARTH  = 6.371e6;
const M_JUP    = 1.898e27;
const R_JUP    = 6.9911e7;
const M_MOON   = 7.342e22;
const R_MOON   = 1.737e6;
const AU       = 1.495978707e11;
const PC       = 3.0857e16;
const LY       = 9.4607e15;
const YEAR     = 3.15576e7;
const DAY      = 86400;
const HOUR     = 3600;
const G_EARTH  = 9.80665;

// ---------- helpers ----------
const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => v < lo ? lo : (v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b = 0) => b + (a - b) * Math.random();
const randSign = () => Math.random() < 0.5 ? -1 : 1;

function fmt(v, unit = '') {
  if (!isFinite(v)) return '∞';
  const abs = Math.abs(v);
  let s, suf = '';
  if (abs >= 1e30) { s = (v / 1e30).toFixed(2); suf = '×10³⁰'; }
  else if (abs >= 1e24) { s = (v / 1e24).toFixed(2); suf = '×10²⁴'; }
  else if (abs >= 1e21) { s = (v / 1e21).toFixed(2); suf = '×10²¹'; }
  else if (abs >= 1e18) { s = (v / 1e18).toFixed(2); suf = '×10¹⁸'; }
  else if (abs >= 1e15) { s = (v / 1e15).toFixed(2); suf = '×10¹⁵'; }
  else if (abs >= 1e12) { s = (v / 1e12).toFixed(2); suf = ' T'; }
  else if (abs >= 1e9)  { s = (v / 1e9).toFixed(2);  suf = ' B'; }
  else if (abs >= 1e6)  { s = (v / 1e6).toFixed(2);  suf = ' M'; }
  else if (abs >= 1e3)  { s = (v / 1e3).toFixed(2);  suf = ' k'; }
  else                  { s = v.toFixed(2); }
  return s + suf + unit;
}

function fmtMass(kg) {
  if (kg >= 0.005 * M_SUN) return (kg / M_SUN).toFixed(3) + ' M☉';
  if (kg >= 0.05 * M_JUP)  return (kg / M_JUP).toFixed(3) + ' M♃';
  if (kg >= 0.001 * M_EARTH) return (kg / M_EARTH).toFixed(3) + ' M⊕';
  return fmt(kg, ' kg');
}

function fmtRadius(m) {
  if (m >= 0.1 * R_SUN) return (m / R_SUN).toFixed(3) + ' R☉';
  if (m >= 0.5 * R_JUP) return (m / R_JUP).toFixed(3) + ' R♃';
  if (m >= 0.001 * R_EARTH) return (m / R_EARTH).toFixed(3) + ' R⊕';
  if (m >= 1000) return (m / 1000).toFixed(2) + ' km';
  return m.toFixed(0) + ' m';
}

function fmtDist(m) {
  if (m >= 0.5 * LY) return (m / LY).toFixed(3) + ' ly';
  if (m >= 0.1 * AU) return (m / AU).toFixed(3) + ' AU';
  if (m >= 1e6) return (m / 1e6).toFixed(2) + ' Mm';
  if (m >= 1000) return (m / 1000).toFixed(1) + ' km';
  return m.toFixed(0) + ' m';
}

function fmtTime(s) {
  const abs = Math.abs(s);
  if (abs >= 1e9 * YEAR) return (s / (1e9 * YEAR)).toFixed(2) + ' Gyr';
  if (abs >= 1e6 * YEAR) return (s / (1e6 * YEAR)).toFixed(2) + ' Myr';
  if (abs >= 1000 * YEAR) return (s / (1000 * YEAR)).toFixed(2) + ' kyr';
  if (abs >= YEAR) return (s / YEAR).toFixed(2) + ' yr';
  if (abs >= DAY) return (s / DAY).toFixed(2) + ' d';
  if (abs >= HOUR) return (s / HOUR).toFixed(2) + ' h';
  if (abs >= 60) return (s / 60).toFixed(2) + ' min';
  return s.toFixed(2) + ' s';
}

// ---------- compositions ----------
// fraction breakdown (sums to 1)
const COMP_ROCK = { rock: 0.7, iron: 0.25, ice: 0.05 };
const COMP_IRON = { iron: 0.9, rock: 0.1 };
const COMP_GAS  = { hydrogen: 0.75, helium: 0.24, ice: 0.01 };
const COMP_ICE  = { ice: 0.85, rock: 0.15 };
const COMP_STAR = { hydrogen: 0.74, helium: 0.25, metals: 0.01 };
const COMP_DUST = { rock: 0.6, ice: 0.4 };

function compColor(c) {
  return {
    rock:     '#7a5a48',
    iron:     '#8a8a92',
    ice:      '#cfe8ff',
    hydrogen: '#ff9b6a',
    helium:   '#ffd28a',
    metals:   '#c8c8c8',
  }[c] || '#888';
}

function blendComp(c1, m1, c2, m2) {
  const out = {};
  const total = m1 + m2;
  const keys = new Set([...Object.keys(c1), ...Object.keys(c2)]);
  for (const k of keys) {
    out[k] = ((c1[k] || 0) * m1 + (c2[k] || 0) * m2) / total;
  }
  return out;
}

// ---------- Body ----------
let nextId = 1;
class Body {
  constructor(opts) {
    this.id = nextId++;
    this.name = opts.name || `Body ${this.id}`;
    this.kind = opts.kind || 'rock';         // rock|gas|moon|asteroid|comet|star|dwarf|bh|neutron|whitedwarf|debris
    this.mass = opts.mass || M_EARTH;
    this.radius = opts.radius || R_EARTH;
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.vx = opts.vx || 0;
    this.vy = opts.vy || 0;
    this.ax = 0; this.ay = 0;
    this.ax0 = 0; this.ay0 = 0;          // previous-step accel for verlet
    this.composition = opts.composition || COMP_ROCK;
    this.albedo = opts.albedo ?? 0.3;
    this.greenhouse = opts.greenhouse ?? 0.0;
    this.rotationPeriod = opts.rotationPeriod ?? DAY; // s
    this.spinAngle = 0;
    this.temperature = opts.temperature ?? 0;    // K (computed for terrestrials, set for stars)
    this.color = opts.color || null;
    this.age = opts.age || 0;                    // simulated age (s)
    this.massHistory = this.mass;                // for stellar evolution baseline
    this.state = opts.state || (this.isStar() ? 'main_sequence' : 'normal');
    this.fixed = !!opts.fixed;
    this.trail = [];
    this.trailMax = opts.trailMax ?? 200;
    this.trailStride = 0;
    this.dead = false;
    this.label = opts.label !== false;
    this.parentName = opts.parentName || null;
  }

  isStar() { return ['star','dwarf','neutron','whitedwarf','bh'].includes(this.kind); }
  isCompact() { return ['bh','neutron','whitedwarf'].includes(this.kind); }
  isTerrestrial() { return ['rock','moon','asteroid','comet'].includes(this.kind); }
  isGasGiant() { return this.kind === 'gas'; }

  density() { return this.mass / ((4/3) * Math.PI * this.radius ** 3); }
  surfaceGravity() { return G * this.mass / (this.radius * this.radius); }
  escapeVelocity() { return Math.sqrt(2 * G * this.mass / this.radius); }

  // main-sequence lifetime (years) for given mass
  mainSequenceLifetime() {
    const m = this.mass / M_SUN;
    return 1e10 * Math.pow(m, -2.5); // years
  }
  // luminosity (W) for current state
  luminosity() {
    if (this.kind === 'star' || this.kind === 'dwarf') {
      const m = this.mass / M_SUN;
      return L_SUN * Math.pow(m, 3.5);
    }
    if (this.kind === 'whitedwarf') return L_SUN * 1e-3;
    if (this.kind === 'neutron') return L_SUN * 1e-5;
    return 0;
  }

  // surface temp from radiation balance (terrestrials/gas giants only)
  computeSurfaceTemp(stars) {
    if (this.isStar()) return;
    let flux = 0;
    for (const s of stars) {
      const dx = s.x - this.x, dy = s.y - this.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < 1) continue;
      flux += s.luminosity() / (4 * Math.PI * d2);
    }
    flux += 2.7e-6 * SIGMA * Math.pow(2.7, 4); // CMB-ish background (negligible)
    // greenhouse increases effective temp
    const g = clamp(this.greenhouse, 0, 0.95);
    const a = clamp(this.albedo, 0, 0.95);
    const Teff = Math.pow(((1 - a) * flux) / (4 * SIGMA * (1 - g)), 0.25);
    // smooth a little
    this.temperature = lerp(this.temperature || Teff, Teff, 0.25);
  }

  // visual color from temperature for stars (Planck approx)
  stellarColor() {
    const T = this.temperature || 5778;
    // simple curve (cool red → warm white → hot blue)
    let r,g,b;
    if (T < 3500) { r=255; g=110; b=60; }
    else if (T < 5000) { r=255; g=180; b=110; }
    else if (T < 6500) { r=255; g=230; b=190; }
    else if (T < 8000) { r=230; g=230; b=255; }
    else if (T < 15000) { r=190; g=200; b=255; }
    else { r=160; g=180; b=255; }
    return [r, g, b];
  }

  // terrestrial visual color from temperature + composition
  terrestrialColor() {
    if (this.color) return this.color;
    const T = this.temperature || 273;
    const ice = (this.composition.ice || 0);
    const iron = (this.composition.iron || 0);
    if (T > 1500) return '#ff7050';        // lava
    if (T > 800) return '#a8553a';         // baked
    if (T < 180) return ice > 0.4 ? '#dceaf6' : '#b8c4d6';
    if (T < 240) return '#b8a896';
    if (this.kind === 'comet') return '#a8d4ec';
    if (iron > 0.7) return '#8a7868';
    return '#a07a5a';
  }

  pushTrail() {
    this.trailStride++;
    if (this.trailStride < 2) return;
    this.trailStride = 0;
    this.trail.push(this.x, this.y);
    if (this.trail.length > this.trailMax * 2) {
      this.trail.splice(0, this.trail.length - this.trailMax * 2);
    }
  }
}

// ---------- Simulator ----------
class Simulator {
  constructor() {
    this.bodies = [];
    this.time = 0;
    this.dt = 60;
    this.scale = 0;          // index into speed presets
    this.paused = false;
    this.reverse = false;
    this.events = [];
    this.energy = 0;
    this.softeningFraction = 0.5;  // softening = this * sum(radii)
    this.substeps = 1;
    this.collisionsEnabled = true;
  }

  add(body) { this.bodies.push(body); return body; }
  remove(body) {
    body.dead = true;
    const i = this.bodies.indexOf(body);
    if (i >= 0) this.bodies.splice(i, 1);
  }
  clear() { this.bodies.length = 0; this.time = 0; this.events.length = 0; }

  addEvent(text, kind = 'info') {
    this.events.push({ text, kind, at: performance.now() });
    if (this.events.length > 12) this.events.shift();
  }

  step(dtTarget) {
    if (this.paused || dtTarget === 0) return;
    const dt = this.reverse ? -dtTarget : dtTarget;
    const n = this.substeps;
    const h = dt / n;
    for (let i = 0; i < n; i++) this.integrate(h);
    this.time += dt;

    // stellar evolution + climate + trails
    const stars = this.bodies.filter(b => b.isStar() && !b.isCompact());
    for (const b of this.bodies) {
      b.age += dt;
      b.spinAngle += (TAU / Math.max(1, b.rotationPeriod)) * dt;
      this.evolve(b, dt);
      if (b.isTerrestrial() || b.isGasGiant()) b.computeSurfaceTemp(stars);
      b.pushTrail();
    }
  }

  integrate(h) {
    const bodies = this.bodies;
    const n = bodies.length;
    if (n === 0) return;

    // half-kick: v += a*h/2 using previous a
    // we use velocity Verlet: x += v*h + 0.5*a*h²; recompute a; v += 0.5*(a_old + a_new)*h
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      if (b.fixed) continue;
      b.x += b.vx * h + 0.5 * b.ax * h * h;
      b.y += b.vy * h + 0.5 * b.ay * h * h;
      b.ax0 = b.ax; b.ay0 = b.ay;
    }

    // recompute accelerations
    for (let i = 0; i < n; i++) { bodies[i].ax = 0; bodies[i].ay = 0; }
    for (let i = 0; i < n; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < n; j++) {
        const b = bodies[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const eps = this.softeningFraction * (a.radius + b.radius);
        const r2 = dx*dx + dy*dy + eps*eps;
        const r = Math.sqrt(r2);
        const inv = 1 / (r2 * r);
        if (!a.fixed) {
          a.ax += G * b.mass * dx * inv;
          a.ay += G * b.mass * dy * inv;
        }
        if (!b.fixed) {
          b.ax -= G * a.mass * dx * inv;
          b.ay -= G * a.mass * dy * inv;
        }
      }
    }

    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      if (b.fixed) continue;
      b.vx += 0.5 * (b.ax0 + b.ax) * h;
      b.vy += 0.5 * (b.ay0 + b.ay) * h;
    }

    if (this.collisionsEnabled) this.handleCollisions();
  }

  handleCollisions() {
    const bodies = this.bodies;
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (a.dead) continue;
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (b.dead) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const r2 = dx*dx + dy*dy;
        const rsum = a.radius + b.radius;
        if (r2 < rsum * rsum) {
          this.resolveCollision(a, b);
          if (a.dead) break;
        }
      }
    }
    // sweep dead bodies
    for (let i = bodies.length - 1; i >= 0; i--) {
      if (bodies[i].dead) bodies.splice(i, 1);
    }
  }

  resolveCollision(a, b) {
    // black hole: absorbs everything
    if (a.kind === 'bh' || b.kind === 'bh') {
      const bh = a.kind === 'bh' ? a : b;
      const food = a.kind === 'bh' ? b : a;
      const newMass = bh.mass + food.mass;
      bh.vx = (bh.vx * bh.mass + food.vx * food.mass) / newMass;
      bh.vy = (bh.vy * bh.mass + food.vy * food.mass) / newMass;
      bh.x  = (bh.x  * bh.mass + food.x  * food.mass) / newMass;
      bh.y  = (bh.y  * bh.mass + food.y  * food.mass) / newMass;
      bh.mass = newMass;
      bh.radius = Math.max(2 * G * newMass / (C_LIGHT * C_LIGHT), 1000); // Schwarzschild
      food.dead = true;
      this.addEvent(`${food.name} fell into ${bh.name}`, 'bad');
      return;
    }

    // ensure a is more massive
    if (b.mass > a.mass) [a, b] = [b, a];

    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.sqrt(dx*dx + dy*dy) || 1;
    const nx = dx / d, ny = dy / d;
    const dvx = b.vx - a.vx, dvy = b.vy - a.vy;
    const vRel = Math.abs(dvx * nx + dvy * ny);
    const vEsc = Math.sqrt(2 * G * (a.mass + b.mass) / (a.radius + b.radius));

    // glancing vs head-on
    const speed = Math.sqrt(dvx*dvx + dvy*dvy);
    const dotN = (dvx * nx + dvy * ny) / (speed || 1);
    const glancing = Math.abs(dotN) < 0.5;

    if (vRel < 1.2 * vEsc && !glancing) {
      // accretion / merger
      this.merge(a, b);
    } else if (a.mass > b.mass * 50 && speed < 3 * vEsc) {
      // small body splats onto large body — slight mass gain, no fragments
      this.merge(a, b);
    } else {
      // fragmentation
      this.fragment(a, b);
    }
  }

  merge(a, b) {
    const total = a.mass + b.mass;
    const newKind = (a.kind === 'star' || b.kind === 'star') ? 'star'
      : (a.kind === 'gas' || b.kind === 'gas') ? 'gas'
      : a.kind === 'rock' ? 'rock'
      : a.kind;
    a.x = (a.x * a.mass + b.x * b.mass) / total;
    a.y = (a.y * a.mass + b.y * b.mass) / total;
    a.vx = (a.vx * a.mass + b.vx * b.mass) / total;
    a.vy = (a.vy * a.mass + b.vy * b.mass) / total;
    const V = (4/3) * Math.PI * (a.radius**3 + b.radius**3);
    a.radius = Math.cbrt(V * 3 / (4 * Math.PI));
    a.composition = blendComp(a.composition, a.mass, b.composition, b.mass);
    a.mass = total;
    a.kind = newKind;
    a.color = null;
    if (a.kind === 'rock' && a.mass > 0.5 * M_JUP) { a.kind = 'gas'; a.composition = COMP_GAS; }
    if (a.mass > 0.08 * M_SUN && !a.isStar()) {
      a.kind = a.mass > 0.5 * M_SUN ? 'star' : 'dwarf';
      a.composition = COMP_STAR;
      a.temperature = a.kind === 'star' ? 5800 : 3500;
      a.state = 'main_sequence';
      a.age = 0;
      this.addEvent(`${a.name} ignited nuclear fusion`, 'good');
    } else {
      this.addEvent(`${a.name} absorbed ${b.name}`, 'warn');
    }
    b.dead = true;
  }

  fragment(a, b) {
    const total = a.mass + b.mass;
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.sqrt(dx*dx + dy*dy) || 1;
    // larger keeps most mass
    const keepFrac = 0.7 + Math.random() * 0.2;
    const aNewMass = a.mass + b.mass * keepFrac * 0.4;
    const ejected = total - aNewMass;
    a.mass = aNewMass;
    a.radius = a.radius * Math.cbrt(aNewMass / (aNewMass - b.mass * 0.2 || aNewMass));
    // momentum conservation for the dominant body
    const totalP_x = a.vx * a.mass + b.vx * b.mass;
    const totalP_y = a.vy * a.mass + b.vy * b.mass;
    // produce fragments
    const nFrag = 4 + Math.floor(Math.random() * 5);
    let pxRem = totalP_x, pyRem = totalP_y;
    let massRem = ejected;
    const speed = Math.hypot(a.vx - b.vx, a.vy - b.vy);
    for (let i = 0; i < nFrag; i++) {
      const fm = (i === nFrag - 1) ? massRem : massRem / (nFrag - i) * rand(1.4, 0.5);
      massRem -= fm;
      const ang = Math.random() * TAU;
      const sp = speed * rand(1.4, 0.6) + 200;
      const fr = Math.cbrt(fm / (b.density() || 3000));
      const off = (a.radius + fr) * 1.05;
      const frag = new Body({
        name: `${b.name} frag ${i+1}`,
        kind: 'asteroid',
        mass: Math.max(fm, 1e15),
        radius: Math.max(fr, 100),
        x: a.x + Math.cos(ang) * off + dx * 0.5,
        y: a.y + Math.sin(ang) * off + dy * 0.5,
        vx: a.vx + Math.cos(ang) * sp,
        vy: a.vy + Math.sin(ang) * sp,
        composition: { ...b.composition },
      });
      pxRem -= frag.vx * frag.mass; pyRem -= frag.vy * frag.mass;
      this.add(frag);
    }
    a.vx = pxRem / a.mass;
    a.vy = pyRem / a.mass;
    b.dead = true;
    this.addEvent(`${b.name} shattered against ${a.name}`, 'bad');
  }

  evolve(b, dt) {
    if (!b.isStar() || b.isCompact()) return;
    const lifeSec = b.mainSequenceLifetime() * YEAR;
    if (b.state === 'main_sequence' && b.age > lifeSec) {
      const m = b.mass / M_SUN;
      if (m < 8) {
        b.state = 'red_giant';
        b.radius *= 80;
        b.temperature = 3300;
        this.addEvent(`${b.name} swelled into a red giant`, 'warn');
      } else {
        b.state = 'supergiant';
        b.radius *= 250;
        b.temperature = 3000;
        this.addEvent(`${b.name} became a supergiant`, 'warn');
      }
    } else if (b.state === 'red_giant' && b.age > lifeSec + 1e9 * YEAR) {
      // shed → white dwarf
      b.kind = 'whitedwarf';
      b.state = 'white_dwarf';
      b.mass = Math.min(1.4 * M_SUN, b.mass * 0.5);
      b.radius = R_EARTH * 0.8;
      b.temperature = 30000;
      this.addEvent(`${b.name} collapsed to a white dwarf`, 'warn');
    } else if (b.state === 'supergiant' && b.age > lifeSec + 1e6 * YEAR) {
      // supernova
      const m = b.mass / M_SUN;
      if (m > 25) {
        b.kind = 'bh';
        b.state = 'black_hole';
        b.radius = Math.max(2 * G * b.mass / (C_LIGHT * C_LIGHT), 1000);
        this.addEvent(`${b.name} went supernova → black hole`, 'bad');
      } else {
        b.kind = 'neutron';
        b.state = 'neutron_star';
        b.mass = Math.min(2.0 * M_SUN, b.mass * 0.15);
        b.radius = 1.2e4;
        b.temperature = 1e6;
        this.addEvent(`${b.name} went supernova → neutron star`, 'bad');
      }
    }
  }

  // pair sum for energy display (KE + PE)
  totalEnergy() {
    let KE = 0, PE = 0;
    const bs = this.bodies;
    for (let i = 0; i < bs.length; i++) {
      const a = bs[i];
      KE += 0.5 * a.mass * (a.vx * a.vx + a.vy * a.vy);
      for (let j = i + 1; j < bs.length; j++) {
        const b = bs[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const r = Math.sqrt(dx*dx + dy*dy) + 1;
        PE -= G * a.mass * b.mass / r;
      }
    }
    return KE + PE;
  }
}

// ---------- Camera ----------
class Camera {
  constructor() {
    this.cx = 0; this.cy = 0;
    this.scale = 1 / (AU * 0.6); // pixels per meter
    this.follow = null;
    this.minScale = 1 / (1000 * AU);
    this.maxScale = 1 / 1000;
  }
  worldToScreen(x, y, W, H) {
    return [(x - this.cx) * this.scale + W / 2,
            (y - this.cy) * this.scale + H / 2];
  }
  screenToWorld(sx, sy, W, H) {
    return [(sx - W / 2) / this.scale + this.cx,
            (sy - H / 2) / this.scale + this.cy];
  }
  zoomAt(sx, sy, factor, W, H) {
    const [wx, wy] = this.screenToWorld(sx, sy, W, H);
    this.scale = clamp(this.scale * factor, this.minScale, this.maxScale);
    const [sx2, sy2] = this.worldToScreen(wx, wy, W, H);
    this.cx += (sx2 - sx) / this.scale;
    this.cy += (sy2 - sy) / this.scale;
  }
  frameAll(bodies, W, H) {
    if (bodies.length === 0) return;
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    for (const b of bodies) {
      minx = Math.min(minx, b.x - b.radius);
      maxx = Math.max(maxx, b.x + b.radius);
      miny = Math.min(miny, b.y - b.radius);
      maxy = Math.max(maxy, b.y + b.radius);
    }
    const w = Math.max(maxx - minx, 1);
    const h = Math.max(maxy - miny, 1);
    this.cx = (minx + maxx) / 2;
    this.cy = (miny + maxy) / 2;
    this.scale = clamp(0.85 * Math.min(W / w, H / h), this.minScale, this.maxScale);
  }
}

// ---------- Renderer ----------
class Renderer {
  constructor(canvas, sim, cam) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sim = sim;
    this.cam = cam;
    this.starfield = null;
    this.W = 0; this.H = 0; this.dpr = 1;
    this.options = {
      trails: true, vel: false, grav: false, labels: true, ruler: false, grid: false,
    };
    this.selected = null;
    this.hover = null;
    this.dragPreview = null;
    this.laserBeam = null;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.makeStarfield();
  }

  makeStarfield() {
    const stars = [];
    const n = Math.floor((this.W * this.H) / 2200);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        b: Math.random() * 0.7 + 0.1,
        s: Math.random() * 1.6 + 0.3,
      });
    }
    this.starfield = stars;
  }

  draw() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    ctx.clearRect(0, 0, W, H);

    // backdrop
    const bg = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.5, H * 0.5, Math.max(W, H));
    bg.addColorStop(0, '#0c1230');
    bg.addColorStop(0.5, '#070918');
    bg.addColorStop(1, '#03040b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // starfield (parallax)
    if (this.starfield) {
      const off = -this.cam.cx * this.cam.scale * 0.0002;
      const off2 = -this.cam.cy * this.cam.scale * 0.0002;
      for (const s of this.starfield) {
        const x = ((s.x * W + off * 30) % W + W) % W;
        const y = ((s.y * H + off2 * 30) % H + H) % H;
        ctx.fillStyle = `rgba(255,255,255,${s.b * 0.8})`;
        ctx.beginPath();
        ctx.arc(x, y, s.s, 0, TAU);
        ctx.fill();
      }
    }

    if (this.options.grid) this.drawGrid();

    // trails (under bodies)
    if (this.options.trails) this.drawTrails();

    // gravitational reach (faint circle)
    if (this.options.grav) this.drawGravReach();

    // bodies
    const bodies = this.sim.bodies;
    for (const b of bodies) this.drawBody(b);

    // velocity vectors
    if (this.options.vel) this.drawVelocity();

    // selection highlight
    if (this.selected) this.drawSelection(this.selected);
    if (this.hover && this.hover !== this.selected) this.drawHover(this.hover);

    // drag preview (spawn / launch)
    if (this.dragPreview) this.drawDragPreview();

    // laser beam
    if (this.laserBeam) this.drawLaser();

    // ruler
    if (this.options.ruler) this.drawRuler();
  }

  drawGrid() {
    const ctx = this.ctx;
    const W = this.W, H = this.H, cam = this.cam;
    // pick step in AU/Gm/Mm/km depending on zoom
    const targetPx = 100;
    const targetWorld = targetPx / cam.scale;
    const units = [AU, AU/10, 1e9, 1e8, 1e7, 1e6, 1e5, 1e4, 1e3, 100, 10];
    let step = units[0];
    for (const u of units) if (Math.abs(targetWorld - u) < Math.abs(targetWorld - step)) step = u;
    const [wx, wy] = cam.screenToWorld(0, 0, W, H);
    const startX = Math.floor(wx / step) * step;
    const startY = Math.floor(wy / step) * step;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; (x - wx) * cam.scale < W; x += step) {
      const [sx] = cam.worldToScreen(x, 0, W, H);
      ctx.moveTo(sx, 0); ctx.lineTo(sx, H);
    }
    for (let y = startY; (y - wy) * cam.scale < H; y += step) {
      const [, sy] = cam.worldToScreen(0, y, W, H);
      ctx.moveTo(0, sy); ctx.lineTo(W, sy);
    }
    ctx.stroke();
  }

  drawTrails() {
    const ctx = this.ctx;
    const W = this.W, H = this.H, cam = this.cam;
    for (const b of this.sim.bodies) {
      const t = b.trail;
      if (t.length < 4) continue;
      const col = b.isStar() ? '#ffd28a' : (b.kind === 'gas' ? '#d4a070' : '#8ec1ff');
      ctx.strokeStyle = `rgba(${this.hexToRgb(col)},0.18)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const [x0, y0] = cam.worldToScreen(t[0], t[1], W, H);
      ctx.moveTo(x0, y0);
      for (let i = 2; i < t.length; i += 2) {
        const [sx, sy] = cam.worldToScreen(t[i], t[i+1], W, H);
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  }

  drawGravReach() {
    const ctx = this.ctx;
    const W = this.W, H = this.H, cam = this.cam;
    for (const b of this.sim.bodies) {
      // hill sphere with respect to system center is a rough viz; use sqrt(GM/g_thresh)
      const r = Math.sqrt(G * b.mass / 1e-6); // 1e-6 m/s² threshold
      const [sx, sy] = cam.worldToScreen(b.x, b.y, W, H);
      const sr = r * cam.scale;
      if (sr < 4 || sr > Math.max(W, H) * 3) continue;
      ctx.strokeStyle = 'rgba(140,200,255,0.08)';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, TAU);
      ctx.stroke();
    }
  }

  drawVelocity() {
    const ctx = this.ctx;
    const W = this.W, H = this.H, cam = this.cam;
    ctx.strokeStyle = 'rgba(255,180,80,0.7)';
    ctx.lineWidth = 1.2;
    for (const b of this.sim.bodies) {
      const [sx, sy] = cam.worldToScreen(b.x, b.y, W, H);
      // pixel length proportional to v ; scale by 1e5 pixels per (m/s of v)
      const vs = Math.hypot(b.vx, b.vy);
      if (vs < 1) continue;
      const len = Math.min(80, Math.log10(vs + 1) * 18);
      const ex = sx + (b.vx / vs) * len;
      const ey = sy + (b.vy / vs) * len;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      // arrowhead
      const ang = Math.atan2(ey - sy, ex - sx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - Math.cos(ang - 0.4) * 6, ey - Math.sin(ang - 0.4) * 6);
      ctx.lineTo(ex - Math.cos(ang + 0.4) * 6, ey - Math.sin(ang + 0.4) * 6);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,180,80,0.7)';
      ctx.fill();
    }
  }

  drawBody(b) {
    const ctx = this.ctx;
    const W = this.W, H = this.H, cam = this.cam;
    const [sx, sy] = cam.worldToScreen(b.x, b.y, W, H);
    let sr = b.radius * cam.scale;
    const visMin = b.isStar() ? 4 : 2.5;
    sr = Math.max(sr, visMin);

    // off-screen cull (loose)
    if (sx < -sr * 6 || sx > W + sr * 6 || sy < -sr * 6 || sy > H + sr * 6) {
      if (this.options.labels && (b.isStar() || b.mass > 0.1 * M_JUP)) {
        // tiny offscreen indicator could be drawn; skip for now
      }
      return;
    }

    if (b.kind === 'bh') {
      // accretion disk
      const diskR = sr * 4;
      const grad = ctx.createRadialGradient(sx, sy, sr * 0.8, sx, sy, diskR);
      grad.addColorStop(0, 'rgba(180,120,255,0.8)');
      grad.addColorStop(0.4, 'rgba(120,80,200,0.4)');
      grad.addColorStop(1, 'rgba(80,40,140,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(sx, sy, diskR, diskR * 0.4, b.spinAngle * 0.1, 0, TAU);
      ctx.fill();
      // event horizon
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
      // photon ring
      ctx.strokeStyle = 'rgba(255,200,120,0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(sx, sy, sr * 1.2, 0, TAU); ctx.stroke();
    } else if (b.isStar()) {
      const [r, g, blu] = b.stellarColor();
      const haloR = sr * (b.state === 'red_giant' || b.state === 'supergiant' ? 2.5 : 3.5);
      const grad = ctx.createRadialGradient(sx, sy, sr * 0.5, sx, sy, haloR);
      grad.addColorStop(0, `rgba(${r},${g},${blu},0.95)`);
      grad.addColorStop(0.4, `rgba(${r},${g},${blu},0.35)`);
      grad.addColorStop(1, `rgba(${r},${g},${blu},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sx, sy, haloR, 0, TAU); ctx.fill();
      // core
      const core = ctx.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, 0, sx, sy, sr);
      core.addColorStop(0, '#fff');
      core.addColorStop(0.6, `rgb(${r},${g},${blu})`);
      core.addColorStop(1, `rgb(${Math.max(0,r-40)},${Math.max(0,g-60)},${Math.max(0,blu-60)})`);
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    } else if (b.kind === 'neutron' || b.kind === 'whitedwarf') {
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, 'rgba(180,220,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sx, sy, sr * 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#dffaff';
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    } else if (b.kind === 'gas') {
      const grad = ctx.createRadialGradient(sx - sr * 0.4, sy - sr * 0.4, sr * 0.2, sx, sy, sr);
      grad.addColorStop(0, '#ffe0b8');
      grad.addColorStop(0.4, '#d4a070');
      grad.addColorStop(1, '#7a4530');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
      // bands
      ctx.save();
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.clip();
      for (let i = -3; i <= 3; i++) {
        const t = i / 3;
        ctx.strokeStyle = `rgba(${i % 2 ? 100 : 180},${i % 2 ? 70 : 130},${i % 2 ? 50 : 90},0.4)`;
        ctx.lineWidth = sr * 0.18;
        ctx.beginPath();
        ctx.moveTo(sx - sr, sy + t * sr * 0.9);
        ctx.lineTo(sx + sr, sy + t * sr * 0.9);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // terrestrials, moon, asteroid, comet
      const col = b.terrestrialColor();
      const grad = ctx.createRadialGradient(sx - sr * 0.4, sy - sr * 0.4, 0, sx, sy, sr);
      const [r,g,bl] = this.colorToRgb(col);
      grad.addColorStop(0, `rgb(${Math.min(255,r+40)},${Math.min(255,g+40)},${Math.min(255,bl+40)})`);
      grad.addColorStop(0.7, col);
      grad.addColorStop(1, `rgb(${Math.max(0,r-50)},${Math.max(0,g-50)},${Math.max(0,bl-50)})`);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();

      // atmosphere ring
      if (b.greenhouse > 0.05 && b.temperature < 1000 && sr > 4) {
        const aGrad = ctx.createRadialGradient(sx, sy, sr, sx, sy, sr * 1.18);
        aGrad.addColorStop(0, 'rgba(120,180,255,0.25)');
        aGrad.addColorStop(1, 'rgba(120,180,255,0)');
        ctx.fillStyle = aGrad;
        ctx.beginPath(); ctx.arc(sx, sy, sr * 1.18, 0, TAU); ctx.fill();
      }

      // ice caps if very cold
      if (b.temperature < 230 && sr > 5 && b.kind === 'rock') {
        ctx.fillStyle = 'rgba(220,240,255,0.55)';
        ctx.beginPath();
        ctx.ellipse(sx, sy - sr * 0.75, sr * 0.7, sr * 0.25, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sx, sy + sr * 0.75, sr * 0.7, sr * 0.25, 0, 0, TAU);
        ctx.fill();
      }

      // comet tail
      if (b.kind === 'comet') {
        const sun = this.sim.bodies.find(x => x.isStar());
        if (sun) {
          const dx = b.x - sun.x, dy = b.y - sun.y;
          const dd = Math.hypot(dx, dy);
          if (dd < 8 * AU) {
            const ux = dx / dd, uy = dy / dd;
            const tlen = clamp(80 * (1 - dd / (8 * AU)), 10, 120);
            const grad2 = ctx.createLinearGradient(sx, sy, sx + ux * tlen, sy + uy * tlen);
            grad2.addColorStop(0, 'rgba(180,220,255,0.8)');
            grad2.addColorStop(1, 'rgba(180,220,255,0)');
            ctx.strokeStyle = grad2;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + ux * tlen, sy + uy * tlen);
            ctx.stroke();
          }
        }
      }
    }

    // labels
    if (this.options.labels && b.label && sr > 3) {
      ctx.fillStyle = 'rgba(220,230,250,0.75)';
      ctx.font = '11px -apple-system, system-ui, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(b.name, sx + sr + 4, sy - sr);
    }
  }

  drawSelection(b) {
    const ctx = this.ctx;
    const [sx, sy] = this.cam.worldToScreen(b.x, b.y, this.W, this.H);
    const sr = Math.max(b.radius * this.cam.scale, 4);
    ctx.strokeStyle = '#5cc8ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(sx, sy, sr + 6, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    // small crosshair
    ctx.beginPath();
    ctx.moveTo(sx - sr - 14, sy); ctx.lineTo(sx - sr - 8, sy);
    ctx.moveTo(sx + sr + 8, sy); ctx.lineTo(sx + sr + 14, sy);
    ctx.moveTo(sx, sy - sr - 14); ctx.lineTo(sx, sy - sr - 8);
    ctx.moveTo(sx, sy + sr + 8); ctx.lineTo(sx, sy + sr + 14);
    ctx.stroke();
  }

  drawHover(b) {
    const ctx = this.ctx;
    const [sx, sy] = this.cam.worldToScreen(b.x, b.y, this.W, this.H);
    const sr = Math.max(b.radius * this.cam.scale, 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(sx, sy, sr + 4, 0, TAU); ctx.stroke();
  }

  drawDragPreview() {
    const ctx = this.ctx;
    const d = this.dragPreview;
    const W = this.W, H = this.H;
    const [sx, sy] = this.cam.worldToScreen(d.wx, d.wy, W, H);
    const [ex, ey] = this.cam.worldToScreen(d.ex, d.ey, W, H);
    ctx.strokeStyle = '#5cc8ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);
    // ghost body
    ctx.strokeStyle = 'rgba(92,200,255,0.6)';
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(4, d.radius * this.cam.scale), 0, TAU); ctx.stroke();
    // arrowhead
    const ang = Math.atan2(ey - sy, ex - sx);
    ctx.fillStyle = '#5cc8ff';
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - Math.cos(ang - 0.4) * 10, ey - Math.sin(ang - 0.4) * 10);
    ctx.lineTo(ex - Math.cos(ang + 0.4) * 10, ey - Math.sin(ang + 0.4) * 10);
    ctx.closePath();
    ctx.fill();
  }

  drawLaser() {
    const ctx = this.ctx;
    const b = this.laserBeam;
    const [sx, sy] = this.cam.worldToScreen(b.fromX, b.fromY, this.W, this.H);
    const [ex, ey] = this.cam.worldToScreen(b.target.x, b.target.y, this.W, this.H);
    const grad = ctx.createLinearGradient(sx, sy, ex, ey);
    grad.addColorStop(0, 'rgba(255,80,80,1)');
    grad.addColorStop(1, 'rgba(255,200,80,0.9)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    // glow
    ctx.strokeStyle = 'rgba(255,150,80,0.25)';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  }

  drawRuler() {
    const ctx = this.ctx;
    const W = this.W, H = this.H, cam = this.cam;
    const targetPx = 150;
    const wTarget = targetPx / cam.scale;
    // pick nice unit
    const candidates = [1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, AU, 10*AU, 100*AU, 1000*AU, LY];
    let pick = candidates[0];
    for (const c of candidates) if (Math.abs(Math.log10(c) - Math.log10(wTarget)) < Math.abs(Math.log10(pick) - Math.log10(wTarget))) pick = c;
    const px = pick * cam.scale;
    const x0 = 26, y0 = H - 100;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x0 + px, y0);
    ctx.moveTo(x0, y0 - 5); ctx.lineTo(x0, y0 + 5);
    ctx.moveTo(x0 + px, y0 - 5); ctx.lineTo(x0 + px, y0 + 5);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(fmtDist(pick), x0, y0 - 10);
  }

  hexToRgb(hex) {
    const h = hex.replace('#','');
    const n = parseInt(h, 16);
    return `${(n>>16)&255},${(n>>8)&255},${n&255}`;
  }
  colorToRgb(c) {
    if (c.startsWith('#')) {
      const h = c.replace('#','');
      const n = parseInt(h, 16);
      return [(n>>16)&255,(n>>8)&255,n&255];
    }
    return [128,128,128];
  }
}

// ---------- Scenarios ----------
const scenarios = {
  solar: {
    name: 'Solar System',
    build(sim) {
      const sun = new Body({ name:'Sun', kind:'star', mass: M_SUN, radius: R_SUN,
        x:0, y:0, vx:0, vy:0, composition: COMP_STAR, temperature: T_SUN });
      sim.add(sun);
      const planets = [
        ['Mercury', 0.055 * M_EARTH, 0.383 * R_EARTH, 0.387 * AU, 47.36e3, COMP_ROCK, 0.12, 0.0, 0],
        ['Venus',   0.815 * M_EARTH, 0.949 * R_EARTH, 0.723 * AU, 35.02e3, COMP_ROCK, 0.77, 0.85, 0],
        ['Earth',   M_EARTH,         R_EARTH,         AU,         29.78e3, COMP_ROCK, 0.30, 0.25, 0],
        ['Mars',    0.107 * M_EARTH, 0.532 * R_EARTH, 1.524 * AU, 24.07e3, COMP_ROCK, 0.25, 0.07, 0],
        ['Jupiter', 318 * M_EARTH,   11.21 * R_EARTH, 5.20 * AU,  13.07e3, COMP_GAS,  0.50, 0.0, 0],
        ['Saturn',  95 * M_EARTH,    9.45 * R_EARTH,  9.58 * AU,  9.69e3,  COMP_GAS,  0.34, 0.0, 0],
        ['Uranus',  14.5 * M_EARTH,  4.01 * R_EARTH,  19.2 * AU,  6.81e3,  COMP_ICE,  0.30, 0.0, 0],
        ['Neptune', 17.1 * M_EARTH,  3.88 * R_EARTH,  30.1 * AU,  5.43e3,  COMP_ICE,  0.30, 0.0, 0],
      ];
      for (const [n, m, r, a, v, c, al, gh] of planets) {
        const kind = (n === 'Jupiter' || n === 'Saturn') ? 'gas'
          : (n === 'Uranus' || n === 'Neptune') ? 'gas' : 'rock';
        const ang = Math.random() * TAU;
        const p = new Body({
          name: n, kind, mass: m, radius: r,
          x: Math.cos(ang) * a, y: Math.sin(ang) * a,
          vx: -Math.sin(ang) * v, vy: Math.cos(ang) * v,
          composition: c, albedo: al, greenhouse: gh,
        });
        sim.add(p);
        if (n === 'Earth') {
          const moonAng = Math.random() * TAU;
          const moonD = 384400e3;
          const moonV = 1.022e3;
          sim.add(new Body({
            name: 'Moon', kind: 'moon', mass: M_MOON, radius: R_MOON,
            x: p.x + Math.cos(moonAng) * moonD,
            y: p.y + Math.sin(moonAng) * moonD,
            vx: p.vx - Math.sin(moonAng) * moonV,
            vy: p.vy + Math.cos(moonAng) * moonV,
            composition: COMP_ROCK, albedo: 0.12,
          }));
        }
      }
    },
  },

  earthMoon: {
    name: 'Earth & Moon',
    build(sim) {
      sim.add(new Body({ name:'Sun', kind:'star', mass: M_SUN, radius: R_SUN,
        x: -AU, y: 0, vx: 0, vy: -29.78e3 * 0, fixed: false,
        composition: COMP_STAR, temperature: T_SUN }));
      const earth = new Body({
        name:'Earth', kind:'rock', mass: M_EARTH, radius: R_EARTH,
        x: 0, y: 0, vx: 0, vy: 0, composition: COMP_ROCK, albedo: 0.3, greenhouse: 0.25,
      });
      sim.add(earth);
      sim.add(new Body({
        name:'Moon', kind:'moon', mass: M_MOON, radius: R_MOON,
        x: 384400e3, y: 0, vx: 0, vy: 1.022e3,
        composition: COMP_ROCK, albedo: 0.12,
      }));
    },
  },

  binary: {
    name: 'Binary Stars',
    build(sim) {
      const m1 = 1.5 * M_SUN, m2 = 1.0 * M_SUN;
      const sep = 2 * AU;
      const total = m1 + m2;
      const r1 = sep * m2 / total;
      const r2 = sep * m1 / total;
      const v = Math.sqrt(G * total / sep);
      const v1 = v * m2 / total;
      const v2 = v * m1 / total;
      sim.add(new Body({ name:'Alpha', kind:'star', mass:m1, radius:1.3*R_SUN, x:-r1, y:0, vx:0, vy:-v1, composition:COMP_STAR, temperature:6500 }));
      sim.add(new Body({ name:'Beta',  kind:'star', mass:m2, radius:R_SUN,     x: r2, y:0, vx:0, vy: v2, composition:COMP_STAR, temperature:5800 }));
      // circumbinary planet
      const a = 4 * AU;
      sim.add(new Body({
        name:'Kepler-Like', kind:'rock', mass: 3 * M_EARTH, radius: 1.4 * R_EARTH,
        x: a, y: 0, vx: 0, vy: Math.sqrt(G * total / a),
        composition: COMP_ROCK, albedo: 0.3, greenhouse: 0.2,
      }));
    },
  },

  threeBody: {
    name: 'Three-Body Chaos',
    build(sim) {
      const m = 0.8 * M_SUN;
      const d = 1.5 * AU;
      const v = Math.sqrt(G * m / d) * 0.95;
      sim.add(new Body({ name:'A', kind:'star', mass:m, radius:R_SUN, x:-d, y: 0, vx: 0, vy:-v, composition:COMP_STAR, temperature:5500 }));
      sim.add(new Body({ name:'B', kind:'star', mass:m, radius:R_SUN, x: d, y: 0, vx: 0, vy: v, composition:COMP_STAR, temperature:5500 }));
      sim.add(new Body({ name:'C', kind:'star', mass:m, radius:R_SUN, x: 0, y: d * 1.4, vx: v * 0.9, vy: 0, composition:COMP_STAR, temperature:5500 }));
    },
  },

  trappist: {
    name: 'TRAPPIST-1 Analog',
    build(sim) {
      sim.add(new Body({ name:'TRAPPIST-1', kind:'dwarf', mass: 0.089 * M_SUN, radius: 0.12 * R_SUN,
        x:0, y:0, vx:0, vy:0, composition:COMP_STAR, temperature: 2566 }));
      const dists = [0.0115, 0.0158, 0.0223, 0.0293, 0.0385, 0.0469, 0.0619]; // AU
      const names = ['b','c','d','e','f','g','h'];
      const masses = [1.37, 1.31, 0.39, 0.69, 1.04, 1.32, 0.33];
      const Mstar = 0.089 * M_SUN;
      for (let i = 0; i < dists.length; i++) {
        const a = dists[i] * AU;
        const v = Math.sqrt(G * Mstar / a);
        const ang = Math.random() * TAU;
        sim.add(new Body({
          name:`TRAPPIST-1${names[i]}`, kind:'rock',
          mass: masses[i] * M_EARTH, radius: Math.cbrt(masses[i]) * R_EARTH,
          x: Math.cos(ang) * a, y: Math.sin(ang) * a,
          vx:-Math.sin(ang) * v, vy: Math.cos(ang) * v,
          composition: COMP_ROCK, albedo: 0.3, greenhouse: 0.15,
        }));
      }
    },
  },

  rings: {
    name: 'Ring Formation',
    build(sim) {
      const planet = new Body({
        name:'Gas Giant', kind:'gas', mass: 200 * M_EARTH, radius: 7 * R_EARTH,
        x:0, y:0, vx:0, vy:0, composition: COMP_GAS,
      });
      sim.add(planet);
      const nMoons = 60;
      for (let i = 0; i < nMoons; i++) {
        const a = (1.8 + Math.random() * 1.2) * planet.radius;
        const v = Math.sqrt(G * planet.mass / a);
        const ang = Math.random() * TAU;
        sim.add(new Body({
          name:`m${i}`, kind:'asteroid',
          mass: 1e18 * rand(2, 0.4), radius: 5e4 * rand(2, 0.5),
          x: Math.cos(ang) * a, y: Math.sin(ang) * a,
          vx:-Math.sin(ang) * v, vy: Math.cos(ang) * v,
          composition: COMP_ICE, albedo: 0.5, label: false, trailMax: 30,
        }));
      }
    },
  },

  collision: {
    name: 'Galaxy Collision',
    build(sim) {
      const make = (cx, cy, vx, vy, name, n) => {
        const M = 1e10 * M_SUN;
        const core = new Body({ name, kind:'bh', mass: M, radius: 2*G*M/(C_LIGHT*C_LIGHT),
          x:cx, y:cy, vx:vx, vy:vy, composition: COMP_STAR });
        sim.add(core);
        for (let i = 0; i < n; i++) {
          const a = (0.3 + Math.random() * 1.5) * 100 * LY;
          const ang = Math.random() * TAU;
          const v = Math.sqrt(G * M / a);
          sim.add(new Body({
            name:'·', kind:'star', mass: 0.5 * M_SUN * rand(3,0.3),
            radius: R_SUN * 0.7, label:false, trailMax: 30,
            x: cx + Math.cos(ang) * a, y: cy + Math.sin(ang) * a,
            vx: vx - Math.sin(ang) * v, vy: vy + Math.cos(ang) * v,
            composition: COMP_STAR, temperature: rand(7000, 3500),
          }));
        }
      };
      make(-400 * LY, 0,  3e4, 1e4, 'Core A', 80);
      make( 400 * LY, 0, -3e4,-1e4, 'Core B', 80);
    },
  },

  whackamole: {
    name: 'Mercury Whack-a-Mole',
    build(sim) {
      sim.add(new Body({ name:'Sun', kind:'star', mass:M_SUN, radius:R_SUN,
        x:0, y:0, vx:0, vy:0, composition:COMP_STAR, temperature:T_SUN }));
      for (let i = 0; i < 30; i++) {
        const a = (0.3 + Math.random() * 0.4) * AU;
        const v = Math.sqrt(G * M_SUN / a) * rand(1.05, 0.95);
        const ang = Math.random() * TAU;
        sim.add(new Body({
          name:`m${i+1}`, kind:'rock',
          mass: 0.055 * M_EARTH * rand(1.5, 0.4),
          radius: 0.383 * R_EARTH * rand(1.3, 0.7),
          x: Math.cos(ang) * a, y: Math.sin(ang) * a,
          vx:-Math.sin(ang) * v, vy: Math.cos(ang) * v,
          composition: COMP_ROCK, label: false, trailMax: 60,
        }));
      }
    },
  },

  blackhole: {
    name: 'Sun → Black Hole',
    build(sim) {
      sim.add(new Body({ name:'Sgr (was Sun)', kind:'bh', mass: M_SUN, radius: 2*G*M_SUN/(C_LIGHT*C_LIGHT),
        x:0, y:0, vx:0, vy:0, composition:COMP_STAR }));
      const planets = [
        ['Mercury', 0.055, 0.383, 0.387, 47.36e3],
        ['Venus',   0.815, 0.949, 0.723, 35.02e3],
        ['Earth',   1.0,   1.0,   1.0,   29.78e3],
        ['Mars',    0.107, 0.532, 1.524, 24.07e3],
      ];
      for (const [n, mE, rE, aAU, v] of planets) {
        const ang = Math.random() * TAU;
        const a = aAU * AU;
        sim.add(new Body({
          name: n, kind:'rock', mass: mE * M_EARTH, radius: rE * R_EARTH,
          x: Math.cos(ang) * a, y: Math.sin(ang) * a,
          vx:-Math.sin(ang) * v, vy: Math.cos(ang) * v,
          composition: COMP_ROCK, albedo: 0.3,
        }));
      }
    },
  },

  rogue: {
    name: 'Rogue Star Encounter',
    build(sim) {
      scenarios.solar.build(sim);
      sim.add(new Body({
        name:'Rogue', kind:'star', mass: 0.6 * M_SUN, radius: 0.8 * R_SUN,
        x: -50 * AU, y: 30 * AU, vx: 15e3, vy: -8e3,
        composition: COMP_STAR, temperature: 4500,
      }));
    },
  },

  empty: {
    name: 'Empty Space',
    build(sim) {},
  },
};

// ---------- Spawn presets ----------
const spawnPresets = {
  rock:     { kind:'rock',     mass: M_EARTH,             radius: R_EARTH,        composition: COMP_ROCK, albedo: 0.3, greenhouse: 0.2,  name:'Planet' },
  gas:      { kind:'gas',      mass: M_JUP,               radius: R_JUP,          composition: COMP_GAS,  albedo: 0.5, greenhouse: 0.0,  name:'Gas giant' },
  moon:     { kind:'moon',     mass: M_MOON,              radius: R_MOON,         composition: COMP_ROCK, albedo: 0.12, greenhouse: 0.0, name:'Moon' },
  asteroid: { kind:'asteroid', mass: 1e18,                radius: 5e4,            composition: COMP_ROCK, albedo: 0.1,  greenhouse: 0.0, name:'Asteroid' },
  comet:    { kind:'comet',    mass: 1e14,                radius: 5e3,            composition: COMP_ICE,  albedo: 0.04, greenhouse: 0.0, name:'Comet' },
  star:     { kind:'star',     mass: M_SUN,               radius: R_SUN,          composition: COMP_STAR, temperature: 5800, name:'Star' },
  dwarf:    { kind:'dwarf',    mass: 0.3 * M_SUN,         radius: 0.35 * R_SUN,   composition: COMP_STAR, temperature: 3500, name:'Red dwarf' },
  bh:       { kind:'bh',       mass: 10 * M_SUN,          radius: 2*G*(10*M_SUN)/(C_LIGHT*C_LIGHT), composition: COMP_STAR, name:'Black hole' },
};

// ---------- Time speed presets ----------
const speedPresets = [
  { s: 1,            label: '1 s / s' },
  { s: 60,           label: '1 min / s' },
  { s: HOUR,         label: '1 hr / s' },
  { s: 6 * HOUR,     label: '6 hr / s' },
  { s: DAY,          label: '1 day / s' },
  { s: 7 * DAY,      label: '1 wk / s' },
  { s: 30 * DAY,     label: '1 mo / s' },
  { s: YEAR,         label: '1 yr / s' },
  { s: 10 * YEAR,    label: '10 yr / s' },
  { s: 100 * YEAR,   label: '100 yr / s' },
  { s: 1e3 * YEAR,   label: '1 kyr / s' },
  { s: 1e4 * YEAR,   label: '10 kyr / s' },
  { s: 1e5 * YEAR,   label: '100 kyr / s' },
  { s: 1e6 * YEAR,   label: '1 Myr / s' },
  { s: 1e8 * YEAR,   label: '100 Myr / s' },
];

// ---------- Application ----------
const canvas = document.getElementById('stage');
const sim = new Simulator();
const cam = new Camera();
const renderer = new Renderer(canvas, sim, cam);

let tool = 'select';
let spawnKind = 'rock';
let speedIdx = 6;             // index into speedPresets
let lastFrame = performance.now();
let lastFpsUpdate = 0;
let fpsCount = 0;
let fpsValue = 0;
let followSel = false;

// scenario loading
function loadScenario(key) {
  sim.clear();
  nextId = 1;
  scenarios[key].build(sim);
  cam.frameAll(sim.bodies, renderer.W, renderer.H);
  if (sim.bodies.length === 0) {
    cam.cx = 0; cam.cy = 0; cam.scale = 1 / (AU * 0.6);
  }
  renderer.selected = null;
  updateInspector();
  sim.addEvent(`Loaded: ${scenarios[key].name}`, 'good');
}

// ----- input -----
let drag = null;     // {mode, startX, startY, button, body}
let laserHold = null;

function getMouseWorld(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  return { sx, sy, ...worldOf(sx, sy) };
}
function worldOf(sx, sy) {
  const [wx, wy] = cam.screenToWorld(sx, sy, renderer.W, renderer.H);
  return { wx, wy };
}

function bodyUnder(sx, sy) {
  // pick the body whose edge is closest to (sx,sy)
  let best = null, bestGap = 12;
  for (const b of sim.bodies) {
    const [bx, by] = cam.worldToScreen(b.x, b.y, renderer.W, renderer.H);
    const sr = Math.max(b.radius * cam.scale, 4);
    const gap = Math.hypot(sx - bx, sy - by) - sr;
    if (gap < bestGap) { best = b; bestGap = gap; }
  }
  return best;
}

// 1 px of drag = PIXEL_TO_VPS m/s of initial velocity
const PIXEL_TO_VPS = 250;
function dragToVelocity(drag) {
  const dxw = drag.ex - drag.wx, dyw = drag.ey - drag.wy;
  const pxX = dxw * cam.scale, pxY = dyw * cam.scale;
  return [pxX * PIXEL_TO_VPS, pxY * PIXEL_TO_VPS];
}

canvas.addEventListener('mousedown', (e) => {
  const m = getMouseWorld(e);
  if (e.button === 2 || (e.button === 0 && tool === 'select' && !bodyUnder(m.sx, m.sy))) {
    drag = { mode:'pan', sx: m.sx, sy: m.sy, cx0: cam.cx, cy0: cam.cy, button: e.button };
    e.preventDefault();
    return;
  }
  if (e.button === 0) {
    const hit = bodyUnder(m.sx, m.sy);
    if (tool === 'select') {
      renderer.selected = hit;
      updateInspector();
    } else if (tool === 'spawn') {
      drag = { mode:'spawn', wx: m.wx, wy: m.wy, ex: m.wx, ey: m.wy };
    } else if (tool === 'launch') {
      if (hit) {
        renderer.selected = hit;
        drag = { mode:'launch', body: hit, wx: hit.x, wy: hit.y, ex: m.wx, ey: m.wy };
      } else if (renderer.selected) {
        drag = { mode:'launch', body: renderer.selected, wx: renderer.selected.x, wy: renderer.selected.y, ex: m.wx, ey: m.wy };
      }
    } else if (tool === 'laser') {
      if (hit) laserHold = { target: hit, fromX: m.wx, fromY: m.wy };
    } else if (tool === 'delete') {
      if (hit) {
        sim.addEvent(`${hit.name} deleted`, 'warn');
        if (renderer.selected === hit) renderer.selected = null;
        sim.remove(hit);
        updateInspector();
      }
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const m = getMouseWorld(e);
  renderer.hover = bodyUnder(m.sx, m.sy);
  if (laserHold) {
    laserHold.fromX = m.wx;
    laserHold.fromY = m.wy;
  }
  if (!drag) {
    canvas.style.cursor = renderer.hover && tool === 'select' ? 'pointer' :
      (tool === 'spawn' ? 'crosshair' :
       tool === 'laser' ? 'crosshair' :
       tool === 'delete' ? 'not-allowed' : 'default');
    return;
  }
  if (drag.mode === 'pan') {
    cam.cx = drag.cx0 - (m.sx - drag.sx) / cam.scale;
    cam.cy = drag.cy0 - (m.sy - drag.sy) / cam.scale;
  } else if (drag.mode === 'spawn') {
    drag.ex = m.wx; drag.ey = m.wy;
    const preset = spawnPresets[spawnKind];
    renderer.dragPreview = { wx: drag.wx, wy: drag.wy, ex: drag.ex, ey: drag.ey, radius: preset.radius };
    showDragHint(e, dragHintTextSpawn(drag));
  } else if (drag.mode === 'launch') {
    drag.ex = m.wx; drag.ey = m.wy;
    renderer.dragPreview = { wx: drag.body.x, wy: drag.body.y, ex: drag.ex, ey: drag.ey, radius: drag.body.radius };
    showDragHint(e, dragHintTextLaunch(drag));
  }
});

window.addEventListener('mouseup', (e) => {
  if (drag) {
    if (drag.mode === 'spawn') {
      const preset = spawnPresets[spawnKind];
      const [dvx, dvy] = dragToVelocity(drag);
      const opts = { ...preset, x: drag.wx, y: drag.wy, vx: dvx, vy: dvy };
      opts.name = preset.name + ' ' + sim.bodies.length;
      const b = new Body(opts);
      sim.add(b);
      sim.addEvent(`Spawned ${b.name}`, 'good');
      renderer.selected = b;
      updateInspector();
    } else if (drag.mode === 'launch') {
      // launch from body's current position
      drag.wx = drag.body.x; drag.wy = drag.body.y;
      const [dvx, dvy] = dragToVelocity(drag);
      drag.body.vx = dvx; drag.body.vy = dvy;
      sim.addEvent(`Launched ${drag.body.name}`, 'good');
    }
    drag = null;
    renderer.dragPreview = null;
    hideDragHint();
  }
  if (laserHold) laserHold = null;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const factor = Math.pow(1.0015, -e.deltaY);
  cam.zoomAt(sx, sy, factor, renderer.W, renderer.H);
}, { passive: false });

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// drag hint floater
const dragHintEl = document.getElementById('dragHint');
function showDragHint(e, text) {
  dragHintEl.classList.remove('hidden');
  dragHintEl.style.left = (e.clientX + 16) + 'px';
  dragHintEl.style.top = (e.clientY + 16) + 'px';
  dragHintEl.textContent = text;
}
function hideDragHint() { dragHintEl.classList.add('hidden'); }
function dragHintTextSpawn(d) {
  const [dvx, dvy] = dragToVelocity(d);
  return `v = ${fmt(Math.hypot(dvx, dvy), ' m/s')}`;
}
function dragHintTextLaunch(d) {
  const [dvx, dvy] = dragToVelocity({ wx: d.body.x, wy: d.body.y, ex: d.ex, ey: d.ey });
  return `${d.body.name} → v = ${fmt(Math.hypot(dvx, dvy), ' m/s')}`;
}

// keyboard
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); togglePlay(); }
  else if (k === 's') setTool('select');
  else if (k === 'a') setTool('spawn');
  else if (k === 'l') setTool('launch');
  else if (k === 'z') setTool('laser');
  else if (k === 'x') setTool('delete');
  else if (k === 'f') cam.frameAll(sim.bodies, renderer.W, renderer.H);
  else if (k === 'r') sim.reverse = !sim.reverse;
  else if (k === '[') setSpeed(speedIdx - 1);
  else if (k === ']') setSpeed(speedIdx + 1);
  else if (k === 'delete' || k === 'backspace') {
    if (renderer.selected) {
      sim.addEvent(`${renderer.selected.name} deleted`, 'warn');
      sim.remove(renderer.selected);
      renderer.selected = null;
      updateInspector();
    }
  }
});

// ----- UI bindings -----
function setTool(t) {
  tool = t;
  document.querySelectorAll('.tool').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === t);
  });
  document.getElementById('spawnPanel').style.opacity = (t === 'spawn') ? '1' : '0.5';
}
document.querySelectorAll('.tool').forEach(b => {
  b.addEventListener('click', () => setTool(b.dataset.tool));
});

document.querySelectorAll('.spawn').forEach(b => {
  b.addEventListener('click', () => {
    spawnKind = b.dataset.spawn;
    document.querySelectorAll('.spawn').forEach(x => x.classList.toggle('active', x === b));
  });
});

function setSpeed(idx) {
  speedIdx = clamp(idx, 0, speedPresets.length - 1);
  document.getElementById('speedSlider').value = speedIdx;
  document.getElementById('speedLabel').textContent = speedPresets[speedIdx].label;
  // adjust substeps for stability at high speed
  const s = speedPresets[speedIdx].s;
  if (s < HOUR)        sim.substeps = 1;
  else if (s < DAY)    sim.substeps = 1;
  else if (s < 30*DAY) sim.substeps = 2;
  else if (s < YEAR)   sim.substeps = 4;
  else if (s < 100*YEAR) sim.substeps = 8;
  else if (s < 1e4 * YEAR) sim.substeps = 16;
  else                 sim.substeps = 32;
}
document.getElementById('speedSlider').addEventListener('input', (e) => {
  setSpeed(parseInt(e.target.value, 10));
});

function togglePlay() {
  sim.paused = !sim.paused;
  document.getElementById('playBtn').innerHTML = sim.paused ? '&#9658;' : '&#10073;&#10073;';
}
document.getElementById('playBtn').addEventListener('click', togglePlay);
document.getElementById('reverseBtn').addEventListener('click', () => {
  sim.reverse = !sim.reverse;
  document.getElementById('reverseBtn').style.color = sim.reverse ? '#ffb347' : '';
});
document.getElementById('stepBtn').addEventListener('click', () => {
  sim.paused = true;
  document.getElementById('playBtn').innerHTML = '&#9658;';
  sim.step(speedPresets[speedIdx].s * 0.05);
});

// scenarios
const sel = document.getElementById('scenarioSel');
for (const k of Object.keys(scenarios)) {
  const opt = document.createElement('option');
  opt.value = k; opt.textContent = scenarios[k].name;
  sel.appendChild(opt);
}
sel.addEventListener('change', () => loadScenario(sel.value));
document.getElementById('reloadBtn').addEventListener('click', () => loadScenario(sel.value));

// display toggles
['Trails','Vel','Grav','Labels','Ruler','Grid'].forEach(name => {
  const el = document.getElementById('show' + name);
  const k = name.toLowerCase();
  el.addEventListener('change', () => { renderer.options[k] = el.checked; });
});

// camera buttons
document.getElementById('frameAllBtn').addEventListener('click', () => cam.frameAll(sim.bodies, renderer.W, renderer.H));
document.getElementById('followBtn').addEventListener('click', () => {
  followSel = !followSel;
  document.getElementById('followBtn').style.color = followSel ? '#5cc8ff' : '';
});
document.getElementById('resetCamBtn').addEventListener('click', () => {
  cam.cx = 0; cam.cy = 0; cam.scale = 1 / (AU * 0.6);
});

// inspector
function updateInspector() {
  const empty = document.getElementById('inspectEmpty');
  const body = document.getElementById('inspectBody');
  if (!renderer.selected) {
    empty.classList.remove('hidden');
    body.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  body.classList.remove('hidden');
  const b = renderer.selected;
  document.getElementById('bodyName').textContent = b.name;
  document.getElementById('bodyTypeBadge').textContent = b.kind;

  let state = b.state.replace(/_/g, ' ');
  const stateEl = document.getElementById('bodyStateBadge');
  stateEl.textContent = state;
  stateEl.className = 'badge';
  if (b.temperature > 1000) stateEl.classList.add('hot');
  else if (b.temperature < 250) stateEl.classList.add('cold');
  else if (b.temperature > 260 && b.temperature < 310 && b.isTerrestrial()) stateEl.classList.add('life');
  if (b.isCompact()) stateEl.classList.add('dead');

  document.getElementById('statMass').textContent = fmtMass(b.mass);
  document.getElementById('statRadius').textContent = fmtRadius(b.radius);
  document.getElementById('statTemp').textContent = b.temperature.toFixed(0) + ' K (' + (b.temperature - 273.15).toFixed(0) + ' °C)';
  document.getElementById('statGrav').textContent = (b.surfaceGravity() / G_EARTH).toFixed(2) + ' g';
  document.getElementById('statEscape').textContent = fmt(b.escapeVelocity(), ' m/s');
  document.getElementById('statAge').textContent = fmtTime(b.age);

  // orbital period heuristic: against nearest dominant body
  let parent = null, bestPull = 0;
  for (const o of sim.bodies) {
    if (o === b) continue;
    const dx = o.x - b.x, dy = o.y - b.y;
    const r = Math.hypot(dx, dy) || 1;
    const a = G * o.mass / (r * r);
    if (a > bestPull) { bestPull = a; parent = o; }
  }
  if (parent && parent.mass > b.mass * 0.5) {
    const dx = parent.x - b.x, dy = parent.y - b.y;
    const r = Math.hypot(dx, dy);
    const T = 2 * Math.PI * Math.sqrt(r * r * r / (G * (parent.mass + b.mass)));
    document.getElementById('statPeriod').textContent = fmtTime(T) + ' around ' + parent.name;
  } else {
    document.getElementById('statPeriod').textContent = '—';
  }

  // composition bar
  const cbar = document.getElementById('compBar');
  cbar.innerHTML = '';
  const entries = Object.entries(b.composition).sort((a,b) => b[1] - a[1]);
  for (const [k, v] of entries) {
    if (v < 0.01) continue;
    const seg = document.createElement('div');
    seg.className = 'comp-seg';
    seg.style.width = (v * 100) + '%';
    seg.style.background = compColor(k);
    seg.title = `${k}: ${(v * 100).toFixed(1)}%`;
    cbar.appendChild(seg);
  }

  // sliders reflect current — reset baselines so slider's zero = present value
  b._massBase = b.mass;
  b._radBase = b.radius;
  b._rotBase = b.rotationPeriod;
  document.getElementById('massSlider').value = 0;
  document.getElementById('radiusSlider').value = 0;
  document.getElementById('albedoSlider').value = b.albedo;
  document.getElementById('ghSlider').value = b.greenhouse;
  document.getElementById('rotSlider').value = 0;
  document.getElementById('massVal').textContent = fmtMass(b.mass);
  document.getElementById('radiusVal').textContent = fmtRadius(b.radius);
  document.getElementById('albedoVal').textContent = b.albedo.toFixed(2);
  document.getElementById('ghVal').textContent = b.greenhouse.toFixed(2);
  document.getElementById('rotVal').textContent = fmtTime(b.rotationPeriod);
}

// slider edits
function bindSlider(id, valId, fn, fmtFn) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    if (!renderer.selected) return;
    fn(renderer.selected, parseFloat(el.value));
    document.getElementById(valId).textContent = fmtFn(renderer.selected);
  });
}
bindSlider('massSlider', 'massVal',
  (b, v) => { b.mass = (b._massBase ?? (b._massBase = b.mass)) * Math.pow(10, v); if (b.kind === 'bh') b.radius = Math.max(2*G*b.mass/(C_LIGHT*C_LIGHT),1000); },
  b => fmtMass(b.mass));
bindSlider('radiusSlider', 'radiusVal',
  (b, v) => { b.radius = (b._radBase ?? (b._radBase = b.radius)) * Math.pow(10, v); },
  b => fmtRadius(b.radius));
bindSlider('albedoSlider', 'albedoVal',
  (b, v) => { b.albedo = v; },
  b => b.albedo.toFixed(2));
bindSlider('ghSlider', 'ghVal',
  (b, v) => { b.greenhouse = v; },
  b => b.greenhouse.toFixed(2));
bindSlider('rotSlider', 'rotVal',
  (b, v) => { b.rotationPeriod = (b._rotBase ?? (b._rotBase = b.rotationPeriod)) * Math.pow(10, v); },
  b => fmtTime(b.rotationPeriod));

document.getElementById('renameBtn').addEventListener('click', () => {
  if (!renderer.selected) return;
  const n = prompt('Rename body', renderer.selected.name);
  if (n) { renderer.selected.name = n; updateInspector(); }
});
document.getElementById('stopBtn').addEventListener('click', () => {
  if (!renderer.selected) return;
  renderer.selected.vx = 0; renderer.selected.vy = 0;
  sim.addEvent(`Stopped ${renderer.selected.name}`, 'warn');
});
document.getElementById('circOrbitBtn').addEventListener('click', () => {
  if (!renderer.selected) return;
  const b = renderer.selected;
  let parent = null, bestPull = 0;
  for (const o of sim.bodies) {
    if (o === b) continue;
    const dx = o.x - b.x, dy = o.y - b.y;
    const r2 = dx*dx + dy*dy;
    const a = G * o.mass / r2;
    if (a > bestPull) { bestPull = a; parent = o; }
  }
  if (!parent) { sim.addEvent('No parent body found', 'bad'); return; }
  const dx = b.x - parent.x, dy = b.y - parent.y;
  const r = Math.hypot(dx, dy);
  const v = Math.sqrt(G * (parent.mass + b.mass) / r);
  const ux = -dy / r, uy = dx / r;
  b.vx = parent.vx + ux * v;
  b.vy = parent.vy + uy * v;
  sim.addEvent(`Circularized ${b.name} around ${parent.name}`, 'good');
});
document.getElementById('igniteBtn').addEventListener('click', () => {
  if (!renderer.selected) return;
  const b = renderer.selected;
  if (b.mass < 0.08 * M_SUN) {
    b.mass = 0.08 * M_SUN;
    sim.addEvent(`Boosted ${b.name} to brown dwarf mass`, 'warn');
  }
  b.kind = b.mass > 0.5 * M_SUN ? 'star' : 'dwarf';
  b.composition = COMP_STAR;
  b.radius = R_SUN * Math.pow(b.mass / M_SUN, 0.8);
  b.temperature = b.kind === 'star' ? 5800 : 3500;
  b.state = 'main_sequence';
  b.age = 0;
  sim.addEvent(`${b.name} ignited!`, 'good');
  updateInspector();
});
document.getElementById('deleteBtn').addEventListener('click', () => {
  if (!renderer.selected) return;
  sim.addEvent(`${renderer.selected.name} deleted`, 'warn');
  sim.remove(renderer.selected);
  renderer.selected = null;
  updateInspector();
});

// ----- main loop -----
function tick(now) {
  const dtReal = Math.min((now - lastFrame) / 1000, 1/30);
  lastFrame = now;

  // sim step
  if (!sim.paused) {
    const dtSim = speedPresets[speedIdx].s * dtReal;
    sim.step(dtSim);
  }

  // laser hold
  if (laserHold) {
    const target = laserHold.target;
    if (!target.dead) {
      const dm = Math.max(1e16, target.mass * 0.002);
      target.mass = Math.max(target.mass - dm, 1e15);
      // shrink radius keeping density roughly constant
      target.radius = Math.cbrt(target.mass / (target.density() || 3000) * 3 / (4 * Math.PI));
      renderer.laserBeam = laserHold;
      if (target.mass <= 1e15) {
        sim.addEvent(`${target.name} vaporized`, 'warn');
        if (renderer.selected === target) renderer.selected = null;
        sim.remove(target);
        laserHold = null;
        renderer.laserBeam = null;
        updateInspector();
      }
    } else {
      laserHold = null; renderer.laserBeam = null;
    }
  } else {
    renderer.laserBeam = null;
  }

  // follow
  if (followSel && renderer.selected) {
    cam.cx = lerp(cam.cx, renderer.selected.x, 0.15);
    cam.cy = lerp(cam.cy, renderer.selected.y, 0.15);
  }

  // draw
  renderer.draw();

  // bottom stats
  document.getElementById('nBodies').textContent = sim.bodies.length;
  document.getElementById('simTime').textContent = fmtTime(sim.time);
  document.getElementById('zoomLbl').textContent = '1 px = ' + fmtDist(1 / cam.scale);

  let totalMass = 0;
  for (const b of sim.bodies) totalMass += b.mass;
  document.getElementById('totalMass').textContent = fmtMass(totalMass);

  fpsCount++;
  if (now - lastFpsUpdate > 500) {
    fpsValue = Math.round(fpsCount * 1000 / (now - lastFpsUpdate));
    fpsCount = 0;
    lastFpsUpdate = now;
    document.getElementById('fps').textContent = fpsValue;
  }
  if (Math.floor(now / 1000) !== Math.floor((now - dtReal*1000) / 1000)) {
    document.getElementById('energy').textContent = fmt(sim.totalEnergy(), ' J');
  }

  // update inspector live values for selected body
  if (renderer.selected) {
    document.getElementById('statTemp').textContent = renderer.selected.temperature.toFixed(0) + ' K (' + (renderer.selected.temperature - 273.15).toFixed(0) + ' °C)';
    document.getElementById('statAge').textContent = fmtTime(renderer.selected.age);
  }

  // event feed
  const feed = document.getElementById('eventFeed');
  const recent = sim.events.slice(-3);
  feed.innerHTML = '';
  for (const ev of recent) {
    const el = document.createElement('span');
    el.className = 'event ' + ev.kind;
    el.textContent = ev.text;
    feed.appendChild(el);
  }

  requestAnimationFrame(tick);
}

// init
function init() {
  window.addEventListener('resize', () => renderer.resize());
  renderer.resize();
  // default scenario
  loadScenario('solar');
  setSpeed(speedIdx);
  setTool('select');
  renderer.options.trails = document.getElementById('showTrails').checked;
  renderer.options.labels = document.getElementById('showLabels').checked;
  requestAnimationFrame(tick);
}
init();
