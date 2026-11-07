# Notes: Prism (প্রিজম)

Book: physics-9-10 › 9.3.2 › p254, চিত্র ৯.১২ (page image in `reference/page-254.png`; the lower half of the page is 9.3.3,
the periscope, a figure of its own).

## What the page shows
- The definition: "আলোক বিজ্ঞানের ভাষায় দুইটি অসমান্তরাল সমতল পৃষ্ঠ দ্বারা আবদ্ধ একটি স্বচ্ছ মাধ্যমকে বলে প্রিজম।"
- Light through a prism changes direction: entering by the first face it bends toward the normal ("লম্বের দিকে"); the
  second face is not parallel, so leaving it the light bends away from the normal but cannot return to its original
  direction.
- চিত্র ৯.১২: a light-blue prism, apex up, base at the bottom; a ray from the lower left, horizontal inside, leaving down
  to the right; short dashed normals at both faces; a thin grey line continuing the incoming ray, labelled "আলোর মূল দিক",
  and the outgoing ray labelled "প্রতিসরিত আলোর দিক". Caption: "প্রিজমের আলোক রশ্মির দিক প্রিজমের ভূমির দিকে বেঁকে যায়।"
- The second paragraph: how far the light turns depends on the refractive index, which depends on the wavelength or
  colour; so colours in one ray turn by different angles and come out separated, as Newton first showed.

## The one idea
A prism bends light toward its base at both faces, and it bends each colour by a different amount (its refractive index
differs by colour), so white light comes out spread into colours: violet bent most, red least.

## Terms (as on the page)
প্রিজম, অসমান্তরাল সমতল পৃষ্ঠ, স্বচ্ছ মাধ্যম, প্রথম পৃষ্ঠ / দ্বিতীয় পৃষ্ঠ, লম্ব (the page's word, as all of chapter 9; never
অভিলম্ব), লম্বের দিকে বেঁকে যায়, লম্ব থেকে সরে, মূল দিক, আলোর মূল দিক, প্রতিসরিত আলোর দিক, ভূমি, প্রতিসরণাঙ্ক, তরঙ্গ দৈর্ঘ্য
বা রং, রংগুলো আলাদা হয়ে গেছে, নিউটন. The page writes ওপর and "রং / রঙের". The page does not say "বিচ্ছুরণ", so the figure does not
either. Colour names as the sister figure `light-spectrum` (বেগুনি নীল সবুজ হলুদ কমলা লাল). Added by the figure, not on the
page: বাতি, লাল ফিল্টার (the word colour-of-objects uses), পর্দা (as concave-mirror-image), সাদা আলো; the step word
বাঁক (the turn); the test's letters ক খ গ ঘ. The page's spelling বেঁকে / বেঁকে যায় is used throughout.

## How the figure works
- **The setting** (common.md): a deep-blue gradient backdrop, a plain light-sand table top floating in it over a soft
  shadow; nothing else. On it a 60° crown-glass prism (7 cm sides, 7 cm long, bevelled, faint green edges) lies on its base
  on a small black prism table, apex up as the book draws it; a ray box (lamp with a lens barrel and a slot) rides an arc
  rail centred on the point where its beam meets the first face, so the student can turn it without the light missing
  the prism; a red filter (a thick red pane, turned a little toward the viewer) in a slot in front of its lens; a white
  card screen on a stand, turned to face the prism and the camera (seen from behind, it fades so the prism shows).
- **The light is traced, never drawn by eye** (`src/reading.js`): Snell's law in its vector form at each face, in the
  ray plane z = 0, centimetres. The unit tests check n₁ sin θ₁ = n₂ sin θ₂ at both faces, r₁ + r₂ = A, δ = i + e − A, the
  turn always toward the base over the lamp's whole range (i = 45°…66°), the least turn on the symmetric path (inside ray
  parallel to the base, as চিত্র ৯.১২), and violet landing lowest.
- **The glass:** n(λ) = A + B/λ² (Cauchy) with B = 0.0042 µm², a common crown glass, and A chosen so that n = 1.52 for
  yellow light (589 nm): the book's table ৯.০১ value for glass. So n ≈ 1.532 violet, 1.527 blue, 1.523 green, 1.520 yellow,
  1.519 orange, 1.518 red (the panel says "সাধারণ কাচ (আনুমানিক মান)").
