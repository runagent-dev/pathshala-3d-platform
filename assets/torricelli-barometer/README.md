# Torricelli's experiment (টরিসেলির পরীক্ষা)

**Where it goes in the book:** Book pages 145–146, topic 5.4.1 (টরিসেলির পরীক্ষা): beside চিত্র ৫.১০ (the tube in a dish of mercury, 'বাতাসের চাপের কারণে পারদ ঠিক 76 cm উচ্চতায় স্থির হয়ে যায়') and the paragraphs before it on the straw, the 10.3 m of cold drink and the 76 cm of mercury.

Interactive 3D figure for the Pathshala book. Torricelli's experiment (pages 145–146, topic 5.4.1, চিত্র ৫.১০) as one guided sequence in one view, in a plain school lab (a teak bench, a blue-grey wall). Only a glass tube closed at one end, a dish of silvery mercury, a cream scale in cm with 76 cm marked in orange and one outlined blue air-pressure arrow on the dish. One big button steps through it: fill the tube with mercury from a beaker; seal it with a thumb and turn it over into the dish; take the thumb away: the mercury falls, bobs and stops at 76 cm, the empty space at the top is a vacuum (শূন্যতা) and the air pressing on the dish holds the column. The panel shows one short line per step, the column's height and, at the end, the rule. Test tab: 3 questions (what is in the space above the mercury, what holds the column up, how high water would stand), every wrong choice a real mistake with its own note. The straw, the tilted tube, the mountain, the water column and the tank with a hole are labs of their own. Phone-first, Bangla and English.

## Embed

```html
<iframe src="torricelli-barometer/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './torricelli-barometer/shared/lib/host.js';
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
| `phase` | Torricelli's tube | `ready` empty, beside the dish · `full` full of mercury · `dipped` turned over into the dish · `settled` let go: 76 cm and a vacuum | `ready` |
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
| `set` | `{"phase":"settled","animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `settle`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
