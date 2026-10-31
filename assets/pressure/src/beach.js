// The beach (metres; y up, the sand's surface at y = 0 before anyone stands on it). The sand in front of the two feet
// is dug away along z = 0, the line through the middle of both soles, so its cut face shows the layers of wet sand:
// they dip under each shoe, deep and narrow under the heel, shallow and wide under the sneaker. Behind: the beach,
// colourful umbrellas, a turquoise sea with two fishing boats, a blue sky. The sand gives way where a sole presses
// (setDepth): its surface (a fine grid near the feet) and the layers on the cut face move by fields worked out once
// for each foot, scaled by how deep that foot is in.
import * as THREE from 'three';

const PIT = { x: 0.62, z: 0.62, depth: 0.34 }; // the dug-away part in front: |x| < 0.62, 0 < z < 0.62
// the layers of sand on the cut face, from the top: [depth of the bottom of the layer (m), colour]
const LAYERS = [
  [0.012, '#d9a259'],
  [0.018, '#f6e2b8'],
  [0.04, '#c48848'],
  [0.046, '#f2d9a6'],
  [0.07, '#b27742'],
  [0.076, '#eed29c'],
  [0.104, '#a56d3b'],
  [0.11, '#e8c891'],
  [0.148, '#966238'],
  [0.155, '#dfba82'],
  [0.205, '#8b5a34'],
  [0.212, '#d6ab73'],
  [1, '#7d4f2d'],
];

const smoothstep = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Unit depth of the sand at a signed distance from a footprint's edge: −1 inside, a small rim of sand pushed up outside. */
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

/** A seeded random number generator, so the beach looks the same every time. */
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

