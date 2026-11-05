// The candle: wax with a melted pool and a few runs down its side, a wick, a small brass holder, and a flame that is one soft
// picture, the same picture the paper shows upside down, so the image flickers with the flame. Centimetres. The flame's own
// quad turns to face the camera (a flame is round); it is emission, so it adds light to what is behind it.
import * as THREE from 'three';
import { FLAME } from './reading.js';

// the flame's picture: its window in cm, round the flame's base
const WIN = { width: 3.6, height: 6.4, below: 1 };
export const WAX = { radius: 1.15, top: -0.25, reach: 3.6 }; // the candle's top, cm from the flame's base: what lights up

/** The flame's light at x across and h above its base, cm: { r, g, b } in sRGB, 0…1. */
function flameAt(x, h) {
  const t = h / FLAME.length;
  const r = t <= 0 || t >= 1 ? 0 : 0.76 * Math.sin(Math.PI * t ** 0.55) ** 0.92 * (1 - 0.18 * t);
  const d = r > 0 ? Math.abs(x) / r : 9; // 0 in the middle, 1 at the edge
  const s = (a, b, v) => {
    const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
    return k * k * (3 - 2 * k);
  };
  const body = 1 - s(0.62, 1.06, d); // the bright body, with a soft edge
  const core = (1 - s(0.05, 0.72, d)) * s(0.75, 1.5, h) * (1 - s(2.5, 3.9, h) * 0.55);
  const orange = s(1.5, 3.8, h); // cooler toward the tip
  let cr = body * (1 - 0.1 * s(0, 0.6, 1 - h));
  let cg = body * (0.58 - 0.26 * orange) + core * 0.4;
  let cb = body * 0.08 + core * 0.46;
  // the dark cone round the wick, and the blue skirt at the foot
  const cone = (1 - s(0.25, 0.8, d)) * (1 - s(0.45, 1.45, h));
  cr *= 1 - 0.72 * cone;
  cg *= 1 - 0.8 * cone;
  cb *= 1 - 0.75 * cone;
  const skirt = (1 - s(0, 0.85, h)) * s(0.25, 0.8, d) * (1 - s(0.95, 1.2, d));
  cr += skirt * 0.12;
  cg += skirt * 0.24;
  cb += skirt * 0.62;
  // a thin glow round all of it
  const far = Math.hypot(x / 1.1, (h - 1.7) / 2.3);
  const glow = 0.1 * Math.exp(-far * far * 1.5);
  return { r: Math.min(1, cr + glow), g: Math.min(1, cg + glow * 0.56), b: Math.min(1, cb + glow * 0.16) };
}

