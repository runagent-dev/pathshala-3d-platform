# Notes: Spherical mirrors and their focus (গোলীয় আয়না ও ফোকাস)

Book: physics-9-10 › 8.4 › p223 (with 8.5 pp 224–225, 8.6 p228, 8.8.3 p235). Page images in `reference/`.

## What the pages show
- p223: 8.4 গোলীয় আয়না: a shiny spoon shows the idea; a piece cut from a hollow sphere, coated with silver or aluminium; which
  surface is coated decides concave or convex. চিত্র ৮.১৬: the back of a spoon.
- p224–225: 8.5 উত্তল আয়না: parallel light spreads and, extended behind, seems to come from one point, the focus. চিত্র ৮.১৭ and the
  "proof" with চিত্র ৮.১৮: f = r/2 "only nearly" (FY ≅ FX when XY is much smaller than r). A plane mirror has f = অসীম.
- p228: 8.6: parallel light on a concave mirror meets at one point (চিত্র ৮.২১); অভিসারী before F, অপসারী after it.
- p235: 8.8.3: a source at F gives a parallel beam (চিত্র ৮.২৭): searchlight, torch.

## The one idea to teach
A spherical mirror is a silvered piece of a hollow sphere of radius r; parallel light reflected by a concave mirror meets at F,
from a convex mirror it spreads as if from F behind it, with f = r/2 (very nearly, for rays near the axis); turned round, a bulb
at the concave mirror's F gives a parallel beam.

## Terms (as in the book)
গোলীয় আয়না, অবতল, উত্তল, ফাঁপা গোলক, রুপা বা অ্যালুমিনিয়ামের প্রলেপ, সমান্তরাল আলো, ফোকাস বিন্দু (F), মেরু বিন্দু (P), ফোকাস দূরত্ব (f),
ব্যাসার্ধ (r), কেন্দ্র O, প্রধান অক্ষ, অভিসারী, অপসারী, অসীম, সমান্তরাল বিম, টর্চলাইট, সার্চলাইট. (The book's p225 spells আপাতন; the
figure does not use that word.) Added by the figure, not on the page: আলোর বাক্স (ray box), স্কেল, বাল্ব (the page has বাল্বটি).

## How the figure works
- Eight taps, one action: cut a piece from the sphere → coat its inner surface (it then goes down to the holder on the bench) →
  parallel light → measure f and r (the four r words live here, and on the convex measure) → widen the light → coat the outer
  surface (the dish makes a half turn on its pins) → extend the rays behind → a bulb at F, which the student then moves off F
  and back (by the action, by drag, or by the left/right keys).
- The words গোলক · অবতল · উত্তল · টর্চ jump. `src/app.js` has one table, `POSE`, of what each stage shows, and one function, `run()`,
  which walks any jump in the same order: the light goes, the measures go, the piece moves, the mirror turns, then the light comes.
- The camera goes to each thing (`FRAMES` in `src/bench.js`, fitted to the stage with `fitPose`): the sphere, the whole bench, the mirror
  and F, the printed scale, close on F for the wide bundle, behind the mirror for the convex F.
- Rays are traced on the exact sphere with r = d − 2(d·n)n (`src/reading.js`, unit-tested in `test/unit/spherical-mirror-focus.test.mjs`).
  Nothing uses f = r/2 to place a ray: the rays find F. They are drawn as vector lines on a 2D canvas over the view
  (`src/rays.js`), like the sister figures. F, O and P are marks on the axis with a drop to their number on the printed scale.
- **The bench is the chapter's (`src/bench.js`, `src/mirror.js`), for `convex-mirror-image` and `concave-mirror-image` to copy**: slate
  wall and table; anodised rail with a sloping front carrying the printed scale (two rows of one 1024 × 256 texture: 0 at the
  mirror, counting away on both sides, unsigned; "behind" is said in words); black carriers with a thumb screw and brass
  pointer; a ring on a post; the dish on two pins. Axis height 19 cm, rail top 3.2 cm, mirror half-width 10 cm.
- The dish is one object with two faces, each the exact sphere of radius r, rewritten in place when r changes. The silver is a
  second drawing of a face whose triangles run from the middle out: more of them drawn = the coat spreading.

## Honest notes
- Only five rays in one plane are drawn, out of countless. "কয়েকটি রশ্মি আঁকা" says so on the view.
- The mirror is drawn large: 20 cm across on a 20–60 cm radius; lab mirrors are smaller. It is what makes the rim rays of the wide
  bundle show the book's "কাছাকাছি" (for r = 30: the near rays cross at 14.9 cm, the rim rays at 14.2 cm).
- The coat is on the surface that reflects (front-surface silver, as in telescope mirrors), so that no refraction in the glass
  comes into it. The chapter's plane mirrors have the silver on the back of the glass, like household ones. The book says only
  that the coat decides the kind (p223) and which surface reflects (p228).
- The hollow sphere floats above the bench in the first step ("কল্পনা"): a sphere of radius 30 cm round the axis would go through the
  rail. On the bench its circle is a dotted line in the plane of the rays.
- A spherical mirror does not give an exactly parallel beam: at the rim of the bulb's light (8 cm from the axis, r = 30) the ray is
  about 1° off. The figure shows it as traced; real torches use a parabola, which the book does not mention (not in the panel).
- The bulb's direct light (the part not going to the mirror) is not drawn.
- The r words are four mirrors (other spheres), not one mirror bending, though the picture glides between them.

## Open questions
- p225 has "আপাতন কোণ" for আপতন কোণ (a misprint?).
- p224 and p228 give the plane mirror's f as অসীম for "উত্তল" and "অবতল" separately; the test uses the p228 wording.
