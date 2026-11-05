// The rule of the page: an object reflects only its own colour, absorbs the rest, and looks black when nothing is left.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  absorbed,
  BANDS,
  BLACK_BELOW,
  isBlack,
  LAMP,
  leaving,
  LIGHTS,
  looks,
  reflected,
  REFLECTANCE,
  shuffle,
  toEye,
} from '../../assets/colour-of-objects/src/reading.js';

test('colour-of-objects: the band is the spectrum in order', () => {
  assert.deepEqual(BANDS, ['violet', 'blue', 'green', 'yellow', 'orange', 'red']);
  assert.deepEqual(LIGHTS.white, BANDS);
});

test('colour-of-objects: white light, each object keeps only its own colour', () => {
  assert.deepEqual(reflected('rose', 'white'), ['red']);
  assert.deepEqual(reflected('leaf', 'white'), ['green']);
  assert.equal(absorbed('rose', 'white').length, 5);
  assert.ok(!absorbed('rose', 'white').includes('red'));
  assert.ok(!absorbed('leaf', 'white').includes('green'));
  assert.equal(looks('rose', 'white'), 'red');
  assert.equal(looks('leaf', 'white'), 'green');
  assert.deepEqual(toEye('white'), ['red', 'green']);
});

test('colour-of-objects: the book: red light blacks the leaf, green light the rose', () => {
  assert.equal(looks('rose', 'red'), 'red');
  assert.equal(looks('leaf', 'red'), 'black');
  assert.deepEqual(reflected('leaf', 'red'), []);
  assert.deepEqual(absorbed('leaf', 'red'), ['red']);
  assert.equal(looks('leaf', 'green'), 'green');
  assert.equal(looks('rose', 'green'), 'black');
  assert.deepEqual(toEye('red'), ['red']);
  assert.deepEqual(toEye('green'), ['green']);
});

test('colour-of-objects: blue light has neither colour', () => {
  assert.equal(looks('rose', 'blue'), 'black');
  assert.equal(looks('leaf', 'blue'), 'black');
  assert.deepEqual(toEye('blue'), []);
});

test('colour-of-objects: every colour in the light is either reflected or absorbed', () => {
  for (const light of Object.keys(LIGHTS))
    for (const object of ['rose', 'leaf']) {
      const both = [...reflected(object, light), ...absorbed(object, light)].sort();
      assert.deepEqual(both, [...LIGHTS[light]].sort());
    }
});

test('colour-of-objects: the 3D colours are light × reflectance, channel by channel', () => {
  assert.deepEqual(leaving('rose', 'green'), [0, REFLECTANCE.rose[1], 0]);
  assert.deepEqual(leaving('leaf', 'red'), [REFLECTANCE.leaf[0], 0, 0]);
  assert.deepEqual(leaving('grey', 'red'), [REFLECTANCE.grey[0], 0, 0]); // the grey vase shows the light's own colour
  assert.deepEqual(leaving('card', 'red'), [REFLECTANCE.card[0], 0, 0]); // the test's white paper looks red in red light
  assert.deepEqual(leaving('rose', 'white'), REFLECTANCE.rose);
  for (const light of ['white', 'red', 'green', 'blue']) assert.equal(LAMP[light].length, 3);
});

test('colour-of-objects: the two rules agree: black in the words is black on the screen', () => {
  for (const light of Object.keys(LIGHTS))
    for (const object of ['rose', 'leaf']) assert.equal(isBlack(object, light), looks(object, light) === 'black', `${object} in ${light}`);
  assert.ok(Math.max(...leaving('rose', 'green')) < BLACK_BELOW);
});

test('colour-of-objects: shuffle keeps every item', () => {
  assert.deepEqual(shuffle([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
});
