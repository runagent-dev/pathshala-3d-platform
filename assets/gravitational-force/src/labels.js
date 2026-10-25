// Labels on the 3D, placed in screen space so they never collide. Each stop has a few labels (made with the kit's
// annotations, each pinned to a computed point with no leader line). Every frame, before drawing, each label takes
// the first of its candidate places that is inside the view and touches nothing already placed: the bodies, the
// arrows, the corner buttons, the note, the coach's bubble and the labels placed before it. The dashed lines are
// avoided where possible (a label may cross one if it must). A label with no free place is hidden for the moment.
import * as THREE from 'three';
import { R as EARTH_R } from './globe.js';
import { FACTS, orbitPoint } from './physics.js';

/** The labels of each stop (the test may show fewer). */
export const LABEL_SETS = {
  apples: ['pull', 'dist'],
  earth: ['you', 'south', 'pull', 'centre'],
  moon: ['small', 'big', 'pull', 'dist', 'straight'],
  sun: ['small', 'big', 'pull', 'dist', 'straight'],
  galaxy: ['sun', 'centre', 'pull', 'dist'],
};

export function createLabels({ stage, ui, annotations }) {
  const { camera } = stage;
  const LBL = {}; // id → { el, w, h, world, side }
  const ndcV = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const sizeV = new THREE.Vector3();

  /** New labels: { id: { text, kind: 'part' | 'callout', color } }. */
  function set(specs) {
    annotations.clear();
    for (const k of Object.keys(LBL)) delete LBL[k];
    for (const [id, sp] of Object.entries(specs)) {
      const world = new THREE.Vector3();
      annotations.add(id, { text: sp.text, point: () => world, dx: 0, dy: 0, kind: sp.kind, color: sp.color });
      const el = ui.annoLayer.lastElementChild;
      el.classList.add(`gf-l-${id}`);
      LBL[id] = { el, w: 0, h: 0, world, side: 1 };
    }
    stage.invalidate();
  }
  /** Change a label's text in place (its size is measured again). */
  function text(id, html) {
    const L = LBL[id];
    if (!L || L.text === html) return;
    L.text = html;
    L.el.innerHTML = html;
    L.w = 0;
  }
  const remeasure = () => {
    for (const L of Object.values(LBL)) L.w = 0;
  };

  const scr = (p) => {
    ndcV.copy(p).project(camera);
    return { x: (ndcV.x * 0.5 + 0.5) * stage.width, y: (-ndcV.y * 0.5 + 0.5) * stage.height };
  };
  /** The world point drawn at screen point (x, y), at the depth of world point `ref`. */
  function toWorld(x, y, ref, out) {
    ndcV.copy(ref).project(camera);
    ndcV.x = (x / stage.width) * 2 - 1;
    ndcV.y = -(y / stage.height) * 2 + 1;
    return out.copy(ndcV).unproject(camera);
  }
  /** How many pixels a ball of radius `size` round world point p looks. */
  function pxSize(p, size) {
    const a = scr(p);
    camUp.setFromMatrixColumn(camera.matrixWorld, 1);
    const b = scr(sizeV.copy(p).addScaledVector(camUp, size));
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
  function sizeOf(L) {
    if (!L.w && L.el.isConnected) {
      L.w = L.el.offsetWidth;
      L.h = L.el.offsetHeight;
    }
    return L.w ? L : { w: 90, h: 26 };
  }
  /** Does a box (w×h centred at x, y) touch an obstacle: a circle { x, y, r } or a box { x, y, w, h }? */
  function touches(ob, x, y, w, h) {
    if (ob.r != null) {
      const dx = Math.max(Math.abs(ob.x - x) - w / 2, 0);
      const dy = Math.max(Math.abs(ob.y - y) - h / 2, 0);
      return dx * dx + dy * dy < (ob.r + 3) ** 2;
    }
    return Math.abs(ob.x - x) < (ob.w + w) / 2 + 3 && Math.abs(ob.y - y) < (ob.h + h) / 2 + 3;
  }
  /** Small circles along a segment (an arrow or a line), so labels keep off it. */
  function along(a, b, r, step = 9, out = []) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let i = 0; i <= n; i++) out.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n, r });
    return out;
  }
  const halfAlong = (L, ux, uy) => (Math.abs(ux) * L.w + Math.abs(uy) * L.h) / 2;
  const hide = (id) => LBL[id]?.el.classList.add('gf-off');
  /** Is a box of label L centred at c inside the view? */
  const inView = (c, L) => c.x - L.w / 2 >= 4 && c.x + L.w / 2 <= stage.width - 4 && c.y - L.h / 2 >= 4 && c.y + L.h / 2 <= stage.height - 4;

  /** Place label `id` at the first free candidate (keeping clear of `avoid` too); returns its box, or null (hidden). */
  function place(id, candidates, obstacles, ref, avoid = []) {
    const L = LBL[id];
    if (!L) return null;
    const { w, h } = sizeOf(L);
    for (const c of candidates) {
      if (c.x - w / 2 < 4 || c.x + w / 2 > stage.width - 4 || c.y - h / 2 < 4 || c.y + h / 2 > stage.height - 4) continue;
      if (obstacles.some((ob) => touches(ob, c.x, c.y, w, h)) || avoid.some((ob) => touches(ob, c.x, c.y, w, h))) continue;
      toWorld(c.x, c.y, ref, L.world);
      L.el.classList.remove('gf-off');
      if (c.side) L.side = c.side;
      const box = { x: c.x, y: c.y, w, h };
      obstacles.push(box);
      return box;
    }
    L.el.classList.add('gf-off');
    return null;
  }
  /** Clear of the lines if it can be, otherwise across them. */
  const placeSoft = (id, cands, obstacles, ref, lines) => place(id, cands, obstacles, ref, lines) ?? place(id, cands, obstacles, ref);

  /** Candidates round a point: first along the direction (ux, uy) away from it, then turning to either side. */
  function around(p, ux, uy, L, gap, turns = [0, 30, -30, 60, -60, 95, -95, 135, -135, 180]) {
    return turns.map((deg) => {
      const a = (deg * Math.PI) / 180;
      const vx = ux * Math.cos(a) - uy * Math.sin(a);
      const vy = ux * Math.sin(a) + uy * Math.cos(a);
      const d = gap + halfAlong(L, vx, vy);
      return { x: p.x + vx * d, y: p.y + vy * d };
    });
  }
  /** Last resort: rings of places round a point, nearer rings first. */
  function ring(p, L, gaps = [8, 22, 38, 56], n = 16) {
    const list = [];
    for (const gap of gaps)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const d = gap + halfAlong(L, Math.cos(a), Math.sin(a));
        list.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d });
      }
    return list;
  }
  /** Candidates beside a segment from a to b at the fractions `at`, `gaps` pixels off it, on the remembered side first. */
  function beside(a, b, L, at, gaps, memoSide) {
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const list = [];
    for (const gap of [].concat(gaps)) {
      const off = gap + halfAlong(L, nx, ny);
      for (const k of at)
        for (const side of [memoSide, -memoSide])
          list.push({ x: a.x + (b.x - a.x) * k + nx * off * side, y: a.y + (b.y - a.y) * k + ny * off * side, side });
    }
    return list;
  }

  // the corner buttons and the note move only when the view is resized or the stop changes
  let fixed = [];
  function cacheBoxes() {
    const sr = ui.stage.getBoundingClientRect();
    fixed = [ui.corner, ui.stage.querySelector('.gf-note')].filter(Boolean).flatMap((e) => {
      const b = e.getBoundingClientRect();
      return b.width ? [{ x: (b.left + b.right) / 2 - sr.left, y: (b.top + b.bottom) / 2 - sr.top, w: b.width, h: b.height }] : [];
    });
  }
  /** The coach's bubble, when it shows. */
  function coachBox() {
    const e = ui.coachLayer.querySelector('.pvc-coach-label.in');
    if (!e) return null;
    const sr = ui.stage.getBoundingClientRect();
    const b = e.getBoundingClientRect();
    return { x: (b.left + b.right) / 2 - sr.left, y: (b.top + b.bottom) / 2 - sr.top, w: b.width, h: b.height };
  }
  /** Everything the labels keep clear of before any of them is placed. */
  function baseObstacles() {
    const list = fixed.map((b) => ({ ...b }));
    if (ui.hint.classList.contains('show')) {
      const sr = ui.stage.getBoundingClientRect();
      const b = ui.hint.getBoundingClientRect();
      list.push({ x: (b.left + b.right) / 2 - sr.left, y: (b.top + b.bottom) / 2 - sr.top, w: b.width, h: b.height });
    }
    const coach = coachBox();
    if (coach) list.push(coach);
    return { list, coach };
  }

  return {
    LBL,
    set,
    text,
    remeasure,
    cacheBoxes,
    baseObstacles,
    has: () => Object.keys(LBL).length > 0,
    tools: { scr, pxSize, sizeOf, touches, along, around, ring, beside, place, placeSoft, hide, halfAlong, inView },
  };
}

