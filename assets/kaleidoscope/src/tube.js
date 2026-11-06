// The kaleidoscope, in cm, as the book makes it: three strips of glass in a triangle, paper wrapped round them (one side left
// open so that the inside shows), thin paper over the far end, and on it a few stones, beads and pieces of bangle.
//
// What the eye sees is exact and costs almost nothing. The far end is drawn once, into a small texture, from the same bodies
// that lie in the tube (6 draw calls, and only while they roll). The end plane is then a mesh of WINDOW² triangles: reading.js
// says which corner of the real cell stands at each corner of each cell, so the texture laid on with those corners IS the
// reflected picture, seam to seam, with no shader and no second view. Each vertex carries the light that really gets there
// (Fresnel at every reflection).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createBeads, PIECES } from './beads.js';
import { brightness, CORNERS, lattice, TUBE } from './reading.js';

const { L, s: SIDE, r: R } = TUBE;
const T = 0.22; // the glass
const P = 0.07; // the paper round it
const BEAD_X = L - 0.2; // the bodies lie on the paper
const EXPOSE = 1.45; // the eye opens up in a dark tube: the same ratios between the cells, a brighter whole
const OVER = 1.2; // a piece is drawn this much larger than the round body that rolls: glass lies a little over glass
const SPIN = [0, (-2 * Math.PI) / 3, (2 * Math.PI) / 3]; // from the bottom wall to each wall, about the axis
export const AXIS_Y = R + T + P + 0.03; // the height of the axis over the table: the tube lies on its paper
const RT_HALF = SIDE * 0.52; // half the square of the far end's picture
const RT_MID = R / 2;
const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Kraft paper wound round the tube, as the book's picture: long fibres and the edges of each turn. */
function paperTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#c8a46c';
  g.fillRect(0, 0, 512, 256);
  let seed = 11;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = `rgba(${rnd() < 0.5 ? '96,66,30' : '236,212,168'},${0.05 + rnd() * 0.1})`;
    g.lineWidth = 0.5 + rnd();
    const x = rnd() * 512;
    const y = rnd() * 256;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 12 + rnd() * 40, y + (rnd() - 0.5) * 3);
    g.stroke();
  }
  g.strokeStyle = 'rgba(92,62,28,0.32)';
  g.lineWidth = 1.4;
  for (let i = 1; i < 6; i++) {
    const x = (i * 512) / 6;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 28, 256);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
/** The thin paper with light coming through it: brightest in the middle. */
function tissueTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 8, 128, 128, 150);
  r.addColorStop(0, '#fffdf4');
  r.addColorStop(0.55, '#fff3d6');
  r.addColorStop(1, '#f2d9a6');
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}
/**
 * The far end as the eye sees it, with the light coming through: warm in the middle, with soft blots where the thin paper is
 * thicker. Only for the small picture.
 */
function backlightTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 118, 6, 128, 128, 170);
  r.addColorStop(0, '#fffbe9');
  r.addColorStop(0.5, '#ffedc4');
  r.addColorStop(1, '#f6c98a');
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  let seed = 23;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (const tint of ['255,150,120', '150,210,235', '255,205,110', '215,165,235', '150,225,190', '255,150,120']) {
    const x = rnd() * 256;
    const y = rnd() * 256;
    const q = 50 + rnd() * 50;
    const b = g.createRadialGradient(x, y, 2, x, y, q);
    b.addColorStop(0, `rgba(${tint},0.42)`);
    b.addColorStop(1, `rgba(${tint},0)`);
    g.fillStyle = b;
    g.fillRect(0, 0, 256, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}
/** A round soft spot: the colour a piece of glass throws on the paper. */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,0.5)');
  r.addColorStop(0.6, 'rgba(255,255,255,0.26)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

// The bodies are coloured glass with light behind them, so they do not shine: they filter. What comes through a piece is the
// light behind it times its colour, raised to how much glass the light crosses (Beer–Lambert): pale and soft at the thin rim,
// deep where it is thick, and a little clearer in the very middle, where a rounded piece gathers the light. So a piece needs
// no lights and no white highlights, and where two pieces overlap their colours multiply, as real glass does.
function bake(geo) {
  const nor = geo.attributes.normal;
  const n = nor.count;
  const thick = new Float32Array(n);
  const v = new THREE.Vector3();
  const step = (a, b, x) => {
    const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return k * k * (3 - 2 * k);
  };
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(nor, i);
    const f = Math.max(0, -v.x);
    thick[i] = 0.08 + 0.92 * step(0, 0.5, f) - 0.5 * step(0.55, 1, f);
  }
  geo.setAttribute('aThick', new THREE.BufferAttribute(thick, 1));
  return geo;
}
function stoneGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const pos = g.attributes.position;
  // a tumbled stone: each corner pushed a little, the same push for the same corner, so that the faces stay closed
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const h = Math.sin(x * 12.9 + y * 78.2 + z * 37.7) * 43758.5;
    const k = 0.92 + 0.14 * (h - Math.floor(h));
    pos.setXYZ(i, x * k * 0.5, y * k, z * k);
  }
  g.computeVertexNormals();
  return bake(g);
}
function beadGeometry() {
  return bake(new THREE.TorusGeometry(0.66, 0.34, 10, 20).rotateY(Math.PI / 2));
}
function bangleGeometry() {
  const arc = 1.5;
  const R0 = 1.5;
  const g = new THREE.TorusGeometry(R0, 0.22, 8, 16, arc).rotateZ(-arc / 2 + Math.PI / 2).translate(0, -R0 * Math.cos(arc / 4), 0);
  g.rotateY(Math.PI / 2);
  return bake(g);
}
function glassMaterial() {
  const m = new THREE.MeshBasicMaterial({
    name: 'ColouredGlass',
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.DstColorFactor, // what is behind × what the glass lets through
    blendDst: THREE.ZeroFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
  });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = `attribute float aThick;\nvarying float vThick;\n${sh.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  vThick = aThick;',
    );
    sh.fragmentShader = `varying float vThick;\n${sh.fragmentShader}`.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\n  diffuseColor.rgb = pow(max(diffuseColor.rgb, vec3(0.012)), vec3(max(vThick, 0.0)));',
    );
  };
  m.customProgramCacheKey = () => 'kld-glass-2';
  return m;
}

export function createTube({ shadow }) {
  const root = new THREE.Group();
  root.name = 'Kaleidoscope';
  root.position.set(-L / 2, AXIS_Y, 0);
  const body = new THREE.Group();
  body.name = 'Tube';
  root.add(body);

  // ── the paper and the glass ─────────────────────────────────────────────────────────────────────────────────
  const outer = R + T + 0.01; // the paper lies on the glass's outside
  const sideOut = 2 * Math.sqrt(3) * (outer + P);
  const face = (x0, x1, j) => new THREE.BoxGeometry(x1 - x0, P, sideOut).translate((x0 + x1) / 2, -(outer + P / 2), 0).rotateX(SPIN[j]);
  const paperMap = paperTexture();
  const paperMat = new THREE.MeshStandardMaterial({ name: 'Paper', map: paperMap, roughness: 0.86, metalness: 0 });
  const wrap = new THREE.Mesh(mergeGeometries([face(0, L, 0), face(0, L, 2), face(0, 1.1, 1), face(L - 0.7, L, 1)]), paperMat);
  wrap.name = 'PaperWrap';
  wrap.castShadow = shadow;
  wrap.receiveShadow = shadow;

  const W = SIDE + T * 1.15;
  const strip = (j) => new THREE.BoxGeometry(L, T, W).translate(L / 2, -(R + T / 2), 0).rotateX(SPIN[j]);
  const glass = new THREE.Mesh(
    mergeGeometries([strip(0), strip(1), strip(2)]),
    new THREE.MeshStandardMaterial({
      name: 'Glass',
      color: '#d8efe6',
      roughness: 0.06,
      metalness: 0.1,
      transparent: true,
      opacity: 0.13,
      envMapIntensity: 2.4,
      depthWrite: false,
    }),
  );
  glass.name = 'GlassStrips';
  glass.renderOrder = 20;
  // the dark paper behind the glass, as a real one has it, lit from the far end: the strips read as glass, not as cardboard
  const backing = mergeGeometries(
    [0, 2].map((j) => new THREE.BoxGeometry(L, 0.012, sideOut * 0.97, 10, 1, 1).translate(L / 2, -(outer - 0.008), 0).rotateX(SPIN[j])),
  );
  {
    const pos = backing.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const near = new THREE.Color('#12171c');
    const far = new THREE.Color('#4f6068');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      c.lerpColors(near, far, (pos.getX(i) / L) ** 2.2);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    backing.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const liner = new THREE.Mesh(backing, new THREE.MeshStandardMaterial({ name: 'DarkBacking', vertexColors: true, roughness: 0.42, metalness: 0.1 }));
  liner.name = 'DarkBacking';
  // the bare edges of the glass, faint green
  const rims = [];
  for (let j = 0; j < 3; j++) {
    for (const x of [0.02, L - 0.02]) rims.push(new THREE.BoxGeometry(0.04, T, W).translate(x, -(R + T / 2), 0).rotateX(SPIN[j]));
    for (const u of [-W / 2, W / 2]) rims.push(new THREE.BoxGeometry(L, T, 0.05).translate(L / 2, -(R + T / 2), u).rotateX(SPIN[j]));
  }
  const edge = new THREE.Mesh(
    mergeGeometries(rims),
    new THREE.MeshStandardMaterial({ name: 'GlassEdge', color: '#58c4a0', roughness: 0.2, emissive: '#10382c' }),
  );
  edge.name = 'GlassEdges';

  // two bits of blue tape, as in চিত্র ৮.১১
  const tape = new THREE.Mesh(
    mergeGeometries([0.55, L - 0.35].map((x) => new THREE.BoxGeometry(0.5, 0.03, 1.5).translate(x, -(outer + P + 0.015), 0).rotateX(SPIN[1]))),
    new THREE.MeshStandardMaterial({ name: 'Tape', color: '#7cc3ea', roughness: 0.5 }),
  );
  tape.name = 'Tape';

  // the thin paper at the far end, with light coming through
  const tissueMap = tissueTexture();
  const k = (outer + P) / R;
  const end = new THREE.BufferGeometry();
  const tri = CORNERS.map((c) => [c[0] * k, c[1] * k]);
  end.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      tri.flatMap((c) => [L + 0.01, c[1], c[0]]),
      3,
    ),
  );
  end.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(
      tri.flatMap((c) => [0.5 + c[0] / 6, 0.5 + c[1] / 6]),
      2,
    ),
  );
  end.setIndex([0, 1, 2]);
  end.computeVertexNormals();
  const tissue = new THREE.Mesh(end, new THREE.MeshBasicMaterial({ name: 'ThinPaper', map: tissueMap, side: THREE.DoubleSide, toneMapped: false }));
  tissue.name = 'ThinPaper';
  body.add(wrap, liner, edge, tape, tissue, glass);

  // ── the bodies ──────────────────────────────────────────────────────────────────────────────────────────────
  const beads = createBeads();
  const geos = [stoneGeometry(), beadGeometry(), bangleGeometry()];
  const glassBody = glassMaterial();
  const parts = geos.map((g, kind) => {
    const ids = PIECES.flatMap((b, i) => (b.kind === kind ? [i] : []));
    const m = new THREE.InstancedMesh(g, glassBody, ids.length);
    m.name = ['Stones', 'Beads', 'BanglePieces'][kind];
    m.frustumCulled = false;
    ids.forEach((id, q) => {
      m.setColorAt(q, new THREE.Color(PIECES[id].colour));
    });
    return { mesh: m, ids };
  });
  for (const p of parts) body.add(p.mesh);

  // ── the small picture of the far end ────────────────────────────────────────────────────────────────────────
  const cellScene = new THREE.Scene();
  const paperQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(RT_HALF * 2.4, RT_HALF * 2.4).rotateY(-Math.PI / 2).translate(L + 0.3, RT_MID, 0),
    new THREE.MeshBasicMaterial({ map: backlightTexture(), toneMapped: false }),
  );
  paperQuad.renderOrder = -2;
  cellScene.add(paperQuad);
  // the join of two strips: a faint dark line along each edge of the cell, so it comes out in every cell, exactly on the seams
  {
    const shape = new THREE.Shape(CORNERS.map((c) => new THREE.Vector2(c[0] * 1.03, c[1] * 1.03)));
    shape.holes.push(new THREE.Path(CORNERS.map((c) => new THREE.Vector2(c[0] * 0.982, c[1] * 0.982))));
    const seam = new THREE.Mesh(
      new THREE.ShapeGeometry(shape).rotateY(-Math.PI / 2).translate(L - 0.6, 0, 0),
      new THREE.MeshBasicMaterial({
        color: '#33261a',
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    seam.renderOrder = 5;
    cellScene.add(seam);
  }
  for (const p of parts) {
    const copy = new THREE.InstancedMesh(p.mesh.geometry, glassBody, p.ids.length);
    copy.instanceMatrix = p.mesh.instanceMatrix;
    copy.instanceColor = p.mesh.instanceColor;
    copy.frustumCulled = false;
    copy.renderOrder = 2; // over the soft colour they throw on the paper
    cellScene.add(copy);
  }
  const glows = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(2, 2).rotateY(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, toneMapped: false }),
    PIECES.length,
  );
  glows.frustumCulled = false;
  glows.renderOrder = 1;
  PIECES.forEach((b, i) => {
    glows.setColorAt(i, new THREE.Color(b.colour));
  });
  glows.position.x = L + 0.1;
  cellScene.add(glows);
  const cellCam = new THREE.OrthographicCamera(-RT_HALF, RT_HALF, RT_HALF, -RT_HALF, 0.1, 12);
  cellCam.position.set(L - 5, RT_MID, 0);
  cellCam.lookAt(L, RT_MID, 0);
  cellCam.updateMatrixWorld();
  const target = new THREE.WebGLRenderTarget(512, 512, {
    samples: 4,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    colorSpace: THREE.SRGBColorSpace,
  });
  target.texture.anisotropy = 4;
  let dirty = true;
  const mx = new THREE.Matrix4();
  /** Puts the bodies where the rolling left them. */
  function syncBeads() {
    const e = mx.elements;
    for (const p of parts) {
      p.ids.forEach((id, q) => {
        const a = beads.angle[id];
        const c = Math.cos(a);
        const n = Math.sin(a);
        const r = beads.radius[id] * OVER;
        // turned about the axis, sizes in cm; the tube's u is z, its v is y
        e[0] = r;
        e[1] = 0;
        e[2] = 0;
        e[4] = 0;
        e[5] = c * r;
        e[6] = -n * r;
        e[8] = 0;
        e[9] = n * r;
        e[10] = c * r;
        e[12] = BEAD_X;
        e[13] = beads.py[id];
        e[14] = beads.px[id];
        p.mesh.setMatrixAt(q, mx);
      });
      p.mesh.instanceMatrix.needsUpdate = true;
    }
    mx.identity();
    for (let i = 0; i < PIECES.length; i++) {
      const r = beads.radius[i] * 1.75;
      e[0] = r;
      e[5] = r;
      e[10] = r;
      e[12] = 0;
      e[13] = beads.py[i];
      e[14] = beads.px[i];
      glows.setMatrixAt(i, mx);
    }
    glows.instanceMatrix.needsUpdate = true;
    dirty = true;
  }
  syncBeads();
  /** Draws the small picture, if anything moved. Call between frames. */
  function renderCell(renderer, size) {
    if (target.width !== size) {
      target.setSize(size, size);
      dirty = true;
    }
    if (!dirty || !(lat.visible || ghostOn)) return;
    dirty = false;
    const before = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.render(cellScene, cellCam);
    renderer.setRenderTarget(before);
  }

  // ── the end plane, cell by cell ─────────────────────────────────────────────────────────────────────────────
  const cells = lattice();
  const uvOf = (c) => [0.5 + c[0] / (2 * RT_HALF), 0.5 + (c[1] - RT_MID) / (2 * RT_HALF)];
  function mesh(list, material) {
    const n = list.length * 3;
    const pos = new Float32Array(n * 3);
    const uv = new Float32Array(n * 2);
    const col = new Float32Array(n * 3);
    list.forEach((c, i) => {
      for (let q = 0; q < 3; q++) {
        const at = i * 3 + q;
        const v = c.verts[q];
        pos[at * 3] = L;
        pos[at * 3 + 1] = v[1];
        pos[at * 3 + 2] = v[0];
        const w = uvOf(CORNERS[c.corners[q]]);
        uv[at * 2] = w[0];
        uv[at * 2 + 1] = w[1];
        const b = EXPOSE * brightness(v, c.crossings);
        col[at * 3] = b;
        col[at * 3 + 1] = b;
        col[at * 3 + 2] = b;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, material);
    m.frustumCulled = false;
    m.userData.noExport = true;
    return m;
  }
  const latMat = new THREE.MeshBasicMaterial({
    name: 'Cells',
    map: target.texture,
    vertexColors: true,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const lat = mesh(cells, latMat);
  lat.name = 'Cells';
  lat.renderOrder = 51;
  lat.visible = false;
  // the dark round everything, once the eye is at the tube (from wide views past the edge of the window)
  const darkMat = new THREE.MeshBasicMaterial({
    color: '#0d1219',
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const dark = new THREE.Mesh(new THREE.CircleGeometry(400, 24).rotateY(-Math.PI / 2).translate(L, 0, 0), darkMat);
  dark.userData.noExport = true;
  dark.renderOrder = 50;
  dark.visible = false;
  dark.frustumCulled = false;
  root.add(lat, dark);

  // the pictures of cells hanging beside the tube, for "why"
  const ghostMat = new THREE.MeshBasicMaterial({
    name: 'CellGhost',
    map: target.texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    toneMapped: false,
  });
  let ghosts = [];
  let ghostOn = false;
  /** The cells to hang beside the tube, in order. */
  function setGhosts(list) {
    ghosts = list.map((c, i) => {
      const m = mesh([c], ghostMat.clone());
      m.name = `CellGhost${i + 1}`;
      m.renderOrder = 15;
      m.visible = false;
      root.add(m);
      return m;
    });
  }
  /** How far each hanging cell has come, 0 … 1. */
  function showGhosts(levels) {
    ghostOn = false;
    ghosts.forEach((m, i) => {
      const a = levels[i] ?? 0;
      m.visible = a > 0;
      m.material.opacity = 0.78 * a;
      if (a > 0) ghostOn = true;
    });
  }

  let peek = 0;
  let mask = 0;
  /** 0 the tube from outside, 1 the eye at the tube, everything seen is the reflected view. */
  function setPeek(k) {
    peek = k;
    const a = smooth(0.62, 0.96, k);
    latMat.opacity = a;
    darkMat.opacity = a;
    dark.visible = a > 0;
    lat.visible = a > 0;
    body.visible = a < 1;
    mask = a;
  }
  function setPhi(phi) {
    root.rotation.x = phi;
    root.updateMatrixWorld(true);
  }
  setPeek(0);
  setPhi(0);

  /** For the book's GLB: the tube and what is in it, with the kit baking the instances. */
  function exportModel() {
    const out = new THREE.Group();
    out.name = 'kaleidoscope';
    const c = body.clone(true);
    // the whole tube whatever the step: in the eye's view the body is hidden (only the end is seen), and the exporter
    // leaves hidden parts out
    c.visible = true;
    c.traverse((n) => {
      if (n.isMesh) n.castShadow = n.receiveShadow = false;
    });
    for (const p of c.children)
      if (p.isInstancedMesh) {
        const g = p.geometry.clone();
        g.deleteAttribute('aThick');
        p.geometry = g;
        p.material = new THREE.MeshStandardMaterial({ name: `${p.name}-glass`, roughness: 0.25 });
      }
    out.add(c);
    return out;
  }

  return {
    root,
    body,
    wrap,
    glass,
    beads,
    cells,
    syncBeads,
    renderCell,
    /** The small picture's render target, for the stage's warm-up: compiled ahead with what is drawn into it. */
    warmTarget: { target, scene: cellScene, camera: cellCam },
    setPeek,
    setPhi,
    setGhosts,
    showGhosts,
    exportModel,
    get peek() {
      return peek;
    },
    get mask() {
      return mask;
    },
  };
}
