// Where the winch works: the roof of a building going up, 10 m above the street. A concrete roof slab with a
// yellow-and-black edge, column stubs with rusty bars and stacked cement bags; below the edge, the brick walls and
// floor slabs of the floors under it, scaffolding with a green safety net on the front; on the ground far below, sand,
// stacked bricks, an orange mixer and a blue truck; round about, Dhaka's colourful houses, a yellow tower crane,
// trees and a blue sky with clouds. Metres; the roof's top is y = 0, the street y = −10.
import * as THREE from 'three';
import { AT } from './machine.js';

/** A seeded random, so the site looks the same every time. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function canvasTexture(w, h, paint, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  return tex;
}
function concrete(seed, base = [178, 176, 168]) {
  const r = rng(seed);
  return (g, w, h) => {
    g.fillStyle = `rgb(${base.join(',')})`;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = (r() - 0.5) * 40;
      g.fillStyle = `rgba(${base[0] + v},${base[1] + v},${base[2] + v},0.5)`;
      const s = 1 + r() * 3;
      g.fillRect(r() * w, r() * h, s, s);
    }
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(90,85,75,${0.05 + r() * 0.08})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 40, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  };
}
function brickWall(g, w, h) {
  g.fillStyle = '#d9cbb8';
  g.fillRect(0, 0, w, h);
  const r = rng(11);
  const bh = h / 16;
  const bw = w / 6;
  for (let row = 0; row < 16; row++)
    for (let k = -1; k < 7; k++) {
      const x = k * bw + (row % 2 ? bw / 2 : 0);
      const v = r();
      g.fillStyle = `rgb(${165 + v * 45},${70 + v * 25},${48 + v * 18})`;
      g.fillRect(x + 2, row * bh + 2, bw - 4, bh - 4);
    }
}
/** A building's face: a colour, rows of windows with balconies' shadows. */
function facade(color, seed, floors = 8, cols = 5) {
  const r = rng(seed);
  return (g, w, h) => {
    g.fillStyle = color;
    g.fillRect(0, 0, w, h);
    const fh = h / floors;
    const cw = w / cols;
    for (let f = 0; f < floors; f++)
      for (let c = 0; c < cols; c++) {
        const lit = r();
        g.fillStyle = lit > 0.8 ? '#ffe8a8' : lit > 0.4 ? '#3b5168' : '#5d7891';
        g.fillRect(c * cw + cw * 0.2, f * fh + fh * 0.22, cw * 0.6, fh * 0.5);
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.fillRect(c * cw + cw * 0.12, f * fh + fh * 0.76, cw * 0.76, fh * 0.07);
        g.fillStyle = 'rgba(255,255,255,0.5)';
        g.fillRect(c * cw + cw * 0.2, f * fh + fh * 0.22, cw * 0.6, 2);
      }
  };
}
function cloudTexture(seed) {
  const r = rng(seed);
  return canvasTexture(256, 128, (g, w, h) => {
    for (let i = 0; i < 14; i++) {
      const x = w * (0.2 + r() * 0.6);
      const y = h * (0.45 + r() * 0.25);
      const rad = 20 + r() * 36;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }
  });
}

