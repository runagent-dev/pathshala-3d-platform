// The setting: a calm slate wall, a dark lab bench, and on the bench only what the idea needs: a block of clear glass and a
// small torch in a clamp stand, its cap pierced by a hole so that a narrow pencil of light leaves it. Centimetres.
// The glass is not `transmission` (that draws the whole scene twice): two transparent passes of one rounded box whose
// edges thicken and turn faintly green as the surface turns away from the eye, as a real block's do.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BLOCK, paths, START_ANGLE } from './reading.js';

const box = (a, b, c, d, e, f) => new THREE.Box3(new THREE.Vector3(a, b, c), new THREE.Vector3(d, e, f));

/** What the camera shows, step by step: a box to fill, and the angle to see it from. All of them read as 3D. */
export const FRAMES = {
  start: { box: box(-12.5, -0.3, -4.5, 12, 20.5, 4.5), az: 26, el: 14 },
  reflection: { box: box(-7.5, 6.2, -1, 12, 17.2, 1), az: 24, el: 13 },
  refraction: { box: box(-5.2, -0.6, -4.5, 9, 10, 4.5), az: 24, el: 11 },
  absorption: { box: box(-2.4, 6.4, -2.5, 5.4, 9.2, 2.5), az: 28, el: 24 },
  all: { box: box(-12.5, -0.3, -4.5, 12, 20.5, 4.5), az: 26, el: 14 },
  other: { box: box(-17.5, -0.3, -4.5, 14, 18, 4.5), az: 26, el: 14 }, // the test's other angle: the torch lower and further out
};

function backdropGeometry() {
  const g = new THREE.SphereGeometry(320, 40, 20);
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  const d = new THREE.Vector3();
  const back = new THREE.Vector3(-0.28, 0.12, -1).normalize();
  for (let i = 0; i < p.count; i++) {
    d.fromBufferAttribute(p, i).normalize();
    // slate: lighter behind the block, so that its edges stand out and the rays glow
    const k = Math.max(0, d.dot(back));
    const v = 0.03 + 0.1 * k ** 5 + 0.05 * k ** 24;
    c[i * 3] = v * 0.84;
    c[i * 3 + 1] = v;
    c[i * 3 + 2] = v * 1.26;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

/** A soft round glow (white in the middle), tinted by the material. */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 1, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.3, 'rgba(255,255,255,0.46)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The bench top: painted slate with a fine grain. Made once. */
function benchTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * 512;
    g.strokeStyle = `rgba(0,0,0,${0.006 + Math.random() * 0.016})`;
    g.lineWidth = 0.5 + Math.random() * 1.2;
    g.beginPath();
    g.moveTo(Math.random() * 512, y);
    g.lineTo(Math.random() * 512, y + (Math.random() - 0.5) * 5);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 3);
  t.anisotropy = 4;
  return t;
}

/** The soft foot of the block on the bench: faint, for clear glass. Nested boxes, so that it is soft on every browser. */
function footTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(5,9,12,0.022)';
  for (let i = 0; i < 26; i++) g.fillRect(i, i, 256 - 2 * i, 128 - 2 * i);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Glass: a little of the tint, the room's reflection, and more of everything where the surface turns away from the eye. */
