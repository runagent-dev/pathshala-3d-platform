// The student kit's options, tried on their own (test/kit.html, no figure): the quiz's reserved lines and the picked
// choice, the শেখো sheet's alignment, labels changed in place and placed clear of each other, the coach's label,
// pointer capture that never throws, the 3D arrow and thick lines in GLB exports, the action button and its marker on
// the 3D view, and the clean শেখো sheet (one action, one result, one rule).
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

const ACT_ROW = '<div class="pvc-act-row"><div class="pvc-act-slot"></div></div>';

test('action: the button and a tap on the badge call onAct; the marker follows its target, keeps clear of the buttons, hides', async ({ page }) => {
  const errors = await openKit(page);
  await shellWithStage(page, { learn: ACT_ROW });
  const r = await page.evaluate(async () => {
    const { tap } = /** @type {any} */ (window).kit;
    const { THREE, createAction, createQuiz } = /** @type {any} */ (window).kit;
    const { root, t, ui, stage } = /** @type {any} */ (window).t;
    const P = new THREE.Vector3(0, 0, 0);
    let calls = 0;
    const action = createAction({
      stage,
      layer: ui.coachLayer,
      host: ui.$('.pvc-act-slot'),
      t,
      step: 1,
      label: 'act_push',
      target: () => P,
      radius: 30,
      avoid: [ui.corner, ui.hint],
      onAct: () => calls++,
    });
    const draw = async () => {
      stage.render();
      await new Promise((done) => requestAnimationFrame(() => done(undefined)));
    };
    const rel = (el) => {
      const o = stage.canvas.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      return { left: b.left - o.left, top: b.top - o.top, right: b.right - o.left, bottom: b.bottom - o.top };
    };
    const ring = () => {
      const b = rel(ui.$('.pvc-act-ring rect.dash'));
      return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2, w: b.right - b.left };
    };
    const toScreen = (p) => {
      const v = p.clone().project(stage.camera);
      return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height };
    };
    await draw();
    const btn = action.button;
    const first = { shown: action.visible, ring: ring(), at: toScreen(P), text: btn.textContent, aria: btn.getAttribute('aria-label') };
    // the badge sits just outside the ring, not over the part
    const disc = rel(ui.$('.pvc-act-badge .pvc-act-num'));
    const discCentre = { x: (disc.left + disc.right) / 2, y: (disc.top + disc.bottom) / 2 };
    const fromCentre = Math.hypot(discCentre.x - first.ring.x, discCentre.y - first.ring.y);
    // it follows the point
    P.set(1.5, -1, 0);
    await draw();
    const moved = { ring: ring(), at: toScreen(P) };
    // the button and a tap on the badge both do the action
    btn.click();
    await tap(ui.$('.pvc-act-badge'));
    const afterClicks = calls;
    // near the top right corner the badge keeps clear of the corner buttons, inside the view
    const corner = rel(ui.corner);
    const ray = new THREE.Vector3(((corner.left - 10) / stage.width) * 2 - 1, -((corner.bottom + 6) / stage.height) * 2 + 1, 0.5)
      .unproject(stage.camera)
      .sub(stage.camera.position)
      .normalize();
    P.copy(stage.camera.position).addScaledVector(ray, 10 / -ray.z); // on the plane z = 0
    await draw();
    const badge = rel(ui.$('.pvc-act-badge .pvc-act-num'));
    const overlapsCorner = badge.left < corner.right && badge.right > corner.left && badge.top < corner.bottom && badge.bottom > corner.top;
    const inside = badge.left >= 0 && badge.top >= 0 && badge.right <= stage.width && badge.bottom <= stage.height;
    const nearCorner = ring();
    P.set(0, 0, 0);
    // hide / show with reasons that add up (a set)
    action.hide('run');
    action.hide('other');
    action.hide('other');
    await draw();
    const hidden = action.visible;
    action.show('run');
    await draw();
    const stillHidden = action.visible;
    action.show('other');
    await draw();
    const backAgain = action.visible;
    // disabled: no call, no marker
    action.set({ enabled: false });
    btn.click();
    await draw();
    const disabled = { calls, visible: action.visible, disabled: btn.disabled, box: action.box(), ringBox: action.ringBox() };
    action.set({ enabled: true, step: 2, label: () => 'next words', caption: () => 'cap' });
    await draw();
    const changed = {
      num: ui.$('.pvc-act-badge .pvc-act-num').textContent,
      cap: ui.$('.pvc-act-cap').textContent,
      text: btn.textContent,
      aria: btn.getAttribute('aria-label'),
    };
    // a drag on the view hides it until the finger lifts (a small wobble does not)
    const c = stage.canvas.getBoundingClientRect();
    const pe = (type, x) => new PointerEvent(type, { pointerId: 9, clientX: c.left + x, clientY: c.top + 100, bubbles: true });
    ui.canvasHost.dispatchEvent(pe('pointerdown', 100));
    ui.canvasHost.dispatchEvent(pe('pointermove', 104));
    const smallMove = action.visible;
    ui.canvasHost.dispatchEvent(pe('pointermove', 140));
    const dragging = action.visible;
    ui.canvasHost.dispatchEvent(pe('pointerup', 140));
    await draw();
    const released = action.visible;
    // the test hides it: by the mode on the root (box() and ringBox() say null too), and through createQuiz({ action })
    root.dataset.mode = 'quiz';
    const inQuiz = {
      visible: action.visible,
      css: getComputedStyle(action.marker).visibility,
      ringCss: getComputedStyle(ui.$('.pvc-act-under')).visibility,
      box: action.box(),
      ringBox: action.ringBox(),
    };
    root.dataset.mode = 'explore';
    const quiz = createQuiz({
      ui,
      t,
      emit: () => {},
      action,
      hooks: { prepare: () => ({ text: 'q', choices: [1, 2, 3, 4], expected: 1, tolerance: 0.5, label: String }) },
    });
    await quiz.start();
    await draw();
    const quizRunning = action.visible;
    quiz.stop();
    await draw();
    const quizLeft = action.visible;
    // an object target: the ring goes round its box on the screen
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), new THREE.MeshBasicMaterial());
    mesh.rotation.y = 0.5;
    stage.scene.add(mesh);
    action.set({ target: () => mesh });
    await draw();
    const box = new THREE.Box3().setFromObject(mesh);
    const corners = [];
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(toScreen(new THREE.Vector3(x, y, z)));
    const rb = rel(ui.$('.pvc-act-ring rect.dash'));
    const encloses = corners.every((p) => p.x > rb.left && p.x < rb.right && p.y > rb.top && p.y < rb.bottom);
    const ringBox = action.ringBox();
    const bb = btn.getBoundingClientRect();
    return {
      first,
      fromCentre,
      moved,
      afterClicks,
      overlapsCorner,
      inside,
      nearCorner,
      hidden,
      stillHidden,
      backAgain,
      disabled,
      changed,
      smallMove,
      dragging,
      released,
      inQuiz,
      quizRunning,
      quizLeft,
      encloses,
      ringBoxCovers: ringBox.left <= rb.left + 1 && ringBox.right >= rb.right - 1 && ringBox.top <= rb.top + 1 && ringBox.bottom >= rb.bottom - 1,
      button: { h: bb.height, type: btn.type },
      badgeHit: ui.$('.pvc-act-badge').getBoundingClientRect().height,
      pointerEvents: getComputedStyle(ui.$('.pvc-act-ringbox')).pointerEvents,
    };
  });
  expect(r.first.shown).toBe(true);
  expect(r.first.ring.x).toBeCloseTo(r.first.at.x, 0);
  expect(r.first.ring.y).toBeCloseTo(r.first.at.y, 0);
  expect(r.first.ring.w).toBeGreaterThanOrEqual(60);
  expect(r.fromCentre).toBeGreaterThan(r.first.ring.w / 2 + 2); // the disc's middle is outside the ring line
  expect(r.first.text).toContain('act_push');
  expect(r.first.aria).toBe('act_push');
  expect(r.moved.ring.x).toBeCloseTo(r.moved.at.x, 0);
  expect(r.moved.ring.y).toBeCloseTo(r.moved.at.y, 0);
  expect(r.afterClicks).toBe(2); // the button's click and the badge's tap
  expect(r.nearCorner.y).toBeLessThan(80); // the ring really was up by the corner buttons
  expect(r.overlapsCorner).toBe(false);
  expect(r.inside).toBe(true);
  expect([r.hidden, r.stillHidden, r.backAgain]).toEqual([false, false, true]);
  expect(r.disabled).toEqual({ calls: 2, visible: false, disabled: true, box: null, ringBox: null });
  expect(r.changed).toEqual({ num: '2', cap: 'cap', text: '2next words', aria: 'next words' });
  expect([r.smallMove, r.dragging, r.released]).toEqual([true, false, true]);
  expect(r.inQuiz).toEqual({ visible: false, css: 'hidden', ringCss: 'hidden', box: null, ringBox: null });
  expect([r.quizRunning, r.quizLeft]).toEqual([false, true]);
  expect(r.encloses).toBe(true);
  expect(r.ringBoxCovers).toBe(true);
  expect(r.button).toEqual({ h: expect.any(Number), type: 'button' });
  expect(r.button.h).toBeGreaterThanOrEqual(44);
  expect(r.badgeHit).toBeGreaterThanOrEqual(44);
  expect(r.pointerEvents).toBe('none');
  expect(errors).toEqual([]);
});

