// The road of চিত্র ২.০৪ (book page 39) and the maths of distance and displacement: pure functions, unit-tested in
// test/unit/distance-displacement.test.mjs. Kilometres throughout; x = east, y = north, A at the origin.
//
// The road is the one the speed-and-velocity figure (page 41) uses too: traced from the book's picture and smoothed
// (centripetal Catmull-Rom), with the book's numbers built in: B is 4 km along the road and 2.000 km from A in a
// straight line, C is 6 km along the road and only 1.311 km from A.

/** km of road between two samples */
export const STEP = 0.025;

/** [x0, y0, x1, y1, …]: a point every STEP km along the road, starting at A (km 0). */
// biome-ignore format: a table of points, eight to a line
export const ROAD = [
  0, 0,  0.0109, -0.0234,  0.0207, -0.0461,  0.0302, -0.0695,  0.0391, -0.0926,  0.0477, -0.1162,  0.0559, -0.1393,  0.0642, -0.1636,
  0.0721, -0.1872,  0.08, -0.2109,  0.0878, -0.2346,  0.0957, -0.2583,  0.1036, -0.2819,  0.1116, -0.3053,  0.1201, -0.3292,  0.1288, -0.3528,
  0.1376, -0.3759,  0.1471, -0.3992,  0.157, -0.4219,  0.1675, -0.4445,  0.179, -0.4668,  0.1914, -0.4887,  0.2048, -0.5099,  0.2195, -0.53,
  0.2356, -0.5489,  0.2532, -0.5661,  0.273, -0.5817,  0.2944, -0.5945,  0.3171, -0.6049,  0.3407, -0.6134,  0.3651, -0.6202,  0.3892, -0.6253,
  0.4136, -0.6291,  0.4388, -0.6316,  0.4639, -0.633,  0.4887, -0.6333,  0.514, -0.6326,  0.5387, -0.6311,  0.5637, -0.6287,  0.5887, -0.6254,
  0.613, -0.6215,  0.638, -0.6166,  0.6621, -0.6112,  0.6859, -0.605,  0.7102, -0.5979,  0.7342, -0.5901,  0.7576, -0.5816,  0.7804, -0.5725,
  0.8033, -0.5624,  0.826, -0.5512,  0.8477, -0.5394,  0.8696, -0.5261,  0.8898, -0.5117,  0.9094, -0.4956,  0.9278, -0.4787,  0.9451, -0.4612,
  0.962, -0.4424,  0.9778, -0.4234,  0.9933, -0.4035,  1.008, -0.3835,  1.0223, -0.3628,  1.0359, -0.3423,  1.0492, -0.3213,  1.0624, -0.2998,
  1.0754, -0.2777,  1.0878, -0.2563,  1.1, -0.2345,  1.1122, -0.2125,  1.1237, -0.1913,  1.1357, -0.1688,  1.1477, -0.1462,  1.1592, -0.1246,
  1.1706, -0.1029,  1.1826, -0.0802,  1.1941, -0.0585,  1.2062, -0.0359,  1.2178, -0.0145,  1.2301, 0.0078,  1.2424, 0.0299,  1.2543, 0.0507,
  1.2675, 0.0732,  1.2803, 0.0943,  1.2933, 0.115,  1.307, 0.1361,  1.321, 0.1567,  1.3359, 0.1775,  1.3504, 0.197,  1.366, 0.2173,
  1.3815, 0.2369,  1.3975, 0.2564,  1.413, 0.2751,  1.4297, 0.2946,  1.4458, 0.3133,  1.4622, 0.3319,  1.4788, 0.3506,  1.4955, 0.3692,
  1.5123, 0.3878,  1.5291, 0.4064,  1.546, 0.4249,  1.5629, 0.4434,  1.5797, 0.4619,  1.5964, 0.4803,  1.613, 0.4986,  1.6301, 0.5177,
  1.6463, 0.536,  1.6629, 0.5549,  1.6792, 0.5738,  1.6951, 0.5926,  1.7112, 0.6121,  1.7269, 0.6315,  1.7426, 0.6516,  1.7576, 0.6715,
  1.7719, 0.6913,  1.7864, 0.7125,  1.8, 0.7336,  1.8125, 0.7544,  1.8246, 0.7766,  1.8357, 0.7992,  1.8455, 0.8223,  1.8539, 0.8455,
  1.8617, 0.8688,  1.8691, 0.893,  1.8757, 0.9171,  1.8816, 0.9414,  1.8865, 0.966,  1.8903, 0.9904,  1.893, 1.0154,  1.8942, 1.0405,
  1.8939, 1.0653,  1.8917, 1.0904,  1.8877, 1.1151,  1.8816, 1.1392,  1.8734, 1.1627,  1.8629, 1.1855,  1.8502, 1.2073,  1.8359, 1.2272,
  1.8197, 1.2465,  1.8024, 1.2646,  1.784, 1.2819,  1.7653, 1.2981,  1.7454, 1.314,  1.7256, 1.3287,  1.7049, 1.3432,  1.6841, 1.3569,
  1.6634, 1.3698,  1.6412, 1.383,  1.6201, 1.3949,  1.5977, 1.407,  1.5757, 1.4183,  1.5534, 1.4292,  1.5308, 1.4398,  1.5072, 1.4504,
  1.4843, 1.4603,  1.4612, 1.4697,  1.4382, 1.4786,  1.4151, 1.4872,  1.3913, 1.4955,  1.3677, 1.5033,  1.3435, 1.5108,  1.3195, 1.5177,
  1.2951, 1.5242,  1.2713, 1.53,  1.2468, 1.5355,  1.2217, 1.5406,  1.198, 1.545,  1.1728, 1.5493,  1.1482, 1.5531,  1.1233, 1.5565,
  1.099, 1.5595,  1.0734, 1.5622,  1.0487, 1.5645,  1.0237, 1.5665,  0.9986, 1.5681,  0.9745, 1.5693,  0.9492, 1.5702,  0.9238, 1.5707,
  0.8995, 1.5709,  0.8741, 1.5706,  0.8488, 1.57,  0.8235, 1.5689,  0.7995, 1.5675,  0.7745, 1.5656,  0.7497, 1.5633,  0.7241, 1.5604,
  0.6998, 1.5571,  0.6748, 1.5532,  0.6502, 1.5488,  0.6259, 1.5439,  0.6011, 1.5382,  0.5769, 1.5319,  0.5532, 1.525,  0.5293, 1.5171,
  0.506, 1.5086,  0.4827, 1.499,  0.4604, 1.4883,  0.4391, 1.4756,  0.4189, 1.4613,  0.3991, 1.4452,  0.3804, 1.4281,  0.3628, 1.4105,
  0.3462, 1.3925,  0.3299, 1.3736,  0.3138, 1.354,  0.2986, 1.3345,  0.2837, 1.3146,  0.269, 1.2943,  0.2545, 1.2737,  0.2401, 1.253,
  0.226, 1.2322,  0.2121, 1.2115,  0.1983, 1.1909,  0.1841, 1.1698,  0.1706, 1.1499,  0.1562, 1.1288,  0.1419, 1.1085,  0.1271, 1.0883,
  0.112, 1.0685,  0.0964, 1.0493,  0.0799, 1.0307,  0.0618, 1.0126,  0.0428, 0.9967,  0.0218, 0.9832,  -0.0013, 0.9742,  -0.0263, 0.9722,
  -0.0504, 0.9769,  -0.0736, 0.9865,  -0.095, 0.9995,  -0.1149, 1.0149,  -0.1333, 1.0318,  -0.1508, 1.0499,  -0.1672, 1.0686,  -0.1829, 1.0879,
  -0.198, 1.1077,  -0.2127, 1.128,  -0.2272, 1.1486,  -0.2412, 1.1694,  -0.2548, 1.19,  -0.2684, 1.2108,  -0.282, 1.2319,  -0.2957, 1.253,
  -0.3095, 1.2738,  -0.3226, 1.2952,  -0.3347, 1.3167,  -0.3462, 1.3391,  -0.357, 1.3616,  -0.3671, 1.3843,  -0.3767, 1.4074,  -0.386, 1.4306,
  -0.3951, 1.4544,  -0.4037, 1.4777,  -0.4122, 1.501,  -0.4207, 1.5246,  -0.4292, 1.5479,  -0.4379, 1.5714,  -0.4469, 1.5949,  -0.4561, 1.6179,
  -0.4659, 1.6411,  -0.4757, 1.6639,  -0.4857, 1.687,  -0.4958, 1.71,  -0.5057, 1.7328,  -0.5156, 1.7559,  -0.5252, 1.7786,  -0.5348, 1.802,
  -0.5439, 1.8253,  -0.5527, 1.8487,  -0.561, 1.8723,  -0.5688, 1.8959,  -0.5763, 1.92,  -0.5837, 1.9438,  -0.5909, 1.9675,  -0.598, 1.9916,
  -0.605, 2.0156,  -0.6118, 2.0399,  -0.6182, 2.0639,  -0.6245, 2.0882,  -0.6303, 2.1121,  -0.6358, 2.1368,  -0.6409, 2.1611,  -0.6456, 2.186,
  -0.6498, 2.2104,  -0.6534, 2.235,  -0.6565, 2.2601,  -0.6589, 2.2846,  -0.6606, 2.3098,  -0.6614, 2.3348,  -0.6615, 2.3596,  -0.6609, 2.385,
  -0.6597, 2.4095,  -0.6579, 2.4347,  -0.6557, 2.4595,  -0.6531, 2.4843,  -0.6502, 2.5092,  -0.6471, 2.5342,  -0.6439, 2.5587,  -0.6405, 2.5837,
  -0.6371, 2.6082,  -0.6337, 2.6333,  -0.6304, 2.6577,  -0.6272, 2.6827,  -0.6243, 2.7077,  -0.6216, 2.7325,
];

