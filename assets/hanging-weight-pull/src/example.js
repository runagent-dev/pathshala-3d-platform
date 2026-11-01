// "উদাহরণ": the book's own two pictures (pages 81–83) as a window over the figure, each solved line by line.
//   চিত্র ৩.০৯: a hanging mass M pulls a block m over a smooth table through a string over a pulley:
//              T = ma (the block, right +), N − mg = 0 (no vertical acceleration), T − Mg = M(−a) (the hanging mass,
//              up +), so a = Mg/(M + m) and T = ma, less than Mg.
//   চিত্র ৩.১০: a block m between two pulleys with m₂ = 10 kg hanging on the left and m₁ = 5 kg on the right:
//              T₁ − 5g = 5a, T₁ − T₂ = m(−a), T₂ − 10g = 10(−a), so T₁ − T₂ = 15a − 5g and a = 5g/(m + 15).
// Above: the bench, the block, the pulley(s) and the weight(s) (apparatus.js, its own small 3D stage made the first
// time the window opens), with arrows for T (orange), the weights (purple) and a (teal); one tap runs it (time slowed
// four times). Below: steppers for the masses the book leaves as letters (M and m; m), and the answer one line at a
// time ("পরের ধাপ"), with the student's numbers.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createMaterials } from '@shared/student/materials.js';
import { ICONS } from '@shared/student/icons.js';
import { BENCH, STRING_Y, createApparatus } from './apparatus.js';
import { boldArrow } from './arrows.js';
import { fitPose } from './camera.js';
import { BOOK, EX_LIMITS, G, plain, runAt, runTime, solve, travel } from './reading.js';

export const EX_PARTS = 5;
const SLOW = 4;
const COLORS = { W: '#7048e8', T: '#e8590c', a: '#0c8599' };
const VIEW_BOXES = {
  single: [new THREE.Vector3(-0.2, 0.05, -0.2), new THREE.Vector3(1.15, 1.12, 0.2)],
  two: [new THREE.Vector3(-1.15, 0.05, -0.2), new THREE.Vector3(1.15, 1.12, 0.2)],
};
const DIR = new THREE.Vector3(-0.08, 0.2, 1).normalize();
const UPV = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const RIGHT = new THREE.Vector3(1, 0, 0);
const LEFT = new THREE.Vector3(-1, 0, 0);
const ZF = 0.2;
const q = (c, s = c) => `<i class="c-${c}">${s}</i>`;
const fr = (top, bottom) => `<span class="fr"><span>${top}</span><span>${bottom}</span></span>`;

/**
 * @param {{ root: HTMLElement, t: any, now?: () => number, onChange?: (state: object) => void }} o
 */