test('action: Enter and Space press the button; the pulse beats three times, still with pulse: false or reduced motion', async ({ page }) => {
  for (const [motion, pulse] of /** @type {const} */ ([
    ['no-preference', true],
    ['no-preference', false],
    ['reduce', true],
  ])) {
    await page.emulateMedia({ reducedMotion: motion });
    const errors = await openKit(page);
    await shellWithStage(page, { learn: ACT_ROW });
    const r = await page.evaluate(async (pulse) => {
      const { THREE, createAction } = /** @type {any} */ (window).kit;
      const { t, ui, stage } = /** @type {any} */ (window).t;
      const w = /** @type {any} */ (window);
      w.calls = 0;
      const action = createAction({
        stage,
        layer: ui.coachLayer,
        host: ui.$('.pvc-act-slot'),
        t,
        label: 'act_push',
        pulse,
        target: () => new THREE.Vector3(),
        onAct: () => w.calls++,
      });
      stage.render();
      await new Promise((done) => requestAnimationFrame(() => done(undefined)));
      action.button.focus();
      const anim = (el, pseudo) => {
        const s = getComputedStyle(el, pseudo);
        return s.animationName === 'none' ? 'none' : `${s.animationName} ×${s.animationIterationCount}`;
      };
      return {
        ring: anim(ui.$('.pvc-act-ring')),
        halo: anim(ui.$('.pvc-act-badge .pvc-act-num'), '::after'),
        button: anim(ui.$('.pvc-act .pvc-act-num'), '::after'),
        focused: document.activeElement === action.button,
        outline: getComputedStyle(action.button).outlineStyle,
      };
    }, pulse);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    const calls = await page.evaluate(() => /** @type {any} */ (window).calls);
    expect(r.focused).toBe(true);
    expect(calls).toBe(2);
    if (motion === 'reduce' || !pulse) expect([r.ring, r.halo, r.button]).toEqual(['none', 'none', 'none']);
    else expect([r.ring, r.halo, r.button]).toEqual(['pvc-act-breathe ×3', 'pvc-act-halo ×3', 'pvc-act-halo ×3']);
    expect(errors).toEqual([]);
  }
});