/** Number of samples. */
export const COUNT = ROAD.length / 2;
/** km along the road of the last sample. */
export const ROAD_END = (COUNT - 1) * STEP;
/** The cyclist rides between A (km 0) and here. */
export const END = 7.5;
/** The book's points, km along the road from A. */
export const STOPS = { A: 0, B: 4, C: 6 };
/** Kilometre posts along the road, as in the picture (0 to 7). */
export const POSTS = [0, 1, 2, 3, 4, 5, 6, 7];

const clampKm = (km) => Math.min(Math.max(km, 0), ROAD_END);

/** The point km along the road (between two samples, on the straight line joining them). */
export function pointAt(km, out = { x: 0, y: 0 }) {
  const u = clampKm(km) / STEP;
  const i = Math.min(Math.floor(u + 1e-9), COUNT - 2);
  const f = Math.max(0, u - i);
  out.x = ROAD[2 * i] + (ROAD[2 * i + 2] - ROAD[2 * i]) * f;
  out.y = ROAD[2 * i + 1] + (ROAD[2 * i + 3] - ROAD[2 * i + 1]) * f;
  return out;
}

/** The road's direction at km: a unit vector pointing the way km grows. */
export function headingAt(km, out = { x: 0, y: 1 }) {
  const i = Math.min(Math.max(Math.round(clampKm(km) / STEP), 1), COUNT - 2);
  const dx = ROAD[2 * i + 2] - ROAD[2 * i - 2];
  const dy = ROAD[2 * i + 3] - ROAD[2 * i - 1];
  const len = Math.hypot(dx, dy) || 1;
  out.x = dx / len;
  out.y = dy / len;
  return out;
}

