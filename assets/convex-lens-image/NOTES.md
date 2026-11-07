# Notes: Images in a convex lens (উত্তল লেন্সে প্রতিবিম্ব)

Book: physics-9-10 › 9.4.2 › p259 (the topic runs to p264). Page images in `reference/` (pages 259–264).

## What the pages show
- p259–260: a convex lens gives images "ঠিক একই ভাবে" as a concave mirror. চিত্র ৯.২১: parallel rays gather at the focus and spread on
  ("কেন্দ্রীভূত … তারপর আবার ছাড়িয়ে যায়"); চিত্র ৯.২২: a point of light at the focus leaves the lens as parallel rays. The three ray
  rules: (i) a ray toward the centre goes straight on; (ii) a ray parallel to the principal axis goes through F; (iii) reversed, a ray
  through F leaves parallel.
- p261 (চিত্র 9.23): the pencil XY between the lens and F: the two rays cannot meet ahead; extended back they meet at X′: on the object's
  side, virtual, upright, bigger. Nearer the lens the image shrinks, nearer F it grows, at F it is infinitely large.
- p262–264 (চিত্র ৯.২৪–৯.২৬): outside F, three cases, treated in the order F–2F (beyond 2f, real, inverted, bigger), at 2F (at 2f, same
  size), beyond 2F (between f and 2f, smaller); an object at infinity has its image at F. The উদাহরণ: an object put where its real image
  was has its image where the object stood ("আলোকরশ্মি দিক পরিবর্তন করলে একটি অন্যটিতে পরিবর্তিত হয়")। নিজে করো: a far light, a lens and a
  wall give the focal length.

## The one idea to teach
Where the object stands relative to F and 2F decides the image of a convex lens, and the book's rays find it: inside F the rays spread and
only seem to come from X′ (virtual, upright, bigger, on the object's side); between F and 2F the image is real, inverted and bigger
beyond 2F′; at 2F it is the same size at 2F′; beyond 2F smaller between F′ and 2F′; far away it comes to F′.

## Terms (as in the book)
উত্তল লেন্স, প্রধান অক্ষ, আলোকীয় কেন্দ্র (9.4) / কেন্দ্রবিন্দু O, ফোকাস বিন্দু F, ফোকাস দূরত্ব f, দ্বিগুণ ফোকাস দূরত্ব, সমান্তরাল রশ্মি,
কেন্দ্রমুখী, কেন্দ্রীভূত, ছাড়িয়ে যায়, বিচ্ছুরিত, আলোক বিন্দু, প্রতিসরণ, বস্তু XY, প্রতিবিম্ব X′Y′, বাস্তব / অবাস্তব, সোজা / উল্টো,
বস্তুর তুলনায় বড় / ছোট, সমান আকারের, অসীম, দেয়াল, স্পষ্ট.
Added by the figure, not on these pages: F′ for the focus on the far side (the book prints F′ in চিত্র ৯.২৪ and ৯.২৬ but writes F in
the text and in চিত্র 9.23/৯.২৫), the points 2F and 2F′ (the book marks the distances f, 2f), u and v (the letters of chapter 8's
mirror formula) on the graph and the readouts, পর্দা, ঝাপসা, চোখ, সারণি, and the panel's words টেনে সরাও.

## How the figure works
- **Setting** (the owner's latest wish): a deep-blue gradient backdrop (`scene.background`, a 4 × 256 canvas, the colours of
  equations-of-motion) and a plain light-sand table top with the blue round it. On it only the bench: the anodised rail with the printed
  cm scale (0 at the lens, counting away on both sides), black carriers with brass pointers, the glass lens in a black ring on a post,
  the book's pencil (the red, yellow-striped pencil of চিত্র ৯.২৪–৯.২৬, the chapter 8 sister figures' model) and a paper screen in a thin
  frame on its own carrier. No room or props.
- **The lens** is real glass for f = 15 cm: two equal spherical faces of radius 15.6 cm (1/f = (n − 1)(2/R) with n = 1.52, the book's
  glass in table ৯.০১), 15 cm across, 4.1 cm thick at the middle, a faint green edge. Clear faces with the studio's highlights (a
  transparent physical material; no `transmission`), and its outline drawn on the ray layer in the plane of the rays, like the book's
  lens shape, with the faint middle line where the book bends its rays.
