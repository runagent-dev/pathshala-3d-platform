# A barometer up a mountain (পাহাড়ে ব্যারোমিটার)

**Where it goes in the book:** Book page 146, topic 5.4.1 (টরিসেলির পরীক্ষা): after চিত্র ৫.১০ and the sentence that the instrument that measures the air's pressure is the ব্যারোমিটার.

Interactive 3D figure for the Pathshala book. A barometer up a mountain (page 146, topic 5.4.1) in a plain school lab (a teak bench, a blue-grey wall, a window): one Torricelli barometer, a glass tube in a dish of silvery mercury beside a cream scale in cm. One button takes it 1000 m higher at a time to 3000 m (then back to the sea; the arrow keys step too): the window's view changes from plains to snowy peaks, the outlined blue air-pressure arrow on the dish shortens and the column falls from 76 to about 67, 60 and 53 cm, its height drawn in orange. The panel shows one short line, the height and the column, and the rule (less air overhead, less pressure, a lower column). Test tab: 3 questions (what happens higher up, the column read off the scale, why), every wrong choice with its own note. Split from torricelli-barometer. Phone-first, Bangla and English.

## Embed

```html
<iframe src="torricelli-barometer-mountain/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './torricelli-barometer-mountain/shared/lib/host.js';
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
| `alt` | Height above the sea (0, 1000, 2000 or 3000) | number | `0` |
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
| `set` | `{"alt":2000}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
