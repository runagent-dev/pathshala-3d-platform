# A straw and the air's pressure (স্ট্র ও বাতাসের চাপ)

**Where it goes in the book:** Book page 145, topic 5.4.1 (টরিসেলির পরীক্ষা): beside the paragraph on drinking a cold drink through a straw ('আসলে ব্যাপারটি ঘটে বাতাসের চাপের জন্য'), before চিত্র ৫.১০.

Interactive 3D figure for the Pathshala book. Drinking through a straw (page 145, topic 5.4.1). A clear glass of cold drink on a plain table against a calm deep-blue backdrop, a clear plastic straw in it, and the straw's top end in a plain cut-away of a mouth (a section through the lips and the space inside, no face), labelled মুখের ভেতর. The air is drawn as small particles: the same crowd over the drink and inside the mouth. Three steps, one tap each, slow: (1) no sucking: outlined cyan arrows show the outside air pressing on the drink and violet ones the air in the mouth, equal, so there is no net force (কার্যকর বল) and the drink in the straw stays level with the glass; (2) sucking: the mouth's particles thin out, its arrows get fewer and shorter, a green arrow up the straw (কার্যকর বল) appears and the outside air pushes the drink up into the mouth; (3) the book's limit: the camera pulls back to a 10.5 m straw beside a person and a scale in metres, and the drink stops at 10.3 m. The panel: a calm intro card, then per step one lead-in line, the result and the rule with the book's term in bold; the kit's how-to row. Test tab: 4 questions (why nothing rises without sucking, where the pressure falls, why it rises, how high at most), every wrong choice with its own note. Split from torricelli-barometer. Phone-first, Bangla and English.

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
| `set` | `{"step":"rest","animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
