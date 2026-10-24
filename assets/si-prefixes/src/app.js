// "How big is it?": a self-playing zoom from a student down to a nucleus and up to a galaxy, with the
// SI prefix of each size (textbook page 17, topic 1.5.2, Table 1.05). Students can also tap a prefix in the
// table, a stop in the strip (phones), or an object, and it flies there.
//
// The objects sit side by side in one row at their true sizes (metres). The camera never travels those
// distances: every frame, each object is scaled by (10 / view width in metres) and placed relative to the
// point we look at, so everything the GPU sees is a few units across, at any zoom.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createI18n, STOPS, SEQUENCE, PREFIXES } from './i18n.js';
import { buildObject } from './objects.js';

export const VERSION = '0.3.1';

export const DEFAULTS = {
  lang: 'bn',
  autoplay: true,
  loop: true,
  speed: 1,
  theme: 'light',
  ladder: true,
  start: null, // a stop id to begin on, e.g. 'earth'
};

/** Wait (briefly) for the Bangla webfont. */
export function loadFonts(timeout = 2500) {
  if (!document.fonts?.load) return Promise.resolve();
  const loads = ['400', '600', '700'].map((w) => document.fonts.load(`${w} 16px "Noto Sans Bengali"`, 'অআ০১২')); // check:allow-bangla font sample, not shown
  return Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, timeout))]).catch(() => {});
}

const ease = (u) => u * u * (3 - 2 * u);

/**
 * Progress through a very long zoom (many powers of ten): take time over the first 3 powers (the old object
 * shrinks), rush through the empty middle, then slow down for the last 2 (the new object forms). Monotone
 * cubic through (0,0) (0.35, 3/n) (0.5, 1 − 2/n) (1,1), flat at both ends.
 */
function longZoom(t, n) {
  const xs = [0, 0.35, 0.5, 1];
  const ys = [0, 3 / n, 1 - 2 / n, 1];
  const d = xs.slice(1).map((x, i) => (ys[i + 1] - ys[i]) / (x - xs[i]));
  const m = [0, Math.min(d[0], d[1]) * 1.2, Math.min(d[1], d[2]) * 1.2, 0];
  const i = t < xs[1] ? 0 : t < xs[2] ? 1 : 2;
  const h = xs[i + 1] - xs[i];
  const s = (t - xs[i]) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
}
const lerp = (a, b, u) => a + (b - a) * u;
const SCALE_UNITS = [18, 15, 12, 9, 6, 3, 0, -2, -3, -6, -9, -12, -15, -18]; // units the scale bar may use
const UNIT_KEY = {
  18: 'E',
  15: 'P',
  12: 'T',
  9: 'G',
  6: 'M',
  3: 'k',
  0: 'base',
  '-2': 'c',
  '-3': 'm',
  '-6': 'µ',
  '-9': 'n',
  '-12': 'p',
  '-15': 'f',
  '-18': 'a',
};
const sup = (n) => String(n).replace(/[-0-9]/g, (c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]);