/**
 * The Earth: "তুমি" beyond your head (never hidden: the test names you), "দক্ষিণ মেরু" by that person (one test
 * question), "পৃথিবীর কেন্দ্র" in the widest gap between the lines that meet at the centre, and the pull's name
 * beside your arrow, hidden while the coach's bubble shows (it would be pushed far from your arrow).
 */
export function layoutEarth(labels, { sc, coach }, obstacles) {
  const { LBL } = labels;
  const T = labels.tools;
  const g = sc.earth;
  const v = new THREE.Vector3();
  const ref = g.root.getWorldPosition(new THREE.Vector3());
  const c = T.scr(ref);
  const people = {};
  for (const pid of g.ids) {
    const head = T.scr(g.points.head(pid, v));
    const feet = T.scr(g.points.feet(pid, v));
    const tip = T.scr(g.points.tip(pid, v));
    people[pid] = { head, feet, tip, mid: { x: (head.x + feet.x) / 2, y: (head.y + feet.y) / 2 } };
    obstacles.push({ x: people[pid].mid.x, y: people[pid].mid.y, r: (Math.hypot(head.x - feet.x, head.y - feet.y) / 2) * 0.85 });
    if (g.people[pid].arrow.root.visible) T.along(people[pid].mid, tip, 4, 9, obstacles);
  }
  const dirs = []; // the directions of the lines that meet at the centre
  const lines = [];
  if (g.centre.visible) {
    obstacles.push({ x: c.x, y: c.y, r: 6 });
    for (const pid of g.ids) {
      if (!g.people[pid].line.mesh.visible) continue;
      T.along(people[pid].tip, c, 3, 10, lines);
      dirs.push(Math.atan2(people[pid].tip.y - c.y, people[pid].tip.x - c.x));
    }
  }
  const rGlobe = T.pxSize(ref, EARTH_R);
  const globe = { x: c.x, y: c.y, r: rGlobe };
  const nameBy = (id, pid) => {
    const p = people[pid];
    const len = Math.hypot(p.head.x - c.x, p.head.y - c.y) || 1;
    const L = T.sizeOf(LBL[id]);
    const cands = [
      ...T.around(p.head, (p.head.x - c.x) / len, (p.head.y - c.y) / len, L, 6),
      ...T.around(p.head, (p.head.x - c.x) / len, (p.head.y - c.y) / len, L, 20),
    ];
    // off the globe if possible, then anywhere round the person
    const all = [...cands.filter((q) => !T.touches(globe, q.x, q.y, L.w, L.h)), ...cands, ...T.ring(p.mid, L)];
    const at = g.points.head(pid, new THREE.Vector3());
    if (T.placeSoft(id, all, obstacles, at, lines)) return;
    // nowhere free: the nearest place inside the view, even if it touches something
    const q = all.find((p2) => T.inView(p2, L));
    if (q && !T.place(id, [q], obstacles, at)) obstacles.push(T.place(id, [q], [], at));
  };
  if (LBL.you) nameBy('you', 'you');
  if (LBL.south) nameBy('south', 'south');
  // the centre first (the one idea: towards it), then the pull's name beside your arrow
  if (LBL.centre && g.centre.visible) {
    dirs.sort((a, b) => a - b);
    const gaps = dirs.map((a, i) => {
      const b = i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + Math.PI * 2;
      return { mid: (a + b) / 2, size: b - a };
    });
    gaps.sort((a, b) => b.size - a.size);
    if (!gaps.length) gaps.push({ mid: Math.PI / 2, size: Math.PI * 2 });
    const L = T.sizeOf(LBL.centre);
    const cands = [];
    // nearest first, in any of the three widest gaps; never further out than most of the way to the edge
    for (let d = 8; d < Math.max(30, rGlobe * 0.6); d += 5)
      for (const gp of gaps.slice(0, 3)) {
        const k = d + T.halfAlong(L, Math.cos(gp.mid), Math.sin(gp.mid));
        cands.push({ x: c.x + Math.cos(gp.mid) * k, y: c.y + Math.sin(gp.mid) * k });
      }
    T.placeSoft('centre', cands, obstacles, ref, lines);
  } else T.hide('centre');
  if (LBL.pull && g.people.you.arrow.root.visible && !coach) {
    const you = people.you;
    const L = T.sizeOf(LBL.pull);
    const mid = { x: (you.feet.x + you.tip.x) / 2, y: (you.feet.y + you.tip.y) / 2 };
    const cands = [
      ...T.beside(you.feet, you.tip, L, [0.6, 0.95, 1.3, 1.7, 2.1, -0.4], [7, 20], LBL.pull.side),
      ...T.ring(mid, L, [8, 22, 38, 56, 76]),
    ];
    T.placeSoft('pull', cands, obstacles, ref, lines);
  } else T.hide('pull');
}

