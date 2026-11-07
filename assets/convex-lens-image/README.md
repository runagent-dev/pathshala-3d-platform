# Images in a convex lens (উত্তল লেন্সে প্রতিবিম্ব)

**Where it goes in the book:** Book page 259, topic 9.4.2 উত্তল লেন্স: the ray rules and চিত্র ৯.২১–৯.২৬, the cases of the object's position, the উদাহরণ and the নিজে করো (pp. 259–264).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="convex-lens-image/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './convex-lens-image/shared/lib/host.js';
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
| `stage` | What is shown | `start` the pencil, the lens, the image · `parallel` parallel rays to F′ (চিত্র ৯.২১) · `point` a point of light at F (চিত্র ৯.২২) · `ray1` the parallel ray · `ray2` the ray through O · `ray3` the ray through F · `screen` the screen · `cases` the book's cases · `swap` the উদাহরণ: object and image swap · `graph` the graph of v against u · `table` the summary table | `start` |
| `u` | Pencil's distance from the lens (cm) | number | `30` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered ring and the words on the handles | `1` · `0` | `1` |
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
| `set` | `{"stage":"cases","u":22.5,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
