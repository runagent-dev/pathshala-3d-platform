// The maths and the words of the pressure-melting-point figure (book pages 181–182, topic 6.7, চিত্র ৬.০৯): where the
// wire is as it cuts through the block, which part of the story each state is, and that every question has four
// answers and a note for each wrong one in both languages. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as r from '../../assets/pressure-melting-point/src/reading.js';
import { STRINGS, createI18n } from '../../assets/pressure-melting-point/src/i18n.js';

describe('pressure-melting-point: the wire in the block', () => {
  it('starts resting on the top of the block and ends just below its bottom', () => {
    assert.ok(Math.abs(r.wireY(0) - (r.ICE.y + r.WIRE_R)) < 1e-12);
    assert.ok(r.wireY(1) + r.WIRE_R < 0);
    assert.equal(r.wireY(-3), r.wireY(0));
    assert.equal(r.wireY(7), r.wireY(1));
  });

  it('sinks steadily, and the refrozen seam above it grows to the top', () => {
    let last = Number.POSITIVE_INFINITY;
    for (let p = 0; p <= 1.0001; p += 0.1) {
      assert.ok(r.wireY(p) < last);
      last = r.wireY(p);
    }
    assert.equal(r.seamHeight(0), 0);
    assert.ok(r.seamHeight(0.5) > 0.05 && r.seamHeight(0.5) < r.ICE.y);
    assert.ok(r.seamHeight(1) < r.ICE.y + 0.02); // never taller than the block
  });

  it('presses on the ice only while the wire is inside it', () => {
    assert.ok(r.isCutting(0));
    assert.ok(r.isCutting(0.5));
    assert.ok(!r.isCutting(1));
    assert.ok(r.P_HANG > 0 && r.P_HANG < 0.2);
  });
});

describe('pressure-melting-point: the story', () => {
  it('goes start → hung → cutting → out → whole', () => {
    assert.equal(r.phaseOf({ step: 0, p: 0 }), 'start');
    assert.equal(r.phaseOf({ step: 1, p: r.P_HANG }), 'hung');
    assert.equal(r.phaseOf({ step: 2, p: 0.5 }), 'cutting');
    assert.equal(r.phaseOf({ step: 2, p: 1 }), 'out');
    assert.equal(r.phaseOf({ step: 3, p: 1 }), 'whole');
  });

  it('says what the next tap does', () => {
    assert.deepEqual(
      [0, 1, 2, 3].map((s) => r.nextOf(s, '')),
      ['hang', 'cut', 'remove', 'again'],
    );
    assert.equal(r.nextOf(1, 'cut'), '');
    assert.equal(r.nextOf(2, '', 0.5), 'cut'); // part of the way through: go on cutting
    assert.equal(r.nextOf(2, '', 1), 'remove');
  });

  it('has a scene for each question kind', () => {
    for (const kind of r.QUIZ_KINDS) {
      const sc = r.SCENES[kind];
      assert.ok(sc && sc.step >= 0 && sc.step <= r.STEPS && sc.p >= 0 && sc.p <= 1, kind);
    }
    assert.equal(r.QUIZ_KINDS.length, 5);
  });
});

describe('pressure-melting-point: the words', () => {
  const kinds = r.QUIZ_KINDS;
  for (const lang of ['bn', 'en']) {
    it(`${lang}: each question has four answers, a worked answer and a note for every wrong one`, () => {
      const d = STRINGS[lang];
      for (const k of kinds) {
        assert.ok(d[`q_${k}`], `q_${k}`);
        assert.ok(d[`why_${k}`], `why_${k}`);
        for (const i of [0, 1, 2, 3]) assert.ok(d[`q_${k}_${i}`], `q_${k}_${i}`);
        for (const i of [1, 2, 3]) assert.ok(d[`mis_${k}_${i}`], `mis_${k}_${i}`);
      }
    });
  }

  it('Bangla and English have the same keys', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });

  it('uses the book’s words and writes numbers in Bangla digits', () => {
    const t = createI18n('bn');
    assert.match(t('rule_start').replace(/<\/?b>/g, ''), /চাপ দেওয়া হলে পদার্থের গলনাঙ্ক কমে যায়/);
    assert.match(t('out_whole'), /অখণ্ড এক টুকরো বরফই আছে/);
    assert.match(t('rule_cut').replace(/<\/?b>/g, ''), /চাপ সরিয়ে নিলে গলনাঙ্ক আগের মান ফিরে পায়/);
    assert.equal(t('q_count', { i: 3, n: 5 }), 'প্রশ্ন ৩ / ৫');
    assert.equal(createI18n('en').num(12), '12');
  });
});
