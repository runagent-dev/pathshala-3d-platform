// The echo figure's arithmetic (book page 201, topic 7.3.1): 0.1 s → 33 m → 16.5 m, t = 2d ÷ 330. Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/echo/src/reading.js';

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
