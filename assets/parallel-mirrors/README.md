# Images in two mirrors (দুটি আয়নায় প্রতিবিম্ব)

**Where it goes in the book:** Book page 216, topic 8.2.1, the উদাহরণ with চিত্র ৮.০৪ (a candle between two parallel mirrors M₁ and M₂, with its images x′, x″, x‴ … in a row on both sides, d₁ d₂ d₃ d₄).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="parallel-mirrors/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './parallel-mirrors/shared/lib/host.js';
  const figure = connectAsset(document.querySelector('iframe'));
  await figure.ready;
  figure.on('change', (state) => console.log(state));
</script>
```

## URL parameters

Since 0.3.0 `step` takes `one`, `two`, `image`, `again`, `many`, `book` (it was `first`, `second`, `many`), and `stage` counts taps into that step.

<!-- generated:params (npm run docs) -->
| Param | Meaning | Values | Default |
|---|---|---|---|
| `lang` | Language | `bn` বাংলা · `en` English | `bn` |
| `step` | Step of the book | `one` One mirror · `two` Second mirror · `image` Its image · `again` Once more · `many` Countless · `book` The book's picture | `one` |
| `x` | Candle on the row (cm from the middle of the gap, −7 to 7) | number | `5` |
| `stage` | How many taps into the step (0–2) | number | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the part pulses at first | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `sound` | Sound | `1` · `0` | `1` |
| `shadow` | Soft shadow | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"x":3,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
