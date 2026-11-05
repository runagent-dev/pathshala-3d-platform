# Notes: Image in a convex mirror (উত্তল আয়নায় প্রতিবিম্ব)

Book: physics-9-10 › 8.5.1 › p226 (with p225, p227 and 8.8.2 on p235). Page images in `reference/`.

## What the pages show
- p225: 8.5.1: the back of a spoon shows you small and upright, so a convex mirror's image should always be small.
- p226: the three rays: (i) toward the centre, back along itself; (ii) parallel to the axis, as if from F after reflection; (iii) toward
  F, parallel after reflection. চিত্র ৮.১৯ draws a pencil XY (point up, eraser down), O, F, the image X′Y′, and the rays XN, XP, PQ.
- p227: FP cuts OX at X′, and the perpendicular to OY gives Y′. X′Y′ is always smaller; no real light comes from it, so it is
  virtual. (a) between F and the pole, nearer F as the object goes away; (b) virtual; (c) upright; (d) smaller.
- p235: 8.8.2: a big scene in a small space: rear-view mirrors are convex.

## The one idea to teach
In a convex mirror the reflected rays spread, so they only seem to come from behind it: the image is always virtual, upright and
smaller, between P and F, shrinking toward F as the object goes away; and that is why a small convex mirror shows a wide view.

## Terms (as in the book)
উত্তল আয়না, প্রতিবিম্ব, অবাস্তব, সোজা, ছোট, কেন্দ্রমুখী, প্রধান অক্ষ, সমান্তরাল, ফোকাস বিন্দু (F), মেরু বিন্দু (P), কেন্দ্র O, ফোকাস অভিমুখী, বস্তু XY,
প্রতিবিম্ব X′Y′, লম্ব, রিয়ার ভিউ মিরর. Added by the figure, not on the page: চোখ (the eye), পর্দা in the test (a white screen).

## How the figure works
- The owner's rules for the spherical mirrors: the whole idea from the 3D alone, and one thing per tap. One action through eleven stages
  (`STAGES` in `src/app.js`), the camera on each idea: the pencil and its small upright picture on the silver → the parallel ray (ii) alone →
  its extension to F → ray (i), and O → ray (iii), all three meeting → the image grows up from Y′, "অবাস্তব · সোজা · ছোট" beside it → the pencil
  moves, close on the image, with "ছোট: ৩/৫ গুণ" on it and the object's height as a dashed outline → 1/u + 1/v = 1/f with the student's numbers →
  from the eye, a plane mirror → the same mirror convex, one tap apart → both fields of view from above. `POSE` says what each stage shows;
  `run()` walks any jump in one order. Each move takes 1.5 s or more, with a pause after each step.
- The pencil starts at u = 10 cm, not the book's picture's 15: with F, P and the pencil in view it gives an image of 3.6 cm, 41 px tall at 390×700.
- **What is seen in the mirror is traced for every pixel** (`src/mirror.js`): the silver's shader reflects the line of sight in the exact
  sphere and asks what it meets (the pencil and rod, the posts, the rail, the table). So the little upright pencil of the first step and
  the row in the rear-view stages are exactly right for any eye. No render-to-texture, one short loop on one small dish.
- The rays are traced with r = d − 2(d·n)n on the exact sphere (`src/reading.js`) and drawn as vector lines on a 2D canvas over the view
  (`src/rays.js`), in the sister figure's style. The image comes from the book's 1/u + 1/v = 1/f, f = −15 cm. The unit test
  (`test/unit/convex-mirror-image.test.mjs`) shows that the traced lines pass within 0.2 cm of that X′ for every u from 4 to 75 (the small
  difference is the sphere's own aberration: a parallel ray 6 cm from the axis crosses at 14.7 cm).
- Each ray is named on itself in its own step, in the book's words with what it does; the others keep a badge (i), (ii), (iii).
- The parallel ray from X does not change as the pencil slides, so X′ can only move along that one line down to F; that is (a) and (d) together.
- The pencil always shows it can be moved: a ↔ disc on its rod and a dashed track of its range, a "টেনে সরাও" label and a pulse until the first
  drag, then smaller and calm (drawn in the figure to the owner's spec until the kit has `createDragHandle`). Out of view it waits at the edge,
  by the tab that says how far the pencil is. Close on the image, a finger anywhere moves it. Keys ← → too.
- 8.8.2: the eye of the cones and the camera of the eye stages are the same point (x = 66 cm): the camera really stands there. The same
  dish flattens (r = 40 000 cm) into a plane mirror and back. Seven tall posts in seven colours stand behind the eye: 3 in the plane
  mirror, all 7 in the convex one, counted from the traced rim rays (`fieldOf`, `postsSeen`), and ringed in the top view.
- **The bench is the chapter's**, from `spherical-mirror-focus` (PR #358): rail, carriers, ring, dish, clear glass, scale digits. One difference, after the
  review: the silver's brightness comes from a plain pale gradient in its shader instead of the studio environment, whose lamp showed as a white
  streak that a student could take for an image.

## Honest notes
- Only a few rays in one plane, out of countless: "রশ্মি কয়েকটি মাত্র" says so on the view.
- The mirror is drawn large: 20 cm across on a 30 cm radius, as in the sister figures; lab mirrors are smaller.
- The silver is on the front surface, so no refraction in the glass comes into it (the same note as `spherical-mirror-focus`).
- The ghost pencil X′Y′ is drawn through the mirror: it is where the image seems to be, not a thing that stands behind it.
- A convex mirror images depth less than height; the ghost is scaled by m in all directions (a pencil is thin, so it does not show).
- The pale room in the silver is invented; the table, rail, rod, posts and pencil in it are real traces. A far pencil in the mirror is kept at
  least 1.5 px wide, so that it does not vanish.
- Once the ghost is drawn, the pencil is no longer traced in the silver: from the side both would show the one image, in two places.
- The row of posts is not in the book; the posts stand behind the eye and are much thicker than anything on a real bench, so that they read.

## Measured (844×390, software rendering, `scripts/.perf-tmp.mjs`)
At most 32 draw calls and 19k triangles (the top view, with the row of seven posts). GLB about 400 KB.

## Open questions for the book team
- **Letters:** চিত্র ৮.১৯ calls the pole R and uses P for the point where the parallel ray lands, while p227 and the chapter's other figures say
  মেরু বিন্দু (and চিত্র ৮.১৮ calls the pole X). This figure follows the chapter decision: P is the pole. The panel therefore describes the rays in words,
  without the book's XN, XP, PQ. Which should it be?
- **The caption of চিত্র ৮.১৯** says XY is "ফোকাস দূরত্বের ভেতরে", but the drawing puts it outside the focal distance, and the result holds anywhere.
  The caption is not quoted.
- p225 prints "আপাতন" for আপতন (the figure does not use the word).
- The book's (iii) writes "ফোকাস অভিমুখী"; the button uses the same.