test('action: the ring is drawn under the labels, ringBox() keeps them off it, the badge never covers one', async ({ page }) => {
  const errors = await openKit(page);
  await shellWithStage(page, { learn: ACT_ROW });
  const r = await page.evaluate(async () => {
    const { THREE, createAction, createAnnotations } = /** @type {any} */ (window).kit;
    const { t, ui, stage } = /** @type {any} */ (window).t;
    const P = new THREE.Vector3();
    let action = null;
    const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
    // a label right next to the target: its first spot would sit on the ring
    anno.add('name', {
      text: 'the part we name',
      point: () => P,
      spots: [
        { dx: 20, dy: -10 },
        { dx: 0, dy: -70 },
        { dx: 0, dy: 70 },
      ],
    });
    action = createAction({
      stage,
      layer: ui.coachLayer,
      host: ui.$('.pvc-act-slot'),
      t,
      label: 'act_push',
      target: () => P,
      radius: 40,
      avoid: [ui.corner, ui.hint, () => anno.boxes()],
    });
    for (let i = 0; i < 3; i++) {
      stage.render();
      await new Promise((done) => requestAnimationFrame(() => done(undefined)));
    }
    const o = stage.canvas.getBoundingClientRect();
    const rel = (el) => {
      const b = el.getBoundingClientRect();
      return { left: b.left - o.left, top: b.top - o.top, right: b.right - o.left, bottom: b.bottom - o.top };
    };
    const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const label = anno.box('name');
    const under = ui.$('.pvc-act-under');
    return {
      order: Boolean(under.compareDocumentPosition(ui.annoLayer) & Node.DOCUMENT_POSITION_FOLLOWING),
      badgeInCoach: ui.coachLayer.contains(action.badge),
      labelOnRing: hit(label, action.ringBox()),
      labelUnderBadge: hit(label, rel(ui.$('.pvc-act-badge .pvc-act-num'))),
      shown: action.visible,
    };
  });
  expect(r.order).toBe(true); // the ring's layer comes before the labels' layer: the labels are drawn over it
  expect(r.badgeInCoach).toBe(true); // the badge is above the labels
  expect(r.shown).toBe(true);
  expect(r.labelOnRing).toBe(false);
  expect(r.labelUnderBadge).toBe(false);
  expect(errors).toEqual([]);
});

