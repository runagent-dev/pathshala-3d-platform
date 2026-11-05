# Laws of reflection (প্রতিফলনের সূত্র)

**Where it goes in the book:** Book page 215, topic 8.2.1 প্রতিফলনের সূত্র: next to চিত্র ৮.০৩ (the plane of incidence and the normal); also serves 8.2 (চিত্র ৮.০২), the Fresnel paragraph (চিত্র ৮.০৫, page 216) and 8.2.2 (চিত্র ৮.০৭, page 218).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="reflection-laws/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './reflection-laws/shared/lib/host.js';
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
| `step` | Step of the book | `laws` 8.2.1 the two laws · `surface` 8.2.2 smooth and rough water | `laws` |
| `law` | How far the laws are built (0–5) | number | `0` |
| `theta` | Angle of incidence (degrees) | number | `50` |
| `phi` | Swing of the plane (degrees) | number | `0` |
| `waves` | Wavy water | `1` · `0` | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the part pulses at first | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `sound` | Sound | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"law":5,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
