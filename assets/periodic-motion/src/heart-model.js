// An anatomical heart seen from the front, after medical illustrations (not a patient scan): the right ventricle
// faces the viewer, the left ventricle forms the blunt apex on the viewer's right, the atria with their wrinkled
// auricles sit above the ventricles, and yellow fat fills the grooves between the chambers, where the coronary
// vessels run. One continuous tissue surface (an implicit field meshed once), in metres, about life size.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createSurface, smoothMin, ellipsoidDistance } from './heart-surface.js';

// ── a small deterministic 3D noise, for the tissue's colour and its gentle unevenness ──
function hash(i, j, k) {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 1440662683);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x, y, z) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  const fx = x - xi,
    fy = y - yi,
    fz = z - zi;
  const u = fx * fx * (3 - 2 * fx),
    v = fy * fy * (3 - 2 * fy),
    w = fz * fz * (3 - 2 * fz);
  const lerp = (a, b, t) => a + (b - a) * t;
  const c = (a, b, d) => hash(xi + a, yi + b, zi + d);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}
function fbm(x, y, z, f) {
  return (
    0.55 * noise(x * f, y * f, z * f) +
    0.3 * noise(x * f * 2.1 + 7.3, y * f * 2.1, z * f * 2.1) +
    0.15 * noise(x * f * 4.3, y * f * 4.3 + 3.1, z * f * 4.3)
  );
}
const smoothMax = (a, b, k) => -smoothMin(-a, -b, k);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** A cone with round ends (spheres of radius r1 at a, r2 at b), flattened front to back by `flat`. */
function roundCone(x, y, z, a, b, r1, r2, flat = 1) {
  const px = x - a[0],
    py = y - a[1],
    pz = (z - a[2]) / flat;
  const bx = b[0] - a[0],
    by = b[1] - a[1],
    bz = (b[2] - a[2]) / flat;
  const l2 = bx * bx + by * by + bz * bz,
    rr = r1 - r2,
    a2 = l2 - rr * rr,
    il2 = 1 / l2;
  const yy = px * bx + py * by + pz * bz,
    zz = yy - l2;
  const qx = px * l2 - bx * yy,
    qy = py * l2 - by * yy,
    qz = pz * l2 - bz * yy;
  const x2 = qx * qx + qy * qy + qz * qz,
    y2 = yy * yy * l2,
    z2 = zz * zz * l2,
    k = Math.sign(rr) * rr * rr * x2;
  let d;
  if (Math.sign(zz) * a2 * z2 > k) d = Math.sqrt(x2 + z2) * il2 - r2;
  else if (Math.sign(yy) * a2 * y2 < k) d = Math.sqrt(x2 + y2) * il2 - r1;
  else d = (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
  return d * (flat < 1 ? (1 + flat) / 2 : 1);
}
/** An ellipsoid turned by `angle` about the z axis (the auricles lean). */
function tiltedEllipsoid(x, y, z, c, r, angle) {
  const cos = Math.cos(angle),
    sin = Math.sin(angle),
    dx = x - c[0],
    dy = y - c[1];
  return ellipsoidDistance(c[0] + dx * cos + dy * sin, c[1] - dx * sin + dy * cos, z, c[0], c[1], c[2], r[0], r[1], r[2]);
}

// The ventricles: the left one (back and right, forming the apex) and the right one wrapped over its front.
const LV = { a: [0.012, 0.008, -0.012], b: [0.03, -0.072, 0.003], r1: 0.049, r2: 0.021 };
const RV = { a: [-0.019, 0.0, 0.011], b: [0.014, -0.06, 0.016], r1: 0.043, r2: 0.02 };
const CONUS = { a: [-0.006, 0.0, 0.019], b: [0.006, 0.033, 0.02], r1: 0.015, r2: 0.0115 }; // the right ventricle's outflow
const baseY = (x) => 0.017 + 0.26 * x; // the coronary groove runs up from the viewer's left to the right

/** Every part's distance, so the colour pass can tell muscle from the fat in the grooves. */
function parts(x, y, z) {
  const lv = roundCone(x, y, z, LV.a, LV.b, LV.r1, LV.r2, 0.86);
  const rv = roundCone(x, y, z, RV.a, RV.b, RV.r1, RV.r2, 0.78);
  let ventricles = smoothMin(lv, rv, 0.022);
  ventricles = smoothMax(ventricles, y - baseY(x), 0.012);
  ventricles = smoothMin(ventricles, roundCone(x, y, z, CONUS.a, CONUS.b, CONUS.r1, CONUS.r2, 0.85), 0.008);
  const ra = ellipsoidDistance(x, y, z, -0.042, 0.022, -0.005, 0.025, 0.028, 0.027);
  const la = ellipsoidDistance(x, y, z, 0.016, 0.031, -0.032, 0.029, 0.02, 0.022);
  const rightAuricle = tiltedEllipsoid(x, y, z, [-0.026, 0.038, 0.014], [0.016, 0.009, 0.0085], 0.4);
  const leftAuricle = tiltedEllipsoid(x, y, z, [0.039, 0.033, 0.011], [0.017, 0.0085, 0.011], -0.35);
  const auricles = Math.min(rightAuricle, leftAuricle);
  const atria = smoothMin(smoothMin(ra, la, 0.012), auricles, 0.006);
  // fat fills the coronary groove (ventricles against atria) and the groove between the ventricles
  const near = (a, b, w) => clamp01(1 - Math.abs(a - b) / w);
  const avGroove = near(ventricles, atria, 0.012);
  const ivGroove = near(lv, rv, 0.011) * THREE.MathUtils.smoothstep(y, -0.088, -0.05) * (y < baseY(x) + 0.004 ? 1 : 0);
  return { ventricles, atria, auricles, fat: Math.max(avGroove, ivGroove * 0.9), lv, rv };
}
function field(x, y, z) {
  const p = parts(x, y, z);
  let d = smoothMin(p.ventricles, p.atria, 0.005);
  d -= 0.0012 * p.fat; // the grooves are shallow
  // gentle unevenness of real tissue, and the auricles' crinkled edges
  d += 0.0005 * (noise(x * 95, y * 95, z * 95) - 0.5) + 0.00028 * (noise(x * 260, y * 260 + 2, z * 260) - 0.5);
  if (p.auricles < 0.004) d += 0.0009 * (noise(x * 230, y * 230 + 5, z * 230) - 0.5) * clamp01(1 - p.auricles / 0.004);
  return d;
}

/** Joins vertices closer than `eps` (the mesher can leave two a hair apart) and drops the triangles that collapse. */
function weld(geometry, eps) {
  const p = geometry.attributes.position,
    cells = new Map(),
    remap = new Int32Array(p.count);
  const cell = (v) => Math.floor(v / eps);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    let found = -1;
    for (let dx = -1; dx <= 1 && found < 0; dx++)
      for (let dy = -1; dy <= 1 && found < 0; dy++)
        for (let dz = -1; dz <= 1 && found < 0; dz++)
          for (const j of cells.get(`${cell(x) + dx},${cell(y) + dy},${cell(z) + dz}`) || [])
            if (Math.abs(p.getX(j) - x) <= eps && Math.abs(p.getY(j) - y) <= eps && Math.abs(p.getZ(j) - z) <= eps) {
              found = j;
              break;
            }
    if (found >= 0) remap[i] = found;
    else {
      remap[i] = i;
      const k = `${cell(x)},${cell(y)},${cell(z)}`;
      if (cells.has(k)) cells.get(k).push(i);
      else cells.set(k, [i]);
    }
  }
  const index = geometry.index,
    kept = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = remap[index.getX(i)],
      b = remap[index.getX(i + 1)],
      c = remap[index.getX(i + 2)];
    if (a !== b && b !== c && a !== c) kept.push(a, b, c);
  }
  geometry.setIndex(kept);
  return mergeVertices(geometry.toNonIndexed(), 1e-9);
}