test('action: a drag from the badge goes to the view; trigger pointerdown; onAct null; dispose lets go', async ({ page }) => {
  const errors = await openKit(page);
  await shellWithStage(page, {
    learn: '<div class="pvc-act-row"><div class="pvc-act-slot"></div><div class="pvc-act-slot b"></div><div class="pvc-act-slot c"></div></div>',
  });
  const start = await page.evaluate(async () => {
    const { THREE, createAction } = /** @type {any} */ (window).kit;
    const { t, ui, stage } = /** @type {any} */ (window).t;
    const draw = async () => {
      stage.render();
      await new Promise((done) => requestAnimationFrame(() => done(undefined)));
    };
    const canvasDowns = [];
    ui.canvasHost.addEventListener('pointerdown', (e) => canvasDowns.push(Math.round(e.clientX)));
    let taps = 0;
    let avoidCalls = 0;
    const a = createAction({
      stage,
      layer: ui.coachLayer,
      host: ui.$('.pvc-act-slot'),
      t,
      label: 'a',
      target: () => new THREE.Vector3(0, 0, 0),
      avoid: [
        () => {
          avoidCalls++;
          return null;
        },
      ],
      onAct: () => taps++,
    });
    await draw();
    /** @type {any} */ (window).drag = { a, canvasDowns, taps: () => taps, avoidCalls: () => avoidCalls };
    const bb0 = a.badge.getBoundingClientRect();
    return { x: bb0.left + bb0.width / 2, y: bb0.top + bb0.height / 2 };
  });
  // a drag that starts on the badge (a real mouse): no action, the gesture goes to the view under it
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 15, start.y, { steps: 2 });
  await page.mouse.move(start.x + 40, start.y, { steps: 3 });
  await page.mouse.up();
  const r = await page.evaluate(async () => {
    const { tap, THREE, createAction } = /** @type {any} */ (window).kit;
    const { t, ui, stage } = /** @type {any} */ (window).t;
    const { a, canvasDowns, taps: tapsOf, avoidCalls } = /** @type {any} */ (window).drag;
    const draw = async () => {
      stage.render();
      await new Promise((done) => requestAnimationFrame(() => done(undefined)));
    };
    const afterDrag = { taps: tapsOf(), downs: canvasDowns.length };
    // a slow press is not a tap either
    await tap(a.badge, { wait: 700 });
    const afterSlow = tapsOf();
    await tap(a.badge);
    const afterTap = tapsOf();

    // trigger 'pointerdown': the button and the badge act as the finger goes down; the click after it is the same press
    let downs = 0;
    const b = createAction({
      stage,
      layer: ui.coachLayer,
      host: ui.$('.pvc-act-slot.b'),
      t,
      label: 'b',
      trigger: 'pointerdown',
      target: () => new THREE.Vector3(2, 0, 0),
      onAct: () => downs++,
    });
    await draw();
    const br = b.button.getBoundingClientRect();
    const pd = (el, x, y) => el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 41, bubbles: true, clientX: x, clientY: y, button: 0 }));
    pd(b.button, br.left + 5, br.top + 5);
    const onDown = downs;
    b.button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    const afterClick = downs;
    b.button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })); // the keyboard
    const afterKey = downs;
    const bb = b.badge.getBoundingClientRect();
    pd(b.badge, bb.left + 10, bb.top + 10);
    const badgeDown = downs;

    // onAct null: the badge is only a sign, touches go through it
    const c = createAction({
      stage,
      layer: ui.coachLayer,
      host: ui.$('.pvc-act-slot.c'),
      t,
      label: 'c',
      target: () => new THREE.Vector3(-2, 0, 0),
      onAct: null,
    });
    await draw();
    const passive = getComputedStyle(c.badge).pointerEvents;

    // dispose: the frame hooks are let go (the avoid list is not read any more), the elements are gone
    a.dispose();
    const before = avoidCalls();
    await draw();
    await draw();
    return {
      afterDrag,
      afterSlow,
      afterTap,
      onDown,
      afterClick,
      afterKey,
      badgeDown,
      passive,
      leaked: avoidCalls() - before,
      markers: ui.$$('.pvc-act-marker').length,
    };
  });
  expect(r.afterDrag).toEqual({ taps: 0, downs: 1 });
  expect(r.afterSlow).toBe(0);
  expect(r.afterTap).toBe(1);
  expect([r.onDown, r.afterClick, r.afterKey, r.badgeDown]).toEqual([1, 1, 2, 3]);
  expect(r.passive).toBe('none');
  expect(r.leaked).toBe(0);
  expect(r.markers).toBe(4); // two left (b and c), each a ring layer and a badge layer
  expect(errors).toEqual([]);
});

