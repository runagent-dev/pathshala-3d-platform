# Scalar and vector quantities (স্কেলার ও ভেক্টর রাশি)

**Where it goes in the book:** Book page 38, topic 2.3: স্কেলার ও ভেক্টর রাশি. Next to চিত্র ২.০৩ (vectors A, B, C, D), or in place of it.

Interactive 3D figure for the Pathshala book: find your friend on a school field. A clue with only a size ("২৫ m
দূরে") lights up a whole ring of places; adding the direction ("উত্তর-পূর্ব দিকে") gives exactly one, with the arrow A:
a position needs মান and দিক (a vector), while a temperature needs only a মান (a scalar). Then the book's চিত্র ২.০৩ in
the same story: three children, sent one by one, walk their own clues, and each arrow slides onto its partner's tail (B
equals A in another place, C differs from A in দিক, D from C in মান). One big numbered button leads the five steps;
then a five-question test. `?stage=2` (0–5) opens it at a step; `stage=2` is the poster.

## Embed

```html
<iframe src="scalar-vector/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './scalar-vector/shared/lib/host.js';
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
| `stage` | Start at step | `0` the start (nothing said yet) · `1` the ring: 25 m away · `2` found: 25 m north-east (B waits) · `3` B sent, compared with A · `4` C sent, compared with A · `5` D sent, compared with C | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The numbered ring pulses | `1` · `0` | `1` |
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
| `set` | `{"act":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `step`, `compare`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
