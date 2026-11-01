// Articulated rope puller, metres, local +x toward the crate.
// Continuous swept limbs round each joint; the knees bend toward the toes.
// Kept light without losing detail: the connected shirt and trousers are sculpted once (shared by every puller) and
// skinned on the GPU; the parts that never move against each other (the face, the collar and buttons, each hand, each
// shoe) are merged into one vertex-coloured mesh each; the materials are shared.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { bakeSurface, smoothMin, ellipsoidDistance, boneDistance } from './surface.js';

const HIP_Y = 0.86;
const THIGH = 0.43,
  SHIN = 0.41,
  UPPER = 0.32,
  FORE = 0.3;
const SHOULDER_Y = 0.425,
  SHOULDER_Z = 0.158;
const UP = new THREE.Vector3(0, 1, 0),
  Z = new THREE.Vector3(0, 0, 1);
const FRONT = new THREE.Vector3(1, 0, 0);

/** Materials per colour scheme, shared by every puller. */
const MATERIALS = new Map();
function materialsFor(shirt, trousers) {
  const key = `${shirt}|${trousers}`;
  if (!MATERIALS.has(key)) {
    const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });
    MATERIALS.set(key, {
      shirt: mat('Shirt', shirt),
      trousers: mat('Trousers', trousers),
      skin: mat('Skin', '#b98057', 0.7),
      hair: mat('Hair', '#222128'),
      shoe: mat('Shoes', '#232c3a'),
      sole: mat('ShoeSole', '#ced7dc'),
      eye: mat('Eyes', '#211d1b'),
      white: mat('EyeWhite', '#fff4e5'),
      lips: mat('Lips', '#774631'),
      seam: mat('ShirtSeams', '#d95412'),
      // the merged rigid parts keep each part's colour as vertex colours
      paint: new THREE.MeshStandardMaterial({ name: 'PersonParts', vertexColors: true, roughness: 0.75, metalness: 0 }),
    });
  }
  return MATERIALS.get(key);
}

/**
 * Merges every mesh under `group` (but not under `skip`) into one mesh in `group`'s frame, each part's colour kept as
 * vertex colours, in the shared vertex-coloured material. The parts are removed.
 */
function mergeParts(group, name, paint, skip = null) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const m = new THREE.Matrix4();
  const parts = [];
  const walk = (o) => {
    for (const c of o.children) {
      if (c === skip) continue;
      if (/** @type {THREE.Mesh} */ (c).isMesh && /** @type {any} */ (c).material.visible !== false) parts.push(c);
      walk(c);
    }
  };
  walk(group);
  const geos = parts.map((part) => {
    let g = part.geometry.clone();
    for (const key of Object.keys(g.attributes)) if (key !== 'position' && key !== 'normal') g.deleteAttribute(key);
    if (g.index) g = g.toNonIndexed();
    const color = part.material.color;
    const rgb = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < rgb.length; i += 3) color.toArray(rgb, i);
    g.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
    g.applyMatrix4(m.multiplyMatrices(inv, part.matrixWorld));
    return g;
  });
  const merged = new THREE.Mesh(mergeGeometries(geos, false), paint);
  merged.name = name;
  for (const g of geos) g.dispose();
  for (const part of parts) part.removeFromParent();
  group.add(merged);
  return merged;
}

// The clothing sculpt (the same for every puller: it is made in the rest pose), baked on first use.
let SCULPT = null;
const smoothstep = THREE.MathUtils.smoothstep;

/** The four largest of a vertex's bone weights (the GPU skins with four), normalised. */
function topFour(weights, skinIndex, skinWeight, i) {
  const order = weights.map((_w, j) => j).sort((a, b) => weights[b] - weights[a]);
  let sum = 0;
  for (let k = 0; k < 4; k++) sum += weights[order[k]] || 0;
  for (let k = 0; k < 4; k++) {
    const j = order[k];
    skinIndex[i * 4 + k] = j ?? 0;
    skinWeight[i * 4 + k] = j == null || sum <= 0 ? (k === 0 ? 1 : 0) : (weights[j] || 0) / sum;
  }
}
function skin(geometry, weightsAt) {
  const p = geometry.attributes.position;
  const skinIndex = new Uint16Array(p.count * 4),
    skinWeight = new Float32Array(p.count * 4);
  for (let i = 0; i < p.count; i++) topFour(weightsAt(p.getX(i), p.getY(i), p.getZ(i)), skinIndex, skinWeight, i);
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
  return geometry;
}

