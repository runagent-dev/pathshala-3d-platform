# Inertia: the coin and the card (জড়তা: কয়েন ও কার্ড)

**Where it goes in the book:** Book pages 64–65, topic 3.1.1: জড়তা (Inertia). Next to the definition of জড়তা and স্থিতি জড়তা, as a home experiment for inertia of rest.

Interactive 3D figure for the Pathshala book: the coin-and-card trick on a glass (স্থিতি জড়তা). A finger flicks the
card hard; watched 10 times slower, the card shoots off while the coin stays where it was and drops straight into the
glass. A blue arrow on the card and an orange arrow on the coin show each one's speed along the table. A tap anywhere
on the view plays or pauses; then a 3-question test. Units: metres (the GLB too).

`get` returns `{ event ('coin'), t (s of event time), duration, playing, phase ('before' | 'act' | 'after'), slow
(times slower), inertia ('rest'), lowerSpeed, upperSpeed (m/s along the table: card and coin), landed (the coin is in
the glass), key (the moment that shows it best), view, mode }`; `set` takes `t` (shown paused), `playing`, `view`, and
`animate: false` to jump. The URL parameter `at` shows one moment, paused (the poster uses `at=0.26`).

## Embed

```html
<iframe src="inertia-coin-card/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './inertia-coin-card/shared/lib/host.js';
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
| `at` | Show this moment (s of event time, paused) | number |  |
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
| `set` | `{"t":0.26}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `end`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
