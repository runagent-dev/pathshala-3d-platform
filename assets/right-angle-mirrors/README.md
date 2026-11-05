# Two mirrors at a right angle (সমকোণে দুটি আয়না)

**Where it goes in the book:** Book page 234, topic 8.8.1 সাধারণ আয়না, next to চিত্র ৮.২৬ (a girl showing two fingers in a plain mirror and in two mirrors at 90°); also the উদাহরণ on page 223 with চিত্র ৮.১৫ (a left fist before mirrors AO and BO at right angles: three images).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="right-angle-mirrors/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './right-angle-mirrors/shared/lib/host.js';
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
| `step` | Step of the book | `one` Plain mirror · `two` Two mirrors · `top` The fist | `one` |
| `stage` | How far the step is built (0–3) | number | `0` |
| `alpha` | Angle between the mirrors (90–180°, step two) | number | `180` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the part pulses at first | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `sound` | Sound | `1` · `0` | `1` |
| `shadow` | Soft shadow on the floor | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"step":"two","stage":2,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
