// The student kit's options, tried on their own (test/kit.html, no figure): the quiz's reserved lines and the picked
// choice, the শেখো sheet's alignment, labels changed in place and placed clear of each other, the coach's label,
// pointer capture that never throws, the 3D arrow and thick lines in GLB exports.
import { expect, test } from '@playwright/test';

async function openKit(page, viewport = { width: 390, height: 700 }) {
  await page.setViewportSize(viewport);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  await page.goto('/test/kit.html');
  await page.waitForFunction(() => /** @type {any} */ (window).kit);
  return errors;
}

/** Builds the student shell with a 3D stage looking at the origin; returns nothing (the parts are on window.t). */
async function shellWithStage(page, options = {}) {
  await page.evaluate((opts) => {
    const { THREE, buildStudentShell, createStage } = /** @type {any} */ (window).kit;
    const root = document.getElementById('app');
    const t = (key, vars) => (vars ? `${key} ${JSON.stringify(vars)}` : key);
    const ui = buildStudentShell(root, t, opts);
    const stage = createStage(ui.canvasHost, { environment: false });
    stage.camera.position.set(0, 0, 10);
    stage.camera.lookAt(0, 0, 0);
    stage.camera.updateMatrixWorld();
    /** @type {any} */ (window).t = { THREE, root, t, ui, stage };
  }, options);
}

test('quiz: lines keep room for the question and the answer; reveal gets the picked choice', async ({ page }) => {
  const errors = await openKit(page);
  await shellWithStage(page, { learnAlign: 'start' });
  const r = await page.evaluate(async () => {
    const { createQuiz } = /** @type {any} */ (window).kit;
    const { root, t, ui } = /** @type {any} */ (window).t;
    root.dataset.mode = 'quiz';
    const text = ui.$('.pvc-q-text');
    const feedback = ui.$('.pvc-q-feedback');
    const before = { text: getComputedStyle(text).minHeight, feedback: getComputedStyle(feedback).minHeight };
    const questions = ['Short?', 'A longer question that needs a second line on a phone?'];
    const picks = [];
    const quiz = createQuiz({
      ui,
      t,
      emit: () => {},
      questions: 2,
      lines: { text: 2, feedback: 2 },
      hooks: {
        prepare: (i) => ({ text: questions[i], choices: [10, 20, 30, 40], expected: 30, tolerance: 1, label: String }),
        reveal: (_q, correct, picked) => {
          picks.push({ correct, ...picked });
          return 'worked';
        },
      },
    });
    await quiz.start();
    const first = {
      sheet: ui.quiz.offsetHeight,
      text: text.offsetHeight,
      lines: Math.round(text.scrollHeight / parseFloat(getComputedStyle(text).lineHeight)),
    };
    quiz.choose(1);
    await quiz.next();
    const second = {
      sheet: ui.quiz.offsetHeight,
      text: text.offsetHeight,
      lines: Math.round(text.scrollHeight / parseFloat(getComputedStyle(text).lineHeight)),
    };
    quiz.choose(2);
    return {
      before,
      first,
      second,
      picks,
      lineHeight: parseFloat(getComputedStyle(text).lineHeight),
      learnJustify: getComputedStyle(ui.learn).justifyContent,
    };
  });
  // without the option nothing changes: no room kept for the question, one line for the answer (15px × 1.45)
  expect(r.before).toEqual({ text: 'auto', feedback: '21.75px' });
  expect(r.second.lines).toBe(2);
  expect(r.first.text).toBeCloseTo(2 * r.lineHeight, 0);
  expect(r.second.sheet).toBe(r.first.sheet);
  expect(r.picks).toEqual([
    { correct: false, index: 1, value: 20 },
    { correct: true, index: 2, value: 30 },
  ]);
  expect(r.learnJustify).toBe('flex-start');
  expect(errors).toEqual([]);
});

