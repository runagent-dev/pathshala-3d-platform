# A tank with a hole (ছিদ্রওয়ালা ট্যাংক)

**Where it goes in the book:** Book page 146, topic 5.4.1 (টরিসেলির পরীক্ষা): after চিত্র ৫.১০, as a second example of 'নলের উপরে কোনো ফুটো নেই, তাই সেদিক দিয়ে বাতাস চাপ দিতে পারছে না' (the owner's third picture).

Interactive 3D figure for the Pathshala book. A tank with a hole (the owner's third picture, beside page 146, topic 5.4.1) in a plain school lab (a teak bench, a blue-grey wall): one glass tank of water with a screw lid and a red cork in a hole near the bottom. One button steps through it: pull the cork with the lid on: a few drops come and stop, and an outlined blue arrow shows the outside air pressing on the hole, as in Torricelli's tube; take off the lid: the arrow moves to the water's surface, a jet spurts out and, as the tank drains (shown faster), the depth h above the hole (orange) falls and the jet weakens; then refill. The panel shows one short line, h and the rule. Test tab: 3 questions (lid on, lid off, the tank draining), every wrong choice with its own note. Split from torricelli-barometer. Phone-first, Bangla and English.

## Embed

```html
<iframe src="torricelli-barometer-tank/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './torricelli-barometer-tank/shared/lib/host.js';
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
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring on the part pulses at first | `1` · `0` | `1` |
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
| `set` | `{"tank":"stopped"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
