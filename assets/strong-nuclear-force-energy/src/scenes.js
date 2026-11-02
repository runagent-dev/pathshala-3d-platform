// The two scenes of the figure (1 unit = 1 fm):
//   split – a slow neutron reaches a big nucleus, which wobbles, stretches and splits in two (ভাঙা), giving off
//           energy and three neutrons (92 + 1 = 45 + 45 + 3, as U-235 + n → Ba + Kr + 3n);
//   join  – two small nuclei (hydrogen-2 and hydrogen-3) rush together and join (জোড়া দেওয়া) into helium-4,
//           giving off energy and a neutron (2p + 3n = 2p + 2n + n).
// split and join are pure functions of their time, render(t), so seeking and the video are exact.
import * as THREE from 'three';
import { createEnergyBurst, createNucleons } from './models.js';
import { R_NUCLEON, chooseProtons, clamp, clusterRadius, packCluster } from './reading.js';

const smooth = (a, b, x) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};
const outCubic = (k) => 1 - (1 - k) ** 3;
const v3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
/** Points round a circle in the picture's plane (for the camera fit), between two angles (degrees). */
function ring(cx, cy, r, n = 16, from = 0, to = 360) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = THREE.MathUtils.degToRad(from + ((to - from) * i) / n);
    return { p: new THREE.Vector3(cx + r * Math.cos(a), cy + r * Math.sin(a), 0) };
  });
}

// ── split (ভাঙা) ─────────────────────────────────────────────────────────────────────────────────────────────
export const SPLIT = { inAt: 1.5, absorbed: 1.85, splitAt: 3.3, end: 5.6 };
const SPLIT_SEP = 6.5; // fm: where the two pieces stop
const SPLIT_IN = -9.6; // fm: where the slow neutron starts
const FREE_RUN = 5; // fm: how far the freed neutrons fly
const BURST_TO = 3.7;
const BURST_LEN = 1.5;

