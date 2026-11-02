// The straw (book page 145): a wide-mouthed glass bottle of cold drink with a clear straw that bends into a child's
// mouth (a head seen from the side, a little stylised). The drink in the straw is a column scaled to its height (never
// rebuilt): at the bottle's level when nobody sucks, up to the mouth while they do. Metres; the bench top is y = 0.
import * as THREE from 'three';
import { STRAW_RISE } from './reading.js';

/** The drink's surface in the bottle (world y) and where the straw's top bends into the mouth. */
export const DRINK_Y = 0.178;
export const STRAW = { r: 0.0058, bottom: 0.016, top: DRINK_Y + STRAW_RISE, bend: 0.012, reach: 0.044 };
/** The mouth: where the straw's end is, inside the lips. */
export const MOUTH = new THREE.Vector3(-STRAW.bend - STRAW.reach, STRAW.top + STRAW.bend, 0);

function bottleProfile(inset = 0) {
  // a wide-mouthed bottle, base to lip (r, y)
  const p = [
    [0.0001, 0.004],
    [0.036, 0.004],
    [0.041, 0.012],
    [0.042, 0.03],
    [0.04, 0.07],
    [0.042, 0.11],
    [0.041, 0.135],
    [0.034, 0.155],
    [0.026, 0.168],
    [0.0235, 0.18],
    [0.0235, 0.208],
    [0.026, 0.212],
    [0.026, 0.218],
    [0.0225, 0.219],
  ];
  return p.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r - inset), y));
}

