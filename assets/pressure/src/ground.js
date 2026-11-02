// The ground: a village yard of soft red clay after rain (metres; y up, the clay's surface at y = 0 before anyone
// stands on it). The clay in front of the two feet is dug away along z = 0, the line through the middle of both soles,
// so its cut face shows the layers of clay: they dip under each shoe, deep and narrow under the heel, shallow and wide
// under the sneaker. Behind: the red yard with a puddle, a turquoise wall with a yellow band, a blue wooden door,
// magenta bougainvillea over the wall, clay pots of marigolds, a blue sky.
//
// The clay gives way where a sole presses (setDepth). How each vertex moves for one centimetre of sinking is worked out
// once, when the yard is made (an attribute per foot), and the vertex shader scales it by how deep each foot is in (a
// uniform). So sinking costs nothing on the CPU: no vertices are rewritten and no normals recomputed per frame. The
// surface is fine only where the soles press; the cut face's layers are drawn per pixel from each point's depth before
// it moved, so their thin pale streaks stay sharp on a modest grid.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PIT = { x: 0.62, z: 0.62, depth: 0.34 }; // the dug-away part in front: |x| < 0.62, 0 < z < 0.62
// the layers on the cut face, from the top: [depth of the bottom of the layer (m), colour]: a red-brown topsoil over
// mottled yellow, grey and blue-grey clay (red clay country, as in Madhupur), with thin pale streaks that show the
// bending. Cool and yellow tones below the topsoil, so the red pressure arrows stand out on them.
const LAYERS = [
  [0.014, '#8c3a22'],
  [0.019, '#f3dfb4'],
  [0.038, '#c9973f'],
  [0.043, '#f5e4bd'],
  [0.066, '#9aa3a6'],
  [0.071, '#f6e6c2'],
  [0.098, '#d4b062'],
  [0.103, '#f3e3c4'],
  [0.138, '#8798a8'],
  [0.144, '#f0dcb2'],
  [0.19, '#b49c78'],
  [0.197, '#ead6ae'],
  [1, '#76858f'],
];
const FINE = 0.003; // the grid's step where the soles press (m)

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
  tex.anisotropy = 1; // the grain is noise: at a glancing angle the mipmaps blur it, which is fine (and cheap)
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

/**
 * A matte material lit without the environment map: its light from the sky and the bounce comes from a constant fill
 * instead (what the studio environment gives a matte surface, near enough). Sampling the environment per pixel is
 * the dearest part of drawing the large clay and wall surfaces in software 3D; on clay it shows no reflection anyway.
 */
const ENV_FILL = new THREE.Color(0.68, 0.69, 0.72);
function matte(material, key) {
  const own = material.onBeforeCompile;
  material.onBeforeCompile = (sh, renderer) => {
    own?.call(material, sh, renderer);
    sh.uniforms.uEnvFill = { value: ENV_FILL };
    sh.fragmentShader = `#undef USE_ENVMAP\nuniform vec3 uEnvFill;\n${sh.fragmentShader.replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\nirradiance += uEnvFill;\n#ifdef RE_IndirectSpecular\nradiance += uEnvFill;\niblIrradiance += uEnvFill;\n#endif')}`;
  };
  material.customProgramCacheKey = () => `pressure-matte-${key}`;
  return material;
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

/** A grid geometry from its vertex count across (nx) and its arrays, two triangles per cell. */
function grid(nx, ny, attrs) {
  const idx = [];
  for (let j = 0; j < ny - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1);
    }
  const g = new THREE.BufferGeometry();
  for (const [name, [arr, size]] of Object.entries(attrs)) g.setAttribute(name, new THREE.BufferAttribute(arr, size));
  g.setIndex(idx);
  return g;
}

