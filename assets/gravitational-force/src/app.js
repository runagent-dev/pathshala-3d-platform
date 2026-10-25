// Gravitational force (মহাকর্ষ বল, book page 68, topic 3.2.1), student view. Five stops, from the smallest distance to
// the largest, show the same pull: two apples on a table (any two masses attract, very weakly), people standing all
// round the Earth (মাধ্যাকর্ষণ বল always points to the Earth's centre: that is "down", and why we feel our weight),
// the Moon round the Earth, the Earth round the Sun, and our Sun round the centre of the galaxy (its range is
// infinite). The student drags themself round the Earth and drops the apples, drags an apple further away, and takes
// the pull away from the Moon or the Earth to see it go on in a straight line. Then a short test (./questions.js).
// Built on the shared student kit (@shared/student/…); labels in ./labels.js, the camera in ./camera.js.
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
import { createGlobe, R as EARTH_R } from './globe.js';
import { createGalaxy, createOrbit } from './space.js';
import { createTable } from './table.js';
import { PULL } from './draw.js';
import { createCamera, framePoints } from './camera.js';
import { LABEL_SETS, createLabels, layoutApples, layoutEarth, layoutGalaxy, layoutOrbit } from './labels.js';
import { createQuestions } from './questions.js';
import {
  FACTS,
  GAP,
  PEOPLE,
  STOPS,
  appleWeight,
  applePull,
  clamp,
  earthPullTimesCrore,
  orbitPoint,
  placeAt,
  rimAngleOf,
  roundTo,
  scientific,
  stepAside,
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
const SLOW = 2; // the fall is shown this many times slower (the note says so)
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
  const cam = createCamera({ stage, controls, tweener, corner: ui.corner, note, root });
  const labels = createLabels({ stage, ui, annotations });

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
    free: null, // the pull is gone: { stop, phi0, t, end } (end: where the body left the picture)
    drop: null, // the apples are falling or lying on the ground: { t, landed }
    appleMoved: false, // the apple on the table has been moved (the panel then compares the pulls)
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
      flewOff: Boolean(s.free?.end),
      dropping: Boolean(s.drop && !s.drop.landed),
      dropped: Boolean(s.drop?.landed),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.stop, snap.angle, snap.gap, snap.nopull, snap.flewOff, snap.playing, snap.dropping, snap.view, snap.mode]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const el = {
    idea: ui.$('.gf-idea'),
    fact: ui.$('.gf-fact'),
    act: ui.$('[data-act="action"]'),
    actLabel: ui.$('[data-act="action"] span'),
  };
  function factHtml() {
    switch (s.stop) {
      case 'apples': {
        // the pull now; then how to move the apple (until it has been moved), or how much stronger the Earth pulls
        const pull = t('fact_apples', { d: Math.round(s.gap), f: sciHtml(scientific(applePull(s.gap))) });
        const more = s.appleMoved
          ? t('fact_apple_earth', { w: Math.round(appleWeight()), k: earthPullTimesCrore(s.gap).toLocaleString('en-IN') })
          : t('fact_drag_apple', { m: FACTS.apple.mass * 1000 });
        return `${pull}<br>${more}`;
      }
      case 'earth':
        if (s.drop?.landed) return t('fact_drop');
        return t('fact_earth', { place: t(`place_${placeAt(s.demo ? s.demoAngle : s.angle).key}`), d: '6,400' });
      case 'moon':
        return t('fact_moon', { a: FACTS.moon.lakh, b: FACTS.moon.thousand, n: FACTS.moon.days });
      case 'sun':
        return t('fact_sun', { d: FACTS.sun.croreKm, n: FACTS.sun.years });
      default:
        return t('fact_galaxy', { d: FACTS.galaxy.thousandLy, n: FACTS.galaxy.croreYears });
    }
  }
  function setNote() {
    const key = { apples: 'note_apples', earth: 'note_earth', galaxy: 'note_galaxy' }[s.stop] ?? 'note_space';
    note.textContent = t(key, { n: SLOW });
  }
  function refresh() {
    el.idea.innerHTML = t(s.free ? `idea_nopull_${s.free.stop}` : `idea_${s.stop}`);
    el.fact.innerHTML = factHtml();
    const act = s.stop === 'earth' ? 'act_drop' : orbitStop() ? (s.free ? 'act_pull_back' : 'act_nopull') : null;
    el.act.hidden = !act;
    if (act) el.actLabel.textContent = t(act);
    el.act.classList.toggle('primary', act !== 'act_pull_back');
    setNote();
    if (s.stop === 'apples') labels.text('dist', t('label_dist_apples', { d: Math.round(s.gap) }));
    stage.invalidate();
  }

  // ── the scene of the current stop ───────────────────────────────────────────
  const v3 = new THREE.Vector3();
  function drawScene() {
    const id = s.stop;
    if (id === 'apples') sc.apples.setGap(s.gap);
    else if (id === 'earth') {
      sc.earth.place('you', s.angle);
      // the others step aside when you come near: you never stand on top of each other
      for (const pid of ['north', 'south', 'far']) {
        const a = stepAside(PEOPLE[pid], s.angle);
        if (a !== sc.earth.people[pid].theta) sc.earth.place(pid, a);
      }
    } else if (id === 'galaxy') sc.galaxy.setAngle(s.phase.galaxy);
    else if (s.free) {
      const f = s.free;
      const o3 = sc[id];
      const start = orbitPoint(o3.S.r, f.phi0);
      const q = f.end ?? straightPath(o3.S.r, f.phi0, FACTS[id].period, f.t);
      o3.setFree(q.x, q.z);
      o3.small.visible = !f.end;
      o3.setTrail(start, q, Boolean(f.end));
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
      sc[id].setLine(!gone); // with the pull gone nothing joins the two bodies, not even a drawn line
      if (!gone) sc[id].setTrail(null);
    }
  }

  stage.addTicker((dt) => {
    let busy = false;
    const id = s.stop;
    if (s.free) busy = tickFree(dt);
    else if (s.playing && id in s.phase) {
      s.phase[id] += turned(dt, FACTS[id].period);
      drawScene();
      busy = true;
    }
    if (s.drop && !s.drop.landed) {
      tickDrop(dt);
      busy = true;
    }
    return busy;
  });

  // ── the apples fall (the Earth stop) and stay on the ground till something changes ─
  function drop({ silent = false } = {}) {
    if (s.locked) return lockedNudge();
    if (s.stop !== 'earth') return;
    if (s.drop && !s.drop.landed && s.drop.t < FALL_S * SLOW * 0.5) return; // a double tap does not start the fall again
    cancelDrop();
    s.drop = { t: 0, landed: false };
    el.act.classList.remove('gf-nudge');
    if (!silent) audio.pop();
    emit('drop', { angle: roundTo(wrap360(s.angle), 0.1) });
    emitChange();
    refresh();
  }
  function tickDrop(dt) {
    const d = s.drop;
    d.t += dt;
    const k = Math.min(1, (d.t / (FALL_S * SLOW)) ** 2); // falling from rest: the distance grows as the time squared
    for (const pid of sc.earth.ids) sc.earth.setFall(pid, k);
    if (k >= 1) {
      d.landed = true;
      audio.contact();
      refresh();
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
  // The camera goes back so the circle is small and the straight path has room; the body flies along its tangent
  // until it reaches the edge of the picture (or the corner buttons or the note), where the dashed path ends in an
  // arrowhead: "it goes on in a straight line". It stays gone until the student gives the pull back.
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
    s.free = { stop: s.stop, phi0: s.phase[s.stop], t: 0, end: null, boxes: [] };
    audio.pop();
    refit(0.7);
    s.free.boxes = cam.boxes(); // where the corner buttons and the note are in the wide view
    emit('nopull', { on: true });
    drawScene();
    refresh();
    emitChange();
  }
  const EDGE = 20; // px: the body is "out of the picture" this close to the edge
  function tickFree(dt) {
    const f = s.free;
    if (f.end) return false;
    f.t += dt;
    drawScene();
    if (f.t > 0.8) {
      const p = labels.tools.scr(sc[s.stop].points.small(v3));
      const out = p.x < EDGE || p.x > stage.width - EDGE || p.y < EDGE || p.y > stage.height - EDGE;
      if (out || cam.underBoxes(p.x, p.y, f.boxes) || f.t > 15) {
        f.end = straightPath(sc[s.stop].S.r, f.phi0, FACTS[s.stop].period, f.t);
        drawScene();
        refresh();
        emitChange();
        return false;
      }
    }
    return true;
  }
  /** The pull comes back: the body is back where it left its circle and goes round again; the camera comes back. */
  function pullBack() {
    if (!s.free) return;
    const id = s.free.stop;
    s.free = null;
    const b = sc[id].small;
    b.visible = true;
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
    refit(0.7);
    emit('nopull', { on: false });
    drawScene();
    refresh();
    emitChange();
  }
  function cancelFree() {
    if (!s.free) return;
    s.free = null;
    tweener.cancel('body-pop');
    for (const id of ['moon', 'sun']) {
      sc[id].small.visible = true;
      sc[id].small.scale.setScalar(1);
      sc[id].setTrail(null);
    }
    refit(0);
  }

  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
  }

  // ── moving you round the Earth, and the apple along the table ───────────────
  function setAngle(deg) {
    s.angle = wrap360(deg);
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
    refit(0);
    setLabels();
    drawScene();
    refresh();
    syncUI();
    hideHint();
    emit('stop', { stop: id });
    emitChange();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const poseFor = (view = s.view) => cam.pose(VIEWS[s.stop][view], framePoints(s.stop, sc, { wide: Boolean(s.free) && orbitStop() }));
  /** Frame the stop again (unless the student turned the camera themself); the labels learn where the note went. */
  function refit(duration = 0.8) {
    if (s.userMovedCamera) return Promise.resolve(false);
    const pose = poseFor();
    labels.cacheBoxes();
    return cam.flyTo(pose, duration);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return refit(animate ? 0.8 : 0);
  }
  /** From the corner buttons and the keys: not during the test (the arrows of an answer are drawn for the front view). */
  function viewByStudent(view) {
    if (s.locked) return lockedNudge();
    setView(view);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    root.classList.toggle('gf-compact', stage.height < 300 || stage.width < 340);
    refit(0);
    labels.remeasure(); // the label font may change size
    if (s.free) s.free.boxes = cam.boxes();
  });

  // ── labels on the 3D (./labels.js places them every frame) ──────────────────
  function labelText(id) {
    const st = s.stop;
    if (id === 'pull') return t(st === 'earth' ? 'label_pull_earth' : 'label_pull');
    if (id === 'you') return t('label_you');
    if (id === 'south') return t('label_south');
    if (id === 'centre') return t(st === 'earth' ? 'label_centre' : 'label_galaxy_centre');
    if (id === 'small') return t(st === 'moon' ? 'label_moon' : 'label_earth');
    if (id === 'big') return t(st === 'moon' ? 'label_earth' : 'label_sun');
    if (id === 'sun') return t('label_our_sun');
    if (id === 'straight') return t('label_straight');
    // dist
    if (st === 'apples') return t('label_dist_apples', { d: Math.round(s.gap) });
    if (st === 'moon') return t('label_dist_moon', { a: FACTS.moon.lakh, b: FACTS.moon.thousand });
    if (st === 'sun') return t('label_dist_sun', { d: FACTS.sun.croreKm });
    return t('label_dist_galaxy', { d: FACTS.galaxy.thousandLy });
  }
  function setLabels() {
    const specs = {};
    for (const id of LABEL_SETS[s.stop]) {
      if (s.labels ? !s.labels.includes(id) : id === 'south') continue; // the South Pole's name only for its question
      const callout = id === 'pull' || id === 'dist' || id === 'straight';
      const color = id === 'pull' ? PULL : id === 'straight' ? '#1d2733' : id === 'dist' ? '#4b5766' : undefined;
      specs[id] = { text: labelText(id), kind: callout ? 'callout' : 'part', color };
    }
    labels.set(specs);
  }
  const LAYOUTS = { earth: layoutEarth, apples: layoutApples, galaxy: layoutGalaxy, moon: layoutOrbit, sun: layoutOrbit };
  stage.onBeforeRender(() => {
    hideBehindGlobe();
    if (!labels.has()) return;
    const { list, coach: coachShown } = labels.baseObstacles();
    LAYOUTS[s.stop](labels, { sc, s, coach: Boolean(coachShown) }, list);
  });

  // in the turned view, the pulls of people behind the globe are not drawn over it
  const rayDir = new THREE.Vector3();
  function hideBehindGlobe() {
    if (s.stop !== 'earth' || !s.pulls) return;
    const g = sc.earth;
    const c = camera.position;
    for (const pid of g.ids) {
      const p = g.points.middle(pid, v3);
      rayDir.subVectors(p, c);
      const L = rayDir.length();
      rayDir.divideScalar(L);
      const b = c.dot(rayDir);
      const disc = b * b - (c.lengthSq() - EARTH_R * EARTH_R);
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
    const scr = labels.tools.scr;
    if (s.stop === 'earth') {
      const g = sc.earth;
      const m = scr(g.points.middle('you', v3));
      const hd = scr(g.points.head('you', v3));
      if (Math.hypot(m.x - p.x, m.y - p.y) < reach || Math.hypot(hd.x - p.x, hd.y - p.y) < reach * 0.8) return 'you';
      rayAt(p);
      return raycaster.intersectObject(g.people.you.person.hit, false).length ? 'you' : null;
    }
    if (s.stop === 'apples') {
      const m = scr(sc.apples.points.right(v3));
      if (Math.hypot(m.x - p.x, m.y - p.y) < reach + labels.tools.pxSize(v3, FACTS.apple.radius)) return 'apple';
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
  let dropNudged = false;
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
  /** The scene for a question: a stop, freshly set up, with or without the pulls, and only these labels. */
  function setupQuestion({ stop, pulls = true, labels: only = null, angle, gap }) {
    cancelFree();
    cancelDrop();
    s.pulls = pulls;
    s.labels = only;
    if (angle != null) s.angle = wrap360(angle);
    if (gap != null) s.gap = gap;
    s.playing = true;
    if (stop !== s.stop) setStop(stop);
    else setLabels();
    if (s.view !== 'front' || s.userMovedCamera) setView('front', { animate: false });
    drawScene();
    refresh();
  }
  const questions = createQuestions({
    t,
    sup,
    sciHtml,
    setup: setupQuestion,
    showPulls() {
      s.pulls = true;
      s.labels = null;
      setLabels();
      drawScene();
      refresh();
    },
    drop() {
      s.locked = false;
      drop({ silent: true });
      s.locked = true;
    },
    startFree,
  });
  let kinds = [];
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
        syncUI();
        refresh();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.pulls = true;
        s.labels = null;
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
        if (i === 0) kinds = questions.order(); // a new order every time the test starts
        lastPick = -1;
        return questions.prepare(kinds[i % kinds.length], say);
      },
      reveal: (_q, correct) => questions.reveal(correct, lastPick),
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
        candidates: () => {
          if (s.stop !== 'earth') return [];
          const scr = labels.tools.scr;
          return [scr(sc.earth.points.middle('you', v3)), scr(sc.earth.points.head('you', v3))];
        },
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
    if (b.dataset.view) viewByStudent(b.dataset.view);
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
    } else if (k === 'f') viewByStudent('front');
    else if (k === 'v') viewByStudent('3d');
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
     * centres, 20…40), orbit (degrees on its circle for the Moon, the Earth round the Sun or the galaxy), playing,
     * drop (true: the apples fall), nopull (true: the Moon's or the Earth's pull is taken away; false: it comes back),
     * view; animate: false jumps.
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
      s.appleMoved = false;
      setStop(STOPS.includes(o.stop) ? o.stop : 'earth', { animate: false });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => sc[s.stop].root, // the stop's models and pull arrows: no labels, dashed lines, lights or hit boxes
  };
}