test('clean sheet: one row of words, the chosen one underlined, results under them, steady lines', async ({ page }) => {
  const errors = await openKit(page, { width: 360, height: 640 });
  const r = await page.evaluate(() => {
    const { buildStudentShell, cleanSheet, bindCleanSheet, ICONS } = /** @type {any} */ (window).kit;
    const root = document.getElementById('app');
    const S = { a: 'মাদুর', b: 'কাঠের মেঝে', c: 'বরফ', d: 'ঘর্ষণ নেই', e: 'কাচ', home: 'শুরুতে ফেরাও', floors: 'মেঝে বেছে নাও' };
    const t = (key) => S[key] ?? key;
    const ui = buildStudentShell(root, t, {
      learn: cleanSheet(t, {
        examples: { label: 'floors', results: true, items: ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, label: id })) },
        quiet: [{ act: 'home', label: 'home', icon: ICONS.reset }],
        lines: { outcome: 1, rule: 2 },
      }),
    });
    const sheet = bindCleanSheet(ui.learn);
    const row = ui.$('.pvc-examples');
    const height0 = row.offsetHeight;
    sheet.choose('b');
    sheet.next('c');
    sheet.result('b', '২.৫৫ মি');
    sheet.result('d', 'থামে না');
    const outcome = ui.$('.pvc-outcome');
    const rule = ui.$('.pvc-rule');
    const empty = { outcome: outcome.offsetHeight, rule: rule.offsetHeight };
    sheet.outcome('কাঠের মেঝেতে বইটি <b>২.৫৫ মি</b> গিয়ে থামল');
    sheet.rule('<b>ঘর্ষণ যত কম, বই তত দূরে যায়।</b>');
    const words = sheet.words.map((b) => ({
      on: b.classList.contains('on'),
      checked: b.getAttribute('aria-checked'),
      tab: b.tabIndex,
      fits: b.scrollWidth <= b.clientWidth + 1,
    }));
    const quiet = ui.$('.pvc-quiet');
    return {
      words,
      next: sheet.words.map((b) => b.classList.contains('next')),
      rowFits: row.scrollWidth <= row.clientWidth + 1,
      rowRole: row.getAttribute('role'),
      label: row.getAttribute('aria-label'),
      steadyRow: row.offsetHeight === height0,
      underline: getComputedStyle(ui.$('[data-example="b"]'), '::after').backgroundColor,
      res: ui.$('[data-example="b"] .pvc-ex-res').textContent,
      empty,
      full: { outcome: outcome.offsetHeight, rule: rule.offsetHeight },
      // a figure's own CSS gives the rule more room in one layout
      wider: (() => {
        const css = document.createElement('style');
        css.textContent = '.pvc-rule { --pvc-rule-lines: 4 }';
        document.head.append(css);
        const h = rule.offsetHeight;
        css.remove();
        return h;
      })(),
      quiet: { aria: quiet.getAttribute('aria-label'), act: quiet.dataset.act, w: quiet.offsetWidth, h: quiet.offsetHeight },
      slot: Boolean(ui.$('.pvc-act-row .pvc-act-slot')),
    };
  });
  expect(r.words.map((w) => w.on)).toEqual([false, true, false, false, false]);
  expect(r.words.map((w) => w.checked)).toEqual(['false', 'true', 'false', 'false', 'false']);
  expect(r.words.map((w) => w.tab)).toEqual([-1, 0, -1, -1, -1]); // one Tab stop: the chosen word
  expect(r.next).toEqual([false, false, true, false, false]);
  expect(r.words.every((w) => w.fits)).toBe(true); // five short Bangla words fit at 360 px
  expect(r.rowFits).toBe(true);
  expect([r.rowRole, r.label]).toEqual(['radiogroup', 'মেঝে বেছে নাও']);
  expect(r.steadyRow).toBe(true); // room for the results was kept
  expect(r.underline).not.toBe('rgba(0, 0, 0, 0)');
  expect(r.res).toBe('২.৫৫ মি');
  expect(r.full).toEqual(r.empty); // the lines keep their height
  expect(r.wider).toBeCloseTo(r.empty.rule * 2, -1); // 4 lines instead of 2
  expect(r.quiet).toMatchObject({ aria: 'শুরুতে ফেরাও', act: 'home' });
  expect(r.quiet.w).toBeGreaterThanOrEqual(44);
  expect(r.quiet.h).toBeGreaterThanOrEqual(44);
  expect(r.slot).toBe(true);
  expect(errors).toEqual([]);
});

