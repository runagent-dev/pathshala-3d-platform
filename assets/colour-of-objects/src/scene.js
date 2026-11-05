// The setting: a fixed dark slate wall, a very dark table, a grey vase, and one lamp at the top left with a filter that swings
// in front of its lens. The wall never changes: the lamp's beam is a narrow cone on the rose and the stand, and every light that
// falls on them is the lamp's colour, so nothing else tints the rose and the coloured light never floods the room. Centimetres.
import * as THREE from 'three';
import { REFLECTANCE } from './reading.js';

/** Where everything is, in one place: the camera's frame, the rays and the model all read this. */
export const LAYOUT = {
  bloomAt: new THREE.Vector3(3.4, 4.8, 0.2), // the base of the bloom
  bloomTilt: new THREE.Vector3(0.08, 1, 0.82), // its axis: tipped toward the viewer, so the heart shows
  bloomCentre: new THREE.Vector3(3.7, 7.7, 2.4), // the sphere that the band lands on
  bloomRadius: 6.1,
  bloomFace: new THREE.Vector3(6, 6, 5.5), // a point on the outer petals, facing the viewer
  stem: [
    new THREE.Vector3(0.7, -16, -1.2),
    new THREE.Vector3(0.9, -9, -1),
    new THREE.Vector3(1.7, -3, -0.6),
    new THREE.Vector3(2.9, 2.6, -0.15),
    new THREE.Vector3(3.4, 5, 0.2),
  ],
  sprays: [
    {
      // to the right: the leaf the band lands on
      stalk: [new THREE.Vector3(1.25, -6, -0.8), new THREE.Vector3(2.6, -7.6, 0.2), new THREE.Vector3(3.9, -8.7, 1.5)],
      leaflets: [
        {
          at: 1,
          along: new THREE.Vector3(0.95, -0.24, 0.06),
          face: new THREE.Vector3(-0.2, 0.42, 0.9),
          length: 12.6,
          half: 4.5,
          fold: 0.26,
          arch: 0.7,
          flutter: 0.12,
          sway: 0.03,
          tone: 1,
          seed: 3,
        },
        {
          at: 0.6,
          along: new THREE.Vector3(0.82, 0.5, 0.05),
          face: new THREE.Vector3(-0.3, 0.3, 0.9),
          length: 6.6,
          half: 2.6,
          fold: 0.3,
          arch: 0.45,
          flutter: 0.1,
          sway: -0.03,
          tone: 0.92,
          seed: 4,
        },
        {
          at: 0.6,
          along: new THREE.Vector3(0.25, -0.95, 0.2),
          face: new THREE.Vector3(-0.2, 0.2, 0.95),
          length: 7,
          half: 2.7,
          fold: 0.3,
          arch: 0.45,
          flutter: 0.1,
          sway: 0.03,
          tone: 0.86,
          seed: 5,
        },
      ],
    },
    {
      // to the left, lower down
      stalk: [new THREE.Vector3(1, -8.2, -1), new THREE.Vector3(-1.4, -9.4, -0.5), new THREE.Vector3(-3.8, -10.8, 0.4)],
      leaflets: [
        {
          at: 1,
          along: new THREE.Vector3(-0.9, -0.42, 0.05),
          face: new THREE.Vector3(0.05, 0.42, 0.9),
          length: 10,
          half: 3.7,
          fold: 0.28,
          arch: 0.6,
          flutter: 0.12,
          sway: -0.03,
          tone: 0.9,
          seed: 6,
        },
        {
          at: 0.62,
          along: new THREE.Vector3(-0.72, 0.62, 0.05),
          face: new THREE.Vector3(0.2, 0.2, 0.95),
          length: 6,
          half: 2.4,
          fold: 0.3,
          arch: 0.4,
          flutter: 0.1,
          sway: 0.03,
          tone: 0.82,
          seed: 7,
        },
      ],
    },
  ],
  lamp: new THREE.Vector3(-16.5, 15, -3), // the lens
  lampBody: new THREE.Vector3(-19.2, 17.6, -5.4), // on its body, clear of the lens: where the action's ring sits
  lampLooks: new THREE.Vector3(3, -1, 10), // a little toward the viewer, so that its lit lens shows
  lightFrom: new THREE.Vector3(-16.5, 17, 13), // the key light: from the lamp's side, on the face of the bloom
  aim: new THREE.Vector3(5, -1.5, 2.4), // the beam's axis: between the bloom and the leaf
  eye: new THREE.Vector3(20.5, 15.5, 3.5),
  leafHit: new THREE.Vector3(8.2, -9.8, 2.3), // where the band lands on the leaf
  leafAxis: [new THREE.Vector3(3.9, -8.7, 1.6), new THREE.Vector3(15.8, -11.7, 2.3)], // the midrib, on which the band ends
  card: new THREE.Vector3(-9.5, -1, 1), // the white paper (one question of the test)
};

