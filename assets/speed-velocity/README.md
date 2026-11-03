# Speed and velocity (দ্রুতি এবং বেগ)

**Where it goes in the book:** Book pages 40–41, topic 2.5: দ্রুতি এবং বেগ. Next to the section text and the উদাহরণ on page 41 (by cycle from A to B along the winding road of চিত্র ২.০৪ in 20 minutes: গড় দ্রুতি and গড় বেগ).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="speed-velocity/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './speed-velocity/shared/lib/host.js';
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
| `path` | Road | `winding` winding (চিত্র ২.০৪) · `straight` straight | `winding` |
| `step` | Step shown | `start` at A · `displacement` at B with the displacement · `compare` the two sums | `start` |
| `time` | Minutes of the ride shown (0–20) | number | `0` |
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
| `set` | `{"playing":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `arrive`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
