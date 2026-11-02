# A water barometer (পানির ব্যারোমিটার)

**Where it goes in the book:** Book page 145, topic 5.4.1 (টরিসেলির পরীক্ষা): beside the paragraph on the 10.3 m of cold drink ('কোল্ড ড্রিংকসটা 10.3 মিটার পর্যন্ত উঠে হঠাৎ করে থেমে গেছে') and the 13.6 times denser mercury.

Interactive 3D figure for the Pathshala book. Water instead of mercury (page 145, topic 5.4.1) in a schoolyard: one tall glass pipe standing in a tub of water against a three-storey school, beside a small 76 cm mercury barometer and a red-and-white measuring staff. One button fills it the Torricelli way: the water rises to 10.3 m, nearly to the roof (the camera follows it up), and stops with a vacuum above; one outlined blue air-pressure arrow presses on the tub and the column's height is drawn in orange. The panel shows one short line, the water's and the mercury's columns, and the rule (mercury is 13.6 times as dense as water: 76 cm × 13.6 ≈ 10.3 m). Test tab: 3 questions (how high the water stands, why so high, what is above it), every wrong choice with its own note. Split from torricelli-barometer. Phone-first, Bangla and English.

## Embed

```html
<iframe src="torricelli-water-barometer/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './torricelli-water-barometer/shared/lib/host.js';
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
| `set` | `{"water":"done"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