/** The picture of the flame, drawn once. The paper and the flame both read it. */
export function flameTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 256);
  for (let j = 0; j < 256; j++) {
    for (let i = 0; i < 128; i++) {
      const x = ((i + 0.5) / 128 - 0.5) * WIN.width;
      const h = (1 - (j + 0.5) / 256) * WIN.height - WIN.below;
      const f = flameAt(x, h);
      const k = (j * 128 + i) * 4;
      img.data[k] = 255 * f.r;
      img.data[k + 1] = 255 * f.g;
      img.data[k + 2] = 255 * f.b;
      img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** A point of the flame (cm, x across, y above its base) to the picture, with its flicker. Used in both shaders. */
export const FLAME_UV = /* glsl */ `
uniform sampler2D uFlameMap;
uniform vec3 uFlick; // height, width, lean
uniform float uFlameT;
vec2 flameUv(vec2 p) {
  float h = clamp(p.y / ${FLAME.length.toFixed(1)}, 0.0, 1.4);
  float sway = uFlick.z * h * h + 0.045 * sin(h * 7.0 - uFlameT * 8.0) * h;
  return vec2(((p.x - sway) / uFlick.y) / ${WIN.width.toFixed(1)} + 0.5, (p.y / uFlick.x + ${WIN.below.toFixed(1)}) / ${WIN.height.toFixed(1)});
}`;

/**
 * What a point of the paper sees through the hole: the flame, the wick dark in it, and the top of the candle lit by the flame.
 * On the paper they stand on their heads, so the wax points up from a flame that points down: that is what makes the image
 * read as upside down at any size. p as in flameUv; lod: how soft the picture is read.
 */
export const IMAGE_AT = /* glsl */ `
vec3 imageAt(vec2 p, float lod) {
  vec3 c = textureLod(uFlameMap, flameUv(p), lod).rgb;
  float soft = 0.05 + 0.05 * lod;
  float wick = smoothstep(0.07 + soft, 0.03, abs(p.x - 0.06 * max(p.y, 0.0)));
  c *= 1.0 - 0.8 * wick * smoothstep(-0.34 - soft, -0.26, p.y) * (1.0 - smoothstep(0.7, 0.9 + soft, p.y));
  float side = p.x / ${WAX.radius.toFixed(2)};
  float top = ${WAX.top.toFixed(2)} - 0.1 * side * side;
  float wax = (1.0 - smoothstep(0.86, 1.0 + soft, abs(side))) * (1.0 - smoothstep(top - 0.06 - soft, top + 0.04, p.y));
  float lit = (0.3 + 0.7 * exp((p.y - top) / 0.9)) * smoothstep(${(-WAX.reach).toFixed(1)}, ${(1.6 - WAX.reach).toFixed(1)}, p.y);
  return c + vec3(1.0, 0.62, 0.28) * 0.74 * wax * lit;
}`;

function createFlame(uniforms) {
  const geo = new THREE.PlaneGeometry(WIN.width * 1.1, WIN.height * 1.1);
  geo.translate(0, WIN.height / 2 - WIN.below, 0);
  const mat = new THREE.ShaderMaterial({
    name: 'flame',
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() {
        vP = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec2 vP;
      ${FLAME_UV}
      void main() {
        vec2 uv = flameUv(vP);
        vec3 c = texture2D(uFlameMap, uv).rgb * 1.5;
        float e = smoothstep(0.0, 0.05, uv.x) * smoothstep(0.0, 0.05, 1.0 - uv.x);
        gl_FragColor = vec4(c * e, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.name = 'flame';
  m.renderOrder = 5;
  m.userData.noExport = true;
  return m;
}

/** The wax: rings of points, the side with its runs, then the rim and the shallow melted pool. */
function waxGeometry(R, height) {
  const SEG = 36;
  const runs = [
    { at: 0.5, width: 0.3, length: 0.62, depth: 0.2 },
    { at: 2.2, width: 0.24, length: 0.36, depth: 0.16 },
    { at: 3.6, width: 0.34, length: 0.82, depth: 0.22 },
    { at: 5.2, width: 0.26, length: 0.5, depth: 0.17 },
  ];
  const side = (angle, k) => {
    // k: 0 at the foot, 1 at the rim
    let r = R * (1 + 0.012 * Math.sin(k * 9));
    for (const d of runs) {
      let a = Math.abs(angle - d.at);
      a = Math.min(a, Math.PI * 2 - a);
      const reach = 1 - d.length;
      if (k > reach) {
        const body = Math.exp(-((a / d.width) ** 2));
        const end = Math.min(1, (k - reach) / 0.06);
        r += d.depth * body * Math.sqrt(end) * (1.15 - 0.3 * ((k - reach) / d.length));
      }
    }
    return r;
  };
  // the profile, foot to centre of the pool
  const rows = [];
  for (let i = 0; i <= 18; i++) rows.push({ k: i / 18 });
  rows.push({ rim: 0.93 }, { rim: 0.8 }, { rim: 0.66 }, { rim: 0.4 }, { rim: 0.14 }, { rim: 0 });
  const pos = [];
  const index = [];
  for (const row of rows) {
    for (let j = 0; j <= SEG; j++) {
      const a = (j / SEG) * Math.PI * 2;
      if (row.k != null) {
        const r = side(a, row.k) * (row.k < 0.02 ? 1.04 : 1); // a little foot
        pos.push(Math.cos(a) * r, row.k * height, Math.sin(a) * r);
      } else {
        const r = side(a, 1) * row.rim;
        // the rim stands a little higher than the pool
        const y = height + 0.1 * Math.sin(Math.PI * Math.min(1, (1 - row.rim) / 0.3)) - 0.16 * Math.max(0, 1 - row.rim / 0.72);
        pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
      }
    }
  }
  const W = SEG + 1;
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = 0; j < SEG; j++) {
      const a = i * W + j;
      const b = a + W;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** A wick, slightly bent: a thin tube whose tip burns. */
function createWick(base, top) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, base, 0),
    new THREE.Vector3(0.02, (base + top) / 2, 0.01),
    new THREE.Vector3(0.11, top, 0.03),
  ]);
  return new THREE.TubeGeometry(curve, 8, 0.045, 6, false);
}

/**
 * The candle, its foot at the origin. `lit` dresses a material with the candle's own light (setting.js). The glow on the
 * wax near the flame (light going through the wax) is added here.
 */
export function createCandle({ lit, uniforms, foot, glow }) {
  const root = new THREE.Group();
  root.name = 'candle';
  const R = WAX.radius;
  const height = FLAME.base + WAX.top - foot; // the flame's foot sits just above the pool
  const top = foot + height;

  const brass = lit(new THREE.MeshStandardMaterial({ name: 'holder-brass', color: 0xb08d3e, roughness: 0.34, metalness: 0.92 }));
  const dish = new THREE.LatheGeometry(
    [
      [0, -0.55],
      [2.05, -0.55],
      [2.2, -0.38],
      [2.25, -0.08],
      [2.12, -0.04],
      [2.02, -0.3],
      [1.3, -0.36],
      [1.26, 0.2],
      [1.2, 0.22],
      [1.16, -0.3],
      [0, -0.32],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    36,
  );
  dish.computeVertexNormals();
  const holder = new THREE.Mesh(dish, brass);
  holder.name = 'holder';
  holder.position.y = foot;
  root.add(holder);

  const waxMat = lit(new THREE.MeshStandardMaterial({ name: 'wax', color: 0xf1e7d3, roughness: 0.46, metalness: 0 }), {
    extra: /* glsl */ `
      float phGlow = exp(-max(0.0, ${top.toFixed(2)} - vPhWorld.y) / 2.6);
      totalEmissiveRadiance += vec3(1.0, 0.6, 0.26) * (0.1 + 0.6 * phGlow) * uFlameLight;`,
  });
  const wax = new THREE.Mesh(waxGeometry(R, height), waxMat);
  wax.name = 'wax';
  wax.position.y = foot;
  root.add(wax);

  // a little wax set round the foot, in the dish
  const pool = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.2, 8, 30), waxMat);
  pool.rotation.x = Math.PI / 2;
  pool.scale.z = 0.5;
  pool.position.y = foot - 0.26;
  root.add(pool);

  const wick = new THREE.Mesh(
    createWick(top - 0.2, FLAME.base + 0.86),
    new THREE.MeshStandardMaterial({ name: 'wick', color: 0x17120e, roughness: 0.9 }),
  );
  wick.name = 'wick';
  root.add(wick);
  const ember = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 6),
    new THREE.MeshBasicMaterial({ name: 'ember', color: 0xff6a1f, toneMapped: false }),
  );
  ember.position.set(0.11, FLAME.base + 0.86, 0.03);
  ember.userData.noExport = true;
  root.add(ember);

  const flame = createFlame(uniforms);
  flame.position.y = FLAME.base;
  root.add(flame);

  // the room's own soft glow round the flame
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      name: 'flame-halo',
      map: glow,
      color: 0xff9d3c,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      opacity: 0.3,
    }),
  );
  halo.scale.setScalar(13);
  halo.position.y = FLAME.base + 1.7;
  root.add(halo);

  // for the GLB only: a plain flame, on a layer the camera never draws
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(0.72 * Math.sin(Math.PI * t ** 0.55) ** 0.92 * (1 - 0.18 * t), t * FLAME.length));
  }
  const model = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 16),
    new THREE.MeshStandardMaterial({ name: 'flame-model', color: 0xffc34d, emissive: 0xff9a1f, emissiveIntensity: 1, roughness: 1 }),
  );
  model.name = 'flame-model';
  model.position.y = FLAME.base;
  model.layers.set(1);
  root.add(model);

  return { root, flame, halo };
}