/** The point on the front of the tissue at (x, y), found along the line of sight; lifted a little off it. */
function frontPoint(x, y, lift = 0.0004) {
  let outside = 0.075,
    inside = -0.02;
  for (let i = 0; i < 22; i++) {
    const z = (outside + inside) / 2;
    if (field(x, y, z) > 0) outside = z;
    else inside = z;
  }
  return new THREE.Vector3(x, y, (outside + inside) / 2 + lift);
}
/** Where the two ventricles meet on the front (the anterior groove) at height y. */
function interventricularX(y) {
  let lo = -0.03,
    hi = 0.06;
  for (let i = 0; i < 20; i++) {
    const x = (lo + hi) / 2,
      p = frontPoint(x, y, 0),
      q = parts(p.x, p.y, p.z);
    if (q.rv < q.lv) lo = x;
    else hi = x;
  }
  return (lo + hi) / 2;
}
/** Where the ventricles meet the right atrium on the front (the right coronary groove) at x. */
function coronaryGrooveY(x) {
  let lo = -0.03,
    hi = 0.045;
  for (let i = 0; i < 20; i++) {
    const y = (lo + hi) / 2,
      p = frontPoint(x, y, 0),
      q = parts(p.x, p.y, p.z);
    if (q.atria < q.ventricles) hi = y;
    else lo = y;
  }
  return (lo + hi) / 2;
}