export function createPrefixApp(root, userOptions = {}) {
  const o = { ...DEFAULTS, ...userOptions };
  const t = createI18n(o.lang);
  const N = t.num;
  root.classList.add('hb');
  root.lang = t.lang;
  root.dataset.ladder = o.ladder ? 'on' : 'off';

  root.innerHTML = `
    <div class="hb-canvas"></div>
    <div class="hb-pins"></div>
    <div class="hb-top">
      <button class="hb-play" type="button" aria-label="${t('pause')}" title="${t('pause')}"></button>
      <span class="hb-journey">${t('title')}</span>
      <nav class="hb-strip" aria-label="${t('choose')}"><div class="hb-strip-track">${STOPS.map(
        (s) =>
          `<button type="button" data-go="${s.id}"><b>${s.prefix === 'base' ? t('base_name') : t(`p_${s.prefix}`)}</b><small>${t(`${s.id}_short`)}</small></button>`,
      ).join('')}</div></nav>
    </div>
    <aside class="hb-ladder" aria-label="${t('table')}">
      <div class="hb-ladder-title">${t('table')}<small>${t('tap_hint')}</small></div>
      <ol>${PREFIXES.map((p) => {
        const stop = STOPS.find((s) => s.prefix === p.key);
        return `<li data-p="${p.key}" class="${p.key === 'base' ? 'base' : ''}"${stop ? ` data-stop="${stop.id}" title="${t(`${stop.id}_short`)}"` : ''}>
          <span class="n">${p.key === 'base' ? t('base_name') : t(`p_${p.key}`)}</span>
          <span class="s">${p.key === 'base' ? 'm' : p.key}</span>
          <span class="e">10${sup(p.exp)}</span></li>`;
      }).join('')}</ol>
      <i class="hb-ladder-marker"></i>
    </aside>
    <div class="hb-bottom">
      <div class="hb-caption" aria-live="polite">
        <div class="hb-chip"></div>
        <div class="hb-name"></div>
        <div class="hb-size"></div>
        <div class="hb-sci"></div>
        <div class="hb-note"></div>
      </div>
      <div class="hb-scale"><i></i><span></span></div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const el = {
    canvas: $('.hb-canvas'),
    pins: $('.hb-pins'),
    top: $('.hb-top'),
    play: $('.hb-play'),
    journey: $('.hb-journey'),
    strip: $('.hb-strip'),
    chips: [...root.querySelectorAll('.hb-strip button')],
    ladder: $('.hb-ladder'),
    rows: [...root.querySelectorAll('.hb-ladder li')],
    marker: $('.hb-ladder-marker'),
    bottom: $('.hb-bottom'),
    caption: $('.hb-caption'),
    chip: $('.hb-chip'),
    name: $('.hb-name'),
    size: $('.hb-size'),
    sci: $('.hb-sci'),
    note: $('.hb-note'),
    scale: $('.hb-scale'),
    bar: $('.hb-scale i'),
    barText: $('.hb-scale span'),
  };

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(el.canvas, { fov: 30, near: 0.05, far: 4000, environment: o.theme === 'dark' ? 'studio' : 'studio-light' });
  const { scene, camera, controls } = stage;
  controls.enabled = false; // an animation, not a viewer
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-4, 6, 8);
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0xdde3ea, 0.5));

  // Lay the stops out in one row, smallest first. Each one sits just beside the next one's edge, so while
  // zooming something is always in view, and at each stop the previous one is a speck right next to it.
  const stops = STOPS.map((s) => ({ ...s, ...buildObject(s.id) }));
  const byId = Object.fromEntries(stops.map((s) => [s.id, s]));
  let x = 0;
  stops.forEach((s, i) => {
    // far enough that the bigger one stays out of the picture while we look at the smaller (tall ones too)
    if (i) x += 2 * Math.max(stops[i - 1].w, stops[i - 1].h) + 0.04 * s.w + s.w / 2;
    s.x = x;
    scene.add(s.group);
  });
  const rowOf = Object.fromEntries(PREFIXES.map((p, i) => [p.key, i]));

  // ── layout: the part of the view not covered by the caption / ladder ────────
  const free = { x: 0, y: 0, w: 1, h: 1 };
  function measure() {
    const cw = stage.width;
    const ch = stage.height;
    const top = el.top.offsetTop + el.top.offsetHeight + 6;
    const ladder = el.ladder.offsetParent ? el.ladder.offsetWidth + 16 : 0;
    const bottom = el.bottom.offsetHeight + 8;
    free.x = 0;
    free.y = top;
    free.w = Math.max(80, cw - ladder);
    free.h = Math.max(80, ch - top - bottom);
  }
  stage.onResize(() => requestAnimationFrame(measure));
  const ro = new ResizeObserver(measure);
  ro.observe(el.bottom);
  ro.observe(el.top);

  /** Metres across the whole canvas width that make this stop fill the free area nicely. */
  function frameWidth(s) {
    const cw = stage.width;
    const fill = 0.66;
    return Math.max((s.w * cw) / (fill * free.w), (s.h * cw) / (fill * free.h));
  }

  // ── timeline ────────────────────────────────────────────────────────────────
  // hold → move → hold → … around SEQUENCE; the last move returns to the start.
  const cycle = SEQUENCE[SEQUENCE.length - 1] === SEQUENCE[0] ? SEQUENCE.slice(0, -1) : SEQUENCE.slice();
  const timeline = [];
  let total = 0;
  const journeyOf = (from, to) => {
    if (to === 'student') return 'journey_home';
    return byId[to].w < byId[from].w ? 'journey_small' : 'journey_big';
  };
  cycle.forEach((id, i) => {
    const next = cycle[(i + 1) % cycle.length];
    const hold = id === 'student' ? 2.6 : id === 'nucleus' || id === 'galaxy' ? 3.4 : 2.9;
    timeline.push({ type: 'hold', id, start: total, dur: hold });
    total += hold;
    const orders = Math.abs(Math.log10(byId[next].w / byId[id].w));
    const dur = Math.min(3.6, Math.max(1.7, 1.3 + 0.42 * orders));
    timeline.push({ type: 'move', from: id, to: next, start: total, dur, journey: journeyOf(id, next) });
    total += dur;
  });

  let time = 0;
  let playing = !!o.autoplay;
  if (o.start && byId[o.start]) time = timeline.find((s) => s.type === 'hold' && s.id === o.start)?.start ?? 0;

  function segmentAt(tt) {
    const tm = o.loop ? ((tt % total) + total) % total : Math.min(tt, total - 1e-6);
    let lo = 0;
    let hi = timeline.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (timeline[mid].start <= tm) lo = mid;
      else hi = mid - 1;
    }
    return { seg: timeline[lo], local: tm - timeline[lo].start };
  }

  // A stop the student chose: fly from wherever the view is now, then hold there (paused).
  let flight = null;

  /** Where the camera is, what is in focus, where the ladder marker is — for the current time. */
  function view() {
    if (flight) {
      const { from, to: b } = flight;
      const tt = Math.min(1, (clock - flight.start) / flight.dur);
      const Wb = frameWidth(b);
      const orders = Math.abs(Math.log10(Wb / from.W));
      const u = orders > 6 ? longZoom(tt, orders) : ease(tt);
      const W = from.W * (Wb / from.W) ** u;
      const f = Math.abs(Wb - from.W) < 1e-30 ? u : (W - from.W) / (Wb - from.W);
      if (tt < 1) {
        return {
          W,
          camX: from.camX + (b.x - from.camX) * f,
          pitch: lerp(from.pitch, b.pitch, u),
          focus: null,
          caption: 0,
          row: lerp(from.row, rowOf[b.prefix], u),
          journey: null,
          goingTo: b,
          prev: null,
          seg: null,
        };
      }
      time = flight.seg.start + 0.4;
      flight = null;
      lastJourney = t('title');
    }
    const { seg, local } = segmentAt(time);
    if (seg.type === 'hold') {
      const s = byId[seg.id];
      const fade = Math.min(1, local / 0.35, (seg.dur - local) / 0.35);
      return {
        W: frameWidth(s),
        camX: s.x,
        pitch: s.pitch,
        focus: s,
        caption: Math.max(0, fade),
        row: rowOf[s.prefix],
        journey: null,
        prev: null,
        seg,
      };
    }
    const a = byId[seg.from];
    const b = byId[seg.to];
    const Wa = frameWidth(a);
    const Wb = frameWidth(b);
    const orders = Math.abs(Math.log10(Wb / Wa));
    const tt = Math.min(1, local / seg.dur);
    const u = orders > 6 && seg.journey !== 'journey_home' ? longZoom(tt, orders) : ease(tt);
    const W = Wa * (Wb / Wa) ** u;
    // Pan in proportion to the zoom, so the screen moves evenly (pan while big, then zoom).
    const f = Math.abs(Wb - Wa) < 1e-30 ? u : (W - Wa) / (Wb - Wa);
    return {
      W,
      camX: a.x + (b.x - a.x) * f,
      pitch: lerp(a.pitch, b.pitch, u),
      focus: null,
      caption: 0,
      row: lerp(rowOf[a.prefix], rowOf[b.prefix], u),
      journey: seg.journey,
      prev: a,
      seg,
    };
  }

  // ── per-frame update ────────────────────────────────────────────────────────
  let state = null;
  const tmp = new THREE.Vector3();
  function place(v) {
    const R = 10 / v.W; // render units per metre
    for (const s of stops) {
      const k = s.w / v.W; // share of the canvas width
      s.group.visible = k > 1.2e-3 && k < (s.maxK || 4);
      s.onView?.(k);
      s.group.scale.setScalar(s.w * R); // kept current even when hidden, so pins can find it
      s.group.position.set((s.x - v.camX) * R, 0, 0);
      s.group.updateMatrixWorld();
      if (!s.group.visible) continue;
    }
    // camera: 10 units across the canvas at the point we look at, tilted down by `pitch`
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const tanH = Math.tan(vfov / 2) * camera.aspect;
    const D = 5 / tanH;
    const p = THREE.MathUtils.degToRad(v.pitch);
    camera.position.set(0, D * Math.sin(p), D * Math.cos(p));
    controls.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);
    camera.near = D * 0.02;
    camera.far = D * 20;
    // centre the picture in the free area (not under the caption or ladder)
    const cw = stage.width;
    const ch = stage.height;
    camera.setViewOffset(cw, ch, cw / 2 - (free.x + free.w / 2), ch / 2 - (free.y + free.h / 2), cw, ch);
    camera.updateProjectionMatrix();
  }

  let lastCaption = null;
  let lastJourney = null;
  let lastChip = null;
  function overlay(v) {
    // caption
    if (v.focus && v.focus.id !== lastCaption) {
      lastCaption = v.focus.id;
      const s = v.focus;
      const p = PREFIXES.find((q) => q.key === s.prefix);
      el.chip.innerHTML =
        s.prefix === 'base'
          ? `<b>${t('base_name')}</b> <span>m · 10⁰ · ${t('base_note')}</span>`
          : `<b>${t(`p_${s.prefix}`)}</b> <span>${s.prefix} · 10${sup(p.exp)}</span>`;
      el.name.textContent = t(`${s.id}_name`);
      el.size.textContent = t(`${s.id}_size`);
      el.sci.textContent = `= ${t(`${s.id}_sci`)}`;
      const note = t(`${s.id}_note`);
      el.note.textContent = note;
      el.note.hidden = !note;
    }
    el.caption.style.opacity = v.caption.toFixed(3);
    el.caption.style.transform = `translateY(${((1 - v.caption) * 6).toFixed(1)}px)`;
    // journey label
    const j = v.goingTo ? t('going', { name: t(`${v.goingTo.id}_short`) }) : v.journey ? t(v.journey) : (lastJourney ?? t('title'));
    if (v.journey) lastJourney = t(v.journey);
    if (el.journey.textContent !== j) el.journey.textContent = j;
    // strip (phones): mark the stop we are on or flying to, keep it in sight
    const current = v.focus?.id || v.goingTo?.id || null;
    if (current && current !== lastChip) {
      lastChip = current;
      for (const c of el.chips) c.classList.toggle('on', c.dataset.go === current);
      const chip = el.chips.find((c) => c.dataset.go === current);
      if (chip && el.strip.offsetParent)
        el.strip.scrollTo({ left: chip.offsetLeft - (el.strip.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
    }
    // ladder: highlight the nearest row; slide the marker
    const near = Math.round(v.row);
    el.rows.forEach((r, i) => r.classList.toggle('on', i === near && !!v.focus));
    if (el.ladder.offsetParent) {
      const r0 = el.rows[0];
      const rh = r0.offsetHeight;
      el.marker.style.transform = `translateY(${(r0.offsetTop + v.row * rh).toFixed(1)}px)`;
      el.marker.style.height = `${rh}px`;
    }
    // scale bar: a round length, in the most fitting unit
    const mpp = v.W / stage.width;
    const target = mpp * 100;
    const n = Math.floor(Math.log10(target));
    const m = target / 10 ** n;
    const nice = (m >= 5 ? 5 : m >= 2 ? 2 : 1) * 10 ** n;
    // below 1 attometre there is no smaller prefix: say 0.5, 0.2 … এটোমিটার
    const e = SCALE_UNITS.find((u) => u <= Math.floor(Math.log10(nice) + 1e-9)) ?? -18;
    const value = +(nice / 10 ** e).toPrecision(3);
    el.bar.style.width = `${(nice / mpp).toFixed(1)}px`;
    const grouped = value.toLocaleString(t.lang === 'bn' ? 'en-IN' : 'en-US'); // ১০,০০,০০০ like the captions
    const text = `${N(grouped)} ${t(`u_${UNIT_KEY[e]}`)}`;
    if (el.barText.textContent !== text) el.barText.textContent = text;
  }

  // pins: a dot and a label pinned to a point in 3D (Bangladesh on the Earth, the Sun in the galaxy, …)
  const pinEls = new Map();
  function pin(id, text, x, y, on, go = '') {
    let p = pinEls.get(id);
    if (!p) {
      p = document.createElement('div');
      p.className = 'hb-pin';
      p.innerHTML = '<i></i><span></span>';
      el.pins.appendChild(p);
      pinEls.set(id, p);
    }
    if (p.lastChild.textContent !== text) p.lastChild.textContent = text;
    p.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    p.classList.toggle('on', on);
    p.classList.toggle('go', !!go);
    p.dataset.go = go;
    if (on) shown.push({ p, x, y });
  }
  let shown = [];
  // Labels sit centred above their dots, inside the frame, stacked upward if two would overlap.
  function layoutLabels() {
    const placed = shown.map(({ x, y }) => ({ x: x - 8, y: y - 8, w: 16, h: 16 })); // never cover a dot
    for (const { p, x, y } of shown) {
      const span = p.lastChild;
      const w = span.offsetWidth;
      const h = span.offsetHeight;
      const lx = Math.min(Math.max(x - w / 2, 6), stage.width - w - 6);
      let ly = y - h - 12;
      for (let guard = 0; guard < 4; guard++) {
        const hit = placed.find((r) => lx < r.x + r.w + 4 && lx + w + 4 > r.x && ly < r.y + r.h + 3 && ly + h + 3 > r.y);
        if (!hit) break;
        ly = hit.y - h - 4;
      }
      if (ly < 6) ly = y + 12;
      placed.push({ x: lx, y: ly, w, h });
      span.style.transform = `translate(${(lx - x).toFixed(1)}px, ${(ly - y).toFixed(1)}px)`;
    }
  }
  function project(obj) {
    obj.getWorldPosition(tmp);
    tmp.project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * stage.width, y: (-tmp.y * 0.5 + 0.5) * stage.height, ok: tmp.z < 1 };
  }
  const camDir = new THREE.Vector3();
  const center = new THREE.Vector3();
  function pins(v) {
    const used = new Set();
    shown = [];
    // Going bigger: the stop we just came from is now too small to see, so show where it is.
    const i = timeline.indexOf(v.seg);
    const arrived = v.focus && timeline[(i - 1 + timeline.length) % timeline.length];
    const prev = arrived?.journey === 'journey_big' && !v.focus.noCompare ? byId[arrived.from] : null;
    if (prev) {
      const q = project(prev.group);
      const tiny = prev.w / v.W < 0.012;
      const inside = q.x > 8 && q.x < stage.width - 8 && q.y > 8 && q.y < stage.height - 8;
      const name = t(prev.id === 'star' ? 'pin_star_cmp' : `pin_${prev.id}`);
      pin('prev', t('here', { name }), q.x, q.y, tiny && inside && v.caption > 0.5, prev.id); // a size comparison, not a location; tap to go there
      used.add('prev');
    }
    // The focused stop's own pins.
    if (v.focus?.pins) {
      camera.getWorldDirection(camDir);
      for (const [i, pp] of v.focus.pins.entries()) {
        const q = project(pp.object);
        let on = q.ok && v.caption > 0.5;
        if (pp.facing) {
          v.focus.group.getWorldPosition(center);
          pp.object.getWorldPosition(tmp);
          on = on && tmp.sub(center).normalize().dot(camDir) < -0.25; // on the side that faces us
        }
        pin(`f${i}`, t(pp.key), q.x, q.y, on);
        used.add(`f${i}`);
      }
    }
    for (const [id, p] of pinEls) if (!used.has(id)) p.classList.remove('on');
    layoutLabels();
  }

  let last = performance.now();
  let clock = 0;
  stage.addTicker((_dt, now) => {
    const dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    if (playing && !flight) time += dt * o.speed;
    clock += dt;
    state = view();
    for (const s of stops) if (s.tick && s.group.visible) s.tick(clock, dt, state.focus === s);
    place(state);
    return true; // always animating (objects turn even when paused)
  });
  stage.onAfterRender(() => {
    if (!state) return;
    overlay(state);
    pins(state);
  });

  // ── controls ────────────────────────────────────────────────────────────────
  function syncPlay() {
    el.play.classList.toggle('paused', !playing);
    const label = playing ? t('pause') : t('play');
    el.play.setAttribute('aria-label', label);
    el.play.title = label;
  }
  el.play.addEventListener('click', () => {
    playing = !playing;
    syncPlay();
    emit(playing ? 'play' : 'pause', { time });
  });
  document.addEventListener('visibilitychange', () => (last = performance.now()));

  /** Fly to a stop and hold there. Play continues the tour from that stop. */
  function go(id, { animate = true } = {}) {
    const b = byId[id];
    const seg = timeline.find((s) => s.type === 'hold' && s.id === id);
    if (!b || !seg) return false;
    playing = false;
    syncPlay();
    if (!flight && state?.focus === b) return true;
    emit('choose', { id });
    if (!animate || !state) {
      flight = null;
      time = seg.start + 0.4;
      return true;
    }
    const orders = Math.abs(Math.log10(frameWidth(b) / state.W));
    flight = {
      from: { W: state.W, camX: state.camX, pitch: state.pitch, row: state.row },
      to: b,
      seg,
      start: clock,
      dur: Math.min(3.2, Math.max(1.1, 1 + 0.3 * orders)),
    };
    return true;
  }
  el.ladder.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-stop]');
    if (li) go(li.dataset.stop);
  });
  el.strip.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-go]');
    if (b) go(b.dataset.go);
  });
  el.pins.addEventListener('click', (e) => {
    const p = e.target.closest('.hb-pin.go');
    if (p?.dataset.go) go(p.dataset.go);
  });

  // Tap an object in the picture (not the one in focus) to fly to it.
  const ray = new THREE.Raycaster();
  ray.camera = camera; // needed for the glow sprites
  ray.params.Points.threshold = 0.12;
  const ndc = new THREE.Vector2();
  function stopAt(clientX, clientY) {
    const r = el.canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const visible = stops.filter((s) => s.group.visible);
    for (const h of ray.intersectObjects(
      visible.map((s) => s.group),
      true,
    )) {
      for (let ob = h.object; ob; ob = ob.parent) {
        const s = visible.find((v) => v.group === ob);
        if (s) return s;
      }
    }
    return null;
  }
  let down = null;
  el.canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY, t: performance.now() }));
  el.canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || performance.now() - down.t > 600) return;
    const s = stopAt(e.clientX, e.clientY);
    if (s && s !== state?.focus) go(s.id);
  });
  let hoverQueued = false;
  el.canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      const s = stopAt(e.clientX, e.clientY);
      el.canvas.style.cursor = s && s !== state?.focus ? 'pointer' : '';
    });
  });

  // Keyboard: ← smaller, → bigger, space play/pause.
  root.tabIndex = 0;
  const bySize = stops.slice(); // already smallest first
  root.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      el.play.click();
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const here = flight?.to || state?.focus || state?.prev || byId.student;
    const i = bySize.indexOf(here) + (e.key === 'ArrowRight' ? 1 : -1);
    if (bySize[i]) go(bySize[i].id);
  });
  syncPlay();
  measure();

  // events for the book
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  let lastStop = null;
  stage.addTicker(() => {
    const id = state?.focus?.id || null;
    if (id && id !== lastStop) emit('stop', { id, prefix: state.focus.prefix });
    lastStop = id;
  });

  return {
    version: VERSION,
    play() {
      playing = true;
      syncPlay();
    },
    pause() {
      playing = false;
      syncPlay();
    },
    /** Fly to a stop and hold there (paused). { animate: false } jumps straight there. */
    goTo: (id, opts) => go(id, opts),
    /** Jump to a time in seconds (keeps playing or paused as it was). */
    seek(seconds) {
      time = Math.max(0, +seconds || 0);
    },
    getState: () => ({
      time: +time.toFixed(2),
      duration: +total.toFixed(2),
      playing,
      stop: state?.focus?.id || null,
      flyingTo: flight?.to.id || null,
    }),
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    /** PNG of the 3D view, centred on the whole frame (the caption and table are page elements, not in the picture). */
    capture(opts) {
      const saved = { ...free };
      Object.assign(free, { x: 0, y: 0, w: stage.width, h: stage.height });
      place(view());
      const url = stage.capture(opts);
      Object.assign(free, saved);
      place(view());
      return url;
    },
    stops: cycle.slice(),
    _internals: { stage, stops, timeline },
  };
}
