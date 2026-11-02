# Force: a crane’s pull, a contact force (বল: ক্রেনের টান, স্পর্শ বল)

**Where it goes in the book:** Book page 67, topic 3.1.2: বল (Force). Next to the paragraph that names ক্রেন দিয়ে ভারী জিনিস তোলা as a force that needs touching (স্পর্শ বল).

Interactive 3D figure for the Pathshala book, one of the page's five examples of force: a truck crane lifts a
concrete block by its ring (ক্রেন দিয়ে তোলো), real time; it holds half a metre up, the hook in the ring lit, with
the tag "ছুঁয়ে আছে: স্পর্শ বল". The panel beside it has one numbered action, one result line naming the force and
its kind, and one rule from the book's definition of force to this kind. Then a three-question test.

Notes for the book developer:
- The scene is in metres, everything real size; the GLB export (`contact-noncontact-force-crane.glb`) holds only the objects (no ground,
  arrows, patches or labels).
- `get` returns `{ example, scene, phase, time, speed, acting, touching, gap, kind, effect, marks, seen, step, view,
  mode }`: `phase` is `rest` | `acting` | `paused` (held at the telling moment, or at a time) | `done`; `speed` is the
  real speed in m/s; `gap` is in m (or `null`); `marks` is what the picture shows (`'contact'`: the lit patch, `'gap'`:
  the measured gap, or `null`); `seen` is true once the run reached its telling moment.
- `set` takes `at` (`'rest'` | `'key'` | `'end'` | seconds), `play: true` (to its telling moment), `act: true` (what
  the big button does), `view`, `animate: false`. For a summary picture use the URL parameter `at=key` (the poster).

## Embed

```html
<iframe src="contact-noncontact-force-crane/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './contact-noncontact-force-crane/shared/lib/host.js';
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
| `at` | Start at | `rest` at rest · `key` the telling moment · `end` the end | `rest` |
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
| `set` | `{"play":true}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `act`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
