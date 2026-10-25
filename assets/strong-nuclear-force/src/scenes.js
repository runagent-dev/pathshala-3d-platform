// The three scenes of the figure (1 unit = 1 fm):
//   pull  – a carbon-12 nucleus (6 protons, 6 neutrons); one proton can be pulled straight out to the right, with
//           the strong pull and the electric push drawn as arrows and a distance scale under it;
//   split – a slow neutron enters a big nucleus, which wobbles, stretches and splits in two (ভাঙা), giving off
//           energy and a couple of neutrons;
//   join  – two small nuclei (hydrogen-2 and hydrogen-3) rush together and join (জোড়া দেওয়া) into helium-4,
//           giving off energy and a neutron.
// split and join are pure functions of their time, render(t), so seeking and the video are exact.
import * as THREE from 'three';
import { COLORS, createArrow, createEnergyBurst, createNucleons, createScale } from './models.js';
import { MAX_PULL, R_NUCLEON, arrowLength, chooseProtons, clamp, clusterRadius, electricForce, packCluster } from './reading.js';

const smooth = (a, b, x) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};
const outCubic = (k) => 1 - (1 - k) ** 3;
const v3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);

// ── pull ─────────────────────────────────────────────────────────────────────────────────────────────────────
export function buildPullScene(M, { digits, unit }) {
  const root = new THREE.Group();
  root.name = 'PullScene';
  let pts = packCluster(12, { seed: 11 });
  // the ball farthest to the right is the proton the student pulls; turn the nucleus so that it sits on the
  // +x axis, a little toward the viewer, with nothing in front of it
  const k = pts.reduce((best, p, i) => (p[0] > pts[best][0] ? i : best), 0);
  const from = v3(pts[k]).normalize();
  const to = new THREE.Vector3(1, 0, 0.32).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(from, to);
  pts = pts.map((p) => v3(p).applyQuaternion(q).toArray());
  const seat = v3(pts[k]);
  const others = pts.filter((_, i) => i !== k);
  const isProton = chooseProtons(others.length, 5, 4);
  const nucleus = createNucleons('Nucleus', isProton, M);
  others.forEach((p, i) => nucleus.place(i, p));
  nucleus.commit();
  root.add(nucleus.root);

  const proton = new THREE.Mesh(M.geometry, M.proton);
  proton.name = 'PulledProton';
  proton.position.copy(seat);
  root.add(proton);
  // a finger anywhere near the proton takes it
  const hit = new THREE.Mesh(new THREE.SphereGeometry(R_NUCLEON * 1.75, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  proton.add(hit);

  const radius = clusterRadius(pts);
  // the scale goes under the proton's path, clear of the nucleus
  let low = -R_NUCLEON - 0.55;
  for (const p of others) if (p[0] + R_NUCLEON > seat.x - 0.15) low = Math.min(low, p[1] - R_NUCLEON - 0.35);
  const scale = createScale({ digits, unit });
  scale.root.position.set(seat.x, low, seat.z);
  root.add(scale.root);

  const strongArrow = createArrow('StrongArrow', COLORS.strong);
  const electricArrow = createArrow('ElectricArrow', COLORS.electric);
  root.add(strongArrow.root, electricArrow.root);
  const left = new THREE.Vector3(-1, 0, 0);
  const right = new THREE.Vector3(1, 0, 0);
  const a = new THREE.Vector3();

  return {
    root,
    nucleus,
    proton,
    hit,
    seat,
    radius,
    scale,
    strongArrow,
    electricArrow,
    scaleY: low,
    /** Where the proton is when it is d fm out of its place. */
    at: (d, out = new THREE.Vector3()) => out.copy(seat).addScaledVector(right, d),
    /** Put the proton d fm out, with arrows of these lengths (0 hides one). */
    setProton(d, { strong = 0, electric = 0 } = {}) {
      proton.position.copy(seat).addScaledVector(right, d);
      a.copy(proton.position).addScaledVector(left, R_NUCLEON + 0.06);
      strongArrow.set(a, left, strong);
      a.copy(proton.position).addScaledVector(right, R_NUCLEON + 0.06);
      electricArrow.set(a, right, electric);
      scale.setPointer(clamp(d, 0, MAX_PULL + 0.12), -R_NUCLEON - low - 0.05);
      scale.setPointerVisible(d <= MAX_PULL + 0.2);
    },
    face(cq) {
      nucleus.face(cq);
      nucleus.commit();
      proton.quaternion.copy(cq);
    },
    /** What the camera must show: the nucleus, the proton's whole path with its push arrow, the scale. */
    frame() {
      const R = R_NUCLEON;
      const pts = [];
      for (const p of others) for (const o of BALL_EDGES) pts.push({ p: new THREE.Vector3(p[0] + o[0] * R, p[1] + o[1] * R, p[2] + o[2] * R) });
      const far = seat.clone().add(new THREE.Vector3(MAX_PULL, 0, 0));
      pts.push({ p: far.clone().add(new THREE.Vector3(R + 0.06 + arrowLength(electricForce(MAX_PULL)) + 0.15, 0, 0)) });
      const s0 = new THREE.Vector3(seat.x, low, seat.z);
      pts.push(
        { p: s0.clone().add(new THREE.Vector3(-0.3, -0.85, 0)) },
        { p: s0.clone().add(new THREE.Vector3(scale.unitEnd + 0.05, -0.85, 0)) },
        { p: s0.clone().add(new THREE.Vector3(scale.unitEnd + 0.05, 0.3, 0)) },
      );
      return pts;
    },
    state: { phase: 'still' },
    end: 0,
  };
}
const D = Math.SQRT1_2;
const BALL_EDGES = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
  [D, D, 0],
  [D, -D, 0],
  [-D, D, 0],
  [-D, -D, 0],
];
/** Points round a circle in the picture's plane (for the camera fit). */
function ring(cx, cy, r, n = 16, z = 0) {
  return Array.from({ length: n }, (_, i) => ({
    p: new THREE.Vector3(cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2), z),
  }));
}

