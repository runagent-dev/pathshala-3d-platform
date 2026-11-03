# Superposition of water waves (তরঙ্গের উপরিপাতন)

**Where it goes in the book:** Book pages 192–193, topic 7.2.1 তরঙ্গের বৈশিষ্ট্য, item (v) উপরিপাতন: next to চিত্র ৭.০৩ and the নিজে করো with a plate of water.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="wave-interference/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './wave-interference/shared/lib/host.js';
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
| `example` | Start with | `calm` still water · `one` the 1st source only · `two` the 2nd source only · `both` both sources (the pattern formed) | `calm` |
| `gap` | Distance between the dippers | `10` 10 cm (2λ) · `15` 15 cm (3λ) · `20` 20 cm (4λ) | `15` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered badge on the picture pulses at first | `1` · `0` | `1` |
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
| `set` | `{"example":"one"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
