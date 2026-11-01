// The bodies dropped in the tank, all 10 cm cubes (so a whole one always pushes aside 1 litre of water): wood, cork,
// ice, brick, stone, a painted block and a sealed tin; and a toy submarine with a window on its ballast tank. Built once
// from canvas textures (no image files); a block changes what it is made of by swapping its material. Metres; each
// body's origin is the middle of its bottom face, so `position.y` is the height of its bottom above the tank's floor.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SIDE, SUB } from './reading.js';
import { rng } from './scene.js';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function woodTex() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#d9a35f';
    g.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 70; i++) {
      const y0 = r() * h;
      g.strokeStyle = r() < 0.6 ? `rgba(120,64,24,${0.18 + r() * 0.3})` : `rgba(250,205,140,${0.2 + r() * 0.2})`;
      g.lineWidth = 0.8 + r() * 2.6;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) g.lineTo(x, y0 + Math.sin(x / 40 + i) * 3 + Math.sin(x / 13 + i * 2) * 0.8);
      g.stroke();
    }
    // a knot
    g.strokeStyle = 'rgba(110,56,20,0.55)';
    for (let k = 1; k < 7; k++) {
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(w * 0.68, h * 0.38, k * 4.5, k * 2, 0, 0, Math.PI * 2);
      g.stroke();
    }
  });
}

