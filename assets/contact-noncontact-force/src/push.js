// কোনো কিছুকে ধাক্কা দেওয়া: a student pushes a carton on a flat trolley. The hands touch the carton's back only
// while pushing; once they let go the trolley rolls on by itself, slowing a little, and the push is over. Real size,
// metres, motion along +x. update(m) places the trolley, the student (leaning, hands on the carton, walking) and the
// force arrow on the carton's side at the height of the hands.
import * as THREE from 'three';
import { createArrow } from './arrow.js';
import { createPerson } from './person.js';
import { V, box, canvasTexture, castShadows, groundPatch, hitBox, mat, wheel } from './parts.js';

const CARTON = { w: 0.66, h: 0.78, d: 0.58 };
const DECK_Y = 0.17; // top of the trolley's deck
const HAND_Y = 0.82;
const PERSON_BACK = 0.52; // the student's hips are this far behind the carton's back face
const LEAN = 0.42; // radians, pushing

export function createPushScene({ colors }) {
  const root = new THREE.Group();
  root.name = 'PushScene';
  const model = new THREE.Group();
  model.name = 'PushTrolley';
  root.add(model);

  // the trolley: a deck on four castors, a carton on it
  const trolley = new THREE.Group();
  trolley.name = 'Trolley';
  model.add(trolley);
  box(0.95, 0.05, 0.62, mat('#3b6fb6', { roughness: 0.5, name: 'TrolleyDeck' }), 0, DECK_Y - 0.025, 0, trolley);
  const wheels = [];
  for (const x of [-0.36, 0.36])
    for (const z of [0.24, -0.24]) {
      const w = wheel(0.055, 0.04);
      w.position.set(x, 0.055, z);
      trolley.add(w);
      wheels.push(w);
      box(0.05, 0.06, 0.05, mat('#7d858f', { roughness: 0.4, metalness: 0.6 }), x, 0.12, z, trolley);
    }
  const cardboard = new THREE.MeshStandardMaterial({
    name: 'Cardboard',
    roughness: 0.9,
    map: canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#c99a62';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(120,80,40,${0.04 + Math.random() * 0.05})`;
        ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 2);
      }
    }),
  });
  const carton = box(CARTON.w, CARTON.h, CARTON.d, cardboard, 0, DECK_Y + CARTON.h / 2, 0, trolley);
  carton.name = 'Carton';
  const tape = mat('#d9b98a', { roughness: 0.6 });
  box(CARTON.w + 0.004, 0.06, CARTON.d + 0.004, tape, 0, DECK_Y + CARTON.h - 0.03, 0, trolley);
  box(0.1, CARTON.h * 0.5, CARTON.d + 0.004, tape, 0, DECK_Y + CARTON.h * 0.75, 0, trolley);

  const person = createPerson();
  model.add(person.root);

  const floor = groundPatch(6.5, 3.2, {
    color: '#eceef0',
    draw: (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(140,150,160,0.22)';
      ctx.lineWidth = 2;
      for (let x = 0; x <= w; x += w / 13) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += h / 6.4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  });
  floor.position.set(0.25, 0, 0);
  root.add(floor);
  castShadows(model);

  const hits = [hitBox(1.1, 1.2, 0.9, 0, 0.55, 0, trolley), hitBox(0.7, 1.7, 0.6, 0, 0.85, 0, person.root)];
  const arrow = createArrow({ color: colors.force, radius: 0.016, head: 0.1, headRadius: 0.042 });
  root.add(arrow.root);

  const X0 = -0.1; // the trolley's middle at the start
  const backFace = () => trolley.position.x - CARTON.w / 2;
  const handR = new THREE.Vector3();
  const handL = new THREE.Vector3();
  const v = new THREE.Vector3();
  let wobble = 0;

  function update(m, { arrowOn = false } = {}) {
    trolley.position.set(X0 + m.pos, 0, 0);
    for (const w of wheels) w.rotation.z = -m.pos / 0.055;
    // the student: behind the carton, leaning into it as the hands reach it; after letting go, standing back
    const px = X0 - CARTON.w / 2 - PERSON_BACK + m.person;
    person.root.position.set(px + wobble * 0.01, 0, 0);
    const reach = m.reach ?? 0;
    const lean = 0.08 + (LEAN - 0.08) * reach;
    const hx = backFace() - px - 0.035; // the palms on the carton's back (or where they were, as it rolls away)
    const handX = m.touching ? hx : Math.min(hx, 0.38 + 0.12 * reach);
    handR.set(handX, HAND_Y, 0.17);
    handL.set(handX, HAND_Y, -0.17);
    const hanging = reach < 0.05;
    person.pose({
      lean,
      hands: hanging ? [null, null] : [handR, handL],
      walk: (m.walking / 0.3) * Math.PI,
      stride: m.walking > 0 ? 0.24 : 0.22,
      spread: 0.1,
    });
    // a pushing stance: the back foot stays back when standing
    arrow.setOpacity(arrowOn ? 1 : 0);
    if (arrowOn) arrow.set(v.set(backFace() + 0.02, HAND_Y, CARTON.d / 2 + 0.03), V(1, 0, 0), 0.42);
  }

  return {
    id: 'push',
    root,
    model,
    hits,
    arrow,
    fit: { min: V(-1.4, -0.02, -0.4), max: V(1.82, 1.7, 0.4) },
    views: { front: V(0.18, 0.2, 1).normalize(), '3d': V(0.75, 0.5, 0.8).normalize() },
    shadow: { center: V(0.2, 0, 0), r: 2.6 },
    update,
    /** Where the push touches the carton: the near hand on its back face. */
    marker: () => ({ kind: 'contact', at: v.set(backFace(), HAND_Y, 0.17).clone() }),
    bodies: () => [
      { min: V(backFace(), 0, -CARTON.d / 2), max: V(backFace() + CARTON.w, DECK_Y + CARTON.h, CARTON.d / 2) },
      { min: V(person.root.position.x - 0.3, 0, -0.25), max: V(person.root.position.x + 0.35, 1.62, 0.25) },
    ],
    actor: (out, k = 0) => out.set(backFace() + CARTON.w * 0.4, DECK_Y + CARTON.h * [0.5, 0.8, 0.25][k], CARTON.d / 2),
    wiggle(k) {
      wobble = Math.sin(k * Math.PI * 4) * (1 - k);
    },
  };
}
