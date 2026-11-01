# The shared kit (`shared/lib/`)

Everything figures import through `@shared/…`. Version in `shared/lib/VERSION`, history in `shared/CHANGELOG.md`.
Changing the kit changes every figure: use the `/kit-change` skill, or follow "Changing the kit" at the end.

## Start-up and the book

### `figure.js`
```js
import { startFigure } from '@shared/figure.js';
await startFigure({ create: createApp, events: ['change'], commands: (app) => ({ practice: () => app.startPractice() }) });
```
- `startFigure({ create, events, commands, root })`: reads `./asset.json`, types the URL parameters it declares
  (`readParams`), adds `bg-<bg>` to `<body>`, waits for the font (`loadFonts`), calls
  `create(root, options, manifest)`, then `connectFigure`. The app is also `window.figure` (handy in the console).
- `connectFigure({ app, manifest, events, commands })`: standard commands from what the app has:
  `get` ← `getState()`, `set(p)`, `reset()`, `capture({ width, height, background })`, `export-glb` ← `exportRoot()`,
  `seek({ t })` + `duration` ← `seek(t)` + `duration`. Forwards `events`, emits `ready` when `app.ready` resolves.
- `readParams(paramsOrSpec)`, `loadFonts()`, `loadManifest()` for figures that start themselves.

### `bridge.js` (figure side) and `host.js` (book side)
The postMessage protocol: see `docs/bridge-protocol.md`. Figures normally use `connectFigure`; the book uses
`connectAsset(iframe)` from `host.js` (shipped in every zip).

## 3D

### `stage.js`
`createStage(container, { fov, near, far, environment: 'studio' | 'studio-light' | 'room' | false, exposure, shadows,
adaptive })` returns `{ renderer, scene, camera, controls, canvas, width, height, pixelRatio, invalidate(), addTicker(fn), onBeforeRender(fn),
onAfterRender(fn), onResize(fn), render(), capture({ width, height, background }), dispose() }`.
It renders on demand: call `invalidate()` after changing the scene; a ticker `fn(dt, now)` returning `true` keeps it
drawing while something moves (`dt` is capped at 50 ms).
Since kit 1.4.0 it also keeps phones smooth without taking anything out of the picture: shadow maps are drawn again
only when the scene changes (`invalidate()`, a ticker returning `true`, a resize, `render()` or `capture()`), not when
only the camera moves (`shadows: 'always'` restores every frame; a ticker that only glides the camera can return
`'camera'` instead of `true` to draw without redrawing them); nothing runs while the figure is off screen or the
page is hidden; and when frames keep coming slower than about 40 a second the pixel ratio steps down by a quarter,
never below 1 (`adaptive: false` turns this off; `stage.pixelRatio` is the one in use). So: if you move a part that
casts a shadow, call `invalidate()` (or return `true` from a ticker), as before.

### `tween.js`
`createTweener()` → `{ animate({ duration, ease, key, delay, onUpdate(k, p), onComplete }), tick(dt), cancel(key), busy }`.
`animate` returns `{ cancel, finished }`; `finished` resolves `true` if it ran to the end. A new tween with the same
`key` cancels the old one. Hook it to the stage: `stage.addTicker((dt) => tweener.tick(dt))`. `ease.linear`,
`ease.inOutCubic`, `ease.outCubic`, …

### `timeline.js` (animations)
`createTimeline({ duration, render(t), loop, speed, onEnd })` → `{ time, duration, playing, play(), pause(), seek(t), tick(dt) }`.
Write `render(t)` as a pure function of time, so jumping, looping and video export are exact. Helpers:
`segment(t, start, end)` (0…1 progress), `markAt(marks, t)` (index of the current `{ at }` mark).

### `export-glb.js`
`exportGLB(root, { units, name, extras, skip })` → `ArrayBuffer`. Exports a copy: drops `userData.noExport`
objects, helpers, sprites and shader materials; bakes instanced meshes into vertex-coloured meshes and thick lines
(`Line2`, `LineSegments2`) into plain glTF lines in their colour; scales `units` to metres. Figures get it through
`connectFigure` by giving the app an `exportRoot()`.

