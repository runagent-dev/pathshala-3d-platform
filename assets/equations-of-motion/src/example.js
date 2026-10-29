// "উদাহরণ": the book's worked example on page 45 as a sheet over the figure. A car starts from rest and reaches
// 60 km/hour in 1 minute; what is its acceleration? Above, the car (a red hatchback, car.js) drives off from a
// start line on a country road (road.js) with a speedometer that shows km/hour and the same speed in m/s, a clock,
// and how much faster than real time the run plays (a minute is long to watch). Below, the question with two
// steppers (the final speed in km/hour, the time in s: the book's 60 km/hour and 1 minute to start) and the
// book's answer line by line ("পরের ধাপ"): the time in seconds, 60 km/hour = (60 × 1000 m)/(60 × 60 s) =
// 16.67 m/s, v = u + at = at (from rest, u = 0), a = v/t = 16.67 m/s / 60 s = 0.278 m/s². The numbers follow the
// steppers; the maths is exampleNumbers() in motion.js. The 3D view is its own small stage, made the first time the
// sheet opens.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { ICONS } from '@shared/student/icons.js';
import { NOSE, createCar } from './car.js';
import { EXAMPLE, EX_LIMITS, exampleNumbers, fixExample, fmt } from './motion.js';
import { LANE, createRoad } from './road.js';

/** The lines of the answer, shown one at a time. */
export const EX_PARTS = 4;
const DIAL_MAX = 140; // km/hour at the end of the speedometer's dial
const VIEW = new THREE.Vector3(0.3, 0.34, 0.89).normalize(); // towards the camera: from the front left, a little above
const q = (c) => `<i class="q-${c}">${c}</i>`;
const fr = (top, bottom) => `<span class="fr"><span>${top}</span><span>${bottom}</span></span>`;
/** A point on the dial: angle in degrees from straight up, clockwise. */
const dial = (deg, r) => {
  const a = (deg * Math.PI) / 180;
  return [60 + r * Math.sin(a), 60 - r * Math.cos(a)];
};
const angleOf = (kmh) => -135 + (270 * Math.min(kmh, DIAL_MAX)) / DIAL_MAX;

/**
 * @param {{ root: HTMLElement, t: any, now?: () => number, onChange?: (state: object) => void }} o
 */
