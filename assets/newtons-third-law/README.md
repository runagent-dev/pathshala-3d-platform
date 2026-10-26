# Newton's third law of motion (নিউটনের তৃতীয় গতি সূত্র)

**Where it goes in the book:** Book pages 84–86, topic 3.8: নিউটনের তৃতীয় গতি সূত্র (Newton's Third Law of Motion). Next to the boxed law, the action–reaction paragraph and চিত্র ৩.১২ (an apple and the Earth pulling each other).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="newtons-third-law/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './newtons-third-law/shared/lib/host.js';
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
| `example` | Pair | `equal` equal masses · `unequal` light and heavy · `apple` apple and Earth | `equal` |
| `at` | Start already moving (e.g. 0.9: the skaters are 0.9 s into the push (the apple's clock runs 2 times slower); empty: standing ready) | number |  |
| `tried` | Pairs already tried (their small results show under the words) | text |  |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring pulses | `1` · `0` | `1` |
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
| `set` | `{"example":"unequal"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `push`, `release`, `done`, `example`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
