// The Earth stop: a globe (radius R, north up, longitude 0° towards the viewer, so 90° E with Bangladesh is on the
// right edge and 90° W on the left) with people standing on its edge, each pulled towards the Earth's centre
// (মাধ্যাকর্ষণ বল: a violet arrow from the person's middle, then a dashed line on to the centre). The people stand
// on the circle through both poles along 90° E / 90° W, the edge of the globe in the front view, so they are
// always seen side-on; a person's place on it is an angle θ from the North Pole (see ./physics.js). A dropped apple
// leaves faint copies of itself at equal moments of its fall (like a stroboscope photo), so the still picture shows
// four falls, all towards the centre.
import * as THREE from 'three';
import { createArrow, createDashes, createDot } from './draw.js';
import { earthTexture } from './maps.js';
import { appleMaterials, createPerson } from './people.js';
import { FALL_MOMENTS, PEOPLE, placeAt, rimPoint } from './physics.js';

export const R = 20; // cm: a desk globe
export const H = 8; // cm: the people, drawn very much bigger than real
const ARROW = { from: 0.5, length: 0.95 }; // in H: the arrow starts at the person's middle and reaches into the ground

const CLOTHES = {
  you: { top: '#74c0fc', legs: '#24345a', hair: '#17171a' }, // a school uniform (sky-blue shirt, navy trousers)
  north: { top: '#0c8599', legs: '#343a40', hood: true },
  south: { top: '#e67700', legs: '#343a40', hood: true },
  far: { top: '#5c940d', legs: '#495057', hair: '#3b2a1a' },
};

export function createGlobe({ renderer, map: sharedMap }) {
  const root = new THREE.Group();
  root.name = 'EarthAndPeople';
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const map = sharedMap ?? earthTexture(aniso);
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(R, 96, 64),
    new THREE.MeshStandardMaterial({ name: 'Earth', map, roughness: 0.78, metalness: 0 }),
  );
  globe.name = 'Earth';
  globe.rotation.y = -Math.PI / 2; // longitude 0° faces +z (the viewer), 90° E faces +x (right)
  root.add(globe);

  const appleM = appleMaterials();
  const ids = /** @type {const} */ (['you', 'north', 'south', 'far']);
  const people = {};
  const tmp = new THREE.Vector3();
  for (const id of ids) {
    const person = createPerson({ H, clothes: CLOTHES[id], apple: appleM, name: id === 'you' ? 'You' : `Person_${id}` });
    const arrow = createArrow({ radius: H * 0.042, head: H * 0.22, headRadius: H * 0.1, top: true, name: `Pull_${id}` });
    const line = createDashes({ radius: 0.15, dash: 0.95, gap: 0.65, color: '#1d2733', opacity: 0.75, name: `ToCentre_${id}` });
    root.add(person.root, arrow.root, line.mesh);
    people[id] = { id, person, arrow, line, theta: PEOPLE[id], fall: null };
  }
  const centre = createDot(0.55, '#1d2733');
  root.add(centre);
  // the faint copies of the falling apples (a drawing, not exported)
  const ghostMat = new THREE.MeshStandardMaterial({
    name: 'AppleGhost',
    color: '#e03131',
    roughness: 0.6,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  for (const id of ids) {
    const r = people[id].person.appleR;
    people[id].ghosts = FALL_MOMENTS.map(() => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r * 0.92, 18, 12), ghostMat);
      m.visible = false;
      m.userData.noExport = true;
      m.renderOrder = 5;
      root.add(m);
      return m;
    });
  }

  const v = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const zero = new THREE.Vector3();
  /** Stand person `id` at θ: on the edge, upright (head away from the centre), in a boat at sea; its arrow and line follow. */
  function place(id, theta) {
    const p = people[id];
    p.theta = theta;
    const q = rimPoint(theta, R);
    p.person.root.position.set(q.x, q.y, 0);
    p.person.root.rotation.set(0, 0, (-theta * Math.PI) / 180);
    p.person.setBoat(placeAt(theta).sea);
    // the pull: from the person's middle, straight towards the Earth's centre
    dir.set(-q.x, -q.y, 0).normalize();
    const lift = p.person.lift;
    v.set(q.x, q.y, 0).addScaledVector(dir, -(H * ARROW.from + lift));
    p.arrow.set(v, dir, H * ARROW.length);
    tmp.copy(v).addScaledVector(dir, H * ARROW.length);
    p.line.set(tmp, zero);
  }
  for (const id of ids) place(id, PEOPLE[id]);

  // ── the apples fall ───────────────────────────────────────────────────────
  const wHand = new THREE.Vector3();
  const wNow = new THREE.Vector3();
  /** Where person `id`'s apple starts (in the hand) and lands (on the ground under it), in the globe's frame. */
  function fallPath(id) {
    const p = people[id];
    const { person } = p;
    person.root.updateMatrixWorld(true);
    person.body.localToWorld(wHand.copy(person.appleRest));
    root.worldToLocal(wHand);
    const r0 = wHand.length();
    const ground = R + person.lift + person.appleR * 0.86;
    return { start: wHand.clone(), dir: wHand.clone().normalize().negate(), drop: r0 - ground };
  }
  /**
   * Put the apple of `id` k of the way down its fall (0 = in the hand, 1 = on the ground), straight towards the
   * centre; the copies it has passed stay where it was at those moments.
   */
  function setFall(id, k) {
    const p = people[id];
    const { person } = p;
    if (k <= 0) {
      person.apple.position.copy(person.appleRest);
      for (const gh of p.ghosts) gh.visible = false;
      return;
    }
    const f = fallPath(id);
    wNow.copy(f.start).addScaledVector(f.dir, f.drop * Math.min(1, k));
    root.localToWorld(wNow);
    person.body.worldToLocal(wNow);
    person.apple.position.copy(wNow);
    p.ghosts.forEach((gh, i) => {
      gh.visible = k >= FALL_MOMENTS[i];
      gh.position.copy(f.start).addScaledVector(f.dir, f.drop * FALL_MOMENTS[i]);
    });
  }

  return {
    root,
    globe,
    people,
    ids,
    centre,
    place,
    setFall,
    /** Show or hide the pulls (arrows and the lines to the centre) of these people. */
    showPulls(on, which = ids) {
      for (const id of ids) {
        const show = on && which.includes(id);
        people[id].arrow.root.visible = show;
        people[id].line.mesh.visible = show;
      }
      centre.visible = on;
    },
    /** World points of a person: the middle (where its arrow starts), the top of the head, the feet. */
    points: {
      middle: (id, out = new THREE.Vector3()) => people[id].arrow.root.getWorldPosition(out),
      head: (id, out = new THREE.Vector3()) => people[id].person.root.localToWorld(out.set(0, H * 1.02 + people[id].person.lift, 0)),
      feet: (id, out = new THREE.Vector3()) => people[id].person.root.localToWorld(out.set(0, 0, 0)),
      tip: (id, out = new THREE.Vector3()) => {
        const p = people[id];
        const q = rimPoint(p.theta, R);
        const r = Math.hypot(q.x, q.y) + H * ARROW.from + p.person.lift - H * ARROW.length;
        const k = r / R;
        return root.localToWorld(out.set(q.x * k, q.y * k, 0));
      },
    },
  };
}
