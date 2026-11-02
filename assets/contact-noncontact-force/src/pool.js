// The test's new cases (not on the page), each a small scene that keeps moving: update(t) draws it at time t (s),
// looping. Real size, metres. Each has the same marks as the book's examples, shown with the answer: the contact
// patch (marks: true in update) or gap() for the measured gap.
//  - rope: a student pulls a cart with a rope (the student never touches the cart; the rope does).
import * as THREE from 'three';
import { createArrow } from './arrow.js';
import { createPerson } from './person.js';

import { V, box, canvasTexture, castShadows, glowSpot, groundPatch, mat, placeTube, tube, wheel, woodMaterial } from './parts.js';
import { yardSetting } from './setting.js';

const frac = (x) => x - Math.floor(x);
// ── a student pulls a cart with a rope ───────────────────────────────────────────────────────────────────────
export function createRopeScene({ color, setting = true }) {
  const root = new THREE.Group();
  root.name = 'RopeScene';
  const model = new THREE.Group();
  model.name = 'StudentPullingCart';
  root.add(model);
  const SPEED = 0.8; // m/s
  const CART_X = -0.72;
  const PERSON_X = 0.62;

  const cart = new THREE.Group();
  cart.position.x = CART_X;
  model.add(cart);
  box(0.66, 0.3, 0.44, woodMaterial(), 0, 0.36, 0, cart);
  box(0.7, 0.05, 0.48, mat('#6b4a2b', { roughness: 0.7 }), 0, 0.22, 0, cart);
  const wheels = [];
  for (const x of [-0.22, 0.22])
    for (const z of [0.27, -0.27]) {
      const w = wheel(0.11, 0.05, { rim: '#9aa3ad' });
      w.position.set(x, 0.11, z);
      cart.add(w);
      wheels.push(w);
    }
  const steel = mat('#9aa3ad', { roughness: 0.35, metalness: 0.7 });
  const RING = V(0.37, 0.3, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 18), steel);
  ring.position.copy(RING);
  ring.rotation.y = Math.PI / 2;
  cart.add(ring);
  // a sack in the cart
  const sack = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat('#d8c39a', { roughness: 0.95 }));
  sack.scale.set(1.2, 0.7, 0.9);
  sack.position.set(0, 0.55, 0);
  cart.add(sack);

  const person = createPerson({ shirt: '#f4f6f8' });
  person.root.position.x = PERSON_X;
  model.add(person.root);
  const ropeMat = mat('#b08a4a', { roughness: 0.85, name: 'Rope' });
  const rope = tube(V(0, 0, 0), V(1, 0, 0), 0.009, ropeMat, model);

  // the school yard's brick path and boundary wall, sliding back past them (they stay in the middle of the picture);
  // on a transparent page, a strip of flagstones that fades out
  const yard = setting ? yardSetting() : null;
  /** @type {{ tex: THREE.Texture, per: number }[]} */
  const slide = [];
  if (yard) {
    root.add(yard.root);
    yard.slide.forEach((t, i) => slide.push({ tex: t, per: yard.per[i] }));
  } else {
    // a path of flagstones that slides back under them (they stay in the middle of the picture)
    const tiles = canvasTexture(
      256,
      64,
      (ctx, w, h) => {
        ctx.fillStyle = '#e6e2da';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(120,110,95,0.35)';
        ctx.lineWidth = 3;
        for (let x = 0; x <= w; x += w / 4) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      },
      { repeat: [5, 1] },
    );
    const ground = groundPatch(5, 1.6, { color: '#e6e2da' });
    ground.material.map = tiles;
    ground.material.needsUpdate = true;
    root.add(ground);
    slide.push({ tex: tiles, per: 1 });
  }
  castShadows(model);

  const arrow = createArrow({ color, radius: 0.014, head: 0.085, headRadius: 0.036 });
  root.add(arrow.root);
  // the contact patch: where the rope is tied to the cart's ring
  const spot = glowSpot(color, 0.16);
  root.add(spot);
  const hand = new THREE.Vector3();
  const ringW = new THREE.Vector3();
  const dir = new THREE.Vector3();

  function update(t, { arrowOn = false, marks = false } = {}) {
    const d = t * SPEED;
    for (const { tex, per } of slide) tex.offset.x = frac(d / per); // one repeat of the texture is `per` m long
    for (const w of wheels) w.rotation.z = -d / 0.11;
    person.pose({ lean: 0.2, hands: [V(-0.24, 0.88, 0.22), null], walk: (d / 0.3) * Math.PI, stride: 0.24, spread: 0.1 });
    hand.copy(person.handAt(0)).add(person.root.position);
    ringW.copy(RING).add(cart.position);
    placeTube(rope, ringW, hand, 0.009);
    arrow.setOpacity(arrowOn ? 1 : 0);
    if (arrowOn) arrow.set(ringW, dir.subVectors(hand, ringW).normalize(), 0.36);
    spot.position.copy(ringW);
    spot.visible = marks;
  }

  return {
    id: 'rope',
    root,
    background: yard?.background ?? null,
    model,
    hits: [],
    arrow,
    fit: { min: V(-1.2, -0.02, -0.4), max: V(1.0, 1.7, 0.4) },
    views: { front: V(0.15, 0.18, 1).normalize(), '3d': V(0.75, 0.5, 0.8).normalize() },
    shadow: { center: V(0, 0, 0), r: 2 },
    update,
    /** Where the pull reaches the cart: the rope in its ring. */
    contact: () => ringW,
    gap: () => null,
    bodies: () => [
      { min: V(CART_X - 0.35, 0, -0.25), max: V(CART_X + 0.35, 0.7, 0.25) },
      { min: V(PERSON_X - 0.3, 0, -0.25), max: V(PERSON_X + 0.3, 1.62, 0.25) },
    ],
  };
}