/**
 * The Moon or the Sun stop: the two names on the far sides of the bodies, the pull's name beside the moving body's
 * arrow, the distance beside the line between them; with the pull gone, "সরলরেখায় চলতেই থাকবে" beside the straight
 * path near where the body left the picture.
 */
export function layoutOrbit(labels, { sc, s }, obstacles) {
  const { LBL } = labels;
  const T = labels.tools;
  const o3 = sc[s.stop];
  const refBig = o3.points.big(new THREE.Vector3());
  const refSmall = o3.points.small(new THREE.Vector3());
  const big = T.scr(refBig);
  const small = T.scr(refSmall);
  const rBig = T.pxSize(refBig, o3.S.big);
  const rSmall = Math.max(T.pxSize(refSmall, o3.S.small), 8);
  const gone = Boolean(s.free);
  const left = gone && s.free.end; // the body has left the picture
  obstacles.push({ x: big.x, y: big.y, r: rBig });
  if (!left) obstacles.push({ x: small.x, y: small.y, r: rSmall });
  const len = Math.hypot(small.x - big.x, small.y - big.y) || 1;
  const ux = (small.x - big.x) / len;
  const uy = (small.y - big.y) / len;
  const pullsOn = s.pulls && !gone;
  if (pullsOn) T.along(big, small, 5, 9, obstacles);
  if (LBL.small) {
    if (left) T.hide('small');
    else T.place('small', T.around(small, ux, uy, T.sizeOf(LBL.small), rSmall + 4), obstacles, refSmall);
  }
  if (LBL.big) T.place('big', T.around(big, -ux, -uy, T.sizeOf(LBL.big), rBig + 4, [0, 40, -40, 80, -80, 120, -120, 180]), obstacles, refBig);
  if (LBL.pull) {
    if (pullsOn) {
      // beside the arrow on the moving body (it covers S.small … S.small + S.arrow of the line from it)
      const at = [0.5, 0.25, 0.75, 1].map((k) => (o3.S.small + o3.S.arrow * k) / o3.S.r);
      const L = T.sizeOf(LBL.pull);
      const mid = T.scr(o3.points.arrowMid(new THREE.Vector3()));
      T.place('pull', [...T.beside(small, big, L, at, [8, 22], LBL.pull.side), ...T.ring(mid, L, [8, 22, 38, 56])], obstacles, refSmall);
    } else T.hide('pull');
  }
  if (LBL.dist) {
    if (!gone && o3.line.mesh.visible) {
      const side = -(LBL.pull?.side ?? 1);
      T.place('dist', T.beside(big, small, T.sizeOf(LBL.dist), [0.5, 0.4, 0.6, 0.3, 0.7], [8, 16, 28], side), obstacles, refBig);
    } else T.hide('dist');
  }
  if (LBL.straight) {
    if (gone && s.free.t > 0.6) {
      const a = orbitPoint(o3.S.r, s.free.phi0);
      const from = T.scr(o3.root.localToWorld(new THREE.Vector3(a.x, 0, a.z)));
      const to = left ? T.scr(o3.root.localToWorld(new THREE.Vector3(s.free.end.x, 0, s.free.end.z))) : small;
      const L = T.sizeOf(LBL.straight);
      T.place(
        'straight',
        [...T.beside(from, to, L, [0.7, 0.55, 0.85, 0.4], [8, 20, 34], LBL.straight.side), ...T.ring(to, L, [10, 26])],
        obstacles,
        refBig,
      );
    } else T.hide('straight');
  }
}

