// The whirling stone, in metres: a student whirls a stone on a jute rope over the head, a pond in the field, the
// compass written on the grass. The stone's বেগ is an arrow along the circle; faint copies of it, left behind
// every quarter turn, show that it keeps its length (the দ্রুতি) but not its direction.
// Map coordinates (e = east, n = north) become three.js x = e, z = −n, y = height.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { createArrow } from './arrow.js';
import { HEIGHT, POND, POND_CENTRE, STONE, flightAt, flightEnd, pondRadius, stoneAt } from './motion.js';

export const V_LENGTH = 0.9; // m of arrow for the stone's 4 m/s
export const COMPASS = { e: 1.9, n: -1.06 }; // where the compass is drawn on the grass (south-east of the student)
const GHOSTS = [0, 90, 180, 270]; // a faint copy of the stone and its বেগ is left at these angles
const UP = new THREE.Vector3(0, 1, 0);
const at = (e, n, h = 0) => new THREE.Vector3(e, h, -n);

/** A soft round shadow drawn on the ground (used when the real shadows are off, and for the flying stone). */
function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(20,30,20,0.55)');
  g.addColorStop(0.55, 'rgba(20,30,20,0.25)');
  g.addColorStop(1, 'rgba(20,30,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function limb(a, b, r, material) {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 12), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
  return m;
}

/** A school student (light blue shirt, navy trousers), right hand raised over the head holding the rope. */
function createPerson() {
  const shirt = new THREE.MeshStandardMaterial({ name: 'Shirt', color: 0x9cc3e6, roughness: 0.8 });
  const trousers = new THREE.MeshStandardMaterial({ name: 'Trousers', color: 0x2c3a56, roughness: 0.75 });
  const skin = new THREE.MeshStandardMaterial({ name: 'Skin', color: 0xb27650, roughness: 0.6 });
  const hair = new THREE.MeshStandardMaterial({ name: 'Hair', color: 0x1d1a17, roughness: 0.55 });
  const shoes = new THREE.MeshStandardMaterial({ name: 'Shoes', color: 0x222428, roughness: 0.5 });
  const g = new THREE.Group();
  g.name = 'Student';
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  for (const s of [-1, 1]) {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.25), shoes);
    shoe.position.set(0.09 * s, 0.035, 0.04);
    g.add(shoe, limb(v(0.09 * s, 0.12, 0), v(0.095 * s, 0.8, 0), 0.063, trousers));
  }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.165, 0.36, 6, 16), shirt);
  torso.position.y = 1.08;
  torso.scale.z = 0.62;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 12), skin);
  neck.position.y = 1.43;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 16), skin);
  head.position.y = 1.56;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.112, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), hair);
  cap.position.set(0, 1.575, -0.012);
  cap.rotation.x = -0.25;
  g.add(torso, neck, head, cap);
  // left arm down by the side
  g.add(limb(v(-0.2, 1.32, 0), v(-0.25, 1.05, 0.02), 0.05, shirt), limb(v(-0.25, 1.05, 0.02), v(-0.26, 0.8, 0.06), 0.043, skin));
  const lh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), skin);
  lh.position.set(-0.26, 0.76, 0.07);
  // right arm raised: the hand is right above the head, where the rope turns round
  g.add(lh, limb(v(0.2, 1.32, 0), v(0.25, 1.62, 0), 0.05, shirt), limb(v(0.25, 1.62, 0), v(0.03, STONE.hand - 0.04, 0), 0.043, skin));
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 12), skin);
  hand.position.set(0, STONE.hand, 0);
  g.add(hand);
  return g;
}

/** A stone: a lumpy, flat-shaded ball (the lumps are the same every time). */
function createStone(material) {
  const geo = new THREE.IcosahedronGeometry(STONE.size, 2);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + 0.13 * Math.sin(v.x * 61 + 1.3) * Math.cos(v.y * 47) + 0.08 * Math.sin(v.z * 83 + 0.4);
    v.multiplyScalar(k);
    v.y *= 0.82;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.name = 'Stone';
  return m;
}

