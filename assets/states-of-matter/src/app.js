// Three states of matter (book page 150, topic 5.6): an animation, a pure function of time (shared/lib/timeline.js).
// One water molecule (and what it breaks into), then an ice cube in a pan on a gas stove melts into water, the water
// boils into steam, and a magnifier shows the molecules of each state the way চিত্র ৫.১৩ draws them: the solid's
// regular pattern only vibrating, the liquid's close molecules sliding past each other, the gas's few molecules far
// apart and flying freely. Last, the three side by side with curved arrows: heating one way, cooling the other.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTimeline, markAt } from '@shared/timeline.js';
import { ICONS } from '@shared/student/icons.js';
import { CAPTIONS, PROPS, STEPS, createI18n } from './i18n.js';
import { createKitchen } from './kitchen.js';
import { createLenses } from './lens.js';
import { arcArrow, bezierPoints, cycleLayout, fitToRegion, isTall, placeBeside, singleLayout } from './layout.js';
import { atoms, createSolid, lattice, sample, simulateGas, simulateLiquid } from './molecules.js';
import { ARROWS, DURATION, GAS_SWAP, T, cycleShare, flame, lensMode, lensTarget, litArrow, segment, smooth, temperature, tether } from './story.js';

export const DEFAULTS = { autoplay: true, loop: true, lang: 'bn', numerals: null, bg: 'light' };

