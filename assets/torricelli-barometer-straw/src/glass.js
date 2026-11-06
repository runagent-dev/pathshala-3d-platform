// The object (book page 145): a clear glass of cold drink on the table with a clear plastic straw in it. The straw
// stands up out of the drink, bends, and its top end goes into a plain cut-away of a mouth (a section through the lips
// and the space inside, as a physics book draws it: no face). The drink inside the straw is a tube drawn only up to
// how far it has risen (a draw range, never rebuilt), with a small meniscus at its top. Metres; the table top is y = 0.
import * as THREE from 'three';

/** The glass (m): a tumbler a little wider at the top, with a thick base. */
export const GLASS = { rBot: 0.031, rTop: 0.039, h: 0.125, wall: 0.0022, base: 0.007 };
/** The drink's surface in the glass (world y). */
export const DRINK_Y = 0.088;
/** The straw: where it stands in the glass (x, z), its radius, and its path (up, a bend, then into the mouth). */
export const STRAW = { x: 0.011, z: 0.008, r: 0.0033, wall: 0.0006, bottom: 0.007, up: 0.16, bend: 0.02, turn: (85 * Math.PI) / 180, reach: 0.045 };
/** Where the lips close round the straw: this far along the straight top part of the straw (m). */
const LIPS_AT = 0.012;

const innerR = (y) => GLASS.rBot - GLASS.wall + ((GLASS.rTop - GLASS.rBot) * y) / GLASS.h;

/** The straw's centre line: straight up, an arc, straight into the mouth. Arc-length parameter 0 … 1. */
class StrawPath extends THREE.Curve {
  constructor() {
    super();
    const { x, z, bottom, up, bend, turn, reach } = STRAW;
    this.l1 = up - bottom;
    this.l2 = bend * turn;
    this.l3 = reach;
    this.total = this.l1 + this.l2 + this.l3;
    this.c = new THREE.Vector2(x - bend, up); // the bend's centre
    this.end2 = new THREE.Vector2(x - bend + bend * Math.cos(turn), up + bend * Math.sin(turn));
    this.dir = new THREE.Vector2(-Math.sin(turn), Math.cos(turn));
    this.z = z;
  }
  getPoint(t, out = new THREE.Vector3()) {
    const s = t * this.total;
    const { x, bottom, bend } = STRAW;
    if (s <= this.l1) return out.set(x, bottom + s, this.z);
    if (s <= this.l1 + this.l2) {
      const a = (s - this.l1) / bend;
      return out.set(this.c.x + bend * Math.cos(a), this.c.y + bend * Math.sin(a), this.z);
    }
    const d = s - this.l1 - this.l2;
    return out.set(this.end2.x + this.dir.x * d, this.end2.y + this.dir.y * d, this.z);
  }
  // the parameter is already the arc length
  getPointAt(u, out) {
    return this.getPoint(u, out);
  }
  getUtoTmapping(u) {
    return u;
  }
}
export const PATH = new StrawPath();
/** The straw's parameter where the drink stands without sucking: the glass's level. */
export const REST_U = (DRINK_Y - STRAW.bottom) / PATH.total;
/** The straw's end, in the mouth (world). */
export const STRAW_END = PATH.getPoint(1);
/** Where the lips are (world) and the straw's direction there (into the mouth). */
export const LIPS = PATH.getPoint((PATH.total - STRAW.reach + LIPS_AT) / PATH.total);
export const INTO_MOUTH = new THREE.Vector3(PATH.dir.x, PATH.dir.y, 0);

function glassProfile() {
  const { rBot, rTop, h, wall, base } = GLASS;
  const p = [
    [0.0001, 0],
    [rBot - 0.003, 0],
    [rBot - 0.0005, 0.0008],
    [rBot, 0.003],
  ];
  for (let i = 1; i <= 8; i++) {
    const y = 0.003 + ((h - 0.003) * i) / 8;
    p.push([rBot + ((rTop - rBot) * y) / h, y]);
  }
  // the rim, rounded, then down the inside to the thick base
  p.push([rTop - wall * 0.15, h + wall * 0.45], [rTop - wall * 0.5, h + wall * 0.6], [rTop - wall * 0.85, h + wall * 0.45], [rTop - wall, h]);
  for (let i = 7; i >= 0; i--) {
    const y = base + 0.004 + ((h - base - 0.004) * i) / 8;
    p.push([innerR(y), y]);
  }
  p.push([innerR(base) - 0.0015, base + 0.0004], [innerR(base) - 0.004, base], [0.0001, base]);
  return p.map(([r, y]) => new THREE.Vector2(r, y));
}

function drinkProfile() {
  // the drink inside the glass, with a meniscus: it rises a little where it meets the glass
  const D = DRINK_Y;
  const p = [[0.0001, GLASS.base + 0.0002]];
  p.push([innerR(GLASS.base) - 0.004, GLASS.base + 0.0002], [innerR(GLASS.base) - 0.0012, GLASS.base + 0.0008]);
  for (let i = 1; i <= 6; i++) {
    const y = GLASS.base + 0.004 + ((D - GLASS.base - 0.004) * i) / 6;
    p.push([innerR(y) - 0.0002, y]);
  }
  const rw = innerR(D) - 0.0002;
  p.push([rw, D + 0.0016], [rw - 0.0006, D + 0.0009], [rw - 0.0018, D + 0.0003], [rw - 0.004, D], [0.0001, D]);
  return p.map(([r, y]) => new THREE.Vector2(r, y));
}

