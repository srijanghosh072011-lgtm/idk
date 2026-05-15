// =====================================================================
//  UNIVERSE SANDBOX — 3D web edition
//  Three.js scene · N-body gravity · stellar evolution · climate · UI
// =====================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ============================ constants ===============================
const G        = 6.67430e-11;
const SIGMA    = 5.670374419e-8;
const C_LIGHT  = 2.99792458e8;
const M_SUN    = 1.98892e30;
const R_SUN    = 6.957e8;
const L_SUN    = 3.828e26;
const T_SUN    = 5778;
const M_EARTH  = 5.972e24;
const R_EARTH  = 6.371e6;
const M_JUP    = 1.898e27;
const R_JUP    = 6.9911e7;
const M_MOON   = 7.342e22;
const R_MOON   = 1.737e6;
const AU       = 1.495978707e11;
const LY       = 9.4607e15;
const YEAR     = 3.15576e7;
const DAY      = 86400;
const HOUR     = 3600;
const G_EARTH  = 9.80665;
const TAU      = Math.PI * 2;

// 1 Three.js world unit = SCALE_FACTOR meters
const SCALE_FACTOR = 1e7;
const toScene = (m) => m / SCALE_FACTOR;
const toMeters = (u) => u * SCALE_FACTOR;

// ============================ helpers =================================
const clamp = (v, lo, hi) => v < lo ? lo : (v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b = 0) => b + (a - b) * Math.random();

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

// ============================ composition =============================
const COMP_ROCK = { rock: 0.7, iron: 0.25, ice: 0.05 };
const COMP_IRON = { iron: 0.9, rock: 0.1 };
const COMP_GAS  = { hydrogen: 0.75, helium: 0.24, ice: 0.01 };
const COMP_ICE  = { ice: 0.85, rock: 0.15 };
const COMP_STAR = { hydrogen: 0.74, helium: 0.25, metals: 0.01 };

function compColor(c) {
  return ({
    rock:     '#7a5a48',
    iron:     '#8a8a92',
    ice:      '#cfe8ff',
    hydrogen: '#ff9b6a',
    helium:   '#ffd28a',
    metals:   '#c8c8c8',
  })[c] || '#888';
}
function blendComp(c1, m1, c2, m2) {
  const out = {};
  const total = m1 + m2;
  const keys = new Set([...Object.keys(c1), ...Object.keys(c2)]);
  for (const k of keys) out[k] = ((c1[k] || 0) * m1 + (c2[k] || 0) * m2) / total;
  return out;
}

// ============================ Body ====================================
let nextId = 1;
class Body {
  constructor(opts) {
    this.id = nextId++;
    this.name = opts.name || `Body ${this.id}`;
    this.kind = opts.kind || 'rock';
    this.mass = opts.mass || M_EARTH;
    this.radius = opts.radius || R_EARTH;
    // 3D position/velocity in METERS / METERS-PER-SECOND
    this.pos = new THREE.Vector3(opts.x || 0, opts.y || 0, opts.z || 0);
    this.vel = new THREE.Vector3(opts.vx || 0, opts.vy || 0, opts.vz || 0);
    this.acc = new THREE.Vector3();
    this.accPrev = new THREE.Vector3();

    this.composition = opts.composition || COMP_ROCK;
    this.albedo = opts.albedo ?? 0.3;
    this.greenhouse = opts.greenhouse ?? 0.0;
    this.rotationPeriod = opts.rotationPeriod ?? DAY;
    this.spinAngle = 0;
    this.tilt = opts.tilt ?? rand(0.3, -0.3);

    this.temperature = opts.temperature ?? 0;
    this.color = opts.color || null;
    this.age = opts.age || 0;
    this.state = opts.state || (this.isStar() ? 'main_sequence' : 'normal');
    this.fixed = !!opts.fixed;

    this.trail = [];
    this.trailMax = opts.trailMax ?? 240;
    this.trailStride = 0;
    this.dead = false;
    this.labelEnabled = opts.label !== false;
    this.textureKey = opts.textureKey || null;
    // visual node attached later
    this.node = null;
  }
  isStar() { return ['star','dwarf','neutron','whitedwarf','bh'].includes(this.kind); }
  isCompact() { return ['bh','neutron','whitedwarf'].includes(this.kind); }
  isTerrestrial() { return ['rock','moon','asteroid','comet'].includes(this.kind); }
  isGasGiant() { return this.kind === 'gas'; }
  density() { return this.mass / ((4/3) * Math.PI * this.radius ** 3); }
  surfaceGravity() { return G * this.mass / (this.radius * this.radius); }
  escapeVelocity() { return Math.sqrt(2 * G * this.mass / this.radius); }
  mainSequenceLifetime() {
    const m = this.mass / M_SUN;
    return 1e10 * Math.pow(m, -2.5);
  }
  luminosity() {
    if (this.kind === 'star' || this.kind === 'dwarf') {
      const m = this.mass / M_SUN;
      return L_SUN * Math.pow(m, 3.5);
    }
    if (this.kind === 'whitedwarf') return L_SUN * 1e-3;
    if (this.kind === 'neutron') return L_SUN * 1e-5;
    return 0;
  }
  computeSurfaceTemp(stars) {
    if (this.isStar()) return;
    let flux = 0;
    for (const s of stars) {
      const d2 = this.pos.distanceToSquared(s.pos);
      if (d2 < 1) continue;
      flux += s.luminosity() / (4 * Math.PI * d2);
    }
    const g = clamp(this.greenhouse, 0, 0.95);
    const a = clamp(this.albedo, 0, 0.95);
    const Teff = Math.pow(((1 - a) * flux) / (4 * SIGMA * (1 - g)), 0.25);
    this.temperature = lerp(this.temperature || Teff, Teff, 0.25);
  }
  pushTrail() {
    this.trailStride++;
    if (this.trailStride < 2) return;
    this.trailStride = 0;
    this.trail.push(this.pos.x, this.pos.y, this.pos.z);
    if (this.trail.length > this.trailMax * 3) {
      this.trail.splice(0, this.trail.length - this.trailMax * 3);
    }
  }
}

// ============================ Simulator ===============================
class Simulator {
  constructor() {
    this.bodies = [];
    this.time = 0;
    this.paused = false;
    this.reverse = false;
    this.events = [];
    this.softeningFraction = 0.5;
    this.substeps = 1;
    this.collisionsEnabled = true;
    this.onCollision = null;
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
    if (this.events.length > 24) this.events.shift();
  }

