# Refraction of light (আলোর প্রতিসরণ)

**Where it goes in the book:** Book page 243, topic 9.1 আলোর প্রতিসরণ, with চিত্র ৯.০১–৯.০২ and টেবিল ৯.০১; it carries the laws of refraction (9.1.1, চিত্র ৯.০৪–৯.০৫, pp. 244–247, but not the coin নিজে করো: that is coin-in-cup) and the relative refractive index (9.1.2, pp. 247–248).

A thick glass block and a torch on a graduated arc: light bends and slows as it goes in (n = c/v), the normal and the angles θ₁, θ₂, the first law in true 3D (the plane of incidence, seen edge-on), the second law found with Measure on a sin θ₁–sin θ₂ graph (water, glass, diamond), and the relative index of glass with respect to water (1.14). Five steps, a five-question test, Bangla and English.

## Embed

```html
<iframe src="refraction-of-light/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './refraction-of-light/shared/lib/host.js';
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
| `step` | Start at step | `intro` start · `slow` 1 speed · `bend` 2 bending · `plane` 3 first law · `law` 4 second law · `relative` 5 relative index | `intro` |
| `medium` | Second medium | `glass` glass · `water` water · `diamond` diamond | `glass` |
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
| `set` | `{"step":"bend","animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