/** Shirt and sleeves form one surface; pelvis and both legs form another. Sculpted in the rest pose. */
function sculpt(lean, hipY, joints, shirtFrames, pantsFrames) {
  const cosine = Math.cos(lean),
    sine = Math.sin(lean);
  const profile = [
    [-0.02, 0.12, 0.145],
    [0.1, 0.13, 0.155],
    [0.25, 0.132, 0.18],
    [0.39, 0.115, 0.185],
    [0.465, 0.052, 0.072],
  ];
  const arms = joints.arms.map((j) => ({ shoulder: j.shoulder.clone(), elbow: j.elbow.clone() }));
  const legs = joints.legs.map((j) => ({ hip: j.hip.clone(), knee: j.knee.clone(), ankle: j.ankle.clone() }));
  const cuffs = arms.map((j) => j.shoulder.clone().lerp(j.elbow, 0.65));
  const bodyDistance = (x, y, z) => {
    const lx = cosine * x - sine * (y - hipY),
      ly = sine * x + cosine * (y - hipY);
    const clamped = THREE.MathUtils.clamp(ly, profile[0][0], profile.at(-1)[0]);
    let rx = 0.12,
      rz = 0.145;
    for (let i = 1; i < profile.length; i++)
      if (clamped <= profile[i][0]) {
        const a = profile[i - 1],
          b = profile[i],
          t = (clamped - a[0]) / (b[0] - a[0]);
        rx = a[1] + (b[1] - a[1]) * t;
        rz = a[2] + (b[2] - a[2]) * t;
        break;
      }
    const radial = (Math.hypot((lx - 0.005) / rx, z / rz) - 1) * Math.min(rx, rz);
    const vertical = Math.max(profile[0][0] - ly, ly - profile.at(-1)[0]);
    return -smoothMin(-radial, -vertical, 0.012);
  };
  const shirt = bakeSurface([-0.3, 0.58, -0.29], [0.43, 1.47, 0.29], 0.016, (x, y, z) => {
    let d = bodyDistance(x, y, z);
    for (let i = 0; i < arms.length; i++) d = smoothMin(d, boneDistance(x, y, z, arms[i].shoulder, cuffs[i], 0.057, 0.05), 0.025);
    return d;
  });
  const pants = bakeSurface([-0.42, 0.015, -0.27], [0.49, 1.0, 0.27], 0.017, (x, y, z) => {
    let d = ellipsoidDistance(x, y, z, 0, hipY - 0.055, 0, 0.115, 0.145, 0.146);
    for (const j of legs) {
      d = smoothMin(d, boneDistance(x, y, z, j.hip, j.knee, 0.072, 0.056), 0.035);
      d = smoothMin(d, boneDistance(x, y, z, j.knee, j.ankle, 0.054, 0.037, 0.007), 0.025);
    }
    return Math.max(d, y - (hipY + 0.014));
  });
  const p = new THREE.Vector3(),
    v = new THREE.Vector3(),
    w = new THREE.Vector3();
  skin(shirt, (x, y, z) => {
    p.set(x, y, z);
    const influences = arms.map((j, i) => {
      v.subVectors(cuffs[i], j.shoulder);
      const t = THREE.MathUtils.clamp(w.subVectors(p, j.shoulder).dot(v) / v.lengthSq(), 0, 1);
      const distance = p.distanceTo(w.copy(j.shoulder).addScaledVector(v, t));
      return (1 - smoothstep(distance, 0.063, 0.11)) * smoothstep(bodyDistance(x, y, z), -0.025, 0.025);
    });
    const sum = influences[0] + influences[1],
      factor = sum > 1 ? 1 / sum : 1;
    return [1 - Math.min(sum, 1), ...influences.map((x) => x * factor)];
  });
  skin(pants, (_x, y, z) => {
    const body = smoothstep(y, hipY - 0.22, hipY - 0.08),
      near = smoothstep(z, -0.06, 0.06);
    const weights = [body];
    for (let i = 0; i < 2; i++) {
      const thigh = smoothstep(y, legs[i].knee.y - 0.065, legs[i].knee.y + 0.065),
        side = i === 0 ? near : 1 - near;
      weights.push((1 - body) * side * thigh, (1 - body) * side * (1 - thigh));
    }
    return weights;
  });
  return {
    shirt,
    pants,
    shirtRest: shirtFrames.map((m) => m.clone()),
    pantsRest: pantsFrames.map((m) => m.clone()),
  };
}

