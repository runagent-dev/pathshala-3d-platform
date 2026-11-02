// Where the winch works: the roof of a building, 10 m above the ground. A concrete roof slab with a yellow-and-black
// edge, the brick walls and floor slabs of the floors under it, plain earth far below and a soft sky: nothing else
// (no houses, crane, trees, clouds, bags or drums), so the winch is the one thing to look at. Metres; the roof's top
// is y = 0, the ground y = −10. Everything stands still, so it is merged into one mesh per material (./bake.js).
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

/** The sky: a gradient behind everything. */
export function skyTexture() {
  return canvasTexture(4, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#87aed3');
    grad.addColorStop(0.55, '#b4cfe6');
    grad.addColorStop(0.85, '#dfe8ef');
    grad.addColorStop(1, '#efe5d6');
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
  // shared materials: colours live in the vertices
  const matte = new THREE.MeshLambertMaterial({ name: 'SiteMatte', vertexColors: true }); // far away: houses' roofs, trees, street

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

  // ── the roof slab (y = 0 on top) and its painted edge ──
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
  // ── the ground far below: plain earth ──
  const groundMat = new THREE.MeshLambertMaterial({ name: 'Ground', map: canvasTexture(512, 512, concrete(3, [192, 152, 104]), [20, 20]) });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -10.3, -20);
  root.add(ground);
  bake(root);
  return root;
}
