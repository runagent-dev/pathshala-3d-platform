# Density: cork, wood and iron in water, a box of particles (ঘনত্ব)

**Where it goes in the book:** Book page 131, topic 5.2 (ঘনত্ব): next to the opening paragraph ('ঘনত্ব হচ্ছে একক আয়তনে ভরের পরিমাণ', ρ = m/V), the box with the unit kg/m³ or gm/cc and the dimension, and টেবিল ৫.০১ (বিভিন্ন পদার্থের ঘনত্ব) with the paragraph on temperature.

Interactive 3D figure for the Pathshala book. Density (page 131, topic 5.2) on a lab bench with a slate-blue top in front of a warm apricot wall and a teal splash-back. Two ideas, one at a time. First, three balls of the same volume (100 cc) from the book's table 5.01, a golden cork ball, a varnished wooden ball with grain and a polished iron ball, wait on small rings in front of three clear glass tanks of blue water; one tap drops a ball in and it stops where its density says: the cork (25 gm, 0.25 gm/cc) floats high, the wood (45 gm, 0.45 gm/cc) floats about half under, the iron (780 gm, 7.8 gm/cc) sinks to the bottom, and the water rises a little. Water's density from the table, 1.00 gm/cc, decides float or sink. The panel works out the book's ρ = m/V for the chosen ball with mass in maroon and volume in orange, in gm/cc and kg/m³, with Bangla digits. Second, a glass box with orange edges round the same 24 red particles (the same mass, 100 gm): each tap squeezes it to half the volume (400, 200, 100, 50 cc) and the density doubles, with a faint outline of the starting box. The rule grows in the book's words (ঘনত্ব হচ্ছে একক আয়তনে ভরের পরিমাণ; the unit kg/m³ or gm/cc; for the same volume more mass is more density, cork < wood < iron; for the same mass less volume is more density; temperature changes the volume, not the mass). Test tab: 5 questions (ρ = m/V of the box from the labels; which of three same-size balls in water is densest; which of four painted balls sinks, where the heaviest floats; the density after heating doubles the volume; a ball's density in kg/m³), every wrong choice a real mistake with its own note. Phone-first, Bangla and English.

## Embed

```html
<iframe src="density/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './density/shared/lib/host.js';
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
| `show` | Start with | `cork` the cork ball · `wood` the wooden ball · `iron` the iron ball · `box` the box of particles | `cork` |
| `dropped` | All three balls in the water at the start | `1` · `0` | `0` |
| `V` | Volume of the box (50, 100, 200 or 400 cc (the same 100 gm of particles)) | number | `400` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on what to tap pulses | `1` · `0` | `1` |
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
| `set` | `{"drop":"cork"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `choose`, `drop`, `volume`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