function pondShape(scale) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= 96; i++) {
    const deg = (i / 96) * 360;
    const r = pondRadius(deg) * scale;
    const x = r * Math.cos((deg * Math.PI) / 180);
    const y = r * Math.sin((deg * Math.PI) / 180);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

/**
 * @param {{ t: (key: string) => string, colors: { velocity: string, ghost: string, choice: string, path: string, label: string } }} options
 */
export function createSling({ t, colors }) {
  const root = new THREE.Group();
  root.name = 'WhirlingStone';

  const person = createPerson();
  root.add(person);

  // the circle the stone goes round (in the air, at the stone's height), with arrowheads showing which way
  const pathMat = new THREE.MeshBasicMaterial({ color: colors.path, toneMapped: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(STONE.r, 0.011, 6, 160), pathMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = HEIGHT;
  ring.name = 'Path';
  ring.userData.noExport = true;
  root.add(ring);
  const chevrons = [];
  for (const deg of [135, 315]) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 3), pathMat);
    const s = stoneAt(deg);
    c.position.copy(at(s.e, s.n, HEIGHT));
    c.quaternion.setFromUnitVectors(UP, at(s.ve, s.vn).normalize());
    c.userData.noExport = true;
    chevrons.push(c);
    root.add(c);
  }

  const stoneMat = new THREE.MeshStandardMaterial({ name: 'StoneMaterial', color: 0x8b8f93, roughness: 0.88, flatShading: true });
  const stone = createStone(stoneMat);
  root.add(stone);

  const ropeMat = new THREE.MeshStandardMaterial({ name: 'Jute', color: 0xb08a55, roughness: 0.9 });
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 1, 6).translate(0, 0.5, 0), ropeMat);
  rope.name = 'Rope';
  root.add(rope);

  const velocity = createArrow({ color: colors.velocity, name: 'Velocity' });
  root.add(velocity.root);

  // faint copies left behind every quarter turn
  const ghostStoneMat = new THREE.MeshStandardMaterial({ color: 0x8b8f93, roughness: 0.9, transparent: true, opacity: 0.4, depthWrite: false });
  const ghosts = GHOSTS.map((deg) => {
    const arrow = createArrow({ color: colors.ghost, opacity: 0.5, name: 'Trace' });
    const s = stoneAt(deg);
    arrow.set(at(s.e, s.n, HEIGHT), at(s.ve, s.vn), V_LENGTH);
    const ball = new THREE.Mesh(stone.geometry, ghostStoneMat.clone());
    ball.position.copy(at(s.e, s.n, HEIGHT));
    const g = new THREE.Group();
    g.add(arrow.root, ball);
    g.userData.noExport = true;
    g.visible = false;
    root.add(g);
    return { deg, arrow, ball, group: g };
  });

  // a second stone for the test ("the stone at two moments")
  const twin = new THREE.Group();
  const twinBall = new THREE.Mesh(stone.geometry, stoneMat);
  const twinArrow = createArrow({ color: colors.velocity, name: 'TwinVelocity' });
  twin.add(twinBall, twinArrow.root);
  twin.visible = false;
  twin.userData.noExport = true;
  root.add(twin);

  // four arrows to choose from (the test)
  const choiceArrows = [0, 1, 2, 3].map(() => {
    const a = createArrow({ color: colors.choice, radius: 0.024, head: 0.15, headRadius: 0.07, name: 'Choice' });
    a.root.visible = false;
    a.root.userData.noExport = true;
    root.add(a.root);
    return a;
  });

  // after letting go: the বেগ it had at that moment stays drawn where it was let go, and dots mark its way
  const kept = createArrow({ color: colors.velocity, name: 'VelocityAtRelease' });
  kept.root.visible = false;
  kept.root.userData.noExport = true;
  root.add(kept.root);
  const DOTS = 48;
  const dots = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.026, 8, 6),
    new THREE.MeshBasicMaterial({ color: colors.ghost, toneMapped: false }),
    DOTS,
  );
  dots.count = 0;
  dots.userData.noExport = true;
  dots.frustumCulled = false;
  root.add(dots);
  const dotTimes = new Float32Array(DOTS);
  let dotsFor = null;
  const dotMatrix = new THREE.Matrix4();
  /** Dots every ~12 cm along the way the stone goes (in the air, then sliding), each with the time it gets there. */
  function layDots(deg, thr) {
    if (dotsFor === thr) return;
    dotsFor = thr;
    const end = flightEnd(thr);
    let n = 0;
    let last = null;
    for (let k = 0; k <= 400 && n < DOTS; k++) {
      const tau = (k / 400) * end;
      const f = flightAt(deg, tau, thr);
      if (f.phase === 'sink' || f.phase === 'gone') break;
      const p = at(f.e, f.n, Math.max(0.03, f.h));
      if (last && p.distanceTo(last) < 0.13) continue;
      last = p;
      dotMatrix.makeTranslation(p.x, p.y, p.z);
      dots.setMatrixAt(n, dotMatrix);
      dotTimes[n++] = tau;
    }
    dots.userData.total = n;
    dots.instanceMatrix.needsUpdate = true;
  }

  // shadows on the grass (when the real soft shadows are off), and under the flying stone
  const blob = blobTexture();
  const blobMat = () => new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, toneMapped: false });
  const stoneShadow = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), blobMat());
  stoneShadow.rotation.x = -Math.PI / 2;
  stoneShadow.userData.noExport = true;
  const personShadow = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), blobMat());
  personShadow.rotation.x = -Math.PI / 2;
  personShadow.position.y = 0.004;
  personShadow.userData.noExport = true;
  root.add(stoneShadow, personShadow);

  // the pond: muddy bank, water, and rings when a stone falls in
  const pond = new THREE.Group();
  pond.name = 'Pond';
  pond.position.copy(at(POND_CENTRE.e, POND_CENTRE.n));
  const bank = new THREE.Mesh(
    new THREE.ShapeGeometry(pondShape(1.13), 2),
    new THREE.MeshStandardMaterial({ name: 'Bank', color: 0xcbb98c, roughness: 0.95 }),
  );
  const water = new THREE.Mesh(
    new THREE.ShapeGeometry(pondShape(1), 2),
    new THREE.MeshStandardMaterial({ name: 'Water', color: 0x6fb2cc, roughness: 0.12, metalness: 0.05 }),
  );
  for (const [m, y] of [
    [bank, 0.004],
    [water, 0.008],
  ]) {
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    pond.add(m);
  }
  const ripples = [0, 1, 2].map(() => {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.92, 1, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    );
    r.rotation.x = -Math.PI / 2;
    r.position.y = 0.012;
    r.visible = false;
    r.userData.noExport = true;
    root.add(r);
    return r;
  });
  root.add(pond);

  // a compass on the grass, beside the circle (the panel names the direction of the বেগ with these words)
  const compass = new THREE.Group();
  compass.name = 'Compass';
  compass.position.copy(at(COMPASS.e, COMPASS.n, 0.008));
  const ink = new THREE.MeshBasicMaterial({ color: colors.label, toneMapped: false });
  for (const [deg, len] of [
    [90, 0.24],
    [0, 0.19],
    [180, 0.19],
    [270, 0.19],
  ]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(len, 0.004, deg === 90 ? 0.03 : 0.018).translate(len / 2, 0, 0), ink);
    arm.rotation.y = (deg * Math.PI) / 180;
    compass.add(arm);
  }
  const north = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.12, 3), ink);
  north.rotation.x = -Math.PI / 2;
  north.position.set(0, 0, -0.29);
  compass.add(north);
  for (const [key, x, z] of [
    ['dir_N', 0, -0.5],
    ['dir_S', 0, 0.39],
    ['dir_E', 0.5, 0],
    ['dir_W', -0.6, 0],
  ]) {
    const m = textMesh(t(key), 0.2, { color: colors.label, weight: 600 });
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.002, z);
    compass.add(m);
  }
  compass.userData.noExport = true;
  root.add(compass);

  // big invisible targets: a finger on the hand (or on the stone) lets go of the rope
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const handHit = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 8), hitMat);
  handHit.position.set(0, STONE.hand - 0.25, 0);
  handHit.userData = { part: 'hand', noExport: true };
  const stoneHit = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 8), hitMat);
  stoneHit.userData = { part: 'stone', noExport: true };
  root.add(handHit, stoneHit);

  const hand = at(0, 0, STONE.hand);
  const tmp = new THREE.Vector3();
  const dir = new THREE.Vector3();

  function placeRope(to) {
    tmp.copy(to).sub(hand);
    rope.position.copy(hand);
    rope.quaternion.setFromUnitVectors(UP, dir.copy(tmp).normalize());
    rope.scale.set(1, tmp.length(), 1);
  }
  function placeShadow(e, n, h, visible) {
    stoneShadow.visible = visible;
    stoneShadow.position.copy(at(e, n, 0.006));
    const k = 1 + h * 0.5;
    stoneShadow.scale.setScalar(k);
    stoneShadow.material.opacity = Math.max(0.15, 1 - h * 0.4);
  }

  return {
    root,
    stone,
    rope,
    pond,
    velocity,
    ring,
    chevrons,
    choiceArrows,
    twin: { group: twin, ball: twinBall, arrow: twinArrow },
    hits: [handHit, stoneHit],
    /** The blob shadows are for when the real soft shadows are off. */
    useBlobs(on) {
      personShadow.visible = on;
      stoneShadow.userData.blob = on;
    },
    /**
     * The stone going round at angle θ (deg); `turned` = degrees turned since it started (for the faint copies);
     * arrow: show its বেগ.
     */
    setWhirl(deg, { turned = 0, arrow = true, traces = true } = {}) {
      const s = stoneAt(deg);
      const p = at(s.e, s.n, HEIGHT);
      stone.position.copy(p);
      stone.rotation.set(0, (deg * Math.PI) / 180, 0);
      stone.visible = true;
      stoneHit.position.copy(p);
      placeRope(p);
      rope.visible = true;
      velocity.set(p, at(s.ve, s.vn), V_LENGTH);
      velocity.root.visible = arrow;
      kept.root.visible = false;
      dots.count = 0;
      placeShadow(s.e, s.n, HEIGHT, stoneShadow.userData.blob !== false);
      for (const g of ghosts) {
        // degrees since the stone last passed this copy's angle (none before it first gets there)
        const since = turned - g.deg - Math.floor((turned - g.deg) / 360) * 360;
        const passed = traces && turned >= g.deg + 2 && since > 2;
        g.group.visible = passed;
        if (!passed) continue;
        const a = Math.max(0, 1 - since / 360);
        g.arrow.setOpacity(0.55 * a);
        g.ball.material.opacity = 0.42 * a;
        g.group.visible = a > 0.02;
      }
    },
    /** Let go at angle θ, τ real seconds ago: the stone flies (the rope with it, trailing behind). */
    setFlight(deg, tau, thr) {
      const f = flightAt(deg, tau, thr);
      const p = at(f.e, f.n, f.h);
      stone.position.copy(p);
      stone.visible = f.phase !== 'gone';
      stone.rotation.set(tau * 9, (deg * Math.PI) / 180, tau * 5);
      stoneHit.position.copy(p);
      // the rope goes with the stone, trailing behind it
      tmp.set(-thr.dir.e, 0, thr.dir.n).multiplyScalar(0.95).add(p);
      tmp.y = Math.max(0.012, tmp.y - (f.phase === 'air' ? 0.08 : 0));
      rope.position.copy(p);
      rope.quaternion.setFromUnitVectors(UP, dir.copy(tmp).sub(p).normalize());
      rope.scale.set(1, tmp.distanceTo(p), 1);
      rope.visible = f.phase !== 'gone' && f.phase !== 'sink';
      velocity.root.visible = false;
      const s0 = stoneAt(deg);
      kept.set(at(s0.e, s0.n, HEIGHT), at(s0.ve, s0.vn), V_LENGTH);
      kept.root.visible = true;
      layDots(deg, thr);
      let n = 0;
      while (n < dots.userData.total && dotTimes[n] <= tau) n++;
      dots.count = n;
      for (const g of ghosts) g.group.visible = false;
      placeShadow(
        f.e,
        f.n,
        Math.max(0, f.h),
        stoneShadow.userData.blob !== false && (f.phase === 'air' || f.phase === 'slide' || f.phase === 'rest'),
      );
      return f;
    },
    /** Rings spreading on the water, `s` real seconds after the stone fell in (hidden when s < 0 or late). */
    setRipples(s, e, n) {
      ripples.forEach((r, i) => {
        const k = s - i * 0.22;
        r.visible = k > 0 && k < 1.6;
        if (!r.visible) return;
        r.position.copy(at(e, n, 0.012));
        r.scale.setScalar(0.06 + k * 0.32);
        r.material.opacity = 0.85 * (1 - k / 1.6);
      });
    },
    points: {
      hand: () => hand.clone(),
      stone: () => stone.position.clone(),
      /** Where the বেগ label goes: beyond the arrow's tip; after letting go, beside it (the way it went stays clear). */
      arrowTip: () => {
        const a = kept.root.visible ? kept.root : velocity.root;
        const d = new THREE.Vector3(0, 1, 0).applyQuaternion(a.quaternion);
        if (!kept.root.visible) return a.position.clone().addScaledVector(d, V_LENGTH + 0.22);
        const out = a.position.clone().setY(0).normalize(); // away from the student
        return a.position
          .clone()
          .addScaledVector(d, V_LENGTH * 0.5)
          .addScaledVector(out, 0.55);
      },
      pond: () => at(POND_CENTRE.e, POND_CENTRE.n + POND.radius * 0.15, 0),
    },
  };
}
