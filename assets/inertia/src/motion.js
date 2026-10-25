// The physics of the figure, pure functions (unit-tested in test/unit/inertia.test.mjs), in metres and seconds.
//
// Bus events. The bus moves along +x with an acceleration a(t) that switches on and off with short ramps (a
// sudden start or brake) or long ones (a gentle start). A standing passenger's feet are held to the floor by
// friction, so the lower body moves with the bus; the body above them balances like an inverted pendulum about
// the ankles, written in the bus's frame (where a "pseudo-force" −m·a acts on the body):
//   I θ'' = m g L sin θ + m a L cos θ − K θ − C θ',   θ > 0: leaning back (against the motion)
// with I = 1.3 m L² (a body, not a point mass) and the muscles' K, C chosen for a natural sway of about 2 s,
// damped (BALANCE). When the bus starts, the feet go and the upper body is left behind: θ grows (স্থিতি জড়তা);
// when it brakes, the feet stop and the upper body runs on: θ < 0 (গতি জড়তা).
// Stepping off a moving bus: the passenger hops down from the door step; in the air the whole body keeps the
// bus's speed; on landing friction stops the feet, and the body turns forward about them with the angular
// momentum it had (m v L = I ω) and gravity, until the hands reach the road (হুমড়ি খেয়ে পড়া).
// The coin on a card: a flick moves the card away in a few hundredths of a second, so friction can give the coin
// only a few cm/s; with the card gone the coin falls straight into the glass (স্থিতি জড়তা).
// Everything is computed once per event with a fixed small step (deterministic) and sampled by time.

export const G = 9.8; // m/s²
export const DT = 1 / 240; // s, the integration step

/** Lengths of the passenger's body (a class 9–10 student, 1.63 m tall), m. */
export const SEG = {
  ankle: 0.075, // ankle above the sole
  shin: 0.39,
  thigh: 0.41,
  torso: 0.48, // hip to shoulder
  neck: 0.07,
  head: 0.105, // radius
  upperArm: 0.28,
  forearm: 0.25,
  hand: 0.08,
  foot: 0.25,
  heel: 0.06, // the ankle is this far in front of the heel
};
export const HEIGHT = SEG.ankle + SEG.shin + SEG.thigh + SEG.torso + SEG.neck + 2 * SEG.head; // 1.635 m

/** The balance model (see the top of the file). */
export const BALANCE = { L: 0.92, shape: 1.3, wn: 2.8, zeta: 0.68 };
const IL = BALANCE.shape * BALANCE.L; // I / (m L), m
const K = G / IL + BALANCE.wn ** 2; // muscles: stiffer than gravity's tipping, so the body comes back upright
const C = 2 * BALANCE.zeta * BALANCE.wn;

/** Where things are, in the bus's own coordinates (x forward from its middle, y up from the road, z to its right). */
// stand: where the passenger stands in the aisle (x); door: the rear door (behind the rear wheel, so after he steps
// off only the back of the bus passes him, never a wheel)
export const BUS = { floor: 0.75, step: 0.4, stand: 0.2, door: -3.9, standZ: -0.45, stepZ: -0.98, landZ: -1.65, half: 1.2 };

/**
 * The events. pushes: the bus's acceleration a (m/s²) from `at` to `until` (s), switched on and off over `ramp`
 * seconds; v0: the bus's speed at t = 0 (m/s); slow: how many times slower it is shown; key: the moment the test
 * and the poster freeze (s); act: when the labels say what each part does [from, to] (s).
 */
export const EVENTS = {
  // start and brake: `duration` is the longest they may run; they end once he is upright again (endWhenUpright)
  start: { scene: 'bus', v0: 0, pushes: [{ at: 0.5, until: 1.5, a: 2.5, ramp: 0.08 }], duration: 4, slow: 3, inertia: 'rest' },
  brake: { scene: 'bus', v0: 4.5, pushes: [{ at: 0.6, until: 99, a: -3, ramp: 0.08 }], duration: 4.5, slow: 3, inertia: 'motion' },
  alight: { scene: 'bus', v0: 3, pushes: [], duration: 2.6, slow: 3, inertia: 'motion' },
  gentle: { scene: 'bus', v0: 0, pushes: [{ at: 0.5, until: 3.6, a: 0.45, ramp: 1.5 }], duration: 3.8, slow: 3, inertia: 'rest' },
  coin: { scene: 'coin', duration: 0.62, slow: 10, inertia: 'rest' },
};
export const EVENT_KEYS = ['start', 'brake', 'alight', 'coin']; // the four the student chooses from

