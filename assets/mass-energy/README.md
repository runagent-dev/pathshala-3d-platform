# Relation between mass and energy (ভর ও শক্তির সম্পর্ক)

**Where it goes in the book:** Book page 119, topic 4.6: ৪.৬ ভর ও শক্তির সম্পর্ক (Relation between mass and energy). Next to চিত্র ৪.০৬ (নিউক্লিয়ার বিক্রিয়ায় শক্তি উৎপাদন) and the equation ¹₀n + ²³⁵₉₂U → ⁹²₃₆Kr + ¹⁴¹₅₆Ba + 3¹₀n, with the paragraphs on E = mc², the chain reaction and the power plant.

Interactive 3D figure for the Pathshala book: a slow neutron splits a glowing uranium-235 nucleus into ⁹²Kr, ¹⁴¹Ba and three neutrons with a flash of energy, as in the book's চিত্র ৪.০৬; the panel compares the masses of the two sides of the book's equation and works E = mc² out with the mass that went missing. Two more scenes show the chain reaction (1 → 3 → 9) and a cut-open nuclear power plant, where the student picks the fuel's mass and sees the energy in joules and as years of a 100 W bulb.

## Embed

```html
<iframe src="mass-energy/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './mass-energy/shared/lib/host.js';
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
| `scene` | Scene | `one` one nucleus splits · `chain` chain reaction · `plant` power plant | `one` |
| `t` | Time into the split or chain (for pictures: 0 to 7 s (one nucleus), 0 to 12 s (chain)) | number | `0` |
| `m` | Fuel mass (power plant) | `1` 1 g · `10` 10 g · `100` 100 g · `1000` 1 kg | `1` |
| `part` | Mass that becomes energy | `fission` split (0.079%) · `full` all of it | `fission` |
| `run` | Power plant running | `1` · `0` | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the neutron pulses at first | `1` · `0` | `1` |
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
| `set` | `{"scene":"one","t":6.6}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
