// The settings of the two examples, drawn once and never changed afterwards (none of it is exported to GLB):
//  - the school field where the stone is whirled (metres): trodden earth with pebbles and dry grass, trees and
//    bushes round the edge, the school building behind them, reeds at the pond;
//  - the countryside round the road of চিত্র ২.০৪ (km): a patchwork of fields seen from above, villages under
//    their trees, a few ponds.
// And the sky, seen when the view is turned. Everything here is random-looking but the same every time (a fixed
// seed), and repeated things are instanced or merged, so the whole setting is a handful of draw calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A small seeded random number generator (mulberry32): the same setting on every device. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(size, draw, { repeat = 1, aniso = 8 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  if (repeat !== 1) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
  }
  return tex;
}

/** Draws `fn(x, y)` at x, y and at its copies across the edges, so the picture tiles without a seam. */
function wrapped(size, x, y, r, fn) {
  for (const dx of [-size, 0, size])
    for (const dy of [-size, 0, size]) {
      const px = x + dx;
      const py = y + dy;
      if (px + r < 0 || px - r > size || py + r < 0 || py - r > size) continue;
      fn(px, py);
    }
}

export const SKY = { top: '#6f9fcc', mid: '#a8c6df', haze: '#d9e2e4' };

/** The sky behind everything (seen when the view is turned): a gradient, darker blue overhead. */
export function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, SKY.top);
  g.addColorStop(0.55, SKY.mid);
  g.addColorStop(1, SKY.haze);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ── plants (both settings) ───────────────────────────────────────────────────
// The plants never move, so they are merged into one mesh per colour, with a flat-shaded standard material: the same
// shader as the stone's, so they add no shader to compile and only a few draw calls.
/** The same kind of geometry for every part: not indexed, positions and normals only. */
function prep(g) {
  const out = g.index ? g.toNonIndexed() : g;
  if (out !== g) g.dispose();
  for (const name of Object.keys(out.attributes)) if (name !== 'position' && name !== 'normal') out.deleteAttribute(name);
  return out;
}
const TRUNK = prep(new THREE.CylinderGeometry(0.11, 0.16, 1, 7).translate(0, 0.5, 0));
/** Lumps of `[x, y, z, r]`, merged. */
function lumps(list) {
  const parts = list.map(([x, y, z, r]) => prep(new THREE.IcosahedronGeometry(r, 1).translate(x, y, z)));
  const g = mergeGeometries(parts);
  for (const l of parts) l.dispose();
  return g;
}
const CROWN = lumps([
  [0, 0, 0, 1],
  [0.55, -0.15, 0.2, 0.72],
  [-0.45, -0.1, -0.35, 0.78],
  [0.05, 0.35, -0.1, 0.7],
]);
const BUSH = lumps([
  [0, 0.55, 0, 0.62],
  [0.45, 0.4, 0.15, 0.48],
  [-0.4, 0.38, -0.2, 0.5],
]);
/** A grass tuft: five blades leaning out. */
const TUFT = (() => {
  const blades = [];
  for (let k = 0; k < 5; k++) {
    const b = prep(new THREE.ConeGeometry(0.12, 0.42, 5).translate(0, 0.21, 0));
    b.rotateZ(((k - 2) / 2) * 0.45);
    b.rotateY((k / 5) * Math.PI * 2);
    b.translate((k - 2) * 0.05, 0, ((k * 37) % 5) * 0.02 - 0.04);
    blades.push(b);
  }
  const g = mergeGeometries(blades);
  for (const b of blades) b.dispose();
  return g;
})();
const BARK = '#65492f';
const LEAF = ['#4f7a3a', '#5f8b40', '#45703a'];

/** Collects placed copies of the plant shapes by colour; meshes() merges each colour into one mesh. */
function plants() {
  const byColor = new Map();
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  return {
    /** A copy of `geo` at x, z (on the ground, or `y` up), turned by `turn`, scaled by sx, sy, sz. */
    add(geo, color, x, z, { y = 0, turn = 0, sx = 1, sy = 1, sz = 1 } = {}) {
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, turn);
      m.compose(p.set(x, y, z), q, s.set(sx, sy, sz));
      if (!byColor.has(color)) byColor.set(color, []);
      byColor.get(color).push(geo.clone().applyMatrix4(m));
    },
    meshes() {
      const out = [];
      for (const [color, list] of byColor) {
        const g = mergeGeometries(list);
        for (const l of list) l.dispose();
        g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ name: 'Plants', color, roughness: 0.88, flatShading: true }));
        mesh.userData.noExport = true;
        out.push(mesh);
      }
      return out;
    },
  };
}