/** The step off the bus: crouch on the door step, push off, fly, land, fall forward, end on hands and knees. */
export const HOP = { crouch: 0.42, off: 0.58, handsAt: 1.12, kneel: 0.4 };

/** The glass, the card and the coin (a ৫ টাকা coin), m; the flick (s, m/s); μ between card and coin. */
export const TABLE = {
  glass: { r: 0.034, h: 0.115, wall: 0.0025, base: 0.008 },
  card: { w: 0.1, d: 0.065, th: 0.0012 },
  coin: { r: 0.013, th: 0.002 },
  flick: 0.22, // s: the finger hits the card
  cardSpeed: 2.2, // m/s
  mu: 0.25,
};

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const smooth = (x) => {
  const k = clamp(x, 0, 1);
  return k * k * (3 - 2 * k);
};
export const roundTo = (x, step) => {
  const d = Math.max(0, Math.ceil(-Math.log10(step)));
  return +(Math.round(x / step) * step).toFixed(d);
};

/** The bus's acceleration at time t (before the "it has stopped" rule), m/s². */
export function pushAt(ev, t) {
  let a = 0;
  for (const p of ev.pushes || []) a += p.a * smooth((t - p.at) / p.ramp) * (1 - smooth((t - p.until) / p.ramp));
  return a;
}

// ── the passenger's pose ──────────────────────────────────────────────────────

/** Angles (rad from straight up; > 0 leans forward, toward +x) and arm angles (rad from straight down; > 0 forward). */
const STAND = { shin: 0, thigh: 0, torso: 0.03, head: 0, upperArm: 0.08, forearm: 0.22 };
const CROUCH = { shin: 0.42, thigh: -0.5, torso: 0.06, head: 0.06, upperArm: -0.35, forearm: -0.1 };
const LAND = { shin: 0.22, thigh: -0.26, torso: 0.06, head: 0.04, upperArm: 0.5, forearm: 0.8 };
export const POSE_KEYS = Object.keys(STAND);

const mix = (a, b, k) => {
  const out = {};
  for (const key of POSE_KEYS) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
};

/** The pose for a balance lean θ (> 0 back): the legs lean less than the trunk; the arms swing out to balance. */
export function leanPose(theta) {
  const back = Math.max(0, theta);
  const fwd = Math.max(0, -theta);
  return {
    shin: STAND.shin - 0.7 * theta,
    thigh: STAND.thigh - 0.7 * theta,
    torso: STAND.torso - 1.6 * theta,
    head: STAND.head - 1.3 * theta,
    upperArm: STAND.upperArm + 2.2 * back + 1.5 * fwd,
    forearm: STAND.forearm + 2.6 * back + 1.9 * fwd,
  };
}

/** Where the hands reach for when falling: the road, this far ahead of the shoulders (m). */
const HANDS_AHEAD = 0.2;

/** The pose while falling forward by φ (rad) about the feet: the bent knees straighten, the hands reach for the road. */
function fallPose(phi) {
  const bend = Math.max(0, 1 - phi / 0.5);
  const p = {
    shin: 0.85 * phi + LAND.shin * bend,
    thigh: 0.85 * phi + LAND.thigh * bend,
    torso: LAND.torso + 1.2 * phi,
    head: LAND.head + 0.7 * phi,
    upperArm: 0,
    forearm: 0,
  };
  const j = skeleton(p);
  return { ...p, ...reach(HANDS_AHEAD, -(j.shoulder.y - 0.035)) };
}

/** Two-link arm reaching a point (dx forward, dy up from the shoulder): the arm angles (from down, > 0 forward). */
export function reach(dx, dy, a = SEG.upperArm, b = SEG.forearm + SEG.hand * 0.6) {
  const d = clamp(Math.hypot(dx, dy), Math.abs(a - b) + 1e-4, a + b - 1e-4);
  const toward = Math.atan2(dx, -dy); // from straight down
  const inner = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const upperArm = toward - inner; // the elbow bends behind the line to the hand, as a real elbow does
  const ex = a * Math.sin(upperArm);
  const ey = -a * Math.cos(upperArm);
  return { upperArm, forearm: Math.atan2(dx - ex, -(dy - ey)) };
}

/** How far the shoulders move forward per radian as the fall begins (m/rad): ω = v / this keeps their speed. */
const SHOULDER_TURN = (skeleton(fallPose(0.01)).shoulder.x - skeleton(fallPose(0)).shoulder.x) / 0.01;

