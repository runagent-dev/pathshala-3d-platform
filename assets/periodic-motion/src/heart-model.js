// An illustrative anterior heart, not a patient scan. Chambers form a continuous asymmetric surface.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createSurface, smoothMin, ellipsoidDistance } from './heart-surface.js';

const PROFILE = [
  [-0.103, 0.033, 0.001, 0.001],
  [-0.093, 0.032, 0.013, 0.011],
  [-0.077, 0.025, 0.025, 0.021],
  [-0.054, 0.014, 0.039, 0.03],
  [-0.028, 0.003, 0.049, 0.035],
  [-0.003, -0.004, 0.05, 0.035],
  [0.018, -0.006, 0.045, 0.03],
  [0.033, -0.008, 0.034, 0.021],
];
function section(y) {
  let i = 1;
  while (i < PROFILE.length - 1 && y > PROFILE[i][0]) i++;
  const a = PROFILE[i - 1],
    b = PROFILE[i],
    t = THREE.MathUtils.clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
  const p = PROFILE[Math.max(0, i - 2)],
    q = PROFILE[Math.min(PROFILE.length - 1, i + 1)];
  const result = [];
  for (let j = 1; j < 4; j++)
    result.push(
      0.5 * (2 * a[j] + (-p[j] + b[j]) * t + (2 * p[j] - 5 * a[j] + 4 * b[j] - q[j]) * t * t + (-p[j] + 3 * a[j] - 3 * b[j] + q[j]) * t * t * t),
    );
  result[1] = Math.max(0.001, result[1]);
  result[2] = Math.max(0.001, result[2]);
  return result;
}
function field(x, y, z) {
  const [cx, rx, rz] = section(y);
  const radial = (Math.hypot((x - cx) / rx, z / rz) - 1) * Math.min(rx, rz);
  let d = -smoothMin(-radial, -Math.max(PROFILE[0][0] - y, y - PROFILE.at(-1)[0]), 0.003);
  // The atria and auricles are shallow tissue lobes joined to the ventricular base.
  const right = ellipsoidDistance(x, y, z, -0.033, 0.025, -0.004, 0.025, 0.027, 0.027);
  const left = ellipsoidDistance(x, y, z, 0.026, 0.028, -0.019, 0.026, 0.022, 0.025);
  d = smoothMin(d, right, 0.01);
  d = smoothMin(d, left, 0.01);
  const auricle = ellipsoidDistance(x, y, z, 0.039, 0.022, 0.015, 0.018, 0.01, 0.013);
  return smoothMin(d, auricle, 0.006);
}
function frontPoint(u, y, lift = 0.0008) {
  const [cx, rx] = section(y),
    x = cx + rx * u;
  let outside = 0.068,
    inside = 0;
  for (let i = 0; i < 18; i++) {
    const z = (outside + inside) / 2;
    if (field(x, y, z) > 0) outside = z;
    else inside = z;
  }
  return new THREE.Vector3(x, y, (outside + inside) / 2 + lift);
}

