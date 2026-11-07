// The observer: a textbook eye on a thin stand (no face, no body): a white eyeball with a brown iris and a black
// pupil facing the tree, a clear cornea over them, on a slim post with a round foot on the sand. The student slides
// it by its foot along the strip.
import * as THREE from 'three';
import { EYE } from './optics.js';

export const EYE_R = 0.13;

export function createEye() {
  const root = new THREE.Group();
  root.name = 'Eye';
  const metal = new THREE.MeshStandardMaterial({ name: 'Stand', color: '#5c6672', metalness: 0.6, roughness: 0.38 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, EYE.y - EYE_R * 0.9, 16), metal);
  post.position.y = (EYE.y - EYE_R * 0.9) / 2;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.018, 32), metal);
  foot.position.y = 0.009;
  for (const m of [post, foot]) {
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
  }

  // the eyeball looks along +x (toward the tree); caps are made round +y, then turned to +x
  const ball = new THREE.Group();
  ball.name = 'Eyeball';
  ball.position.y = EYE.y;
  const white = new THREE.Mesh(
    new THREE.SphereGeometry(EYE_R, 40, 28),
    new THREE.MeshStandardMaterial({ name: 'Sclera', color: '#f4f1ec', roughness: 0.32 }),
  );
  white.castShadow = true;
  const cap = (r, angle, mat) => {
    const g = new THREE.SphereGeometry(r, 40, 10, 0, Math.PI * 2, 0, angle);
    g.rotateZ(-Math.PI / 2);
    return new THREE.Mesh(g, mat);
  };
  const iris = cap(EYE_R * 1.004, 0.5, new THREE.MeshStandardMaterial({ name: 'Iris', color: '#7b4a26', roughness: 0.5 }));
  // the iris's dark rim: a thin band of sphere at its edge
  const rimGeo = new THREE.SphereGeometry(EYE_R * 1.006, 40, 2, 0, Math.PI * 2, 0.46, 0.06);
  rimGeo.rotateZ(-Math.PI / 2);
  const ring = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ name: 'IrisRim', color: '#3b2312', roughness: 0.5 }));
  const pupil = cap(EYE_R * 1.008, 0.22, new THREE.MeshStandardMaterial({ name: 'Pupil', color: '#0d0d0f', roughness: 0.2 }));
  const cornea = cap(
    EYE_R * 1.05,
    0.62,
    new THREE.MeshStandardMaterial({
      name: 'Cornea',
      color: '#ffffff',
      transparent: true,
      opacity: 0.18,
      roughness: 0.05,
      metalness: 0,
      depthWrite: false,
    }),
  );
  ball.add(white, iris, ring, pupil, cornea);
  // a little down toward the sand and the tree's foot, so from the front it reads as looking at the tree
  ball.rotation.z = -0.12;
  root.add(ball);

  /** The foot's hit area for a drag (invisible, a little bigger than the foot), and the eyeball's. */
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12), hitMat);
  hitFoot.position.y = 0.04;
  const hitBall = new THREE.Mesh(new THREE.SphereGeometry(EYE_R * 1.8, 12, 8), hitMat);
  hitBall.position.y = EYE.y;
  const hitPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, EYE.y, 8), hitMat);
  hitPost.position.y = EYE.y / 2;
  for (const h of [hitFoot, hitBall, hitPost]) {
    h.userData.noExport = true;
    root.add(h);
  }

  function setX(x) {
    root.position.x = x;
  }
  return { root, ball, setX, hits: [hitFoot, hitBall, hitPost], visible: [white, post] };
}
