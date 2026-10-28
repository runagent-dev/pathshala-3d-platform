# Simple harmonic motion (সরল স্পন্দন গতি)

**Where it goes in the book:** Book page 37, topic 2.2: সরল স্পন্দন গতি (Simple Harmonic Motion). Next to চিত্র ২.০২ (দোলনা), or in place of it.

Interactive 3D figure for the Pathshala book. A girl on a swing (or a mass on a spring) oscillates about the
equilibrium point (সাম্যবিন্দু): an arrow shows the speed, zero at the ends (প্রান্ত) and greatest at the equilibrium
point, dots on the path mark where it is every T/16, and the panel shows the speed over one period (পর্যায়কাল). The
student pulls the seat, a rope or the mass to one side and lets go, or taps one of five graph moments to pause
and inspect the matching position. Pink endpoints and a gold equilibrium marker connect the scene and graph; a
short sentence explains how speed changes. The spring also has signed position/velocity/acceleration graphs and an energy view (kinetic/potential shares
and time curves, with total energy conserved). Potential energy includes gravity and is zero at equilibrium.
A 5-question test checks understanding. Units: metres (the GLB too).

`get` returns `{ example, amplitude (m along the path; for the swing, the seat's arc), angle (degrees, swing), side,
time (s since let go), phase (0…1), x (m from the equilibrium point), speed, maxSpeed (m/s, of the seat or the mass), period (s), place ('end' | 'between' | 'middle'),
going ('in' | 'out'), playing, slow, dragging, view, mode }`; `set` takes `example`, `angle` or `amplitude` + `side`,
`phase` or `time`, `playing`, `slow`, `view`, `animate`.

## Embed

```html
<iframe src="simple-harmonic-motion/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './simple-harmonic-motion/shared/lib/host.js';
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
| `example` | Example | `swing` swing (দোলনা) · `spring` spring (স্প্রিং) | `swing` |
| `slow` | Time 4x slower | `1` · `0` | `0` |
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
| `set` | `{"angle":24,"phase":0.18,"playing":false}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `example`, `dragstart`, `dragend`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
