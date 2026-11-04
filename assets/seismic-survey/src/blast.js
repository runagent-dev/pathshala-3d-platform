// The blast at the surface, for a buried seismic charge, not a movie bomb: the ground lifts round the hole and settles,
// a column of soil and gas is thrown up, clods fall back, a ring of dust runs along the ground, a short glow and a
// flash of light. Drawn much larger than life, like the equipment (the notes say so). All of it is a pure function of
// s, the seconds of the slowed animation since the firing, so a frozen `wave` always gives the same picture. The
// smoke moves in the vertex shader (no work per frame on the CPU); the clods are a few instanced, shaded stones.
import * as THREE from 'three';
import { FRONT, SOURCE } from './reading.js';

/** The blast is over (settled) at this time, s of the slowed animation. */
export const BLAST_S = 3;
const X = SOURCE.x;
const Z = FRONT - 6; // the mouth of the hole
const TILE = 128; // the smoke's picture: four different puffs, each 128 px
const RING = 34; // puffs in the dust ring along the ground
const COLUMN = 46; // puffs in the column over the hole
const CLODS = 54;
const LIFT = 42; // how far the ground rises round the hole (m in the scene)
const LIFT_R = 250;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/**
 * Four soft puffs of smoke, lit from the upper left where the sun is: each a heap of spheres seen from the front,
 * shaded by its own surface. R = how lit, A = how solid; made once, never loaded. The cauliflower look of real dust.
 */
