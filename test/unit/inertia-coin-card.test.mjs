// The physics of the coin-and-card figure (assets/inertia-coin-card/src/motion.js): a flicked card shoots off, the
// coin at rest stays (স্থিতি জড়তা) and falls into the glass; and its strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STRINGS } from '../../assets/inertia-coin-card/src/i18n.js';
import * as m from '../../assets/inertia-coin-card/src/motion.js';

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} is not within ${tol} of ${b}`);

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
  it('it is inertia of rest, and the key moment is while the card flies off', () => {
    assert.equal(m.EVENTS.coin.inertia, 'rest');
    assert.equal(m.sampleAt('coin', T.key).phase, 'act');
  });
});

describe('inertia: the coin on the card, strings', () => {
  it('every string has its Bangla and English, with the same placeholders', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
    for (const [k, bn] of Object.entries(STRINGS.bn)) {
      const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort();
      assert.deepEqual(vars(bn), vars(STRINGS.en[k]), k);
    }
  });
  it('each test question has its worked answer and a line for every wrong choice', () => {
    const qs = {
      coin: ['o_coin_glass', 'o_coin_with', 'o_coin_back', 'o_coin_float'],
      coin_kind: ['o_ck_rest', 'o_ck_motion', 'o_ck_card', 'o_ck_push'],
      coin_speed: ['o_cs_card', 'o_cs_coin', 'o_cs_same', 'o_cs_none'],
    };
    for (const [q, keys] of Object.entries(qs)) {
      assert.ok(STRINGS.bn[`w_${q}`] && STRINGS.en[`w_${q}`], q);
      for (const k of keys) assert.ok(STRINGS.bn[k], k);
      for (const k of keys.slice(1)) assert.ok(STRINGS.bn[`m_${q}_${k}`], `${q} ${k}`);
    }
  });
});
