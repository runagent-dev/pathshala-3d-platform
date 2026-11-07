// The charges, drawn as the book draws them: a red disc with a white "+" for a positive charge and a blue disc with a
// white "−" for a negative one (the sign is always drawn: never colour alone). All the "+" are one InstancedMesh and
// all the "−" another (two draws for every charge in the scene), turned to face the camera and kept the same size on
// the screen however the view turns.
//
// The electrons: each one is an "−" that lives on a sphere's surface at a direction from its centre. When the
// figure asks for a new arrangement, every electron gets a target place (as few as possible move, by the shortest
// trips); the movers glide along the surface (over the side that faces the camera, so the student sees them go),
// and from one sphere to the other only through the point where they touch.
import * as THREE from 'three';
import { assign, R } from './reading.js';

export const COLORS = { plus: '#e03131', minus: '#1971c2', edge: '#10213a' };
const SPEED = 0.075; // m/s along the surface: slow enough to follow

function chipTexture(sign) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.edge;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 10, 0, Math.PI * 2);
  ctx.fillStyle = sign === '+' ? COLORS.plus : COLORS.minus;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 15;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(S * 0.27, S / 2);
  ctx.lineTo(S * 0.73, S / 2);
  if (sign === '+') {
    ctx.moveTo(S / 2, S * 0.27);
    ctx.lineTo(S / 2, S * 0.73);
  }
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * One kind of chip ('+' or '−'), `count` of them. Each chip: `anchor` (world point), `size` (diameter, m), `scale`
 * (0 hides it), and how it keeps clear of what it sits on: `centre` (on a sphere: drawn in front of the whole sphere,
 * hidden on the far side) or `push` (metres toward the camera); `shift` stacks a pair (+1 up, −1 down, in the view).
 */
function chipSet(sign, count) {
  const mat = new THREE.MeshBasicMaterial({
    name: sign === '+' ? 'PlusChip' : 'MinusChip',
    map: chipTexture(sign),
    alphaTest: 0.5,
    toneMapped: false,
  });
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, count);
  mesh.name = sign === '+' ? 'PositiveCharges' : 'NegativeCharges';
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.userData.noExport = true;
  mesh.renderOrder = 6;
  const chips = [];
  for (let i = 0; i < count; i++) chips.push({ anchor: new THREE.Vector3(), size: 0.01, scale: 0, centre: null, push: 0.002, shift: 0 });
  return { mesh, chips };
}

const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const camPos = new THREE.Vector3();
const fwd = new THREE.Vector3();
const camUp = new THREE.Vector3();
const toCam = new THREE.Vector3();
const dir = new THREE.Vector3();
const p = new THREE.Vector3();
const sc = new THREE.Vector3();
const m = new THREE.Matrix4();

