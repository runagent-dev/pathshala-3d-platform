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
`createStage(container, { fov, near, far, environment: 'studio' | 'studio-light' | 'room' | false, exposure })`
returns `{ renderer, scene, camera, controls, canvas, width, height, invalidate(), addTicker(fn), onBeforeRender(fn),
onAfterRender(fn), onResize(fn), render(), capture({ width, height, background }), dispose() }`.
It renders on demand: call `invalidate()` after changing the scene; a ticker `fn(dt, now)` returning `true` keeps it
drawing while something moves (`dt` is capped at 50 ms).

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
objects, helpers and sprites; bakes instanced meshes into vertex-coloured meshes; scales `units` to metres. Figures
get it through `connectFigure` by giving the app an `exportRoot()`.

### `model-viewer.js`
`createModelViewer(root, { t, src, theme })` → app with `ready, getState, set({ view | camera, target }), reset,
capture, exportFile`. The viewer of `model` figures (`templates/model/`).

## The student view (`student/`)

Styles: `student/student.css` (link it before the figure's `style.css`; set `root.dataset.ui = 'simple'`).

### `shell.js`
- `buildStudentShell(root, t, { learn })` → `{ $, $$, stage, canvasHost, annoLayer, lensLayer, coachLayer, corner,
  hint, hintText, hintAct, learn, quiz }`: the 3D area (with the view and full-screen buttons) and the panel with the
  শেখো and পরীক্ষা tabs. Both sheets share one place, so the panel never changes height.
- `learnSheet(t, { terms: [{ cls, label, op }], extra, button })`: the reading written as a named sum
  (`reading = term op term …`), each term coloured by its `cls` (define `--c` for `.pvc-t.<cls>` in the figure's CSS).
- Strings it needs: `view`, `view_front_short`, `view_rotate`, `fullscreen`, `tab_learn`, `tab_quiz`, `reading`, `q_again`.

### `quiz.js`
`createQuiz({ ui, t, emit, audio, questions: 5, hooks })`. Hooks: `enter()`, `leave()`,
`prepare(index, alive, say)` → `{ text?, choices, expected, tolerance, label(v), meta }` (set up the question, e.g.
place and lock the part; return `null` if `alive()` went false), `reveal(q, correct)` → HTML of the worked answer,
`done()`. API: `start()`, `stop()`, `next()`, `choose(i)`, `active`, `revealed`. Build wrong choices from the usual
mistakes (see `makeChoices` in `screw-gauge`). Events: `practice-start`, `practice-result`, `practice-end`.
Strings: `q_count`, `q_score`, `q_hint`, `q_right`, `q_wrong`, `q_next`, `q_finish`, `q_result`, `q_great`, `q_good`, `q_try`.

### `coach.js` (first-use pointers)
`createCoach({ stage, layer, t, loupe, tweener, avoid, object: { label, candidates(), grabbable(p), demo(alive), cancel() } })`
→ `{ start(delay), objectUsed(), objectReleased(), lensUsed(), interrupt(), setMode(mode), dispose() }`. A hand points
at a spot of the part that a finger really grabs (`grabbable` raycasts), then at the magnifier's handle. Strings:
the `label` key and `coach_lens`.

### `loupe.js` (magnifier)
`createLoupe({ stage, layer, clearColor, onDragStart })` → `{ camera, zoom, visible, follow, setVisible, setTarget(fn),
setFollow, setFrozen, setZoom, moveTo, contains(x, y), toNDC(x, y), dispose }`. `setTarget(() => worldPoint)` keeps it
on the reading. Picks through the glass: `contains` + `toNDC` + `loupe.camera`.

### `materials.js`
`createMaterials(renderer)` → `{ steel, satin, knurl, chrome, brass, copper, wood, acrylic, ink, … }` (procedural, no
image files). `textMesh(text, height, { color, weight, align })` for labels drawn in Noto Sans Bengali; `INK`, `FONT`.
`ink` is white so instanced marks can be coloured per mark (clone it and set `INK` for a single dark mark).

### `audio.js`, `annotations.js`, `icons.js`
- `createAudio(enabled)` → `{ unlock(), setEnabled, tick, contact, lock, success, error, pop }` (synthesized, no files).
- `createAnnotations({ stage, layer })` → `{ add(id, { text, point: () => Vector3, dx, dy, kind, color }), remove, clear }`.
- `ICONS` (`measure`, `play`, `pause`, `reset`, `expand`, `chevR`, …) and `svg(paths)`.

## Changing the kit

1. Its own branch and pull request (`kit/<what>`), never mixed with a figure.
2. Keep it backward compatible; if a figure must change, that is a major version.
3. `npm run test:visual` must show no change in figures you didn't mean to change; `npm run test:templates` passes.
4. Bump `shared/lib/VERSION` and add an entry to `shared/CHANGELOG.md`.
