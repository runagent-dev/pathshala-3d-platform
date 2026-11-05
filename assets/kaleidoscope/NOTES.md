# Notes: Kaleidoscope (ক্যালাইডোস্কোপ)

Book: physics-9-10 › 8.3.1 › the নিজে করো that starts on p220 (চিত্র ৮.১১) and runs on p221, and the উদাহরণ on p222 (চিত্র ৮.১৩). Page
images are in `reference/`.

## What the page shows
- p220, চিত্র ৮.১১: "তিন টুকরা কাচ দিয়ে ক্যালাইডোস্কোপ তৈরি করা যায়।": three strips of glass, a paper-wrapped triangular tube with two
  bits of blue tape, a girl looking in, a small triangle of pattern.
- p221: "এক মাপের তিনটি কাচের টুকরো নাও … তিনটি কাচের টুকরো ত্রিভুজাকৃতিভাবে রেখে (চিত্র ৮.১১) কাগজ দিয়ে কয়েকবার পেঁচিয়ে নাও … এক পাশে
  পাতলা কাগজ দিয়ে ঢেকে দাও। এবারে ভেতরে একটা দুটো রঙিন পাথর, পুঁতি, ভাঙা কাচের চুড়ি ইত্যাদি রেখে অন্য পাশ দিয়ে দেখো। তুমি অপূর্ব নকশা দেখতে
  পাবে। … চোখে লাগিয়ে রেখে এটা ঘোরাও তাহলে নকশাটিকে নড়তে দেখবে। কাচ থেকে প্রতিফলনের প্রতিফলন এবং তার প্রতিফলনের কারণে এটা ঘটে। তোমাদের
  মনে হতে পারে সাধারণ স্বচ্ছ কাচে প্রতিফলন বুঝি হয় খুব কম; কিন্তু ক্যালাইডোস্কোপ কাচ ঘেঁষে দেখা হয়, যেখানে আপাতন কোণ অনেক বেশি তাই
  প্রতিফলনটুকু অনেক বেশি।"
- p222: "দুটি সমতল আয়না পরস্পরের সাথে 60° কোণে রাখা আছে (চিত্র ৮.১৩)। প্রথম আয়নায় 60° তে আলো ফেলা হলে আলোক রশ্মি কোন দিকে যাবে? উত্তর:
  জ্যামিতি থেকে বলা যায় রশ্মিটি B বিন্দুতে আপতিত হবে এবং ঠিক বিপরীত দিকে প্রতিফলিত হবে।" The picture: 60° at the normal on A, 30° with
  the mirror, 60° at the corner.

## The one idea
Three strips of glass at 60° reflect a few pieces again and again, reflections of reflections, so they fill the view with a
six-fold pattern that moves when the tube turns. Plain glass can do it because the eye looks at it at a grazing angle.

