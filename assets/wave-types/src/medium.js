// The two media and what drives them, in metres (the bench's top is y = 0; the medium runs along x from X0, the driven
// end, to X0 + L, the far post). Procedural three.js, every moving shape rebuilt in place each frame into reused
// buffers (no allocations per frame):
// - the rope: a 36 mm three-strand manila rope (a twisted-fibre texture and bump), stretched 0.3 m above the bench,
//   held by the wave driver's clamp at one end and a jaw clamp on a retort stand at the other; one green band marks
//   one particle of it;
// - the spring: a long steel helical spring (44 coils of 9 mm wire, 13 cm across) lying on the bench, its first
//   coil fixed to the driver's round plate, its far end bent into a crossover loop over the stand's steel peg; one
//   coil is painted green;
// - the wave driver: a mechanical vibrator (a charcoal case with a grille, a knob and rubber feet; a steel drive rod
//   that slides in and out of a bronze bush), turned so its rod moves up and down (rope) or along the spring;
// - the stand: a cast-iron base, a chrome rod, a boss head and an arm that ends in the jaw (rope) or the peg (spring).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WAVE, amplitude, displacement, spacing } from './reading.js';
import { canvasTex, rng } from './setting.js';

export const X0 = -0.9;
export const ROPE_Y = 0.3;
export const ROPE_R = 0.018;
export const SPRING = { R: 0.065, wire: 0.0045, coils: 44 };
export const SPRING_Y = SPRING.R + SPRING.wire;
export const COLORS = { mark: '#2b8a3e', markText: '#237a35', wave: '#1c6fd9', waveText: '#1864ab', teal: '#0c8599', tealText: '#0b7285' };

