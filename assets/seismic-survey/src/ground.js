// The block of ground, cut open like a geologist's block diagram (metres; x right, y up, z toward the viewer): five
// rock layers with gentle folds and a dome (anticline) under the middle, gas in the top of the dome and oil below it
// (hidden until the 3D picture is made), the waves drawn on the cut face and on the surface (a shader: the blast's
// wave going down, each boundary's echo coming back up, exactly where t = √(x² + (2d)²) / v puts it), and the mapped
// boundaries of the "ত্রিমাত্রিক ছবি" step. Procedural: no image files.
import * as THREE from 'three';
import { BASE_DEPTH, BOTTOM, boundaryY, DEPTH_Z, DEPTHS, DOME, domeAt, FRONT, GOC, OWC, SOURCE, V, WIDTH } from './reading.js';

const X0 = -WIDTH / 2;
const X1 = WIDTH / 2;
const Z0 = -DEPTH_Z / 2;
const Z1 = FRONT;

/** The rocks, top to bottom: their names (i18n keys) and the look of their cut faces. */
export const ROCKS = [
  { key: 'rock_sand', base: '#dcb67e', kind: 'sand' },
  { key: 'rock_lime', base: '#d9d2bc', kind: 'lime' },
  { key: 'rock_shale', base: '#717784', kind: 'shale' },
  { key: 'rock_res', base: '#d6b36c', kind: 'sand2' },
  { key: 'rock_shale', base: '#5a5f69', kind: 'shale' },
];
/** The three reflecting boundaries' colours (also in the seismogram and the panel): each echo has its own. */
export const ECHO_COLORS = ['#2b8a3e', '#7048e8', '#d9480f'];
export const WAVE_COLOR = '#0c8599';
export const GAS_COLOR = '#ff4d4f';
export const OIL_COLOR = '#5a3a10';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
const shade = (hex, k) => {
  const c = new THREE.Color(hex);
  if (k >= 0) c.lerp(new THREE.Color('#ffffff'), k);
  else c.lerp(new THREE.Color('#000000'), -k);
  return `#${c.getHexString()}`;
};

