// কোনো কিছু ছেড়ে দিলে মাধ্যাকর্ষণ বলের জন্য নিচে পড়া: a student holds a football (22 cm) out in both hands, its
// bottom about 1 m above the floor, and lets go: the hands move apart and nothing touches the ball, yet it starts
// to fall, faster and faster, then bounces a little and stops. Real size, metres. The weight arrow is drawn from
// the ball's middle (over the ball); while it falls, a dashed line beside it shows the empty space below.
import * as THREE from 'three';
import { createArrow } from './arrow.js';
import { createPerson } from './person.js';
import { FALL } from './motion.js';
import { V, blob, canvasTexture, castShadows, groundPatch, hitBox } from './parts.js';

const R = 0.11; // ball radius
const FACE = THREE.MathUtils.degToRad(62); // the student turns this far from the viewer, to the left
const AHEAD = 0.5; // the ball is held this far in front of the student

/** A white ball with black patches round the twelve corners of an icosahedron (a football, seen small). */
function footballTexture() {
  const p = (1 + Math.sqrt(5)) / 2;
  const dirs = [
    [0, 1, p],
    [0, -1, p],
    [0, 1, -p],
    [0, -1, -p],
    [1, p, 0],
    [-1, p, 0],
    [1, -p, 0],
    [-1, -p, 0],
    [p, 0, 1],
    [-p, 0, 1],
    [p, 0, -1],
    [-p, 0, -1],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());
  return canvasTexture(256, 128, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const d = new THREE.Vector3();
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const lon = (x / w) * Math.PI * 2;
        const lat = (y / h) * Math.PI;
        d.set(-Math.cos(lon) * Math.sin(lat), Math.cos(lat), Math.sin(lon) * Math.sin(lat));
        let best = 0;
        for (const c of dirs) best = Math.max(best, d.dot(c));
        const black = best > 0.935;
        const seam = !black && best > 0.92;
        const v = black ? 34 : seam ? 150 : 244;
        const i = (y * w + x) * 4;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = black ? 40 : v;
        img.data[i + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  });
}

export function createFallScene({ colors }) {
  const root = new THREE.Group();
  root.name = 'FallScene';
  const model = new THREE.Group();
  model.name = 'StudentAndBall';
  root.add(model);

  const person = createPerson({ shirt: '#f4f6f8' });
  person.root.rotation.y = -(Math.PI / 2 + FACE);
  model.add(person.root);
  const forward = V(-Math.sin(FACE), 0, Math.cos(FACE));
  const HELD = V(0, FALL.h + R, 0).addScaledVector(forward, AHEAD);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 20),
    new THREE.MeshStandardMaterial({ name: 'Football', map: footballTexture(), roughness: 0.55 }),
  );
  ball.name = 'Football';
  ball.rotation.set(0.4, 0.3, 0.2);
  model.add(ball);
  const shade = blob(R * 1.6, 0.4);
  shade.position.set(HELD.x, 0.003, HELD.z);
  root.add(shade);

  const floor = groundPatch(2.8, 2.2, {
    color: '#eceef0',
    draw: (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(140,150,160,0.22)';
      ctx.lineWidth = 2;
      for (let x = 0; x <= w; x += w / 5.6) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += h / 4.4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  });
  floor.position.set(-0.1, 0, 0.1);
  root.add(floor);
  castShadows(model);

  const hits = [hitBox(0.5, 0.5, 0.5, 0, 0, 0, ball), hitBox(0.6, 1.7, 0.6, 0, 0.85, 0, person.root)];
  const arrow = createArrow({ color: colors.force, radius: 0.011, head: 0.07, headRadius: 0.03, onTop: true });
  root.add(arrow.root);

  const v = new THREE.Vector3();
  const handR = new THREE.Vector3();
  const handL = new THREE.Vector3();
  let y = FALL.h;
  let bob = 0;

  function update(m, { arrowOn = false } = {}) {
    y = m.y;
    ball.position.set(HELD.x, y + R + bob * 0.012, HELD.z);
    // the hands hold the ball at its sides, then move apart
    const open = m.open ?? 0;
    const z = R + 0.035 + 0.13 * open;
    handR.set(AHEAD, FALL.h + R, z);
    handL.set(AHEAD, FALL.h + R, -z);
    person.pose({ lean: 0.06, hands: [handR, handL], walk: Math.PI / 2, stride: 0.07, spread: 0.11, lift: 0 });
    const k = Math.max(0, 1 - y / 1.4);
    shade.scale.setScalar(0.55 + 0.6 * k);
    shade.material.opacity = 0.35 + 0.65 * k;
    arrow.setOpacity(arrowOn ? 1 : 0);
    if (arrowOn) arrow.set(v.set(HELD.x, y + R, HELD.z), V(0, -1, 0), 0.3);
  }

  return {
    id: 'fall',
    root,
    model,
    hits,
    arrow,
    // room below the floor too: the weight arrow of the ball lying on the floor points into it
    fit: { min: V(-0.78, -0.15, -0.3), max: V(0.3, 1.72, 0.4) },
    views: { front: V(0.12, 0.14, 1).normalize(), '3d': V(0.75, 0.42, 0.8).normalize() },
    shadow: { center: V(-0.1, 0, 0.1), r: 1.5 },
    update,
    /** The empty space between the falling ball and the floor (the Earth): to the left of the ball. */
    marker: (m) => (m.gap != null ? { kind: 'gap', a: V(HELD.x - R - 0.06, y, HELD.z), b: V(HELD.x - R - 0.06, 0, HELD.z) } : null),
    bodies: () => [{ min: V(HELD.x - R, y, HELD.z - R), max: V(HELD.x + R, y + 2 * R, HELD.z + R) }],
    actor: (out, k = 0) => out.set(HELD.x, y + R * [1, 1.6, 0.5][k], HELD.z + R * [1, 0.7, 0.9][k]),
    wiggle(k) {
      bob = Math.sin(k * Math.PI * 4) * (1 - k);
    },
  };
}