test('clean sheet: the arrow keys move and choose in the row of words, and never reach the figure', async ({ page }) => {
  const errors = await openKit(page);
  await page.evaluate(() => {
    const { buildStudentShell, cleanSheet, bindCleanSheet } = /** @type {any} */ (window).kit;
    const root = document.getElementById('app');
    const t = (key) => key;
    const ui = buildStudentShell(root, t, {
      learn: cleanSheet(t, { examples: { label: 'floors', items: ['a', 'b', 'c', 'd'].map((id) => ({ id, label: id })) } }),
    });
    const sheet = bindCleanSheet(ui.learn);
    const w = /** @type {any} */ (window);
    w.chosen = [];
    w.sceneKeys = [];
    // the figure: a click chooses, a key on the root is a scene key
    root.addEventListener('click', (e) => {
      const b = /** @type {Element} */ (e.target).closest('[data-example]');
      if (b instanceof HTMLElement) {
        w.chosen.push(b.dataset.example);
        sheet.choose(b.dataset.example);
      }
    });
    root.addEventListener('keydown', (e) => w.sceneKeys.push(e.key));
    sheet.choose('a');
    /** @type {HTMLElement} */ (ui.$('[data-example="a"]')).focus();
  });
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowRight'); // wraps round
  const r = await page.evaluate(() => {
    const w = /** @type {any} */ (window);
    return { chosen: w.chosen, sceneKeys: w.sceneKeys, focus: /** @type {HTMLElement} */ (document.activeElement).dataset.example };
  });
  expect(r.chosen).toEqual(['b', 'c', 'b', 'd', 'a']);
  expect(r.sceneKeys).toEqual([]); // none of those keys reached the figure
  expect(r.focus).toBe('a');
  expect(errors).toEqual([]);
});

