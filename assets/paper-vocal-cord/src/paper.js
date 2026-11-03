// The paper vocal cord of চিত্র ৭.১০, in millimetres: a strip of a ruled exercise book (খাতা) folded in half, the fold
// standing upright at x = 0, the two halves opening toward the mouth (−x) at ±ALPHA like a half-open book. At the fold
// a slit was cut down the crease from the top edge (14 mm) and a short cut across at its foot, L mm into each half:
// so each half has a flap (the কাটা টুকরো) still held along a line L mm back from the crease (its hinge) and free at
// the crease, its top edge the paper's top edge. The two free edges meet at the crease like the two vocal cords; blown
// air pushes them outward, a thin slit opens between them, a puff escapes, the paper springs back and shuts it again.
//
// Real proportions: a 31 × 24 mm strip of writing paper folded in half (0.1 mm thick; drawn 0.3 mm so its cut edges
// read), flaps 14 mm tall, the cuts 0.6 mm wide. The swing is drawn large (0.2·L; a paper reed moves far less) so the
// two tongues are seen opening into a V, a little wider at the top than at the foot; the panel says it is enlarged.
// The paper is a soft physical material: a fibre texture with faint blue rules, a fibre bump, and a faint warm glow
// where light comes through it (cheap translucency, no transmission pass). While it vibrates a faint copy of each flap
// at its widest swing shows the motion.
// Procedural: an extruded outline per half (the notch the flap sits in), a rounded crease below the slit, each flap a
// thin slab bent as a cantilever every frame, and the slit a thin dark strip between the two free edges.
import * as THREE from 'three';
import { bendShape } from './reading.js';

export const SHEET = { W: 15.4, H: 24, T: 0.3, alpha: THREE.MathUtils.degToRad(62), h: 14, kerf: 0.6, gap: 0.2 };
/** How far the free edge swings out at full opening, as a share of the flap's length (drawn large, see above). */
const SWING = 0.2;
/** The free edge swings a little further at the top (free) corner than at the foot: yn is −1 at the foot, +1 at the top. */
const taper = (yn) => 0.92 + 0.2 * yn;
/** At rest the two free edges stay a hair apart, like lips (a share of the full opening). */
const LIPS = 0.03;
const Y = new THREE.Vector3(0, 1, 0);

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Writing paper, one tile 64 mm square (1024 px, 16 px a millimetre): a warm off-white with soft cloudy formation
 * (the uneven spread of the pulp), many fine fibres, faint blue rules every 8 mm; a bump map of the same fibres.
 */
function paperTextures() {
  const S = 1024;
  const px = S / 64;
  const make = (draw) => {
    const c = document.createElement('canvas');
    c.width = c.height = S;
    draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')));
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / 64, 1 / 64);
    t.anisotropy = 8;
    return t;
  };
  const r = rng(11);
  const clouds = [];
  for (let i = 0; i < 140; i++) clouds.push([r() * S, r() * S, 10 + r() * 46, r()]);
  const fibres = [];
  for (let i = 0; i < 4200; i++) fibres.push([r() * S, r() * S, r() * Math.PI, 3 + r() * 16, r()]);
  /** Draws something wrapped round the tile's edges, so the tile repeats without a seam. */
  const wrapped = (g, x, y, reach, draw) => {
    for (const dx of [-S, 0, S])
      for (const dy of [-S, 0, S]) if (x + dx > -reach && x + dx < S + reach && y + dy > -reach && y + dy < S + reach) draw(g, x + dx, y + dy);
  };
  const map = make((g) => {
    g.fillStyle = '#f4efe3';
    g.fillRect(0, 0, S, S);
    // formation: soft lighter and darker clouds
    for (const [x, y, rad, k] of clouds)
      wrapped(g, x, y, rad, (gg, cx, cy) => {
        const grad = gg.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const c = k > 0.5 ? '255,253,246' : '214,204,184';
        grad.addColorStop(0, `rgba(${c},${0.1 + 0.08 * (k % 0.5)})`);
        grad.addColorStop(1, `rgba(${c},0)`);
        gg.fillStyle = grad;
        gg.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      });
    g.lineCap = 'round';
    for (const [x, y, a, l, k] of fibres)
      wrapped(g, x, y, l, (gg, cx, cy) => {
        gg.strokeStyle = k > 0.55 ? `rgba(128,112,86,${0.04 + 0.05 * k})` : `rgba(255,255,252,${0.18 + 0.25 * k})`;
        gg.lineWidth = 0.6 + 0.6 * k;
        gg.beginPath();
        gg.moveTo(cx, cy);
        gg.quadraticCurveTo(cx + Math.cos(a + 0.4) * l * 0.5, cy + Math.sin(a + 0.4) * l * 0.5, cx + Math.cos(a) * l, cy + Math.sin(a) * l);
        gg.stroke();
      });
    // the exercise book's rules, printed faint blue (they run from the crease to the edge), 0.2 mm wide
    for (let mm = 4; mm < 64; mm += 8) {
      const y = S - mm * px;
      g.fillStyle = 'rgba(92,140,200,0.42)';
      g.fillRect(0, y - 1.5, S, 3);
      g.fillStyle = 'rgba(92,140,200,0.14)';
      g.fillRect(0, y - 3, S, 6);
    }
  });
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = make((g) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, S, S);
    g.lineCap = 'round';
    for (const [x, y, a, l, k] of fibres)
      wrapped(g, x, y, l, (gg, cx, cy) => {
        gg.strokeStyle = k > 0.5 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)';
        gg.lineWidth = 1.4;
        gg.beginPath();
        gg.moveTo(cx, cy);
        gg.quadraticCurveTo(cx + Math.cos(a + 0.4) * l * 0.5, cy + Math.sin(a + 0.4) * l * 0.5, cx + Math.cos(a) * l, cy + Math.sin(a) * l);
        gg.stroke();
      });
  });
  bump.colorSpace = THREE.NoColorSpace;
  return { map, bump };
}

