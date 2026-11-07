# Notes: Total internal reflection (পূর্ণ অভ্যন্তরীণ প্রতিফলন)

Book: physics-9-10 › 9.2 › pp 248–251 (`order: 1`). Page images in `reference/page-248.png` … `page-251.png`.

## What the pages show
- p248 (lower half): a perfect reflection needs no mirror, only a transparent medium: light sent from a dense medium into a light one.
  Snell's law n₁ sinθ₁ = n₂ sin θ₂; **in this section the book's n₂, θ₂ are the dense medium the light starts in and n₁, θ₁ the light
  medium it leaves into** (the reverse of ৯.১.১). As θ₂ grows, θ₁ grows faster and reaches 90° while θ₂ < 90°; after that no refraction.
- p249: চিত্র ৯.০৬, three panels: θ₂ < θc (refracted and reflected rays), θ₂ = θc (the refracted ray along the surface), θ₂ > θc (only the
  reflected ray). "θ₂ এর যে মানের জন্য θ₁ = 90° হয় সেই কোণকে ক্রান্তি কোণ বা সংকট কোণ (Critical Angle) θc বলে।" n₁ sin90° = n₂ sin θc,
  sin θc = n₁/n₂, θc = sin⁻¹(n₁/n₂); glass 1.52 and air 1.00 → 0.66 → 41.8°. চিত্র ৯.০৭: a right-angle prism turning the light of a flower
  by 90° into a girl's eye, "সবচেয়ে পরিপূর্ণ প্রতিফলন হয় পূর্ণ অভ্যন্তরীণ প্রতিফলনে।"
- p250: beyond 41.8° the light does not leave the glass; in চিত্র ৯.০৭ the angle is 45°, so TIR. উদাহরণ: under water (1.33/1.52 = 0.88)
  θc = 61.6°, and 45° < 61.6° so no TIR. Second example (চিত্র ৯.০৮): n = 1.45, 75°: sin θ = 1.40 > 1, so TIR.
- p251 (top): θc = sin⁻¹(1/1.45) = 43.6°.

## The one idea to teach
Going from a denser medium into a lighter one the ray bends away from the normal; at the critical angle θc the refracted ray grazes the
surface (θ₁ = 90°), and beyond it no light leaves at all, it is all reflected back inside: পূর্ণ অভ্যন্তরীণ প্রতিফলন, with sin θc = n₁/n₂.

## Terms (as in the book)
পূর্ণ অভ্যন্তরীণ প্রতিফলন, ঘন মাধ্যম, হালকা মাধ্যম, আলোক রশ্মি, প্রতিফলিত, প্রতিসরিত, ক্রান্তি কোণ বা সংকট কোণ θc, n₁ sinθ₁ = n₂ sin θ₂,
sin θc = n₁/n₂, বিভেদতল (কাচ-বাতাস বিভেদতল), আপতন কোণ, প্রিজম, পরিপূর্ণ প্রতিফলন; the page writes "উপরের". From ৯.১.১ (the chapter's
words): অভিলম্ব, প্রতিসরণাঙ্ক. Added by the figure, not on these pages: আলোর উৎস, চাকতি (the optical disc), "প্রতিসরিত রশ্মি নেই",
"প্রতিসরণ নেই" (graph), "টেনে উৎস ঘোরাও".

## How the figure works
- **The apparatus is the school's optical disc** (a Hartl disc): a white disc printed in degrees (0 at the normal, 90 at the surface, a
  tick every degree, a number every 10, Bangla digits), upright on a post and a foot on a plain sand table in the calm deep-blue setting.
  A semicircular glass block sits at its centre with its **flat face up**, so the dense medium is below and the light medium above, as in
  চিত্র ৯.০৬. A ray box is clamped to the rim and aimed at the centre O of the flat face: its light enters the curved face along a radius,
  so it bends only at O. The light is drawn on the disc's face (as the light really shows on such a disc).
