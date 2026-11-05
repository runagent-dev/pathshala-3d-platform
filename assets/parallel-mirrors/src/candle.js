// The candle: wax with a soft melted top and a few drips, a wick, in a small brass chamberstick with a ring handle. All one
// geometry with vertex colours and a per-vertex metal and roughness, so a candle and each of its images is one draw. The
// handle points to +x: it shows the left–right swap of an image. The flame is a soft shape painted in a shader on a card that
// always faces the camera, with a glow round it; every flame flickers with the same clock, as real images do.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const WAX = new THREE.Color('#f2e6cf');
const WAX_WARM = new THREE.Color('#ffd9a0');
const BRASS = new THREE.Color('#b8893a');
const WICK = new THREE.Color('#2b2320');

/** Sets colour, metal and roughness on a part. */
function paint(g, colour, metal, rough, shade) {
  const pos = g.attributes.position;
  const n = pos.count;
  const col = new Float32Array(n * 3);
  const pbr = new Float32Array(n * 2);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    c.copy(colour);
    if (shade) shade(c, pos.getX(i), pos.getY(i), pos.getZ(i));
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
    pbr[i * 2] = metal;
    pbr[i * 2 + 1] = rough;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aPbr', new THREE.BufferAttribute(pbr, 2));
  return g;
}
const lathe = (profile, segments) =>
  new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
/** A profile through points, smoothed a little by a spline. */
function curve(points, samples) {
  const c = new THREE.SplineCurve(points.map(([r, y]) => new THREE.Vector2(r, y)));
  return c.getPoints(samples).map((p) => [Math.max(0, p.x), p.y]);
}

/** The model is drawn at 1, then made a stout table candle: 17.3 cm to the wick's tip. */
const SIZE = 1.22;

export function candleGeometry() {
  const parts = [];
  // the chamberstick: a shallow dish, a turned socket
  const dish = curve(
    [
      [0, 0],
      [3.3, 0],
      [4.25, 0.2],
      [4.42, 0.62],
      [4.22, 0.68],
      [3.72, 0.42],
      [2.3, 0.34],
      [2.02, 0.5],
      [2.02, 1.4],
      [2.18, 1.62],
      [2.02, 1.82],
      [1.7, 1.78],
    ],
    22,
  );
  parts.push(paint(lathe(dish, 28), BRASS, 0.9, 0.34));
  // the ring handle, standing on the dish's rim
  const ring = new THREE.TorusGeometry(1.05, 0.2, 8, 20);
  ring.translate(4.9, 1.0, 0);
  parts.push(paint(ring, BRASS, 0.9, 0.34));
  // the wax, warm toward the flame, with its melted pool
  const wax = curve(
    [
      [1.62, 1.7],
      [1.58, 6],
      [1.54, 11],
      [1.5, 13.0],
      [1.42, 13.42],
      [1.2, 13.34],
      [0.7, 13.1],
      [0.3, 13.0],
      [0, 13.0],
    ],
    20,
  );
  const warm = (c, _x, y) => c.lerp(WAX_WARM, THREE.MathUtils.smoothstep(y, 9.5, 13.4) * 0.8);
  parts.push(paint(lathe(wax, 28), WAX, 0, 0.5, warm));
  // the drips: thin beads down the side
  const drips = [
    [35, 11.6, 1.9, 0.34],
    [118, 11.0, 2.7, 0.3],
    [205, 11.9, 1.5, 0.3],
    [292, 10.4, 3.3, 0.36],
  ];
  for (const [deg, y, long, r] of drips) {
    const a = THREE.MathUtils.degToRad(deg);
    const s = new THREE.SphereGeometry(1, 10, 10);
    s.scale(r, long, r * 0.8);
    s.rotateY(-a);
    s.translate(Math.cos(a) * 1.5, y, Math.sin(a) * 1.5);
    parts.push(paint(s, WAX, 0, 0.45, warm));
  }
  // the wick, charred at its tip
  const wick = new THREE.CylinderGeometry(0.05, 0.075, 1.25, 8);
  wick.rotateZ(0.09);
  wick.translate(0.03, 13.58, 0);
  parts.push(paint(wick, WICK, 0, 0.9));
  // lathes and tori differ in their attributes only by uv: dropped, every part then merges
  for (const g of parts) g.deleteAttribute('uv');
  const merged = mergeGeometries(parts, false);
  merged.scale(SIZE, SIZE, SIZE);
  for (const g of parts) g.dispose();
  return merged;
}

/** The same candle for far along the row, where it is a few pixels wide: wax on a plain dish, no handle, no drips. */
export function farCandleGeometry() {
  const dish = paint(
    lathe(
      [
        [0, 0],
        [4.2, 0.1],
        [4.42, 0.62],
        [2.0, 0.5],
        [2.0, 1.8],
      ],
      12,
    ),
    BRASS,
    0.9,
    0.34,
  );
  const wax = paint(
    lathe(
      [
        [2.0, 1.8],
        [1.6, 1.8],
        [1.52, 13.2],
        [1.2, 13.34],
        [0, 13.0],
      ],
      12,
    ),
    WAX,
    0,
    0.5,
    (c, _x, y) => c.lerp(WAX_WARM, THREE.MathUtils.smoothstep(y, 9.5, 13.4) * 0.8),
  );
  for (const g of [dish, wax]) g.deleteAttribute('uv');
  const merged = mergeGeometries([dish, wax], false);
  merged.scale(SIZE, SIZE, SIZE);
  return merged;
}