function puffTexture() {
  const S = TILE * 2;
  const data = new Uint8Array(S * S * 4);
  const r = rng(4242);
  const L = new THREE.Vector3(-0.5, 0.72, 0.48).normalize();
  const height = new Float32Array(TILE * TILE);
  const norm = new Float32Array(TILE * TILE * 3);
  for (let tile = 0; tile < 4; tile++) {
    height.fill(0);
    const put = (cx, cy, rad) => {
      const y0 = Math.max(0, Math.floor(cy - rad));
      const y1 = Math.min(TILE - 1, Math.ceil(cy + rad));
      const x0 = Math.max(0, Math.floor(cx - rad));
      const x1 = Math.min(TILE - 1, Math.ceil(cx + rad));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const q = rad * rad - dx * dx - dy * dy;
          if (q <= 0) continue;
          const nz = Math.sqrt(q);
          const h = nz + rad * 0.2;
          const i = y * TILE + x;
          if (h > height[i]) {
            height[i] = h;
            norm[i * 3] = dx / rad;
            norm[i * 3 + 1] = -dy / rad;
            norm[i * 3 + 2] = nz / rad;
          }
        }
    };
    const big = 9;
    const c = TILE / 2;
    const spots = [];
    for (let i = 0; i < big; i++) {
      const a = r() * Math.PI * 2;
      const d = r() * TILE * 0.2;
      const rad = TILE * (0.13 + r() * 0.1);
      spots.push([c + Math.cos(a) * d, c + Math.sin(a) * d, rad]);
      put(...spots[i]);
    }
    for (let i = 0; i < 46; i++) {
      const [sx, sy, sr] = spots[i % big];
      const a = r() * Math.PI * 2;
      put(sx + Math.cos(a) * sr * 0.86, sy + Math.sin(a) * sr * 0.86, sr * (0.2 + r() * 0.22));
    }
    const ox = (tile % 2) * TILE;
    const oy = (tile >> 1) * TILE;
    for (let y = 0; y < TILE; y++)
      for (let x = 0; x < TILE; x++) {
        const i = y * TILE + x;
        const rim = Math.hypot(x - c + 0.5, y - c + 0.5) / (TILE / 2);
        const solid = smooth(0, 16, height[i]) * (1 - smooth(0.62, 0.98, rim));
        const lit = norm[i * 3] * L.x + norm[i * 3 + 1] * L.y + norm[i * 3 + 2] * L.z;
        const o = ((y + oy) * S + x + ox) * 4;
        data[o] = 255 * Math.max(0, Math.min(1, 0.5 + 0.55 * lit));
        data[o + 1] = data[o];
        data[o + 2] = data[o];
        data[o + 3] = 255 * solid;
      }
  }
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/** A soft round glow (for the additive sprite over the core). */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,244,214,1)');
  gr.addColorStop(0.16, 'rgba(255,190,96,0.9)');
  gr.addColorStop(0.42, 'rgba(240,96,28,0.3)');
  gr.addColorStop(1, 'rgba(200,50,10,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const PUFF_VERT = /* glsl */ `
  attribute vec4 aMove;  // kind (0 column, 1 ring), delay (s), reach (m), height (m)
  attribute vec4 aLook;  // direction on the ground (x, z), size (m), turn
  attribute vec3 aTone;  // the tile (u, v), how dark this puff's soil is
  uniform float uT;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vY;
  varying float vDark;
  varying float vHot;
  void main() {
    float t = uT - aMove.y;
    vUv = (uv + aTone.xy) * 0.5;
    vDark = aTone.z;
    vec3 p = vec3(${X.toFixed(1)}, 0.0, ${Z.toFixed(1)});
    float size = aLook.z;
    if (aMove.x < 0.5) {
      // the column: thrown up fast, slowed by the air, widening, then hanging and sinking a little as it thins
      float up = 1.0 - exp(-t * 3.4);
      float y = aMove.w * up - 16.0 * max(0.0, t - 1.0) * max(0.0, t - 1.0);
      p.y = y;
      p.xz += aLook.xy * aMove.z * (0.18 + 0.82 * (1.0 - exp(-t * 1.25))) * (0.35 + 0.65 * smoothstep(0.0, 170.0, y));
      size *= 0.42 + 0.72 * (1.0 - exp(-t * 2.0)) + 0.12 * t;
      vAlpha = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(1.35, ${BLAST_S.toFixed(1)} - aMove.y * 0.5, uT));
      vHot = exp(-t * 9.0) * (1.0 - smoothstep(60.0, 190.0, y));
    } else {
      // the ring: runs out along the ground, slowing, and settles
      float r = aMove.z * (1.0 - exp(-t * 2.3));
      p.xz += aLook.xy * r;
      p.y = aMove.w * (0.32 + 0.68 * smoothstep(0.0, 1.0, t * 0.8));
      size *= 0.5 + 0.8 * (1.0 - exp(-t * 1.6));
      vAlpha = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(1.3, ${BLAST_S.toFixed(1)}, uT));
      vHot = 0.0;
    }
    vY = p.y;
    if (t <= 0.0 || uT >= ${BLAST_S.toFixed(1)}) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // not yet thrown, or gone
      return;
    }
    vec4 mv = viewMatrix * vec4(p, 1.0);
    float c = cos(aLook.w);
    float n = sin(aLook.w);
    vec2 q = position.xy * size;
    mv.xy += vec2(c * q.x - n * q.y, n * q.x + c * q.y);
    gl_Position = projectionMatrix * mv;
  }`;
const PUFF_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vY;
  varying float vDark;
  varying float vHot;
  void main() {
    vec4 tex = texture2D(uMap, vUv);
    float a = tex.a * vAlpha * smoothstep(-3.0, 14.0, vY); // it meets the ground softly
    if (a < 0.012) discard;
    // soil of the top layer: sun on it, its own dark side, darker where gas and fresh earth are thick
    vec3 lit = mix(vec3(0.62, 0.47, 0.31), vec3(0.34, 0.26, 0.2), vDark);
    vec3 dark = mix(vec3(0.24, 0.17, 0.115), vec3(0.11, 0.085, 0.07), vDark);
    vec3 col = mix(dark, lit, tex.r);
    col += vec3(1.0, 0.42, 0.1) * vHot * (1.15 - 0.6 * tex.r); // lit from below by the core, for a moment
    gl_FragColor = vec4(col, a * 0.94);
    #include <colorspace_fragment>
  }`;

/**
 * @param {{ soil: THREE.Material }} options soil: the surface's own material, so the lifted ground is the same ground
 */
