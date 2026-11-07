# Notes: Refraction of light (আলোর প্রতিসরণ)

Book: physics-9-10 › 9.1 › p243 (also 9.1.1 প্রতিসরণের সূত্র, pp. 244–247, and 9.1.2 আপেক্ষিক প্রতিসরণাঙ্ক, pp. 247–248).
Page images in `reference/` (pages 243, 244, 245, 247, 248). The coin-in-a-cup নিজে করো (চিত্র ৯.০৩, p.246) is not here: it
is the figure `coin-in-cup`.

## What the pages show
- p.243: three things can happen at a boundary (reflection, refraction, absorption); the refractive index n = c/v (no
  unit, always more than 1); টেবিল ৯.০১ (শূন্য মাধ্যম 1.00, বাতাস 1.00029, পানি 1.33, সাধারণ কাচ 1.52, হীরা 2.42); the
  উদাহরণ v = c/n for each (p.244: 3, 3, 2.26, 2, 1.24 × 10⁸ m/s).
- p.244: চিত্র ৯.০১, a 3D sketch: the boundary as a horizontal plane, the upright plane of incidence at 90° to it, the
  normal, θ₁ and θ₂; the two laws in a box (প্রথম সূত্র: the refracted ray is in the plane of the incident ray and the
  normal; দ্বিতীয় সূত্র: n₁ sin θ₁ = n₂ sin θ₂).
- p.245: with n₁ = 1, n₂ = sin θ₁ / sin θ₂; হালকা → ঘন: toward the normal (চিত্র ৯.০২); ঘন means larger n, not mass;
  some light always reflects, more at a bigger angle.
- p.246–247: উদাহরণ (a) 45° into n = 1.6 → 26°; (b) 60° in, 45° out → n = 1.22 (চিত্র ৯.০৪).
- p.247–248: relative refractive index: water → glass n₂/n₁ = 1.14 (চিত্র ৯.০৫), glass → water 0.88; diamond/water
  1.82, 0.55; diamond/glass 1.59, 0.63.

## The one idea
Light changes direction where it crosses into another medium because its speed changes (n = c/v); the incident ray, the
normal and the refracted ray lie in one plane; n₁ sin θ₁ = n₂ sin θ₂, so going into a denser medium it bends toward the
normal; sin θ₁ / sin θ₂ for a pair of media is their relative refractive index.