export function buildSplitScene(M) {
  const root = new THREE.Group();
  root.name = 'SplitScene';
  const N = 92;
  const big = packCluster(N, { seed: 7, rounds: 140 });
  const R = clusterRadius(big);
  const isP = chooseProtons(N, 36, 9);
  // two neutrons near the middle fly off when it splits (with the neutron that came in: three); the other 90
  // go left or right by where they are, 45 and 45
  const order = big.map((_, i) => i).sort((i, j) => Math.abs(big[i][0]) - Math.abs(big[j][0]));
  const freed = order.filter((i) => !isP[i]).slice(0, 2);
  const rest = big.map((_, i) => i).filter((i) => !freed.includes(i));
  rest.sort((i, j) => big[i][0] - big[j][0]);
  const halves = [rest.slice(0, rest.length / 2), rest.slice(rest.length / 2)];
  const pieces = halves.map((ids, side) => {
    const c = [0, 1, 2].map((j) => ids.reduce((s, i) => s + big[i][j], 0) / ids.length);
    const packed = packCluster(ids.length, { init: ids.map((i) => [big[i][0] - c[0], big[i][1] - c[1], big[i][2] - c[2]]), rounds: 90 });
    return { ids, packed, c, r: clusterRadius(packed), sign: side ? 1 : -1 };
  });
  const pr = Math.max(pieces[0].r, pieces[1].r);
  const sep0 = pr * 0.92;
  // the balls: the big nucleus, then the incoming neutron (it stays a real ball all the way)
  const balls = createNucleons('SplitNuclei', [...isP, false], M);
  root.add(balls.root);
  const IN = N;
  const burst = createEnergyBurst('SplitEnergy', {
    angles: [90, 50, 70, 110, 130, 230, 250, 270, 290, 310],
    from: 1.2,
    to: BURST_TO,
    length: BURST_LEN,
  });
  root.add(burst.root);
  // where the slow neutron comes to rest on the surface, and the three directions the freed neutrons take
  const yIn = 0.4;
  const zIn = 0.6;
  const contact = new THREE.Vector3(-Math.sqrt((R + 0.6) ** 2 - yIn ** 2 - zIn ** 2), yIn, zIn);
  const freeDir = [
    new THREE.Vector3(0.45, 1, 0.1).normalize(),
    new THREE.Vector3(0.05, -1, 0.15).normalize(),
    new THREE.Vector3(-0.5, 1, 0.1).normalize(),
  ];
  const p = new THREE.Vector3();
  const pieceC = [new THREE.Vector3(), new THREE.Vector3()];
  const start = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const points = {
    neutron: new THREE.Vector3(),
    big: new THREE.Vector3(0, R * 0.98, 0),
    pieces: [new THREE.Vector3(), new THREE.Vector3()],
    piecesLow: [new THREE.Vector3(), new THREE.Vector3()],
    piecesInner: [new THREE.Vector3(), new THREE.Vector3()], // the side of each piece that faces the middle
    freed: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    energy: () => burst.labelPoint(),
  };
  const state = { phase: 'before', t: 0 };

  function render(t, { incoming = true } = {}) {
    state.t = t;
    const e = smooth(SPLIT.absorbed + 0.2, SPLIT.splitAt, t); // the stretch, 0 → 1
    const wob = t > SPLIT.absorbed ? 0.1 * Math.sin((t - SPLIT.absorbed) * 2 * Math.PI * 2.2) * (1 - e) : 0;
    const go = outCubic(clamp((t - SPLIT.splitAt) / (SPLIT.end - SPLIT.splitAt), 0, 1));
    const sep = sep0 + (SPLIT_SEP - sep0) * go;
    // the two pieces: from their places in the big nucleus to two round nuclei, then apart
    for (const piece of pieces) {
      const c = pieceC[piece.sign > 0 ? 1 : 0];
      c.set(piece.sign * (t < SPLIT.splitAt ? sep0 * e : sep), 0, 0);
      piece.ids.forEach((id, j) => {
        const a = big[id];
        const b = piece.packed[j];
        p.set(a[0] + (b[0] + c.x - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e);
        p.x *= 1 + wob;
        p.y *= 1 - wob * 0.6;
        balls.place(id, p);
      });
    }
    // the slow neutron: in from the left, then held on the surface, moving with the left half
    if (t < SPLIT.inAt) p.set(SPLIT_IN + (contact.x - SPLIT_IN) * (t / SPLIT.inAt), yIn, zIn);
    else p.copy(contact);
    if (t > SPLIT.absorbed) p.x = p.x * (1 + wob) + (-sep0 - pieces[0].c[0]) * e;
    start[2].copy(p);
    // the two from the middle: they stay in the neck until it breaks
    freed.forEach((id, j) => start[j].set(big[id][0] * (1 - e), big[id][1] * (1 - e), big[id][2] * (1 - e)));
    [freed[0], freed[1], IN].forEach((id, j) => {
      p.copy(start[j]).addScaledVector(freeDir[j], FREE_RUN * go);
      balls.place(id, p, id === IN && !incoming ? 0.0001 : 1);
      points.freed[j].copy(p);
    });
    points.neutron.copy(points.freed[2]);
    pieces.forEach((piece, j) => {
      points.pieces[j].copy(pieceC[j]).setY(piece.r * 0.98);
      points.piecesLow[j].copy(pieceC[j]).setY(-piece.r * 0.98);
      points.piecesInner[j].copy(pieceC[j]).setX(pieceC[j].x - piece.sign * piece.r * 0.98);
    });
    // energy: a flash and rays as it splits
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
    end: SPLIT.end,
    render,
    state,
    face(cq) {
      balls.face(cq);
      balls.commit();
      burst.face(cq);
    },
    /** The whole animation: the big nucleus, the incoming neutron, the pieces where they stop, rays, neutrons. */
    frame() {
      return [
        ...ring(0, 0, R),
        ...ring(-SPLIT_SEP, 0, pr, 12),
        ...ring(SPLIT_SEP, 0, pr, 12),
        ...ring(0, 0, BURST_TO + BURST_LEN, 16, 40, 140),
        ...ring(0, 0, BURST_TO + BURST_LEN, 16, 220, 320),
        ...freeDir.map((d) => ({ p: d.clone().multiplyScalar(FREE_RUN + R_NUCLEON + 0.4) })),
        { p: new THREE.Vector3(SPLIT_IN - R_NUCLEON, yIn, 0) },
      ];
    },
  };
}

// ── join (জোড়া দেওয়া) ────────────────────────────────────────────────────────────────────────────────────────
export const JOIN = { meetAt: 1.6, joined: 1.95, end: 4.4 };
const JOIN_BURST_TO = 2.7;
const JOIN_BURST_LEN = 1.3;

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
  // rays all round except where the neutron goes (up and to the right); the label's ray first
  const burst = createEnergyBurst('JoinEnergy', {
    angles: [120, 0, 30, 90, 150, 180, 210, 240, 270, 300, 330],
    from: 1.0,
    to: JOIN_BURST_TO,
    length: JOIN_BURST_LEN,
  });
  root.add(burst.root);
  const target = [he[0], he[3], he[1], he[2]]; // where D.p, D.n, T.p, T.n go in the helium nucleus
  const flyDir = new THREE.Vector3(0.58, 1, 0.2).normalize();
  const p = new THREE.Vector3();
  const qa = new THREE.Quaternion();
  const axis = new THREE.Vector3(0.2, 1, 0.1).normalize();
  const cD = new THREE.Vector3();
  const cT = new THREE.Vector3();
  const startN = new THREE.Vector3();
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
    qa.setFromAxisAngle(axis, Math.min(t, JOIN.meetAt) * 1.3);
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
    startN.fromArray(t3[2]).applyQuaternion(qa).add(cT);
    const go = clamp((t - JOIN.meetAt - 0.1) / (JOIN.end - JOIN.meetAt - 0.1), 0, 1);
    p.copy(startN).addScaledVector(flyDir, 4.4 * outCubic(go));
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
      const nEnd = new THREE.Vector3(xMeet, 0, 0).add(new THREE.Vector3().fromArray(t3[2])).add(flyDir.clone().multiplyScalar(4.4));
      return [
        ...ring(-X0, 0, 1.4, 10),
        ...ring(X0, 0, 1.6, 10),
        ...ring(0, 0, JOIN_BURST_TO + JOIN_BURST_LEN, 16),
        { p: nEnd.clone().add(new THREE.Vector3(R_NUCLEON, R_NUCLEON, 0)) },
        { p: new THREE.Vector3(0, -1.6, 0), box: [-62, 0, 62, 40] }, // room for the new nucleus's name under it
      ];
    },
  };
}
