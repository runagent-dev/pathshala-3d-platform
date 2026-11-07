// The periscope, in centimetres, procedural: a school demonstration model, a square tube with an aluminium frame,
// painted end walls and clear acrylic sides (so the two glass prisms inside can be seen from the front and the back),
// standing on a foot. The bottom part is fixed, with the bottom window and an eyecup toward the eye (+x); the head slides
// up out of it, with the top window toward the flower (−x). Each window has a 45°-45°-90° glass prism behind it, as in
// চিত্র ৯.১৩: the top one with its right angle at the bottom-left, the bottom one with its right angle at the top-right,
// both hypotenuses from top-left to bottom-right. Static parts merged, one mesh per material.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { glassPiece, prismGeometry } from './glass.js';
import { PERI } from './reading.js';

const WALL = 0.3; // the end walls' thickness
const POST = 0.5; // the frame's square bars
const FOOT = 1; // the foot's height
export const HEAD_TOP = PERI.L / 2 + 1.1; // the head's top above the top window's centre
export const HEAD_BOTTOM = HEAD_TOP - PERI.headLen;

let mats = null;
function materials() {
  if (mats) return mats;
  mats = {
    paint: new THREE.MeshStandardMaterial({ name: 'Paint', color: '#5d6b52', roughness: 0.62, metalness: 0.15 }),
    paintHead: new THREE.MeshStandardMaterial({ name: 'PaintHead', color: '#6f7f62', roughness: 0.6, metalness: 0.15 }),
    alu: new THREE.MeshStandardMaterial({ name: 'Aluminium', color: '#c9cfd5', roughness: 0.34, metalness: 0.85 }),
    acrylic: new THREE.MeshStandardMaterial({
      name: 'Acrylic',
      color: '#e4f4ff',
      roughness: 0.06,
      metalness: 0,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      envMapIntensity: 1.6,
    }),
    rubber: new THREE.MeshStandardMaterial({ name: 'Rubber', color: '#1d2126', roughness: 0.82 }),
  };
  return mats;
}

/** An end wall from x to x + WALL, with an optional square window of side `win` centred at height wy. */
function endWall(x, y0, y1, half, win, wy) {
  const s = new THREE.Shape();
  s.moveTo(-half, y0);
  s.lineTo(half, y0);
  s.lineTo(half, y1);
  s.lineTo(-half, y1);
  s.closePath();
  if (win) {
    const h = new THREE.Path();
    const w = win / 2;
    h.moveTo(-w, wy - w);
    h.lineTo(-w, wy + w);
    h.lineTo(w, wy + w);
    h.lineTo(w, wy - w);
    h.closePath();
    s.holes.push(h);
  }
  // the shape is in (z, y); extrude along +x, then turn so the shape's x is the world's z
  const geo = new THREE.ExtrudeGeometry(s, { depth: WALL, bevelEnabled: false });
  geo.rotateY(-Math.PI / 2); // extrusion now along −x, shape x → +z
  geo.translate(x + WALL, 0, 0); // it spans x … x + WALL
  return geo;
}

/** A tube section: the two end walls, the frame (four corner bars, a collar at each end) and the two clear sides. */
function tube({ y0, y1, half, winPlus, winMinus }) {
  const walls = [
    endWall(half - WALL, y0, y1, half - POST / 2, winPlus?.size, winPlus?.y),
    endWall(-half, y0, y1, half - POST / 2, winMinus?.size, winMinus?.y),
  ];
  const frame = [];
  const c = half - POST / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) frame.push(new THREE.BoxGeometry(POST, y1 - y0, POST).translate(sx * c, (y0 + y1) / 2, sz * c));
  for (const y of [y0 + POST / 2, y1 - POST / 2]) {
    for (const sz of [-1, 1]) frame.push(new THREE.BoxGeometry(2 * half, POST, POST).translate(0, y, sz * c));
    for (const sx of [-1, 1]) frame.push(new THREE.BoxGeometry(POST, POST, 2 * half).translate(sx * c, y, 0));
  }
  const sides = [];
  for (const sz of [-1, 1])
    sides.push(new THREE.BoxGeometry(2 * half - POST, y1 - y0 - POST, 0.16).translate(0, (y0 + y1) / 2, sz * (half - POST / 2)));
  return { walls: mergeGeometries(walls), frame: mergeGeometries(frame), sides: mergeGeometries(sides) };
}