test('annotations: setText and update change a label in place; spots keep labels clear of each other', async ({ page }) => {
  const errors = await openKit(page);
  await shellWithStage(page);
  const r = await page.evaluate(async () => {
    const { createAnnotations } = /** @type {any} */ (window).kit;
    const { THREE, ui, stage } = /** @type {any} */ (window).t;
    const frame = () => new Promise((done) => requestAnimationFrame(() => done(undefined)));
    const P = new THREE.Vector3(0, 0, 0);
    const mid = { x: stage.width / 2, y: stage.height / 2 };
    const anno = createAnnotations({ stage, layer: ui.annoLayer });
    anno.add('a', { text: 'Label A', point: () => P, dx: 0, dy: -40 });
    stage.render();
    await frame();
    const el = ui.annoLayer.querySelector('.pvc-anno');
    const shown = el.classList.contains('in');
    const wide = anno.box('a');
    anno.setText('a', 'A much longer label');
    stage.render();
    const longer = anno.box('a');
    const text = el.textContent;
    const same = ui.annoLayer.querySelectorAll('.pvc-anno').length === 1 && ui.annoLayer.querySelector('.pvc-anno') === el;
    anno.update('a', { dx: 30, dy: 0, text: 'A' });
    stage.render();
    const moved = anno.box('a');
    anno.update('a', { dx: 0, dy: -40, text: 'Label A' });

    // b would sit on a: it takes its next spot (below), and stays there once a has gone
    anno.add('b', {
      text: 'Label B',
      point: () => P,
      spots: [
        { dx: 0, dy: -40 },
        { dx: 0, dy: 40 },
      ],
    });
    stage.render();
    const b1 = anno.box('b');
    anno.remove('a');
    stage.render();
    const b2 = anno.box('b');
    anno.update('b', {
      spots: [
        { dx: 0, dy: -40 },
        { dx: 0, dy: 40 },
      ],
    }); // new spots: the best one again
    stage.render();
    const b3 = anno.box('b');

    // an avoid function (an arrow's box) covering everything above the point; c is optional: hidden if nothing fits
    const top = { left: 0, top: 0, right: stage.width, bottom: mid.y - 8 };
    anno.add('c', { text: 'C', point: () => P, spots: [{ dx: 0, dy: -60 }], avoid: [() => top], optional: true });
    stage.render();
    const c = ui.annoLayer.querySelectorAll('.pvc-anno')[1];
    return {
      shown,
      same,
      stillShown: el.classList.contains('in'),
      text,
      grew: longer.right - longer.left > wide.right - wide.left,
      moved,
      mid,
      b1,
      b2,
      b3,
      cHidden: getComputedStyle(c).visibility,
      missing: anno.setText('nope', 'x'),
    };
  });
  expect(r.shown && r.same && r.stillShown).toBe(true);
  expect(r.text).toBe('A much longer label');
  expect(r.grew).toBe(true);
  expect(r.moved.left).toBeCloseTo(r.mid.x + 30, 0);
  expect(r.b1.top).toBeGreaterThan(r.mid.y); // below the point
  expect(r.b2).toEqual(r.b1); // kept its spot
  expect(r.b3.bottom).toBeLessThan(r.mid.y); // above again
  expect(r.cHidden).toBe('hidden');
  expect(r.missing).toBe(false);
  expect(errors).toEqual([]);
});

test('coach: the label follows a function, goes where labelAt says, and the hand may come near the bottom', async ({ page }) => {
  const errors = await openKit(page);
  await shellWithStage(page);
  const r = await page.evaluate(async () => {
    const { createCoach, createTweener } = /** @type {any} */ (window).kit;
    const { t, ui, stage } = /** @type {any} */ (window).t;
    const wait = (ms) => new Promise((done) => setTimeout(done, ms));
    const tweener = createTweener();
    const spot = { x: 100, y: stage.height - 30 };
    let n = 1;
    const make = (extra) =>
      createCoach({
        stage,
        layer: ui.coachLayer,
        t,
        loupe: null,
        tweener,
        object: { label: 'coach_drag', candidates: () => [spot], grabbable: () => true, ...extra },
      });
    const state = () => {
      const hand = ui.coachLayer.querySelector('.pvc-coach');
      const label = ui.coachLayer.querySelector('.pvc-coach-label');
      const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(label.style.transform);
      return { hand: hand.classList.contains('in'), text: label.textContent, x: m ? Number(m[1]) : null, y: m ? Number(m[2]) : null };
    };

    // by default no hand within 48 px of the bottom (the hint line)
    let coach = make({});
    coach.start(0);
    await wait(30);
    stage.render();
    const plain = state();
    coach.dispose();

    coach = make({ label: () => `drag ${n}`, labelAt: 'right', inset: { bottom: 16 } });
    coach.start(0);
    await wait(30);
    stage.render();
    const first = state();
    n = 2;
    stage.render();
    const second = state();
    coach.dispose();
    return { plain, first, second, spot };
  });
  expect(r.plain.hand).toBe(false);
  expect(r.first.hand).toBe(true);
  expect(r.first.text).toBe('drag 1');
  expect(r.second.text).toBe('drag 2');
  expect(r.first.x).toBeGreaterThan(r.spot.x + 20); // beside the hand, not under it
  expect(r.first.y).toBeLessThan(r.spot.y);
  expect(errors).toEqual([]);
});

