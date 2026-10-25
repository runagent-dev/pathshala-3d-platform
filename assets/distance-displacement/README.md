# Distance and displacement (দূরত্ব ও সরণ)

**Where it goes in the book:** Book page 39, topic 2.4: দূরত্ব ও সরণ. Next to চিত্র ২.০৪ (the winding road), or in place of it.

Interactive 3D figure for the Pathshala book: the winding road of চিত্র ২.০৪ in a 3D countryside. A cyclist rides
from A (the student drags it, taps the road, or rides to B, to C and back to A); a blue trail shows the distance
travelled (দূরত্ব, a scalar) and a straight orange arrow from A shows the displacement (সরণ, a vector, with its
size and direction). At B: 4 km against 2 km; back at A the displacement is zero. Then a five-question test. The
road and its kilometres are to scale; houses, trees and the cyclist are drawn bigger than real.

## Embed

```html
<iframe src="distance-displacement/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './distance-displacement/shared/lib/host.js';
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
| `km` | Cyclist at the start (as if it had ridden there from A: 4 is B, 6 is C) | number | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | First-use pointers | `1` · `0` | `1` |
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
| `set` | `{"km":4,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `arrive`, `dragstart`, `dragend`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
