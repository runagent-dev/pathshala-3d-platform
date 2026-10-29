import * as THREE from 'three';
import { createVector } from './arrow.js';

// A live enlarged view of the same rear shoe and contact. Both force arrows use
// one scale; the ground force acts on the shoe, the foot force on the ground.
export function createContactDetail(shoe, colors) {
  const root = new THREE.Group();
  root.name = 'EnlargedFootContact';
  root.position.set(1.85, 0.87, 0.12);
  const magnification = 2.3;
  const copy = shoe.clone(true);
  copy.name = 'EnlargedRearShoe';
  copy.scale.multiplyScalar(magnification);
  root.add(copy);
  const material = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.42, 0.38), material('#087779'));
  slab.name = 'ContactGround';
  slab.position.set(0, -0.22, -0.05);
  root.add(slab);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.024, 0.4), material('#ffe394'));
  stripe.position.y = -0.01;
  root.add(stripe);
  const contact = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), new THREE.MeshBasicMaterial({ color: '#fff4ae' }));
  contact.name = 'GripContactPoint';
  root.add(contact);
  const grains = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const grain = new THREE.Mesh(new THREE.IcosahedronGeometry(0.012 + (i % 3) * 0.006, 0), material('#ffd166'));
    grain.position.set(-0.86 + i * 0.11, -0.05, 0.19);
    grains.add(grain);
  }
  root.add(grains);
  const arrows = { f: createVector(colors.foot, 'ContactForceOnGround'), mf: createVector(colors.ground, 'ContactForceOnPerson') };
  for (const a of Object.values(arrows)) root.add(a.root);
  const guideMaterial = new THREE.LineDashedMaterial({ color: '#f3d774', dashSize: 0.045, gapSize: 0.03, transparent: true, opacity: 0.8 });
  const guide = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), guideMaterial);
  guide.name = 'ContactMagnificationGuide';
  const anchors = { title: new THREE.Vector3(), f: new THREE.Vector3(), mf: new THREE.Vector3() };
  let toeX = 0;
  return {
    root,
    arrows,
    guide,
    set({ toe, worldToe, slip, length, alpha, ground, plain }) {
      toeX = -slip * magnification;
      copy.position.copy(shoe.position).sub(toe).multiplyScalar(magnification);
      copy.position.x += toeX;
      copy.position.z = 0;
      copy.quaternion.copy(shoe.quaternion);
      slab.material.color.set({ hard: '#087779', sand: '#c87913', slip: '#234aab' }[ground]);
      grains.visible = ground === 'sand';
      for (const [i, grain] of grains.children.entries()) {
        grain.position.x = -0.86 + i * 0.11 - slip * (i % 3) * 0.8;
        grain.position.y = -0.05 + Math.sin(i * 3.1) * slip * 0.18;
      }
      contact.position.set(toeX, 0.018, 0.23);
      contact.visible = alpha > 0.01;
      for (const [key, dir, y] of [
        ['f', -1, -0.23],
        ['mf', 1, 0.17],
      ]) {
        const a = arrows[key];
        if (alpha > 0.01) {
          a.set(new THREE.Vector3(toeX, y, 0.29), new THREE.Vector3(dir, 0, 0), length * 1.35);
          a.setOpacity(alpha);
        } else a.hide();
        a.material.color.set(plain ? colors.plain : key === 'f' ? colors.foot : colors.ground);
      }
      root.updateMatrixWorld(true);
      const a = new THREE.Vector3(worldToe.x, 0.025, worldToe.z);
      const b = root.localToWorld(new THREE.Vector3(toeX, 0, 0.24));
      guide.geometry.setFromPoints([a, b]);
      guide.computeLineDistances();
    },
    point(key) {
      root.updateMatrixWorld(true);
      return root.localToWorld(anchors[key].copy(arrows[key].root.position).add(arrows[key].tip).multiplyScalar(0.5));
    },
    title() {
      return root.localToWorld(anchors.title.set(-0.1, 0.65, 0));
    },
  };
}