- **Five steps, one tap each, slow** (the big button, its ring on the lamp at first, or a tap on the part it names):
  ① বাতি জ্বালাও: red light goes in and bends toward the normal (লম্ব; i and r arcs with their degrees); ② it leaves by
  the second face, bending away from the normal. The angles are coloured by role, as the sister figures: the angle of
  incidence blue (in the air at the first face, in the glass at the second), the angle of refraction green; ③ the original direction, a
  thin grey dashed line with an arrow, beside the refracted direction, the turning angle in amber (about 39° at the start),
  and ভূমি; from here the student drags the lamp along its rail and sees the light turn toward the base at every angle;
  ④ the red filter slides up out of its slot (in view of the lamp), then the camera flies closer to the screen: white
  light goes in, opens into a fan inside the glass and on to the screen, where the colours lie violet lowest, red
  highest. The fan is drawn with normal blending (each colour at full strength, fading out by its alpha at the ends), so
  it stays coloured over the white card; ⑤ the panel's graph shows every colour's index; tapping a dot (or
  the arrow keys on it) lights that colour's ray and gives its index in the result line (the graph shows only its ring).
  The lamp handle shows in steps ①–③; in ④–⑤ the view is close to the screen and the lamp is out of it.
- **The panel:** a calm card on the first screen (the same height as the lead line, result and rule it stands for, so the
  3D keeps one height), then per step a lead-in line, the result with its number, and the rule in the book's words with
  its term in bold; the kit's how-to row (360° pill, সামনে, drag the lamp) beside the 3D; the graph of n against
  wavelength with the book's 1.52 as a dashed line. Before the white light the graph shows only the red light's point.
- **The test** (5 questions, tap answers, choices shuffled, each wrong choice with its own note): ক–ঘ paths drawn from the
  exit point (which one does red light take?); ক–ঘ lines from the entry point (which one is the original direction? the
  inside direction, the refracted direction and a steeper line are the slips); ক–ঘ dark marks on the screen, letters
  on dark leaders, left and right in turn, with only the white light going in (where does red land?); why the colours
  separate; what a prism is (the book's definition against a slab, a lens and a mirror). Three of five need the picture. The order keeps any scene from showing a later answer (the screen
  question comes before the one with the spectrum on view). `get` gives `question: { kind, right, index }`.

## Honest stylisation
- The colours are spread **6 times wider** than real crown glass would (the corner note says so: "রঙের ছড়ানো ৬ গুণ বাড়িয়ে
  দেখানো"). Real crown glass fans 400–700 nm over about 1.5°, a few millimetres on this screen. The drawn index is
  n_drawn(λ) = n(650 nm) + 6·(n(λ) − n(650 nm)), so the red light the figure starts with is traced with the real index
  and stays exactly where it was when the red filter comes off; the turning angles shown in degrees are for that red
  light only (real crown glass). No per-colour angle in degrees is shown, so no number disagrees with the picture.
  (A dense flint glass spreads about 4.5 times as much as crown glass, so the picture is not far from a real glass.)
- A beam is not seen in clean air: the rays are drawn, and the corner note says so ("আলোর পথ এঁকে দেখানো").
- The red filter passes a band of reds; the figure draws it as one wavelength (650 nm).
- Colours of the spectrum: measured (CIE 1931 2° observer → sRGB), as light-spectrum, not a hue wheel.

## Numbers (shadow on, 844 × 390, kit 1.9.1)
- Draw calls / triangles in one frame: see the numbers in the pull request (measured from four sides, shadow on). Limit
  150 / 300k.
- GLB: the model only (the prism, its table, the lamp on its rail, the red filter, the screen), vertices shared
  (mergeVertices) and plain metals without the brushed textures.
- JS per animated frame at 6× CPU slow-down (the white-light step's animation, scripting time from DevTools metrics,
  including the test driver): 2.9 ms. Rendering on demand: nothing drawn when idle.
- No per-frame allocations in the light: every buffer (beam, dashes, arcs, fan, patches, arrowheads) is written in place;
  the traces are recomputed only when the lamp turns.

## Open questions for the book team
- The page's "লম্ব" is used throughout (chapter 9's word); chapter 8 used অভিলম্ব.
- The figure names the turning angle only by its degrees (the page says "মূল দিক থেকে কতটুকু বেঁকে যাবে"); it does not
  introduce "বিচ্যুতি কোণ", which the page does not use.
- Words added: বাতি, লাল ফিল্টার, পর্দা, সাদা আলো.
- The spread of colours is drawn 6× wider than real crown glass (noted on the view). Is that acceptable, or should the
  screen be moved far off (a true-to-life, much narrower spectrum)?