/** The sky: a gradient behind everything. */
export function skyTexture() {
  return canvasTexture(4, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1f7fd6');
    grad.addColorStop(0.55, '#7cc2f2');
    grad.addColorStop(0.85, '#cfeafb');
    grad.addColorStop(1, '#f4e9d4');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

export function createSite() {
  const root = new THREE.Group();
  root.name = 'Site';
  const r = rng(5);
  const lambert = (o) => new THREE.MeshLambertMaterial(o);
  const slabMat = new THREE.MeshStandardMaterial({ map: canvasTexture(512, 512, concrete(1), [3, 3]), roughness: 0.92 });
  const edgeMat = new THREE.MeshStandardMaterial({ map: canvasTexture(256, 256, concrete(2, [160, 158, 152]), [4, 1]), roughness: 0.9 });
  const brickMat = new THREE.MeshStandardMaterial({ map: canvasTexture(256, 256, brickWall, [3, 1]), roughness: 0.95 });
  const rebar = new THREE.MeshStandardMaterial({ color: '#8a4b2a', roughness: 0.8, metalness: 0.4 });
  const stripe = new THREE.MeshStandardMaterial({
    map: canvasTexture(
      128,
      16,
      (g, w, h) => {
        g.fillStyle = '#ffd43b';
        g.fillRect(0, 0, w, h);
        g.fillStyle = '#1b1e22';
        for (let x = -h; x < w; x += 32) {
          g.beginPath();
          g.moveTo(x, h);
          g.lineTo(x + 16, 0);
          g.lineTo(x + 32, 0);
          g.lineTo(x + 16, h);
          g.fill();
        }
      },
      [12, 1],
    ),
    roughness: 0.6,
  });

  // ── the roof slab (y = 0 on top), its painted edge, columns with bars ──
  const X0 = -7;
  const X1 = AT.edge;
  const Z0 = -7;
  const Z1 = 1.35;
  const slab = box(X1 - X0, 0.25, Z1 - Z0, slabMat);
  slab.position.set((X0 + X1) / 2, -0.125, (Z0 + Z1) / 2);
  slab.receiveShadow = true;
  root.add(slab);
  const edgeFront = box(X1 - X0, 0.06, 0.08, stripe);
  edgeFront.position.set((X0 + X1) / 2, 0.03, Z1 - 0.04);
  const edgeRight = box(0.08, 0.06, Z1 - Z0, stripe);
  edgeRight.position.set(X1 - 0.04, 0.03, (Z0 + Z1) / 2);
  edgeRight.material = stripe.clone();
  edgeRight.material.map = stripe.map.clone();
  edgeRight.material.map.repeat.set(30, 1);
  edgeRight.rotation.y = 0;
  root.add(edgeFront, edgeRight);
  for (const [x, z] of [
    [-3.2, -2.6],
    [0.2, -3.2],
    [-6.6, 1.0],
    [-6.6, -6.6],
    [0.2, -6.6],
    [-3.2, -6.6],
  ]) {
    const col = box(0.32, 0.5, 0.32, edgeMat);
    col.position.set(x, 0.25, z);
    root.add(col);
    for (const dx of [-0.1, 0.1])
      for (const dz of [-0.1, 0.1]) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1.1, 6), rebar);
        bar.position.set(x + dx, 0.95, z + dz);
        bar.rotation.z = (r() - 0.5) * 0.12;
        root.add(bar);
      }
  }
  // cement bags and a blue drum on the roof, behind the winch
  const bagMat = new THREE.MeshStandardMaterial({ color: '#e9e3d3', roughness: 0.95 });
  const bagStripe = new THREE.MeshStandardMaterial({ color: '#2f9e44', roughness: 0.9 });
  for (let i = 0; i < 9; i++) {
    const bag = box(0.55, 0.13, 0.36, bagMat);
    const layer = Math.floor(i / 3);
    bag.position.set(-2.4 + (i % 3) * 0.58 + (layer % 2) * 0.1, 0.065 + layer * 0.13, -1.7);
    bag.rotation.y = (r() - 0.5) * 0.15;
    const band = box(0.56, 0.135, 0.06, bagStripe);
    band.position.copy(bag.position);
    band.rotation.y = bag.rotation.y;
    root.add(bag, band);
  }
  const drumMat = new THREE.MeshStandardMaterial({ color: '#1971c2', roughness: 0.5, metalness: 0.3 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.85, 28), drumMat);
  barrel.position.set(-0.6, 0.425, -2.4);
  const barrel2 = barrel.clone();
  barrel2.position.set(-0.05, 0.425, -2.6);
  barrel2.material = new THREE.MeshStandardMaterial({ color: '#e8590c', roughness: 0.5, metalness: 0.3 });
  root.add(barrel, barrel2);

  // ── the floors below: slab edges every 3.33 m, brick walls between, dark window openings ──
  const holeMat = lambert({ color: '#2a2f36' });
  for (let f = 1; f <= 3; f++) {
    const y = -f * 3.333;
    const front = box(X1 - X0, 0.25, 0.04, edgeMat);
    front.position.set((X0 + X1) / 2, y + 0.125 + 3.333 - 0.25, Z1 + 0.01);
    root.add(front);
  }
  const wallFront = box(X1 - X0, 10, 0.2, brickMat);
  wallFront.position.set((X0 + X1) / 2, -5.13, Z1 - 0.12);
  wallFront.material = brickMat.clone();
  wallFront.material.map = brickMat.map.clone();
  wallFront.material.map.repeat.set(12, 10);
  const wallRight = box(0.2, 10, Z1 - Z0, brickMat);
  wallRight.position.set(X1 - 0.12, -5.13, (Z0 + Z1) / 2);
  wallRight.material = wallFront.material.clone();
  wallRight.material.map = wallFront.material.map.clone();
  wallRight.material.map.repeat.set(8, 10);
  root.add(wallFront, wallRight);
  for (let f = 0; f < 3; f++)
    for (let k = 0; k < 4; k++) {
      const win = box(1.0, 1.2, 0.05, holeMat);
      win.position.set(X0 + 0.9 + k * 1.8, -1.9 - f * 3.333, Z1 + 0.0);
      const winR = box(0.05, 1.2, 1.0, holeMat);
      winR.position.set(X1 + 0.0, -1.9 - f * 3.333, Z0 + 1.1 + k * 1.8);
      root.add(win, winR);
    }
  // scaffolding on the front: blue tubes, wooden planks, a green net
  const tubeMat = new THREE.MeshStandardMaterial({ color: '#4dabf7', roughness: 0.4, metalness: 0.6 });
  const plankMat = new THREE.MeshStandardMaterial({ color: '#c99a56', roughness: 0.85 });
  const netMat = new THREE.MeshStandardMaterial({
    map: canvasTexture(
      64,
      64,
      (g, w, h) => {
        g.fillStyle = 'rgba(47,158,68,0.55)';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(20,90,40,0.9)';
        g.lineWidth = 2;
        for (let i = 0; i <= w; i += 8) {
          g.beginPath();
          g.moveTo(i, 0);
          g.lineTo(i, h);
          g.moveTo(0, i);
          g.lineTo(w, i);
          g.stroke();
        }
      },
      [40, 8],
    ),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.9,
  });
  const SZ = Z1 + 0.75;
  for (let x = X0 + 0.4; x < X1 - 0.6; x += 1.8) {
    for (const z of [Z1 + 0.15, SZ]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 9.5, 8), tubeMat);
      post.position.set(x, -5.3, z);
      root.add(post);
    }
  }
  for (let f = 0; f < 3; f++) {
    const y = -0.9 - f * 3.333;
    for (const z of [Z1 + 0.15, SZ]) {
      const ledger = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, X1 - X0 - 1, 8), tubeMat);
      ledger.rotation.z = Math.PI / 2;
      ledger.position.set((X0 + X1) / 2 - 0.4, y, z);
      root.add(ledger);
    }
    const plank = box(X1 - X0 - 1, 0.04, 0.55, plankMat);
    plank.position.set((X0 + X1) / 2 - 0.4, y - 0.05, (Z1 + 0.15 + SZ) / 2);
    root.add(plank);
  }
  const net = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0 - 1, 9), netMat);
  net.position.set((X0 + X1) / 2 - 0.4, -5.6, SZ + 0.04);
  root.add(net);

  // ── the street far below: earth, sand, bricks, a mixer, a truck ──
  const groundMat = new THREE.MeshStandardMaterial({
    map: canvasTexture(512, 512, concrete(3, [196, 160, 112]), [20, 20]),
    roughness: 1,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -10.3, -20);
  root.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 260), lambert({ color: '#5c5f66' }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(9, -10.28, -20);
  root.add(road);
  for (let z = -120; z < 120; z += 6) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 2.6), lambert({ color: '#f8f9fa' }));
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(9, -10.27, z);
    root.add(dash);
  }
  const sand = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.1, 24), lambert({ color: '#e3b866' }));
  sand.position.set(2.6, -9.75, -2.5);
  root.add(sand);
  const brickStack = new THREE.MeshStandardMaterial({ color: '#b5452b', roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const s = box(1.0, 0.7, 0.8, brickStack);
    s.position.set(2.2 + (i % 2) * 1.1, -9.95, -5.5 - Math.floor(i / 2) * 0.95);
    root.add(s);
  }
  // the mixer: an orange drum on a frame
  const mixer = new THREE.Group();
  const mixDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.55, 1.0, 20),
    new THREE.MeshStandardMaterial({ color: '#fd7e14', roughness: 0.5, metalness: 0.3 }),
  );
  mixDrum.rotation.z = 1.0;
  mixDrum.position.y = 0.95;
  const mixFrame = box(1.2, 0.5, 0.7, new THREE.MeshStandardMaterial({ color: '#343a40', roughness: 0.6 }));
  mixFrame.position.y = 0.25;
  mixer.add(mixDrum, mixFrame);
  mixer.position.set(4.6, -10.3, -1);
  root.add(mixer);
  // the truck: a blue cab and a yellow tipper
  const truck = new THREE.Group();
  const cab = box(2.0, 1.9, 2.3, new THREE.MeshStandardMaterial({ color: '#1c7ed6', roughness: 0.35, metalness: 0.4 }));
  cab.position.set(0, 1.45, 2.4);
  const glass = box(1.8, 0.7, 0.05, new THREE.MeshStandardMaterial({ color: '#a5d8ff', roughness: 0.05, metalness: 0.5 }));
  glass.position.set(0, 1.9, 3.56);
  const tipper = box(2.3, 1.3, 4.2, new THREE.MeshStandardMaterial({ color: '#fab005', roughness: 0.45, metalness: 0.3 }));
  tipper.position.set(0, 1.55, -0.9);
  truck.add(cab, glass, tipper);
  const tyre = new THREE.MeshStandardMaterial({ color: '#212529', roughness: 0.9 });
  for (const z of [2.4, -0.4, -2.0])
    for (const x of [-1.05, 1.05]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 18), tyre);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.5, z);
      truck.add(w);
    }
  truck.position.set(8.2, -10.3, -9);
  truck.rotation.y = 0.15;
  root.add(truck);

  // ── around: Dhaka's colourful houses, trees, the tower crane, clouds ──
  const COLORS = ['#f3c6d0', '#ffe8a3', '#b2f2bb', '#a5d8ff', '#ffd8a8', '#e5dbff', '#f8f0e3', '#c3fae8', '#ffc9c9'];
  const place = [
    [-14, -22, 9, 26, 8],
    [-2, -26, 10, 32, 9],
    [10, -24, 8, 20, 7],
    [-26, -12, 9, 18, 10],
    [20, -14, 10, 28, 9],
    [-20, -38, 12, 40, 12],
    [6, -44, 14, 46, 10],
    [24, -34, 10, 22, 9],
    [-34, -26, 10, 24, 9],
    [36, -22, 12, 34, 10],
    [-12, 14, 8, 14, 8],
    [-30, 4, 9, 20, 9],
  ];
  place.forEach(([x, z, w, h, d], i) => {
    const color = COLORS[i % COLORS.length];
    const mat = new THREE.MeshLambertMaterial({ map: canvasTexture(256, 512, facade(color, 20 + i, Math.round(h / 3.2), 5)) });
    const b = box(w, h, d, mat);
    b.position.set(x, -10.3 + h / 2, z);
    root.add(b);
    const roof = box(w + 0.3, 0.4, d + 0.3, lambert({ color: '#c9c3b6' }));
    roof.position.set(x, -10.3 + h + 0.2, z);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 14), lambert({ color: i % 2 ? '#212529' : '#1971c2' }));
    tank.position.set(x + w * 0.25, -10.3 + h + 1, z + d * 0.2);
    root.add(roof, tank);
  });
  const leaf = [lambert({ color: '#2f9e44' }), lambert({ color: '#37b24d' }), lambert({ color: '#5c940d' })];
  const bark = lambert({ color: '#7a5230' });
  for (let i = 0; i < 16; i++) {
    const x = 13 + (i % 2) * 1.5 + (r() - 0.5);
    const z = 18 - i * 8 + r() * 2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 3, 8), bark);
    trunk.position.set(x, -8.8, z);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8 + r() * 0.8, 1), leaf[i % 3]);
    crown.position.set(x, -6.4, z);
    root.add(trunk, crown);
  }
  // the tower crane: a yellow lattice mast, a long jib, a counterweight, a red cab
  const craneMat = new THREE.MeshStandardMaterial({
    map: canvasTexture(
      64,
      64,
      (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.strokeStyle = '#fcc419';
        g.lineWidth = 7;
        g.strokeRect(3, 3, w - 6, h - 6);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(w, h);
        g.stroke();
      },
      [1, 14],
    ),
    transparent: true,
    alphaTest: 0.4,
    side: THREE.DoubleSide,
    roughness: 0.5,
  });
  const crane = new THREE.Group();
  const mast = box(1.6, 44, 1.6, craneMat);
  mast.position.y = 22;
  const jibMat = craneMat.clone();
  jibMat.map = craneMat.map.clone();
  jibMat.map.repeat.set(20, 1);
  const jibArm = box(40, 1.4, 1.4, jibMat);
  jibArm.position.set(10, 44.8, 0);
  const cabin = box(2, 2, 2, new THREE.MeshStandardMaterial({ color: '#e03131', roughness: 0.4 }));
  cabin.position.set(-1.6, 43, 0);
  const weight = box(4, 2.2, 2, lambert({ color: '#868e96' }));
  weight.position.set(-8, 44.6, 0);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 20, 4), lambert({ color: '#343a40' }));
  cable.position.set(22, 34.5, 0);
  crane.add(mast, jibArm, cabin, weight, cable);
  crane.position.set(-24, -10.3, -48);
  crane.rotation.y = -0.5;
  root.add(crane);
  for (let i = 0; i < 6; i++) {
    const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(40 + i), depthWrite: false, fog: false }));
    cloud.scale.set(26 + r() * 18, 12 + r() * 6, 1);
    cloud.position.set(-80 + i * 32 + r() * 10, 26 + r() * 22, -110 - r() * 30);
    root.add(cloud);
  }
  return root;
}
