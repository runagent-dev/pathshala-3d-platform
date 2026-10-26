# How we walk: the third law (হাঁটা ও নিউটনের তৃতীয় সূত্র)

**Where it goes in the book:** Book page 86, topic 3.8 (example): how we walk. Next to চিত্র ৩.১২ (a person's foot pushing the ground back, the ground pushing the person forward, labelled F and −F).

Interactive 3D figure for the Pathshala book. How we walk, the example that explains Newton's third law: a student
stands on a path, seen from the side. One big numbered button (its badge rings the pushing foot) takes the first
push-off of a walk, slowed down 4 times, and holds at the telling moment: in everyday words, "পা মাটিকে ধাক্কা দিচ্ছে" (an
arrow on the ground) and "মাটি মানুষটিকে ধাক্কা দিচ্ছে" (an arrow at the shoe), the two equally long. The row of words is the
page's three grounds: firm ground (the foot grips; the two pushes are, for example, 100 N each, and the student moves
off), loose sand (the sand gives way, 50 N) and a floor made slippery with soapy water or oil (the foot slides back, only
20 N, the student hardly moves). One result line, one short rule per idea (the current ground's own line always stays), and
the book's own sentence under it, last, once all three grounds are found, when the two pushes also get the book's names F
and −F. The numbers are for an example 50 kg student; the book gives none. The book's arrows are slanted (back and down,
forward and up); the figure draws only their horizontal parts, the parts that accelerate the student (the vertical parts
are balanced by the weight, a different pair). A test of 5 questions follows, in the same plain words.

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
