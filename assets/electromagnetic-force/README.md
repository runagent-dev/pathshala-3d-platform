# Electromagnetic force (তড়িৎ চৌম্বক বল)

**Where it goes in the book:** Book page 68, topic 3.2.2: তড়িৎ চৌম্বক বল বা বিদ্যুৎ চৌম্বকীয় বল (Electromagnetic Force), next to that paragraph.

Interactive 3D figure for the Pathshala book, on the kit's clean panel (one action, one result, one rule). Two
examples in a row of words: **চিরুনি** (a complete human head with a clear face, ears, neck and shoulders; a hand
holding a coral-red comb; and bright paper pieces on a blue table, against a blue/teal background; the action in two numbered steps: comb the hair, the charge builds on the comb; bring
it to the paper, the bits jump up and cling because its pull beats the whole Earth's, with the two force arrows) and
**চুম্বক** (a cell, a switch and a coil in a row: switch on and the coil becomes a magnet that pulls a bar magnet on a
cart; turn the magnet round and like poles push it away). A quiet strip names the four fundamental forces in order,
this one marked. Then a five-question test. Positive hair and negative comb markers illustrate electron transfer;
a paired positive/negative marker on one paper bit shows polarization while the paper stays neutral.

`set` takes `scene` (`comb` | `magnet`), `charge` (0–5), `strokes` (comb this many times), `place` (`hair` |
`paper`; over the paper without `height` the comb ends holding the lifted bits up) with `height` (mm above the
table), `again`, `on` (the switch), `facing` (`N` | `S`), `gap` (mm, 0–60), `view`, and `animate: false` to jump.
`get` returns `{ scene, view, mode, comb: { charge, place, height, reach, lifted, pull, wins }, magnet: { on, facing,
gap, force, moving }, next: { action, step, busy } }` (`next`: what the big button does now).

## Embed

```html
<iframe src="electromagnetic-force/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './electromagnetic-force/shared/lib/host.js';
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
| `scene` | Example | `comb` comb and paper · `magnet` coil and magnet | `comb` |
| `charge` | Charge on the comb at the start (strokes) | number | `0` |
| `place` | Comb at the start | `hair` in the hair · `paper` over the paper | `hair` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | First-use pointers | `1` · `0` | `1` |
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
| `set` | `{"scene":"comb"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `scene`, `charge`, `lift`, `switch`, `flip`, `snap`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
