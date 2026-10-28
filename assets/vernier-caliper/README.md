# Vernier Caliper (স্লাইড ক্যালিপার্স)

> **Where it goes in the book: page 20, topic 1.6 (slide calipers).**
> Embed this figure there, in place of the printed slide-calipers picture or right below it.
> (Also in `PACKAGE.json` as `page`, `topic`, `placement`.)

Interactive 3D slide calipers for the Pathshala book (Physics 9–10, ভৌত রাশি ও পরিমাপ).
Bangla UI by default (Noto Sans Bengali, bundled), white reading panel with a navy studio, wooden bench and blue instrument accents, works offline. No build step; three.js r185 is bundled.

Two views:

**Student view (default).** Made for a student who used to get only a picture: phone first, very few controls.

- The 3D caliper with a magnifier on the scales. Drag the sliding jaw (finger or mouse); it snaps to the least count.
- First-use pointers: a hand on the jaw ("চোয়ালটি টেনে সরাও") slides it a little to show it moves; after the first drag,
  a hand on the magnifier's handle ("বিবর্ধক সরাতে এখানে ধরে টানো") moves the glass a little. Each hand sits on a spot
  that really grabs that part (checked against the 3D model every frame, so it stays right on phones, sideways and in
  the rotated view) and goes away once the student has done it. In the test only the magnifier hand appears.
- Made for fingers: a touch that lands just off the jaw still takes it (without a jump), the magnifier handle has a
  larger grab area than it looks, and the browser can't steal a magnifier drag to scroll the page.
- "সামনে / ঘুরিয়ে দেখো": straight-on view, or turn it around in 3D. A fullscreen button where the device allows it.
- "শেখো" (learn): the reading in large digits, written underneath as `= M + V × VC` with each number named
  (প্রধান স্কেল পাঠ, ভার্নিয়ার সমপাতন, ভার্নিয়ার ধ্রুবক) and coloured like its line on the scale.
  "একটি বস্তু মাপো" clamps a pendulum bob, cylinder or block.
- "পরীক্ষা" (test): 5 questions. An object is clamped and the jaw locked; the student picks the reading from 4 choices
  (the wrong ones are the usual mistakes). Then the scales are coloured and the sum is shown. Score at the end.
- Layout: panel under the caliper; beside it when the frame is short and wide (phone held sideways).

**Full view (`?ui=full`).** Everything else, for teachers or a later chapter: inside jaws and depth rod, part names,
lock, least count 0.1 / 0.05 / 0.02 mm, zero error, mm/cm, a 10-step guided tour, typed practice.

## Embed

```html
<iframe class="pathshala-3d" src="vernier-caliper/index.html"
        allow="fullscreen" loading="lazy"></iframe>
<style>
  .pathshala-3d { width: 100%; aspect-ratio: 16 / 10; border: 0; }
  @media (max-width: 600px) { .pathshala-3d { aspect-ratio: auto; height: min(640px, 85vh); } }
</style>
```

It needs a real height. On phones give it most of the screen height (above): a 16:10 box on a 390 px wide phone is
only 244 px tall. Tested at 390×700, 390×520, 844×390, 640×400, 800×500, 1024×640 and 1280×800.

## URL parameters

| Param | Values | Default | |
|---|---|---|---|
| `lang` | `bn` · `en` | `bn` | UI language |
| `numerals` | `bn` · `latin` | follows `lang` | Digits in the UI and on the engraved scales |
| `lc` | `0.1` · `0.05` · `0.02` | `0.1` | Least count (10, 20 or 50 vernier divisions) |
| `ze` | number (mm) | `0` | Zero error, rounded to the least count, ±1 mm |
| `value` | number (mm) | `24.6` | Starting jaw gap |
| `specimen` | `sphere` · `cylinder` · `block` · `ring` · `bore` | none | Object placed at start (jaws already on it) |
| `size` | number (mm) | per object | Object size |
| `ui` | `simple` · `full` · `compact` · `none` | `simple` | Student view, all tools, all tools with an icon toolbar, or only the 3D view |
| `mode` | `explore` · `quiz` · `tour` | `explore` | Start in learn, the test (typed practice in the full view), or the tour (full view) |
| `practiceZe` | `1` · `0` | `0` | Full view: practice questions include zero error |
| `coach` | `1` · `0` | `1` | Student view: first-use pointers on the jaw and the magnifier |
| `view` | `front` · `3d` | `front` | Camera |
| `magnifier`, `guides`, `labels`, `hide`, `sound`, `shadow` | `1` · `0` | `1 1 0 0 1 1` | Toggles (`hide` blurs the reading) |
| `unit` | `mm` · `cm` | `mm` | |
| `bg` | `light` · `dark` · `transparent` | `light` | |

