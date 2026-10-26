# Law of gravitation (মহাকর্ষ বল)

**Where it goes in the book:** Book pages 78–79, topic 3.7: মহাকর্ষ বল (Gravitational Force). Next to চিত্র ৩.০৭ (two masses m₁ and m₂ at distance r), F = Gm₁m₂/r² and the Earth's g = GM/R².

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="law-of-gravitation/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './law-of-gravitation/shared/lib/host.js';
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
| `example` | Start at | `dist` distance (1 m apart) · `mass` mass (2 m apart) · `earth` the Earth | `dist` |
| `steps` | Steps already done (the state after that many of the student's steps: 1 distance doubled, 2 left mass doubled, 3 right mass doubled, 4 weight on the Earth, 5 a second weight) | number | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered ring pulses | `1` · `0` | `1` |
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

Events: `ready`, `change`, `act`, `example`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
