// The physics of the inertia figure (assets/inertia/src/motion.js): the bus, the standing passenger's lean, stepping
// off a moving bus, and the coin on a card. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as m from '../../assets/inertia/src/motion.js';

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} is not within ${tol} of ${b}`);
const deg = (r) => (r * 180) / Math.PI;

describe('inertia: the bus', () => {
  it('a sudden start: 2.5 m/s² for 1 s takes it from rest to 2.5 m/s, then it runs on steadily', () => {
    near(m.sampleAt('start', 0.4).busV, 0, 1e-9, 'before the push');
    near(m.sampleAt('start', 1.6).busV, 2.5, 0.02, 'after the push');
    near(m.sampleAt('start', 3).busV, 2.5, 0.02, 'later');
    // the push ramps up and down over 0.08 s, so it acts as 1 s of 2.5 m/s² from 0.54 s to 1.54 s
    near(m.sampleAt('start', 1.6).busX, 0.5 * 2.5 * 1 ** 2 + 2.5 * 0.06, 0.03, 'distance (½at² + vt)');
  });
  it('a sudden brake: from 4.5 m/s at 3 m/s² it stops in 1.5 s, and does not go backward', () => {
    near(m.sampleAt('brake', 0.5).busV, 4.5, 1e-9, 'before the brake');
    near(m.sampleAt('brake', 0.6 + 4.5 / 3 + 0.1).busV, 0, 1e-6, 'stopped');
    near(m.sampleAt('brake', 3.5).busV, 0, 1e-9, 'stays stopped');
    const T = m.simulate('brake');
    const stopX = T.busX[T.n - 1];
    near(stopX, 4.5 * 0.64 + 4.5 ** 2 / (2 * 3), 0.05, 'stopping distance (v²/2a, braking from 0.64 s)');
  });
  it('the bus is never pushed except during its push', () => {
    const ev = m.EVENTS.start;
    assert.equal(m.pushAt(ev, 0.3), 0);
    near(m.pushAt(ev, 1.0), 2.5, 1e-9, 'during');
    assert.equal(m.pushAt(ev, 2), 0);
  });
});

describe('inertia: the standing passenger', () => {
  it('stands upright while nothing changes', () => {
    assert.equal(m.sampleAt('start', 0.3).theta, 0);
    assert.equal(m.sampleAt('brake', 0.3).theta, 0);
  });
  it('leans back when the bus starts (স্থিতি জড়তা) and forward when it brakes (গতি জড়তা)', () => {
    const start = m.peakLean('start');
    const brake = m.peakLean('brake');
    assert.ok(start.theta > 0, 'back');
    assert.ok(brake.theta < 0, 'forward');
    assert.ok(deg(start.theta) > 10 && deg(start.theta) < 25, `a clear but not toppling lean back: ${deg(start.theta)}°`);
    assert.ok(deg(-brake.theta) > 10 && deg(-brake.theta) < 30, `a clear lean forward: ${deg(brake.theta)}°`);
  });
  it('comes back upright once the bus moves steadily again', () => {
    assert.ok(Math.abs(deg(m.sampleAt('start', 3.1).theta)) < 5);
    assert.ok(Math.abs(deg(m.sampleAt('brake', 3.6).theta)) < 8);
  });
  it('at the start the upper body lags: the feet go with the bus, the chest is slower', () => {
    const s = m.sampleAt('start', m.simulate('start').key);
    near(s.lowerV, s.busV, 1e-9, 'the feet move with the bus');
    assert.ok(s.upperV < 0.75 * s.lowerV, `chest ${s.upperV} vs feet ${s.lowerV}`);
    // and early on the head has hardly moved while the feet have gone well ahead
    const a = m.sampleAt('start', 0.5);
    const b = m.sampleAt('start', 1.0);
    const head = (x) => x.rootX + m.skeleton(x.pose).head.x;
    assert.ok(b.rootX - a.rootX > 0.2, 'feet moved');
    assert.ok(head(b) - head(a) < 0.08, 'head stayed');
  });
  it('on braking the upper body runs on faster than the feet', () => {
    const s = m.sampleAt('brake', m.simulate('brake').key);
    assert.ok(s.upperV > s.lowerV + 0.3, `chest ${s.upperV} vs feet ${s.lowerV}`);
  });
  it('a gentle start (0.45 m/s²) makes only a small lean: inertia shows in sudden changes', () => {
    const gentle = deg(m.peakLean('gentle').theta);
    const sudden = deg(m.peakLean('start').theta);
    assert.ok(gentle > 0 && gentle < 0.3 * sudden, `gentle ${gentle}° vs sudden ${sudden}°`);
  });
});

describe('inertia: stepping off a moving bus', () => {
  const T = m.simulate('alight');
  it('in the air he keeps the bus speed, and lands after a fall of 0.4 m (about 0.3 s)', () => {
    assert.ok(T.land, 'lands');
    const flight = T.land.t - m.HOP.off;
    near(flight, (0.6 + Math.sqrt(0.6 ** 2 + 2 * 9.8 * 0.4)) / 9.8, 0.01, 'time in the air (0.6 m/s up, 0.4 m down)');
    near(m.sampleAt('alight', m.HOP.off + 0.1).lowerV, 3, 1e-9, 'feet speed in the air');
  });
  it('on the road the feet stop, the upper body is still running on (গতি জড়তা)', () => {
    const s = m.sampleAt('alight', T.land.t + 0.1);
    assert.equal(s.lowerV, 0);
    assert.ok(s.upperV > 2, `chest ${s.upperV} m/s`);
  });
  it('tumbles forward onto hands and knees and stays there, the hands on the road', () => {
    const end = m.sampleAt('alight', m.EVENTS.alight.duration);
    const j = m.skeleton(end.pose);
    assert.ok(j.head.x > 0.8, 'the head is well ahead of the feet');
    assert.ok(j.knee.y < 0.1 && j.hand.y < 0.08, `knees ${j.knee.y} and hands ${j.hand.y} on the road`);
    near(end.upperV, 0, 0.05, 'at rest');
  });
});

describe('inertia: the coin on the card', () => {
  const T = m.simulate('coin');
  it('the flicked card shoots off while the coin hardly moves sideways', () => {
    const s = m.sampleAt('coin', T.dropT);
    assert.ok(s.lowerV > 2, 'card speed');
    assert.ok(s.upperV < 0.1, `coin speed ${s.upperV} m/s`);
  });
  it('the coin drops into the glass (inside the wall) and comes to rest on its bottom', () => {
    const end = m.sampleAt('coin', m.EVENTS.coin.duration);
    const { glass, coin } = m.TABLE;
    assert.ok(Math.abs(end.coinX) + coin.r < glass.r - glass.wall, `coin at ${end.coinX} m`);
    near(end.coinY, glass.base + coin.th / 2, 1e-6, 'on the bottom');
    assert.ok(T.landT - T.dropT < 0.2, 'falls about 0.11 m in under 0.2 s');
  });
});

describe('inertia: the body model', () => {
  it('keeps every bone its length in any pose', () => {
    const p = { shin: 0.4, thigh: -0.3, torso: 0.9, head: 0.5, upperArm: 1.1, forearm: 0.4 };
    const j = m.skeleton(p);
    near(Math.hypot(j.knee.x - j.ankle.x, j.knee.y - j.ankle.y), m.SEG.shin, 1e-9, 'shin');
    near(Math.hypot(j.hip.x - j.knee.x, j.hip.y - j.knee.y), m.SEG.thigh, 1e-9, 'thigh');
    near(Math.hypot(j.shoulder.x - j.hip.x, j.shoulder.y - j.hip.y), m.SEG.torso, 1e-9, 'torso');
    near(Math.hypot(j.elbow.x - j.shoulder.x, j.elbow.y - j.shoulder.y), m.SEG.upperArm, 1e-9, 'upper arm');
  });
  it('a standing student is about 1.63 m tall', () => near(m.HEIGHT, 1.635, 0.01, 'height'));
  it('the two-link arm reaches a point it can reach', () => {
    const arm = m.reach(0.2, -0.45);
    const j = m.skeleton({ shin: 0, thigh: 0, torso: 0, head: 0, ...arm });
    const a = m.SEG.upperArm;
    const ex = j.shoulder.x + a * Math.sin(arm.upperArm);
    const ey = j.shoulder.y - a * Math.cos(arm.upperArm);
    const b = m.SEG.forearm + m.SEG.hand * 0.6;
    near(ex + b * Math.sin(arm.forearm) - j.shoulder.x, 0.2, 1e-6, 'x');
    near(ey - b * Math.cos(arm.forearm) - j.shoulder.y, -0.45, 1e-6, 'y');
  });
});