  step(dtTarget) {
    if (this.paused || dtTarget === 0) return;
    const dt = this.reverse ? -dtTarget : dtTarget;
    const n = this.substeps;
    const h = dt / n;
    for (let i = 0; i < n; i++) this.integrate(h);
    this.time += dt;

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
    // Velocity Verlet: drift with current accel, then recompute accel, then kick.
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      if (b.fixed) continue;
      b.pos.x += b.vel.x * h + 0.5 * b.acc.x * h * h;
      b.pos.y += b.vel.y * h + 0.5 * b.acc.y * h * h;
      b.pos.z += b.vel.z * h + 0.5 * b.acc.z * h * h;
      b.accPrev.copy(b.acc);
    }
    for (let i = 0; i < n; i++) bodies[i].acc.set(0, 0, 0);
    for (let i = 0; i < n; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < n; j++) {
        const b = bodies[j];
        const dx = b.pos.x - a.pos.x;
        const dy = b.pos.y - a.pos.y;
        const dz = b.pos.z - a.pos.z;
        const eps = this.softeningFraction * (a.radius + b.radius);
        const r2 = dx*dx + dy*dy + dz*dz + eps*eps;
        const r = Math.sqrt(r2);
        const inv = 1 / (r2 * r);
        if (!a.fixed) {
          a.acc.x += G * b.mass * dx * inv;
          a.acc.y += G * b.mass * dy * inv;
          a.acc.z += G * b.mass * dz * inv;
        }
        if (!b.fixed) {
          b.acc.x -= G * a.mass * dx * inv;
          b.acc.y -= G * a.mass * dy * inv;
          b.acc.z -= G * a.mass * dz * inv;
        }
      }
    }
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      if (b.fixed) continue;
      b.vel.x += 0.5 * (b.accPrev.x + b.acc.x) * h;
      b.vel.y += 0.5 * (b.accPrev.y + b.acc.y) * h;
      b.vel.z += 0.5 * (b.accPrev.z + b.acc.z) * h;
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
        const d2 = a.pos.distanceToSquared(b.pos);
        const rsum = a.radius + b.radius;
        if (d2 < rsum * rsum) {
          this.resolveCollision(a, b);
          if (a.dead) break;
        }
      }
    }
    for (let i = bodies.length - 1; i >= 0; i--) {
      if (bodies[i].dead) {
        if (this.onCollision) this.onCollision(bodies[i]);
        bodies.splice(i, 1);
      }
    }
  }

  resolveCollision(a, b) {
    if (a.kind === 'bh' || b.kind === 'bh') {
      const bh = a.kind === 'bh' ? a : b;
      const food = a.kind === 'bh' ? b : a;
      const newMass = bh.mass + food.mass;
      bh.vel.multiplyScalar(bh.mass).addScaledVector(food.vel, food.mass).divideScalar(newMass);
      bh.pos.multiplyScalar(bh.mass).addScaledVector(food.pos, food.mass).divideScalar(newMass);
      bh.mass = newMass;
      bh.radius = Math.max(2 * G * newMass / (C_LIGHT * C_LIGHT), 1000);
      food.dead = true;
      this.addEvent(`${food.name} → ${bh.name}`, 'bad');
      return;
    }
    if (b.mass > a.mass) [a, b] = [b, a];
    const rel = new THREE.Vector3().subVectors(b.vel, a.vel);
    const sep = new THREE.Vector3().subVectors(b.pos, a.pos);
    const d = sep.length() || 1;
    const n = sep.divideScalar(d);
    const speed = rel.length();
    const vRel = Math.abs(rel.dot(n));
    const vEsc = Math.sqrt(2 * G * (a.mass + b.mass) / (a.radius + b.radius));
    const dotN = speed ? Math.abs(rel.clone().normalize().dot(n)) : 1;
    const glancing = dotN < 0.5;

    if (vRel < 1.2 * vEsc && !glancing) this.merge(a, b);
    else if (a.mass > b.mass * 50 && speed < 3 * vEsc) this.merge(a, b);
    else this.fragment(a, b);
  }

  merge(a, b) {
    const total = a.mass + b.mass;
    let newKind = a.kind;
    if (a.kind === 'star' || b.kind === 'star') newKind = 'star';
    else if (a.kind === 'gas' || b.kind === 'gas') newKind = 'gas';
    else newKind = a.kind;
    a.pos.multiplyScalar(a.mass).addScaledVector(b.pos, b.mass).divideScalar(total);
    a.vel.multiplyScalar(a.mass).addScaledVector(b.vel, b.mass).divideScalar(total);
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
      this.addEvent(`${a.name} ignited fusion`, 'good');
    } else {
      this.addEvent(`${a.name} absorbed ${b.name}`, 'warn');
    }
    b.dead = true;
    a._visualDirty = true;
  }

  fragment(a, b) {
    const total = a.mass + b.mass;
    const sep = new THREE.Vector3().subVectors(b.pos, a.pos);
    const d = sep.length() || 1;
    const keepFrac = 0.7 + Math.random() * 0.2;
    const aNewMass = a.mass + b.mass * keepFrac * 0.4;
    const ejected = total - aNewMass;
    const oldMass = a.mass;
    a.mass = aNewMass;
    const totalP = new THREE.Vector3()
      .addScaledVector(a.vel, oldMass)
      .addScaledVector(b.vel, b.mass);
    const nFrag = 4 + Math.floor(Math.random() * 5);
    let pRem = totalP.clone();
    let mRem = ejected;
    const speed = new THREE.Vector3().subVectors(a.vel, b.vel).length();
    for (let i = 0; i < nFrag; i++) {
      const fm = (i === nFrag - 1) ? mRem : mRem / (nFrag - i) * rand(1.4, 0.5);
      mRem -= fm;
      const dir = new THREE.Vector3(rand(1,-1), rand(0.4,-0.4), rand(1,-1)).normalize();
      const sp = speed * rand(1.4, 0.6) + 200;
      const fr = Math.cbrt(fm / ((b.density() || 3000) * (4/3) * Math.PI));
      const off = (a.radius + fr) * 1.05;
      const frag = new Body({
        name: `frag ${b.name.slice(0, 6)} #${i+1}`,
        kind: 'asteroid',
        mass: Math.max(fm, 1e15),
        radius: Math.max(fr, 100),
        x: a.pos.x + dir.x * off + sep.x * 0.5,
        y: a.pos.y + dir.y * off + sep.y * 0.5,
        z: a.pos.z + dir.z * off + sep.z * 0.5,
        vx: a.vel.x + dir.x * sp,
        vy: a.vel.y + dir.y * sp,
        vz: a.vel.z + dir.z * sp,
        composition: { ...b.composition },
        label: false,
      });
      pRem.x -= frag.vel.x * frag.mass;
      pRem.y -= frag.vel.y * frag.mass;
      pRem.z -= frag.vel.z * frag.mass;
      this.add(frag);
    }
    a.vel.copy(pRem).divideScalar(a.mass);
    b.dead = true;
    a._visualDirty = true;
    this.addEvent(`${b.name} shattered`, 'bad');
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
        this.addEvent(`${b.name} → red giant`, 'warn');
      } else {
        b.state = 'supergiant';
        b.radius *= 250;
        b.temperature = 3000;
        this.addEvent(`${b.name} → supergiant`, 'warn');
      }
      b._visualDirty = true;
    } else if (b.state === 'red_giant' && b.age > lifeSec + 1e9 * YEAR) {
      b.kind = 'whitedwarf';
      b.state = 'white_dwarf';
      b.mass = Math.min(1.4 * M_SUN, b.mass * 0.5);
      b.radius = R_EARTH * 0.8;
      b.temperature = 30000;
      this.addEvent(`${b.name} → white dwarf`, 'warn');
      b._visualDirty = true;
    } else if (b.state === 'supergiant' && b.age > lifeSec + 1e6 * YEAR) {
      const m = b.mass / M_SUN;
      if (m > 25) {
        b.kind = 'bh';
        b.state = 'black_hole';
        b.radius = Math.max(2 * G * b.mass / (C_LIGHT * C_LIGHT), 1000);
        this.addEvent(`${b.name} → black hole`, 'bad');
      } else {
        b.kind = 'neutron';
        b.state = 'neutron_star';
        b.mass = Math.min(2.0 * M_SUN, b.mass * 0.15);
        b.radius = 1.2e4;
        b.temperature = 1e6;
        this.addEvent(`${b.name} → neutron star`, 'bad');
      }
      b._visualDirty = true;
    }
  }
}

// ============================ Texture URLs ============================
const TEX_ROOT_JET = 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/';
const TEX_ROOT_THREE = 'https://threejs.org/examples/textures/planets/';

const TEXTURE_URLS = {
  sun:         TEX_ROOT_JET   + 'sunmap.jpg',
  mercury:     TEX_ROOT_JET   + 'mercurymap.jpg',
  venus:       TEX_ROOT_JET   + 'venusmap.jpg',
  earth:       TEX_ROOT_THREE + 'earth_atmos_2048.jpg',
  earthClouds: TEX_ROOT_THREE + 'earth_clouds_1024.png',
  earthSpec:   TEX_ROOT_THREE + 'earth_specular_2048.jpg',
  moon:        TEX_ROOT_THREE + 'moon_1024.jpg',
  mars:        TEX_ROOT_JET   + 'marsmap1k.jpg',
  jupiter:     TEX_ROOT_JET   + 'jupitermap.jpg',
  saturn:      TEX_ROOT_JET   + 'saturnmap.jpg',
  saturnRing:  TEX_ROOT_JET   + 'saturnringcolor.jpg',
  uranus:      TEX_ROOT_JET   + 'uranusmap.jpg',
  neptune:     TEX_ROOT_JET   + 'neptunemap.jpg',
  galaxy:      TEX_ROOT_JET   + 'galaxy_starfield.png',
};

class TextureLib {
  constructor(loader) {
    this.loader = loader;
    this.cache = new Map();
    this.fallbacks = new Map();
  }
  get(key) {
    if (!key || !TEXTURE_URLS[key]) return null;
    if (this.cache.has(key)) return this.cache.get(key);
    const tex = this.loader.load(TEXTURE_URLS[key],
      (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; },
      undefined,
      () => { /* loading error — texture stays blank, material falls back to color */ });
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(key, tex);
    return tex;
  }
}

// Procedural fallback color per kind
function fallbackColor(kind) {
  return ({
    rock: '#a07a5a', gas: '#d4a070', moon: '#aaa', asteroid: '#7a7a7a',
    comet: '#a0c8e0', star: '#fff7d8', dwarf: '#ff8a3a',
    neutron: '#dffaff', whitedwarf: '#e0eaff', bh: '#000',
  })[kind] || '#888';
}

// Map a body to a texture key (used for solar system named bodies & generic kinds)
function textureKeyForBody(b) {
  if (b.textureKey && TEXTURE_URLS[b.textureKey]) return b.textureKey;
  const n = b.name.toLowerCase();
  if (n.includes('mercury')) return 'mercury';
  if (n.includes('venus'))   return 'venus';
  if (n.includes('earth'))   return 'earth';
  if (n.includes('mars'))    return 'mars';
  if (n.includes('jupiter')) return 'jupiter';
  if (n.includes('saturn'))  return 'saturn';
  if (n.includes('uranus'))  return 'uranus';
  if (n.includes('neptune')) return 'neptune';
  if (n.includes('moon') || n === 'luna') return 'moon';
  if (n.includes('sun') || n.includes('sol')) return 'sun';
  // generic kinds
  if (b.kind === 'gas') {
    // pick deterministic from id
    const choices = ['jupiter', 'saturn', 'uranus', 'neptune'];
    return choices[b.id % choices.length];
  }
  if (b.kind === 'rock') {
    const choices = ['mars', 'mercury', 'venus'];
    return choices[b.id % choices.length];
  }
  if (b.kind === 'moon')  return 'moon';
  if (b.kind === 'star')  return 'sun';
  if (b.kind === 'dwarf') return 'sun';
  return null;
}

