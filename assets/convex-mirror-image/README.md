# Image in a convex mirror (উত্তল আয়নায় প্রতিবিম্ব)

**Where it goes in the book:** Book page 226, topic 8.5.1 গোলীয় উত্তল আয়নায় প্রতিবিম্ব: next to চিত্র ৮.১৯ (a pencil XY in front of a convex mirror, its image X′Y′ smaller); also 8.8.2 (page 235, the rear-view mirror).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="convex-mirror-image/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './convex-mirror-image/shared/lib/host.js';
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
| `stage` | What is shown | `see` the pencil and its picture in the mirror · `par` the parallel ray · `ext` extended to F · `cen` the ray toward the centre · `foc` the ray toward the focus · `image` the image X′Y′ · `move` moving the pencil · `formula` the mirror formula · `plane` a plane mirror, from the eye · `eye` the convex mirror, from the eye · `wide` both fields of view, from above | `see` |
| `u` | Pencil's distance from the mirror (cm) | number | `10` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered ring and the hand | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `shadow` | Soft shadow | `1` · `0` | `1` |
| `sound` | Sound | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"stage":"image","u":30,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