/** A tube along n points with `radial` sides, its vertices rewritten in place by update(points, ref). */
function makeTube(n, radial, radius, { alongRepeat = 1 } = {}) {
  const verts = n * (radial + 1);
  const pos = new Float32Array(verts * 3);
  const nor = new Float32Array(verts * 3);
  const uv = new Float32Array(verts * 2);
  const idx = new Uint32Array((n - 1) * radial * 6);
  let q = 0;
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx[q++] = a;
      idx[q++] = b;
      idx[q++] = a + 1;
      idx[q++] = b;
      idx[q++] = b + 1;
      idx[q++] = a + 1;
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const cosJ = new Float32Array(radial + 1);
  const sinJ = new Float32Array(radial + 1);
  for (let j = 0; j <= radial; j++) {
    cosJ[j] = Math.cos((j / radial) * Math.PI * 2);
    sinJ[j] = Math.sin((j / radial) * Math.PI * 2);
  }
  /**
   * P: Float32Array of n centre points (x, y, z); R: Float32Array of n reference directions (roughly at right angles
   * to the tube); arc: Float32Array of n arc lengths (for the texture along the tube).
   */
  function update(P, R, arc) {
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(0, i - 1) * 3;
      const i1 = Math.min(n - 1, i + 1) * 3;
      let tx = P[i1] - P[i0];
      let ty = P[i1 + 1] - P[i0 + 1];
      let tz = P[i1 + 2] - P[i0 + 2];
      const tl = Math.hypot(tx, ty, tz) || 1;
      tx /= tl;
      ty /= tl;
      tz /= tl;
      // N = ref without its part along T; B = T × N
      let nx = R[i * 3];
      let ny = R[i * 3 + 1];
      let nz = R[i * 3 + 2];
      const d = nx * tx + ny * ty + nz * tz;
      nx -= d * tx;
      ny -= d * ty;
      nz -= d * tz;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl;
      ny /= nl;
      nz /= nl;
      const bx = ty * nz - tz * ny;
      const by = tz * nx - tx * nz;
      const bz = tx * ny - ty * nx;
      const cx = P[i * 3];
      const cy = P[i * 3 + 1];
      const cz = P[i * 3 + 2];
      for (let j = 0; j <= radial; j++) {
        const ox = cosJ[j] * nx + sinJ[j] * bx;
        const oy = cosJ[j] * ny + sinJ[j] * by;
        const oz = cosJ[j] * nz + sinJ[j] * bz;
        const v = (i * (radial + 1) + j) * 3;
        pos[v] = cx + radius * ox;
        pos[v + 1] = cy + radius * oy;
        pos[v + 2] = cz + radius * oz;
        nor[v] = ox;
        nor[v + 1] = oy;
        nor[v + 2] = oz;
        const u = (i * (radial + 1) + j) * 2;
        uv[u] = arc[i] * alongRepeat;
        uv[u + 1] = j / radial;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.normal.needsUpdate = true;
    geo.attributes.uv.needsUpdate = true;
    geo.computeBoundingSphere();
  }
  return { geo, update, radial };
}

/**
 * Three twisted strands of manila, each of many fine fibres. The tile is one lay along x (36 mm of rope) and the
 * whole way round in y; strands run diagonally (3 per tile) and the fibres inside each strand run at a shallower
 * angle, which is what a twisted rope looks like close up. Everything is periodic, so tiles join without a seam.
 * Colour and bump come from one pass.
 */
function ropeTextures() {
  const W = 256;
  const H = 512;
  const r = rng(3);
  const cells = Float32Array.from({ length: 24 }, () => r());
  const col = new Uint8ClampedArray(W * H * 4);
  const hgt = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const fx = x / W;
      const fy = y / H;
      const ph = (3 * (fy - fx) + 3) % 1; // across a strand: 0 … 1
      const s = Math.sin(Math.PI * ph); // rounded strand: full in its middle, dark in the groove
      const u = ph * 24 + fx * 24; // along the fibres' own, shallower lay
      const cell = ((Math.floor(u) % 24) + 24) % 24;
      const fine = 0.5 + 0.5 * Math.sin(u * 2 * Math.PI); // each fibre a little ridge
      const grain = ((((x * 374761393 + y * 668265263) ^ (x * y)) >>> 0) % 255) / 255; // pixel fuzz
      const tone = 0.34 + 0.5 * s ** 0.55 + 0.16 * (cells[cell] - 0.5) + 0.1 * (fine - 0.5) + 0.07 * (grain - 0.5);
      const o = (y * W + x) * 4;
      col[o] = Math.min(255, 218 * tone);
      col[o + 1] = Math.min(255, 176 * tone);
      col[o + 2] = Math.min(255, 112 * tone);
      col[o + 3] = 255;
      const hv = 255 * (0.1 + 0.72 * s ** 0.7 + 0.14 * fine + 0.04 * grain);
      hgt[o] = hgt[o + 1] = hgt[o + 2] = Math.min(255, hv);
      hgt[o + 3] = 255;
    }
  const put = (data) => (ctx) => ctx.putImageData(new ImageData(data, W, H), 0, 0);
  const map = canvasTex(W, H, put(col), { repeat: [1, 1] });
  const bump = canvasTex(W, H, put(hgt), { repeat: [1, 1], color: false });
  return { map, bump };
}