/** On hands and knees (the end of the fall): shins on the road, thighs nearly upright, hands on the road. */
const KNEEL = (() => {
  const p = { shin: 1.64, thigh: 0.4, torso: 1.4, head: 1.05, upperArm: 0, forearm: 0 };
  const j = skeleton(p);
  return { ...p, ...reach(HANDS_AHEAD * 0.8, -(j.shoulder.y - 0.035)) };
})();

/**
 * Joint positions (x forward, y up) of a pose, from the ankle at (0, SEG.ankle): ankle, knee, hip, shoulder,
 * neck, head (centre), elbow, wrist, hand (centre), chest (the middle of the trunk).
 */
export function skeleton(p, out = {}) {
  const at = (from, len, ang, up = true) => ({ x: from.x + len * Math.sin(ang), y: from.y + (up ? 1 : -1) * len * Math.cos(ang) });
  const ankle = { x: 0, y: SEG.ankle };
  const knee = at(ankle, SEG.shin, p.shin);
  const hip = at(knee, SEG.thigh, p.thigh);
  const shoulder = at(hip, SEG.torso, p.torso);
  const neck = at(shoulder, SEG.neck, p.head);
  const head = at(neck, SEG.head, p.head);
  const elbow = at(shoulder, SEG.upperArm, p.upperArm, false);
  const wrist = at(elbow, SEG.forearm, p.forearm, false);
  const hand = at(wrist, SEG.hand / 2, p.forearm, false);
  const chest = at(hip, SEG.torso * 0.72, p.torso);
  return Object.assign(out, { ankle, knee, hip, shoulder, neck, head, elbow, wrist, hand, chest });
}

// ── simulation ────────────────────────────────────────────────────────────────

const cache = new Map();

/** Every quantity of an event at every step (cached): see sampleAt for what each holds. */
export function simulate(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const ev = EVENTS[kind];
  if (!ev) throw new Error(`no event "${kind}"`);
  const table = ev.scene === 'coin' ? simulateCoin(ev) : simulateBus(kind, ev);
  cache.set(kind, table);
  return table;
}

