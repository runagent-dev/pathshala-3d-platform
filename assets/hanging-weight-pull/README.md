# Hanging weight pulls a block (ঝুলন্ত ভর ও টেবিলের বস্তু)

**Where it goes in the book:** Book pages 81–82, topic 3.7 (উদাহরণ): a hanging mass M pulling a block m across a table through a string over a pulley (চিত্র ৩.০৯ style), and the two-weights example. Next to the page's T = ma, T − Mg = M(−a) and a = Mg/(M+m).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="hanging-weight-pull/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './hanging-weight-pull/shared/lib/host.js';
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
| `id` | Experiment | `w2` M = 2 kg · `w5` M = 5 kg · `heavy` m = 10 kg · `two` two weights | `w2` |
| `at` | Freeze part-way (e.g. 0.6: the run is frozen 60% of the way, arrows showing (empty: the block is held at the start)) | number |  |
| `tried` | Experiments already run (their accelerations show under their words) | text |  |
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
| `set` | `{"id":"w5"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `release`, `stop`, `experiment`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