export function createStraw(mats) {
  const root = new THREE.Group();
  root.name = 'Straw';

  // the bottle: green-tinted glass
  const bottleGlass = mats.glass.clone();
  bottleGlass.color.set('#cfeedd');
  bottleGlass.opacity = 0.26;
  const bottle = new THREE.Mesh(new THREE.LatheGeometry(bottleProfile(), 48), bottleGlass);
  bottle.name = 'Bottle';
  bottle.renderOrder = 8;
  // the drink: a dark cola, up into the neck
  const drinkMat = new THREE.MeshPhysicalMaterial({
    name: 'ColdDrink',
    color: '#5a240c',
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    sheen: 0.4,
    sheenColor: new THREE.Color('#b0441a'),
  });
  const inner = bottleProfile(0.0028).filter((v) => v.y <= DRINK_Y);
  inner.push(new THREE.Vector2(0.0235 - 0.0028, DRINK_Y), new THREE.Vector2(0.0001, DRINK_Y));
  const drink = new THREE.Mesh(new THREE.LatheGeometry(inner, 40), drinkMat);
  drink.name = 'DrinkInBottle';
  drink.renderOrder = 4;
  // a few bubbles stuck to the glass
  const bubbleMat = new THREE.MeshStandardMaterial({ color: '#f2d2b6', roughness: 0.2, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4;
    const y = 0.02 + ((i * 37) % 140) / 1000;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.0016 + (i % 3) * 0.0006, 8, 6), bubbleMat);
    b.position.set(Math.cos(a) * 0.036, y, Math.sin(a) * 0.036);
    b.renderOrder = 5;
    root.add(b);
  }
  root.add(drink, bottle);

  // the straw: straight up, a bend, then into the mouth (clear plastic with two red stripes)
  const path = new THREE.CurvePath();
  const { r, bottom, top, bend, reach } = STRAW;
  path.add(new THREE.LineCurve3(new THREE.Vector3(0, bottom, 0), new THREE.Vector3(0, top, 0)));
  path.add(
    new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, top, 0), new THREE.Vector3(0, top + bend, 0), new THREE.Vector3(-bend, top + bend, 0)),
  );
  path.add(new THREE.LineCurve3(new THREE.Vector3(-bend, top + bend, 0), new THREE.Vector3(-bend - reach, top + bend, 0)));
  const strawMat = mats.glass.clone();
  strawMat.color.set('#ffffff');
  strawMat.opacity = 0.32;
  const straw = new THREE.Mesh(new THREE.TubeGeometry(path, 80, r, 16, false), strawMat);
  straw.name = 'StrawTube';
  straw.renderOrder = 9;
  const stripeMat = new THREE.MeshStandardMaterial({ color: '#e0312b', roughness: 0.4, transparent: true, opacity: 0.85 });
  for (const a of [0.6, 2.6]) {
    const st = new THREE.Mesh(new THREE.TubeGeometry(path, 80, 0.0007, 4, false), stripeMat);
    st.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    st.renderOrder = 9;
    root.add(st);
  }
  root.add(straw);
  // the drink in the straw: a scaled column in the straight part; the bend and the end fill when it reaches the top
  const rc = r - 0.0011;
  const inStraw = new THREE.Mesh(new THREE.CylinderGeometry(rc, rc, 1, 14).translate(0, 0.5, 0), drinkMat);
  inStraw.name = 'DrinkInStraw';
  inStraw.position.y = bottom;
  inStraw.renderOrder = 4;
  const bendPath = new THREE.CurvePath();
  bendPath.add(path.curves[1]);
  bendPath.add(path.curves[2]);
  const inBend = new THREE.Mesh(new THREE.TubeGeometry(bendPath, 30, rc, 12, false), drinkMat);
  inBend.renderOrder = 4;
  inBend.visible = false;
  root.add(inStraw, inBend);

  // the head, seen from the side, facing the straw (+x): skin, hair, an eye, an ear and lips round the straw
  const head = new THREE.Group();
  head.name = 'Head';
  const s = new THREE.Shape();
  // the profile, origin at the lips' gap (the mouth), metres
  s.moveTo(-0.035, -0.11);
  s.bezierCurveTo(-0.03, -0.085, -0.022, -0.066, -0.01, -0.058);
  s.bezierCurveTo(0.004, -0.05, 0.006, -0.036, 0.004, -0.024);
  s.bezierCurveTo(0.003, -0.016, 0.008, -0.012, 0.009, -0.006);
  s.bezierCurveTo(0.009, -0.0035, 0.004, -0.0028, 0.002, -0.0024);
  s.lineTo(0.002, 0.0024);
  s.bezierCurveTo(0.005, 0.003, 0.01, 0.005, 0.0095, 0.009);
  s.bezierCurveTo(0.008, 0.016, 0.004, 0.02, 0.006, 0.025);
  s.bezierCurveTo(0.012, 0.028, 0.027, 0.034, 0.024, 0.042);
  s.bezierCurveTo(0.02, 0.054, 0.012, 0.062, 0.011, 0.072);
  s.bezierCurveTo(0.012, 0.08, 0.014, 0.086, 0.012, 0.094);
  s.bezierCurveTo(0.01, 0.12, -0.02, 0.16, -0.075, 0.162);
  s.bezierCurveTo(-0.13, 0.164, -0.165, 0.12, -0.168, 0.07);
  s.bezierCurveTo(-0.17, 0.02, -0.15, -0.01, -0.128, -0.03);
  s.bezierCurveTo(-0.12, -0.06, -0.112, -0.09, -0.11, -0.11);
  s.lineTo(-0.035, -0.11);
  const depth = 0.1;
  const skinGeo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.008,
    bevelSegments: 5,
    curveSegments: 18,
  });
  skinGeo.translate(0, 0, -depth / 2);
  const face = new THREE.Mesh(skinGeo, mats.skin);
  face.castShadow = true;
  head.add(face);
  // hair: a cap over the crown and the back
  const h = new THREE.Shape();
  h.moveTo(0.012, 0.094);
  h.bezierCurveTo(0.01, 0.124, -0.02, 0.166, -0.076, 0.168);
  h.bezierCurveTo(-0.134, 0.17, -0.172, 0.122, -0.175, 0.07);
  h.bezierCurveTo(-0.176, 0.03, -0.158, 0.0, -0.136, -0.018);
  h.bezierCurveTo(-0.13, 0.03, -0.12, 0.07, -0.095, 0.095);
  h.bezierCurveTo(-0.06, 0.118, -0.02, 0.108, 0.012, 0.094);
  const hairGeo = new THREE.ExtrudeGeometry(h, {
    depth: depth + 0.012,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.006,
    bevelSegments: 4,
    curveSegments: 16,
  });
  hairGeo.translate(0, 0, -(depth + 0.012) / 2);
  const hair = new THREE.Mesh(hairGeo, new THREE.MeshStandardMaterial({ name: 'Hair', color: '#1d1410', roughness: 0.75 }));
  hair.castShadow = true;
  head.add(hair);
  // the eye and brow, on the near side
  const zFace = depth / 2 + 0.018;
  const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 16, 10), new THREE.MeshStandardMaterial({ color: '#f6f1ea', roughness: 0.3 }));
  eyeWhite.scale.set(1, 0.62, 0.5);
  eyeWhite.position.set(-0.006, 0.071, zFace - 0.002);
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 14, 8), new THREE.MeshStandardMaterial({ color: '#2a1a10', roughness: 0.2 }));
  iris.scale.set(1, 1, 0.5);
  iris.position.set(-0.0035, 0.0705, zFace + 0.0006);
  const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.0016, 0.012, 4, 8), hair.material);
  brow.rotation.z = Math.PI / 2 - 0.25;
  brow.position.set(-0.007, 0.0815, zFace - 0.001);
  // the ear
  const ear = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0045, 10, 20, Math.PI * 1.5), mats.skin);
  ear.rotation.z = Math.PI * 0.6;
  ear.position.set(-0.088, 0.05, zFace - 0.004);
  ear.scale.set(0.8, 1.15, 0.6);
  head.add(eyeWhite, iris, brow, ear);
  // lips: a rosier ring round the straw, pushed forward
  const lipMat = new THREE.MeshStandardMaterial({ name: 'Lips', color: '#b8575a', roughness: 0.45 });
  const lips = new THREE.Mesh(new THREE.TorusGeometry(0.0062, 0.0036, 10, 24), lipMat);
  lips.rotation.y = Math.PI / 2;
  lips.scale.set(1, 1.15, 1.6);
  lips.position.set(0.006, 0, 0);
  head.add(lips);
  // the inside of the mouth, seen through a cut in the cheek: a dark rose pocket of air round the straw's end
  const pocket = new THREE.Mesh(
    new THREE.CircleGeometry(0.019, 32),
    new THREE.MeshBasicMaterial({ name: 'MouthInside', color: '#6d2230', transparent: true, opacity: 0.9, toneMapped: false }),
  );
  pocket.scale.set(1.25, 0.62, 1);
  pocket.position.set(-0.018, 0.0, zFace + 0.0015);
  pocket.renderOrder = 3;
  const pocketRim = new THREE.Mesh(new THREE.RingGeometry(0.019, 0.0215, 40), new THREE.MeshBasicMaterial({ color: '#f0b9a5', toneMapped: false }));
  pocketRim.scale.copy(pocket.scale);
  pocketRim.position.copy(pocket.position);
  pocketRim.position.z += 0.0002;
  pocketRim.renderOrder = 3;
  head.add(pocket, pocketRim);
  head.position.copy(MOUTH);
  head.position.x -= 0.004;
  root.add(head);

  // the straw's end inside the pocket is drawn over it (so it shows in the cut)
  const endPiece = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, 0.024, 14),
    new THREE.MeshBasicMaterial({ color: '#f4f4f4', transparent: true, opacity: 0.55 }),
  );
  endPiece.rotation.z = Math.PI / 2;
  endPiece.position.set(MOUTH.x - 0.008, MOUTH.y, zFace + 0.004);
  endPiece.renderOrder = 4;
  root.add(endPiece);

  /** The drink's top in the straw (world y), from the bottle's level up to the top of the straight part. */
  function setLevel(y) {
    const top = Math.min(STRAW.top, Math.max(DRINK_Y, y));
    inStraw.scale.y = top - bottom;
    inBend.visible = y >= STRAW.top + 0.0005;
  }
  setLevel(DRINK_Y);

  return { root, setLevel, hitMeshes: [straw, bottle, face, lips], pocketCentre: new THREE.Vector3(MOUTH.x - 0.022, MOUTH.y, 0), zFace };
}
