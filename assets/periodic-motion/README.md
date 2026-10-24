# Periodic motion (পর্যায়বৃত্ত গতি)

**Where it goes in the book:** Book page 37, topic 2.2: পর্যায়বৃত্ত গতি (Periodic Motion), next to that paragraph (the page has no picture for it).

Interactive 3D figure for the Pathshala book: the book's examples of periodic motion (a fan blade, Halley's comet,
a mass on a spring, the heartbeat), a mark on the path, and the time of every repetition: all equal, the period.

## Embed

```html
<iframe src="periodic-motion/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './periodic-motion/shared/lib/host.js';
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
| `example` | Example at the start | `fan` fan blade (circular) · `comet` Halley's comet (elliptical) · `spring` spring (straight line) · `heart` heartbeat | `fan` |
| `time` | Start this far into the motion (in the example's unit, repetitions on the way counted; comet 157 shows two of 76 years) | number | `0` |
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
| `set` | `{"example":"comet"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `pass`, `example`, `dragstart`, `dragend`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