- **A calm start**: the pencil at 2F, its inverted picture hanging in the air on the far side, two names, and a few warm words in the
  panel. Then one new thing a tap (`STAGES`, `POSE` in `src/app.js`), never more than three new labels:
  1. চিত্র ৯.২১ and the book's নিজে করো: five parallel rays from far away gather at F′, where a paper screen catches the far light's
     picture as a bright point (প্রধান অক্ষ, ফোকাস বিন্দু F′, ফোকাস দূরত্ব f = 15 cm); the rule line is the book's sentence
     "উত্তল লেন্সে যদি বহুদূর থেকে কোনো বস্তুর আলো এসে পড়ে তাহলে সেটি লেন্সের ফোকাস বিন্দুতে তার প্রতিবিম্ব তৈরি করে।", visible at every size;
  2. চিত্র ৯.২২: a point of light at F; its rays leave parallel (the second focus F);
  3. the book's rule (ii) from the pencil's tip X, rule (i) (the rays meet: X′, আলোকীয় কেন্দ্র O), rule (iii) (the third ray meets the
     same X′), each named on the ray;
  4. the screen comes in blurred; the student drags it (or the action does) until the picture is sharp: real;
  5. the book's cases in the book's order, the pencil carried along the rail: inside F at 9 cm (the rays spread, dashed extensions meet at X′
     behind, a translucent ghost "প্রতিবিম্ব (অবাস্তব)", and the textbook eye on the far side that sees it), F–2F, 2F, beyond 2F
     (back where the story began, now named);
  6. the উদাহরণ: the pencil goes to where its image was and the image comes to where the pencil stood (from the student's own place
     when that makes a real swap, else the book's 45 ↔ 22.5 cm); faint marks and two labels keep the places before, and the frame holds both.
     The book puts the object at the image's place on the far side; the figure moves the pencil to that distance on its own side, the same
     thing for a symmetric lens, and the rule says so;
  7. the graph of v against u, live while the student drags the pencil; 8. a summary table; then the test is offered.
- Pace (common.md): rays 1.2 s a leg with 0.3 s pauses, the bundles 2.4 s, the pencil 1.6–2.5 s, camera flights about 2 s, a 1 s hold on
  each result. Taps while a step plays are ignored, nothing advances by itself, the quiet ▶ plays a finished step again.
- **Camera**: per step a box to fill (`FRAMES` in `src/bench.js`); the frame in use glides toward it each frame. A three-quarter view
  from the pencil's side, 24° round and 10° up in landscape, 36–38° round in portrait, where the bench is long for the width.
  The student may turn the view all the way round (the kit's rotate cue, সামনে, the how-to row).
- **Rays** are painted on a 2D canvas over the view, from the exact points of `src/reading.js` projected through the camera (the chapter 8
  style: amber with a dark edge, small chevrons, virtual extensions dashed): crisp at any size and no draw calls. The rays are the book's
  three rules of a thin lens, bending once on the lens's middle plane as the book draws them. They agree exactly with
  1/u + 1/v = 1/f (tested: every drawn ray passes through X′ to 1e-9 cm), so the image the formula gives is where the rays meet.
  The third ray is drawn in its own step only, and only where it meets the glass (u ≥ about 28 cm); the cases use the book's two rays.
- **The screen** catches what really falls on it: each point spreads over the lens's width × |1 − s/v| (`onScreen`); the picture is the
  pencil's, read from a smaller copy of its texture for the blur (the sister figure's way). Sharp within 0.75 cm snaps to the image.
  With no real image (inside F, at F) the paper goes outside the screen step: there is nothing to catch.
- **Numbers**: the image comes from the formula. The book gives no lens formula in 9.4.2 (it teaches the rays), so the formula is
  never printed; the panel shows the result as a live readout ("প্রতিবিম্ব লেন্সের ওপাশে, ৪৫ cm দূরে"; u, v and "২ গুণ" from the
  উদাহরণ on), and the graph.
- **The graph** (`src/graph.js`, SVG in real pixels for its box): v against u, real half shaded warm above the u axis, virtual half
  cool below, the asymptotes u = f and v = f dashed in violet, the 2F point, the pencil's place now as an amber dot. In its own step it
  takes the rule's place on a phone held upright; a tall side panel shows it from the cases on.
- **Handles**: the pencil (from the cases on) and the screen (in its step, and while it follows a real image) carry the kit's drag
  handle; arrow keys move the screen in its step and the pencil afterwards (→ moves it right, toward the lens).
- **The test** (5 questions, numbers as choice indices, shuffled): the rule for a parallel ray (points ক খ গ on the axis or "straight
  on"); the kind of image for a pencil read off the scale against F and 2F; where to hold the screen, read off two drawn rays (the
  four tags are F′, the pencil's own distance, 2F′ and the meeting point); where the screen catches a pencil inside F (nowhere); and the
  উদাহরণ with other numbers (40 ↔ 24 or 60 ↔ 20 cm). Each wrong choice has its own note. A browser test answers all right (5/5) and
  all wrong (0/5).

## Honest notes
- Only two (or three) rays in one plane are drawn, out of countless; the note "রশ্মি পাতলা লেন্সের নিয়মে আঁকা" says how. A real lens
  this strong (15 cm across, f = 15 cm) bends its rim rays a little more than the thin-lens rules (spherical aberration); the figure
  draws the book's rules.
- The picture on the screen is sharp at one place only; a real image of a pencil in a lit room is dim, the figure shows it clearly.
- The image is scaled by m in every direction; in truth its depth scales by m². A pencil is thin, so it does not show. A magnified
  image longer than the height of the axis (m > 3, u < 20 cm) runs through the rail, as in a ray drawing; past v = 64 cm it leaves the
  frame and a tab says where it is.
- The eye is the textbook's side-view icon, not a face (the owner's wish).

## Performance (measured with a temporary script, 844 × 390, shadows on)
- Draw calls / triangles of one frame, from four azimuths 90° apart: F–2F case 48/20k, 36/19k, 95/51k, 92/50k; inside F 36–95 / 19–51k;
  the three-ray step 30–95 / 18–51k; the parallel bundle 34–89 / 18–48k. The heaviest view: 95 draws, 51k triangles (the shadow pass
  included). Idle: 0 draws once the camera settles.
- JS per animated frame at 6× CPU throttling (the pencil gliding with rays, image, screen, labels and graph following; GL calls'
  own time taken out): median 1.1 ms, 90th percentile 2.1 ms, worst 2.9 ms.
- Time to ready (software WebGL, shadows on): about 4 s. Textures: one 1024 × 256 scale, one 256 × 512 pencil picture, a 128² glow,
  a 4 × 256 backdrop. The shaders of later steps' parts (screen, both images, the glows) are compiled ahead with `stage.warmUp`.

## Open questions for the book team
- **F and F′.** The text writes F for the focus the rays go through after the lens (চিত্র 9.23, ৯.২৫), the figures ৯.২৪ and ৯.২৬ write F
  on the object's side and F′ on the other. The figure uses F (object's side) and F′ (far side) throughout, as ৯.২৪/৯.২৬; the rule of
  the parallel ray then says "F′ দিয়ে যায়". Is that the edition's wish?
