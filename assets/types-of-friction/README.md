# Types of friction (ঘর্ষণের প্রকারভেদ)

**Where it goes in the book:** Book pages 89–90, topic 3.9.1: ঘর্ষণের প্রকারভেদ (Types of Friction): স্থিতি, গতি ও আবর্ত ঘর্ষণ. Next to the three definitions with fₛ = μₛN and fₖ = μₖN, and the rolling-friction paragraph (suitcase wheels).

A vivid live 3D comparison of static, kinetic and rolling friction. A detailed person pushes the same illustrative
2 kg hollow crate directly on the floor, then pushes its loaded four-wheel trolley by the handle. The palms stay
at the contact, walking shoes stay planted during stance, and wheel rotation follows distance over wheel radius.
The force meter is replaced by labelled arrows and a live force/motion readout.

The original numerical story remains: static friction matches the 3, 6 and 9 N pushes; after breakaway, sliding
friction is 7.84 N; steady rolling needs 0.98 N. Orange is applied force, red is friction and blue is velocity.
A small leader locates the human's contact while the applied vector sits above the crate for readability. The two
force arrows share one scale within each view; both are explicitly enlarged 3× on the trolley. Values remain in
newtons, and the three comparison results remain on the example row.

Pause a moment to inspect it. The separate force and formula pages show the two horizontal forces, balanced
weight/support, the static inequality and maximum, and the kinetic formula. The trolley's own mass is neglected
so the example keeps the same load for comparison; the reference page gives no numbers. Five scene-based tap
questions remain, reading the push arrow in place of a force gauge.

Bridge addition: `set({stage:'roll', paused:true})` holds a rolling scene; `set({paused:false})` resumes. Snapshots
include `paused`, `netForce` and `acceleration`. Export returns the current human, crate, visible trolley and force
vectors in metres. The default GLB export is set up as the loaded rolling trolley.

## Embed

```html
<iframe src="types-of-friction/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './types-of-friction/shared/lib/host.js';
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
| `stage` | Start at (start already part way through the story, for pictures) | `rest` block at rest · `pull` held by a push (no motion) · `slide` sliding at a steady pace · `slid` stopped after the slide · `wheels` on the trolley, at rest · `roll` rolling at a steady pace · `rolled` stopped after the roll | `rest` |
| `pull` | Push for 'held by a push' (below the maximum 9.8 N (default 6)) | number |  |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the block pulses | `1` · `0` | `1` |
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
| `set` | `{"tap":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `break`, `stop`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
