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
- Eight taps, one action: cut a piece from the sphere (it comes out big and turns once, slowly, each surface named as it comes round) →
  coat its inner surface (it then goes down to the holder on the bench) →
  parallel light → measure f and r (the four r words live here, and on the convex measure) → widen the light → coat the outer
  surface (the dish makes a half turn on its pins) → extend the rays behind → a bulb at F, which the student then moves off F
  and back (by the action, by drag, or by the left/right keys).
- The words গোলক · অবতল · উত্তল · টর্চ jump. `src/app.js` has one table, `POSE`, of what each stage shows, and one function, `run()`,
  which walks any jump in the same order: the light goes, the measures go, the piece moves, the mirror turns, then the light comes.
- The camera goes to each thing (`FRAMES` in `src/bench.js`, fitted to the stage with `fitPose`): the sphere, the whole bench, the mirror
  and F, the printed scale, close on F for the wide bundle, close on the mirror from the side for the half turn, behind the mirror for the
  convex F.
- **The piece must be seen (owner, v0.3.0).** The cap faces +z, about 38° off the view, not the far edge of the ball, where it was a sliver.
  On the sphere and in the air each surface wears a teaching colour (outer gold, inner blue, one drawing of each face, wound to show from its
  own side only), the rim is bright, and curved lines are drawn on the side that faces the eye (`pieceLines` in `rays.js`): at r = 30 a 20 cm
  piece has a sag of only 1.7 cm, so shading alone made it look like a flat disc. The colours go when it is a mirror, and the outer gold comes
  back for the half turn, with the mirror's curve in gold and "বাইরের পৃষ্ঠ = উত্তল" on it, before the silver spreads over it.
- **The pace is one table, `T` in `src/app.js`** (the owner's rule, common.md): flights 2 s, the cut 2.8, the slow turn 5, the coat 2.8, the way
  down 3.2, the mirror turning over 3.4, five rays one after another 3.2 s each way (about 1.2 s a ray), a 1 s hold on every result. Nothing
  advances by itself, taps do nothing while a step or a flight plays, ▶ আবার দেখো plays the finished step again, and the last action offers the
  test. The piece turns once and stops: an endless turn would draw every frame, and the student can walk round it anyway.
- **All the way round**: no azimuth limit, polar 5°–88°, zoom 0.6–1.6 × the step's distance. A flight goes round what it looks at, not through
  it (from behind the bench a straight line would pass through the mirror). A drag of less than 8 px is a tap: the view does not move at all
  until then. Labels and rays are on the screen, so they hold from any side. The table and the backdrop's soft light go all the way round too.
- **The handle** on the bulb's carrier (`src/handle.js`) has the look and names of the kit's `createDragHandle` (pull request #361, not merged
  when this was written). When kit 1.7.0 is in, delete the file and the CSS and use the kit's. The rotate cue is a pill in a corner, so it can't be
  taken for a handle on a part. On the tightest frame (390 × 520) no corner has room for its word beside the key labels, so it is the 360° icon alone.
- Rays are traced on the exact sphere with r = d − 2(d·n)n (`src/reading.js`, unit-tested in `test/unit/spherical-mirror-focus.test.mjs`).
  Nothing uses f = r/2 to place a ray: the rays find F. They are drawn as vector lines on a 2D canvas over the view
  (`src/rays.js`), like the sister figures. F, O and P are marks on the axis with a drop to their number on the printed scale.
- **The bench is the chapter's (`src/bench.js`, `src/mirror.js`), for `convex-mirror-image` and `concave-mirror-image` to copy**: slate
  wall and table; anodised rail with a sloping front carrying the printed scale (two rows of one 1024 × 256 texture: 0 at the
  mirror, counting away on both sides, unsigned; "behind" is said in words); black carriers with a thumb screw and brass
  pointer; a ring on a post; the dish on two pins. Axis height 19 cm, rail top 3.2 cm, mirror half-width 10 cm.
- The dish is one object with two faces, each the exact sphere of radius r, rewritten in place when r changes. The silver is a
  second drawing of a face whose triangles run from the middle out: more of them drawn = the coat spreading. It reflects a bright
  studio of its own (`createStudioEnvironment({ light: true })`, one PMREM at start), because a polished mirror in the slate room
  looked dark, and it draws after the glass, so the glass does not tint it. Bare glass is mostly see-through, its green at the edge.
- The ray box stands just past O (`boxAt` in `reading.js`, x = r + 12; 30 cm for the convex mirror) and rides along the rail when r
  changes, so that the source of the light stays in view in every step that uses it. The frames end at its plate.
- The wide bundle's point is too small for the view: 6 mm between the crossings is about 25 px. So a round lens drawn on the vector
  layer (`lens()` in `rays.js`) shows them true to scale, with the rim rays in their own colour.

## Honest notes
- Only five rays in one plane are drawn, out of countless. "কয়েকটি রশ্মি আঁকা" says so on the view.
- The mirror is drawn large: 20 cm across on a 20–60 cm radius; lab mirrors are smaller. It is what makes the rim rays of the wide
  bundle show the book's "কাছাকাছি" (for r = 30: the near rays cross at 14.9 cm, the rim rays at 14.2 cm).
- The coat is on the surface that reflects (front-surface silver, as in telescope mirrors), so that no refraction in the glass
  comes into it. The chapter's plane mirrors have the silver on the back of the glass, like household ones. The book says only
  that the coat decides the kind (p223) and which surface reflects (p228).
- The gold and blue of the piece, its bright rim and the lines on it are teaching marks, not the glass.
- The hollow sphere is imagined high above the bench in the first step, out of the bench's picture: a sphere of radius 30 cm round the
  axis would go through the rail. On the bench its circle is a dotted line in the plane of the rays.
- A spherical mirror does not give an exactly parallel beam: at the rim of the bulb's light (8 cm from the axis, r = 30) the ray is
  about 1° off. The figure shows it as traced; real torches use a parabola, which the book does not mention (not in the panel).
- The bulb's direct light (the part not going to the mirror) is not drawn.
- The r words are four mirrors (other spheres), not one mirror bending, though the picture glides between them.

## Open questions
- p225 has "আপাতন কোণ" for আপতন কোণ (a misprint?).
- p224 and p228 give the plane mirror's f as অসীম for "উত্তল" and "অবতল" separately; the test uses the p228 wording.
