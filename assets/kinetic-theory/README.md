# Kinetic theory of matter (পদার্থের আণবিক গতিতত্ত্ব)

**Where it goes in the book:** Book page 153, topic 5.6.1.

Animation for the Pathshala book: plays by itself; students can pause it or tap a part to jump there. Built on
`shared/lib/timeline.js`, so every moment can be shown exactly (`seek`) and exported to video frame by frame.

## Embed

```html
<iframe src="kinetic-theory/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
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
| `seek` | `{"t":4.5}` |
| `duration` | `{}` |
| `play` | `{}` |
| `pause` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `step`, `play`, `pause`.
<!-- /generated:bridge -->