## Terms (as on the pages)
আলোর প্রতিসরণ, প্রতিসরণাঙ্ক (n), শূন্য মাধ্যম / শূন্য স্থান, বাতাস, পানি, সাধারণ কাচ, হীরা, প্রথম মাধ্যম / দ্বিতীয়
মাধ্যম, লম্ব (the book's word for the normal on these pages, not অভিলম্ব), আপতিত রশ্মি (p.244; the box writes আপতন রশ্মি),
প্রতিসরিত রশ্মি, আপতন কোণ θ₁, প্রতিসরণ কোণ θ₂ (the book's letters θ₁, θ₂, not i, r), প্রতিসরণের প্রথম / দ্বিতীয় সূত্র,
হালকা মাধ্যম / ঘন মাধ্যম, লম্বের দিকে বেঁকে যাবে / লম্ব থেকে দূরে সরে যাবে, পানির সাপেক্ষে কাচের প্রতিসরণাঙ্ক, কাচের
তুলনায় পানির প্রতিসরণাঙ্ক. The box's spelling slip "আপাতন" is not repeated. "কাচ" throughout (p.248 also prints "কাঁচ").
Words the figure adds: টর্চ, মাপো, সমতল (the book: "যে সমতলটি কল্পনা করে নিয়েছি"), "প্রতিফলিত (অল্প)", "না বাঁকলে" (graph),
"ঢাল" (the slope of the graph's line), "আলোর বেগ অনেক কমিয়ে দেখানো".

## How it works
- **Setting:** the chapter's calm deep-blue gradient (`['#0b2a5b', '#123d7a']`, a 4×256 canvas as `scene.background`)
  and a plain sand table top (#bca27a) sitting in it. On it only: a thick block of clear glass (20 × 7 × 9 cm, two
  transparent passes with green-tinted edges, as in `light-at-boundary`; no `transmission`), and a small torch riding a
  graduated aluminium arc (radius 15 cm) whose centre is the point of incidence O, on one post with a heavy foot. The arc
  carries a printed degree scale (ticks every degree, numbers every 10°, Bangla digits), so the arc itself reads θ₁.
  Diamond is the same block with a cool tint and brighter edges; water is a thin glass tank filled to the same top, so O
  is on the water's surface; the last step is a tank with a 3.2 cm glass slab under 3.4 cm of water.
- **Rays** come from `trace()` in `reading.js`: from the torch's window to O, then n₁ sin θ₁ = n₂ sin θ₂ at every
  horizontal boundary, to the bottom. They are drawn as vector lines on a 2D canvas over the view (the chapter-8 style:
  amber #f59f00 with a dark edge, swept chevrons), from the exact 3D points projected through the camera; `capture`
  composites them. The weak reflected ray's width and strength follow the Fresnel reflectance (unpolarised), so it grows
  with the angle as p.245 says; the refracted ray thins a little to match.
- **The torch:** drag the kit's handle (turn axis, on the torch) or the torch itself; the finger's point in the plane of
  the rays gives the angle from O (0°–80°, whole degrees). Arrow keys ±1° (Shift ±5°). A drag disables the orbit while
  it lasts, so it is never also a turn of the view.
- **Five steps, one tap each** (after a calm intro card): ① বেগ: the ray grows to O (1.1 s) and on into the glass (1.1 s),
  the faint reflection appears, and wavefronts march along the beam (9 s, then they rest): their spacing is λ in air and
  λ/n in the glass, at speed c and c/n, so they bend at the surface and crowd together (a corner note says the light is
  shown very much slowed). The panel shows the book's উদাহরণ as bars (v = c/n for all five media of টেবিল ৯.০১) and
  n = c/v. ② বাঁক: the normal grows from O (dashed slate with a white halo), then θ₁ (blue) and θ₂ (green) arcs; the panel
  graph is θ₂ against θ₁ under the dashed line θ₂ = θ₁ ("না বাঁকলে"). ③ ১ম সূত্র: the upright plane through the incident
  ray and the normal fades in with a right-angle mark (৯০°) to the top face; the camera swings round (2.2 s) to look along
  the plane, where the incident ray, the normal and the refracted ray fall on one line, holds 1.4 s, and comes back to a
  three-quarter view. ④ ২য় সূত্র: "মাপো" turns the torch to 30°, 50°, 70° in turn (or measures the angle the student set
  by hand) and puts a dot on a sin θ₁–sin θ₂ graph; after three dots the line through them is drawn, "ঢাল ১.৫২" = n₂;
  changing the medium starts new dots and leaves the old line faint, tagged. ⑤ আপেক্ষিক: the block gives way to the tank
  and slab, water fills (2.6 s, the ray re-traced live as the level rises), the normals and angles appear at the
  water–glass boundary, and the torch sweeps 30°, 50°, 70° leaving dots on a line of slope 1.14; the rule gives 1.14 and
  0.88.
- **The other way (②):** a quiet "উল্টো দিকে" toggle in the bending step draws the same path the other way (the light
  starting at the bottom of the glass, chevrons upward, the faint reflection now inside the glass, the torch dark): from
  the denser into the lighter medium the ray bends away from the normal (চিত্র ৯.০২, right). θ₂ never reaches the
  critical angle (at most 40.4° at θ₁ = 80°, θc = 41.1°), so it is always a true reverse path; total internal reflection
  is the next figure.
- **Numbers that agree:** θ₂ shown to 0.1°, sines to four significant figures, so the shown division gives the shown
  ratio at every whole angle 1°–80° and every medium (unit-tested). The speed of light in glass: the book prints
  3/1.52 as "2 × 10⁸"; the figure shows 1.97 × 10⁸ m/s (the only number it shows for it).
- **Panel:** steps row, the lead line (beside the 3D, tall frames), the action with replay and reset, the kit's how-to row
  (beside the 3D only), one result line, the box (the medium chips in its top-right corner and the graph), the book's
  rule last, at most three lines. Nothing in the panel scrolls in any state at any of the six sizes (checked in every
  step, the reverse toggle and every pick of every test question).
- **The second law's graph** is drawn with equal scales on both axes (a square plot as tall as the box allows), so the
  slope 1.52 looks steeper than 45° at every size; beside it the table the student fills (θ₁, θ₂, অনুপাত for the last
  three measurements) and the line's slope. At 390 × 520 a compact form: the plot and one line of the three ratios.
- **Framing:** each step's camera box holds the whole glass, the ray's end on the floor, the normal and the torch's body
  where it is (and for the second law and the last step, both ends of its 30°–70° travel), with room above for the
  corner buttons and below for the labels; the edge-on view keeps the bottom of the glass. The calm first card
  stands in for the result and the rule (app.js gives it exactly their height), so the 3D keeps one size in every state
  and every test question (measured at all six sizes). Under the 3D (a phone held upright) the lead line is hidden and
  the how-to row keeps words only for the drag; at 390 × 520 the graph is hidden (the result line carries the number).
- **Test:** five questions, four tap choices each, every wrong choice with its own note: the speed in water from the
  label n = 1.33 (2.26; ×n, unchanged, n itself); where the refracted ray is (the first law); উদাহরণ (a) θ₂ for 45° into
  n = 1.6 (26°; 45/1.6 = 28°, no bend, bent away); উদাহরণ (b) n from the picture's 60° and 45° (1.22; 60/45, flipped,
  1/sin 45°); water → glass relative index (1.14; 0.88, sum, difference). Each question sets its own scene.

## Decisions and open questions for the book team
- "লম্ব" for the normal, as every chapter-9 page writes it; chapter 8's figures (and the book's chapter 8) say "অভিলম্ব".
  The book team may want one word across the two chapters.
- The book's `n` for glass is 1.52 (table ৯.০১); the fibre example's 1.5 is not used here.
- Glass speed shown as 1.97 × 10⁸ m/s (বইয়ে ≈ ২ × 10⁸: the book rounds 3 ÷ 1.52 to 2).
- The book's other relative indices (diamond/water 1.82, 0.55; diamond/glass 1.59, 0.63) are not on screen: the last
  step's panel has no room for them without crowding at phone sizes.
- The torch's light is drawn in the chapter's amber; real beams are not seen from the side in clean air (the drawing
  shows the path).
- A diamond block the size of the glass block is not realistic; it is there only to show n = 2.42 bending more.
- On a phone held upright the 3D is 336 px of 700 (48 %) and 186 px of 520 (36 %); there the how-to row is left out
  (the 3D keeps its ৩৬০° pill and the সামনে button) and the lead line too. A touch phone held upright is also asked to
  turn sideways ("এভাবেই দেখো" keeps it upright).

## Performance (v0.1.0, shadows on, 844 × 390, headless Chromium with software WebGL)
- Draw calls / triangles per frame (shadow pass included), re-measured after the review: start 24 / 9.1k, first law (with
  the plane) 28 / 9.1k, second law 26 / 9.1k, diamond 26 / 9.1k, last step (tank, water, slab) 30 / 12.2k. Every mesh of
  the scene is in each of these frames, so no camera angle can draw more. Budget 150 / 300k. (The first round's NOTES
  gave 60–78 draws: that counter took in more than one frame per picture.)
- Idle: 0 draws once the camera's damping and every step have settled (render on demand).
- JS per animation-frame callback under 6× CPU throttling while all five steps play (568 frames): median 1.2 ms, p90
  2.3 ms, max 10.4 ms (a single frame, when a step starts and its labels are made). GL is encoded in that time but drawn
  in another process.
- Textures: the backdrop 4×256, the arc's scale 1024², the plane 256², a glow 64², the foot 128×64. Geometry is shared
  between the inside and outside passes of each clear box; the torch's grip is one merged mesh. Later parts (the plane,
  the tank, the slab, the diamond and other-medium blocks, the glow) exist at load, hidden, and go through
  `stage.warmUp({ show })`, so a step's first tap compiles nothing new.
