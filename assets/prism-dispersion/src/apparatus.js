// The things on the table, in centimetres (the table top is y = 0, the light travels in the plane z = 0): a 60° crown-glass
// prism lying on its base (ভূমি) on a small prism table, apex up as in চিত্র ৯.১২; a ray box (a lamp with a slit and a
// lens) that slides along an arc rail centred on the point where its beam meets the prism, with a red filter in a slot in
// front of its lens; a white screen on a stand. Static parts are merged per material; the light itself is in light.js.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ARC_R, ENTRY, incident, lampAt, PRISM, SCREEN } from './reading.js';

export const BG = ['#0b2a5b', '#123d7a'];

/** The backdrop: a vertical gradient, lighter at the bottom (a power-of-two canvas, made once). */
export function backdrop() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, BG[0]);
  g.addColorStop(1, BG[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const merge = (list) => mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)));
const at = (g, x, y, z) => g.translate(x, y, z);

/** A soft round shadow (a radial fade) for under the table, so it sits in the blue. */
function softShadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  g.addColorStop(0, 'rgba(3,12,30,0.55)');
  g.addColorStop(0.6, 'rgba(3,12,30,0.32)');
  g.addColorStop(1, 'rgba(3,12,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The table: a plain, finite top in light sand with a slightly darker edge, floating in the blue over a soft shadow. */
export function createTable() {
  const root = new THREE.Group();
  root.name = 'Table';
  root.userData.noExport = true;
  const W = 46;
  const D = 22;
  const T = 1.6;
  const top = new THREE.Mesh(
    new RoundedBoxGeometry(W, T, D, 3, 0.5),
    new THREE.MeshStandardMaterial({ name: 'TableTop', color: '#cdb995', roughness: 0.82, metalness: 0 }),
  );
  top.position.set(1, -T / 2, 0);
  top.receiveShadow = true;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.25, D * 1.5),
    new THREE.MeshBasicMaterial({ name: 'TableShadow', map: softShadowTexture(), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(1, -T - 3.5, 0);
  root.add(shadow, top);
  return { root, top, size: { W, D, T, x: 1 } };
}

/** A round stand: a heavy base, a rod and (optionally) something on top. Returns the merged geometries per material. */
function standParts({ x, z, height, baseR = 2.6, rodR = 0.42 }) {
  const base = at(new THREE.CylinderGeometry(baseR, baseR * 1.04, 0.9, 40), x, 0.45, z);
  const baseTop = at(new THREE.CylinderGeometry(baseR * 0.55, baseR * 0.9, 0.35, 40), x, 0.9 + 0.175, z);
  const rod = at(new THREE.CylinderGeometry(rodR, rodR, height - 1.0, 20), x, 1.0 + (height - 1.0) / 2, z);
  return { iron: [base, baseTop], steel: [rod] };
}

/**
 * Everything but the light. Returns the groups the figure moves (the lamp, the red filter), the meshes a tap may hit,
 * and setLamp(i) which puts the lamp on its rail for an angle of incidence i.
 */
export function createApparatus(mats) {
  const root = new THREE.Group();
  root.name = 'PrismExperiment';

  const iron = new THREE.MeshStandardMaterial({ name: 'CastIron', color: '#2a2e35', roughness: 0.55, metalness: 0.55 });
  const black = new THREE.MeshStandardMaterial({ name: 'BlackAnodised', color: '#1f2329', roughness: 0.42, metalness: 0.4 });
  const steel = mats.steel;

  // ── the prism: crown glass with a faint green edge, bevelled, two meshes so its back shows through its front ──
  const bevel = 0.07;
  const shape = new THREE.Shape([
    new THREE.Vector2(PRISM.left.x, PRISM.left.y),
    new THREE.Vector2(PRISM.right.x, PRISM.right.y),
    new THREE.Vector2(PRISM.apex.x, PRISM.apex.y),
  ]);
  const prismGeo = new THREE.ExtrudeGeometry(shape, {
    depth: PRISM.length - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
    curveSegments: 1,
  });
  prismGeo.translate(0, 0, -PRISM.length / 2 + bevel);
  prismGeo.computeVertexNormals();
  const glassMat = new THREE.MeshPhysicalMaterial({
    name: 'CrownGlass',
    color: '#e3f7f1',
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    envMapIntensity: 1.4,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
  });
  const prismBack = new THREE.Mesh(prismGeo, glassMat.clone());
  prismBack.material.side = THREE.BackSide;
  prismBack.material.opacity = 0.16;
  prismBack.material.name = 'CrownGlassBack';
  prismBack.renderOrder = 2;
  const prism = new THREE.Mesh(prismGeo, glassMat);
  prism.name = 'Prism';
  prism.renderOrder = 8;
  // the edges: glass looks green along its thickness
  const edgeGeo = new THREE.EdgesGeometry(prismGeo, 25);
  const edges = new THREE.LineSegments(
    edgeGeo,
    new THREE.LineBasicMaterial({ name: 'GlassEdge', color: '#a8e6d2', transparent: true, opacity: 0.85, depthWrite: false }),
  );
  edges.renderOrder = 9;
  const prismGroup = new THREE.Group();
  prismGroup.name = 'GlassPrism';
  prismGroup.add(prismBack, prism, edges);

  // ── the prism table: a round black top on a rod and a heavy base ──
  const tableR = 4.7;
  const st = standParts({ x: 0, z: 0, height: PRISM.baseY - 0.55, baseR: 3.4, rodR: 0.5 });
  const plate = at(new THREE.CylinderGeometry(tableR, tableR, 0.55, 56), 0, PRISM.baseY - 0.275 - 0.03, 0); // a hair below the glass: no flicker where they touch
  const collar = at(new THREE.CylinderGeometry(0.9, 0.9, 0.9, 24), 0, PRISM.baseY - 1.0, 0);
  const knob = at(new THREE.CylinderGeometry(0.28, 0.28, 1.4, 12).rotateZ(Math.PI / 2), 1.4, PRISM.baseY - 1.0, 0);
  const prismStand = new THREE.Group();
  prismStand.name = 'PrismTable';
  const standIron = new THREE.Mesh(merge([...st.iron, collar]), iron);
  const standSteel = new THREE.Mesh(merge([...st.steel, knob]), steel);
  const standTop = new THREE.Mesh(plate, black);
  for (const m of [standIron, standSteel, standTop]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  prismStand.add(standIron, standSteel, standTop);

  // ── the arc rail: centred on the entry point, behind the plane of the light, on one post ──
  const RAIL_R = ARC_R + 3.1; // the lamp's middle
  const RAIL_Z = -2.25;
  const a0 = THREE.MathUtils.degToRad(188);
  const a1 = THREE.MathUtils.degToRad(222);
  const railShape = new THREE.Shape();
  {
    const n = 40;
    for (let k = 0; k <= n; k++) {
      const a = a0 + ((a1 - a0) * k) / n;
      const p = [ENTRY.x + Math.cos(a) * (RAIL_R + 0.55), ENTRY.y + Math.sin(a) * (RAIL_R + 0.55)];
      if (k === 0) railShape.moveTo(p[0], p[1]);
      else railShape.lineTo(p[0], p[1]);
    }
    for (let k = n; k >= 0; k--) {
      const a = a0 + ((a1 - a0) * k) / n;
      railShape.lineTo(ENTRY.x + Math.cos(a) * (RAIL_R - 0.55), ENTRY.y + Math.sin(a) * (RAIL_R - 0.55));
    }
  }
  const railGeo = new THREE.ExtrudeGeometry(railShape, { depth: 0.45, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 });
  railGeo.translate(0, 0, RAIL_Z - 0.45);
  const railMid = THREE.MathUtils.degToRad(212);
  const postX = ENTRY.x + Math.cos(railMid) * (RAIL_R - 0.4);
  const postTop = ENTRY.y + Math.sin(railMid) * (RAIL_R - 0.4);
  const ps = standParts({ x: postX, z: RAIL_Z - 0.2, height: postTop, baseR: 2.2, rodR: 0.36 });
  // ticks on the rail's front face, every 5° of the angle of incidence (white, printed)
  const ticks = [];
  for (let i = 40; i <= 70; i += 5) {
    const a = Math.PI + THREE.MathUtils.degToRad(i - 30);
    const long = i % 10 === 0;
    const r0 = RAIL_R + 0.55 - (long ? 0.62 : 0.38);
    const r1 = RAIL_R + 0.5;
    const g = new THREE.PlaneGeometry(r1 - r0, 0.07);
    g.translate((r0 + r1) / 2, 0, 0);
    g.rotateZ(a);
    g.translate(ENTRY.x, ENTRY.y, RAIL_Z + 0.06);
    ticks.push(g);
  }
  const rail = new THREE.Group();
  rail.name = 'ArcRail';
  const railMesh = new THREE.Mesh(railGeo, black);
  const postIron = new THREE.Mesh(merge(ps.iron), iron);
  const postSteel = new THREE.Mesh(merge(ps.steel), steel);
  const tickMesh = new THREE.Mesh(merge(ticks), new THREE.MeshBasicMaterial({ name: 'RailTicks', color: '#e9edf2' }));
  tickMesh.userData.noExport = true; // printed marks: not part of the model
  for (const m of [railMesh, postIron, postSteel]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  rail.add(railMesh, postIron, postSteel, tickMesh);

  // ── the lamp (a ray box): +x of its group is the way the light goes; its lens front is the group's origin ──
  const lamp = new THREE.Group();
  lamp.name = 'RayBox';
  const L = 4.4;
  const housingMat = new THREE.MeshStandardMaterial({ name: 'RayBoxBody', color: '#5b6470', roughness: 0.48, metalness: 0.35 });
  const housing = new THREE.Mesh(at(new RoundedBoxGeometry(L, 2.6, 3.0, 3, 0.35), -0.9 - L / 2, 0, 0), housingMat);
  // vents on top, a dark front plate, the lens barrel, the carriage on the rail
  const vents = [];
  for (let k = 0; k < 4; k++) vents.push(at(new THREE.BoxGeometry(2.4, 0.08, 0.22), -0.9 - L / 2 - 0.2, 1.3, -0.9 + k * 0.6));
  const face = at(new THREE.BoxGeometry(0.12, 2.2, 2.6), -0.9 + 0.02, 0, 0);
  const barrel = at(new THREE.CylinderGeometry(0.78, 0.78, 0.9, 32).rotateZ(Math.PI / 2), -0.45, 0, 0);
  const slot = at(new THREE.BoxGeometry(1.7, 0.3, 2.9), 0.85, -1.38, 0); // the red filter sits in this slot
  const slotSides = [at(new THREE.BoxGeometry(1.7, 0.3, 0.12), 0.85, -1.38, 1.4), at(new THREE.BoxGeometry(1.7, 0.3, 0.12), 0.85, -1.38, -1.4)];
  const carriage = at(new THREE.BoxGeometry(1.6, 1.3, 0.8), -0.9 - L / 2, 0, RAIL_Z + 0.5);
  const lampDark = new THREE.Mesh(merge([...vents, face, barrel, slot, ...slotSides, carriage]), black);
  const lampRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 8, 32).rotateY(Math.PI / 2), mats.chrome);
  const lensMat = new THREE.MeshStandardMaterial({ name: 'Lens', color: '#30353d', emissive: '#000000', roughness: 0.1, metalness: 0 });
  const lens = new THREE.Mesh(at(new THREE.CircleGeometry(0.68, 32).rotateY(Math.PI / 2), 0.005, 0, 0), lensMat);
  housing.castShadow = true;
  lampDark.castShadow = true;
  lamp.add(housing, lampDark, lampRing, lens);
  // the red filter: a thin pane in the slot, it slides up and out
  const filter = new THREE.Group();
  filter.name = 'RedFilter';
  const filterMat = new THREE.MeshPhysicalMaterial({
    name: 'RedFilter',
    color: '#f03e3e',
    emissive: '#c92a2a',
    emissiveIntensity: 0.55,
    roughness: 0.18,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
    clearcoat: 1,
  });
  // a thick pane, turned a little toward the viewer so its red face shows (not only its edge)
  const pane = new THREE.Mesh(new RoundedBoxGeometry(0.24, 2.6, 2.7, 2, 0.08), filterMat);
  pane.rotation.y = -0.6;
  pane.castShadow = true;
  filter.add(pane);
  filter.position.set(0.85, 0, 0);
  lamp.add(filter);
  // a big, invisible box round the lamp for taps and drags
  const lampHit = new THREE.Mesh(at(new THREE.BoxGeometry(L + 1.8, 3.6, 3.8), -L / 2 - 0.3, 0, 0), new THREE.MeshBasicMaterial({ visible: false }));
  lampHit.userData.noExport = true;
  lamp.add(lampHit);

  // ── the screen: a white card on a stand, turned to face the prism and the camera ──
  const screen = new THREE.Group();
  screen.name = 'Screen';
  const N = new THREE.Vector3(-Math.cos(THREE.MathUtils.degToRad(SCREEN.yaw)), 0, Math.sin(THREE.MathUtils.degToRad(SCREEN.yaw)));
  screen.position.set(SCREEN.at.x, 0, SCREEN.at.z);
  screen.rotation.y = Math.atan2(N.x, N.z);
  const cardH = SCREEN.top - SCREEN.bottom;
  // transparent from the start (opacity 1): seen from behind it fades, so the prism shows through (app.js)
  const cardMat = new THREE.MeshStandardMaterial({ name: 'ScreenCard', color: '#eef0f2', roughness: 0.9, metalness: 0, transparent: true });
  const card = new THREE.Mesh(at(new RoundedBoxGeometry(SCREEN.half * 2, cardH, 0.3, 2, 0.1), 0, SCREEN.bottom + cardH / 2, -0.16), cardMat);
  card.castShadow = true;
  card.receiveShadow = true;
  const clamp = at(new THREE.BoxGeometry(2.2, 0.9, 0.9), 0, SCREEN.bottom - 0.2, -0.2);
  const sst = standParts({ x: 0, z: -0.2, height: SCREEN.bottom + 0.2, baseR: 2.4, rodR: 0.36 });
  const screenIron = new THREE.Mesh(merge([...sst.iron, clamp]), iron);
  const screenSteel = new THREE.Mesh(merge(sst.steel), steel);
  screenIron.castShadow = true;
  screen.add(card, screenIron, screenSteel);

  root.add(prismStand, rail, prismGroup, lamp, screen);

  /** Puts the lamp on its rail for an angle of incidence i (degrees). */
  function setLamp(i) {
    const p = lampAt(i);
    const d = incident(i);
    lamp.position.set(p.x, p.y, 0);
    lamp.rotation.set(0, 0, Math.atan2(d.y, d.x));
  }

  return {
    root,
    prism: prismGroup,
    prismMesh: prism,
    glassMats: [glassMat, prismBack.material],
    lamp,
    lampBody: housing,
    lampHit,
    lens,
    lensMat,
    filter,
    filterMat,
    screen,
    card,
    cardMat,
    setLamp,
    hit: { lamp: lampHit, prism, filter: pane, screen: card },
  };
}