/** A cut face of rock, 512 px for 500 m (repeats): grain, bedding, joints, by kind. */
function rockTexture(rock, seed) {
  const S = 512;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const r = rng(seed);
  g.fillStyle = rock.base;
  g.fillRect(0, 0, S, S);
  // soft blotches
  for (let i = 0; i < 40; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 20 + r() * 70;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const col = new THREE.Color(rock.base).offsetHSL(0, 0, (r() - 0.5) * 0.08);
    gr.addColorStop(0, `#${col.getHexString()}88`);
    gr.addColorStop(1, `#${col.getHexString()}00`);
    g.fillStyle = gr;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
  }
  if (rock.kind === 'shale') {
    // fine laminations
    for (let y = 0; y < S; y += 3 + r() * 5) {
      g.strokeStyle = r() < 0.5 ? shade(rock.base, -0.18 - r() * 0.15) : shade(rock.base, 0.08 + r() * 0.1);
      g.globalAlpha = 0.35 + r() * 0.4;
      g.lineWidth = 0.6 + r() * 1.4;
      g.beginPath();
      const ph = r() * 6;
      for (let x = 0; x <= S; x += 16) g.lineTo(x, y + Math.sin(x / 80 + ph) * 1.2);
      g.stroke();
    }
    g.globalAlpha = 1;
  } else if (rock.kind === 'lime') {
    // beds with joints between them (blocky), a few shell bits
    let y = 0;
    while (y < S) {
      const h = 30 + r() * 40;
      g.fillStyle = shade(rock.base, (r() - 0.5) * 0.12);
      g.globalAlpha = 0.5;
      g.fillRect(0, y, S, h);
      g.globalAlpha = 1;
      g.strokeStyle = shade(rock.base, -0.32);
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(S, y);
      g.stroke();
      g.lineWidth = 1.2;
      for (let x = r() * 80; x < S; x += 50 + r() * 90) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (r() - 0.5) * 6, y + h);
        g.stroke();
      }
      y += h;
    }
    for (let i = 0; i < 140; i++) {
      g.fillStyle = shade(rock.base, r() < 0.5 ? 0.35 : -0.25);
      g.beginPath();
      g.ellipse(r() * S, r() * S, 1 + r() * 2.5, 0.8 + r() * 1.2, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    // sandstone: grains and faint cross-bedding
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = shade(rock.base, (r() - 0.5) * 0.5);
      g.globalAlpha = 0.5;
      g.fillRect(r() * S, r() * S, 1 + r() * 1.5, 1 + r() * 1.5);
    }
    g.globalAlpha = 0.28;
    g.strokeStyle = shade(rock.base, -0.25);
    g.lineWidth = 1;
    for (let set = 0; set < 6; set++) {
      const y0 = r() * S;
      const x0 = r() * S;
      for (let j = 0; j < 7; j++) {
        g.beginPath();
        g.moveTo(x0 - 60, y0 + j * 7);
        g.quadraticCurveTo(x0 + 30, y0 + j * 7 + 20, x0 + 140, y0 + j * 7 + 30);
        g.stroke();
      }
    }
    g.globalAlpha = 0.4;
    for (let y = 0; y < S; y += 60 + r() * 50) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(S, y + (r() - 0.5) * 6);
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** The dry ground on top (ochre earth, patches, little stones), 1024 px for the whole surface. */
function soilTexture() {
  const S = 1024;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const r = rng(77);
  g.fillStyle = '#8e6a45';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 10 + r() * 60;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const col = r() < 0.5 ? '#a07a50' : r() < 0.5 ? '#7a5636' : '#8d7650';
    gr.addColorStop(0, `${col}aa`);
    gr.addColorStop(1, `${col}00`);
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 16000; i++) {
    g.fillStyle = r() < 0.5 ? '#6f5232' : '#d0ab78';
    g.globalAlpha = 0.35;
    g.fillRect(r() * S, r() * S, 1.5, 1.5);
  }
  g.globalAlpha = 0.5;
  for (let i = 0; i < 500; i++) {
    g.fillStyle = r() < 0.5 ? '#ddd0b8' : '#7a6650';
    g.beginPath();
    g.ellipse(r() * S, r() * S, 1.5 + r() * 2.5, 1 + r() * 2, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Contour lines for the mapped dome: u = how much of the dome is felt there (lines only on the dome, so flat ground
 * near a contour's depth is never painted dark), v = depth / step (a dark line at each step). */
function contourTexture() {
  const c = canvas(32, 64);
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 32, 64);
  const gr = g.createLinearGradient(8, 0, 20, 0);
  gr.addColorStop(0, 'rgba(38,48,58,0)');
  gr.addColorStop(1, 'rgba(38,48,58,1)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/** The top and the bottom of rock layer i (y at x, z). */
const topOf = (i) => (i === 0 ? () => 0 : (x, z) => boundaryY(i - 1, x, z));
const bottomOf = (i) => (i === 4 ? () => BOTTOM : (x, z) => boundaryY(i, x, z));

/** The four cut faces of one layer, one geometry (uv in units of 500 m along the face and down). */
function layerWalls(i, n = 72) {
  const top = topOf(i);
  const bot = bottomOf(i);
  const pos = [];
  const nor = [];
  const uv = [];
  const idx = [];
  const sides = [
    { a: [X0, Z1], b: [X1, Z1], n: [0, 0, 1] }, // front
    { a: [X1, Z1], b: [X1, Z0], n: [1, 0, 0] }, // right
    { a: [X1, Z0], b: [X0, Z0], n: [0, 0, -1] }, // back
    { a: [X0, Z0], b: [X0, Z1], n: [-1, 0, 0] }, // left
  ];
  let u0 = 0;
  for (const s of sides) {
    const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
    const base = pos.length / 3;
    for (let j = 0; j <= n; j++) {
      const k = j / n;
      const x = s.a[0] + (s.b[0] - s.a[0]) * k;
      const z = s.a[1] + (s.b[1] - s.a[1]) * k;
      const yt = top(x, z);
      const yb = bot(x, z);
      pos.push(x, yt, z, x, yb, z);
      nor.push(...s.n, ...s.n);
      const u = (u0 + len * k) / 500;
      uv.push(u, yt / 500, u, yb / 500);
    }
    for (let j = 0; j < n; j++) {
      const a = base + j * 2;
      idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }
    u0 += len;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

/** A surface y = f(x, z) over the block (or a part of it), facing up. */
function heightField(f, { x0 = X0, x1 = X1, z0 = Z0, z1 = Z1, nx = 64, nz = 46, uv } = {}) {
  const pos = [];
  const uvs = [];
  const idx = [];
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const x = x0 + ((x1 - x0) * i) / nx;
      const z = z0 + ((z1 - z0) * j) / nz;
      const y = f(x, z);
      pos.push(x, y, z);
      uvs.push(...(uv ? uv(x, y, z) : [(x - X0) / WIDTH, 1 - (z - Z0) / DEPTH_Z]));
    }
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + nx + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ── the waves: drawn on the cut face and on the surface by one shader ───────────────────────────────────────────
const WAVE_VERT = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const WAVE_FRAG = /* glsl */ `
  uniform float uR;        // how far the wave has gone: v t (m)
  uniform float uW;        // the pulse's half width (m)
  uniform vec3 uD;         // the boundaries' depths (m)
  uniform vec3 uS;         // the blast
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uCd;
  uniform float uFace;     // 0: the cut face in front (x, y); 1: the surface (x, z)
  uniform float uOn;
  varying vec3 vW;
  // a pulse: a bright crest and a faint trough behind it
  float pulse(float dr) {
    float a = (dr / uW) * (dr / uW);
    return (1.0 - 2.0 * a) * exp(-a);
  }
  void main() {
    if (uOn < 0.5) discard;
    vec3 col = vec3(0.0);
    float al = 0.0;
    float depthArr[3]; depthArr[0] = uD.x; depthArr[1] = uD.y; depthArr[2] = uD.z;
    vec3 cols[3]; cols[0] = uC0; cols[1] = uC1; cols[2] = uC2;
    if (uFace < 0.5) {
      // the cut face: the wave going down from the charge, then each echo coming up from its boundary
      float r = distance(vW.xy, uS.xy);
      float p = pulse(r - uR) * (vW.y < 0.0 ? 1.0 : 0.0);
      float fall = 1.0 / (1.0 + r / 1600.0);
      if (p > 0.0) { col += uCd * p; al += p * 1.3 * fall; }
      else { al += -p * 0.3 * fall; }
      for (int k = 0; k < 3; k++) {
        float d = depthArr[k];
        if (vW.y < -d) continue;
        vec2 img = vec2(uS.x, -2.0 * d - uS.y);
        float ri = distance(vW.xy, img);
        float q = pulse(ri - uR) * step(d + uS.y, uR);
        float f2 = 1.0 / (1.0 + ri / 2200.0);
        if (q > 0.0) { col += cols[k] * q; al += q * 1.3 * f2; }
        else { al += -q * 0.25 * f2; }
      }
    } else {
      // the surface: each echo arrives as a circle growing round the blast
      float x = distance(vW.xz, uS.xz);
      for (int k = 0; k < 3; k++) {
        float d = depthArr[k];
        float path = sqrt(x * x + 4.0 * d * d);
        float q = pulse(path - uR);
        float f2 = 1.0 / (1.0 + path / 2600.0);
        if (q > 0.0) { col += cols[k] * q; al += q * 1.3 * f2; }
      }
    }
    al = clamp(al, 0.0, 0.95);
    if (al < 0.01) discard;
    // the colour of the crests (a trough alone is dark), at the strength of the pulse
    gl_FragColor = vec4(clamp(col / max(1.0, max(col.r, max(col.g, col.b))), 0.0, 1.0), al);
    #include <colorspace_fragment>
  }`;

function waveMaterial(face) {
  const c = (hex) => new THREE.Color(hex);
  return new THREE.ShaderMaterial({
    vertexShader: WAVE_VERT,
    fragmentShader: WAVE_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uR: { value: 0 },
      uW: { value: 40 },
      uD: { value: new THREE.Vector3(...DEPTHS) },
      uS: { value: new THREE.Vector3(SOURCE.x, SOURCE.y, SOURCE.z) },
      uC0: { value: c(ECHO_COLORS[0]) },
      uC1: { value: c(ECHO_COLORS[1]) },
      uC2: { value: c(ECHO_COLORS[2]) },
      uCd: { value: c(WAVE_COLOR) },
      uFace: { value: face },
      uOn: { value: 0 },
    },
  });
}

export function createGround({ anisotropy = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'ground';
  const disposables = [];
  const keep = (x) => {
    disposables.push(x);
    return x;
  };

  // the five layers' cut faces
  const walls = ROCKS.map((rock, i) => {
    const map = keep(rockTexture(rock, 11 + i * 7));
    map.anisotropy = anisotropy;
    const mat = keep(new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0, name: rock.kind }));
    const mesh = new THREE.Mesh(keep(layerWalls(i)), mat);
    mesh.name = `layer-${i}`;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  });
  // the surface
  const soil = keep(soilTexture());
  const topMat = keep(new THREE.MeshStandardMaterial({ map: soil, roughness: 0.95, name: 'soil' }));
  const topGeo = keep(new THREE.PlaneGeometry(WIDTH, DEPTH_Z));
  topGeo.rotateX(-Math.PI / 2);
  topGeo.translate(0, 0, (Z0 + Z1) / 2);
  const top = new THREE.Mesh(topGeo, topMat);
  top.name = 'surface';
  top.receiveShadow = true;
  root.add(top);
  // a dark edge along the boundaries on the cut faces (thin bands, so the layers read at a glance)
  const edgeMat = keep(new THREE.LineBasicMaterial({ color: '#2a2622', transparent: true, opacity: 0.55 }));
  const edges = new THREE.Group();
  edges.name = 'boundary-edges';
  for (let k = -1; k < 4; k++) {
    const pts = [];
    const n = 72;
    const run = [
      [X0, Z1, X1, Z1],
      [X1, Z1, X1, Z0],
    ];
    for (const [ax, az, bx, bz] of run)
      for (let j = 0; j <= n; j++) {
        const x = ax + ((bx - ax) * j) / n;
        const z = az + ((bz - az) * j) / n;
        pts.push(new THREE.Vector3(x + (bx === X1 && ax === X1 ? 0.6 : 0), k < 0 ? 0.5 : boundaryY(k, x, z), z + (az === Z1 && bz === Z1 ? 0.6 : 0)));
      }
    const line = new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(pts)), edgeMat);
    edges.add(line);
  }
  root.add(edges);

  // the waves: one plane on the cut face, one just over the surface
  const waveFront = keep(waveMaterial(0));
  const waveTop = keep(waveMaterial(1));
  const wf = new THREE.Mesh(keep(new THREE.PlaneGeometry(WIDTH, -BOTTOM)), waveFront);
  wf.position.set(0, BOTTOM / 2, Z1 + 3);
  wf.renderOrder = 6;
  const wt = new THREE.Mesh(keep(new THREE.PlaneGeometry(WIDTH, DEPTH_Z)), waveTop);
  wt.rotation.x = -Math.PI / 2;
  wt.position.set(0, 3, (Z0 + Z1) / 2);
  wt.renderOrder = 6;
  for (const m of [wf, wt]) {
    m.userData.noExport = true;
    m.frustumCulled = false;
    root.add(m);
  }

  // ── the 3D picture: the mapped boundaries; the dome's top shaded and coloured by what lies under it; gas and
  // oil in the arch on the right cut face ───────────────────────────────────────────────────────────────────
  const mapped = new THREE.Group();
  mapped.name = 'mapped';
  const contours = keep(contourTexture());
  const PALE = [
    [600, new THREE.Color('#fff1dc')],
    [800, new THREE.Color('#f3d9b5')],
    [1010, new THREE.Color('#c99d73')],
  ];
  const GAS_C = new THREE.Color(GAS_COLOR);
  const OIL_C = new THREE.Color(OIL_COLOR);
  let deepBase = null; // the dome top's colours without and with the gas and oil under it
  let deepFluid = null;
  const sheets = DEPTHS.map((_, k) => {
    const deep = k === 2;
    const geo = keep(
      heightField((x, z) => boundaryY(k, x, z) + 0.5, {
        nx: deep ? 96 : 40,
        nz: deep ? 68 : 28,
        uv: (x, y, z) => [Math.min(0.98, 0.02 + domeAt(x, z) * 3), -y / 25],
      }),
    );
    if (deep) {
      // pale where it is high, darker down the flanks; red where gas lies under it, brown where oil does
      const p = geo.attributes.position;
      deepBase = new Float32Array(p.count * 3);
      deepFluid = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const d = -p.getY(i);
        const j = d < PALE[1][0] ? 0 : 1;
        const [d0, c0] = PALE[j];
        const [d1, c1] = PALE[j + 1];
        c.copy(c0).lerp(c1, THREE.MathUtils.clamp((d - d0) / (d1 - d0), 0, 1));
        c.toArray(deepBase, i * 3);
        if (d < GOC) c.copy(GAS_C);
        else if (d < OWC) c.copy(OIL_C);
        c.toArray(deepFluid, i * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(deepBase.slice(), 3));
    }
    const mat = keep(
      new THREE.MeshStandardMaterial({
        color: deep ? '#ffffff' : ECHO_COLORS[k],
        vertexColors: deep,
        map: deep ? contours : null,
        roughness: deep ? 0.55 : 0.7,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = deep ? 'mapped-dome-top' : `mapped-boundary-${k + 1}`;
    mesh.renderOrder = 3 - k;
    mesh.userData.full = deep ? 1 : 0.13;
    mapped.add(mesh);
    return mesh;
  });
  /** A band on the right cut face (x = X1) between top(z) and bottom(z), clamped so it vanishes where top < bottom. */
  function faceBand(top, bottom, color, name) {
    const n = 140;
    const pos = [];
    const idx = [];
    for (let j = 0; j <= n; j++) {
      const z = Z1 - ((Z1 - Z0) * j) / n;
      const yb = bottom(z);
      pos.push(X1 + 1.5, Math.max(yb, top(z)), z, X1 + 1.5, yb, z);
    }
    for (let j = 0; j < n; j++) {
      const q = j * 2;
      idx.push(q, q + 1, q + 2, q + 2, q + 1, q + 3);
    }
    const geo = keep(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(
      geo,
      keep(new THREE.MeshStandardMaterial({ color, roughness: 0.5, transparent: true, opacity: 0, side: THREE.DoubleSide })),
    );
    m.name = name;
    m.visible = false;
    m.renderOrder = 2;
    mapped.add(m);
    return m;
  }
  const cap = (z) => boundaryY(2, X1, z);
  const gas = faceBand(cap, () => -GOC, GAS_COLOR, 'gas');
  gas.material.emissive.set('#4a0b0d');
  const oil = faceBand(
    (z) => Math.min(cap(z), -GOC),
    () => -OWC,
    OIL_COLOR,
    'oil',
  );
  root.add(mapped);

  /** Where the gas and the oil are seen best (for their labels): in the arch on the right face. */
  const gasPoint = new THREE.Vector3(X1, (cap(DOME.z) - GOC) / 2, DOME.z);
  const oilPoint = new THREE.Vector3(X1, -(GOC + OWC) / 2, DOME.z + 230);

  // how see-through the rock above the oil is (1: solid; the 3D picture fades it)
  /** A material made see-through (or solid again); recompiled only when that changes. */
  function seeThrough(m, opacity) {
    const tr = opacity < 0.999;
    if (m.transparent !== tr) {
      m.transparent = tr;
      m.depthWrite = !tr;
      m.needsUpdate = true;
    }
    m.opacity = opacity;
  }
  function setReveal(k) {
    const a = THREE.MathUtils.clamp(k, 0, 1);
    for (let i = 0; i < walls.length; i++) {
      seeThrough(walls[i].material, i <= 2 ? 1 - 0.9 * a : 1);
      walls[i].renderOrder = i <= 2 && a > 0 ? 4 : 0;
    }
    seeThrough(topMat, 1 - 0.9 * a);
    top.renderOrder = a > 0 ? 5 : 0;
    edgeMat.opacity = 0.55 * (1 - 0.5 * a);
  }
  let fluidShown = -1;
  /** The mapped boundaries (0 … 1), then the gas and oil (0 … 1). */
  function setMapped(k, fluids) {
    for (const s of sheets) {
      s.visible = k > 0;
      seeThrough(s.material, s.userData.full * k);
    }
    // the dome's top takes the colours of the gas and oil under it
    const col = sheets[2].geometry.attributes.color;
    const f = THREE.MathUtils.clamp(fluids, 0, 1);
    if (fluidShown !== f) {
      fluidShown = f;
      for (let i = 0; i < col.array.length; i++) col.array[i] = deepBase[i] + (deepFluid[i] - deepBase[i]) * f;
      col.needsUpdate = true;
    }
    for (const m of [gas, oil]) {
      m.visible = fluids > 0;
      seeThrough(m.material, fluids);
    }
  }
  setReveal(0);
  setMapped(0, 0);

  /** The waves: R = v t (m), on = whether they show. */
  function setWave(R, on = true) {
    for (const m of [waveFront, waveTop]) {
      m.uniforms.uR.value = R;
      m.uniforms.uOn.value = on ? 1 : 0;
    }
  }

  return {
    root,
    walls,
    top,
    sheets,
    gas,
    oil,
    gasPoint,
    oilPoint,
    box: new THREE.Box3(new THREE.Vector3(X0, BOTTOM, Z0), new THREE.Vector3(X1, 0, Z1)),
    setReveal,
    setMapped,
    setWave,
    /** The point on the cut face in front, on boundary k, at x. */
    frontPoint: (k, x, target = new THREE.Vector3()) => target.set(x, boundaryY(k, x, Z1), Z1),
    /** The middle of rock layer i on the cut face (for its name). */
    rockPoint: (i, x, target = new THREE.Vector3()) => target.set(x, (topOf(i)(x, Z1) + bottomOf(i)(x, Z1)) / 2, Z1),
    dispose() {
      for (const d of disposables) d.dispose?.();
    },
  };
}

export { BASE_DEPTH, V };
