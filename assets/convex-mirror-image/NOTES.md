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
- One action through nine stages (`STAGES` in `src/app.js`): the pencil seen in the silver → ray (i) → ray (ii) → ray (iii) → the image grows
  up from Y′ → the pencil moves → from the eye, a plane mirror → the same mirror goes convex → both fields of view from above. `POSE` says
  what each stage shows; `run()` walks any jump in one order (what must go, the bench, then the light). The words দেখা · তিন রশ্মি ·
  দূরে–কাছে · রিয়ার ভিউ jump.
- **What is seen in the mirror is traced for every pixel** (`src/mirror.js`): the silver's shader reflects the line of sight in the exact
  sphere and asks what it meets (pencils, the rod, the bar, the rail, the table). So the little upright pencil on the first step, and
  the row in the rear-view stages, are exactly right for any eye. No render-to-texture, one short loop on one small dish.
- The rays are traced with r = d − 2(d·n)n on the exact sphere (`src/reading.js`) and drawn as vector lines on a 2D canvas over the view
  (`src/rays.js`), in the sister figure's style. The image comes from the book's 1/u + 1/v = 1/f, f = −15 cm. The unit test
  (`test/unit/convex-mirror-image.test.mjs`) shows that the traced lines pass within 0.08 cm of that X′ at u = 15, and within 0.2 cm for
  every u from 4 to 75 (the small difference is the sphere's own aberration: a parallel ray 6 cm from the axis crosses at 14.7 cm).
- The insight in the panel: the parallel ray from X does not change as the pencil slides, so X′ can only move along that one line
  down to F; that is (a) and (d) together. The panel's small live drawing (`zone()` in `app.js`) shows that line large, from P to F.
- 8.8.2: the eye of the cones and the camera of the eye stages are the same point (x = 66 cm): the camera really stands there. The same
  dish flattens (r = 40 000 cm) into a plane mirror and back. Seen: 3 of 7 pencils in the plane mirror, all 7 in the convex one,
  counted from the traced rim rays (`fieldOf`, `pencilsSeen`).
- The camera goes to each thing (`FRAMES` in `src/bench.js`): round to the mirror's face, side-on to the plane of the rays, close on the
  image, low along the rail, at the eye, above the bench. The pencil, the source of all the rays, is always in view; past 26 cm (the
  first step) or 24 cm (the close-up) a tab at the view's edge says where it is.
- **The bench is the chapter's**, copied from `spherical-mirror-focus` at its round 2 (PR #358): bright silver with its own
  studio environment, clear glass, larger scale digits, frames that fit the view's aspect. The pencil stands where its ray box stood.

## Honest notes
- Three rays in one plane out of countless. "তিনটি রশ্মি আঁকা" says so on the view.
- The mirror is drawn large: 20 cm across on a 30 cm radius, as in the sister figures; lab mirrors are smaller.
- The silver is on the front surface, so no refraction in the glass comes into it (the same note as `spherical-mirror-focus`).
- The ghost pencil X′Y′ is drawn through the mirror: it is where the image seems to be, not a thing that stands behind it.
- A convex mirror images depth less than height; the ghost is scaled by m in all directions (a pencil is thin, so it does not show).
- The brightness of the silver comes from a studio environment, not from the slate room around it, as in the sister figure. The table, rail, rod, bar
  and pencils in it are real traces; a far pencil in the mirror is kept at least 1.5 px wide, so that it does not vanish.
- The row of pencils sits behind the eye on a cross bar; the row is not in the book.
- Once the ghost X′Y′ is drawn, the pencil is no longer traced in the silver: from the side both would show the one image, in two places.

## Measured (844×390, software rendering, `scripts/.perf-tmp.mjs`)
At most 44 draw calls and 24k triangles (the top view, with the row of seven pencils); ready in about 3 s. GLB 397 KB.

## Open questions for the book team
- **Letters:** চিত্র ৮.১৯ calls the pole R and uses P for the point where the parallel ray lands, while p227 and the chapter's other figures say
  মেরু বিন্দু (and চিত্র ৮.১৮ calls the pole X). This figure follows the chapter decision: P is the pole. The panel therefore describes the rays in words,
  without the book's XN, XP, PQ. Which should it be?
- **The caption of চিত্র ৮.১৯** says XY is "ফোকাস দূরত্বের ভেতরে", but the drawing puts it outside the focal distance, and the result holds anywhere.
  The caption is not quoted.
- p225 prints "আপাতন" for আপতন (the figure does not use the word).
- The book's (iii) writes "ফোকাস অভিমুখী"; the button uses the same.
