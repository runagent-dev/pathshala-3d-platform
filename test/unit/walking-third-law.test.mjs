// The maths and the words of the walking-third-law figure (book p86, topic 3.8, চিত্র ৩.১২): a 50 kg student pushes the
// ground backward, the ground pushes the student forward with exactly the same force (the third law), and that
// force is the only one that gives the student a forward acceleration (a = F / m). What the ground can give back
// depends on the grip: firm ground gives all the leg means to push, loose sand gives way, a soapy or oily floor lets the
// foot slide. The pose of the student keeps the rear toe on the ground and planted on firm ground. The test's answer
// keys, and every string in both languages.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STRINGS, createI18n } from '../../assets/walking-third-law/src/i18n.js';
import * as r from '../../assets/walking-third-law/src/reading.js';
import { createWalker } from '../../assets/walking-third-law/src/walker.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

describe('walking: the push on each ground', () => {
  it('the three grounds of the page, in its order', () => {
    assert.deepEqual(r.GROUND_IDS, ['hard', 'sand', 'slip']);
  });
  it('firm ground gives all the leg means to push; sand and a slippery floor give less, in that order', () => {
    assert.equal(r.pushOn('hard'), r.INTENT);
    assert.ok(r.pushOn('sand') < r.pushOn('hard'));
    assert.ok(r.pushOn('slip') < r.pushOn('sand'));
    assert.deepEqual(r.GROUND_IDS.map(r.pushOn), [100, 50, 20]);
  });
  it('the push is never more than the grip of the ground, nor more than the leg means to give', () => {
    for (const id of r.GROUND_IDS) {
      assert.ok(r.pushOn(id) <= r.GROUNDS[id].grip);
      assert.ok(r.pushOn(id) <= r.INTENT);
    }
  });
  it('the student’s acceleration is the push over the mass (the one horizontal force on the student)', () => {
    for (const id of r.GROUND_IDS) close(r.accelOn(id) * r.MASS, r.pushOn(id));
    close(r.accelOn('hard'), 2); // ms⁻²
    close(r.accelOn('sand'), 1);
    close(r.accelOn('slip'), 0.4);
  });
});

describe('walking: what the body does in the push-off', () => {
  it('speed and distance follow a = F / m from rest (v = at, s = ½at²), real time, 0.6 s', () => {
    close(r.speedAt(r.PUSH_TIME, 'hard'), 1.2); // m/s: a walking pace
    close(r.bodyAt(r.PUSH_TIME, 'hard'), 0.36);
    close(r.bodyAt(r.PUSH_TIME, 'sand'), 0.18);
    close(r.bodyAt(r.PUSH_TIME, 'slip'), 0.072);
    close(r.bodyAt(0, 'hard'), 0);
    close(r.speedAt(0, 'hard'), 0);
  });
  it('time is clamped to the push-off', () => {
    close(r.bodyAt(5, 'hard'), r.bodyAt(r.PUSH_TIME, 'hard'));
    close(r.bodyAt(-1, 'hard'), 0);
    close(r.speedAt(5, 'sand'), r.speedAt(r.PUSH_TIME, 'sand'));
    close(r.progress(0.3), 0.5);
    close(r.progress(9), 1);
  });
  it('the leg stretches the same on every ground; on firm ground the body goes all of it and the foot stays put', () => {
    close(r.stretchAt(r.PUSH_TIME), 0.36);
    for (const t of [0, 0.15, 0.3, 0.45, 0.6]) close(r.slipAt(t, 'hard'), 0);
    close(r.bodyAt(r.PUSH_TIME, 'hard'), r.stretchAt(r.PUSH_TIME));
  });
  it('where the grip is less the foot slides back by what the body did not move', () => {
    for (const id of r.GROUND_IDS) for (const t of [0.1, 0.3, 0.6]) close(r.slipAt(t, id), r.stretchAt(t) - r.bodyAt(t, id));
    close(r.slipAt(r.PUSH_TIME, 'sand'), 0.18);
    close(r.slipAt(r.PUSH_TIME, 'slip'), 0.288);
    assert.ok(r.slipAt(r.PUSH_TIME, 'slip') > r.slipAt(r.PUSH_TIME, 'sand'));
  });
  it('the picture is slowed down: SLOW times longer, ending at the push-off’s end', () => {
    close(r.SHOWN_TIME, r.PUSH_TIME * r.SLOW);
    close(r.realTime(0), 0);
    close(r.realTime(r.SHOWN_TIME), r.PUSH_TIME);
    close(r.realTime(99), r.PUSH_TIME);
  });
});

