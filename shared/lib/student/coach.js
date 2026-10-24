// First-use pointers for the student view: a hand on the part the student moves (which also moves it a
// little), then a hand on the magnifier's handle (which also moves the magnifier a little). Each hand is
// pinned to a spot that can really be grabbed and follows it as the view, the part or the magnifier moves.
// A pointer goes away once the student has done that action. In the test only the magnifier pointer shows.
//
// The figure says where its part can be grabbed and how to show it moving:
//   object: {
//     label: 'coach_jaw',                 // i18n key for the hand's label
//     candidates: () => [{ x, y }, …],    // canvas pixels, best first
//     grabbable: (p) => bool,             // does a finger at p really take the part? (raycast)
//     demo: async (alive) => {},          // move it a little; stop as soon as alive() is false
//     cancel: () => {},                   // stop a running demo at once (the student touched the view)
//   }

// Fingertip at (9, 1.6) of this box.
const HAND = `<svg viewBox="0 0 24 28" aria-hidden="true"><path d="M9 1.6c1.1 0 2 .9 2 2v8.1l.7-.1c1-.2 2 .5 2.2 1.5l.1.4.5-.1c1-.2 2 .5 2.2 1.5l.1.4.4-.1c1.1-.2 2.1.6 2.3 1.6l.6 3.4c.4 2.5-.4 5-2.2 6.8l-.4.4H8.6l-4.7-6.1c-.7-.9-.6-2.3.3-3.1.9-.8 2.3-.7 3.1.2l.7.8V3.6c0-1.1.9-2 2-2z"/></svg>`;