/** The galaxy: our Sun's name beyond it, the centre's name on the other side, the pull and the distance beside the line. */
export function layoutGalaxy(labels, { sc, s }, obstacles) {
  const { LBL } = labels;
  const T = labels.tools;
  const g = sc.galaxy;
  const refSun = g.points.sun(new THREE.Vector3());
  const refC = g.points.centre(new THREE.Vector3());
  const sun = T.scr(refSun);
  const c = T.scr(refC);
  const rMark = T.pxSize(refSun, 2.2);
  obstacles.push({ x: sun.x, y: sun.y, r: rMark }, { x: c.x, y: c.y, r: 8 });
  if (s.pulls) T.along(sun, c, 4, 10, obstacles);
  const len = Math.hypot(sun.x - c.x, sun.y - c.y) || 1;
  const ux = (sun.x - c.x) / len;
  const uy = (sun.y - c.y) / len;
  if (LBL.sun) T.place('sun', T.around(sun, ux, uy, T.sizeOf(LBL.sun), rMark + 4), obstacles, refSun);
  if (LBL.centre) T.place('centre', T.around(c, -ux, -uy, T.sizeOf(LBL.centre), 10, [0, 50, -50, 100, -100, 150, -150]), obstacles, refC);
  if (LBL.pull) {
    if (s.pulls) {
      const mid = T.scr(g.points.arrowMid(new THREE.Vector3()));
      const L = T.sizeOf(LBL.pull);
      T.place(
        'pull',
        [...T.beside(mid, { x: mid.x - ux, y: mid.y - uy }, L, [0], [8, 22], LBL.pull.side), ...T.ring(mid, L, [8, 22, 38])],
        obstacles,
        refSun,
      );
    } else T.hide('pull');
  }
  if (LBL.dist) {
    // beside the dashed line on either side, then further along or out, then round its middle
    const L = T.sizeOf(LBL.dist);
    const mid = { x: (sun.x + c.x) / 2, y: (sun.y + c.y) / 2 };
    const cands = [...T.beside(c, sun, L, [0.5, 0.35, 0.65, 0.8, 0.2], [8, 16, 26], -(LBL.pull?.side ?? 1)), ...T.ring(mid, L, [10, 22])];
    T.place('dist', cands, obstacles, refC);
  }
}