describe('walking: the pose of the student', () => {
  const w = createWalker();
  const bone = (list, i) => list[i];
  /** The rear toe's place on the ground (world x), the lowest point of either foot, the leg lengths. */
  function at(p, id) {
    const t = p * r.PUSH_TIME;
    w.root.position.x = r.bodyAt(t, id);
    w.pose(p);
    w.root.updateMatrixWorld(true);
    const bones = w.bones();
    return { toe: r.bodyAt(t, id) + w.toe().x, toeY: w.toe().y, bones };
  }
  it('on firm ground the rear toe stays where it was put: the foot does not slide', () => {
    const toe0 = at(0, 'hard').toe;
    for (const p of [0.25, 0.5, 0.75, 1]) close(at(p, 'hard').toe, toe0, 1e-6);
  });
  it('on a slippery floor the rear toe slides back by the slip, the body hardly moving', () => {
    const toe0 = at(0, 'slip').toe;
    close(at(1, 'slip').toe, toe0 - r.slipAt(r.PUSH_TIME, 'slip'), 1e-6);
    assert.ok(toe0 - at(1, 'slip').toe > 0.25);
  });
  it('the rear toe is on the ground and the legs keep their length (no stretched leg)', () => {
    for (const id of r.GROUND_IDS)
      for (const p of [0, 0.5, 1]) {
        const { toeY, bones } = at(p, id);
        close(toeY, 0);
        // bones: rear thigh, rear shin, rear foot, front thigh, front shin, front foot …
        const len = (b) => b[0].distanceTo(b[1]);
        close(len(bone(bones, 0)), 0.43, 1e-6);
        close(len(bone(bones, 1)), 0.41, 1e-6);
        close(len(bone(bones, 3)), 0.43, 1e-6);
        close(len(bone(bones, 4)), 0.41, 1e-6);
      }
  });
  it('no foot goes below the ground', () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      w.pose(p);
      for (const name of ['RearShoe']) {
        const shoe = w.root.getObjectByName(name);
        const half = 0.12;
        const lowest = shoe.position.y - Math.abs(Math.sin(shoe.rotation.z)) * half - Math.cos(shoe.rotation.z) * 0.035;
        assert.ok(lowest > -0.0015, `${name} at ${p}: ${lowest}`);
      }
    }
  });
  it('the push-off ends with the heel lifted on the rear foot and the front heel landing ahead of the hips', () => {
    w.pose(1);
    const shoe = w.root.getObjectByName('RearShoe');
    assert.ok(shoe.rotation.z < -0.5, 'rear heel up');
    assert.ok(w.toe().x < -0.1, 'rear toe behind the hips');
    assert.ok(w.heel().y > 0.1, 'rear heel off the ground');
  });
});

