# Newton's first law of motion (নিউটনের প্রথম গতি সূত্র)

**Where it goes in the book:** Book page 64, topic 3.1: জড়তা এবং বলের ধারণা: নিউটনের প্রথম গতি সূত্র. Next to the boxed law and the paragraph after it.

A red laboratory slider with a yellow carrying handle demonstrates rest, uniform motion and friction on four surfaces. A vivid plum background keeps the slider and force arrows distinct.

## Embed

```html
<iframe src="newtons-first-law/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './newtons-first-law/shared/lib/host.js';
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
| `surface` | Floor | `mat` jute mat · `wood` wooden floor · `ice` ice · `none` no friction | `mat` |
| `at` | Start already pushed (e.g. 0.5: the book is half a second past the launcher (empty: at rest on the launcher)) | number |  |
| `tried` | Floors already tried (their stop posts and distances show) | text |  |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the book pulses | `1` · `0` | `1` |
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
| `set` | `{"surface":"wood"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `push`, `stop`, `surface`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
