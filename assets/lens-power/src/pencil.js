// The book's pencil (the sister figures' model, 6 cm tall; bench.js draws it at three quarters), standing on its pink eraser with the
// point up (X at the point, Y at the foot, as in চিত্র ৯.২৭): a red six-sided body with a yellow stripe on every other flat, a ribbed
// ferrule, sharpened wood and a graphite point. The origin is at Y, on the axis. One merged geometry of painted parts and one of
// metal, so that it costs two draw calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const SHAPE = {
  radius: 0.42,
  eraser: 0.72, // the top of each part, cm from Y
  ferrule: 1.34,
  body: 4.92,
  wood: 5.76,
  tip: 6,
};

const paintRed = new THREE.Color(0xc92a2a);
const paintYellow = new THREE.Color(0xf6c026);
const WOOD = new THREE.Color(0xdcb27c);
const LEAD = new THREE.Color(0x30343a);
const ERASER = new THREE.Color(0xf29aa8);
const STEEL = new THREE.Color(0xc4cad2);

/** Vertex colours on a geometry. */
function tinted(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute('uv');
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) color.toArray(c, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

/** The hexagonal body: each flat is cut into strips, with a stripe in the middle of every other flat. */
function body(y0, y1) {
  const pos = [];
  const nor = [];
  const col = [];
  const R = SHAPE.radius;
  const corner = (i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    return [R * Math.cos(a), R * Math.sin(a)];
  };
  const strip = (ax, az, bx, bz, nx, nz, c) => {
    for (const [x, y, z] of [
      [ax, y0, az],
      [bx, y0, bz],
      [bx, y1, bz],
      [ax, y0, az],
      [bx, y1, bz],
      [ax, y1, az],
    ]) {
      pos.push(x, y, z);
      nor.push(nx, 0, nz);
      col.push(c.r, c.g, c.b);
    }
  };
  for (let i = 0; i < 6; i++) {
    const [ax, az] = corner(i);
    const [bx, bz] = corner(i + 1);
    const nl = Math.hypot(ax + bx, az + bz);
    const nx = (ax + bx) / nl;
    const nz = (az + bz) / nl;
    // wound to face outward: from b to a seen from outside the pencil
    const cuts = i % 2 ? [0, 1] : [0, 0.34, 0.66, 1];
    for (let k = 0; k + 1 < cuts.length; k++) {
      const c = cuts.length > 2 && k === 1 ? paintYellow : paintRed;
      const p = (t) => [bx + (ax - bx) * t, bz + (az - bz) * t];
      const [cx, cz] = p(cuts[k]);
      const [dx, dz] = p(cuts[k + 1]);
      strip(cx, cz, dx, dz, nx, nz, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

const at = (geo, y) => {
  geo.translate(0, y, 0);
  return geo;
};

/** The painted parts: eraser, body, wood and graphite. */
function paintGeometry() {
  const R = SHAPE.radius;
  const eraser = tinted(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.001, 0),
        new THREE.Vector2(R * 0.72, 0),
        new THREE.Vector2(R * 0.9, 0.09),
        new THREE.Vector2(R * 0.9, SHAPE.eraser + 0.06),
      ],
      18,
    ),
    ERASER,
  );
  // the wood cone starts from the flats of the body, as a pencil sharpener leaves it
  const wood = tinted(
    at(new THREE.CylinderGeometry(0.1, R * 1.02, SHAPE.wood - SHAPE.body + 0.02, 18, 1, true), (SHAPE.wood + SHAPE.body) / 2),
    WOOD,
  );
  const lead = tinted(at(new THREE.ConeGeometry(0.1, SHAPE.tip - SHAPE.wood, 12, 1, true), (SHAPE.tip + SHAPE.wood) / 2), LEAD);
  return mergeGeometries([eraser, body(SHAPE.ferrule - 0.02, SHAPE.body), wood, lead]);
}

/** The ribbed metal ferrule. */
function metalGeometry() {
  const R = SHAPE.radius * 1.02;
  const y0 = SHAPE.eraser;
  const y1 = SHAPE.ferrule;
  const pts = [new THREE.Vector2(R * 0.9, y0 - 0.02)];
  const ribs = 4;
  for (let i = 0; i <= ribs * 2; i++) {
    const y = y0 + ((y1 - y0) * i) / (ribs * 2);
    pts.push(new THREE.Vector2(i % 2 ? R * 0.98 : R * 1.05, y));
  }
  const g = new THREE.LatheGeometry(pts, 18);
  g.deleteAttribute('uv');
  return g;
}

/** The two parts every pencil is drawn from. */
export function pencilParts() {
  const paintGeo = paintGeometry();
  const metalGeo = metalGeometry();
  paintGeo.computeBoundingSphere();
  return {
    paintGeo,
    metalGeo,
    /** The whole pencil in one geometry with colours (for the image), its metal a plain grey. */
    wholeGeo() {
      return mergeGeometries([paintGeo, tinted(metalGeo.clone(), STEEL)]);
    },
    paint: new THREE.MeshStandardMaterial({ name: 'PencilPaint', vertexColors: true, roughness: 0.46, metalness: 0.02, side: THREE.DoubleSide }),
    metal: new THREE.MeshStandardMaterial({ name: 'PencilFerrule', color: 0xc4cad2, roughness: 0.3, metalness: 0.95 }),
  };
}
