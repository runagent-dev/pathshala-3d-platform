// The tank with a hole (the owner's third picture, topic 5.4.1): the hole 0.22 m under the surface, the pressure hρg
// there, a jet that reaches farther the deeper the hole, the strings. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/torricelli-barometer-tank/src/reading.js';
import { STRINGS, createI18n } from '../../assets/torricelli-barometer-tank/src/i18n.js';

describe('torricelli-barometer-tank: the maths', () => {
  it('shoots the jet farther the deeper the hole is under the surface, and not at all at the surface', () => {
    assert.equal(r.holeDepth(), 0.22);
    assert.equal(r.columnPressure(r.holeDepth(), r.RHO.water), 2156);
    assert.ok(r.jetReach(0.22) > r.jetReach(0.1));
    assert.equal(r.jetReach(0), 0);
    assert.ok(r.holeDepth(r.TANK.low) > 0);
  });
});

describe('torricelli-barometer-tank: strings', () => {
  it('has every Bangla key in English and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits through t.num', () => {
    const t = createI18n('bn');
    assert.ok(!/[0-9]/.test(t('read_depth', { h: '0.22' }).replace(/<[^>]+>/g, '')));
  });

  it('writes the test’s questions as plain text', () => {
    for (const lang of ['bn', 'en'])
      for (const [k, v] of Object.entries(STRINGS[lang])) if (/^q_(tank|tk_open|tk_drain)$/.test(k)) assert.ok(!/[<&]/.test(v), `${lang} ${k}`);
  });

  it('compares the tank with Torricelli’s tube', () => {
    assert.ok(STRINGS.bn.rule_tank1.includes('টরিসেলির'));
  });
});
