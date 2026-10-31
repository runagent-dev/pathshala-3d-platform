# Newton's second law of motion (নিউটনের দ্বিতীয় গতি সূত্র)

**Where it goes in the book:** Book pages 75–76, topic 3.6: বস্তুর গতির উপর বলের প্রভাব: নিউটনের দ্বিতীয় গতি সূত্র. Next to the football and cricket-ball examples, the law in its box and the steps to F = ma.

Interactive 3D figure for the Pathshala book.

The v0.2 lesson adds a vivid 3D child-and-wagon scene, adult/two-child pushers, and a live free-body diagram.
The 100 kg unloaded system includes an 80 kg cart and 20 kg passenger; each sack adds 50 kg. The floor control
compares zero resistance with a constant 20 N resisting force. The live formula uses the **resultant** force,
including friction and buffer contact, and vertical support balances the system's weight. Diagram arrows are
labelled as schematic. Pause the motion to inspect its forces. Click F = ma for the textbook momentum derivation and complete mass accounting.

v0.3 makes the push readable at a student's pace. By default the run plays at **half speed** (the view says
"সময় ২ গুণ ধীর" and shows a clock `t = … s`): the force (লব্ধি বল F) and acceleration (ত্বরণ a) arrows grow in
before the cart moves, then at each whole second of the push the run **holds** for about a second while the cart's
velocity is stamped on the floor (a faint blue arrow and "১ s: v = ১ m/s") and a row on the view lists the velocity
each second ("০ → ১ → ২ m/s": equal steps, the step is a). The result line works out v = u + at with the numbers on
the picture. A button beside বলচিত্র and ঘর্ষণ (or the S key) switches to real time; P pauses. The test plays at
the chosen speed without the holds. `?speed=1` / `set({speed:1})` for real time; snapshots carry `playback` and
`held`.

v0.4 makes the law something to see, not only read. Beside F = ma the panel draws a live **বেগ–সময় গ্রাফ** of the
push: the blue line grows with the cart, and at each whole second a teal step (1 s across, +a up) shows that the
step each second is the acceleration ("ঢাল = ত্বরণ a"). The lines of examples already tried stay, faint and tagged
"a = …", so two people make the line twice as steep, two sacks half as steep, and the push back makes it go down.
Under the graph's heading three bars give F, m and a now: the force in one piece per person (friction a striped
piece cut off), the mass in pieces (cart with its child, one per sack), and a = F ÷ m with the numbers. When the push
ends the F and a bars empty while the velocity stays. While the clock holds, the velocity's label is lit and the
graph's dot is ringed; with sound on, a soft tick marks each held second. N = W = mg moved to the calculation sheet.

Additive bridge controls: `set({diagram:true, friction:20})` and `set({paused:true})`; snapshots include `forces`, `diagram` and the
floor's resisting-force setting. Changing the floor restarts the comparison. The existing four example IDs,
smooth-floor results, quiz and motion controls remain supported.
`friction` is the selected resistance magnitude; `forces.friction` is its signed instantaneous component
(and is zero at rest). `force`/`forces.net` are the horizontal resultant; `forces.normal` and `forces.weight`
are vertical force magnitudes. Use `set({at:1.2, paused:true})` to hold an exact bridge-controlled moment.

## Embed

```html
<iframe src="newtons-second-law/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './newtons-second-law/shared/lib/host.js';
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
| `example` | Example | `base` one adult pushes · `force` two children push · `mass` double mass · `back` force backward | `base` |
| `friction` | Resisting force | `0` smooth floor · `20` 20 N friction | `0` |
| `diagram` | Live free-body diagram | `1` · `0` | `0` |
| `speed` | Playback speed | `0.5` slow (0.5×): arrows grow in, held at each second · `1` real time | `0.5` |
| `at` | A moment of the run (e.g. 1.5: the run held 1.5 s after the push began, for pictures (empty: at rest)) | number |  |
| `tried` | Examples already tried (their accelerations show under the words) | text |  |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the cart pulses | `1` · `0` | `1` |
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
| `set` | `{"diagram":true,"friction":20}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `push`, `result`, `example`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
