# Energy (শক্তি)

**Where it goes in the book:** Section 4.2 শক্তি (Energy), beside the definition: শক্তি হচ্ছে কাজ করার সামর্থ্য

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="energy/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './energy/shared/lib/host.js';
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
| `phase` | Start at (start part way through the ride, for pictures) | `start` at rest below the hill · `climb` pedalling up · `top` at rest on the top · `roll` rolling down · `flat` rolling on the flat road · `brake` braking · `stopped` stopped after braking | `start` |
| `height` | Height for 'pedalling up' / 'rolling down' (0 to 5 m (default 2.5)) | number |  |
| `hold` | Keep a part-way start still (for pictures: the bicycle waits until the student acts) | `1` · `0` | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the bicycle pulses | `1` · `0` | `1` |
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

Events: `ready`, `change`, `action`, `phase`, `part`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
