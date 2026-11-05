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
- **Three steps, each built one tap at a time.**
  1. প্রতিবিম্ব (camera: the two mirrors, then wider as images appear): x′ in M₁ with its ray and d₁ before and behind it → x′ in
     M₂ with d₂ → the student drags the candle (x from −7 to +7 cm, whole cm) and every image follows.
  2. তার প্রতিবিম্ব: "x′ এখন বস্তু": the x′ behind M₂ is an object for M₁, so x″ forms d₃ behind M₁, then the same the other way,
     then x‴ at d₄: this is the whole of চিত্র ৮.০৪, and the poster.
  3. অসংখ্য: the row runs off both edges → the camera flies into M₁ and the same images are seen as a real pair of mirrors shows
     them, with the light left in x′, x″, x‴ (about 90 %, 81 %, 73 %).
  The newest thing glows amber and its label is highlighted, as in `plane-mirror-image`. A tap on any named image traces its
  light and says the chain ("x″: M₂ থেকে M₁, ২ বার"). The action's numbered ring sits on what it is about.
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
- **The test** (numbers only: the kit's quiz compares `Math.abs(choice − expected)`, so strings can never score; a browser test
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

## Numbers (844×390, shadows on, one counted frame)
The book's row: 61 draw calls, 79k triangles. The whole row: 81 draw calls, 68k triangles. Looking into M₁: 82 draw calls,
54k triangles. Ready in about 3 s, GLB about 200 KB. Idle, after 8 s: nothing is drawn.

## Open questions
- The book's picture prints capitals (X, X′), its caption small letters (x, x′); the figure follows the caption and the brief.
- The book names the images on both sides x′, x″; the figure does too, and the panel says which mirror.
- The book's picture has no name for the distance of the left x″ from M₂; the figure shows it as a number while it is new.
- 90 % per reflection is mine, not the book's.
- The action words say ডান and বাম আয়না, not M₁ and M₂: the kit writes them as plain text and the bundled font has no subscripts.
- The 90° mirrors of চিত্র ৮.১৫ and ৮.২৬ are left out: the owner made them optional and they are another idea (left and right).
  They would suit a figure of their own.
- A person's wording check of the Bangla against the book.
