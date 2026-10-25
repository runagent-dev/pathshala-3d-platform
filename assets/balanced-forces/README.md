# Balanced and unbalanced forces (বলের সাম্যাবস্থা ও অসাম্যাবস্থা)

**Where it goes in the book:** Book pages 69–70, topic 3.3: বলের সাম্যাবস্থা ও অসাম্যাবস্থা (Balanced and Unbalanced Forces). Next to চিত্র ৩.০২ (a ball hanging on a string; the same pendulum pulled aside) and চিত্র ৩.০৩ (a heavy book hung from a rope pulled at both ends).

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="balanced-forces/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './balanced-forces/shared/lib/host.js';
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
| `scene` | Example | `pendulum` body on a string (চিত্র ৩.০২) · `book` book on a rope (চিত্র ৩.০৩) | `pendulum` |
| `hold` | Ball held aside | number | `0` |
| `alpha` | Rope angle | number | `30` |
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
| `set` | `{"hold":30}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `scene`, `view`, `release`, `cut`, `landed`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
