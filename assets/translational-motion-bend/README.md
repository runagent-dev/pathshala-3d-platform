# Car taking a bend (বাঁক নেওয়া গাড়ি)

**Where it goes in the book:** Book page 36, topic 2.2: চলন গতি (Translational Motion), next to that paragraph, after the translational-motion lab: the contrast to the book's সোজা এগিয়ে যাওয়া গাড়ি (the page has no picture for it).

A detailed pearl-white car with red accents takes a bend. Track four points on the body: each goes its own distance round its own circle, so a turning car is not in translational motion.

## Embed

```html
<iframe src="translational-motion-bend/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './translational-motion-bend/shared/lib/host.js';
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
| `distance` | Distance already driven (0 to 7.85 m round the bend) | number | `0` |
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
| `set` | `{"distance":7.85,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `drive`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
