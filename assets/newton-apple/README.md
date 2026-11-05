# The falling apple (মহাকর্ষ: আপেল কেন পড়ে)

**Where it goes in the book:** Book page 79, topic 3.7 মহাকর্ষ বল: next to the text on the Earth's pull F = GmM/R² = mg and g = GM/R².

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="newton-apple/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './newton-apple/shared/lib/host.js';
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
| `m` | Apple's mass (g) | number | `200` |
| `h` | Height (m) | number | `2` |
| `t` | Frozen moment of the fall (s) (start frozen this many seconds into the fall, for pictures) | number |  |
| `steps` | Falls already done (1 starts after one fall, with the trail) | number | `0` |
| `sym` | Symbol tapped | (empty) none · `F` · `G` · `m` · `M` · `R` · `g` |  |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered ring pulses | `1` · `0` | `1` |
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
| `set` | `{"m":300,"h":4,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `drop`, `land`, `symbol`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