/**
 * Trees at the given places: [x, z, size] in the units of the scene (size = crown radius).
 * @param {ReturnType<typeof plants>} into
 * @param {Array<[number, number, number]>} spots
 * @param {() => number} rand
 */
function trees(into, spots, rand) {
  for (const [x, z, r] of spots) {
    const h = r * (1.3 + rand() * 0.5); // trunk height
    into.add(TRUNK, BARK, x, z, { sx: r * 0.9, sy: h, sz: r * 0.9 });
    const k = r * (0.8 + rand() * 0.25);
    into.add(CROWN, LEAF[Math.floor(rand() * LEAF.length)], x, z, { y: h + r * 0.55, turn: rand() * Math.PI * 2, sx: r, sy: k, sz: r });
  }
}

// ── the school field (metres) ─────────────────────────────────────────────────
/** Trodden earth, 4 m square, tiling: pale and darker patches, grit and pebbles, a few dry grass blades. */
function earthTexture() {
  return canvasTexture(
    512,
    (ctx, S) => {
      const rand = rng(11);
      ctx.fillStyle = '#c2ac86';
      ctx.fillRect(0, 0, S, S);
      // soft patches, lighter and darker
      for (let i = 0; i < 60; i++) {
        const x = rand() * S;
        const y = rand() * S;
        const r = 30 + rand() * 90;
        const light = rand() < 0.5;
        wrapped(S, x, y, r, (px, py) => {
          const g = ctx.createRadialGradient(px, py, 0, px, py, r);
          g.addColorStop(0, light ? 'rgba(218, 202, 166, 0.22)' : 'rgba(150, 128, 94, 0.15)');
          g.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(px - r, py - r, r * 2, r * 2);
        });
      }
      // grit and pebbles
      for (let i = 0; i < 2200; i++) {
        const x = rand() * S;
        const y = rand() * S;
        const r = rand() < 0.94 ? 0.6 + rand() * 1.1 : 1.8 + rand() * 2.2;
        const shade = rand();
        ctx.fillStyle = shade < 0.5 ? `rgba(126, 106, 78, ${0.2 + rand() * 0.3})` : `rgba(236, 226, 204, ${0.25 + rand() * 0.35})`;
        wrapped(S, x, y, r, (px, py) => {
          ctx.beginPath();
          ctx.ellipse(px, py, r, r * (0.6 + rand() * 0.4), rand() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      // a few dry grass blades in small tufts
      ctx.lineCap = 'round';
      for (let i = 0; i < 40; i++) {
        const x = rand() * S;
        const y = rand() * S;
        wrapped(S, x, y, 14, (px, py) => {
          for (let k = 0; k < 7; k++) {
            const a = -Math.PI / 2 + (rand() - 0.5) * 2.2;
            const l = 5 + rand() * 9;
            ctx.strokeStyle = rand() < 0.5 ? 'rgba(122, 124, 70, 0.75)' : 'rgba(150, 140, 86, 0.75)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
            ctx.stroke();
          }
        });
      }
    },
    { repeat: 70 / 4 },
  );
}

/**
 * The school field round the student: earth, the trees and bushes round it, the school building behind them,
 * reeds round the pond. `avoid(x, z)` says where the bushes must not grow (the pond, the compass, the circle).
 * @param {{ pond: { x: number, z: number, r: number } }} options
 */
export function createField({ pond }) {
  const root = new THREE.Group();
  root.name = 'Field';
  root.userData.noExport = true;
  const rand = rng(7);

  // the ground: one big plane; the earth gets a little greener and darker far from the middle (vertex colours)
  const geo = new THREE.PlaneGeometry(70, 70, 28, 28).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const worn = new THREE.Color('#ffffff');
  const edge = new THREE.Color('#c9cf9e');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const k = THREE.MathUtils.smoothstep(r + Math.sin(x * 0.7) * 1.2 + Math.cos(z * 0.9) * 1.2, 6.5, 13);
    c.copy(worn).lerp(edge, k);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ name: 'Earth', map: earthTexture(), vertexColors: true }));
  ground.name = 'Ground';
  ground.receiveShadow = true;
  root.add(ground);

  const green = plants();
  // trees round the field (none in front of the student, where the camera looks from)
  const spots = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + (rand() - 0.5) * 0.18;
    const r = 7.2 + rand() * 4.5;
    spots.push([r * Math.cos(a), -r * Math.sin(a), 0.9 + rand() * 0.6]);
  }
  trees(green, spots, rand);
  // reeds round the pond, on the far side from the student
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2;
    const r = pond.r * (1.05 + rand() * 0.18);
    const x = pond.x + r * Math.cos(a);
    const z = pond.z - r * Math.sin(a);
    if (Math.hypot(x, z) < 2.6) continue; // not where the stone comes in
    const k = 0.4 + rand() * 0.4;
    green.add(TUFT, '#6f7f3c', x, z, { turn: rand() * Math.PI * 2, sx: k, sy: k * (1 + rand() * 0.4), sz: k });
  }
  // grass tufts and round bushes towards the edge of the field
  for (let i = 0; i < 150; i++) {
    const a = rand() * Math.PI * 2;
    const r = 4.6 + rand() ** 0.7 * 9;
    const x = r * Math.cos(a);
    const z = -r * Math.sin(a);
    if (Math.hypot(x - pond.x, z - pond.z) < pond.r * 1.4) continue;
    const turn = rand() * Math.PI * 2;
    if (rand() < 0.2 && r > 5.6) {
      const k = 0.28 + rand() * 0.22;
      green.add(BUSH, LEAF[i % LEAF.length], x, z, { turn, sx: k * 1.4, sy: k, sz: k * 1.4 });
    } else {
      const k = 0.45 + rand() * 0.45;
      green.add(TUFT, rand() < 0.5 ? '#8a8a4c' : '#76824a', x, z, { turn, sx: k, sy: k * (0.8 + rand() * 0.4), sz: k });
    }
  }
  root.add(...green.meshes());

  // the school behind the trees, to the north: a long single-storey building with a tin roof (seen when turned)
  const wall = new THREE.MeshStandardMaterial({ name: 'SchoolWall', color: 0xe9dcc0, roughness: 0.9 });
  const trim = new THREE.MeshStandardMaterial({ name: 'SchoolTrim', color: 0x2f6b5a, roughness: 0.7 });
  const roof = new THREE.MeshStandardMaterial({ name: 'SchoolRoof', color: 0x8d969c, roughness: 0.55, metalness: 0.3 });
  const parts = { wall: [], trim: [], roof: [] };
  const box = (list, w, h, d, x, y, z, rx = 0) => {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rx) g.rotateX(rx);
    list.push(g.translate(x, y, z));
  };
  const Z = -15;
  box(parts.wall, 18, 3.2, 5, 0, 1.6, Z);
  box(parts.wall, 18.6, 0.35, 6.2, 0, 0.17, Z + 0.4); // the plinth and the veranda
  box(parts.roof, 19.4, 0.12, 3.6, 0, 3.75, Z - 1.4, 0.26);
  box(parts.roof, 19.4, 0.12, 3.6, 0, 3.75, Z + 1.75, -0.26);
  for (let i = 0; i < 8; i++) {
    const x = -7.7 + i * 2.2;
    if (i === 3 || i === 4)
      box(parts.trim, 1.1, 2.1, 0.08, x, 1.4, Z + 2.52); // the doors
    else box(parts.trim, 1.2, 1.2, 0.08, x, 1.8, Z + 2.52); // the windows
  }
  for (const [list, mat] of [
    [parts.wall, wall],
    [parts.trim, trim],
    [parts.roof, roof],
  ]) {
    const g = mergeGeometries(list);
    for (const l of list) l.dispose();
    root.add(new THREE.Mesh(g, mat));
  }
  return root;
}