function speckleTex(base, specks, seed, n = 2600, size = 2.4) {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      g.fillStyle = specks[Math.floor(r() * specks.length)];
      g.beginPath();
      g.ellipse(r() * w, r() * h, 0.6 + r() * size, 0.6 + r() * size, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}

function brickTex() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#b5482b';
    g.fillRect(0, 0, w, h);
    const r = rng(13);
    for (let i = 0; i < 1800; i++) {
      g.fillStyle = r() < 0.5 ? `rgba(120,30,15,${0.2 + r() * 0.3})` : `rgba(230,130,90,${0.15 + r() * 0.3})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 3);
    }
    // a stamped mark in the middle, as on a village brick
    g.strokeStyle = 'rgba(90,25,12,0.45)';
    g.lineWidth = 5;
    g.strokeRect(w * 0.28, h * 0.36, w * 0.44, h * 0.28);
  });
}

function tinTex() {
  return canvasTexture(256, 256, (g, w, h) => {
    // a lacquered biscuit tin: deep magenta with a cream band and thin gold lines
    const s = g.createLinearGradient(0, 0, w, 0);
    s.addColorStop(0, '#a3174f');
    s.addColorStop(0.5, '#e0307a');
    s.addColorStop(1, '#9c1449');
    g.fillStyle = s;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff1c9';
    g.fillRect(0, h * 0.4, w, h * 0.2);
    g.fillStyle = '#e8b730';
    for (const y of [0.37, 0.6, 0.08, 0.89]) g.fillRect(0, h * y, w, h * 0.03);
    const r = rng(23);
    g.fillStyle = 'rgba(255,240,200,0.5)';
    for (let i = 0; i < 18; i++) {
      g.beginPath();
      g.arc(r() * w, h * (0.15 + r() * 0.17), 3 + r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** The materials a block can be made of (keys as reading.js MATERIALS, plus the test's stone and painted block). */
export function createBlockMaterials() {
  return {
    wood: new THREE.MeshStandardMaterial({ name: 'Wood', map: woodTex(), roughness: 0.62 }),
    cork: new THREE.MeshStandardMaterial({
      name: 'Cork',
      map: speckleTex('#c99a62', ['#8a5a2b', '#a87842', '#e3bd8a', '#6e4520'], 9, 3200, 2.2),
      roughness: 0.9,
    }),
    ice: new THREE.MeshPhysicalMaterial({
      name: 'Ice',
      color: '#dff6ff',
      roughness: 0.12,
      metalness: 0,
      transparent: true,
      opacity: 0.78,
      emissive: '#9fe3ff',
      emissiveIntensity: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      depthWrite: true,
    }),
    brick: new THREE.MeshStandardMaterial({ name: 'Brick', map: brickTex(), roughness: 0.88 }),
    stone: new THREE.MeshStandardMaterial({
      name: 'Stone',
      map: speckleTex('#8d949c', ['#5b6168', '#c3c8cd', '#6f767e', '#e9ecef'], 15, 3800, 1.8),
      roughness: 0.8,
    }),
    painted: new THREE.MeshStandardMaterial({ name: 'Painted', color: '#ff7f61', roughness: 0.5 }),
  };
}

/** A 10 cm cube with softened edges; `setMaterial(m)` changes what it is made of. */
export function createBlock(material, name = 'Block') {
  const root = new THREE.Group();
  root.name = name;
  const geo = new RoundedBoxGeometry(SIDE, SIDE, SIDE, 2, 0.004).translate(0, SIDE / 2, 0);
  const body = new THREE.Mesh(geo, material);
  body.name = `${name}Body`;
  body.castShadow = true;
  root.add(body);
  return {
    root,
    body,
    meshes: [body],
    setMaterial(m) {
      body.material = m;
    },
  };
}

/** A sealed tin (a cube with a lid's rim), magenta lacquer with a cream band and a silver lid: with just enough sand
 * inside it is as heavy as water. */
export function createTin(name = 'Tin') {
  const root = new THREE.Group();
  root.name = name;
  const side = new THREE.MeshStandardMaterial({ name: 'TinSide', map: tinTex(), metalness: 0.35, roughness: 0.3 });
  const plain = new THREE.MeshStandardMaterial({ name: 'Tin', color: '#dfe5eb', metalness: 0.85, roughness: 0.28 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(SIDE, SIDE * 0.94, SIDE, 2, 0.006).translate(0, SIDE * 0.47, 0), [
    side,
    side,
    plain,
    plain,
    side,
    side,
  ]);
  body.castShadow = true;
  const lid = new THREE.Mesh(new RoundedBoxGeometry(SIDE + 0.004, SIDE * 0.07, SIDE + 0.004, 2, 0.003), plain);
  lid.position.y = SIDE - SIDE * 0.035;
  lid.castShadow = true;
  root.add(body, lid);
  return { root, body, meshes: [body, lid] };
}

/**
 * The toy submarine, lying along x, its origin under the middle of its hull (bottom of the hull at y = 0). The window
 * on its side shows the ballast tank: `setFill(0…1)` raises the water in it.
 */
export function createSub() {
  const root = new THREE.Group();
  root.name = 'Submarine';
  const R = SUB.height / 2;
  const L = SUB.length;
  const hullMat = new THREE.MeshStandardMaterial({ name: 'Hull', color: '#f0402b', roughness: 0.36, metalness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ name: 'Fins', color: '#253041', roughness: 0.45, metalness: 0.5 });
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(R, L - 2 * R, 10, 28).rotateZ(Math.PI / 2), hullMat);
  hull.position.y = R;
  hull.castShadow = true;
  // the sail (tower) and its periscope
  const sail = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.04, 0.026, 3, 0.011), hullMat);
  sail.position.set(0.02, 2 * R + 0.012, 0);
  sail.castShadow = true;
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.03, 10), dark);
  scope.position.set(0.035, 2 * R + 0.045, 0);
  // tail: a cross of fins and a propeller
  const finV = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.004), dark);
  finV.position.set(-L / 2 + 0.025, R, 0);
  const finH = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.004, 0.06), dark);
  finH.position.set(-L / 2 + 0.025, R, 0);
  const prop = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.026, 0.009), dark);
    blade.position.y = 0.013;
    const arm = new THREE.Group();
    arm.rotation.x = (i * 2 * Math.PI) / 3;
    arm.add(blade);
    prop.add(arm);
  }
  prop.position.set(-L / 2 - 0.006, R, 0);
  // bow planes
  const bow = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.003, 0.09), dark);
  bow.position.set(L / 2 - 0.07, R + 0.01, 0);
  // portholes on the side that faces the camera
  const glassMat = new THREE.MeshStandardMaterial({
    name: 'Porthole',
    color: '#123a5c',
    roughness: 0.1,
    metalness: 0.3,
    emissive: '#4fc3ff',
    emissiveIntensity: 0.25,
  });
  const rimMat = new THREE.MeshStandardMaterial({ name: 'Rim', color: '#e9ecef', roughness: 0.3, metalness: 0.9 });
  const portholes = [0.04, 0.085, 0.13].map((x) => {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0085, 0.0018, 8, 20), rimMat);
    const pane = new THREE.Mesh(new THREE.CircleGeometry(0.0085, 20), glassMat);
    g.add(rim, pane);
    g.position.set(x, R + 0.012, Math.sqrt(R * R - 0.012 * 0.012) + 0.0008);
    g.rotation.x = -Math.asin(0.012 / R);
    return g;
  });
  // the ballast tank's window: a dark strip low on the side, with the tank's water rising in it
  const wy = -0.014; // the window's middle, from the hull's axis
  const tilt = Math.asin(wy / R);
  const window_ = new THREE.Group();
  window_.position.set(-0.045, R + wy, Math.sqrt(R * R - wy * wy) + 0.0012);
  window_.rotation.x = -tilt;
  const W = 0.13;
  const Hh = 0.018;
  const frame = new THREE.Mesh(new RoundedBoxGeometry(W + 0.006, Hh + 0.006, 0.002, 2, 0.002), rimMat);
  frame.position.z = -0.0008;
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), new THREE.MeshBasicMaterial({ color: '#16212e', toneMapped: false }));
  inside.position.z = 0.0003;
  const fillMat = new THREE.MeshBasicMaterial({ color: '#2fa8ff', toneMapped: false });
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh).translate(0, Hh / 2, 0), fillMat);
  fill.position.set(0, -Hh / 2, 0.0006);
  fill.scale.y = 0.001;
  // a few marks on the window: empty, half (as heavy as its water), full
  const markMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  for (const k of [0.5]) {
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.0009), markMat);
    mark.position.set(0, -Hh / 2 + Hh * k, 0.0009);
    window_.add(mark);
  }
  window_.add(frame, inside, fill);
  root.add(hull, sail, scope, finV, finH, prop, bow, ...portholes, window_);
  return {
    root,
    meshes: [hull, sail],
    prop,
    /** The ballast tank's water, 0 (empty) … 1 (full). */
    setFill(k) {
      fill.scale.y = Math.max(0.001, Math.min(1, k));
    },
    /** Where the bubbles come out (the top of the sail), in the sub's own frame. */
    vent: new THREE.Vector3(0.02, 2 * R + 0.03, 0),
  };
}

/** A thin cord from a body up out of the picture: it holds the body until the student lets go. */
export function createCord(name = 'Cord') {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0012, 0.0012, 1, 6).translate(0, 0.5, 0),
    new THREE.MeshStandardMaterial({ color: '#3b2f2a', roughness: 0.8 }),
  );
  m.name = name;
  m.scale.y = 1.2;
  m.userData.noExport = true;
  return m;
}
