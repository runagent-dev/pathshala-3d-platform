import * as THREE from 'three';
import { createVector } from './arrow.js';
import { groundMaterials } from './ground.js';

// A live enlarged view of the same rear shoe and contact, on a card of its own (a pale sky-blue panel with a dark
// frame, so it reads as a magnified picture and both arrows stand out on it). The block under the shoe is the same
// ground as the path, its pictures magnified as much as the shoe. Both force arrows use one scale; the ground's
// force acts on the shoe (above the contact), the foot's force on the ground (below it).
const MAG = 2.3;
const CARD = { w: 2.2, h: 1.16, x: 0, y: 0.06, z: -0.27 };
const BLOCK = { w: 1.95, h: 0.42, d: 0.38 };

/** A rounded rectangle, as a flat shape. */
function rounded(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

export function createContactDetail(shoe, colors, { anisotropy = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'EnlargedFootContact';
  root.position.set(1.98, 0.87, 0.12);
  const copy = shoe.clone(true);
  copy.name = 'EnlargedRearShoe';
  copy.scale.multiplyScalar(MAG);
  copy.traverse((o) => {
    o.castShadow = false;
  });
  root.add(copy);

  // the card behind: a dark frame and a pale panel
  const frame = new THREE.Mesh(
    new THREE.ShapeGeometry(rounded(CARD.w + 0.06, CARD.h + 0.06, 0.1), 6),
    new THREE.MeshBasicMaterial({ name: 'ContactFrame', color: '#1f3a56', toneMapped: false }),
  );
  frame.position.set(CARD.x, CARD.y, CARD.z - 0.002);
  const card = new THREE.Mesh(
    new THREE.ShapeGeometry(rounded(CARD.w, CARD.h, 0.08), 6),
    new THREE.MeshBasicMaterial({ name: 'ContactCard', color: '#dcebf5', toneMapped: false }),
  );
  card.position.set(CARD.x, CARD.y, CARD.z);
  card.name = 'ContactCard';
  root.add(frame, card);

  // the same ground, magnified: one material set per ground (its pictures shared with the path)
  const looks = {};
  for (const id of ['hard', 'sand', 'slip'])
    looks[id] = groundMaterials(id, { width: BLOCK.w, depth: BLOCK.d, height: BLOCK.h, scale: MAG, anisotropy });
  const block = new THREE.Mesh(new THREE.BoxGeometry(BLOCK.w, BLOCK.h, BLOCK.d), [
    looks.hard.side,
    looks.hard.side,
    looks.hard.top,
    looks.hard.side,
    looks.hard.side,
    looks.hard.side,
  ]);
  block.name = 'ContactGround';
  block.position.set(0, -BLOCK.h / 2 - 0.004, -0.05);
  root.add(block);
  const contact = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 16, 10),
    new THREE.MeshBasicMaterial({ name: 'GripContact', color: '#fff4ae', toneMapped: false }),
  );
  contact.name = 'GripContactPoint';
  root.add(contact);
  // grains the sliding foot throws back on sand (one instanced mesh)
  const GRAINS = 16;
  const grains = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ name: 'ContactGrains', color: '#e2bd7a', roughness: 0.9 }),
    GRAINS,
  );
  grains.frustumCulled = false;
  grains.visible = false;
  root.add(grains);
  const arrows = { f: createVector(colors.foot, 'ContactForceOnGround'), mf: createVector(colors.ground, 'ContactForceOnPerson') };
  for (const a of Object.values(arrows)) root.add(a.root);

  // the dashed guide from the real contact to the enlarged one (updated in place)
  const guideMaterial = new THREE.LineDashedMaterial({ color: '#1f3a56', dashSize: 0.045, gapSize: 0.03, transparent: true, opacity: 0.85 });
  const guideGeometry = new THREE.BufferGeometry();
  guideGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  guideGeometry.setAttribute('lineDistance', new THREE.BufferAttribute(new Float32Array(2), 1));
  const guide = new THREE.Line(guideGeometry, guideMaterial);
  guide.name = 'ContactMagnificationGuide';
  guide.frustumCulled = false;

  const anchors = { title: new THREE.Vector3(), f: new THREE.Vector3(), mf: new THREE.Vector3() };
  const from = new THREE.Vector3();
  const along = { f: new THREE.Vector3(-1, 0, 0), mf: new THREE.Vector3(1, 0, 0) };
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  let surface = '';
  return {
    root,
    arrows,
    guide,
    set({ toe, worldToe, slip, length, alpha, ground, plain }) {
      const toeX = -slip * MAG;
      copy.position.copy(shoe.position).sub(toe).multiplyScalar(MAG);
      copy.position.x += toeX;
      copy.position.z = 0;
      copy.quaternion.copy(shoe.quaternion);
      if (ground !== surface) {
        surface = ground;
        const l = looks[ground];
        block.material = [l.side, l.side, l.top, l.side, l.side, l.side];
      }
      grains.visible = ground === 'sand' && slip > 0.005;
      if (grains.visible) {
        for (let i = 0; i < GRAINS; i++) {
          p.set(-0.86 + i * 0.11 - slip * (i % 3) * 0.8, 0.015 + Math.abs(Math.sin(i * 3.1)) * slip * 0.3, 0.16);
          grains.setMatrixAt(i, m4.compose(p, q, sc.setScalar(0.012 + (i % 3) * 0.006)));
        }
        grains.instanceMatrix.needsUpdate = true;
      }
      contact.position.set(toeX, 0.018, 0.23);
      contact.visible = alpha > 0.01;
      for (const [key, y] of [
        ['f', -0.23],
        ['mf', 0.17],
      ]) {
        const arrow = arrows[key];
        if (alpha > 0.01) {
          arrow.set(from.set(toeX, y, 0.29), along[key], length * 1.35);
          arrow.setOpacity(alpha);
        } else arrow.hide();
        arrow.material.color.set(plain ? colors.plain : key === 'f' ? colors.foot : colors.ground);
      }
      root.updateMatrixWorld(true);
      a.set(worldToe.x, 0.025, worldToe.z);
      b.set(toeX, CARD.y - CARD.h / 2 - 0.03, CARD.z);
      root.localToWorld(b);
      const pos = /** @type {THREE.BufferAttribute} */ (guideGeometry.attributes.position);
      pos.setXYZ(0, a.x, a.y, a.z);
      pos.setXYZ(1, b.x, b.y, b.z);
      pos.needsUpdate = true;
      const dist = /** @type {THREE.BufferAttribute} */ (guideGeometry.attributes.lineDistance);
      dist.setX(1, a.distanceTo(b));
      dist.needsUpdate = true;
    },
    point(key) {
      root.updateMatrixWorld(true);
      return root.localToWorld(anchors[key].copy(arrows[key].root.position).add(arrows[key].tip).multiplyScalar(0.5));
    },
    /** The enlarged shoe's box in world space (labels keep off it). */
    shoeBox(out) {
      return out.setFromObject(copy);
    },
    title() {
      return root.localToWorld(anchors.title.set(CARD.x - CARD.w / 2 + 0.1, CARD.y + CARD.h / 2, 0));
    },
  };
}
