# Notes: Lens and its types (লেন্স ও লেন্সের প্রকারভেদ)

Book: physics-9-10 › 9.3.4 › p255 (with 9.4, pp 255–257). Page images in `reference/` (page-255, 256, 257).

## What the pages show
- p255, 9.3.4 লেন্স: a lens is a transparent medium bounded by two curved surfaces, or one curved and one plane; used in spectacles,
  telescopes, microscopes, projectors and cameras. 9.4 লেন্সের প্রকারভেদ: mirrors bring light to a point (অভিসারী রশ্মি) or spread it
  (অপসারী রশ্মি); so do lenses. চিত্র ৯.১৪: sections of a biconvex and a biconcave lens. Spectacles: one kind makes a very near thing look a
  little further away (older people), the other makes a far thing look a little nearer (younger people): উত্তল (Convex) কিংবা অভিসারী
  লেন্স, অবতল (Concave) কিংবা অপসারী লেন্স.
- p256: convex lenses are thicker in the middle than at the edge, concave ones thinner. The faces are two "গোলীয় বৃত্ত", radii equal or not;
  their centres are the বক্রতার কেন্দ্র, C₁ and C₂ (চিত্র ৯.১৫: overlapping circles for the convex lens, two apart for the concave one).
  A spherical surface and a plane also make a convex or concave lens. The book keeps to thin lenses: at the middle the two faces are
  nearly parallel, and a ray through parallel faces is moved aside (চিত্র ৯.১৬: বিচ্যুত রশ্মির দিক, মূল রশ্মির দিক); the thicker, the more.
- p257: a lens whose centre lets a ray through without changing its direction is a পাতলা লেন্স; that point is the লেন্সের কেন্দ্র or
  আলোকীয় কেন্দ্র (Optical Center). চিত্র ৯.১৭: thick lenses shift the ray through the centre, thin ones do not.

## The one idea to teach
A lens is glass bounded by spherical surfaces: a convex lens is thicker in the middle and converges light, a concave lens is thinner in
the middle and diverges it; each face is part of a sphere (centres of curvature C₁, C₂, the principal axis through them); and through
the optical centre of a thin lens a ray goes straight.

## Terms (as in the book)
লেন্স, বক্রতল, সমতল, স্বচ্ছ মাধ্যম, উত্তল (Convex) / অভিসারী লেন্স, অবতল (Concave) / অপসারী লেন্স, অভিসারী / অপসারী রশ্মি, কেন্দ্রীভূত,
প্রস্থচ্ছেদ, মাঝখানের অংশ প্রান্ত থেকে পুরু / সরু, গোলক, গোলকীয় তল, ব্যাসার্ধ, বক্রতার কেন্দ্র (C₁, C₂), পাতলা লেন্স / পুরু লেন্স, বিচ্যুত,
মূল রশ্মির দিক, বিচ্যুত রশ্মির দিক, আলোকীয় কেন্দ্র (Optical Center), চশমা. From 9.4.1 on the same page 257: প্রধান অক্ষ, ফোকাস বিন্দু (F).
Added by the figure, not on these pages: আলোর বাক্স (ray box, as the sister figures), লেজার (the laser pointer), কল্পনায় কাটা.
The page's typos are not repeated: "বিচ্যুৎ" is written বিচ্যুত (the caption's spelling), "বেকেঁ" বেঁকে.

## How the figure works
- **The setting** is the chapter's (the owner's calm-blue wish): a deep-blue gradient backdrop, a plain light-sand table with the blue all
  round it, the optical bench of the sister figures (anodised rail, printed cm scale, black carriers). Every part stands on its own carrier
  and is lifted off the rail or set down on it as a step needs (`LIFT` in `src/bench.js`), so the light never has to pass through another lens.