/** The materials the media share. */
export function mediumMaterials() {
  const rope = ropeTextures();
  return {
    rope: new THREE.MeshStandardMaterial({ name: 'Manila', map: rope.map, bumpMap: rope.bump, bumpScale: 2.4, roughness: 0.95, metalness: 0 }),
    // polished spring steel and chrome: all mirror (the studio environment is what they show), a touch of blur
    steel: new THREE.MeshStandardMaterial({ name: 'SpringSteel', color: '#d3d9e0', metalness: 1, roughness: 0.2, envMapIntensity: 1.25 }),
    green: new THREE.MeshStandardMaterial({ name: 'MarkGreen', color: COLORS.mark, roughness: 0.45, metalness: 0.1 }),
    chrome: new THREE.MeshStandardMaterial({ name: 'Chrome', color: '#eef1f5', metalness: 1, roughness: 0.12 }),
    case: new THREE.MeshStandardMaterial({ name: 'DriverCase', color: '#37404e', roughness: 0.5, metalness: 0.35 }),
    face: new THREE.MeshStandardMaterial({ name: 'FacePlate', color: '#b9c0c8', roughness: 0.4, metalness: 0.85 }),
    cone: new THREE.MeshStandardMaterial({ name: 'SpeakerCone', color: '#2a2d33', roughness: 0.62, metalness: 0.1, side: THREE.DoubleSide }),
    rubber: new THREE.MeshStandardMaterial({ name: 'Rubber', color: '#17181a', roughness: 0.9 }),
    bronze: new THREE.MeshStandardMaterial({ name: 'Bronze', color: '#b08a4a', roughness: 0.32, metalness: 1 }),
    iron: new THREE.MeshStandardMaterial({ name: 'CastIron', color: '#2e3a4f', roughness: 0.6, metalness: 0.4 }),
    plate: new THREE.MeshStandardMaterial({ name: 'Plate', color: '#dfe3e8', roughness: 0.28, metalness: 1 }),
  };
}

// ── the rope ──────────────────────────────────────────────────────────────────
export function createRope(mats) {
  const N = 260;
  const tube = makeTube(N, 14, ROPE_R, { alongRepeat: 1 / 0.036 }); // one lay every 36 mm
  const P = new Float32Array(N * 3);
  const R = new Float32Array(N * 3);
  const arc = new Float32Array(N);
  for (let i = 0; i < N; i++) R[i * 3 + 2] = 1; // the rope moves in the x–y plane: z is always across it
  const mesh = new THREE.Mesh(tube.geo, mats.rope);
  mesh.name = 'Rope';
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  // the green band round one particle
  const band = new THREE.Mesh(new THREE.CylinderGeometry(ROPE_R * 1.55, ROPE_R * 1.55, 0.09, 28), mats.green);
  band.name = 'MarkedParticle';
  band.castShadow = true;
  const root = new THREE.Group();
  root.name = 'RopeMedium';
  root.add(mesh, band);
  const UPV = new THREE.Vector3(0, 1, 0);
  const T = new THREE.Vector3();
  const a = amplitude('rope');
  /** The particle's place now (world). */
  const at = (x, t, out) => out.set(X0 + x, ROPE_Y + displacement(x, t, a), 0);
  function update(t) {
    let s = 0;
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * WAVE.L;
      P[i * 3] = X0 + x;
      P[i * 3 + 1] = ROPE_Y + displacement(x, t, a);
      P[i * 3 + 2] = 0;
      if (i) s += Math.hypot(P[i * 3] - P[i * 3 - 3], P[i * 3 + 1] - P[i * 3 - 2]);
      arc[i] = s;
    }
    tube.update(P, R, arc);
    const xm = WAVE.marked;
    band.position.set(X0 + xm, ROPE_Y + displacement(xm, t, a), 0);
    const h = 1e-3;
    T.set(2 * h, displacement(xm + h, t, a) - displacement(xm - h, t, a), 0).normalize();
    band.quaternion.setFromUnitVectors(UPV, T);
  }
  return { root, mesh, band, update, at };
}

