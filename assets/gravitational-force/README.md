# Gravitational force (মহাকর্ষ বল)

**Where it goes in the book:** Book page 68, topic 3.2.1: মহাকর্ষ বল (Gravitational Force), next to that paragraph.

Interactive 3D figure for the Pathshala book. Five stops, from the smallest distance to the largest, show the same
pull (মহাকর্ষ বল, two equal violet arrows on each pair): two apples on a table (the student drags one away and sees the
pull, about 10⁻¹¹ N, shrink but never vanish), people standing all round the Earth (the student drags themself round
and drops the apples: down is towards the Earth's centre, মাধ্যাকর্ষণ বল), the Moon round the Earth and the Earth
round the Sun (a button takes the pull away: the body flies off in a straight line), and our Sun in the galaxy (the
range is infinite). A strip shows the four fundamental forces weakest to strongest. Then a five-question test.

Notes for the book developer:
- The scene is in centimetres; the GLB exports (`gravitational-force.glb` the Earth with the people, `-apples`,
  `-moon`, `-sun`) are in metres. The globe is a 40 cm desk globe with people drawn much bigger; the apples are real
  size; the Moon, the Sun and the galaxy are a stylised model, not to scale (the figure says so).
- `get` returns `{ stop, angle, place, boat, gap, pull, orbit, playing, nopull, dropping, view, mode }`: `angle` is
  where the student stands on the Earth's edge (degrees from the North Pole, clockwise in the front view; 66.5 is
  Bangladesh), `place` names it (`bangladesh`, `pacific`, …; `boat` at sea), `gap` is the apples' distance in cm and
  `pull` the pull between them in newtons.

## Embed

```html
<iframe src="gravitational-force/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './gravitational-force/shared/lib/host.js';
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
| `stop` | Start at | `apples` two apples (আপেল) · `earth` people on the Earth (পৃথিবী) · `moon` Moon round the Earth (চাঁদ) · `sun` Earth round the Sun (সূর্য) · `galaxy` stars in a galaxy (গ্যালাক্সি) | `earth` |
| `play` | Orbits turning | `1` · `0` | `1` |
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
| `set` | `{"angle":246.5}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `stop`, `view`, `drop`, `nopull`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