/** The apples: the distance under the dimension line, the pull's name above the right apple's arrow. */
export function layoutApples(labels, { sc, s }, obstacles) {
  const { LBL } = labels;
  const T = labels.tools;
  const a = sc.apples;
  const v = new THREE.Vector3();
  const left = T.scr(a.points.left(v));
  const right = T.scr(a.points.right(v));
  const rA = T.pxSize(v, FACTS.apple.radius);
  obstacles.push({ x: left.x, y: left.y, r: rA }, { x: right.x, y: right.y, r: rA });
  if (LBL.dist) {
    const ref = a.points.dimMid(new THREE.Vector3());
    const m = T.scr(ref);
    const L = T.sizeOf(LBL.dist);
    T.place(
      'dist',
      [
        { x: m.x, y: m.y + L.h / 2 + 7 },
        { x: m.x, y: m.y - L.h / 2 - 7 },
      ],
      obstacles,
      ref,
    );
  }
  if (LBL.pull) {
    if (s.pulls) {
      const ref = a.points.rightArrow(new THREE.Vector3());
      const m = T.scr(ref);
      const L = T.sizeOf(LBL.pull);
      // just above the arrow (it is as high as the apple's middle): over its middle, or ending just short of the
      // right apple when the arrow is short; below it if there is no room above
      const up = L.h / 2 + 8;
      const snug = right.x - rA - 6 - L.w / 2;
      const cands = [];
      for (const dy of [-up, up, -up - 18]) for (const x of [m.x, snug]) cands.push({ x, y: m.y + dy });
      T.place('pull', cands, obstacles, ref);
    } else T.hide('pull');
  }
}
