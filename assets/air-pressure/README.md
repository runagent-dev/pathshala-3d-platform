# Air pressure (বাতাসের চাপ)

**Where it goes in the book:** Book page 142, topic 5.4.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="air-pressure/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './air-pressure/shared/lib/host.js';
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
| `part` | Part | `can` the tin box · `column` the air column · `body` our body | `can` |
| `strokes` | Pump strokes done (0 (full of air) to 5 (no air left); each stroke takes out 20,000 Pa) | number | `0` |
| `whatIf` | The box pressed only from the top (needs 5 strokes) | `1` · `0` | `0` |
| `weigh` | The column's weight shown | `1` · `0` | `0` |
| `space` | The body in space | `1` · `0` | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring round the pump pulses | `1` · `0` | `1` |
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
| `set` | `{"strokes":3,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `pump`, `whatif`, `part`, `space`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
