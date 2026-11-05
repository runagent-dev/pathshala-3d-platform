# Notes: Images in two mirrors (দুটি আয়নায় প্রতিবিম্ব)

Book: physics-9-10 › 8.2.1 › p216, the উদাহরণ that starts on p215, চিত্র ৮.০৪. Page images are in `reference/`.

## What the page shows
- p215: "প্রশ্ন: ৮.০৪ চিত্রে দেখানো অবস্থায় দুটি আয়না M₁ এবং M₂ রাখা আছে। মাঝখানে x বিন্দুতে একটি মোমবাতি রাখা হয়েছে। মোমবাতির প্রতিবিম্ব কোথায় হবে?"
- p216: "উত্তর: আয়নায় প্রতিবিম্ব দেখা যাবে। সেই প্রতিবিম্বের প্রতিবিম্বটিও আয়না দুটিতে দেখা যাবে, এভাবে চলতেই থাকবে। কাজেই ৮.০৪ চিত্রে যেভাবে দেখানো হয়েছে, সেভাবে অসংখ্য প্রতিবিম্ব দেখা যাবে।"
- চিত্র ৮.০৪: M₂ left, M₁ right, the candle X near M₁. d₁ from X to M₁ and from M₁ to the X′ behind it; d₂ the same for M₂. d₃ from the X′ behind M₂ to M₁, and from M₁ to the X″ behind it. d₄ from the X″ behind M₂ to M₁, and from M₁ to the X‴ behind it. So the page names an image by how many reflections made it, on each side.

## The one idea
Each mirror makes an image of the candle and also of the other mirror's images, so two parallel mirrors give an endless row
of images at exact, predictable places, each one reflection dimmer.

## The owner's direction (2026-11-05)
"A separate 3D like the book's picture (চিত্র ৮.০৪)": realistic, beautiful and clean, rays and labels in the clean line style
of the sister figures. Keep to the book's picture: the candle x between M₂ and M₁, the images x′, x″, x‴ … in a row on both
sides, d₁ d₂ d₃ d₄. The 90° part is optional and is left out (below). Then the chapter's standing rule: a real three-quarter
angle, a camera per step with smooth zooms, one element at a time, labels never dropped.