export function createPuller({ shirt = '#ff790f', trousers = '#2542a5' } = {}) {
  const root = new THREE.Group();
  root.name = 'RopePuller';
  const M = materialsFor(shirt, trousers);
  /** @param {THREE.BufferGeometry} g @param {THREE.Material} m @param {THREE.Object3D} [parent] */
  const mesh = (g, m, parent = root, name = '') => {
    const o = new THREE.Mesh(g, m);
    o.name = name;
    parent.add(o);
    return o;
  };
  /** @param {THREE.Object3D} [parent] */
  const ellipsoid = (r, scale, position, material, parent = root, name = '') => {
    // segments to suit the size on screen: an eye is a few pixels, a shoe's collar a little more
    const size = r * Math.max(...scale);
    const o = mesh(
      new THREE.SphereGeometry(r, size < 0.008 ? 10 : size < 0.02 ? 16 : 24, size < 0.008 ? 8 : size < 0.02 ? 12 : 16),
      material,
      parent,
      name,
    );
    o.scale.set(scale[0], scale[1], scale[2]);
    o.position.set(position[0], position[1], position[2]);
    return o;
  };
  // A closed smooth loft, with independent front/back/width profiles (rather than a stack of balls).
  function loft(profile, material, parent, name) {
    const points = profile.map(([y, back, front, width]) => new THREE.Vector3((front + back) / 2, y, width));
    const centre = new THREE.CatmullRomCurve3(points);
    const radii = new THREE.CatmullRomCurve3(profile.map(([y, back, front, width]) => new THREE.Vector3((front - back) / 2, width, y)));
    const radial = 32,
      rings = 24,
      positions = [],
      indices = [];
    for (let i = 0; i <= rings; i++) {
      const c = centre.getPoint(i / rings),
        r = radii.getPoint(i / rings);
      for (let j = 0; j <= radial; j++) {
        const angle = (j / radial) * Math.PI * 2;
        positions.push(c.x + r.x * Math.cos(angle), c.y, r.y * Math.sin(angle));
      }
    }
    for (let i = 0; i < rings; i++)
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j,
          b = a + radial + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    for (const i of [0, rings]) {
      const top = i === rings;
      const c = centre.getPoint(i / rings),
        k = positions.length / 3;
      positions.push(c.x, c.y, 0);
      const first = i * (radial + 1);
      for (let j = 0; j < radial; j++) indices.push(k, first + j + (top ? 1 : 0), first + j + (top ? 0 : 1));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return mesh(g, material, parent, name);
  }
  const upper = new THREE.Group();
  root.add(upper);
  const pelvis = new THREE.Object3D();
  const neck = mesh(new THREE.CapsuleGeometry(0.045, 0.065, 8, 24), M.skin, upper, 'Neck');
  neck.position.set(0.005, 0.515, 0);
  // One head surface continues from chin through cheeks and brow to the skull.
  loft(
    [
      [0.555, -0.008, 0.046, 0.031],
      [0.578, -0.04, 0.074, 0.056],
      [0.615, -0.068, 0.092, 0.075],
      [0.66, -0.083, 0.093, 0.083],
      [0.705, -0.085, 0.081, 0.083],
      [0.748, -0.074, 0.07, 0.071],
      [0.782, -0.046, 0.047, 0.045],
      [0.798, -0.004, 0.006, 0.005],
    ],
    M.skin,
    upper,
    'AnatomicalHead',
  );
  // Hair follows a shaped hairline, covering the skull without loose spherical tufts.
  const hairPositions = [],
    hairIndices = [],
    hr = 32,
    hy = 14;
  for (let i = 0; i <= hy; i++)
    for (let j = 0; j <= hr; j++) {
      const phi = (j / hr) * Math.PI * 2;
      const hairline = 0.706 + 0.033 * Math.cos(phi);
      const theta = 0.015 + ((Math.acos((hairline - 0.704) / 0.105) - 0.015) * i) / hy;
      hairPositions.push(-0.007 + 0.094 * Math.sin(theta) * Math.cos(phi), 0.704 + 0.105 * Math.cos(theta), 0.091 * Math.sin(theta) * Math.sin(phi));
    }
  for (let i = 0; i < hy; i++)
    for (let j = 0; j < hr; j++) {
      const a = i * (hr + 1) + j,
        b = a + hr + 1;
      hairIndices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const hairGeo = new THREE.BufferGeometry();
  hairGeo.setAttribute('position', new THREE.Float32BufferAttribute(hairPositions, 3));
  hairGeo.setIndex(hairIndices);
  hairGeo.computeVertexNormals();
  mesh(hairGeo, M.hair, upper, 'ShapedHair');
  ellipsoid(1, [0.013, 0.028, 0.012], [0.09, 0.666, 0], M.skin, upper, 'NoseBridge');
  ellipsoid(1, [0.017, 0.011, 0.015], [0.108, 0.648, 0], M.skin, upper, 'Nose');
  function line(points, radius, material, parent, name) {
    return mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 16, radius, 8, false),
      material,
      parent,
      name,
    );
  }
  line(
    [
      [-0.006, 0.47, -0.063],
      [0.06, 0.46, -0.037],
      [0.065, 0.437, 0],
      [0.06, 0.46, 0.037],
      [-0.006, 0.47, 0.063],
    ],
    0.012,
    M.seam,
    upper,
    'PoloCollar',
  );
  line(
    [
      [0.087, 0.617, -0.024],
      [0.096, 0.613, 0],
      [0.087, 0.617, 0.024],
    ],
    0.0018,
    M.lips,
    upper,
    'Mouth',
  );
  for (const side of [-1, 1]) {
    ellipsoid(1, [0.012, 0.026, 0.015], [-0.025, 0.659, side * 0.081], M.skin, upper, 'Ear');
    ellipsoid(1, [0.005, 0.006, 0.011], [0.074, 0.698, side * 0.05], M.white, upper, 'EyeWhite');
    ellipsoid(1, [0.003, 0.0045, 0.0048], [0.078, 0.698, side * 0.052], M.eye, upper, side > 0 ? 'EyeNear' : 'EyeFar');
    line(
      [
        [0.072, 0.714, side * 0.038],
        [0.075, 0.718, side * 0.051],
        [0.067, 0.714, side * 0.063],
      ],
      0.0025,
      M.hair,
      upper,
      'Brow',
    );
  }
  for (let i = 0; i < 3; i++) ellipsoid(0.004, [1, 1, 1], [0.127, 0.37 - i * 0.035, 0], M.white, upper, 'ShirtButton');

  const headRig = new THREE.Group();
  headRig.name = 'HeadPose';
  headRig.position.y = 0.52;
  const faceParts = new Set(['AnatomicalHead', 'ShapedHair', 'NoseBridge', 'Nose', 'Mouth', 'Ear', 'EyeWhite', 'EyeNear', 'EyeFar', 'Brow']);
  for (const part of [...upper.children])
    if (faceParts.has(part.name)) {
      headRig.add(part);
      part.position.y -= 0.52;
    }
  upper.add(headRig);
  // the face is one mesh (named for the head), the neck, collar and buttons another
  mergeParts(headRig, 'AnatomicalHead', M.paint);
  mergeParts(upper, 'NeckAndCollar', M.paint, headRig);

  // A limb is one closed mesh from its top to its cuff, including the bend.
  // Its rings are updated in place, so there is no open cylinder end at an elbow/knee.
  function swept(name, material, profile, radial = 24, rings = 32) {
    const g = new THREE.BufferGeometry(),
      positions = new Float32Array(((rings + 1) * (radial + 1) + 2) * 3),
      indices = [];
    for (let i = 0; i < rings; i++)
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j,
          b = a + radial + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const end = (rings + 1) * (radial + 1);
    for (let j = 0; j < radial; j++) {
      indices.push(end, j, j + 1);
      const a = rings * (radial + 1) + j;
      indices.push(end + 1, a + 1, a);
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setIndex(indices);
    const o = mesh(g, material, root, name),
      p = new THREE.Vector3(),
      tangent = new THREE.Vector3(),
      normal = new THREE.Vector3(),
      ab = new THREE.Vector3(),
      bc = new THREE.Vector3(),
      entry = new THREE.Vector3(),
      exit = new THREE.Vector3(),
      tmp = new THREE.Vector3();
    const radiusAt = (t) => {
      for (let i = 1; i < profile.length; i++)
        if (t <= profile[i][0]) {
          const [t0, r0] = profile[i - 1],
            [t1, r1] = profile[i],
            u = (t - t0) / (t1 - t0);
          return THREE.MathUtils.lerp(r0, r1, u * u * (3 - 2 * u));
        }
      return profile.at(-1)[1];
    };
    return {
      mesh: o,
      set(a, b, c, bend = 0.055) {
        // a straight part, a rounded bend (a quadratic curve) and a straight part, sampled by length; nothing allocated
        ab.subVectors(b, a).normalize();
        bc.subVectors(c, b).normalize();
        const cut = Math.min(bend, a.distanceTo(b) * 0.25, b.distanceTo(c) * 0.25);
        entry.copy(b).addScaledVector(ab, -cut);
        exit.copy(b).addScaledVector(bc, cut);
        const l1 = a.distanceTo(entry),
          l2 = entry.distanceTo(b) * 0.5 + b.distanceTo(exit) * 0.5 + entry.distanceTo(exit) * 0.5, // close to the curve's length
          l3 = exit.distanceTo(c),
          total = l1 + l2 + l3;
        for (let i = 0; i <= rings; i++) {
          const s = (i / rings) * total;
          if (s <= l1) {
            p.copy(a).lerp(entry, l1 > 0 ? s / l1 : 0);
            tangent.copy(ab);
          } else if (s <= l1 + l2) {
            const u = (s - l1) / l2,
              k = 1 - u;
            p.copy(entry)
              .multiplyScalar(k * k)
              .addScaledVector(b, 2 * k * u)
              .addScaledVector(exit, u * u);
            tangent
              .subVectors(b, entry)
              .multiplyScalar(2 * k)
              .addScaledVector(tmp.subVectors(exit, b), 2 * u)
              .normalize();
          } else {
            p.copy(exit).lerp(c, l3 > 0 ? (s - l1 - l2) / l3 : 1);
            tangent.copy(bc);
          }
          normal.crossVectors(tangent, Z).normalize();
          const r = radiusAt(i / rings);
          for (let j = 0; j <= radial; j++) {
            const ang = (j / radial) * Math.PI * 2,
              k = (i * (radial + 1) + j) * 3;
            positions[k] = p.x + normal.x * r * Math.cos(ang);
            positions[k + 1] = p.y + normal.y * r * Math.cos(ang);
            positions[k + 2] = p.z + r * Math.sin(ang);
          }
        }
        a.toArray(positions, end * 3);
        c.toArray(positions, (end + 1) * 3);
        g.attributes.position.needsUpdate = true;
        g.computeVertexNormals();
        g.computeBoundingSphere();
      },
    };
  }
  function makeHand(side) {
    const hand = new THREE.Group();
    hand.name = side > 0 ? 'HandNear' : 'HandFar';
    root.add(hand);
    ellipsoid(1, [0.027, 0.038, 0.019], [0, 0.008, 0], M.skin, hand, 'Palm');
    // Curled fingers hold the crossbar; all finger roots remain inside the palm.
    for (let i = 0; i < 4; i++)
      line(
        [
          [-0.018 + i * 0.011, 0.02, 0.008],
          [-0.018 + i * 0.011, 0.04, 0.018],
          [-0.018 + i * 0.011, 0.045, 0.032],
          [-0.018 + i * 0.011, 0.03, 0.036],
        ],
        0.0055,
        M.skin,
        hand,
        'Finger',
      );
    line(
      [
        [-0.021, 0.0, 0.005],
        [-0.031, 0.017, 0.021],
        [-0.02, 0.029, 0.033],
      ],
      0.007,
      M.skin,
      hand,
      'Thumb',
    );
    mergeParts(hand, 'Hand', M.paint);
    return hand;
  }
  const arms = [1, -1].map((side) => ({
    side,
    skin: swept('ContinuousArm', M.skin, [
      [0, 0.048],
      [0.28, 0.048],
      [0.52, 0.037],
      [0.75, 0.039],
      [1, 0.023],
    ]),
    hand: makeHand(side),
  }));
  const shoeShape = new THREE.Shape();
  shoeShape.moveTo(-0.105, -0.04);
  shoeShape.quadraticCurveTo(-0.125, -0.035, -0.12, 0.025);
  shoeShape.quadraticCurveTo(-0.11, 0.045, -0.075, 0.045);
  shoeShape.lineTo(0.072, 0.045);
  shoeShape.quadraticCurveTo(0.13, 0.04, 0.13, 0);
  shoeShape.quadraticCurveTo(0.13, -0.04, 0.072, -0.045);
  shoeShape.lineTo(-0.105, -0.04);
  const shoeGeometry = new THREE.ExtrudeGeometry(shoeShape, {
    depth: 0.043,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 3,
    curveSegments: 10,
  })
    .rotateX(Math.PI / 2)
    .translate(0, 0.052, 0);
  const soleGeometry = new THREE.ExtrudeGeometry(shoeShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelSize: 0.006,
    bevelThickness: 0.003,
    bevelSegments: 2,
    curveSegments: 10,
  })
    .rotateX(Math.PI / 2)
    .translate(0, 0.015, 0);
  const legs = [1, -1].map((side, i) => {
    const foot = new THREE.Group();
    foot.name = i === 0 ? 'RearShoe' : 'OtherShoe';
    root.add(foot);
    mesh(shoeGeometry, M.shoe, foot, 'Shoe');
    mesh(soleGeometry, M.sole, foot, 'GripSole');
    ellipsoid(1, [0.046, 0.04, 0.043], [-0.055, 0.063, 0], M.shoe, foot, 'ShoeCollar');
    for (let j = 0; j < 4; j++) {
      const lace = mesh(new THREE.BoxGeometry(0.007, 0.004, 0.058), M.white, foot, 'Lace');
      lace.position.set(-0.035 + j * 0.023, 0.06, 0);
    }
    mergeParts(foot, 'Shoe', M.paint);
    return { side, foot };
  });
  const hit = mesh(new THREE.BoxGeometry(0.95, 1.8, 0.5), new THREE.MeshBasicMaterial({ visible: false }), root);
  hit.position.set(0.05, 0.9, 0);
  hit.userData.noExport = true;
  const joints = { arms: [{}, {}], legs: [{}, {}] },
    lastToe = new THREE.Vector3(),
    lastHeel = new THREE.Vector3();
  const u = new THREE.Vector3(),
    n = new THREE.Vector3();
  function reach(a, target, l1, l2, pole, joint, end) {
    u.subVectors(target, a);
    const d = Math.min(Math.max(u.length(), 0.05), l1 + l2 - 1e-4);
    u.normalize();
    end.copy(a).addScaledVector(u, d);
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d),
      h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    n.copy(pole).addScaledVector(u, -pole.dot(u)).normalize();
    joint.copy(a).addScaledVector(u, along).addScaledVector(n, h);
  }
  const shoulder = new THREE.Vector3(),
    elbow = new THREE.Vector3(),
    hand = new THREE.Vector3(),
    hip = new THREE.Vector3(),
    knee = new THREE.Vector3(),
    ankle = new THREE.Vector3(),
    aim = new THREE.Vector3(),
    armPole = new THREE.Vector3();
  // the joints of the current pose (reused: nothing is allocated per pose)
  for (let i = 0; i < 2; i++) {
    joints.arms[i] = { shoulder: new THREE.Vector3(), elbow: new THREE.Vector3(), hand: new THREE.Vector3() };
    joints.legs[i] = { hip: new THREE.Vector3(), knee: new THREE.Vector3(), ankle: new THREE.Vector3() };
  }
  const _q = new THREE.Quaternion(),
    _d = new THREE.Vector3(),
    ONE = new THREE.Vector3(1, 1, 1);
  /** A bone frame at a, its y axis toward b. */
  const frameTo = (out, a, b) => out.compose(a, _q.setFromUnitVectors(UP, _d.subVectors(b, a).normalize()), ONE);
  // the bones the clothing is skinned to: the trunk and both upper arms (shirt); the pelvis, thighs and shins (trousers)
  const shirtFrames = [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()];
  const pantsFrames = [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()];
  let shirtSkin = null,
    pantsSkin = null;
  let lastPose = '';
  function pose({ lean = -0.16, distance = 0, walking = false, hands = null, hipY = HIP_Y } = {}) {
    const poseKey = `${lean},${distance},${walking},${hipY},${hands ? `${hands[0].x},${hands[0].y},${hands[0].z},${hands[1].x},${hands[1].y},${hands[1].z}` : ''}`;
    if (poseKey === lastPose) return;
    lastPose = poseKey;
    upper.position.y = hipY;
    upper.rotation.z = -lean;
    headRig.rotation.z = lean - 0.08;
    pelvis.position.y = hipY - 0.055;
    for (const [i, arm] of arms.entries()) {
      shoulder.set(Math.sin(lean) * SHOULDER_Y, hipY + Math.cos(lean) * SHOULDER_Y, arm.side * SHOULDER_Z);
      if (hands?.[i]) aim.copy(hands[i]);
      else aim.set(0.35, 0.9, arm.side * 0.12);
      armPole.set(-0.45, -1, arm.side * 0.15);
      reach(shoulder, aim, UPPER, FORE, armPole, elbow, hand);
      arm.skin.set(shoulder, elbow, hand, 0.042);
      arm.hand.position.copy(hand);
      arm.hand.quaternion.setFromUnitVectors(UP, _d.subVectors(hand, elbow).normalize());
      const j = joints.arms[i];
      j.shoulder.copy(shoulder);
      j.elbow.copy(elbow);
      j.hand.copy(hand);
    }
    for (const [i, leg] of legs.entries()) {
      let x = i === 0 ? 0.26 : -0.18,
        y = 0;
      if (walking) {
        const phase = (((distance / 0.88 + (i === 0 ? 0 : 0.5)) % 1) + 1) % 1;
        if (phase < 0.5) x = 0.26 - 0.88 * phase;
        else {
          const q = (phase - 0.5) * 2,
            smooth = q * q * (3 - 2 * q);
          x = -0.18 + 0.44 * smooth;
          y = Math.sin(Math.PI * q) * 0.045;
        }
      }
      leg.foot.position.set(x, y, leg.side * 0.11);
      leg.foot.rotation.set(0, 0, 0);
      ankle.set(x - 0.055, y + 0.075, leg.side * 0.11);
      hip.set(0, hipY - 0.075, leg.side * 0.073);
      // +x is the toe direction. A negative pole made the previous knees bend backward.
      reach(hip, ankle, THIGH, SHIN, FRONT, knee, aim);
      const j = joints.legs[i];
      j.hip.copy(hip);
      j.knee.copy(knee);
      j.ankle.copy(aim);
      if (i === 0) {
        lastToe.set(x + 0.13, y, 0.11);
        lastHeel.set(x - 0.12, y, 0.11);
      }
    }
    shirtFrames[0].makeRotationZ(-lean).setPosition(0, hipY, 0);
    for (let i = 0; i < 2; i++) frameTo(shirtFrames[i + 1], joints.arms[i].shoulder, joints.arms[i].elbow);
    pantsFrames[0].makeTranslation(0, hipY, 0);
    for (let i = 0; i < 2; i++) {
      frameTo(pantsFrames[1 + i * 2], joints.legs[i].hip, joints.legs[i].knee);
      frameTo(pantsFrames[2 + i * 2], joints.legs[i].knee, joints.legs[i].ankle);
    }
    if (!shirtSkin) {
      // the first pose is the rest pose the clothing is sculpted in (the same for every puller: baked once)
      SCULPT ||= sculpt(lean, hipY, joints, shirtFrames, pantsFrames);
      shirtSkin = skinned('ConnectedShirt', SCULPT.shirt, M.shirt, SCULPT.shirtRest);
      pantsSkin = skinned('ConnectedTrousers', SCULPT.pants, M.trousers, SCULPT.pantsRest);
    }
    for (let i = 0; i < 3; i++) shirtSkin.bones[i].matrix.copy(shirtFrames[i]);
    for (let i = 0; i < 5; i++) pantsSkin.bones[i].matrix.copy(pantsFrames[i]);
    root.updateMatrixWorld(true);
  }
  /** A skinned mesh on the shared sculpt, with its own bones (children of the root, posed by matrix). */
  function skinned(name, geometry, material, rest) {
    const bones = rest.map(() => {
      const bone = new THREE.Bone();
      bone.matrixAutoUpdate = false;
      root.add(bone);
      return bone;
    });
    const m = new THREE.SkinnedMesh(geometry, material);
    m.name = name;
    m.frustumCulled = false; // the posed body moves out of the rest pose's bounds; the person is always in view
    m.raycast = () => {}; // taps are caught by the person's hit box
    root.add(m);
    m.bind(
      new THREE.Skeleton(
        bones,
        rest.map((r) => r.clone().invert()),
      ),
      new THREE.Matrix4(),
    );
    return { mesh: m, bones };
  }
  pose();
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o !== hit) o.castShadow = true;
  });
  /** A still copy of the person in the current pose, for export: the skinned clothing baked into plain meshes. */
  function exportCopy() {
    root.updateMatrixWorld(true);
    const copy = new THREE.Group();
    copy.name = root.name;
    copy.position.copy(root.position);
    copy.quaternion.copy(root.quaternion);
    copy.scale.copy(root.scale);
    for (const child of root.children) {
      if (/** @type {any} */ (child).isBone || child === hit) continue;
      if (/** @type {any} */ (child).isSkinnedMesh) {
        const sk = /** @type {THREE.SkinnedMesh} */ (child);
        const g = new THREE.BufferGeometry();
        const src = sk.geometry.attributes.position;
        const out = new Float32Array(src.count * 3);
        const v = new THREE.Vector3();
        for (let i = 0; i < src.count; i++) {
          v.fromBufferAttribute(src, i);
          sk.applyBoneTransform(i, v);
          v.toArray(out, i * 3);
        }
        g.setAttribute('position', new THREE.BufferAttribute(out, 3));
        g.setIndex(sk.geometry.index.clone());
        g.computeVertexNormals();
        const still = new THREE.Mesh(g, sk.material);
        still.name = sk.name;
        copy.add(still);
      } else copy.add(child.clone(true));
    }
    return copy;
  }
  const body = new THREE.Box3();
  return {
    root,
    pose,
    hit,
    feet: legs.map((l) => l.foot),
    rearShoe: legs[0].foot,
    handAt: (i) => arms[i].hand.position,
    toe: () => lastToe,
    heel: () => lastHeel,
    materials: M,
    exportCopy,
    /** Segment endpoints in world space for checks and label avoidance. */
    bones() {
      /** @type {[THREE.Vector3, THREE.Vector3, number, string][]} */
      const out = [];
      const at = (v) => root.localToWorld(v.clone());
      for (const [i, l] of legs.entries()) {
        const j = joints.legs[i];
        out.push([at(j.hip), at(j.knee), 0.087, 'leg'], [at(j.knee), at(j.ankle), 0.059, 'leg']);
        out.push([
          at(l.foot.position.clone().add(new THREE.Vector3(-0.12, 0.03, 0))),
          at(l.foot.position.clone().add(new THREE.Vector3(0.13, 0.03, 0))),
          0.05,
          i === 0 ? 'rearFoot' : 'foot',
        ]);
      }
      for (const j of joints.arms) out.push([at(j.shoulder), at(j.elbow), 0.068, 'arm'], [at(j.elbow), at(j.hand), 0.04, 'arm']);
      const top = upper.localToWorld(new THREE.Vector3(0.005, 0.515, 0)); // the neck
      out.push([at(new THREE.Vector3(0, pelvis.position.y, 0)), top, 0.17, 'trunk']);
      const h = headRig.localToWorld(new THREE.Vector3(0, 0.16, 0));
      out.push([h, h.clone(), 0.12, 'head']);
      return out;
    },
    box: () => body.setFromObject(root),
  };
}
