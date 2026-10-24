# SI prefixes: how big is it? (কোনটা কত বড়?)

> **Where it goes in the book: page 17, topic 1.5.2, উপসর্গ বা গুণিতক (Prefix), with Table 1.05.**
> Put the animation after the opening paragraph of 1.5.2, or next to Table 1.05 (page 18).
> (Also in `PACKAGE.json` as `page`, `topic`, `placement`.)

A self-playing 3D animation (about 98 seconds, loops) with one object for every row of Table 1.05. It needs no
interaction, but students can choose what to see:

- tap any prefix in Table 1.05 (e.g. মেগা) to fly to its object (পৃথিবী);
- on phones and short frames, where the table is hidden, a row of buttons along the top does the same (prefix + object);
- tap an object in the picture, or a "… এতটুকু" dot, to fly to it;
- keyboard: ← smaller, → bigger, space play/pause.

After a choice it holds there; ▶ continues the tour from that stop.

It starts at a student (১.৫ মিটার), zooms **down** through a mango, a cricket ball, an ant, a red blood cell, DNA, an
atom and a nucleus to a quark (smaller than ১ এটোমিটার), comes back, then zooms **up** through a bus, a football field,
Padma Bridge, the Earth, the Sun, the solar system and the nearest star to a galaxy (৬০ লক্ষ এক্সামিটার = 6 × 10²⁴ m,
the value in the book's text). At each stop:

- the size in Bangla with its prefix, and in 10ⁿ m (e.g. "ব্যাস ≈ ১২.৭ মেগামিটার" and "= 1.27 × 10⁷ m");
- Table 1.05 on the side marks that prefix (wide frames only; the caption always names it);
- the previous object stays as a dot beside the new one ("পৃথিবী এতটুকু") to compare sizes;
- a scale bar changes its unit as the zoom runs (সেন্টিমিটার → মিটার → কিলোমিটার → …).

Bangla UI (Noto Sans Bengali, bundled), white page, works offline. Phone portrait, phone sideways, book column and
full screen are all laid out (tested at 390×700, 844×390, 800×500, 1280×800).

## Embed

```html
<iframe class="pathshala-3d" src="si-prefixes/index.html" allow="fullscreen" loading="lazy"></iframe>
<style>
  .pathshala-3d { width: 100%; aspect-ratio: 16 / 10; border: 0; }
  @media (max-width: 600px) { .pathshala-3d { aspect-ratio: auto; height: min(640px, 85vh); } }
</style>
```

## URL parameters

| Param | Values | Default | |
|---|---|---|---|
| `lang` | `bn` · `en` | `bn` | Language |
| `autoplay` | `1` · `0` | `1` | Start playing on load |
| `loop` | `1` · `0` | `1` | Loop, or stop at the end |
| `speed` | number | `1` | `1.25` plays faster |
| `ladder` | `1` · `0` | `1` | Table 1.05 on the side (hidden anyway on narrow or short frames) |
| `start` | `quark` `nucleus` `atom` `dna` `rbc` `ant` `ball` `mango` `student` `bus` `field` `bridge` `earth` `sun` `solar` `star` `galaxy` | `student` | Where to begin |
| `bg` | `light` · `transparent` | `light` | |

## Talking to it from the book (postMessage)

Uses the shared Pathshala protocol (`shared/lib/bridge.js`); `shared/lib/host.js` is included:

```js
import { connectAsset } from './si-prefixes/shared/lib/host.js';
const anim = connectAsset(document.querySelector('iframe'));
await anim.ready;
anim.on('stop', ({ id, prefix }) => console.log('now showing', id, prefix));
await anim.call('pause');
await anim.call('goto', { id: 'earth' }); // jump to a stop and hold there
```

| Command | Payload | Result |
|---|---|---|
| `get` | | `{ time, duration, playing, stop }` |
| `play` / `pause` | | state |
| `goto` | `{ id, animate? }` | `true` if the stop exists; flies there and holds (paused) |
| `capture` | `{ width, height }` | PNG data URL |

Events: `ready` (with the list of stops), `stop` (`{ id, prefix }` each time a stop comes into focus), `choose` (`{ id }` when the student picks a stop), `play`, `pause`.

## The numbers

All rounded, as in a textbook ("≈"):

| Stop | Size shown | Prefix |
|---|---|---|
| Quark | smaller than 1 am (< 1 × 10⁻¹⁸ m): no size has been measured, only this upper limit | এটো |
| Nucleus | radius ≈ 1 fm = 1 × 10⁻¹⁵ m (as in the book's text) | ফেমটো |
| Atom | diameter ≈ 100 pm = 1 × 10⁻¹⁰ m | পিকো |
| DNA | width ≈ 2 nm | ন্যানো |
| Red blood cell | diameter ≈ 8 µm | মাইক্রো |
| Ant | length ≈ 5 mm | মিলি |
| Cricket ball | diameter ≈ 7.2 cm | সেন্টি |
| Mango | length ≈ 10 cm = 1 dm | ডেসি |
| Student | height ≈ 1.5 m | (metre) |
| Bus | length ≈ 12 m = 1.2 dam | ডেকা |
| Football field | length ≈ 105 m ≈ 1 hm | হেক্টো |
| Padma Bridge | length ≈ 6.15 km | কিলো |
| Earth | diameter ≈ 12.7 Mm (12,742 km) | মেগা |
| Sun | diameter ≈ 1.4 Gm (1,392,000 km) | গিগা |
| Solar system (Neptune's orbit) | diameter ≈ 9 Tm | টেরা |
| Nearest star (Proxima Centauri) | distance ≈ 40 Pm (4.2 light-years) | পেটা |
| Galaxy | length ≈ 6 × 10²⁴ m = 6 million Em (the book's value, page 17) | এক্সা (the table's largest; the caption says it is far bigger) |

The atom's nucleus and the bridge's height are drawn larger than true scale (the captions say so). The galaxy uses
the book's figure, 6 × 10²⁴ m, and is called "গ্যালাক্সি" (a galaxy) rather than the Milky Way, which is about
10²¹ m. Earth's outlines
are Natural Earth 1:110m (public domain, via world-atlas, ISC).

## Changing text

All words and numbers are in `src/i18n.js` (`STRINGS.bn`, `STRINGS.en`, `STOPS`, `SEQUENCE`).

## Files

```
index.html        entry (iframe target)
style.css         layout, scoped under .hb
src/app.js        timeline, camera, captions, Table 1.05, scale bar, pins, public API
src/objects.js    the 17 objects, one per row of Table 1.05 (procedural three.js)
src/i18n.js       text, sizes, prefixes, order of stops
src/world.js      country outlines for the Earth
shared/           three.js, Pathshala helpers, Noto Sans Bengali (added by packaging)
```
