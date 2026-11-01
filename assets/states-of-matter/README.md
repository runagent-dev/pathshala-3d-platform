# Three states of matter (পদার্থের তিন অবস্থা)

**Where it goes in the book:** page 150, topic 5.6, পদার্থের তিন অবস্থা: কঠিন, তরল এবং গ্যাস, in place of চিত্র ৫.১৩
(page 151) or right after it.

A self-playing 3D animation (72 seconds, loops). Students can pause it or tap a part to jump there (keyboard: ← →,
space):

1. **অণু**: one water molecule, much enlarged; split, it is one oxygen and two hydrogen atoms, "আর পানি নয়".
2. **কঠিন**: an ice cube in a steel pan on a gas stove; a magnifier shows its molecules in a regular pattern, each
   only vibrating in its place. নিয়মিত আকার আছে ✓, নির্দিষ্ট আয়তন আছে ✓.
3. **তরল**: the flame melts the ice; in the lens the pattern breaks up and the molecules, still close, slide past one
   another. নিয়মিত আকার নেই ✗, নির্দিষ্ট আয়তন আছে ✓.
4. **গ্যাস**: the water boils and steam rises; the lens shows a few molecules far apart, flying and bouncing freely.
   নিয়মিত আকার নেই ✗, নির্দিষ্ট আয়তন নেই ✗.
5. **তিন অবস্থা**: the three lenses side by side as in চিত্র ৫.১৩, joined by curved arrows: "তাপ দিলে" (orange) from
   ice to water to vapour, "ঠান্ডা করলে" (blue) back; each lights up in turn.

The shape and volume row always pairs an icon with words. Built on `shared/lib/timeline.js`: the liquid and gas
molecules are simulated once with a fixed seed, so every moment can be shown exactly (`seek`) and exported to video
frame by frame. Bangla first (Noto Sans Bengali, bundled), English with `lang=en`; works offline; laid out for phones
in portrait and sideways, the book column and full screen.

## Embed

```html
<iframe src="states-of-matter/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

## URL parameters

<!-- generated:params (npm run docs) -->
| Param | Meaning | Values | Default |
|---|---|---|---|
| `lang` | Language | `bn` বাংলা · `en` English | `bn` |
| `autoplay` | Play on load | `1` · `0` | `1` |
| `loop` | Loop | `1` · `0` | `1` |
| `numerals` | Digits | (empty) follow language · `bn` Bangla · `latin` Latin |  |
| `bg` | Background | `light` · `transparent` | `light` |
<!-- /generated:params -->

## Commands and events

<!-- generated:bridge (npm run docs) -->
Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).

| Command | Example payload |
|---|---|
| `get` | `{}` |
| `set` | `{"step":2}` |
| `seek` | `{"t":34}` |
| `duration` | `{}` |
| `play` | `{}` |
| `pause` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `step`, `play`, `pause`.
<!-- /generated:bridge -->
