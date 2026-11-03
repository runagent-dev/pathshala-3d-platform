# A paper vocal cord (কাগজের ভোকাল কর্ড)

**Where it goes in the book:** Book pages 198–199, topic 7.3 শব্দ তরঙ্গ: next to চিত্র ৭.১০ (paper cut and folded into a vocal cord, blown between two fingers) and the নিজে করো at the foot of page 198.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="paper-vocal-cord/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './paper-vocal-cord/shared/lib/host.js';
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
| `cut` | Flaps cut | `long` long (14 mm, about 160 Hz) · `mid` medium (10 mm, about 310 Hz) · `short` short (7 mm, about 640 Hz) | `mid` |
| `blow` | Already blowing (steady) | `1` · `0` | `0` |
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
| `set` | `{"blow":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
