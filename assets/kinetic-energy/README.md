# Kinetic energy (গতিশক্তি)

**Where it goes in the book:** Book page 104, topic 4.3.1: ৪.৩.১ গতিশক্তি (Kinetic Energy). Next to the derivation W = Fs = … = ½mv² and the boxed formula T = ½mv², with the sentence on v being squared and the result ½mv² = ½mu² + W.

Interactive 3D figure for the Pathshala book: an archer draws a bow, the arrow flies into a straw bale, and the panel works the book's T = ½mv² out with the student's mass and speed (twice the speed, four times the kinetic energy).

## Embed

```html
<iframe src="kinetic-energy/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './kinetic-energy/shared/lib/host.js';
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
| `m` | Arrow mass | `0.02` 0.02 kg · `0.03` 0.03 kg · `0.04` 0.04 kg | `0.02` |
| `v` | Arrow speed (the bow gives a 0.03 or 0.04 kg arrow at most 50 m/s) | `20` 20 m/s · `30` 30 m/s · `40` 40 m/s · `50` 50 m/s · `60` 60 m/s | `30` |
| `stage` | Start at (for pictures) | `ready` bow at rest · `drawn` string held drawn · `flying` arrow in the air · `hit` arrow in the bale · `compare` two arrows: half and full speed | `ready` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the string pulses at first | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `bg` | Background | `light` sky · `transparent` transparent | `light` |
| `shadow` | Soft shadow | `1` · `0` | `1` |
| `sound` | Sound | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"m":0.02,"v":60,"shoot":true,"animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
