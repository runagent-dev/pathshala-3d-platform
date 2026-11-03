# 3D seismic survey (ত্রিমাত্রিক সিসমিক সার্ভে)

**Where it goes in the book:** Book page 203, topic 7.3.3 শব্দের ব্যবহার, the part ত্রিমাত্রিক সিসমিক সার্ভে (3D Seismic Survey): next to চিত্র ৭.১৩.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="seismic-survey/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './seismic-survey/shared/lib/host.js';
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
| `fire` | Blast already recorded | `1` · `0` | `0` |
| `layer` | Echo chosen | `0` none · `1` layer 1 · `2` layer 2 · `3` layer 3 | `0` |
| `image` | 3D picture made | `1` · `0` | `0` |
| `wave` | Waves frozen at (s after the blast; -1 = off) | number | `-1` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the shot hole pulses at first | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `bg` | Background | `light` coloured setting · `transparent` transparent | `light` |
| `shadow` | Soft shadow | `1` · `0` | `1` |
| `sound` | Sound | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"fire":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
