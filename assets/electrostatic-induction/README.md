# Electrical induction (বৈদ্যুতিক আবেশ)

**Where it goes in the book:** Book page 275, topic 10.3 বৈদ্যুতিক আবেশ, চিত্র ১০.০৪–১০.০৬ (pp. 275–278).

Interactive 3D figure for the Pathshala book.

The GLB holds the two spheres on their stands, the glass rod, the comb and the paper. It has no charge signs: the "+" and "−" exist only in the live figure.

## Embed

```html
<iframe src="electrostatic-induction/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './electrostatic-induction/shared/lib/host.js';
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
| `step` | Start at | `intro` the sphere and the rod · `near` one sphere (চিত্র ১০.০৪) · `pair` two spheres touching (চিত্র ১০.০৬, left) · `apart` the spheres apart (চিত্র ১০.০৬, right) · `comb` the comb and the paper (চিত্র ১০.০৫) | `intro` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered ring and the words on the handle | `1` · `0` | `1` |
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
| `set` | `{"step":"near","gap":3,"view":"front","animate":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
