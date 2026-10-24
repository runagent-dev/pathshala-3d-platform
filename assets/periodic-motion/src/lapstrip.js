// The repetitions on a time line: each one a bar as long as the time it took, side by side, the newest on the
// right and the one still running growing at the end, like a strip of paper moving left. Equal bars mean the
// motion repeats after a fixed time (পর্যায়কাল); for a fan slowing down the bars visibly grow.
// Styles: .pm-strip in ../style.css.

const KEEP = 14; // bars kept on the strip (older ones have moved off its left end)

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
        for (const el of [...tape.querySelectorAll('.pm-lap:not(.now)')]) el.remove();
        for (let i = Math.max(1, passes.length - KEEP); i < passes.length; i++) {
          const lap = passes[i] - passes[i - 1];
          const bar = document.createElement('div');
          bar.className = 'pm-lap';
          bar.style.left = `${(passes[i - 1] - first) * px}px`;
          bar.style.width = `${Math.max(1, lap * px - 2)}px`;
          if (lap * px > 30) bar.textContent = text(lap);
          tape.insertBefore(bar, running);
        }
      }
      // the tape moves so that "now" is at the right end
      tape.style.transform = `translateX(${width - 2 - (now - first) * px}px)`;
      running.hidden = !passes.length;
      running.style.left = `${(last - first) * px}px`;
      running.style.width = `${Math.max(0, (now - last) * px - 2)}px`;
    },
  };
}
