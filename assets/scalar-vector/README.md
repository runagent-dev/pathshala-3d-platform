# Scalar and vector quantities (স্কেলার ও ভেক্টর রাশি)

**Where it goes in the book:** Book page 38, topic 2.3: স্কেলার ও ভেক্টর রাশি. Next to চিত্র ২.০৩ (vectors A, B, C, D), or in place of it.

A simple illustrated journey teaches **scalar length** and **vector position**. One blue winding path goes from the start to the finish around a pond. Its length is **১২০ m**; the finish is **২০ m north** of the start, shown by a straight coral arrow. The arrow is labelled **অবস্থান**, following topic 2.3 rather than introducing the next section's সরণ.

One numbered action walks the path, then reveals the position vector. Three short comparisons show just **two arrows at a time**, preserving Figure 2.03: A and B are equal; C has A's magnitude but another direction; D has C's direction but half its magnitude. Clear labels name the path and arrow. The panel has one action, one result and one rule.

Five tap-answer questions read the pictures. Keyboard: Right / Enter / Space advance, Left goes back, R resets, F shows the map from above and V tilts it. The test locks scene changes and restores the learn state afterwards. All six book and phone sizes are checked. The path and arrow are to scale; trees and pond are symbolic.

`?stage=2` opens the labelled journey used for the poster. Stages 0–5 and the bridge's act, compare and home commands remain available.

## Embed

```html
<iframe src="scalar-vector/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './scalar-vector/shared/lib/host.js';
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
| `stage` | Start at step | `0` the journey before walking · `1` scalar path length · `2` vector position · `3` A and B: equal vectors · `4` A and C: different direction · `5` C and D: different magnitude | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | Pulse the next action marker | `1` · `0` | `1` |
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
| `set` | `{"act":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `step`, `compare`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
