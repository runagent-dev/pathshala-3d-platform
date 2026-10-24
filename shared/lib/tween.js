/** Tiny frame-driven animation helper. Call tick(dt) from the stage loop; it returns true while busy. */
export const ease = {
  linear: (t) => t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t) => {
    const c1 = 1.4;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export function createTweener() {
  const active = new Map(); // key → tween
  let seq = 0;

  /**
   * animate({ duration, ease, key, delay, onUpdate(k), onComplete })
   * `key` cancels any running tween with the same key (e.g. "camera").
   * Returns { cancel(), finished: Promise<boolean> } — resolves true if it ran to the end.
   */
  function animate({ duration = 0.6, ease: fn = ease.inOutCubic, key, delay = 0, onUpdate, onComplete }) {
    const k = key ?? `__${++seq}`;
    active.get(k)?.cancel();
    let resolve;
    const finished = new Promise((r) => (resolve = r));
    const tween = {
      t: -delay,
      cancel() {
        if (active.get(k) === tween) active.delete(k);
        resolve(false);
      },
      step(dt) {
        tween.t += dt;
        if (tween.t < 0) return;
        const p = duration <= 0 ? 1 : Math.min(1, tween.t / duration);
        onUpdate?.(fn(p), p);
        if (p >= 1) {
          active.delete(k);
          onComplete?.();
          resolve(true);
        }
      },
    };
    active.set(k, tween);
    return { cancel: tween.cancel, finished };
  }

  return {
    animate,
    tick(dt) {
      if (!active.size) return false;
      for (const t of [...active.values()]) t.step(dt);
      return true;
    },
    cancel(key) {
      active.get(key)?.cancel();
    },
    get busy() {
      return active.size > 0;
    },
  };
}
