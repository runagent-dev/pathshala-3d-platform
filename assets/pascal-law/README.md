# Pascal's law (প্যাসকেলের সূত্র)

**Where it goes in the book:** Book page 141, topic 5.3.3 (প্যাসকেলের সূত্র, starting on p140): next to the box with the law ('একটা আবদ্ধ পাত্রে তরল বা বায়বীয় পদার্থে বাইরে থেকে চাপ দেওয়া হলে …'), the paragraph 'প্যাসকেলের সূত্রের ব্যবহার' with P = F₁/A₁ and F₂ = PA₂ = F₁(A₂/A₁), and চিত্র ৫.০৫ (two cylinders joined by a pipe: F₁ on the small piston, F₂ on the big one).

Interactive 3D figure for the Pathshala book. Pascal's law (page 141, topic 5.3.3) as a hydraulic car lift in a colourful workshop (a deep teal wall with an orange band, a pegboard of tools, a red tool chest, tyres, a blue oil drum, a blue-grey epoxy floor with yellow safety lines). The lift is cut open along its middle so the golden oil shows: a small pump cylinder (A₁ = 0.01 m²) with a chrome T-handle, a pipe along the floor, and a wide lift cylinder whose ram carries a platform with a yellow car (weight W = 8,000 N). The student picks the lift cylinder in the row of words (A₂ = 10, 50 or 100 × A₁, the book's example being 100) and the push on the handle F₁ with a stepper (50 to 300 N); the formula P = F₁/A₁ = F₂/A₂ and the sums P = F₁/A₁, F₂ = F₁(A₂/A₁) and F₂ against W update live, each symbol a button that makes its arrow or area pulse. One tap pushes the handle down 10 cm: bold outlined arrows show F₁ down on the handle, F₂ up on the ram and W down on the car; equal red arrows (in a white outline) square to every wall, the pipe and both pistons show the same pressure everywhere; teal bars mark A₁ and A₂. If F₂ is more than W the car rises d₂ = d₁(A₁/A₂) (1 mm for 100 ×), else the handle does not move. The first time, the camera goes close to the oil (all the red arrows equal) and then to a millimetre scale on the lift cylinder where the tiny rise shows, then back. The next taps push the handle 100 times (sped up, said in the result line): the car rises a little each time, up to 25 cm, then the action lowers it. The rule grows in the book's words: the law in its box; pressure equal so F₂ = F₁(A₂/A₁); বলবৃদ্ধিকরণ নীতি, শক্তি নয় with F₁d₁ = F₂d₂ in joules; কলকারখানা কিংবা বিমান নিয়ন্ত্রণে. Test tab: 5 questions (F₂ from F₁ and the pistons on the picture; how far the car rises for a push; the pressure under the big piston; the direction of the oil's pressure on the walls; the energy out), every wrong choice a real mistake with its own note. Phone-first, Bangla and English.

## Embed

```html
<iframe src="pascal-law/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './pascal-law/shared/lib/host.js';
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
| `F1` | Push on the handle (50 to 300 N in steps of 50) | number | `100` |
| `ratio` | A₂/A₁ | `10` 10 × · `50` 50 × · `100` 100 × | `100` |
| `phase` | Start | `ready` handle up · `pushed` pushed once | `ready` |
| `look` | Camera | `all` the whole lift · `inside` the oil close up · `rim` the scale on the lift cylinder | `all` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring round the handle pulses | `1` · `0` | `1` |
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
| `set` | `{"phase":"pushed"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `push`, `pump`, `look`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