/** Compass bearing in degrees, clockwise from north (0 north, 90 east), of the vector (east, north). */
export const bearingOf = (east, north) => ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360;

/**
 * The displacement from A of the point km along the road: its east and north parts and its magnitude (km), and
 * its bearing (degrees from north; null when it is zero, since a zero vector has no direction).
 */
export function displacement(km) {
  const p = pointAt(km);
  const size = Math.hypot(p.x, p.y);
  return { east: p.x, north: p.y, km: size, bearing: size < 1e-6 ? null : bearingOf(p.x, p.y) };
}

/** The eight compass directions, clockwise from north. */
export const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
/** The nearest of the eight directions to a bearing (null stays null). */
export const compass8 = (bearing) => (bearing == null ? null : COMPASS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8]);
/** The direction k eighths of a turn clockwise from dir (k = 4 is the opposite direction). */
export const turn = (dir, k) => COMPASS[(((COMPASS.indexOf(dir) + k) % 8) + 8) % 8];

/** The distance travelled along a route of stops (km along the road), e.g. [0, 6, 0] is 12 km. */
export function travelled(route) {
  let sum = 0;
  for (let i = 1; i < route.length; i++) sum += Math.abs(route[i] - route[i - 1]);
  return sum;
}

/** The km along the road nearest to the point (x east, y north), looking only between from and to. */
export function nearestKm(x, y, from = 0, to = ROAD_END) {
  let best = 0;
  let bestD = Infinity;
  const i0 = Math.max(0, Math.floor(from / STEP));
  const i1 = Math.min(COUNT - 2, Math.ceil(to / STEP));
  for (let i = i0; i <= i1; i++) {
    // the nearest point of the piece between sample i and sample i + 1
    const ax = ROAD[2 * i];
    const ay = ROAD[2 * i + 1];
    const bx = ROAD[2 * i + 2] - ax;
    const by = ROAD[2 * i + 3] - ay;
    const f = Math.min(1, Math.max(0, ((x - ax) * bx + (y - ay) * by) / (bx * bx + by * by)));
    const d = Math.hypot(ax + bx * f - x, ay + by * f - y);
    if (d < bestD) {
      bestD = d;
      best = (i + f) * STEP;
    }
  }
  return Math.min(Math.max(best, from), to);
}

/** Which of the book's points (A, B, C) is at km, or null. */
export function stopAt(km, tolerance = 0.02) {
  for (const [name, at] of Object.entries(STOPS)) if (Math.abs(km - at) <= tolerance) return name;
  return null;
}

const decimals = (step) => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
/** x rounded to a multiple of step, without binary leftovers (roundTo(0.1 + 0.2, 0.1) is 0.3). */
export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(decimals(step));
/** km as text with d decimals (4 → "4.00"); never negative. For readings that change all the time. */
export const fmtKm = (km, d = 2) => roundTo(Math.max(0, km), 10 ** -d).toFixed(d);
/** km as in a sentence, to the hundredth without trailing zeros (4 → "4", 1.3109 → "1.31", 2.5 → "2.5"). */
export const fmtShort = (km) => String(roundTo(Math.max(0, km), 0.01));
