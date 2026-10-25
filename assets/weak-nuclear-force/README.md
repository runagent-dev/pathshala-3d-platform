# Weak nuclear force (দুর্বল নিউক্লীয় বল)

**Where it goes in the book:** Book page 68, topic 3.2.3: দুর্বল নিউক্লীয় বল (Weak Nuclear Force), next to that paragraph.

Interactive 3D figure for the Pathshala book. A radioactive nucleus (6 protons, 8 neutrons): a tap shows, slowed
down, the weak nuclear force turning one neutron into a proton while an electron, the beta (β) ray, shoots out. A
zoom with three stops (atom, nucleus, the weak force's reach of 10⁻¹⁸ m inside a neutron) with a scale bar shows
how short the force's range is; the panel keeps the four fundamental forces in order, weakest first.

`set` takes `stop` (`atom` · `nucleus` · `reach`), `beta` (`true` plays the emission, `false` a fresh nucleus, a
number 0–1 shows it stopped at that point), `view` and `animate: false`. `get` returns `{ stop, zoom, size, flying,
beta (null · change · fly · done), protons, neutrons, electrons, flight (fm the electron flies: it stops inside the
view), scale (the scale bar's power of ten, metres), view, mode }`. The GLB is the nucleus, 10¹³ times life size (1 fm written as 1 cm, as in strong-nuclear-force).

## Embed

```html
<iframe src="weak-nuclear-force/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './weak-nuclear-force/shared/lib/host.js';
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
| `stop` | Zoom | `atom` atom (পরমাণু) · `nucleus` nucleus (নিউক্লিয়াস) · `reach` weak force range (10⁻¹⁸ m) | `nucleus` |
| `beta` | β emission stopped at (Show the β emission stopped at this point (0 start, 1 end), e.g. 0.42 for pictures; empty: not started) | number |  |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | First-use pointers | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `bg` | Background | `light` · `transparent` | `light` |
| `sound` | Sound | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"beta":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `beta`, `stop`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
