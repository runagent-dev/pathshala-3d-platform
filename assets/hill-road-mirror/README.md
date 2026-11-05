# Mirror at a hill-road bend (পাহাড়ি রাস্তার অদৃশ্য বাঁক)

**Where it goes in the book:** Book page 236, topic 8.8.4 পাহাড়ি রাস্তার অদৃশ্য বাঁক (a large plane or convex mirror at 45° at a blind bend).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="hill-road-mirror/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './hill-road-mirror/shared/lib/host.js';
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
| `part` | How far the story is built (0 the bend, 1 hidden by the hill, 2 mirror, 3 the ray, 4 the angles, 5 both drivers, 6 plane and convex) | number | `0` |
| `mirror` | Mirror | `plane` plane · `convex` convex | `plane` |
| `bus` | The bus's nose along the east road (m) | number | `13.5` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the part pulses at first | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `sound` | Sound | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"part":3,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
