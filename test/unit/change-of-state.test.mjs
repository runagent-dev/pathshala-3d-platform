// The maths of the change-of-state figure (book topic 6.4, figure ৬.০৮, p176): the heating curve of ice to steam,
// flat at 0 °C and at 100 °C, its mirror for cooling, the phase at each point, and the parts the button plays.
// Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/change-of-state/src/reading.js';
import { STRINGS, createI18n } from '../../assets/change-of-state/src/i18n.js';

describe('change-of-state: the book’s curve', () => {
  it('starts at −20 °C, is flat at 0 °C from square 1 to 3 and at 100 °C from 5 to 7, ends at 120 °C', () => {
    assert.equal(r.heatTemp(0), -20);
    assert.equal(r.heatTemp(1), 0);
    assert.equal(r.heatTemp(2), 0);
    assert.equal(r.heatTemp(3), 0);
    assert.equal(r.heatTemp(4), 50);
    assert.equal(r.heatTemp(5), 100);
    assert.equal(r.heatTemp(6), 100);
    assert.equal(r.heatTemp(7), 100);
    assert.equal(r.heatTemp(8), 120);
    assert.equal(r.heatTemp(0.5), -10);
    assert.equal(r.heatTemp(7.5), 110);
  });

  it('never leaves the graph’s range', () => {
    assert.equal(r.heatTemp(-3), -20);
    assert.equal(r.heatTemp(11), 120);
    for (let u = 0; u <= 8; u += 0.25) assert.ok(r.heatTemp(u) >= r.T_MIN && r.heatTemp(u) <= r.T_MAX);
  });

  it('only rises while heating', () => {
    for (let u = 0; u < 8; u += 0.25) assert.ok(r.heatTemp(u + 0.25) >= r.heatTemp(u));
  });
});

describe('change-of-state: cooling is the same curve backwards', () => {
  it('walks the heating curve from the end, so time still runs left to right', () => {
    assert.equal(r.toU(0, 'heat'), 0);
    assert.equal(r.toU(0, 'cool'), 8);
    assert.equal(r.temperature(0, 'cool'), 120);
    assert.equal(r.temperature(1, 'cool'), 100);
    assert.equal(r.temperature(2, 'cool'), 100);
    assert.equal(r.temperature(4, 'cool'), 50);
    assert.equal(r.temperature(6, 'cool'), 0);
    assert.equal(r.temperature(8, 'cool'), -20);
  });

  it('draws the cooling curve as the mirror of the heating one', () => {
    const heat = r.curve('heat');
    const cool = r.curve('cool');
    assert.deepEqual(cool[0], [0, 120]);
    assert.deepEqual(cool[cool.length - 1], [8, -20]);
    heat.forEach(([x, T], i) => assert.deepEqual(cool[cool.length - 1 - i], [8 - x, T]));
    for (let i = 1; i < cool.length; i++) assert.ok(cool[i][0] > cool[i - 1][0], 'time increases along the curve');
  });
});

describe('change-of-state: what is in the beaker', () => {
  it('names the phase at each point of the heating curve', () => {
    assert.equal(r.phaseAt(0), 'ice');
    assert.equal(r.phaseAt(1), 'ice'); // at 0 °C, nothing melted yet
    assert.equal(r.phaseAt(1.01), 'melt');
    assert.equal(r.phaseAt(2), 'melt');
    assert.equal(r.phaseAt(3), 'water'); // all melted
    assert.equal(r.phaseAt(4), 'water');
    assert.equal(r.phaseAt(5), 'water'); // at 100 °C, nothing boiled yet
    assert.equal(r.phaseAt(5.5), 'boil');
    assert.equal(r.phaseAt(7), 'steam'); // all boiled away
    assert.equal(r.phaseAt(8), 'steam');
  });

  it('melts and boils away steadily over the flat parts', () => {
    assert.equal(r.melted(1), 0);
    assert.equal(r.melted(2), 0.5);
    assert.equal(r.melted(3), 1);
    assert.equal(r.melted(0), 0);
    assert.equal(r.melted(8), 1);
    assert.equal(r.boiled(5), 0);
    assert.equal(r.boiled(6), 0.5);
    assert.equal(r.boiled(7), 1);
  });

  it('has the temperature flat exactly while the state changes', () => {
    for (let u = 1.05; u < 3; u += 0.1) assert.equal(r.heatTemp(u), 0);
    for (let u = 5.05; u < 7; u += 0.1) assert.equal(r.heatTemp(u), 100);
    for (const u of [0.5, 3.5, 4.5, 7.5]) assert.ok(r.phaseAt(u) !== 'melt' && r.phaseAt(u) !== 'boil');
  });

  it('calls the flat parts melting and boiling, or freezing and condensing when cooling', () => {
    assert.equal(r.processOf('melt', 'heat'), 'melt');
    assert.equal(r.processOf('boil', 'heat'), 'boil');
    assert.equal(r.processOf('melt', 'cool'), 'freeze');
    assert.equal(r.processOf('boil', 'cool'), 'condense');
    assert.equal(r.processOf('water', 'heat'), null);
  });
});

describe('change-of-state: the parts the button plays', () => {
  it('splits the time axis into the five parts of the curve', () => {
    assert.deepEqual(r.PART_ENDS, [0, 1, 3, 5, 7, 8]);
    assert.equal(r.partOf(0), -1);
    assert.equal(r.partOf(0.5), 0);
    assert.equal(r.partOf(1), 0); // a joint belongs to the part before it
    assert.equal(r.partOf(1.01), 1);
    assert.equal(r.partOf(3), 1);
    assert.equal(r.partOf(8), 4);
  });

  it('plays the next part from wherever the run is, and is done at the end', () => {
    assert.equal(r.nextPart(0), 0);
    assert.equal(r.nextPart(1), 1);
    assert.equal(r.nextPart(2), 1);
    assert.equal(r.nextPart(3), 2);
    assert.equal(r.nextPart(7), 4);
    assert.equal(r.nextPart(8), 5);
  });

  it('meets the phases in the opposite order when cooling', () => {
    assert.deepEqual(
      [0, 1, 2, 3, 4].map((k) => r.phaseOfPart(k, 'heat')),
      ['ice', 'melt', 'water', 'boil', 'steam'],
    );
    assert.deepEqual(
      [0, 1, 2, 3, 4].map((k) => r.phaseOfPart(k, 'cool')),
      ['steam', 'boil', 'water', 'melt', 'ice'],
    );
  });

  it('gives the long parts more time than the short ones', () => {
    assert.equal(r.partSeconds(0), 1.5);
    assert.equal(r.partSeconds(1), 3);
    assert.equal(r.partSeconds(4), 1.5);
  });
});

describe('change-of-state: the words', () => {
  it('has every Bangla key in English too, and the other way round', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('writes numbers in Bangla digits', () => {
    const t = createI18n('bn');
    assert.equal(t.num(100), '১০০');
    assert.equal(t('q_count', { i: 2, n: 5 }), 'প্রশ্ন ২ / ৫');
  });

  it('has a result line and a rule for every phase of both runs', () => {
    const t = createI18n('bn');
    for (const flow of ['heat', 'cool'])
      for (const k of ['intro', 'ice', 'melt', 'water', 'boil', 'steam']) {
        if (k !== 'intro') assert.notEqual(t(`out_${flow}_${k}`), `out_${flow}_${k}`);
        assert.notEqual(t(`rule_${flow}_${k}`), `rule_${flow}_${k}`);
      }
  });
});
