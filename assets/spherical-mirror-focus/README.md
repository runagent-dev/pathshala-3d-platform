# Spherical mirrors and their focus (গোলীয় আয়না ও ফোকাস)

**Where it goes in the book:** Book page 223, topic 8.4 গোলীয় আয়না (a spherical mirror is part of a hollow sphere), with the focus of a convex mirror (8.5, চিত্র ৮.১৭–৮.১৮, pages 224–225), of a concave mirror (8.6, চিত্র ৮.২১, page 228) and the torch/searchlight use (8.8.3, চিত্র ৮.২৭, page 235).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="spherical-mirror-focus/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './spherical-mirror-focus/shared/lib/host.js';
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
| `stage` | What is shown | `sphere` the hollow sphere · `cut` the piece cut out · `coated` the concave mirror on the bench · `rays` parallel light meets at F · `measure` f and r measured · `wide` a wide bundle · `convex` the convex mirror spreads the light · `virtual` the rays extended to F behind it · `torch` a bulb at F | `sphere` |
| `r` | Radius of the sphere (cm) | `20` 20 · `30` 30 · `40` 40 · `60` 60 | `30` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered ring on the part | `1` · `0` | `1` |
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
| `set` | `{"stage":"measure","r":40,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