/** The wax and brass material; `glow` (0 … 1) is the light of the flame inside the wax near the top. */
export function candleMaterial({ glow = 1, name = 'Candle', transparent = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ name, vertexColors: true, roughness: 1, metalness: 1, transparent });
  m.userData.glow = { value: glow };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.pmGlow = m.userData.glow;
    sh.vertexShader = `attribute vec2 aPbr;\nvarying vec2 vPbr;\nvarying float vY;\n${sh.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  vPbr = aPbr;\n  vY = position.y;',
    );
    sh.fragmentShader = `varying vec2 vPbr;\nvarying float vY;\nuniform float pmGlow;\n${sh.fragmentShader}`
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vPbr.y;')
      .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = vPbr.x;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
  totalEmissiveRadiance += vec3(1.0, 0.56, 0.2) * smoothstep(11.5, 16.2, vY) * (1.0 - vPbr.x) * step(vY, 16.5) * 0.62 * pmGlow;`,
      );
  };
  m.customProgramCacheKey = () => 'pm2-candle-1';
  return m;
}

export const FLAME_CARD = 18.3; // cm across
const WICK_TIP = 17.3; // cm above the table
const CARD_DROP = 3.05; // the wick's tip below the card's centre, cm
/** The card's centre for a flame of this size: it always starts at the wick. */
export const flameY = (size = 1) => WICK_TIP + CARD_DROP * size;
const PAINT = 15; // the shader paints in these units, so the flame scales with the card
const VERT = `
#include <common>
#include <clipping_planes_pars_vertex>
uniform float uSize;
varying vec2 vUv;
void main() {
  vUv = position.xy * 2.0;
  vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mvPosition.xy += position.xy * ${FLAME_CARD.toFixed(1)} * uSize;
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}`;
// x across, y up, in cm from the card's centre; the wick's tip stands at y = −2.2
const FRAG = `
#include <common>
#include <clipping_planes_pars_fragment>
uniform float uTime;
uniform float uLight;
varying vec2 vUv;
void main() {
  #include <clipping_planes_fragment>
  vec2 p = vUv * ${(PAINT / 2).toFixed(1)};
  float s1 = sin(uTime * 7.3) * 0.5 + sin(uTime * 11.7 + 1.3) * 0.3;
  float s2 = sin(uTime * 4.1 + 0.7);
  float high = 4.9 + 0.16 * s1 + 0.1 * s2;
  float t = (p.y + 2.5) / high;
  float sway = (0.1 * s2 + 0.05 * s1) * t * t;
  float wide = 0.82 * pow(clamp(t, 0.0, 1.0), 0.42) * pow(clamp(1.0 - t, 0.0, 1.0), 0.72) * 1.42;
  float e = abs(p.x - sway) / max(wide, 0.001);
  float inside = (t > 0.0 && t < 1.0) ? 1.0 - smoothstep(0.62, 1.04, e) : 0.0;
  vec3 orange = vec3(1.0, 0.56, 0.12);
  vec3 yellow = vec3(1.0, 0.86, 0.42);
  vec3 white = vec3(1.0, 0.97, 0.82);
  vec3 blue = vec3(0.24, 0.42, 0.95);
  float core = (1.0 - smoothstep(0.1, 0.72, e)) * smoothstep(0.1, 0.34, t) * (1.0 - smoothstep(0.52, 0.86, t));
  vec3 col = mix(orange, yellow, smoothstep(1.0, 0.4, e));
  col = mix(col, white, core);
  col = mix(col, orange * 1.05, smoothstep(0.76, 1.0, t));
  float low = 1.0 - smoothstep(0.03, 0.22, t);
  col = mix(col, blue, low * 0.86);
  float a = inside * (1.0 - low * 0.46);
  float r = length((p - vec2(sway * 0.4, 0.2)) * vec2(1.0, 0.8));
  float halo = exp(-r * r * 0.085) * 0.34 + exp(-r * r * 0.012) * 0.12;
  halo *= smoothstep(${(PAINT / 2).toFixed(1)}, 3.6, r);
  vec3 glow = vec3(1.0, 0.62, 0.26) * halo;
  gl_FragColor = vec4((col * a + glow * (1.0 - a)) * uLight, a * uLight);
}`;

const cardGeometry = new THREE.PlaneGeometry(1, 1);
export const flameClock = { value: 0 };

/** A flame on its card; `light` (0 … 1) is how bright it is. */
export function createFlame() {
  const material = new THREE.ShaderMaterial({
    name: 'Flame',
    uniforms: { uTime: flameClock, uLight: { value: 1 }, uSize: { value: 1 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    clipping: true,
    side: THREE.DoubleSide, // an image with an odd number of reflections stands under a mirror transform
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendEquation: THREE.AddEquation,
  });
  const mesh = new THREE.Mesh(cardGeometry, material);
  mesh.name = 'Flame';
  mesh.frustumCulled = false;
  mesh.userData.noExport = true;
  return mesh;
}

/** A plain flame for the book's GLB: a shader on a card does not export. */
export function solidFlame() {
  const outer = lathe(
    curve(
      [
        [0, 0],
        [0.42, 0.5],
        [0.66, 1.5],
        [0.42, 3.0],
        [0, 4.9],
      ],
      14,
    ),
    14,
  );
  const m = new THREE.Mesh(outer, new THREE.MeshBasicMaterial({ name: 'Flame', color: '#ffb02e' }));
  m.name = 'Flame';
  return m;
}
