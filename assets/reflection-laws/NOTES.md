# Notes: Laws of reflection (প্রতিফলনের সূত্র)

Book: physics-9-10 › 8.2.1 › p215 (the last step also serves 8.2.2 on p218).
Page images are in `reference/`, with the owner's picture of water reflections (`owner-ref-water-reflection.png`). The owner's
other pictures are only on the build machine (`ch8-briefs/owner-ref-*.png`, `owner-cheap-arrows.png`): one is a publisher's
copyright diagram, so it is kept out of the repo.

## What the pages show
- p215, 8.2.1, চিত্র ৮.০৩: first and second medium, the ray XO, the normal at O, the upright plane through both, θi, θr,
  OX′; the two laws.
- p218, 8.2.2, চিত্র ৮.০৭: parallel rays stay parallel on a smooth surface; on a rough one every ray still obeys the law
  but each part of the surface lies at its own angle: ব্যাপ্ত প্রতিফলন.

## The one idea
The reflected ray stays in the plane of the incident ray and the normal, and θr = θi, for every ray, even on a rough
surface.

## The owner's direction
"For 8.2, 8.2.1 you can use some scenery, then properly, very properly the angle and arrow and everything very clean and
very beautifully." Then, seeing the first version: split it into four figures; this one is the mountain lake with the
laws, "not too heavy; it can be a bit like a drawing but very beautiful, realistic", thin clean rays, small arrowheads,
dashed normals, thin arcs with arrow ends, few labels with thin leaders, lots of air.

So 8.2 (চিত্র ৮.০২) and Fresnel (চিত্র ৮.০৫) left this figure. Their code is in `.parked/` (dev only, never packaged; the
dot-folder is skipped by the packager and the checker), with a README for the next builders.

## The owner's third direction (v0.2.0)
On v0.1.0: "one of the toughest, I barely understand anything" (the smooth-and-rough step), then about the whole figure:
"the whole idea is very vague. Need it very very clear, with a proper 3D angle showing, proper zooming, and very clearly
make the concept." So the figure now has one framing per idea, builds one part at a time, and the smooth-and-rough step
is the whole lake with one magnifier. The floating slab and the 3D net of rays are gone. `law` now runs 0 to 8, not 0 to 5
(see `LAW` in `app.js`); an old `?law=5` shows the reflected ray, not both laws.

## How it works
- **The camera tells the story.** It opens on the lake (`wide`: a fixed pose, so the mountain and its image sit at the same
  height in every shape of frame), flies to O on the first tap (`ray`, about 1.5 s), pulls back a little for the plane
  (`plane`, fitted to the whole circle the plane can turn in, so nothing leaves the frame as it swings), and goes back to the
  lake for 8.2.2 (`lake`: the same pose tipped down, leaving the near water free for the magnifier). Close views look down
  from 25° at azimuth 40°, as চিত্র ৮.০৩ does. Swinging or dragging never moves the camera, so the plane is seen turning.
- **One part at a time, as the owner listed them:** the setting → the ray XO → the point O → the perpendicular → the plane →
  OX′ → θi and θr → swing the plane (first law) → drag X (second law). Each new part grows in, shines for 0.75 s, and only
  then does the button come back. The panel gives its one-line term and the book's sentence. Terms show on the picture while
  the book introduces them, then leave it.
- **The plane stands on the water.** It rises from its foot line, a heavy white line on the water, with a thin circle round O
  that shows the water as a flat floor and a 90° mark across the foot: one leg up the sheet, one along the water, like
  চিত্র ৮.০৩. The handle rides that circle and follows the finger exactly (the pixel is projected on to the water), so the
  plane turns round the normal. Its range is −78° to 22°: it faces the view at −40° and is never edge-on.
- The tap marker of the kit shows only on the lake and on the two drags. Near O a ring would cover the very part that has
  just arrived, and the button in the panel is enough.
- **The magnifier** (`loupe.js`) is a 2D inset on the same canvas, along the bottom of the view in the near water, with a thin
  line to a spot on the water just above it, clear of the mountain's image. The one exception is 390×520, where the view is only
about 155 px tall: there it stays 240 px across and overlaps the lower part of the image. A touch phone is asked to turn sideways anyway.
  It is চিত্র ৮.০৭ as a cross-section: three parallel rays at 50°, spaced so that a reflected ray never crosses the next
  incoming one, dashed normals, one pair of equal arcs on the middle ray. `loupeInto` traces each ray to the line and
  reflects it about the true normal there, so the strength of the waves morphs the line and the rays together (unit-tested:
  θr = θi on each ray, parallel when flat, no crossings at any strength). Its waves lean −32°, −9° and +15° at the three
  rays, far steeper than the lake's, which the inset says ("বড় করে দেখানো"). The test on one slope uses the same inset.
