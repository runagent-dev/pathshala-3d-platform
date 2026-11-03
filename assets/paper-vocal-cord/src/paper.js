// The paper vocal cord of চিত্র ৭.১০, in millimetres: a page of a ruled exercise book (খাতা) folded in half, the fold
// standing upright at x = 0, the two halves opening toward the mouth (−x) at ±ALPHA like a half-open book. At the fold
// a slit was cut along the crease and two short cuts across it, so each half has a flap (the কাটা টুকরো) held at its
// hinge (L mm back from the fold) and free at the fold. The two free edges meet at the crease like the two vocal
// cords; blown air pushes them outward, the slot opens, a puff escapes, the paper springs back and shuts it again.
//
// Real proportions: a 44 × 70 mm folded strip, 0.3 mm thick as drawn (writing paper is 0.1 mm; drawn a little thicker
// so its edge reads), flaps 34 mm tall, the cut 0.5 mm wide. Procedural: an extruded outline per half (the notch the
// flap sits in), a rounded crease above and below the slit, and each flap a thin slab bent as a cantilever every frame.
import * as THREE from 'three';
import { bendShape } from './reading.js';

export const SHEET = { W: 44, H: 70, T: 0.3, alpha: THREE.MathUtils.degToRad(30), h: 34, kerf: 0.5, gap: 0.3 };
/** How far the free edge swings out at full opening, as a share of the flap's length. */
const SWING = 0.4;
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
  const top = h / 2 + kerf;
  s.moveTo(0, -H / 2);
  s.lineTo(W, -H / 2);
  s.lineTo(W, H / 2);
  s.lineTo(0, H / 2);
  s.lineTo(0, top);
  s.lineTo(L, top);
  s.lineTo(L, -top);
  s.lineTo(0, -top);
  s.closePath();
  return s;
}

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
    const flapGeo = new THREE.BoxGeometry(1, h - 2 * kerf, 1, 16, 1, 1);
    const base = flapGeo.attributes.position.array.slice();
    const flap = new THREE.Mesh(flapGeo, [mat, mat, mat, mat, mat, mat]);
    flap.name = side > 0 ? 'NearFlap' : 'FarFlap';
    flap.castShadow = true;
    flap.receiveShadow = true;
    g.add(leaf, flap);
    return { side, u, w, out, sign, g, leaf, flap, base };
  });

  // the crease, rounded, above and below the slit
  const creaseLen = H / 2 - h / 2 - kerf;
  const creaseGeo = new THREE.CylinderGeometry(T * 0.62, T * 0.62, creaseLen, 10);
  for (const y of [-(H / 2 - creaseLen / 2), H / 2 - creaseLen / 2]) {
    const c = new THREE.Mesh(creaseGeo, edgeMat);
    c.name = 'Crease';
    c.position.set(T * 0.25, y, 0);
    root.add(c);
  }

  let L = 10;
  let open = 0;

  function bendFlaps() {
    const A = SWING * L * open;
    for (const hv of halves) {
      const pos = hv.flap.geometry.attributes.position;
      const uv = hv.flap.geometry.attributes.uv;
      const a = pos.array;
      const b = hv.base;
      for (let i = 0; i < pos.count; i++) {
        const sigma = b[i * 3] + 0.5; // 0 at the hinge … 1 at the free edge
        const s = L - sigma * (L - gap);
        const d = A * bendShape(sigma);
        // a little shortening as it bends keeps the strip's length (an inextensible sheet)
        const shorten = (A * A * sigma) / (2.4 * L);
        a[i * 3] = s + shorten;
        a[i * 3 + 1] = b[i * 3 + 1];
        a[i * 3 + 2] = b[i * 3 + 2] * T + hv.sign * d;
        uv.array[i * 2] = s;
        uv.array[i * 2 + 1] = b[i * 3 + 1];
      }
      pos.needsUpdate = true;
      uv.needsUpdate = true;
      hv.flap.geometry.computeVertexNormals();
      hv.flap.geometry.computeBoundingSphere();
    }
  }

  function setCut(len) {
    L = len;
    const geo = new THREE.ExtrudeGeometry(halfShape(L), { depth: T, bevelEnabled: false, curveSegments: 1 });
    geo.translate(0, 0, -T / 2);
    for (const hv of halves) {
      hv.leaf.geometry?.dispose();
      hv.leaf.geometry = hv === halves[0] ? geo : geo.clone();
    }
    bendFlaps();
  }

  function setOpen(k) {
    open = Math.max(0, Math.min(1.15, k));
    bendFlaps();
  }

  const P = new THREE.Vector3();
  /** The middle of a flap's free edge (side +1 near, −1 far), in world space. */
  function edgePoint(side, outV = new THREE.Vector3()) {
    const hv = side > 0 ? halves[0] : halves[1];
    const A = SWING * L * open;
    P.set(gap + (A * A) / (2.4 * L), 0, hv.sign * A);
    root.updateWorldMatrix(true, true);
    return outV.copy(P).applyMatrix4(hv.g.matrixWorld);
  }
  function hingePoint(side, outV = new THREE.Vector3()) {
    const hv = side > 0 ? halves[0] : halves[1];
    root.updateWorldMatrix(true, true);
    return outV.set(L, 0, 0).applyMatrix4(hv.g.matrixWorld);
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

  setCut(L);
  return {
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
  };
}
