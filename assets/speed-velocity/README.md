# Speed and velocity (দ্রুতি এবং বেগ)

**Where it goes in the book:** Book pages 40–41, topic 2.5: দ্রুতি এবং বেগ. Next to the section text and its example (A to B in 20 minutes on the winding road of চিত্র ২.০৪).

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
| `scene` | Example | `stone` whirling stone · `road` cycle on the road (A to B) | `stone` |
| `view` | View | `front` from above · `3d` 3d | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `angle` | Stone held still at (deg from east) (empty: the stone goes round) | number |  |
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
| `set` | `{"scene":"stone"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `scene`, `release`, `land`, `arrive`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
