# Force: contact and non-contact (বল: স্পর্শ ও অস্পর্শ বল)

**Where it goes in the book:** Book page 67, topic 3.1.2: বল (Force). Next to the paragraphs that define force and divide it into স্পর্শ and অস্পর্শ বল.

Interactive 3D figure for the Pathshala book. The page's five examples of force, one at a time (a crane lifting a
concrete block, a push on a trolley, friction stopping a sliding crate, a football let go, a magnet pulling a nail).
One big numbered button plays each example (its badge rings the body the force acts on) and the picture holds at the
telling moment, where it says the kind itself: a contact force lights the patch where the two bodies touch, with the
tag "ছুঁয়ে আছে: স্পর্শ বল"; a non-contact force shows the gap between them, measured in cm, with the tag "ছোঁয়নি, তবু
টানে: অস্পর্শ বল". Under the picture: the examples as a row of words (each gets its kind under it), one result line,
one rule from the book's definition of force to its two kinds. Then a five-question test.

Notes for the book developer:
- The scene is in metres, everything real size; the GLB exports (`contact-noncontact-force.glb` the crane, then
  `-push`, `-friction`, `-fall`, `-magnet`) hold only the objects (no ground, arrows, patches or labels).
- `get` returns `{ example, scene, phase, time, speed, acting, touching, gap, kind, effect, marks, seen, next, view,
  mode }`: `phase` is `rest` | `acting` | `paused` (held at the telling moment, or at a time) | `done`; `speed` is the
  real speed in m/s (the friction, football and magnet examples are shown 2, 3 and 10 times slower and say so); `gap`
  is in m (or `null`); `marks` is what the picture shows (`'contact'`: the lit patch, `'gap'`: the measured gap, or
  `null`); `seen` maps each example seen to `contact` | `noncontact`; `next` is what the big button does now
  (`{ example, step }`).
- `set` takes `example`, `seen` (`'all'`, `'none'` or `{ crane: true, … }`), `at` (`'rest'` | `'key'` | `'end'` |
  seconds), `play: true` (this example to its telling moment), `act: true` (what the big button does), `view`,
  `animate: false`. For a summary picture use the URL parameters `example=magnet&at=key&seen=1` (the poster).

## Embed

```html
<iframe src="contact-noncontact-force/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './contact-noncontact-force/shared/lib/host.js';
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
| `example` | Example | `crane` crane (ক্রেন) · `push` push (ধাক্কা) · `friction` friction (ঘর্ষণ) · `fall` gravity (মাধ্যাকর্ষণ) · `magnet` magnet (চুম্বক) | `crane` |
| `at` | Start at | `rest` at rest · `key` the telling moment · `end` the end | `rest` |
| `seen` | All five already seen | `1` · `0` | `0` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | Pulse the action's marker | `1` · `0` | `1` |
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
| `set` | `{"example":"magnet"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `example`, `act`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
