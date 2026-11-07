# Notes: Image in a concave lens (অবতল লেন্সে প্রতিবিম্ব)

Book: physics-9-10 › 9.4.1 › p257 (the topic runs to p259). Page images in `reference/` (pages 257–259).

## What the pages show
- p257: the book takes the concave lens first, because it gives the same kind of image as a convex mirror. চিত্র ৯.১৮: parallel rays
  spread after the lens; extended back they seem to come from one point, the focal point; its distance from the centre is the focal length.
- p258: light can fall on a lens from either side, the focal length is the same; reversing a ray sends it back along its path, so rays
  heading for the focus leave parallel (চিত্র ৯.১৯, "অভিসারী রশ্মি সমান্তরাল হয়ে যাবে"). The three special rays: (i) toward the centre,
  straight on (YO, XO); (ii) parallel to the principal axis (XP), after refraction as if from F (PS); (iii) toward the focus (SP),
  parallel (PX). The pencil XY with Y on the principal axis YR.
- p259 (চিত্র ৯.২০): two rays from X, XP (spreading, as if from F: the line FS) and XO (straight on, XT). XT and FS cross at X′; the
  perpendicular from X′ gives Y′. Caption: "অবতল লেন্সে একটি বস্তুকে ছোট দেখায়।" The image is (a) between the centre and the focal point,
  (b) virtual, (c) upright, (d) smaller than the object.

## The one idea to teach
Wherever the object is, a concave lens gives a virtual, upright, smaller image on the object's side, between the lens and F; the book's
special rays find it, and it is exactly what an eye sees in the glass.

