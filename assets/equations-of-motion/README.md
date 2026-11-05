# Equations of motion (গতির সমীকরণ)

**Where it goes in the book:** Book pages 45–46, topic 2.7: গতির সমীকরণ (Equations of Motion). Next to the section text on uniform acceleration (v = u + at), in place of a printed picture.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="equations-of-motion/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './equations-of-motion/shared/lib/host.js';
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
| `u` | Initial velocity u (−5 to 5 m/s, steps of 0.1) | number | `1.9` |
| `a` | Acceleration a (−3 to 3 ms⁻², steps of 0.1) | number | `1.7` |
| `t` | Time t shown at the start (0 to 6 s; never past the moment the car reaches an end of the axis) | number | `0` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | First-use pointers | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `bg` | Background (light is the deep blue frame; transparent drops it and keeps the light text, for a dark page) | `light` · `transparent` | `light` |
| `shadow` | Soft shadow | `1` · `0` | `1` |
| `sound` | Sound | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"u":1.9,"a":1.7}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `run`, `pause`, `end`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
