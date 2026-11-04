// The SI-prefix calculator's maths (book page 17, topic 1.5.2, Table 1.05): typed numbers are kept exact, a prefix
// change only moves the decimal point, results read in full with Bangladeshi commas or as a × 10ⁿ, and the
// keypad's keys behave like a calculator's. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as c from '../../assets/si-prefixes/src/convert.js';
import { PREFIXES, SIZES, STOPS, STRINGS } from '../../assets/si-prefixes/src/i18n.js';

const exp = Object.fromEntries(PREFIXES.map((p) => [p.key, p.exp]));
const conv = (typed, from, to, e = null) => c.convertValue(c.parseInput(typed, e), exp[from], exp[to]);
const show = (v) => c.plain(v, { maxInt: 60, maxZeros: 60 });

describe('si-prefixes calculator: exact conversion', () => {
  it('moves the decimal point by the difference of the powers of ten', () => {
    assert.equal(show(conv('2.5', 'k', 'c')), '2,50,000'); // 2.5 km = 2.5 × 10⁵ cm
    assert.equal(show(conv('1', 'k', 'base')), '1,000');
    assert.equal(show(conv('350', 'm', 'base')), '0.35');
    assert.equal(show(conv('1', 'n', 'base')), '0.000000001');
    assert.equal(show(conv('7.2', 'c', 'm')), '72');
    assert.equal(show(conv('12', 'base', 'da')), '1.2');
    assert.equal(show(conv('105', 'base', 'h')), '1.05');
    assert.equal(show(conv('1', 'E', 'a')), c.groupIndian(`1${'0'.repeat(36)}`)); // 10³⁶
  });
  it('never rounds: 0.1 km is exactly 10,000 cm, 0.3 mm is exactly 0.0003 m', () => {
    assert.equal(show(conv('0.1', 'k', 'c')), '10,000');
    assert.equal(show(conv('0.3', 'm', 'base')), '0.0003');
    assert.equal(show(conv('123456789012', 'µ', 'k')), '123.456789012');
  });
  it('reads a typed ×10ⁿ: 6 × 10²⁴ m is 6 million exametres (the book’s galaxy)', () => {
    assert.equal(show(conv('6', 'base', 'E', '24')), '60,00,000');
    assert.equal(show(conv('5', 'base', 'm', '-3')), '5');
    assert.deepEqual(c.scientific(conv('6', 'base', 'E', '24')), { mant: '6', exp: 6 });
  });
  it('the same unit leaves the number as it is; zero stays zero', () => {
    assert.equal(show(conv('4.25', 'k', 'k')), '4.25');
    assert.equal(show(conv('0', 'k', 'a')), '0');
    assert.equal(show(conv('', 'k', 'a')), '0');
  });
});

describe('si-prefixes calculator: how a number is written', () => {
  it('groups whole numbers the Bangladeshi way', () => {
    assert.equal(c.groupIndian('999'), '999');
    assert.equal(c.groupIndian('1000'), '1,000');
    assert.equal(c.groupIndian('1392000'), '13,92,000');
    assert.equal(c.groupIndian('1000000000'), '1,00,00,00,000');
  });
  it('writes it in full while that is short, else gives up (the display shows a × 10ⁿ)', () => {
    assert.equal(c.plain(c.parseInput('1', '12')), '10,00,00,00,00,000');
    assert.equal(c.plain(c.parseInput('1', '13')), null);
    assert.equal(c.plain(c.parseInput('1', '-9')), '0.000000001');
    assert.equal(c.plain(c.parseInput('1', '-11')), null);
  });
  it('a × 10ⁿ keeps every digit', () => {
    assert.deepEqual(c.scientific(c.parseInput('250000')), { mant: '2.5', exp: 5 });
    assert.deepEqual(c.scientific(c.parseInput('0.00072')), { mant: '7.2', exp: -4 });
    assert.deepEqual(c.scientific(c.parseInput('6.15', '3')), { mant: '6.15', exp: 3 });
  });
});

describe('si-prefixes calculator: the keypad', () => {
  const type = (keys, s = { mant: '', exp: null }) => keys.reduce((st, k) => c.press(st, k), s);
  it('types digits and one decimal point', () => {
    assert.deepEqual(type(['2', '.', '5', '.', '0']), { mant: '2.50', exp: null });
    assert.deepEqual(type(['.', '5']), { mant: '0.5', exp: null });
    assert.deepEqual(type(['0', '0', '7']), { mant: '7', exp: null });
  });
  it('stops at twelve digits', () => {
    assert.equal(type(Array(20).fill('9')).mant.length, c.MAX_DIGITS);
  });
  it('×10ⁿ, then the power and its sign; ⌫ undoes one step at a time; AC clears', () => {
    let s = type(['5', 'exp', '0', '3', 'neg']);
    assert.deepEqual(s, { mant: '5', exp: '-3' });
    assert.deepEqual(type(['5', 'exp', '1', '2', '3']), { mant: '5', exp: '12' }); // two digits at most
    assert.deepEqual(type(['exp']), { mant: '1', exp: '' }); // ×10ⁿ alone means 1 × 10ⁿ
    assert.deepEqual(type(['neg']), { mant: '', exp: null }); // no power yet: the sign does nothing
    s = type(['back', 'back'], s);
    assert.deepEqual(s, { mant: '5', exp: '' });
    assert.deepEqual(type(['back'], s), { mant: '5', exp: null });
    assert.deepEqual(type(['clear'], s), { mant: '', exp: null });
  });
});

describe('si-prefixes calculator: the object of about that size', () => {
  it('names the tour’s stop nearest in size (powers of ten), if one is close', () => {
    const near = (typed, from, e) => c.nearestStop(conv(typed, from, 'base', e), SIZES);
    assert.equal(near('2.5', 'k'), 'bridge');
    assert.equal(near('1.5', 'base'), 'student');
    assert.equal(near('100', 'p'), 'atom');
    assert.equal(near('1', 'base', '40'), null); // far past the galaxy
    assert.equal(near('0', 'k'), null);
  });
  it('every stop has a size and a name', () => {
    for (const s of STOPS) {
      assert.ok(SIZES[s.id] > 0, s.id);
      assert.ok(STRINGS.bn[`${s.id}_short`], s.id);
    }
  });
  it('every prefix has a unit name in both languages', () => {
    for (const p of PREFIXES) for (const l of ['bn', 'en']) assert.ok(STRINGS[l][`u_${p.key}`], `${l} u_${p.key}`);
  });
});
