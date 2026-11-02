# Relation between mass and energy: the power plant (ভর ও শক্তির সম্পর্ক: শক্তিকেন্দ্র)

**Where it goes in the book:** Book page 119, topic 4.6: ৪.৬ ভর ও শক্তির সম্পর্ক (Relation between mass and energy), next to the paragraph on the নিউক্লিয়ার শক্তিকেন্দ্র (heat, steam, turbine, generator; continued on page 120).

Interactive 3D figure for the Pathshala book: a cut-open nuclear power plant at dusk, where the student picks the fuel's mass (1 g … 1 kg of uranium-235), switches the plant on and sees the energy E = mc² in joules and as years of a 100 W bulb. The scene is in metres, roughly to scale with itself.

## Embed

```html
<iframe src="mass-energy-plant/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './mass-energy-plant/shared/lib/host.js';
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
| `m` | Fuel mass (power plant) | `1` 1 g · `10` 10 g · `100` 100 g · `1000` 1 kg | `1` |
| `part` | Mass that becomes energy | `fission` split (0.079%) · `full` all of it | `fission` |
| `run` | Power plant running | `1` · `0` | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the reactor pulses at first | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `bg` | Background | `light` scenery · `transparent` transparent | `light` |
| `shadow` | Soft shadow | `1` · `0` | `1` |
| `sound` | Sound | `1` · `0` | `1` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"m":10,"part":"fission"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
