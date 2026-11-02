# A straw and the air's pressure (স্ট্র ও বাতাসের চাপ)

**Where it goes in the book:** Book page 145, topic 5.4.1 (টরিসেলির পরীক্ষা): beside the paragraph on drinking a cold drink through a straw ('আসলে ব্যাপারটি ঘটে বাতাসের চাপের জন্য'), before চিত্র ৫.১০.

Interactive 3D figure for the Pathshala book. Drinking through a straw (page 145, topic 5.4.1) in a plain school lab (a teak bench, a blue-grey wall): one bottle of cold drink with a clear straw bending into a child's mouth (a head from the side, the inside of the mouth shown through a cut). One outlined blue arrow shows the outside air's pressure on the drink, one the air's pressure in the mouth. With no sucking they are equal and the drink in the straw stays at the bottle's level; one button, চুমুক দাও, shortens the mouth's arrow and the outside air pushes the drink up to the mouth (the difference is exaggerated). The panel shows one short line, the mouth's pressure against the outside air's and the rule (a cold drink never rises more than 10.3 m). Test tab: 3 questions (why nothing rises without sucking, why it rises when you suck, how high at most), every wrong choice with its own note. Split from torricelli-barometer. Phone-first, Bangla and English.

## Embed

```html
<iframe src="torricelli-barometer-straw/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './torricelli-barometer-straw/shared/lib/host.js';
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
| `set` | `{"suck":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
