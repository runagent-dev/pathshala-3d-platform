// The book's চিত্র ৩.১২: an apple held above the Earth, then let go. Metres, y up, the Earth's top at y = 0 and the apple
// above it. The picture is not to scale: the Earth is drawn as a ball a few metres across (so it is seen curving under
// the apple) and the apple much bigger than a real one; the figure says so on the view. The apple is round and red with
// a stem and a leaf; the hand is two fingers and a thumb round it (they open when it is let go).
import * as THREE from 'three';

export const EARTH_R = 5; // m: the drawn Earth (not to scale)
export const APPLE_R = 0.18; // m: the drawn apple's radius

const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });

/** An apple of radius r: a slightly squat round body with a dimple, a stem and one leaf; its centre at the origin. */
function createApple(r) {
  const root = new THREE.Group();
  root.name = 'Apple';
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI;
    const rr = Math.sin(a) * (1 + 0.06 * Math.sin(a * 2)) * r;
    const y = -Math.cos(a) * r * 0.92 - (i > 20 ? (i - 20) * 0.05 * r : 0) + (i < 3 ? (3 - i) * 0.04 * r : 0);
    pts.push(new THREE.Vector2(Math.max(0.0001, rr), y));
  }
  const skin = new THREE.MeshPhysicalMaterial({ name: 'Apple', color: '#c92a2a', roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.35 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), skin);
  body.name = 'AppleBody';
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.05, r * 0.07, r * 0.42, 6), mat('AppleStem', '#5a3d23', 0.9));
  stem.position.set(r * 0.03, r * 0.95, 0);
  stem.rotation.z = -0.25;
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(r * 0.28, r * 0.2, r * 0.6, 0);
  leafShape.quadraticCurveTo(r * 0.28, -r * 0.18, 0, 0);
  const leafMat = mat('AppleLeaf', '#2f9e44', 0.6);
  leafMat.side = THREE.DoubleSide;
  const leaf = new THREE.Mesh(new THREE.ShapeGeometry(leafShape, 6), leafMat);
  leaf.position.set(r * 0.08, r * 1.02, 0);
  leaf.rotation.set(0.3, 0.4, 0.35);
  root.add(body, stem, leaf);
  return { root, body };
}

/** The Earth's skin: ocean, a coast with land, a few clouds, painted where the apple falls (the top of the ball). */
function earthTexture(renderer) {
  const W = 2048;
  const H = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const sea = g.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#2a6db5');
  sea.addColorStop(0.5, '#3a86cc');
  sea.addColorStop(1, '#2a6db5');
  g.fillStyle = sea;
  g.fillRect(0, 0, W, H);
  // a seeded jitter, so the picture is the same every time
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const land = (cx, cy, rx, ry, fill, jitter = 0.18, n = 28) => {
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + rnd() * jitter;
      const x = cx + Math.cos(a) * rx * k;
      const y = cy + Math.sin(a) * ry * k;
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  };
  // the part under the apple is about 230 px wide: a continent on the right, an island and a bay on the left
  land(1130, 560, 130, 95, '#d9c58a', 0.12); // sand at the coast
  land(1135, 560, 118, 84, '#5f9e48', 0.14);
  land(1150, 545, 70, 48, '#7db35a', 0.16);
  land(955, 470, 20, 14, '#d9c58a', 0.1, 14);
  land(955, 470, 14, 9, '#5f9e48', 0.1, 14);
  land(900, 600, 30, 22, '#5f9e48', 0.2, 16);
  g.globalAlpha = 0.5;
  g.filter = 'blur(6px)';
  g.fillStyle = '#ffffff';
  for (const [x, y, rx, ry] of [
    [1010, 440, 60, 9],
    [1180, 640, 80, 10],
    [900, 520, 45, 8],
    [1070, 600, 55, 8],
    [1230, 470, 50, 8],
  ]) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0.1, 0, Math.PI * 2);
    g.fill();
  }
  g.filter = 'none';
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

/**
 * The Earth (a ball under y = 0), the apple, and the hand holding it. `setFall(fallen)` puts the apple that many metres
 * below where it was held (0 = in the hand); `setGrip(since)` opens the fingers and lifts the hand away (seconds since the apple was let go).
 */
export function createEarthScene({ renderer, fall }) {
  const root = new THREE.Group();
  root.name = 'AppleAndEarth';

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R, 128, 96),
    new THREE.MeshStandardMaterial({ name: 'Earth', map: earthTexture(renderer), roughness: 0.8, metalness: 0 }),
  );
  earth.name = 'Earth';
  earth.position.y = -EARTH_R;
  earth.rotation.z = Math.PI / 2; // the painted part is on top
  root.add(earth);

  const apple = createApple(APPLE_R);
  const bottom = new THREE.Box3().setFromObject(apple.body).min.y; // the lowest point of the body
  const restY = -bottom; // centre height when the apple lies on the Earth
  const startY = restY + fall;
  root.add(apple.root);
  apple.root.position.y = startY;

  // the hand: an arm from above the view, a palm over the apple and two short fingers that close on its sides
  const r = APPLE_R;
  const skin = mat('Skin', '#b98057', 0.7);
  const sleeve = mat('Sleeve', '#9db6d4', 0.85);
  const hand = new THREE.Group();
  hand.name = 'Hand';
  root.add(hand);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.26 * r, 0.3 * r, 4, 14), sleeve);
  arm.position.y = startY + 3.3 * r + 2;
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * r, 0.26 * r, 0.7 * r, 14), skin);
  wrist.position.y = startY + 2.95 * r;
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.55 * r, 16, 12), skin);
  palm.position.y = startY + 2.2 * r;
  palm.scale.set(1.35, 0.8, 1);
  hand.add(arm, wrist, palm);
  const fingers = [-1, 1].map((side) => {
    // a finger hangs from the palm and closes on the apple's side; it swings about its base
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.5 * r, startY + 2.05 * r, 0);
    const length = 1.7 * r;
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.2 * r, length - 0.4 * r, 4, 10), skin);
    mesh.position.y = -length / 2;
    pivot.add(mesh);
    hand.add(pivot);
    return { side, pivot };
  });
  // closed: the tips touch the apple's sides; open: the fingers swing out and the apple is free
  const closedAngle = 0.34;
  /** `since`: seconds since the apple was let go (0 or less: held). The fingers open at once, then the hand lifts away. */
  function setGrip(since) {
    const k = Math.min(1, Math.max(0, since / 0.2));
    for (const f of fingers) f.pivot.rotation.z = f.side * (closedAngle + k * 0.85);
    const up = Math.min(1, Math.max(0, (since - 0.15) / 0.7));
    hand.position.y = up * up * 2.6;
    hand.userData.open = k;
  }
  setGrip(0);

  /** The hand-and-apple's size, for the ring: a box round the apple where it hangs. */
  const hitSphere = new THREE.Mesh(new THREE.SphereGeometry(APPLE_R * 2.1, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hitSphere.userData.noExport = true;
  apple.root.add(hitSphere);

  function setFall(fallen) {
    apple.root.position.y = startY - fallen;
  }

  return {
    root,
    earth,
    apple: apple.root,
    appleBody: apple.body,
    hand,
    hit: hitSphere,
    restY,
    startY,
    setFall,
    setGrip,
    /** Where the apple is now (its centre). */
    appleAt: (out) => out.copy(apple.root.position),
  };
}
