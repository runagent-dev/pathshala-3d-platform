# Screw gauge (স্ক্রু-গেইজ)

> **Where it goes in the book: page 21, topic 1.6.1, স্ক্রু-গেইজ (Screw Gauge).**
> Put it next to Figure 1.08 (চিত্র ১.০৮), or in place of the screw-gauge photo in that figure.
> (Also in `PACKAGE.json` as `page`, `topic`, `placement`.)

Interactive 3D screw gauge, made as the book describes it: one turn moves the screw by the **pitch, ১ মিমি**, and the
circular scale has **১০০ ভাগ**, so the **ন্যূনাঙ্ক (least count) is ০.০১ মিমি**. Bangla, white reading panel with a navy studio and wooden bench behind the blue-enamel instrument, works offline.

What the student can do:

- Turn the thimble: drag across it and its surface follows the finger (one full turn = ১ মিমি); drag along it to move
  fast. Scroll on it or use the arrow keys for one part (Shift: ১ মিমি). Dragging inside the magnifier is finer still.
- The ratchet knob turns it too. When the spindle meets the object the ratchet clicks and slips: the screw stops,
  the object is never squeezed.
- **শেখো**: the reading in large digits, written as `= L + C × LC` with each number named (রৈখিক স্কেল পাঠ, বৃত্তাকার
  স্কেল পাঠ, ন্যূনাঙ্ক) and coloured like its mark on the instrument, plus the book's sentence
  "ন্যূনাঙ্ক = পিচ ÷ বৃত্তাকার স্কেলের ভাগ = ১ মিমি ÷ ১০০ = ০.০১ মিমি". "একটি বস্তু মাপো" clamps a copper wire, a steel
  ball or a glass plate.
- **পরীক্ষা**: 5 questions. An object is clamped and the screw locked; pick the reading from 4 choices (the wrong ones
  are the usual mistakes: the next millimetre mark, the division next to the line, the circular scale counted the
  wrong way, forgetting × ০.০১). The marks are coloured and the sum shown after each answer.
- A magnifier on the datum line (zoom set so the divisions are readable on any screen), "সামনে / ঘুরিয়ে দেখো",
  fullscreen, and first-use pointers (on phones the hand goes on the ratchet knob, because the magnifier covers the
  thimble there).

Tested at 390×700 (touch), 844×390, 800×500 and 1280×800.

## Embed

```html
<iframe class="pathshala-3d" src="screw-gauge/index.html" allow="fullscreen" loading="lazy"></iframe>
<style>
  .pathshala-3d { width: 100%; aspect-ratio: 16 / 10; border: 0; }
  @media (max-width: 600px) { .pathshala-3d { aspect-ratio: auto; height: min(640px, 85vh); } }
</style>
```

## URL parameters

| Param | Values | Default | |
|---|---|---|---|
| `lang` | `bn` · `en` | `bn` | |
| `value` | number (mm) | `3.47` | Starting reading |
| `object` | `wire` · `ball` · `plate` | none | Object clamped at start |
| `size` | number (mm) | per object | wire 0.4–2.5, ball 3–12, plate 1–4 |
| `mode` | `explore` · `quiz` | `explore` | Start in শেখো or পরীক্ষা |
| `view` | `front` · `3d` | `front` | |
| `magnifier`, `guides`, `coach`, `shadow`, `sound` | `1` · `0` | all `1` | |
| `numerals` | `bn` · `latin` | follows `lang` | |
| `bg` | `light` · `transparent` | `light` | |

## Talking to it from the book (postMessage)

`shared/lib/host.js` is included:

```js
import { connectAsset } from './screw-gauge/shared/lib/host.js';
const gauge = connectAsset(document.querySelector('iframe'));
await gauge.ready;
gauge.on('change', (r) => console.log(r.value, r.L, r.C));
gauge.on('practice-result', (r) => saveProgress(r));
await gauge.call('set', { object: 'ball', size: 6.35 });
```

| Command | Payload | Result |
|---|---|---|
| `get` | | state |
| `set` | any of `value, object, size, view, guides, magnifier, sound, animate` | state |
| `reset` | | state |
| `practice` | | `true` (starts the test) |
| `capture` | `{ width, height }` | PNG data URL |

Events: `ready`, `change` (`{ value, L, C, lc, pitch, gap, contact, locked, object, mode }`), `object`, `view`,
`dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`. Lengths are in millimetres.

## Files

```
index.html        entry
style.css         the gauge's colours for L, C, LC (the student view is shared/lib/student/student.css)
src/app.js        turning, ratchet, camera, panel, test, pointers, public API
src/gauge.js      procedural 3D model (mm) and its scales
src/reading.js    pitch, 100 parts, least count, L + C × LC
src/objects.js    copper wire, steel ball, glass plate
src/i18n.js       Bangla / English text
shared/           three.js, the shared student view, Noto Sans Bengali (added by packaging)
```
