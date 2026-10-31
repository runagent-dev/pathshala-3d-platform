# Pressure: a high heel and a sneaker in soft clay (চাপ)

**Where it goes in the book:** Book page 129, topic 5.1 (চাপ): next to the opening paragraphs and চিত্র ৫.০১ (a stone pushed with one hand, two hands, the whole body: 'কতটুকু জায়গায় বল প্রয়োগ করা হচ্ছে তার উপরে চাপ নির্ভর করে'), the formula P = F/A and the box with the unit N/m² or Pa and the dimension.

Interactive 3D figure for the Pathshala book. Pressure (page 129, topic 5.1) in a village yard of soft red clay after rain, with a turquoise wall, a blue door, magenta bougainvillea and pots of marigolds under a blue sky: two feet stand on the clay with the same force F on each, one in a cobalt-blue high heel that touches the clay with only 50 cm² (the front of the sole and the heel's tip), one in a yellow sneaker that touches it with 200 cm². The clay in front is dug away along the line through the middle of both soles, so its cut face shows the layers of clay bending down under each shoe. One tap stands them on the clay: the shoes sink in (the heel four times as deep), bold red arrows press down from each sole (the longer, the more pressure), a purple arrow shows F on each shoe, a teal line marks the area A, and the camera goes close to the heel and then to the sneaker. A second tap lifts the feet and shows the prints, a deep one and a shallow one, each with its area in teal. The student changes F with a stepper (100 to 800 N) and the panel works out the book's P = F/A for both shoes live, in N ÷ m² = Pa with Bangla digits; tapping P, F or A in the formula makes its arrows or area pulse. The row of words moves the camera: both shoes, under the heel, under the sneaker. The rule grows in the book's words (সমান পরিমাণ বল প্রয়োগ করলেও চাপ কিন্তু হবে ভিন্ন; ক্ষেত্রফল দ্বিগুণ হলে চাপ অর্ধেক; the unit N/m² or Pa; pressure is a scalar). Test tab: 5 questions (the heel's pressure from F and A on the picture; F = PA for the sneaker; the book's stone pushed with two hands; why the heel's print is deeper; the unit), every wrong choice a real mistake with its own note. Phone-first, Bangla and English.

## Embed

```html
<iframe src="pressure/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './pressure/shared/lib/host.js';
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
| `F` | Force on each shoe (100 to 800 N in steps of 100) | number | `500` |
| `phase` | Start | `ready` feet in the air · `stand` standing in the clay · `lift` lifted, the prints showing | `ready` |
| `look` | Camera | `both` both shoes · `heel` close to the heel · `sneaker` close to the sneaker | `both` |
| `view` | View | `front` · `3d` | `front` |
| `mode` | Start in | `explore` learn · `quiz` test | `explore` |
| `coach` | The ring round the shoes pulses | `1` · `0` | `1` |
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
| `set` | `{"phase":"stand"}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `stand`, `lift`, `look`, `view`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
