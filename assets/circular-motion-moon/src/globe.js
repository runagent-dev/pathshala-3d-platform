// Procedural maps for the Earth and the Moon (no image files): an equirectangular canvas each. The continents are
// coarse outlines in degrees of longitude and latitude, good enough to recognise the Earth from a phone's distance;
// the Moon gets its dark "seas" on the near side and a scatter of craters.
import * as THREE from 'three';

// outlines as longitude, latitude, longitude, latitude, … (degrees), roughly; enough for the shapes to read (Bangladesh sits at 90° E, 24° N)
const LAND = [
  // North America
  [
    -168, 66, -162, 70, -156, 71.5, -140, 70, -128, 70.5, -115, 68.5, -95, 72, -85, 70, -80, 63, -91, 57, -82, 52, -78, 58, -70, 60, -62, 57, -56, 52,
    -60, 47, -66, 44.5, -70, 42, -76, 38, -76, 35, -81, 31, -80, 25.5, -82, 28, -84, 30, -90, 29.5, -97, 27, -97, 22, -92, 18.5, -87, 21, -88, 15.5,
    -84, 11, -80, 8.5, -77.5, 8, -79, 7, -83, 8.5, -86, 12, -92, 14.5, -96, 16, -105, 20, -106, 23.5, -110, 24, -112, 29, -115, 31, -117, 32.5, -120,
    34.5, -124, 40, -124, 46, -124.5, 49, -130, 54.5, -135, 58, -140, 60, -148, 60.5, -152, 58, -158, 56.5, -165, 55, -160, 58.5, -165, 62, -168, 66,
  ],
  // Greenland
  [-50, 60, -42, 60.5, -38, 65.5, -22, 70, -20, 75, -18, 80, -30, 83, -50, 82, -62, 80, -70, 77, -58, 75.5, -55, 70, -52, 66, -50, 60],
  // South America
  [
    -77.5, 8, -72, 12, -64, 10.5, -60, 8.5, -52, 4.5, -50, 0, -44, -2.5, -35, -5.5, -35, -9, -39, -14, -40, -20.5, -42, -23, -48, -26, -49, -29, -53,
    -33.5, -58, -35, -57, -38, -62, -39, -65, -42, -66, -47, -69, -50.5, -68, -53, -72, -54, -75, -50, -74, -44, -73, -37, -71, -30, -70, -19, -75,
    -15, -77, -12, -81, -6, -80, -2, -80, 1, -78, 4, -77, 7, -77.5, 8,
  ],
  // Europe and Asia
  [
    -9.5, 36.5, -9, 43, -2, 43.5, -1, 46, -4.5, 48, 2, 51, 8, 54, 14, 54, 20, 55, 22, 58, 28, 60, 30, 62, 33, 66, 40, 66, 44, 68, 55, 69, 60, 70, 70,
    73, 80, 73, 95, 76, 105, 78, 115, 74, 130, 72, 140, 72, 160, 70, 170, 70, 180, 68, 180, 65, 175, 62, 165, 60, 160, 55, 156.5, 51, 156, 57, 150,
    59, 142, 59, 136, 54, 140, 48, 135, 43, 130, 42.5, 129, 35.5, 126.5, 34.5, 126, 37.5, 125, 40, 121, 40.5, 122.5, 37, 119, 35, 121.5, 32, 122, 30,
    120, 26, 116, 23, 110, 21, 108, 21.8, 106, 19, 109, 15, 109, 11.5, 105, 8.8, 103, 10.5, 100.5, 13.4, 99.5, 9, 103, 4, 104, 1.5, 101, 2.8, 98.5, 8,
    98, 13, 97, 16.8, 94.5, 18.5, 92.5, 20.8, 91.8, 22.4, 90.5, 21.9, 89, 21.7, 87, 21.3, 86, 19.8, 83, 17.5, 80.2, 15.5, 80, 10.5, 77.5, 8.1, 76, 10,
    73.5, 16, 72.6, 21.2, 70, 22.6, 68.5, 23.8, 66.5, 25.2, 62, 25.2, 57.5, 25.7, 56.4, 27.1, 52, 27.8, 50, 30, 48, 30, 50, 27, 51.5, 24.5, 54, 24.2,
    56, 25.6, 56.4, 24.8, 57.8, 23.6, 59.8, 22.5, 57.5, 18.8, 52.2, 16, 45, 12.8, 43.3, 12.6, 42.6, 15.5, 39.2, 21.4, 37.2, 25, 35, 28, 34.3, 27.8,
    32.6, 29.9, 34.2, 31.3, 35, 33, 35.9, 35.6, 36, 36.6, 30.5, 36.3, 27.3, 37, 26.3, 39, 26.6, 40.4, 29, 41.2, 31, 41.1, 35, 42, 38, 41, 41.5, 41.5,
    41.5, 43.2, 38, 45, 37.5, 47, 34.5, 45.3, 33.5, 44.5, 32.5, 45.4, 30.2, 46, 29.6, 45.2, 28.6, 43.8, 27.9, 42, 26.1, 41, 24, 40.6, 22.6, 40.3,
    23.2, 37.5, 21.6, 37.2, 20.2, 39.6, 19.4, 41.9, 16, 43.5, 13.8, 45.6, 12.3, 45.2, 12.4, 44, 14, 42.3, 16, 41.4, 18.4, 40.1, 16.6, 38.4, 15.7,
    38.1, 15.7, 40, 13.7, 41.2, 11.1, 42.4, 10.2, 43.9, 8.6, 44.4, 7.5, 43.8, 6.2, 43.1, 3.2, 43.2, 3.2, 42, 0.9, 41, 0, 39.5, -0.4, 38, -2.1, 36.7,
    -5.3, 36, -6.4, 36.8, -8.9, 37, -9.5, 36.5,
  ],
  // Scandinavia
  [
    5, 58, 5.5, 62, 10, 64, 14, 68, 18.5, 70, 25, 71, 30, 70, 28.5, 68, 24, 65.8, 22.3, 64, 18, 62.5, 18.8, 59.5, 16.5, 56.5, 13, 55.5, 11, 59, 8, 58,
    5, 58,
  ],
  // Great Britain, Ireland, Iceland
  [-5.5, 50, 1.5, 51, 1.7, 52.9, 0, 54, -2, 56, -1.8, 57.6, -5, 58.6, -6.2, 57, -5, 55, -3, 54.4, -4.6, 53.3, -4.2, 51.6, -5.5, 50],
  [-10, 51.6, -6, 52, -5.8, 54.8, -8, 55.3, -10, 54, -10, 51.6],
  [-24, 64, -14, 64.4, -14, 66, -22, 66.5, -24, 64],
  // Africa and Madagascar
  [
    -17, 14.7, -17, 21, -13, 27.5, -9.8, 30, -9.6, 33.4, -6, 35.8, -2, 35.1, 3, 36.9, 10, 37.2, 11, 35, 10.2, 33.8, 15.2, 32.2, 20, 30.8, 20.1, 32.5,
    25, 32, 29, 30.9, 32.2, 31.3, 34.2, 31.3, 33.6, 28.2, 35.4, 24.2, 37.2, 21, 38.6, 17.8, 40, 15.5, 43.2, 12.4, 44.6, 10.4, 51.2, 11.8, 51, 10.2,
    48, 4.8, 45, 1.8, 41, -1.8, 39.4, -5, 39.2, -8.2, 40.4, -11, 40.6, -15.2, 35.4, -22.2, 32.8, -26, 32.4, -29, 28, -33, 25.6, -34, 20, -34.8, 18.4,
    -33.8, 17, -29.6, 14.6, -26.6, 11.8, -17.6, 13.4, -12, 12.2, -6, 9, -1, 9.6, 3.9, 7, 4.4, 4.8, 6.2, 2, 6.3, -2, 4.8, -5, 5.1, -7.8, 4.4, -11.2,
    6.8, -13.2, 8.2, -15, 11, -16.8, 12.6, -17, 14.7,
  ],
  [44.2, -25, 47.2, -24.8, 50.4, -15.5, 49.4, -12, 44.2, -16.2, 43.4, -22, 44.2, -25],
  // Sri Lanka, Japan, the Philippines, Indonesia, New Guinea
  [80, 9.8, 81.9, 7.2, 81.3, 6, 80, 6.2, 79.8, 8, 80, 9.8],
  [
    130.2, 31.2, 131.8, 33.8, 135, 33.7, 140, 35.2, 141, 38.4, 141.4, 41.4, 145.5, 43.4, 141.8, 45.4, 140, 42.5, 139.8, 39.8, 137, 37.2, 132.7, 35.5,
    130.8, 34.3, 130.2, 31.2,
  ],
  [120, 18.5, 122.3, 18.4, 124.2, 13.6, 126.3, 7.5, 122, 7, 121, 12, 120, 15.4, 120, 18.5],
  [95.3, 5.6, 98.3, 4.2, 104.4, -2, 106, -5.8, 102.2, -4, 98.6, 0.2, 95.3, 5.6],
  [109, 1.8, 110.4, -2.6, 116, -4, 118.6, 1, 117.2, 6.8, 113.8, 4.2, 109, 1.8],
  [105.2, -6, 114.4, -7, 114.6, -8.6, 106.4, -7.4, 105.2, -6],
  [131, -1, 138, -1.8, 145, -4.8, 150.5, -10.2, 143, -9, 138.6, -8.2, 132.4, -4.2, 131, -1],
  // Australia and New Zealand
  [
    113.8, -22, 114, -26.5, 115, -34, 118, -35, 124, -33.8, 129, -31.6, 134, -32.6, 138, -35.5, 140, -38, 146, -39, 150, -37.4, 153.4, -31, 153, -25,
    146.2, -19, 145.4, -15, 142.4, -10.8, 141.4, -17, 136, -15.2, 136.8, -12.2, 132, -11.2, 129.4, -15, 126, -14, 122, -17.4, 113.8, -22,
  ],
  [172.6, -34.4, 178.4, -37.6, 176.8, -41, 172.8, -41, 166.6, -46, 169.6, -46.6, 174.2, -41.6, 172.6, -34.4],
];
const DESERTS = [
  [-14, 17, 33, 31], // Sahara
  [36, 15, 56, 31], // Arabia
  [52, 25, 72, 38], // Iran, Central Asia
  [92, 38, 118, 46], // Gobi
  [118, -32, 140, -20], // Australia
  [-118, 26, -102, 40], // North American deserts
];

