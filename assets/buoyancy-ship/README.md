# Archimedes' principle and buoyancy (আর্কিমিডিসের নীতি এবং প্লবতা)

**Where it goes in the book:** Book page 137, topic 5.3.1.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="buoyancy-ship/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './buoyancy-ship/shared/lib/host.js';
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
| `step` | Step | `pressure` pressure (চাপ) · `weight` weight and buoyancy (ওজন ও প্লবতা) · `displaced` water pushed aside (অপসারিত পানি) · `load` loading (মাল বোঝাই) | `pressure` |
| `load` | Containers on board (20 t each; 12 bring the water to the load line) | number | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring round the hull pulses | `1` · `0` | `1` |
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
| `set` | `{"step":"pressure","phase":2}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `step`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