/** A copy of a geometry with only the triangles whose corners all pass keep(x, y, z), its vertices packed. */
function crop(geo, keep) {
  const pos = geo.attributes.position;
  const index = geo.index.array;
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
  for (const [name, attr] of Object.entries(geo.attributes)) {
    const size = attr.itemSize;
    const arr = new Float32Array(n * size);
    for (let v = 0; v < pos.count; v++) if (map[v] >= 0) for (let c = 0; c < size; c++) arr[map[v] * size + c] = attr.array[v * size + c];
    copy.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  copy.setIndex(out);
  return copy;
}

export function createGround(feet) {
  const root = new THREE.Group();
  root.name = 'ClayYard';
  const grain = grainTexture();
  const tmpC = new THREE.Color();
  const depths = feet.map(() => 0);
  const uDepth = { value: new THREE.Vector2() }; // how deep each foot is in (m), shared by the surface and the cut face
  const shade = new THREE.Color('#5e2412'); // pressed clay is darker (wetter and packed)
  const packed = new THREE.Color('#4d4038');
  const footAt = (f, x, z) => unitDepth(f.footprint.sdf(x - f.x, z));

  // ── the surface of the clay behind the cut (z ≤ 0) ──
  // A fine patch where the soles press, and a coarse yard round it whose hole is a little smaller than the patch: the
  // two overlap on a flat ring (the yard a hair lower), so no seam shows, and no long thin triangles cross the yard
  // (software 3D draws slivers slowly).
  const lo = Math.min(...feet.map((f) => f.x + f.footprint.box.x0)) - 0.03;
  const hi = Math.max(...feet.map((f) => f.x + f.footprint.box.x1)) + 0.03;
  const zFine = Math.max(...feet.map((f) => f.footprint.box.z)) + 0.03;
  const PATCH = { x0: lo - 0.03, x1: hi + 0.03, z0: -(zFine + 0.03) };
  const HOLE = { x0: lo, x1: hi, z0: -zFine };
  const wet = new THREE.Color('#953b22');
  const dry = new THREE.Color('#aa4a2a');
  const E = FINE / 2;
  /** A grid of the clay's surface on xs × zs (cells for which skip(i, j) is true left out), `drop` m lower. */
  function surface(xs, zs, { skip = () => false, drop = 0 } = {}) {
    const nx = xs.length;
    const nz = zs.length;
    const count = nx * nz;
    const pos = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    const col = new Float32Array(count * 3);
    const dent = new Float32Array(count * 2); // each foot's unit depth here (× its depth in m = how far it moves)
    const dentGrad = new Float32Array(count * 4); // its slope in x and z for each foot (for the normals)
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        const x = xs[i];
        const z = zs[j];
        // gentle bumps far from the feet (old footprints, puddle edges), smooth near them
        const far = smoothstep(0.5, 1.6, Math.hypot(x, z));
        const y = far * (0.005 * Math.sin(x * 4.3 + z * 2.1) + 0.004 * Math.sin(z * 6.7 - x * 1.3)) - drop;
        pos.set([x, y, z], k * 3);
        uv.set([x * 3.2, z * 3.2], k * 2);
        // darker wet patches here and there, a little drier (lighter) further back
        const patch = 0.5 + 0.5 * Math.sin(x * 5.1 + Math.sin(z * 3.3) * 2) * Math.sin(z * 4.3 - x * 1.7);
        tmpC.copy(wet).lerp(dry, smoothstep(-0.8, -3.5, z) * 0.7 + 0.3 * patch);
        col.set([tmpC.r, tmpC.g, tmpC.b], k * 3);
        feet.forEach((f, n) => {
          const { box } = f.footprint;
          const lx = x - f.x;
          if (Math.abs(z) > box.z + 0.03 || lx < box.x0 - 0.03 || lx > box.x1 + 0.03) return;
          dent[k * 2 + n] = footAt(f, x, z);
          dentGrad[k * 4 + n * 2] = (footAt(f, x + E, z) - footAt(f, x - E, z)) / (2 * E);
          dentGrad[k * 4 + n * 2 + 1] = (footAt(f, x, z + E) - footAt(f, x, z - E)) / (2 * E);
        });
      }
    const idx = [];
    for (let j = 0; j < nz - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        if (skip(i, j)) continue;
        const a = j * nx + i;
        idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1);
      }
    const g = new THREE.BufferGeometry();
    for (const [name, arr, size] of [
      ['position', pos, 3],
      ['uv', uv, 2],
      ['color', col, 3],
      ['dent', dent, 2],
      ['dentGrad', dentGrad, 4],
    ])
      g.setAttribute(name, new THREE.BufferAttribute(arr, size));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  const fineXs = [];
  for (let x = PATCH.x0; x < PATCH.x1 + 1e-9; x += FINE) fineXs.push(x);
  const fineZs = [];
  for (let z = PATCH.z0; z < -1e-9; z += FINE) fineZs.push(z);
  fineZs.push(0);
  const yardXs = [...new Set([...axis(-7, HOLE.x0, HOLE.x1, 7, 0.02, 0.5), -PIT.x, PIT.x])].sort((a, b) => a - b);
  const yardZs = axis(-9, HOLE.z0, 0, 0, 0.02, 0.6);
  const inHole = (i, j) => yardXs[i] >= HOLE.x0 - 1e-9 && yardXs[i + 1] <= HOLE.x1 + 1e-9 && yardZs[j] >= HOLE.z0 - 1e-9;
  const patchGeo = surface(fineXs, fineZs);
  const topGeo = mergeGeometries([patchGeo, surface(yardXs, yardZs, { skip: inHole, drop: 0.0004 })]);
  const dent = /** @type {Float32Array} */ (topGeo.attributes.dent.array);
  // wet clay has a soft sheen
  const clayMat = new THREE.MeshStandardMaterial({ map: grain, vertexColors: true, roughness: 0.5 });
  clayMat.onBeforeCompile = (sh) => {
    sh.uniforms.uDepth = uDepth;
    sh.uniforms.uShade = { value: shade };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 dent;\nattribute vec4 dentGrad;\nuniform vec2 uDepth;\nuniform vec3 uShade;')
      .replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\nobjectNormal = normalize(objectNormal - vec3(dot(dentGrad.xz, uDepth), 0.0, dot(dentGrad.yw, uDepth)));',
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y += dot(dent, uDepth);')
      .replace(
        '#include <color_vertex>',
        '#include <color_vertex>\n{ vec2 w = clamp(-dent, 0.0, 1.0) * clamp(uDepth / 0.02, 0.0, 1.0) * 0.45; vColor.rgb = mix(vColor.rgb, uShade, min(1.0, w.x + w.y)); }',
      );
  };
  matte(clayMat, 'surface');
  const top = new THREE.Mesh(topGeo, clayMat);
  top.name = 'ClaySurface';
  top.receiveShadow = true;
  root.add(top);

  // ── the cut face (z = 0) and the pit's two side walls: the layers of clay, moved down under the feet ──
  const fx = [...new Set([...axis(-PIT.x, lo, hi, PIT.x, FINE, 0.06)])].sort((a, b) => a - b);
  const fnx = fx.length;
  /** Rows down the face: close under the surface, where the bending is sharp, further apart below. */
  const rowsGraded = () => {
    const hs = [];
    for (let h = 0; h < PIT.depth - 1e-9; h += Math.min(0.014, 0.002 + 0.07 * h)) hs.push(h);
    hs.push(PIT.depth);
    return hs;
  };
  /** Each foot's shift on the face (m per m of sinking): the surface's dip along z = 0, wider and weaker with depth. */
  function faceShifts(hs) {
    const fnh = hs.length;
    const out = new Float32Array(fnx * fnh * feet.length);
    const w = fx.map((_, m) => (m > 0 && m < fnx - 1 ? (fx[m + 1] - fx[m - 1]) / 2 : FINE));
    const prof = feet.map((f) => fx.map((x) => footAt(f, x, 0)));
    const nf = feet.length;
    const sums = new Float64Array(nf);
    for (let j = 0; j < fnh; j++) {
      const h = hs[j];
      const sigma = 0.0012 + 0.42 * h;
      const fade = Math.exp(-h / 0.17);
      for (let i = 0; i < fnx; i++) {
        const k = (j * fnx + i) * nf;
        if (h < 1e-6) {
          for (let n = 0; n < nf; n++) out[k + n] = prof[n][i];
          continue;
        }
        // a Gaussian blur along the face, the same weights for both feet
        sums.fill(0);
        let wsum = 0;
        for (let m = 0; m < fnx; m++) {
          const dx = fx[m] - fx[i];
          if (Math.abs(dx) > 3 * sigma) continue;
          const wgt = Math.exp(-0.5 * (dx / sigma) ** 2) * w[m];
          for (let n = 0; n < nf; n++) sums[n] += prof[n][m] * wgt;
          wsum += wgt;
        }
        for (let n = 0; n < nf; n++) out[k + n] = wsum > 0 ? (sums[n] / wsum) * fade : 0;
      }
    }
    return out;
  }
  /** The face as a grid: rows hs down from the surface. */
  function faceGeometry(hs) {
    const fnh = hs.length;
    const fpos = new Float32Array(fnx * fnh * 3);
    const fuv = new Float32Array(fnx * fnh * 2);
    const rest = new Float32Array(fnx * fnh);
    for (let j = 0; j < fnh; j++)
      for (let i = 0; i < fnx; i++) {
        const k = j * fnx + i;
        fpos.set([fx[i], -hs[j], 0], k * 3);
        fuv.set([fx[i] * 3.2, -hs[j] * 3.2], k * 2);
        rest[k] = hs[j];
      }
    const g = grid(fnx, fnh, { position: [fpos, 3], uv: [fuv, 2], shift: [faceShifts(hs), 2], rest: [rest, 1] });
    g.computeVertexNormals();
    return g;
  }
  const walls = [-1, 1].map((sx) => {
    const g = new THREE.PlaneGeometry(PIT.z, PIT.depth, 1, 12);
    const n = g.attributes.position.count;
    const rest = new Float32Array(n);
    for (let k = 0; k < n; k++) rest[k] = PIT.depth / 2 - g.attributes.position.getY(k);
    g.setAttribute('rest', new THREE.BufferAttribute(rest, 1));
    g.setAttribute('shift', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(-sx * (Math.PI / 2)).setPosition(sx * PIT.x, -PIT.depth / 2, PIT.z / 2));
    return g;
  });
  const faceGeo = mergeGeometries([faceGeometry(rowsGraded()), ...walls]);
  const layerD = new Float32Array(LAYERS.map(([d]) => d));
  const layerC = new Float32Array(LAYERS.flatMap(([, c]) => tmpC.set(c).toArray()));
  const faceMat = new THREE.MeshStandardMaterial({ map: grain, roughness: 0.85 });
  faceMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uDepth, uLayerD: { value: layerD }, uLayerC: { value: layerC }, uPacked: { value: packed } });
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec2 shift;\nattribute float rest;\nuniform vec2 uDepth;\nvarying float vRest;\nvarying float vMove;',
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMove = dot(shift, uDepth);\ntransformed.y += vMove;\nvRest = rest;');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform float uLayerD[${LAYERS.length}];\nuniform vec3 uLayerC[${LAYERS.length}];\nuniform vec3 uPacked;\nvarying float vRest;\nvarying float vMove;`,
      )
      .replace(
        '#include <color_fragment>',
        `{
          // the layer at this point's depth before it moved, its edges a pixel soft
          float fw = max(fwidth(vRest), 1e-5) * 0.7;
          vec3 lay = uLayerC[0];
          for (int i = 0; i < ${LAYERS.length - 1}; i++) lay = mix(lay, uLayerC[i + 1], smoothstep(uLayerD[i] - fw, uLayerD[i] + fw, vRest));
          // clay pushed down is packed tighter: darker, the more it moved
          diffuseColor.rgb *= mix(lay, uPacked, clamp(-vMove * 22.0, 0.0, 0.6));
        }`,
      );
  };
  matte(faceMat, 'face');
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.name = 'CutFace';
  face.receiveShadow = true;
  root.add(face);

  // ── the pit's floor; the yard in front of it and beside it (one mesh) ──
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(PIT.x * 2, PIT.z).rotateX(-Math.PI / 2).translate(0, -PIT.depth, PIT.z / 2),
    matte(new THREE.MeshStandardMaterial({ map: grain, color: '#6f6a64', roughness: 0.9 }), 'floor'),
  );
  floor.name = 'PitFloor';
  root.add(floor);
  const yardPart = (x0, x1, z0, z1) => {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    const uvs = g.attributes.uv;
    for (let k = 0; k < uvs.count; k++) uvs.setXY(k, (uvs.getX(k) * (x1 - x0) + x0) * 3.2, (uvs.getY(k) * (z1 - z0) + z0) * 3.2);
    return g.rotateX(-Math.PI / 2).translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  };
  const yard = new THREE.Mesh(
    mergeGeometries([yardPart(-7, -PIT.x, 0, PIT.z), yardPart(PIT.x, 7, 0, PIT.z), yardPart(-7, 7, PIT.z, 6)]),
    matte(new THREE.MeshStandardMaterial({ map: grain, color: '#953b22', roughness: 0.5 }), 'yard'),
  );
  yard.name = 'Yard';
  root.add(yard);

  // ── behind: only a plain turquoise wall over the far clay (a soft coloured backdrop, nothing to distract) ──
  const far = new THREE.Group();
  far.name = 'Yard';
  far.userData.noExport = true;
  const farClay = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), matte(new THREE.MeshStandardMaterial({ color: '#a84a2a', roughness: 0.6 }), 'far'));
  farClay.rotation.x = -Math.PI / 2;
  farClay.position.set(0, -0.01, -9 - 15 + 0.01);
  far.add(farClay);
  // the wall: turquoise plaster
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
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(16, WALL.h, 0.25),
    matte(new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 }), 'wall'),
  );
  wall.position.set(0, WALL.h / 2, WALL.z);
  far.add(wall);
  root.add(far);

  // ── the clay gives way: a uniform, read by the vertex shaders ──
  function apply() {
    uDepth.value.set(depths[0] || 0, depths[1] || 0);
  }

  /** The surface as it is now (the prints baked in, normals and colours worked out), for the GLB. */
  function bakedSurface() {
    const g = topGeo.clone();
    const p = g.attributes.position;
    const c = g.attributes.color;
    const [d0, d1] = [depths[0] || 0, depths[1] || 0];
    for (let k = 0; k < p.count; k++) {
      const u0 = dent[k * 2];
      const u1 = dent[k * 2 + 1];
      p.setY(k, p.getY(k) + u0 * d0 + u1 * d1);
      const w = Math.min(1, (Math.min(1, Math.max(0, -u0)) * Math.min(1, d0 / 0.02) + Math.min(1, Math.max(0, -u1)) * Math.min(1, d1 / 0.02)) * 0.45);
      tmpC.setRGB(c.getX(k), c.getY(k), c.getZ(k)).lerp(shade, w);
      c.setXYZ(k, tmpC.r, tmpC.g, tmpC.b);
    }
    g.deleteAttribute('dent');
    g.deleteAttribute('dentGrad');
    g.computeVertexNormals();
    return g;
  }
  /** The cut face as it is now, on a finer grid with a row at each layer's edge (vertex colours for the GLB). */
  function bakedFace() {
    const hs = rowsGraded();
    for (const [d] of LAYERS) if (d < PIT.depth) hs.push(d - 0.0006, d + 0.0006);
    hs.sort((a, b) => a - b);
    const g = faceGeometry(hs);
    const p = g.attributes.position;
    const sh = g.attributes.shift;
    const rest = g.attributes.rest;
    const colors = new Float32Array(p.count * 3);
    const layer = new THREE.Color();
    for (let k = 0; k < p.count; k++) {
      const move = sh.getX(k) * (depths[0] || 0) + sh.getY(k) * (depths[1] || 0);
      p.setY(k, p.getY(k) + move);
      layer.set(LAYERS.find(([d]) => rest.getX(k) < d)?.[1] ?? LAYERS[LAYERS.length - 1][1]);
      layer.lerp(packed, Math.min(0.6, Math.max(0, -move) * 22));
      colors.set([layer.r, layer.g, layer.b], k * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.deleteAttribute('shift');
    g.deleteAttribute('rest');
    return g;
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
      list.forEach((d, i) => {
        depths[i] = Math.max(0, d);
      });
      apply();
    },
    depth: (i) => depths[i],
    /** Copies of the clay near the feet, as it is now (with the prints), for the GLB: the surface, the cut face. */
    near() {
      const surface = new THREE.Mesh(
        crop(bakedSurface(), (x, _y, z) => Math.abs(x) < 0.5 && z > -0.35),
        new THREE.MeshStandardMaterial({ map: grain, vertexColors: true, roughness: 0.5 }),
      );
      surface.name = 'ClaySurface';
      const cut = new THREE.Mesh(
        crop(bakedFace(), (x) => Math.abs(x) < 0.5),
        new THREE.MeshStandardMaterial({ map: grain, vertexColors: true, roughness: 0.85 }),
      );
      cut.name = 'CutFace';
      return [surface, cut];
    },
  };
}