### `arrow.js` (vectors) and thick lines
- `createArrow({ color, radius, head, headRadius, opacity, material, name })` → `{ root, material, tip, head,
  set(from, dir, length), setVector(from, vector), setOpacity(a), hide(), dispose() }`: a shaft and a cone head
  (meshes: lit like the model, in the magnifier, in every capture and in the GLB). The head keeps its size; an arrow
  shorter than its head gets a smaller one; length 0 hides it. `tip` is where the head ends, e.g. for a label.
- Thick lines (trails, paths): three's `Line2` + `LineGeometry` + `LineMaterial` are vendored
  (`three/addons/lines/…`). Give `LineMaterial({ linewidth, worldUnits: true })` widths in the figure's units, so a
  line is magnified by the magnifier and scales with the model (with the default screen-pixel widths a line comes
  out thinner in the magnifier, not magnified). The resolution is set from the viewport on every draw. In GLB
  exports they become 1-px lines.

### `model-viewer.js`
`createModelViewer(root, { t, src, theme })` → app with `ready, getState, set({ view | camera, target }), reset,
capture, exportFile`. The viewer of `model` figures (`templates/model/`).

## The student view (`student/`)

Styles: `student/student.css` (link it before the figure's `style.css`; set `root.dataset.ui = 'simple'`).

### `shell.js`
- `buildStudentShell(root, t, { learn, learnAlign })` → `{ $, $$, stage, canvasHost, annoLayer, lensLayer, coachLayer,
  corner, hint, hintText, hintAct, learn, quiz }`: the 3D area (with the view and full-screen buttons) and the panel
  with the শেখো and পরীক্ষা tabs. On landscape frames (aspect ≥ 1, ≥ 600 px wide) the panel is beside the 3D, full
  height, with a hide/show tab on the 3D's edge (`.pvc-shell[data-panel="closed"]`); it is then also a container
  named `pvc`, so the figure's `@container pvc` rules for the sheet measure the panel. The view starts from the front and turns when dragged (no front/rotate buttons); the hidden
  `[data-view="front"]` icon button is shown by the figure once the view was turned. Portrait frames keep it below;
  a touch phone held upright gets a "turn it sideways" card (`?rotate=0` or `coach=0` skips it). Strings:
  `panel_hide`, `panel_show`, `rotate_title`, `rotate_body`, `rotate_go`, `rotate_stay`. Both sheets share one place, so the panel never changes height; it is as tall as
  the taller sheet. `learnAlign: 'start'` keeps the শেখো content together at the top (default `'spread'`: its first
  and last rows at the top and bottom of the panel, with the space between them). A figure that makes `.pvc-learn` a
  grid gets `align-content: start` from it too.
- `learnSheet(t, { terms: [{ cls, label, op }], extra, button })`: the reading written as a named sum
  (`reading = term op term …`), each term coloured by its `cls` (define `--c` for `.pvc-t.<cls>` in the figure's CSS).
- Strings it needs: `view`, `view_front_short`, `view_rotate`, `fullscreen`, `tab_learn`, `tab_quiz`, `reading`, `q_again`.
- `cleanSheet(t, { examples, quiet, lines })` (kit 1.3.0): the clean শেখো sheet, **one action, one result, one rule**
  (below). `examples: { label, items: [{ id, label }], results }` is one row of words (`data-example="<id>"`; with
  `results: true` room is kept for a small result under each word); `quiet: [{ act, label, icon }]` are quiet
  secondary buttons (`data-act`) after the action's slot (`.pvc-act-slot`); `lines: { action, outcome, rule }` keeps
  room for that many lines of the action's words, the result and the rule (per layout: set `--pvc-act-lines` /
  `--pvc-outcome-lines` / `--pvc-rule-lines` in CSS). The action row never wraps: a long verb wraps inside the pill,
  and `lines.action: 2` keeps the row as tall as a two-line pill in every state.
- `bindCleanSheet(ui.learn)` → `{ words, choose(id), next(id), result(id, text), outcome(html), rule(html) }`: writes
  it (only what changed, so it can run every frame). It makes the row of words a proper radio group: one Tab stop (the
  chosen word); the arrow keys, Home and End move to a word and choose it by clicking it (your click handler does the
  rest), and those keys never reach your scene keys. `next(id)` marks the word the action will choose next (a dotted
  underline; `null` for none).

### One action, one result, one rule (kit 1.3.0)

The owner's rule for the শেখো panel: no cards round readouts, no dense paragraphs, no rows of small boxed buttons.
When the student should touch something, there is **one** distinctive button for it, and the same numbered badge
on the 3D object, so they know exactly what to touch, in the picture or in the panel.

```
 মাদুর     কাঠ     বরফ    ঘর্ষণ নেই        ← examples: one row of words, the chosen one underlined
 ১.৩১ মি  ‾‾‾‾   ┄┄                       ← a small result under a word once known; the next word dotted
 (১) বইটিকে ধাক্কা দাও  ☝          ⟲      ← the action (accent pill, numbered badge, verb, hand) · quiet reset
 মাদুরে বইটি ১.৩১ মি গিয়ে থামল              ← one result line, the number that matters larger
 মাদুরের ঘর্ষণ বইটিকে তাড়াতাড়ি থামাল। …      ← one rule in the book's words, explained plainly
```

```js
import { createAction } from '@shared/student/action.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
const ui = buildStudentShell(root, t, { learn: cleanSheet(t, {
  examples: { label: 'floors', results: true, items: [{ id: 'mat', label: 'chip_mat' }, …] },
  quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
  lines: { action: 2, outcome: 1, rule: 3 },
}) });
const sheet = bindCleanSheet(ui.learn);
let action = null;
const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
action = createAction({
  stage, layer: ui.coachLayer, host: ui.$('.pvc-act-slot'), t,
  step: 1, label: 'act_push', target: () => book.body,       // Object3D | Box3 | Vector3 (+ radius px) | null
  avoid: [ui.corner, ui.hint, () => anno.boxes()],           // the badge never covers these
  pulse: o.coach, onAct: () => push(),
});
// the figure's own raycast on the part calls the same push(); the ring lets the touch through
const quiz = createQuiz({ …, action });                     // the marker hides during the test
sheet.choose('mat'); sheet.next('wood'); sheet.result('mat', '১.৩১ মি');
sheet.outcome(t('out_stop', { … }));                         // '… বইটি <b>১.৩১ মি</b> গিয়ে থামল'
sheet.rule(t('rule_mat'));                                    // '<b>মাদুরের ঘর্ষণ …</b> …'
```

`createAction(options)` → `{ button, marker, badge, ring, set(change), refresh(), hide(reason), show(reason), flash(),
update(), box(), ringBox(), visible, step, enabled, dispose() }`:
- `label`: an i18n key or `() => text` (read again on `set` / `refresh`); `icon`: the button's picture (default
  `ICONS.hand`; `ICONS.drag` for a part that is dragged); `caption`: an optional small word under the badge on the
  view (for a flow of several steps); `enabled: false` disables the button and hides the marker.