- **The steps** (one tap each, slow; `TARGET` and `planFor` in `src/app.js`): a calm card (what is on the table, what we will find out) →
  ① the normal, the ray in (1.1 s), the rays out (1.1 s), the angles: θ₂ = 30° → θ₁ = 48.6°, a faint reflected ray (about 6 %) →
  ② the source turns (2.6 s) to θc = 41.8°: θ₁ = 90°, the ray grazes the surface → ③ on to 60°: "প্রতিসরিত রশ্মি নেই", all the light reflected →
  ④ the book's question: the source to 45° (TIR in air), the lamp dims, a clear half-round cell comes down onto the flat face, water fills
  it (2.2 s), the lamp again: θc = 62.5°, so at 45° the light now leaves into the water (θ₁ = 52.9°) → ⑤ চিত্র ৯.০৭: the cell lifts away,
  the block slides out and a right-angle prism slides in with its long face through O; the light rises from straight below, meets the long
  face at 45° and turns by 90°. Then the test is offered. Each step can be replayed (▶), and the step words jump.
- **The student turns the source** from step ① to ④: by its handle on the rim (the kit's turn handle with its dashed track), by the ray box
  itself, or by the arrow keys (→/↑ further from the normal). A drag lands on whole degrees, and on θc exactly within half a degree (keys stop
  on θc too), so the critical angle can be found by hand. Not in the prism step (the prism's light is the book's one ray).
- **The panel** follows the light, not the step word: the result line and the rule come from the case the light is in now (less / at /
  beyond θc, in air or water), so they never say something false after a turn. While a step plays they wait for its end; the labels on the
  3D and the graph's dot follow the light meanwhile. On landscape frames the formula line (sin θc = n₁/n₂ = 1.00/1.50 = 0.67, θc = 41.8°, or
  the water's) shows on tall panels, and a **live graph**: across θ₂ in the glass, up θ₁ (green, left scale) and the reflected part (amber,
  right scale, %). θ₁ climbs faster and faster to 90° at θc, then the shaded "প্রতিসরণ নেই"; the reflected part creeps from 4 % and jumps to
  100 % at θc. In water the curves are the water's and the air's θ₁ stays as a faint dashed line. Phones held upright have no graph or
  formula line (the 3D keeps its height; the rule names θc and sin θc = n₁/n₂).