## How it works
- **Ten beats, one tap each, in six steps (0.3.0).** The owner, on the crowded row: "It is fine but too complex. How can we start
  a bit easily … then gradually show everything properly?" `reading.js` lists the beats (`imagesAt`, `barsAt`, `beatOf`, `stepOfBeat`).
  1. একটি আয়না: the candle and M₁ alone → x′ fades in with d₁ before and behind it. The frame holds only these; the candle can be dragged.
  2. দ্বিতীয় আয়না: M₂ slides in from the left (2.5 s) → its x′ and d₂; d₁ goes faint.
  3. তার প্রতিবিম্ব: the right x′ glows, "এই x′ এখন বস্তু" → x″ on the left → the next tap traces one ray, stretch by stretch (1.2 s
     each, candle → M₁ → M₂ → eye), then the dashes back to x″.
  4. আরও একবার: the left x′ is an object → x″ on the right with d₃ → the left x″ is an object → x‴ with d₄.
  5. অসংখ্য: the distances fade, the row fades in one image every 0.6 s → the camera flies into M₁.
  6. বইয়ের ছবি: the camera comes out to the book's whole picture, with all of d₁–d₄ at full strength. Only then the action offers the test.
  Pace (the owner's rule): camera 1.8 s or more, objects 2–3 s, about 1 s of glow before an image comes from an object, and every beat ends
  by waiting. Taps do nothing while one plays. A step's word, or the quiet ↺, replays that step slowly from its start. The test's
  own flights stay 0.5 s: a question should not keep a student waiting.
  The newest thing glows amber and its label is highlighted, as in `plane-mirror-image`. A tap on any named image traces its
  light, stretch by stretch, and says the chain ("x″: M₂ থেকে M₁, ২ বার"). The action's numbered ring sits on what it is about.
- **The words open as the student goes:** the steps finished and the one after them. A later word is dim and does nothing except make the
  action pulse, so one tap can never jump to the crowded picture. Finished steps still replay. `step` and `stage` in the URL go anywhere
  and count as reached. Since 0.3.0 `step` takes `one`, `two`, `image`, `again`, `many`, `book` (was `first`, `second`, `many`).
- **Only the newest pair of distances is at full strength**; older ones are faint (about 30 %), and only the book's picture has them all.
  From step 4 on a faint pair keeps its line, not its name (a phone had eight grey boxes there), and "এই x″ এখন বস্তু" leaves with the glow.
  With the view turned end-on along the row, a distance too short to carry its name loses it.
- **The frame** takes in an image's whole range up to step 3, so the view stands still while the candle is dragged. From step 4 on it takes in
  where the images stand now, because they need every pixel of a phone, and the view follows the drag a little. Step 3 stands at −12°, so
  that the right x′ stands clear of M₁ and the candle even at x = 7.
- **The candle's handle** is the chapter's visible handle: a white disc with a thin dark ring and ↔ arrows, a faint dashed track
  with its ends marked, "টেনে সরাও" and a gentle pulse until the first drag, a smaller disc after that, hidden in the test. On a wide
  view the table is thin on the screen, so handle and track step down until they clear the candle's foot. Its arrows follow the row
  on the screen, so from behind or from the side the drag still follows the finger. It dims while a step plays, and does not vanish.
- **The view turns all the way round** (no azimuth limit, polar 5°–88°, zoom 0.45–1.6 of the guided distance, damping on). OrbitControls
  starts on the finger going down, so only 8 px of movement counts as taking the view: a tap leaves it alone. A dark pill in the corner
  (⟲ ৩৬০° ঘুরিয়ে দেখো) keeps its words until the first turn, then stays as ⟲ ৩৬০°; it looks nothing like the white disc on the candle.
  The next step, or the "সামনে" button (a target and the word: the kit's is a circular arrow, so the figure replaces its inside, until
  the kit changes), flies back round the scene, not through it. The one exception is the view into M₁: the camera stands between the
  mirrors and looks through M₁, and beyond that glass this view has nothing to show, so there it keeps to M₂'s side (azimuth −115° to
  −58°, every frame has images) and does not zoom, and the pill says ⟲ একটু ঘুরিয়ে দেখো instead of ৩৬০°.
- **Icons do not look alike:** ⟲ with ৩৬০° turns the view, the target with সামনে goes back to the front, ▶ replays a step. The figure has no plain ↺.
- **Images are exact.** `reading.js` reflects the candle in a chain of mirrors. An image in the scene is the same geometry moved
  there, with `scale.x = −1` for an odd number of reflections, so its handle and drips are mirrored too. Same clock, same
  flicker: every flame moves together.
- **Rays are traced** (`path` in `reading.js`): aimed by unfolding the chain, then reflected with r = d − 2(d·n)n at each mirror;
  θi = θr, the miss at the eye, and the miss at the image's flame are read back from the vectors. They lie in the plane of the
  picture, z = 0, rising in a shallow zigzag to an eye over the top of the nearer mirror, where the book would draw them. The unit
  tests check, at every candle position and every named image, that the ray lands on the glass and clears the nearer mirror.
  That is why the candle range and the eye are what they are; images past x‴ have no ray (it would miss the glass from that eye).
- **The view into M₁** uses those same images, solid, at the same places, with no render to texture. Through M₁ the world behind
  it is a row of slabs, one reflection each; the far end of each slab is a picture of a mirror, a window into the next. Each
  image and frame is clipped to the windows in front of it, with four planes through the camera (rectangles in parallel
  planes meet in a rectangle). A dark quad of 10 % on each window does the dimming, so what is behind two windows really gets
  81 %. Six slabs, then the last window fades into the backdrop.