export function createHeartModel() {
  const root = new THREE.Group();
  root.name = 'SculptedHeart';
  // wet tissue: a soft clear coat over a matte colour, so it never looks like painted plastic
  const material = (name, color, roughness = 0.46, clearcoat = 0.85) =>
    new THREE.MeshPhysicalMaterial({ name, color, roughness, clearcoat, clearcoatRoughness: 0.22 });
  const tissue = material('Myocardium', '#ffffff');
  tissue.vertexColors = true;
  // a real heart's vessels are the same red-brown tissue as the heart (no textbook blue)
  const artery = material('ArterialWall', '#9e3a30', 0.55, 0.45),
    vein = material('VenousWall', '#923530', 0.55, 0.45);
  const arteryInside = material('ArterialLumen', '#3a0f12', 0.8, 0.2),
    veinInside = arteryInside;
  const pulmonaryVein = material('PulmonaryVeins', '#983a31', 0.55, 0.45);
  for (const m of [artery, vein, pulmonaryVein]) m.vertexColors = true;
  const coronary = material('CoronaryArteries', '#7f241b', 0.4),
    cardiacVein = material('CardiacVeins', '#6c1d17', 0.4);

  const sculpt = createSurface('SculptedMyocardium', tissue, root, [-0.072, -0.106, -0.06], [0.072, 0.064, 0.058], 0.0019);
  sculpt.update(field);
  const g = sculpt.mesh.geometry,
    count = g.drawRange.count;
  for (const name of ['position', 'normal']) g.setAttribute(name, new THREE.BufferAttribute(g.attributes[name].array.slice(0, count * 3), 3));
  // colour: dark red muscle, mottled and a little streaked along the fibres; cream-yellow fat in the grooves
  const colors = new Float32Array(count * 3),
    color = new THREE.Color(),
    muscleDark = new THREE.Color('#6e1c16'),
    muscle = new THREE.Color('#972c22'),
    muscleLight = new THREE.Color('#b2463a'),
    atrium = new THREE.Color('#8a2a22'),
    fatColor = new THREE.Color();
  const pos = g.attributes.position;
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    const p = parts(x, y, z);
    const mottle = fbm(x, y, z, 70),
      fine = noise(x * 420, y * 420, z * 420),
      fibre = 0.5 + 0.5 * Math.sin(620 * (y + 0.55 * x) + 9 * fbm(x, y, z, 40));
    color.copy(muscleDark).lerp(muscle, clamp01(mottle * 1.6 - 0.2));
    color.lerp(muscleLight, clamp01((mottle - 0.55) * 2.2) * 0.6);
    color.lerp(atrium, clamp01((p.ventricles - p.atria) / 0.01) * 0.55); // the atria are darker and thinner-walled
    color.multiplyScalar(0.93 + 0.07 * fibre + 0.05 * (fine - 0.5));
    // the grooves between the chambers are a little darker, patchy at their edges
    const lobules = fbm(x + 0.3, y, z, 150);
    const fat = THREE.MathUtils.smoothstep(p.fat * (0.6 + 0.8 * lobules), 0.2, 0.55);
    if (fat > 0) color.lerp(fatColor.copy(muscleDark).multiplyScalar(0.85), fat * 0.45);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  sculpt.mesh.geometry = weld(mergeVertices(g, 1e-6), 2e-6);
  g.dispose();

  function vessel(name, points, radii, paint, lumen = null) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => (p instanceof THREE.Vector3 ? p : new THREE.Vector3(p[0], p[1], p[2]))));
    const segments = lumen ? 72 : 48,
      radial = lumen ? 28 : 10,
      frames = curve.computeFrenetFrames(segments, false);
    const radiusAt = (t) => {
      const f = t * (radii.length - 1),
        i = Math.min(radii.length - 2, Math.floor(f));
      return THREE.MathUtils.lerp(radii[i], radii[i + 1], f - i);
    };
    function geometry(inner = false) {
      const geo = new THREE.TubeGeometry(curve, segments, 1, radial, false),
        p = geo.attributes.position;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments,
          c = curve.getPointAt(t),
          r = radiusAt(t) * (inner ? 0.8 : 1);
        for (let j = 0; j <= radial; j++) {
          const angle = (j / radial) * Math.PI * 2,
            n = frames.normals[i],
            b = frames.binormals[i],
            cos = -Math.cos(angle),
            sin = Math.sin(angle);
          // a real vessel is never a perfect pipe: a faint swelling along it
          const swell = inner ? 1 : 1 + 0.05 * Math.sin(t * 11 + angle * 2) * Math.sin(angle * 3 + t * 5);
          p.setXYZ(
            i * (radial + 1) + j,
            c.x + r * swell * (cos * n.x + sin * b.x),
            c.y + r * swell * (cos * n.y + sin * b.y),
            c.z + r * swell * (cos * n.z + sin * b.z),
          );
        }
      }
      if (inner) {
        const idx = geo.index;
        for (let i = 0; i < idx.count; i += 3) {
          const a = idx.getX(i);
          idx.setX(i, idx.getX(i + 2));
          idx.setX(i + 2, a);
        }
      }
      geo.computeVertexNormals();
      // the vessel wall is not one flat colour: soft blotches, a little darker where it meets the heart
      const shade = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i),
          y = p.getY(i),
          z = p.getZ(i);
        const v = inner ? 1 : 0.84 + 0.2 * fbm(x, y, z, 160) + 0.04 * THREE.MathUtils.smoothstep(y, 0.02, 0.06);
        shade.set([v, v * 0.98, v * 0.97], i * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(shade, 3));
      return geo;
    }
    const mesh = new THREE.Mesh(geometry(), paint);
    mesh.name = name;
    root.add(mesh);
    if (lumen) {
      const inside = new THREE.Mesh(geometry(true), lumen);
      inside.name = `${name}Lumen`;
      root.add(inside);
      // only the free end is cut open; the other end is buried in the tissue
      const r = radiusAt(1),
        ring = new THREE.RingGeometry(r * 0.8, r, radial),
        rim = new THREE.Mesh(ring, paint);
      ring.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ring.attributes.position.count * 3).fill(0.9), 3));
      rim.name = `${name}CutRim`;
      rim.position.copy(curve.getPointAt(1));
      rim.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), curve.getTangentAt(1));
      root.add(rim);
    }
    return mesh;
  }

  // ── the great vessels: their roots overlap the tissue, their free ends are cut open ──
  vessel(
    'Aorta',
    [
      [-0.009, 0.022, -0.006],
      [-0.013, 0.052, -0.002],
      [-0.006, 0.079, -0.004],
      [0.014, 0.091, -0.016],
      [0.034, 0.08, -0.03],
      [0.04, 0.046, -0.04],
      [0.039, 0.016, -0.043],
    ],
    [0.0128, 0.0132, 0.0124, 0.0115],
    artery,
    arteryInside,
  );
  vessel(
    'BrachiocephalicBranch',
    [
      [-0.006, 0.079, -0.004],
      [-0.011, 0.096, -0.004],
      [-0.019, 0.113, -0.002],
    ],
    [0.0052, 0.0045],
    artery,
    arteryInside,
  );
  vessel(
    'CarotidBranch',
    [
      [0.008, 0.088, -0.011],
      [0.007, 0.104, -0.011],
      [0.01, 0.117, -0.011],
    ],
    [0.0038, 0.0032],
    artery,
    arteryInside,
  );
  vessel(
    'SubclavianBranch',
    [
      [0.021, 0.087, -0.021],
      [0.029, 0.102, -0.023],
      [0.041, 0.109, -0.026],
    ],
    [0.0042, 0.0035],
    artery,
    arteryInside,
  );
  vessel(
    'PulmonaryTrunk',
    [
      [0.004, 0.024, 0.019],
      [0.006, 0.042, 0.024],
      [0.014, 0.06, 0.021],
      [0.024, 0.067, 0.008],
    ],
    [0.0115, 0.0112, 0.0104],
    vein,
    veinInside,
  );
  vessel(
    'LeftPulmonaryArtery',
    [
      [0.02, 0.064, 0.014],
      [0.037, 0.066, 0.005],
      [0.058, 0.064, -0.008],
    ],
    [0.0082, 0.0068],
    vein,
    veinInside,
  );
  vessel(
    'RightPulmonaryArtery',
    [
      [0.02, 0.063, 0.006],
      [-0.004, 0.059, -0.013],
      [-0.04, 0.056, -0.02],
    ],
    [0.0082, 0.0066],
    vein,
    veinInside,
  );
  vessel(
    'SuperiorVenaCava',
    [
      [-0.044, 0.022, -0.012],
      [-0.047, 0.055, -0.012],
      [-0.046, 0.094, -0.012],
    ],
    [0.0105, 0.0098],
    vein,
    veinInside,
  );
  vessel(
    'InferiorVenaCava',
    [
      [-0.04, 0.012, -0.022],
      [-0.047, -0.01, -0.028],
      [-0.049, -0.03, -0.03],
    ],
    [0.0105, 0.0098],
    vein,
    veinInside,
  );
  for (const y of [0.024, 0.04])
    vessel(
      'PulmonaryVein',
      [
        [0.024, y, -0.03],
        [0.048, y + 0.002, -0.033],
        [0.06, y + 0.007, -0.037],
      ],
      [0.0058, 0.0049],
      pulmonaryVein,
      arteryInside,
    );

  // ── the coronary vessels, lying half sunk in the fat of the grooves ──
  function surfacePath(name, points, width, paint = coronary) {
    return vessel(
      name,
      points.map(([x, y]) => frontPoint(x, y, width * 0.55)).filter((p) => p.z > 0.004), // only where it lies on the front
      [width, width * 0.8, width * 0.4],
      paint,
    );
  }
  const ivY = [0.012, 0.0, -0.014, -0.03, -0.046, -0.06, -0.072, -0.082];
  const lad = ivY.map((y) => [interventricularX(y), y]);
  lad.push([lad.at(-1)[0] + 0.006, -0.092]); // it turns round the apex
  surfacePath('AnteriorCoronaryArtery', lad, 0.0026);
  surfacePath(
    'GreatCardiacVein',
    lad.slice(0, -1).map(([x, y], i) => [x + 0.0045 - i * 0.0002, y + 0.002]),
    0.0013,
    cardiacVein,
  );
  // diagonal branches over the left ventricle, small ones over the right
  for (const [i, len] of [
    [1, 0.03],
    [3, 0.026],
    [5, 0.018],
  ]) {
    const [x, y] = lad[i];
    surfacePath(
      'DiagonalBranch',
      [
        [x, y],
        [x + len * 0.45, y - len * 0.42],
        [x + len, y - len * 0.85],
      ],
      0.0014,
    );
  }
  // fine twigs branching off the big vessels, as on a real heart (deterministic, so every load looks the same)
  function twigs(path, count, side, length, seed) {
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count,
        i = Math.min(path.length - 2, Math.floor(t * (path.length - 1))),
        [x0, y0] = path[i],
        [x1, y1] = path[i + 1],
        f = t * (path.length - 1) - i,
        x = x0 + (x1 - x0) * f,
        y = y0 + (y1 - y0) * f,
        r = hash(seed, k, 3),
        len = length * (0.6 + 0.6 * r),
        dir = side * (0.7 + 0.5 * hash(seed, k, 5));
      const bend = (hash(seed, k, 7) - 0.5) * 0.4;
      surfacePath(
        'CoronaryTwig',
        [
          [x, y],
          [x + dir * len * 0.3, y - len * (0.12 + bend * 0.5)],
          [x + dir * len * 0.62, y - len * (0.42 + bend)],
          [x + dir * len * (0.85 + bend), y - len * (0.85 + bend)],
        ],
        0.0009 + 0.0004 * r,
      );
    }
  }
  twigs(lad, 7, 1, 0.022, 11);
  twigs(lad, 6, -1, 0.018, 12);
  for (const i of [2, 4]) {
    const [x, y] = lad[i];
    surfacePath(
      'RightVentricularBranch',
      [
        [x, y],
        [x - 0.012, y - 0.004],
        [x - 0.022, y - 0.012],
      ],
      0.001,
    );
  }
  const rca = [-0.004, -0.014, -0.024, -0.034, -0.042, -0.048].map((x) => [x, coronaryGrooveY(x)]);
  rca.push([-0.054, rca.at(-1)[1] - 0.012]);
  surfacePath('RightCoronaryArtery', rca, 0.0026);
  surfacePath(
    'MarginalBranch',
    [
      [rca[4][0], rca[4][1]],
      [rca[4][0] + 0.004, rca[4][1] - 0.025],
      [rca[4][0] + 0.012, rca[4][1] - 0.05],
    ],
    0.0009,
  );
  twigs(rca, 5, 1, 0.02, 21);
  for (const i of [2, 3])
    surfacePath(
      'AnteriorCardiacVein',
      [
        [rca[i][0] + 0.002, rca[i][1] + 0.003],
        [rca[i][0] + 0.006, rca[i][1] - 0.016],
        [rca[i][0] + 0.011, rca[i][1] - 0.032],
      ],
      0.0008,
      cardiacVein,
    );

  // Bake each child's local placement before applying the same continuous squeeze to tissue and vessels.
  root.updateMatrixWorld(true);
  const bindings = [];
  for (const mesh of [...root.children]) {
    if (!(mesh instanceof THREE.Mesh)) continue;
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
    mesh.position.set(0, 0, 0);
    mesh.quaternion.identity();
    mesh.scale.set(1, 1, 1);
    const p = mesh.geometry.attributes.position,
      n = mesh.geometry.attributes.normal;
    bindings.push({ mesh, positions: p.array.slice(), normals: n.array.slice() });
  }
  let lastA = -1,
    lastV = -1;
  return {
    root,
    beat(atria, ventricles) {
      if (atria === lastA && ventricles === lastV) return;
      lastA = atria;
      lastV = ventricles;
      for (const binding of bindings) {
        const p = binding.mesh.geometry.attributes.position,
          n = binding.mesh.geometry.attributes.normal;
        for (let i = 0; i < p.count; i++) {
          const x = binding.positions[i * 3],
            y = binding.positions[i * 3 + 1],
            z = binding.positions[i * 3 + 2];
          const a = THREE.MathUtils.smoothstep(y, 0.008, 0.042),
            fade = 1 - THREE.MathUtils.smoothstep(y, 0.034, 0.074);
          const amount = (0.095 * ventricles * (1 - a) + 0.06 * atria * a) * fade;
          const sx = 1 - amount,
            sy = 1 - amount * 0.55,
            sz = 1 - amount * 0.9;
          p.setXYZ(i, 0.006 + (x - 0.006) * sx, 0.016 + (y - 0.016) * sy, z * sz);
          const nx = binding.normals[i * 3] / sx,
            ny = binding.normals[i * 3 + 1] / sy,
            nz = binding.normals[i * 3 + 2] / sz,
            len = Math.hypot(nx, ny, nz) || 1;
          n.setXYZ(i, nx / len, ny / len, nz / len);
        }
        p.needsUpdate = true;
        n.needsUpdate = true;
      }
    },
  };
}