/** The outline of one half, in its own (s, y) mm: s from the crease (0) to the outer edge (W); the notch of the flap. */
function halfShape(L) {
  const { W, H, h, kerf } = SHEET;
  const s = new THREE.Shape();
  const low = H / 2 - h - kerf; // the cut across, under the flap
  s.moveTo(0, -H / 2);
  s.lineTo(W, -H / 2);
  s.lineTo(W, H / 2);
  s.lineTo(L, H / 2);
  s.lineTo(L, low);
  s.lineTo(0, low);
  s.closePath();
  return s;
}
/** The middle of the flaps' height (mm): the slot the air goes through. */
export const SLOT_Y = SHEET.H / 2 - SHEET.h / 2;

/**
 * The folded paper. `setCut(L)` makes flaps L mm long; `setOpen(k)` bends both flaps (0 shut … 1 wide open);
 * `edgePoint(side, out)` gives the middle of a flap's free edge (world), `hingePoint(side, out)` its hinge.
 */
export function createPaper() {
  const { W, H, T, alpha, h, gap } = SHEET;
  const root = new THREE.Group();
  root.name = 'PaperVocalCord';
  const tex = paperTextures();
  // paper: rough, matte, and a faint warm glow of light coming through it
  const mat = new THREE.MeshStandardMaterial({
    name: 'Paper',
    color: '#ffffff',
    map: tex.map,
    bumpMap: tex.bump,
    bumpScale: 0.35,
    roughness: 0.86,
    metalness: 0,
    emissive: new THREE.Color('#f1e3c4'),
    emissiveMap: tex.map,
    emissiveIntensity: 0.1,
  });
  // the cut and outer edges: the paper's thickness, a little greyer (fibre ends)
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'PaperEdge', color: '#ddd5c4', roughness: 0.95 });
  // the flaps a hair warmer than the walls (handled, bent paper), so the two cut pieces read as their own shapes
  const flapMat = mat.clone();
  flapMat.name = 'PaperFlap';
  flapMat.color.set('#f7e8cb');
  // the cut across under each flap: a thin dark gap (the shade inside the fold seen through it)
  const kerfMat = new THREE.MeshBasicMaterial({ name: 'Cut', color: '#4a4136' });
  const ghostMat = new THREE.MeshBasicMaterial({ color: '#fbf6ea', transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });

  const halves = [1, -1].map((side) => {
    // the half's frame: s along u (crease → edge), y up, w = u × y through the paper
    const u = new THREE.Vector3(-Math.cos(alpha), 0, side * Math.sin(alpha));
    const w = new THREE.Vector3().crossVectors(u, Y);
    const out = new THREE.Vector3(Math.sin(alpha), 0, side * Math.cos(alpha)); // away from the inside of the fold
    const sign = Math.sign(out.dot(w));
    const g = new THREE.Group();
    g.name = side > 0 ? 'NearHalf' : 'FarHalf';
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, Y, w));
    root.add(g);
    const leaf = new THREE.Mesh(undefined, [mat, edgeMat]);
    leaf.name = side > 0 ? 'NearLeaf' : 'FarLeaf';
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    // the flap: a thin slab, 16 pieces along its length, bent every frame (faces: the cut edges, then the two sides)
    const flapGeo = new THREE.BoxGeometry(1, h, 1, 16, 4, 1);
    // bend() maps the box's x backward (hinge at +L, free edge near 0), which mirrors it: turn the triangles so its faces
    // stay outward (inside out, the slab would shadow itself)
    const tri = flapGeo.index.array;
    for (let i = 0; i < tri.length; i += 3) [tri[i + 1], tri[i + 2]] = [tri[i + 2], tri[i + 1]];
    const base = flapGeo.attributes.position.array.slice();
    const flap = new THREE.Mesh(flapGeo, [edgeMat, edgeMat, edgeMat, edgeMat, flapMat, flapMat]);
    flap.name = side > 0 ? 'NearFlap' : 'FarFlap';
    flap.castShadow = true;
    flap.receiveShadow = true;
    // the ghost: the same flap at its widest swing, faint (a motion trail while it vibrates)
    const ghost = new THREE.Mesh(flapGeo.clone(), ghostMat);
    ghost.name = 'FlapSwing';
    ghost.userData.noExport = true;
    ghost.renderOrder = 2;
    ghost.visible = false;
    const kerf = new THREE.Mesh(new THREE.BoxGeometry(1, SHEET.kerf, T * 0.8), kerfMat);
    kerf.name = 'Cut';
    kerf.userData.noExport = true;
    g.add(leaf, flap, ghost, kerf);
    return { side, u, w, out, sign, g, leaf, flap, ghost, kerf, base };
  });

  // the crease, rounded, below the slit
  const creaseLen = H - h - SHEET.kerf;
  const c = new THREE.Mesh(new THREE.CylinderGeometry(T * 0.62, T * 0.62, creaseLen, 12), edgeMat);
  c.name = 'Crease';
  c.position.set(T * 0.25, -H / 2 + creaseLen / 2, 0);
  root.add(c);

  // the slit: the thin dark gap between the two free edges (the inside of the fold seen through it), ROWS rows from the
  // top of the free edges to their foot; it follows the edges, so it is as wide as the gap really is
  const ROWS = 16;
  const slitGeo = new THREE.BufferGeometry();
  slitGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ROWS + 1) * 2 * 3), 3));
  const slitIndex = [];
  for (let i = 0; i < ROWS; i++) slitIndex.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  slitGeo.setIndex(slitIndex);
  const slit = new THREE.Mesh(
    slitGeo,
    new THREE.MeshBasicMaterial({ name: 'Slit', color: '#352d25', transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false }),
  );
  slit.name = 'Slit';
  slit.userData.noExport = true;
  slit.renderOrder = 1;
  root.add(slit);
  const E = new THREE.Vector3();
  const F = new THREE.Vector3();
  const M = new THREE.Vector3();
  /** The dark strip's width as a share of the gap between the free edges. */
  const SLIT = 0.96;

  let L = 10;
  let open = 0;

  /** The free edge's bend for a flap (sigma 0 at the hinge … 1 at the free edge) at swing A: [s, out]. */
  const along = (sigma, A) => L - sigma * (L - gap) + (A * A * sigma) / (2.4 * L);

  /** Bends one flap's slab (geometry `geo`) to the opening k. */
  function bend(hv, geo, k) {
    const A = SWING * L * k;
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const a = pos.array;
    const b = hv.base;
    for (let i = 0; i < pos.count; i++) {
      const sigma = b[i * 3] + 0.5; // 0 at the hinge … 1 at the free edge
      const s = along(sigma, A);
      a[i * 3] = s;
      a[i * 3 + 1] = b[i * 3 + 1] + SLOT_Y;
      a[i * 3 + 2] = b[i * 3 + 2] * T + hv.sign * A * taper((2 * b[i * 3 + 1]) / h) * bendShape(sigma);
      // the same texture as the rest of the half, so the rules run on across the cut
      uv.array[i * 2] = L - sigma * (L - gap);
      uv.array[i * 2 + 1] = b[i * 3 + 1] + SLOT_Y;
    }
    pos.needsUpdate = true;
    uv.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  }

  function bendFlaps() {
    for (const hv of halves) bend(hv, hv.flap.geometry, open);
    root.updateWorldMatrix(true, true);
    const a = slitGeo.attributes.position.array;
    const A = SWING * L * open;
    const x0 = along(1, A);
    for (let i = 0; i <= ROWS; i++) {
      const y = SLOT_Y + h / 2 - 0.15 - (i / ROWS) * (h - 0.3);
      // between the two free edges, a little behind them: the dark of the inside of the fold seen through the gap
      const Ay = A * taper((2 * (y - SLOT_Y)) / h);
      E.set(x0, y, halves[0].sign * Ay).applyMatrix4(halves[0].g.matrix);
      F.set(x0, y, halves[1].sign * Ay).applyMatrix4(halves[1].g.matrix);
      M.lerpVectors(E, F, 0.5);
      E.lerp(M, 1 - SLIT);
      F.lerp(M, 1 - SLIT);
      a.set([E.x - 0.3, E.y, E.z, F.x - 0.3, F.y, F.z], i * 6);
    }
    slitGeo.attributes.position.needsUpdate = true;
    slitGeo.computeBoundingSphere();
    slit.visible = open > LIPS * 1.2;
  }

  function setCut(len) {
    L = len;
    const geo = new THREE.ExtrudeGeometry(halfShape(L), { depth: T, bevelEnabled: false, curveSegments: 1 });
    geo.translate(0, 0, -T / 2);
    for (const hv of halves) {
      hv.kerf.scale.x = L;
      hv.kerf.position.set(L / 2, H / 2 - h - SHEET.kerf / 2, 0);
      hv.leaf.geometry?.dispose();
      hv.leaf.geometry = hv === halves[0] ? geo : geo.clone();
      bend(hv, hv.ghost.geometry, 1);
    }
    bendFlaps();
  }

  function setOpen(k) {
    open = LIPS + (1 - LIPS) * Math.max(0, Math.min(1.15, k));
    bendFlaps();
  }

  const P = new THREE.Vector3();
  /** The middle of a flap's free edge (side +1 near, −1 far), in world space. */
  function edgePoint(side, outV = new THREE.Vector3()) {
    const hv = side > 0 ? halves[0] : halves[1];
    const A = SWING * L * open;
    P.set(along(1, A), SLOT_Y, hv.sign * A * taper(0));
    root.updateWorldMatrix(true, true);
    return outV.copy(P).applyMatrix4(hv.g.matrixWorld);
  }
  function hingePoint(side, outV = new THREE.Vector3()) {
    const hv = side > 0 ? halves[0] : halves[1];
    root.updateWorldMatrix(true, true);
    return outV.set(L, SLOT_Y, 0).applyMatrix4(hv.g.matrixWorld);
  }
  /** A point on a half's outer face at (s, y), and that face's outward normal. */
  function onFace(side, s, y) {
    const hv = side > 0 ? halves[0] : halves[1];
    const p = hv.u
      .clone()
      .multiplyScalar(s)
      .addScaledVector(Y, y)
      .addScaledVector(hv.out, T / 2);
    return { point: p, normal: hv.out.clone(), along: hv.u.clone() };
  }
  /** The four corners of a half's outer face (world), for the camera. */
  function corners(side) {
    return [0, W].flatMap((s0) => [-H / 2, H / 2].map((y) => onFace(side, s0, y).point));
  }

  /** The faint copies at the widest swing (while the paper vibrates). */
  function setGhost(a) {
    ghostMat.opacity = 0.2 * a;
    for (const hv of halves) hv.ghost.visible = a > 0.01;
  }

  setCut(L);
  return {
    setGhost,
    root,
    halves,
    flaps: halves.map((hv) => hv.flap),
    setCut,
    setOpen,
    edgePoint,
    hingePoint,
    onFace,
    corners,
    get length() {
      return L;
    },
    get swing() {
      return SWING * L * open;
    },
    /** How far a free edge swings out at its widest (mm). */
    get maxSwing() {
      return SWING * L * 1.15;
    },
  };
}