export function createBlast({ soil }) {
  const root = new THREE.Group();
  root.name = 'blast';
  root.userData.noExport = true;
  root.visible = false;
  const disposables = [];
  const keep = (x) => {
    disposables.push(x);
    return x;
  };

  // ── the ground round the hole: half a disc cut by the face, lifting and settling (with a soil lip on the face) ──
  const rings = 9;
  const sides = 32;
  const pos = [];
  const uv = [];
  const idx = [];
  const toUv = (x, z) => [(x + 1000) / 2000, 1 - (z + 700) / 1400];
  const bell = (d) => (1 - smooth(0, 1, d)) ** 1.5;
  for (let j = 0; j <= sides; j++) {
    const a = Math.PI + (j / sides) * Math.PI; // from the face round the back to the face
    for (let i = 0; i <= rings; i++) {
      const d = i / rings;
      const x = X + Math.cos(a) * d * LIFT_R;
      const z = FRONT + Math.sin(a) * d * LIFT_R;
      pos.push(x, bell(d), z);
      uv.push(...toUv(x, z));
    }
  }
  for (let j = 0; j < sides; j++)
    for (let i = 0; i < rings; i++) {
      const a = j * (rings + 1) + i;
      const b = a + rings + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const lip = pos.length / 3;
  const lipN = 24;
  for (let i = 0; i <= lipN; i++) {
    const x = X - LIFT_R + (2 * LIFT_R * i) / lipN;
    const h = bell(Math.abs(x - X) / LIFT_R);
    pos.push(x, h, FRONT, x, 0, FRONT);
    uv.push(...toUv(x, FRONT - 40 * h), ...toUv(x, FRONT));
    if (i < lipN) {
      const a = lip + i * 2;
      idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }
  }
  const moundGeo = keep(new THREE.BufferGeometry());
  moundGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  moundGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  moundGeo.setIndex(idx);
  moundGeo.scale(1, LIFT, 1);
  moundGeo.computeVertexNormals();
  const mound = new THREE.Mesh(moundGeo, soil);
  mound.name = 'lifted-ground';
  mound.receiveShadow = true;
  mound.position.y = 0.8;

  // ── the column and the ring of dust: one instanced quad, moved by the shader ─────────────────────────────────────
  const r = rng(907);
  const N = RING + COLUMN;
  const quad = keep(new THREE.InstancedBufferGeometry());
  quad.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  quad.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
  quad.setIndex([0, 1, 2, 0, 2, 3]);
  const move = new Float32Array(N * 4);
  const look = new Float32Array(N * 4);
  const tone = new Float32Array(N * 3);
  const puffs = [];
  // the ring round the back and sides only: nothing floats out in front of the cut face
  for (let i = 0; i < RING; i++) {
    const a = Math.PI * (1.02 + (0.96 * (i + r() * 0.8)) / RING);
    puffs.push({
      m: [1, 0.06 + r() * 0.16, 330 + r() * 170, 22 + r() * 22],
      dx: Math.cos(a),
      dz: Math.sin(a),
      size: 86 + r() * 66,
      dark: 0.1 + r() * 0.3,
    });
  }
  for (let i = 0; i < COLUMN; i++) {
    const a = r() * Math.PI * 2;
    const f = i / (COLUMN - 1);
    // the first puffs go highest; the later ones fill the column toward its foot
    const high = 430 * (1 - 0.86 * f) * (0.86 + r() * 0.2);
    const reach = 26 + (84 + 70 * r()) * Math.sqrt(1 - f * 0.7) * r() ** 0.6;
    puffs.push({
      m: [0, f * 0.22, reach, high],
      dx: Math.cos(a),
      dz: Math.sin(a) * 0.55 - 0.18,
      size: 106 + r() * 74 - f * 18,
      dark: 0.34 + 0.56 * r() * r() + 0.15 * (1 - f),
    });
  }
  // drawn far to near as seen from the front (they cannot be sorted on the graphics card, and need not be while the
  // view turns only a little): the far ring first, the column's outside before its heart
  puffs.sort((a, b) => b.m[0] - a.m[0] || (a.m[0] ? a.dz - b.dz : a.m[2] * a.dz - b.m[2] * b.dz));
  puffs.forEach((p, i) => {
    move.set(p.m, i * 4);
    look.set([p.dx, p.dz, p.size, (r() - 0.5) * 1.0], i * 4);
    tone.set([Math.floor(r() * 2), Math.floor(r() * 2), Math.min(1, p.dark)], i * 3);
  });
  quad.setAttribute('aMove', new THREE.InstancedBufferAttribute(move, 4));
  quad.setAttribute('aLook', new THREE.InstancedBufferAttribute(look, 4));
  quad.setAttribute('aTone', new THREE.InstancedBufferAttribute(tone, 3));
  quad.instanceCount = N;
  const puffMat = keep(
    new THREE.ShaderMaterial({
      vertexShader: PUFF_VERT,
      fragmentShader: PUFF_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { uT: { value: 0 }, uMap: { value: keep(puffTexture()) } },
    }),
  );
  const smoke = new THREE.Mesh(quad, puffMat);
  smoke.name = 'smoke';
  smoke.frustumCulled = false;
  smoke.renderOrder = 7;

  // ── the clods: broken lumps of earth, flat-shaded, thrown out and falling back ───────────────────────────────────
  const lump = keep(new THREE.IcosahedronGeometry(1, 1));
  const lp = lump.attributes.position;
  const rl = rng(31);
  const moved = new Map(); // the same corner of the (unindexed) lump moves the same way, so it stays closed
  for (let i = 0; i < lp.count; i++) {
    const k = `${lp.getX(i).toFixed(3)},${lp.getY(i).toFixed(3)},${lp.getZ(i).toFixed(3)}`;
    if (!moved.has(k)) moved.set(k, 0.68 + rl() * 0.58);
    lp.setXYZ(i, lp.getX(i) * moved.get(k) * 1.2, lp.getY(i) * moved.get(k) * 0.82, lp.getZ(i) * moved.get(k));
  }
  lump.computeVertexNormals();
  const clodMat = keep(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.96, flatShading: true, name: 'clod' }));
  const clods = new THREE.InstancedMesh(lump, clodMat, CLODS);
  clods.name = 'clods';
  clods.frustumCulled = false;
  clods.castShadow = true;
  const G = 560; // m/s² in the scene: they are up and down again in about 2 s
  const SOIL = ['#6d4f33', '#7c5a3b', '#54402d', '#8e6a45', '#463528'].map((c) => new THREE.Color(c));
  const clod = Array.from({ length: CLODS }, (_, i) => {
    const a = r() * Math.PI * 2;
    const big = i < 16; // a few big lumps near the hole, many small ones flung further
    const vy = (big ? 260 : 320) + r() * 300;
    const vr = (big ? 40 : 90) + r() * (big ? 100 : 210);
    const size = big ? 15 + r() * 11 : 5 + r() * 8;
    clods.setColorAt(i, SOIL[i % SOIL.length]);
    return {
      vy,
      vx: Math.cos(a) * vr,
      vz: Math.min(0, Math.sin(a) * vr) - 8, // nothing lands out in front of the cut face
      size,
      at: r() * 0.1,
      land: (2 * vy) / G,
      axis: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
      spin: 4 + r() * 9,
    };
  });
  clods.instanceColor.needsUpdate = true;

  // ── the glow over the core, and the flash of light on the ground around it ───────────────────────────────────────
  const glowMat = keep(
    new THREE.SpriteMaterial({
      map: keep(glowTexture()),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      opacity: 0,
    }),
  );
  const glow = new THREE.Sprite(glowMat);
  glow.name = 'glow';
  glow.position.set(X, SOURCE.y + 6, FRONT + 8);
  glow.renderOrder = 9;
  // always in the scene (at 0 when idle): adding a light at the moment of the blast would recompile every material
  const light = new THREE.PointLight('#ffb066', 0, 1100, 1.1);
  light.name = 'blast-flash';
  light.position.set(X + 10, 70, FRONT + 90);
  light.userData.noExport = true;

  root.add(mound, smoke, clods, glow);

  const mx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pv = new THREE.Vector3();
  const sv = new THREE.Vector3();
  /** The blast at s seconds of the slowed animation since the firing. */
  function set(s) {
    const on = s >= 0 && s < BLAST_S;
    root.visible = on;
    light.intensity = on ? 1.6e4 * Math.exp(-s / 0.11) : 0;
    if (!on) return;
    mound.scale.y = Math.max(0.001, smooth(0, 0.11, s) * Math.exp(-Math.max(0, s - 0.14) * 2.4) * (1 + 0.14 * Math.sin(s * 11)));
    puffMat.uniforms.uT.value = s;
    const k = Math.exp(-s / 0.14);
    glowMat.opacity = Math.min(1, 1.1 * k);
    glow.scale.setScalar(160 + 720 * (1 - Math.exp(-s / 0.05)));
    glow.visible = k > 0.01;
    for (let i = 0; i < CLODS; i++) {
      const c = clod[i];
      const t = Math.max(0, s - c.at);
      const air = Math.min(t, c.land);
      const y = c.vy * air - 0.5 * G * air * air;
      // down by the time the dust thins; a lump on the ground sinks in the settling dust
      const size = t <= 0 ? 0.001 : c.size * (1 - smooth(2.3, BLAST_S - 0.05, s));
      pv.set(X + c.vx * air, Math.max(0, y) + size * 0.45, Z + c.vz * air);
      q.setFromAxisAngle(c.axis, c.spin * air);
      clods.setMatrixAt(i, mx.compose(pv, q, sv.setScalar(Math.max(0.001, size))));
    }
    clods.instanceMatrix.needsUpdate = true;
  }
  set(-1);

  return {
    root,
    light,
    set,
    dispose() {
      clods.dispose();
      for (const d of disposables) d.dispose?.();
    },
  };
}
