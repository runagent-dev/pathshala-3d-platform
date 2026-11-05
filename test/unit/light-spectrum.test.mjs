// The physics of light-spectrum: the eye's curve, the colours, and the CD as a grating.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  alongWall,
  BANDS,
  COLOURS,
  CD,
  clampNm,
  cssColour,
  diffracted,
  DISC,
  glow,
  hue,
  isVisible,
  kindOf,
  landing,
  linearColour,
  MAX_NM,
  MIN_NM,
  nmAt,
  observer,
  PITCH_NM,
  sensitivity,
  shuffle,
  SPOT,
  TO_SUN,
  WALL,
  WALL_NORMAL,
} from '../../assets/light-spectrum/src/reading.js';

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const close = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≉ ${b}`);

test("the eye: the book's curve peaks at 1 near 555 nm, and is nothing outside the table", () => {
  assert.equal(sensitivity(555), 1);
  close(sensitivity(500), 0.323);
  close(sensitivity(600), 0.631);
  assert.ok(sensitivity(400) < 0.001 && sensitivity(700) < 0.005);
  let best = 0;
  for (let nm = 400; nm <= 700; nm++) if (sensitivity(nm) > sensitivity(best)) best = nm;
  assert.equal(best, 555);
  assert.deepEqual(observer(300), [0, 0, 0]);
  assert.deepEqual(observer(900), [0, 0, 0]);
});

test("colours: the book's six in order, the two invisible kinds, and nothing past the ends on the wall", () => {
  assert.deepEqual(
    COLOURS.map((c) => c.id),
    ['violet', 'blue', 'green', 'yellow', 'orange', 'red'],
  );
  for (const c of COLOURS) assert.equal(kindOf(c.nm), c.id);
  assert.equal(kindOf(399), 'uv');
  assert.equal(kindOf(701), 'ir');
  assert.ok(isVisible(400) && isVisible(700) && !isVisible(399) && !isVisible(701));
  assert.equal(glow(390), 0);
  assert.equal(glow(710), 0);
  // the band fades into the wall by its opacity: the colour itself never goes dark at the ends
  for (const nm of [396, 400, 700, 704]) assert.ok(Math.max(...hue(nm)) > 0.99, `${nm} keeps its colour`);
  assert.deepEqual(linearColour(350), [0, 0, 0]);
  const [r, g, b] = linearColour(660);
  assert.ok(r > g && r > b, 'red is red');
  const [r2, g2, b2] = linearColour(530);
  assert.ok(g2 > r2 && g2 > b2, 'green is green');
  const [r3, g3, b3] = linearColour(450);
  assert.ok(b3 > r3 && b3 > g3, 'blue is blue');
  assert.match(cssColour(550), /^#[0-9a-f]{6}$/);
});

test('the bands of চিত্র ৮.০১ follow each other, gamma first and radio last', () => {
  assert.deepEqual(
    BANDS.map((b) => b.id),
    ['gamma', 'xray', 'uv', 'visible', 'ir', 'micro', 'radio'],
  );
  for (let i = 1; i < BANDS.length; i++) close(BANDS[i].from, BANDS[i - 1].to);
  close(BANDS[3].from, Math.log10(4e-7));
  close(BANDS[3].to, Math.log10(7e-7));
});

test('the disc: a real CD, its axes square to each other', () => {
  assert.equal(CD.radius * 2, 12);
  assert.equal(CD.hole * 2, 1.5);
  close(dot(DISC.normal, DISC.up), 0);
  close(dot(DISC.normal, DISC.side), 0);
  close(dot(DISC.up, DISC.side), 0);
});

test('the grating: normal incidence gives the textbook angles, sin θ = λ / d', () => {
  // with the sun straight along the normal, the first order leaves at asin(λ/d) from it
  const out = (nm) => diffracted(nm, { sun: DISC.normal });
  const angle = (nm) => (Math.acos(dot(out(nm), DISC.normal)) * 180) / Math.PI;
  close(angle(400), (Math.asin(400 / 1600) * 180) / Math.PI);
  assert.ok(Math.abs(angle(400) - 14.5) < 0.05);
  assert.ok(Math.abs(angle(700) - 25.9) < 0.05);
  assert.equal(PITCH_NM, 1600);
});

test('the zero order is the law of reflection, and each order gains exactly λ/d along the radius', () => {
  const r = diffracted(0);
  close(dot(r, DISC.normal), dot(TO_SUN, DISC.normal));
  close(dot(r, DISC.up), -dot(TO_SUN, DISC.up));
  close(dot(r, DISC.side), -dot(TO_SUN, DISC.side));
  for (const nm of [400, 550, 700]) {
    const d = diffracted(nm);
    close(dot(d, DISC.up) - dot(r, DISC.up), nm / PITCH_NM);
    close(dot(d, DISC.side), dot(r, DISC.side));
    close(dot(d, d), 1);
  }
});

test('on the wall: every ray lands on the board, and red lands farthest from the white patch', () => {
  const white = landing(0);
  let last = white.y;
  for (let nm = MIN_NM; nm <= MAX_NM; nm += 10) {
    const p = landing(nm);
    assert.ok(p, `${nm} reaches the wall`);
    close(dot({ x: p.x - WALL.at.x, y: 0, z: p.z - WALL.at.z }, WALL_NORMAL), 0, 1e-9);
    assert.ok(p.y > last, 'the height grows with the wavelength');
    assert.ok(p.y < WALL.height, `${nm} is on the board`);
    assert.ok(Math.abs(alongWall(p)) < WALL.half, `${nm} is on the board, sideways`);
    last = p.y;
  }
  const gap = (nm) => Math.hypot(landing(nm).x - white.x, landing(nm).y - white.y, landing(nm).z - white.z);
  assert.ok(gap(700) > gap(400));
  assert.ok(dot(diffracted(550), WALL_NORMAL) < 0, 'the light meets the face of the wall');
  assert.ok(SPOT.y > landing(700).y - 1);
});

test('the marker: the height on the wall gives the wavelength back', () => {
  for (const nm of [340, 400, 555, 700, 790]) close(nmAt(landing(nm).y), nm, 1e-3);
  assert.equal(clampNm(100), MIN_NM);
  assert.equal(clampNm(5000), MAX_NM);
  assert.equal(clampNm('x'), 550);
});

test('shuffle keeps every item', () => {
  assert.deepEqual(shuffle([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
});
