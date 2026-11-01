// "How big is it?": a self-playing zoom from a student down to a quark and up to a galaxy, with the SI prefix of
// each size (textbook page 17, topic 1.5.2, Table 1.05). Students can also tap a stop in the strip under the
// view, or an object in the picture, and it flies there.
//
// Layout: the 3D view on top with only short labels on it (a scale bar, a few pins); under it one strip with the
// caption (the prefix, the object, its size in Bangla and in 10ⁿ m) and the controls (play/pause and the 17 stops,
// which are the rows of Table 1.05, smallest first).
//
// The objects sit side by side in one row at their true sizes (metres). The camera never travels those
// distances: every frame, each object is scaled by (10 / view width in metres) and placed relative to the
// point we look at, so everything the GPU sees is a few units across, at any zoom. Frames are drawn only while
// something moves (playing, or flying to a chosen stop); paused or finished, nothing is drawn.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { ICONS } from '@shared/student/icons.js';
import { backdropOf, createBackdrop, mixBackdrop } from './backdrop.js';
import { createI18n, PREFIXES, SEQUENCE, STOPS } from './i18n.js';
import { buildObject } from './objects.js';

export const DEFAULTS = {
  lang: 'bn',
  autoplay: true,
  loop: true,
  speed: 1,
  bg: 'light',
  ladder: true, // show 10ⁿ on the stop buttons
  start: null, // a stop id to begin on, e.g. 'earth'
};

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
  o.speed = Number(o.speed) > 0 ? Number(o.speed) : 1;
  const t = createI18n(o.lang);
  const N = t.num;
  const prefixName = (key) => (key === 'base' ? t('base_name') : t(`p_${key}`));
  const expOf = Object.fromEntries(PREFIXES.map((p) => [p.key, p.exp]));
  root.classList.add('pvc', 'hb');
  root.lang = t.lang;
  root.dataset.theme = o.bg === 'transparent' ? 'transparent' : 'light';
  root.dataset.ladder = o.ladder ? 'on' : 'off';

  root.innerHTML = `
    <div class="pvc-stage hb-stage">
      <div class="hb-canvas"></div>
      <div class="hb-pins"></div>
      <div class="hb-scale" aria-hidden="true"><i></i><span></span></div>
    </div>
    <div class="pvc-panel hb-panel">
      <p class="hb-live" aria-live="polite"></p>
      <div class="hb-cap">
        <div class="hb-head"><span class="hb-chip"></span><span class="hb-name"></span></div>
        <div class="hb-size"></div>
        <div class="hb-sci"></div>
      </div>
      <div class="hb-controls">
        <button class="pvc-btn hb-play" type="button"></button>
        <nav class="hb-strip" aria-label="${t('choose')}"><div class="hb-strip-track">${STOPS.map(
          (s) =>
            `<button type="button" data-go="${s.id}"><b>${prefixName(s.prefix)} <em>10${sup(expOf[s.prefix])}</em></b><small>${t(`${s.id}_short`)}</small></button>`,
        ).join('')}</div></nav>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const el = {
    stage: $('.hb-stage'),
    canvas: $('.hb-canvas'),
    pins: $('.hb-pins'),
    play: $('.hb-play'),
    strip: $('.hb-strip'),
    chips: [...root.querySelectorAll('.hb-strip button')],
    cap: $('.hb-cap'),
    live: $('.hb-live'),
    chip: $('.hb-chip'),
    name: $('.hb-name'),
    size: $('.hb-size'),
    sci: $('.hb-sci'),
    bar: $('.hb-scale i'),
    barText: $('.hb-scale span'),
  };

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(el.canvas, { fov: 30, near: 0.05, far: 4000, environment: 'studio-light' });
  const { scene, camera, controls } = stage;
  controls.enabled = false; // an animation, not a viewer
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-4, 6, 8);
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0xdde3ea, 0.5));
  const backdrop = createBackdrop();
  if (o.bg !== 'transparent') scene.add(backdrop.object);

  // Lay the stops out in one row, smallest first. Each one sits just beside the next one's edge, so while
  // zooming something is always in view, and at each stop the previous one is a speck right next to it.
  const stops = STOPS.map((s) => ({ ...s, ...buildObject(s.id), bg: backdropOf(s.id) }));
  const byId = Object.fromEntries(stops.map((s) => [s.id, s]));
  let x = 0;
  stops.forEach((s, i) => {
    // far enough that the bigger one stays out of the picture while we look at the smaller (tall ones too)
    if (i) x += 3 * Math.max(stops[i - 1].w, stops[i - 1].h) + 0.04 * s.w + s.w / 2;
    s.x = x;
    scene.add(s.group);
  });
  const rowOf = Object.fromEntries(PREFIXES.map((p, i) => [p.key, i]));
  const stopOfRow = PREFIXES.map((p) => stops.find((s) => s.prefix === p.key));

  /** Metres across the whole canvas width that make this stop fill the view nicely. */
  function frameWidth(s) {
    const fill = 0.66;
    return Math.max(s.w / fill, (s.h * stage.width) / (fill * stage.height));
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
  const startTime = () => (o.start && byId[o.start] ? (timeline.find((s) => s.type === 'hold' && s.id === o.start)?.start ?? 0) : 0);

  let time = startTime();
  let playing = !!o.autoplay;

  function segmentAt(tt) {
    let tm = o.loop ? tt % total : Math.min(tt, total - 1e-6); // (not ((t % T) + T) % T: that rounds a stop's start into the move before it)
    if (tm < 0) tm += total;
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
  let clock = 0;
  const bgNow = new Array(9).fill(0);

  /** Where the camera is, what is in focus, which row of the table we are near — for the current time. */
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
          row: lerp(from.row, rowOf[b.prefix], u),
          journey: null,
          goingTo: b,
          prev: null,
          seg: null,
          bg: mixBackdrop(bgNow, from.bg, b.bg, u),
        };
      }
      time = flight.seg.start + 0.4;
      flight = null;
    }
    const { seg, local } = segmentAt(time);
    if (seg.type === 'hold') {
      const s = byId[seg.id];
      return { W: frameWidth(s), camX: s.x, pitch: s.pitch, focus: s, row: rowOf[s.prefix], journey: null, prev: null, seg, bg: s.bg };
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
      row: lerp(rowOf[a.prefix], rowOf[b.prefix], u),
      journey: seg.journey,
      goingTo: null,
      next: b,
      prev: a,
      seg,
      bg: mixBackdrop(bgNow, a.bg, b.bg, ease(tt)),
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
    camera.updateProjectionMatrix();
    backdrop.set(v.bg, v.W, stage.width, stage.height);
  }

  // ── the strip under the view: caption and stops (written only when something changes) ──
  function chipHTML(s) {
    const exp = sup(expOf[s.prefix]);
    return s.prefix === 'base' ? `<b>${t('base_name')}</b> m · 10${exp} · ${t('base_note')}` : `<b>${t(`p_${s.prefix}`)}</b> ${s.prefix} · 10${exp}`;
  }
  /** One of three kinds of caption: a stop, a move (journey + what is next), a flight to a chosen stop. */
  function writeCaption(kind, s, journey) {
    if (kind === 'stop') {
      el.chip.innerHTML = chipHTML(s);
      el.name.textContent = t(`${s.id}_name`);
      el.size.textContent = t(`${s.id}_size`);
      const note = t(`${s.id}_note`);
      el.sci.innerHTML = `= ${t(`${s.id}_sci`)}${note ? ` <small>· ${note}</small>` : ''}`;
    } else {
      el.chip.innerHTML = chipHTML(s);
      el.name.textContent = kind === 'move' ? t(journey) : t('going', { name: t(`${s.id}_short`) });
      el.size.textContent = kind === 'move' ? t('next', { name: t(`${s.id}_short`) }) : '';
      el.sci.innerHTML = '&nbsp;';
    }
    root.dataset.caption = kind;
  }
  /** Keep room for the tallest caption, so the strip (and the 3D view above it) never changes height. */
  let reservedFor = '';
  function reserveCaption() {
    const keyNow = `${root.clientWidth}x${root.clientHeight}`;
    if (keyNow === reservedFor || !root.clientWidth) return;
    reservedFor = keyNow;
    el.cap.style.minHeight = '';
    let h = 0;
    for (const s of stops) {
      writeCaption('stop', s);
      h = Math.max(h, el.cap.offsetHeight);
      for (const j of ['journey_small', 'journey_big', 'journey_home']) {
        writeCaption('move', s, j);
        h = Math.max(h, el.cap.offsetHeight);
      }
    }
    el.cap.style.minHeight = `${h}px`;
    captionKey = null; // write the current one again
  }

  let captionKey = null;
  let spoken = null;
  let chipOn = null;
  let chipPass = null;
  let barKey = '';
  function overlay(v) {
    const passing = v.focus ? null : stopOfRow[Math.round(v.row)] || v.goingTo || v.next;
    const ck = v.focus ? `s:${v.focus.id}` : v.goingTo ? `g:${v.goingTo.id}:${passing.id}` : `m:${v.journey}:${v.next.id}:${passing.id}`;
    if (ck !== captionKey) {
      captionKey = ck;
      if (v.focus) writeCaption('stop', v.focus);
      else if (v.goingTo) writeCaption('fly', v.goingTo);
      else writeCaption('move', v.next, v.journey);
      if (passing) el.chip.innerHTML = chipHTML(passing); // while moving, the chip names the prefix we are passing
      if (v.focus && v.focus.id !== spoken) {
        spoken = v.focus.id; // screen readers hear each stop once, not every prefix that flies past
        el.live.textContent = `${t(`${v.focus.id}_name`)}: ${t(`${v.focus.id}_size`)}`;
      }
    }
    // stops: the one we are on (or flying to) is marked; while moving, the prefix we pass is lit
    const on = v.focus?.id || v.goingTo?.id || null;
    const pass = v.focus ? null : stopOfRow[Math.round(v.row)]?.id || null;
    if (on !== chipOn || pass !== chipPass) {
      chipOn = on;
      chipPass = pass;
      for (const c of el.chips) {
        c.classList.toggle('on', c.dataset.go === on);
        c.classList.toggle('pass', c.dataset.go === pass && pass !== on);
        c.setAttribute('aria-current', c.dataset.go === on ? 'true' : 'false');
      }
      const chip = el.chips.find((c) => c.dataset.go === (on || pass));
      if (chip && el.strip.scrollWidth > el.strip.clientWidth)
        el.strip.scrollTo({ left: chip.offsetLeft - (el.strip.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
    }
    // scale bar: a round length, in the most fitting unit
    const mpp = v.W / stage.width;
    const target = mpp * 90;
    const n = Math.floor(Math.log10(target));
    const m = target / 10 ** n;
    const nice = (m >= 5 ? 5 : m >= 2 ? 2 : 1) * 10 ** n;
    // below 1 attometre there is no smaller prefix: say 0.5, 0.2 … এটোমিটার
    const e = SCALE_UNITS.find((u) => u <= Math.floor(Math.log10(nice) + 1e-9)) ?? -18;
    const value = +(nice / 10 ** e).toPrecision(3);
    const width = (nice / mpp).toFixed(0);
    const grouped = value.toLocaleString(t.lang === 'bn' ? 'en-IN' : 'en-US'); // ১০,০০,০০০ like the captions
    const text = `${N(grouped)} ${t(`u_${UNIT_KEY[e]}`)}`;
    const bk = `${width}|${text}`;
    if (bk !== barKey) {
      barKey = bk;
      el.bar.style.width = `${width}px`;
      el.barText.textContent = text;
    }
  }

  // pins: a dot and a label pinned to a point in 3D (Bangladesh on the Earth, the Sun beside Proxima, …)
  const pinEls = new Map();
  function pin(id, text, x, y, on, go = '') {
    let p = pinEls.get(id);
    if (!p) {
      p = document.createElement('div');
      p.className = 'hb-pin';
      p.innerHTML = '<i></i><span></span>';
      el.pins.appendChild(p);
      p.span = p.lastChild;
      pinEls.set(id, p);
    }
    if (on !== p.on) {
      p.on = on;
      p.classList.toggle('on', on);
    }
    if (!on) return;
    if (p.text !== text) {
      p.text = text;
      p.span.textContent = text;
      p.size = null; // measured again below
    }
    if (p.go !== go) {
      p.go = go;
      p.dataset.go = go;
      p.classList.toggle('go', !!go);
    }
    p.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    shown.push({ p, x, y });
  }
  let shown = [];
  // Labels sit centred above their dots, inside the frame, stacked upward if two would overlap.
  function layoutLabels() {
    for (const s of shown) if (!s.p.size) s.p.size = [s.p.span.offsetWidth, s.p.span.offsetHeight]; // read once per text
    const placed = shown.map(({ x, y }) => ({ x: x - 8, y: y - 8, w: 16, h: 16 })); // never cover a dot
    for (const { p, x, y } of shown) {
      const [w, h] = p.size;
      const lx = Math.min(Math.max(x - w / 2, 6), stage.width - w - 6);
      let ly = y - h - 12;
      for (let guard = 0; guard < 4; guard++) {
        const hit = placed.find((r) => lx < r.x + r.w + 4 && lx + w + 4 > r.x && ly < r.y + r.h + 3 && ly + h + 3 > r.y);
        if (!hit) break;
        ly = hit.y - h - 4;
      }
      if (ly < 6) ly = y + 12;
      placed.push({ x: lx, y: ly, w, h });
      p.span.style.transform = `translate(${(lx - x).toFixed(1)}px, ${(ly - y).toFixed(1)}px)`;
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
    shown = [];
    // Going bigger: the stop we just came from is now too small to see, so show where it is.
    const i = timeline.indexOf(v.seg);
    const arrived = v.focus && timeline[(i - 1 + timeline.length) % timeline.length];
    const prev = arrived?.journey === 'journey_big' && !v.focus.noCompare ? byId[arrived.from] : null;
    let on = false;
    if (prev) {
      const q = project(prev.group);
      const tiny = prev.w / v.W < 0.012;
      const inside = q.x > 8 && q.x < stage.width - 8 && q.y > 8 && q.y < stage.height - 8;
      on = tiny && inside;
      const name = t(prev.id === 'star' ? 'pin_star_cmp' : `pin_${prev.id}`);
      pin('prev', t('here', { name }), q.x, q.y, on, prev.id); // a size comparison, not a location; tap to go there
    } else pin('prev', '', 0, 0, false);
    // The focused stop's own pins.
    const own = v.focus?.pins || [];
    if (own.length) camera.getWorldDirection(camDir);
    for (let k = 0; k < 2; k++) {
      const pp = own[k];
      if (!pp) {
        if (pinEls.has(`f${k}`)) pin(`f${k}`, '', 0, 0, false);
        continue;
      }
      const q = project(pp.object);
      let vis = q.ok;
      if (pp.facing) {
        v.focus.group.getWorldPosition(center);
        pp.object.getWorldPosition(tmp);
        vis = vis && tmp.sub(center).normalize().dot(camDir) < -0.25; // on the side that faces us
      }
      pin(`f${k}`, t(pp.key), q.x, q.y, vis);
    }
    if (shown.length) layoutLabels();
  }

  // ── the loop: draw only while something moves ───────────────────────────────
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  let needs = true; // one frame is wanted even though nothing moves (a seek, a jump, a resize)
  const wake = () => {
    needs = true;
    stage.invalidate();
  };
  let last = performance.now();
  let lastStop = null;
  stage.addTicker((_dt, now) => {
    const dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    if (!playing && !flight && !needs) return false;
    needs = false;
    if (playing && !flight) {
      time += dt * o.speed;
      if (!o.loop && time >= total) {
        time = total; // the end: back at the student; stop drawing
        playing = false;
        syncPlay();
        emit('pause', { time, end: true });
      }
    }
    clock += dt;
    state = view();
    for (const s of stops) if (s.tick && s.group.visible) s.tick(clock, dt, state.focus === s);
    place(state);
    const id = state.focus?.id || null;
    if (id && id !== lastStop) emit('stop', { id, prefix: state.focus.prefix });
    lastStop = id;
    return true;
  });
  stage.onAfterRender(() => {
    if (!state) return;
    overlay(state);
    pins(state);
  });
  // A resize draws at once (inside the stage): frame the stop for the new shape first.
  stage.onResize(() => {
    if (state) {
      state = view();
      place(state);
    }
    wake();
  });
  new ResizeObserver(() => reserveCaption()).observe(root);

  // ── controls ────────────────────────────────────────────────────────────────
  function syncPlay() {
    el.play.innerHTML = playing ? ICONS.pause : ICONS.play;
    el.play.classList.toggle('paused', !playing);
    const label = playing ? t('pause') : t('play');
    el.play.setAttribute('aria-label', label);
    el.play.title = label;
  }
  function play() {
    if (!o.loop && time >= total - 1e-3) time = 0; // finished: start again (a flight in progress lands first)
    playing = true;
    syncPlay();
    wake();
    emit('play', { time });
  }
  function pause() {
    playing = false;
    syncPlay();
    wake();
    emit('pause', { time });
  }
  el.play.addEventListener('click', () => (playing ? pause() : play()));
  document.addEventListener('visibilitychange', () => (last = performance.now()));

  /** Fly to a stop and hold there. Play continues the tour from that stop. */
  function go(id, { animate = true } = {}) {
    const b = byId[id];
    const seg = timeline.find((s) => s.type === 'hold' && s.id === id);
    if (!b || !seg) return false;
    const wasPlaying = playing;
    playing = false;
    syncPlay();
    if (wasPlaying) emit('pause', { time });
    wake();
    if (!flight && state?.focus === b) return true;
    emit('choose', { id });
    if (!animate || !state) {
      flight = null;
      time = seg.start + 0.4;
      return true;
    }
    const orders = Math.abs(Math.log10(frameWidth(b) / state.W));
    flight = {
      from: { W: state.W, camX: state.camX, pitch: state.pitch, row: state.row, bg: state.bg.slice() },
      to: b,
      seg,
      start: clock,
      dur: Math.min(3.2, Math.max(1.1, 1 + 0.3 * orders)),
    };
    return true;
  }
  el.strip.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button[data-go]');
    if (b) go(b.dataset.go);
  });
  el.pins.addEventListener('click', (e) => {
    const p = /** @type {Element} */ (e.target).closest('.hb-pin.go');
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

  // Keyboard: ← smaller, → bigger, space play/pause (a focused button keeps its own space).
  root.tabIndex = 0;
  root.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      if (/** @type {Element} */ (e.target).closest('button')) return;
      e.preventDefault();
      playing ? pause() : play();
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const here = flight?.to || state?.focus || (state && (e.key === 'ArrowRight' ? state.prev : state.next)) || byId.student;
    const i = stops.indexOf(here) + (e.key === 'ArrowRight' ? 1 : -1);
    if (stops[i]) go(stops[i].id);
  });
  syncPlay();
  reserveCaption();

  return {
    play,
    pause,
    /** Fly to a stop and hold there (paused). { animate: false } jumps straight there. */
    goTo: (id, opts) => go(id, opts),
    /** Jump to a time in seconds (keeps playing or paused as it was). */
    seek(seconds) {
      flight = null;
      time = Math.max(0, +seconds || 0);
      wake();
    },
    duration: +total.toFixed(2),
    /** Back to the start, playing if it plays on load. */
    reset() {
      flight = null;
      time = startTime();
      playing = !!o.autoplay;
      syncPlay();
      wake();
    },
    getState: () => ({
      time: +time.toFixed(2),
      duration: +total.toFixed(2),
      playing,
      stop: state?.focus?.id || null,
      flyingTo: flight?.to.id || null,
      stops: cycle.slice(),
    }),
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    /** PNG of the 3D view (the caption and stops are page elements, not in the picture). */
    capture(opts) {
      if (state) place(state);
      return stage.capture(opts);
    },
    stops: cycle.slice(),
    _internals: { stage, stops, timeline },
  };
}