/** Grains of sand: a grey-ish noise around white, multiplied with the sand's colours. */
function grainTexture(seed = 7) {
  const rand = rng(seed);
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const v = 170 + Math.floor(rand() * 85);
        ctx.fillStyle = `rgb(${v},${v - 4},${v - 12})`;
        ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 1.4, 1 + rand() * 1.4);
      }
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(90,60,30,0.55)';
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
 * feet: [{ x (where the foot's frame is along the beach), footprint: { sdf, box } }]. Returns { root, setDepth(i, d),
 * floor(i): the sand's height under foot i, sink colour }.
 */
export function createBeach(feet) {
  const root = new THREE.Group();
  root.name = 'Beach';
  const grain = grainTexture();
  const tmpC = new THREE.Color();

  // ── the surface of the sand behind the cut (z ≤ 0): fine near the feet ──
  const xs = [...new Set([...axis(-7, -0.44, 0.44, 7, 0.003, 0.5), -PIT.x, PIT.x])].sort((a, b) => a - b);
  const zs = axis(-9, -0.13, 0, 0, 0.003, 0.6);
  const nx = xs.length;
  const nz = zs.length;
  const count = nx * nz;
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const col = new Float32Array(count * 3);
  const base = new Float32Array(count * 3); // the sand's own colour (wetter towards the sea)
  const dry = new THREE.Color('#e7b46e');
  const wet = new THREE.Color('#b78350');
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const x = xs[i];
      const z = zs[j];
      // tiny ripples far from the feet (the wind's), flat near them
      const far = smoothstep(0.5, 1.6, Math.hypot(x, z));
      const y = far * (0.004 * Math.sin(x * 9 + z * 3) + 0.003 * Math.sin(z * 14 - x * 2));
      pos.set([x, y, z], k * 3);
      uv.set([x * 3.2, z * 3.2], k * 2);
      tmpC.copy(dry).lerp(wet, smoothstep(-2.5, -5.5, z) * 0.9 + 0.15);
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
  const sandMat = new THREE.MeshStandardMaterial({ map: grain, vertexColors: true, roughness: 0.96 });
  const top = new THREE.Mesh(topGeo, sandMat);
  top.name = 'SandSurface';
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

  // ── the cut face (z = 0): the layers of sand, moved down under the feet, fading with depth ──
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
  const faceMat = new THREE.MeshStandardMaterial({ map: grain, vertexColors: true, roughness: 0.97 });
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

  // ── the pit: its floor and its two side walls; the beach in front of it and beside it ──
  const pitMat = new THREE.MeshStandardMaterial({ map: grain, color: '#a8743f', roughness: 0.97 });
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
  const groundMat = new THREE.MeshStandardMaterial({ map: grain, color: '#e7b46e', roughness: 0.96 });
  const addGround = (x0, x1, z0, z1) => {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    const uvs = g.attributes.uv;
    for (let k = 0; k < uvs.count; k++) uvs.setXY(k, (uvs.getX(k) * (x1 - x0) + x0) * 3.2, (uvs.getY(k) * (z1 - z0) + z0) * 3.2);
    const m = new THREE.Mesh(g, groundMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    m.receiveShadow = true;
    m.name = 'Beach';
    root.add(m);
  };
  addGround(-7, -PIT.x, 0, PIT.z);
  addGround(PIT.x, 7, 0, PIT.z);
  addGround(-7, 7, PIT.z, 6);

  // ── far away: the wet edge, the sea, boats, umbrellas ──
  const far = new THREE.Group();
  far.name = 'Distance';
  far.userData.noExport = true;
  const farSand = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: '#c99256', roughness: 0.9 }));
  farSand.rotation.x = -Math.PI / 2;
  farSand.position.set(0, -0.01, -9 - 15 + 0.01);
  far.add(farSand);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.5), new THREE.MeshStandardMaterial({ color: '#e9fbff', roughness: 0.6 }));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(0, 0.002, -11);
  far.add(foam);
  const seaTex = canvasTexture(
    4,
    256,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0b5fa8'); // far
      g.addColorStop(0.55, '#0d8fb8');
      g.addColorStop(1, '#2cc3c4'); // near the shore
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    null,
  );
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(160, 70), new THREE.MeshStandardMaterial({ map: seaTex, roughness: 0.18, metalness: 0.05 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0.0, -11.2 - 35);
  far.add(sea);
  // white crests of the small waves near the shore
  const crestMat = new THREE.MeshStandardMaterial({ color: '#f2fdff', roughness: 0.5, transparent: true, opacity: 0.85 });
  const rand = rng(11);
  for (let i = 0; i < 14; i++) {
    const crest = new THREE.Mesh(new THREE.PlaneGeometry(2 + rand() * 4, 0.12), crestMat);
    crest.rotation.x = -Math.PI / 2;
    crest.position.set(-14 + rand() * 28, 0.004, -12.5 - rand() * 6);
    far.add(crest);
  }
  // two fishing boats (a sampan's painted hull, red and blue, with a low cabin)
  const boat = (x, z, hull, stripe, s) => {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(-1.6, 0.5);
    shape.quadraticCurveTo(-1.1, -0.05, 0, -0.05);
    shape.quadraticCurveTo(1.2, -0.05, 1.8, 0.75);
    shape.lineTo(-1.6, 0.5);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.9, bevelEnabled: false });
    geo.translate(0, 0, -0.45);
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: hull, roughness: 0.6 })));
    const band = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.94), new THREE.MeshStandardMaterial({ color: stripe, roughness: 0.6 }));
    band.position.set(0.1, 0.42, 0);
    g.add(band);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 0.7), new THREE.MeshStandardMaterial({ color: '#ffd43b', roughness: 0.7 }));
    cabin.position.set(-0.3, 0.75, 0);
    g.add(cabin);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8), new THREE.MeshStandardMaterial({ color: '#5c3b1e' }));
    mast.position.set(0.6, 1.3, 0);
    g.add(mast);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshStandardMaterial({ color: '#e03131', side: THREE.DoubleSide }));
    flag.position.set(0.8, 2.05, 0);
    g.add(flag);
    g.position.set(x, -0.05, z);
    g.rotation.y = 0.3;
    g.scale.setScalar(s);
    far.add(g);
  };
  boat(-5.5, -30, '#d9480f', '#1c7ed6', 1);
  boat(7, -40, '#1c7ed6', '#f76707', 1.1);
  // beach umbrellas with their poles, and a striped deck chair
  const umbrella = (x, z, colors, tilt) => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.1), new THREE.MeshStandardMaterial({ color: '#f1e6d2' }));
    pole.position.y = 1.05;
    g.add(pole);
    const n = colors.length * 2;
    for (let i = 0; i < n; i++) {
      const seg = new THREE.Mesh(
        new THREE.ConeGeometry(1.1, 0.42, 24, 1, true, (i / n) * Math.PI * 2, (Math.PI * 2) / n),
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.7, side: THREE.DoubleSide }),
      );
      seg.position.y = 2.1;
      g.add(seg);
    }
    g.rotation.z = tilt;
    g.position.set(x, 0, z);
    far.add(g);
  };
  umbrella(-2.6, -4.2, ['#e8590c', '#fff3bf'], 0.12);
  umbrella(2.2, -6.0, ['#1c7ed6', '#ffd43b'], -0.1);
  umbrella(5.2, -4.8, ['#d6336c', '#ffffff'], 0.08);
  umbrella(-6.5, -7.5, ['#7048e8', '#ffd8a8'], -0.06);
  const chair = new THREE.Group();
  const seatTex = canvasTexture(64, 64, (ctx, w, h) => {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#fff3bf' : '#f03e3e';
      ctx.fillRect((i * w) / 8, 0, w / 8, h);
    }
  });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 1.2), new THREE.MeshStandardMaterial({ map: seatTex }));
  seat.rotation.z = 0.5;
  seat.position.set(0, 0.35, 0);
  chair.add(seat);
  chair.position.set(-1.8, 0, -4.6);
  chair.rotation.y = 1.2;
  far.add(chair);
  // shells and pebbles near the feet
  const shellMat = new THREE.MeshStandardMaterial({ color: '#f7d9c4', roughness: 0.5 });
  const pebbleMat = new THREE.MeshStandardMaterial({ color: '#8d7b6a', roughness: 0.8 });
  const near = new THREE.Group();
  near.name = 'Shells';
  const r2 = rng(5);
  for (let i = 0; i < 22; i++) {
    const x = -0.9 + r2() * 1.8;
    const z = -0.2 - r2() * 1.2;
    if (Math.abs(x) < 0.38 && z > -0.2) continue;
    const isShell = r2() < 0.55;
    const m = new THREE.Mesh(
      isShell ? new THREE.SphereGeometry(0.008 + r2() * 0.006, 10, 6, 0, Math.PI) : new THREE.IcosahedronGeometry(0.006 + r2() * 0.006, 1),
      isShell ? shellMat : pebbleMat,
    );
    m.position.set(x, 0.001, z);
    m.rotation.set(isShell ? -Math.PI / 2 : r2(), r2() * 6, 0);
    m.scale.y = 0.6;
    m.castShadow = true;
    near.add(m);
  }
  root.add(near);
  root.add(far);

  // ── the sand gives way ──
  const depths = feet.map(() => 0);
  const shade = new THREE.Color('#8a5a30'); // pressed sand is darker (wet and packed)
  const packed = new THREE.Color('#5e3a1e');
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
        // sand pushed down is packed tighter: darker, the more it moved
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
    /** How deep foot i is in the sand (m); the surface and the layers follow. */
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
    /** Copies of the sand near the feet, as it is now (with the prints), for the GLB: the surface, the cut face. */
    near: () => [crop(top, (x, _y, z) => Math.abs(x) < 0.5 && z > -0.35), crop(face, (x) => Math.abs(x) < 0.5)],
  };
}