// ============================ Visual factory =========================
class BodyVisuals {
  constructor(scene, textures) {
    this.scene = scene;
    this.tex = textures;
    this.sphereGeo = new THREE.SphereGeometry(1, 48, 32);
    this.sphereGeo.userData.shared = true;
    this.sphereGeoLow = new THREE.SphereGeometry(1, 20, 14);
    this.sphereGeoLow.userData.shared = true;
  }
  build(b) {
    const group = new THREE.Group();
    group.userData.body = b;
    const tk = textureKeyForBody(b);
    const isCompact = b.isCompact();
    const isStar = b.isStar() && !isCompact;
    const detail = (b.kind === 'asteroid' || b.kind === 'comet') ? 'low' : 'high';
    const geo = detail === 'high' ? this.sphereGeo : this.sphereGeoLow;

    let surfaceMesh;
    if (b.kind === 'bh') {
      // event horizon: pure black sphere
      const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      surfaceMesh = new THREE.Mesh(geo, mat);
      // photon ring (thin emissive torus)
      const ringG = new THREE.TorusGeometry(1.4, 0.04, 16, 64);
      const ringM = new THREE.MeshBasicMaterial({ color: 0xFFB347, transparent: true, opacity: 0.85 });
      const ring = new THREE.Mesh(ringG, ringM);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      // accretion disk
      const diskG = new THREE.RingGeometry(1.7, 4.5, 96, 8);
      const diskM = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPos;
          void main() {
            vUv = uv;
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vPos;
          uniform float uTime;
          float hash(float p) { return fract(sin(p*127.1)*43758.5453); }
          void main() {
            float r = length(vPos.xy);
            float a = atan(vPos.y, vPos.x);
            float band = sin(r * 6.0 - uTime * 1.5 + a * 8.0) * 0.5 + 0.5;
            float fall = smoothstep(4.5, 1.7, r);
            vec3 hot = mix(vec3(1.0, 0.55, 0.15), vec3(1.0, 0.95, 0.7), band);
            float alpha = fall * (0.55 + 0.4 * band);
            gl_FragColor = vec4(hot, alpha);
          }`,
      });
      const disk = new THREE.Mesh(diskG, diskM);
      disk.rotation.x = Math.PI / 2.05;
      group.add(disk);
      group.userData.disk = disk;
    } else if (isCompact) {
      const color = b.kind === 'neutron' ? 0xDFFAFF : 0xE0EAFF;
      const mat = new THREE.MeshBasicMaterial({ color });
      surfaceMesh = new THREE.Mesh(geo, mat);
      // tiny glow
      const glow = makeGlowSprite(b.kind === 'neutron' ? 0xAEE0FF : 0xCAD8FF, 6, 0.85);
      group.add(glow);
      group.userData.glow = glow;
    } else if (isStar) {
      const map = tk ? this.tex.get(tk) : null;
      const [r, g, bl] = stellarColor(b.temperature || 5800);
      const tint = new THREE.Color(r/255, g/255, bl/255);
      const mat = new THREE.MeshBasicMaterial({ map: map || null, color: tint });
      surfaceMesh = new THREE.Mesh(geo, mat);
      const glow = makeGlowSprite(tint.getHex(), 5, 0.95);
      group.add(glow);
      group.userData.glow = glow;
      // light source attached to star
      const light = new THREE.PointLight(tint.getHex(), 3.0, 0, 0); // no decay so distant planets still lit
      group.add(light);
      group.userData.light = light;
    } else {
      const map = tk ? this.tex.get(tk) : null;
      const fallback = new THREE.Color(b.color || fallbackColor(b.kind));
      // base color is the kind's fallback — the texture multiplies on top when loaded.
      // If the texture fails or hasn't arrived yet, we still see a plausible color.
      const mat = new THREE.MeshStandardMaterial({
        map: map || null,
        color: fallback,
        roughness: b.kind === 'gas' ? 0.9 : 0.85,
        metalness: 0.0,
      });
      // when texture finishes loading, bump color back to white so the texture renders untinted
      if (map) {
        const checkLoaded = () => {
          if (map.image && map.image.complete && map.image.naturalWidth > 0) {
            mat.color.setRGB(1, 1, 1);
            mat.needsUpdate = true;
            return true;
          }
          return false;
        };
        if (!checkLoaded()) {
          const onLoadHandler = () => { checkLoaded(); };
          map.source?.data?.addEventListener?.('load', onLoadHandler, { once: true });
        }
      }
      surfaceMesh = new THREE.Mesh(geo, mat);

      // Earth-like cloud shell
      if (tk === 'earth') {
        const cloudsMap = this.tex.get('earthClouds');
        const cloudsMat = new THREE.MeshStandardMaterial({
          map: cloudsMap || null,
          transparent: true,
          opacity: 0.7,
          alphaTest: 0.02,
          depthWrite: false,
          roughness: 1,
        });
        const clouds = new THREE.Mesh(this.sphereGeo, cloudsMat);
        clouds.scale.setScalar(1.015);
        surfaceMesh.add(clouds);
        group.userData.clouds = clouds;
      }
      // Saturn-like rings
      if (tk === 'saturn' || b.kind === 'gas' && b.id % 5 === 0) {
        const ringMap = this.tex.get('saturnRing');
        const ringG = new THREE.RingGeometry(1.4, 2.3, 96, 4);
        const ringM = new THREE.MeshBasicMaterial({
          map: ringMap || null,
          color: ringMap ? 0xffffff : 0xC8B89A,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        // remap UVs so the texture wraps radially across the ring
        const ringG2 = ringG;
        const uvs = ringG2.attributes.uv.array;
        const pos = ringG2.attributes.position.array;
        for (let i = 0; i < uvs.length / 2; i++) {
          const x = pos[i*3], y = pos[i*3+1];
          uvs[i*2] = (Math.hypot(x,y) - 1.4) / 0.9;
          uvs[i*2+1] = 0.5;
        }
        ringG2.attributes.uv.needsUpdate = true;
        const ring = new THREE.Mesh(ringG2, ringM);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = b.tilt;
        group.add(ring);
        group.userData.ring = ring;
      }
      // Atmosphere glow for terrestrials with greenhouse
      if (b.greenhouse > 0.05 && b.kind === 'rock') {
        const atmo = makeAtmosphereMesh(this.sphereGeo, 0x6BA6FF, 1.06);
        group.add(atmo);
        group.userData.atmo = atmo;
      }
      // Comet coma + tail (added at render time as billboard sprite for tail)
      if (b.kind === 'comet') {
        const coma = makeGlowSprite(0xB6D6FF, 3, 0.7);
        group.add(coma);
        group.userData.coma = coma;
      }
    }

    group.userData.surface = surfaceMesh;
    group.add(surfaceMesh);

    // axial tilt + initial orientation
    group.rotation.z = b.tilt;

    // pickable invisible sphere so we can always select even tiny bodies
    const pickGeo = new THREE.SphereGeometry(1, 12, 8);
    const pickMat = new THREE.MeshBasicMaterial({ visible: false });
    const pick = new THREE.Mesh(pickGeo, pickMat);
    pick.userData.body = b;
    pick.userData.isPicker = true;
    group.add(pick);
    group.userData.pick = pick;

    this.scene.add(group);
    return group;
  }

  rebuild(b) {
    if (b.node) {
      this.scene.remove(b.node);
      disposeGroup(b.node);
    }
    b.node = this.build(b);
  }
}

function disposeGroup(g) {
  g.traverse((o) => {
    if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose?.();
    if (o.material) {
      const m = o.material;
      if (Array.isArray(m)) m.forEach(x => x.dispose?.());
      else m.dispose?.();
    }
  });
}

// glow sprite (radial gradient texture cached once per color)
const glowTextureCache = new Map();
function getGlowTexture(colorHex) {
  if (glowTextureCache.has(colorHex)) return glowTextureCache.get(colorHex);
  const c = new THREE.Color(colorHex);
  const size = 128;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = size;
  const ctx = cnv.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  const r = Math.round(c.r * 255), gg = Math.round(c.g * 255), b = Math.round(c.b * 255);
  g.addColorStop(0, `rgba(${r},${gg},${b},1)`);
  g.addColorStop(0.25, `rgba(${r},${gg},${b},0.55)`);
  g.addColorStop(0.55, `rgba(${r},${gg},${b},0.15)`);
  g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  glowTextureCache.set(colorHex, tex);
  return tex;
}
function makeGlowSprite(colorHex, scale, opacity) {
  const mat = new THREE.SpriteMaterial({
    map: getGlowTexture(colorHex),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(scale);
  return s;
}

function makeAtmosphereMesh(geo, colorHex, scale) {
  const c = new THREE.Color(colorHex);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: c } },
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      void main() {
        float i = pow(0.7 - dot(vNormal, vec3(0,0,1.0)), 2.5);
        gl_FragColor = vec4(uColor, i);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.scale.setScalar(scale);
  return m;
}

function stellarColor(T) {
  let r, g, b;
  if (T < 3500)       { r=255; g=110; b=60; }
  else if (T < 5000)  { r=255; g=180; b=110; }
  else if (T < 6500)  { r=255; g=230; b=190; }
  else if (T < 8000)  { r=230; g=230; b=255; }
  else if (T < 15000) { r=190; g=200; b=255; }
  else                { r=160; g=180; b=255; }
  return [r, g, b];
}

// ============================ Scenarios ===============================
const scenarios = {
  solar: {
    name: 'Solar System',
    build(sim) {
      sim.add(new Body({ name:'Sun', kind:'star', mass: M_SUN, radius: R_SUN, composition: COMP_STAR, temperature: T_SUN, textureKey:'sun' }));
      const ecliptic = (a, vMag, inclRad = 0) => {
        const ang = Math.random() * TAU;
        const cx = Math.cos(ang) * a, cz = Math.sin(ang) * a;
        const cy = (Math.random() - 0.5) * a * inclRad;
        const vx = -Math.sin(ang) * vMag * Math.cos(inclRad);
        const vz =  Math.cos(ang) * vMag * Math.cos(inclRad);
        return [cx, cy, cz, vx, 0, vz];
      };
      const planets = [
        ['Mercury','rock', 0.055 * M_EARTH, 0.383 * R_EARTH, 0.387 * AU, 47.36e3, 0.12, 0.0,  COMP_ROCK, 0.05],
        ['Venus',  'rock', 0.815 * M_EARTH, 0.949 * R_EARTH, 0.723 * AU, 35.02e3, 0.77, 0.85, COMP_ROCK, 0.02],
        ['Earth',  'rock', M_EARTH,         R_EARTH,         AU,         29.78e3, 0.30, 0.25, COMP_ROCK, 0.0 ],
        ['Mars',   'rock', 0.107 * M_EARTH, 0.532 * R_EARTH, 1.524 * AU, 24.07e3, 0.25, 0.07, COMP_ROCK, 0.03],
        ['Jupiter','gas',  318 * M_EARTH,   11.21 * R_EARTH, 5.20 * AU,  13.07e3, 0.50, 0.0,  COMP_GAS,  0.02],
        ['Saturn', 'gas',   95 * M_EARTH,    9.45 * R_EARTH, 9.58 * AU,   9.69e3, 0.34, 0.0,  COMP_GAS,  0.04],
        ['Uranus', 'gas',   14.5* M_EARTH,   4.01 * R_EARTH, 19.2 * AU,   6.81e3, 0.30, 0.0,  COMP_ICE,  0.01],
        ['Neptune','gas',   17.1* M_EARTH,   3.88 * R_EARTH, 30.1 * AU,   5.43e3, 0.30, 0.0,  COMP_ICE,  0.03],
      ];
      for (const [n, kind, m, r, a, v, al, gh, comp, incl] of planets) {
        const [x, y, z, vx, vy, vz] = ecliptic(a, v, incl);
        const p = new Body({
          name: n, kind, mass: m, radius: r,
          x, y, z, vx, vy, vz,
          composition: comp, albedo: al, greenhouse: gh,
        });
        sim.add(p);
        if (n === 'Earth') {
          const moonAng = Math.random() * TAU;
          const moonD = 384400e3;
          const moonV = 1.022e3;
          sim.add(new Body({
            name: 'Moon', kind: 'moon', mass: M_MOON, radius: R_MOON,
            x: p.pos.x + Math.cos(moonAng) * moonD, y: p.pos.y, z: p.pos.z + Math.sin(moonAng) * moonD,
            vx: p.vel.x - Math.sin(moonAng) * moonV, vy: 0, vz: p.vel.z + Math.cos(moonAng) * moonV,
            composition: COMP_ROCK, albedo: 0.12,
          }));
        }
      }
    },
  },

  earthMoon: {
    name: 'Earth & Moon',
    build(sim) {
      sim.add(new Body({
        name:'Earth', kind:'rock', mass: M_EARTH, radius: R_EARTH,
        composition: COMP_ROCK, albedo: 0.3, greenhouse: 0.25, tilt: 0.4,
      }));
      sim.add(new Body({
        name:'Moon', kind:'moon', mass: M_MOON, radius: R_MOON,
        x: 384400e3, vz: 1.022e3, composition: COMP_ROCK, albedo: 0.12,
      }));
      sim.add(new Body({
        name:'Sun', kind:'star', mass: M_SUN, radius: R_SUN,
        x: -AU, composition: COMP_STAR, temperature: T_SUN, textureKey:'sun',
        fixed: true,
      }));
    },
  },

  binary: {
    name: 'Binary Stars',
    build(sim) {
      const m1 = 1.5 * M_SUN, m2 = 1.0 * M_SUN;
      const sep = 2 * AU;
      const total = m1 + m2;
      const r1 = sep * m2 / total, r2 = sep * m1 / total;
      const v = Math.sqrt(G * total / sep);
      const v1 = v * m2 / total, v2 = v * m1 / total;
      sim.add(new Body({ name:'Alpha', kind:'star', mass:m1, radius:1.3*R_SUN, x:-r1, vz:-v1, composition:COMP_STAR, temperature:6500, textureKey:'sun' }));
      sim.add(new Body({ name:'Beta',  kind:'star', mass:m2, radius:R_SUN,     x: r2, vz: v2, composition:COMP_STAR, temperature:5800, textureKey:'sun' }));
      const a = 4 * AU;
      sim.add(new Body({
        name:'Circumbinary', kind:'rock', mass: 3 * M_EARTH, radius: 1.4 * R_EARTH,
        x: a, vz: Math.sqrt(G * total / a),
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
      sim.add(new Body({ name:'A', kind:'star', mass:m, radius:R_SUN, x:-d, vz:-v, composition:COMP_STAR, temperature:5500, textureKey:'sun' }));
      sim.add(new Body({ name:'B', kind:'star', mass:m, radius:R_SUN, x: d, vz: v, composition:COMP_STAR, temperature:5500, textureKey:'sun' }));
      sim.add(new Body({ name:'C', kind:'star', mass:m, radius:R_SUN, z: d * 1.4, vx: v * 0.9, composition:COMP_STAR, temperature:5500, textureKey:'sun' }));
    },
  },

  trappist: {
    name: 'TRAPPIST-1 Analog',
    build(sim) {
      sim.add(new Body({ name:'TRAPPIST-1', kind:'dwarf', mass: 0.089 * M_SUN, radius: 0.12 * R_SUN, composition:COMP_STAR, temperature: 2566, textureKey:'sun' }));
      const dists = [0.0115, 0.0158, 0.0223, 0.0293, 0.0385, 0.0469, 0.0619];
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
          x: Math.cos(ang) * a, z: Math.sin(ang) * a,
          vx:-Math.sin(ang) * v, vz: Math.cos(ang) * v,
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
        composition: COMP_GAS, tilt: 0.3,
      });
      sim.add(planet);
      const n = 80;
      for (let i = 0; i < n; i++) {
        const a = (1.8 + Math.random() * 1.2) * planet.radius;
        const v = Math.sqrt(G * planet.mass / a);
        const ang = Math.random() * TAU;
        const y = (Math.random() - 0.5) * planet.radius * 0.06;
        sim.add(new Body({
          name:`m${i}`, kind:'asteroid',
          mass: 1e18 * rand(2, 0.4), radius: 5e4 * rand(2, 0.5),
          x: Math.cos(ang) * a, y, z: Math.sin(ang) * a,
          vx:-Math.sin(ang) * v, vz: Math.cos(ang) * v,
          composition: COMP_ICE, albedo: 0.5, label: false, trailMax: 20,
        }));
      }
    },
  },

  collision: {
    name: 'Galaxy Collision',
    build(sim) {
      const make = (cx, cy, cz, vx, vy, vz, name, n) => {
        const M = 1e10 * M_SUN;
        const core = new Body({ name, kind:'bh', mass: M, radius: 2*G*M/(C_LIGHT*C_LIGHT),
          x:cx, y:cy, z:cz, vx, vy, vz, composition: COMP_STAR });
        sim.add(core);
        for (let i = 0; i < n; i++) {
          const a = (0.3 + Math.random() * 1.5) * 100 * LY;
          const ang = Math.random() * TAU;
          const upY = (Math.random() - 0.5) * a * 0.2;
          const v = Math.sqrt(G * M / a);
          sim.add(new Body({
            name:'·', kind:'star', mass: 0.5 * M_SUN * rand(3, 0.3),
            radius: R_SUN * 0.7, label:false, trailMax: 20,
            x: cx + Math.cos(ang) * a, y: cy + upY, z: cz + Math.sin(ang) * a,
            vx: vx - Math.sin(ang) * v, vy, vz: vz + Math.cos(ang) * v,
            composition: COMP_STAR, temperature: rand(7000, 3500),
            textureKey: 'sun',
          }));
        }
      };
      make(-400 * LY, 0,    0,  3e4, 1e4, 0, 'Core A', 70);
      make( 400 * LY, 0, 60*LY, -3e4, -1e4, 0, 'Core B', 70);
    },
  },

  whackamole: {
    name: 'Mercury Whack-a-Mole',
    build(sim) {
      sim.add(new Body({ name:'Sun', kind:'star', mass:M_SUN, radius:R_SUN, composition:COMP_STAR, temperature:T_SUN, textureKey:'sun' }));
      for (let i = 0; i < 30; i++) {
        const a = (0.3 + Math.random() * 0.4) * AU;
        const v = Math.sqrt(G * M_SUN / a) * rand(1.05, 0.95);
        const ang = Math.random() * TAU;
        const incl = (Math.random() - 0.5) * a * 0.08;
        sim.add(new Body({
          name:`m${i+1}`, kind:'rock',
          mass: 0.055 * M_EARTH * rand(1.5, 0.4),
          radius: 0.383 * R_EARTH * rand(1.3, 0.7),
          x: Math.cos(ang) * a, y: incl, z: Math.sin(ang) * a,
          vx:-Math.sin(ang) * v, vz: Math.cos(ang) * v,
          composition: COMP_ROCK, label: false, trailMax: 40,
        }));
      }
    },
  },

  blackhole: {
    name: 'Sun → Black Hole',
    build(sim) {
      sim.add(new Body({ name:'Sgr (was Sun)', kind:'bh', mass: M_SUN, radius: 2*G*M_SUN/(C_LIGHT*C_LIGHT), composition:COMP_STAR }));
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
          x: Math.cos(ang) * a, z: Math.sin(ang) * a,
          vx:-Math.sin(ang) * v, vz: Math.cos(ang) * v,
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
        x: -50 * AU, y: 0, z: 30 * AU, vx: 15e3, vy: 0, vz: -8e3,
        composition: COMP_STAR, temperature: 4500, textureKey: 'sun',
      }));
    },
  },

  empty: { name: 'Empty Space', build() {} },
};

// ============================ Speed presets ==========================
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

// ============================ Spawn presets =========================
const spawnPresets = {
  rock:     { kind:'rock',     mass: M_EARTH,      radius: R_EARTH,     composition: COMP_ROCK, albedo: 0.3,  greenhouse: 0.2,  name:'Planet' },
  gas:      { kind:'gas',      mass: M_JUP,        radius: R_JUP,       composition: COMP_GAS,  albedo: 0.5,  greenhouse: 0.0,  name:'Gas giant' },
  moon:     { kind:'moon',     mass: M_MOON,       radius: R_MOON,      composition: COMP_ROCK, albedo: 0.12, greenhouse: 0.0,  name:'Moon' },
  asteroid: { kind:'asteroid', mass: 1e18,         radius: 5e4,         composition: COMP_ROCK, albedo: 0.1,  greenhouse: 0.0,  name:'Asteroid', label: false },
  comet:    { kind:'comet',    mass: 1e14,         radius: 5e3,         composition: COMP_ICE,  albedo: 0.04, greenhouse: 0.0,  name:'Comet' },
  star:     { kind:'star',     mass: M_SUN,        radius: R_SUN,       composition: COMP_STAR, temperature: 5800, name:'Star' },
  dwarf:    { kind:'dwarf',    mass: 0.3 * M_SUN,  radius: 0.35 * R_SUN, composition: COMP_STAR, temperature: 3500, name:'Red dwarf' },
  bh:       { kind:'bh',       mass: 10 * M_SUN,   radius: 2*G*(10*M_SUN)/(C_LIGHT*C_LIGHT), composition: COMP_STAR, name:'Black hole' },
};

// ============================ Three.js scene =========================
class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020410);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 1e12);
    this.camera.position.set(toScene(2 * AU), toScene(1.5 * AU), toScene(2 * AU));
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.65;
    this.controls.panSpeed = 0.85;
    this.controls.zoomSpeed = 0.95;
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 1e11;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    this.controls.screenSpacePanning = true;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    // load textures
    const loadMgr = new THREE.LoadingManager();
    this.textureLoader = new THREE.TextureLoader(loadMgr);
    this.textureLoader.setCrossOrigin('anonymous');
    this.textures = new TextureLib(this.textureLoader);

    this.loadingPromise = new Promise(resolve => {
      loadMgr.onLoad = resolve;
      loadMgr.onError = () => {}; // tolerated; we proceed with whatever loaded
      setTimeout(resolve, 6000); // safety: never block longer than 6s
    });
    this.loadProgress = (frac) => {};
    loadMgr.onProgress = (url, loaded, total) => {
      this.loadProgress(loaded / Math.max(total, 1));
    };

    this.bodyVisuals = new BodyVisuals(this.scene, this.textures);

    // preload all textures up front so onProgress + onLoad fire
    for (const key of Object.keys(TEXTURE_URLS)) this.textures.get(key);

    // milky way skybox (large inverted sphere)
    const skyGeo = new THREE.SphereGeometry(1e10, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.textures.get('galaxy'),
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      transparent: false,
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.sky.renderOrder = -1000;
    this.scene.add(this.sky);

    // procedural starfield in addition to skybox (point cloud, lots of stars at infinity)
    this.scene.add(makeStarfield(6000, 1e9));

    // ecliptic grid (kept off by default)
    this.grid = new THREE.PolarGridHelper(toScene(50 * AU), 16, 24, 64, 0x223355, 0x18243a);
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.25;
    this.grid.visible = false;
    this.scene.add(this.grid);

    // trails group + line cache
    this.trailGroup = new THREE.Group();
    this.scene.add(this.trailGroup);
    this.trailLines = new Map(); // body.id -> Line

    // velocity vectors
    this.velocityGroup = new THREE.Group();
    this.velocityGroup.visible = false;
    this.scene.add(this.velocityGroup);

    // postprocessing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.85, 0.15);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    // selection ring
    this.selectionRing = makeSelectionRing();
    this.selectionRing.visible = false;
    this.scene.add(this.selectionRing);

    // drag preview line + ghost sphere
    this.dragLine = makeDragLine();
    this.dragLine.visible = false;
    this.scene.add(this.dragLine);
    this.dragGhost = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0x62E1FF, wireframe: true, transparent: true, opacity: 0.6 })
    );
    this.dragGhost.visible = false;
    this.scene.add(this.dragGhost);

    // labels (DOM)
    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'labels';
    document.body.appendChild(this.labelLayer);
    this.labelMap = new Map(); // body.id -> div

    // resize listener
    window.addEventListener('resize', () => this.onResize());
  }

  setBloom(on) {
    this.bloom.enabled = on;
    this.bloom.strength = on ? 0.45 : 0;
  }
  setSky(on) {
    this.sky.visible = on;
  }
  setGrid(on) { this.grid.visible = on; }
  setVel(on) { this.velocityGroup.visible = on; }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
  }

  attach(b) {
    b.node = this.bodyVisuals.build(b);
  }
  detach(b) {
    if (b.node) {
      this.scene.remove(b.node);
      disposeGroup(b.node);
      b.node = null;
    }
    const line = this.trailLines.get(b.id);
    if (line) {
      this.trailGroup.remove(line);
      line.geometry.dispose();
      line.material.dispose();
      this.trailLines.delete(b.id);
    }
    const lbl = this.labelMap.get(b.id);
    if (lbl) { this.labelLayer.removeChild(lbl); this.labelMap.delete(b.id); }
  }

  framePoints(points) {
    if (points.length === 0) return;
    const box = new THREE.Box3();
    for (const p of points) box.expandByPoint(p);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const dist = maxDim / (2 * Math.tan(this.camera.fov * Math.PI / 360)) * 1.6;
    const offset = new THREE.Vector3(dist * 0.6, dist * 0.45, dist * 0.6);
    this.controls.target.copy(center);
    this.camera.position.copy(center).add(offset);
    this.controls.update();
  }
}

// procedural starfield (background point cloud)
function makeStarfield(n, radius) {
  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // uniform on a sphere
    const u = Math.random() * 2 - 1;
    const phi = Math.random() * TAU;
    const r = radius * (0.7 + Math.random() * 0.3);
    const s = Math.sqrt(1 - u*u);
    positions[i*3] = r * s * Math.cos(phi);
    positions[i*3+1] = r * u;
    positions[i*3+2] = r * s * Math.sin(phi);
    // mild color variance (white→bluish→yellowish)
    const c = Math.random();
    let r1 = 1, g1 = 1, b1 = 1;
    if (c < 0.2) { r1 = 0.7; g1 = 0.8; b1 = 1.0; }
    else if (c < 0.4) { r1 = 1.0; g1 = 0.95; b1 = 0.8; }
    const I = 0.4 + Math.random() * 0.6;
    colors[i*3] = r1 * I;
    colors[i*3+1] = g1 * I;
    colors[i*3+2] = b1 * I;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const m = new THREE.PointsMaterial({
    vertexColors: true,
    size: 1.0,
    sizeAttenuation: false,
    transparent: true,
    depthWrite: false,
  });
  const pts = new THREE.Points(g, m);
  pts.renderOrder = -500;
  return pts;
}

function makeSelectionRing() {
  const g = new THREE.RingGeometry(1.2, 1.26, 64);
  const m = new THREE.MeshBasicMaterial({ color: 0x62E1FF, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false });
  const ring = new THREE.Mesh(g, m);
  return ring;
}
function makeDragLine() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const m = new THREE.LineBasicMaterial({ color: 0x62E1FF, transparent: true, opacity: 0.9 });
  const line = new THREE.Line(g, m);
  line.frustumCulled = false;
  return line;
}

// ============================ Trail rendering =========================
function ensureTrailLine(world, b, color = 0x6FAEFF) {
  let line = world.trailLines.get(b.id);
  if (line) return line;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(b.trailMax * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 });
  line = new THREE.Line(geo, mat);
  line.frustumCulled = false;
  world.trailGroup.add(line);
  world.trailLines.set(b.id, line);
  return line;
}
function updateTrail(world, b) {
  const t = b.trail;
  if (t.length < 6) return;
  const line = ensureTrailLine(world, b, b.isStar() ? 0xFFB347 : (b.kind === 'gas' ? 0xD4A070 : 0x8EC1FF));
  const positions = line.geometry.attributes.position.array;
  const max = b.trailMax;
  const count = Math.floor(t.length / 3);
  const start = Math.max(0, count - max);
  let k = 0;
  for (let i = start; i < count; i++, k++) {
    positions[k*3]   = toScene(t[i*3]);
    positions[k*3+1] = toScene(t[i*3+1]);
    positions[k*3+2] = toScene(t[i*3+2]);
  }
  line.geometry.attributes.position.needsUpdate = true;
  line.geometry.setDrawRange(0, k);
}

// ============================ Application =============================
const canvas = document.getElementById('stage');
const splash = document.getElementById('splash');
const splashFill = document.getElementById('splashFill');
const splashStatus = document.getElementById('splashStatus');

const sim = new Simulator();
const world = new World(canvas);

// state
let tool = 'select';
let spawnKind = 'rock';
let speedIdx = 6;
let visualMult = 1;          // visual size multiplier (1× → 10000× via slider scaling)
let followSel = false;
let selected = null;
let hovered = null;
let dragState = null;
let laserHold = null;
let lastFrame = performance.now();
let fpsValue = 60;
let fpsAccum = 0;
let fpsLast = 0;

// progress UI
function setSplashProgress(frac, msg) {
  splashFill.style.width = `${Math.round(frac * 100)}%`;
  if (msg) splashStatus.textContent = msg;
}
setSplashProgress(0.05, 'Booting renderer…');

world.loadProgress = (frac) => {
  setSplashProgress(0.2 + frac * 0.7, `Loading textures · ${Math.round(frac * 100)}%`);
};

function hideSplash() {
  setSplashProgress(1, 'Ready');
  setTimeout(() => splash.classList.add('gone'), 350);
}

// scenarios populate dropdown
const sel = document.getElementById('scenarioSel');
for (const k of Object.keys(scenarios)) {
  const opt = document.createElement('option');
  opt.value = k; opt.textContent = scenarios[k].name;
  sel.appendChild(opt);
}

function loadScenario(key) {
  // detach old visuals
  for (const b of sim.bodies) world.detach(b);
  sim.clear();
  nextId = 1;
  scenarios[key].build(sim);
  for (const b of sim.bodies) world.attach(b);
  selected = null;
  updateInspector();
  frameAll();
  sim.addEvent(`Loaded · ${scenarios[key].name}`, 'good');
}

sim.onCollision = (b) => world.detach(b);

// ============================ Input ===================================
const raycaster = new THREE.Raycaster();
raycaster.params.Mesh.threshold = 0;
const pickPlane = new THREE.Plane();
const pickPoint = new THREE.Vector3();

function pointerNDC(e) {
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = -((e.clientY / window.innerHeight) * 2 - 1);
  return [x, y];
}

function pickBody(e) {
  const [x, y] = pointerNDC(e);
  raycaster.setFromCamera({ x, y }, world.camera);
  // intersect pickers
  const targets = [];
  for (const b of sim.bodies) {
    if (b.node && b.node.userData.pick) targets.push(b.node.userData.pick);
  }
  const hits = raycaster.intersectObjects(targets, false);
  if (hits.length === 0) return null;
  return hits[0].object.userData.body || null;
}

// Project a 2D pointer onto a plane through the orbit target perpendicular to camera-forward.
// Returns a THREE.Vector3 in scene coordinates (units), null if behind camera.
function projectToWorldPlane(e, anchor) {
  const [x, y] = pointerNDC(e);
  raycaster.setFromCamera({ x, y }, world.camera);
  const normal = new THREE.Vector3();
  world.camera.getWorldDirection(normal);
  pickPlane.setFromNormalAndCoplanarPoint(normal, anchor);
  const out = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(pickPlane, out)) return null;
  return out;
}

// Convert scene-unit point to meters Vector3
function sceneToMetersV(v) {
  return new THREE.Vector3(toMeters(v.x), toMeters(v.y), toMeters(v.z));
}

let pendingClick = null;          // for click-vs-drag in select mode

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return; // left only
  pendingClick = { x: e.clientX, y: e.clientY, hit: null };
  const hit = pickBody(e);
  pendingClick.hit = hit;

  if (tool === 'select') {
    // let OrbitControls rotate; we decide select/no-select on pointerup
    return;
  }

  // For other tools, stop OrbitControls from seeing this pointerdown
  e.stopImmediatePropagation();

  if (tool === 'spawn') {
    const anchor = world.controls.target.clone();
    const point = projectToWorldPlane(e, anchor);
    if (!point) return;
    dragState = { mode: 'spawn', anchorScene: point.clone(), endScene: point.clone() };
    showSpawnGhost(point, spawnKind);
    updateDragLine(point, point);
  } else if (tool === 'launch') {
    if (!hit && !selected) return;
    const body = hit || selected;
    selected = body;
    updateInspector();
    const start = bodyScenePos(body);
    dragState = { mode: 'launch', body, anchorScene: start, endScene: start.clone() };
    updateDragLine(start, start);
  } else if (tool === 'laser') {
    if (hit) laserHold = { target: hit };
  } else if (tool === 'delete') {
    if (hit) {
      sim.addEvent(`${hit.name} deleted`, 'warn');
      if (selected === hit) selected = null;
      sim.remove(hit);
      world.detach(hit);
      updateInspector();
    }
  }
}, { capture: true });

window.addEventListener('pointermove', (e) => {
  // click-vs-drag tracking
  if (pendingClick) {
    const dx = e.clientX - pendingClick.x, dy = e.clientY - pendingClick.y;
    if (dx*dx + dy*dy > 25) pendingClick = null; // > 5 px movement = drag, not click
  }

  // update hover
  hovered = pickBody(e);
  canvas.style.cursor =
    (hovered && tool === 'select') ? 'pointer'
    : (tool === 'spawn' || tool === 'laser') ? 'crosshair'
    : (tool === 'delete' && hovered) ? 'not-allowed'
    : 'default';

  if (!dragState) return;

  if (dragState.mode === 'spawn') {
    const p = projectToWorldPlane(e, dragState.anchorScene);
    if (p) {
      dragState.endScene.copy(p);
      updateDragLine(dragState.anchorScene, dragState.endScene);
      showDragHintForSpawn(e);
    }
  } else if (dragState.mode === 'launch') {
    const start = bodyScenePos(dragState.body);
    const p = projectToWorldPlane(e, start);
    if (p) {
      dragState.anchorScene.copy(start);
      dragState.endScene.copy(p);
      updateDragLine(start, p);
      showDragHintForLaunch(e);
    }
  }
});

window.addEventListener('pointerup', (e) => {
  if (laserHold) laserHold = null;

  // Click-to-select in select mode (only if not a drag and on the same body we hit at down)
  if (tool === 'select' && pendingClick) {
    const hit = pendingClick.hit;
    if (hit !== selected) {
      selected = hit; // null clears
      updateInspector();
    }
  }
  pendingClick = null;

  if (!dragState) return;
  if (dragState.mode === 'spawn') {
    const preset = spawnPresets[spawnKind];
    const posMeters = sceneToMetersV(dragState.anchorScene);
    const dvMeters = sceneToMetersV(new THREE.Vector3().subVectors(dragState.endScene, dragState.anchorScene));
    // map "screen-distance dragged" to velocity: use perspective-aware scale ~ camera distance
    // We want |drag in units| at current zoom to map to a reasonable velocity. Use 1 unit ≈ 80 m/s.
    const k = 80;
    const opts = {
      ...preset,
      x: posMeters.x, y: posMeters.y, z: posMeters.z,
      vx: dvMeters.x / SCALE_FACTOR * k,
      vy: dvMeters.y / SCALE_FACTOR * k,
      vz: dvMeters.z / SCALE_FACTOR * k,
    };
    opts.name = preset.name + ' ' + (sim.bodies.length + 1);
    const b = new Body(opts);
    sim.add(b);
    world.attach(b);
    selected = b;
    updateInspector();
    sim.addEvent(`Spawned ${b.name}`, 'good');
  } else if (dragState.mode === 'launch') {
    const dvMeters = sceneToMetersV(new THREE.Vector3().subVectors(dragState.endScene, dragState.anchorScene));
    const k = 80;
    dragState.body.vel.set(
      dvMeters.x / SCALE_FACTOR * k,
      dvMeters.y / SCALE_FACTOR * k,
      dvMeters.z / SCALE_FACTOR * k,
    );
    sim.addEvent(`Launched ${dragState.body.name}`, 'good');
  }
  hideSpawnGhost();
  hideDragLine();
  hideDragHint();
  dragState = null;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// keyboard
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea')) return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); togglePlay(); }
  else if (k === 's') setTool('select');
  else if (k === 'a') setTool('spawn');
  else if (k === 'l') setTool('launch');
  else if (k === 'z') setTool('laser');
  else if (k === 'x') setTool('delete');
  else if (k === 'f') frameAll();
  else if (k === 'g') toggleFollow();
  else if (k === 'r') toggleReverse();
  else if (k === '[') setSpeed(speedIdx - 1);
  else if (k === ']') setSpeed(speedIdx + 1);
  else if (k === '.') stepFrame();
  else if (k === 'escape') { selected = null; updateInspector(); }
  else if (k === 'delete' || k === 'backspace') {
    if (selected) {
      sim.addEvent(`${selected.name} deleted`, 'warn');
      sim.remove(selected);
      world.detach(selected);
      selected = null;
      updateInspector();
    }
  } else if (k === '?' || (e.shiftKey && e.key === '/')) {
    document.getElementById('helpOverlay').classList.toggle('hidden');
  }
});

// ============================ UI bindings =============================
function setTool(t) {
  tool = t;
  document.querySelectorAll('.tool').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === t);
  });
  document.getElementById('spawnPanel').style.opacity = (t === 'spawn') ? '1' : '0.6';
  // OrbitControls left button: rotate only in select mode
  if (world && world.controls) {
    world.controls.mouseButtons.LEFT = (t === 'select') ? THREE.MOUSE.ROTATE : null;
  }
}
document.querySelectorAll('.tool').forEach(b => {
  b.addEventListener('click', () => setTool(b.dataset.tool));
});

document.querySelectorAll('.spawn').forEach(b => {
  b.addEventListener('click', () => {
    spawnKind = b.dataset.spawn;
    document.querySelectorAll('.spawn').forEach(x => x.classList.toggle('active', x === b));
    if (tool !== 'spawn') setTool('spawn');
  });
});

function setSpeed(idx) {
  speedIdx = clamp(idx, 0, speedPresets.length - 1);
  const slider = document.getElementById('speedSlider');
  slider.value = speedIdx;
  document.getElementById('speedLabel').textContent = speedPresets[speedIdx].label;
  const s = speedPresets[speedIdx].s;
  if (s < HOUR)        sim.substeps = 1;
  else if (s < DAY)    sim.substeps = 2;
  else if (s < 30*DAY) sim.substeps = 4;
  else if (s < YEAR)   sim.substeps = 6;
  else if (s < 100*YEAR) sim.substeps = 10;
  else if (s < 1e4*YEAR) sim.substeps = 20;
  else                 sim.substeps = 40;
  updateRangeFill(slider);
}
document.getElementById('speedSlider').addEventListener('input', (e) => {
  setSpeed(parseInt(e.target.value, 10));
});

function togglePlay() {
  sim.paused = !sim.paused;
  const playIcon = document.getElementById('playIcon');
  if (sim.paused) {
    playIcon.innerHTML = '<path d="M7 5v14l12-7z" fill="currentColor"/>';
  } else {
    playIcon.innerHTML = '<path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/>';
  }
}
document.getElementById('playBtn').addEventListener('click', togglePlay);

function toggleReverse() {
  sim.reverse = !sim.reverse;
  document.getElementById('reverseBtn').classList.toggle('active', sim.reverse);
}
document.getElementById('reverseBtn').addEventListener('click', toggleReverse);

function stepFrame() {
  sim.paused = true;
  document.getElementById('playIcon').innerHTML = '<path d="M7 5v14l12-7z" fill="currentColor"/>';
  sim.step(speedPresets[speedIdx].s * 0.05);
}
document.getElementById('stepBtn').addEventListener('click', stepFrame);

document.getElementById('reloadBtn').addEventListener('click', () => loadScenario(sel.value));
sel.addEventListener('change', () => loadScenario(sel.value));

// display toggles
document.getElementById('showTrails').addEventListener('change', (e) => {
  world.trailGroup.visible = e.target.checked;
});
document.getElementById('showLabels').addEventListener('change', (e) => {
  world.labelLayer.style.display = e.target.checked ? '' : 'none';
});
document.getElementById('showGrid').addEventListener('change', (e) => world.setGrid(e.target.checked));
document.getElementById('showVel').addEventListener('change', (e) => world.setVel(e.target.checked));
document.getElementById('showBloom').addEventListener('change', (e) => world.setBloom(e.target.checked));
document.getElementById('showStarfield').addEventListener('change', (e) => world.setSky(e.target.checked));

// view buttons
function frameAll() {
  const pts = sim.bodies.map(b => new THREE.Vector3(toScene(b.pos.x), toScene(b.pos.y), toScene(b.pos.z)));
  if (pts.length === 0) {
    world.controls.target.set(0, 0, 0);
    world.camera.position.set(toScene(2 * AU), toScene(1.5 * AU), toScene(2 * AU));
    world.controls.update();
    return;
  }
  world.framePoints(pts);
}
function toggleFollow() {
  followSel = !followSel;
  document.getElementById('followBtn').classList.toggle('active', followSel);
}
document.getElementById('frameAllBtn').addEventListener('click', frameAll);
document.getElementById('followBtn').addEventListener('click', toggleFollow);

// size multiplier: slider value v → mult = 10^v (so 0→1×, 1→10×, 2→100×, 4→10000×)
const sizeMultEl = document.getElementById('sizeMult');
const sizeMultVal = document.getElementById('sizeMultVal');
sizeMultEl.addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  visualMult = Math.pow(10, v);
  sizeMultVal.textContent = visualMult >= 1000 ? Math.round(visualMult) + '×' : visualMult.toFixed(visualMult < 10 ? 2 : 0) + '×';
  updateRangeFill(e.target);
});

// help overlay
document.getElementById('helpBtn').addEventListener('click', () => {
  document.getElementById('helpOverlay').classList.remove('hidden');
});
document.getElementById('helpClose').addEventListener('click', () => {
  document.getElementById('helpOverlay').classList.add('hidden');
});

// inspector — update range fill for all ranges + initial values
function updateRangeFill(input) {
  const min = parseFloat(input.min), max = parseFloat(input.max), val = parseFloat(input.value);
  const pct = ((val - min) / (max - min)) * 100;
  input.style.setProperty('--rangeFill', pct + '%');
}
document.querySelectorAll('input[type=range]').forEach(r => {
  r.addEventListener('input', () => updateRangeFill(r));
  updateRangeFill(r);
});

function bindSlider(id, valId, applyFn, fmtFn) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    if (!selected) return;
    applyFn(selected, parseFloat(el.value));
    if (valId) document.getElementById(valId).textContent = fmtFn(selected);
    updateRangeFill(el);
  });
}
bindSlider('massSlider', 'massVal',
  (b, v) => {
    b.mass = (b._massBase ?? (b._massBase = b.mass)) * Math.pow(10, v);
    if (b.kind === 'bh') b.radius = Math.max(2*G*b.mass/(C_LIGHT*C_LIGHT), 1000);
  },
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

document.getElementById('bodyName').addEventListener('change', (e) => {
  if (selected) { selected.name = e.target.value || 'Body'; }
});
document.getElementById('stopBtn').addEventListener('click', () => {
  if (!selected) return;
  selected.vel.set(0, 0, 0);
  sim.addEvent(`Stopped ${selected.name}`, 'warn');
});
document.getElementById('circOrbitBtn').addEventListener('click', () => {
  if (!selected) return;
  const b = selected;
  let parent = null, bestPull = 0;
  for (const o of sim.bodies) {
    if (o === b) continue;
    const r2 = o.pos.distanceToSquared(b.pos);
    const a = G * o.mass / r2;
    if (a > bestPull) { bestPull = a; parent = o; }
  }
  if (!parent) { sim.addEvent('No parent body found', 'bad'); return; }
  const sep = new THREE.Vector3().subVectors(b.pos, parent.pos);
  const r = sep.length();
  const speed = Math.sqrt(G * (parent.mass + b.mass) / r);
  // velocity tangent in ecliptic (xz) plane
  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3().crossVectors(up, sep).normalize();
  b.vel.copy(parent.vel).addScaledVector(tangent, speed);
  sim.addEvent(`Circularized ${b.name} around ${parent.name}`, 'good');
});
document.getElementById('igniteBtn').addEventListener('click', () => {
  if (!selected) return;
  const b = selected;
  if (b.mass < 0.08 * M_SUN) {
    b.mass = 0.08 * M_SUN;
    sim.addEvent(`Boosted ${b.name} to brown-dwarf mass`, 'warn');
  }
  b.kind = b.mass > 0.5 * M_SUN ? 'star' : 'dwarf';
  b.composition = COMP_STAR;
  b.radius = R_SUN * Math.pow(b.mass / M_SUN, 0.8);
  b.temperature = b.kind === 'star' ? 5800 : 3500;
  b.state = 'main_sequence';
  b.age = 0;
  b._visualDirty = true;
  sim.addEvent(`${b.name} ignited!`, 'good');
  updateInspector();
});
document.getElementById('deleteBtn').addEventListener('click', () => {
  if (!selected) return;
  sim.addEvent(`${selected.name} deleted`, 'warn');
  sim.remove(selected);
  world.detach(selected);
  selected = null;
  updateInspector();
});

// ============================ Inspector view =========================
function updateInspector() {
  const empty = document.getElementById('inspectEmpty');
  const body = document.getElementById('inspectBody');
  if (!selected) {
    empty.classList.remove('hidden');
    body.classList.add('hidden');
    world.selectionRing.visible = false;
    return;
  }
  empty.classList.add('hidden');
  body.classList.remove('hidden');
  const b = selected;
  document.getElementById('bodyName').value = b.name;
  document.getElementById('bodyTypeBadge').textContent = b.kind;

  const stateEl = document.getElementById('bodyStateBadge');
  stateEl.textContent = b.state.replace(/_/g, ' ');
  stateEl.className = 'badge';
  if (b.temperature > 1000) stateEl.classList.add('hot');
  else if (b.temperature < 250) stateEl.classList.add('cold');
  if (b.isCompact()) stateEl.classList.add('dead');

  const zoneEl = document.getElementById('bodyZoneBadge');
  if (b.isTerrestrial() && b.temperature > 260 && b.temperature < 310) {
    zoneEl.textContent = 'habitable';
    zoneEl.className = 'badge life';
    zoneEl.style.display = '';
  } else {
    zoneEl.style.display = 'none';
  }

  document.getElementById('statMass').textContent = fmtMass(b.mass);
  document.getElementById('statRadius').textContent = fmtRadius(b.radius);
  document.getElementById('statTemp').textContent =
    b.temperature.toFixed(0) + ' K · ' + (b.temperature - 273.15).toFixed(0) + ' °C';
  document.getElementById('statGrav').textContent = (b.surfaceGravity() / G_EARTH).toFixed(2) + ' g';
  document.getElementById('statEscape').textContent = fmt(b.escapeVelocity(), ' m/s');
  document.getElementById('statDensity').textContent = (b.density() / 1000).toFixed(2) + ' g/cm³';
  document.getElementById('statAge').textContent = fmtTime(b.age);

  let parent = null, bestPull = 0;
  for (const o of sim.bodies) {
    if (o === b) continue;
    const r2 = o.pos.distanceToSquared(b.pos);
    const a = G * o.mass / r2;
    if (a > bestPull) { bestPull = a; parent = o; }
  }
  if (parent && parent.mass > b.mass * 0.5) {
    const r = b.pos.distanceTo(parent.pos);
    const T = 2 * Math.PI * Math.sqrt(r * r * r / (G * (parent.mass + b.mass)));
    document.getElementById('statPeriod').textContent = fmtTime(T) + ' · ' + parent.name;
  } else {
    document.getElementById('statPeriod').textContent = '—';
  }

  // composition bar + legend
  const cbar = document.getElementById('compBar');
  const cleg = document.getElementById('compLegend');
  cbar.innerHTML = ''; cleg.innerHTML = '';
  const entries = Object.entries(b.composition).sort((a,b) => b[1] - a[1]);
  for (const [k, v] of entries) {
    if (v < 0.005) continue;
    const seg = document.createElement('div');
    seg.className = 'comp-seg';
    seg.style.width = (v * 100) + '%';
    seg.style.background = compColor(k);
    seg.title = `${k}: ${(v * 100).toFixed(1)}%`;
    cbar.appendChild(seg);
    const lg = document.createElement('span');
    lg.innerHTML = `<i style="background:${compColor(k)}"></i>${k} ${(v*100).toFixed(0)}%`;
    cleg.appendChild(lg);
  }

  // reset slider baselines so 0 = current
  b._massBase = b.mass;
  b._radBase = b.radius;
  b._rotBase = b.rotationPeriod;
  const set = (id, v) => {
    const el = document.getElementById(id);
    el.value = v;
    updateRangeFill(el);
  };
  set('massSlider', 0); set('radiusSlider', 0); set('rotSlider', 0);
  set('albedoSlider', b.albedo); set('ghSlider', b.greenhouse);
  document.getElementById('massVal').textContent = fmtMass(b.mass);
  document.getElementById('radiusVal').textContent = fmtRadius(b.radius);
  document.getElementById('albedoVal').textContent = b.albedo.toFixed(2);
  document.getElementById('ghVal').textContent = b.greenhouse.toFixed(2);
  document.getElementById('rotVal').textContent = fmtTime(b.rotationPeriod);

  // selection ring
  world.selectionRing.visible = true;
}

// ============================ Drag visuals ===========================
function bodyScenePos(b) {
  return new THREE.Vector3(toScene(b.pos.x), toScene(b.pos.y), toScene(b.pos.z));
}
function updateDragLine(a, b) {
  const arr = world.dragLine.geometry.attributes.position.array;
  arr[0] = a.x; arr[1] = a.y; arr[2] = a.z;
  arr[3] = b.x; arr[4] = b.y; arr[5] = b.z;
  world.dragLine.geometry.attributes.position.needsUpdate = true;
  world.dragLine.visible = true;
}
function hideDragLine() {
  world.dragLine.visible = false;
}
function showSpawnGhost(point, kind) {
  const preset = spawnPresets[kind];
  world.dragGhost.position.copy(point);
  const r = Math.max(toScene(preset.radius) * effectiveSizeMult(), 0.05);
  world.dragGhost.scale.setScalar(r);
  world.dragGhost.visible = true;
}
function hideSpawnGhost() {
  world.dragGhost.visible = false;
}
function effectiveSizeMult() {
  return visualMult;
}
const dragHintEl = document.getElementById('dragHint');
function showDragHint(e, text) {
  dragHintEl.textContent = text;
  dragHintEl.classList.remove('hidden');
  dragHintEl.style.left = (e.clientX + 16) + 'px';
  dragHintEl.style.top = (e.clientY + 16) + 'px';
}
function hideDragHint() { dragHintEl.classList.add('hidden'); }
function showDragHintForSpawn(e) {
  const dv = new THREE.Vector3().subVectors(dragState.endScene, dragState.anchorScene);
  const v = dv.length() * SCALE_FACTOR / SCALE_FACTOR * 80; // scene units * 80 m/s/unit
  showDragHint(e, `v = ${fmt(v, ' m/s')}`);
}
function showDragHintForLaunch(e) {
  const dv = new THREE.Vector3().subVectors(dragState.endScene, dragState.anchorScene);
  const v = dv.length() * 80;
  showDragHint(e, `${dragState.body.name} → v = ${fmt(v, ' m/s')}`);
}

// ============================ Per-frame visual update ================
function bodyVisualRadius(b, distanceToCamera) {
  // physical radius in scene units, scaled by visualMult, with minimum apparent size for visibility
  let r = toScene(b.radius) * effectiveSizeMult();
  // ensure body covers at least ~minPx pixels (in NDC, scale = r/dist * focal)
  const fov = world.camera.fov * Math.PI / 180;
  const projFactor = (window.innerHeight / 2) / Math.tan(fov / 2);
  const minPx = b.isStar() ? 4 : 3;
  const minR = (minPx * distanceToCamera) / projFactor;
  if (r < minR) r = minR;
  return r;
}

function updateBodyVisuals() {
  const camPos = world.camera.position;
  for (const b of sim.bodies) {
    if (!b.node) world.attach(b);
    if (b._visualDirty) {
      world.bodyVisuals.rebuild(b);
      b._visualDirty = false;
    }
    const node = b.node;
    if (!node) continue;
    const sp = bodyScenePos(b);
    node.position.copy(sp);
    const dist = camPos.distanceTo(sp);
    const r = bodyVisualRadius(b, dist);
    // surface scales
    const surface = node.userData.surface;
    if (surface) surface.scale.setScalar(r);
    if (node.userData.clouds) node.userData.clouds.rotation.y += 0.0006;
    if (node.userData.atmo) node.userData.atmo.scale.setScalar(r * 1.06);
    if (node.userData.ring) node.userData.ring.scale.setScalar(r);
    if (node.userData.disk) {
      node.userData.disk.scale.setScalar(r);
      node.userData.disk.material.uniforms.uTime.value = sim.time * 1e-7;
    }
    if (node.userData.coma) node.userData.coma.scale.setScalar(r * 3.5);
    if (node.userData.glow) {
      const gscale = r * (b.isStar() ? 5.5 : 3.5);
      node.userData.glow.scale.setScalar(gscale);
    }
    if (node.userData.pick) node.userData.pick.scale.setScalar(Math.max(r * 1.2, dist * 0.005));
    if (surface) {
      // apply spin around y axis
      surface.rotation.y = b.spinAngle;
    }
    node.rotation.z = b.tilt;
    // update trail
    updateTrail(world, b);
  }
}

function updateSelectionRing() {
  if (!selected) { world.selectionRing.visible = false; return; }
  const sp = bodyScenePos(selected);
  world.selectionRing.position.copy(sp);
  const dist = world.camera.position.distanceTo(sp);
  const r = bodyVisualRadius(selected, dist) * 1.8;
  world.selectionRing.scale.setScalar(r);
  world.selectionRing.lookAt(world.camera.position);
  world.selectionRing.visible = true;
}

function updateLabels() {
  if (world.labelLayer.style.display === 'none') return;
  const showLabels = document.getElementById('showLabels').checked;
  const camPos = world.camera.position;
  for (const b of sim.bodies) {
    if (!b.labelEnabled || !showLabels) {
      const lbl = world.labelMap.get(b.id);
      if (lbl) lbl.style.display = 'none';
      continue;
    }
    let lbl = world.labelMap.get(b.id);
    if (!lbl) {
      lbl = document.createElement('div');
      lbl.className = 'label3d';
      world.labelLayer.appendChild(lbl);
      world.labelMap.set(b.id, lbl);
    }
    const sp = bodyScenePos(b);
    const proj = sp.clone().project(world.camera);
    if (proj.z < -1 || proj.z > 1) { lbl.style.display = 'none'; continue; }
    lbl.style.display = '';
    lbl.textContent = b.name;
    lbl.classList.toggle('selected', b === selected);
    lbl.classList.toggle('hover', b === hovered && b !== selected);
    const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
    lbl.style.left = sx + 'px';
    lbl.style.top = sy + 'px';
  }
  // clean up labels for removed bodies
  for (const [id, lbl] of world.labelMap) {
    if (!sim.bodies.find(b => b.id === id)) {
      world.labelLayer.removeChild(lbl);
      world.labelMap.delete(id);
    }
  }
}

function updateVelocityVectors() {
  if (!world.velocityGroup.visible) return;
  // rebuild simply each frame (small N)
  while (world.velocityGroup.children.length) {
    const c = world.velocityGroup.children.pop();
    c.geometry?.dispose?.();
    c.material?.dispose?.();
  }
  for (const b of sim.bodies) {
    const v = b.vel.length();
    if (v < 1) continue;
    const sp = bodyScenePos(b);
    const dir = b.vel.clone().normalize();
    const len = Math.min(60, Math.log10(v + 1) * 14);
    const end = sp.clone().addScaledVector(dir, len);
    const g = new THREE.BufferGeometry().setFromPoints([sp, end]);
    const m = new THREE.LineBasicMaterial({ color: 0xFFB347, transparent: true, opacity: 0.7 });
    world.velocityGroup.add(new THREE.Line(g, m));
  }
}

// ============================ Camera follow ==========================
function updateFollow() {
  if (!followSel || !selected) return;
  const target = bodyScenePos(selected);
  world.controls.target.lerp(target, 0.18);
  // also slide camera by the same delta
  const delta = target.clone().sub(world.controls.target).multiplyScalar(0.18);
  world.camera.position.add(delta);
}

// ============================ Laser ==================================
function updateLaser(dt) {
  if (!laserHold) return;
  const target = laserHold.target;
  if (target.dead) { laserHold = null; return; }
  // chip mass
  const dm = Math.max(1e16, target.mass * 0.003) * dt * 30;
  target.mass = Math.max(target.mass - dm, 1e15);
  target.radius = Math.cbrt(target.mass / (target.density() || 3000) * 3 / (4 * Math.PI));
  if (target.mass <= 1e15) {
    sim.addEvent(`${target.name} vaporized`, 'warn');
    if (selected === target) selected = null;
    sim.remove(target);
    world.detach(target);
    laserHold = null;
    updateInspector();
  }
}

// ============================ Main loop ==============================
function tick(now) {
  const dtReal = Math.min((now - lastFrame) / 1000, 1/30);
  lastFrame = now;

  if (!sim.paused) {
    sim.step(speedPresets[speedIdx].s * dtReal);
  }
  updateLaser(dtReal);

  updateFollow();
  world.controls.update();
  updateBodyVisuals();
  updateSelectionRing();
  updateVelocityVectors();
  updateLabels();

  // sky position follows camera (so it's always at "infinity")
  world.sky.position.copy(world.camera.position);

  // bottom bar
  fpsAccum++;
  if (now - fpsLast > 500) {
    fpsValue = Math.round(fpsAccum * 1000 / (now - fpsLast));
    fpsAccum = 0; fpsLast = now;
    document.getElementById('fps').textContent = fpsValue;
  }
  document.getElementById('nBodies').textContent = sim.bodies.length;
  document.getElementById('simTime').textContent = fmtTime(sim.time);
  const camDist = world.camera.position.distanceTo(world.controls.target);
  document.getElementById('zoomLbl').textContent = fmtDist(camDist * SCALE_FACTOR);
  let totalMass = 0;
  for (const b of sim.bodies) totalMass += b.mass;
  document.getElementById('totalMass').textContent = fmtMass(totalMass);

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

  // update inspector live values
  if (selected) {
    document.getElementById('statTemp').textContent =
      selected.temperature.toFixed(0) + ' K · ' + (selected.temperature - 273.15).toFixed(0) + ' °C';
    document.getElementById('statAge').textContent = fmtTime(selected.age);
  }

  world.composer.render();
  requestAnimationFrame(tick);
}

// ============================ Init ===================================
async function init() {
  setSplashProgress(0.15, 'Loading textures…');
  await world.loadingPromise;
  setSplashProgress(0.9, 'Building scene…');

  setSpeed(speedIdx);
  setTool('select');
  // playing initially -> show pause icon
  document.getElementById('playIcon').innerHTML = '<path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/>';
  loadScenario('solar');

  // init size slider display
  sizeMultEl.value = 0;
  visualMult = 1;
  sizeMultVal.textContent = '1×';

  requestAnimationFrame(tick);
  hideSplash();
}
init();
