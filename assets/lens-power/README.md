# Power of a lens (লেন্সের ক্ষমতা)

**Where it goes in the book:** Book page 264–266, topic 9.4.3 লেন্সের ক্ষমতা (P = 1/f, ডায়াপটার), চিত্র ৯.২৭–৯.২৮ and the closing নিজে করো.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="lens-power/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './lens-power/shared/lib/host.js';
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
| `scene` | What is shown | `intro` the bench, the lens, the ray box · `focus` the light meets at F′ (f = 40 cm) · `pencil` a pencil seen through it · `compare` a more curved lens: bigger · `power` P = 1/f: the book's glasses, +2.5 · `power20` f = 20 cm: +5 · `power10` f = 10 cm: +10 · `concave` a concave lens: −2.5 · `concave20` a more curved concave lens: −5 | `intro` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered ring pulses at first | `1` · `0` | `1` |
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
| `set` | `{"scene":"power","animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