function simulateBus(kind, ev) {
  const n = Math.round(ev.duration / DT) + 1;
  const cols = ['busX', 'busV', 'busA', 'theta', 'rootX', 'rootY', 'rootZ', 'phi', 'kneel', 'upX', 'upY', 'headX', 'feetV', 'upV', 'camX'];
  const T = { kind, scene: 'bus', dt: DT, n, duration: ev.duration };
  for (const c of cols) T[c] = new Float64Array(n);
  T.poses = new Array(n);

  let x = 0;
  let v = ev.v0;
  let th = 0;
  let om = 0;
  const alight = kind === 'alight';
  // stepping off: where and when the feet leave the step and land
  let land = null; // { t, x, z }
  let phi = 0;
  let phiV = 0;
  let handsT = null;
  let handX = null; // where the hands meet the road (from the ankles)
  const flyVy = 0.6; // m/s upward push from the step
  const tFly = (flyVy + Math.sqrt(flyVy * flyVy + 2 * G * BUS.step)) / G; // s in the air
  const outV = (BUS.landZ - BUS.stepZ) / tFly; // m/s toward the road side (−z)
  for (let i = 0; i < n; i++) {
    const t = i * DT;
    // the bus
    let a = pushAt(ev, t);
    if (v <= 0 && a < 0) a = 0; // it has stopped; brakes do not drive it backward
    T.busX[i] = x;
    T.busV[i] = v;
    T.busA[i] = a;
    // the passenger
    let pose;
    let rootX;
    let rootY = BUS.floor;
    let rootZ = BUS.standZ;
    let feetV = v;
    if (!alight) {
      T.theta[i] = th;
      pose = leanPose(th);
      rootX = x + BUS.stand;
      const acc = (G / IL) * Math.sin(th) + (a / IL) * Math.cos(th) - K * th - C * om;
      om += acc * DT;
      th += om * DT;
    } else {
      rootY = BUS.step;
      rootZ = BUS.stepZ;
      rootX = x + BUS.door;
      if (t < HOP.crouch) pose = { ...STAND };
      else if (t < HOP.off) pose = mix(STAND, CROUCH, smooth((t - HOP.crouch) / (HOP.off - HOP.crouch)));
      else if (!land || t < land.t) {
        const tau = t - HOP.off;
        const y = BUS.step + flyVy * tau - 0.5 * G * tau * tau;
        rootX = x + BUS.door; // in the air it keeps the bus's speed: the bus is right beside it
        rootY = Math.max(0, y);
        rootZ = BUS.stepZ + outV * Math.min(tau, tFly);
        pose = mix(CROUCH, LAND, smooth(tau / tFly));
        if (y <= 0 && !land) land = { t, x: rootX, z: rootZ };
      }
      if (land && t >= land.t) {
        rootX = land.x;
        rootY = 0;
        rootZ = land.z;
        feetV = 0;
        if (handsT == null) {
          // the feet stop; the upper body runs on at the speed it had (the legs give a little, as legs do), so
          // the body starts to turn forward about the feet at the rate that keeps the shoulders at that speed;
          // gravity then tips it further. The pose is drawn for the angle reached so far (0 on the step it
          // lands), then the angle moves on for the next step.
          if (phiV === 0) phiV = ev.v0 / SHOULDER_TURN;
          pose = fallPose(phi);
          T.phi[i] = phi;
          const acc = (G / IL) * Math.sin(phi) - 0.6 * phiV;
          phiV += acc * DT;
          phi += phiV * DT;
          if (phi >= HOP.handsAt) handsT = t + DT;
        }
        if (handsT != null && t >= handsT - 1e-9) {
          // the hands are on the road: they stay where they landed while the knees come down
          const k = smooth((t - handsT) / HOP.kneel);
          const from = fallPose(HOP.handsAt);
          if (handX == null) handX = skeleton(from).hand.x;
          pose = mix(from, KNEEL, k);
          const sh = skeleton(pose).shoulder;
          Object.assign(pose, reach(handX - sh.x, -(sh.y - 0.035)));
          T.phi[i] = HOP.handsAt;
          T.kneel[i] = k;
        }
      }
    }
    T.poses[i] = pose;
    T.rootX[i] = rootX;
    T.rootY[i] = rootY;
    T.rootZ[i] = rootZ;
    T.feetV[i] = feetV;
    // the upper body is followed at the shoulders (the head and shoulders are what "stays"); the head's place
    // is kept too, for the mark of where it was when the bus started
    const j = skeleton(pose);
    T.upX[i] = rootX + j.shoulder.x;
    T.upY[i] = rootY + j.shoulder.y;
    T.headX[i] = rootX + j.head.x;
    x += v * DT;
    v = Math.max(0, v + a * DT);
  }
  T.land = land;
  T.handsT = handsT;
  // the upper body's speed along the road: from the shoulders' positions (central differences)
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 2);
    const b = Math.min(n - 1, i + 2);
    T.upV[i] = b > a ? (T.upX[b] - T.upX[a]) / ((b - a) * DT) : 0;
  }
  T.act = actWindow(kind, T);
  endWhenUpright(kind, T);
  T.key = keyMoment(kind, T);
  if (kind === 'start') T.headMark = T.headX[Math.round(T.act[0] / DT)];
  followCamera(kind, T);
  return T;
}

/**
 * A start or a brake ends once he stands upright again with his upper body moving with his feet (the arrays are
 * cut there), so the last picture, the one looked at longest, shows a calm, upright passenger.
 */
function endWhenUpright(kind, T) {
  if (kind !== 'start' && kind !== 'brake') return;
  const from = Math.round(T.act[1] / DT);
  for (let i = from; i < T.n; i++) {
    if (Math.abs(T.theta[i]) < 0.02 && Math.abs(T.upV[i] - T.feetV[i]) < 0.06) {
      const n = Math.min(T.n, i + Math.round(0.3 / DT));
      for (const [k, col] of Object.entries(T)) if (col instanceof Float64Array && col.length === T.n) T[k] = col.subarray(0, n);
      T.poses = T.poses.slice(0, n);
      T.n = n;
      T.duration = roundTo((n - 1) * DT, 1e-6);
      return;
    }
  }
}

/**
 * Where the camera looks along the road. It moves on at the speed everything had at the start (a frame in which
 * the upper body, by its inertia, first stays where it is) until a moment after the push or the landing, then
 * follows the feet smoothly (critically damped, matching their speed), so the passenger never leaves the view.
 * CAMERA.lead: how far ahead of the feet it looks, before and after (the fallen passenger lies ahead of the feet).
 */
