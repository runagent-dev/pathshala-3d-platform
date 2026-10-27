# Types of friction (ঘর্ষণের প্রকারভেদ)

**Where it goes in the book:** Book pages 89–90, topic 3.9.1: ঘর্ষণের প্রকারভেদ (Types of Friction): স্থিতি, গতি ও আবর্ত ঘর্ষণ. Next to the three definitions with fₛ = μₛN and fₖ = μₖN, and the rolling-friction paragraph (suitcase wheels).

Interactive 3D figure for the Pathshala book.

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
