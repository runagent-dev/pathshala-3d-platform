// The ground: a village yard of soft red clay after rain (metres; y up, the clay's surface at y = 0 before anyone
// stands on it). The clay in front of the two feet is dug away along z = 0, the line through the middle of both soles,
// so its cut face shows the layers of clay: they dip under each shoe, deep and narrow under the heel, shallow and wide
// under the sneaker. Behind: the red yard with a puddle, a turquoise wall with a yellow band, a blue wooden door,
// magenta bougainvillea over the wall, clay pots of marigolds, a blue sky. The clay gives way where a sole presses
// (setDepth): its surface (a fine grid near the feet) and the layers on the cut face move by fields worked out once
// for each foot, scaled by how deep that foot is in.
import * as THREE from 'three';

const PIT = { x: 0.62, z: 0.62, depth: 0.34 }; // the dug-away part in front: |x| < 0.62, 0 < z < 0.62
// the layers on the cut face, from the top: [depth of the bottom of the layer (m), colour]: a red-brown topsoil over
// layers of ochre, buff and grey clay (red clay country, as in Madhupur), with thin pale streaks that show the bending
const LAYERS = [
  [0.014, '#8c3a22'],
  [0.019, '#f1d9a8'],
  [0.038, '#b8662f'],
  [0.043, '#f3dfb4'],
  [0.066, '#cf8a3f'],
  [0.071, '#f6e6c2'],
  [0.098, '#b9a596'],
  [0.103, '#f2e2c4'],
  [0.138, '#c98840'],
  [0.144, '#f0dcb2'],
  [0.19, '#9f9a95'],
  [0.197, '#ead6ae'],
  [1, '#a8693a'],
];

const smoothstep = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Unit depth of the clay at a signed distance from a footprint's edge: −1 inside, a small rim pushed up outside. */
function unitDepth(sdf) {
  const inside = 1 - smoothstep(-0.003, 0.0055, sdf);
  const rim = sdf > 0 ? Math.exp(-(((sdf - 0.015) / 0.011) ** 2)) : 0;
  return -inside + 0.1 * rim * (1 - inside);
}

/** Coordinates along one axis: fine (step `fine`) between a and b, coarser (growing) out to the ends. */
function axis(lo, a, b, hi, fine, coarse) {
  const out = [];
  let x = lo;
  let step = coarse;
  while (x < a - 1e-9) {
    out.push(x);
    const left = a - x;
    step = Math.min(coarse, Math.max(fine, left * 0.25));
    x += step;
  }
  for (x = a; x < b - 1e-9; x += fine) out.push(x);
  x = b;
  while (x < hi + 1e-9) {
    out.push(x);
    step = Math.min(coarse, Math.max(fine, (x - b) * 0.25 + fine));
    x += step;
  }
  if (out[out.length - 1] < hi) out.push(hi);
  return out;
}

function canvasTexture(w, h, draw, repeat = null) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.anisotropy = 8;
  return tex;
}

/** A seeded random number generator, so the yard looks the same every time. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The clay's fine grain: a soft noise around white, multiplied with the clay's colours. */
function grainTexture(seed = 7) {
  const rand = rng(seed);
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const v = 205 + Math.floor(rand() * 50);
        ctx.fillStyle = `rgb(${v},${v - 4},${v - 12})`;
        ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 1.4, 1 + rand() * 1.4);
      }
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = rand() < 0.5 ? 'rgba(255,235,215,0.7)' : 'rgba(70,25,10,0.4)';
        ctx.fillRect(rand() * w, rand() * h, 1.5, 1.5);
      }
    },
    [1, 1],
  );
}

/** A copy of a mesh with only the triangles whose corners all pass keep(x, y, z), its vertices packed. */
function crop(mesh, keep) {
  const g = mesh.geometry;
  const pos = g.attributes.position;
  const index = g.index.array;
  const map = new Int32Array(pos.count).fill(-1);
  const out = [];
  let n = 0;
  for (let i = 0; i < index.length; i += 3) {
    const tri = [index[i], index[i + 1], index[i + 2]];
    if (!tri.every((v) => keep(pos.getX(v), pos.getY(v), pos.getZ(v)))) continue;
    for (const v of tri) {
      if (map[v] < 0) map[v] = n++;
      out.push(map[v]);
    }
  }
  const copy = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(g.attributes)) {
    const size = attr.itemSize;
    const arr = new Float32Array(n * size);
    for (let v = 0; v < pos.count; v++) if (map[v] >= 0) for (let c = 0; c < size; c++) arr[map[v] * size + c] = attr.array[v * size + c];
    copy.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  copy.setIndex(out);
  const m = new THREE.Mesh(copy, mesh.material);
  m.name = mesh.name;
  return m;
}

