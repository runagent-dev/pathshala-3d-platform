# Newton's third law of motion (নিউটনের তৃতীয় গতি সূত্র)

**Where it goes in the book:** Book pages 84–86, topic 3.8: নিউটনের তৃতীয় গতি সূত্র (Newton's Third Law of Motion). Next to the boxed law, the action–reaction paragraph and চিত্র ৩.১২ (an apple and the Earth pulling each other).

Two vivid 3D examples replace the old mass-comparison skaters:

- A schoolboy jumps from a planked wooden boat onto a jetty. Equal and opposite horizontal contact forces act on
  the boy and boat while his feet push. After takeoff, the contact arrows disappear and separate velocity arrows
  show the boy moving forward and the boat backward. Water resistance is ignored; time runs at half speed.
- A red apple above the **whole Earth**, mapped with NASA's locally bundled Blue Marble imagery. Equal gravity
  arrows act on different bodies. The centre-to-centre guide R matches the book's formula: F = GmM/R² = mg;
  a_m = g and a_M = F/M = (m/M)g ≈ 1.64 × 10⁻²⁴ m/s², using m = 1 kg and M = 5.98 × 10²⁴ kg.
  Three paused steps teach the idea: a fall at 6× slower time with a ghost start and distance trail; two equal
  force readings naming who pulls whom; then a mass-versus-force question with retry feedback. The acceleration
  comparison and a = F/m appear after the correct mass explanation; detailed numerical results stay in the
  calculation sheet. **Full calculation** keeps the derivation and constants separate. The fall pauses before contact. The picture is explicitly not to scale. Texture credit: [media/README.md](media/README.md).

Five picture-based tap questions cover force equality, separate bodies, boat recoil, the apple's reaction force,
and the Earth's very small acceleration. Keyboard: Space/Enter/→ runs the action; 1/2 selects the example.

**Version 1.0 integration change:** `example` is now `boat` or `apple`. The removed `equal`, `unequal` and `tried`
options and skater-specific snapshot fields are no longer supported. `set({push:true})` runs either example;
`set({at:0.18})` pauses at physical simulation seconds. `get` returns phase, playing/done, force, masses, positions
and horizontal acceleration for the boat, or fallen distance and both accelerations for the apple. Arrow visibility
identifies which body each force acts on. `home` rewinds the chosen example; `reset` returns to the boat.

Version 1.1 adds `lesson: {step, reason}` to apple snapshots and optional `set({lessonStep:0|1|2})` for paused
teaching stages. The main action advances the lesson after the fall; bridge `push` always restarts the fall.

## Embed

```html
<iframe src="newtons-third-law/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './newtons-third-law/shared/lib/host.js';
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
| `example` | Pair | `boat` boy jumps from a boat · `apple` apple and Earth | `boat` |
| `at` | Start already moving (Physical simulation seconds: e.g. 0.18 shows boat contact; 0.55 shows the boy airborne. Boat time is 2× slower; apple time is 6× slower.) | number |  |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring pulses | `1` · `0` | `1` |
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
| `set` | `{"example":"boat"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `push`, `release`, `done`, `example`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