export function createPeriscope() {
  const m = materials();
  const root = new THREE.Group();
  root.name = 'Periscope';
  const { L, depth, low, outer, inner, outerTop } = PERI;

  // ── the fixed lower part: foot, tube with the bottom window (+x, toward the eye), eyecup, the lower prism ──
  const base = new THREE.Group();
  base.name = 'PeriscopeBase';
  const lowTube = tube({ y0: FOOT, y1: outerTop, half: outer, winPlus: { size: L, y: low } });
  const walls = new THREE.Mesh(lowTube.walls, m.paint);
  const frame = new THREE.Mesh(lowTube.frame, m.alu);
  const sides = new THREE.Mesh(lowTube.sides, m.acrylic);
  sides.renderOrder = 3;
  const foot = new THREE.Mesh(
    new THREE.BoxGeometry(12, FOOT, 12).translate(0, FOOT / 2, 0),
    new THREE.MeshStandardMaterial({ name: 'Foot', color: '#3a3f46', roughness: 0.55, metalness: 0.4 }),
  );
  // the eyecup: a soft rubber ring round the bottom window, toward the eye
  const cupProfile = [
    [2.55, 0],
    [3.05, 0],
    [3.25, 1.2],
    [3.35, 1.9],
    [3.1, 2.1],
    [2.75, 1.6],
    [2.55, 0.6],
  ].map(([r, x]) => new THREE.Vector2(r, x));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(cupProfile, 32).rotateZ(-Math.PI / 2).translate(outer, low, 0), m.rubber);
  for (const part of [walls, frame, foot, cup]) {
    part.castShadow = true;
    part.receiveShadow = true;
  }
  const lowPrism = glassPiece(
    'LowerPrism',
    prismGeometry(L, depth)
      .rotateZ(Math.PI)
      .translate(L / 2, low + L / 2, 0),
  );
  base.add(walls, frame, sides, foot, cup, lowPrism.group);

  // ── the sliding head: tube with the top window (−x, toward the flower), cap, the upper prism. y = 0 is the
  //    top window's centre; the app moves the head to its height ──
  const head = new THREE.Group();
  head.name = 'PeriscopeHead';
  const hTube = tube({ y0: HEAD_BOTTOM, y1: HEAD_TOP, half: inner, winMinus: { size: L, y: 0 } });
  const hWalls = new THREE.Mesh(hTube.walls, m.paintHead);
  const hFrame = new THREE.Mesh(
    mergeGeometries([hTube.frame, new THREE.BoxGeometry(2 * inner + 0.5, 0.6, 2 * inner + 0.5).translate(0, HEAD_TOP + 0.3, 0)]),
    m.alu,
  );
  const hSides = new THREE.Mesh(hTube.sides, m.acrylic);
  hSides.renderOrder = 3;
  for (const part of [hWalls, hFrame]) {
    part.castShadow = true;
    part.receiveShadow = true;
  }
  const upPrism = glassPiece('UpperPrism', prismGeometry(L, depth).translate(-L / 2, -L / 2, 0));
  // an invisible box round the head, for the finger (a little bigger than the head)
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(2 * inner + 3, HEAD_TOP - HEAD_BOTTOM + 1, 2 * inner + 3).translate(0, (HEAD_TOP + HEAD_BOTTOM) / 2, 0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.name = 'HeadHit';
  hit.userData.noExport = true;
  head.add(hWalls, hFrame, hSides, upPrism.group, hit);
  root.add(base, head);

  /** Puts the top window's centre at height yw. */
  function setHead(yw) {
    head.position.y = yw;
  }
  return { root, base, head, hit, upPrism, lowPrism, setHead, headFrame: hFrame };
}