- **The test** (unchanged by the new steps; numbers only: the kit's quiz compares `Math.abs(choice − expected)`, so strings can never score; a browser test
  answers all five right and checks ৫ টির মধ্যে ৫ টি): x to x′, a count of reflections read off the row, a mark on the table for
  x″, d₄ from d₁ and d₂, and, in the view into the mirror, which of four marked images has the least light. `get` carries the
  current question's kind and right answer for that test.
- **The drawing** follows `reflection-laws`: a 2D canvas over the view, painted from exact 3D points through the camera.
- **The flame** is painted in a shader on a card facing the camera, and it casts the only flame light, only from the real candle:
  no real light comes from an image. An image's flame is smaller and dimmer than the real one. The flicker runs at about 16
  frames a second and rests 8 s after the last touch or change, so a figure left open draws nothing; a touch, key or change
  wakes it.
- **Far candles are plain** (`farCandleGeometry`: no handle, no drips, one draw). From x⁗ on always, and x‴ too in the view of
  the whole row, where it is about 20 px tall; x‴ keeps its detail in the book's row and in the mirror, where it is large.

## Honest simplifications
- The images stand on the table beyond the mirrors, faded: that is where they seem to be, not where anything is. From the main
  view a real mirror would not show them in the glass (the angle is too steep), so the glass shows a soft painted sheen; the
  view into M₁ shows the true look.
- The ghosts stand at 44 %, the chapter's translucent ghost, and fade a little faster along the row than the true 90 % (86 %
  drawn), so that a phone shows the step; the panel says so. The view into M₁ and the numbers use 90 %, a round figure for a
  silvered glass mirror; the book gives none, so the wording says "প্রায়".
- A ray is one of countless (a note in the corner says so).
- The glass is drawn 6 mm thick so that its green edge reads on a phone. The reflecting plane is its silver back.
- The viewer's own head would be in a real mirror; the view leaves it out. The camera there sits at the edge of M₂.
- Mirrors and table are bigger than life relative to nothing in particular: the gap is 30 cm, the candle 23 cm with its flame.

## Terms (as in the book)
আয়না, প্রতিবিম্ব, প্রতিবিম্বের প্রতিবিম্ব, অসংখ্য প্রতিবিম্ব, মোমবাতি, M₁, M₂, x, x′, x″, x‴, d₁ d₂ d₃ d₄, প্রতিফলন. Added: সমান্তরাল (the caption's),
"বস্তু" for an image acting as an object, ম্লান for dim, অবাস্তব প্রতিবিম্ব (from p220).

## Numbers (844×390, shadows on, one counted frame with the shadow pass, at the guided view and from eight azimuths)
Worst draw calls: 84, looking into M₁ at −90°. Worst triangles: 79k, the book's picture. The row: 81 draw calls, 68k triangles at 90°. One
mirror: 26 draw calls, 24k triangles. Ready in about 3 s, GLB about 200 KB. Idle, after 8 s: nothing is drawn, also after a turn.
The backs cost nothing new: each mirror's silvered back was already a box, and the two sides share their materials.

## Open questions
- The book's picture prints capitals (X, X′), its caption small letters (x, x′); the figure follows the caption and the brief.
- The book names the images on both sides x′, x″; the figure does too, and the panel says which mirror.
- **d₃ in step 3.** The brief for 0.3.0 asked for the left x″ with "its bar d₃ (… measured as the book does)". The book measures d₃ from M₁:
  from the left x′ to M₁, and from M₁ to the right x″. The left x″ is 45 − x from M₂, which is d₃ only for x = 0, so calling
  that bar d₃ would give d₃ two values (40 cm, then 50 cm). So step 3 shows that bar as a plain number, and the book's d₃ comes in step 4,
  when the right x″ it ends at appears, with d₄ next. If the owner wants d₃ in step 3, the fix is to swap the sides of step 3.
- 90 % per reflection is mine, not the book's.
- The action words say ডান and বাম আয়না, not M₁ and M₂: the kit writes them as plain text and the bundled font has no subscripts.
- The 90° mirrors of চিত্র ৮.১৫ and ৮.২৬ are left out: the owner made them optional and they are another idea (left and right).
  They would suit a figure of their own.
- A person's wording check of the Bangla against the book.
