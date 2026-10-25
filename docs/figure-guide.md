# Building a figure

How a figure is put together, using the interactive template (`templates/interactive/`, a ruler) as the example.
The full figures `assets/screw-gauge/` (interactive) and `assets/si-prefixes/` (animation) follow the same shape.

## The folder

```
assets/<id>/
  asset.json        the manifest: book reference, URL parameters, commands, events, export (docs/manifest.md)
  index.html        the page: font, student.css, style.css, the import map, src/main.js
  style.css         the page and the colours of the terms
  src/main.js       startFigure({ create, events, commands }), nothing else
  src/app.js        the figure: layout, 3D, interaction, the test
  src/<object>.js   the 3D model (procedural three.js)
  src/reading.js    the maths, pure functions (unit-tested)
  src/i18n.js       every string, bn and en, and createI18n
  README.md         for the book developer (sections between generated markers come from asset.json)
  NOTES.md          the brief and the owner's notes (dev only)
  reference/        screenshot of the book page (dev only)
  tests/            this figure's browser tests (dev only)
  status.json       written by the studio (dev only)
  reviews/          reviewers' feedback (dev only)
```

## `app.js`, step by step

1. **Options and strings.** `const o = { ...DEFAULTS, ...options }`, `const t = createI18n(o.lang, { numerals })`,
   `const N = t.num`. URL parameters arrive typed from `asset.json` through `startFigure`.
2. **The root.** `root.classList.add('pvc')`, `root.dataset.ui = 'simple'`, `root.dataset.theme = o.bg`,
   `root.lang = t.lang`, then `buildStudentShell(root, t, { learn: learnSheet(t, { terms }) })`.
3. **3D.** `createStage(ui.canvasHost, …)`, `createMaterials`, your model from `src/<object>.js`, a tweener on the
   stage ticker, `createAudio`, `createLoupe`. Optional soft shadow on an invisible page (see the template).
4. **State and the panel.** One state object `s`; a `refresh()` that writes the reading into the learn sheet (with
   `N()`), colours the marks that are read, emits `change` when the value changes, and calls `stage.invalidate()`.
5. **The part the student moves.** A `setX(value)` that clamps, moves the model and calls `refresh()`; an
   `animateX(target)` built on `tweener.animate`. Pointer input: raycast against the movable part (through the
   magnifier too: `loupe.contains` + `loupe.toNDC` + `loupe.camera`), then convert pointer movement to model units
   with the part's direction on screen (`axisOnScreen` in the template). Accept a touch a few pixels off the part
   on touch screens (see `nearby` in `screw-gauge`). Take the pointer with `capturePointer` from
   `@shared/student/pointer.js` (never `setPointerCapture` directly: it throws for synthetic pointers). Arrow keys step
   by one least count.
6. **Camera.** A `viewPose(view)` that fits the object in the frame for both fields of view (phones in portrait are
   narrow), `setView('front' | '3d')`, and re-fit on resize unless the student moved the camera.
7. **The test.** `createQuiz` with hooks: `prepare` puts the part somewhere random (in whole least counts), locks it
   and returns the right answer and three wrong ones from the usual mistakes; `reveal(q, correct, picked)` writes the
   worked sum (and can name the mistake behind `picked`). Give `lines: { text: 2, feedback: 2 }` (or what your
   longest question and answer need) so the sheet keeps its height and the 3D view its size.
8. **First-use pointers.** `createCoach` with spots on the movable part that a finger really grabs (`labelAt` if its
   words would cover a label).
9. **Buttons and keys** through one click handler on the root (`data-view`, `data-mode`, `data-q`, `data-act`).
10. **Start and API.** Set the initial state, then return `{ ready, on, getState, set, reset, capture, exportRoot,
    startPractice }`. `getState` and `set` are what the book and the tests use: keep them plain JSON.

## Patterns that matter

- **Render on demand.** The stage only draws when something called `invalidate()` or a ticker returns `true`. Never
  run your own `requestAnimationFrame` loop.
- **Exact readings.** Keep the value in model units, round to the least count with a `roundTo` that leaves no
  binary leftovers (`+(Math.round(x / step) * step).toFixed(d)`), and test the maths in `test/unit/`.
- **Marks.** Draw scale marks with one `InstancedMesh` and colour the read mark with `setColorAt`; the GLB export
  bakes them into ordinary meshes.
- **Text in 3D.** `textMesh(N(text), height)` draws with Noto Sans Bengali; `startFigure` waits for the font first.
  The font has no ✓ ✗ →: use `ICONS.check`, `ICONS.close`, `ICONS.arrowR` in HTML.
- **Vectors and paths.** `createArrow` (`@shared/arrow.js`) for vector arrows; three's `Line2` with
  `LineMaterial({ worldUnits: true })` for thick lines and trails. Labels on the model: `createAnnotations`, with
  `spots` + `avoid` so they keep clear of each other and of the buttons, and `setText` for words that change.
- **Animations.** Build on `timeline.js`: `render(t)` must depend only on `t`, so seeking and video export are exact.
- **Mobile.** Test the six sizes in the studio's frame menu; tap targets at least 24 px (36–44 px for main
  buttons); the panel moves beside the 3D on short, wide frames (handled by `student.css`).

## Testing your figure

- `npm run check -- <id>` (fast, after every change; the Claude hook does this on edit).
- `FIGURES=<id> npm run test:figures`: contract, six viewports, your own tests in `tests/`.
- `npm run verify -- <id>` before the pull request, then look at `test-results/<id>/*.png`.