test('pointer: capture never throws for a synthetic pointer; the magnifier still drags', async ({ page }) => {
  const errors = await openKit(page);
  await shellWithStage(page);
  const r = await page.evaluate(() => {
    const { capturePointer, releasePointer, createLoupe } = /** @type {any} */ (window).kit;
    const { ui, stage } = /** @type {any} */ (window).t;
    const took = capturePointer(ui.canvasHost, 4242);
    releasePointer(ui.canvasHost, 4242);
    const loupe = createLoupe({ stage, layer: ui.lensLayer });
    loupe.setVisible(true);
    stage.render();
    const handle = ui.lensLayer.querySelector('.pvc-lens-handle');
    const b = handle.getBoundingClientRect();
    handle.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 77, bubbles: true, cancelable: true, clientX: b.x + 4, clientY: b.y + 4 }));
    return { took, dragging: ui.lensLayer.querySelector('.pvc-lens').classList.contains('dragging') };
  });
  expect(r).toEqual({ took: false, dragging: true });
  expect(errors).toEqual([]);
});

test('arrow and thick lines: drawn, and exported to GLB (thick lines as glTF lines)', async ({ page }) => {
  const errors = await openKit(page);
  await shellWithStage(page);
  const r = await page.evaluate(async () => {
    const { THREE, createArrow, exportGLB, Line2, LineGeometry, LineMaterial } = /** @type {any} */ (window).kit;
    const { stage } = /** @type {any} */ (window).t;
    const group = new THREE.Group();
    group.name = 'Model';
    const arrow = createArrow({ color: '#d9480f', radius: 0.05 });
    arrow.set(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(2, 0, 0), 2);
    const tip = arrow.tip.toArray();
    const short = createArrow({ radius: 0.05, name: 'Short' });
    short.setVector(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0.1, 0)); // shorter than its head
    const zero = createArrow({ name: 'Zero' });
    zero.set(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0);
    const geometry = new LineGeometry();
    geometry.setPositions([-2, 1, 0, 0, 1.5, 0, 2, 1, 0]);
    const line = new Line2(geometry, new LineMaterial({ color: 0x1f5fae, linewidth: 4 }));
    line.name = 'Trail';
    group.add(arrow.root, short.root, zero.root, line);
    stage.scene.add(group);
    stage.render();
    const buf = await exportGLB(group, { units: 'm', name: 'kit-test' });
    const view = new DataView(buf);
    const jsonLength = view.getUint32(12, true);
    const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLength)));
    const modes = gltf.meshes.flatMap((m) => m.primitives.map((p) => p.mode ?? 4));
    const trail = gltf.nodes.find((n) => n.name === 'Trail');
    const linePrim = trail && gltf.meshes[trail.mesh].primitives[0];
    return {
      tip,
      shortVisible: short.root.visible,
      zeroVisible: zero.root.visible,
      names: gltf.nodes.map((n) => n.name),
      modes,
      lineVertices: linePrim ? gltf.accessors[linePrim.attributes.POSITION].count : 0,
      stillInScene: line.parent === group,
    };
  });
  expect(r.tip).toEqual([1, 0, 0]);
  expect(r.shortVisible).toBe(true);
  expect(r.zeroVisible).toBe(false);
  expect(r.names).toEqual(expect.arrayContaining(['ArrowShaft', 'ArrowHead', 'ShortHead', 'Trail']));
  expect(r.names).not.toContain('Zero');
  expect(r.modes).toContain(1); // LINES
  expect(r.lineVertices).toBe(4); // two segments
  expect(r.stillInScene).toBe(true); // the figure's own scene is not touched
  expect(errors).toEqual([]);
});
