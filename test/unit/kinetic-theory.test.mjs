// The maths of the kinetic-theory animation (book page 153, topic 5.6.1): molecules bouncing between walls, when one
// last hit the wall, the molecule clock that slows, pauses and speeds up without jumps, the balloon's size, and the
// strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CUES, STEPS, STRINGS, createI18n } from '../../assets/kinetic-theory/src/i18n.js';
import { balloonScale, bounce, bounceDir, clock, clockRate, random, sinceHitHi, smooth, windowed } from '../../assets/kinetic-theory/src/motion.js';

describe('kinetic-theory: a molecule bouncing between two walls', () => {
  it('stays between the walls and comes back with the same speed', () => {
    const rnd = random(3);
    for (let k = 0; k < 50; k++) {
      const p0 = rnd() * 2 - 1;
      const v = (rnd() - 0.5) * 3;
      let last = bounce(p0, v, 0, -1, 1);
      for (let t = 0.01; t < 10; t += 0.01) {
        const p = bounce(p0, v, t, -1, 1);
        assert.ok(p >= -1 - 1e-9 && p <= 1 + 1e-9);
        assert.ok(Math.abs(p - last) <= Math.abs(v) * 0.01 + 1e-9, 'never jumps: a speed of |v| all the time');
        last = p;
      }
    }
  });

  it('reverses at a wall', () => {
    assert.equal(bounceDir(0, 1, 0.5, -1, 1), 1);
    assert.equal(bounceDir(0, 1, 1.5, -1, 1), -1);
    assert.ok(Math.abs(bounce(0, 1, 1, -1, 1) - 1) < 1e-12);
    assert.ok(Math.abs(bounce(0, 1, 2, -1, 1) - 0) < 1e-12);
  });

  it('knows when it last touched the upper wall (checked step by step)', () => {
    const rnd = random(5);
    for (let k = 0; k < 30; k++) {
      const p0 = rnd() * 2 - 1;
      const v = (rnd() < 0.5 ? -1 : 1) * (0.3 + rnd());
      let lastHit = Number.NEGATIVE_INFINITY;
      const dt = 1e-3;
      for (let t = 0; t < 8; t += dt) {
        // it turns round at the upper wall: moving up a moment ago, moving down now
        if (t > 0 && bounceDir(p0, v, t - dt, -1, 1) > 0 && bounceDir(p0, v, t, -1, 1) < 0) lastHit = t;
        if (t > 0.5 && Number.isFinite(lastHit)) {
          const age = sinceHitHi(p0, v, t, -1, 1);
          assert.ok(Math.abs(age - (t - lastHit)) < 3 * dt, `p0 ${p0} v ${v} t ${t}: ${age} vs ${t - lastHit}`);
        }
      }
    }
    assert.equal(sinceHitHi(0, 1, 0.5, -1, 1), Number.POSITIVE_INFINITY, 'not yet');
  });
});

describe('kinetic-theory: the molecule clock', () => {
  const keys = [
    [2, 1],
    [3, 0.5],
    [4, 0],
    [5, 0],
    [6, 2],
  ];
  it('runs at 1 before the first key and at the last rate after', () => {
    assert.equal(clock(1.5, keys), 1.5);
    assert.equal(clockRate(1, keys), 1);
    assert.equal(clockRate(9, keys), 2);
    assert.ok(Math.abs(clock(8, keys) - clock(6, keys) - 4) < 1e-12);
  });
  it('is the integral of its rate: no jumps, never backwards, still while paused', () => {
    let last = clock(0, keys);
    for (let t = 0.005; t < 8; t += 0.005) {
      const now = clock(t, keys);
      const mid = clockRate(t - 0.0025, keys);
      assert.ok(Math.abs(now - last - mid * 0.005) < 1e-6, `at ${t}`);
      assert.ok(now >= last - 1e-12);
      last = now;
    }
    assert.equal(clock(4.2, keys), clock(4.9, keys));
    // 2 + (1 + 0.5) / 2 + (0.5 + 0) / 2
    assert.ok(Math.abs(clock(4, keys) - 3) < 1e-12);
  });
});

describe('kinetic-theory: easing and the balloon', () => {
  it('eases and fades in windows', () => {
    assert.equal(smooth(0, 1, 2), 0);
    assert.equal(smooth(3, 1, 2), 1);
    assert.equal(smooth(1.5, 1, 2), 0.5);
    assert.equal(windowed(5, 4, 8, 0.5), 1);
    assert.equal(windowed(3, 4, 8, 0.5), 0);
    assert.equal(windowed(9, 4, 8, 0.5), 0);
  });
  it('is blown up, leaks slowly through the hole (fast at first), then a fresh one swells a little when heated', () => {
    const k = { small: 0.3, inflate: [1, 2], leak: [3, 9], leaked: 0.8, freshAt: 10, hot: 1.07, swell: [12, 14] };
    assert.equal(balloonScale(0, k), 0.3);
    assert.equal(balloonScale(2.5, k), 1);
    assert.ok(balloonScale(4, k) < 1);
    assert.ok(Math.abs(balloonScale(9, k) - 0.8) < 1e-12);
    assert.ok(1 - balloonScale(4, k) > balloonScale(8, k) - balloonScale(9, k), 'loses more air at first');
    for (let t = 3; t < 9; t += 0.1) assert.ok(balloonScale(t + 0.1, k) <= balloonScale(t, k) + 1e-12, 'never grows while leaking');
    assert.equal(balloonScale(11, k), 1);
    assert.ok(Math.abs(balloonScale(15, k) - 1.07) < 1e-12);
  });
});

describe('kinetic-theory: words', () => {
  it('has every string in Bangla and English', () => {
    const bn = Object.keys(STRINGS.bn).sort();
    const en = Object.keys(STRINGS.en).sort();
    assert.deepEqual(bn, en);
    for (const s of STEPS) assert.ok(STRINGS.bn[`${s.key}_short`], s.key);
    for (const c of CUES) assert.ok(STRINGS.bn[c.key] && STRINGS.en[c.key], c.key);
  });
  it('lists the parts and captions in time order, each part starting with a caption', () => {
    for (const list of [STEPS, CUES]) for (let i = 1; i < list.length; i++) assert.ok(list[i].at > list[i - 1].at);
    for (const s of STEPS)
      assert.ok(
        CUES.some((c) => c.at === s.at),
        `a caption starts at ${s.at}`,
      );
  });
  it('uses the book’s terms (page 152–153)', () => {
    const all = Object.values(STRINGS.bn).join(' ');
    for (const term of ['স্কচটেপ', 'সুচ', 'ফুটো', 'আবদ্ধ', 'ভরবেগ', 'নিউটনের তৃতীয় সূত্র', 'পাল্টা বল', 'প্রতিফলিত', 'সম্মিলিত', 'গতিশক্তি', 'চাপ'])
      assert.ok(all.includes(term), term);
    const t = createI18n('bn');
    assert.equal(t.num(153), '১৫৩');
  });
});