const BIG = 3.3; // the opening molecule, times the size of one in the ice
const VIEW = new THREE.Vector3(-0.22, 0.44, 1).normalize(); // from a little left and above the stove

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'sm');
  root.dataset.theme = o.bg;
  root.lang = t.lang;
  root.innerHTML = `<div class="anim">
    <div class="pvc-stage"><div class="pvc-canvas"></div><div class="sm-layer"></div></div>
    <div class="anim-panel">
      <p class="anim-caption" aria-live="polite"></p>
      <div class="sm-props"></div>
      <div class="anim-controls">
        <button class="pvc-btn anim-play" data-act="play"></button>
        <div class="anim-steps" role="group" aria-label="${t('parts')}">${STEPS.map(
          (s, i) => `<button data-step="${i}">${t(`step_${s.key}`)}</button>`,
        ).join('')}</div>
      </div>
    </div></div>`;
  const $ = (s) => root.querySelector(s);

  // ── the kitchen (metres) ────────────────────────────────────────────────────
  const stage = createStage($('.pvc-canvas'), { fov: 30, near: 0.02, far: 20, environment: 'studio', exposure: 1.05 });
  const { camera, controls, scene } = stage;
  controls.enabled = false;
  const transparent = o.bg === 'transparent';
  const kitchen = createKitchen({ background: !transparent });
  scene.add(kitchen.scene);
  if (!transparent) scene.background = new THREE.Color('#141a52'); // the wall's top colour, above the wall
  scene.add(new THREE.HemisphereLight('#ffd9b8', '#3a2030', 1.1));
  const sun = new THREE.DirectionalLight('#fff0dc', 2.4);
  sun.position.set(-0.8, 1.4, 1.1);
  const rimLight = new THREE.DirectionalLight('#a9c4ff', 1.1);
  rimLight.position.set(0.9, 0.7, -1);
  scene.add(sun, rimLight);

  // ── the molecules, worked out once ──────────────────────────────────────────
  const sites = lattice();
  const centre = sites.reduce((best, s, i) => (Math.hypot(s.x, s.y) < Math.hypot(sites[best].x, sites[best].y) ? i : best), 0);
  const solidAt = createSolid(sites);
  const liquid = simulateLiquid({ sites, t0: T.melt, t1: DURATION, tether, temp: temperature });
  const gas = simulateGas({ t0: GAS_SWAP - 0.5, t1: DURATION });
  const solidNow = sites.map(() => ({ x: 0, y: 0, a: 0 }));
  const liquidNow = sites.map(() => ({ x: 0, y: 0, a: 0 }));
  const gasNow = Array.from({ length: gas.n }, () => ({ x: 0, y: 0, a: 0 }));
  const growth = new Float32Array(sites.length);
  const reach = Math.max(...sites.map((s) => Math.hypot(s.x, s.y)));

  // ── the lenses and their words ──────────────────────────────────────────────
  const layer = $('.sm-layer');
  const lenses = createLenses(stage, layer);
  const bigTag = lenses.word('sm-tag');
  const stateTags = [0, 1, 2].map(() => lenses.word('sm-tag sm-state'));
  const arrowTags = ARROWS.map((a) => lenses.word(`sm-arrow-tag ${a.kind}`));
  const atomTags = ['O', 'H', 'H'].map((s) => {
    const d = lenses.word('sm-atom');
    d.textContent = s;
    return d;
  });
  const notWater = lenses.word('sm-not');
  notWater.textContent = t('not_water');
  const heatTag = lenses.word('sm-heat');
  heatTag.innerHTML = `${ICONS.arrowR}<span>${t('flame')}</span>`;
  ['solid', 'liquid', 'gas'].forEach((k, i) => (stateTags[i].textContent = t(`state_${k}`)));
  ARROWS.forEach((a, i) => (arrowTags[i].textContent = t(a.kind)));
  // hidden words keep their size (visibility, not display), so they can be measured before they are placed
  const show = (d, on) => (d.style.visibility = on ? '' : 'hidden');
  /** Put a word at (x, y): ax/ay say which point of its box that is (0 left/top, 0.5 middle, 1 right/bottom). */
  function place(d, x, y, ax = 0.5, ay = 0.5, alpha = 1) {
    show(d, alpha > 0.02);
    d.style.opacity = String(alpha);
    d.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(${-ax * 100}%, ${-ay * 100}%)`;
  }

  // ── framing: the stove and pan fill the room the lens leaves ─────────────────
  let W = stage.width;
  let H = stage.height;
  let single = singleLayout(W, H);
  let cycle = cycleLayout(W, H);
  const focus = new THREE.Vector3();
  function frame() {
    W = stage.width;
    H = stage.height;
    single = singleLayout(W, H);
    cycle = cycleLayout(W, H);
    // tall frames: the pan and the top of the stove (the steam rises into the space above, by the lens);
    // wide frames: the pan with room above it for the steam
    const box = isTall(W, H)
      ? new THREE.Box3(new THREE.Vector3(-0.12, 0.05, -0.11), new THREE.Vector3(0.15, 0.17, 0.12))
      : new THREE.Box3(new THREE.Vector3(-0.13, 0.03, -0.11), new THREE.Vector3(0.17, 0.3, 0.12));
    box.getCenter(focus);
    const corners = [];
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
    camera.clearViewOffset();
    let d = 1;
    const place = () => {
      camera.position.copy(focus).addScaledVector(VIEW, d);
      camera.lookAt(focus);
      camera.updateMatrixWorld();
      return corners.map((c) => c.clone().project(camera));
    };
    for (let k = 0; k < 4; k++) d = fitToRegion(place(), d, W, H, single.region).d;
    // then shift the picture (a pure screen translation) so the box's projected middle is the region's middle
    const px = place().map((p) => ({ x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H }));
    const mid = (k) => (Math.min(...px.map((p) => p[k])) + Math.max(...px.map((p) => p[k]))) / 2;
    const r = single.region;
    camera.setViewOffset(W, H, mid('x') - (r.x0 + r.x1) / 2, mid('y') - (r.y0 + r.y1) / 2, W, H);
    // the stage updates its orbit controls every frame: aim them at the same point so they leave the camera alone
    controls.target.copy(focus);
    controls.update();
    camera.updateProjectionMatrix();
  }
  const pv = new THREE.Vector3();
  const toScreen = (p) => {
    pv.copy(p).project(camera);
    return { x: (pv.x * 0.5 + 0.5) * W, y: (-pv.y * 0.5 + 0.5) * H };
  };
  const mix = (a, b, u) => a + (b - a) * u;
  const mixLens = (a, b, u) => ({ cx: mix(a.cx, b.cx, u), cy: mix(a.cy, b.cy, u), r: mix(a.r, b.r, u) });

  // ── the animation: everything from t ─────────────────────────────────────────
  const listeners = new Map();
  const emit = (type, payload) => {
    for (const fn of listeners.get(type) || []) fn(payload);
  };
  let step = -1;
  let caption = -1;

  function drawOne(time, lens) {
    // one big molecule turning gently; it splits into O, H, H and comes back together
    const apart = smooth(segment(time, T.split, T.split + 1)) - smooth(segment(time, T.join, T.join + 0.9));
    const m = { x: 0, y: 0.04, a: Math.PI / 2 + 0.28 * Math.sin(time * 0.9) };
    const [O, H1, H2] = atoms(m, BIG);
    const out = (h) => {
      const dx = h.x - O.x;
      const dy = h.y - O.y;
      const k = (apart * 0.36) / Math.hypot(dx, dy);
      return { x: h.x + dx * k, y: h.y + dy * k, r: h.r, kind: 'h', z: O.r * lens.r * 0.5 };
    };
    const parts = [{ ...O, kind: 'o' }, out(H1), out(H2)];
    lenses.atoms(parts, lens);
    parts.forEach((a, i) => place(atomTags[i], lens.cx + a.x * lens.r, lens.cy - a.y * lens.r, 0.5, 0.5));
    root.querySelectorAll('.sm-atom').forEach((d) => d.classList.toggle('small', lens.r < 80));
    place(notWater, lens.cx, lens.cy + lens.r * 0.72, 0.5, 0.5, smooth((apart - 0.6) / 0.4));
  }

  function render(time) {
    if (stage.width !== W || stage.height !== H) frame();
    kitchen.pose(time);
    lenses.begin(W, H);
    for (const d of atomTags) show(d, false);
    show(notWater, false);

    const cyc = cycleShare(time);
    lenses.dim(0.62 * cyc);
    const big = mixLens(single.lens, cycle[2], cyc);
    const mode = lensMode(time);

    // what the big lens shows
    if (mode === 'one') drawOne(time, big);
    if (mode === 'solid') {
      const u = smooth(segment(time, T.zoomOut, T.solid - 0.4));
      solidAt(time, solidNow, u);
      for (let i = 0; i < sites.length; i++) {
        const d = Math.hypot(sites[i].x, sites[i].y) / reach;
        growth[i] = i === centre ? mix(BIG, 1, u) : smooth((u * 1.5 - d) / 0.45);
      }
      lenses.molecules(solidNow, big, 1, growth);
    }
    if (mode === 'liquid') {
      sample(liquid, time, liquidNow);
      lenses.molecules(liquidNow, big, 1 - smooth(segment(time, GAS_SWAP - 0.35, GAS_SWAP)));
    }
    if (mode === 'gas') {
      sample(gas, time, gasNow);
      lenses.molecules(gasNow, big, smooth(segment(time, GAS_SWAP, GAS_SWAP + 0.35)));
    }
    // the other two lenses of the last part grow in beside it
    if (cyc > 0) {
      const grow = (l) => ({ ...l, r: l.r * (0.6 + 0.4 * cyc) });
      const ice = grow(cycle[0]);
      const wat = grow(cycle[1]);
      lenses.molecules(solidAt(time, solidNow), ice, cyc);
      lenses.molecules(sample(liquid, time, liquidNow), wat, cyc);
      const lit = litArrow(time);
      const on = (i) => lit >= 0 && lit < ARROWS.length && (ARROWS[lit].from === i || ARROWS[lit].to === i);
      lenses.lens(0, ice, cyc, on(0));
      lenses.lens(1, wat, cyc, on(1));
      lenses.lens(2, big, 1, on(2));
      // the arrows: heating one way round each gap, cooling back the other way; the words keep off them
      const appear = smooth(segment(time, T.cycleIn - 1, T.cycleIn));
      const tall = isTall(W, H);
      const all = [ice, wat, big];
      const points = [];
      const boxes = [];
      ARROWS.forEach((a, i) => {
        const from = all[a.from];
        const to = all[a.to];
        const arc = arcArrow(from, to, tall ? -1 : 1, { spread: 0.42, bulge: 0.2, gap: Math.max(6, from.r * 0.12) });
        const strong = lit === i || lit >= ARROWS.length;
        const alpha = appear * (strong ? 1 : 0.55);
        const width = Math.max(4, Math.min(8, from.r * 0.08)) * (lit === i ? 1.3 : 1);
        lenses.arrow(i, arc, a.kind, alpha, width);
        points.push(...bezierPoints(arc));
        const tag = arrowTags[i];
        const w = tag.offsetWidth;
        const h = tag.offsetHeight;
        // beside the bend, outside it; if another arrow's word is there, further out or slid along the arrow
        const off = 8 + Math.abs(arc.normal.x) * (w / 2) + Math.abs(arc.normal.y) * (h / 2);
        const tx = arc.normal.y;
        const ty = -arc.normal.x;
        let box = null;
        for (const [o2, slide] of [
          [0, 0],
          [0, 0.6],
          [0, -0.6],
          [h + 4, 0],
          [0, 1.1],
          [0, -1.1],
        ]) {
          const k = off + o2;
          const sl = slide * (Math.abs(tx) * w + Math.abs(ty) * h);
          const x = Math.min(W - w / 2 - 4, Math.max(w / 2 + 4, arc.mid.x + arc.normal.x * k + tx * sl));
          const y = Math.min(H - h / 2 - 4, Math.max(h / 2 + 4, arc.mid.y + arc.normal.y * k + ty * sl));
          const b = { x, y, x0: x - w / 2 - 2, x1: x + w / 2 + 2, y0: y - h / 2 - 2, y1: y + h / 2 + 2 };
          const hit =
            boxes.some((q) => q.x0 < b.x1 && q.x1 > b.x0 && q.y0 < b.y1 && q.y1 > b.y0) ||
            all.some((l) => Math.hypot(Math.min(Math.max(l.cx, b.x0), b.x1) - l.cx, Math.min(Math.max(l.cy, b.y0), b.y1) - l.cy) < l.r);
          if (!box || !hit) box = b;
          if (!hit) break;
        }
        boxes.push(box);
        const { x, y } = box;
        place(tag, x, y, 0.5, 0.5, alpha);
        tag.classList.toggle('lit', lit === i);
      });
      all.forEach((l, i) => {
        const d = stateTags[i];
        const order =
          cycle[i].label === 'above' ? ['above', 'below', 'right', 'left'] : ['below', 'below-left', 'below-right', 'right', 'left', 'above'];
        const circles = all.filter((_, j) => j !== i);
        const p = placeBeside(l, d.offsetWidth, d.offsetHeight, W, H, { points, boxes, circles, order });
        boxes.push(p);
        place(d, p.x, p.y, 0.5, 0.5, cyc);
      });
    } else {
      lenses.lens(2, big, 1, false);
      for (const d of arrowTags) show(d, false);
      for (const d of stateTags) show(d, false);
    }

    // the cone from the ice, the water or the steam to the lens
    const aim = lensTarget(time);
    const p0 = toScreen(kitchen.points.ice);
    const p1 = toScreen(kitchen.points.water);
    const p2 = toScreen(kitchen.points.steam);
    const from = aim <= 1 ? { x: mix(p0.x, p1.x, aim), y: mix(p0.y, p1.y, aim) } : { x: mix(p1.x, p2.x, aim - 1), y: mix(p1.y, p2.y, aim - 1) };
    lenses.cone(from, big, 1 - cyc);

    // the big lens's name
    const name = mode === 'one' ? 'lens_one' : `lens_${mode}`;
    if (bigTag.dataset.k !== name) {
      bigTag.dataset.k = name;
      bigTag.innerHTML = `<b>${t(name)}</b><small>${t('magnified')}</small>`;
    }
    const tagSeen = 1 - smooth(cyc * 3);
    if (single.tag.side === 'left') place(bigTag, big.cx - big.r - 12, big.cy - big.r * 0.55, 1, 0, tagSeen);
    else place(bigTag, big.cx, big.cy - big.r - 10, 0.5, 1, tagSeen);

    // the heat under the pan
    const f = flame(time);
    const fp = toScreen(kitchen.points.flame);
    place(heatTag, Math.max(fp.x - 8, heatTag.offsetWidth + 6), fp.y, 1, 0.5, Math.min(1, f * 3) * (1 - smooth(cyc * 3)));
    lenses.end();

    // the words under the picture
    const now = Math.max(0, markAt(STEPS, time));
    if (now !== step) {
      step = now;
      for (const b of root.querySelectorAll('[data-step]')) {
        const on = Number(/** @type {HTMLElement} */ (b).dataset.step) === step;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      }
      emit('step', { step, key: STEPS[step].key, t: time });
    }
    const c = Math.max(0, markAt(CAPTIONS, time));
    if (c !== caption) {
      caption = c;
      $('.anim-caption').textContent = t(CAPTIONS[c].key);
      $('.sm-props').innerHTML = propsRow(CAPTIONS[c].props);
    }
    stage.invalidate();
  }

  function propsRow(kind) {
    if (kind === 'formula') return `<span class="sm-line">${t('formula', { o: 1, h: 2 })}</span>`;
    if (kind === 'same') return `<span class="sm-line">${t('same')}</span>`;
    const p = PROPS[kind];
    const item = (yes, key) =>
      `<span class="sm-prop ${yes ? 'yes' : 'no'}">${yes ? ICONS.check : ICONS.close}${t(`${key}_${yes ? 'yes' : 'no'}`)}</span>`;
    return item(p.shape, 'shape') + item(p.volume, 'volume');
  }

  frame();
  stage.onResize(() => {
    frame();
    render(timeline.time);
  });
  const timeline = createTimeline({ duration: DURATION, render, loop: o.loop, onEnd: () => syncPlay() });
  stage.addTicker((dt) => timeline.tick(dt));

  function syncPlay() {
    const b = $('[data-act="play"]');
    b.innerHTML = timeline.playing ? ICONS.pause : ICONS.play;
    b.title = b.ariaLabel = t(timeline.playing ? 'pause' : 'play');
  }
  function play() {
    timeline.play();
    syncPlay();
    emit('play', { t: timeline.time });
  }
  function pause() {
    timeline.pause();
    syncPlay();
    emit('pause', { t: timeline.time });
  }
  const goStep = (i) => timeline.seek(STEPS[Math.max(0, Math.min(STEPS.length - 1, i))].at + 0.01);
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    if (b.dataset.act === 'play') timeline.playing ? pause() : play();
    if (b.dataset.step != null) goStep(Number(b.dataset.step));
  });
  // keys: ← → go to the part before or after, space plays or pauses
  root.tabIndex = -1;
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goStep(step + 1);
    else if (e.key === 'ArrowLeft') goStep(step - 1);
    else if (e.key === ' ' && !(/** @type {Element} */ (e.target).closest('button'))) timeline.playing ? pause() : play();
    else return;
    e.preventDefault();
  });

  timeline.seek(0);
  if (o.autoplay) timeline.play();
  syncPlay();

  return {
    ready: Promise.resolve(),
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: () => ({
      t: +timeline.time.toFixed(3),
      duration: DURATION,
      playing: timeline.playing,
      step,
      part: STEPS[step]?.key,
      caption: CAPTIONS[caption]?.key,
      lens: timeline.time >= T.cycle ? 'cycle' : lensMode(timeline.time),
    }),
    /** { step } jumps to a part, { t } to a time (seconds), { playing } plays or pauses. */
    set(p = {}) {
      if (p.step != null) timeline.seek(STEPS[Number(p.step)]?.at ?? 0);
      if (p.t != null) timeline.seek(Number(p.t));
      if (p.playing === true) play();
      if (p.playing === false) pause();
      return { t: timeline.time, step };
    },
    play,
    pause,
    seek: (time) => timeline.seek(time),
    duration: DURATION,
    capture: (opts) => stage.capture(opts),
    exportRoot: () => kitchen.model,
  };
}
