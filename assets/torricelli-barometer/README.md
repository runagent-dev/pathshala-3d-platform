# Torricelli's experiment (টরিসেলির পরীক্ষা)

**Where it goes in the book:** Book pages 145–146, topic 5.4.1 (টরিসেলির পরীক্ষা): beside চিত্র ৫.১০ (the tube in a dish of mercury, 'বাতাসের চাপের কারণে পারদ ঠিক 76 cm উচ্চতায় স্থির হয়ে যায়') and the paragraphs before it on the straw, the 10.3 m of cold drink and the 76 cm of mercury.

Interactive 3D figure for the Pathshala book. Torricelli's experiment (pages 145–146, topic 5.4.1) in a school lab: a warm teak bench, a blue-grey wall with a slate chalkboard and a window with an iron grille and marigolds on the sill. A row of words follows the page. স্ট্র: a bottle of cola with a clear straw bending into a child's mouth (a head from the side, the inside of the mouth shown through a cut); blue arrows show the outside air's pressure on the drink and the mouth's air pressing on the straw's end; with no sucking they are equal and the drink in the straw stays at the bottle's level, a tap on চুমুক দাও shortens the mouth's arrow and the drink climbs to the mouth. টরিসেলি: a glass tube closed at one end beside a dish of silvery mercury and a cream scale in cm on a retort stand; numbered steps fill it from a beaker, seal it with a thumb and turn it over into the dish, let go: the mercury falls, bobs and stops at 76 cm with a vacuum (শূন্যতা) at the top; the camera visits the vacuum and the dish, where blue air-pressure arrows press on the mercury and a curved arrow carries the pressure under the tube's mouth and up to meet the red arrow of the column's pressure; a fourth step pierces the top, air rushes in and the column falls into the dish. হেলাও: the tube tilts 10° at a time to 40°; the mercury fills more of the tube but its top stays level with 76 on the scale. পাহাড়ে: the barometer goes to 1000, 2000 and 3000 m, the window's view changes from plains to snowy peaks, the arrows shorten and the column falls to about 67, 60 and 53 cm. পানি: in the schoolyard a glass pipe in a tub fills with water to 10.3 m, nearly to the roof of a three-storey school, beside a small 76 cm mercury barometer and a measuring staff. ছিদ্র (the owner's third picture): a tank with a lid and a corked hole; with the lid on, the cork pulled, a few drops come and stop; with the lid off a jet spurts and weakens as the depth h above the hole falls. The panel works out P = hρg with the book's numbers (0.76 m × 13,600 kg m⁻³ × 9.8 m s⁻² ≈ 10⁵ N/m²). Test tab: 5 questions (what is in the space above the mercury; the vertical height of a tilted column; the air's pressure up a mountain from the scale; the water column; the straw without sucking or the tank with its lid on), every wrong choice a real mistake with its own note. Phone-first, Bangla and English.

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
| `example` | Experiment | `straw` the straw · `torricelli` Torricelli's tube · `tilt` the tube tilted · `mountain` up a mountain · `water` water instead of mercury · `tank` the tank with a hole | `torricelli` |
| `phase` | Torricelli's tube | `ready` empty, beside the dish · `full` full of mercury · `dipped` turned over into the dish · `settled` let go: 76 cm and a vacuum · `pierced` pierced at the top | `ready` |
| `tilt` | Tilt (with example=tilt) (0, 10, 20, 30 or 40) | number | `0` |
| `alt` | Height above the sea (with example=mountain) (0, 1000, 2000 or 3000) | number | `0` |
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

Events: `ready`, `change`, `example`, `look`, `view`, `settle`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