// ── the spring ────────────────────────────────────────────────────────────────
export function createSpring(mats) {
  const { R: RAD, coils } = SPRING;
  const PER = 36; // points per coil
  const HELIX = coils * PER + 1;
  const LOOP = 44; // the crossover loop at the far end
  const N = HELIX + LOOP;
  const tube = makeTube(N, 10, SPRING.wire);
  const P = new Float32Array(N * 3);
  const Rf = new Float32Array(N * 3);
  const arc = new Float32Array(N);
  // the far end's loop, fixed: from the last coil's top a quarter curve to the axis, then a loop in the x–y plane
  const loopR = RAD * 0.82;
  const loopCx = X0 + WAVE.L + RAD * 0.35 + loopR;
  for (let i = 0; i < LOOP; i++) {
    const k = (i + 1) / LOOP;
    let x;
    let y;
    if (k < 0.25) {
      const q = k / 0.25; // the crossover: from the top of the last coil down to the loop's left side
      x = X0 + WAVE.L + RAD * 0.35 * Math.sin((q * Math.PI) / 2);
      y = SPRING_Y + RAD * Math.cos((q * Math.PI) / 2);
    } else {
      const ph = Math.PI + ((k - 0.25) / 0.75) * (Math.PI * 2 - 0.35); // round the loop, starting at its left side
      x = loopCx + loopR * Math.cos(ph);
      y = SPRING_Y - loopR * Math.sin(ph);
    }
    const o = (HELIX + i) * 3;
    P[o] = x;
    P[o + 1] = y;
    P[o + 2] = 0;
    Rf[o + 2] = 1;
  }
  const mesh = new THREE.Mesh(tube.geo, [mats.steel, mats.green]);
  mesh.name = 'Spring';
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  // the green coil: the one whose rest place is nearest the marked x
  const pitch = WAVE.L / coils;
  const mc = Math.round(WAVE.marked / pitch - 0.5);
  const markedX = (mc + 0.5) * pitch; // its middle, at rest
  const quad = tube.radial * 6;
  const a0 = mc * PER * quad;
  const a1 = (mc + 1) * PER * quad;
  const all = (N - 1) * quad;
  tube.geo.addGroup(0, a0, 0);
  tube.geo.addGroup(a0, a1 - a0, 1);
  tube.geo.addGroup(a1, all - a1, 0);
  // a green tag tied to the top of the green coil (as in a class demonstration), so it reads from afar
  const tag = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.045, 0.04).translate(0, 0.0225, 0), mats.green);
  tag.name = 'MarkedTag';
  tag.castShadow = true;
  const root = new THREE.Group();
  root.name = 'SpringMedium';
  root.add(mesh, tag);
  const a = amplitude('spring');
  function update(t) {
    let s = 0;
    for (let i = 0; i < HELIX; i++) {
      const u = i / (HELIX - 1);
      const x = u * WAVE.L;
      const th = u * coils * Math.PI * 2;
      const c = Math.cos(th);
      const sn = Math.sin(th);
      P[i * 3] = X0 + x + displacement(x, t, a);
      P[i * 3 + 1] = SPRING_Y + RAD * c;
      P[i * 3 + 2] = RAD * sn;
      Rf[i * 3] = 0; // the radial direction: square to both the axis and the wire's way round
      Rf[i * 3 + 1] = c;
      Rf[i * 3 + 2] = sn;
    }
    for (let i = 1; i < N; i++) {
      s += Math.hypot(P[i * 3] - P[i * 3 - 3], P[i * 3 + 1] - P[i * 3 - 2], P[i * 3 + 2] - P[i * 3 - 1]);
      arc[i] = s;
    }
    tube.update(P, Rf, arc);
    tag.position.set(X0 + markedX + displacement(markedX, t, a), SPRING_Y + RAD + SPRING.wire * 0.5, 0);
  }
  /** The marked coil's middle now (world), on its top. */
  const at = (x, t, out) => out.set(X0 + x + displacement(x, t, a), SPRING_Y, 0);
  return { root, mesh, update, at, markedX, loop: { x: loopCx, y: SPRING_Y }, a };
}

