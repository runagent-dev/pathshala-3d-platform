// The paper vocal cord of চিত্র ৭.১০, in millimetres: a page of a ruled exercise book (খাতা) folded in half, the fold
// standing upright at x = 0, the two halves opening toward the mouth (−x) at ±ALPHA like a half-open book. At the fold
// a slit was cut down the crease from the top edge (14 mm) and a short cut across at its foot, L mm into each half:
// so each half has a flap (the কাটা টুকরো) still held along a line L mm back from the crease (its hinge) and free at
// the crease, its top edge the paper's top edge. Seen from above, the two flaps are the tip of the V. The two free
// edges meet at the crease like the two vocal cords; blown air pushes them outward, the slot opens, a puff escapes,
// the paper springs back and shuts it again.
//
// Real proportions: a 52 × 44 mm strip of writing paper folded in half (0.1 mm thick; drawn 0.3 mm so its
// edge reads), flaps 14 mm tall, the cut drawn 0.9 mm wide so it reads. While the paper vibrates, a faint
// paper-coloured trail with a thin outline shows each flap at its widest swing (like motion blur), and the slot between
// the two free edges shows as a dark gap that opens and shuts.
// Procedural: an extruded outline per half (the notch the flap sits in), a rounded crease below the slit, and each
// flap a thin slab bent as a cantilever every frame.
import * as THREE from 'three';
import { bendShape } from './reading.js';