/** A side section through the mouth, in the mouth's own plane: x runs out of the mouth along the straw (the lips at
 * x = 0, the inside at negative x), y up. A "C": the outside of the lips and cheeks, then in along the straw to the
 * space inside. */
function mouthShape(rs) {
  const s = new THREE.Shape();
  s.moveTo(0.0005, rs);
  s.bezierCurveTo(0.006, rs, 0.0095, 0.006, 0.0085, 0.0105); // the upper lip, rounded and forward
  s.bezierCurveTo(0.0075, 0.0155, 0.002, 0.0168, -0.003, 0.0162);
  s.bezierCurveTo(-0.008, 0.0158, -0.012, 0.0205, -0.022, 0.0212); // behind the lip, up to the cheek
  s.bezierCurveTo(-0.04, 0.0226, -0.06, 0.0226, -0.07, 0.018);
  s.bezierCurveTo(-0.084, 0.012, -0.084, -0.012, -0.07, -0.018); // the back, round
  s.bezierCurveTo(-0.06, -0.0226, -0.04, -0.0226, -0.022, -0.0212);
  s.bezierCurveTo(-0.012, -0.0205, -0.008, -0.0158, -0.003, -0.0162);
  s.bezierCurveTo(0.002, -0.0168, 0.0075, -0.0155, 0.0085, -0.0105); // the lower lip
  s.bezierCurveTo(0.0095, -0.006, 0.006, -rs, 0.0005, -rs);
  // in along the straw, then round the space inside the mouth
  s.lineTo(-0.008, -rs);
  s.bezierCurveTo(-0.011, -rs, -0.012, -0.0115, -0.018, -0.0118);
  s.bezierCurveTo(-0.035, -0.0128, -0.055, -0.0128, -0.062, -0.01);
  s.bezierCurveTo(-0.071, -0.006, -0.071, 0.006, -0.062, 0.01);
  s.bezierCurveTo(-0.055, 0.0128, -0.035, 0.0128, -0.018, 0.0118);
  s.bezierCurveTo(-0.012, 0.0115, -0.011, rs, -0.008, rs);
  s.lineTo(0.0005, rs);
  return s;
}
function cavityShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.006, 0);
  s.bezierCurveTo(-0.006, 0.006, -0.012, 0.0122, -0.018, 0.0122);
  s.bezierCurveTo(-0.035, 0.0132, -0.055, 0.0132, -0.062, 0.0104);
  s.bezierCurveTo(-0.072, 0.006, -0.072, -0.006, -0.062, -0.0104);
  s.bezierCurveTo(-0.055, -0.0132, -0.035, -0.0132, -0.018, -0.0122);
  s.bezierCurveTo(-0.012, -0.0122, -0.006, -0.006, -0.006, 0);
  return s;
}
/** The mouth's depth behind the cut (m): the section is cut through the straw's axis. */
export const MOUTH_DEPTH = 0.026;
/** The space inside the mouth, in the mouth's own coordinates (for the air's particles): x, y, z ranges. */
export const CAVITY = { x: [-0.062, -0.016], y: [-0.0095, 0.0095], z: [-MOUTH_DEPTH + 0.004, -0.0035] };

