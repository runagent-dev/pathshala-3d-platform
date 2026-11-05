// The setting: a dim neutral backdrop, a grey vase on a table, and one lamp at the top left with a filter that swings in
// front of its lens. All the light in the room is the lamp's: key, fill and the backdrop's own glow take its colour, so the
// neutral grey things show what the light is, and nothing else tints the rose. Sizes in centimetres.
import * as THREE from 'three';
import { REFLECTANCE } from './reading.js';

/** Where everything is, in one place: the camera's frame, the rays and the model all read this. */
export const LAYOUT = {
  bloomAt: new THREE.Vector3(3.4, 5, 0.2), // the base of the bloom
  bloomTilt: new THREE.Vector3(0.08, 1, 0.82), // its axis: tipped toward the viewer, so the heart shows
  bloomCentre: new THREE.Vector3(3.7, 7.7, 2.4), // the sphere that the band lands on
  bloomRadius: 6.1,
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
  lamp: new THREE.Vector3(-16.5, 17, -3), // the lens
  lampLooks: new THREE.Vector3(3, -1, 10), // a little toward the viewer, so that its lit lens shows
  lightFrom: new THREE.Vector3(-16.5, 17, 13), // the key light: from the lamp's side, on the face of the bloom
  aim: new THREE.Vector3(3, -1, 2.4), // the lamp looks here, between the bloom and the leaf
  eye: new THREE.Vector3(19, 18, 3.5),
  leafHit: new THREE.Vector3(8.2, -9.8, 2.3), // where the band lands on the leaf
  leafAxis: [new THREE.Vector3(3.9, -8.7, 1.6), new THREE.Vector3(15.8, -11.7, 2.3)], // the midrib, on which the band ends
  frame: new THREE.Box3(new THREE.Vector3(-23, -16.4, -2), new THREE.Vector3(25, 23.5, 6)),
};

function backdropGeometry() {
  const g = new THREE.SphereGeometry(320, 48, 24);
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  const d = new THREE.Vector3();
  const back = new THREE.Vector3(-0.1, 0.05, -1).normalize();
  for (let i = 0; i < p.count; i++) {
    d.fromBufferAttribute(p, i).normalize();
    // the pool of light on the wall behind the rose, falling off to a dim edge
    const k = Math.max(0, d.dot(back));
    const glow = k ** 16;
    const v = 0.03 + 0.1 * k ** 3 + 0.17 * glow;
    c[i * 3] = v * 0.92;
    c[i * 3 + 1] = v;
    c[i * 3 + 2] = v * 1.1;
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
  const black = new THREE.MeshStandardMaterial({ name: 'lamp-body', color: 0x24272c, roughness: 0.46, metalness: 0.35 });
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

  // the table and the vase: neutral grey, so they take exactly the lamp's colour
  const grey = REFLECTANCE.grey;
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(150, 150, 2, 64),
    new THREE.MeshStandardMaterial({ name: 'table', color: new THREE.Color(grey[0] * 0.3, grey[1] * 0.3, grey[2] * 0.3), roughness: 0.8 }),
  );
  table.position.y = -27;
  table.receiveShadow = true;
  table.userData.noExport = true;
  scene.add(table);

  const v2 = (x, y) => new THREE.Vector2(x, y);
  const vaseGeo = new THREE.LatheGeometry(
    [
      v2(0, -26),
      v2(2.6, -26),
      v2(3.1, -25.7),
      v2(3.5, -23.5),
      v2(3.3, -21),
      v2(2.3, -18.5),
      v2(1.45, -16.6),
      v2(1.35, -15.2),
      v2(1.55, -14.4),
      v2(1.32, -14.3),
      v2(1.1, -15),
    ],
    32,
  );
  const vase = new THREE.Mesh(vaseGeo, new THREE.MeshStandardMaterial({ name: 'vase', color: new THREE.Color(...grey), roughness: 0.52 }));
  vase.name = 'stand';
  vase.position.set(0.7, 0, -1.2);
  vase.castShadow = vase.receiveShadow = true;
  scene.add(vase);

  const lamp = createLamp();
  lamp.root.position.copy(LAYOUT.lamp);
  lamp.root.lookAt(LAYOUT.lampLooks);
  lamp.root.scale.setScalar(0.8);
  scene.add(lamp.root);

  // the lights: all of them the lamp's
  const key = new THREE.DirectionalLight(0xffffff, 3);
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
    Object.assign(key.shadow.camera, { left: -19, right: 19, top: 19, bottom: -19, near: 4, far: 70 });
    key.shadow.camera.updateProjectionMatrix();
  }
  const front = new THREE.DirectionalLight(0xffffff, 0.42);
  front.position.set(8, 6, 40);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
  scene.add(front, hemi);

  return {
    lamp,
    /** The room's light now, linear. */
    light([r, g, b]) {
      key.color.setRGB(r, g, b);
      front.color.setRGB(r, g, b);
      hemi.color.setRGB(r, g, b);
      hemi.groundColor.setRGB(r * 0.55, g * 0.55, b * 0.55);
      // a pure colour on the wall, kept as dim as the white room: the eye weighs green most, blue least
      const k = Math.min(1, Math.max(0, (r + g + b - 1) / 2));
      backMat.color.setRGB(r * (0.62 + 0.38 * k), g * (0.42 + 0.58 * k), b * (1.1 - 0.1 * k));
    },
  };
}
