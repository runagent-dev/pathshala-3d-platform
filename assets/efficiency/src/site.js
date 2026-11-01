// Where the winch works: the roof of a building going up, 10 m above the street. A cast-concrete roof slab (formwork
// seams, damp patches, chalk lines) with a yellow-and-black edge, column stubs with rusty bars and stacked cement bags;
// below the edge, the brick walls and floor slabs of the floors under it, scaffolding with a safety net on the front;
// on the ground far below, sand, stacked bricks, an orange mixer and a blue truck; round about, Dhaka's colourful
// houses, a yellow tower crane, trees and a blue sky with clouds. Metres; the roof's top is y = 0, the street y = −10.
//
// Drawn light: everything here stands still, so it is merged into one mesh per material (./bake.js). Plain-coloured
// parts carry their colour in the geometry and share three materials (far matte, roof matte, painted metal); the
// twelve houses' faces are one atlas; the clouds are one mesh. About fifteen draw calls for the whole site.
import * as THREE from 'three';
import { bake } from './bake.js';
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
/** Cast concrete: grain, darker blotches, and (for the slab) formwork seams, damp patches and chalk lines. */
function concrete(seed, base = [178, 176, 168], { seams = 0 } = {}) {
  const r = rng(seed);
  return (g, w, h) => {
    g.fillStyle = `rgb(${base.join(',')})`;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(80,74,64,${0.06 + r() * 0.1})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 40, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 2600; i++) {
      const v = (r() - 0.5) * 46;
      g.fillStyle = `rgba(${base[0] + v},${base[1] + v},${base[2] + v},0.55)`;
      const s = 1 + r() * 3;
      g.fillRect(r() * w, r() * h, s, s);
    }
    if (!seams) return;
    // formwork panels: a grid of thin dark seams with a light lip, a few tie holes
    const step = w / seams;
    for (let k = 0; k <= seams; k++) {
      g.fillStyle = 'rgba(60,54,46,0.45)';
      g.fillRect(k * step - 1, 0, 2, h);
      g.fillRect(0, k * step - 1, w, 2);
      g.fillStyle = 'rgba(255,250,240,0.18)';
      g.fillRect(k * step + 1, 0, 1, h);
      g.fillRect(0, k * step + 1, w, 1);
    }
    for (let k = 0; k < seams; k++)
      for (let j = 0; j < seams; j++) {
        g.fillStyle = 'rgba(40,36,30,0.55)';
        g.beginPath();
        g.arc(k * step + step * 0.5, j * step + step * 0.5, 2.2, 0, Math.PI * 2);
        g.fill();
      }
    // damp patches where the curing water stood
    for (let i = 0; i < 3; i++) {
      const x = r() * w;
      const y = r() * h;
      const grad = g.createRadialGradient(x, y, 0, x, y, 40 + r() * 50);
      grad.addColorStop(0, 'rgba(70,64,56,0.32)');
      grad.addColorStop(1, 'rgba(70,64,56,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }
    // blue chalk lines the masons snapped
    g.strokeStyle = 'rgba(40,110,200,0.5)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, h * 0.37);
    g.lineTo(w, h * 0.37);
    g.moveTo(w * 0.62, 0);
    g.lineTo(w * 0.62, h);
    g.stroke();
  };
}
function brickWall(g, w, h) {
  g.fillStyle = '#c9b9a3';
  g.fillRect(0, 0, w, h);
  const r = rng(11);
  const bh = h / 16;
  const bw = w / 6;
  for (let row = 0; row < 16; row++)
    for (let k = -1; k < 7; k++) {
      const x = k * bw + (row % 2 ? bw / 2 : 0);
      const v = r();
      g.fillStyle = `rgb(${158 + v * 45},${64 + v * 25},${44 + v * 18})`;
      g.fillRect(x + 2, row * bh + 2, bw - 4, bh - 4);
    }
}
/** A building's face in a cell of the atlas: a colour, rows of windows with sills and balconies' shadows. */
function facade(g, x0, y0, w, h, color, seed, floors, cols) {
  const r = rng(seed);
  g.fillStyle = color;
  g.fillRect(x0, y0, w, h);
  const fh = h / floors;
  const cw = w / cols;
  for (let f = 0; f < floors; f++)
    for (let c = 0; c < cols; c++) {
      const lit = r();
      const x = x0 + c * cw;
      const y = y0 + f * fh;
      g.fillStyle = lit > 0.82 ? '#ffe2a0' : lit > 0.4 ? '#34495e' : '#56708a';
      g.fillRect(x + cw * 0.2, y + fh * 0.22, cw * 0.6, fh * 0.5);
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.fillRect(x + cw * 0.12, y + fh * 0.76, cw * 0.76, fh * 0.07);
      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.fillRect(x + cw * 0.2, y + fh * 0.22, cw * 0.6, 2);
    }
}

/** The sky: a gradient behind everything. */
export function skyTexture() {
  return canvasTexture(4, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1f7fd6');
    grad.addColorStop(0.55, '#7cc2f2');
    grad.addColorStop(0.85, '#cfeafb');
    grad.addColorStop(1, '#f4e3c4');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

/** A geometry with one colour in its vertices (for the shared vertex-coloured materials). */
const _c = new THREE.Color();
function tint(geo, color) {
  _c.set(color);
  const n = geo.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    a[i * 3] = _c.r;
    a[i * 3 + 1] = _c.g;
    a[i * 3 + 2] = _c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}
const boxGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const box = (w, h, d, mat) => new THREE.Mesh(boxGeo(w, h, d), mat);
/** A box (or any geometry) in a vertex colour, with one of the shared materials. */
const coloured = (geo, color, mat) => new THREE.Mesh(tint(geo, color), mat);

export function createSite() {
  const root = new THREE.Group();
  root.name = 'Site';
  const r = rng(5);
  // shared materials: colours live in the vertices
  const matte = new THREE.MeshLambertMaterial({ name: 'SiteMatte', vertexColors: true }); // far away: houses' roofs, trees, street
  const roofMatte = new THREE.MeshStandardMaterial({ name: 'RoofMatte', vertexColors: true, roughness: 0.88 }); // props on the roof
  const metal = new THREE.MeshStandardMaterial({ name: 'PaintedMetal', vertexColors: true, roughness: 0.42, metalness: 0.45 });

  const slabMat = new THREE.MeshStandardMaterial({
    name: 'RoofSlab',
    map: canvasTexture(512, 512, concrete(1, [150, 144, 132], { seams: 2 }), [3, 3]),
    roughness: 0.93,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    name: 'Concrete',
    map: canvasTexture(256, 256, concrete(2, [146, 142, 134]), [4, 1]),
    roughness: 0.9,
  });
  const stripePaint = (g, w, h) => {
    g.fillStyle = '#ffc61a';
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
  };
  const stripe = new THREE.MeshStandardMaterial({ name: 'EdgeStripe', map: canvasTexture(128, 16, stripePaint, [12, 1]), roughness: 0.6 });
  const stripeSideMap = stripe.map.clone(); // the same picture (one upload), repeated more along the longer side
  stripeSideMap.repeat.set(30, 1);
  const stripeSide = new THREE.MeshStandardMaterial({ name: 'EdgeStripeSide', map: stripeSideMap, roughness: 0.6 });

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
  const edgeRight = box(0.08, 0.06, Z1 - Z0, stripeSide);
  edgeRight.position.set(X1 - 0.04, 0.03, (Z0 + Z1) / 2);
  edgeFront.receiveShadow = edgeRight.receiveShadow = true;
  root.add(edgeFront, edgeRight);
  const barGeo = new THREE.CylinderGeometry(0.009, 0.009, 1.1, 6);
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
    col.receiveShadow = true;
    root.add(col);
    for (const dx of [-0.1, 0.1])
      for (const dz of [-0.1, 0.1]) {
        const bar = coloured(barGeo.clone(), '#8a4b2a', metal);
        bar.position.set(x + dx, 0.95, z + dz);
        bar.rotation.z = (r() - 0.5) * 0.12;
        root.add(bar);
      }
  }
  // cement bags (a green band on each) and two drums on the roof, behind the winch
  for (let i = 0; i < 9; i++) {
    const layer = Math.floor(i / 3);
    const at = new THREE.Vector3(-2.4 + (i % 3) * 0.58 + (layer % 2) * 0.1, 0.065 + layer * 0.13, -1.7);
    const turn = (r() - 0.5) * 0.15;
    const bag = coloured(boxGeo(0.55, 0.13, 0.36), '#e2dccb', roofMatte);
    const band = coloured(boxGeo(0.56, 0.135, 0.06), '#2f9e44', roofMatte);
    for (const m of [bag, band]) {
      m.position.copy(at);
      m.rotation.y = turn;
      m.receiveShadow = true;
      root.add(m);
    }
  }
  for (const [x, z, color] of [
    [-0.6, -2.4, '#1971c2'],
    [-0.05, -2.6, '#e8590c'],
  ]) {
    const drum = coloured(new THREE.CylinderGeometry(0.28, 0.28, 0.85, 28), color, metal);
    drum.position.set(/** @type {number} */ (x), 0.425, /** @type {number} */ (z));
    drum.receiveShadow = true;
    root.add(drum);
    // two rolling hoops
    for (const y of [0.25, 0.6]) {
      const hoop = coloured(new THREE.TorusGeometry(0.283, 0.012, 6, 28), color, metal);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(/** @type {number} */ (x), y, /** @type {number} */ (z));
      root.add(hoop);
    }
  }

  // ── the floors below: slab edges every 3.33 m, brick walls between, dark window openings ──
  for (let f = 1; f <= 3; f++) {
    const y = -f * 3.333;
    const front = box(X1 - X0, 0.25, 0.04, edgeMat);
    front.position.set((X0 + X1) / 2, y + 0.125 + 3.333 - 0.25, Z1 + 0.01);
    root.add(front);
  }
  const brickFront = new THREE.MeshStandardMaterial({ name: 'BrickFront', map: canvasTexture(256, 256, brickWall, [12, 10]), roughness: 0.95 });
  const brickSideMap = brickFront.map.clone();
  brickSideMap.repeat.set(8, 10);
  const brickSide = new THREE.MeshStandardMaterial({ name: 'BrickSide', map: brickSideMap, roughness: 0.95 });
  const wallFront = box(X1 - X0, 10, 0.2, brickFront);
  wallFront.position.set((X0 + X1) / 2, -5.13, Z1 - 0.12);
  const wallRight = box(0.2, 10, Z1 - Z0, brickSide);
  wallRight.position.set(X1 - 0.12, -5.13, (Z0 + Z1) / 2);
  root.add(wallFront, wallRight);
  for (let f = 0; f < 3; f++)
    for (let k = 0; k < 4; k++) {
      const win = coloured(boxGeo(1.0, 1.2, 0.05), '#2a2f36', matte);
      win.position.set(X0 + 0.9 + k * 1.8, -1.9 - f * 3.333, Z1 + 0.0);
      const winR = coloured(boxGeo(0.05, 1.2, 1.0), '#2a2f36', matte);
      winR.position.set(X1 + 0.0, -1.9 - f * 3.333, Z0 + 1.1 + k * 1.8);
      root.add(win, winR);
    }
  // scaffolding on the front: blue tubes, wooden planks, a safety net
  const netMat = new THREE.MeshStandardMaterial({
    name: 'SafetyNet',
    map: canvasTexture(
      64,
      64,
      (g, w, h) => {
        g.fillStyle = 'rgba(47,140,90,0.5)';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(20,80,50,0.9)';
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
      const post = coloured(new THREE.CylinderGeometry(0.024, 0.024, 9.5, 8), '#3d9be9', metal);
      post.position.set(x, -5.3, z);
      root.add(post);
    }
  }
  for (let f = 0; f < 3; f++) {
    const y = -0.9 - f * 3.333;
    for (const z of [Z1 + 0.15, SZ]) {
      const ledger = coloured(new THREE.CylinderGeometry(0.022, 0.022, X1 - X0 - 1, 8), '#3d9be9', metal);
      ledger.rotation.z = Math.PI / 2;
      ledger.position.set((X0 + X1) / 2 - 0.4, y, z);
      root.add(ledger);
    }
    const plank = coloured(boxGeo(X1 - X0 - 1, 0.04, 0.55), '#c99a56', roofMatte);
    plank.position.set((X0 + X1) / 2 - 0.4, y - 0.05, (Z1 + 0.15 + SZ) / 2);
    root.add(plank);
  }
  const net = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0 - 1, 9), netMat);
  net.position.set((X0 + X1) / 2 - 0.4, -5.6, SZ + 0.04);
  root.add(net);

  // ── the street far below: earth, a road with its markings, sand, bricks, a mixer, a truck ──
  const groundMat = new THREE.MeshLambertMaterial({ name: 'Ground', map: canvasTexture(512, 512, concrete(3, [192, 152, 104]), [20, 20]) });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -10.3, -20);
  root.add(ground);
  const road = coloured(new THREE.PlaneGeometry(9, 260), '#555860', matte);
  road.rotation.x = -Math.PI / 2;
  road.position.set(9, -10.28, -20);
  root.add(road);
  for (let z = -120; z < 120; z += 6) {
    const dash = coloured(new THREE.PlaneGeometry(0.18, 2.6), '#f1f3f5', matte);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(9, -10.27, z);
    root.add(dash);
  }
  const sand = coloured(new THREE.ConeGeometry(1.6, 1.1, 24), '#dcae58', matte);
  sand.position.set(2.6, -9.75, -2.5);
  root.add(sand);
  for (let i = 0; i < 4; i++) {
    const s = coloured(boxGeo(1.0, 0.7, 0.8), '#b5452b', matte);
    s.position.set(2.2 + (i % 2) * 1.1, -9.95, -5.5 - Math.floor(i / 2) * 0.95);
    root.add(s);
  }
  // the mixer: an orange drum on a frame
  const mixDrum = coloured(new THREE.CylinderGeometry(0.35, 0.55, 1.0, 20), '#fd7e14', metal);
  mixDrum.rotation.z = 1.0;
  mixDrum.position.set(4.6, -10.3 + 0.95, -1);
  const mixFrame = coloured(boxGeo(1.2, 0.5, 0.7), '#343a40', metal);
  mixFrame.position.set(4.6, -10.3 + 0.25, -1);
  root.add(mixDrum, mixFrame);
  // the truck: a blue cab, its windscreen, a yellow tipper, black wheels
  const truck = new THREE.Group();
  const cab = coloured(boxGeo(2.0, 1.9, 2.3), '#1c7ed6', metal);
  cab.position.set(0, 1.45, 2.4);
  const glass = coloured(boxGeo(1.8, 0.7, 0.05), '#a5d8ff', metal);
  glass.position.set(0, 1.9, 3.56);
  const tipper = coloured(boxGeo(2.3, 1.3, 4.2), '#fab005', metal);
  tipper.position.set(0, 1.55, -0.9);
  truck.add(cab, glass, tipper);
  for (const z of [2.4, -0.4, -2.0])
    for (const x of [-1.05, 1.05]) {
      const w = coloured(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 18), '#212529', matte);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.5, z);
      truck.add(w);
    }
  truck.position.set(8.2, -10.3, -9);
  truck.rotation.y = 0.15;
  root.add(truck);

  // ── around: Dhaka's colourful houses (one atlas for their faces), trees, the tower crane, clouds ──
  const COLORS = ['#e89aa6', '#f2c14e', '#7fb2dc', '#e98a5a', '#b79ad9', '#f4a259', '#d9727c', '#8fa8cc', '#e6b98a', '#ef8f6f', '#a99ad8', '#f0cf6a'];
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
  // the atlas: 4 × 3 cells of 256 × 341 px, one house's face in each
  const CELL = { cols: 4, rows: 3 };
  const cw = 1024 / CELL.cols;
  const ch = 1024 / CELL.rows;
  const atlas = canvasTexture(1024, 1024, (g) => {
    place.forEach(([, , , h], i) => {
      const cx = (i % CELL.cols) * cw;
      const cy = Math.floor(i / CELL.cols) * ch;
      facade(g, cx, cy, cw, ch, COLORS[i % COLORS.length], 20 + i, Math.round(h / 3.2), 5);
    });
  });
  atlas.wrapS = atlas.wrapT = THREE.ClampToEdgeWrapping;
  const houseMat = new THREE.MeshLambertMaterial({ name: 'Houses', map: atlas });
  place.forEach(([x, z, w, h, d], i) => {
    const geo = boxGeo(w, h, d);
    // this house's cell of the atlas (a little inset, so a neighbour's colour never bleeds in)
    const u0 = ((i % CELL.cols) * cw + 2) / 1024;
    const u1 = ((i % CELL.cols) * cw + cw - 2) / 1024;
    const v1 = 1 - (Math.floor(i / CELL.cols) * ch + 2) / 1024;
    const v0 = 1 - (Math.floor(i / CELL.cols) * ch + ch - 2) / 1024;
    const uv = geo.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * (u1 - u0), v0 + uv.getY(k) * (v1 - v0));
    const b = new THREE.Mesh(geo, houseMat);
    b.position.set(x, -10.3 + h / 2, z);
    root.add(b);
    const roof = coloured(boxGeo(w + 0.3, 0.4, d + 0.3), '#bdb6a8', matte);
    roof.position.set(x, -10.3 + h + 0.2, z);
    const tank = coloured(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 14), i % 2 ? '#212529' : '#1971c2', matte);
    tank.position.set(x + w * 0.25, -10.3 + h + 1, z + d * 0.2);
    root.add(roof, tank);
  });
  const LEAF = ['#2f9e44', '#37b24d', '#5c940d'];
  for (let i = 0; i < 16; i++) {
    const x = 13 + (i % 2) * 1.5 + (r() - 0.5);
    const z = 18 - i * 8 + r() * 2;
    const trunk = coloured(new THREE.CylinderGeometry(0.18, 0.25, 3, 8), '#7a5230', matte);
    trunk.position.set(x, -8.8, z);
    const crown = coloured(new THREE.IcosahedronGeometry(1.8 + r() * 0.8, 1), LEAF[i % 3], matte);
    crown.position.set(x, -6.4, z);
    root.add(trunk, crown);
  }
  // the tower crane: a yellow lattice mast, a long jib, a counterweight, a red cab
  const lattice = (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#fcc419';
    g.lineWidth = 7;
    g.strokeRect(3, 3, w - 6, h - 6);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(w, h);
    g.stroke();
  };
  const latticeMat = (repeat) =>
    new THREE.MeshLambertMaterial({
      name: 'CraneLattice',
      map: canvasTexture(64, 64, lattice, repeat),
      transparent: true,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
    });
  const crane = new THREE.Group();
  const mast = box(1.6, 44, 1.6, latticeMat([1, 14]));
  mast.position.y = 22;
  const jibArm = box(40, 1.4, 1.4, latticeMat([20, 1]));
  jibArm.position.set(10, 44.8, 0);
  const cabin = coloured(boxGeo(2, 2, 2), '#e03131', matte);
  cabin.position.set(-1.6, 43, 0);
  const weight = coloured(boxGeo(4, 2.2, 2), '#868e96', matte);
  weight.position.set(-8, 44.6, 0);
  const cable = coloured(new THREE.CylinderGeometry(0.04, 0.04, 20, 4), '#343a40', matte);
  cable.position.set(22, 34.5, 0);
  crane.add(mast, jibArm, cabin, weight, cable);
  crane.position.set(-24, -10.3, -48);
  crane.rotation.y = -0.5;
  root.add(crane);

  // clouds: four soft shapes in one texture, six quads in one mesh, facing the camera's side of the world
  const cloudTex = canvasTexture(512, 256, (g, w, h) => {
    for (let k = 0; k < 4; k++) {
      const r2 = rng(40 + k);
      const ox = (k % 2) * (w / 2);
      const oy = Math.floor(k / 2) * (h / 2);
      for (let i = 0; i < 14; i++) {
        const x = ox + (w / 2) * (0.2 + r2() * 0.6);
        const y = oy + (h / 2) * (0.45 + r2() * 0.25);
        const rad = 20 + r2() * 36;
        const grad = g.createRadialGradient(x, y, 0, x, y, rad);
        grad.addColorStop(0, 'rgba(255,255,255,0.95)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad;
        g.fillRect(ox, oy, w / 2, h / 2);
      }
    }
  });
  cloudTex.wrapS = cloudTex.wrapT = THREE.ClampToEdgeWrapping;
  const quads = [];
  for (let i = 0; i < 6; i++) {
    const q = new THREE.PlaneGeometry(1, 1);
    const k = i % 4;
    const uv = q.attributes.uv;
    for (let j = 0; j < uv.count; j++) uv.setXY(j, ((k % 2) + uv.getX(j)) / 2, (1 - Math.floor(k / 2) + uv.getY(j)) / 2);
    q.scale(26 + r() * 18, 12 + r() * 6, 1);
    q.translate(-80 + i * 32 + r() * 10, 26 + r() * 22, -110 - r() * 30);
    quads.push(q);
  }
  const clouds = new THREE.Mesh(
    mergeQuads(quads),
    new THREE.MeshBasicMaterial({ name: 'Clouds', map: cloudTex, transparent: true, depthWrite: false, fog: false }),
  );
  clouds.name = 'Clouds';

  bake(root);
  root.add(clouds);
  return root;
}

/** The clouds' quads as one geometry. */
function mergeQuads(list) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (const q of list) {
    const base = pos.length / 3;
    pos.push(...q.attributes.position.array);
    uv.push(...q.attributes.uv.array);
    for (const i of /** @type {THREE.BufferAttribute} */ (q.index).array) idx.push(base + i);
    q.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}
