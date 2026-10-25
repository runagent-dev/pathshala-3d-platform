# Circular motion (ঘূর্ণন গতি)

**Where it goes in the book:** Book page 36, topic 2.2: ঘূর্ণন গতি (Circular Motion), next to that paragraph (the page has no picture for it).

Interactive 3D figure for the Pathshala book. The book's three examples of circular motion turn by themselves (a
ceiling fan seen from below, a wall clock's second hand, the Moon round the Earth); the student touches the moving
point to measure its distance from the fixed point, and sees the same number every time. Then a five-question test.

Notes for the book developer:
- The scene is in centimetres; the GLB exports (`circular-motion.glb` fan, `-clock`, `-moon`) are in metres. The
  fan (1.44 m sweep) and the clock (31 cm) are real size; the Earth and Moon are a stylised model, not to scale.
- `get` returns `{ example, angle, playing, distance, unit, marks: [{ angle, distance }], same, traced, view, mode }`;
  `distance` is in `unit` (`cm`, or `lakh km` for the Moon: 3.84 lakh km = 3,84,000 km).

## Embed

```html
<iframe src="circular-motion/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './circular-motion/shared/lib/host.js';
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
| `example` | Example | `fan` fan (পাখা) · `clock` clock hand (ঘড়ির কাঁটা) · `moon` Moon (চাঁদ) | `fan` |
| `play` | Turning at the start | `1` · `0` | `1` |
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
| `set` | `{"example":"clock"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `example`, `measure`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
