# Notes: Image in a plane mirror (সমতল আয়নায় প্রতিবিম্ব)

Book: physics-9-10 › 8.3.1 › p219; the last step also serves the উদাহরণ on p221 (চিত্র ৮.১২).
Page images are in `reference/` (pp218–221).

## What the pages show
- p218, 8.3: a mirror is glass with a metal coat on its back. 8.3.1, p219: you see your image as far behind the mirror
  as you are in front (চিত্র ৮.০৮, ৮.০৯: rays from X, reflected by AB, seem to come from X′; XP = X′P).
- p220: no real light gathers at the image, so it is অবাস্তব; চিত্র ৮.১০: XY and X′Y′, equal and upright; the list (a)–(d).
- p221, চিত্র ৮.১২: a 1.5 m person needs a 0.75 m mirror, at 1 m or at 10 m.

## The one idea
Rays from the boy reflect by the law and seem to come from a point as far behind the mirror as he is in front; no light
goes there, so the image is virtual, upright and the same size; and only half his height of mirror ever does any work.

## The owner's direction (2026-11-05)
A realistic boy in decent clothes before a mirror, his faded image the same distance behind (`ch8-briefs/owner-ref-person-
mirror.png`, kept on the build machine: it is a publisher's diagram); rays from head and feet into his eye with θ = θ,
dashed extensions to the image, the half-height mirror; simple, interactive, a sky-blush background. This figure also
covers `full-length-mirror`. Then the standing rule for chapter 8: "very very clear, a proper 3D angle, proper zooming":
a camera per step, one element at a time with a highlight and its book term, key labels never dropped.

## How it works
- **Three steps, each built one thing at a time.**
  1. সমদূরত্ব (camera: the whole scene from −27°, 15° above, the floor in depth): show the image → two distance bars on
     the floor (ticks each 25 cm, so they read as equal in depth too) → drag him, XP = X′P → measure XY and X′Y′.
  2. আলোর পথ (camera: boy and mirror, closer and from a milder −20°, so the arcs read): the ray from X → the ray from Y
     (আপতিত, প্রতিফলিত রশ্মি) → the normals and arcs → the camera pulls back as the rays are extended to X′ and Y′.
  3. আয়নার দৈর্ঘ্য (camera: boy and mirror's edges): the mirror starts too short; the student drags its bottom and top
     edges until head and feet show; the camera pulls back to all three with the 1.5 m and 0.75 m measures; then 10 m.
  The newest element glows amber (`dia.view.flash`) and its label is highlighted for about 3 s. Terms show while the book
  introduces them; the letters, the eye, the mirror and the image stay.
- **The image is exact.** It is the same geometry under a group with `scale.x = −1` about the plane x = 0: that transform
  is the mirror. It is a 45 % ghost drawn in two passes (depth, then colour), so no limb shows through the body, and it
  casts no shadow.
- **What he really sees** (the small picture, step 3). A second render from his eye with an off-axis frustum whose picture
  plane is the mirror, scissored to the mirror's rectangle. So the mirror keeps its size in the picture, and a too-short
  mirror really cuts off his feet or head; at 10 m the picture does not change, which is the book's point. On the ghost
  the part the eye can reach stays at 45 %, the rest falls to 11 %, cut by the exact planes through the eye and the edges.
- **Rays are traced** (`reading.js`): a mirror point comes from the image construction, then `reflect` (r = d − 2(d·n)n)
  gives the way out, and `get` reads θi, θr and the miss at the eye back from that vector. With a short mirror the rays
  go by the mirror's own edge and come from the highest and lowest parts it can still show.
- **The drawing** follows `reflection-laws`: a 2D canvas over the view, painted from exact 3D points through the camera.

## Honest simplifications
- X is the top of his head, Y the toe directly under his eye. The rule "half your height" is exact for points on the
  eye's vertical. His head's top is 5 cm behind that line, so the exact length is 0.747–0.75 m; the mirror goes in whole
  centimetres and needs 0.75 m (`neededCm`) at every distance. The model stands so that the toe is under the eye (feet
  4 cm back, head 4 cm forward of the body's axis), else the toe would need a mirror about 3 cm lower at 1 m.
- A wall would hide the image, so the mirror stands on a slim stand, with nothing behind it: the owner's picture does the
  same. The image is drawn "behind" it because that is where the rays seem to come from.
- The glass shows a soft painted reflection of the backdrop, not a render: from this camera the boy is not in the mirror
  (he would be only for a viewer near his own line of sight), and the small picture shows what he does see.
- Rays are a few of countless (a note in the corner says so). The mirror's size changes under the student's finger,
  which a real mirror does not do.
- The ডান-বাম box of p216 is left out to keep to one idea.

## Numbers (measured at 844×390, shadows on, in step 3 with the small picture)
36 draw calls, 147k triangles, ready in about 2 s, GLB 671 KB, zip 447 KB. Textures: canvas gradients, 256 px at most.

## Terms (as in the book)
আয়না, দর্পণ, প্রতিবিম্ব, অবাস্তব প্রতিবিম্ব, আলোক রশ্মি, আপতিত রশ্মি, প্রতিফলিত রশ্মি, অভিলম্ব, আপতন কোণ (θi), প্রতিফলন কোণ (θr),
X, Y, X′, Y′, P, XP = X′P, সমান দূরত্বে, সোজা, সমান দৈর্ঘ্যের, পূর্ণদৈর্ঘ্য প্রতিবিম্ব, পূর্ণদৈর্ঘ্য আয়না, আয়নার দৈর্ঘ্য, অর্ধেক. p220 and
p221 write উপর; the shared decision's আপতন is used (p219 prints আপাতন, and প্রতিফলিত কোণ once).

## Open questions
- The book's X is a point on an object; here X and Y are on a person. Good enough for চিত্র ৮.১০?
- This figure also covers চিত্র ৮.১২, so `full-length-mirror` is not needed as its own figure.
- A person's wording check of the Bangla against the book.
