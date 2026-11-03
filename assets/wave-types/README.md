# Transverse and longitudinal waves (অনুপ্রস্থ ও অনুদৈর্ঘ্য তরঙ্গ)

**Where it goes in the book:** Book pages 194–195, topic 7.2.2 (তরঙ্গের প্রকারভেদ): beside the paragraph that sets the wave on a spring (সংকোচন এবং প্রসারণ, অনুদৈর্ঘ্য তরঙ্গ) against the rope shaken at one end (ওঠা এবং নামা লম্ব, অনুপ্রস্থ তরঙ্গ), just above চিত্র ৭.০৫ (the paper model of a longitudinal wave).

Interactive 3D figure for the Pathshala book: a wave driver sends one travelling wave along a rope (অনুপ্রস্থ তরঙ্গ: the green particle goes up and down, at right angles to the wave) or a steel spring (অনুদৈর্ঘ্য তরঙ্গ: it goes back and forth along the wave, with সংকোচন and প্রসারণ). In both, the particle only vibrates in place while the wave moves on.

## Embed

```html
<iframe src="wave-types/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './wave-types/shared/lib/host.js';
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
| `medium` | Medium | `rope` rope (transverse) · `spring` spring (longitudinal) | `rope` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered badge on the driver pulses at first | `1` · `0` | `1` |
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
| `set` | `{"medium":"spring"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