- **`step` is the student's own step**, shown in the badge and on the button (`t.num`): 1 for the first thing to do,
  2 for the next… It is not an item's index in a list (a student who picks the third example first is on step 1).
  `''` shows no number (e.g. "আবার ধাক্কা দাও" once everything is done).
- `target: () => …`: a `Vector3` (ring of `radius` px, or `worldRadius` in scene units), an `Object3D` or `Box3`
  (a pill-shaped ring fitted round its box on the screen, `pad` px out), or `null` (no ring). Projected every frame.
  **An Object3D target uses `Box3.setFromObject`, which includes invisible children** (a big invisible hit box would
  blow the ring up): pass the visible body (newtons-first-law passes `book.body`, not the book with its hit box).
- **Layers**: the ring is drawn under the figure's labels (its layer is put in the stage just before
  `.pvc-anno-layer`), the badge above them (in `layer`). `ringBox()` gives the ring's box (canvas pixels, worked out
  now; `null` while hidden): put `() => action.ringBox()` in the labels' `avoid` (createAnnotations, or your own
  placer) so no label sits on the ring. `box()` gives the badge's box (also `null` while hidden or in the test).
- The badge sits just outside the ring (top right first, then the other corners and sides), inside the view, clear of
  `avoid` (elements, `{ left, top, right, bottom }` canvas-pixel boxes, or functions returning them); it keeps its
  place while that stays clear.
