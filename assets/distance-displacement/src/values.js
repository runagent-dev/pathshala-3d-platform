// The two values on the map, placed on the screen every frame where they cover nothing: the distance beside the
// rider, like a trip meter, and the displacement beside its arrow (never on it), or, back at A where the arrow is
// gone, "সরণ ০" beside A. Each keeps clear of the other, of the arrow, of the road (the blue path), of the cyclist, of
// the posts' plates, of the buttons in the corner and of the action's ring and badge; a value that finds no free place is left out (the panel
// always shows both). They look like the kit's callouts (student.css), but the kit's annotations sit at a fixed
// offset from their point, and these have to move round.

const GAP = 8; // px between a value and what it stands beside (the arrow is a few px wide)

/** layer: the stage's label layer; colors: { distance, displacement }. */
export function createValueTags(layer, colors) {
  const make = (color) => {
    const el = document.createElement('div');
    el.className = 'pvc-anno pvc-anno-callout dd-tag';
    el.style.setProperty('--c', color);
    layer.appendChild(el);
    return { el, text: '', w: 0, h: 0, shown: false, pick: -1, x: 0, y: 0 };
  };
  const dist = make(colors.distance);
  const disp = make(colors.displacement);

  /** The text to show, or null to hide it. Measures it when it changes. */
  function setText(tag, text) {
    if (text === tag.text) return;
    tag.text = text ?? '';
    if (text == null) return;
    tag.el.textContent = text;
    tag.w = tag.el.offsetWidth;
    tag.h = tag.el.offsetHeight;
  }

  function show(tag, on) {
    if (on === tag.shown) return;
    tag.shown = on;
    tag.el.classList.toggle('in', on);
  }

  const overlaps = (r, q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0;
  /** Does the segment a–b cross the rectangle grown by `pad` px? (clipping the segment to it, Liang–Barsky) */
  const span = { t0: 0, t1: 1 };
  const clip = (p, q) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) span.t0 = Math.max(span.t0, t);
    else span.t1 = Math.min(span.t1, t);
    return span.t0 <= span.t1;
  };
  function nearSegment(r, a, b, pad) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    span.t0 = 0;
    span.t1 = 1;
    return clip(-dx, a.x - (r.x0 - pad)) && clip(dx, r.x1 + pad - a.x) && clip(-dy, a.y - (r.y0 - pad)) && clip(dy, r.y1 + pad - a.y);
  }

  const rect = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const placed = { x0: 0, y0: 0, x1: 0, y1: 0 };
  /**
   * Find a place for tag among candidate centres (cand(i) → { x, y } or null, i = 0…n−1), keeping the last one
   * while it is still free. Returns true if it found one.
   */
  function place(tag, n, cand, free) {
    const at = (i) => {
      const c = cand(i);
      if (!c) return false;
      rect.x0 = c.x - tag.w / 2;
      rect.x1 = c.x + tag.w / 2;
      rect.y0 = c.y - tag.h / 2;
      rect.y1 = c.y + tag.h / 2;
      return free(rect);
    };
    let pick = tag.pick >= 0 && tag.pick < n && at(tag.pick) ? tag.pick : -1;
    for (let i = 0; pick < 0 && i < n; i++) if (at(i)) pick = i;
    tag.pick = pick;
    if (pick < 0) return false;
    tag.x = rect.x0;
    tag.y = rect.y0;
    tag.el.style.transform = `translate(${Math.round(rect.x0)}px, ${Math.round(rect.y0)}px)`;
    return true;
  }

  const OFFSETS = [
    [0, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
    [1, -1],
    [-1, -1],
    [1, 1],
    [-1, 1],
  ];
  const c = { x: 0, y: 0 };
  /**
   * Place both. view: { width, height, top (px kept free at the top right for the buttons, and its left edge
   * cornerX), cyclist ({ x0, y0, x1, y1 }), arrow ({ a: { x, y }, b: { x, y } } or null), origin (A on the screen,
   * { x, y }), plates ([rects]), keep ([rects]: more to keep clear of), road (the road on the screen: x0, y0, x1,
   * y1, …) and roadPad (px: half its width) }; texts: { dist, disp } (null hides).
   */
  let v = null; // the view being placed in (update's argument)
  const sa = { x: 0, y: 0 };
  const sb = { x: 0, y: 0 };
  let distPlaced = false;
  function clearOf(r) {
    if (r.x0 < 4 || r.y0 < 4 || r.x1 > v.width - 4 || r.y1 > v.height - 4) return false;
    if (r.y0 < v.top && r.x1 > v.cornerX) return false; // under the buttons in the corner
    if (overlaps(r, v.cyclist)) return false;
    if (distPlaced && overlaps(r, placed)) return false;
    for (const q of v.plates) if (overlaps(r, q)) return false;
    for (const q of v.keep) if (overlaps(r, q)) return false;
    if (v.arrow && nearSegment(r, v.arrow.a, v.arrow.b, 3)) return false;
    // nor on the road (the blue path is drawn on it): its points on the screen, x0, y0, x1, y1, …
    const road = v.road;
    if (road)
      for (let i = 0; i + 3 < road.length; i += 2) {
        sa.x = road[i];
        sa.y = road[i + 1];
        sb.x = road[i + 2];
        sb.y = road[i + 3];
        if (nearSegment(r, sa, sb, v.roadPad ?? 4)) return false;
      }
    return true;
  }

  function update(view, texts) {
    setText(dist, texts.dist);
    setText(disp, texts.disp);
    v = view;
    const { cyclist, arrow } = view;
    distPlaced = false;

    /** Candidate centres round a box (8 sides and corners, then a little further out). */
    const around = (tag, box) => (i) => {
      const [ox, oy] = OFFSETS[i % OFFSETS.length];
      const gap = i < OFFSETS.length ? GAP : GAP + 18;
      c.x = ox ? (ox > 0 ? box.x1 + gap + tag.w / 2 : box.x0 - gap - tag.w / 2) : (box.x0 + box.x1) / 2;
      c.y = oy ? (oy > 0 ? box.y1 + gap + tag.h / 2 : box.y0 - gap - tag.h / 2) : (box.y0 + box.y1) / 2;
      return c;
    };

    // the distance: beside the rider
    if (texts.dist != null) {
      const ok = place(dist, OFFSETS.length * 2, around(dist, cyclist), clearOf);
      if (ok) {
        placed.x0 = dist.x - 3;
        placed.y0 = dist.y - 3;
        placed.x1 = dist.x + dist.w + 3;
        placed.y1 = dist.y + dist.h + 3;
        distPlaced = true;
      }
      show(dist, ok);
    } else show(dist, false);

    // a zero displacement (back at A): beside A, clear of the distance
    if (texts.disp != null && !arrow && view.origin) {
      const o = view.origin;
      const box = {
        x0: Math.min(o.x - 10, cyclist.x0),
        y0: Math.min(o.y - 10, cyclist.y0),
        x1: Math.max(o.x + 10, cyclist.x1),
        y1: Math.max(o.y + 10, cyclist.y1),
      };
      show(disp, place(disp, OFFSETS.length * 2, around(disp, box), clearOf));
      return;
    }

    // the displacement: beside the middle of its arrow, when the arrow is longer on screen than the value
    if (texts.disp != null && arrow) {
      const dx = arrow.b.x - arrow.a.x;
      const dy = arrow.b.y - arrow.a.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / (len || 1);
      const uy = dy / (len || 1);
      const along = Math.abs(ux) * disp.w + Math.abs(uy) * disp.h; // the value's length along the arrow
      const across = (Math.abs(uy) * disp.w + Math.abs(ux) * disp.h) / 2; // half its depth across it
      const T = [0.5, 0.4, 0.6, 0.3, 0.7];
      const ok =
        len > along + 20 &&
        place(
          disp,
          T.length * 2,
          (i) => {
            const t = T[i >> 1];
            const side = i % 2 ? -1 : 1;
            c.x = arrow.a.x + dx * t - uy * side * (across + GAP);
            c.y = arrow.a.y + dy * t + ux * side * (across + GAP);
            return c;
          },
          clearOf,
        );
      show(disp, ok);
    } else show(disp, false);
  }

  return { update };
}