export function createExample({ root, t, now = () => performance.now(), onChange = () => {} }) {
  const N = t.num;
  const n = (x, d = 2) => N(fmt(x, d));
  const el = document.createElement('div');
  el.className = 'eom-ex';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'eom-ex-title');
  const stepper = (k) => `
        <div class="eom-step k-${k}">
          <span class="eom-name"><b>${k}</b> ${t(`ex_name_${k}`)} <small>(${k === 'v' ? t('u_kmh') : t('u_s')})</small></span>
          <div class="eom-ctl">
            <button type="button" class="eom-pm" data-ex-step="${k}" data-dir="-1" aria-label="${t(`ex_less_${k}`)}">${ICONS.minus}</button>
            <output class="eom-val" data-ex-val="${k}"></output>
            <button type="button" class="eom-pm" data-ex-step="${k}" data-dir="1" aria-label="${t(`ex_more_${k}`)}">${ICONS.plus}</button>
          </div>
        </div>`;
  // the speedometer: a 270° dial to 140 km/hour, ticks every 10, numbers every 20
  const ticks = [];
  for (let k = 0; k <= DIAL_MAX; k += 10) {
    const big = k % 20 === 0;
    const [x1, y1] = dial(angleOf(k), 50);
    const [x2, y2] = dial(angleOf(k), big ? 43 : 46);
    ticks.push(`<line class="sp-tick${big ? ' big' : ''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`);
    if (big) {
      const [tx, ty] = dial(angleOf(k), 33);
      ticks.push(`<text class="sp-num" x="${tx.toFixed(1)}" y="${(ty + 3.2).toFixed(1)}" text-anchor="middle">${N(k)}</text>`);
    }
  }
  const [ax, ay] = dial(-135, 50);
  const [bx, by] = dial(135, 50);
  const arc = `M ${ax.toFixed(2)} ${ay.toFixed(2)} A 50 50 0 1 1 ${bx.toFixed(2)} ${by.toFixed(2)}`;
  el.innerHTML = `
    <div class="eom-dv-card eom-ex-card">
      <div class="eom-dv-head">
        <h2 id="eom-ex-title">${t('ex_title')}</h2>
        <button type="button" class="eom-dv-x" data-ex="close" aria-label="${t('dv_close')}" title="${t('dv_close')}">${ICONS.close}</button>
      </div>
      <div class="eom-ex-body">
        <div class="eom-ex-scene">
          <div class="eom-ex-gl"></div>
          <span class="eom-ex-chip eom-ex-clock q-t"></span>
          <span class="eom-ex-chip eom-ex-fast"></span>
          <div class="eom-ex-speedo" role="img">
            <svg viewBox="0 0 120 112" aria-hidden="true">
              <circle class="sp-face" cx="60" cy="60" r="57"/>
              <path class="sp-track" d="${arc}" pathLength="100"/>
              <path class="sp-fill" d="${arc}" pathLength="100" stroke-dasharray="0 100"/>
              ${ticks.join('')}
              <g class="sp-needle"><path d="M 57.6 62 L 60 16 L 62.4 62 Z"/><circle cx="60" cy="60" r="5"/></g>
              <text class="sp-kmh" x="60" y="88" text-anchor="middle"></text>
              <text class="sp-unit" x="60" y="99" text-anchor="middle">${t('u_kmh')}</text>
            </svg>
            <span class="eom-ex-ms q-v"></span>
          </div>
        </div>
        <div class="eom-ex-text">
          <p class="eom-ex-q"></p>
          <div class="eom-ex-steps">${stepper('v')}${stepper('t')}</div>
          <ol class="eom-ex-lines"></ol>
        </div>
      </div>
      <div class="eom-dv-foot">
        <button type="button" class="eom-ex-run" data-ex="run">${ICONS.play}<span></span></button>
        <span class="eom-dv-dots" aria-hidden="true"></span>
        <button type="button" class="eom-dv-nav eom-ex-prev" data-ex="prev" aria-label="${t('dv_prev')}">${ICONS.chevL}<span>${t('dv_prev')}</span></button>
        <button type="button" class="eom-dv-nav primary" data-ex="next"><span>${t('dv_next')}</span>${ICONS.chevR}</button>
      </div>
    </div>`;
  root.append(el);
  const $ = (sel) => /** @type {HTMLElement} */ (el.querySelector(sel));
  const st = { open: false, part: 0, kmh: EXAMPLE.kmh, t: EXAMPLE.t, time: 0, playing: false, startedAt: 0 };
  let ex = exampleNumbers(st);
  let opener = null;
  /** @type {any} */
  let view = null; // the 3D: made the first time the sheet opens

  const phase = () => (st.playing ? 'running' : st.time >= st.t - 1e-9 ? 'done' : st.time > 0 ? 'paused' : 'ready');
  const speedAt = (tau) => ex.aExact * tau; // m/s
  const distAt = (tau) => 0.5 * ex.aExact * tau * tau; // m
  function state() {
    return {
      open: st.open,
      part: st.part,
      kmh: st.kmh,
      t: st.t,
      v: ex.v,
      a: ex.a,
      time: Math.round(st.time * 1000) / 1000,
      speed: Math.round(speedAt(st.time) * 1000) / 1000,
      distance: Math.round(distAt(st.time) * 1000) / 1000,
      speedup: ex.speedup,
      playing: st.playing,
      phase: phase(),
    };
  }

  // ── the 3D: the road, the car, a camera that follows it (further back the faster it goes) ──
  function makeView() {
    const stage = createStage($('.eom-ex-gl'), { fov: 26, near: 0.3, far: 1200, environment: 'studio-light' });
    stage.controls.enabled = false;
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 2;
    skyCanvas.height = 256;
    const c = /** @type {CanvasRenderingContext2D} */ (skyCanvas.getContext('2d'));
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#6fbcf0');
    g.addColorStop(0.5, '#bfe2fa');
    g.addColorStop(1, '#eef8fe');
    c.fillStyle = g;
    c.fillRect(0, 0, 2, 256);
    const sky = new THREE.CanvasTexture(skyCanvas);
    sky.colorSpace = THREE.SRGBColorSpace;
    stage.scene.background = sky;
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(-20, 40, 30);
    stage.scene.add(sun, new THREE.HemisphereLight(0xdff1ff, 0x6b8f4a, 0.55));
    const road = createRoad();
    const car = createCar();
    car.root.position.z = LANE;
    stage.scene.add(road.root, car.root);
    stage.addTicker(() => tick());
    stage.onResize(() => place());
    return { stage, road, car };
  }

  function place() {
    if (!view?.road) return; // (resized while being made)
    const { stage, road, car } = view;
    const x = distAt(st.time);
    const v = speedAt(st.time);
    car.root.position.x = x - NOSE;
    road.follow(x);
    const onScreen = v * ex.speedup; // m/s as the eye sees it
    car.spin(x, st.playing ? onScreen / (2 * Math.PI * 0.32) : 0);
    // the window of road shown: 12 m around the car at rest, up to 36 m when the road flies past
    const span = 12 + 24 * THREE.MathUtils.smoothstep(onScreen, 0, 90);
    const cam = stage.camera;
    const aspect = stage.width / stage.height;
    const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * aspect);
    // the span across the picture, but in a tall picture no more than the span from top to bottom either: the car
    // never gets tiny
    const fitW = span / 2 / Math.tan(half);
    const fitH = span / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const dist = Math.max(7, Math.min(fitW, fitH));
    const target = new THREE.Vector3(x - NOSE + span * 0.1, 0.75, LANE - 0.3);
    cam.position.copy(target).addScaledVector(VIEW, dist);
    stage.controls.target.copy(target); // the controls (switched off) still aim the camera every frame
    cam.lookAt(target);
    stage.invalidate();
  }

  function hud() {
    const v = speedAt(st.time);
    const kmh = v * 3.6;
    const kmhShown = st.time >= st.t - 1e-9 ? st.kmh : Math.floor(kmh + 1e-6);
    $('.sp-needle').setAttribute('transform', `rotate(${angleOf(kmh).toFixed(2)} 60 60)`);
    $('.sp-fill').setAttribute('stroke-dasharray', `${((100 * Math.min(kmh, DIAL_MAX)) / DIAL_MAX).toFixed(2)} 100`);
    $('.sp-kmh').textContent = N(kmhShown);
    $('.eom-ex-ms').textContent = t('ex_ms', { v: st.time >= st.t - 1e-9 ? fmt(ex.v) : v.toFixed(2) });
    $('.eom-ex-speedo').setAttribute('aria-label', `${t('ex_speedo')}: ${N(kmhShown)} ${t('u_kmh')}`);
    $('.eom-ex-clock').innerHTML = `${q('t')} = ${N(Math.floor(st.time + 1e-6))} s`;
    const fast = $('.eom-ex-fast');
    fast.hidden = ex.speedup <= 1;
    fast.textContent = t('ex_fast', { k: ex.speedup });
    const run = $('[data-ex="run"]');
    const ph = phase();
    if (run.dataset.phase === ph) return;
    run.dataset.phase = ph;
    run.querySelector('span').textContent = t(ph === 'running' ? 'ex_pause' : ph === 'paused' ? 'ex_go_on' : ph === 'done' ? 'ex_again' : 'ex_run');
    run.querySelector('svg').outerHTML = ph === 'running' ? ICONS.pause : ICONS.play;
  }

  function tick() {
    if (!st.playing) return false;
    st.time = Math.min(st.t, ((now() - st.startedAt) / 1000) * ex.speedup);
    if (st.time >= st.t) {
      st.playing = false;
      changed();
    }
    place();
    hud();
    return true;
  }

  // ── the words and the sum ──
  function lines() {
    const { kmh, t: T, v, a, minutes } = ex;
    const L = [
      {
        f: minutes ? `${q('t')} = ${N(minutes)} ${t('ex_min')} = ${N(T)} s` : `${q('t')} = ${N(T)} s`,
        n: t(minutes ? 'ex_n_1' : 'ex_n_1s'),
      },
      {
        f: `${q('v')} = ${N(kmh)} km/hour = ${fr(`${N(kmh)} × ${N(1000)} m`, `${N(60)} × ${N(60)} s`)} = ${n(v)} m/s`,
        n: t('ex_n_2'),
      },
      { f: `${q('v')} = ${q('u')} + ${q('a')}${q('t')} = ${q('a')}${q('t')}`, n: t('ex_n_3', { z: 0 }) },
      {
        f: `${q('a')} = ${fr(q('v'), q('t'))} = ${fr(`${n(v)} m/s`, `${N(T)} s`)} = <b class="q-a">${n(a, 3)} ${t('u_ms2_ex')}</b>`,
        n:
          kmh === EXAMPLE.kmh && T === EXAMPLE.t
            ? `<span class="eom-dv-ok">${ICONS.check}<span>${t('ex_book')}</span></span>`
            : t('ex_n_4', { a: fmt(a, 3) }),
      },
    ];
    return L.map(
      (l, i) =>
        `<li class="eom-ex-line${i === L.length - 1 ? ' res' : ''}${i < st.part ? ' in' : ''}"${i < st.part ? '' : ' aria-hidden="true"'}><span class="f">${l.f}</span><span class="n">${l.n}</span></li>`,
    ).join('');
  }

  function render() {
    const time = ex.minutes ? t('ex_in_min', { m: ex.minutes }) : t('ex_in_s', { s: ex.t });
    $('.eom-ex-q').innerHTML = t('ex_q', { time: `<b class="q-t">${time}</b>`, speed: `<b class="q-v">${N(st.kmh)} km/hour</b>` });
    $('[data-ex-val="v"]').textContent = N(st.kmh);
    $('[data-ex-val="t"]').textContent = N(st.t);
    for (const b of el.querySelectorAll('[data-ex-step]')) {
      const k = /** @type {HTMLElement} */ (b).dataset.exStep === 'v' ? 'kmh' : 't';
      const [lo, hi] = EX_LIMITS[k];
      const dir = Number(/** @type {HTMLElement} */ (b).dataset.dir);
      b.classList.toggle('off', dir < 0 ? st[k] <= lo : st[k] >= hi);
    }
    $('.eom-ex-lines').innerHTML = st.part === 0 ? `<li class="eom-ex-hint">${t('ex_hint')}</li>${lines()}` : lines();
    $('.eom-dv-dots').innerHTML = Array.from({ length: EX_PARTS + 1 }, (_, i) => `<i class="${i <= st.part ? 'on' : ''}"></i>`).join('');
    /** @type {HTMLButtonElement} */ ($('[data-ex="prev"]')).disabled = st.part === 0;
    const next = $('[data-ex="next"]');
    next.dataset.end = String(st.part >= EX_PARTS);
    next.querySelector('span').textContent = t(st.part >= EX_PARTS ? 'dv_close' : 'dv_next');
    place();
    hud();
  }
  function changed() {
    onChange(state());
  }

  function play() {
    if (st.time >= st.t - 1e-9) st.time = 0;
    st.startedAt = now() - (st.time / ex.speedup) * 1000;
    st.playing = true;
    view?.stage.invalidate();
    render();
    changed();
  }
  function pause() {
    if (!st.playing) return;
    st.time = Math.min(st.t, ((now() - st.startedAt) / 1000) * ex.speedup);
    st.playing = false;
    render();
    changed();
  }
  function showAt(tau) {
    st.playing = false;
    st.time = Math.min(st.t, Math.max(0, tau));
    render();
    changed();
  }
  function setNumbers(p) {
    const f = fixExample({ kmh: p.kmh ?? st.kmh, t: p.t ?? st.t });
    st.kmh = f.kmh;
    st.t = f.t;
    ex = exampleNumbers(st);
    st.playing = false;
    st.time = 0; // a new question: the car back at the start line
    render();
    changed();
  }
  function go(part) {
    st.part = Math.min(EX_PARTS, Math.max(0, part));
    render();
    changed();
  }
  function open() {
    if (!st.open) opener = /** @type {HTMLElement | null} */ (document.activeElement);
    st.open = true;
    el.hidden = false;
    root.classList.add('eom-ex-open');
    if (!view) view = makeView();
    render();
    changed();
    $('[data-ex="run"]').focus({ preventScroll: true });
  }
  function close() {
    if (!st.open) return;
    st.open = false;
    st.playing = false;
    el.hidden = true;
    root.classList.remove('eom-ex-open');
    changed();
    if (opener && root.contains(opener)) opener.focus({ preventScroll: true });
  }

  el.addEventListener('click', (e) => {
    const target = /** @type {Element} */ (e.target);
    const b = /** @type {HTMLElement} */ (target.closest('button'));
    if (b?.dataset.exStep) {
      const k = b.dataset.exStep === 'v' ? 'kmh' : 't';
      setNumbers({ [k]: st[k] + Number(b.dataset.dir) * EX_LIMITS[k][2] });
    } else if (b?.dataset.ex === 'run') st.playing ? pause() : play();
    else if (b?.dataset.ex === 'next') st.part >= EX_PARTS ? close() : go(st.part + 1);
    else if (b?.dataset.ex === 'prev') go(st.part - 1);
    else if (b?.dataset.ex === 'close') close();
    else if (target.closest('.eom-ex-scene'))
      st.playing ? pause() : play(); // a tap on the car runs it
    else if (target === el) close(); // a tap on the backdrop
    e.stopPropagation();
  });
  el.addEventListener('keydown', (e) => {
    const onButton = /** @type {Element} */ (e.target).closest('button');
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(st.part + 1);
    else if (e.key === 'ArrowLeft') go(st.part - 1);
    else if ((e.key === ' ' || e.key === 'Enter') && !onButton) st.playing ? pause() : play();
    else if (e.key === 'Tab') {
      // focus stays inside the sheet
      const list = [...el.querySelectorAll('button:not(:disabled)')];
      const i = list.indexOf(/** @type {Element} */ (document.activeElement));
      if (e.shiftKey && i <= 0) /** @type {HTMLElement} */ (list[list.length - 1]).focus();
      else if (!e.shiftKey && i === list.length - 1) /** @type {HTMLElement} */ (list[0]).focus();
      else return e.stopPropagation();
    } else return e.stopPropagation();
    e.preventDefault();
    e.stopPropagation();
  });
  // a finger on the sheet never reaches the 3D view under it
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) el.addEventListener(type, (e) => e.stopPropagation());

  return {
    el,
    open,
    close,
    get state() {
      return state();
    },
    /**
     * Change any of: open (true/false), kmh and t (the question: a new one puts the car back at the start), part
     * (0–4 lines of the answer shown), time (s into the run, stopped there; 'end'), playing.
     */
    set(p = {}) {
      if (p.open === true) open();
      if (p.kmh != null || p.t != null) setNumbers({ kmh: p.kmh != null ? Number(p.kmh) : undefined, t: p.t != null ? Number(p.t) : undefined });
      if (p.part != null) go(Number(p.part) || 0);
      if (p.time != null) showAt(p.time === 'end' ? st.t : Number(p.time) || 0);
      if (p.playing === true && !st.playing) play();
      if (p.playing === false) pause();
      if (p.open === false) close();
      return state();
    },
  };
}
