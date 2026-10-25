# Momentum (ভরবেগ)

**Where it goes in the book:** Book pages 71–72, topic 3.4: ভরবেগ (Momentum). Next to the truck-and-bicycle paragraph, p⃗ = mv⃗ and the box with the unit kg m/s and the dimension MLT⁻¹.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="momentum/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './momentum/shared/lib/host.js';
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
| `speed` | Velocity (m/s) (the same for the truck and the bicycle) | number | `5` |
| `dir` | Direction | `right` to the right (+) · `left` to the left (−) | `right` |
| `at` | Moment of the run (shown paused, e.g. 1 (just before the crash at 5 m/s); past the end shows the result) | number |  |
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
| `set` | `{"speed":8}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `play`, `crash`, `rest`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