export const CAMERA = {
  hold: { start: 0.5, brake: 0.42, gentle: 0.5, alight: 0.18 },
  lead: { start: [0.3, 0.1], brake: [0.45, 0.15], gentle: [0.2, 0.1], alight: [0.15, 0.6] },
  w: 2.6,
};
function followCamera(kind, T) {
  const w = CAMERA.w;
  const [lead0, lead1] = CAMERA.lead[kind];
  const hold = T.act[0] + CAMERA.hold[kind];
  let cx = T.rootX[0] + lead0;
  let cv = T.feetV[0];
  for (let i = 0; i < T.n; i++) {
    const t = i * T.dt;
    T.camX[i] = cx;
    if (t >= hold) {
      const lead = lead0 + (lead1 - lead0) * smooth((t - hold) / 1.2);
      const acc = w * w * (T.rootX[i] + lead - cx) + 2 * w * (T.feetV[i] - cv);
      cv += acc * T.dt;
    }
    cx += cv * T.dt;
  }
  // once he is down on the road, the camera comes lower and a little closer (camLift m down, camZoom × distance)
  T.camLift = new Float64Array(T.n);
  T.camZoom = new Float64Array(T.n).fill(1);
  if (kind === 'alight')
    for (let i = 0; i < T.n; i++) {
      const k = smooth((i * T.dt - T.handsT - 0.15) / 0.9);
      T.camLift[i] = 0.55 * k;
      T.camZoom[i] = 1 - 0.22 * k;
    }
}

/**
 * When the labels say what each part does (and are true): from the push until the upper body has caught up with
 * the feet (start: its speed reaches theirs; brake: it falls to theirs); stepping off, from the landing until his
 * hands are on the road. Past that the body straightens up again.
 */
function actWindow(kind, T) {
  const ev = EVENTS[kind];
  if (kind === 'alight') return [T.land.t, T.handsT];
  const from = ev.pushes[0].at;
  if (kind === 'gentle') return [from, ev.pushes[0].until];
  const sign = kind === 'start' ? 1 : -1; // start: the upper body is slower than the feet; brake: faster
  for (let i = Math.round((from + 0.15) / DT); i < T.n; i++) if (sign * (T.upV[i] - T.feetV[i]) >= 0) return [from, i * DT];
  return [from, T.duration];
}

/** The moment that shows the idea best (the test and the poster freeze there). */
function keyMoment(kind, T) {
  if (kind === 'alight') return roundTo(T.land.t + 0.1, 0.001);
  if (kind === 'gentle') return 2.0;
  // the feet and the upper body differ most in speed (the feet carried away or stopped, the upper body still
  // nearly as it was): the last moment the difference is within 5 % of its largest, so the lean already shows
  const [from, to] = T.act;
  const d = (i) => Math.abs(T.upV[i] - T.feetV[i]);
  let best = 0;
  for (let i = Math.round(from / DT); i < Math.round(to / DT); i++) best = Math.max(best, d(i));
  let at = from;
  for (let i = Math.round(from / DT); i < Math.round(to / DT); i++) if (d(i) >= 0.95 * best) at = i * DT;
  return roundTo(at, 0.01);
}