## How it works
- **Four steps, one tap at a time.**
  1. নকশা: the tube from outside, one side's paper left off so that the strips and pieces show → the camera flies to the eye and the
     pattern fills the view (a real 3D flight: the tube's real inside, then the reflected cells fade in) → the student turns it
     (a handle on a ring, or a drag anywhere on the view; the action shows a third of a turn) and the pieces roll.
  2. প্রতিফলন: the red stone's light traced in 3D through one, two and three reflections, each with its picture of the cell hanging
     beyond the glass, ringed in that reflection's colour → the cells numbered by reflections in the eye's view; a tap on a cell
     says how many reflections made it.
  3. ঘেঁষে দেখা: one strip standing alone; the eye moves on a path from straight on to grazing, the ray widths are split R : 1 − R and
     the image brightens. 18° gives about 4 %, 83° about 51 %.
  4. দুই আয়না: চিত্র ৮.১৩: light on A at 60°, then B square on, then exactly back; then the student moves the ray box and sees every
     other angle go another way. The rays are traced by the law of reflection, and the panel's |60° − θ| at B is tested against them.
- **The pattern is exact and light.** No shader folding and no render per cell. The far end is rendered once into a small
  target (512 or 1024, by screen; only while the pieces roll, 6 draw calls). The end plane is one mesh of 100 triangles.
  `lattice()` says which corner of the real cell stands at each corner of each cell, so that texture laid on with those corners
  IS the reflected picture, seamless. Cost when still: one draw call and nothing else.
- **The lattice.** With c_j = (r − p·n_j)/3r, the lattice lines are the lines where c_j is whole, and the reflections that make a
  cell are the lines between it and the real cell, Σ|⌊c_j⌋|. So 3n cells have n reflections (3, 6, 9 …; unit-tested). The eye stands
  L/9 = 1.67 cm from the open end, so that it sees the open end blown up exactly 10 times: 100 whole cells.
- **The brightness is computed**, not chosen: each vertex carries the product of the reflectance at every crossing, at that
  ray's own angle of incidence, for a strip with two faces, 2R/(1 + R) with R from Fresnel (n = 1.5).
- **Rays.** `path()` draws the straight line from the eye to the image in the unfolded plane and folds it back. The unit tests
  check at every cell up to 5 reflections that each hit lies on a wall inside the tube and θi = θr in 3D.
- **The pieces** (`beads.js`) are nine round bodies in the triangle under the pull of the Earth as seen from the turning tube,
  in fixed steps, deterministic, with a hard stop so that a figure at rest draws nothing. They are slowed so that the eye can
  follow; a corner note says so.
- **On leaving the eye** the tube squares up to the nearest third of a turn, and the frame is reset (the triangle maps to itself, the
  pieces are turned with it, so nothing jumps).
- **What can be moved shows** (the owner's rule of 2026-11-06, drawn here until the kit's `createDragHandle` lands): a white disc
  with a thin dark ring and arrows along the way it moves (a round arrow for turning), a 44 px hit area, a faint dashed track of its
  range, the word "ঘোরাও" / "টেনে সরাও" and a gentle ring until the first drag, then smaller and calm. Disc and track are on the 2D
  drawing and in the labels' avoid list; the ring and the word are in the page (a CSS animation), so a figure at rest draws nothing.
  Hidden during the test. Keyboard arrows still work and count as a first drag.
- **The test**: count the reflections of a marked cell by the lines crossed; find a piece's image in the next cell (right, too near,
  too far, turned round); how many cells meet at a corner (360° ÷ 60°); which eye sees the brightest or faintest image; the angle at
  B from the angle at A. Numbers only (the kit's quiz compares numbers); a browser test answers all five right.

## Honest simplifications
- The panel's percentages (step 3) are for one surface, as `reflection-amount` shows them; the brightness of the cells uses both
  faces of a strip. That is why the panel gives no percentage for a cell.
- The rays are a few chosen paths of countless, and are drawn visible.
- The pieces are slowed, and treated as round where they touch; a bangle piece can dip past a wall by a hair. The bits of the
  picture are not otherwise drawn bigger or smaller than they are (L = 15 cm, side 4 cm).
- The tube is drawn with the paper left off one side; the book wraps it all round.
- The view is narrower than the eye's own: the whole window (a triangle ten cells wide) would not fit on a phone at a size where
  the pieces can be seen. It is the central part of the true view.
- In step 3 the bead is on a pin, added so that it stands in the plane of the rays. The ray box in step 4 is not in the book.
- The picture of the far end is taken from straight on (orthographic): the pieces lie flat on the paper.

## Open questions for the book team
- p221 writes "আপাতন কোণ"; the rest of the chapter writes "আপতন কোণ", which the figure uses.
- The words the figure adds: ঘর (for a triangle of the pattern), মোড়ক, টিউব (in "টিউবে এই কোণ"), রশ্মি উৎস is avoided.
- The book says "একটা দুটো" pieces; nine are drawn, so that the pattern is rich and the panel says how many are real.
- The mirrors in step 4 stand with the corner away from the viewer, both faces seen: the book's picture turned, not copied.

## Numbers (`perf.mjs`, 844×390, shadows on)
Budget: 150 draw calls, 300 k triangles. Outside view 11 draws, 1.7 k triangles; the pattern 23 draws (with the small picture of the far
end, which is drawn only while the pieces roll), 1.2 k triangles; rays 13 draws, 1.8 k; one strip 16 draws, 2.2 k; two mirrors 24
draws, 2.4 k. Time to ready 2.5–3.9 s on software rendering. At rest nothing is drawn (a browser test counts it).
