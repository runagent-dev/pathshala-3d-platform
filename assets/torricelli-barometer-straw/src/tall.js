// The book's limit (page 145): a straw 10.5 m long, and the cold drink rising in it to 10.3 m and no higher. Drawn to
// scale beside a person (1.6 m) and a scale marked in metres. The glass is the same glass, made four times larger as
// the camera pulls back; the straw is drawn wider than a real one so that it can be seen from this far.
import * as THREE from 'three';
import { H_WATER, STRAW_LONG } from './reading.js';
import { DRINK_Y, STRAW } from './glass.js';

/** How much larger the glass is drawn in this view. */
export const BIG = 4;
export const TALL = {
  x: STRAW.x * BIG,
  z: STRAW.z * BIG,
  r: 0.034,
  bottom: 0.03,
  level: DRINK_Y * BIG, // the drink's surface in the big glass
  scaleX: 0.42, // the scale's x
  personX: -0.75,
  person: 1.6,
};
TALL.top = TALL.level + STRAW_LONG;
TALL.max = TALL.level + H_WATER;

export function createTall() {
  const root = new THREE.Group();
  root.name = 'TallStraw';
  root.userData.noExport = true;
  root.visible = false;

  const strawMat = new THREE.MeshPhysicalMaterial({
    name: 'TallStraw',
    color: '#ffffff',
    roughness: 0.15,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMapIntensity: 1.4,
  });
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(TALL.r, TALL.r, 1, 20, 1, true).translate(0, 0.5, 0), strawMat);
  straw.position.set(TALL.x, TALL.bottom, TALL.z);
  straw.renderOrder = 8;
  const drinkMat = new THREE.MeshStandardMaterial({
    name: 'TallDrink',
    color: '#7a3510',
    roughness: 0.3,
    emissive: '#2a0d02',
    emissiveIntensity: 0.5,
  });
  const column = new THREE.Mesh(new THREE.CylinderGeometry(TALL.r * 0.8, TALL.r * 0.8, 1, 16).translate(0, 0.5, 0), drinkMat);
  column.position.set(TALL.x, TALL.bottom, TALL.z);
  column.renderOrder = 5;

  // the scale: a white bar, a tick at every metre above the drink's surface in the glass, a yellow mark at 10.3 m
  const scale = new THREE.Group();
  const white = new THREE.MeshBasicMaterial({ name: 'Scale', color: '#f1f5ff', fog: false });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1, 0.03).translate(0, 0.5, 0), white);
  bar.position.set(TALL.scaleX, TALL.level, 0);
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.035, 0.03), white, 11);
  const m = new THREE.Matrix4();
  for (let i = 0; i <= 10; i++) {
    const w = i % 5 === 0 ? 0.26 : 0.14;
    m.makeScale(w, 1, 1).setPosition(TALL.scaleX - w / 2 + 0.015, TALL.level + i, 0);
    ticks.setMatrixAt(i, m);
  }
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.035), new THREE.MeshBasicMaterial({ name: 'Limit', color: '#ffd43b' }));
  mark.position.set((TALL.x + TALL.scaleX) / 2 + 0.06, TALL.max, 0);
  scale.add(bar, ticks, mark);

  // a person, for the size: a plain grey-blue figure, no face
  const body = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ name: 'Person', color: '#9db0c6', roughness: 0.8 });
  const h = TALL.person;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 20, 14), skin);
  head.position.y = h - 0.11;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.42, 6, 16), skin);
  torso.position.y = h * 0.62;
  torso.scale.z = 0.62;
  const legGeo = new THREE.CapsuleGeometry(0.065, 0.66, 4, 12);
  const legL = new THREE.Mesh(legGeo, skin);
  legL.position.set(-0.08, 0.4, 0);
  const legR = legL.clone();
  legR.position.x = 0.08;
  const armGeo = new THREE.CapsuleGeometry(0.048, 0.5, 4, 10);
  const armL = new THREE.Mesh(armGeo, skin);
  armL.position.set(-0.22, h * 0.6, 0);
  armL.rotation.z = -0.08;
  const armR = armL.clone();
  armR.position.x = 0.22;
  armR.rotation.z = 0.08;
  body.add(head, torso, legL, legR, armL, armR);
  body.position.x = TALL.personX;

  root.add(straw, column, scale, body);

  return {
    root,
    /** grow: how much of the long straw is there (0 … 1); rise: the drink in it, 0 (the glass's level) … 1 (10.3 m). */
    set(grow, rise) {
      root.visible = grow > 0.001;
      const len = Math.max(1e-4, (TALL.top - TALL.bottom) * grow);
      straw.scale.y = len;
      const col = TALL.level - TALL.bottom + H_WATER * rise;
      column.scale.y = Math.max(1e-4, Math.min(len, col));
      bar.scale.y = Math.max(1e-4, H_WATER * Math.min(1, grow * 1.2));
      ticks.count = Math.max(0, Math.min(11, Math.floor(H_WATER * Math.min(1, grow * 1.2)) + 1));
      mark.visible = rise > 0.995;
      const k = Math.min(1, grow * 2);
      body.scale.setScalar(Math.max(1e-4, k));
    },
  };
}