- **X is a point on a ray, as in the book**, not the mountain's peak (the brief allowed the peak or the sun). A ray
  from the far peak would run almost along the line of sight, so the plane would be seen edge-on and the two angles could
  not be seen to be equal. With the plane nearly face-on they can.
- **The drawing is vector, on a 2D canvas over the view.** The owner found 3D cones "cheap". Rays, normal, arcs,
  arrowheads and handles are painted from the exact 3D points projected through the camera: anti-aliased, a constant
  2.5 px with a thin dark halo, filled chevrons. Only the soft sheet is a 3D object. `capture` composites the drawing.
- **Rays are drawn from the vectors in `reading.js`** (r = d − 2(d·n)n), not from θ copied across. `get` reads θr back
  from the reflected vector and `inPlane` from its distance to the sheet.
- **The mirror image is exact.** A mirrored copy of the terrain and sky is drawn from the student's own camera into a
  texture, only when the camera moves, so on flat water each pixel shows exactly what a mirror in y = 0 does.
- **Wavy water is physical in the picture.** Each pixel's normal comes from eight crossing sine waves (0.045 rms slope);
  the reflected ray is followed out to the scenery and looked up in that texture. A tilt turns the ray by twice the tilt,
  which gives the shimmering vertical streak of the owner's picture. Waves too small for a pixel are blurred rather than
  drawn. The approximation: for a turned ray all scenery counts as one distance away (exact on flat water).
- The water's brightness is the exact Fresnel formula for unpolarised light, n = 1.33, though this figure doesn't teach it.
- **The mountain stays crisp at any size**: snow and rock relief are worked out per pixel. The 256 px detail map is laid
  on from the side each slope faces (triplanar), so steep faces are not combed, and a broad noise stored on the mesh, which
  never repeats, moves the snow line. The painted ground (512 px) holds only the broad colours.
- **Weight:** the mirror uses half the mesh in each direction and is drawn only when the camera moves; the waves rest
  after 20 s untouched; the mirror falls back to byte colours where half-float can't be drawn to. Measured: nothing drawn
  when idle; 67k triangles and 3 to 5 draw calls a frame, 85k when the camera moves, about 200k across a capture call
  while waves run. Ready in about 750 ms on the software renderer. CPU time per frame is not measured on a real phone. Re-measured at v0.2.0 with the magnifier: 5 draw calls and 67k triangles for a still frame, 9 and 202k across a frame and
capture with waves running. The magnifier and the drawing are 2D canvas work, and they draw only when a frame does.
- **How to use** (v0.4.0, kit 1.8.0 `createHowTo`): under the action, the same icons as on the view, with a few words: the ⟲ ৩৬০° pill, the সামনে button, X's ↔ disc ("টেনে X সরাও") and the plane's ⟲ disc ("টেনে সমতল ঘোরাও"), the last two from the angles on (law 6), in their place before that. Tapping an item points at its control on the view.

## Honesty
- "রশ্মি বোঝার জন্য আঁকা": rays are not visible and are drawn far larger than the lake's scale.
- The magnifier's waves are drawn far steeper than life, and said to be.

## Terms (as in the book)
আলোক রশ্মি, প্রথম মাধ্যম, দ্বিতীয় মাধ্যম, লম্ব, অভিলম্ব, আপতন বিন্দু, সমতল, আপতিত রশ্মি (XO), প্রতিফলিত রশ্মি (OX′), আপতন কোণ (θi),
প্রতিফলন কোণ (θr), প্রথম সূত্র, দ্বিতীয় সূত্র, মসৃণ পৃষ্ঠ, অমসৃণ পৃষ্ঠ, সমান্তরাল, ব্যাপ্ত প্রতিফলন.

## Open questions for the book team
- p215 prints both আপতিত/আপাতিত and আপতন/আপাতন. The figure uses আপতিত and আপতন (chapter 8's shared decision), so the laws
  as shown read "আপতন রশ্মি" and "আপতন কোণের" where the page prints "আপাতন". Otherwise they are word for word.
- The caption of চিত্র ৮.০৭ says "বিচ্ছুরিত" while the text says "ব্যাপ্ত প্রতিফলন". The figure uses the text's term.
- চিত্র ৮.০৩ marks 90° between the sheet and the surface. The figure marks 90° at the foot of the normal, only in the step
  that introduces the normal, to keep the point of incidence clear.
