# Elasticity: a spring, stress and strain (স্থিতিস্থাপকতা)

**Where it goes in the book:** Book pages 147–148, topic 5.5 (স্থিতিস্থাপকতা): next to the paragraphs on বিকৃতি, পীড়ন, চিত্র ৫.১১ (a rod stretched by a weight W, tension T) and the box with হুকের সূত্র (পীড়ন ∝ বিকৃতি).

Interactive 3D figure for the Pathshala book. Elasticity (pages 147–148, topic 5.5) in a warm workshop: an old red-brick wall, a deep blue pegboard of tools and an oak bench, with a heavy lab stand from which a polished steel spring hangs (L₀ = 20 cm), a wooden metre rule reading its length L from the top hook, a hanger with a pointer, and brass slotted weights of 1 N each waiting on a block. One tap hangs a weight: it slides onto the hanger and the spring bounces and settles; a red line marks the stretch x beside the dark L₀ line, a bold orange arrow is the restoring force (টান T) in the spring and a purple one the weight W, the same length. Beside it a পীড়ন–বিকৃতি graph gets a point for every load. One weight gives x = 2 cm, two give 4 cm: twice the force, twice the strain, so পীড়ন ∝ বিকৃতি (Hooke's law), and the panel works out বিকৃতি = (L − L₀)/L₀ (no unit), পীড়ন = F/A on the wire's cross-section (A = 10 mm²) in Pa, and their constant ratio, live with Bangla digits. Weights off: the spring returns to L₀ (elasticity). Past 4 N, the elastic limit, it gives way: 5 weights stretch it 13 cm, not 10; the graph bends (hatched 'within the limit' and dotted 'past the limit' bands, named in words); with the weights off it stays 7 cm longer, its coils apart, and the graph shows the permanent set (স্থায়ী বিকৃতি). The rule grows in the book's words to Hooke's law and Young's modulus; a quiet button takes a new spring. Test tab: 5 questions (the strain from the rule, the stress from the weights, x for n weights, the elastic limit from the graph, why the spring stayed long), every wrong choice a real mistake with its own note. Phone-first, Bangla and English.

## Embed

```html
<iframe src="elasticity/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './elasticity/shared/lib/host.js';
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
| `n` | Weights on the spring (0 to 6 weights of 1 N, hung one by one) | number | `0` |
| `spring` | Spring | `fresh` a new spring · `stretched` stretched past its limit before | `fresh` |
| `look` | Camera | `all` the whole spring · `close` close to the stretch | `all` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring round the hanger pulses | `1` · `0` | `1` |
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
| `set` | `{"n":2}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