## Terms (as in the book)
অবতল লেন্স, সমান্তরাল রশ্মি, ছড়িয়ে পড়ে, প্রতিসরিত, ফোকাস বিন্দু F, ফোকাস দূরত্ব, লেন্সের কেন্দ্র / আলোকীয় কেন্দ্র O (9.4's term, as the
sister figure), প্রধান অক্ষ / মূল অক্ষ, কেন্দ্রমুখী, ফোকাস অভিমুখী, অভিসারী রশ্মি, আলোকরশ্মির গতিপথ উল্টো, বিচ্ছুরিত, বস্তু XY, প্রতিবিম্ব
X′Y′, লম্ব, অবাস্তব, সোজা, বস্তুর তুলনায় ছোট; the letters X, Y, P, S, T, O, F, X′, Y′ of চিত্র ৯.২০.
Added by the figure, not on these pages: F′ for the focus on the far side (the sister figure's letter; the book says only "ফোকাস"), u,
v and m (chapter 8's letters, used by the sister figure), চোখ, সারণি, প্রথম / দ্বিতীয় / তৃতীয় রশ্মি beside the book's rule numbers (as
the sister), and the panel's words টেনে সরাও.

## How the figure works
- **Setting** (the owner's latest wish, the sister figure convex-lens-image's): a deep-blue gradient backdrop and a plain light-sand table
  with the blue round it; on it only the bench: the anodised rail with the printed cm scale (one 0, at the lens), black carriers with
  brass pointers on the strip, the glass lens in a black ring on a post, the book's red, yellow-striped pencil on its stand.
- **The lens** is real glass for f = −15 cm: two equal concave spherical faces of radius 15.6 cm (1/f = (n − 1)(2/R) with n = 1.52, the
  book's glass in table ৯.০১), 15 cm across, 0.4 cm thick in the middle and 4.2 cm at the edge. The ring holds the middle of its edge,
  so the thick glass edge shows on both sides: thin in the middle, thick at the edge, as the book says. Its outline is drawn on the ray
  layer like the book's lens shape, with the faint middle line where the rays bend.
- **What the glass shows is exact.** From the far side, the glass shows the lens's own image of what stands behind it: copies of the
  pencil, its stand, the rail and the table whose vertices are moved by the thin lens's map x′ = m·x, y′ = m·y, z′ = m·z with
  m = f / (f + |x|) (`lensImage`, and the same lines in the shader of `src/bench.js`), drawn only where the line of sight passes through
  the glass; the real things behind it are not drawn there. So the small upright pencil in the glass stands exactly at X′Y′, from any
  angle the student turns to (tested: the map of the pencil's tip is X′ for every u). No render target, no second scene pass.
- **A calm start**: the first view is from the eye's side, 28° off the rail, the real pencil beside the lens and its small upright image
  inside it, two names and a few warm words ("many people's glasses are thin in the middle…"). Then one new thing a tap (`STAGES`,
  `POSE` in `src/app.js`), never more than three new labels: চিত্র ৯.১৮ (parallel rays spread; the principal axis), extended back to F
  with the focal length (f = 15 cm), চিত্র ৯.১৯ (rays aimed at F′ leave parallel; dashed where they would have met), the book's rule (ii)
  from X (XP, then PS as if from F, dashed back to F; P and S), rule (i) (XO straight to T; X′ where XT and FS cross; আলোকীয় কেন্দ্র O),
  rule (iii) (toward F′, parallel, dashed back through X′), the image (the perpendicular to Y′, a 45 % ghost labelled "প্রতিবিম্ব
  (অবাস্তব) / সোজা · ছোট", the textbook eye on the far side), then the eye's view again: the glass shows exactly that X′Y′.
- **The row "পেনসিল (cm)"**: 10, 15, 30, 60 and সারণি, as the sister's. The action takes the pencil through them (v = 6, 7.5, 10, 12 cm;
  m = 3/5, 1/2, 1/3, 1/5), each with its own rule line (at F the image is half way, half as tall); then the graph and the table, then the
  test is offered. The readouts: "অবাস্তব, সোজা, বস্তুর চেয়ে ছোট / u = … cm · একই পাশে v = … cm · m = …".
- **The graph** (`src/graph.js`, SVG in real pixels for its box): the image's distance (blue) climbs toward the dashed violet line of F and
  never reaches it; its height (teal) falls from the pencil's own 6 cm; the pencil's place now as a guide and two dots. **The table**:
  u, v, m for the row and "অসীম দূরে → F এ, 0", with the book's summary in the lead line.
- **Small images** (under 40 px on the view) get the kit's magnifier, 2–4×, in the image step and the row's steps, as the sister.
- Pace (common.md): bundles and ray legs 1.2–1.6 s, the pencil 1.6–2.5 s, camera flights 1.6–2 s, a 1 s hold on each result. Taps while a
  step plays are ignored, nothing advances by itself, ▶ plays a finished step again, ⟲ goes back to the start.
- **Rays** are painted on a 2D canvas over the view from the exact points of `src/reading.js` projected through the camera (the chapter's
  style: amber with a dark edge, small chevrons, virtual extensions dashed). They are the book's rules of a thin lens, bending once on the
  middle plane, and agree exactly with 1/u + 1/v = 1/f with f = −15 cm (tested: every ray passes through X′ to 1e-9 cm). The formula is
  never printed: the book teaches the rays.
- **The pencil** carries the kit's drag handle in the steps with rays; ← → move it (→ toward the lens).
- **The test** (5 questions, numbers as choice indices, shuffled): the path of the parallel ray after P (four drawn candidates: spreading
  as if from F; to F′, as a convex lens; straight on; back, as a mirror); how the eye sees the pencil in the glass (from the eye's view,
  the real pencil beside the lens to compare); where the image forms (four tagged points: X′'s place, F, the far side, beyond F); what
  happens to the image when the pencil goes farther (the pencil slides in the answer); and the image's distance read off the scale under
  Y′ (choices: v, f, u, u − v). Each wrong choice has its own note. A browser test answers all right (5/5) and all wrong (0/5).

## Honest notes
- Only three rays in one plane are drawn, out of countless; the corner note says "রশ্মি কয়েকটি মাত্র; পাতলা লেন্সের নিয়মে আঁকা". A real
  lens this strong spreads its rim rays a little more than the thin-lens rules (spherical aberration); the figure draws the book's rules.
- The view through the glass is the ideal thin lens: sharp, no colour fringes, the same map for every part of the glass. The thick rim
  of a real lens would distort more near its edge. Only the pencil, its stand, the rail and the table on the pencil's side are seen in
  it; the blue backdrop is the same either way.
- The ghost image is scaled by m in every direction; its true depth scales by m². A pencil is thin, so it does not show.
- The see-through view is one-sided: only what stands on the pencil's side is minified in the glass (the rail and table on the eye's side
  are seen directly, as they should be, but they are never seen *through* the glass from the other side), and the copies in the glass
  carry no shadows.
- Cost of the see-through view: every material of the pencil, its stand, the rail and the table carries a small test and a `discard` in
  its fragment shader, even when the eye is on the pencil's side (`lensOn` = 0). A `discard` can turn off early depth testing on some old
  tiled mobile GPUs (PowerVR, Mali); these parts are few and small on the screen, and the measured frame times stay low, but a cheaper
  route would be to swap to unpatched materials while `lensOn` is 0.

## Measured (844 × 390, shadows on, a temporary script)
- Draw calls / triangles of one frame from four azimuths 90° apart: the first view 45 / 74 / 80 / 112 draws, 20–50k triangles; চিত্র ৯.১৮
  34–121 / 17–52k; the image step 47–121 / 31–52k; the pencil at 60 cm with the magnifier 46–121 / 26–52k. Heaviest: 121 draws, 52k
  triangles (the shadow pass included; the through-the-glass copies add about 10 draws when seen). Idle: 0 draws once the view settles
  (about 4 s of OrbitControls damping after a turn).
- JS per animated frame at 6× CPU throttling (the pencil moving with rays, image, labels, graph and magnifier following): median 1.3 ms,
  90th percentile 2.1 ms, worst 2.8 ms.
- Textures: one 1024 × 256 scale, a 4 × 256 backdrop. Shaders of later parts (the ghost, the through-the-glass copies) are compiled ahead
  with `stage.warmUp`.

## Open questions for the book team
- **F′.** The book names only F (on the pencil's side, চিত্র ৯.১৮ and ৯.২০) and says "ফোকাস অভিমুখী" for rule (iii), whose focus is on the
  far side. The figure calls that one F′, as the sister figure convex-lens-image does. Is that the edition's wish?
- **O.** 9.4.1 says "লেন্সের কেন্দ্র"; the figure names O "আলোকীয় কেন্দ্র O" once (9.4's term, as the sister figure) and the panel says
  "লেন্সের কেন্দ্র".
- The book uses both "প্রধান অক্ষ" (rule ii) and "মূল অক্ষ" (p258); the figure says প্রধান অক্ষ.
- The sentence on young people's glasses (p255, 9.4) is used in the opening words: "অনেকের চশমার কাচ মাঝখানে সরু, কিনারে পুরু"।

## Round 2 (the independent review)
- **The magnifier keeps the climax.** It shows whenever the image is under 40 px on the view (any width, the image step and the row's
  steps), aimed a little above the image's middle, and the ray layer is painted again inside the glass, enlarged as the 3D is
  (a canvas point p shows at c + (p − c)·zoom, clipped to the disc): the rays, the dashed lines and the X′ dot cross magnified there.
  Labels of points under the glass point to where they show, from just outside its rim; a point hidden by the glass whose enlarged copy
  falls outside it is not labelled.
- **X′ and Y′**: once the ghost stands there they are named in its one chip below the axis ("প্রতিবিম্ব X′Y′ (অবাস্তব) / সোজা · ছোট"),
  with one line to X′; in the ray steps X′ alone, its line from the free wedge below the crossing; F there tries above-left first (the
  pencil's handle track runs just under the axis). The chip keeps off the pencil and its stand.
- **Measured in every state at all six sizes, Bangla and English** (26 states each: every step, every row distance, the graph, the
  table, each test question, each revealed answer, the result): one 3D height per size; panel scroll 0; no text cut; no label on another
  label, a corner pill, the panel tab or the note; no label on a ray (amber pixels of the ray layer under a visible label); the action
  button keeps its place in every step after the calm first screen (portrait ±2 px).
- Test Q3: the pencil at 10, 30 or 45 cm; "beyond F" half way from F to the pencil (or 4 cm past F when the pencil is inside F), never on
  the pencil. Q2's "উল্টো, বড়" has its own note. The `view` event is forwarded (unit-tested against asset.json).
- Words: rule c0 says "পেনসিলের ৩/৫ অংশ" (the number from m) and glosses m once: "m = প্রতিবিম্বের উচ্চতা ÷ পেনসিলের উচ্চতা";
  "লেন্স ও F এর মাঝখানে" where "F এর ভেতরে" was; S stays named in rule (i)'s step, which speaks of FS; the readout "একই পাশে ১০ cm" as the
  sister; the third ray's action "তৃতীয় রশ্মি আঁকো" fits one line. English shortened where it wrapped or scrolled.
- The graph's names in a legend row above the plot (never on a curve or a live dot); F and the pencil's height under their lines. The
  table at 12.5–13 px (12 px in a short side panel). Dead label spots removed. Ray numbering kept as the sister's, by decision.
