// A single illustrated walker. The screen-facing symbol is deliberately larger than life, like a person on a map.
import * as THREE from 'three';
const ink = '#183648';
const material = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });

export function createWalker() {
  const root = new THREE.Group();
  root.name = 'Walker';
  const facing = new THREE.Group();
  const body = new THREE.Group();
  facing.add(body);
  root.add(facing);
  const paint = {
    shirt: material('#ffd04d'),
    trousers: material('#2461b5'),
    skin: material('#dfad7d'),
    dark: material(ink),
    hair: material('#352c29'),
    white: material('#fff8e8'),
  };
  function box(parent, w, h, x, y, color, z = 0.02) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), color);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function circle(parent, r, x, y, color, z = 0.04) {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 24), color);
    mesh.position.set(x, y, z);
    parent.add(mesh);
  }
  const legs = [-1, 1].map((side) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.24, 1.1, 0);
    box(leg, 0.28, 0.94, 0, -0.43, paint.trousers);
    box(leg, 0.4, 0.18, side * 0.04, -0.98, paint.dark);
    body.add(leg);
    return leg;
  });
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.57, 2.12, -0.01);
    box(arm, 0.28, 0.52, 0, -0.2, paint.shirt);
    box(arm, 0.22, 0.48, 0, -0.65, paint.skin);
    circle(arm, 0.13, 0, -0.89, paint.skin);
    body.add(arm);
    return arm;
  });
  box(body, 1.12, 1.18, 0, 1.66, paint.white, 0.01);
  box(body, 1.0, 1.08, 0, 1.66, paint.shirt, 0.03);
  box(body, 0.96, 0.18, 0, 1.11, paint.trousers, 0.04);
  box(body, 0.22, 0.3, 0, 2.36, paint.skin);
  circle(body, 0.43, 0, 2.83, paint.white);
  circle(body, 0.38, 0, 2.83, paint.skin, 0.06);
  const hair = new THREE.Shape();
  hair.moveTo(-0.39, 0);
  hair.absarc(0, 0, 0.39, Math.PI, 0, true);
  hair.lineTo(0.38, 0.11);
  hair.quadraticCurveTo(0.05, 0.2, -0.39, -0.03);
  hair.closePath();
  const cap = new THREE.Mesh(new THREE.ShapeGeometry(hair), paint.hair);
  cap.position.set(0, 2.91, 0.08);
  body.add(cap);
  circle(body, 0.035, -0.12, 2.81, paint.dark, 0.09);
  circle(body, 0.035, 0.12, 2.81, paint.dark, 0.09);
  const projected = new THREE.Vector3();
  let boxOnScreen = null;

  return {
    root,
    set(progress) {
      const walking = progress > 0 && progress < 1;
      const stride = walking ? Math.sin(progress * Math.PI * 6) : 0;
      legs[0].rotation.z = stride * 0.48;
      legs[1].rotation.z = -stride * 0.48;
      arms[0].rotation.z = 0.12 - stride * 0.45;
      arms[1].rotation.z = -0.12 + stride * 0.45;
      body.rotation.z = walking ? stride * 0.035 : 0;
      body.userData.finished = progress === 1;
    },
    fit(stage) {
      stage.camera.updateMatrixWorld();
      facing.quaternion.copy(stage.camera.quaternion);
      const depth = -projected.copy(root.position).applyMatrix4(stage.camera.matrixWorldInverse).z;
      const pxPerUnit = stage.height / (2 * Math.max(1, depth) * Math.tan(THREE.MathUtils.degToRad(stage.camera.fov) / 2));
      const height = stage.height < 240 ? 32 : 46;
      const scale = height / (3.3 * pxPerUnit);
      facing.scale.setScalar(scale);
      const offset = body.userData.finished ? { x: stage.height < 240 ? -14 : -18, y: height + 4 } : { x: 0, y: 0 };
      body.position.set(offset.x / (pxPerUnit * scale), -offset.y / (pxPerUnit * scale), 0);
      projected.copy(root.position).project(stage.camera);
      const x = (projected.x * 0.5 + 0.5) * stage.width + offset.x;
      const y = (-projected.y * 0.5 + 0.5) * stage.height + offset.y;
      boxOnScreen = { left: x - height * 0.26 - 2, right: x + height * 0.26 + 2, top: y - height - 2, bottom: y + 3 };
    },
    box() {
      return root.visible && root.parent?.visible ? boxOnScreen : null;
    },
  };
}