// ── the countryside round the road (km) ───────────────────────────────────────
const FIELDS = ['#d5c391', '#cdb778', '#d6c06a', '#b39a76', '#c6b28e', '#b0b67e', '#cbb684', '#bba47c', '#d0bf88'];
const TILE_KM = 6; // the patchwork repeats every 6 km (only seen when the view is turned)

/**
 * The patchwork of fields, 6 km square and tiling: a jittered grid of fields (ploughed, ripening, mustard, young
 * paddy), the ridges between them, villages under trees and a few ponds. Returns the texture and where the villages
 * are (km, in the tile), for the 3D trees.
 */
function fieldsTexture() {
  const S = 1024;
  const N = 12; // fields across the tile
  const cell = S / N;
  const rand = rng(23);
  const villages = [];
  // the corners of the grid, jittered (corner i, j and corner i + N, j are the same one, so the tile has no seam)
  const corner = [];
  for (let j = 0; j < N; j++) {
    const row = [];
    for (let i = 0; i < N; i++) row.push([(rand() - 0.5) * cell * 0.5, (rand() - 0.5) * cell * 0.5]);
    corner.push(row);
  }
  const at = (i, j) => {
    const c = corner[j % N][i % N];
    return [i * cell + c[0], j * cell + c[1]];
  };
  const tex = canvasTexture(
    S,
    (ctx) => {
      ctx.fillStyle = '#c9b283';
      ctx.fillRect(0, 0, S, S);
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const quad = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
          const village = rand() < 0.1;
          const color = village ? '#7d8a52' : FIELDS[Math.floor(rand() * FIELDS.length)];
          const rows = rand() * Math.PI;
          for (const dx of [-S, 0, S])
            for (const dy of [-S, 0, S]) {
              const q = quad.map(([x, y]) => [x + dx, y + dy]);
              if (q.every(([x]) => x < 0) || q.every(([x]) => x > S) || q.every(([, y]) => y < 0) || q.every(([, y]) => y > S)) continue;
              ctx.save();
              ctx.beginPath();
              q.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
              ctx.closePath();
              ctx.fillStyle = color;
              ctx.fill();
              ctx.clip();
              // crop rows, faint
              const cx = (q[0][0] + q[2][0]) / 2;
              const cy = (q[0][1] + q[2][1]) / 2;
              ctx.translate(cx, cy);
              ctx.rotate(rows);
              ctx.strokeStyle = village ? 'rgba(0, 0, 0, 0)' : 'rgba(90, 70, 40, 0.09)';
              ctx.lineWidth = 1.2;
              for (let k = -cell; k <= cell; k += 5) {
                ctx.beginPath();
                ctx.moveTo(-cell, k);
                ctx.lineTo(cell, k);
                ctx.stroke();
              }
              ctx.restore();
              // the ridge (আল) round the field
              ctx.beginPath();
              q.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
              ctx.closePath();
              ctx.strokeStyle = 'rgba(236, 224, 192, 0.85)';
              ctx.lineWidth = 2.2;
              ctx.stroke();
            }
          if (village) {
            const [x0, y0] = at(i, j);
            villages.push([(x0 + cell * 0.5) / S, (y0 + cell * 0.5) / S]);
          }
        }
      // a few ponds
      for (let k = 0; k < 7; k++) {
        const x = rand() * S;
        const y = rand() * S;
        const rx = 9 + rand() * 14;
        const ry = rx * (0.6 + rand() * 0.35);
        const a = rand() * Math.PI;
        wrapped(S, x, y, rx + 4, (px, py) => {
          ctx.fillStyle = '#9c8a62';
          ctx.beginPath();
          ctx.ellipse(px, py, rx + 3, ry + 3, a, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#5f9cb5';
          ctx.beginPath();
          ctx.ellipse(px, py, rx, ry, a, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      // speckle, so no field is one flat colour
      for (let k = 0; k < 9000; k++) {
        const x = rand() * S;
        const y = rand() * S;
        ctx.fillStyle = rand() < 0.5 ? 'rgba(80, 60, 30, 0.12)' : 'rgba(255, 250, 230, 0.14)';
        ctx.fillRect(x, y, 1.6, 1.6);
      }
    },
    { repeat: 1 },
  );
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return { tex, villages };
}

/**
 * The countryside under the road map (1 km = 1 unit). `clear(e, n)` is the distance (km) from a point to the road:
 * no tree grows on it.
 * @param {{ centre: { e: number, n: number }, clear: (e: number, n: number) => number }} options
 */
export function createCountry({ centre, clear }) {
  const root = new THREE.Group();
  root.name = 'Countryside';
  root.userData.noExport = true;
  const size = 36;
  const { tex, villages } = fieldsTexture();
  tex.repeat.set(size / TILE_KM, size / TILE_KM);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ name: 'Fields', map: tex }),
  );
  ground.position.set(centre.e, 0, -centre.n);
  ground.receiveShadow = true;
  root.add(ground);
  // the texture's (0, 0) corner is at the ground's north-west corner; the villages' trees, near the road only
  const rand = rng(31);
  const spots = [];
  const x0 = centre.e - size / 2;
  const n0 = centre.n + size / 2;
  for (let ti = 0; ti < size / TILE_KM; ti++)
    for (let tj = 0; tj < size / TILE_KM; tj++)
      for (const [u, v] of villages) {
        const ce = x0 + (ti + u) * TILE_KM;
        const cn = n0 - (tj + v) * TILE_KM;
        if (Math.hypot(ce - centre.e, cn - centre.n) > 5.5) continue;
        for (let k = 0; k < 9; k++) {
          const e = ce + (rand() - 0.5) * 0.36;
          const n = cn + (rand() - 0.5) * 0.36;
          if (clear(e, n) < 0.14) continue;
          spots.push([e, -n, 0.03 + rand() * 0.02]);
        }
      }
  const green = plants();
  trees(green, spots, rand);
  root.add(...green.meshes());
  return root;
}
