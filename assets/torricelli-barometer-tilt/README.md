# Torricelli's tube tilted (হেলানো টরিসেলির নল)

**Where it goes in the book:** Book page 146, topic 5.4.1 (টরিসেলির পরীক্ষা): beside চিত্র ৫.১০, after the paragraph on the 76 cm column, as a check that the column's height is vertical.

Interactive 3D figure for the Pathshala book. Torricelli's tube tilted (page 146, topic 5.4.1) in a plain school lab (a teak bench, a blue-grey wall): one barometer, a glass tube standing in a dish of silvery mercury at 76 cm with a vacuum above, beside a cream scale in cm. One button tilts the tube 10° at a time to 40° (then stands it upright again; the arrow keys step too): the mercury fills more of the tube, but a dashed orange line from its top to the scale stays at 76; the vertical height is drawn in orange, one outlined blue air-pressure arrow presses on the dish. The panel shows one short line, the vertical height and the length along the tube, and the rule (pressure depends on the vertical height, P = hρg). Test tab: 3 questions (the vertical height at two tilts, read off the scale; why it stays the same), every wrong choice with its own note. Split from torricelli-barometer. Phone-first, Bangla and English.

## Embed

```html
<iframe src="torricelli-barometer-tilt/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './torricelli-barometer-tilt/shared/lib/host.js';
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
| `tilt` | Tilt (0, 10, 20, 30 or 40) | number | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the part pulses at first | `1` · `0` | `1` |
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
| `set` | `{"tilt":30}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
