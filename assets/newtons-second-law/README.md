# Newton's second law of motion (নিউটনের দ্বিতীয় গতি সূত্র)

**Where it goes in the book:** Book pages 75–76, topic 3.6: বস্তুর গতির উপর বলের প্রভাব: নিউটনের দ্বিতীয় গতি সূত্র. Next to the football and cricket-ball examples, the law in its box and the steps to F = ma.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="newtons-second-law/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './newtons-second-law/shared/lib/host.js';
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
| `example` | Example | `base` empty cart · `force` double force · `mass` double mass · `back` force backward | `base` |
| `at` | A moment of the run (e.g. 1.5: the run held 1.5 s after the push began, for pictures (empty: at rest)) | number |  |
| `tried` | Examples already tried (their accelerations show under the words) | text |  |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the cart pulses | `1` · `0` | `1` |
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
| `set` | `{"example":"force"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `push`, `result`, `example`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
