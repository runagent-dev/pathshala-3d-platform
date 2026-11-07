// The observer: a textbook eye on a thin stand (no face, no body): a white eyeball with a brown iris, a black pupil
// and a clear cornea bulge, an upper lid over it, on a slim post with a round foot on the sand. It looks toward the
// tree, turned a little toward the viewer so the iris and pupil show from the front. The student slides it by its foot.
import * as THREE from 'three';
import { EYE } from './optics.js';

export const EYE_R = 0.17;
/** How far the eyeball is turned toward the viewer (radians, about the vertical), so the iris shows from the front. */
const TURN = (30 * Math.PI) / 180;

export function createEye() {
  const root = new THREE.Group();
  root.name = 'Eye';
  const metal = new THREE.MeshStandardMaterial({ name: 'Stand', color: '#5c6672', metalness: 0.6, roughness: 0.38 });
  const postH = EYE.y - EYE_R * 0.9;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, postH, 12), metal);
  post.position.y = postH / 2;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.018, 24), metal);
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
    new THREE.SphereGeometry(EYE_R, 24, 16),
    new THREE.MeshStandardMaterial({ name: 'Sclera', color: '#f6f3ee', roughness: 0.3 }),
  );
  white.castShadow = true;
  const cap = (r, from, angle, mat, segs = 24) => {
    const g = new THREE.SphereGeometry(r, segs, 6, 0, Math.PI * 2, from, angle);
    g.rotateZ(-Math.PI / 2);
    return new THREE.Mesh(g, mat);
  };
  const iris = cap(EYE_R * 1.004, 0, 0.56, new THREE.MeshStandardMaterial({ name: 'Iris', color: '#8a5228', roughness: 0.5 }));
  const rim = cap(EYE_R * 1.006, 0.5, 0.07, new THREE.MeshStandardMaterial({ name: 'IrisRim', color: '#3b2312', roughness: 0.5 }));
  const pupil = cap(EYE_R * 1.009, 0, 0.25, new THREE.MeshStandardMaterial({ name: 'Pupil', color: '#0d0d0f', roughness: 0.2 }));
  // the cornea: a clear bulge over the iris
  const cornea = cap(
    EYE_R * 1.06,
    0,
    0.66,
    new THREE.MeshStandardMaterial({ name: 'Cornea', color: '#ffffff', transparent: true, opacity: 0.2, roughness: 0.05, depthWrite: false }),
  );
  // the upper lid: a shell over the top of the ball, its edge an arc across the top of the iris
  const lidGeo = new THREE.SphereGeometry(EYE_R * 1.08, 24, 8, 0, Math.PI * 2, 0, 1.15);
  lidGeo.rotateZ(-0.35); // tilted forward, so its lower edge crosses the top of the iris
  const lid = new THREE.Mesh(lidGeo, new THREE.MeshStandardMaterial({ name: 'Lid', color: '#d9a982', roughness: 0.6, side: THREE.DoubleSide }));
  lid.castShadow = true;
  ball.add(white, iris, rim, pupil, cornea, lid);
  // toward the tree, a little down, and turned toward the viewer so the iris reads from the front
  ball.rotation.set(0, -TURN, -0.1);
  root.add(ball);

  /** Hit areas for a drag (invisible, a little bigger than the foot, the post and the ball). */
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12), hitMat);
  hitFoot.position.y = 0.04;
  const hitBall = new THREE.Mesh(new THREE.SphereGeometry(EYE_R * 1.6, 12, 8), hitMat);
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
  return { root, ball, setX, hits: [hitFoot, hitBall, hitPost] };
}
