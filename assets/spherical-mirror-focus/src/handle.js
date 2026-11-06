// The bulb's visible handle: a white disc with ↔ pinned to the carrier, a faint dashed track for its range, a word and a gentle
// pulse until the first drag, then smaller and calm. The look and the names are those of the kit's createDragHandle (pull request
// #361, not merged yet): when kit 1.7.0 is in, this file goes and app.js imports the kit's. The figure's own drag code on the
// canvas host keeps the pointer; the handle only shows the way and says where a finger may start.
import * as THREE from 'three';
import { svg } from '@shared/student/icons.js';

const HIT = 46; // px across: a finger's target round the 30 px disc
const ARROWS = svg('<path d="M4 12h16M8.2 7.8 4 12l4.2 4.2M15.8 7.8 20 12l-4.2 4.2"/>');
const v = { x: 0, y: 0 };
const q = new THREE.Vector3();

export function createBulbHandle(stage, { point, from, to, label, aria, pulse, when }) {
  const host = stage.canvas.parentElement;
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'lab-dh';
  el.hidden = true;
  el.setAttribute('aria-label', aria);
  el.title = aria;
  el.innerHTML = `<span class="lab-dh-disc">${ARROWS}</span><span class="lab-dh-word">${label}</span>`;
  const glyph = el.querySelector('svg');
  el.classList.toggle('pulse', pulse);
  el.addEventListener('mousedown', (e) => e.preventDefault()); // a press must not take the keyboard's focus

  const track = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  track.classList.add('lab-dh-track');
  track.setAttribute('aria-hidden', 'true');
  track.style.display = 'none';
  const halo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const dash = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  halo.classList.add('halo');
  dash.classList.add('dash');
  track.append(halo, dash);
  host.append(track, el);

  const project = (p) => {
    q.copy(p).project(stage.camera);
    v.x = (q.x * 0.5 + 0.5) * stage.width;
    v.y = (-q.y * 0.5 + 0.5) * stage.height;
    return q.z < 1 && q.z > -1;
  };
  let shown = false;
  let px = 0;
  let py = 0;
  const box = { left: 0, top: 0, right: 0, bottom: 0 };
  const boxes = Array.from({ length: 6 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const a = { x: 0, y: 0 };
  const b = { x: 0, y: 0 };
  const list = [box, ...boxes];
  const none = [];
  let was = false;

  function place() {
    const ok = when() && project(point());
    was = when();
    if (ok !== shown) {
      shown = ok;
      el.hidden = !ok;
      track.style.display = ok ? '' : 'none';
    }
    if (!ok) return;
    px = Math.round(Math.min(Math.max(v.x, HIT / 2 + 2), stage.width - HIT / 2 - 2));
    py = Math.round(Math.min(Math.max(v.y, HIT / 2 + 2), stage.height - HIT / 2 - 2));
    el.style.transform = `translate(${px - HIT / 2}px, ${py - HIT / 2}px)`;
    project(from());
    a.x = v.x;
    a.y = v.y;
    project(to());
    b.x = v.x;
    b.y = v.y;
    glyph.style.transform = `rotate(${Math.round((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI)}deg)`;
    const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    halo.setAttribute('d', d);
    dash.setAttribute('d', d);
  }
  stage.onAfterRender(place);
  // nothing may be drawn when the step ends (render on demand): the condition is looked at every frame, the handle placed when it changes
  stage.addTicker(() => {
    if (when() !== was) place();
  });

  return {
    el,
    /** Whether the point (canvas pixels) is on the handle's target. */
    hit: (x, y) => shown && Math.abs(x - px) <= HIT / 2 && Math.abs(y - py) <= HIT / 2,
    markUsed() {
      el.classList.add('used');
      el.classList.remove('pulse');
    },
    rearm() {
      el.classList.remove('used');
      el.classList.toggle('pulse', pulse);
    },
    /** Boxes to keep labels off: the handle and its word, and points along the track. */
    box() {
      if (!shown) return none;
      box.left = px - 34;
      box.right = px + 34;
      box.top = py - 18;
      box.bottom = py + 40;
      for (let i = 0; i < boxes.length; i++) {
        const r = boxes[i];
        const x = a.x + ((b.x - a.x) * i) / 5;
        const y = a.y + ((b.y - a.y) * i) / 5;
        r.left = x - 6;
        r.right = x + 6;
        r.top = y - 6;
        r.bottom = y + 6;
      }
      return list;
    },
  };
}