export const SHEET = { W: 26, H: 44, T: 0.3, alpha: THREE.MathUtils.degToRad(40), h: 14, kerf: 0.9, gap: 0.45 };
/** How far the free edge swings out at full opening, as a share of the flap's length. */
const SWING = 0.3;
/** At rest the two free edges stay a hair apart, like lips (a share of the full opening). */
const LIPS = 0.04;
const Y = new THREE.Vector3(0, 1, 0);

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Writing paper: warm off-white, fibres, faint blue rules every 8 mm. One tile is 64 mm square. */
function paperTextures() {
  const S = 512;
  const px = S / 64; // pixels a millimetre
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
  const fibres = [];
  for (let i = 0; i < 2600; i++) fibres.push([r() * S, r() * S, r() * Math.PI, 2 + r() * 9, r()]);
  const map = make((g) => {
    g.fillStyle = '#f6f2e8';
    g.fillRect(0, 0, S, S);
    for (const [x, y, a, l, k] of fibres) {
      g.strokeStyle = k > 0.5 ? `rgba(120,105,80,${0.05 + 0.06 * k})` : `rgba(255,255,255,${0.25 + 0.3 * k})`;
      g.lineWidth = 0.7;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    // the exercise book's rules (horizontal: they run from the crease to the edge)
    g.fillStyle = 'rgba(86,140,205,0.55)';
    for (let mm = 4; mm < 64; mm += 8) g.fillRect(0, S - mm * px - 1, S, 2);
  });
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = make((g) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, S, S);
    for (const [x, y, a, l, k] of fibres) {
      g.strokeStyle = k > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
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
  const { H, T, alpha, h, kerf, gap } = SHEET;
  const root = new THREE.Group();
  root.name = 'PaperVocalCord';
  const tex = paperTextures();
  const mat = new THREE.MeshStandardMaterial({
    name: 'Paper',
    color: '#ffffff',
    map: tex.map,
    bumpMap: tex.bump,
    bumpScale: 0.6,
    roughness: 0.88,
    metalness: 0,
  });
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'PaperEdge', color: '#e9e3d4', roughness: 0.95 });
  // the flaps a shade warmer than the walls, so the two "cords" read as their own shapes
  const flapMat = mat.clone();
  flapMat.name = 'PaperFlap';
  flapMat.color.set('#f2e2c4');
  const ghostMat = new THREE.MeshBasicMaterial({ color: '#fbf5e6', transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
  const trailMat = new THREE.LineBasicMaterial({ color: '#7a6c55', transparent: true, opacity: 0.75, depthWrite: false });

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
    // the flap: a thin slab, 16 pieces along its length, bent every frame
    const flapGeo = new THREE.BoxGeometry(1, h, 1, 16, 1, 1);
    const base = flapGeo.attributes.position.array.slice();
    const flap = new THREE.Mesh(flapGeo, [flapMat, flapMat, flapMat, flapMat, flapMat, flapMat]);
    flap.name = side > 0 ? 'NearFlap' : 'FarFlap';
    flap.castShadow = true;
    flap.receiveShadow = true;
    // the ghost: the same flap at its widest swing, faint
    const ghost = new THREE.Mesh(flapGeo.clone(), ghostMat);
    ghost.name = 'FlapSwing';
    ghost.userData.noExport = true;
    ghost.renderOrder = 2;
    ghost.visible = false;
    // its outline (top edge, free edge, foot), on the flap's own bent surface
    const trail = new THREE.Line(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(51 * 3), 3)),
      trailMat,
    );
    trail.name = 'FlapSwingEdge';
    trail.userData.noExport = true;
    trail.renderOrder = 3;
    trail.visible = false;
    g.add(leaf, flap, ghost, trail);
    return { side, u, w, out, sign, g, leaf, flap, ghost, trail, base };
  });

  // the crease, rounded, below the slit
  const creaseLen = H - h - kerf;
  const c = new THREE.Mesh(new THREE.CylinderGeometry(T * 0.62, T * 0.62, creaseLen, 10), edgeMat);
  c.name = 'Crease';
  c.position.set(T * 0.25, -H / 2 + creaseLen / 2, 0);
  root.add(c);

  // the slot: a dark gap between the two free edges, just behind them, that opens and shuts with the flaps
  // a lens: ROWS rows from the top of the free edges to their foot, widest in the middle, closed at both ends
  const ROWS = 16;
  const slotGeo = new THREE.BufferGeometry();
  slotGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ROWS + 1) * 2 * 3), 3));
  const lensIndex = [];
  for (let i = 0; i < ROWS; i++) lensIndex.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  slotGeo.setIndex(lensIndex);
  const slot = new THREE.Mesh(
    slotGeo,
    new THREE.MeshBasicMaterial({ name: 'Slot', color: '#22303b', transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }),
  );
  slot.name = 'Slot';
  slot.userData.noExport = true;
  slot.renderOrder = 1;
  root.add(slot);
  const E = new THREE.Vector3();
  const F = new THREE.Vector3();
  const M = new THREE.Vector3();
  /** The lens's width as a share of the gap between the two free edges, at its widest (the rest shows what is behind). */
  const LENS = 0.34;

  let L = 10;
  let open = 0;

  /** Bends one flap's slab (geometry `geo`) to the opening k. */
  function bend(hv, geo, k) {
    const A = SWING * L * k;
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const a = pos.array;
    const b = hv.base;
    for (let i = 0; i < pos.count; i++) {
      const sigma = b[i * 3] + 0.5; // 0 at the hinge … 1 at the free edge
      const s = L - sigma * (L - gap);
      const d = A * bendShape(sigma);
      // a little shortening as it bends keeps the strip's length (an inextensible sheet)
      const shorten = (A * A * sigma) / (2.4 * L);
      a[i * 3] = s + shorten;
      a[i * 3 + 1] = b[i * 3 + 1] + SLOT_Y;
      a[i * 3 + 2] = b[i * 3 + 2] * T + hv.sign * d;
      uv.array[i * 2] = s;
      uv.array[i * 2 + 1] = b[i * 3 + 1] + SLOT_Y;
    }
    pos.needsUpdate = true;
    uv.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  }
  /** The outline of a flap bent to the opening k: along the top edge, down the free edge, back along the foot. */
  function outline(hv, k) {
    const A = SWING * L * k;
    const a = hv.trail.geometry.attributes.position.array;
    const top = SLOT_Y + h / 2;
    const foot = SLOT_Y - h / 2;
    const at = (i, sigma, y) => {
      a[i * 3] = L - sigma * (L - gap) + (A * A * sigma) / (2.4 * L);
      a[i * 3 + 1] = y;
      a[i * 3 + 2] = hv.sign * (A * bendShape(sigma) + T / 2 + 0.05);
    };
    for (let i = 0; i <= 16; i++) at(i, i / 16, top);
    for (let i = 0; i <= 16; i++) at(17 + i, 1, top - (i / 16) * h);
    for (let i = 0; i <= 16; i++) at(34 + i, 1 - i / 16, foot);
    hv.trail.geometry.attributes.position.needsUpdate = true;
    hv.trail.geometry.computeBoundingSphere();
  }

  function bendFlaps() {
    for (const hv of halves) bend(hv, hv.flap.geometry, open);
    // the slot: a dark lens between the two free edges, a little behind them; the gap round it shows what is beyond
    root.updateWorldMatrix(true, true);
    const a = slotGeo.attributes.position.array;
    const A = SWING * L * open;
    const x0 = gap + (A * A) / (2.4 * L);
    for (let i = 0; i <= ROWS; i++) {
      const y = SLOT_Y + h / 2 - (i / ROWS) * h;
      E.set(x0, y, halves[0].sign * A).applyMatrix4(halves[0].g.matrix);
      F.set(x0, y, halves[1].sign * A).applyMatrix4(halves[1].g.matrix);
      M.lerpVectors(E, F, 0.5);
      const k = LENS * Math.sin((Math.PI * i) / ROWS) ** 0.7;
      E.lerp(M, 1 - k);
      F.lerp(M, 1 - k);
      a.set([E.x + 0.35, E.y, E.z, F.x + 0.35, F.y, F.z], i * 6);
    }
    slotGeo.attributes.position.needsUpdate = true;
    // darker the wider it opens: at rest only a thin shadow between the lips
    slot.material.opacity = 0.85 * Math.min(1, open / 0.3);
    slotGeo.computeBoundingSphere();
  }

  function setCut(len) {
    L = len;
    const geo = new THREE.ExtrudeGeometry(halfShape(L), { depth: T, bevelEnabled: false, curveSegments: 1 });
    geo.translate(0, 0, -T / 2);
    for (const hv of halves) {
      hv.leaf.geometry?.dispose();
      hv.leaf.geometry = hv === halves[0] ? geo : geo.clone();
      bend(hv, hv.ghost.geometry, 1);
      outline(hv, 1);
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
    P.set(gap + (A * A) / (2.4 * L), SLOT_Y, hv.sign * A);
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

  /**
   * The outline of a flap as it is bent now, in world space, into `out` (51 Vector3s): the top edge from the hinge to
   * the free edge, down the free edge, back along the foot. The app draws it over the picture as the flap's edge.
   */
  function outlineNow(side, out) {
    const hv = side > 0 ? halves[0] : halves[1];
    const A = SWING * L * open;
    root.updateWorldMatrix(true, true);
    const top = SLOT_Y + h / 2;
    const foot = SLOT_Y - h / 2;
    const at = (i, sigma, y) =>
      out[i].set(L - sigma * (L - gap) + (A * A * sigma) / (2.4 * L), y, hv.sign * (A * bendShape(sigma) + T / 2)).applyMatrix4(hv.g.matrix);
    for (let i = 0; i <= 16; i++) at(i, i / 16, top);
    for (let i = 0; i <= 16; i++) at(17 + i, 1, top - (i / 16) * h);
    for (let i = 0; i <= 16; i++) at(34 + i, 1 - i / 16, foot);
    return out;
  }

  /** The faint trails at the widest swing (while the paper vibrates). */
  function setGhost(a) {
    ghostMat.opacity = 0.3 * a;
    trailMat.opacity = 0.75 * a;
    for (const hv of halves) hv.ghost.visible = hv.trail.visible = a > 0.01;
  }

  setCut(L);
  return {
    setGhost,
    outlineNow,
    root,
    halves,
    flaps: halves.map((hv) => hv.flap),
    setCut,
    setOpen,
    edgePoint,
    hingePoint,
    onFace,
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
