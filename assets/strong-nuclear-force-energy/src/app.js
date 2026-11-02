// Strong nuclear force: where nuclear energy comes from (book page 69, topic 3.2.4), student view. Two scenes of
// nuclei held by the strong nuclear force: a big nucleus splitting (ভাঙা) and two small nuclei joining (জোড়া
// দেওয়া), each giving off energy. The panel names the four fundamental forces in order and how two of them became
// one (ইলেকট্রো উইক). Then a short test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { COLORS, createBackdrop, createNucleonMaterials } from './models.js';
import { buildJoinScene, buildSplitScene } from './scenes.js';
import { createTags } from './tags.js';
import { R_NUCLEON, clamp, roundTo } from './reading.js';

export const DEFAULTS = {
  scene: 'split', // 'split' | 'join'
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const SCENES = ['split', 'join'];
const VIEW_DIRS = {
  front: new THREE.Vector3(0, 0.13, 1).normalize(),
  '3d': new THREE.Vector3(0.55, 0.42, 0.72).normalize(),
};
const WORLD_UP = new THREE.Vector3(0, 1, 0);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** 10 to a power, as HTML with the power raised: pow('−15') → 10⁻¹⁵ in the language's digits. */
  const pow = (e) => `${N('10')}<sup>${N(e)}</sup>`;
  const RANGE_HTML = `${pow('−15')} ${t('unit_m')}`;

  root.classList.add('pvc', 'snf');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: `
          <div class="snf-scenes" role="radiogroup" aria-label="${t('scenes')}">${SCENES.map(
            (k) => `<button role="radio" data-scene="${k}">${t(`scene_${k}`)}</button>`,
          ).join('')}</div>
          <div class="snf-read">
            <div class="snf-eq"></div>
            <button class="pvc-btn snf-again" data-act="again" aria-label="${t('act_again_long')}">${ICONS.reset}<span>${t('act_again')}</span></button>
          </div>
          <p class="snf-say" aria-live="polite"></p>
          <p class="snf-key"><span class="snf-legend"><span><i class="dot p">+</i>${t('legend_proton')}</span><span><i class="dot n"></i>${t('legend_neutron')}</span></span><span class="snf-note"></span></p>
          <div class="snf-forces" role="img" aria-label="${t('forces_aria')}">
            <span class="snf-ft">${t('forces_title')}</span>
            <span class="snf-fl">
              <span class="grp gr"><span class="f grav">${t('f_grav')}</span><em>${t('k_grav')}</em></span>
              <span class="grp ew"><i class="lt">‹</i><span class="f weak">${t('f_weak')}</span><i class="lt">‹</i><span class="f em">${t('f_em')}</span><em>${t('f_ew')}</em></span>
              <span class="grp st"><i class="lt">‹</i><span class="f strong on">${t('f_strong')}<small>${RANGE_HTML}</small></span><em>${t('f_nuclear')}</em></span>
            </span>
          </div>`,
  });
  // the panel's small print: what the balls are, what is symbolic (and, while things move on their own, that time
  // is slowed down); nothing of it on the 3D view
  const noteEl = ui.$('.snf-note');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 0.5, far: 400, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 6;
  controls.maxDistance = 160;
  controls.enablePan = false;
  const M = createNucleonMaterials();
  const split = buildSplitScene(M);
  const join = buildJoinScene(M);
  const scenes = { split, join };
  for (const sc of Object.values(scenes)) scene.add(sc.root);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  const KEY_DIR = new THREE.Vector3(-14, 22, 30).normalize();
  key.position.copy(KEY_DIR).multiplyScalar(40);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(18, -6, 20);
  // a cool light from behind and above: a thin bright rim that lifts the balls off the dark backdrop
  const rim = new THREE.DirectionalLight(0xc9c2ff, 0.9);
  rim.position.set(6, 14, -22);
  scene.add(key, key.target, fill, rim, new THREE.AmbientLight(0xffffff, 0.25));
  // the setting: deep inside the atom (a transparent background keeps the models alone)
  const backdrop = o.bg === 'transparent' ? null : createBackdrop();
  if (backdrop) {
    scene.background = backdrop.texture;
    backdrop.fit(stage.width, stage.height);
    stage.onResize((w, h) => backdrop.fit(w, h));
  }
  if (o.shadow && o.bg !== 'transparent') {
    // the balls shade each other a little: the nucleus reads as a round cluster (only the balls cast and receive)
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 3;
    key.shadow.bias = -0.0015;
    key.shadow.normalBias = 0.02;
    for (const sc of [split.balls, join.balls]) {
      sc.protons.castShadow = sc.protons.receiveShadow = true;
      sc.neutrons.castShadow = sc.neutrons.receiveShadow = true;
    }
  }
  /** The shadow box: tight round where each scene's balls are (centre x, half size in fm). */
  const SHADOW_FIT = { split: [0, 11.2], join: [0, 7.2] };
  function fitShadow(name) {
    if (!key.castShadow) return;
    const [cx, r] = SHADOW_FIT[name];
    key.target.position.set(cx, 0, 0);
    key.position.copy(key.target.position).addScaledVector(KEY_DIR, 40);
    key.target.updateMatrixWorld();
    Object.assign(key.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 39 - r, far: 41 + r });
    key.shadow.camera.updateProjectionMatrix(); // three.js never does this for a directional light
    key.shadow.needsUpdate = true;
  }
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  // every ball turns to the viewer (a proton shows its "+")
  stage.onBeforeRender(() => scenes[s.scene].face(camera.quaternion));

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    scene: SCENES.includes(o.scene) ? o.scene : 'split',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    run: 0, // bumped whenever a pending animation must stop
    t: 0,
    playing: false,
    still: false, // the test shows the start without the incoming neutron
    prevScene: 'split',
  };

  // ── the state ───────────────────────────────────────────────────────────────
  function snapshot() {
    const sc = scenes[s.scene];
    return {
      scene: s.scene,
      view: s.view,
      mode: s.mode,
      energy: { t: roundTo(s.t, 0.01), duration: sc.end, playing: s.playing, phase: sc.state.phase },
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const k = `${snap.scene}|${snap.mode}|${snap.energy.phase}|${snap.energy.playing}`;
    if (k === lastEmitted) return;
    lastEmitted = k;
    emit('change', snap);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    eq: $('.snf-eq'),
    say: $('.snf-say'),
    again: $('[data-act="again"]'),
  };
  const plus = '<i>+</i>';
  const energyTerm = `<b class="c-energy">${t('eq_energy')}</b>`;
  const eqHtml = {
    split: `<span>${t('eq_big')} ${plus} ${t('eq_neutron')} <i>→</i></span> <span>${t('eq_two_small')}</span> <span>${plus} ${t('eq_neutrons', { n: 3 })} ${plus} ${energyTerm}</span>`,
    join: `<span>${t('eq_two_small')} <i>→</i></span> <span>${t('eq_new')}</span> <span>${plus} ${t('eq_neutron')} ${plus} ${energyTerm}</span>`,
  };
  const NOTES = { split: 'note_split', join: 'note_slow' };
  let sayKey = '';
  function sayLine() {
    if (s.scene === 'split') return s.t >= split.end ? 'say_split_done' : 'say_split_go';
    return s.t >= join.end ? 'say_join_done' : 'say_join_go';
  }
  function refresh() {
    for (const b of ui.$$('[data-scene]')) {
      const on = b.dataset.scene === s.scene;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    }
    if (el.eq.dataset.scene !== s.scene) {
      el.eq.innerHTML = eqHtml[s.scene];
      el.eq.dataset.scene = s.scene;
    }
    const k = sayLine();
    if (k !== sayKey) {
      sayKey = k;
      el.say.innerHTML = t(k, { p: RANGE_HTML });
    }
    // splitting and joining are always shown slowed down
    const nk = NOTES[s.scene];
    if (noteEl.dataset.k !== nk) {
      noteEl.dataset.k = nk;
      noteEl.textContent = t(nk);
    }
    stage.invalidate();
  }

  // ── split / join ────────────────────────────────────────────────────────────
  function seek(time) {
    const sc = scenes[s.scene];
    if (!sc) return;
    s.t = clamp(time, 0, sc.end);
    sc.render(s.t, { incoming: !s.still });
    refresh();
  }
  function play(from = 0) {
    s.still = false;
    s.playing = true;
    seek(from);
    emitChange();
  }
  stage.addTicker((dt) => {
    if (!s.playing) return false;
    const sc = scenes[s.scene];
    const before = sc.state.phase;
    seek(s.t + dt);
    if (sc.state.phase !== before && sc.state.phase === 'apart') audio.pop();
    if (sc.state.phase !== before && sc.state.phase === 'joining') audio.pop();
    if (s.t >= sc.end) {
      s.playing = false;
      emit('done', { scene: s.scene });
      refresh();
    }
    emitChange();
    return true;
  });

  // ── scenes ──────────────────────────────────────────────────────────────────
  function setScene(name, { animate = true, start = true } = {}) {
    const next = SCENES.includes(name) ? name : 'split';
    s.run++;
    s.playing = false;
    const changed = next !== s.scene;
    s.scene = next;
    for (const [k, sc] of Object.entries(scenes)) sc.root.visible = k === next;
    fitShadow(next);
    s.t = 0;
    seek(0);
    addTags();
    if (changed || !s.userMovedCamera) {
      s.userMovedCamera = false;
      flyTo(poseFor(next, s.view), animate && changed ? 0.7 : 0);
    }
    if (start) play(0);
    refresh();
    emit('scene', { scene: next });
    emitChange();
  }

  function again() {
    if (s.locked) return lockedNudge();
    play(0);
  }

  // ── labels on the scene ─────────────────────────────────────────────────────
  const tags = createTags({
    stage,
    layer: ui.annoLayer,
    avoid: () => [ui.corner, ui.hint.classList.contains('show') ? ui.hint : null],
    keep: keepBoxes,
    soft: softBoxes,
  });
  const above = (dy = 8) => ({ x: 0, y: -dy, ax: 0.5, ay: 1 });
  const below = (dy = 8) => ({ x: 0, y: dy, ax: 0.5, ay: 0 });
  function addTags() {
    tags.clear();
    const sc = scenes[s.scene];
    const P = sc.points;
    // a nucleus's name goes above it (its point is the top of the nucleus), never over it
    const nameSpots = [
      ...[18, 34].flatMap((dy) => [above(dy), { x: 16, y: -dy, ax: 0, ay: 1 }, { x: -16, y: -dy, ax: 1, ay: 1 }]),
      { x: -22, y: 6, ax: 1, ay: 0.5 }, // beside the top, where the ball curves away
      { x: 22, y: 6, ax: 0, ay: 0.5 },
    ];
    if (s.scene === 'split') {
      // the slow neutron before it arrives; after the split, one of the three freed neutrons
      const around = [26, 38].flatMap((r) => [above(r), below(r), { x: r, y: 0, ax: 0, ay: 0.5 }, { x: -r, y: 0, ax: 1, ay: 0.5 }]);
      tags.add('neutron', {
        html: t('label_neutron'),
        priority: 2,
        point: () => (s.t < 1.5 ? (s.still ? null : P.neutron) : s.t >= 3.6 ? P.freed[0] : null),
        spots: around,
      });
      tags.add('big', {
        html: t('label_big'),
        priority: 3,
        point: () => (sc.state.phase === 'before' || sc.state.phase === 'wobble' ? P.big : null),
        spots: nameSpots,
      });
      // each piece named above it, else below it
      const pieceSpots = (j) => [
        ...nameSpots,
        ...[18, 34].map((dy) => ({ ...below(dy), pt: () => P.piecesLow[j] })),
        { x: j ? -8 : 8, y: 0, ax: j ? 1 : 0, ay: 0.5, pt: () => P.piecesInner[j] }, // beside it, toward the middle
      ];
      tags.add('small0', {
        html: t('label_small'),
        priority: 3,
        leadFrom: 'spot',
        point: () => (s.t >= 3.3 ? P.pieces[0] : null),
        spots: pieceSpots(0),
      });
      tags.add('small1', {
        html: t('label_small'),
        priority: 3,
        leadFrom: 'spot',
        point: () => (s.t >= 3.3 ? P.pieces[1] : null),
        spots: pieceSpots(1),
      });
    } else {
      tags.add('small0', { html: t('label_small'), priority: 3, point: () => (s.t < 1.6 ? P.small[0] : null), spots: nameSpots });
      tags.add('small1', { html: t('label_small'), priority: 3, point: () => (s.t < 1.6 ? P.small[1] : null), spots: nameSpots });
      tags.add('new', {
        html: t('label_new'),
        priority: 3,
        point: () => (s.t >= 1.95 ? P.joined : null),
        spots: [below(16), { x: 18, y: 14, ax: 0, ay: 0 }, { x: -18, y: 14, ax: 1, ay: 0 }],
      });
      tags.add('neutron', {
        html: t('label_neutron'),
        priority: 1,
        point: () => (s.t >= 2.3 ? P.neutron : null),
        spots: [28, 42].flatMap((r) => [
          { x: r, y: 0, ax: 0, ay: 0.5 },
          below(r),
          { x: -r, y: 0, ax: 1, ay: 0.5 },
          above(r),
          { x: r * 0.75, y: r * 0.75, ax: 0, ay: 0 },
          { x: -r * 0.75, y: r * 0.75, ax: 1, ay: 0 },
        ]),
      });
    }
    tags.add('energy', {
      html: t('label_energy'),
      color: COLORS.energyInk,
      cls: 'snf-energy',
      priority: 4, // the payoff: placed first
      point: () => (sc.burst.root.visible ? P.energy() : null),
      spots: [
        { x: 8, y: -6, ax: 0, ay: 1 },
        { x: -8, y: -6, ax: 1, ay: 1 },
        above(10),
        { x: 10, y: 0, ax: 0, ay: 0.5 },
        { x: -10, y: 0, ax: 1, ay: 0.5 },
        below(10),
        { x: 8, y: 6, ax: 0, ay: 0 },
      ],
    });
  }
  const toScreen = (p, out = { x: 0, y: 0 }) => {
    const q = tmpP.copy(p).project(camera);
    out.x = (q.x * 0.5 + 0.5) * stage.width;
    out.y = (-q.y * 0.5 + 0.5) * stage.height;
    return out;
  };
  const tmpP = new THREE.Vector3();
  const offR = new THREE.Vector3();
  /** Pixels of a length (fm) at a point, in the picture. */
  function pxAt(p, len) {
    const a = toScreen(p);
    offR.copy(p).addScaledVector(camera.up, len);
    const b = toScreen(offR);
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
  /** A box round a ball (a neutron on its way) that no label may cover. */
  function ballBox(p, k = 1) {
    const c = toScreen(p);
    const r = pxAt(p, R_NUCLEON) * k;
    return { l: c.x - r, t: c.y - r, r: c.x + r, b: c.y + r };
  }
  function keepBoxes() {
    if (s.scene === 'split') {
      const out = split.state.phase === 'before' && !s.still ? [ballBox(split.points.neutron)] : [];
      if (s.t >= 3.3) for (const p of split.points.freed) out.push(ballBox(p));
      return out;
    }
    return s.t > 1.6 ? [ballBox(join.points.neutron)] : [];
  }
  function softBoxes() {
    return [];
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  /** Where a box on the stage is, on the canvas (px), a little bigger; null when it is not shown. */
  function boxOf(elm, pad = 6) {
    if (!elm || getComputedStyle(elm).visibility === 'hidden') return null;
    const c = stage.canvas.getBoundingClientRect();
    const r = elm.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left - c.left - pad, right: r.right - c.left + pad, top: r.top - c.top - pad, bottom: r.bottom - c.top + pad };
  }
  /**
   * A camera pose that shows the whole scene (all of its animation, with room for its labels) as big as it can,
   * for this frame's shape: nothing under the buttons at the top right.
   */
  function poseFor(name, view) {
    const pts = scenes[name].frame();
    const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
    const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const { p } of pts) {
      lo.min(p);
      hi.max(p);
    }
    const target = lo.clone().add(hi).multiplyScalar(0.5);
    const back = VIEW_DIRS[view].clone();
    const right = new THREE.Vector3().crossVectors(WORLD_UP, back).normalize();
    const up = new THREE.Vector3().crossVectors(back, right);
    const local = pts.map(({ p, box }) => {
      const q = p.clone().sub(target);
      return { x: q.dot(right), y: q.dot(up), z: q.dot(back), box };
    });
    const W = stage.width;
    const H = Math.max(stage.height, 120);
    const boxes = [boxOf(ui.corner)].filter(Boolean);
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const th = tv * camera.aspect;
    const MX = 8;
    const clear = (px, py) => {
      if (px < MX || px > W - MX || py < MX || py > H - MX) return false;
      return !boxes.some((r) => px > r.left && px < r.right && py > r.top && py < r.bottom);
    };
    const fits = (d, sx, sy) =>
      local.every(({ x, y, z, box }) => {
        const depth = d - z;
        if (depth < 0.5) return false;
        const px = W / 2 + (x / (depth * th)) * (W / 2) + sx;
        const py = H / 2 - (y / (depth * tv)) * (H / 2) + sy;
        if (!box) return clear(px, py);
        return (
          clear(px + box[0], py + box[1]) && clear(px + box[2], py + box[1]) && clear(px + box[0], py + box[3]) && clear(px + box[2], py + box[3])
        );
      });
    // try the picture where it is, then moved a little (smallest moves first): a move is kept only if it lets
    // the scene be clearly bigger, so the picture stays centred when nothing is in the way
    const shifts = [];
    for (let sy = -40; sy <= 64; sy += 8) for (let sx = -32; sx <= 32; sx += 16) shifts.push([sx, sy]);
    shifts.sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - Math.abs(b[0]) - Math.abs(b[1]));
    let best = null;
    for (const [sx, sy] of shifts) {
      let a = 1;
      let b = 400;
      if (!fits(b, sx, sy)) continue;
      for (let i = 0; i < 26; i++) {
        const mid = (a + b) / 2;
        if (fits(mid, sx, sy)) b = mid;
        else a = mid;
      }
      if (!best || b < best.d * 0.985) best = { d: b, sx, sy };
    }
    const d = (best?.d ?? 40) * 1.02;
    // the shift moves the picture: the camera moves the other way by as much, at the distance of the scene
    const t2 = target.addScaledVector(up, ((best?.sy ?? 0) / (H / 2)) * d * tv).addScaledVector(right, (-(best?.sx ?? 0) / (W / 2)) * d * th);
    return { target: t2, position: t2.clone().addScaledVector(back, d) };
  }
  function flyTo({ position, target }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
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
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(poseFor(s.scene, s.view), animate ? 0.8 : 0);
  }
  // the view starts from the front; dragging turns it, and then the "front" button appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(poseFor(s.scene, s.view), 0);
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 3500 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const word = (k) => `<span class="snf-opt">${t(k)}</span>`;
  /** Four answers in words: keys[0] is right; the choices are indexes into a shuffled list. */
  function wordChoices(keys) {
    const list = shuffle([...keys]);
    return { list, choices: [0, 1, 2, 3], expected: list.indexOf(keys[0]), tolerance: 0.5, label: (j) => word(list[j]) };
  }
  let kinds = [];
  let question = null;
  let picked = -1;
  /** The big nucleus before it splits, standing still (no incoming neutron). */
  function quietScene() {
    s.still = true;
    setScene('split', { animate: false, start: false });
    s.still = true;
    seek(0);
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 4,
    hooks: {
      enter() {
        s.prevScene = s.scene;
        s.mode = 'quiz';
        s.locked = true;
        s.run++;
        hideHint();
        kinds = ['energy_big', 'energy_small', 'who', 'group'];
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.still = false;
        syncUI();
        setScene(s.prevScene, { animate: false, start: true });
      },
      async prepare(i, _alive, say) {
        const kind = kinds[i % kinds.length];
        s.locked = true;
        picked = -1;
        if (kind === 'who') {
          quietScene();
          say(t('q_who'));
          const c = wordChoices(['opt_who_all', 'opt_who_ep', 'opt_who_p', 'opt_who_n']);
          question = { kind, ...c };
          return { ...c, meta: { kind } };
        }
        if (kind === 'energy_big' || kind === 'energy_small') {
          const big = kind === 'energy_big';
          s.still = true;
          setScene(big ? 'split' : 'join', { animate: false, start: false });
          s.still = true;
          seek(0);
          say(t(big ? 'q_energy_big' : 'q_energy_small'));
          const c = wordChoices(
            big ? ['opt_split', 'opt_join_more', 'opt_burn', 'opt_none_energy'] : ['opt_join', 'opt_split_more', 'opt_burn', 'opt_none_energy'],
          );
          question = { kind, big, ...c };
          return { ...c, meta: { kind, nucleus: big ? 'big' : 'small' } };
        }
        // group
        quietScene();
        say(t('q_group'));
        const c = wordChoices(['opt_ew', 'opt_nuclear', 'opt_grav', 'opt_none']);
        question = { kind, ...c };
        return { ...c, meta: { kind } };
      },
      reveal(_q, correct) {
        const Q = question;
        const chose = picked >= 0 ? (Q.list ? Q.list[picked] : null) : null;
        const why = (k, vars) => t(k, { p: RANGE_HTML, ...vars });
        const extra = (text) => (correct || !text ? '' : ` ${text}`);
        if (Q.kind === 'who') {
          const m = { opt_who_ep: 'why_who_ep', opt_who_p: 'why_who_p', opt_who_n: 'why_who_n' }[chose];
          return why('why_who') + extra(m && why(m));
        }
        if (Q.kind === 'energy_big' || Q.kind === 'energy_small') {
          const my = s.run;
          setTimeout(() => my === s.run && quiz.active && play(0), 500);
          const m = {
            opt_join_more: 'why_energy_join_more',
            opt_split_more: 'why_energy_split_more',
            opt_burn: 'why_energy_burn',
            opt_none_energy: 'why_energy_none',
          }[chose];
          return why(Q.big ? 'why_energy_big' : 'why_energy_small') + extra(m && why(m));
        }
        const m = { opt_nuclear: 'why_group_nuclear', opt_grav: 'why_group_grav', opt_none: 'why_group_none' }[chose];
        return why('why_group') + extra(m && why(m));
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    controls.enableRotate = !s.locked;
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  function chooseScene(name) {
    if (s.locked) return lockedNudge();
    hideHint();
    if (name === s.scene) return again();
    setScene(name);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.scene) chooseScene(b.dataset.scene);
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'again':
        again();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if ((k === ' ' || k === 'Enter') && !target.closest('button')) {
      if (s.locked) return lockedNudge();
      again();
    } else if (k === '1' || k === '2') chooseScene(SCENES[Number(k) - 1]);
    else if (k.toLowerCase() === 'r') again();
    else if (k.toLowerCase() === 'f') setView('front');
    else if (k.toLowerCase() === 'v') setView('3d');
    else if (k === 'Escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  setScene(s.scene, { animate: false, start: true });
  syncUI();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
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
     * Change any of: scene ('split' | 'join'; it plays from the start unless play: false), t (s: show it at this
     * time), play (true plays from t, false stops), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.scene && (p.scene !== s.scene || p.t == null)) setScene(p.scene, { animate, start: p.play !== false && p.t == null });
      if (p.t != null) {
        s.playing = false;
        seek(Number(p.t) || 0);
        emitChange();
      }
      if (p.play === true && p.t != null) play(s.t);
      if (p.play === false) s.playing = false;
      if (!animate && s.playing) {
        s.playing = false;
        seek(scenes[s.scene].end);
      }
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.still = false;
      setScene('split', { animate: false, start: false });
      await setView('front', { animate: false });
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => scenes[s.scene].root,
  };
}