// ── split (ভাঙা) ─────────────────────────────────────────────────────────────────────────────────────────────
export const SPLIT = { inAt: 1.5, absorbed: 1.85, splitAt: 3.3, end: 5.6 };
const SPLIT_SEP = 6.5; // fm: where the two pieces stop
const SPLIT_IN = -9.6; // fm: where the slow neutron starts

export function buildSplitScene(M) {
  const root = new THREE.Group();
  root.name = 'SplitScene';
  const N = 92;
  const big = packCluster(N, { seed: 7, rounds: 140 });
  const R = clusterRadius(big);
  const isP = chooseProtons(N, 36, 9);
  // two neutrons near the middle fly off when it splits; the rest go left or right by where they are
  const order = big.map((_, i) => i).sort((i, j) => Math.abs(big[i][0]) - Math.abs(big[j][0]));
  const freed = order.filter((i) => !isP[i]).slice(0, 2);
  const rest = big.map((_, i) => i).filter((i) => !freed.includes(i));
  rest.sort((i, j) => big[i][0] - big[j][0]);
  const halves = [rest.slice(0, rest.length / 2), rest.slice(rest.length / 2)];
  const pieces = halves.map((ids, side) => {
    const c = [0, 1, 2].map((j) => ids.reduce((s, i) => s + big[i][j], 0) / ids.length);
    const packed = packCluster(ids.length, { init: ids.map((i) => [big[i][0] - c[0], big[i][1] - c[1], big[i][2] - c[2]]), rounds: 90 });
    const r = clusterRadius(packed);
    return { ids, packed, r, sign: side ? 1 : -1 };
  });
  const sep0 = Math.max(pieces[0].r, pieces[1].r) * 0.92;
  // the balls: the big nucleus, then the incoming neutron
  const isProton = [...isP, false];
  const balls = createNucleons('SplitNuclei', isProton, M);
  root.add(balls.root);
  const IN = N; // index of the incoming neutron
  const burst = createEnergyBurst('SplitEnergy', { angles: [118, 62, 152, 208, 242, 298, 332, 28], from: 1.2, to: 3.7, length: 1.5 });
  root.add(burst.root);
  const freeDir = [new THREE.Vector3(0.35, 1, 0.15).normalize(), new THREE.Vector3(-0.35, -1, 0.15).normalize()];
  const p = new THREE.Vector3();
  const pieceC = [new THREE.Vector3(), new THREE.Vector3()];
  const bigTop = new THREE.Vector3(0, R, 0);
  const points = {
    neutron: new THREE.Vector3(),
    big: new THREE.Vector3(0, R * 0.98, 0),
    pieces: [new THREE.Vector3(), new THREE.Vector3()],
    freed: [new THREE.Vector3(), new THREE.Vector3()], // the two neutrons set free
    energy: () => burst.labelPoint(),
  };
  const state = { phase: 'before', t: 0 };

  function render(t, { incoming = true } = {}) {
    state.t = t;
    // the slow neutron comes in from the left and is taken in
    const xIn = SPLIT_IN;
    const xHit = -R - 0.5;
    if (t < SPLIT.inAt) balls.place(IN, [xIn + (xHit - xIn) * (t / SPLIT.inAt), 0.4, 0.6]);
    else {
      const k = smooth(SPLIT.inAt, SPLIT.absorbed, t);
      balls.place(IN, [xHit + (-R * 0.45 - xHit) * k, 0.4 * (1 - k), 0.6 * (1 - k)], 1 - 0.999 * smooth(SPLIT.inAt + 0.1, SPLIT.absorbed, t));
    }
    if (!incoming) balls.place(IN, [xIn, 0.4, 0.6], 0.0001);
    points.neutron.copy(balls.position(IN));
    // wobble, stretch, split, fly apart
    const e = smooth(SPLIT.absorbed + 0.2, SPLIT.splitAt, t);
    const wob = t > SPLIT.absorbed ? 0.1 * Math.sin((t - SPLIT.absorbed) * 2 * Math.PI * 2.2) * (1 - e) : 0;
    const fly = outCubic(clamp((t - SPLIT.splitAt) / (SPLIT.end - SPLIT.splitAt), 0, 1));
    const sep = sep0 + (SPLIT_SEP - sep0) * fly;
    for (const piece of pieces) {
      pieceC[piece.sign > 0 ? 1 : 0].set(piece.sign * (t < SPLIT.splitAt ? sep0 * e : sep), 0, 0);
      piece.ids.forEach((id, j) => {
        const a = big[id];
        const b = piece.packed[j];
        const c = pieceC[piece.sign > 0 ? 1 : 0];
        p.set(a[0] + (b[0] + c.x - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e);
        p.x *= 1 + wob;
        p.y *= 1 - wob * 0.6;
        balls.place(id, p);
      });
    }
    freed.forEach((id, j) => {
      const a = big[id];
      const go = clamp((t - SPLIT.splitAt) / (SPLIT.end - SPLIT.splitAt), 0, 1);
      p.set(a[0] * (1 - e), a[1] * (1 - e), a[2] * (1 - e)).addScaledVector(freeDir[j], 5 * outCubic(go));
      balls.place(id, p);
    });
    freed.forEach((id, j) => points.freed[j].copy(balls.position(id)));
    pieces.forEach((piece, j) => points.pieces[j].copy(pieceC[j]).setY(piece.r * 0.98));
    // energy
    const k = clamp((t - SPLIT.splitAt) / 1.7, 0, 1);
    burst.set(outCubic(k), smooth(SPLIT.splitAt, SPLIT.splitAt + 0.25, t));
    balls.commit();
    state.phase = t < SPLIT.absorbed ? 'before' : t < SPLIT.splitAt ? 'wobble' : t < SPLIT.end ? 'apart' : 'done';
    return state.phase;
  }

  return {
    root,
    balls,
    burst,
    points,
    radius: R,
    end: SPLIT.end,
    render,
    state,
    pieceRadius: Math.max(pieces[0].r, pieces[1].r),
    bigTop,
    face(cq) {
      balls.face(cq);
      balls.commit();
      burst.face(cq);
    },
    /** The whole animation: the big nucleus, the incoming neutron, the pieces where they stop, the rays. */
    frame() {
      // (the labels find their own room, or wait: the scene itself is shown as big as it can be)
      const pr = Math.max(pieces[0].r, pieces[1].r);
      return [
        ...ring(0, 0, R),
        ...ring(-SPLIT_SEP, 0, pr, 12),
        ...ring(SPLIT_SEP, 0, pr, 12),
        ...ring(0, 0, 3.7 + 1.5, 16),
        ...freeDir.map((d) => ({ p: d.clone().multiplyScalar(5 + R_NUCLEON) })),
        { p: new THREE.Vector3(SPLIT_IN - R_NUCLEON, 0.4, 0) },
      ];
    },
  };
}

// ── join (জোড়া দেওয়া) ────────────────────────────────────────────────────────────────────────────────────────
export const JOIN = { meetAt: 1.6, joined: 1.95, end: 4.4 };

export function buildJoinScene(M) {
  const root = new THREE.Group();
  root.name = 'JoinScene';
  const g = 2 * R_NUCLEON * 0.94; // centre to centre of touching balls
  // hydrogen-2 (p n) on the left, hydrogen-3 (p n n) on the right; helium-4 (p p n n) a tetrahedron
  const d2 = [
    [-g / 2, 0, 0],
    [g / 2, 0, 0],
  ];
  const tr = g / Math.sqrt(3);
  const t3 = [0, 1, 2].map((i) => [tr * Math.cos((i * 2 * Math.PI) / 3 + Math.PI / 2), tr * Math.sin((i * 2 * Math.PI) / 3 + Math.PI / 2), 0]);
  const te = g * Math.sqrt(3 / 8);
  const he = [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ].map((v) => v.map((x) => (x * te) / Math.sqrt(3)));
  // balls: D.p, D.n, T.p, T.n, T.n (the last flies off)
  const isProton = [true, false, true, false, false];
  const balls = createNucleons('JoinNuclei', isProton, M);
  root.add(balls.root);
  const burst = createEnergyBurst('JoinEnergy', { angles: [116, 64, 158, 202, 244, 296, 338, 22], from: 1.0, to: 2.7, length: 1.3 });
  root.add(burst.root);
  const target = [he[0], he[3], he[1], he[2]]; // where D.p, D.n, T.p, T.n go in the helium nucleus
  const flyDir = new THREE.Vector3(0.55, 1, 0.2).normalize();
  const p = new THREE.Vector3();
  const qa = new THREE.Quaternion();
  const axis = new THREE.Vector3(0.2, 1, 0.1).normalize();
  const cD = new THREE.Vector3();
  const cT = new THREE.Vector3();
  const points = {
    small: [new THREE.Vector3(), new THREE.Vector3()],
    joined: new THREE.Vector3(0, -1.6, 0), // under the new nucleus (its label goes below it)
    neutron: new THREE.Vector3(),
    energy: () => burst.labelPoint(),
  };
  const state = { phase: 'before', t: 0 };
  const X0 = 5.4;
  const xMeet = g * 0.95;

  function render(t) {
    state.t = t;
    // they rush in (a little slowed by the electric push just before they touch)
    const k = clamp(t / JOIN.meetAt, 0, 1);
    const x = X0 - (X0 - xMeet) * (k < 0.85 ? (k / 0.85) * 0.93 : 0.93 + 0.07 * smooth(0.85, 1, k));
    cD.set(-x, 0, 0);
    cT.set(x, 0, 0);
    const j = smooth(JOIN.meetAt, JOIN.joined, t);
    qa.setFromAxisAngle(axis, t * 1.3);
    const place = (i, local, c, dst) => {
      p.fromArray(local).applyQuaternion(qa).add(c);
      if (dst) p.lerp(v3(dst), j);
      balls.place(i, p);
    };
    place(0, d2[0], cD, target[0]);
    place(1, d2[1], cD, target[1]);
    place(2, t3[0], cT, target[2]);
    place(3, t3[1], cT, target[3]);
    // the fifth ball: with hydrogen-3 until the join, then off up and to the right
    p.fromArray(t3[2]).applyQuaternion(qa).add(cT);
    const go = clamp((t - JOIN.meetAt - 0.1) / (JOIN.end - JOIN.meetAt - 0.1), 0, 1);
    if (t > JOIN.meetAt) {
      const start = new THREE.Vector3().fromArray(t3[2]).applyQuaternion(qa).add(cT);
      p.copy(start).addScaledVector(flyDir, 4.4 * outCubic(go));
    }
    balls.place(4, p);
    points.small[0].copy(cD).setY(1.05); // just above the top of each small nucleus
    points.small[1].copy(cT).setY(1.85);
    points.neutron.copy(p);
    const e = clamp((t - JOIN.meetAt - 0.15) / 1.7, 0, 1);
    burst.set(outCubic(e), smooth(JOIN.meetAt + 0.1, JOIN.meetAt + 0.35, t));
    balls.commit();
    state.phase = t < JOIN.meetAt ? 'before' : t < JOIN.end ? 'joining' : 'done';
    return state.phase;
  }

  return {
    root,
    balls,
    burst,
    points,
    end: JOIN.end,
    render,
    state,
    face(cq) {
      balls.face(cq);
      balls.commit();
      burst.face(cq);
    },
    /** The whole animation: both small nuclei where they start, the new nucleus, the neutron, the rays. */
    frame() {
      const nEnd = new THREE.Vector3().fromArray(t3[2]).add(flyDir.clone().multiplyScalar(4.4));
      return [
        ...ring(-X0, 0, 1.4, 10),
        ...ring(X0, 0, 1.6, 10),
        ...ring(0, 0, 2.7 + 1.3, 16),
        { p: nEnd.clone().add(new THREE.Vector3(R_NUCLEON, R_NUCLEON, 0)) },
        { p: new THREE.Vector3(0, -1.6, 0), box: [-62, 0, 62, 40] }, // room for the new nucleus's name under it
      ];
    },
  };
}
