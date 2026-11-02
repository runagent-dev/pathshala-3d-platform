# Specific heat (আপেক্ষিক তাপ)

**Where it goes in the book:** Book pages 178–179, topic 6.5: next to the paragraph that defines specific heat (s = Q/m(T₂ − T₁), unit J kg⁻¹K⁻¹) and the gold-and-water example of heat capacity C = ms.

Interactive 3D figure for the Pathshala book. Specific heat (আপেক্ষিক তাপ, topic 6.5), drawn from the book's own numbers because the page has no picture: one electric stove with two iron plates, a steel pot with 10 kg (10 litres) of water on the left and a 10 kg gold bar on the right, and between them two glass thermometers on the same scale with a blue line at the starting 30 °C. One tap gives both the same heat, 42,000 J (the amount that warms 10 kg of water by exactly 1 K): the plates glow, the water's column rises 1 K a press and the gold's about 18.3 K, up to four presses. The panel (Bangla digits, the book's terms) shows the chosen one's readings m, Q, T₁, T₂, T₂ − T₁ and works the book's formula s = Q ÷ m(T₂ − T₁) (4,200 for water, about 230 for gold, in J kg⁻¹K⁻¹) and C = ms (42,000 and 2,300 J K⁻¹, "প্রায় 20 গুণ"); the rule grows in the book's words. Test tab: 5 questions (which gets hotter on the same heat; what 1 kg per 1 K is called; s from the picture; C = ms; the unit of s), every wrong choice a real mistake with its own note. Phone-first, Bangla and English.

## Embed

```html
<iframe src="specific-heat/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './specific-heat/shared/lib/host.js';
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
| `steps` | Times the stove was turned on at the start (Each turn gives both 42,000 J) | number | `0` |
| `show` | Which one the panel works out | `water` water · `gold` gold | `water` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the stove knob pulses at first | `1` · `0` | `1` |
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
| `set` | `{"steps":1}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `choose`, `heat`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
