# Inertia (জড়তা)

**Where it goes in the book:** Book pages 64–65, topic 3.1.1: জড়তা (Inertia). Next to the paragraphs about a car starting suddenly and getting off a moving bus or train.

Interactive 3D figure for the Pathshala book. A Dhaka bus, with its left side cut away, with a school student
standing inside. The student picks an event and watches it in slow motion: the bus starts suddenly (the feet go with
the bus, the upper body stays: he leans back, স্থিতি জড়তা), brakes suddenly (he leans forward, গতি জড়তা), or he steps
off the moving bus (the feet stop on the road, the upper body runs on: he tumbles forward, গতি জড়তা); a fourth event
is the coin-and-card trick on a glass (স্থিতি জড়তা). A blue arrow on the feet (the card) and an orange arrow on the
chest (the coin) show each part's speed along the road (table); then a 5-question test. Units: metres (the GLB too).

`get` returns `{ event ('start' | 'brake' | 'alight' | 'coin', or 'gentle' in the test), scene ('bus' | 'coin'), t (s
of event time), duration, playing, phase ('before' | 'act' | 'after'), slow (times slower), inertia ('rest' | 'motion'),
lowerSpeed, upperSpeed (m/s along the road: feet and chest, or card and coin), lean (degrees, > 0 back), landed, key (the
moment that shows it best), view, mode }`; `set` takes `event` (starts it from the beginning, or at `t`), `t` (shown
paused), `playing`, `view`, and `animate: false` to jump. The URL parameters `event` and `at` show one moment, paused
(the poster uses `event=start&at=1.15`).

## Embed

```html
<iframe src="inertia/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './inertia/shared/lib/host.js';
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
| `event` | Event | `start` sudden start (হঠাৎ চলা শুরু) · `brake` sudden brake (হঠাৎ ব্রেক) · `alight` off a moving bus (চলন্ত বাস থেকে নামা) · `coin` coin and card (কয়েন ও কার্ড) | `start` |
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
| `set` | `{"event":"start","t":1.15}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `event`, `end`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