function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
/** A soft-edged ellipse (a radial gradient: much cheaper than a canvas blur filter). */
function blob(g, x, y, rx, ry, rgb, alpha, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(rx, ry);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  grad.addColorStop(0, `rgba(${rgb}, ${alpha})`);
  grad.addColorStop(0.6, `rgba(${rgb}, ${alpha * 0.8})`);
  grad.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, 1, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
function texture(c, aniso) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

/** The Earth: blue oceans, green and sandy land, white ice at the poles, a few thin clouds. */
export function earthTexture(aniso = 8) {
  const W = 1024;
  const H = 512;
  const X = (lon) => ((lon + 180) / 360) * W;
  const Y = (lat) => ((90 - lat) / 180) * H;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const sea = g.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#2c5f9e');
  sea.addColorStop(0.5, '#2f74bd');
  sea.addColorStop(1, '#2c5f9e');
  g.fillStyle = sea;
  g.fillRect(0, 0, W, H);

  // land on its own canvas, so the deserts colour only land
  const lc = canvas(W, H);
  const l = lc.getContext('2d');
  l.fillStyle = '#5f9a48';
  l.beginPath();
  for (const shape of LAND) {
    for (let i = 0; i < shape.length; i += 2) {
      if (i) l.lineTo(X(shape[i]), Y(shape[i + 1]));
      else l.moveTo(X(shape[i]), Y(shape[i + 1]));
    }
    l.closePath();
  }
  l.fill();
  l.globalCompositeOperation = 'source-atop';
  for (const [a, b, cc, d] of DESERTS) blob(l, (X(a) + X(cc)) / 2, (Y(b) + Y(d)) / 2, (X(cc) - X(a)) / 1.6, (Y(b) - Y(d)) / 1.6, '201, 178, 122', 1);
  l.fillStyle = 'rgba(40, 80, 30, 0.25)'; // darker forests near the equator
  l.fillRect(0, Y(10), W, Y(-12) - Y(10));
  g.drawImage(lc, 0, 0);

  // ice: Antarctica, the Arctic, Greenland's sheet
  g.fillStyle = '#f2f5f7';
  g.beginPath();
  g.moveTo(0, H);
  for (let lon = -180; lon <= 180; lon += 10) g.lineTo(X(lon), Y(-68 - 3 * Math.sin(lon * 0.07)));
  g.lineTo(W, H);
  g.fill();
  g.fillRect(0, 0, W, Y(80));
  g.fillStyle = 'rgba(242, 245, 247, 0.85)';
  g.beginPath();
  const sheet = [-48, 62, -40, 66, -26, 72, -22, 80, -50, 81, -60, 77, -54, 70];
  for (let i = 0; i < sheet.length; i += 2) {
    if (i) g.lineTo(X(sheet[i]), Y(sheet[i + 1]));
    else g.moveTo(X(sheet[i]), Y(sheet[i + 1]));
  }
  g.fill();

  // thin clouds
  const r = rand(5);
  for (let i = 0; i < 60; i++) {
    const lat = (r() - 0.5) * 140;
    blob(g, r() * W, Y(lat), 24 + r() * 64, 5 + r() * 9, '255, 255, 255', 0.16 + r() * 0.22, (r() - 0.5) * 0.4);
  }
  return texture(c, aniso);
}

/** The Moon: grey, darker seas on the near side (the middle of the map), craters all over. */
export function moonTexture(aniso = 8) {
  const W = 512;
  const H = 256;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#b9b8b3';
  g.fillRect(0, 0, W, H);
  const r = rand(17);
  for (const [x, y, rx, ry] of [
    [0.47, 0.36, 0.08, 0.11],
    [0.55, 0.42, 0.07, 0.09],
    [0.5, 0.55, 0.06, 0.1],
    [0.41, 0.48, 0.06, 0.08],
    [0.58, 0.6, 0.045, 0.07],
    [0.44, 0.3, 0.05, 0.06],
  ])
    blob(g, x * W, y * H, rx * W, ry * H, '105, 106, 104', 0.8);
  for (let i = 0; i < 140; i++) {
    const x = r() * W;
    const y = H * (0.08 + r() * 0.84);
    const rad = 1.5 + r() ** 3 * 12;
    g.fillStyle = 'rgba(90, 90, 88, 0.25)';
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(235, 235, 230, 0.45)';
    g.lineWidth = Math.max(0.8, rad * 0.22);
    g.beginPath();
    g.arc(x - rad * 0.12, y - rad * 0.12, rad, Math.PI * 0.75, Math.PI * 1.75);
    g.stroke();
  }
  return texture(c, aniso);
}
