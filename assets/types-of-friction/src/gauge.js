// The force gauge (বলমাপক) that pushes the block, lying along the push, in metres: a round plate that touches the
// block's left face, a steel rod that slides back into the tube as the spring is squeezed (3 mm for 1 N), the white
// tube with its scale (0 to 12 N) and an orange pointer, a rubber grip, and a long wooden handle that runs off to the
// person pushing. The person holds the grip, so as the push grows (and the block stays put) the whole gauge moves
// towards the block by the spring's squeeze.
import * as THREE from 'three';

export const GAUGE = { tube: 0.11, radius: 0.014, rod0: 0.05, perN: 0.003, full: 12, handle: 5, plate: 0.022 };
const mat = (name, color, roughness = 0.5, metalness = 0) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness });

export function createGauge({ colors = { pointer: '#e8590c' } } = {}) {
  const root = new THREE.Group();
  root.name = 'ForceGauge';
  const { tube: len, radius: r } = GAUGE;
  const white = mat('GaugeTube', '#eef1f4', 0.4, 0.25);
  const steel = mat('GaugeSteel', '#aab2bc', 0.35, 0.8);
  const rubber = mat('GaugeGrip', '#3b4048', 0.85);
  const handleMat = mat('GaugeHandle', '#b9925a', 0.85);
  const ink = new THREE.MeshBasicMaterial({ color: '#2b3138', toneMapped: false });
  const pointerMat = new THREE.MeshBasicMaterial({ color: colors.pointer, toneMapped: false });
  const add = (geo, m, parent = root) => {
    const mesh = new THREE.Mesh(geo, m);
    parent.add(mesh);
    return mesh;
  };
  // the gauge itself, in its own frame: the tube's right end at x = 0, the tube reaching left to −len
  const body = new THREE.Group();
  body.name = 'GaugeBody';
  root.add(body);
  const tube = add(new THREE.CylinderGeometry(r, r, len, 24).rotateZ(Math.PI / 2).translate(-len / 2, 0, 0), white, body);
  tube.name = 'Tube';
  add(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.006, 24).rotateZ(Math.PI / 2).translate(-0.003, 0, 0), steel, body);
  // the scale on the front: a flat plate with ticks every 1 N (longer every 5) and the pointer
  const plateLen = len - 0.03;
  const plate = add(new THREE.BoxGeometry(plateLen, 0.013, 0.001).translate(-len / 2, 0, r - 0.0007), mat('ScalePlate', '#ffffff', 0.6), body);
  plate.name = 'ScalePlate';
  const x0 = -len + 0.022;
  const x1 = -0.022;
  for (let i = 0; i <= GAUGE.full; i++) {
    const long = i % 5 === 0;
    add(
      new THREE.BoxGeometry(0.0007, long ? 0.009 : 0.005, 0.0006).translate(x0 + (x1 - x0) * (i / GAUGE.full), long ? 0 : -0.002, r + 0.0002),
      ink,
      body,
    );
  }
  const pointer = add(new THREE.BoxGeometry(0.0024, 0.012, 0.0012).translate(0, 0, r + 0.0008), pointerMat, body);
  pointer.name = 'Pointer';
  // the grip and the handle (left), the rod and the plate that touch the block (right)
  add(new THREE.CylinderGeometry(0.019, 0.019, 0.04, 20).rotateZ(Math.PI / 2).translate(-len - 0.02, 0, 0), rubber, body);
  const handle = add(new THREE.CylinderGeometry(0.006, 0.006, 1, 10).rotateZ(Math.PI / 2).translate(-0.5, 0, 0), handleMat, body);
  const rod = add(new THREE.CylinderGeometry(0.0045, 0.0045, 1, 10).rotateZ(Math.PI / 2).translate(0.5, 0, 0), steel, body);
  const disc = add(new THREE.CylinderGeometry(GAUGE.plate, GAUGE.plate, 0.008, 28).rotateZ(Math.PI / 2), steel, body);

  const tmp = new THREE.Vector3();
  return {
    root,
    body,
    pointer,
    /**
     * Where everything is: the plate touches the block's left face at (faceX, y), the push is `force` N. `handleLen`:
     * how far the handle runs off to the left (the GLB export keeps it short).
     */
    place(faceX, y, force, handleLen = GAUGE.handle) {
      const squeeze = Math.min(GAUGE.rod0 - 0.006, force * GAUGE.perN);
      const rodLen = GAUGE.rod0 - squeeze;
      const plateX = faceX - 0.004;
      const tubeRight = plateX - 0.004 - rodLen;
      body.position.set(tubeRight, y, 0);
      disc.position.x = rodLen + 0.004;
      rod.position.x = 0;
      rod.scale.x = rodLen + 0.004;
      handle.position.x = -len - 0.04;
      handle.scale.x = handleLen;
      pointer.position.x = x0 + (x1 - x0) * Math.min(1, Math.max(0, force / GAUGE.full));
      return { right: tubeRight, left: tubeRight - len - 0.04, y };
    },
    /** The middle of the tube in the figure's space (for a label). */
    centre: () => tmp.set(body.position.x - len / 2, body.position.y, 0),
  };
}