/**
 * feet: [{ x (where the foot's frame is along the yard), footprint: { sdf, box } }]. Returns { root, setDepth(i, d),
 * setDepths(list), depth(i), near() }.
 */
export function createGround(feet) {
  const root = new THREE.Group();
  root.name = 'ClayYard';
  const grain = grainTexture();
  const tmpC = new THREE.Color();

  // ── the surface of the clay behind the cut (z ≤ 0): fine near the feet ──
  const xs = [...new Set([...axis(-7, -0.44, 0.44, 7, 0.003, 0.5), -PIT.x, PIT.x])].sort((a, b) => a - b);
  const zs = axis(-9, -0.13, 0, 0, 0.003, 0.6);
  const nx = xs.length;
  const nz = zs.length;
  const count = nx * nz;
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const col = new Float32Array(count * 3);
  const base = new Float32Array(count * 3); // the clay's own colour (a little drier, lighter, further back)
  const wet = new THREE.Color('#953b22');
  const dry = new THREE.Color('#aa4a2a');
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const x = xs[i];
      const z = zs[j];
      // gentle bumps far from the feet (old footprints, puddle edges), smooth near them
      const far = smoothstep(0.5, 1.6, Math.hypot(x, z));
      const y = far * (0.005 * Math.sin(x * 4.3 + z * 2.1) + 0.004 * Math.sin(z * 6.7 - x * 1.3));
      pos.set([x, y, z], k * 3);
      uv.set([x * 3.2, z * 3.2], k * 2);
      // darker wet patches here and there, a little drier (lighter) further back
      const patch = 0.5 + 0.5 * Math.sin(x * 5.1 + Math.sin(z * 3.3) * 2) * Math.sin(z * 4.3 - x * 1.7);
      tmpC.copy(wet).lerp(dry, smoothstep(-0.8, -3.5, z) * 0.7 + 0.3 * patch);
      base.set([tmpC.r, tmpC.g, tmpC.b], k * 3);
      col.set([tmpC.r, tmpC.g, tmpC.b], k * 3);
    }
  const idx = [];
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1);
    }
  const topGeo = new THREE.BufferGeometry();
  topGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  topGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  topGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  topGeo.setIndex(idx);
  topGeo.computeVertexNormals();
  // wet clay has a soft sheen
  const clayMat = new THREE.MeshStandardMaterial({ map: grain, vertexColors: true, roughness: 0.5 });
  const top = new THREE.Mesh(topGeo, clayMat);
  top.name = 'ClaySurface';
  top.receiveShadow = true;
  root.add(top);
  const restY = Float32Array.from({ length: count }, (_, k) => pos[k * 3 + 1]);

  // each foot's field on the surface: the unit depth at every vertex near it
  const fields = feet.map((f) => {
    const list = [];
    const { box } = f.footprint;
    for (let j = 0; j < nz; j++) {
      const z = zs[j];
      if (Math.abs(z) > box.z + 0.03) continue;
      for (let i = 0; i < nx; i++) {
        const lx = xs[i] - f.x;
        if (lx < box.x0 - 0.03 || lx > box.x1 + 0.03) continue;
        const u = unitDepth(f.footprint.sdf(lx, z));
        if (Math.abs(u) > 1e-4) list.push(j * nx + i, u);
      }
    }
    return Float32Array.from(list);
  });

  // ── the cut face (z = 0): the layers of clay, moved down under the feet, fading with depth ──
  const fx = xs.filter((x) => x >= -PIT.x - 1e-9 && x <= PIT.x + 1e-9);
  const hs = [];
  for (let h = 0; h <= PIT.depth + 1e-9; h += 0.004) hs.push(h);
  for (const [d] of LAYERS) if (d < PIT.depth) hs.push(d - 0.0006, d + 0.0006);
  hs.sort((a, b) => a - b);
  const fnx = fx.length;
  const fnh = hs.length;
  const fpos = new Float32Array(fnx * fnh * 3);
  const fuv = new Float32Array(fnx * fnh * 2);
  const fcol = new Float32Array(fnx * fnh * 3);
  const layerAt = (h) => LAYERS.find(([d]) => h < d)?.[1] ?? LAYERS[LAYERS.length - 1][1];
  for (let j = 0; j < fnh; j++) {
    tmpC.set(layerAt(hs[j]));
    for (let i = 0; i < fnx; i++) {
      const k = j * fnx + i;
      fpos.set([fx[i], -hs[j], 0], k * 3);
      fuv.set([fx[i] * 3.2, -hs[j] * 3.2], k * 2);
      fcol.set([tmpC.r, tmpC.g, tmpC.b], k * 3);
    }
  }
  const fidx = [];
  for (let j = 0; j < fnh - 1; j++)
    for (let i = 0; i < fnx - 1; i++) {
      const a = j * fnx + i;
      fidx.push(a, a + fnx, a + 1, a + 1, a + fnx, a + fnx + 1);
    }
  const fbase = Float32Array.from(fcol);
  const faceGeo = new THREE.BufferGeometry();
  faceGeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  faceGeo.setAttribute('uv', new THREE.BufferAttribute(fuv, 2));
  faceGeo.setAttribute('color', new THREE.BufferAttribute(fcol, 3));
  faceGeo.setIndex(fidx);
  faceGeo.computeVertexNormals();
  const faceMat = new THREE.MeshStandardMaterial({ map: grain, vertexColors: true, roughness: 0.85 });
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.name = 'CutFace';
  face.receiveShadow = true;
  root.add(face);
  // each foot's field on the face: the surface's dip along z = 0, spread wider and weaker with depth
  const faceFields = feet.map((f) => {
    const prof = fx.map((x) => unitDepth(f.footprint.sdf(x - f.x, 0)));
    const out = new Float32Array(fnx * fnh);
    for (let j = 0; j < fnh; j++) {
      const h = hs[j];
      const sigma = 0.0012 + 0.42 * h;
      const fade = Math.exp(-h / 0.17);
      for (let i = 0; i < fnx; i++) {
        if (h < 1e-6) {
          out[j * fnx + i] = prof[i];
          continue;
        }
        let sum = 0;
        let wsum = 0;
        for (let m = 0; m < fnx; m++) {
          const dx = fx[m] - fx[i];
          if (Math.abs(dx) > 3 * sigma) continue;
          const wgt = Math.exp(-0.5 * (dx / sigma) ** 2) * (m > 0 && m < fnx - 1 ? (fx[m + 1] - fx[m - 1]) / 2 : 0.003);
          sum += prof[m] * wgt;
          wsum += wgt;
        }
        out[j * fnx + i] = wsum > 0 ? (sum / wsum) * fade : 0;
      }
    }
    return out;
  });

  // ── the pit: its floor and its two side walls; the yard in front of it and beside it ──
  const pitMat = new THREE.MeshStandardMaterial({ map: grain, color: '#8f6a4a', roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(PIT.x * 2, PIT.z), pitMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -PIT.depth, PIT.z / 2);
  floor.receiveShadow = true;
  floor.name = 'PitFloor';
  root.add(floor);
  for (const sx of [-1, 1]) {
    const g = new THREE.PlaneGeometry(PIT.z, PIT.depth, 1, 40);
    const c = new Float32Array(g.attributes.position.count * 3);
    for (let k = 0; k < g.attributes.position.count; k++) {
      tmpC.set(layerAt(PIT.depth / 2 - g.attributes.position.getY(k)));
      c.set([tmpC.r * 0.92, tmpC.g * 0.92, tmpC.b * 0.92], k * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    const wall = new THREE.Mesh(g, faceMat);
    wall.rotation.y = -sx * (Math.PI / 2);
    wall.position.set(sx * PIT.x, -PIT.depth / 2, PIT.z / 2);
    wall.name = 'PitWall';
    wall.receiveShadow = true;
    root.add(wall);
  }
  const groundMat = new THREE.MeshStandardMaterial({ map: grain, color: '#953b22', roughness: 0.5 });
  const addGround = (x0, x1, z0, z1) => {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    const uvs = g.attributes.uv;
    for (let k = 0; k < uvs.count; k++) uvs.setXY(k, (uvs.getX(k) * (x1 - x0) + x0) * 3.2, (uvs.getY(k) * (z1 - z0) + z0) * 3.2);
    const m = new THREE.Mesh(g, groundMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    m.receiveShadow = true;
    m.name = 'Yard';
    root.add(m);
  };
  addGround(-7, -PIT.x, 0, PIT.z);
  addGround(PIT.x, 7, 0, PIT.z);
  addGround(-7, 7, PIT.z, 6);

  // ── behind: a puddle, a turquoise wall with a yellow band, a blue door, bougainvillea, pots of marigolds ──
  const far = new THREE.Group();
  far.name = 'Yard';
  far.userData.noExport = true;
  const mat = (color, roughness = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const farClay = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), mat('#a84a2a', 0.6));
  farClay.rotation.x = -Math.PI / 2;
  farClay.position.set(0, -0.01, -9 - 15 + 0.01);
  far.add(farClay);
  // a puddle from the rain, the sky in it
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat('#5a8fd6', 0.06, { metalness: 0.2 }));
  puddle.rotation.x = -Math.PI / 2;
  puddle.scale.set(0.7, 0.32, 1);
  puddle.position.set(0.95, 0.006, -1.9);
  far.add(puddle);
  // the wall: turquoise plaster, a yellow band along the top, a terracotta coping
  const WALL = { z: -3.6, h: 1.7 };
  const wallTex = canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#16a2b5';
    ctx.fillRect(0, 0, w, h);
    const rand = rng(3);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,40,60,0.07)';
      ctx.fillRect(rand() * w, rand() * h, 3 + rand() * 6, 2 + rand() * 4);
    }
    // a splash of red clay along the bottom (the rain)
    const g = ctx.createLinearGradient(0, h, 0, h * 0.78);
    g.addColorStop(0, 'rgba(150,55,25,0.75)');
    g.addColorStop(1, 'rgba(150,55,25,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
  });
  wallTex.wrapS = THREE.RepeatWrapping;
  wallTex.repeat.set(4, 1);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, WALL.h, 0.25), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 }));
  wall.position.set(0, WALL.h / 2, WALL.z);
  far.add(wall);
  const band = new THREE.Mesh(new THREE.BoxGeometry(16, 0.16, 0.27), mat('#ffc21a', 0.7));
  band.position.set(0, WALL.h - 0.2, WALL.z);
  far.add(band);
  const coping = new THREE.Mesh(new THREE.BoxGeometry(16.1, 0.08, 0.34), mat('#b5452a', 0.8));
  coping.position.set(0, WALL.h + 0.04, WALL.z);
  far.add(coping);
  // a blue wooden door with an arch-shaped top panel in orange
  const door = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.45, 0.06), mat('#1c4fc4', 0.55));
  leaf.position.y = 0.725;
  door.add(leaf);
  for (const dx of [-0.25, 0.25]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.9, 0.02), mat('#2f6ae6', 0.5));
    panel.position.set(dx, 0.62, 0.04);
    door.add(panel);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.08), mat('#f76707', 0.6));
  lintel.position.set(0, 1.5, 0.01);
  door.add(lintel);
  door.position.set(-1.7, 0, WALL.z + 0.13);
  far.add(door);
  // bougainvillea over the wall: magenta and pink clusters on dark stems
  const rand = rng(11);
  const petal = [mat('#d6197a', 0.7), mat('#f0459a', 0.7), mat('#b5179e', 0.7)];
  const stem = mat('#5c3320', 0.9);
  const vine = (cx, spread, n) => {
    for (let i = 0; i < 3; i++) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.3), stem);
      st.position.set(cx - spread * 0.3 + i * spread * 0.3, WALL.h - 0.3, WALL.z + 0.2);
      st.rotation.z = (i - 1) * 0.35;
      far.add(st);
    }
    for (let i = 0; i < n; i++) {
      const r = 0.12 + rand() * 0.16;
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), petal[i % 3]);
      const a = rand() * Math.PI;
      blob.position.set(
        cx + Math.cos(a) * spread * rand(),
        WALL.h - 0.25 + Math.sin(a) * 0.5 * rand() + rand() * 0.35,
        WALL.z + 0.12 + rand() * 0.25,
      );
      blob.scale.y = 0.75;
      far.add(blob);
    }
  };
  vine(1.4, 1.1, 26);
  vine(-4.2, 0.9, 18);
  vine(4.6, 0.8, 14);
  // glazed pots of orange and yellow marigolds at the foot of the wall: cobalt, yellow, white with blue
  const potMats = [mat('#1d4fc4', 0.25), mat('#ffc21a', 0.3), mat('#1d4fc4', 0.25), mat('#f4efe6', 0.3)];
  let potN = 0;
  const flowers = [mat('#ff8c00', 0.6), mat('#ffb703', 0.6), mat('#f76707', 0.6)];
  const pot = (x, s) => {
    const potMat = potMats[potN++ % potMats.length];
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.36, 24), potMat);
    body.position.y = 0.18;
    g.add(body);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 24), potMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.36;
    g.add(rim);
    for (let i = 0; i < 9; i++) {
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07 + rand() * 0.03, 1), flowers[i % 3]);
      const a = (i / 9) * Math.PI * 2;
      const r = i === 0 ? 0 : 0.12;
      f.position.set(Math.cos(a) * r, 0.44 + rand() * 0.08, Math.sin(a) * r);
      g.add(f);
    }
    g.position.set(x, 0, WALL.z + 0.45);
    g.scale.setScalar(s);
    far.add(g);
  };
  pot(-0.6, 1);
  pot(-0.05, 0.85);
  pot(2.8, 1.1);
  pot(-3.2, 0.95);
  // a few pebbles near the feet
  const pebbleMat = [mat('#8d7b6a', 0.7), mat('#d9c6a5', 0.6), mat('#5c4a3d', 0.7)];
  const near = new THREE.Group();
  near.name = 'Pebbles';
  const r2 = rng(5);
  for (let i = 0; i < 18; i++) {
    const x = -0.9 + r2() * 1.8;
    const z = -0.2 - r2() * 1.2;
    if (Math.abs(x) < 0.38 && z > -0.2) continue;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.005 + r2() * 0.007, 1), pebbleMat[i % 3]);
    m.position.set(x, 0.001, z);
    m.rotation.set(r2(), r2() * 6, 0);
    m.scale.y = 0.6;
    m.castShadow = true;
    near.add(m);
  }
  root.add(near);
  root.add(far);

  // ── the clay gives way ──
  const depths = feet.map(() => 0);
  const shade = new THREE.Color('#5e2412'); // pressed clay is darker (wetter and packed)
  const packed = new THREE.Color('#5a3a26');
  function apply() {
    const p = topGeo.attributes.position;
    const c = topGeo.attributes.color;
    const arr = /** @type {Float32Array} */ (p.array);
    const carr = /** @type {Float32Array} */ (c.array);
    // back to rest near the feet
    for (const field of fields)
      for (let n = 0; n < field.length; n += 2) {
        const k = field[n];
        arr[k * 3 + 1] = restY[k];
        carr[k * 3] = base[k * 3];
        carr[k * 3 + 1] = base[k * 3 + 1];
        carr[k * 3 + 2] = base[k * 3 + 2];
      }
    fields.forEach((field, f) => {
      const d = depths[f];
      if (d <= 0) return;
      for (let n = 0; n < field.length; n += 2) {
        const k = field[n];
        const u = field[n + 1];
        arr[k * 3 + 1] += u * d;
        if (u < 0) {
          const w = Math.min(1, -u) * Math.min(1, d / 0.02) * 0.45;
          carr[k * 3] += (shade.r - carr[k * 3]) * w;
          carr[k * 3 + 1] += (shade.g - carr[k * 3 + 1]) * w;
          carr[k * 3 + 2] += (shade.b - carr[k * 3 + 2]) * w;
        }
      }
    });
    p.needsUpdate = true;
    c.needsUpdate = true;
    topGeo.computeVertexNormals();
    // the cut face
    const fp = faceGeo.attributes.position;
    const fc = faceGeo.attributes.color;
    const farr = /** @type {Float32Array} */ (fp.array);
    const fcarr = /** @type {Float32Array} */ (fc.array);
    for (let j = 0; j < fnh; j++)
      for (let i = 0; i < fnx; i++) {
        const k = j * fnx + i;
        let move = 0;
        faceFields.forEach((ff, f) => {
          move += ff[k] * depths[f];
        });
        farr[k * 3 + 1] = -hs[j] + move;
        // clay pushed down is packed tighter: darker, the more it moved
        const w = Math.min(0.6, Math.max(0, -move) * 22);
        fcarr[k * 3] = fbase[k * 3] + (packed.r - fbase[k * 3]) * w;
        fcarr[k * 3 + 1] = fbase[k * 3 + 1] + (packed.g - fbase[k * 3 + 1]) * w;
        fcarr[k * 3 + 2] = fbase[k * 3 + 2] + (packed.b - fbase[k * 3 + 2]) * w;
      }
    fp.needsUpdate = true;
    fc.needsUpdate = true;
    faceGeo.computeVertexNormals();
  }

  return {
    root,
    pit: PIT,
    /** How deep foot i is in the clay (m); the surface and the layers follow. */
    setDepth(i, d) {
      const v = Math.max(0, d);
      if (Math.abs(v - depths[i]) < 1e-6) return;
      depths[i] = v;
      apply();
    },
    setDepths(list) {
      let changed = false;
      list.forEach((d, i) => {
        const v = Math.max(0, d);
        if (Math.abs(v - depths[i]) >= 1e-6) {
          depths[i] = v;
          changed = true;
        }
      });
      if (changed) apply();
    },
    depth: (i) => depths[i],
    /** Copies of the clay near the feet, as it is now (with the prints), for the GLB: the surface, the cut face. */
    near: () => [crop(top, (x, _y, z) => Math.abs(x) < 0.5 && z > -0.35), crop(face, (x) => Math.abs(x) < 0.5)],
  };
}
