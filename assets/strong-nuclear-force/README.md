# Strong nuclear force (সবল নিউক্লীয় বল)

**Where it goes in the book:** Book page 69, topic 3.2.4: সবল নিউক্লীয় বল (Strong Nuclear Force), next to that section and the paragraph on unifying the forces.

Interactive 3D figure for the Pathshala book. A small nucleus of protons (red, +) and neutrons (grey): the student
pulls one proton out. A soft orange shell with a dashed edge about 10⁻¹⁵ m outside the nucleus shows the strong
force's reach. Inside it the strong nuclear force (orange arrow) pulls the proton back far harder than the electric
push of the other protons (blue arrow), and it snaps back when let go; outside it the strong force is gone and the
push sends it away. Two more scenes show where nuclear energy comes from: a big nucleus split by a neutron (ভাঙা)
and two small nuclei joining (জোড়া দেওয়া). The panel shows the four fundamental forces weakest to strongest and the
book's three kinds (মহাকর্ষ, ইলেকট্রো উইক, নিউক্লিয়ার বল); a 5-question test follows. Arrow lengths, time and the
split's particle count are symbolic, and the figure says so on screen. Model units: 1 cm in the GLB = 1 fm.

State (`get`, the `change` event): `scene`, `distance` (× 10⁻¹⁵ m, the gap between the proton and the nucleus), `phase` (`seated`, `held`, `returning`, `back`,
`flying`, `gone`), `inRange`, `verdict` (`back` | `away`), `forces` (N, the model's), `arrows`, `energy` (split/join:
`t`, `duration`, `playing`, `phase`). `set` takes `scene`, `pull` (hold the proton out), `release`, `t`, `play`,
`view`, `animate`.

## Embed

```html
<iframe src="strong-nuclear-force/index.html" style="width:100%;aspect-ratio:16/10;border:0" allow="fullscreen" loading="lazy"></iframe>
```

To listen to it or control it from the book page, use the helper shipped in the zip:

```html
<script type="module">
  import { connectAsset } from './strong-nuclear-force/shared/lib/host.js';
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
| `scene` | Scene | `pull` pull a proton · `split` split (ভাঙা) · `join` join (জোড়া দেওয়া) | `pull` |
| `pull` | Proton held out (fm) (Hold the proton this many × 10⁻¹⁵ m out of the nucleus at the start, e.g. 0.6 (the poster)) | number | `0` |
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
| `set` | `{"pull":0.6}` |
| `reset` | `{}` |
| `practice` | `{}` |
| `capture` | `{"width":800,"height":500}` |
| `export-glb` | `{}` |

Events: `ready`, `change`, `scene`, `release`, `done`, `view`, `dragstart`, `dragend`, `practice-start`, `practice-result`, `practice-end`.
<!-- /generated:bridge -->
