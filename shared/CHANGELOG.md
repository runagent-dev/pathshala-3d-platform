# Shared kit changelog

The version in `shared/lib/VERSION` covers everything figures load from `shared/lib/` (stage, bridge, tween, the
student kit). Every zip records it in `PACKAGE.json` as `kit`. Bump it with each change to `shared/lib/`:
patch for fixes, minor for additions, major when a figure has to change to keep working. Run the visual comparison
across all figures before merging a kit change (`npm run test:visual`).

## 1.9.1

The drag handle's `'turn'` glyph (`createDragHandle({ axis: 'turn' })` and its miniature in the how-to row, both from
`dragDisc`), after a reviewer of total-internal-reflection saw a ☎ telephone handset in it on a phone: at 1× a flat arch
with two thin hooks at its ends looks like a handset. Now a 240° arc with a bold filled arrowhead at each end round a
small pivot dot: "this turns about here". It is unlike the kit's other circular arrows (reset, a plain arrow with one open
head; the rotate pill, always with its ৩৬০°). The dot lies on the right of the handle's `direction` on the screen, the
pivot's side for a clockwise direction; with a curved track (`track.via`) the glyph is mirrored when needed, so the dot is
always on the inside of the curve. In the how-to row the turn miniature is drawn a little larger (17 px, in its 22 px
disc), as its heads were too small to read at 15 px. Only figures with a turn handle change: kaleidoscope, reflection-laws,
refraction-of-light and total-internal-reflection.

## 1.9.0