export function createHeartModel() {
  const root = new THREE.Group();
  root.name = 'SculptedHeart';
  const material = (name, color, roughness = 0.48) =>
    new THREE.MeshPhysicalMaterial({ name, color, roughness, clearcoat: 0.12, clearcoatRoughness: 0.45 });
  const tissue = material('Myocardium', '#ffffff');
  tissue.vertexColors = true;
  const artery = material('ArterialWall', '#cf444d'),
    vein = material('VenousWall', '#475d9e');
  const arteryInside = material('ArterialLumen', '#641f2d', 0.67),
    veinInside = material('VenousLumen', '#242d56', 0.67);
  const coronary = material('CoronaryArteries', '#c32e40'),
    cardiacVein = material('CardiacVeins', '#70465f');
  const sculpt = createSurface('SculptedMyocardium', tissue, root, [-0.068, -0.11, -0.057], [0.07, 0.061, 0.052], 0.0022);
  sculpt.update(field);
  const g = sculpt.mesh.geometry,
    count = g.drawRange.count;
  for (const name of ['position', 'normal']) g.setAttribute(name, new THREE.BufferAttribute(g.attributes[name].array.slice(0, count * 3), 3));
  const colors = new Float32Array(count * 3),
    color = new THREE.Color(),
    lower = new THREE.Color('#d64b52'),
    upper = new THREE.Color('#a83348');
  const pos = g.attributes.position;
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    const fiber = Math.sin(950 * y + 320 * x + 7 * Math.sin(z * 120)) * Math.sin(420 * z - 170 * x);
    color
      .copy(lower)
      .lerp(upper, THREE.MathUtils.smoothstep(y, 0.009, 0.05) * 0.7)
      .multiplyScalar(0.98 + 0.025 * fiber);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  sculpt.mesh.geometry = mergeVertices(g, 1e-6);
  g.dispose();

  function vessel(name, points, radii, paint, lumen = null) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => (p instanceof THREE.Vector3 ? p : new THREE.Vector3(p[0], p[1], p[2]))));
    const segments = lumen ? 72 : 40,
      radial = lumen ? 24 : 10,
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
          r = radiusAt(t) * (inner ? 0.76 : 1);
        for (let j = 0; j <= radial; j++) {
          const angle = (j / radial) * Math.PI * 2,
            n = frames.normals[i],
            b = frames.binormals[i],
            cos = -Math.cos(angle),
            sin = Math.sin(angle);
          p.setXYZ(i * (radial + 1) + j, c.x + r * (cos * n.x + sin * b.x), c.y + r * (cos * n.y + sin * b.y), c.z + r * (cos * n.z + sin * b.z));
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
      return geo;
    }
    const mesh = new THREE.Mesh(geometry(), paint);
    mesh.name = name;
    root.add(mesh);
    if (lumen) {
      const inside = new THREE.Mesh(geometry(true), lumen);
      inside.name = `${name}Lumen`;
      root.add(inside);
      for (const t of [0, 1]) {
        const r = radiusAt(t),
          rim = new THREE.Mesh(new THREE.RingGeometry(r * 0.76, r, radial), paint);
        rim.name = `${name}CutRim`;
        rim.position.copy(curve.getPointAt(t));
        rim.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), curve.getTangentAt(t).multiplyScalar(t === 0 ? -1 : 1));
        root.add(rim);
      }
    }
    return mesh;
  }
  // The major vessels overlap the tissue at their roots and have open, shaded cut ends.
  vessel(
    'Aorta',
    [
      [-0.009, 0.019, -0.002],
      [-0.012, 0.055, 0.003],
      [-0.003, 0.08, -0.002],
      [0.019, 0.089, -0.015],
      [0.038, 0.073, -0.03],
      [0.041, 0.022, -0.038],
    ],
    [0.011, 0.011, 0.01, 0.0095],
    artery,
    arteryInside,
  );
  vessel(
    'BrachiocephalicBranch',
    [
      [-0.008, 0.078, -0.002],
      [-0.011, 0.092, -0.002],
      [-0.02, 0.11, 0.001],
    ],
    [0.0042, 0.0036],
    artery,
    arteryInside,
  );
  vessel(
    'CarotidBranch',
    [
      [0.007, 0.087, -0.009],
      [0.006, 0.102, -0.009],
      [0.009, 0.115, -0.009],
    ],
    [0.0034, 0.0027],
    artery,
    arteryInside,
  );
  vessel(
    'SubclavianBranch',
    [
      [0.021, 0.086, -0.018],
      [0.03, 0.101, -0.02],
      [0.043, 0.106, -0.024],
    ],
    [0.0036, 0.003],
    artery,
    arteryInside,
  );
  vessel(
    'PulmonaryTrunk',
    [
      [0.012, -0.006, 0.012],
      [0.008, 0.032, 0.026],
      [0.015, 0.057, 0.026],
      [0.026, 0.065, 0.011],
    ],
    [0.01, 0.009, 0.0083],
    vein,
    veinInside,
  );
  vessel(
    'LeftPulmonaryArtery',
    [
      [0.018, 0.061, 0.02],
      [0.037, 0.063, 0.01],
      [0.058, 0.063, -0.005],
    ],
    [0.0078, 0.0062],
    vein,
    veinInside,
  );
  vessel(
    'RightPulmonaryArtery',
    [
      [0.018, 0.06, 0.009],
      [-0.006, 0.057, -0.01],
      [-0.041, 0.054, -0.018],
    ],
    [0.0078, 0.006],
    vein,
    veinInside,
  );
  vessel(
    'SuperiorVenaCava',
    [
      [-0.042, 0.02, -0.013],
      [-0.046, 0.053, -0.013],
      [-0.045, 0.091, -0.013],
    ],
    [0.0094, 0.0085],
    vein,
    veinInside,
  );
  vessel(
    'InferiorVenaCava',
    [
      [-0.038, 0.012, -0.022],
      [-0.046, -0.009, -0.027],
      [-0.048, -0.026, -0.029],
    ],
    [0.0092, 0.0084],
    vein,
    veinInside,
  );
  for (const y of [0.024, 0.039])
    vessel(
      'PulmonaryVein',
      [
        [0.023, y, -0.028],
        [0.047, y + 0.002, -0.03],
        [0.058, y + 0.008, -0.034],
      ],
      [0.0055, 0.0045],
      artery,
      arteryInside,
    );

  function coronaryPath(name, points, width, paint = coronary) {
    return vessel(
      name,
      points.map(([u, y]) => frontPoint(u, y)),
      [width, width * 0.75, width * 0.35],
      paint,
    );
  }
  const main = [
    [0.01, 0.024],
    [0.03, 0.006],
    [0.13, -0.018],
    [0.21, -0.045],
    [0.28, -0.067],
    [0.25, -0.088],
  ];
  coronaryPath('AnteriorCoronaryArtery', main, 0.0011);
  coronaryPath(
    'GreatCardiacVein',
    main.map(([u, y]) => [u + 0.08, y]),
    0.00075,
    cardiacVein,
  );
  coronaryPath(
    'RightCoronaryArtery',
    [
      [-0.05, 0.027],
      [-0.42, 0.02],
      [-0.78, 0.005],
      [-0.86, -0.021],
      [-0.73, -0.041],
    ],
    0.00135,
  );
  for (const [y, side] of [
    [-0.004, -1],
    [-0.02, 1],
    [-0.032, -1],
    [-0.049, 1],
    [-0.062, -1],
  ]) {
    coronaryPath(
      'CoronaryBranch',
      [
        [0.1, y],
        [0.3 * side, y - 0.009],
        [0.63 * side, y - 0.02],
      ],
      0.00065,
    );
  }

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
