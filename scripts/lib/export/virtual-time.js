// Injected into every frame before any page script (Playwright `addInitScript`), for tests and exports. Time
// then moves only when the driver says so, so screenshots and video frames are the same on every run:
//   performance.now, Date, requestAnimationFrame and timers run on a virtual clock;
//   Math.random is seeded (?seed=…, default 1);
//   CSS animations and transitions are paused and driven by the same clock;
//   sound is off (no AudioContext);
//   the figure's "ready" event is remembered.
// Control it from the driver: await window.__vt.advance(ms, frameMs), window.__vt.now(), window.__vt.ready.
(() => {
  if (window.__vt) return;
  const realSetTimeout = window.setTimeout.bind(window);

  // mulberry32: small, fast, good enough for test data
  let seed = Number(new URLSearchParams(location.search).get('seed') || 1) >>> 0 || 1;
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const EPOCH = Date.UTC(2026, 0, 1, 9, 0, 0); // a fixed wall clock
  let now = 0; // virtual milliseconds since the page started

  const RealDate = Date;
  function VirtualDate(...args) {
    if (!new.target) return new RealDate(EPOCH + now).toString();
    return args.length ? new RealDate(...args) : new RealDate(EPOCH + now);
  }
  VirtualDate.prototype = RealDate.prototype;
  VirtualDate.now = () => EPOCH + now;
  VirtualDate.parse = RealDate.parse;
  VirtualDate.UTC = RealDate.UTC;
  window.Date = VirtualDate;
  performance.now = () => now;

  let nextId = 1;
  const timers = new Map(); // id → { at, fn, args, every }
  let frames = new Map(); // id → callback
  const rethrow = (err) =>
    realSetTimeout(() => {
      throw err;
    });
  window.setTimeout = (fn, ms = 0, ...args) => {
    const id = nextId++;
    timers.set(id, { at: now + Math.max(0, Number(ms) || 0), fn, args, every: 0 });
    return id;
  };
  window.setInterval = (fn, ms = 0, ...args) => {
    const id = nextId++;
    const every = Math.max(1, Number(ms) || 0);
    timers.set(id, { at: now + every, fn, args, every });
    return id;
  };
  window.clearTimeout = window.clearInterval = (id) => void timers.delete(id);
  window.requestAnimationFrame = (fn) => {
    const id = nextId++;
    frames.set(id, fn);
    return id;
  };
  window.cancelAnimationFrame = (id) => void frames.delete(id);
  window.AudioContext = undefined;
  window.webkitAudioContext = undefined;

  // Smooth scrolling runs on the browser's own clock: make every scroll instant.
  const instant = (args) => (args[0] && typeof args[0] === 'object' ? [{ ...args[0], behavior: 'instant' }, ...args.slice(1)] : args);
  for (const [target, names] of [
    [Element.prototype, ['scrollIntoView', 'scrollTo', 'scrollBy', 'scroll']],
    [window, ['scrollTo', 'scrollBy', 'scroll']],
  ]) {
    for (const name of names) {
      const original = target[name];
      if (typeof original === 'function')
        target[name] = function (...args) {
          return original.apply(this, instant(args));
        };
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '*, *::before, *::after { scroll-behavior: auto !important; }';
    document.head.append(style);
  });

  const animationStart = new WeakMap();
  function syncAnimations() {
    for (const a of document.getAnimations?.() || []) {
      if (!animationStart.has(a)) {
        animationStart.set(a, now);
        a.pause();
      }
      a.currentTime = now - animationStart.get(a);
    }
  }

  function runTimers(until) {
    for (;;) {
      let due = null;
      for (const [id, t] of timers) if (t.at <= until && (!due || t.at < due[1].at)) due = [id, t];
      if (!due) return;
      const [id, t] = due;
      now = Math.max(now, t.at);
      if (t.every) t.at += t.every;
      else timers.delete(id);
      try {
        if (typeof t.fn === 'function') t.fn(...t.args);
      } catch (err) {
        rethrow(err);
      }
    }
  }

  // A macrotask that is not clamped like setTimeout: lets promise chains and messages run between frames.
  const channel = new MessageChannel();
  const waiting = [];
  channel.port1.onmessage = () => waiting.shift()?.();
  const yieldTask = () =>
    new Promise((resolve) => {
      waiting.push(resolve);
      channel.port2.postMessage(0);
    });

  window.__vt = {
    ready: null,
    now: () => now,
    /** Moves time on by `ms`, one animation frame every `frameMs` (timers fire in order in between). */
    async advance(ms, frameMs = 1000 / 60) {
      const end = now + ms;
      do {
        const target = Math.min(end, now + frameMs);
        runTimers(target);
        now = target;
        const callbacks = [...frames.values()];
        frames = new Map();
        for (const cb of callbacks) {
          try {
            cb(now);
          } catch (err) {
            rethrow(err);
          }
        }
        syncAnimations();
        await yieldTask();
      } while (now < end);
      return now;
    },
  };
  window.addEventListener('pathshala:ready', (e) => {
    window.__vt.ready = /** @type {CustomEvent} */ (e).detail ?? {};
  });
})();
