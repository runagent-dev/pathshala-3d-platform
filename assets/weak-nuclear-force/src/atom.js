// The atom round the nucleus, drawn in femtometres like the rest of the scene: a soft electron cloud about
// 10⁻¹⁰ m across and six electrons (as many as the protons) in it. Symbolic: electrons are not little balls at fixed
// places, and the dots are drawn much bigger than life so that they show (they stand still, so the labels that name
// them never wander). Not exported.
import * as THREE from 'three';
import { ATOM_R } from './physics.js';
import { COLORS } from './nucleus.js';

// where the six electrons are: distance from the centre (part of the atom's radius), the plane, the angle in it
const ELECTRONS = [
  { r: 0.36, tilt: [1.25, 0.2, 0], at: 0.4 },
  { r: 0.36, tilt: [1.25, 0.2, 0], at: 0.4 + Math.PI },
  { r: 0.66, tilt: [0.35, -0.55, 0.3], at: 0.9 },
  { r: 0.66, tilt: [0.35, -0.55, 0.3], at: 0.9 + Math.PI },
  { r: 0.74, tilt: [-0.75, 0.5, -0.2], at: 2.5 },
  { r: 0.74, tilt: [-0.75, 0.5, -0.2], at: 2.5 + Math.PI },
];

export function createAtom() {
  const root = new THREE.Group();
  root.name = 'Atom';
  root.userData.noExport = true;
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { fade: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float fade; varying vec3 vN; varying vec3 vV;
      void main(){ float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0); float a = (0.06 + 0.26 * pow(f, 1.4)) * fade; gl_FragColor = vec4(0.45, 0.64, 0.95, a); }`,
  });
  const cloud = new THREE.Mesh(new THREE.SphereGeometry(ATOM_R, 64, 32), cloudMat);
  cloud.renderOrder = -1;
  root.add(cloud);
  // the atom's size: a line as long as the cloud is wide, under it, with an arrowhead at each end
  const y = -ATOM_R * 1.16;
  const a = ATOM_R * 0.07; // arrowhead
  const tick = ATOM_R * 0.07;
  const sizeMat = new THREE.LineBasicMaterial({ color: 0x1d2733, transparent: true });
  const size = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(
      [
        [-ATOM_R, y, ATOM_R, y],
        [-ATOM_R, y - tick, -ATOM_R, y + tick],
        [ATOM_R, y - tick, ATOM_R, y + tick],
        [-ATOM_R, y, -ATOM_R + a, y + a * 0.5],
        [-ATOM_R, y, -ATOM_R + a, y - a * 0.5],
        [ATOM_R, y, ATOM_R - a, y + a * 0.5],
        [ATOM_R, y, ATOM_R - a, y - a * 0.5],
      ].flatMap(([x1, y1, x2, y2]) => [new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)]),
    ),
    sizeMat,
  );
  root.add(size);
  const eGeo = new THREE.SphereGeometry(1, 20, 14); // scaled to a few pixels by the app
  const eMat = new THREE.MeshPhysicalMaterial({ color: COLORS.electron, roughness: 0.35, clearcoat: 0.4, transparent: true });
  const electrons = ELECTRONS.map((o) => {
    const g = new THREE.Group();
    g.rotation.set(...o.tilt);
    const e = new THREE.Mesh(eGeo, eMat);
    e.position.set(Math.cos(o.at) * o.r * ATOM_R, Math.sin(o.at) * o.r * ATOM_R, 0);
    g.add(e);
    root.add(g);
    return { group: g, mesh: e };
  });
  return {
    root,
    electrons,
    /** size: the electrons' radius in fm; fade: 0…1 (the cloud, dots and size line fade as the zoom goes in). */
    update(size, fade) {
      cloudMat.uniforms.fade.value = fade;
      eMat.opacity = fade;
      sizeMat.opacity = fade;
      for (const o of electrons) o.mesh.scale.setScalar(size);
    },
    /** World position of electron i. */
    electronWorld: (i, out) => electrons[i].mesh.getWorldPosition(out),
    /** The middle of the size line (where its label goes). */
    sizeMid: (out) => root.localToWorld(out.set(0, y, 0)),
  };
}
