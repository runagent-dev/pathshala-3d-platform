# Circular motion: the fan (ঘূর্ণন গতি: বৈদ্যুতিক পাখা)

**Where it goes in the book:** Book page 36, topic 2.2: ঘূর্ণন গতি (Circular Motion), next to that paragraph (the page has no picture for it); the first of three labs (fan, clock hand, Moon).

Interactive 3D figure for the Pathshala book. The book's first example of circular motion, a ceiling fan seen
from below, turns by itself; the student touches the moving point to measure its distance from the fixed point, and
sees the same number every time. Then a four-question test. The clock hand and the Moon are their own labs
(`circular-motion-clock`, `circular-motion-moon`).

Notes for the book developer:
- The scene is in centimetres; the GLB export is in metres. The fan (1.44 m sweep) is real size.
- `get` returns `{ angle, playing, distance, unit, marks: [{ angle, distance }], same, traced, view, mode }`;
  `distance` is in `unit` (`cm`).

## Embed

```html
<iframe src="circular-motion/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './circular-motion/shared/lib/host.js';
  const figure = connectAsset(document.querySelector('iframe'));
  await figure.ready;
  figure.on('change', (state) => console.log(state));
</script>
```

## URL parameters

<!-- generated:params (npm run docs) -->
| Param | Meaning | Values | Default |
|---|---|---|---|
| `lang` | Language | `bn` বাংলা · `en` English | `bn` |
| `play` | Turning at the start | `1` · `0` | `1` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | First-use pointers | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `bg` | Background | `light` · `transparent` | `light` |
| `shadow` | Soft shadow | `1` · `0` | `1` |
| `sound` | Sound | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"playing":false,"angle":45}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `measure`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
