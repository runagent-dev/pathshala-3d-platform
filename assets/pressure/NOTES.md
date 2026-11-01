# Notes: Pressure (চাপ)

Book: physics-9-10 › 5.1 › p129 (the section runs onto p130). Page image: `reference/page-129.png`; the owner's
reference picture: `reference/owner-heel-sneaker.png` (both dev only).

## What the page shows
Topic ৫.১ চাপ (Pressure). In everyday talk we use চাপ loosely, but in physics it has an exact meaning: the chapters so
far said how big a force is, not how it is applied. "তুমি একটা পাথরকে এক হাতে ঠেলতে পারো, দুই হাতে ঠেলতে পারো কিংবা
তোমার সারা শরীর দিয়ে ঠেলতে পারো (চিত্র 5.01)। **প্রত্যেকবার তুমি সমান পরিমাণ বল প্রয়োগ করলেও চাপ কিন্তু হবে ভিন্ন।**"
With force F through the palm's area A, **P = F/A**. A box: "চাপের একক N/m² অথবা Pa (প্যাসকেল)", "চাপের মাত্রা [P] =
ML⁻¹T⁻²". Then: with two hands "বল প্রয়োগকারী ক্ষেত্রফল দ্বিগুণ বেড়ে যাবে বলে চাপ অর্ধেক হয়ে যাবে", with the whole body the
area grows more and the pressure falls more. Pressure is a scalar; written properly **F = PA** with the area as a vector
(its size the area, its direction the outward normal). "চাপ স্কেলার হওয়ার কারণে এর কোনো দিক নেই", which matters most
for liquids and gases (later). Picture চিত্র ৫.০১: a boy pushes a big stone with one hand, two hands, his whole body;
caption "কতটুকু জায়গায় বল প্রয়োগ করা হচ্ছে তার উপরে চাপ নির্ভর করে।"

## The owner's request (2026-10-31)
"take reference from this image but very beautifully, don't use white background or green background but vivid color
with proper arrow and proper mechanism and maybe sometimes a bit zooming in to show the mechanism very very properly
with the context from the book aligning." The reference: a high heel and a flat sneaker side by side, red arrows down
on the ground (few at the heel, many under the sneaker), HIGH PRESSURE / LOW PRESSURE: the same weight on a smaller
area gives a higher pressure.

## The one idea to teach
The same force on a smaller area gives a bigger pressure: P = F/A (in N/m² = Pa). Seen as a shoe sinking into soft clay:
the heel (50 cm²) four times as deep as the sneaker (200 cm²) under the same force.

## Design
- A village yard of soft red clay after rain (a turquoise wall with a yellow band, a blue door, magenta bougainvillea,
  pots of marigolds, a puddle, a blue sky; no white or green page). The owner asked on 2026-10-31 for something other
  than sand-coloured ground (and not grass) and chose red clay over a blue foam mat or purple play sand. Two
  lower legs, the same force F on each: a glossy cobalt pump with a pointed toe and a slim heel (a woman in a magenta
  salwar with a golden border, down to the ankle) touching the clay with the front of the sole and the heel's tip,
  50 cm²; a white sneaker with a yellow stripe, navy trim and criss-cross laces (a man in blue jeans down over its
  collar), 200 cm². The clothes come down to the ankles so no leg-to-foot join shows (the owner found the first feet
  "very bad", 2026-10-31); shoes and feet are smooth ring bodies (src/surface.js), the sneaker's panels a texture.
  The cut face shows red topsoil over yellow, grey and blue-grey clay with pale streaks (since the polish pass:
  cooler tones under the topsoil, so the red arrows stand out).
- The clay in front is dug away along the line through the middle of both soles ("সামনের মাটি কেটে সরানো"), so the cut
  face shows thin light layers bending down under each shoe and darker packed clay: deep and narrow under the heel,
  shallow and wide under the sneaker. That is the mechanism the owner asked to see.
- Arrows drawn over the scene, flat colour in a white outline (as in `hanging-weight-pull`): F purple (book-notes:
  weight's colour) down each leg, equal for both shoes; the pressure as red arrows down from each sole on the cut face,
  evenly spread, **length ∝ P** ("লাল তীর যত লম্বা, চাপ তত বেশি"); the area A as a teal line on the cut face under each sole
  and a teal fill in each print after lifting.
- One action, one result, one rule: ① নরম মাটিতে দাঁড়াও (the feet come down and sink in; the first time the camera goes close
  to the heel, then the sneaker, then back) → ② পা তুলে ছাপ দেখো (the prints stay: গভীর ছাপ, অগভীর ছাপ, each with A) →
  আবার দাঁড়াও. The row of words is the camera: দুটো জুতা, হিলের নিচে, কেডসের নিচে.
- The formula: a stepper for F (100–800 N), P = F/A with each symbol a button (its arrows or area pulse), and the sum
  for each shoe with the student's numbers, the area in m² as the book's unit wants (৫০ cm² = ০.০০৫ m²), the result in Pa
  with Bangladeshi commas (১,০০,০০০). The result line says the ratio (৪ গুণ) or, close up, each shoe's P.
- The rule grows in the book's words: সমান পরিমাণ বল … চাপ কিন্তু হবে ভিন্ন → P = F/A, less area more pressure (with the
  cm² → m² conversion) → বল প্রয়োগকারী ক্ষেত্রফল বেশি হলে চাপ কম → বল দ্বিগুণ হলে চাপ দ্বিগুণ, ক্ষেত্রফল দ্বিগুণ হলে চাপ অর্ধেক
  → the unit N/m² or Pa, and pressure is a scalar (the red arrows only show where on the clay how much).