const box = (a, b, c, d, e, f) => new THREE.Box3(new THREE.Vector3(a, b, c), new THREE.Vector3(d, e, f));
/** What the camera shows, by step: a box to fill, and the angle to see it from. `wide` is used when the view is landscape. */
export const FRAMES = {
  full: { box: box(-23, -16.4, -2, 26, 21.5, 6), az: 15, el: 9 },
  // the idea: the rose, the leaf, where the bands end, the arrows and the eye; beside a panel the lamp fits in too
  both: { box: box(-10.5, -16, -1, 30, 18.5, 5), wide: box(-21, -16, -1, 26, 20, 5), az: 19, el: 11 },
  rose: { box: box(-7.5, 3, 0, 10, 16.5, 6), az: 12, el: 17 },
  leaf: { box: box(1, -15.5, 0, 17.5, -3.5, 4), az: 9, el: 19 },
  plant: { box: box(-9.5, -16, -1, 16.5, 14.5, 5), az: 19, el: 11 },
};

function backdropGeometry() {
  const g = new THREE.SphereGeometry(320, 48, 24);
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  const d = new THREE.Vector3();
  const back = new THREE.Vector3(-0.1, 0.1, -1).normalize();
  for (let i = 0; i < p.count; i++) {
    d.fromBufferAttribute(p, i).normalize();
    // slate, a little lighter behind the rose, so that a black rose still stands out against it
    const k = Math.max(0, d.dot(back));
    const v = 0.016 + 0.05 * k ** 4 + 0.05 * k ** 18;
    c[i * 3] = v * 0.86;
    c[i * 3 + 1] = v;
    c[i * 3 + 2] = v * 1.2;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,0.95)');
  r.addColorStop(0.28, 'rgba(255,255,255,0.42)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A small stage lamp: black enamelled body with cooling fins, a metal rim, a lens, a yoke. It shines along its +Z. */
function createLamp() {
  const root = new THREE.Group();
  root.name = 'lamp';
  const black = new THREE.MeshStandardMaterial({ name: 'lamp-body', color: 0x4a505a, roughness: 0.42, metalness: 0.4 });
  const metal = new THREE.MeshStandardMaterial({ name: 'lamp-metal', color: 0x9aa1aa, roughness: 0.34, metalness: 0.85 });
  const v2 = (x, y) => new THREE.Vector2(x, y);
  // the lathe turns round Y: laid along Z afterwards
  const body = new THREE.LatheGeometry(
    [v2(0, -6), v2(1.9, -5.95), v2(2.5, -5.5), v2(2.95, -4.5), v2(3.1, -2.4), v2(3.4, -1), v2(3.75, 0), v2(3.75, 0.5), v2(3.3, 0.55)],
    36,
  );
  body.rotateX(Math.PI / 2);
  const shell = new THREE.Mesh(body, black);
  root.add(shell);
  const ribs = new THREE.TorusGeometry(3.12, 0.13, 6, 36);
  for (const z of [-4.1, -3.4, -2.7]) {
    const m = new THREE.Mesh(ribs, black);
    m.position.z = z;
    m.scale.setScalar(1 + (z + 2.7) * 0.012);
    root.add(m);
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.46, 0.26, 10, 40), metal);
  rim.position.z = 0.42;
  root.add(rim);
  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(3.3, 40),
    new THREE.MeshBasicMaterial({ name: 'lamp-lens', color: 0xffffff, toneMapped: false }),
  );
  lens.position.z = 0.36;
  root.add(lens);
  // the yoke, up to an arm that leaves the view
  const yoke = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.22, 8, 24, Math.PI), metal);
  yoke.position.z = -2.4;
  root.add(yoke);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 40, 10), metal);
  arm.position.set(0, 24, -2.4);
  root.add(arm);

  // the filter: a frame on a hinge at the top of the lens, the gel in it
  const hinge = new THREE.Group();
  hinge.position.set(0, 3.9, 0.9);
  root.add(hinge);
  const gelMat = new THREE.MeshBasicMaterial({
    name: 'gel',
    color: 0xffffff,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    toneMapped: false,
    depthWrite: false,
  });
  const gel = new THREE.Mesh(new THREE.CircleGeometry(3.5, 36), gelMat);
  gel.position.y = -3.9;
  hinge.add(gel);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.2, 8, 40), black);
  ring.position.y = -3.9;
  hinge.add(ring);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      opacity: 0.8,
    }),
  );
  glow.scale.setScalar(15);
  glow.position.z = 1.4;
  glow.userData.noExport = true;
  root.add(glow);

  // a big invisible target for a finger
  const hit = new THREE.Mesh(new THREE.SphereGeometry(7.5, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.z = -2;
  root.add(hit);

  shell.castShadow = false;
  const cool = new THREE.Color();
  return {
    root,
    shell,
    hit,
    /** k: 0 the filter is up out of the way, 1 over the lens; colour of the light behind it, linear. */
    set(k, [r, g, b], gelRGB) {
      hinge.rotation.x = -(1 - k) * 2.25;
      gel.visible = ring.visible = k > 0.001;
      gelMat.color.setRGB(gelRGB[0], gelRGB[1], gelRGB[2]);
      cool.setRGB(r, g, b);
      lens.material.color.copy(cool);
      glow.material.color.copy(cool);
    },
  };
}

export function createSetting({ stage, shadow }) {
  const { scene, renderer } = stage;
  const backMat = new THREE.MeshBasicMaterial({
    name: 'backdrop',
    vertexColors: true,
    side: THREE.BackSide,
    dithering: true,
    toneMapped: false,
    fog: false,
  });
  const back = new THREE.Mesh(backdropGeometry(), backMat);
  back.name = 'backdrop';
  back.userData.noExport = true;
  scene.add(back);

  // the table, very dark but slate like the wall (it has its own fixed tone, so that a black leaf still shows against it), and
  // the vase, a dark neutral glaze: only a small pool of the beam shows on them
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(150, 150, 2, 64),
    new THREE.MeshStandardMaterial({
      name: 'table',
      color: new THREE.Color(0.012, 0.013, 0.015),
      emissive: new THREE.Color(0.021, 0.024, 0.029),
      roughness: 0.74,
    }),
  );
  table.position.y = -27;
  table.receiveShadow = true;
  table.userData.noExport = true;
  scene.add(table);

  const v2 = (x, y) => new THREE.Vector2(x, y);
  const outline = new THREE.SplineCurve([
    v2(0.01, -26),
    v2(2.7, -26),
    v2(3.45, -24.4),
    v2(3.5, -22.6),
    v2(2.6, -19.2),
    v2(1.55, -16.9),
    v2(1.32, -15.4),
    v2(1.62, -14.3),
  ]);
  const vaseGeo = new THREE.LatheGeometry([...outline.getPoints(44), v2(1.5, -14.25), v2(1.16, -15)], 56);
  const vase = new THREE.Mesh(
    vaseGeo,
    new THREE.MeshPhysicalMaterial({ name: 'vase', color: new THREE.Color(...REFLECTANCE.grey), roughness: 0.32, side: THREE.DoubleSide }),
  );
  vase.name = 'stand';
  vase.position.set(0.7, 0, -1.2);
  vase.castShadow = vase.receiveShadow = true;
  scene.add(vase);

  // white paper on a wire stand: only the test brings it out
  const card = new THREE.Group();
  card.name = 'card';
  card.position.copy(LAYOUT.card);
  card.rotation.y = 0.28;
  const sheet = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 9.6, 0.05),
    new THREE.MeshStandardMaterial({ name: 'paper', color: new THREE.Color(...REFLECTANCE.card), roughness: 0.82 }),
  );
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 22, 8),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(0.1, 0.1, 0.1), roughness: 0.4 }),
  );
  wire.position.set(0, -15.5, -0.1);
  card.add(sheet, wire);
  card.visible = false;
  card.userData.noExport = true;
  scene.add(card);

  const lamp = createLamp();
  lamp.root.position.copy(LAYOUT.lamp);
  lamp.root.lookAt(LAYOUT.lampLooks);
  lamp.root.scale.setScalar(0.8);
  scene.add(lamp.root);

  // the lights: all of them the lamp's. The beam is a cone just wide enough for the rose, its leaves and the top of the stand
  const key = new THREE.SpotLight(0xffffff, 3.3, 0, 0.6, 0.55, 0);
  key.position.copy(LAYOUT.lightFrom);
  key.target.position.copy(LAYOUT.aim);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0012;
    key.shadow.normalBias = 0.14;
    key.shadow.radius = 4;
    key.shadow.camera.near = 8;
    key.shadow.camera.far = 70;
  }
  const front = new THREE.DirectionalLight(0xffffff, 0.46);
  front.position.set(8, 6, 40);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.52);
  scene.add(front, hemi);

  return {
    lamp,
    card,
    /** The lamp's light now, linear: it falls on what is in the beam. The wall stays as it is. */
    light([r, g, b]) {
      key.color.setRGB(r, g, b);
      front.color.setRGB(r, g, b);
      hemi.color.setRGB(r, g, b);
      hemi.groundColor.setRGB(r * 0.5, g * 0.5, b * 0.5);
    },
  };
}
