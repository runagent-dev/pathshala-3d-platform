# Lens and its types (লেন্স ও লেন্সের প্রকারভেদ)

**Where it goes in the book:** Book page 255, topic 9.3.4 লেন্স and 9.4 লেন্সের প্রকারভেদ, চিত্র ৯.১৪–৯.১৭ (pp. 255–257).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="lens-types/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './lens-types/shared/lib/host.js';
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
| `stage` | What is shown | `intro` two lenses on the bench · `kinds` their sections: thick and thin in the middle · `converge` parallel light meets after the convex lens · `diverge` parallel light spreads after the concave lens · `sphere` the convex lens's faces as parts of two spheres · `sphere2` the concave lens's faces as parts of two spheres · `plano` one face flat · `slab` a ray moved aside by a thick slab · `centre` the ray through a convex lens's centre, thick then thin · `centre2` the ray through a concave lens's centre, thick then thin | `intro` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered ring on the part | `1` · `0` | `1` |
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
| `set` | `{"stage":"centre","animate":false,"thick":1}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
