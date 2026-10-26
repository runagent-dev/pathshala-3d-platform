# Safe journey: velocity and force (নিরাপদ ভ্রমণ: বেগ ও বল)

**Where it goes in the book:** Book pages 74–75, topic 3.5.2: নিরাপদ ভ্রমণ: বেগ ও বল (Safe journey: Velocity and Force). Next to the head-on truck and small-car example and its v₁, v₂ sums.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="safe-journey/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './safe-journey/shared/lib/host.js';
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
| `speed` | Speed | `20` 20 km/h · `40` 40 km/h · `60` 60 km/h | `20` |
| `at` | Start the crash at (e.g. 2.5: the crash already 2.5 s on (screen time); 99 shows the end. Empty: both wait at the start) | number |  |
| `tried` | Speeds already tried (their cubes show under the words and the rule compares them) | text |  |
| `masses` | Masses | `book` as the book: m₂ ≈ 0 · `real` real: 20,000 kg truck, 1,000 kg car | `book` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the car pulses | `1` · `0` | `1` |
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
| `set` | `{"speed":40}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `play`, `crash`, `end`, `speed`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
