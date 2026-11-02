// The physics of the coin and the card, pure functions (unit-tested in test/unit/inertia-coin-card.test.mjs), in
// metres and seconds. A flick moves the card away in a few hundredths of a second, so friction can give the coin only
// a few cm/s; with the card gone the coin falls straight into the glass (স্থিতি জড়তা). Computed once with a fixed
// small step (deterministic) and sampled by time.

export const G = 9.8; // m/s²
export const DT = 1 / 240; // s, the integration step

/** The event: how long it runs (s), how many times slower it is shown, and its kind of inertia. */
export const EVENTS = {
  coin: { scene: 'coin', duration: 0.62, slow: 10, inertia: 'rest' },
};

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

const cache = new Map();

/** Every quantity of an event at every step (cached): see sampleAt for what each holds. */
export function simulate(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const ev = EVENTS[kind];
  if (!ev) throw new Error(`no event "${kind}"`);
  const table = simulateCoin(ev);
  cache.set(kind, table);
  return table;
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
 * The state of the event at time t (s, clamped): the card (cardX, cardY, cardTilt), the coin (coinX, coinY), the
 * finger, the two speeds the figure compares (lowerV: the card, upperV: the coin), and phase ('before' | 'act' |
 * 'after').
 */
export function sampleAt(kind, t) {
  const T = simulate(kind);
  const tt = clamp(t, 0, T.duration);
  const f = tt / T.dt;
  const i = Math.min(T.n - 2, Math.floor(f));
  const k = clamp(f - i, 0, 1);
  const lerp = (col) => T[col][i] + (T[col][i + 1] - T[col][i]) * k;
  const phase = tt < T.act[0] ? 'before' : tt <= T.act[1] ? 'act' : 'after';
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