export function createExample({ root, t, now = () => performance.now(), onChange = () => {} }) {
  const N = t.num;
  const n = (x) => N(plain(x));
  const el = document.createElement('div');
  el.className = 'wl-ex';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'wl-ex-title');
  const stepper = (k) => `
        <div class="wl-step k-${k}" data-ex-for="${k}">
          <span class="wl-name"><b class="c-${k === 'M' ? 'W' : 'm'}">${k}</b> <span>${t(`ex_name_${k}`)}</span></span>
          <span class="wl-ctl">
            <button type="button" class="wl-pm" data-ex-step="${k}" data-dir="-1" aria-label="${t(`ex_less_${k}`)}">${ICONS.minus}</button>
            <output class="wl-val" data-ex-val="${k}"></output>
            <span class="wl-unit">kg</span>
            <button type="button" class="wl-pm" data-ex-step="${k}" data-dir="1" aria-label="${t(`ex_more_${k}`)}">${ICONS.plus}</button>
          </span>
        </div>`;
  el.innerHTML = `
    <div class="wl-ex-card">
      <div class="wl-ex-head">
        <h2 id="wl-ex-title">${t('ex_title')}</h2>
        <div class="wl-ex-tabs" role="tablist" aria-label="${t('ex_title')}">
          <button type="button" role="tab" data-ex-kind="single">${t('ex_tab_single', { n: '3.09' })}</button><button type="button" role="tab" data-ex-kind="two">${t('ex_tab_two', { n: '3.10' })}</button>
        </div>
        <button type="button" class="wl-ex-x" data-ex="close" aria-label="${t('ex_close')}" title="${t('ex_close')}">${ICONS.close}</button>
      </div>
      <div class="wl-ex-body">
        <div class="wl-ex-scene">
          <div class="wl-ex-gl"></div>
          <div class="wl-ex-anno" aria-hidden="true"></div>
          <span class="wl-ex-chip"></span>
        </div>
        <div class="wl-ex-text">
          <p class="wl-ex-q"></p>
          <div class="wl-ex-steps">${stepper('M')}${stepper('m')}</div>
          <ol class="wl-ex-lines"></ol>
        </div>
      </div>
      <div class="wl-ex-foot">
        <button type="button" class="wl-ex-run" data-ex="run">${ICONS.play}<span></span></button>
        <span class="wl-ex-dots" aria-hidden="true"></span>
        <button type="button" class="wl-ex-nav wl-ex-prev" data-ex="prev" aria-label="${t('ex_prev')}">${ICONS.chevL}<span>${t('ex_prev')}</span></button>
        <button type="button" class="wl-ex-nav primary" data-ex="next"><span>${t('ex_next')}</span>${ICONS.chevR}</button>
      </div>
    </div>`;
  root.append(el);
  const $ = (sel) => /** @type {HTMLElement} */ (el.querySelector(sel));
  const st = { open: false, kind: 'single', part: 0, M: BOOK.single.M, m: BOOK.single.m, mTwo: BOOK.two.m, phase: 'ready', t0: 0 };
  let opener = null;
  /** @type {any} */
  let view = null;

  const setup = () => (st.kind === 'two' ? { kind: 'two', m2: BOOK.two.m2, m1: BOOK.two.m1, m: st.mTwo } : { kind: 'single', M: st.M, m: st.m });
  let sol = solve(setup());

  function progress() {
    if (st.phase === 'ready') return 0;
    if (st.phase === 'done') return 1;
    const D = travel(setup());
    return runAt(sol.a, D, (now() - st.t0) / 1000 / SLOW).s / D;
  }
  function state() {
    return {
      open: st.open,
      kind: st.kind,
      part: st.part,
      ...(st.kind === 'two'
        ? { m2: BOOK.two.m2, m1: BOOK.two.m1, m: st.mTwo, T1: Math.round(sol.T1 * 1000) / 1000, T2: Math.round(sol.T2 * 1000) / 1000 }
        : { M: st.M, m: st.m, T: Math.round(sol.T * 1000) / 1000 }),
      a: Math.round(sol.a * 1000) / 1000,
      phase: st.phase,
      progress: Math.round(progress() * 1000) / 1000,
    };
  }

  // ── the 3D: the bench and its weights, arrows ──
  function makeView() {
    const stage = createStage($('.wl-ex-gl'), { fov: 24, near: 0.05, far: 60, environment: 'studio-light' });
    stage.controls.enableZoom = false;
    stage.controls.enablePan = false;
    stage.controls.enableRotate = false;
    // a cool slate-blue classroom wall behind, darker towards the floor: the orange T, the purple weights and the teal a
    // all stand out from it (a warm wall swallowed the orange arrows)
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#dbe6f0');
    g.addColorStop(0.55, '#b9cbdc');
    g.addColorStop(0.86, '#93a8bd');
    g.addColorStop(1, '#6f8296');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const bg = new THREE.CanvasTexture(c);
    bg.colorSpace = THREE.SRGBColorSpace;
    stage.scene.background = bg;
    const sun = new THREE.DirectionalLight('#fff4e0', 1.0);
    sun.position.set(0.8, 3.4, 2.4);
    stage.scene.add(sun, new THREE.HemisphereLight('#fff1dc', '#a8683a', 0.7));
    const ap = createApparatus({ materials: createMaterials(stage.renderer) });
    stage.scene.add(ap.root);
    // bold arrows in a white outline, drawn over the bench and the weights (arrows.js, as on the well)
    const mk = (name, color) => {
      const a = boldArrow(name, color, 0.011);
      stage.scene.add(a.root);
      return a;
    };
    const A = {
      rW: mk('W', COLORS.W),
      rT: mk('T', COLORS.T),
      ra: mk('a', COLORS.a),
      lW: mk('WL', COLORS.W),
      lT: mk('TL', COLORS.T),
      la: mk('aL', COLORS.a),
      bR: mk('BR', COLORS.T),
      bL: mk('BL', COLORS.T),
      ba: mk('BA', COLORS.a),
    };
    stage.addTicker(() => tick());
    stage.onResize(() => frame());
    return { stage, ap, A };
  }
  function frame() {
    if (!view) return;
    const [min, max] = VIEW_BOXES[st.kind];
    const fit = fitPose({
      box: new THREE.Box3(min, max),
      dir: DIR,
      camera: view.stage.camera,
      width: view.stage.width,
      height: view.stage.height,
      margin: { top: 30, bottom: 8, side: 6 },
    });
    view.stage.camera.position.copy(fit.position);
    view.stage.controls.target.copy(fit.target);
    view.stage.controls.update();
    place();
  }
  const tmp = new THREE.Vector3();
  const at = (x, y) => tmp.set(x, y, ZF);
  function place() {
    if (!view) return;
    const { ap, A, stage } = view;
    ap.place(progress());
    for (const a of Object.values(A)) a.hide();
    if (st.phase !== 'ready') {
      const geom = ap.geom;
      const two = st.kind === 'two';
      const biggest = two ? Math.max(sol.W2, sol.W1, sol.T2, sol.T1) : Math.max(sol.W, sol.T);
      const kf = Math.min(two ? 0.0028 : 0.0048, 0.3 / biggest);
      const ka = Math.min(two ? 0.07 : 0.045, 0.3 / Math.max(sol.a, 1e-6));
      const bk = geom.block;
      const r = geom.right;
      if (!two) {
        A.rW.set(at(r.x, r.com), DOWN, sol.W * kf);
        A.rT.set(at(r.x, r.top), UPV, sol.T * kf);
        A.ra.set(at(r.x + r.size.rBottom + 0.075, r.com), DOWN, sol.a * ka);
        A.bR.set(at(bk.x + bk.w / 2 + 0.012, STRING_Y), RIGHT, sol.T * kf);
        A.ba.set(at(bk.x, BENCH.top - 0.03), RIGHT, sol.a * ka);
      } else {
        const l = geom.left;
        const leftFalls = sol.left;
        A.lW.set(at(l.x, l.com), DOWN, sol.W2 * kf);
        A.lT.set(at(l.x, l.top), UPV, sol.T2 * kf);
        A.la.set(at(l.x - l.size.rBottom - 0.075, l.com), leftFalls ? DOWN : UPV, sol.a * ka);
        A.rW.set(at(r.x, r.com), DOWN, sol.W1 * kf);
        A.rT.set(at(r.x, r.top), UPV, sol.T1 * kf);
        A.ra.set(at(r.x + r.size.rBottom + 0.075, r.com), leftFalls ? UPV : DOWN, sol.a * ka);
        A.bL.set(at(bk.x - bk.w / 2 - 0.012, STRING_Y), LEFT, sol.T2 * kf);
        A.bR.set(at(bk.x + bk.w / 2 + 0.012, STRING_Y), RIGHT, sol.T1 * kf);
        A.ba.set(at(bk.x, BENCH.top - 0.03), leftFalls ? LEFT : RIGHT, sol.a * ka);
      }
    }
    labels();
    stage.invalidate();
  }
  /** Small labels at the arrows' heads (DOM): T, Mg, a with their numbers; rebuilt when the words change, moved each frame. */
  const lp = new THREE.Vector3();
  let lblKey = '';
  /** @type {{ el: HTMLElement, arrow: any, side: number, w: number, h: number, dx: number, dy: number }[]} */
  let lbls = [];
  function labels() {
    const layer = $('.wl-ex-anno');
    if (!view || st.phase === 'ready') {
      if (lblKey) layer.innerHTML = '';
      lblKey = '';
      lbls = [];
      return;
    }
    const { A, stage } = view;
    const two = st.kind === 'two';
    const list = two
      ? [
          [A.bL, `${q('T', 'T<sub>2</sub>')} = ${n(sol.T2)} N`, 'T', -1],
          [A.bR, `${q('T', 'T<sub>1</sub>')} = ${n(sol.T1)} N`, 'T', 1],
          [A.lW, `m<sub>2</sub>g`, 'W', -1],
          [A.rW, `m<sub>1</sub>g`, 'W', 1],
          [A.ba, `a = ${n(sol.a)}`, 'a', 0],
        ]
      : [
          [A.bR, `T = ${n(sol.T)} N`, 'T', 0],
          [A.rW, `Mg = ${n(sol.W)} N`, 'W', -1],
          [A.ba, `a = ${n(sol.a)}`, 'a', 0],
        ];
    const key = list.map((x) => x[1]).join('|');
    if (key !== lblKey) {
      lblKey = key;
      layer.innerHTML = list.map(([, html, c, side]) => `<span class="wl-ex-lbl k-${c} s${side}">${html}</span>`).join('');
      const els = /** @type {HTMLElement[]} */ ([...layer.children]);
      lbls = list.map(([arrow, , c, side], i) => ({
        side,
        w: els[i].offsetWidth,
        h: els[i].offsetHeight,
        el: els[i],
        arrow,
        dx: side < 0 ? -10 : side > 0 ? 10 : 0,
        dy: c === 'a' ? 16 : c === 'W' ? 0 : -16,
      }));
    }
    // each label stays inside the picture (its anchor is its right edge, left edge or middle, by side)
    const W = stage.width;
    const H = stage.height;
    for (const l of lbls) {
      lp.copy(l.arrow.tip).project(stage.camera);
      const lo = l.side < 0 ? l.w + 4 : l.side > 0 ? 4 : l.w / 2 + 4;
      const hi = l.side < 0 ? W - 4 : l.side > 0 ? W - l.w - 4 : W - l.w / 2 - 4;
      const x = Math.min(Math.max((lp.x * 0.5 + 0.5) * W + l.dx, lo), Math.max(lo, hi));
      const y = Math.min(Math.max((-lp.y * 0.5 + 0.5) * H + l.dy, l.h / 2 + 2), Math.max(l.h / 2 + 2, H - l.h / 2 - 2));
      l.el.style.left = `${x.toFixed(1)}px`;
      l.el.style.top = `${y.toFixed(1)}px`;
    }
  }
  function tick() {
    if (st.phase !== 'run') return false;
    const D = travel(setup());
    if (now() - st.t0 >= runTime(sol.a, D) * SLOW * 1000) {
      st.phase = 'done';
      render();
      changed();
    }
    place();
    return st.phase === 'run';
  }

  // ── the words and the sums ──
  function lines() {
    const g = N(G);
    let L;
    if (st.kind === 'single') {
      const { M, m } = st;
      L = [
        { f: `${q('T')} = ${q('m')}${q('a')}`, n: t('ex_s1') },
        { f: `N − ${q('m')}g = ${N(0)}`, n: t('ex_s2') },
        { f: `${q('T')} − ${q('W', 'M')}g = ${q('W', 'M')}(−${q('a')})`, n: t('ex_s3') },
        {
          f: `${q('a')} = ${fr(`${q('W', 'M')}g`, `${q('W', 'M')} + ${q('m')}`)} = ${fr(`${N(M)} × ${g}`, `${N(M)} + ${N(m)}`)} = <b class="c-a">${n(sol.a)} ${t('u_a')}</b>`,
          n: t('ex_s4'),
        },
        { f: `${q('T')} = ${q('m')}${q('a')} = ${N(m)} × ${n(sol.a)} = <b class="c-T">${n(sol.T)} N</b>`, n: t('ex_s5', { W: n(sol.W) }) },
      ];
    } else {
      const m = st.mTwo;
      const T1 = q('T', 'T<sub>1</sub>');
      const T2 = q('T', 'T<sub>2</sub>');
      L = [
        { f: `${T1} − ${N(5)}g = ${N(5)}${q('a')}`, n: t('ex_t1') },
        { f: `${T1} − ${T2} = ${q('m')}(−${q('a')})`, n: t('ex_t2') },
        { f: `${T2} − ${N(10)}g = ${N(10)}(−${q('a')})`, n: t('ex_t3') },
        { f: `${T1} − ${T2} = ${N(15)}${q('a')} − ${N(5)}g`, n: t('ex_t4') },
        {
          f: `${q('a')} = ${fr(`${N(5)}g`, `${q('m')} + ${N(15)}`)} = ${fr(`${N(5)} × ${g}`, `${N(m)} + ${N(15)}`)} = <b class="c-a">${n(sol.a)} ${t('u_a')}</b>`,
          n: t('ex_t5'),
        },
      ];
    }
    return L.map(
      (l, i) =>
        `<li class="wl-ex-line${i === L.length - 1 ? ' res' : ''}${i < st.part ? ' in' : ''}${i === st.part - 1 ? ' cur' : ''}"${i < st.part ? '' : ' aria-hidden="true"'}><span class="f">${l.f}</span><span class="n">${l.n}</span></li>`,
    ).join('');
  }

  function render() {
    for (const b of el.querySelectorAll('[data-ex-kind]')) {
      const on = /** @type {HTMLElement} */ (b).dataset.exKind === st.kind;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    $('.wl-ex-q').innerHTML = t(st.kind === 'two' ? 'ex_q_two' : 'ex_q_single', { m2: BOOK.two.m2, m1: BOOK.two.m1 });
    /** @type {HTMLElement} */ ($('[data-ex-for="M"]')).hidden = st.kind === 'two';
    $('[data-ex-val="M"]').textContent = N(st.M);
    $('[data-ex-val="m"]').textContent = N(st.kind === 'two' ? st.mTwo : st.m);
    for (const b of el.querySelectorAll('[data-ex-step]')) {
      const k = /** @type {HTMLElement} */ (b).dataset.exStep;
      const v = k === 'M' ? st.M : st.kind === 'two' ? st.mTwo : st.m;
      const [lo, hi] = EX_LIMITS[k];
      const dir = Number(/** @type {HTMLElement} */ (b).dataset.dir);
      b.classList.toggle('off', dir < 0 ? v <= lo : v >= hi);
    }
    $('.wl-ex-lines').innerHTML = st.part === 0 ? `<li class="wl-ex-hint">${t('ex_hint')}</li>${lines()}` : lines();
    $('.wl-ex-dots').innerHTML = Array.from({ length: EX_PARTS + 1 }, (_, i) => `<i class="${i <= st.part ? 'on' : ''}"></i>`).join('');
    /** @type {HTMLButtonElement} */ ($('[data-ex="prev"]')).disabled = st.part === 0;
    const next = $('[data-ex="next"]');
    next.querySelector('span').textContent = t(st.part >= EX_PARTS ? 'ex_close' : 'ex_next');
    const run = $('[data-ex="run"]');
    if (run.dataset.phase !== st.phase) {
      run.dataset.phase = st.phase;
      run.querySelector('span').textContent = t(st.phase === 'run' ? 'ex_running' : st.phase === 'done' ? 'ex_again' : 'ex_run');
    }
    $('.wl-ex-chip').textContent = t('ex_chip', { k: SLOW });
    place();
  }
  function changed() {
    onChange(state());
  }
  function setKind(kind) {
    if (kind !== 'single' && kind !== 'two') return;
    st.kind = kind;
    st.part = 0;
    reload();
  }
  function reload() {
    sol = solve(setup());
    st.phase = 'ready';
    if (view) {
      view.ap.setup(setup());
      frame();
    }
    render();
    changed();
  }
  function run() {
    if (st.phase === 'run') return;
    if (st.phase === 'done') st.phase = 'ready';
    st.t0 = now();
    st.phase = 'run';
    view?.stage.invalidate();
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
    root.classList.add('wl-ex-open');
    if (!view) {
      view = makeView();
      view.ap.setup(setup());
    }
    frame();
    render();
    changed();
    $('[data-ex="run"]').focus({ preventScroll: true });
  }
  function close() {
    if (!st.open) return;
    st.open = false;
    el.hidden = true;
    root.classList.remove('wl-ex-open');
    changed();
    if (opener && root.contains(opener)) opener.focus({ preventScroll: true });
  }

  el.addEventListener('click', (e) => {
    const target = /** @type {Element} */ (e.target);
    const b = /** @type {HTMLElement} */ (target.closest('button'));
    if (b?.dataset.exStep) {
      const k = b.dataset.exStep;
      const [lo, hi, inc] = EX_LIMITS[k];
      const d = Number(b.dataset.dir) * inc;
      if (k === 'M') st.M = Math.min(hi, Math.max(lo, st.M + d));
      else if (st.kind === 'two') st.mTwo = Math.min(hi, Math.max(lo, st.mTwo + d));
      else st.m = Math.min(hi, Math.max(lo, st.m + d));
      reload();
    } else if (b?.dataset.exKind) setKind(b.dataset.exKind);
    else if (b?.dataset.ex === 'run') run();
    else if (b?.dataset.ex === 'next') st.part >= EX_PARTS ? close() : go(st.part + 1);
    else if (b?.dataset.ex === 'prev') go(st.part - 1);
    else if (b?.dataset.ex === 'close') close();
    else if (target.closest('.wl-ex-gl'))
      run(); // a tap on the bench runs it
    else if (target === el) close(); // a tap on the backdrop
    e.stopPropagation();
  });
  el.addEventListener('keydown', (e) => {
    const onButton = /** @type {Element} */ (e.target).closest('button');
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(st.part + 1);
    else if (e.key === 'ArrowLeft') go(st.part - 1);
    else if ((e.key === ' ' || e.key === 'Enter') && !onButton) run();
    else if (e.key === 'Tab') {
      const list = [...el.querySelectorAll('button:not(:disabled)')].filter((x) => /** @type {HTMLElement} */ (x).offsetParent !== null);
      const i = list.indexOf(/** @type {Element} */ (document.activeElement));
      if (e.shiftKey && i <= 0) /** @type {HTMLElement} */ (list[list.length - 1]).focus();
      else if (!e.shiftKey && i === list.length - 1) /** @type {HTMLElement} */ (list[0]).focus();
      else return e.stopPropagation();
    } else return e.stopPropagation();
    e.preventDefault();
    e.stopPropagation();
  });
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) el.addEventListener(type, (e) => e.stopPropagation());

  return {
    el,
    open,
    close,
    get state() {
      return state();
    },
    /**
     * Change any of: open, kind ('single' | 'two'), M and m (kg; with kind 'two' only m), part (0–5 lines shown),
     * playing (true: run it; with time: 'end' it lands at the end).
     */
    set(p = {}) {
      if (p.open === true) open();
      if (p.kind) setKind(String(p.kind));
      if (p.M != null || p.m != null) {
        const fix = (v, [lo, hi]) => Math.min(hi, Math.max(lo, Math.round(Number(v) || lo)));
        if (p.M != null) st.M = fix(p.M, EX_LIMITS.M);
        if (p.m != null) {
          if (st.kind === 'two') st.mTwo = fix(p.m, EX_LIMITS.m);
          else st.m = fix(p.m, EX_LIMITS.m);
        }
        reload();
      }
      if (p.part != null) go(Number(p.part) || 0);
      if (p.playing === true) run();
      if (p.time === 'end') {
        st.phase = 'done';
        render();
        changed();
      }
      if (p.open === false) close();
      return state();
    },
  };
}
