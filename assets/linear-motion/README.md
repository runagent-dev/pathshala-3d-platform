# Linear motion (সরলরৈখিক গতি)

**Where it goes in the book:** Book page 36, topic 2.2: সরলরৈখিক গতি (Linear Motion), next to that paragraph (the page has no picture for it).

Interactive 3D figure for the Pathshala book: a carrom board and a cricket ball on a stand. The student pushes the
striker on the flat board, lets the ball fall freely, or throws it sideways; each motion leaves faint pictures at equal
time steps and a dotted path, then a dashed straight line shows whether the path is straight (সরলরৈখিক গতি) or curved.
Then a five-question test. Units: metres (the GLB is in metres).

## Embed

```html
<iframe src="linear-motion/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './linear-motion/shared/lib/host.js';
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
| `example` | Example at the start | `push` push (striker) · `drop` free fall · `throw` sideways throw | `push` |
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
| `set` | `{"example":"push","angle":-15,"strength":0.85}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `example`, `start`, `done`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->

## State (`get`)

`{ example, phase, path, linear, striker: { x, z }, ball: { x, y, onHolder }, runs: { push, drop, throw }, view, mode }`:
`example` is `push` | `drop` | `throw`; `phase` is `ready` | `aiming` | `moving` | `done`; `path` is `straight` |
`curved` once the straight line is drawn. Each run gives `{ state, linear, deviation (m from the straight line),
duration (s, real time), distance (m), pictures, step (s between pictures) }`, plus `angle` (degrees from straight
ahead, + to the right) and `strength` (0–1) for a push. The ball is shown 4 times slower than real time.