- **Rays**: painted on a 2D canvas over the view from the exact points of `src/reading.js` (Snell's law at O; the curved faces crossed along
  radii; the reflected ray the mirror image of the incoming one in the normal), in the chapter's style (amber with a dark edge, chevrons,
  the normal dashed slate, θ₂ blue, θ₁ green; the book also marks the reflected angle θ₂). **Each ray is as wide as the share of light it
  carries** (Fresnel's equations for unpolarised light, `reflectance`), never thinner than a line that can be seen (then it fades instead).
- **Labels** on the 3D are short chips (the media with n, the normal, θ₂ and θ₁ with their values, "প্রতিসরিত রশ্মি নেই", প্রিজম, 45°,
  "৯০° ঘুরল"), placed by the kit's annotations clear of the rays, each other and the corner buttons; the media and the normal are optional
  (they hide when there is no room) and find their place again after the angle chips.
- **Steady layout**: on a phone held upright the শেখো sheet is measured once per size in every state it can show (each step's lead-in,
  result and rule at the angles a student meets, and the calm card) and kept as tall as the tallest, so the 3D never changes size
  (`steadySheet`). The measure script found canvas heights constant in every state at all six sizes, no labels overlapping or leaving the
  view, no control under 24 px, and the panel not scrolling.
- **The test**: five questions, each setting its own scene with the light stopping at O so the picture does not show the answer: which way
  the ray goes at 30° (away, ≈ 49°), the angle and its name when the ray grazes (41.8°, ক্রান্তি কোণ), what happens at 70° (all comes back;
  the worked answer brings in the book's 75° / n = 1.45 example: sin θ = 1.40, θc = 43.6°), water above at 50° (it leaves: θc = 62.5°, the
  wrong choice uses the air's 41.8°), the prism at 45° (turned 90°). Wrong choices are real mistakes with their own notes; the answer shows
  the light going on past O. The choices are indices (the kit's quiz compares numbers), and a browser test answers all five right.

## The book's numbers (a decision, as common.md asks)
- The book prints glass n₂ = 1.52, air 1.00, 1.00/1.52 = 0.66 and θc = 41.8°. But 1/1.52 = 0.658 gives 41.1°, and sin⁻¹(0.66) = 41.3°;
  41.8° is the critical angle of **n = 1.50**. Following the chapter's decision (common.md), the figure takes **glass n = 1.50**, which gives
  the book's printed 41.8° exactly from the formula, and says "কাচ, n₂ = ১.৫০" on the block. (1.50 is a usual crown glass and the book's own
  core index in ৯.৩.১.)
- **Water**: the book prints 1.33/1.52 = 0.88 → 61.6° (1.33/1.52 is 0.875 → 61.0°). With n = 1.50 the formula gives 1.33/1.50 = 0.89 →
  **62.5°**, and the figure shows that (never two disagreeing numbers on one screen). The book's conclusion holds: 45° < θc, no TIR.
- The 75° example (n = 1.45, θc = 43.6°) is correct in the book and is quoted in the test's worked answer.

## Honest notes
- Fresnel's equations give the shares; the light lost entering and leaving the curved faces (about 4 % at each) is not drawn, and the
  slit's beam is drawn as one ray.
- At exactly θc the refracted ray carries next to nothing; it is drawn along the surface (as চিত্র ৯.০৬ does), as a thin faded line.
- The water's step lowers a clear half-round cell onto the flat face and fills it with the lamp off: while the cell is only part full the
  light would bend twice (glass → water → air), which is not the book's question.
- The prism's light comes from below, as চিত্র ৯.০৭ (a flower under the prism, the eye on the right); no flower, girl or eye is drawn (the
  owner: no cartoon heads; the panel says what it means).
- The disc is drawn 26 cm across, the block 11 cm (a real block is 6–10 cm): sized so the angles read on a phone.

## Performance (measured 2026-11-07, `scripts/.perf-tmp.mjs`, 844 × 390, shadows on, software WebGL)
| | draw calls (az 0° / 90° / 180° / 270°) | triangles (max) |
|---|---|---|
| θ₂ = θc (block, disc, ray box) | 20 / 50 / 50 / 50 | 8,770 |
| water (cell + water + block) — the heaviest | 26 / 68 / 68 / 68 | 21,190 |
| prism | 20 / 50 / 50 / 50 | 4,774 |
- Idle: 0 draws (also after an orbit, once the damping settles).
- Main-thread time per animated frame (a step playing) under 6× CPU throttling: median 3.1 ms (p90 spikes are SwiftShader flushes, not
  JS). Fixes that got it there from 7.8 ms: the graph moves three SVG elements per frame instead of being rebuilt, never reads its box in a
  frame (a ResizeObserver does), and the panel's words wait for the end of a step.
- One texture: the disc's printed scale, 1024² (plus a 4×256 backdrop). Shared materials; the post, foot and boss merged; the ray box one
  mesh. Parts of later steps (cell, water, prism) exist at load, hidden, and are compiled by `stage.warmUp({ show })`.
- Ready in about 2.6 s under the test harness.

## Open questions for the book team
- **41.8° vs 1.52** (above): the figure uses n = 1.50 for glass. Should the book print 1.50 here (or 41.1° for 1.52)? Same for 61.6°
  (1.52) vs 62.5° (1.50) under water.
- The book writes "ক্রান্তি কোণ বা সংকট কোণ" and then "ক্রান্তি কোণ"; the figure uses both as the book does, θc on the picture.
- p250 writes both "আপতন কোণ" and "আপাতন কোণ"; the figure spells আপতন.
- চিত্র ৯.০৭ shows only the 90° turn; the 180° turn of a prism (used in binoculars, ৯.৩.৩) is left to `prism-periscope`.
- On the 390 × 520 frame the 3D is 190 px tall (the test's sheet, with four-line worked answers, sets the panel's height there); the
  disc is about 110 px across. Larger 3D there would need a shorter test sheet (fewer lines in the worked answers).
- Every Bangla line needs a person's check against the book.
