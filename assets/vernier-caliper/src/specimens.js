// Objects to measure. Each knows which jaws it uses and where it sits relative to the caliper.
//
//   outside → between the big jaws, size = width/diameter     (jaws can't close below it)
//   inside  → around the small jaws, size = inner diameter     (jaws can't open beyond it)
//   depth   → at the end of the beam, size = depth of the hole (rod can't go deeper)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { DIM } from './caliper.js';
import { boxProjectUV } from '@shared/student/materials.js';

export const SPECIMENS = {
  sphere: { mode: 'outside', size: 18.4, min: 8, max: 30 },
  cylinder: { mode: 'outside', size: 12.6, min: 6, max: 30 },
  block: { mode: 'outside', size: 22.4, min: 8, max: 32 },
  ring: { mode: 'inside', size: 26.8, min: 12, max: 48 },
  bore: { mode: 'depth', size: 17.6, min: 6, max: 42 },
};

export const SPECIMEN_KINDS = Object.keys(SPECIMENS);

/** Allowed jaw gap for a specimen. */
export function gapLimits(spec) {
  if (!spec) return [0, DIM.maxGap];
  if (spec.mode === 'outside') return [spec.size, DIM.maxGap];
  return [0, spec.size];
}

/** Where the specimen rests, in caliper space. */
export function restPosition(kind, size) {
  const mode = SPECIMENS[kind].mode;
  if (mode === 'outside') return new THREE.Vector3(DIM.faceX + size / 2, -24, 0);
  if (mode === 'inside') return new THREE.Vector3(DIM.innerX + size / 2, (DIM.innerTip[0] + DIM.innerTip[1]) / 2, 0);
  return new THREE.Vector3(DIM.beamEnd, DIM.rodY, DIM.rodZ);
}

/** Direction it flies in from when placed. */
export function entryOffset(kind) {
  const mode = SPECIMENS[kind].mode;
  if (mode === 'outside') return new THREE.Vector3(0, -38, 30);
  if (mode === 'inside') return new THREE.Vector3(0, 30, 20);
  return new THREE.Vector3(45, 0, 20);
}

function chamferedCylinder(radius, height, chamfer) {
  const c = Math.min(chamfer, radius / 4);
  const h = height / 2;
  const pts = [
    [0, -h],
    [radius - c, -h],
    [radius, -h + c],
    [radius, h - c],
    [radius - c, h],
    [0, h],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 96);
}

export function createSpecimen(kind, size, M) {
  const def = SPECIMENS[kind];
  const group = new THREE.Group();
  group.name = `Specimen:${kind}`;
  const body = new THREE.Group();
  group.add(body);
  const owned = []; // materials we cloned, so we can glow + dispose them
  const own = (m) => {
    const c = m.clone();
    if ('emissive' in c) c.emissive = new THREE.Color(0x000000);
    owned.push(c);
    return c;
  };

  if (kind === 'sphere') {
    const r = size / 2;
    const steel = own(M.chrome);
    steel.roughness = 0.2;
    steel.color.set(0xe4e7eb);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 64), steel);
    // Pendulum-bob hook, so it reads as the lab object
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 2.4, 24), steel);
    neck.position.y = r + 0.8;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.55, 16, 48), steel);
    hook.position.y = r + 4.2;
    body.add(ball, neck, hook);
  }

  if (kind === 'cylinder') {
    const brass = own(M.brass);
    brass.side = THREE.FrontSide;
    const cyl = new THREE.Mesh(chamferedCylinder(size / 2, 24, 0.5), brass);
    body.add(cyl);
  }

  if (kind === 'block') {
    const wood = own(M.wood);
    const g = boxProjectUV(new RoundedBoxGeometry(size, 16, 20, 3, 0.7));
    body.add(new THREE.Mesh(g, wood));
  }

  if (kind === 'ring') {
    // Short pipe around the inside jaws, drawn as a cutaway so the jaws are visible touching the wall.
    const rIn = size / 2;
    const rOut = rIn + 2.6;
    const h = 5.4;
    const cut = THREE.MathUtils.degToRad(58); // half-angle of the wedge removed facing the viewer
    const t0 = cut;
    const tl = Math.PI * 2 - cut * 2;
    const brass = own(M.brass);
    const outer = new THREE.CylinderGeometry(rOut, rOut, h, 128, 1, true, t0, tl);
    const inner = new THREE.CylinderGeometry(rIn, rIn, h, 128, 1, true, t0, tl);
    const top = new THREE.RingGeometry(rIn, rOut, 128, 1, t0 - Math.PI / 2, tl);
    top.rotateX(-Math.PI / 2);
    top.translate(0, h / 2, 0);
    const bottom = top.clone();
    bottom.translate(0, -h, 0);
    body.add(new THREE.Mesh(outer, brass), new THREE.Mesh(inner, brass), new THREE.Mesh(top, brass), new THREE.Mesh(bottom, brass));
    const hatch = own(M.hatch);
    for (const theta of [t0, t0 + tl]) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(rOut - rIn, h), hatch);
      const rm = (rIn + rOut) / 2;
      face.position.set(Math.sin(theta) * rm, 0, Math.cos(theta) * rm);
      face.rotation.y = theta - Math.PI / 2;
      body.add(face);
    }
  }

  if (kind === 'bore') {
    // Clear acrylic block with a blind hole, so the depth rod is visible inside it.
    const len = size + 10;
    const hole = 2.7;
    const acrylic = own(M.acrylic);
    const wall = own(M.holeWall);
    const box = new THREE.BoxGeometry(len, 26, 24);
    box.translate(len / 2, 0, 0);
    const block = new THREE.Mesh(box, acrylic);
    block.renderOrder = 5;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box), M.acrylicEdge);
    const tube = new THREE.CylinderGeometry(hole, hole, size, 48, 1, true);
    tube.rotateZ(Math.PI / 2);
    tube.translate(size / 2, 0, 0);
    const tubeMesh = new THREE.Mesh(tube, wall);
    tubeMesh.renderOrder = 4;
    const floor = new THREE.CircleGeometry(hole, 48);
    floor.rotateY(-Math.PI / 2);
    floor.translate(size, 0, 0);
    const floorMesh = new THREE.Mesh(floor, own(M.holeWall));
    floorMesh.material.opacity = 0.75;
    floorMesh.renderOrder = 4;
    const rimGeo = new THREE.TorusGeometry(hole, 0.12, 8, 48);
    rimGeo.rotateY(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, new THREE.MeshBasicMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.8 }));
    body.add(block, edges, tubeMesh, floorMesh, rim);
  }

  const rest = restPosition(kind, size);
  group.position.copy(rest);

  return {
    kind,
    mode: def.mode,
    size,
    group,
    rest,
    /** 0…1 contact glow */
    setGlow(k) {
      for (const m of owned) if ('emissive' in m) m.emissive.setRGB(0.02 * k, 0.22 * k, 0.08 * k);
    },
    setOpacity(a) {
      for (const m of owned) {
        if (m.userData.baseOpacity == null) m.userData.baseOpacity = m.opacity;
        const transparent = a < 1 || m.userData.baseOpacity < 1;
        if (m.transparent !== transparent) {
          m.transparent = transparent;
          m.needsUpdate = true;
        }
        m.opacity = m.userData.baseOpacity * a;
      }
    },
    dispose() {
      group.traverse((o) => o.geometry?.dispose());
      for (const m of owned) m.dispose();
    },
  };
}
