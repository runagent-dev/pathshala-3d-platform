# Digital balance (ডিজিটাল ব্যালান্স)

**Where it goes in the book:** Book page 23, topic 1.6.2: ব্যালান্স (ভর মাপার যন্ত্র). Next to Figure 1.09 (চিত্র ১.০৯, digital balance), or in place of that photo.

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="digital-balance/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './digital-balance/shared/lib/host.js';
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
| `things` | On the pan at the start (egg, mango, coin, weight, bowl) | text |  |
| `unit` | Unit | `g` grams · `kg` kilograms | `g` |
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
| `set` | `{"things":["egg"]}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `thing`, `tare`, `unit`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