export function createCoach({ stage, layer, t, loupe, tweener, avoid = [], object }) {
  const hand = document.createElement('div');
  hand.className = 'pvc-coach';
  hand.innerHTML = `<i class="pvc-coach-ring"></i><span class="pvc-coach-hand">${HAND}</span>`;
  const label = document.createElement('div');
  label.className = 'pvc-coach-label';
  layer.append(hand, label);

  const done = { object: false, lens: false };
  let step = null; // 'object' | 'lens' | null
  let mode = 'explore'; // 'explore' | 'quiz'; anything else hides the pointers
  let timer = 0;
  let lensTimeout = 0;
  let demoToken = 0;
  let objectDemo = false; // the part is being moved by the demo
  let lensHeld = false; // the demo froze the magnifier

  function stageRect() {
    return stage.canvas.getBoundingClientRect();
  }

  function blocked(p, sr) {
    for (const el of avoid) {
      const r = el.getBoundingClientRect();
      if (!r.width || getComputedStyle(el).opacity === '0') continue;
      if (p.x > r.left - sr.left - 12 && p.x < r.right - sr.left + 12 && p.y > r.top - sr.top - 12 && p.y < r.bottom - sr.top + 12) return true;
    }
    return false;
  }

  function objectSpot() {
    const sr = stageRect();
    for (const p of object.candidates()) {
      if (!p || p.x < 16 || p.x > stage.width - 16 || p.y < 16 || p.y > stage.height - 48) continue;
      if (blocked(p, sr)) continue;
      if (loupe?.visible && Math.hypot(p.x - loupe.center.x, p.y - loupe.center.y) < loupe.diameter / 2 + 16) continue;
      if (object.grabbable(p)) return p; // a finger here really takes the part
    }
    return null;
  }

  function lensSpot() {
    if (!loupe?.visible) return null;
    const sr = stageRect();
    const hr = loupe.handle.getBoundingClientRect();
    const p = { x: (hr.left + hr.right) / 2 - sr.left, y: (hr.top + hr.bottom) / 2 - sr.top };
    if (p.x > 14 && p.x < stage.width - 14 && p.y > 14 && p.y < stage.height - 14 && !blocked(p, sr)) return p;
    // The handle is cut off at the edge: point at the rim, which can be dragged too.
    const { x, y } = loupe.center;
    const r = loupe.diameter / 2 - 4;
    for (const deg of [180, 0, 135, 45, 225, 315, 90, 270]) {
      const a = (deg * Math.PI) / 180;
      const q = { x: x + r * Math.cos(a), y: y - r * Math.sin(a) };
      if (q.x > 14 && q.x < stage.width - 14 && q.y > 14 && q.y < stage.height - 14 && !blocked(q, sr)) return q;
    }
    return null;
  }

  function hide() {
    hand.classList.remove('in');
    label.classList.remove('in');
  }

  function update() {
    if (!step) return hide();
    const p = step === 'object' ? objectSpot() : lensSpot();
    if (!p) return hide();
    hand.style.transform = `translate(${p.x}px, ${p.y}px)`;
    // Label under the hand if there is room, otherwise above it; always inside the view.
    const w = label.offsetWidth;
    const h = label.offsetHeight;
    let lx = p.x - 12;
    let ly = p.y + 42;
    if (ly + h > stage.height - 6) ly = p.y - 18 - h;
    lx = Math.min(Math.max(lx, 6), stage.width - w - 6);
    ly = Math.min(Math.max(ly, 6), stage.height - h - 6);
    label.style.transform = `translate(${lx}px, ${ly}px)`;
    hand.classList.add('in');
    label.classList.add('in');
  }
  stage.onAfterRender(update);
  stage.onResize(() => stage.invalidate());

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Let the figure move its part a little; the hand rides along. Any touch cancels it.
  async function demoObject() {
    const my = ++demoToken;
    await wait(700);
    if (my !== demoToken || step !== 'object' || !object.demo) return;
    objectDemo = true;
    try {
      await object.demo(() => my === demoToken && step === 'object');
    } finally {
      if (my === demoToken) objectDemo = false;
    }
  }

  function releaseLens() {
    if (!lensHeld) return;
    lensHeld = false;
    loupe.setFrozen(false);
  }

  // Carry the magnifier a little toward the middle of the view and back; the hand rides along.
  async function demoLens() {
    const my = ++demoToken;
    await wait(600);
    if (my !== demoToken || step !== 'lens' || !loupe?.visible) return;
    const c = { ...loupe.center };
    const dx = stage.width / 2 - c.x;
    const dy = stage.height / 2 - c.y;
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.min(44, len) / len;
    loupe.setFrozen(true);
    lensHeld = true;
    const go = (from, to) =>
      tweener.animate({
        key: 'coach-lens',
        duration: 0.7,
        onUpdate: (e) => loupe.moveTo(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e),
      }).finished;
    const away = { x: c.x + dx * k, y: c.y + dy * k };
    if (await go(c, away)) {
      await wait(300);
      if (my === demoToken) await go(away, c);
    }
    if (my === demoToken) releaseLens();
  }

  const allowed = (name) => !done[name] && (name !== 'lens' || !!loupe) && (mode === 'explore' || (mode === 'quiz' && name === 'lens'));

  function later(name, ms) {
    clearTimeout(timer);
    timer = setTimeout(() => !step && show(name), ms);
  }

  function show(name) {
    if (!allowed(name)) return;
    step = name;
    label.textContent = t(name === 'object' ? object.label : 'coach_lens');
    stage.invalidate();
    if (name === 'object') demoObject();
    else {
      demoLens();
      clearTimeout(lensTimeout);
      lensTimeout = setTimeout(() => step === 'lens' && finish('lens'), 14000); // it has made its point
    }
  }

  function finish(name) {
    done[name] = true;
    if (step === name) {
      step = null;
      demoToken++;
      hide();
    }
    // The part's pointer waits its turn if the magnifier one came first (e.g. the student went straight to the test).
    if (name === 'lens' && allowed('object')) later('object', 1500);
  }

  return {
    /** Start with the first pointer the student still needs. */
    start(delay = 900) {
      later(allowed('object') ? 'object' : 'lens', delay);
    },
    /** The student moved the part (drag, wheel or keys). The magnifier pointer comes next, once they let go. */
    objectUsed() {
      if (done.object) return;
      finish('object');
      clearTimeout(timer);
    },
    objectReleased() {
      if (!done.lens && !step) later('lens', 1400);
    },
    /** The student grabbed the magnifier. */
    lensUsed() {
      this.interrupt();
      finish('lens');
      clearTimeout(timer);
    },
    /** Any touch on the view stops a running demo, so it never fights the student's finger. */
    interrupt() {
      demoToken++;
      if (objectDemo) object.cancel?.();
      objectDemo = false;
      tweener.cancel('coach-lens');
      releaseLens();
    },
    /** Follow the app's mode: the test shows only the magnifier pointer, once the object is clamped. */
    setMode(next) {
      if (next === mode) return;
      mode = next;
      this.interrupt();
      clearTimeout(timer);
      if (step && !allowed(step)) {
        step = null;
        hide();
      }
      if (step) return stage.invalidate();
      if (mode === 'quiz') later('lens', 2600);
      else if (mode === 'explore') this.start(1200);
    },
    get step() {
      return step;
    },
    dispose() {
      clearTimeout(timer);
      clearTimeout(lensTimeout);
      hand.remove();
      label.remove();
    },
  };
}