- **Touches**: the ring lets every touch through to the figure's hit boxes. The badge (a 46 px target) acts on a real
  tap only (the finger comes up within 8 px and 500 ms); a drag that starts on it is handed on to what is under it
  (the camera turns, the part is dragged). `trigger: 'pointerdown'` makes the button and the badge act as the finger
  goes down (figures where timing matters, like a stopwatch; keyboard Enter and Space still work). `onAct: null`
  makes the badge only a sign (a part the student drags: touches go straight through).
- `hide(reason)` / `show(reason)` hide the marker (the button stays). Reasons are a set: hiding twice with the same
  reason is cleared by one `show`. It hides by itself while a finger or the mouse drags on the view (`'drag'`), while
  disabled, during the test (`.pvc[data-mode="quiz"]`, and `createQuiz({ action })`), and when its target is off
  the view.
- **The pulse**: about three beats (ring, badge and the button's badge) each time the marker appears, then still.
  `pulse: false` keeps both still (e.g. `?coach=0`); prefers-reduced-motion stops it anyway. `flash()`: one stronger
  pulse (e.g. after a tap that did nothing).
- `dispose()` lets go of everything (frame hooks, listeners, the elements).
- CSS: `.pvc-examples`, `.pvc-act`, `.pvc-act-marker` (`.pvc-act-under` holds the ring), `.pvc-act-cap`,
  `.pvc-quiet`, `.pvc-outcome` (`<b>` = the key number; set `--c` on it for the quantity's colour), `.pvc-rule`
  (`<b>` = the book's words).

**Kinds of figures**
- **A tap** (push, drop, start, choose): `onAct` does it, the target is the part to tap (the figure's own raycast on
  that part calls the same function). This replaces the first-use coach.
- **A drag** (screw gauge, vernier, a slider on a part): ring and badge on the part to drag, `icon: ICONS.drag`, the
  verb "… টেনে সরাও"; `onAct` either shows the move (a short slide and back, as `templates/interactive` does) or is
  `null` (the badge is only a sign). The coach's hand may stay for the very first drag (give it
  `avoid: [action.badge]`); the marker hides by itself while the student drags.
- **An animation with nothing to tap** (si-prefixes): `target: () => null` (no ring, no badge); the button is the
  play/pause or "next" control, changed with `set({ icon: ICONS.pause, label: 'act_pause', step: '' })`.

### `quiz.js`
`createQuiz({ ui, t, emit, audio, questions: 5, lines, hooks, action })` (`action`: a `createAction` whose marker
hides while the test runs). Hooks: `enter()`, `leave()`,
`prepare(index, alive, say)` → `{ text?, choices, expected, tolerance, label(v), meta }` (set up the question, e.g.
place and lock the part; return `null` if `alive()` went false), `reveal(q, correct, picked)` → HTML of the worked
answer (`picked` is `{ index, value }` of the tapped choice, for feedback on that mistake), `done()`.
`lines: { text: 2, feedback: 2 }` keeps room for that many lines of question and of worked answer, so the sheet (and
the 3D view above it) keeps its size from question to question; without it the sheet fits its words. It sets
`--pvc-q-text-min` / `--pvc-q-feedback-min` (e.g. `2lh`) on the sheet: for another count in one layout, set the
property on `.pvc-q-text` / `.pvc-q-feedback` in that media query (e.g. `--pvc-q-text-min: 1lh`).
API: `start()`, `stop()`, `next()`, `choose(i)`, `active`, `revealed`. Build wrong choices from the usual
mistakes (see `makeChoices` in `screw-gauge`). Events: `practice-start`, `practice-result`, `practice-end`.
Strings: `q_count`, `q_score`, `q_hint`, `q_right`, `q_wrong`, `q_next`, `q_finish`, `q_result`, `q_great`, `q_good`, `q_try`.

### `coach.js` (first-use pointers)
`createCoach({ stage, layer, t, loupe, tweener, avoid, object: { label, candidates(), grabbable(p), demo(alive), cancel() } })`
→ `{ start(delay), objectUsed(), objectReleased(), lensUsed(), interrupt(), setMode(mode), dispose() }`. A hand points
at a spot of the part that a finger really grabs (`grabbable` raycasts), then at the magnifier's handle. Strings:
the `label` key and `coach_lens`. Options of `object`:
- `label`: an i18n key, or `() => text`; it is read while the hand shows, so it follows the figure (a getter
  returning a key works too).
- `labelAt`: where the words go round the hand: `'below' | 'above' | 'left' | 'right'` (the opposite side when there
  is no room), a list of sides to try in order, or `(p, { w, h }) => ({ x, y })` (top-left in canvas pixels). A side
  is skipped when its words would cover `avoid` or `labelAvoid: () => [element | { left, top, right, bottom }]`
  (e.g. the figure's labels). Default: below the hand, above it when there is no room.
- `inset: { top, right, bottom, left }`: no hand this close to the view's edges (default 16, and 48 at the bottom
  for the hint line; with the hint in `avoid`, `{ bottom: 16 }` lets the hand point at parts low in the view).

### `loupe.js` (magnifier)
`createLoupe({ stage, layer, clearColor, onDragStart })` → `{ camera, zoom, visible, follow, setVisible, setTarget(fn),
setFollow, setFrozen, setZoom, moveTo, contains(x, y), toNDC(x, y), dispose }`. `setTarget(() => worldPoint)` keeps it
on the reading. Picks through the glass: `contains` + `toNDC` + `loupe.camera`.

### `materials.js`
`createMaterials(renderer)` → `{ steel, satin, knurl, chrome, brass, copper, wood, acrylic, ink, … }` (procedural, no
image files). `textMesh(text, height, { color, weight, align })` for labels drawn in Noto Sans Bengali; `INK`, `FONT`.
`ink` is white so instanced marks can be coloured per mark (clone it and set `INK` for a single dark mark).

### `annotations.js` (labels on the model)
`createAnnotations({ stage, layer, avoid })` → `{ add, setText, update, remove, clear, has, box }`.
- `add(id, { text, point: () => Vector3, dx, dy, kind: 'part' | 'callout', color, spots, avoid, optional })`: a label
  at `dx, dy` from its point (it fades in; adding the same id again replaces it and fades in again).
- `setText(id, html)` and `update(id, { text, dx, dy, point, color, spots, avoid, optional })`: change a label in
  place, without fading it in again (a count, a label that moves with the camera). `update()` with no arguments
  places every label at once (it also happens after each frame).
- `spots: [{ dx, dy }, …]` (best first): the label takes the first offset where its box is inside the view and clear
  of the other labels and their points, of `avoid` (here: for every label, e.g. `[ui.corner, ui.hint]`) and of its
  own `avoid`. It keeps its spot while that stays clear, so it doesn't jump as the view turns. With no clear spot it
  takes the first, or hides with `optional: true`. `avoid` entries are elements (skipped while hidden) or functions
  returning `{ left, top, right, bottom }` boxes in canvas pixels (e.g. an arrow's ends, from `toScreen`).
  Labels without `spots` go exactly where `dx, dy` say, as before.
- `box(id)` → the label's box as last drawn (canvas pixels), for a figure's own placement; `boxes()` → the boxes of
  every label shown (e.g. `createAction({ avoid: [() => anno.boxes()] })`).

### `pointer.js`
`capturePointer(el, pointerId)` → `true` if captured, and `releasePointer(el, pointerId)`: pointer capture that never
throws. `setPointerCapture` throws for a synthetic pointer (tests, the bridge) or one already lifted, which would
stop a `pointerdown` handler half way; without the capture the drag still works while the pointer stays over the
element. Use it for every drag (the magnifier does; `templates/interactive` shows it).

### `audio.js`, `icons.js`
- `createAudio(enabled)` → `{ unlock(), setEnabled, tick, contact, lock, success, error, pop }` (synthesized, no files).
- `ICONS` (`measure`, `play`, `pause`, `reset`, `expand`, `chevR`, `check`, `close`, `arrowR`, `hand`, `drag`, …) and `svg(paths)`.
  The bundled Noto Sans Bengali has no ✓ ✗ → glyphs (they fall back to another font, or a box): in HTML use
  `ICONS.check`, `ICONS.close` and `ICONS.arrowR`; in text drawn in 3D (`textMesh`) leave them out.

## Changing the kit

1. Its own branch and pull request (`kit/<what>`), never mixed with a figure.
2. Keep it backward compatible; if a figure must change, that is a major version.
3. `npm run test:visual` must show no change in figures you didn't mean to change; `npm run test:templates` passes.
4. Bump `shared/lib/VERSION` and add an entry to `shared/CHANGELOG.md`.
