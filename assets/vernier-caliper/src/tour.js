// "Show me how": a guided walk-through that moves the camera, sets the jaws and colours the scales.
import * as THREE from 'three';
import { HIGHLIGHT, DIM } from './caliper.js';
import { format, formatSigned } from './reading.js';
import { ease } from '@shared/tween.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const css = (c) => `#${c.getHexString()}`;

export function createTour(ctx) {
  const { t, s, ui, caliper, annotations, tweener } = ctx;
  const el = {
    card: ui.tour,
    step: ui.$('.pvc-tour-step'),
    title: ui.$('.pvc-tour-title'),
    body: ui.$('.pvc-tour-body'),
    dots: ui.$('.pvc-tour-dots'),
    prev: ui.$('[data-act="tour-prev"]'),
    next: ui.$('[data-act="tour-next"] span'),
  };

  let steps = [];
  let index = -1;
  let token = 0;
  let scan = null; // transient highlight while scanning the vernier
  let saved = null;
  let lastBody = '';

  const n = () => caliper.divisions;
  const callout = (id, text, point, dx, dy, color) => annotations.add(id, { text, point, dx, dy, kind: 'callout', color: color ? css(color) : undefined });

  function vars(r) {
    const N = r.n;
    return {
      n: N,
      n1: N - 1,
      vsd: ((N - 1) / N).toFixed(N === 10 ? 1 : 2),
      lc: s.lc,
      msr: r.msr,
      vsr: r.vsr,
      value: format(r.observed, s.lc),
      ze: formatSigned(s.zeroError, s.lc),
      corrected: format(r.corrected, s.lc),
      object: t(`sp_${s.specimen?.kind || saved?.specimen?.kind || 'sphere'}`),
    };
  }

  function buildSteps() {
    const list = [
      {
        id: 'intro',
        highlight: () => ({}),
        enter: () => {
          ctx.showParts(true);
          return ctx.setView('3d');
        },
        leave: () => ctx.showParts(false),
      },
      {
        id: 'main',
        highlight: () => ({ mainExtra: [0, 10, 20, 30, 40], mainExtraColor: HIGHLIGHT.msr }),
        enter: () => {
          callout('t-mm', t('c_1mm'), () => V(32.5, DIM.scaleY + 2.2, DIM.beamHalfT), 0, -58);
          callout('t-cm', t('c_1cm'), () => V(10, DIM.scaleY + 4, DIM.beamHalfT), -10, -62, HIGHLIGHT.msr);
          return ctx.focusOn(V(22, 9, DIM.beamHalfT), 120, { dir: new THREE.Vector3(0, 0, 1) });
        },
      },
      {
        id: 'vernier',
        highlight: () => ({ zero: true, vernierExtra: [n()], vernierExtraColor: HIGHLIGHT.zero, mainExtra: [0, n() - 1], mainExtraColor: HIGHLIGHT.msr }),
        enter: async (tk) => {
          if (s.locked) ctx.setLocked(false, { sound: false });
          if (s.specimen) await ctx.setSpecimen(null);
          if (tk !== token) return;
          await ctx.animateGap(0, 0.7);
          if (tk !== token) return;
          const N = n();
          callout('t-vsd', t('c_vsd', { n: N }), () => V(s.zeroError + ((N - 1) * (N - 1)) / N / 2, DIM.scaleY - 4.5, DIM.plateZ), 0, 54, HIGHLIGHT.zero);
          callout('t-msd', t('c_msd', { n: N - 1 }), () => V((N - 1) / 2, DIM.scaleY + 4.6, DIM.beamHalfT), 0, -50, HIGHLIGHT.msr);
          return ctx.focusOn(V((N - 1) / 2, 7, 2.5), THREE.MathUtils.clamp((N + 10) * 2.7, 55, 200), { dir: new THREE.Vector3(0, 0, 1) });
        },
      },
      {
        id: 'lc',
        highlight: () => ({ zero: true, mainExtra: [1], vernierExtra: [1], mainExtraColor: HIGHLIGHT.coincide, vernierExtraColor: HIGHLIGHT.coincide }),
        enter: () => {
          callout('t-gap', t('c_gap', { lc: s.lc }), () => V(s.zeroError + 1 - s.lc / 2, DIM.scaleY, DIM.bevelTop[1]), 0, -64, HIGHLIGHT.coincide);
          return ctx.focusOn(V(1 + s.zeroError, 7, 2.3), 30, { dir: new THREE.Vector3(0, 0, 1) });
        },
      },
      {
        id: 'grip',
        highlight: () => ({}),
        enter: async (tk) => {
          const want = saved.specimen && saved.specimen.mode !== 'depth' ? saved.specimen : { kind: 'sphere' };
          ctx.setView('front');
          if (!s.specimen || s.specimen.kind !== want.kind) await ctx.setSpecimen(want.kind, { size: want.size, hint: false });
          if (tk !== token) return;
          await ctx.closeOnSpecimen();
          if (tk !== token) return;
          ctx.setLocked(true);
        },
      },
      {
        id: 'msr',
        highlight: (r) => ({ msr: r.msr, zero: true }),
        enter: () => {
          const r = ctx.reading();
          callout('t-zero', t('vernier_zero'), () => caliper.points.vernierZero().add(V(0, -3.6, 1.2)), -30, 56, HIGHLIGHT.zero);
          callout('t-msr', t('c_msr', { msr: ctx.reading().msr }), () => V(ctx.reading().msr, DIM.scaleY + 3.5, DIM.beamHalfT), -20, -58, HIGHLIGHT.msr);
          return ctx.focusOn(V(r.observed, 7, 2.3), 70, { dir: new THREE.Vector3(0, 0, 1) });
        },
      },
      {
        id: 'vsr',
        highlight: (r) => ({ msr: r.msr, zero: true, coincide: { main: r.coincideMain, vernier: r.vsr } }),
        enter: async (tk) => {
          const r = ctx.reading();
          const span = (r.vsr * (r.n - 1)) / r.n;
          await ctx.focusOn(V(r.observed + span / 2, 7, 2.3), THREE.MathUtils.clamp((span + 16) * 2.6, 55, 220), { dir: new THREE.Vector3(0, 0, 1) });
          if (tk !== token) return;
          // Sweep along the vernier, comparing each line with the main scale, then stop on the match.
          const total = r.vsr;
          await tweener.animate({
            key: 'tour-scan',
            duration: Math.min(2.4, 0.35 + total * 0.12),
            ease: ease.linear,
            onUpdate: (_k, p) => {
              const k = Math.min(total, Math.floor(p * (total + 1)));
              scan = { msr: r.msr, zero: true, scan: k, mainExtra: [r.msr + k], mainExtraColor: HIGHLIGHT.scan };
              ctx.refresh();
            },
          }).finished;
          scan = null;
          if (tk !== token) return;
          ctx.audio.pop();
          ctx.refresh();
          callout('t-vsr', t('c_vsr', { vsr: ctx.reading().vsr }), () => V(ctx.reading().coincideMain, DIM.scaleY + 4.6, DIM.beamHalfT), 16, -56, HIGHLIGHT.coincide);
        },
      },
      {
        id: 'total',
        highlight: null,
        enter: () => {
          ctx.setGuides(true);
          ui.read.classList.remove('flash');
          void ui.read.offsetWidth;
          ui.read.classList.add('flash');
          return ctx.setView('front');
        },
      },
      {
        id: 'ze',
        when: () => !!s.zeroError,
        highlight: null,
        enter: () => ctx.setView('front'),
      },
      {
        id: 'done',
        highlight: null,
        enter: () => {
          ctx.setLocked(false, { sound: false });
          return ctx.setView('front');
        },
        extra: `<div class="pvc-tour-extra"><button class="pvc-btn primary small" data-act="practice">${t('practice')}</button></div>`,
      },
    ];
    const keys = { intro: 1, main: 2, vernier: 3, lc: 4, grip: 5, msr: 6, vsr: 7, total: 8, ze: 9, done: 10 };
    return list.filter((st) => !st.when || st.when()).map((st) => ({ ...st, key: keys[st.id] }));
  }

  function render() {
    const st = steps[index];
    const r = ctx.reading();
    el.step.textContent = t('tour_step', { i: index + 1, n: steps.length });
    el.title.textContent = t(`t${st.key}_title`);
    const body = t(`t${st.key}_body`, vars(r)) + (st.extra || '');
    if (body !== lastBody) {
      el.body.innerHTML = body;
      lastBody = body;
    }
    el.dots.innerHTML = steps.map((_, i) => `<i class="${i === index ? 'on' : i < index ? 'done' : ''}"></i>`).join('');
    el.prev.disabled = index === 0;
    el.next.textContent = index === steps.length - 1 ? t('done') : t('next');
  }

  async function go(i) {
    if (i < 0 || i >= steps.length) return;
    const tk = ++token;
    steps[index]?.leave?.();
    tweener.cancel('tour-scan');
    scan = null;
    annotations.clear('callout');
    index = i;
    lastBody = '';
    render();
    const st = steps[index];
    ctx.setHighlightOverride((r) => scan || (st.highlight ? st.highlight(r) : null));
    ctx.emit('tour-step', { index, id: st.id, count: steps.length });
    await st.enter?.(tk);
    if (tk === token) render();
  }

  function start() {
    if (s.mode === 'practice') return;
    saved = {
      labels: s.labels,
      guides: s.guides,
      magnifier: s.magnifier,
      specimen: s.specimen ? { kind: s.specimen.kind, size: s.specimen.size, mode: s.specimen.mode } : null,
    };
    s.mode = 'tour';
    ctx.hideHint();
    ctx.setMagnifier(false); // the tour zooms the camera itself
    steps = buildSteps();
    el.card.hidden = false;
    requestAnimationFrame(() => el.card.classList.add('in'));
    ctx.syncUI();
    index = -1;
    go(0);
  }

  function stop() {
    if (s.mode !== 'tour') return;
    token++;
    steps[index]?.leave?.();
    tweener.cancel('tour-scan');
    scan = null;
    annotations.clear('callout');
    el.card.classList.remove('in');
    el.card.hidden = true;
    s.mode = 'explore';
    ctx.setHighlightOverride(null);
    if (saved) {
      ctx.showParts(saved.labels);
      ctx.setGuides(saved.guides || s.guides);
      ctx.setMagnifier(saved.magnifier);
    }
    if (s.locked) ctx.setLocked(false, { sound: false });
    ctx.syncUI();
    ctx.emit('tour-end', { completed: index === steps.length - 1 });
  }

  return {
    start,
    stop,
    get active() {
      return s.mode === 'tour';
    },
    handle(act) {
      if (act === 'tour-close') stop();
      if (act === 'tour-prev') go(index - 1);
      if (act === 'tour-next') {
        if (index >= steps.length - 1) stop();
        else go(index + 1);
      }
    },
    onReading() {
      if (s.mode === 'tour' && index >= 0) render();
    },
  };
}