- Changing F while they stand or after lifting: they stand again on smooth clay (clay does not spring back, so a smaller
  force on the old prints would lie).
- Test: the heel's P from F and A on the picture (mistakes: the sneaker's area, cm² not converted, F × A); F = PA for the
  sneaker (P ÷ A, cm², the heel's area); the book's stone with two hands (অর্ধেক; দ্বিগুণ, একই, চার গুণ); why the heel's
  print is deeper (more force? the sneaker's area smaller? softer clay?); the unit (N, N m, m²).

## Terms (as in the book)
চাপ, বল, ক্ষেত্রফল, বল প্রয়োগ, বল প্রয়োগকারী ক্ষেত্রফল, দ্বিগুণ, অর্ধেক, একক, প্যাসকেল (Pa), N/m², স্কেলার রাশি, দিক.
The page writes উপর. Scene words not on the page: হিল জুতা, কেডস, নরম মাটি, ছাপ, গভীর, অগভীর.

## Open questions
- The sinking depth (5.5 cm at 1,60,000 Pa, in proportion to P) is a picture, not data about real clay; the figure
  shows no depth numbers. Arrow length is in proportion to P (10 cm per 1,00,000 Pa); the arrows are spread evenly
  along each sole's middle line, so their count is not the area.
- The heel's 50 cm² treats the pressure as even over the front of the sole and the heel's tip (P = F/A is the average);
  a real heel's tip carries more than its share. Kept simple on purpose.
- The book's own picture (a stone pushed with one hand, two hands, the whole body) appears only in the test's third
  question and the rule's "ক্ষেত্রফল দ্বিগুণ হলে চাপ অর্ধেক"; the owner asked for the shoes.
- The dimension [P] = ML⁻¹T⁻² is not shown (one idea per figure).

## Polish pass (2026-11-01)

The standard in `docs/agents/polish-pass.md`. Version 0.3.0.

- **Layout.** The kit's layout is unchanged: the 3D on top and the panel below, and beside it only in short, wide frames.
  On phones the formula is tighter: F and its stepper sit on one row with P = F / A written on one line. The stepper's
  name moved into its tooltip and the buttons' labels. The rule keeps to two lines and the test's questions are
  shorter. The 3D view now gets 383 of 700 px (55 %; it was 309 px) and 278 of 500 px at 800×500 (it was 241 px). The
  panel keeps the same height in every state and in both languages.
- **Text on the 3D view.** The two notes are now in the result line: "সামনের মাটি কেটে সরানো" before the feet stand, and
  "লাল তীর যত লম্বা, চাপ তত বেশি" while they sink and after ("হিলের নিচে চাপ ৪ গুণ: লাল তীরও ৪ গুণ লম্বা"). This also
  fixes a bug where the arrow note covered the heel's P label at 390×700. Only the labels with values stay on the view
  (F, P, A, গভীর/অগভীর ছাপ). Their text is a little darker than the arrows (P #c92a2a, A #0b7a8a), so it reads at 4.5:1
  or more on the white chips.
- **Colour.** Under the red topsoil the cut face is now yellow, grey and blue-grey clay instead of orange-brown, so
  the red pressure arrows (still outlined in white) stand out from what is behind them. The yard, the wall and the
  sky are unchanged.
- **Smooth.** The clay used to be re-shaped on the CPU every frame while the feet sank: 50,000 vertices moved, normals
  recomputed and re-uploaded each frame. Now each vertex's dent per centimetre of sinking (and its slope, for the
  normals) is worked out once, and the vertex shader scales it by how deep each foot is. Sinking only changes one
  uniform. The cut face's layers are drawn per pixel from each point's depth before it moved, so the thin pale streaks
  stay sharp on a coarser grid (about 45 rows instead of 110). The fine grid covers only the patch where the soles
  press. A coarse yard surrounds it: before, the 3 mm columns ran to the wall as hair-thin slivers, which software 3D
  draws slowly. The big matte surfaces (clay, cut face, yard, wall) are lit by a constant fill instead of sampling the
  environment map per pixel, and the clay's grain has no anisotropic filtering. Both looked the same and were the
  dearest part of a frame. Shadows are PCF 1024 in a box fitted to the feet and the legs' shadows, instead of VSM 2048
  (VSM drew all of the clay into the shadow map too). The scenery behind is merged into one matte mesh and one glazed
  mesh. The eyelets, the laces, the foot and leg, and the heel's post and edge are each one mesh. Segment counts on the
  shoes and clothes are about a third lower. The 13 pressure arrows and the 2 force arrows are two instanced sets
  (8 draw calls instead of 60). The tour's pauses are timers, not tweens, so a still camera draws no frames.
- **Bugs.** The arrow note covered the heel's P label at 390×700 (fixed: the note is in the panel now). The panel grew in
  English (fixed: shorter lines).

| headless Chromium, software GL, shadows on | before | after |
|---|---|---|
| draw calls avg / max (390×700) | 146 / 168 | 64 / 86 |
| triangles max | 467k | 202k |
| texture memory | 57.5 MB (largest 2048) | 17.5 MB (largest 1024) |
| time to ready (busy machine) | 2.0–2.5 s | 1.9 s |
| one frame of a camera flight (1024×640, shadows off) | about 0.4 s | about 0.12 s |
| text on the 3D view | 22 characters in 1 box (+ the arrow note) | 0 |
