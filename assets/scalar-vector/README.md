# Scalar and vector quantities (স্কেলার ও ভেক্টর রাশি)

**Where it goes in the book:** Book page 38, topic 2.3: স্কেলার ও ভেক্টর রাশি. Next to চিত্র ২.০৩ (vectors A, B, C, D), or in place of it.

Interactive 3D figure for the Pathshala book: the arrows A, B, C, D of চিত্র ২.০৩ as pieces on graph paper. The
student moves an arrow (the vector stays the same), turns or stretches it by its head (দিক, মান), and lines two up
tail to tail to see whether they are the same vector; then a five-question test. `?compare=A,B` (or `A,C`, `C,D`)
opens it with one of the caption's pairs already lined up.

## Embed

```html
<iframe src="scalar-vector/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './scalar-vector/shared/lib/host.js';
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
| `compare` | Start with a pair lined up | (empty) none · `A,B` A and B · `A,C` A and C · `C,D` C and D |  |
| `select` | Chosen arrow | `A` · `B` · `C` · `D` | `A` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | First-use pointers | `1` · `0` | `1` |
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
| `set` | `{"compare":["A","B"]}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `select`, `compare`, `dragstart`, `dragend`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
