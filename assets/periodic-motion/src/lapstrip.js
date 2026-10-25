// The repetitions on a time line: each one a bar as long as the time it took, side by side, the newest on the
// right and the one still running growing at the end, like a strip of paper moving left. Equal bars mean the
// motion repeats after a fixed time (পর্যায়কাল); for a fan slowing down the bars visibly grow. Only whole bars are
// shown: the oldest one fades as it nears the left end and is gone before the edge would cut it.
// Styles: .pm-strip in ../style.css.

const KEEP = 14; // bars kept on the strip (older ones have moved off its left end)
const FADE = 18; // px from the left end over which the oldest bar fades out

/**
 * host: an element to fill; label: HTML for the name on the left (e.g. "প্রতিবারের সময় (সেকেন্ড)").
 * update({ passes, now, span, text }) draws it: passes = times of the passes so far (the first one starts the
 * clock), now = the time now, span = how much time the strip shows, text(v) = a repetition's time as written.
 */
export function createLapStrip(host, label) {
  host.classList.add('pm-strip');
  host.innerHTML = `<span class="pm-strip-k">${label}</span><div class="pm-strip-track"><div class="pm-strip-tape"></div></div>`;
  const track = host.querySelector('.pm-strip-track');
  const tape = host.querySelector('.pm-strip-tape');
  const running = document.createElement('div');
  running.className = 'pm-lap now';
  tape.append(running);
  let width = 0;
  let drawn = ''; // what the bars show: passes, scale
  let bars = []; // { el, left } with left in px along the tape
  new ResizeObserver(() => {
    width = track.clientWidth;
    drawn = '';
  }).observe(track);

  return {
    setLabel(html) {
      host.querySelector('.pm-strip-k').innerHTML = html;
    },
    update({ passes, now, span, text }) {
      const px = width / span;
      const first = passes.length ? passes[0] : now;
      const last = passes.length ? passes[passes.length - 1] : now;
      const key = `${passes.length}|${first}|${last}|${px.toFixed(4)}`;
      if (key !== drawn) {
        drawn = key;
        for (const bar of bars) bar.el.remove();
        bars = [];
        for (let i = Math.max(1, passes.length - KEEP); i < passes.length; i++) {
          const lap = passes[i] - passes[i - 1];
          const el = document.createElement('div');
          el.className = 'pm-lap';
          const left = (passes[i - 1] - first) * px;
          el.style.left = `${left}px`;
          el.style.width = `${Math.max(1, lap * px - 2)}px`;
          if (lap * px > 30) el.textContent = text(lap);
          tape.insertBefore(el, running);
          bars.push({ el, left });
        }
      }
      // the tape moves so that "now" is at the right end
      const shift = width - 2 - (now - first) * px;
      tape.style.transform = `translateX(${shift}px)`;
      // a bar reaching the left end fades and goes, never cut in half
      for (const bar of bars) {
        const x = shift + bar.left;
        bar.el.hidden = x < 0;
        bar.el.style.opacity = x < FADE ? String(Math.max(0, x / FADE)) : '';
      }
      running.hidden = !passes.length;
      running.style.left = `${(last - first) * px}px`;
      running.style.width = `${Math.max(0, (now - last) * px - 2)}px`;
    },
  };
}
