# Force: contact and non-contact (বল: স্পর্শ ও অস্পর্শ বল)

**Where it goes in the book:** Book page 67, topic 3.1.2: বল (Force). Next to the paragraphs that define force and divide it into স্পর্শ and অস্পর্শ বল.

Interactive 3D figure for the Pathshala book. The page's five examples of force, one at a time (a crane lifting a
concrete block, a push on a trolley, friction stopping a sliding crate, a ball let go, a magnet pulling a nail):
the student plays each one, sees its force arrow and where it meets the body (a ring where something touches, a
dashed bracket across an empty gap), and sorts it into স্পর্শ বল or অস্পর্শ বল. Then a five-question test.

Notes for the book developer:
- The scene is in metres, everything real size; the GLB exports (`contact-noncontact-force.glb` the crane, then
  `-push`, `-friction`, `-fall`, `-magnet`) hold only the objects (no ground, arrows or labels).
- `get` returns `{ example, scene, phase, time, speed, acting, touching, gap, kind, effect, waiting, sorted, view,
  mode }`: `phase` is `rest` | `acting` | `paused` | `done`; `speed` is the real speed in m/s (the friction, ball
  and magnet examples are shown 2, 3 and 10 times slower and say so); `gap` is in m (or `null`); `waiting` is true
  while the example is stopped at its telling moment for the student to sort; `sorted` maps example → `contact` |
  `noncontact`.
- `set` takes `example`, `sorted` (`'all'`, `'none'` or a map), `at` (`'rest'` | `'key'` | `'end'` | seconds),
  `play: true`, `sort` (`'contact'` | `'noncontact'`), `view`, `animate: false`. For a summary picture use the URL
  parameters `example=magnet&at=key&sorted=1` (the poster).

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
| `sorted` | All already sorted | `1` · `0` | `0` |
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
| `set` | `{"example":"magnet"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `example`, `act`, `sort`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
