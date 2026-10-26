// The children on the field, built from simple shapes with sturdy, cartoon proportions: seen from above on a phone
// they must still read as children, so they are drawn about four times bigger than life (the figure says so). Local
// +x is forward, +y up. pose() swings the legs and arms (a walk), raises the right arm (a wave) or turns the head.
// Scene units: metres.
import * as THREE from 'three';

/** m: how tall a child is drawn (a real class-9 student is about 1.6 m). */
export const KID_H = 9;

const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });

/**
 * One child. clothes: { top, legs, hair?, skin? }. Returns { root, pose(p), hit, setOpacity(a) }.
 * pose({ walk, wave, waveT, look }): walk is the stride phase in radians (0: standing), wave 0…1 how far the right arm
 * is up (it waves to and fro with waveT, in seconds), look the head's turn in radians.
 */
export function createKid({ name = 'Child', clothes, H = KID_H }) {
  const root = new THREE.Group();
  root.name = name;
  const body = new THREE.Group(); // bobs a little while walking, pops up when found
  root.add(body);
  const M = {
    top: mat(`${name}Top`, clothes.top),
    legs: mat(`${name}Legs`, clothes.legs),
    skin: mat(`${name}Skin`, clothes.skin ?? '#b27b50', 0.7),
    hair: mat(`${name}Hair`, clothes.hair ?? '#1f1f22', 0.85),
    shoe: mat(`${name}Shoes`, '#2b2f36', 0.6),
  };
  const capsule = (r, len, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), m);

  // legs: each turns at the hip (a group at hip height), the shoe at the foot
  const HIP = H * 0.36;
  const legs = [1, -1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(0, HIP, side * H * 0.075);
    const leg = capsule(H * 0.062, H * 0.24, M.legs);
    leg.position.y = -H * 0.17;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(H * 0.17, H * 0.06, H * 0.11), M.shoe);
    shoe.position.set(H * 0.03, -HIP + H * 0.03, 0);
    hip.add(leg, shoe);
    body.add(hip);
    return hip;
  });
  // the body
  const torso = capsule(H * 0.15, H * 0.16, M.top);
  torso.scale.z = 1.18;
  torso.scale.x = 0.78;
  torso.position.y = H * 0.53;
  body.add(torso);
  // arms: each turns at the shoulder
  const SHOULDER = H * 0.64;
  const arms = [1, -1].map((side) => {
    const sh = new THREE.Group();
    sh.position.set(0, SHOULDER, side * H * 0.19);
    const arm = capsule(H * 0.05, H * 0.2, M.top);
    arm.position.y = -H * 0.13;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(H * 0.052, 10, 8), M.skin);
    hand.position.y = -H * 0.27;
    sh.add(arm, hand);
    sh.rotation.x = -side * 0.12; // a little out from the body
    body.add(sh);
    return sh;
  });
  // head and hair (seen from above the hair is what shows most: it is drawn full and dark)
  const head = new THREE.Group();
  head.position.y = H * 0.84;
  body.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(H * 0.13, 20, 16), M.skin);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(H * 0.138, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair);
  hair.position.set(-H * 0.012, H * 0.012, 0);
  hair.rotation.z = 0.35; // more hair at the back
  head.add(face, hair);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(H * 0.017, 6, 5), M.hair);
    eye.position.set(H * 0.118, H * 0.012, side * H * 0.045);
    head.add(eye);
  }

  // a soft dark patch under the feet, so the child stands on the grass even without shadows
  const patch = new THREE.Mesh(
    new THREE.CircleGeometry(H * 0.24, 28).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#0d2a10', transparent: true, opacity: 0.22, depthWrite: false }),
  );
  patch.position.y = 0.06;
  patch.renderOrder = 1;
  patch.userData.noExport = true;
  root.add(patch);

  // a generous invisible target, so a finger finds the child on a phone
  const hit = new THREE.Mesh(new THREE.BoxGeometry(H * 0.95, H * 1.2, H * 0.95), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = H * 0.55;
  hit.userData.noExport = true;
  root.add(hit);

  const materials = Object.values(M);
  return {
    root,
    body,
    hit,
    /** The top of the head, in the child's own space (for a label above it). */
    top: new THREE.Vector3(0, H * 1.02, 0),
    pose({ walk = 0, wave = 0, waveT = 0, look = 0 } = {}) {
      const s = Math.sin(walk);
      const stride = walk ? 0.5 : 0;
      legs[0].rotation.z = stride * s;
      legs[1].rotation.z = -stride * s;
      arms[1].rotation.z = -stride * 0.8 * s;
      // the right arm: swings with the walk, or goes up and waves
      const up = Math.min(1, Math.max(0, wave));
      arms[0].rotation.z = stride * 0.8 * s * (1 - up);
      arms[0].rotation.x = -(0.12 + up * 2.55 + (up > 0.5 ? Math.sin(waveT * 9) * 0.3 * up : 0));
      body.position.y = walk ? Math.abs(Math.cos(walk)) * H * 0.025 : 0;
      head.rotation.y = look;
    },
    /** Fade in or out (0…1). */
    setOpacity(a) {
      for (const m of materials) {
        const t = a < 0.999;
        if (m.transparent !== t) {
          m.transparent = t;
          m.needsUpdate = true;
        }
        m.opacity = a;
      }
      patch.material.opacity = 0.22 * a;
      root.visible = a > 0.01;
    },
  };
}
