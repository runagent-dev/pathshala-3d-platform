# Acceleration (ত্বরণ)

**Where it goes in the book:** Book pages 43–44, topic 2.6: ত্বরণ (Acceleration). Next to the section text and চিত্র ২.০৬ (velocity–time graph), or in place of that graph.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="acceleration/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './acceleration/shared/lib/host.js';
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
| `scene` | Example | `line` straight road · `turn` turning at a steady speed | `line` |
| `trip` | Start with | (empty) the CNG standing, an empty graph · `book` the book's graph driven (A, B, C, D), braking now |  |
| `view` | View | `front` from the side / from above · `3d` 3d | `front` |
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
| `set` | `{"pedal":"gas"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `scene`, `pedal`, `start`, `done`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
