# Image in a plane mirror (সমতল আয়নায় প্রতিবিম্ব)

**Where it goes in the book:** Book page 219, topic 8.3.1 প্রতিবিম্ব: next to চিত্র ৮.০৮–৮.১০ (pages 218–220: rays from X reflected by mirror AB seem to come from X′; XP = X′P; the image X′Y′ of XY); the last step also serves the উদাহরণ on page 221 (চিত্র ৮.১২, a mirror half your height).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="plane-mirror-image/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './plane-mirror-image/shared/lib/host.js';
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
| `step` | Step of the book | `distance` Equal distance · `rays` Path of the light · `length` Mirror length | `distance` |
| `d` | Distance from the mirror (m) | number | `1` |
| `stage` | How far the first step is built (0–4) | number | `0` |
| `ray` | How far the rays are built (0–4) | number | `0` |
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
| `set` | `{"d":1.2,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
