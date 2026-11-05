# Images in a concave mirror (অবতল আয়নায় প্রতিবিম্ব)

**Where it goes in the book:** Book page 230, topic 8.6.1 অবতল আয়নায় প্রতিবিম্ব: next to চিত্র ৮.২২–৮.২৫ (pages 230–233) and the table 'অবতল গোলীয় আয়নায় গঠিত প্রতিবিম্বের বৈশিষ্ট্য' (page 232); also 8.7 বিবর্ধন (page 234) and the formula 1/u + 1/v = 1/f (page 233).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="concave-mirror-image/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './concave-mirror-image/shared/lib/host.js';
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
| `stage` | What is shown | `start` the pencil, the mirror, the image · `points` P, F and O · `ray1` the parallel ray · `ray2` the ray through F · `screen` the screen · `cases` the pencil moves · `formula` the formula · `table` the book's table | `start` |
| `u` | Pencil's distance from the mirror (cm) | number | `40` |
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
| `set` | `{"stage":"cases","u":22.5,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
