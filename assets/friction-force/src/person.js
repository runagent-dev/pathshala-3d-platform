// Articulated rope puller, metres, local +x toward the crate.
// Continuous swept limbs round each joint; the knees bend toward the toes.
import * as THREE from 'three';
import { createSurface, smoothMin, ellipsoidDistance, boneDistance, createDeformer } from './surface.js';

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

export function createPuller({ shirt = '#ff790f', trousers = '#2542a5' } = {}) {
  const root = new THREE.Group();
  root.name = 'RopePuller';
  const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });
  const M = {
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
  };
  /** @param {THREE.BufferGeometry} g @param {THREE.Material} m @param {THREE.Object3D} [parent] */
  const mesh = (g, m, parent = root, name = '') => {
    const o = new THREE.Mesh(g, m);
    o.name = name;
    parent.add(o);
    return o;
  };
  /** @param {THREE.Object3D} [parent] */
  const ellipsoid = (r, scale, position, material, parent = root, name = '') => {
    const o = mesh(new THREE.SphereGeometry(r, 32, 24), material, parent, name);
    o.scale.set(scale[0], scale[1], scale[2]);
    o.position.set(position[0], position[1], position[2]);
    return o;
  };
  // A closed smooth loft, with independent front/back/width profiles (rather than a stack of balls).
  function loft(profile, material, parent, name) {
    const points = profile.map(([y, back, front, width]) => new THREE.Vector3((front + back) / 2, y, width));
    const centre = new THREE.CatmullRomCurve3(points);
    const radii = new THREE.CatmullRomCurve3(profile.map(([y, back, front, width]) => new THREE.Vector3((front - back) / 2, width, y)));
    const radial = 40,
      rings = 32,
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
  const head = loft(
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
    hr = 40,
    hy = 18;
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
      normal = new THREE.Vector3();
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
        const ab = b.clone().sub(a).normalize(),
          bc = c.clone().sub(b).normalize();
        const cut = Math.min(bend, a.distanceTo(b) * 0.25, b.distanceTo(c) * 0.25);
        const entry = b.clone().addScaledVector(ab, -cut),
          exit = b.clone().addScaledVector(bc, cut);
        const curve = new THREE.CurvePath();
        curve.add(new THREE.LineCurve3(a, entry));
        curve.add(new THREE.QuadraticBezierCurve3(entry, b, exit));
        curve.add(new THREE.LineCurve3(exit, c));
        for (let i = 0; i <= rings; i++) {
          const t = i / rings;
          curve.getPoint(t, p);
          curve.getTangent(t, tangent);
          normal.crossVectors(tangent, Z).normalize();
          const r = radiusAt(t);
          for (let j = 0; j <= radial; j++) {
            const ang = (j / radial) * Math.PI * 2,
              k = (i * (radial + 1) + j) * 3;
            positions[k] = p.x + normal.x * r * Math.cos(ang);
            positions[k + 1] = p.y + normal.y * r * Math.cos(ang);
            positions[k + 2] = p.z + r * Math.sin(ang);
          }
        }
        positions.set(a.toArray(), end * 3);
        positions.set(c.toArray(), (end + 1) * 3);
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
    bevelSegments: 4,
    curveSegments: 16,
  })
    .rotateX(Math.PI / 2)
    .translate(0, 0.052, 0);
  const soleGeometry = new THREE.ExtrudeGeometry(shoeShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelSize: 0.006,
    bevelThickness: 0.003,
    bevelSegments: 3,
    curveSegments: 16,
  })
    .rotateX(Math.PI / 2)
    .translate(0, 0.015, 0);
  const legs = [1, -1].map((side, i) => {
    const foot = mesh(shoeGeometry, M.shoe, root, i === 0 ? 'RearShoe' : 'OtherShoe');
    mesh(soleGeometry, M.sole, foot, 'GripSole');
    ellipsoid(1, [0.046, 0.04, 0.043], [-0.055, 0.063, 0], M.shoe, foot, 'ShoeCollar');
    for (let j = 0; j < 4; j++) {
      const lace = mesh(new THREE.BoxGeometry(0.007, 0.004, 0.058), M.white, foot, 'Lace');
      lace.position.set(-0.035 + j * 0.023, 0.06, 0);
    }
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
  const shirtSurface = createSurface('ConnectedShirt', M.shirt, root, [-0.3, 0.58, -0.29], [0.43, 1.47, 0.29], 0.016);
  const pantsSurface = createSurface('ConnectedTrousers', M.trousers, root, [-0.42, 0.015, -0.27], [0.49, 1.0, 0.27], 0.017);
  let deformShirt = null,
    deformPants = null;
  const frame = (a, b) =>
    new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize()), new THREE.Vector3(1, 1, 1));
  let lastPose = '';
  function pose({ lean = -0.16, distance = 0, walking = false, hands = null, hipY = HIP_Y } = {}) {
    const poseKey = [lean, distance, walking, hipY, ...(hands || []).flatMap((p) => p.toArray())].join(',');
    if (poseKey === lastPose) return;
    lastPose = poseKey;
    upper.position.y = hipY;
    upper.rotation.z = -lean;
    headRig.rotation.z = lean - 0.08;
    pelvis.position.y = hipY - 0.055;
    for (const [i, arm] of arms.entries()) {
      shoulder.set(Math.sin(lean) * SHOULDER_Y, hipY + Math.cos(lean) * SHOULDER_Y, arm.side * SHOULDER_Z);
      aim.copy(hands?.[i] || new THREE.Vector3(0.35, 0.9, arm.side * 0.12));
      armPole.set(-0.45, -1, arm.side * 0.15);
      reach(shoulder, aim, UPPER, FORE, armPole, elbow, hand);
      arm.skin.set(shoulder, elbow, hand, 0.042);
      arm.hand.position.copy(hand);
      arm.hand.quaternion.setFromUnitVectors(UP, hand.clone().sub(elbow).normalize());
      joints.arms[i] = { shoulder: shoulder.clone(), elbow: elbow.clone(), hand: hand.clone() };
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
      joints.legs[i] = { hip: hip.clone(), knee: knee.clone(), ankle: aim.clone() };
      if (i === 0) {
        lastToe.set(x + 0.13, y, 0.11);
        lastHeel.set(x - 0.12, y, 0.11);
      }
    }
    const trunkFrame = new THREE.Matrix4().makeRotationZ(-lean).setPosition(0, hipY, 0);
    const shirtFrames = [trunkFrame, ...joints.arms.map((j) => frame(j.shoulder, j.elbow))];
    const pantsFrames = [
      new THREE.Matrix4().makeTranslation(0, hipY, 0),
      ...joints.legs.flatMap((j) => [frame(j.hip, j.knee), frame(j.knee, j.ankle)]),
    ];
    if (!deformShirt) {
      // Shirt and sleeves form one surface; pelvis and both legs form another.
      const cosine = Math.cos(lean),
        sine = Math.sin(lean);
      const profile = [
        [-0.02, 0.12, 0.145],
        [0.1, 0.13, 0.155],
        [0.25, 0.132, 0.18],
        [0.39, 0.115, 0.185],
        [0.465, 0.052, 0.072],
      ];
      const cuffs = joints.arms.map((j) => j.shoulder.clone().lerp(j.elbow, 0.65));
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
        const d = -smoothMin(-radial, -vertical, 0.012);
        return d;
      };
      shirtSurface.update((x, y, z) => {
        let d = bodyDistance(x, y, z);
        for (let i = 0; i < joints.arms.length; i++) d = smoothMin(d, boneDistance(x, y, z, joints.arms[i].shoulder, cuffs[i], 0.057, 0.05), 0.025);
        return d;
      });
      pantsSurface.update((x, y, z) => {
        let d = ellipsoidDistance(x, y, z, 0, hipY - 0.055, 0, 0.115, 0.145, 0.146);
        for (const j of joints.legs) {
          d = smoothMin(d, boneDistance(x, y, z, j.hip, j.knee, 0.072, 0.056), 0.035);
          d = smoothMin(d, boneDistance(x, y, z, j.knee, j.ankle, 0.054, 0.037, 0.007), 0.025);
        }
        return Math.max(d, y - (hipY + 0.014));
      });

      const smooth = THREE.MathUtils.smoothstep;
      deformShirt = createDeformer(shirtSurface.mesh, shirtFrames, (x, y, z) => {
        const p = new THREE.Vector3(x, y, z);
        const influences = joints.arms.map((j, i) => {
          const a = j.shoulder,
            b = cuffs[i],
            v = b.clone().sub(a),
            t = THREE.MathUtils.clamp(p.clone().sub(a).dot(v) / v.lengthSq(), 0, 1);
          const distance = p.distanceTo(a.clone().addScaledVector(v, t));
          return (1 - smooth(distance, 0.063, 0.11)) * smooth(bodyDistance(x, y, z), -0.025, 0.025);
        });
        const sum = influences[0] + influences[1],
          factor = sum > 1 ? 1 / sum : 1;
        return [1 - Math.min(sum, 1), ...influences.map((w) => w * factor)];
      });
      deformPants = createDeformer(pantsSurface.mesh, pantsFrames, (_x, y, z) => {
        const body = smooth(y, hipY - 0.22, hipY - 0.08),
          near = smooth(z, -0.06, 0.06);
        const weights = [body];
        for (let i = 0; i < 2; i++) {
          const thigh = smooth(y, joints.legs[i].knee.y - 0.065, joints.legs[i].knee.y + 0.065),
            side = i === 0 ? near : 1 - near;
          weights.push((1 - body) * side * thigh, (1 - body) * side * (1 - thigh));
        }
        return weights;
      });
    }
    deformShirt(shirtFrames);
    deformPants(pantsFrames);
    root.updateMatrixWorld(true);
  }
  pose();
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o !== hit) o.castShadow = true;
  });
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
      const top = neck.getWorldPosition(new THREE.Vector3());
      out.push([at(new THREE.Vector3(0, pelvis.position.y, 0)), top, 0.17, 'trunk']);
      const h = head.localToWorld(new THREE.Vector3(0, 0.68, 0));
      out.push([h, h.clone(), 0.12, 'head']);
      return out;
    },
    box: () => body.setFromObject(root),
  };
}