export function createCharges({ plus = 64, minus = 64 } = {}) {
  const sets = { '+': chipSet('+', plus), '-': chipSet('-', minus) };
  const lastCam = new Float64Array(16);
  let dirty = true;

  function place(set) {
    const { mesh, chips } = set;
    for (let i = 0; i < chips.length; i++) {
      const c = chips[i];
      if (c.scale <= 0) {
        mesh.setMatrixAt(i, ZERO);
        continue;
      }
      let fade = 1;
      p.copy(c.anchor);
      let depth;
      if (c.centre) {
        dir.copy(c.anchor).sub(c.centre).normalize();
        toCam.copy(camPos).sub(c.centre).normalize();
        const f = dir.dot(toCam);
        fade = THREE.MathUtils.smoothstep(f, -0.24, 0.02);
        if (fade <= 0) {
          mesh.setMatrixAt(i, ZERO);
          continue;
        }
        if (c.shift) p.addScaledVector(camUp, c.shift * 0.5 * c.size);
        // in front of the whole sphere, on the same line of sight (so it is drawn where it is, never cut by the sphere)
        depth = toCam.copy(c.centre).sub(camPos).dot(fwd) - R - 0.002;
      } else {
        if (c.shift) p.addScaledVector(camUp, c.shift * 0.5 * c.size);
        depth = toCam.copy(p).sub(camPos).dot(fwd) - c.push;
      }
      const d0 = toCam.copy(p).sub(camPos).dot(fwd);
      const k = d0 > 1e-4 ? Math.min(1, Math.max(0.05, depth / d0)) : 1;
      p.sub(camPos).multiplyScalar(k).add(camPos);
      const s = c.size * c.scale * fade * k;
      m.compose(p, set.quaternion, sc.set(s, s, s));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  return {
    plus: sets['+'],
    minus: sets['-'],
    meshes: [sets['+'].mesh, sets['-'].mesh],
    /** Something moved: place the chips again on the next frame. */
    touch() {
      dirty = true;
    },
    /** Turns every chip to the camera; does nothing when neither the camera nor a chip changed. */
    update(camera) {
      const e = camera.matrixWorld.elements;
      let same = !dirty;
      for (let i = 0; i < 16; i++) {
        if (e[i] !== lastCam[i]) same = false;
        lastCam[i] = e[i];
      }
      if (same) return;
      dirty = false;
      camera.getWorldPosition(camPos);
      camera.getWorldDirection(fwd);
      camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
      for (const set of Object.values(sets)) {
        set.quaternion = camera.quaternion;
        place(set);
      }
    },
  };
}

// ── electrons ──────────────────────────────────────────────────────────────────────────────────────────────────

const A = new THREE.Vector3();
const B = new THREE.Vector3();

/** Unit-vector slerp: from a to b by k (0…1), into out. */
function slerpDir(a, b, k, out) {
  const th = a.angleTo(b);
  if (th < 1e-5) return out.copy(b);
  const s = Math.sin(th);
  const wa = Math.sin((1 - k) * th) / s;
  const wb = Math.sin(k * th) / s;
  return out.set(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb).normalize();
}

/**
 * The electrons of the spheres. `chips`: the "−" chips they are drawn with (one each); `centres`: each sphere's
 * centre (live Vector3s: the spheres move). Each electron starts under its own "+" (`home`: [{ sp, dir }]).
 */
export function createElectrons({ chips, centres, home, size }) {
  const list = home.map((h, i) => ({
    i,
    sp: h.sp,
    dir: new THREE.Vector3(...h.dir),
    goal: null, // { sp, dir }
    path: [], // [{ sp, a, b, len }]
    seg: 0,
    along: 0,
    delay: 0,
  }));
  let waiters = [];

  function finalOf(e) {
    return e.goal ?? { sp: e.sp, dir: e.dir };
  }
  /** A trip on one sphere from a to b, over the side that faces `front` when it is long. */
  function arc(sp, a, b, front, out) {
    const th = a.angleTo(b);
    if (th < 1e-4) return;
    if (th > 1.1) {
      const mid = new THREE.Vector3().addVectors(a, b);
      if (mid.length() < 0.2) mid.copy(front).addScaledVector(a, -front.dot(a));
      mid.normalize().addScaledVector(front, 0.9).normalize();
      out.push({ sp, a: a.clone(), b: mid, len: a.angleTo(mid) * R });
      out.push({ sp, a: mid.clone(), b: b.clone(), len: mid.angleTo(b) * R });
    } else out.push({ sp, a: a.clone(), b: b.clone(), len: th * R });
  }
  const contact = (sp, out) =>
    out
      .copy(centres[1 - sp])
      .sub(centres[sp])
      .normalize();

  /**
   * Moves the electrons to `targets` ([{ sp, dir: [x, y, z] }], one per electron). `touching`: the spheres touch, so
   * electrons may cross. `stagger` (s): the movers start one after another. `front`: toward the camera.
   */
  function setTargets(targets, { touching = false, stagger = 0, front = new THREE.Vector3(0, 0.3, 1).normalize() } = {}) {
    const tg = targets.map((t) => ({ sp: t.sp, dir: new THREE.Vector3(...t.dir) }));
    const same = (e, t) => {
      const f = finalOf(e);
      return f.sp === t.sp && f.dir.angleTo(t.dir) < 1e-3;
    };
    const cost = (e, t) => {
      if (e.sp === t.sp) return e.dir.angleTo(t.dir) * R;
      if (!touching) return Number.POSITIVE_INFINITY;
      return (e.dir.angleTo(contact(e.sp, A)) + contact(t.sp, B).angleTo(t.dir)) * R;
    };
    const pick = assign(list, tg, cost, same);
    const movers = [];
    for (const e of list) {
      const t = tg[pick[e.i]];
      if (!t) continue;
      if (same(e, t)) continue; // already there, or on its way there
      e.goal = { sp: t.sp, dir: t.dir };
      e.path = [];
      e.seg = 0;
      e.along = 0;
      if (e.sp === t.sp) arc(e.sp, e.dir, t.dir, front, e.path);
      else {
        const ca = contact(e.sp, new THREE.Vector3());
        const cb = contact(t.sp, new THREE.Vector3());
        arc(e.sp, e.dir, ca, front, e.path);
        arc(t.sp, cb, t.dir, front, e.path);
        if (!e.path.length || e.path[e.path.length - 1].sp !== t.sp) e.path.push({ sp: t.sp, a: cb, b: t.dir.clone(), len: 0 });
      }
      movers.push(e);
    }
    movers.sort((a, b) => cost(a, a.goal) - cost(b, b.goal));
    movers.forEach((e, k) => {
      e.delay = stagger * k;
    });
    write();
    return movers.length;
  }

  function finish(e) {
    e.sp = e.goal.sp;
    e.dir.copy(e.goal.dir);
    e.goal = null;
    e.path = [];
  }
  /** Moves every electron on by dt seconds; true while any still moves. */
  function tick(dt) {
    let moving = false;
    for (const e of list) {
      if (!e.goal) continue;
      moving = true;
      if (e.delay > 0) {
        e.delay -= dt;
        continue;
      }
      e.along += SPEED * dt;
      while (e.seg < e.path.length && e.along >= e.path[e.seg].len) {
        e.along -= e.path[e.seg].len;
        e.seg++;
      }
      if (e.seg >= e.path.length) {
        finish(e);
        continue;
      }
      const s = e.path[e.seg];
      e.sp = s.sp;
      slerpDir(s.a, s.b, s.len > 0 ? e.along / s.len : 1, e.dir);
    }
    write();
    if (!moving && waiters.length) {
      const w = waiters;
      waiters = [];
      for (const fn of w) fn(true);
    }
    return moving;
  }
  /** Every electron at its place now. */
  function snap() {
    for (const e of list) if (e.goal) finish(e);
    write();
    const w = waiters;
    waiters = [];
    for (const fn of w) fn(true);
  }
  function write() {
    for (const e of list) {
      const c = chips[e.i];
      c.centre = centres[e.sp];
      c.anchor.copy(e.dir).multiplyScalar(R).add(centres[e.sp]);
      c.shift = -1;
      c.size = size;
    }
  }
  return {
    list,
    setTargets,
    tick,
    snap,
    write,
    get moving() {
      return list.some((e) => e.goal);
    },
    /** Resolves when nothing moves any more (false if the wait is given up with cancelWaits). */
    settled() {
      if (!list.some((e) => e.goal)) return Promise.resolve(true);
      return new Promise((res) => waiters.push(res));
    },
    cancelWaits() {
      const w = waiters;
      waiters = [];
      for (const fn of w) fn(false);
    },
    /** Electrons on each sphere, where they are going. */
    counts() {
      const n = [0, 0];
      for (const e of list) n[finalOf(e).sp]++;
      return n;
    },
    /** Puts every electron back under its own "+". */
    home(h) {
      list.forEach((e, i) => {
        e.sp = h[i].sp;
        e.dir.set(...h[i].dir);
        e.goal = null;
        e.path = [];
      });
      write();
    },
  };
}
