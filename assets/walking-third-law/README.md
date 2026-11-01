# How we walk: the third law (হাঁটা ও নিউটনের তৃতীয় সূত্র)

**Where it goes in the book:** Book page 86, topic 3.8 (example): how we walk. Next to চিত্র ৩.১২ (a person's foot pushing the ground back, the ground pushing the person forward, labelled F and −F).

A 3D lesson for the textbook's walking example, set in a school yard on a clear morning. A detailed articulated
person pushes off while an enlarged live view of the same shoe, on a card of its own, separates the equal opposite
forces on the ground and the person. Firm ground, loose
sand and a slippery floor change grip, forward motion and backward slip. The two arrows appear simultaneously
and use one force scale within each view.

Pause or scrub the timeline to inspect a moment; three buttons select foot placement, the force pair and forward
motion. The live panel identifies each receiving body and computes the person's acceleration from the ground's
forward force. The two-page explanation covers arrow direction, simultaneous reaction, static friction and why
forces on different objects do not cancel. The five earlier scene-based questions remain.

The human model includes shaped clothing, tapered limbs, facial features, hands with fingers, and rounded shoes
with soles and laces; the shoe's contact and joint lengths still follow the original pure kinematics. The contact
view enlarges the shoe by 2.3×; its force arrows use 1.35× the main view's scale. Only horizontal forces are shown.
This is a simplified initial push-off for an example 50 kg person, shown four times slower than real time.

Bridge additions: `set({at:1.2, paused:true})` holds 1.2 s into the slowed picture; `set({paused:false})` resumes it.
`forces.onGround` and `forces.onPerson` are signed live horizontal forces, with right positive. Existing `push`
is the selected example's push magnitude. The exported GLB includes the human, ground and enlarged contact view.

## Embed

```html
<iframe src="walking-third-law/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './walking-third-law/shared/lib/host.js';
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
| `ground` | Ground | `hard` firm ground · `sand` loose sand · `slip` slippery floor | `hard` |
| `at` | Start at (rest: standing; hold: stopped at the telling moment (both forces shown); or seconds (0 to 2.4) into the slowed-down push-off) | text | `rest` |
| `tried` | Grounds already found (their pushes show under the words) | text |  |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the foot pulses | `1` · `0` | `1` |
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
| `set` | `{"ground":"sand"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `push`, `hold`, `ground`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
