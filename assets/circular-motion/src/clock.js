// A round wall clock (ঘড়ি) in centimetres: 31 cm across, a dark wooden frame, a white face with Bangla numerals,
// hour, minute and second hands (ঘড়ির কাঁটা). The second hand turns clockwise; the mark on it is 12 cm from the
// pin. The face looks along +z; the wall is behind it.
// The hands live in the plane of the face, built like the other examples: angle 0 (+y) is 12 o'clock and the
// plane's +z points into the wall, so a positive angle turns clockwise as seen from the front.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { clockHands } from './reading.js';

export const CLOCK = { r: 12, face: 14, frame: 15.5, start: 10 * 3600 + 10 * 60 }; // the clock shows 10:10:00

/** A flat hand pointing along +y: from −tail to len, `w` wide, with a pointed end. */
function handShape(len, w, tail) {
  const s = new THREE.Shape();
  s.moveTo(-w * 0.62, -tail);
  s.lineTo(-w / 2, len - w * 1.6);
  s.lineTo(0, len);
  s.lineTo(w / 2, len - w * 1.6);
  s.lineTo(w * 0.62, -tail);
  s.closePath();
  return s;
}

export function createClock({ t }) {
  const N = t.num;
  const root = new THREE.Group();
  root.name = 'WallClock';
  const wood = new THREE.MeshPhysicalMaterial({ name: 'Frame', color: 0xe76619, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const faceMat = new THREE.MeshStandardMaterial({ name: 'Face', color: 0xffffff, roughness: 0.8, emissive: 0xffffff, emissiveIntensity: 0.22 });
  const black = new THREE.MeshStandardMaterial({ name: 'Hands', color: 0x1b1e23, roughness: 0.45, metalness: 0.2 });
  const tickMat = new THREE.MeshBasicMaterial({ name: 'Ticks', color: 0x22262c, toneMapped: false });

  // frame: a rounded rim and a back
  const rim = new THREE.Mesh(new THREE.TorusGeometry(CLOCK.frame - 0.85, 0.85, 20, 96), wood);
  rim.name = 'Rim';
  rim.position.z = 1.3;
  const back = new THREE.Mesh(new THREE.CylinderGeometry(CLOCK.frame - 0.3, CLOCK.frame - 0.6, 3.6, 96).rotateX(Math.PI / 2), wood);
  back.name = 'Back';
  back.position.z = -0.5;
  const face = new THREE.Mesh(new THREE.CircleGeometry(CLOCK.face + 0.1, 96), faceMat);
  face.name = 'Face';
  face.position.z = 1.32;
  root.add(rim, back, face);

  // the minute track: 60 ticks, every fifth longer and bolder
  const tickGeo = new THREE.PlaneGeometry(1, 1);
  const ticks = new THREE.InstancedMesh(tickGeo, tickMat, 60);
  ticks.name = 'Ticks';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < 60; i++) {
    const hour = i % 5 === 0;
    const len = hour ? 1.05 : 0.55;
    const a = (-i * Math.PI) / 30; // clockwise from 12
    const rr = 13.15 - len / 2;
    q.setFromAxisAngle(zAxis, a);
    m.compose(new THREE.Vector3(-Math.sin(a) * rr, Math.cos(a) * rr, 1.36), q, new THREE.Vector3(hour ? 0.34 : 0.13, len, 1));
    ticks.setMatrixAt(i, m);
  }
  root.add(ticks);
  for (let h = 1; h <= 12; h++) {
    const a = (-h * Math.PI) / 6;
    const label = textMesh(N(String(h)), 2.15, { color: '#1b1e23', weight: 600 });
    label.position.set(-Math.sin(a) * 10.15, Math.cos(a) * 10.15, 1.38);
    root.add(label);
  }

  // the hands, in the plane of the face (local +z into the wall: the nearer hand has the more negative z)
  const plane = new THREE.Group();
  plane.name = 'HandsPlane';
  plane.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1)),
  );
  plane.position.z = 1.4;
  root.add(plane);
  const hand = (name, len, w, tail, z) => {
    const g = new THREE.Group();
    g.name = name;
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(handShape(len, w, tail), { depth: 0.12, bevelEnabled: false }), black);
    mesh.position.z = z;
    g.add(mesh);
    plane.add(g);
    return g;
  };
  const hourHand = hand('HourHand', 7, 0.78, 1.4, -0.3);
  const minuteHand = hand('MinuteHand', 10.6, 0.56, 1.7, -0.5);
  const spin = hand('SecondHand', 12.7, 0.17, 3.4, -0.7);
  const weight = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), black);
  weight.position.set(0, -2.6, -0.71);
  weight.rotation.y = Math.PI;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24).rotateX(Math.PI / 2), black);
  pin.position.z = -0.95;
  spin.add(weight, pin);

  // a generous invisible target along the second hand, so a finger finds it on a phone
  const hit = new THREE.Mesh(new THREE.BoxGeometry(5, 17, 3), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  hit.position.set(0, 6, -0.7);
  spin.add(hit);

  // the wall catches the clock's shadow (not exported)
  const lamp = new THREE.DirectionalLight(0xffffff, 0.9);
  lamp.position.set(-90, 160, 260);
  lamp.userData.noExport = true;
  lamp.target.userData.noExport = true;
  root.add(lamp, lamp.target);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.12 }));
  wall.position.z = -2.35;
  wall.receiveShadow = true;
  wall.userData.noExport = true;
  wall.visible = false;
  root.add(wall);

  const deg = THREE.MathUtils.degToRad;
  // a point of a part, in the world (written into `out`, so labels that follow it every frame allocate nothing)
  const local =
    (obj, x, y, z) =>
    (out = new THREE.Vector3()) =>
      obj.localToWorld(out.set(x, y, z));
  return {
    id: 'clock',
    root,
    plane,
    spin,
    r: CLOCK.r,
    lift: -1.1, // the path is drawn just in front of the hands
    hub: 1.4, // the pin and the hands' roots round the fixed point
    fit: { radius: CLOCK.frame + 0.6, depth: 2 },
    views: { front: new THREE.Vector3(0, 0.1, 1).normalize(), '3d': new THREE.Vector3(0.62, 0.3, 0.72).normalize() },
    grab: [hit],
    lights: [lamp],
    shadowReceiver: wall,
    shadowSize: (CLOCK.frame + 0.6) * 1.5,
    /** The second hand at `deg` (clockwise from 12); the minute and hour hands follow as on a real clock. */
    setAngle(a) {
      const h = clockHands(CLOCK.start + a / 6);
      spin.rotation.z = deg(a);
      minuteHand.rotation.z = deg(h.minute);
      hourHand.rotation.z = deg(h.hour);
    },
    tags: {
      center: local(plane, 0, 0, -1.1),
      tip: local(spin, 0, CLOCK.r, -0.8),
      mid: local(spin, 0, 6, -0.8),
      other: local(minuteHand, 0, 10, -0.6),
    },
    exportRoot: root,
  };
}
