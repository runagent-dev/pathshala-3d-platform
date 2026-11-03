// The physics of the 3D seismic survey (ত্রিমাত্রিক সিসমিক সার্ভে, book p203, topic 7.3.3), apart from the 3D so it
// can be unit-tested. Distances in metres, times in seconds, positions in the scene's frame: x to the right, y up
// (the ground's surface is y = 0), z toward the viewer (the cut face in front is z = FRONT).
//
// One assumed speed of sound in the rock, V, for every layer (a simplification the panel states). An echo from a
// boundary at depth d reaches a geophone at a horizontal distance x from the blast after t = √(x² + (2d)²) / V (the
// path down to the boundary and back up, as from a mirror image of the blast at depth 2d). For a geophone next to
// the blast (x ≈ 0) that is t = 2d / V, so d = V t / 2: the book's "উৎস থেকে জিওফোনে শব্দ আসতে কতটুকু সময় লেগেছে
// জানতে পারলেই বিভিন্ন স্তরের দূরত্ব নিখুঁতভাবে বের করা যায়".

export const V = 2500; // m/s, an assumed speed of sound in sedimentary rock (2000–3500 m/s is usual)
export const WIDTH = 2000; // the block of ground: x from −1000 to 1000
export const DEPTH_Z = 1400; // z from −700 to 700
export const FRONT = 700;
export const BOTTOM = -1400; // its bottom
/** The three reflecting boundaries on the cut face in front (their depths there, m): the book's three echoes. */
export const DEPTHS = [350, 700, 1000];
/** Where the blast is: a shot hole on the front edge, its charge a little below the surface. */
export const SOURCE = { x: -830, y: -20, z: FRONT }; // (its 20 m are left out of the times: 1 % of the shallowest echo)
/** The geophones: a grid of 6 columns × 5 rows on the surface; the first row runs along the front edge. */
export const COLS = [-750, -450, -150, 150, 450, 750];
export const ROWS = [685, 385, 85, -215, -515];
export const GEOPHONES = ROWS.flatMap((z, r) => COLS.map((x, c) => ({ x, z, row: r, col: c, i: r * COLS.length + c })));
/** The record: how long the geophones listen (s). */
export const RECORD = 1.15;
/** The structure: a dome (anticline) under the right of the grid, cut by the block's right face (so that face shows
 * the arch), with gas in its top and oil below it. Like the folds, it fades out before the front face, which stays
 * flat: there the echoes and rays are exact for flat boundaries. */
export const DOME = { x: 800, z: -200, sigma: 330 };
const DOME_H = [80, 250, 360, 280]; // how far each boundary rises over the dome's crest (m)
const FOLD_A = [26, 34, 14, 22]; // gentle folds, fading out toward the front face
export const BASE_DEPTH = 1250; // the boundary under the reservoir rock
/** Gas–oil and oil–water contacts (depths, m): gas on top of the dome, oil below it, water further down. */
export const GOC = 780;
export const OWC = 880;

const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
/** How much of the dome is felt at (x, z): 1 on its crest. */
export const domeAt = (x, z) => Math.exp(-((x - DOME.x) ** 2 + (z - DOME.z) ** 2) / (2 * DOME.sigma ** 2));
/** The height y (negative, m) of boundary k (0, 1, 2 = the three reflectors; 3 = the base of the reservoir) at (x, z). */
export function boundaryY(k, x, z) {
  const d = k < 3 ? DEPTHS[k] : BASE_DEPTH;
  const inside = 1 - smooth(FRONT - 520, FRONT - 60, z); // 0 on the front face
  const fold = FOLD_A[k] * inside * Math.sin((x + 300 + 140 * k) / 260) * Math.cos((z - 90 * k) / 340);
  return -d + inside * (fold + DOME_H[k] * domeAt(x, z));
}
/** The depth (m, positive) of boundary k under a point of the surface. */
export const depthAt = (k, x, z) => -boundaryY(k, x, z);

/** Time (s) for the echo from a flat boundary at depth d to reach a geophone x metres (horizontally) from the blast. */
export const echoTime = (x, d, v = V) => Math.sqrt(x * x + 4 * d * d) / v;
/** Depth (m) from the echo's time t (s) at the blast, there and back: d = v t / 2. */
export const depthFromTime = (t, v = V) => (v * t) / 2;
/** Horizontal distance (m) from the blast to a point of the surface. */
export const offsetOf = (x, z) => Math.hypot(x - SOURCE.x, z - SOURCE.z);
/** The time (s) each boundary's echo reaches geophone g (the boundary taken flat at its depth on the front face). */
export const arrivals = (g) => DEPTHS.map((d) => echoTime(offsetOf(g.x, g.z), d));
/** The geophones of the front row (the line in চিত্র ৭.১৩): their traces are the panel's seismogram. */
export const LINE = GEOPHONES.filter((g) => g.row === 0);
/** The time read off the first geophone (the one beside the blast), rounded as on the seismogram (0.01 s). */
export const readTime = (k) => roundTo(arrivals(LINE[0])[k], 0.01);
/** What the student finds for boundary k: the time t at the first geophone and the depth V t / 2. */
export function measure(k) {
  const t = readTime(k);
  return { k, t, d: Math.round(depthFromTime(t)), true: DEPTHS[k] };
}

/** The Ricker wavelet (a seismic "blip"), peak 1 at t = 0, of peak frequency f (Hz). */
export function ricker(t, f = 22) {
  const a = (Math.PI * f * t) ** 2;
  return (1 - 2 * a) * Math.exp(-a);
}
/** How strong each echo is (the gas under boundary 3 gives a bright echo). */
export const STRENGTH = [0.8, 0.7, 1];
/** The trace of a geophone at time t: the sum of the echoes that have arrived, and which echo is strongest there. */
export function trace(g, t) {
  const ts = arrivals(g);
  let y = 0;
  let k = -1;
  let best = 0;
  for (let i = 0; i < ts.length; i++) {
    const w = STRENGTH[i] * ricker(t - ts[i]);
    y += w;
    if (Math.abs(w) > best) {
      best = Math.abs(w);
      k = i;
    }
  }
  return { y, k: best > 0.05 ? k : -1 };
}

/** Where the ray from the blast to a geophone at x (on the front face) reflects on a flat boundary at depth d. */
export function reflectionX(gx, d) {
  // the blast is SOURCE.y below the surface: by the mirror rule the point divides the way in the ratio of the heights
  const hs = d + SOURCE.y; // from the charge down to the boundary (SOURCE.y < 0)
  const hg = d; // from the boundary up to the surface
  return SOURCE.x + ((gx - SOURCE.x) * hs) / (hs + hg);
}

export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);
/** A seeded-free shuffle (Math.random is seeded in the tests). */
export function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
