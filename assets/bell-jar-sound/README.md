# Sound needs a medium (শব্দ সঞ্চালনে মাধ্যম)

**Where it goes in the book:** Book page 199, topic 7.3: চিত্র ৭.১১, the bell-jar experiment (বেলজার থেকে বাতাস পাম্প করে সরিয়ে নিলে কলিং বেলে শব্দটি আর শোনা যাবে না), beside the paragraph 'মাধ্যম ছাড়া যে শব্দ যেতে পারে না…'

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="bell-jar-sound/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './bell-jar-sound/shared/lib/host.js';
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
| `air` | Air in the jar at the start | `full` full · `half` half · `vacuum` none (vacuum) | `full` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered badge on the picture pulses at first | `1` · `0` | `1` |
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
| `set` | `{"pump":"out"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
