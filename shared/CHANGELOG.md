# Shared kit changelog

The version in `shared/lib/VERSION` covers everything figures load from `shared/lib/` (stage, bridge, tween, the
student kit). Every zip records it in `PACKAGE.json` as `kit`. Bump it with each change to `shared/lib/`:
patch for fixes, minor for additions, major when a figure has to change to keep working. Run the visual comparison
across all figures before merging a kit change (`npm run test:visual`).

## 1.3.0 (2026-10-25)

One action, one result, one rule: the owner found the শেখো panels of most figures (chapter 2 especially) too boxy and
a bit overwhelming, and asked for a distinctive button wherever the student should touch something, in the picture
or in the panel. Added, nothing changes for existing figures (they don't use it yet; visual comparison: identical in
all figures). Tested in `test/browser/kit.spec.mjs` (on `test/kit.html`).
- `action.js` (new): `createAction({ stage, layer, host, t, step, label, icon, target, radius | worldRadius, avoid,
  onAct, pulse })` → `{ button, marker, badge, set, refresh, hide(reason), show(reason), flash, update, box, visible,
  dispose }`. The big action button (an accent pill: a numbered badge, the verb, a hand; a real button, ≥ 44 px) and
  its twin on the 3D view: a dashed ring round the part to touch (a point with a radius, or an Object3D/Box3 with the
  ring fitted round its box on the screen, projected every frame) with the same numbered badge, pulsing gently (not
  under prefers-reduced-motion). The ring lets taps through to the figure's raycast; the badge (a 46 px target) does
  the action too. The badge keeps clear of the corner buttons, the hint and the figure's labels (`avoid`). The marker
  hides by itself while a finger drags on the view, while the button is disabled and during the test.
- `shell.js`: `cleanSheet(t, { examples, quiet, lines })` (one row of example words, the action's slot with quiet
  secondary buttons, one result line, one rule line) and `bindCleanSheet(ui.learn)` → `{ words, choose, result,
  outcome, rule }`.
- `student.css`: `.pvc-examples` (a row of words, the chosen one underlined, a small result under a word), `.pvc-act`
  (the action pill and its badge), `.pvc-act-marker` (ring and badge on the view), `.pvc-quiet` (quiet secondary
  buttons: icon and words, only the icon in a phone-wide panel), `.pvc-outcome` (one result line, the number in
  `<b>` larger), `.pvc-rule` (the rule line). Light and dark.
- `quiz.js`: `createQuiz({ action })` hides the action's marker while the test runs.
- `annotations.js`: `boxes()`, the boxes of every label shown (for `createAction`'s `avoid`).
- `icons.js`: `hand` (the coach's hand, filled).

## 1.2.0 (2026-10-25)

Added, for what the chapter-2 figures had to work round; nothing changes for existing figures (visual comparison:
identical in all 13 figures). Tested in `test/browser/kit.spec.mjs` (on `test/kit.html`, the kit without a figure).
- `quiz.js`: `createQuiz({ lines: { text, feedback } })` keeps room for that many lines of question and worked answer,
  so the sheet (and the 3D view) keeps its size when a question wraps (`--pvc-q-text-min` / `--pvc-q-feedback-min`
  in `student.css`). `reveal(q, correct, picked)` gets `{ index, value }` of the tapped choice.
- `shell.js`: `buildStudentShell(…, { learnAlign: 'start' })` keeps the শেখো content at the top when the পরীক্ষা
  sheet makes the panel taller.
- `annotations.js`: `setText(id, html)` and `update(id, { dx, dy, text, point, color, spots, avoid, optional })`
  change a label in place (no fade-in again); `spots` + `avoid` place a label clear of the other labels, of elements
  (corner buttons, hint) and of boxes the figure gives (arrows); `box(id)`. `createAnnotations({ avoid })`.
- `coach.js`: `object.label` may be a function (read while the hand shows); `object.labelAt` (side, list of sides or
  function) and `object.labelAvoid` choose where the words go; `object.inset` replaces the fixed 16 px edges and the
  48 px at the bottom.
- `pointer.js` (new): `capturePointer` / `releasePointer`, which never throw for synthetic or lifted pointers. The
  magnifier uses it (its drag no longer stops half way for a synthetic pointer).
- `arrow.js` (new): `createArrow`, a 3D vector arrow (shaft and cone, meshes) with `set(from, dir, length)`.
- three's thick lines (`lines/Line2.js`, `LineSegments2`, `LineGeometry`, `LineMaterial`) are vendored;
  `export-glb.js` turns them into plain glTF lines instead of dropping them.
- `icons.js`: `arrowR`. The bundled Noto Sans Bengali has no ✓ ✗ → (use `ICONS.check`, `close`, `arrowR`).

## 1.1.1 (2026-10-24)

Fixes for phones; nothing changes for existing figures (visual comparison: identical):
- `stage.js`: draws again at once when the stage is resized. Before, the canvas stayed blank until the next
  frame: a white flash when a phone turned, or when the panel under the 3D view changed height.
- `student.css`: the student view's buttons get `touch-action: manipulation`, so quick taps (start, stop, next)
  never zoom the page on a phone.
- Tested in `test/browser/phone.spec.mjs`.

## 1.1.0 (2026-10-24)

Added, nothing changed for existing figures (visual comparison: identical):
- `figure.js`: `startFigure` (asset.json → URL parameters → font → app → bridge), `connectFigure` with the standard
  commands (get, set, reset, capture, export-glb, seek, duration), `readParams`, `loadFonts`, `loadManifest`.
- `export-glb.js`: GLB export of any figure in metres, instanced marks baked to vertex-coloured meshes.
- `timeline.js`: animations as a pure function of time (seek, loop, exact video frames).
- `model-viewer.js` (+ `.pvc-model` styles in student.css): the student viewer for static GLB figures.
- `icons.js`: `pause`.
- JSDoc types for `tween.animate` and `createLoupe` options.

## 1.0.0 (2026-10-24)

First versioned release: `stage.js` (renderer, studio lighting, render on demand, capture), `bridge.js` and
`host.js` (postMessage protocol), `tween.js`, and the student kit (`student/`: shell and layout, quiz, coach,
magnifier, materials, sounds, icons, annotations).
