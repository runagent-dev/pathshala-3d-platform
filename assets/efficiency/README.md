# Efficiency (কর্মদক্ষতা)

**Where it goes in the book:** Section 4.8 কর্মদক্ষতা (Efficiency), beside the two forms of the formula and the উদাহরণ of the 1000 W motor that lifts 100 kg up 10 m in 15 s.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="efficiency/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './efficiency/shared/lib/host.js';
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
| `cond` | Motor | `book` the book's (15 s) · `oiled` oiled gears (14 s) · `worn` worn gears (20 s) | `book` |
| `phase` | Start at (start part way, for pictures) | `idle` switched off · `run` running · `done` load lifted | `idle` |
| `at` | Seconds into the run (for 'running') (default: half way) | number |  |
| `hold` | Keep a part-way start still (for pictures: the motor waits until the student acts) | `1` · `0` | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the switch pulses | `1` · `0` | `1` |
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

Events: `ready`, `change`, `action`, `phase`, `cond`, `term`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
