// An animation as a pure function of time. `render(t)` draws the state at t seconds, whatever was shown before,
// so the animation can jump anywhere (a student taps a part, the book seeks), loop, and be exported to video
// frame by frame exactly (the exporter calls seek for each frame).
//
//   const tl = createTimeline({ duration: 12, render: (t) => { sun.position.x = lerp(-5, 5, segment(t, 2, 8)); } });
//   stage.addTicker((dt) => tl.tick(dt));
//   tl.play(); tl.seek(4.5); tl.pause();

export const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** Progress 0…1 of the part of the timeline from `start` to `end` seconds. */
export const segment = (t, start, end) => (end <= start ? (t >= end ? 1 : 0) : clamp01((t - start) / (end - start)));

/** Which of a list of { at } marks (seconds, in order) the time is in: its index, or -1 before the first. */
export function markAt(marks, t) {
  let i = -1;
  while (i + 1 < marks.length && marks[i + 1].at <= t) i++;
  return i;
}

/**
 * @param {{ duration: number, render: (t: number) => void, loop?: boolean, speed?: number, onEnd?: () => void }} options
 */
export function createTimeline({ duration, render, loop = true, speed = 1, onEnd }) {
  if (!(duration > 0)) throw new Error('createTimeline needs a duration in seconds');
  let time = 0;
  let playing = false;
  let rate = speed;

  function seek(t) {
    time = loop ? ((t % duration) + duration) % duration : Math.min(duration, Math.max(0, t));
    render(time);
    return time;
  }

  return {
    get time() {
      return time;
    },
    get duration() {
      return duration;
    },
    get playing() {
      return playing;
    },
    set speed(v) {
      rate = v;
    },
    play() {
      if (!loop && time >= duration) time = 0;
      playing = true;
    },
    pause() {
      playing = false;
    },
    seek,
    /** Call every frame with the frame time in seconds; returns true while it needs drawing. */
    tick(dt) {
      if (!playing) return false;
      const next = time + dt * rate;
      if (!loop && next >= duration) {
        seek(duration);
        playing = false;
        onEnd?.();
        return true;
      }
      seek(next);
      return true;
    },
  };
}