// ── the bands on the bench under the spring: darker teal where crowded (সংকোচন), lighter where spread (প্রসারণ) ──
export function createDensityStrip() {
  const W = 256;
  const data = new Uint8Array(W * 4);
  const tex = new THREE.DataTexture(data, W, 1);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(WAVE.L, SPRING.R * 2.9).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  mesh.position.set(X0 + WAVE.L / 2, 0.0012, 0);
  mesh.renderOrder = 1;
  mesh.name = 'DensityBands';
  mesh.userData.noExport = true;
  const dark = [11, 114, 133]; // #0b7285
  const light = [153, 233, 242]; // #99e9f2
  function update(t, aSpring) {
    for (let i = 0; i < W; i++) {
      const xw = (i + 0.5) / W; // along the strip, where the coils are now: find the rest x whose coil is here
      // the strip is in world x; a coil resting at x sits at x + s(x). One fixed-point step is plenty (a·k < 0.5).
      let x = xw * WAVE.L;
      for (let n = 0; n < 3; n++) x = xw * WAVE.L - displacement(x, t, aSpring);
      const sp = spacing(x, t, aSpring); // < 1 crowded, > 1 spread
      const c = Math.max(-1, Math.min(1, (1 - sp) / (aSpring * ((2 * Math.PI) / WAVE.lambda))));
      const k = (c + 1) / 2; // 1 at the most crowded
      const o = i * 4;
      data[o] = light[0] + (dark[0] - light[0]) * k;
      data[o + 1] = light[1] + (dark[1] - light[1]) * k;
      data[o + 2] = light[2] + (dark[2] - light[2]) * k;
      data[o + 3] = 150; // steady: the colour alone goes from light (spread) to dark (crowded)
    }
    tex.needsUpdate = true;
  }
  return { mesh, update };
}

