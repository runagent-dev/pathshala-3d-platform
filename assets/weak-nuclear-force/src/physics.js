// The numbers behind the figure, kept apart from the 3D so they can be unit-tested: the sizes the zoom shows (an
// atom, a nucleus, the weak nuclear force's reach), the scale bar, the β emission's timeline and how many protons
// and neutrons the nucleus has before and after it. The 3D scene is drawn in femtometres (1 fm = 10⁻¹⁵ m).

export const FM = 1e-15; // metres in one unit of the 3D scene

/** Real sizes, in metres. */
export const SIZE = {
  atom: 1e-10, // an atom is about 10⁻¹⁰ m across
  nucleon: 1.7e-15, // a proton or a neutron is about 1.7 × 10⁻¹⁵ m across
  reach: 1e-18, // the weak nuclear force acts only up to about 10⁻¹⁸ m (book, 3.2.3)
};

export const NUCLEON_R = 0.85; // fm: a proton or neutron (its radius is about 0.84 fm)
export const ATOM_R = 50000; // fm: half of 10⁻¹⁰ m
export const REACH_R = SIZE.reach / FM; // fm: 0.001, a thousandth of a femtometre

/**
 * The four fundamental forces, weakest first (as forces.json, shared by the four figures of 3.2.1–3.2.4): colour
 * and range (a power of ten in metres, or null for "infinite"). Strength is only an order: the book's numbers for
 * it do not agree with each other, so they are never put on one scale.
 */
export const FORCES = [
  { id: 'gravity', color: '#7048e8', range: null },
  { id: 'weak', color: '#2b8a3e', range: -18 },
  { id: 'em', color: '#1c7ed6', range: null },
  { id: 'strong', color: '#e8590c', range: -15 },
];

/** The radioactive nucleus the figure shows (6 protons and 8 neutrons, as in carbon-14, a β emitter). */
export const NUCLEUS = { protons: 6, neutrons: 8 };

/**
 * The three places the zoom stops at, as the radius (fm) round the point looked at that must fit in the view:
 * the whole atom, the whole nucleus, and the weak force's reach inside one neutron.
 */
export const STOPS = { atom: 64000, nucleus: 4.3, reach: 0.0017 };
export const STOP_IDS = ['atom', 'nucleus', 'reach'];
export const zoomOf = (stop) => Math.log10(STOPS[stop]); // the zoom is log10 of that radius

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smoothstep = (a, b, x) => {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};

/**
 * How far the point looked at has moved from the nucleus's centre to the changing neutron (0…1), at zoom z.
 * On the way in it turns to the neutron while the neutron is still small, then dives into it.
 */
export const focusWeight = (z) => smoothstep(zoomOf('nucleus'), -0.25, z);

/**
 * The scale bar: the longest power of ten (in metres) that fits in maxPx at pxPerFm pixels per femtometre.
 * Returns { exp, px }: a bar px pixels long labelled 10^exp m.
 */
export function scaleBar(pxPerFm, maxPx) {
  if (!(pxPerFm > 0) || !(maxPx > 0)) return { exp: 0, px: 0 };
  const n = Math.floor(Math.log10(maxPx / pxPerFm) + 1e-9); // fm exponent
  return { exp: n - 15, px: 10 ** n * pxPerFm };
}

/** How many times a bigger thing is bigger than a smaller one, as a whole power of ten (10⁻¹⁵ vs 10⁻¹⁸ → 3). */
export const powersBetween = (big, small) => Math.round(Math.log10(big / small));

// ── the β emission (slowed down a great deal: in reality it is over in far less than a billionth of a second) ──
/** Seconds from the start (as the figure shows it): the spark, the colour change, the electron's flight. */
export const BETA = {
  duration: 3.4,
  spark: [0, 1.8], // the weak force acts at a point inside the neutron
  change: [0.55, 1.15], // the neutron becomes a proton (grey → red)
  emit: 1, // the electron leaves the neutron
  fly: [1, 3], // and flies out in a straight line
  distance: 16, // fm it travels in that time (it is out of the view by then)
};

/**
 * Where the β emission is at time tSec: { phase, spark (0…1, bright in the middle), change (0…1), electron (fm
 * from where it was made, or null before), protons, neutrons, emitted }.
 */
export function betaAt(tSec) {
  const t = Math.max(0, tSec);
  const [s0, s1] = BETA.spark;
  const [c0, c1] = BETA.change;
  const [f0, f1] = BETA.fly;
  const spark = t >= s1 ? 0 : Math.sin(Math.PI * clamp01((t - s0) / (s1 - s0)));
  const change = smoothstep(c0, c1, t);
  const out = t >= BETA.emit;
  const electron = out ? BETA.distance * clamp01((t - f0) / (f1 - f0)) : null; // steady speed: nothing pushes it on
  const phase = t >= BETA.duration ? 'done' : out ? 'fly' : 'change';
  return {
    phase,
    spark,
    change,
    electron,
    protons: NUCLEUS.protons + (out ? 1 : 0),
    neutrons: NUCLEUS.neutrons - (out ? 1 : 0),
    emitted: out ? 1 : 0,
  };
}

// ── the nucleus: nucleons packed in a ball ──────────────────────────────────────
/**
 * n spheres of radius r packed round the origin (deterministic): start on a spiral, then push apart where they
 * overlap and pull everything a little toward the centre, many times. Returns [[x, y, z], …].
 */
export function packNucleons(n, r, { iterations = 400, touch = 1.94 } = {}) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const rad = Math.sqrt(1 - y * y);
    const a = i * golden;
    const k = r * 1.8;
    pts.push([Math.cos(a) * rad * k, y * k, Math.sin(a) * rad * k]);
  }
  const min = touch * r;
  for (let it = 0; it < iterations; it++) {
    for (const p of pts) for (let j = 0; j < 3; j++) p[j] *= 0.985; // toward the centre
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const a = pts[i];
        const b = pts[j];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const dz = b[2] - a[2];
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        if (d >= min) continue;
        const push = (min - d) / 2 / d;
        a[0] -= dx * push;
        a[1] -= dy * push;
        a[2] -= dz * push;
        b[0] += dx * push;
        b[1] += dy * push;
        b[2] += dz * push;
      }
  }
  // centre the cluster on the origin
  const c = [0, 1, 2].map((j) => pts.reduce((sum, p) => sum + p[j], 0) / n);
  return pts.map((p) => p.map((v, j) => +(v - c[j]).toFixed(4)));
}

/** The radius of the smallest ball round the origin that holds all the spheres. */
export const clusterRadius = (pts, r) => Math.max(...pts.map((p) => Math.hypot(...p))) + r;
