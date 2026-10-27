# Frictional force (ঘর্ষণ বল)

**Where it goes in the book:** Book pages 88–89, topic 3.9: ঘর্ষণ বল (Frictional Force). Next to চিত্র ৩.১৫ (a block pushed on a table: F and the friction f) and চিত্র ৩.১৬ (the microscopic roughness of two touching surfaces).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="friction-force/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './friction-force/shared/lib/host.js';
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
| `load` | Weights on the block (1 kg each) | number | `0` |
| `side` | Push from | `left` left (pushes right) · `right` right (pushes left) | `left` |
| `at` | Start already pushing (e.g. 2.6: the push has been growing for 2.6 s) | number |  |
| `rub` | Start already rubbing (e.g. 3: the block has been rubbed to and fro for 3 s, the surfaces are warm) | number |  |
| `hold` | Hold a push of (e.g. 9: the rod pushes with 9 N and the block stays still (friction is 9 N too), for pictures) | number |  |
| `lens` | Zoom-in open | `1` · `0` | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the block pulses | `1` · `0` | `1` |
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
| `set` | `{"push":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `push`, `slip`, `side`, `load`, `lens`, `rub`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
