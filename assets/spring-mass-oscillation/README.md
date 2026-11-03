# Mass on a spring: simple harmonic motion (সরল স্পন্দন গতি)

**Where it goes in the book:** Book pages 188–190, topic 7.1 সরল স্পন্দন গতি: next to চিত্র ৭.০১ (a block on a spring, positions 0–9) on page 189.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="spring-mass-oscillation/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './spring-mass-oscillation/shared/lib/host.js';
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
| `m` | Mass m | `0.25` 0.25 kg · `0.5` 0.5 kg · `1` 1 kg | `0.5` |
| `k` | Spring constant k | `100` 100 N/m · `200` 200 N/m · `400` 400 N/m | `100` |
| `graph` | Graph | `x` displacement · `v` velocity · `acc` acceleration | `x` |
| `start` | Start (for pictures) | `rest` at rest · `run` oscillating | `rest` |
| `a` | Amplitude (for 'oscillating') (default 5 cm) | number |  |
| `at` | Seconds after the release (for 'oscillating') | number |  |
| `hold` | Frozen at that moment | `1` · `0` | `0` |
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
| `set` | `{"pull":0.05}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
