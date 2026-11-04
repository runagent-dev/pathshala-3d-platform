// The echo figure's arithmetic (book page 201, topic 7.3.1): 0.1 s → 33 m → 16.5 m, t = 2d ÷ 330; the call's length, the
// drawn wave train and the synthesized voice. Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as p from '../../assets/echo/src/pulse.js';
import * as r from '../../assets/echo/src/reading.js';
import * as v from '../../assets/echo/src/voice.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

describe('the book’s numbers', () => {
  it('0.1 s at 330 m/s is 33 m, half of it 16.5 m', () => {
    assert.equal(r.V_SOUND, 330);
    assert.equal(r.GAP_PATH, 33);
    assert.equal(r.MIN_D, 16.5);
  });
  it('at 16.5 m the echo returns after exactly 0.1 s and is heard on its own', () => {
    close(r.echoTime(16.5), 0.1);
    assert.equal(r.separate(16.5), true);
    assert.equal(r.separate(16), false);
    assert.equal(r.separate(10), false);
    assert.equal(r.separate(35), true);
  });
  it('t = 2d ÷ v and d = vt ÷ 2 undo each other', () => {
    for (const d of [4, 10, 16.5, 33, 40]) close(r.distanceFromTime(r.echoTime(d)), d);
    close(r.echoTime(33), 0.2);
  });
});

describe('the listener', () => {
  it('snaps to 0.5 m steps inside the range', () => {
    assert.equal(r.snapD(10.2), 10);
    assert.equal(r.snapD(16.4), 16.5);
    assert.equal(r.snapD(1), r.D_MIN);
    assert.equal(r.snapD(99), r.D_MAX);
    assert.equal(r.snapD('x'), r.D_MIN);
  });
  it('shows times with three decimals and says when they are rounded', () => {
    assert.deepEqual({ shown: r.shownTime(10).shown, exact: r.shownTime(10).exact }, { shown: 0.061, exact: false });
    assert.equal(r.shownTime(16.5).shown, 0.1);
    assert.equal(r.shownTime(16.5).exact, true);
    assert.equal(r.shownTime(33).exact, true);
  });
  it('every example is in the range, some near and some far', () => {
    for (const d of r.EXAMPLES) assert.equal(r.snapD(d), d);
    assert.ok(r.EXAMPLES.some((d) => !r.separate(d)));
    assert.ok(r.EXAMPLES.some((d) => r.separate(d)));
  });
});

describe('the pulse', () => {
  it('goes out, comes back, and is done after 2d ÷ v', () => {
    assert.equal(r.pulseAt(10, 0).phase, 'out');
    assert.equal(r.pulseAt(10, 0.02).phase, 'out');
    assert.equal(r.pulseAt(10, 0.04).phase, 'back');
    close(r.pulseAt(10, 0.04).back, 13.2);
    assert.equal(r.pulseAt(10, 0.02).back, 0);
    assert.equal(r.pulseAt(10, 0.07).phase, 'done');
  });
});

describe('the test’s answers', () => {
  it('“heard on its own?” has four different answers, exactly one right', () => {
    for (const d of [5, 10, 12, 25, 30, 35]) {
      const list = r.hearChoices(d);
      assert.equal(new Set(list.map((c) => `${c.yes}|${c.after}`)).size, 4, `distinct at ${d} m`);
      // right: the verdict and its reason are both true
      const ok = list.filter((c) => c.yes === r.separate(d) && c.after === r.separate(d));
      assert.deepEqual(
        ok.map((c) => c.key),
        ['right'],
      );
      // no give-away: each verdict and each reason appears twice
      assert.equal(list.filter((c) => c.yes).length, 2);
      assert.equal(list.filter((c) => c.after).length, 2);
    }
  });
  it('“how far is the cliff?” has four different distances, the right one first', () => {
    for (const t of r.FAR_TIMES) {
      const list = r.distanceChoices(t);
      assert.equal(new Set(list.map((c) => c.d)).size, 4, `distinct at ${t} s`);
      close(list[0].d, (330 * t) / 2, 1e-6);
      assert.ok(list[0].d <= r.D_MAX);
    }
  });
});