- **The order of the outside-F cases.** The intro of p262 lists F–2F, beyond 2F, at 2F; the text then treats F–2F, at 2F, beyond 2F. The
  figure follows the text's order.
- **2F, 2F′, u, v** are not printed on these pages (the book marks the distances f, 2f); the figure uses them as short labels.
- The book writes "চিত্র 9.23" with Latin digits in one place; the figure's caption keeps the book's form.
- The figure says "আলোকীয় কেন্দ্র" (9.4's term) for O; 9.4.2's text says "লেন্সের কেন্দ্রবিন্দু". Both are used where the book uses them.

## Round 2 (the independent review)
- **No panel scrolls** at any of the six sizes in any step, case or question (measured: `.pvc-panel` scrollHeight ≤ clientHeight in 22
  states and all five questions with each of the four choices). In short side panels the how-to row steps aside in the graph and table
  steps and keeps one line elsewhere (the pill and সামনে by their pictures, the handles with their words); the graph is 104 px there,
  132 px at 800 × 500.
- **Test**: Q2 shows the letters F, F′, 2F, 2F′ (not its answer), the frame takes in 2F, every wrong choice has its own note, and u = 30
  can be asked (সমান). Q4 uses u = 9 (the image 22.5 cm away, not on 2F′) and choices of a like length. Q5 prints neither number: the
  pencil on the scale and the sharp picture on the screen are read off the picture.
- **Scale**: one 0, at the lens; digits in weight 600, less squeezed; each carrier's brass pointer now lies on the printed strip with
  its tip on the ticks.
- **Image size**: tighter frames per case that follow the pencil and its image (the rail stays in view: the handles run along it).
  The real image's height on the screen, px:

  | u (cm) | 390 × 700 | 844 × 390 | 640 × 400 | 390 × 520 |
  |---|---|---|---|---|
  | 9 (virtual) | 109 | 137 | 100 | 93 |
  | 22.5 | 59 | 76 | 56 | 51 |
  | 30 | 33 | 43 | 31 | 29 + magnifier |
  | 45 | 15 + magnifier | 19 + magnifier | 14 + magnifier | 13 + magnifier |

  Under 30 px the kit's magnifier (`createLoupe`) sits on the image and the paper, 2–4× (the drawing and the letters keep clear of its
  glass). It costs one more render while it shows: 130 draws / 55k triangles at most, still inside the budget.
- **Words**: a small caption "পেনসিল (cm)" before the row of distances; readouts use m = … (chapter 8's symbol, not গুণ); the rays are
  named প্রথম / দ্বিতীয় / তৃতীয় beside the book's rule numbers; the inside-F rule adds the book's "F এর যত কাছে, তত বড়; লেন্সের যত
  কাছে, তত ছোট"; English shortened so nothing is cut at 390 × 700.
- **Labels**: the far-image tab, the image chip (a narrower one-line chip on views under 420 px), the virtual image's chip (now under
  its foot, clear of X′), the point of light's label; the paper leaves when the real image is off the bench. The ghost is front faces
  only, so it is really 45 %. The screen step frames 13 cm of room right of the paper.
- **Poster**: the F–2F case with the screen. **Video**: 20 s, the four cases.
- Performance after round 2: draws/triangles from four azimuths at most 130 / 55k (u = 45 with the magnifier), 121 / 51k (the
  parallel step with its screen), 92 / 50k otherwise; idle 0; JS per animated frame at 6× CPU median 1.0 ms, worst 3.1 ms.
