// ক্রেন দিয়ে ভারী জিনিস তোলা: a truck crane on its outriggers lifts a concrete block (1.5 m × 1 m × 1 m, about
// three and a half tonnes) by its steel ring. Real size, metres; the truck faces −x, the load hangs at +x. update(m) places the block,
// the hook and the cable for the motion m (motion.js craneAt); the force arrow goes up beside the cable, from the
// block's top where the ring is.
import * as THREE from 'three';
import { createArrow } from './arrow.js';
import { V, blob, box, canvasTexture, castShadows, groundPatch, hitBox, mat, tube, wheel } from './parts.js';

const BOOM_PIVOT = V(-0.45, 1.95, 0);
const BOOM_ANGLE = THREE.MathUtils.degToRad(35);
const BOOM_LEN = 4.6;
const TIP = BOOM_PIVOT.clone().add(V(Math.cos(BOOM_ANGLE) * BOOM_LEN, Math.sin(BOOM_ANGLE) * BOOM_LEN, 0));
const CABLE_X = TIP.x + 0.2; // the cable leaves the far side of the pulley
const LOAD = { w: 1.5, h: 1.0, d: 1.0 };
const RING_H = 0.17;

export function createCraneScene({ colors }) {
  const root = new THREE.Group();
  root.name = 'CraneScene';
  const model = new THREE.Group();
  model.name = 'TruckCrane';
  root.add(model);

  const yellow = mat('#f2b20f', { roughness: 0.45, name: 'CraneYellow' });
  const dark = mat('#2c3138', { roughness: 0.6, name: 'Chassis' });
  const glass = mat('#3d5a73', { roughness: 0.15, metalness: 0.3, name: 'Glass' });
  const steel = mat('#b9c0c8', { roughness: 0.35, metalness: 0.75, name: 'Steel' });
  const stripe = mat('#1f2328', { roughness: 0.5, name: 'Stripe' });

  // ── the truck ──
  box(5.2, 0.42, 2.2, dark, -2.05, 0.74, 0, model); // chassis
  box(1.5, 1.55, 2.3, yellow, -3.95, 1.72, 0, model); // cab
  box(0.06, 0.7, 1.9, glass, -4.72, 2.05, 0, model); // windscreen
  for (const z of [1.16, -1.16]) box(0.9, 0.62, 0.05, glass, -3.85, 2.08, z, model); // side windows
  box(1.52, 0.12, 2.32, stripe, -3.95, 1.0, 0, model);
  box(3.4, 0.32, 2.3, yellow, -1.55, 1.11, 0, model); // deck
  for (const x of [-3.95, -1.25, -0.2])
    for (const z of [1.08, -1.08]) {
      const w = wheel(0.48, 0.38);
      w.position.set(x, 0.48, z);
      model.add(w);
    }
  // outriggers: beams out to the sides, legs down to pads on the ground (a crane lifts only on them)
  for (const x of [-2.7, 0.25])
    for (const z of [1, -1]) {
      box(0.22, 0.2, 0.75, yellow, x, 0.95, z * 1.45, model);
      tube(V(x, 0.95, z * 1.78), V(x, 0.12, z * 1.78), 0.07, steel, model);
      box(0.45, 0.06, 0.45, dark, x, 0.04, z * 1.78, model);
    }
  // turntable, operator's cab, boom
  const turn = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.38, 28), yellow);
  turn.position.set(-0.6, 1.46, 0);
  model.add(turn);
  box(0.9, 0.95, 0.75, yellow, -1.05, 2.0, -0.78, model);
  box(0.05, 0.5, 0.6, glass, -0.59, 2.12, -0.78, model);
  box(0.7, 0.62, 0.62, dark, -1.0, 1.85, 0.0, model); // counterweight / winch housing
  const boom = new THREE.Group();
  boom.position.copy(BOOM_PIVOT);
  boom.rotation.z = BOOM_ANGLE;
  model.add(boom);
  box(3.0, 0.56, 0.5, yellow, 1.35, 0, 0, boom);
  box(2.4, 0.42, 0.38, yellow, BOOM_LEN - 1.25, 0, 0, boom);
  box(3.0, 0.07, 0.51, stripe, 1.35, -0.25, 0, boom);
  box(0.2, 0.62, 0.56, dark, -0.1, 0, 0, boom);
  const sheave = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 24), steel);
  sheave.rotation.x = Math.PI / 2;
  sheave.position.set(BOOM_LEN, 0, 0);
  boom.add(sheave);
  box(0.36, 0.5, 0.06, yellow, BOOM_LEN - 0.05, 0, 0.12, boom);
  box(0.36, 0.5, 0.06, yellow, BOOM_LEN - 0.05, 0, -0.12, boom);
  // hydraulic ram from the turntable up to the boom
  const ramFoot = V(0.05, 1.55, 0);
  const ramTop = BOOM_PIVOT.clone().add(V(Math.cos(BOOM_ANGLE) * 1.9, Math.sin(BOOM_ANGLE) * 1.9 - 0.28, 0));
  tube(ramFoot, ramFoot.clone().lerp(ramTop, 0.55), 0.11, dark, model);
  tube(ramFoot.clone().lerp(ramTop, 0.45), ramTop, 0.07, steel, model);

  // ── cable, hook block and hook (moved by update) ──
  const ropeMat = mat('#30343a', { roughness: 0.5, name: 'Cable' });
  const cable = tube(V(CABLE_X, TIP.y, 0), V(CABLE_X, 2, 0), 0.018, ropeMat, model);
  const hookBlock = new THREE.Group();
  model.add(hookBlock);
  box(0.34, 0.42, 0.26, yellow, 0, 0.21, 0, hookBlock);
  box(0.35, 0.08, 0.27, stripe, 0, 0.12, 0, hookBlock);
  const hookSteel = steel;
  const shank = tube(V(0, 0, 0), V(0, -0.14, 0), 0.03, hookSteel, hookBlock);
  void shank;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.026, 10, 24, Math.PI * 1.55), hookSteel);
  hook.position.set(0, -0.22, 0);
  hook.rotation.z = Math.PI * 0.72;
  hookBlock.add(hook);

  // ── the load: a concrete block with a steel lifting ring ──
  const concrete = new THREE.MeshStandardMaterial({
    name: 'Concrete',
    roughness: 0.95,
    map: canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#b9b6ae';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        const g = 150 + Math.floor(Math.random() * 70);
        ctx.fillStyle = `rgba(${g},${g - 4},${g - 10},0.35)`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    }),
  });
  const load = new THREE.Group();
  load.name = 'ConcreteBlock';
  model.add(load);
  box(LOAD.w, LOAD.h, LOAD.d, concrete, 0, LOAD.h / 2, 0, load);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.024, 10, 24), hookSteel);
  ring.position.set(0, LOAD.h + RING_H * 0.55, 0);
  load.add(ring);
  box(0.16, 0.04, 0.12, hookSteel, 0, LOAD.h + 0.02, 0, load);
  load.position.x = CABLE_X;
  const shade = blob(LOAD.w * 0.75, 0.42);
  shade.scale.y = 0.8;
  shade.position.set(CABLE_X, 0.004, 0);

  // ── ground: a site of packed earth ──
  const ground = groundPatch(13, 7.5, {
    color: '#ece7dc',
    draw: (ctx, w, h) => {
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(150,130,100,${0.05 + Math.random() * 0.08})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 2);
      }
    },
  });
  ground.position.set(0.3, 0, 0);
  root.add(ground, shade);
  castShadows(model);

  // big targets: the block (it moves with the block) and the truck
  const hits = [hitBox(2.1, 2.2, 1.6, 0, 0.95, 0, load), hitBox(3.2, 2.6, 2.6, -1.4, 1.4, 0, model)];

  const arrow = createArrow({ color: colors.force, radius: 0.045, head: 0.26, headRadius: 0.11 });
  root.add(arrow.root);

  const v = new THREE.Vector3();
  let lift = 0;
  let wobble = 0;

  function update(m, { arrowOn = false } = {}) {
    lift = m.pos;
    const take = m.take ?? 1; // the slack goes out of the cable (the hook block rises a little first)
    load.position.set(CABLE_X, lift, 0);
    load.rotation.z = wobble * 0.03;
    const hookY = lift + LOAD.h + RING_H + 0.02 * take;
    hookBlock.position.set(CABLE_X, hookY + 0.22, 0);
    cable.position.set(CABLE_X, (TIP.y - 0.18 + hookY + 0.62) / 2, 0);
    cable.scale.set(0.018, TIP.y - 0.18 - (hookY + 0.62), 0.018);
    arrow.setOpacity(arrowOn ? 1 : 0);
    if (arrowOn) arrow.set(v.set(CABLE_X + 0.42, lift + LOAD.h + 0.02, 0.3), V(0, 1, 0), 0.8);
    // a soft shadow under the block: its lift reads even without real shadows
    shade.scale.setScalar(1 + lift * 0.25);
    shade.material.opacity = Math.max(0.25, 1 - lift * 0.45);
  }

  return {
    id: 'crane',
    root,
    model,
    hits,
    arrow,
    // what the front view frames: the block's whole 1.3 m path, the hook block and the cable above it; the boom's
    // tip and the truck's cab run off the top and the left (wide frames show more of the truck)
    fit: { min: V(CABLE_X - 1.35, -0.05, -0.5), max: V(CABLE_X + 1.3, 3.45, 0.6) },
    views: { front: V(0.26, 0.16, 1).normalize(), '3d': V(0.85, 0.42, 0.78).normalize() },
    shadow: { center: V(0.4, 0, 0), r: 6 },
    update,
    /** Where the cable's pull touches the block: the hook in the ring. */
    marker: () => ({ kind: 'contact', at: v.set(CABLE_X, lift + LOAD.h + RING_H * 0.62, 0).clone() }),
    /** Things the labels must not cover: the block, the hook block, the cable up to the pulley. */
    bodies: () => [
      { min: V(CABLE_X - LOAD.w / 2, lift, -LOAD.d / 2), max: V(CABLE_X + LOAD.w / 2, lift + LOAD.h + RING_H, LOAD.d / 2) },
      { min: V(CABLE_X - 0.2, lift + LOAD.h + RING_H, -0.15), max: V(CABLE_X + 0.2, lift + LOAD.h + RING_H + 0.7, 0.15) },
      { min: V(CABLE_X - 0.06, lift + LOAD.h + RING_H + 0.7, -0.03), max: V(CABLE_X + 0.06, TIP.y, 0.03) },
    ],
    /** Where the coach's hand points: the middle of the block's front face. */
    actor: (out, k = 0) => out.set(CABLE_X, lift + LOAD.h * [0.45, 0.8, 0.98][k], LOAD.d / 2),
    wiggle(k) {
      wobble = Math.sin(k * Math.PI * 4) * (1 - k);
      load.rotation.z = wobble * 0.03;
    },
  };
}