describe('walking: every string, both languages', () => {
  const bn = Object.keys(STRINGS.bn);
  const en = Object.keys(STRINGS.en);
  it('Bangla and English have the same keys', () => {
    assert.deepEqual(bn.sort(), en.sort());
  });
  it('the keys the figure builds from the ground and the number exist', () => {
    for (const id of r.GROUND_IDS)
      for (const k of [`chip_${id}`, `act_${id}`, `out_rest_${id}`, `out_${id}`, `rule_${id}`]) assert.ok(k in STRINGS.bn, k);
    for (const k of ['rule_start', 'rule_book', 'act_again', 'res_push', 'out_push', 'note_slow', 'note_held']) assert.ok(k in STRINGS.bn, k);
  });
  it('numbers show Bangla digits, with the book’s unit নিউটন; English keeps N', () => {
    const t = createI18n('bn');
    assert.equal(t('res_push', { n: 100 }), '১০০ নিউটন');
    assert.equal(t('note_slow', { k: r.SLOW }), 'সময় ৪ গুণ ধীর করে দেখানো');
    assert.ok(t('out_hard', { n: 100 }).includes('<b>১০০ নিউটন</b>'));
    assert.equal(createI18n('en')('res_push', { n: 100 }), '100 N');
  });
  it('the result lines say the two pushes are equal and that the number is an example (যেমন)', () => {
    const t = createI18n('bn');
    for (const id of r.GROUND_IDS) {
      const s = t(`out_${id}`, { n: r.pushOn(id) });
      assert.ok(s.includes('সমান'), id);
      assert.ok(s.includes('যেমন'), `${id}: an example number`);
      assert.ok(s.includes(t.num(r.pushOn(id))), id);
    }
    assert.ok(t('out_hard', { n: 100 }).includes('পা মাটিকে ধাক্কা দিল, মাটি মানুষটিকে ধাক্কা দিল'));
  });
  it('one verb everywhere, the page’s own: ধাক্কা (no ঠেলা), and "সাবান পানি" without a hyphen', () => {
    for (const [k, v] of Object.entries(STRINGS.bn)) {
      assert.ok(!/ঠেল/.test(v), `${k} uses ঠেলা/ঠেলছে`);
      assert.ok(!v.includes('সাবান-পানি'), k);
    }
  });
  it('the two pushes are named in plain words first: who pushes whom, no symbol', () => {
    assert.equal(STRINGS.bn.l_f, 'পা মাটিকে ধাক্কা দিচ্ছে');
    assert.equal(STRINGS.bn.l_mf, 'মাটি মানুষটিকে ধাক্কা দিচ্ছে');
    for (const lang of ['bn', 'en']) {
      for (const k of Object.keys(STRINGS[lang]).filter((x) => x !== 'title')) {
        assert.ok(
          !/(^|[^A-Za-z])−?F([^A-Za-z]|$)/.test(STRINGS[lang][k].replace(/<[^>]+>/g, '')),
          `${lang} ${k} uses a symbol (the labels add F and −F themselves at the last step)`,
        );
      }
    }
  });
  it('the rule: everyday words for each step, one short sentence per idea, the book’s sentence last', () => {
    const t = createI18n('bn');
    const plain = (k) => t(k).replace(/<[^>]+>/g, '');
    assert.ok(plain('rule_start').includes('কেউ আমাদের ধাক্কা দেয় না'));
    assert.ok(plain('rule_hard').includes('শক্ত মাটিতে পা আটকে থাকে'));
    assert.ok(plain('rule_hard').includes('পা মাটিকে পেছনে, মাটি আমাদের সামনে ধাক্কা দেয়'));
    assert.ok(plain('rule_sand').includes('বালু সরে যায়'));
    assert.ok(plain('rule_slip').includes('ঘর্ষণ খুব কম') && plain('rule_slip').includes('প্রায়'), 'slip: "almost", as the result shows 20 N');
    assert.ok(plain('rule_book').includes('বল প্রয়োগ করলে বিপরীত এবং সমান বল পাওয়া যায়'));
    assert.ok(plain('rule_book').includes('নিউটনের তৃতীয় সূত্র'));
    for (const k of ['rule_start', 'rule_hard', 'rule_sand', 'rule_slip']) assert.ok(plain(k).length <= 105, `${k} is short (${plain(k).length})`);
    // under the ground's own line the book's sentence still fits three lines of a phone
    for (const k of ['rule_hard', 'rule_sand', 'rule_slip'])
      assert.ok(plain(k).length + plain('rule_book').length <= 170, `${k} + the book’s sentence`);
  });
  it('the test: every wrong choice has a note, every question a worked answer', () => {
    const wrong = {
      w_: ['w_ground', 'w_both', 'w_self'],
      e_: ['e_double', 'e_half', 'e_zero'],
      c_: ['c_bigger', 'c_inertia', 'c_muscle'],
      s_: ['s_back', 's_law', 's_weak'],
      h_: ['h_foot', 'h_self', 'h_air'],
    };
    for (const list of Object.values(wrong)) for (const k of list) assert.ok(`miss_${k}` in STRINGS.bn && `miss_${k}` in STRINGS.en, k);
    for (const k of ['why_which', 'why_equal', 'why_cancel', 'why_slip', 'why_who']) assert.ok(k in STRINGS.bn && k in STRINGS.en, k);
  });
  it('the questions take the cause out: the picture has to be read', () => {
    const t = createI18n('bn');
    assert.ok(!t('q_slip').includes('সাবান') && !t('q_slip').includes('পিচ্ছিল'));
    assert.ok(t('q_slip').includes('ছবি দেখো'));
    assert.ok(!/ঘর্ষণ|বালু/.test(t('q_who')));
    assert.ok(!t('q_equal').match(/[০-৯]/), 'the number is read off the picture');
  });
  it('the right choice is not the longest, and no two choices are alike in length by more than a short line', () => {
    const t = createI18n('bn');
    for (const set of [
      ['c_bodies', 'c_bigger', 'c_inertia', 'c_muscle'],
      ['s_friction', 's_back', 's_law', 's_weak'],
      ['h_ground', 'h_foot', 'h_self', 'h_air'],
    ]) {
      const len = set.map((k) => t(k).length);
      assert.ok(len[0] < Math.max(...len) || len.filter((x) => x === len[0]).length > 1, `${set[0]} is the longest choice`);
      assert.ok(Math.max(...len) <= 50, `${set[0]}: choices fit two lines of a button`);
    }
  });
  it('the worked answers lead with the answer in bold', () => {
    for (const [k, v] of Object.entries(STRINGS.bn)) if (/^(why|miss)_/.test(k)) assert.ok(v.startsWith('<b>'), k);
  });
  it('the equal question’s choices are the right push, double, half and nothing, for every ground', () => {
    const t = createI18n('bn');
    for (const id of r.GROUND_IDS) {
      const n = r.pushOn(id);
      const items = [n, n * 2, n / 2, 0].map((v) => t('e_val', { n: v }));
      assert.equal(new Set(items).size, 4, id);
      assert.equal(items[0], `${t.num(n)} নিউটন`);
    }
  });
  it('no Latin digits slip into the Bangla strings (the numbers come through t.num)', () => {
    for (const [k, v] of Object.entries(STRINGS.bn)) assert.ok(!/[0-9]/.test(v.replace(/\{\w+\}/g, '')), k);
  });
  it('forces are "নিউটন" in Bangla and "N" in English', () => {
    for (const k of ['out_hard', 'out_sand', 'out_slip', 'res_push']) assert.ok(STRINGS.bn[k].includes('নিউটন') && STRINGS.en[k].includes(' N'), k);
  });
});
