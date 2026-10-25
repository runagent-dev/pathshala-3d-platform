# Laws of falling bodies (পড়ন্ত বস্তুর সূত্র)

**Where it goes in the book:** Book pages 48–49, topic 2.8: পড়ন্ত বস্তুর সূত্র (Laws of Falling Bodies). Next to Galileo's three laws and the paper-and-stone paragraph.

Interactive 3D figure for the Pathshala book: the book's own experiment. Two clear tubes of the same height, one
with air and one emptied, each with a small stone and a piece of paper at rest at the same height. One red button
(on the release box on top of the scale) lets all four fall at once (shown 8 times slower): in air the stone lands first and the paper flutters down far
behind; without air the stone and the paper land together. In the empty tube the bodies leave a faint picture every
0.1 s with a line across the centimetre scale and a velocity arrow, and the panel's table shows v = gt and
h = ½gt², with the book's second and third laws (v ∝ t, h ∝ t²) and equations; after landing it states the first
law. The paper can be crumpled, an extra test the book doesn't do (the same mass, less air hindrance). Then a
five-question test. Units are the book's SI symbols (s, m/s, ms⁻², m, cm).
Units: metres (the GLB is in metres, the tubes at real size).

## Embed

```html
<iframe src="falling-bodies/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './falling-bodies/shared/lib/host.js';
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
| `t` | Time after the release (paused) (0 = ready to let go; e.g. 0.25 shows both tubes 0.25 s into the fall) | number | `0` |
| `paper` | Paper | `flat` flat sheet · `crumpled` crumpled ball | `flat` |
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
| `set` | `{"release":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `release`, `land`, `done`, `paper`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->

## State (`get`)

`{ phase, t, paper, vacuum: { stone, paper, down }, air: { stone, paper, stoneDown, paperDown }, times: { vacuum,
airStone, airPaper }, steps: [{ t, v, h }], view, mode }`: `phase` is `ready` | `falling` | `paused` | `done`; `t` is
the time since the release in seconds of real time (the scene plays 8 times slower); `stone` and `paper` are the
heights fallen in metres (the tubes are 0.441 m inside, a free fall takes 0.3 s); `times` are the landing times in
seconds; `steps` lists the pictures passed so far (0.1, 0.2, 0.3 s) with v = gt (m/s) and h = ½gt² (m). `paper` is
`flat` | `crumpled`.

`set` takes any of `paper` (`flat` | `crumpled`, back to the start), `t` (seconds after the release, shown paused; 0
is ready), `release: true` (let go and play; with `animate: false` it jumps to the end), `play` (true goes on, false
pauses), `step` (1 plays one 0.1 s step, −1 jumps one back) and `view` (`front` | `3d`). Event `land` gives
`{ tube: 'vacuum' | 'air', body: 'both' | 'stone' | 'paper', t }`.