export function createGlass() {
  const root = new THREE.Group();
  root.name = 'GlassOfColdDrink';

  // ── the glass: back faces first, the front last, so the drink shows through it ──
  const glassGeo = new THREE.LatheGeometry(glassProfile(), 56);
  const glassMat = new THREE.MeshPhysicalMaterial({
    name: 'Glass',
    color: '#eef7ff',
    roughness: 0.03,
    metalness: 0,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    envMapIntensity: 1.2,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
  });
  const glassBack = new THREE.Mesh(glassGeo, glassMat.clone());
  glassBack.material.side = THREE.BackSide;
  glassBack.material.opacity = 0.1;
  glassBack.name = 'GlassBack';
  glassBack.renderOrder = 1;
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.name = 'Glass';
  glass.renderOrder = 9;
  glass.castShadow = true;
  // the rim and the base catch the light: a thin bright ring on top, a thicker one at the bottom
  const rimMat = new THREE.MeshStandardMaterial({
    name: 'GlassEdge',
    color: '#f4fbff',
    roughness: 0.15,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(GLASS.rTop - GLASS.wall * 0.5, GLASS.wall * 0.55, 6, 64), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = GLASS.h + GLASS.wall * 0.15;
  rim.renderOrder = 10;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(GLASS.rBot - 0.0012, GLASS.rBot - 0.0004, GLASS.base, 48, 1, true), rimMat);
  foot.position.y = GLASS.base / 2;
  foot.renderOrder = 10;

  // ── the drink: a dark amber cola with a meniscus, and a few bubbles ──
  const drinkMat = new THREE.MeshPhysicalMaterial({
    name: 'ColdDrink',
    color: '#2c0c02',
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    envMapIntensity: 0.5,
    clearcoat: 0.6,
    clearcoatRoughness: 0.05,
  });
  const drink = new THREE.Mesh(new THREE.LatheGeometry(drinkProfile(), 56), drinkMat);
  drink.name = 'ColdDrink';
  drink.renderOrder = 3;
  const bubbleMat = new THREE.MeshStandardMaterial({
    name: 'Bubble',
    color: '#fff4e0',
    roughness: 0.2,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const bubbles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), bubbleMat, 16);
  bubbles.name = 'Bubbles';
  bubbles.renderOrder = 4;
  bubbles.userData.noExport = true;
  {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 16; i++) {
      const y = GLASS.base + 0.006 + rnd() * (DRINK_Y - GLASS.base - 0.01);
      const a = -0.6 + rnd() * 2.6; // mostly on the side that faces the view
      const r = innerR(y) - 0.0014;
      const size = 0.0006 + rnd() * 0.0007;
      m.compose(v.set(Math.sin(a) * r, y, Math.cos(a) * r), q, sc.setScalar(size));
      bubbles.setMatrixAt(i, m);
    }
  }

  // ── the straw: clear plastic; the drink inside it is drawn up to how far it has risen ──
  const strawMat = new THREE.MeshPhysicalMaterial({
    name: 'Straw',
    color: '#f2f8ff',
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMapIntensity: 1.4,
    clearcoat: 1,
  });
  const SEG = 180;
  const RAD = 14;
  const straw = new THREE.Mesh(new THREE.TubeGeometry(PATH, SEG, STRAW.r, RAD, false), strawMat);
  straw.name = 'Straw';
  straw.renderOrder = 8;
  straw.castShadow = true;
  const inDrinkMat = new THREE.MeshStandardMaterial({
    name: 'DrinkInStraw',
    color: '#6a2a0a',
    roughness: 0.25,
    emissive: '#2a0d02',
    emissiveIntensity: 0.5,
    side: THREE.DoubleSide,
  });
  const column = new THREE.Mesh(new THREE.TubeGeometry(PATH, SEG, STRAW.r - STRAW.wall, RAD, false), inDrinkMat);
  column.name = 'DrinkInStraw';
  column.renderOrder = 5;
  // the column's top: a shallow dip (the meniscus), turned to the straw's direction
  const capGeo = new THREE.SphereGeometry(STRAW.r - STRAW.wall, RAD, 4, 0, Math.PI * 2, 0, Math.PI / 2);
  capGeo.scale(1, -0.3, 1);
  const cap = new THREE.Mesh(capGeo, inDrinkMat);
  cap.name = 'DrinkInStrawTop';

  // ── the mouth: a cut-away section, a soft neutral rose; the space inside a little darker ──
  const mouth = new THREE.Group();
  mouth.name = 'MouthSection';
  const cutMat = new THREE.MeshStandardMaterial({ name: 'MouthCut', color: '#e7c2b4', roughness: 0.75 });
  const sideMat = new THREE.MeshStandardMaterial({ name: 'MouthSide', color: '#b98676', roughness: 0.7 });
  const section = new THREE.Mesh(
    new THREE.ExtrudeGeometry(mouthShape(STRAW.r + 0.0002), {
      depth: MOUTH_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.0012,
      bevelSize: 0.0009,
      bevelSegments: 2,
      curveSegments: 14,
    }),
    [cutMat, sideMat],
  );
  section.position.z = -MOUTH_DEPTH;
  const inside = new THREE.Mesh(
    new THREE.ShapeGeometry(cavityShape(), 14),
    new THREE.MeshStandardMaterial({ name: 'MouthInside', color: '#a8655c', roughness: 0.85 }),
  );
  inside.position.z = -MOUTH_DEPTH + 0.0006;
  mouth.add(section, inside);
  mouth.position.set(LIPS.x, LIPS.y, STRAW.z);
  mouth.rotation.z = Math.atan2(PATH.dir.y, PATH.dir.x) - Math.PI; // the mouth's +x runs out along the straw
  mouth.updateMatrixWorld();

  root.add(glassBack, drink, bubbles, column, cap, straw, glass, rim, foot, mouth);

  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0);
  const perSeg = RAD * 6;
  return {
    root,
    mouth,
    glassParts: [glassBack, glass, rim, foot, drink, bubbles],
    strawParts: [straw, column, cap, mouth],
    /** Things a tap can hit. */
    hitMeshes: [glass, straw, section],
    /** The drink in the straw up to the straw's parameter u (0 … 1). */
    setLevel(u) {
      const k = Math.max(0, Math.min(1, u));
      column.geometry.setDrawRange(0, Math.max(0, Math.round(k * SEG)) * perSeg);
      PATH.getPoint(k, P);
      PATH.getTangent(k, T);
      cap.position.copy(P);
      cap.quaternion.setFromUnitVectors(Y, T);
      cap.visible = k > 0.001 && k < 0.999;
    },
  };
}