function simulateCoin(ev) {
  const { glass, card, coin, flick, cardSpeed, mu } = TABLE;
  const n = Math.round(ev.duration / DT) + 1;
  const cols = ['cardX', 'cardY', 'cardTilt', 'cardV', 'coinX', 'coinY', 'coinV', 'finger'];
  const T = { kind: 'coin', scene: 'coin', dt: DT, n, duration: ev.duration };
  for (const c of cols) T[c] = new Float64Array(n);
  const rim = glass.h; // the card lies on the rim
  const cardY0 = rim + card.th / 2;
  const coinY0 = rim + card.th + coin.th / 2;
  const floorY = glass.base + coin.th / 2;
  let cx = 0;
  let cy = cardY0;
  let cvx = 0;
  let cvy = 0;
  let tilt = 0;
  let px = 0; // coin
  let py = coinY0;
  let pvx = 0;
  let pvy = 0;
  let onCard = true;
  let dropT = null;
  let landT = null;
  let bounced = 0;
  for (let i = 0; i < n; i++) {
    const t = i * DT;
    // the finger: comes in, strikes the card's edge at `flick`, follows through a little, stops
    const edge = -card.w / 2; // the card's back edge (the finger is behind it, at −x)
    T.finger[i] = t < flick ? edge - 0.03 * (1 - smooth(t / flick)) - 0.001 : edge + Math.min(0.025, (t - flick) * cardSpeed * 0.6);
    // the card: struck at `flick`, it shoots off along +x; past the rim it falls and turns; on the table it slides
    // to a stop
    const onTable = cy <= card.th / 2 + 1e-4;
    if (t >= flick && !onTable) cvx = Math.max(cvx, cardSpeed * smooth((t - flick) / 0.006));
    const offRim = cx - card.w / 2 > glass.r * 0.2; // its middle is past the glass: nothing holds it up
    if (onTable) {
      cy = card.th / 2;
      cvy = 0;
      tilt = Math.max(0, tilt - 20 * DT);
      cvx = Math.max(0, cvx - 0.4 * G * DT);
    } else if (offRim) {
      cvy -= G * DT;
      tilt = Math.min(0.9, tilt + 6 * DT);
    }
    T.cardX[i] = cx;
    T.cardY[i] = cy;
    T.cardTilt[i] = tilt;
    T.cardV[i] = cvx;
    // the coin: friction drags it while the card slides under it, then it falls into the glass
    if (onCard && Math.abs(px - cx) > card.w / 2) {
      onCard = false;
      dropT = t;
    }
    if (onCard) {
      if (cvx > pvx) pvx = Math.min(cvx, pvx + mu * G * DT);
    } else if (landT == null || bounced < 2) {
      pvy -= G * DT;
    }
    T.coinX[i] = px;
    T.coinY[i] = py;
    T.coinV[i] = pvx;
    cx += cvx * DT;
    cy = Math.max(card.th / 2, cy + cvy * DT);
    px += pvx * DT;
    py += pvy * DT;
    if (!onCard && py <= floorY) {
      py = floorY;
      if (landT == null) landT = t;
      pvy = bounced < 1 ? -pvy * 0.25 : 0;
      bounced++;
      pvx *= 0.3;
      if (bounced >= 2) pvx = 0;
    }
  }
  T.dropT = dropT;
  T.landT = landT;
  T.act = [flick, landT ?? ev.duration];
  T.key = roundTo(flick + 0.035, 0.001);
  return T;
}

/**
 * The state of an event at time t (s, clamped to the event): the bus (busX, busV, busA), the passenger (rootX/Y/Z
 * where the ankles are, pose, theta), the two speeds the figure compares (feetV: the lower body, upV: the upper
 * body; for the coin: cardV and coinV), camX (where the camera looks), and phase ('before' | 'act' | 'after').
 */
export function sampleAt(kind, t) {
  const T = simulate(kind);
  const tt = clamp(t, 0, T.duration);
  const f = tt / T.dt;
  const i = Math.min(T.n - 2, Math.floor(f));
  const k = clamp(f - i, 0, 1);
  const lerp = (col) => T[col][i] + (T[col][i + 1] - T[col][i]) * k;
  const phase = tt < T.act[0] ? 'before' : tt <= T.act[1] ? 'act' : 'after';
  if (T.scene === 'coin') {
    return {
      kind,
      t: tt,
      phase,
      cardX: lerp('cardX'),
      cardY: lerp('cardY'),
      cardTilt: lerp('cardTilt'),
      coinX: lerp('coinX'),
      coinY: lerp('coinY'),
      finger: lerp('finger'),
      lowerV: lerp('cardV'),
      upperV: lerp('coinV'),
      // the card has gone from under it, and it has visibly started to fall (1 cm)
      dropped: T.dropT != null && tt >= T.dropT && lerp('coinY') < T.coinY[0] - 0.01,
      landed: T.landT != null && tt >= T.landT,
    };
  }
  return {
    kind,
    t: tt,
    phase,
    busX: lerp('busX'),
    busV: lerp('busV'),
    busA: lerp('busA'),
    theta: lerp('theta'),
    rootX: lerp('rootX'),
    rootY: lerp('rootY'),
    rootZ: lerp('rootZ'),
    pose: mix(T.poses[i], T.poses[i + 1], k),
    camX: lerp('camX'),
    camLift: lerp('camLift'),
    camZoom: lerp('camZoom'),
    lowerV: lerp('feetV'),
    upperV: lerp('upV'),
    upX: lerp('upX'),
    upY: lerp('upY'),
    headMark: T.headMark ?? null,
    landed: T.land != null && tt >= T.land.t,
    kneel: lerp('kneel'),
  };
}

/** The largest lean of an event (rad; > 0 back) and when it happens (s). */
export function peakLean(kind) {
  const T = simulate(kind);
  let best = 0;
  let at = 0;
  for (let i = 0; i < T.n; i++) {
    if (Math.abs(T.theta[i]) > Math.abs(best)) {
      best = T.theta[i];
      at = i * T.dt;
    }
  }
  return { theta: best, at };
}