test('clean sheet: the action row never wraps; a long verb wraps inside the pill and the row keeps its height', async ({ page }) => {
  // 844×390: the panel is beside the view, 280 px of room
  const errors = await openKit(page, { width: 844, height: 390 });
  const r = await page.evaluate(async () => {
    const { THREE, buildStudentShell, cleanSheet, createAction, createStage, ICONS } = /** @type {any} */ (window).kit;
    const root = document.getElementById('app');
    const t = (key) => key;
    const ui = buildStudentShell(root, t, {
      learn: cleanSheet(t, { quiet: [{ act: 'home', label: 'home', icon: ICONS.reset }], lines: { action: 2, outcome: 1 } }),
    });
    const stage = createStage(ui.canvasHost, { environment: false });
    let words = 'Push';
    const action = createAction({
      stage,
      layer: ui.coachLayer,
      host: ui.$('.pvc-act-slot'),
      t,
      label: () => words,
      target: () => new THREE.Vector3(),
    });
    const row = ui.$('.pvc-act-row');
    const quiet = ui.$('.pvc-quiet');
    const measure = () => ({
      row: row.offsetHeight,
      pill: action.button.offsetHeight,
      text: action.button.querySelector('.pvc-act-text').offsetHeight,
      quietTop: quiet.offsetTop,
      pillTop: action.button.offsetTop,
      outcome: ui.$('.pvc-outcome').offsetTop,
    });
    const short = measure();
    words = 'Push it along the wooden floor now';
    action.refresh();
    const long = measure();
    return { short, long, panel: ui.$('.pvc-panel').clientWidth, overflow: row.scrollWidth - row.clientWidth };
  });
  expect(r.panel).toBeLessThan(320);
  expect(r.long.row).toBe(r.short.row); // the row keeps its height (room for two lines)
  expect(r.long.outcome).toBe(r.short.outcome); // the lines under it do not move
  expect(r.long.text).toBeGreaterThan(r.short.text * 1.5); // the words wrapped inside the pill
  expect(Math.abs(r.long.quietTop + 22 - (r.long.pillTop + r.long.pill / 2))).toBeLessThan(4); // the quiet button stays beside it
  expect(r.overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