The stage compiles shaders ahead, after an audit of the chapter 8 figures on an emulated slow phone (CPU 6× slower)
found one real stall: three.js compiles a material's shader the first time it is drawn, so the first tap of a step that
shows new parts froze for 0.3–1 s (right-angle-mirrors at the first fold, kaleidoscope at its first pattern,
hill-road-mirror when the road mirror rises).
- Once the first frame is drawn, the stage compiles every material in the scene in the background
  (`renderer.compileAsync`, one part per task, so the compiling is never one long task; `renderer.compile` where there
  is no compileAsync), then makes each program's first use (its uniform locations) one at a time. `createStage(…,
  { warmUp: false })` turns this off.
- `stage.warmUp({ show, targets, objects, shadows })` for what that pass cannot see: `show` hidden parts (and lamps) of
  later steps, shown for the compile and put back at once; `targets` the figure's own render targets
  (`{ target, scene, camera }`: a mirror, a small picture), compiled with a render target's output; `objects` parts not
  yet in the scene; `shadows` the shadow maps drawn once with the shown parts. Returns a promise; never delays `ready`.
- Parts whose material has its own clipping planes are drawn once instead, as copies into a hidden 1×1 target with the
  canvas's colour space and tone mapping: three's compile keys them by the clipping state the last frame left behind.
- `withShown(objects, fn)` (also `stage.withShown`): runs fn with hidden objects shown (with everything inside and
  above them), then puts every `visible` back; nothing is drawn in between.
Nothing is drawn to the canvas and no picture changes. Without the KHR_parallel_shader_compile extension (software
WebGL, some old phones) the browser compiles only when a program is first used, so the warm-up's first-use pass is where
the waiting happens: in the seconds after load, while the student reads, instead of on a tap.

The how-to row (`howto.js`): in the tightest frames (390×520, a short landscape side panel) `tap` items keep their
words like `drag` items, as a bare hand icon with no words means nothing to a student (parallel-mirrors at 844×390).

## 1.8.0

`createHowTo(ui, t, items, options)` in `student/howto.js`, after the owner found that students cannot tell what the white
disc on the 3D view means ("unless we also show in the white panel that it can be moved, for every type of icon, it will be
very hard for the students to recognise"). A small row under the action row of the শেখো sheet: each control of the view
with a miniature of the same icon (the drag handle's disc, the "⟲ ৩৬০°" pill, the সামনে button, a finger for a tap) and a
few words. Tapping an item pulses its handle once (`handle.flash()`, new), rocks the pill (`cue.wiggle()`, new) or flashes
the সামনে button. Items hidden for a step keep their place, so the panel does not jump; hidden in the test; words only for
the drag item in the tightest frames.

One source for each icon: `dragDisc(axis)` (draghandle.js), `rotateFace(short)` (rotatecue.js) and `frontFace(word)`
(shell.js) build the markup for both the view and the panel. The markup they make is the same as before, so no figure
changes without opting in.

## 1.7.0

`createDragHandle(stage, options)` in `student/draghandle.js`, after the owner found nothing in a figure says a part can be
moved ("unless they drag, they can't know they can play with it"). A white disc pinned to a 3D point, with arrows that
follow the projected direction (or a curved arrow for turning), a 46 px target, a faint dashed track for the range, a
first-time word and a gentle pulse until the first drag, then smaller and calm. Works with a figure's own drag handler
(`hit`, `markUsed`) or alone (`onStart`, `onMove`, `onEnd`, `onKey`). Hides in the test; `box()` for avoid lists. No
figure changes without opting in.

`createRotateCue(stage, options)` in `student/rotatecue.js`: a dark corner pill, "⟲ ৩৬০° ঘুরিয়ে দেখো" until the first
turn, then "⟲ ৩৬০°", which stays. It sets up a full orbit (no azimuth limits, polar limits, zoom, damping) and tells the figure when the
student really turned the view: 8 px of movement or the wheel, never a bare tap. New icon `ICONS.orbit`.

The front-view button of `layout: 'side'` is now cross hairs (`ICONS.front`) with the figure's `view_front_short` word
beside it, instead of a circular arrow alone, which could be taken for reset. Reset stays the only plain ↺.

`cleanSheet(t, { tight: true })` tightens the action row in a narrow side panel, so that a short verb stays on one line beside
two quiet buttons. No figure changes without opting in.

## 1.6.0

Panel typography, after the owner found the panels congested and hazy (bold everywhere, tight lines, grey text).
- Crisper text: antialiased font smoothing, kerning; `--ink-2` and `--ink-3` darker (more contrast).
- Lighter emphasis: the action, the rule's bold words, the result's number, the test's feedback lead and score
  use weight 600 instead of 700; the result's number is 1.3em instead of 1.45em, so lines keep an even rhythm.
- More air: the rule's line height 1.5 → 1.6, the test question 1.4 → 1.5, its feedback 1.45 → 1.55.
- New classes for figures: `.pvc-formula` (a formula on its own line, centred on a soft band; `<i>` for symbols,
  `<b>` for the answer, `.op` for operators), `.pvc-frac` (a stacked fraction), `.pvc-note` (a quiet card with an
  accent bar for the book's rule or a remark), `.pvc-graph` (a small live SVG/canvas graph: axes, grid, labels).

## 1.5.0

- `buildStudentShell(root, t, { layout: 'side' })` (the new standard; figures opt in one by one, the default
  `'stack'` is unchanged) puts the panel **beside** the 3D on every landscape frame (book page, desktop, phone held
  sideways), full height and scrolling, with a tab on the 3D's edge to hide it so the 3D fills the frame. Portrait
  frames keep the panel below.
- The side panel is also a container named `pvc`, so a figure's own `@container pvc` rules measure the panel: a
  figure styled for a phone-wide panel looks right beside the 3D without changes.
- On a touch phone held upright, a card asks the student to turn it sideways ("turn it" goes fullscreen and locks
  landscape where the browser allows; "stay" keeps the stacked layout). `?rotate=0` (or `coach=0`) skips it.
- With `layout: 'side'`, no "front / rotate" buttons: the view starts from the front and turns when the student drags it. The
  shell has one `[data-view="front"]` icon button, hidden; a figure shows it once the view was turned (back to the
  front). Figures must allow rotating in the front view.
- New figure strings for the shell: `panel_hide`, `panel_show`, `rotate_title`, `rotate_body`, `rotate_go`, `rotate_stay` (added to every figure and template).

## 1.4.0 (2026-11-01)

Butter smooth on phones, with nothing taken out of the picture (the owner heard the figures are heavy). `stage.js`:
- **Shadows follow the scene, not the camera.** Shadow maps are drawn again only when the scene changes
  (`invalidate()`, a ticker returning `true`, a resize, `render()`, `capture()`). A frame where only the camera
  moved keeps them; a ticker that only moves the camera (a glide) can return `'camera'` instead of `true` for the
  same. With soft VSM shadows (most figures) that saves the casters' depth pass and two full-size blur
  passes on every frame of turning or zooming the view. `shadows: 'always'` gives the old behaviour. Figures that
  managed it themselves (`shadowMap.autoUpdate = false` + `needsUpdate` before each render) keep working.
- **Shadow boxes applied.** A directional light's shadow box (`shadow.camera` left/right/top/bottom/near/far) only
  takes effect after `updateProjectionMatrix()`, which three.js never calls for it. 30 figures set a box without it,
  so their shadows came from three's default 10 × 10 m box: blurred in small scenes, cut off in large ones. The stage
  now applies the box whenever it draws the shadows.
- **Paused out of view.** Tickers and drawing wait while the figure's container is off screen
  (IntersectionObserver) or the page is hidden; it draws again when it is seen.
- **Adaptive resolution.** While something moves, if frames keep coming more than 25 ms apart (over 30 frames),
  the pixel ratio steps down by 0.25, never below 1. `adaptive: false` turns it off; `stage.pixelRatio` reads it.
  Tests and exports run at a pixel ratio of 1 on a virtual clock, so their pictures cannot change.

Tested in `test/browser/kit.spec.mjs` (shadows kept while the camera turns, drawn after `invalidate()` and on
`capture()`, nothing drawn out of view). Visual comparison against `0b922cd`: no figure changed.
Also `docs/agents/polish-pass.md`: the standard every figure is now held to (layout, labels only on the 3D view,
colour and clear arrows, six sizes, performance, bugs), and `AGENTS.md` updated to match.

## 1.3.0 (2026-10-26)

One action, one result, one rule: the owner found the শেখো panels of most figures (chapter 2 especially) too boxy and
a bit overwhelming, and asked for a distinctive button wherever the student should touch something, in the picture
or in the panel. Added, nothing changes for existing figures (they don't use it yet; visual comparison against
`origin/main`: identical apart from the two known flakes). Tested in `test/browser/kit.spec.mjs` (on
`test/kit.html`).
- `action.js` (new): `createAction({ stage, layer, host, t, step, label, icon, caption, target, radius | worldRadius,
  avoid, onAct, trigger, pulse })` → `{ button, marker, badge, ring, set, refresh, hide(reason), show(reason), flash,
  update, box, ringBox, visible, dispose }`. The big action button (an accent pill: a numbered badge, the verb, a hand;
  a real button, ≥ 44 px, a solid focus ring) and its twin on the 3D view: a dashed ring round the part to touch (a
  point with a radius, or an Object3D/Box3 with the ring fitted round its box on the screen, projected every frame),
  drawn under the figure's labels, and the same numbered badge just outside it, above the labels. Both pulse for
  about three beats each time the marker appears, then stay still (never with `pulse: false` or under
  prefers-reduced-motion). The ring lets touches through to the figure's raycast; the badge (a 46 px target) acts on
  a real tap (8 px, 500 ms) and hands any other gesture to what is under it; `trigger: 'pointerdown'` for timing
  figures, `onAct: null` for parts the student drags. `ringBox()` for the labels' avoid lists; the badge keeps clear
  of the corner buttons, the hint and the labels (`avoid`). The marker hides by itself while a finger drags on the
  view, while the button is disabled and during the test. Reads before writes in each frame; `dispose()` lets go of
  the frame hooks.
- `shell.js`: `cleanSheet(t, { examples, quiet, lines: { action, outcome, rule } })` (one row of example words, the
  action's slot with quiet secondary buttons, one result line, one rule line; the action row never wraps) and
  `bindCleanSheet(ui.learn)` → `{ words, choose, next, result, outcome, rule }`; the row of words is a radio group
  (one Tab stop, the arrow keys move and choose and never reach the figure's keys).
- `student.css`: `.pvc-examples` (a row of words, the chosen one underlined, the next one dotted, a small result under
  a word), `.pvc-act` (the action pill and its badge), `.pvc-act-marker` / `.pvc-act-under` (badge and ring on the
  view), `.pvc-act-cap`, `.pvc-quiet` (quiet secondary buttons: icon and words, only the icon in a phone-wide panel),
  `.pvc-outcome` (one result line, the number in `<b>` larger), `.pvc-rule` (the rule line). Light and dark.
- `quiz.js`: `createQuiz({ action })` hides the action's marker while the test runs.
- `annotations.js`: `boxes()`, the boxes of every label shown (for `createAction`'s `avoid`).
- `icons.js`: `hand` (the coach's hand, filled), `drag`.
- `templates/interactive` uses the clean sheet and `createAction` (a drag action: the button shows the move).

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
