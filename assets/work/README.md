# Work (কাজ)

**Where it goes in the book:** Book page 100, topic 4.1: কাজ (Work). Next to the definition W = Fs, the unit box (J, জুল) and the push-then-let-go example (work only over s, none over d).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="work/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './work/shared/lib/host.js';
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
| `example` | Example | `push` push, let go, slide · `wall` push against a wall | `push` |
| `F` | Force F (10–100 N in steps of 10) | number | `50` |
| `s` | Push distance s (1–4 m; the crate then slides s/2 more) | number | `2` |
| `at` | Held at (seconds into the push, held still (pictures); empty: before the push) | number |  |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the crate pulses | `1` · `0` | `1` |
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
| `set` | `{"push":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `push`, `stop`, `example`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