describe('the call', () => {
  it('lasts about a third of a second, longer than the 0.1 s it is compared by', () => {
    assert.ok(r.CALL >= 0.3 && r.CALL <= 0.4);
    assert.ok(r.CALL > r.GAP);
  });
  it('the echo is the same bar, starting 2d ÷ 330 s after the call starts', () => {
    assert.deepEqual(r.callBar(), { start: 0, end: r.CALL });
    for (const d of [5, 16.5, 40]) {
      const e = r.echoBar(d);
      close(e.start, (2 * d) / 330);
      close(e.end - e.start, r.CALL);
    }
  });
  it('near the cliff its start falls inside the 0.1 s band, from 16.5 m on it does not', () => {
    assert.ok(r.echoBar(16).start < r.GAP);
    assert.ok(r.echoBar(16.5).start >= r.GAP - 1e-9);
  });
  it('at every distance on the tape the echo starts while the word is still being said', () => {
    assert.equal(r.startsDuringCall(r.D_MAX), true);
    assert.equal(r.startsDuringCall(58), false); // only beyond 57.75 m does the whole word come back after it ends
  });
});

describe('the drawn wave train', () => {
  it('is several waves long, full strength first, with a tail that dies away', () => {
    assert.ok(p.WAVES >= 4 && p.WAVES <= 6);
    const L = p.WAVES * p.LAMBDA;
    assert.equal(p.envelope(-0.1), 0);
    assert.equal(p.envelope(0.25 * L), 1);
    assert.equal(p.envelope(L), 0);
    let last = 1;
    for (let k = 0.5; k <= 1; k += 0.05) {
      assert.ok(p.envelope(k * L) <= last);
      last = p.envelope(k * L);
    }
  });
});

describe('the voice', () => {
  const RATE = 44100;
  const word = v.synthCall(RATE);
  const part = (t0, t1) => word.subarray(Math.round(t0 * RATE), Math.round(t1 * RATE));
  /** Strength of the signal near f (Hz), by correlating with a sine and a cosine. */
  function near(x, f) {
    let c = 0;
    let s = 0;
    for (let i = 0; i < x.length; i++) {
      const w = (2 * Math.PI * f * i) / RATE;
      const win = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / x.length);
      c += x[i] * Math.cos(w) * win;
      s += x[i] * Math.sin(w) * win;
    }
    return Math.hypot(c, s);
  }
  /** The band's strongest harmonic-sized peak. */
  const band = (x, lo, hi) => {
    let m = 0;
    for (let f = lo; f <= hi; f += 20) m = Math.max(m, near(x, f));
    return m;
  };
  /** The pitch (Hz), from the strongest repeat between 3 and 7 ms. */
  function pitch(x) {
    let best = 0;
    let lag = 0;
    for (let l = Math.round(RATE / 330); l < Math.round(RATE / 140); l++) {
      let sum = 0;
      for (let i = 0; i + l < x.length; i++) sum += x[i] * x[i + l];
      if (sum > best) {
        best = sum;
        lag = l;
      }
    }
    return RATE / lag;
  }

  it('is exactly the length of the call, with a sensible level and clean ends', () => {
    assert.equal(word.length, Math.round(r.CALL * RATE));
    const peak = word.reduce((m, y) => Math.max(m, Math.abs(y)), 0);
    close(peak, 0.9, 0.02);
    assert.equal(word[0], 0);
    assert.ok(Math.abs(word[word.length - 1]) < 1e-6);
    assert.ok(word.every(Number.isFinite));
  });
  it('is the same word every time', () => {
    assert.deepEqual(v.synthCall(RATE), word);
  });
  it('starts as breath, then voiced at a boy’s pitch that falls slightly', () => {
    const a = pitch(part(0.09, 0.14));
    const b = pitch(part(0.25, 0.3));
    assert.ok(a >= 195 && a <= 230, `first vowel ${a} Hz`);
    assert.ok(b >= 180 && b <= 215, `second vowel ${b} Hz`);
    assert.ok(b < a);
  });
  it('moves from an open front vowel to a rounded back vowel', () => {
    const ae = part(0.09, 0.14);
    const o = part(0.25, 0.3);
    // /æ/: F2 high, near 1800 Hz; /o/: F2 low, near 880 Hz, and hardly anything up at 1800 Hz
    assert.ok(band(ae, 1600, 2000) / band(ae, 840, 960) > 2 * (band(o, 1600, 2000) / band(o, 840, 960)));
    assert.ok(band(ae, 700, 900) > band(ae, 350, 500) * 0.7, 'F1 of /æ/ is high');
    assert.ok(band(o, 420, 620) > band(o, 700, 800), 'F1 of /o/ is lower');
  });
  it('dips at the /l/ between the syllables', () => {
    const rms = (x) => Math.sqrt(x.reduce((m, y) => m + y * y, 0) / x.length);
    assert.ok(rms(part(0.18, 0.2)) < rms(part(0.09, 0.14)));
    assert.ok(rms(part(0.18, 0.2)) < rms(part(0.235, 0.27)));
  });
});