- **The lens agrees with convex-lens-image** (merged first): half-height 7.5 cm, faces of radius R = 2(n − 1)·15 = 15.6 cm, n = 1.52 (the
  book's glass, table ৯.০১), a 0.3 cm edge on the convex lens; the same MeshPhysical glass (opacity 0.26, clearcoat), green rim, black
  ring with lips, brass screw and steel pin. The concave lens has the same faces and 0.6 cm in the middle; its wide rim is the same green,
  fainter (0.5). concave-lens-image and lens-power can take `lensOf()` and the stand from here.
- **Each lens is two halves** split in the plane of the axis (`createLensHalf`), the ring too, so that the front half can be taken away
  toward the viewer: the section (প্রস্থচ্ছেদ) shows pale blue with a dark outline, as in চিত্র ৯.১৪. The panel and a corner note say the cut
  is in imagination. The glass's positions are rewritten in place when its shape changes (a flat face, thick → thin): no new geometry.
- **Ten states, nine taps, one action** (`STAGES`, `POSE`, `run()` in `src/app.js`): ① cut → ② convex lens with the ray box (the concave
  one lifted off): five parallel rays traced through both faces meet past the lens (F′) → ③ concave lens: the rays spread, dashed back to
  F → ④ ⑤ the faces' spheres: faint glass half-spheres and the book's circles with "+" centres C₁, C₂ and the principal axis → ⑥ the right
  face of both lenses flattens → ⑦ a glass slab and a laser: the ray comes out parallel, moved aside (a white bar marks it; the original
  direction dashed), then the slab thins from 6 to 3 cm → ⑧ ⑨ a thick convex, then concave lens with the laser through its centre: the ray
  moves aside, then the lens thins and the ray goes straight; O marked. The words দুই রকম · আলো · গোলক · পুরু কাচ · কেন্দ্র jump.
  `run()` walks any jump in one order: the light goes, marks go, faces come back, parts leave the rail, parts slide, arrivals come down,
  the cut, the flat face, the spheres, then the light, then the thinning.
- **Pace** (`T`): flights 2 s, lifts 1.8 s, the cut 2.4 s, spheres 2.6 s, rays 1.6 s a segment, the laser beam 2.4 s, the thinning 3 s, a 1 s
  hold on every result; nothing advances by itself; taps while a step plays do nothing; ▶ আবার দেখো replays the step.
- **The drag**: in the three laser steps the kit's drag handle above the glass makes it thicker or thinner (also the arrow keys); the
  result line follows (রশ্মি সরে গেল … cm / mm).
- **Rays are traced, never guessed** (`src/reading.js`, unit-tested in `test/unit/lens-types.test.mjs`): Snell's law in vector form at
  each spherical face; F is found from the near-axis rays; the ray of চিত্র ৯.১৭ is the one whose path inside the glass passes through
  the middle of the lens (found by bisection), so it comes out exactly parallel to the ray in, as the book says; the laser is placed on
  that ray's line. The slab's shift is T sin(i − r)/cos r (i = 40°).
- **Labels** (`createAnnotations` with spots) keep off each other, the corner pills, the action ring, the handle and every ray and circle
  drawn (`drawing.boxes()`); the axis label is optional and steps aside when there is no room.
- **The test**: five questions, each set up in the 3D view with no names showing: which lens is this section (convex/concave, sometimes
  plano), what parallel light will do after this lens, which sphere the left face belongs to (the answer differs for the two kinds), what
  doubling the slab's thickness does to the shift, and which of four paths (ক–ঘ) the ray through a thin lens's centre takes. Choices are
  indices; every wrong choice has its own note; a browser test answers all right and checks ৫টির মধ্যে ৫টি.

## Honest notes
- Five rays in one plane are drawn ("কয়েকটি রশ্মি আঁকা" on the view). With these fat lenses the rays 2.4 cm from the axis cross about
  6 mm nearer the lens than those 1.2 cm off (spherical aberration); the drawing shows it as traced, and the book's "এক বিন্দুতে" is very
  nearly true. No number for f is printed: the exact trace of this 4.1 cm thick lens puts F′ about 16 cm from its centre, while the sister
  figure prints the thin-lens 15 cm; showing either here would put two disagreeing numbers in the chapter.
- The thick lens of the centre steps is made thicker than the book's drawings need (7.7 cm in the middle for the convex one) so that the
  shift is seen on a phone (12 mm); thinned, the shift is 1.4 mm (convex) and 0.6 mm (concave): "প্রায়" nothing, as the book says.
- The spheres are drawn as their back halves (their front halves "cut away" like the lens), with the book's circles in the cut plane.
- The principal axis is introduced as the line through C₁ and C₂ (the book names it only in 9.4.1, on the same page).
- The laser pointer is not in the book (its চিত্র ৯.১৬–৯.১৭ draw a ray); a laser makes one visible ray.

## Performance (2026-11-07, 844 × 390, shadows on, software WebGL)
| state | draw calls (max of 4 azimuths) | triangles |
|---|---|---|
| kinds (both lenses cut) | 39 | 21.6 k |
| converge / diverge | 43 / 42 | 24.5 k |
| sphere / sphere2 | 27 | 20 k |
| slab | 27 | 4.6 k |
| centre | 44 | 23.6 k |

Script per animated frame at 6× CPU (rAF callbacks, real clock): the cut 1.85 ms mean / 3.3 ms max, the concave light 1.2 / 2.9, the
centre step 0.6 / 2.4; idle: no drawing. Ready in about 3.9 s with software WebGL. GLB 524 KB (17.2 k triangles, the two lens stands). Textures: the scale 1024 × 128, the glow 64², the backdrop 4 × 256. Parts of later steps are
made at load (hidden) and compiled ahead with `stage.warmUp({ show })`.

## Open questions
- common.md lists "আলোক কেন্দ্র" and "প্রধান ফোকাস"; page 257 writes **আলোকীয় কেন্দ্র** and 9.4.1 **ফোকাস বিন্দু**: the figure follows
  the page (as convex-lens-image does). F′ / F for the two foci follows convex-lens-image.
- Spectacles: the book's "বয়স্কদের … কম বয়সীদের" is kept as the book says it ("সাধারণত").
- p256's "গোলীয় বৃত্ত" (the book's term for the circles) is not used on the view: the figure says গোলক and বৃত্ত only in the panel.