/** The rating plate's face: brushed aluminium with a sine symbol, a small scale and two sockets engraved in it. */
function plateTexture() {
  return canvasTex(256, 128, (ctx, W, H) => {
    const r = rng(7);
    ctx.fillStyle = '#c9ced4';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '90,96,104'},${0.05 + r() * 0.08})`;
      ctx.fillRect(0, r() * H, W, 0.8);
    }
    ctx.strokeStyle = '#2b3038';
    ctx.fillStyle = '#2b3038';
    ctx.lineWidth = 3;
    ctx.beginPath(); // the sine symbol
    for (let x = 0; x <= 90; x += 2) {
      const y = H * 0.36 + Math.sin((x / 90) * Math.PI * 4) * 16;
      x ? ctx.lineTo(18 + x, y) : ctx.moveTo(18 + x, y);
    }
    ctx.stroke();
    ctx.lineWidth = 2; // a scale with ticks
    ctx.beginPath();
    ctx.moveTo(18, H * 0.78);
    ctx.lineTo(120, H * 0.78);
    for (let i = 0; i <= 10; i++) {
      ctx.moveTo(18 + i * 10.2, H * 0.78);
      ctx.lineTo(18 + i * 10.2, H * 0.78 - (i % 5 ? 7 : 13));
    }
    ctx.stroke();
    for (const cx of [170, 218]) {
      // two sockets
      ctx.beginPath();
      ctx.arc(cx, H * 0.55, 17, 0, Math.PI * 2);
      ctx.fillStyle = '#20242b';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#8b929b';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, H * 0.55, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#9aa1aa';
      ctx.fill();
    }
  });
}

// ── the wave driver ───────────────────────────────────────────────────────────
export function createDriver(mats) {
  const root = new THREE.Group();
  root.name = 'WaveDriver';
  const body = new THREE.Group(); // the case, turned per medium
  const W = 0.16;
  const H = 0.13;
  const D = 0.13;
  const box = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, 0.014), mats.case);
  box.position.y = H / 2 + 0.008;
  box.castShadow = true;
  box.name = 'Case';
  const cy = H / 2 + 0.008;
  const zf = D / 2; // the front (+z)
  // the front: a 12 mm brushed-aluminium panel with a round opening for the loudspeaker, and four screws
  const FACE = 0.012;
  const fw = W - 0.02;
  const fh = H - 0.02;
  const shape = new THREE.Shape();
  const rr = 0.006;
  shape.moveTo(-fw / 2 + rr, -fh / 2);
  shape.lineTo(fw / 2 - rr, -fh / 2);
  shape.quadraticCurveTo(fw / 2, -fh / 2, fw / 2, -fh / 2 + rr);
  shape.lineTo(fw / 2, fh / 2 - rr);
  shape.quadraticCurveTo(fw / 2, fh / 2, fw / 2 - rr, fh / 2);
  shape.lineTo(-fw / 2 + rr, fh / 2);
  shape.quadraticCurveTo(-fw / 2, fh / 2, -fw / 2, fh / 2 - rr);
  shape.lineTo(-fw / 2, -fh / 2 + rr);
  shape.quadraticCurveTo(-fw / 2, -fh / 2, -fw / 2 + rr, -fh / 2);
  const hole = new THREE.Path();
  hole.absarc(-0.026, 0, 0.0375, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const face = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: FACE - 0.003,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0013,
      bevelSegments: 2,
      curveSegments: 14,
    }),
    mats.face,
  );
  face.position.set(0, cy, zf + 0.0015);
  face.castShadow = true;
  const zo = zf + FACE - 0.003; // the panel's front surface is at zo + 0.003
  const screwGeo = new THREE.CylinderGeometry(0.0033, 0.0033, 0.0018, 14).rotateX(Math.PI / 2);
  const screws = [];
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const sc = new THREE.Mesh(screwGeo, mats.chrome);
      sc.position.set(sx * (W / 2 - 0.0135), cy + sy * (H / 2 - 0.0135), zo + 0.0045);
      screws.push(sc);
    }
  // the loudspeaker-style coil: a ribbed paper cone sunk behind a chrome bezel, its rubber surround and a dust cap
  const spk = new THREE.Group();
  spk.position.set(-0.026, cy, zo + 0.003);
  const prof = [
    [0.034, 0],
    [0.0325, -0.0015],
    [0.029, -0.0028],
    [0.0262, -0.0048],
    [0.0235, -0.0062],
    [0.02, -0.0092],
    [0.0172, -0.0104],
    [0.0135, -0.0128],
    [0.0105, -0.0138],
    [0.0078, -0.0165],
    [0.0052, -0.0172],
    [0.0, -0.018],
  ].map(([radius, zz]) => new THREE.Vector2(radius, zz * 0.55));
  const cone = new THREE.Mesh(new THREE.LatheGeometry(prof, 32).rotateX(Math.PI / 2), mats.cone);
  const surround = new THREE.Mesh(new THREE.TorusGeometry(0.0345, 0.0034, 10, 44).scale(1, 1, 0.55), mats.rubber);
  surround.position.z = -0.0005;
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.0405, 0.0032, 12, 48), mats.chrome);
  bezel.position.z = 0.0008;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0072, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), mats.face);
  cap.position.z = -0.0172 * 0.55;
  spk.add(cone, surround, bezel, cap);
  // the rating plate: an engraved aluminium label (no words: a sine symbol, a scale and two sockets)
  const ratingPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.02, 0.0016),
    new THREE.MeshStandardMaterial({ name: 'RatingPlate', map: plateTexture(), roughness: 0.4, metalness: 0.6 }),
  );
  ratingPlate.position.set(0.048, cy - 0.033, zo + 0.0038);
  // a knurled control knob with its pointer, and the pilot lamp
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0125, 0.013, 28).rotateX(Math.PI / 2), mats.rubber);
  knob.position.set(0.048, cy + 0.02, zo + 0.0105);
  const knobCap = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.002, 24).rotateX(Math.PI / 2), mats.face);
  knobCap.position.set(0.048, cy + 0.02, zo + 0.0175);
  const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.0018, 0.0075, 0.0012), mats.chrome);
  pointer.position.set(0.048, cy + 0.0245, zo + 0.0188);
  pointer.rotation.z = -0.5;
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.0042, 14, 10),
    new THREE.MeshStandardMaterial({ color: '#ffb02e', emissive: '#ff8a00', emissiveIntensity: 0.0, roughness: 0.3 }),
  );
  lamp.position.set(0.048, cy - 0.007, zo + 0.005);
  const lampRing = new THREE.Mesh(new THREE.TorusGeometry(0.0052, 0.0013, 8, 20), mats.chrome);
  lampRing.position.copy(lamp.position);
  // cooling slots on both sides, merged into one mesh
  const slotParts = [];
  for (let i = 0; i < 6; i++) slotParts.push(new THREE.BoxGeometry(0.0012, 0.05, 0.0032).translate(-(W / 2 + 0.0002), cy, -0.032 + i * 0.0085));
  const slots = new THREE.Mesh(mergeGeometries(slotParts), mats.rubber);
  const feet = [];
  for (const x of [-W / 2 + 0.02, W / 2 - 0.02])
    for (const z of [-D / 2 + 0.02, D / 2 - 0.02]) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.01, 0.008, 16), mats.rubber);
      f.position.set(x, 0.004, z);
      feet.push(f);
    }
  body.add(box, face, ...screws, spk, ratingPlate, knob, knobCap, pointer, lamp, lampRing, slots, ...feet);
  // the bronze bush the rod slides in, and the rod with its clamp / plate
  const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.018, 24), mats.bronze);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 1, 16).translate(0, 0.5, 0), mats.chrome);
  rod.castShadow = true;
  const clamp = new THREE.Group(); // at the rod's end: a bronze block with a screw (rope) or a round plate (spring)
  const jaw = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.026, 0.03, 2, 0.004), mats.bronze);
  jaw.castShadow = true;
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 12).rotateX(Math.PI / 2), mats.chrome);
  screw.position.z = 0.022;
  const screwHead = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 20).rotateX(Math.PI / 2), mats.chrome);
  screwHead.position.z = 0.037;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(SPRING.R - 0.004, SPRING.R - 0.004, 0.006, 48).rotateZ(Math.PI / 2), mats.plate);
  plate.castShadow = true;
  clamp.add(jaw, screw, screwHead, plate);
  root.add(body, bush, rod, clamp);
  let medium = 'rope';
  const ROD = 0.07;
  function setMedium(m) {
    medium = m;
    const rope = m === 'rope';
    jaw.visible = screw.visible = screwHead.visible = rope;
    plate.visible = !rope;
    if (rope) {
      // standing on the bench under the rope's end, the rod straight up
      body.rotation.set(0, 0, 0);
      body.position.set(X0, 0, 0);
      bush.rotation.set(0, 0, 0);
      bush.position.set(X0, H + 0.008 + 0.009, 0);
      rod.rotation.set(0, 0, 0);
    } else {
      // lying on its side behind the spring's end, the rod along the spring's axis
      body.rotation.set(0, 0, 0);
      body.position.set(X0 - ROD - W / 2 + 0.01, 0, 0);
      bush.rotation.set(0, 0, -Math.PI / 2);
      bush.position.set(X0 - ROD + 0.012, SPRING_Y, 0);
      rod.rotation.set(0, 0, -Math.PI / 2);
    }
  }
  /** d: the driven end's displacement now (m), up for the rope, along +x for the spring. */
  function setDisp(d) {
    if (medium === 'rope') {
      const topY = ROPE_Y + d;
      const baseY = H + 0.008;
      rod.position.set(X0, baseY - 0.02, 0);
      rod.scale.set(1, topY - baseY + 0.02 - 0.013, 1);
      clamp.position.set(X0, topY, 0);
    } else {
      const endX = X0 + d - 0.003;
      rod.position.set(X0 - ROD - 0.02, SPRING_Y, 0);
      rod.scale.set(1, endX - (X0 - ROD - 0.02), 1);
      clamp.position.set(endX, SPRING_Y, 0);
    }
  }
  /** The lamp glows while it runs. */
  function setOn(on) {
    lamp.material.emissiveIntensity = on ? 2.2 : 0;
  }
  /** A box round the case, for the action's ring and taps. */
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.2), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  root.add(hit);
  function placeHit() {
    if (medium === 'rope') hit.position.set(X0, 0.18, 0);
    else hit.position.set(X0 - 0.06, 0.08, 0);
    hit.scale.set(1, medium === 'rope' ? 1 : 0.45, 1);
  }
  return {
    root,
    body,
    end: clamp,
    hit,
    setMedium(m) {
      setMedium(m);
      placeHit();
    },
    setDisp,
    setOn,
  };
}

// ── the stand at the far end ──────────────────────────────────────────────────
export function createStand(mats, spring) {
  const root = new THREE.Group();
  root.name = 'Stand';
  const Z = -0.16; // behind the medium
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.018, 0.12, 3, 0.006), mats.iron);
  base.position.set(0, 0.009, 0);
  base.castShadow = true;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.52, 20), mats.chrome);
  rod.position.set(0.05, 0.26 + 0.018, 0);
  rod.castShadow = true;
  const post = new THREE.Group(); // base and rod, placed at the far end, behind
  post.add(base, rod);
  const boss = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.03, 0.03, 2, 0.004), mats.iron);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 1, 16).rotateX(Math.PI / 2).translate(0, 0, 0.5), mats.chrome);
  arm.castShadow = true;
  const jaw = new THREE.Mesh(new RoundedBoxGeometry(0.034, 0.03, 0.03, 2, 0.004), mats.bronze);
  jaw.castShadow = true;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 20), mats.chrome);
  root.add(post, boss, arm, jaw, knob);
  function setMedium(m) {
    const rope = m === 'rope';
    const x = rope ? X0 + WAVE.L + 0.02 : spring.loop.x;
    const y = rope ? ROPE_Y : spring.loop.y + 0.004;
    post.position.set(x - 0.05, 0, Z);
    boss.position.set(x, y, Z);
    arm.position.set(x, y, Z);
    arm.scale.set(1, 1, rope ? -Z : -Z + 0.04);
    jaw.visible = knob.visible = rope;
    jaw.position.set(x, y, 0);
    knob.position.set(x, y + 0.019, 0);
  }
  return { root, setMedium };
}

// ── the rest marks: where the green particle sits when nothing moves ───────────
export function createRestMarks(spring) {
  const root = new THREE.Group();
  root.name = 'RestMarks';
  root.userData.noExport = true;
  // the rope's rest line (সাম্যাবস্থা): a light dashed line along it, behind it a little
  const dashes = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.0025, 0.0025),
    new THREE.MeshBasicMaterial({ color: '#f8f9fa', transparent: true, opacity: 0.85, toneMapped: false }),
    80,
  );
  const M = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3(0.012, 1, 1);
  const p = new THREE.Vector3();
  let n = 0;
  for (let x = 0.02; x < WAVE.L - 0.02; x += 0.026) {
    dashes.setMatrixAt(n++, M.compose(p.set(X0 + x, ROPE_Y, -0.03), q, sc));
  }
  dashes.count = n;
  // the marked particle's rest place: a small ring on the rope's rest line
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.016, 0.0028, 8, 32),
    new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, transparent: true, opacity: 0.95 }),
  );
  ring.position.set(X0 + WAVE.marked, ROPE_Y, -0.03);
  const rope = new THREE.Group();
  rope.add(dashes, ring);
  // the spring's: a strip of white tape on the bench in front of the spring with a dark tick at the green coil's rest
  const tape = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.05).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#f4f1e8', roughness: 0.8 }),
  );
  tape.position.set(X0 + spring.markedX, 0.0015, SPRING.R + 0.045);
  const tick = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.0008, 0.044), new THREE.MeshBasicMaterial({ color: '#1d2733' }));
  tick.position.set(X0 + spring.markedX, 0.002, SPRING.R + 0.045);
  const springMarks = new THREE.Group();
  springMarks.add(tape, tick);
  root.add(rope, springMarks);
  return {
    root,
    setMedium(m) {
      rope.visible = m === 'rope';
      springMarks.visible = m === 'spring';
    },
  };
}
