# Notes: Laws of reflection (প্রতিফলনের সূত্র)

Book: physics-9-10 › 8.2.1 › p215 (the last step also serves 8.2.2 on p218).
Page images are in `reference/`, with the owner's pictures (`owner-ref-*.png`).

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

## How it works
- Two words in the panel: the laws, then smooth and rough water. The laws build in the book's order: ray → লম্ব → সমতল →
  OX′ and the angles → swing the plane (first law) → drag X (second law). Terms show on the picture while the book
  introduces them, then leave it: at the end only X, O, X′, অভিলম্ব, the two media and θi, θr remain.
- **X is a point on a ray, as in the book**, not the mountain's peak (the brief allowed the peak or the sun). A ray
  from the far peak would run almost along the line of sight, so the plane would be seen edge-on and the two angles could
  not be seen to be equal. With the plane nearly face-on they can.
- **Rays are drawn from the vectors in `reading.js`** (r = d − 2(d·n)n), not from θ copied across. `get` reads θr back
  from the reflected vector and `inPlane` from its distance to the sheet.
- **The mirror image is exact.** A mirrored copy of the terrain and sky is drawn from the student's own camera into a
  texture, only when the camera moves, so on flat water each pixel shows exactly what a mirror in y = 0 does.
- **Wavy water is physical.** Each pixel's normal comes from eight sine waves, the same ones `reading.js` uses for the
  rays; the reflected ray is followed out to the scenery and looked up in that texture. A tilt turns the ray by twice
  the tilt, which gives the long vertical streaks of the owner's picture. Waves too small for a pixel are blurred
  rather than drawn. The approximation: for a turned ray all scenery counts as one distance away (exact on flat water).
- The water's brightness is the exact Fresnel formula for unpolarised light, n = 1.33, though this figure doesn't teach it.
- **The mountain stays crisp at any size**: snow and rock relief are worked out per pixel from a 256 px tiled detail
  map; the painted ground (512 px) holds only the broad colours.

## Honesty
- "রশ্মি বোঝার জন্য আঁকা": rays are not visible and are drawn far larger than the lake's scale.
- The waves are strong ripples, seen from close.

## Terms (as in the book)
আলোক রশ্মি, প্রথম মাধ্যম, দ্বিতীয় মাধ্যম, লম্ব, অভিলম্ব, আপতন বিন্দু, সমতল, আপতিত রশ্মি (XO), প্রতিফলিত রশ্মি (OX′), আপতন কোণ (θi),
প্রতিফলন কোণ (θr), প্রথম সূত্র, দ্বিতীয় সূত্র, মসৃণ পৃষ্ঠ, অমসৃণ পৃষ্ঠ, সমান্তরাল, ব্যাপ্ত প্রতিফলন.

## Open questions for the book team
- p215 prints both আপতিত/আপাতিত and আপতন/আপাতন. The figure uses আপতিত and আপতন (chapter 8's shared decision), so the laws
  as shown read "আপতন রশ্মি" and "আপতন কোণের" where the page prints "আপাতন". Otherwise they are word for word.
- The caption of চিত্র ৮.০৭ says "বিচ্ছুরিত" while the text says "ব্যাপ্ত প্রতিফলন". The figure uses the text's term.
- চিত্র ৮.০৩ marks 90° between the sheet and the surface. The figure marks the right angle at the foot of the normal, only
  in the step that introduces the normal, to keep the point of incidence clear.
