// Gravitational force (মহাকর্ষ বল, book page 68, topic 3.2.1), student view. Five stops, from the smallest distance to
// the largest, show the same pull: two apples on a table (any two masses attract, very weakly), people standing all
// round the Earth (মাধ্যাকর্ষণ বল always points to the Earth's centre: that is "down", and why we feel our weight),
// the Moon round the Earth, the Earth round the Sun, and our Sun round the centre of the galaxy (its range is
// infinite). The student drags themself round the Earth and drops the apples, drags an apple nearer or further, and
// takes the pull away from the Moon or the Earth to see it fly off in a straight line. Then a short test.
// Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { earthTexture } from './maps.js';
import { createGlobe, H as PERSON_H, R as EARTH_R } from './globe.js';
import { createGalaxy, createOrbit } from './space.js';
import { createTable } from './table.js';
import { createDashes, PULL } from './draw.js';
import {
  FACTS,
  GAP,
  PEOPLE,
  STOPS,
  applePull,
  clamp,
  directionChoices,
  fairQuestionAngles,
  angleBetween,
  orbitPoint,
  placeAt,
  rimAngleOf,
  roundTo,
  scientific,
  straightPath,
  turned,
  unwrap,
  wrap360,
} from './physics.js';

export const DEFAULTS = {
  stop: 'earth', // 'apples' | 'earth' | 'moon' | 'sun' | 'galaxy'
  play: true, // the orbits turn
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const START_PHASE = { moon: 35, sun: 140, galaxy: 0 }; // where the moving bodies start (degrees on their circles)
const FALL_S = 0.45; // s: an apple dropped from a hand about a metre up takes about this long to land
const FREE_S = 4.2; // s: how long the "no pull" demo lets the body fly before the pull comes back
const VIEWS = {
  apples: { front: [0, 0.95, 1], '3d': [0.6, 0.75, 0.5] },
  earth: { front: [0, 0, 1], '3d': [0.8, 0.3, 0.52] },
  moon: { front: [0, 1, 0.3], '3d': [0.5, 0.55, 0.68] },
  sun: { front: [0, 1, 0.3], '3d': [0.5, 0.55, 0.68] },
  galaxy: { front: [0, 1, 0.36], '3d': [0.55, 0.42, 0.72] },
};
const FORCES = [
  ['grav', 'f_grav', 'inf'],
  ['weak', 'f_weak', -18],
  ['em', 'f_em', 'inf'],
  ['strong', 'f_strong', -15],
];
const sup = (n) => `10<sup>${n < 0 ? '−' : ''}${Math.abs(n)}</sup>`;
const sciHtml = ({ a, n }) => `${a} × ${sup(n)}`;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'gf');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="pvc-seg gf-stops" role="group" aria-label="${t('stop_label')}">
            ${STOPS.map((id) => `<button data-stop="${id}">${t(`stop_${id}`)}</button>`).join('')}
          </div>
          <p class="gf-idea"></p>
          <div class="gf-row">
            <p class="gf-fact"></p>
            <button class="pvc-btn primary gf-act" data-act="action"><span></span></button>
          </div>
          <div class="gf-forces">
            <span class="gf-forces-k">${t('forces_title')}</span>
            <div class="gf-ladder">
              ${FORCES.map(
                ([cls, key, range]) =>
                  `<span class="gf-f ${cls}${cls === 'grav' ? ' on' : ''}"><b>${t(key)}</b><small>${range === 'inf' ? t('range_inf') : t('range_m', { p: sup(range) })}</small></span>`,
              ).join('')}
            </div>
          </div>`,
  });
  const note = document.createElement('div');
  note.className = 'gf-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 1, far: 4000, environment: 'studio-light' });
  const { camera, controls, scene, renderer } = stage;
  controls.enablePan = false;
  const M = createMaterials(renderer);
  const world = new THREE.Group();
  world.name = 'GravitationalForceScene';
  scene.add(world);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });

  const map = earthTexture(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  const sc = {
    apples: createTable({ materials: M }),
    earth: createGlobe({ renderer, map }),
    moon: createOrbit({ kind: 'moon', renderer, earthMap: map }),
    sun: createOrbit({ kind: 'sun', renderer, earthMap: map }),
    galaxy: createGalaxy(),
  };
  // lights that belong to a stop (a light in a hidden stop lights nothing)
  const light = (parent, color, intensity, pos) => {
    const l = new THREE.DirectionalLight(color, intensity);
    l.position.set(...pos);
    l.userData.noExport = true;
    l.target.userData.noExport = true;
    parent.add(l, l.target);
    return l;
  };
  light(sc.earth.root, 0xffffff, 1.3, [-40, 50, 90]);
  light(sc.moon.root, 0xffffff, 1.2, [-60, 80, 50]);
  light(sc.galaxy.root, 0xffffff, 0.8, [0, 80, 40]);
  const sunLight = new THREE.PointLight(0xfff1d0, 2.6, 0, 0); // the Sun lights the Earth's day side
  sunLight.userData.noExport = true;
  sc.sun.root.add(sunLight);
  const tableLight = light(sc.apples.root, 0xffffff, 0.9, [-30, 90, 60]);
  if (o.shadow && o.bg !== 'transparent') {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    tableLight.castShadow = true;
    tableLight.shadow.mapSize.set(1024, 1024);
    Object.assign(tableLight.shadow.camera, { left: -60, right: 60, top: 40, bottom: -40, near: 20, far: 220 });
    tableLight.shadow.radius = 6;
    tableLight.shadow.blurSamples = 12;
    for (const a of [sc.apples.left, sc.apples.right]) a.traverse((m) => m instanceof THREE.Mesh && (m.castShadow = true));
    sc.apples.root.children[0].receiveShadow = true; // the table top
  }
  // the straight path of the "no pull" demo, one per orbit stop
  for (const id of ['moon', 'sun']) {
    sc[id].trail = createDashes({ radius: 0.16, dash: 1.1, gap: 0.8, color: '#1d2733', top: false, max: 80, name: 'StraightPath' });
    sc[id].root.add(sc[id].trail.mesh);
  }
  for (const id of STOPS) {
    sc[id].root.visible = false;
    world.add(sc[id].root);
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    stop: STOPS.includes(o.stop) ? o.stop : 'earth',
    angle: PEOPLE.you, // where you stand on the Earth's edge (degrees from the North Pole, clockwise)
    gap: GAP.start, // cm between the apples' centres
    phase: { ...START_PHASE },
    playing: o.play !== false,
    free: null, // the "no pull" demo: { stop, phi0, t }
    drop: null, // the apples are falling: { t, landed }
    dropShown: false, // the panel says where the apples fell (until something else happens)
    appleMoved: false, // the apple on the table has been moved (the panel stops saying how)
    demo: false, // the first-use pointer is moving you (the panel keeps the place you started from)
    demoAngle: PEOPLE.you,
    pulls: true, // the test hides the pulls when they would give the answer away
    labels: null, // the test shows only these labels (null: all)
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    drag: null,
    before: null, // the learn state before the test
    userMovedCamera: false,
  };
  const orbitStop = () => s.stop === 'moon' || s.stop === 'sun';

  function snapshot() {
    const place = placeAt(s.angle);
    return {
      stop: s.stop,
      angle: roundTo(wrap360(s.angle), 0.1),
      place: place.key,
      boat: place.sea,
      gap: roundTo(s.gap, 0.1),
      pull: Number(applePull(s.gap).toPrecision(3)),
      orbit: s.stop in s.phase ? roundTo(wrap360(s.phase[s.stop]), 0.1) : null,
      playing: s.playing,
      nopull: Boolean(s.free),
      dropping: Boolean(s.drop),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.stop, snap.angle, snap.gap, snap.nopull, snap.playing, snap.dropping, snap.view, snap.mode]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    idea: $('.gf-idea'),
    fact: $('.gf-fact'),
    act: $('[data-act="action"]'),
    actLabel: $('[data-act="action"] span'),
  };
  function factHtml() {
    switch (s.stop) {
      case 'apples':
        // the pull now; then how to move the apple (until it has been moved), or the apples' mass
        return `${t('fact_apples', { d: Math.round(s.gap), f: sciHtml(scientific(applePull(s.gap))) })}<br>${s.appleMoved ? t('fact_apple_mass', { m: FACTS.apple.mass * 1000 }) : t('fact_drag_apple')}`;
      case 'earth':
        if (s.dropShown) return t('fact_drop');
        return t('fact_earth', { place: t(`place_${placeAt(s.demo ? s.demoAngle : s.angle).key}`), d: '6,400' });
      case 'moon':
        return t('fact_moon', { d: FACTS.moon.lakhKm, n: FACTS.moon.days });
      case 'sun':
        return t('fact_sun', { d: FACTS.sun.croreKm, n: FACTS.sun.years });
      default:
        return t('fact_galaxy', { d: FACTS.galaxy.thousandLy, n: FACTS.galaxy.croreYears });
    }
  }
  function setNote() {
    note.textContent = t(
      s.stop === 'apples' ? 'note_apples' : s.stop === 'earth' ? 'note_earth' : s.stop === 'galaxy' ? 'note_galaxy' : 'note_space',
    );
  }
  function refresh() {
    el.idea.innerHTML = t(s.free ? `idea_nopull_${s.free.stop}` : `idea_${s.stop}`);
    el.fact.innerHTML = factHtml();
    const act = s.stop === 'earth' ? 'act_drop' : orbitStop() ? (s.free ? 'act_pull_back' : 'act_nopull') : null;
    el.act.hidden = !act;
    if (act) el.actLabel.textContent = t(act);
    el.act.classList.toggle('primary', act !== 'act_pull_back');
    setNote();
    if (s.stop === 'apples') {
      const d = LBL.dist;
      if (d) d.el.textContent = t('label_dist_apples', { d: Math.round(s.gap) });
    }
    stage.invalidate();
  }

  // ── the scene of the current stop ───────────────────────────────────────────
  function drawScene() {
    const id = s.stop;
    if (id === 'apples') sc.apples.setGap(s.gap);
    else if (id === 'earth') sc.earth.place('you', s.angle);
    else if (id === 'galaxy') sc.galaxy.setAngle(s.phase.galaxy);
    else if (s.free) {
      const f = s.free;
      const S = sc[id].S;
      const q = straightPath(S.r, f.phi0, FACTS[id].period, f.t);
      sc[id].setFree(q.x, q.z);
      const a = orbitPoint(S.r, f.phi0);
      sc[id].trail.set(new THREE.Vector3(a.x, 0, a.z), new THREE.Vector3(q.x, 0, q.z));
    } else sc[id].setAngle(s.phase[id]);
    applyPulls();
    stage.invalidate();
  }
  /** Which pulls are drawn: none while the test hides them, not the moving body's pair while its pull is "gone". */
  function applyPulls() {
    const on = s.pulls;
    sc.apples.setPulls(on);
    sc.earth.showPulls(on);
    sc.galaxy.setPulls(on);
    for (const id of ['moon', 'sun']) {
      const gone = Boolean(s.free && s.free.stop === id);
      sc[id].setPulls(on && !gone);
      sc[id].trail.mesh.visible = gone;
      sc[id].setLine(!gone); // with the pull gone nothing joins the two bodies, not even a drawn line
    }
  }

  stage.addTicker((dt) => {
    let busy = false;
    const id = s.stop;
    if (s.free) {
      s.free.t += dt;
      if (s.free.t >= FREE_S) pullBack({ pop: true });
      else drawScene();
      busy = true;
    } else if (s.playing && id in s.phase) {
      s.phase[id] += turned(dt, FACTS[id].period);
      drawScene();
      busy = true;
    }
    if (s.drop) {
      tickDrop(dt);
      busy = true;
    }
    return busy;
  });

  // ── the apples fall (the Earth stop) ────────────────────────────────────────
  function drop({ silent = false } = {}) {
    if (s.locked) return lockedNudge();
    if (s.stop !== 'earth') return;
    if (s.drop && s.drop.t < FALL_S + 0.2) return; // a double tap does not start the fall again
    cancelDrop();
    for (const pid of sc.earth.ids) {
      tweener.cancel(`apple-${pid}`); // an apple still popping back into the hand is whole at once
      sc.earth.people[pid].person.apple.scale.setScalar(1);
    }
    s.drop = { t: 0, landed: false };
    el.act.classList.remove('gf-nudge');
    if (!silent) audio.pop();
    emit('drop', { angle: roundTo(wrap360(s.angle), 0.1) });
    emitChange();
    stage.invalidate();
  }
  function tickDrop(dt) {
    const d = s.drop;
    d.t += dt;
    const k = Math.min(1, (d.t / FALL_S) ** 2); // falling from rest: the distance grows as the time squared
    for (const pid of sc.earth.ids) sc.earth.setFall(pid, k);
    if (k >= 1 && !d.landed) {
      d.landed = true;
      audio.contact();
      s.dropShown = true;
      refresh();
    }
    if (d.t > FALL_S + 2.6) {
      // the apples come back to the hands
      cancelDrop();
      for (const pid of sc.earth.ids) {
        const a = sc.earth.people[pid].person.apple;
        a.scale.setScalar(0.001);
        tweener.animate({
          key: `apple-${pid}`,
          duration: 0.35,
          ease: ease.outBack,
          onUpdate: (e) => {
            a.scale.setScalar(Math.max(0.001, e));
            stage.invalidate();
          },
        });
      }
      emitChange();
    }
    stage.invalidate();
  }
  function cancelDrop() {
    if (!s.drop) return;
    s.drop = null;
    for (const pid of sc.earth.ids) sc.earth.setFall(pid, 0);
  }

  // ── "what if there were no pull?" (the Moon and Sun stops) ──────────────────
  function noPull() {
    if (s.locked) return lockedNudge();
    if (!orbitStop()) return;
    if (s.free) {
      if (s.free.t > 0.5) pullBack(); // a double tap does not undo the first
      return;
    }
    startFree();
  }
  function startFree() {
    s.free = { stop: s.stop, phi0: s.phase[s.stop], t: 0 };
    audio.pop();
    emit('nopull', { on: true });
    drawScene();
    refresh();
    emitChange();
  }
  /** The pull comes back: the body is back where it left its circle and goes round again. */
  function pullBack({ pop = false } = {}) {
    if (!s.free) return;
    const id = s.free.stop;
    s.free = null;
    if (pop && sc[id]) {
      const b = sc[id].small;
      b.scale.setScalar(0.001);
      tweener.animate({
        key: 'body-pop',
        duration: 0.4,
        ease: ease.outBack,
        onUpdate: (e) => {
          b.scale.setScalar(Math.max(0.001, e));
          stage.invalidate();
        },
      });
    }
    emit('nopull', { on: false });
    drawScene();
    refresh();
    emitChange();
  }
  function cancelFree() {
    if (!s.free) return;
    s.free = null;
    tweener.cancel('body-pop');
    for (const id of ['moon', 'sun']) sc[id].small.scale.setScalar(1);
  }

  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
  }

  // ── moving you round the Earth, and the apple along the table ───────────────
  function setAngle(deg) {
    s.angle = wrap360(deg);
    if (s.dropShown) s.dropShown = false;
    cancelDrop();
    drawScene();
    refresh();
  }
  function setGap(cm) {
    s.gap = clamp(cm, GAP.min, GAP.max);
    if (s.mode !== 'quiz') s.appleMoved = true;
    drawScene();
    refresh();
  }
  function stepBy(delta) {
    if (s.locked) return lockedNudge();
    if (s.stop === 'earth') {
      setAngle(s.angle + delta);
      coach?.objectUsed();
    } else if (s.stop === 'apples') setGap(s.gap + delta / 5);
    else return;
    emitChange();
  }

  // ── stops ───────────────────────────────────────────────────────────────────
  function setStop(id, { animate = true } = {}) {
    if (!STOPS.includes(id)) return;
    const prev = s.stop;
    cancelFree();
    cancelDrop();
    s.dropShown = false;
    s.drag = null;
    s.stop = id;
    for (const k of STOPS) sc[k].root.visible = k === id;
    const r = sc[id].root;
    if (animate && prev !== id) {
      // a little zoom: going out to bigger things the new picture comes in from bigger, coming back from smaller
      const k0 = STOPS.indexOf(id) > STOPS.indexOf(prev) ? 1.3 : 0.75;
      tweener.animate({
        key: 'stop-in',
        duration: 0.5,
        ease: ease.outCubic,
        onUpdate: (e) => {
          r.scale.setScalar(k0 + (1 - k0) * e);
          stage.invalidate();
        },
      });
    } else {
      tweener.cancel('stop-in');
      r.scale.setScalar(1);
    }
    for (const k of STOPS) if (k !== id) sc[k].root.scale.setScalar(1);
    s.userMovedCamera = false;
    setNote(); // before the camera is fitted: it keeps clear of the note
    flyTo(viewPose(), 0);
    cacheBoxes();
    setLabels();
    drawScene();
    refresh();
    syncUI();
    hideHint();
    emit('stop', { stop: id });
    emitChange();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  /** World points the camera must keep in view for a stop (stable: they do not follow anything that moves). */
  function framePoints(id) {
    const P = (x, y, z) => new THREE.Vector3(x, y, z);
    const circle = (r, y = 0, plane = 'xz') => {
      const list = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        list.push(plane === 'xz' ? P(r * Math.cos(a), y, r * Math.sin(a)) : P(r * Math.cos(a), r * Math.sin(a), 0));
      }
      return list;
    };
    if (id === 'apples') {
      const e = sc.apples.extent;
      const list = [];
      for (const x of [e.x0, e.x1]) for (const y of [0, e.top]) for (const z of [e.back, e.front]) list.push(P(x, y, z));
      return list;
    }
    if (id === 'earth') return [...circle(EARTH_R + PERSON_H * 1.16, 0, 'xy'), P(0, 0, EARTH_R), P(0, 0, -EARTH_R)]; // heads, in a boat too
    if (id === 'galaxy') return [...circle(sc.galaxy.RG + 1), P(0, 3, 0), P(0, -3, 0)];
    const S = sc[id].S;
    return [...circle(S.r + S.small + 0.6), P(0, S.big, 0), P(0, -S.big, 0)];
  }
  const basis = { f: new THREE.Vector3(), r: new THREE.Vector3(), u: new THREE.Vector3() };
  /** Fit the points in the view, looking along `dir`, keeping clear of the top margin (the corner buttons). */
  function fit(dir, pts, margin) {
    const { f, r, u } = basis;
    f.set(...dir).normalize();
    r.crossVectors(Math.abs(f.y) > 0.98 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0), f).normalize();
    u.crossVectors(f, r);
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const p of pts) {
      x0 = Math.min(x0, p.dot(r));
      x1 = Math.max(x1, p.dot(r));
      y0 = Math.min(y0, p.dot(u));
      y1 = Math.max(y1, p.dot(u));
    }
    const c = new THREE.Vector3().addScaledVector(r, (x0 + x1) / 2).addScaledVector(u, (y0 + y1) / 2);
    const W = Math.max(stage.width, 1);
    const Hh = Math.max(stage.height, 1);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * (W / Hh);
    const nx0 = -1 + (2 * margin.left) / W;
    const nx1 = 1 - (2 * margin.right) / W;
    const ny0 = -1 + (2 * margin.bottom) / Hh;
    const ny1 = 1 - (2 * margin.top) / Hh;
    const sx = (nx1 - nx0) / 2;
    const sy = (ny1 - ny0) / 2;
    let D = 1;
    const d = new THREE.Vector3();
    for (const p of pts) {
      d.subVectors(p, c);
      const z = d.dot(f);
      D = Math.max(D, Math.abs(d.dot(r)) / (sx * tanH) + z, Math.abs(d.dot(u)) / (sy * tanV) + z);
    }
    const target = c
      .clone()
      .addScaledVector(r, -((nx0 + nx1) / 2) * tanH * D)
      .addScaledVector(u, -((ny0 + ny1) / 2) * tanV * D);
    return { target, position: target.clone().addScaledVector(f, D), distance: D };
  }
  /** Does any of the points land under the corner buttons or the note, seen from this pose? */
  function hitsCorner(pose, pts) {
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld(true);
    const sr = ui.stage.getBoundingClientRect();
    const boxes = [ui.corner, note].map((e) => {
      const b = e.getBoundingClientRect();
      return { x0: b.left - sr.left - 6, x1: b.right - sr.left + 6, y0: b.top - sr.top - 6, y1: b.bottom - sr.top + 6, w: b.width };
    });
    const v = new THREE.Vector3();
    return pts.some((p) => {
      v.copy(p).project(camera);
      const x = (v.x * 0.5 + 0.5) * stage.width;
      const y = (-v.y * 0.5 + 0.5) * stage.height;
      return boxes.some((b) => b.w > 0 && x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1);
    });
  }
  function viewPose(view = s.view) {
    const id = s.stop;
    const pts = framePoints(id);
    const dir = VIEWS[id][view];
    const side = stage.width < 480 ? 6 : 12;
    const p0 = camera.position.clone();
    const q0 = camera.quaternion.clone();
    // As big as it can be, clear of the corner buttons and the note: in the middle; or moved down below the
    // buttons; or (on short frames, where moving down costs much) moved left of them, the note under the buttons.
    const cornerBottom = ui.corner.offsetTop + ui.corner.offsetHeight;
    const tries = [
      { m: { top: 8, bottom: 6, left: side, right: side }, noteRight: false, gain: 1 },
      { m: { top: cornerBottom + 8, bottom: 6, left: side, right: side }, noteRight: false, gain: 1 },
      { m: { top: 8, bottom: 6, left: side, right: ui.corner.offsetWidth + 16 }, noteRight: true, gain: 1.08 },
    ];
    let best = null;
    for (const tr of tries) {
      root.classList.toggle('gf-note-right', tr.noteRight);
      const pose = fit(dir, pts, tr.m);
      if (hitsCorner(pose, pts)) continue;
      if (!best || pose.distance * tr.gain < best.pose.distance) best = { pose, tr };
    }
    best ??= { pose: fit(dir, pts, tries[1].m), tr: tries[1] };
    root.classList.toggle('gf-note-right', best.tr.noteRight);
    camera.position.copy(p0);
    camera.quaternion.copy(q0);
    return best.pose;
  }
  function flyTo({ position, target }, duration = 0.8) {
    tweener.cancel('camera');
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    const pose = viewPose(s.view);
    cacheBoxes(); // the note may have moved
    return flyTo(pose, animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    root.classList.toggle('gf-compact', stage.height < 300 || stage.width < 340);
    if (!s.userMovedCamera) flyTo(viewPose(s.view), 0);
    for (const L of Object.values(LBL)) L.w = 0; // the label font may change size
    cacheBoxes();
  });

  // ── labels on the 3D, placed in screen space so they never collide ──────────
  // Each stop has a few labels. Every frame (before drawing) each label gets the first of its candidate places
  // that is inside the view and touches nothing already placed: the bodies, the arrows, the corner buttons, the
  // note, the coach's bubble and the labels placed before it. A label with no free place is hidden for the moment.
  const LBL = {}; // id → { el, w, h, world, side }
  const LABEL_SETS = {
    apples: ['pull', 'dist'],
    earth: ['you', 'pull', 'centre'],
    moon: ['small', 'big', 'pull', 'dist', 'straight'],
    sun: ['small', 'big', 'pull', 'dist', 'straight'],
    galaxy: ['sun', 'centre', 'dist', 'pull'],
  };
  function labelText(id) {
    const st = s.stop;
    if (id === 'pull') return t(st === 'earth' ? 'label_pull_earth' : 'label_pull');
    if (id === 'you') return t('label_you');
    if (id === 'centre') return t(st === 'earth' ? 'label_centre' : 'label_galaxy_centre');
    if (id === 'small') return t(st === 'moon' ? 'label_moon' : 'label_earth');
    if (id === 'big') return t(st === 'moon' ? 'label_earth' : 'label_sun');
    if (id === 'sun') return t('label_our_sun');
    if (id === 'straight') return t('label_straight');
    // dist
    if (st === 'apples') return t('label_dist_apples', { d: Math.round(s.gap) });
    if (st === 'moon') return t('label_dist_moon', { d: FACTS.moon.lakhKm });
    if (st === 'sun') return t('label_dist_sun', { d: FACTS.sun.croreKm });
    return t('label_dist_galaxy', { d: FACTS.galaxy.thousandLy });
  }
  function setLabels() {
    annotations.clear();
    for (const k of Object.keys(LBL)) delete LBL[k];
    for (const id of LABEL_SETS[s.stop]) {
      if (s.labels && !s.labels.includes(id)) continue;
      const world = new THREE.Vector3();
      const callout = id === 'pull' || id === 'dist' || id === 'straight';
      const color = id === 'pull' ? PULL : id === 'straight' ? '#1d2733' : id === 'dist' ? '#4b5766' : undefined;
      annotations.add(id, { text: labelText(id), point: () => world, dx: 0, dy: 0, kind: callout ? 'callout' : 'part', color });
      const elL = ui.annoLayer.lastElementChild;
      elL.classList.add(`gf-l-${id}`);
      LBL[id] = { el: elL, w: 0, h: 0, world, side: 1 };
    }
    stage.invalidate();
  }

  const ndcV = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const tmpW = new THREE.Vector3();
  const scr = (p) => {
    ndcV.copy(p).project(camera);
    return { x: (ndcV.x * 0.5 + 0.5) * stage.width, y: (-ndcV.y * 0.5 + 0.5) * stage.height, z: ndcV.z };
  };
  /** The world point drawn at screen point (x, y), at the depth of world point `ref`. */
  function toWorld(x, y, ref, out) {
    ndcV.copy(ref).project(camera);
    ndcV.x = (x / stage.width) * 2 - 1;
    ndcV.y = -(y / stage.height) * 2 + 1;
    return out.copy(ndcV).unproject(camera);
  }
  /** How many pixels a ball of radius `size` round world point p looks. */
  const camUp = new THREE.Vector3();
  const sizeV = new THREE.Vector3();
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
  function along(a, b, r, step = 9) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    const list = [];
    for (let i = 0; i <= n; i++) list.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n, r });
    return list;
  }
  const domBox = (e) => {
    const sr = ui.stage.getBoundingClientRect();
    const b = e.getBoundingClientRect();
    return b.width ? { x: (b.left + b.right) / 2 - sr.left, y: (b.top + b.bottom) / 2 - sr.top, w: b.width, h: b.height } : null;
  };
  const halfAlong = (L, ux, uy) => (Math.abs(ux) * L.w + Math.abs(uy) * L.h) / 2;
  /** Place label `id` at the first free candidate; returns its box (or null: hidden). */
  function placeLabel(id, candidates, obstacles, ref) {
    const L = LBL[id];
    if (!L) return null;
    const { w, h } = sizeOf(L);
    for (const c of candidates) {
      if (!c) continue;
      if (c.x - w / 2 < 4 || c.x + w / 2 > stage.width - 4 || c.y - h / 2 < 4 || c.y + h / 2 > stage.height - 4) continue;
      if (obstacles.some((ob) => touches(ob, c.x, c.y, w, h))) continue;
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
  /** Candidates round a point: first along the direction (ux, uy) away from it, then turning to either side. */
  function around(p, ux, uy, L, gap, turns = [0, 30, -30, 60, -60, 95, -95, 135, -135, 180]) {
    const list = [];
    for (const deg of turns) {
      const a = (deg * Math.PI) / 180;
      const vx = ux * Math.cos(a) - uy * Math.sin(a);
      const vy = ux * Math.sin(a) + uy * Math.cos(a);
      const d = gap + halfAlong(L, vx, vy);
      list.push({ x: p.x + vx * d, y: p.y + vy * d });
    }
    return list;
  }
  /** Last resort: rings of places round a point, nearer rings first. */
  function ring(p, L, gaps = [8, 22, 38, 56], n = 16) {
    const list = [];
    for (const gap of gaps)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const ux = Math.cos(a);
        const uy = Math.sin(a);
        const d = gap + halfAlong(L, ux, uy);
        list.push({ x: p.x + ux * d, y: p.y + uy * d });
      }
    return list;
  }
  /** Candidates beside a segment from a to b at the fractions `at`, `gaps` pixels off it, on the remembered side first. */
  function beside(a, b, L, at, gaps, memoSide) {
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    const nx = -uy;
    const ny = ux;
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
  let fixedBoxes = [];
  function cacheBoxes() {
    fixedBoxes = [ui.corner, note].map(domBox).filter(Boolean);
  }
  function layoutLabels() {
    if (!Object.keys(LBL).length) return;
    const obstacles = fixedBoxes.map((b) => ({ ...b }));
    if (ui.hint.classList.contains('show')) {
      const b = domBox(ui.hint);
      if (b) obstacles.push(b);
    }
    const coachLabel = ui.coachLayer.querySelector('.pvc-coach-label.in');
    if (coachLabel) {
      const b = domBox(coachLabel);
      if (b) obstacles.push(b);
    }
    const id = s.stop;
    if (id === 'earth') layoutEarth(obstacles);
    else if (id === 'apples') layoutApples(obstacles);
    else if (id === 'galaxy') layoutGalaxy(obstacles);
    else layoutOrbit(obstacles);
  }

  function layoutEarth(obstacles) {
    const g = sc.earth;
    const c = scr(g.root.getWorldPosition(tmpW));
    const ref = tmpW.clone();
    const people = {};
    for (const pid of g.ids) {
      const head = scr(g.points.head(pid, tmpV));
      const feet = scr(g.points.feet(pid, tmpV));
      const tip = scr(g.points.tip(pid, tmpV));
      people[pid] = { head, feet, tip, mid: { x: (head.x + feet.x) / 2, y: (head.y + feet.y) / 2 } };
      const r = Math.hypot(head.x - feet.x, head.y - feet.y) / 2;
      obstacles.push({ x: people[pid].mid.x, y: people[pid].mid.y, r: r * 0.85 });
      if (g.people[pid].arrow.root.visible) obstacles.push(...along(people[pid].mid, tip, 4));
    }
    // the dashed lines to the centre are kept clear where possible (a label may cross one if it must)
    const dirs = []; // the directions of the lines that meet at the centre
    const lines = [];
    if (g.centre.visible) {
      obstacles.push({ x: c.x, y: c.y, r: 6 });
      for (const pid of g.ids) {
        if (!g.people[pid].line.mesh.visible) continue;
        lines.push(...along(people[pid].tip, c, 3, 10));
        dirs.push(Math.atan2(people[pid].tip.y - c.y, people[pid].tip.x - c.x));
      }
    }
    /** Place a label clear of the lines too; the box it takes is kept clear by the labels after it. */
    const placeClear = (id, cands, at) => {
      const box = placeLabel(id, cands, [...obstacles, ...lines], at);
      if (box) obstacles.push(box);
      return box;
    };
    const you = people.you;
    const len = Math.hypot(you.head.x - c.x, you.head.y - c.y) || 1;
    const ux = (you.head.x - c.x) / len;
    const uy = (you.head.y - c.y) / len;
    const rGlobe = pxSize(ref, EARTH_R);
    if (LBL.you) {
      // beyond the head, off the globe if possible
      const L = sizeOf(LBL.you);
      const cands = [...around(you.head, ux, uy, L, 6), ...around(you.head, ux, uy, L, 20)];
      const globe = { x: c.x, y: c.y, r: rGlobe };
      // off the globe if possible; never hidden (the test names you), so rings round you come last
      const all = [...cands.filter((q) => !touches(globe, q.x, q.y, L.w, L.h)), ...cands, ...ring(you.mid, L)];
      const at = g.points.head('you', tmpV.clone());
      if (!placeClear('you', all, at) && !placeLabel('you', all, obstacles, at)) {
        // nowhere free: the nearest place inside the view, even if it touches something
        const q = all.find((p) => p.x - L.w / 2 >= 4 && p.x + L.w / 2 <= stage.width - 4 && p.y - L.h / 2 >= 4 && p.y + L.h / 2 <= stage.height - 4);
        if (q) obstacles.push(placeLabel('you', [q], [], at));
      }
    }
    // the centre first (the one idea: towards it), then the pull's name beside your arrow
    if (LBL.centre && g.centre.visible) {
      // in the widest gaps between the lines that meet at the centre, as close to the centre as it fits
      dirs.sort((a, b) => a - b);
      const gaps = dirs.map((a, i) => {
        const b = i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + Math.PI * 2;
        return { mid: (a + b) / 2, size: b - a };
      });
      gaps.sort((a, b) => b.size - a.size);
      if (!gaps.length) gaps.push({ mid: Math.PI / 2, size: Math.PI * 2 });
      const L = sizeOf(LBL.centre);
      const cands = [];
      // nearest first, in any of the three widest gaps; never further out than most of the way to the edge
      for (let d = 8; d < Math.max(30, rGlobe * 0.6); d += 5)
        for (const gp of gaps.slice(0, 3)) {
          const ux2 = Math.cos(gp.mid);
          const uy2 = Math.sin(gp.mid);
          const k = d + halfAlong(L, ux2, uy2);
          cands.push({ x: c.x + ux2 * k, y: c.y + uy2 * k });
        }
      if (!placeClear('centre', cands, ref)) placeLabel('centre', cands, obstacles, ref);
    } else if (LBL.centre) LBL.centre.el.classList.add('gf-off');
    if (LBL.pull && g.people.you.arrow.root.visible) {
      // beside the arrow where it goes into the ground, on the globe (or beside the part above the ground)
      const L = sizeOf(LBL.pull);
      const mid = { x: (you.feet.x + you.tip.x) / 2, y: (you.feet.y + you.tip.y) / 2 };
      const cands = [...beside(you.feet, you.tip, L, [0.6, 0.95, 1.3, 1.7, 2.1, -0.4], [7, 20], LBL.pull.side), ...ring(mid, L, [8, 22, 38, 56, 76])];
      if (!placeClear('pull', cands, ref)) placeLabel('pull', cands, obstacles, ref);
    } else if (LBL.pull) LBL.pull.el.classList.add('gf-off');
  }

  function layoutOrbit(obstacles) {
    const o3 = sc[s.stop];
    const big = scr(o3.points.big(tmpV));
    const refBig = tmpV.clone();
    const small = scr(o3.points.small(tmpV));
    const refSmall = tmpV.clone();
    const rBig = pxSize(refBig, o3.S.big);
    const rSmall = Math.max(pxSize(refSmall, o3.S.small), 8);
    obstacles.push({ x: big.x, y: big.y, r: rBig }, { x: small.x, y: small.y, r: rSmall });
    const len = Math.hypot(small.x - big.x, small.y - big.y) || 1;
    const ux = (small.x - big.x) / len;
    const uy = (small.y - big.y) / len;
    const pullsOn = s.pulls && !s.free;
    if (pullsOn) obstacles.push(...along(big, small, 5));
    if (LBL.small) placeLabel('small', around(small, ux, uy, sizeOf(LBL.small), rSmall + 4), obstacles, refSmall);
    if (LBL.big) placeLabel('big', around(big, -ux, -uy, sizeOf(LBL.big), rBig + 4, [0, 40, -40, 80, -80, 120, -120]), obstacles, refBig);
    if (LBL.pull) {
      if (pullsOn) {
        // beside the arrow on the moving body (it covers S.small … S.small + S.arrow of the line from it)
        const at = [0.5, 0.25, 0.75, 1].map((k) => (o3.S.small + o3.S.arrow * k) / o3.S.r);
        const L = sizeOf(LBL.pull);
        const mid = scr(o3.points.arrowMid(tmpV));
        placeLabel('pull', [...beside(small, big, L, at, [8, 22], LBL.pull.side), ...ring(mid, L, [8, 22, 38, 56])], obstacles, refSmall);
      } else LBL.pull.el.classList.add('gf-off');
    }
    if (LBL.dist) {
      if (!s.free && o3.line.mesh.visible) {
        placeLabel('dist', beside(big, small, sizeOf(LBL.dist), [0.5, 0.4, 0.6, 0.3, 0.7], [8, 16, 28], -(LBL.pull?.side ?? 1)), obstacles, refBig);
      } else LBL.dist.el.classList.add('gf-off');
    }
    if (LBL.straight) {
      if (s.free && s.free.stop === s.stop && s.free.t > 0.6) {
        const a = orbitPoint(o3.S.r, s.free.phi0);
        const from = scr(o3.root.localToWorld(tmpV.set(a.x, 0, a.z)));
        const L = sizeOf(LBL.straight);
        placeLabel('straight', beside(from, small, L, [0.5, 0.35, 0.65], [8, 20], 1), obstacles, refSmall);
      } else LBL.straight.el.classList.add('gf-off');
    }
  }

  function layoutGalaxy(obstacles) {
    const g = sc.galaxy;
    const sun = scr(g.points.sun(tmpV));
    const refSun = tmpV.clone();
    const c = scr(g.points.centre(tmpW));
    const refC = tmpW.clone();
    const rMark = pxSize(refSun, 2.2);
    obstacles.push({ x: sun.x, y: sun.y, r: rMark }, { x: c.x, y: c.y, r: 8 });
    if (s.pulls) obstacles.push(...along(sun, c, 4, 10));
    const len = Math.hypot(sun.x - c.x, sun.y - c.y) || 1;
    const ux = (sun.x - c.x) / len;
    const uy = (sun.y - c.y) / len;
    if (LBL.sun) placeLabel('sun', around(sun, ux, uy, sizeOf(LBL.sun), rMark + 4), obstacles, refSun);
    if (LBL.centre) placeLabel('centre', around(c, -ux, -uy, sizeOf(LBL.centre), 10, [0, 50, -50, 100, -100, 150, -150]), obstacles, refC);
    if (LBL.pull) {
      if (s.pulls) {
        const mid = scr(g.points.arrowMid(tmpV));
        placeLabel('pull', beside(mid, { x: mid.x - ux, y: mid.y - uy }, sizeOf(LBL.pull), [0], [8, 22], LBL.pull.side), obstacles, refSun);
      } else LBL.pull.el.classList.add('gf-off');
    }
    if (LBL.dist) placeLabel('dist', beside(c, sun, sizeOf(LBL.dist), [0.5, 0.35, 0.65], [8], -(LBL.pull?.side ?? 1)), obstacles, refC);
  }

  function layoutApples(obstacles) {
    const a = sc.apples;
    const left = scr(a.points.left(tmpV));
    const right = scr(a.points.right(tmpV));
    const rA = pxSize(tmpV, FACTS.apple.radius);
    obstacles.push({ x: left.x, y: left.y, r: rA }, { x: right.x, y: right.y, r: rA });
    if (LBL.dist) {
      const m = scr(a.points.dimMid(tmpV));
      const L = sizeOf(LBL.dist);
      placeLabel(
        'dist',
        [
          { x: m.x, y: m.y + L.h / 2 + 7 },
          { x: m.x, y: m.y - L.h / 2 - 7 },
        ],
        obstacles,
        tmpV.clone(),
      );
    }
    if (LBL.pull) {
      if (s.pulls) {
        const m = scr(a.points.between(tmpV));
        const L = sizeOf(LBL.pull);
        placeLabel(
          'pull',
          [
            { x: m.x, y: m.y - rA - L.h / 2 - 2 },
            { x: m.x, y: m.y - rA - L.h / 2 - 22 },
          ],
          obstacles,
          tmpV.clone(),
        );
      } else LBL.pull.el.classList.add('gf-off');
    }
  }
  stage.onBeforeRender(() => {
    hideBehindGlobe();
    layoutLabels();
  });

  // in the turned view, the pulls of people behind the globe are not drawn over it
  const rayDir = new THREE.Vector3();
  function hideBehindGlobe() {
    if (s.stop !== 'earth' || !s.pulls) return;
    const g = sc.earth;
    const cam = camera.position;
    for (const pid of g.ids) {
      const p = g.points.middle(pid, tmpV);
      rayDir.subVectors(p, cam);
      const L = rayDir.length();
      rayDir.divideScalar(L);
      const b = cam.dot(rayDir);
      const disc = b * b - (cam.lengthSq() - EARTH_R * EARTH_R);
      const hidden = disc > 0 && -b - Math.sqrt(disc) > 0 && -b - Math.sqrt(disc) < L - 0.5;
      g.people[pid].arrow.root.visible = !hidden;
      g.people[pid].line.mesh.visible = !hidden;
    }
  }

  // ── touching the 3D: drag yourself round the Earth, drag the apple ──────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function rayAt(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray;
  }
  /** What a finger at canvas point p takes: 'you' (Earth stop), 'apple' (apples stop) or null. */
  function pick(p, reach = 30) {
    if (s.stop === 'earth') {
      const g = sc.earth;
      const m = scr(g.points.middle('you', tmpV));
      const hd = scr(g.points.head('you', tmpV));
      if (Math.hypot(m.x - p.x, m.y - p.y) < reach || Math.hypot(hd.x - p.x, hd.y - p.y) < reach * 0.8) return 'you';
      rayAt(p);
      return raycaster.intersectObject(g.people.you.person.hit, false).length ? 'you' : null;
    }
    if (s.stop === 'apples') {
      const m = scr(sc.apples.points.right(tmpV));
      if (Math.hypot(m.x - p.x, m.y - p.y) < reach + pxSize(tmpV, FACTS.apple.radius)) return 'apple';
      rayAt(p);
      return raycaster.intersectObject(sc.apples.hit, false).length ? 'apple' : null;
    }
    return null;
  }
  const dragPlane = new THREE.Plane();
  const hitP = new THREE.Vector3();
  /** The rim angle under canvas point p (the plane of the people's circle), or null. */
  function rimAngleAt(p) {
    dragPlane.set(new THREE.Vector3(0, 0, 1), 0);
    if (!rayAt(p).intersectPlane(dragPlane, hitP)) return null;
    sc.earth.root.worldToLocal(hitP);
    return rimAngleOf(hitP.x, hitP.y);
  }
  /** The apple's distance from the left one under canvas point p (the plane through the apples' centres). */
  function gapAt(p) {
    dragPlane.set(new THREE.Vector3(0, 1, 0), -FACTS.apple.radius * 0.86);
    if (!rayAt(p).intersectPlane(dragPlane, hitP)) return null;
    sc.apples.root.worldToLocal(hitP);
    return hitP.x - sc.apples.left.position.x;
  }

  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      root.focus({ preventScroll: true });
      coach?.interrupt();
      if (s.drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const p = canvasPoint(e);
      const what = pick(p, e.pointerType === 'mouse' ? 22 : 34);
      if (!what) return; // the camera controls take it
      e.stopPropagation(); // a touch on you or the apple is not a camera move
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const start = what === 'you' ? rimAngleAt(p) : gapAt(p);
      s.drag = { id: e.pointerId, what, x: e.clientX, y: e.clientY, last: start, moved: false };
      try {
        ui.canvasHost.setPointerCapture(e.pointerId);
      } catch {} // the pointer is already gone: nothing to follow
      ui.canvasHost.style.cursor = 'grabbing';
      emit('dragstart', snapshot());
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const d = s.drag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
    d.moved = true;
    const p = canvasPoint(e);
    if (d.what === 'you') {
      const a = rimAngleAt(p);
      if (a == null) return;
      if (d.last != null) setAngle(s.angle + (unwrap(d.last, a) - d.last));
      d.last = a;
      coach?.objectUsed();
    } else {
      const g = gapAt(p);
      if (g == null) return;
      if (d.last != null) setGap(s.gap + (g - d.last));
      d.last = g;
    }
  });
  function endDrag(e) {
    const d = s.drag;
    if (!d || e.pointerId !== d.id) return;
    s.drag = null;
    ui.canvasHost.style.cursor = '';
    if (d.moved && d.what === 'you' && !dropNudged) {
      // the next thing to try: drop the apples (the button glows twice)
      dropNudged = true;
      el.act.classList.add('gf-nudge');
    }
    emit('dragend', snapshot());
    emitChange();
  }
  let dropNudged = false;
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (s.drag || e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(p, 22) ? (s.locked ? 'not-allowed' : 'grab') : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
    stage.invalidate();
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
    stage.invalidate();
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  const textOpt =
    (keys, vars = {}) =>
    (j) =>
      `<span class="gf-opt">${t(keys[j], vars[keys[j]])}</span>`;
  const arrowSvg = (deg) =>
    `<svg class="gf-dir" viewBox="-14 -14 28 28" role="img" aria-label="${t('dir_aria')} ${N(Math.round(deg))}°"><g transform="rotate(${-deg})"><path d="M-10 0H3"/><path class="fill" d="M1.5-6L11 0 1.5 6z"/></g></svg>`;
  // places for the "which way" question: all four choices clearly apart, and not on top of the other people
  const DOWN_PLACES = fairQuestionAngles(45).filter((a) => [PEOPLE.north, PEOPLE.south, PEOPLE.far].every((b) => angleBetween(a, b) > 22));

  /** The scene for a question: a stop, freshly set up, with or without the pulls, and only these labels. */
  function setupQuestion({ stop, pulls = true, labels = null, angle, gap, playing = true }) {
    cancelFree();
    cancelDrop();
    s.dropShown = false;
    s.pulls = pulls;
    s.labels = labels;
    if (angle != null) s.angle = wrap360(angle);
    if (gap != null) s.gap = gap;
    s.playing = playing;
    tweener.cancel('gap');
    if (stop !== s.stop) setStop(stop);
    else setLabels();
    if (s.view !== 'front' || s.userMovedCamera) setView('front', { animate: false });
    drawScene();
    refresh();
  }

  let kinds = [];
  let question = null;
  let lastPick = -1;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        s.before = { stop: s.stop, angle: s.angle, gap: s.gap, playing: s.playing };
        s.mode = 'quiz';
        s.locked = true;
        s.drag = null;
        cancelFree();
        cancelDrop();
        hideHint();
        kinds = shuffle(['down', 'orbit', 'name', 'pairs', 'range']);
        syncUI();
        refresh();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.pulls = true;
        s.labels = null;
        tweener.cancel('gap');
        cancelFree();
        cancelDrop();
        const b = s.before ?? { stop: 'earth', angle: PEOPLE.you, gap: GAP.start, playing: o.play !== false };
        s.angle = b.angle;
        s.gap = b.gap;
        s.playing = b.playing;
        setStop(b.stop, { animate: false });
        syncUI();
        refresh();
      },
      prepare(i, _alive, say) {
        const kind = kinds[i % kinds.length];
        lastPick = -1;
        if (kind === 'down') {
          // which way is the pull (or the fall) for you, standing somewhere on the edge? Arrows as answers.
          const variant = pickOne(['pull', 'apple']);
          const angle = pickOne(DOWN_PLACES);
          setupQuestion({ stop: 'earth', pulls: false, labels: ['you'], angle });
          const d = directionChoices(angle);
          const keys = shuffle(['inward', 'outward', 'tangent', 'screenDown']);
          say(t(variant === 'pull' ? 'q_down_pull' : 'q_down_apple'));
          question = { kind, variant, keys };
          return {
            choices: [0, 1, 2, 3],
            expected: keys.indexOf('inward'),
            tolerance: 0.5,
            label: (j) => arrowSvg(d[keys[j]]),
            meta: { kind, variant, angle },
          };
        }
        if (kind === 'orbit') {
          // what keeps it going round (the Moon or the Earth), or: where would the Moon go without the pull?
          const variant = pickOne(['why', 'why', 'nopull']);
          const stop = variant === 'nopull' ? 'moon' : pickOne(['moon', 'sun']);
          setupQuestion({ stop, pulls: false, labels: ['small', 'big'] });
          const keys =
            variant === 'nopull'
              ? shuffle(['np_straight', 'np_out', 'np_round', 'np_fall'])
              : stop === 'moon'
                ? shuffle(['o_earth_g', 'o_moon_own', 'o_none', 'o_earth_mag'])
                : shuffle(['o_sun_g', 'o_earth_own', 'o_none', 'o_sun_mag']);
          const right = variant === 'nopull' ? 'np_straight' : stop === 'moon' ? 'o_earth_g' : 'o_sun_g';
          say(t(variant === 'nopull' ? 'q_nopull' : `q_orbit_${stop}`));
          question = { kind, variant, stop, keys };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf(right), tolerance: 0.5, label: textOpt(keys), meta: { kind, variant, stop } };
        }
        if (kind === 'name') {
          // মহাকর্ষ or মাধ্যাকর্ষণ? Or: why do we feel our weight?
          const variant = pickOne(['name', 'weight']);
          if (variant === 'name') setupQuestion({ stop: 'sun', pulls: true, labels: ['small', 'big', 'pull'] });
          else setupQuestion({ stop: 'earth', pulls: false, labels: ['you'], angle: PEOPLE.you });
          const keys =
            variant === 'name'
              ? shuffle(['n_earth_apple', 'n_sun_earth', 'n_two_apples', 'n_magnet'])
              : shuffle(['w_pull', 'w_air', 'w_spin', 'w_sun']);
          const right = variant === 'name' ? 'n_earth_apple' : 'w_pull';
          say(t(variant === 'name' ? 'q_name' : 'q_weight'));
          question = { kind, variant, keys };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf(right), tolerance: 0.5, label: textOpt(keys), meta: { kind, variant } };
        }
        if (kind === 'pairs') {
          // do two apples attract each other? (the arrows hidden until the answer)
          setupQuestion({ stop: 'apples', pulls: false, labels: ['dist'], gap: GAP.start });
          const keys = shuffle(['p_yes_weak', 'p_no_big', 'p_no_earth', 'p_yes_move']);
          say(t('q_pairs'));
          question = { kind, keys };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf('p_yes_weak'), tolerance: 0.5, label: textOpt(keys), meta: { kind } };
        }
        // the range: infinite (the galaxy), or what happens to the pull at twice the distance (the apples)
        const variant = pickOne(['range', 'double']);
        if (variant === 'range') {
          setupQuestion({ stop: 'galaxy', pulls: true, labels: ['sun', 'centre', 'dist', 'pull'] });
          const keys = shuffle(['range_inf', 'r_15', 'r_18', 'r_air']);
          say(t('q_range'));
          question = { kind, variant, keys };
          const label = (j) => {
            const k = keys[j];
            const txt = k === 'range_inf' ? t('range_inf') : k === 'r_air' ? t('r_air') : t('r_m', { p: sup(k === 'r_15' ? -15 : -18) });
            return `<span class="gf-opt">${txt}</span>`;
          };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf('range_inf'), tolerance: 0.5, label, meta: { kind, variant } };
        }
        setupQuestion({ stop: 'apples', pulls: true, labels: ['dist', 'pull'], gap: GAP.start });
        const keys = shuffle(['d_less', 'd_zero', 'd_same', 'd_more']);
        say(t('q_double'));
        question = { kind, variant, keys };
        return { choices: [0, 1, 2, 3], expected: keys.indexOf('d_less'), tolerance: 0.5, label: textOpt(keys), meta: { kind, variant } };
      },
      reveal(_q, correct) {
        const q = question;
        const picked = q.keys?.[lastPick];
        const mistake = (key, vars) => (correct || !key ? '' : ` ${t(key, vars)}`);
        if (q.kind === 'down') {
          // the arrows and the lines to the centre appear; for the apple question all the apples fall
          s.pulls = true;
          s.labels = null;
          setLabels();
          drawScene();
          if (q.variant === 'apple') {
            s.locked = false;
            drop({ silent: true });
            s.locked = true;
          }
          refresh();
          const mis = { screenDown: 'down_mis_screen', outward: 'down_mis_outward', tangent: 'down_mis_tangent' }[picked];
          return t('down_why') + mistake(mis);
        }
        if (q.kind === 'orbit') {
          s.pulls = true;
          s.labels = null;
          setLabels();
          if (q.variant === 'nopull') {
            startFree();
            const mis = { np_out: 'np_mis_out', np_round: 'np_mis_round', np_fall: 'np_mis_fall' }[picked];
            return t('nopull_why') + mistake(mis);
          }
          drawScene();
          refresh();
          const mis = {
            o_none: 'orbit_mis_none',
            o_moon_own: 'orbit_mis_own',
            o_earth_own: 'orbit_mis_own',
            o_earth_mag: 'orbit_mis_mag',
            o_sun_mag: 'orbit_mis_mag',
          }[picked];
          return t(`orbit_why_${q.stop}`) + mistake(mis);
        }
        if (q.kind === 'name') {
          if (q.variant === 'weight') {
            s.pulls = true;
            s.labels = null;
            setLabels();
            drawScene();
            refresh();
            return t('weight_why') + mistake(picked && picked !== 'w_pull' ? 'weight_mis' : null);
          }
          const mis = { n_sun_earth: 'name_mis_other', n_two_apples: 'name_mis_other', n_magnet: 'name_mis_magnet' }[picked];
          return t('name_why') + mistake(mis);
        }
        if (q.kind === 'pairs') {
          s.pulls = true;
          s.labels = null;
          setLabels();
          drawScene();
          refresh();
          return t('pairs_why', { f: sciHtml(scientific(applePull(s.gap))) });
        }
        if (q.variant === 'range') {
          const mis = { r_15: ['range_mis_strong', { p: sup(-15) }], r_18: ['range_mis_weak', { p: sup(-18) }], r_air: ['range_mis_air'] }[picked];
          return t('range_why') + (mis ? mistake(mis[0], mis[1]) : '');
        }
        // twice the distance: the right apple moves out to 40 cm and the arrows shrink to a quarter
        const g0 = s.gap;
        tweener.animate({
          key: 'gap',
          duration: 1.2,
          ease: ease.inOutCubic,
          onUpdate: (k) => {
            s.gap = g0 + g0 * k;
            drawScene();
            refresh();
          },
        });
        return t('double_why', { a: sciHtml(scientific(applePull(g0))), b: sciHtml(scientific(applePull(2 * g0))) });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on you, standing in Bangladesh ───────────────────────
  let coach = null;
  if (o.coach) {
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, note],
      object: {
        label: 'coach_drag',
        candidates: () => (s.stop === 'earth' ? [scr(sc.earth.points.middle('you', tmpV)), scr(sc.earth.points.head('you', tmpV))] : []),
        grabbable: (p) => pick(p) === 'you',
        // you walk a little way round and back (the panel keeps saying where you started)
        async demo(alive) {
          if (s.stop !== 'earth') return;
          const a0 = s.angle;
          s.demo = true;
          s.demoAngle = a0;
          for (const to of [a0 - 14, a0]) {
            if (!alive()) break;
            const from = s.angle;
            await tweener.animate({
              key: 'coach-walk',
              duration: 0.9,
              ease: ease.inOutCubic,
              onUpdate: (k) => setAngle(from + (to - from) * k),
            }).finished;
          }
          s.demo = false;
          if (alive()) setAngle(a0);
          refresh();
        },
        // a touch stops the walk where it is (the finger may be on you right there); the panel then says where you are
        cancel: () => {
          tweener.cancel('coach-walk');
          if (s.demo) {
            s.demo = false;
            refresh();
          }
        },
      },
    });
  }

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
    for (const b of ui.$$('[data-stop]')) {
      const on = b.dataset.stop === s.stop;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.stop) {
      if (s.locked) lockedNudge();
      else if (b.dataset.stop !== s.stop) setStop(b.dataset.stop);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      lastPick = Number(b.dataset.q);
      quiz.choose(lastPick);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'action':
        if (s.stop === 'earth') drop();
        else noPull();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // any touch or key stops the first-use pointer's little walk, so it never fights what the student does
  root.addEventListener('pointerdown', () => coach?.interrupt(), true);
  root.addEventListener('keydown', (e) => {
    coach?.interrupt();
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowright' || k === 'arrowup') stepBy(e.shiftKey ? 15 : 5);
    else if (k === 'arrowleft' || k === 'arrowdown') stepBy(e.shiftKey ? -15 : -5);
    else if ((k === ' ' && !target.closest('button')) || k === 'd') {
      if (s.stop === 'earth') drop();
      else noPull();
    } else if (k >= '1' && k <= '5') {
      if (s.locked) lockedNudge();
      else setStop(STOPS[Number(k) - 1]);
    } else if (k === 'p') {
      if (s.locked) return lockedNudge();
      s.playing = !s.playing;
      emitChange();
    } else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  controls.enableRotate = s.view === '3d';
  root.classList.toggle('gf-compact', stage.height < 300 || stage.width < 340);
  setStop(s.stop, { animate: false });
  syncUI();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start(1000);
  })();

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /**
     * Change any of: stop ('apples' | 'earth' | 'moon' | 'sun' | 'galaxy'), angle (where you stand on the Earth's
     * edge, degrees from the North Pole, clockwise in the front view: 66.5 is Bangladesh), gap (cm between the apples'
     * centres, 15…50), orbit (degrees on its circle for the Moon, the Earth round the Sun or the galaxy), playing,
     * drop (true: the apples fall), nopull (true or false: the Moon's or the Earth's pull gone or back), view;
     * animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.stop && p.stop !== s.stop) setStop(p.stop, { animate });
      if (p.view) await setView(p.view, { animate });
      if (p.playing != null) s.playing = Boolean(p.playing);
      if (p.angle != null && Number.isFinite(Number(p.angle))) {
        const to = Number(p.angle);
        if (animate && s.stop === 'earth') {
          const from = s.angle;
          const target = unwrap(from, to);
          await tweener.animate({ key: 'walk', duration: 0.8, ease: ease.inOutCubic, onUpdate: (k) => setAngle(from + (target - from) * k) })
            .finished;
        } else setAngle(to);
      }
      if (p.gap != null && Number.isFinite(Number(p.gap))) setGap(Number(p.gap));
      if (p.orbit != null && Number.isFinite(Number(p.orbit)) && s.stop in s.phase) {
        cancelFree();
        s.phase[s.stop] = Number(p.orbit);
      }
      if (p.drop) drop({ silent: true });
      if (p.nopull === true && orbitStop() && !s.free) startFree();
      if (p.nopull === false) pullBack();
      drawScene();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      hideHint();
      cancelFree();
      cancelDrop();
      s.angle = PEOPLE.you;
      s.gap = GAP.start;
      s.phase = { ...START_PHASE };
      s.playing = o.play !== false;
      s.pulls = true;
      s.labels = null;
      setStop(STOPS.includes(o.stop) ? o.stop : 'earth', { animate: false });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => sc[s.stop].root, // the stop's models and pull arrows: no labels, dashed lines, lights or hit boxes
  };
}