function glassMaterial(name, side, base, rim) {
  const m = new THREE.MeshStandardMaterial({
    name,
    color: new THREE.Color(0.8, 0.95, 0.92),
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: base,
    side,
    depthWrite: false,
    envMapIntensity: 1.5,
  });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
      float lab_f = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 2.4);
      gl_FragColor.rgb += vec3(0.36, 0.8, 0.64) * lab_f * ${rim.toFixed(2)};
      gl_FragColor.a = clamp(gl_FragColor.a + lab_f * ${rim.toFixed(2)}, 0.0, 1.0);`,
    );
  };
  return m;
}

function createBlock() {
  const root = new THREE.Group();
  root.name = 'glass-block';
  root.position.y = BLOCK.height / 2 + 0.03; // a hair above the bench, never coplanar with it
  const geo = new RoundedBoxGeometry(BLOCK.halfLength * 2, BLOCK.height, BLOCK.halfDepth * 2, 3, 0.16);
  const back = new THREE.Mesh(geo, glassMaterial('glass-inside', THREE.BackSide, 0.1, 0.42));
  back.renderOrder = 1;
  const front = new THREE.Mesh(geo, glassMaterial('glass', THREE.FrontSide, 0.13, 0.62));
  front.renderOrder = 2;
  root.add(back, front);
  return root;
}

const v2 = (x, y) => new THREE.Vector2(x, y);

/** The torch: it shines along its +Z from the hole in its cap, at the origin. */
function createTorch(glow) {
  const root = new THREE.Group();
  root.name = 'torch';
  const body = new THREE.MeshStandardMaterial({ name: 'torch-body', color: 0x39506e, roughness: 0.36, metalness: 0.78 });
  const steel = new THREE.MeshStandardMaterial({ name: 'torch-steel', color: 0xb9c0c9, roughness: 0.3, metalness: 0.92 });
  const rubber = new THREE.MeshStandardMaterial({ name: 'torch-rubber', color: 0x16191d, roughness: 0.74 });
  // the lathe turns round Y, the head on top: then laid along Z
  const shell = new THREE.LatheGeometry(
    [v2(0, -8.2), v2(0.9, -8.2), v2(1.02, -8.05), v2(1.02, -7.5), v2(0.94, -7.45), v2(0.94, -3.4), v2(1.3, -2.4), v2(1.46, -1.2), v2(1.46, -0.3)],
    32,
  );
  shell.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(shell, body);
  m.castShadow = true;
  root.add(m);
  // the bezel and the cap with its hole
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.14, 10, 36), steel);
  bezel.position.z = -0.22;
  root.add(bezel);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(1.42, 36), rubber);
  cap.position.z = -0.14;
  root.add(cap);
  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 20),
    new THREE.MeshBasicMaterial({ name: 'torch-hole', color: 0xffe9a8, toneMapped: false }),
  );
  hole.position.z = -0.12;
  root.add(hole);
  // the grip: fine rings, one object
  const rings = [];
  for (let z = -6.9; z < -3.9; z += 0.34) {
    const r = new THREE.TorusGeometry(0.95, 0.055, 5, 24);
    r.translate(0, 0, z);
    rings.push(r);
  }
  root.add(new THREE.Mesh(mergeGeometries(rings), steel));
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.16, 16), rubber);
  button.rotation.z = 0;
  button.position.set(0, 1.0, -3.15);
  root.add(button);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xffc95e,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      opacity: 0.9,
    }),
  );
  halo.scale.setScalar(4);
  halo.position.z = 0.1;
  halo.userData.noExport = true;
  root.add(halo);
  return root;
}

/** The clamp stand: a base and a rod behind the block, an arm forward to a ring round the torch. It follows the torch. */
function createStand() {
  const root = new THREE.Group();
  root.name = 'stand';
  const iron = new THREE.MeshStandardMaterial({ name: 'stand-iron', color: 0x2c3138, roughness: 0.46, metalness: 0.62 });
  const steel = new THREE.MeshStandardMaterial({ name: 'stand-steel', color: 0xa9b0ba, roughness: 0.34, metalness: 0.9 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(7, 0.7, 6, 2, 0.14), iron);
  base.position.y = 0.35;
  base.castShadow = true;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1, 12), steel);
  rod.castShadow = true;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 10), steel);
  arm.rotation.x = Math.PI / 2;
  arm.castShadow = true;
  const boss = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), iron);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.16, 8, 28), iron);
  root.add(base, rod, arm, boss, ring);
  const BACK = -8;
  root.position.z = BACK;
  return {
    root,
    /** The rod stands under the point `at` on the torch, whose axis is `axis`. */
    follow(at, axis) {
      root.position.x = at.x;
      rod.scale.y = at.y + 2;
      rod.position.y = (at.y + 2) / 2;
      arm.scale.y = -BACK;
      arm.position.set(0, at.y, -BACK / 2);
      boss.position.set(0, at.y, 0);
      ring.position.set(0, at.y, -BACK);
      ring.quaternion.setFromUnitVectors(Z, axis);
    },
  };
}
const Z = new THREE.Vector3(0, 0, 1);

export function createSetting({ stage, shadow }) {
  const { scene, renderer } = stage;
  const back = new THREE.Mesh(
    backdropGeometry(),
    new THREE.MeshBasicMaterial({ name: 'backdrop', vertexColors: true, side: THREE.BackSide, dithering: true, toneMapped: false, fog: false }),
  );
  back.userData.noExport = true;
  scene.add(back);

  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(420, 4, 86),
    new THREE.MeshStandardMaterial({ name: 'bench', color: 0x47566a, map: benchTexture(), roughness: 0.58, metalness: 0.05, envMapIntensity: 0.5 }),
  );
  bench.position.set(0, -2, 18);
  bench.receiveShadow = true;
  bench.userData.noExport = true;
  scene.add(bench);

  const glow = glowTexture();
  const foot = new THREE.Mesh(
    new THREE.PlaneGeometry(BLOCK.halfLength * 2.5, BLOCK.halfDepth * 2.9),
    new THREE.MeshBasicMaterial({ map: footTexture(), transparent: true, depthWrite: false, toneMapped: false }),
  );
  foot.rotation.x = -Math.PI / 2;
  foot.position.y = 0.012;
  foot.userData.noExport = true;
  scene.add(foot);

  const apparatus = new THREE.Group();
  apparatus.name = 'apparatus';
  scene.add(apparatus);
  const block = createBlock();
  const torch = createTorch(glow);
  const stand = createStand();
  apparatus.add(stand.root, block, torch);

  // the top of the glass: the surface between the two media. A thin light on it, stronger when it matters
  const skinMat = new THREE.MeshBasicMaterial({
    name: 'surface',
    color: 0xd9f4ec,
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
    toneMapped: false,
  });
  const skin = new THREE.Mesh(new THREE.PlaneGeometry(BLOCK.halfLength * 2 - 0.3, BLOCK.halfDepth * 2 - 0.3), skinMat);
  skin.rotation.x = -Math.PI / 2;
  skin.position.y = BLOCK.height + 0.01;
  skin.renderOrder = 3;
  skin.userData.noExport = true;
  scene.add(skin);

  /** A round glow lying on a surface. */
  const spot = (color, size) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({
        map: glow,
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 4;
    mesh.visible = false;
    mesh.userData.noExport = true;
    scene.add(mesh);
    return mesh;
  };
  const warm = spot(0xff6a1f, 4.2); // the warm mark that absorption leaves on the surface
  const landing = spot(0xffc95e, 1.8); // where the refracted light comes to the bench

  // the big invisible target for a finger, on the point where the light arrives
  const hit = new THREE.Mesh(new THREE.SphereGeometry(3.1, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  scene.add(hit);

  // the lights
  const key = new THREE.DirectionalLight(0xfff3e4, 2.1);
  key.position.set(16, 48, 26); // from the right, so that the torch's shadow falls away from the block
  key.target.position.set(0, 0, 0);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.04;
    key.shadow.radius = 5;
    Object.assign(key.shadow.camera, { left: -30, right: 30, top: 30, bottom: -24, near: 10, far: 90 });
  }
  scene.add(new THREE.HemisphereLight(0xcfe0f4, 0x20262e, 1.1));

  const q = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const place = (angle) => {
    const g = paths(angle);
    dir.set(g.hit.x - g.lens.x, g.hit.y - g.lens.y, 0).normalize();
    torch.position.set(g.lens.x, g.lens.y, 0);
    torch.lookAt(q.set(g.hit.x, g.hit.y, 0));
    q.copy(torch.position).addScaledVector(dir, -5.4);
    stand.follow(q, dir);
    warm.position.set(g.hit.x, g.hit.y + 0.03, 0);
    landing.position.set(g.refracted.x, 0.04, 0);
    hit.position.set(g.hit.x, g.hit.y, 0);
  };
  place(START_ANGLE);

  return {
    apparatus,
    hit,
    block,
    place,
    /** k: how far the warm mark has come, 0 … 1. */
    ember(k) {
      warm.visible = k > 0.01;
      warm.material.opacity = 0.95 * k;
    },
    landing(k) {
      landing.visible = k > 0.01;
      landing.material.opacity = 0.8 * k;
    },
    /** How strongly the surface between the media shows, 0 … 1. */
    surface(k) {
      skinMat.opacity = 0.07 + 0.16 * k;
    },
  };
}
