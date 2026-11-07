# Image in a concave lens (অবতল লেন্সে প্রতিবিম্ব)

**Where it goes in the book:** Book page 257, topic 9.4.1 অবতল লেন্স, চিত্র ৯.১৮–৯.২০ (pp. 257–259).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="concave-lens-image/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './concave-lens-image/shared/lib/host.js';
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
| `stage` | What is shown | `see` the pencil seen through the lens · `par` parallel rays spread (চিত্র ৯.১৮) · `focus` extended back to F; the focal length · `conv` rays aimed at F′ leave parallel (চিত্র ৯.১৯) · `r2` rule (ii): the parallel ray · `r1` rule (i): the ray toward the centre · `r3` rule (iii): the ray toward F′ · `image` the image X′Y′ (চিত্র ৯.২০) · `eye` the image seen from the eye's side · `cases` the pencil at the row's distances · `graph` the graph of the image's distance and height · `table` the table | `see` |
| `u` | Pencil's distance from the lens (cm) | number | `30` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered ring and the words on the handle | `1` · `0` | `1` |
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
| `set` | `{"stage":"cases","u":30,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