## Talking to it from the book (postMessage)

Uses the shared Pathshala protocol (`shared/lib/bridge.js`). The helper `shared/lib/host.js` is included in this folder:

```js
import { connectAsset } from './vernier-caliper/shared/lib/host.js';

const caliper = connectAsset(document.querySelector('iframe'));
await caliper.ready;

caliper.on('change', (r) => console.log(r.value, r.msr, r.vsr));
caliper.on('practice-result', (r) => saveProgress(r));

await caliper.call('set', { specimen: 'sphere', size: 19.6 });
await caliper.call('set', { lc: 0.02, zeroError: -0.04, value: 31.42 });
const state = await caliper.call('get');
```

Commands (each replies with a result):

| Command | Payload | Result |
|---|---|---|
| `ping` | | `{ asset, version }` |
| `get` | | full state |
| `set` | any of `value, lc, zeroError, unit, view, specimen, size, guides, magnifier, labels, locked, hideReading, sound, animate` | full state |
| `reset` | | full state |
| `tour` | | `true` (full view), `false` in the student view |
| `practice` | full view: `{ zeroErrors }` | `true` (starts the test in the student view) |
| `capture` | `{ width, height }` | PNG data URL |
| `export-glb` | | `ArrayBuffer` (static .glb of the current pose) |

Events: `ready`, `change`, `specimen`, `view`, `settings`, `dragstart`, `dragend`, `tour-step`, `tour-end`, `practice-start`, `practice-result`, `practice-end`.

A `change` payload looks like:

```json
{ "value": 24.6, "observed": 24.6, "corrected": 24.6, "msr": 24, "vsr": 6, "numeral": 6,
  "lc": 0.1, "divisions": 10, "zeroError": 0, "unit": "mm", "gap": 24.6,
  "contact": true, "locked": false, "specimen": { "kind": "sphere", "mode": "outside", "size": 24.6 }, "mode": "explore" }
```

All lengths in events are millimetres regardless of the display unit. `value` is the corrected reading when there is a zero error.

In the student view each test answer sends:

```json
{ "type": "choice", "question": 2, "of": 5, "specimen": "cylinder", "size": 12.6,
  "choices": [12.6, 13.6, 12.7, 12.5], "answer": 12.7, "expected": 12.6, "correct": false,
  "score": { "right": 1, "total": 2 } }
```

and `practice-end` sends `{ right, total, finished }` (`finished: false` if the student left the test early).

## Mounting without an iframe

```js
import { createVernierApp, loadFonts } from './vernier-caliper/src/app.js';
await loadFonts();
const app = createVernierApp(document.getElementById('caliper'), { lang: 'bn', lc: 0.02 });
app.on('change', (r) => {});
```

The page needs the import map from `index.html` and the two stylesheets (`shared/fonts/noto-sans-bengali.css`, `style.css`).

## Changing text

All words are in `src/i18n.js` (`STRINGS.bn`, `STRINGS.en`). Terms follow the NCTB textbook: প্রধান স্কেল পাঠ (M), ভার্নিয়ার সমপাতন (V), ভার্নিয়ার ধ্রুবক (VC), যান্ত্রিক ত্রুটি (e).

## Files

```
index.html        entry (iframe target)
style.css         UI styles, scoped under .pvc
src/app.js        wiring + public API
src/caliper.js    procedural 3D model (millimetres) and scale marks
src/reading.js    measurement maths (pure)
src/specimens.js  objects to measure
src/loupe.js      magnifier
src/tour.js       guided walkthrough (full view)
src/quiz.js       multiple-choice test (student view)
src/coach.js      first-use pointers on the jaw and magnifier (student view)
src/practice.js   typed practice (full view)
src/i18n.js       Bangla / English text
shared/           three.js, Pathshala helpers, Noto Sans Bengali font (added by packaging)
```
