# Conservation of momentum and energy (ভরবেগ এবং শক্তির সংরক্ষণশীলতা)

**Where it goes in the book:** Book pages 72–73, topic 3.5.1 (in 3.5 সংঘর্ষ, Collision): ভরবেগ এবং শক্তির সংরক্ষণশীলতা. Next to চিত্র ৩.০৪ (two balls m₁ and m₂ before, during and after a collision) and the equations m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂ and ½m₁u₁² + ½m₂u₂² = ½m₁v₁² + ½m₂v₂².

Interactive 3D figure for the Pathshala book.

## Embed

```html
<iframe src="conservation-of-momentum/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './conservation-of-momentum/shared/lib/host.js';
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
| `preset` | Example | `heavy` heavy behind (3 kg, 1 kg) · `equal` equal masses · `light` light behind (1 kg, 3 kg) · `headon` head-on | `heavy` |
| `u1` | u₁ (m/s) (whole numbers −3…3, more than u₂) | number |  |
| `u2` | u₂ (m/s) (whole numbers −3…3, less than u₁) | number |  |
| `at` | Moment of the run (touch, contact, after, end, or seconds of the run on screen) | text |  |
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
| `set` | `{"preset":"light"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `setup`, `play`, `pause`, `collide`, `end`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
