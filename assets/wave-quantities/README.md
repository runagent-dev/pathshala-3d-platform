# Wave quantities (তরঙ্গ-সংশ্লিষ্ট রাশি)

**Where it goes in the book:** Book page 195–197, section 7.2.3 তরঙ্গ-সংশ্লিষ্ট রাশি: next to v = fλ and the উদাহরণ of চিত্র ৭.০৮ (a = 0.1 m, λ = 1 m, T = 0.2 s, f = 5 Hz, v = 5 m/s).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="wave-quantities/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './wave-quantities/shared/lib/host.js';
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
| `example` | Example | `f5` 5 Hz (the book's) · `f10` 10 Hz · `f2` 2.5 Hz · `heavy` heavy rope, 5 Hz | `f5` |
| `at` | Wave time (s) (for pictures) | number | `0` |
| `play` | Running | `1` · `0` | `0` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the driver pulses | `1` · `0` | `1` |
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
| `set` | `{"run":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
