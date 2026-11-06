# Notes: Coulomb's law (কুলম্বের সূত্র)

Book: physics-9-10 › 10.4 বৈদ্যুতিক বল (Electric Force) › pages 279–283. Reference: `reference/page-279.png`,
`page-280.png`, `page-281.png`. The exact Bangla of the topic: `ch9-10-briefs/pages/10.4.md`.

## What the page shows
- p.279: "বিপরীত চার্জ একে অন্যকে আকর্ষণ করে কিন্তু এক ধরনের চার্জ একে অন্যকে বিকর্ষণ করে", the question "ঠিক কতখানি",
  Newton's law of gravitation F = G m₁m₂/r² as the model. চিত্র ১০.০৯: a line from q₁ to q₂ with r over it.
- p.280: the boxed law F = k q₁q₂/r², k = 9 × 10⁹ Nm²/C², the coulomb and the ampere, the charge of the electron and
  proton (±1.6 × 10⁻¹⁹ C), the sign rule (both positive or both negative: F positive, repulsion; one of each: F
  negative, attraction). উদাহরণ 1: +1 C and −1 C 10 cm apart, F = −9 × 10¹¹ N.
- p.281: চিত্র ১০.১০ (a) the two charges with F arrows toward each other; (b) +9 C and +16 C 1 m apart with +q between
  them (x and 1 − x). উদাহরণ 2: where +q feels no force: 9(1 − x)² = 16x², 7x² + 18x − 9 = 0, x = 0.43 (or −3).
- p.282–283: the hydrogen atom (−9.22 × 10⁻¹² N) and the earth–moon example (324 kg of electrons): text only here.

## The one idea to teach
Two charges push apart (like) or pull together (unlike) with equal and opposite forces F = k q₁q₂/r²: the force grows
with each charge and falls as the square of the distance (twice as far → a quarter of the force).

## How the figure works
- Scene (metres): two polished metal spheres (r = 3 cm) on clear acrylic rods (বিদ্যুৎ অপরিবাহী স্ট্যান্ড, the 10.3 term) on
  heavy round bases, each base with an index line to a wooden metre rule printed in cm (0–100, Bangla digits), on a
  plain sand bench in the calm deep-blue setting. A charge is the sphere's colour (positive red #e03131, negative blue
  #1971c2, none: steel) and always its white "+" or "−" (drawn shapes, facing the camera).
- Forces: teal #0ca678 arrows, white outline and dark edge, over the spheres as in চিত্র ১০.১০ (a): pulling in, the
  head ends over its sphere; pushing apart, the tail starts over it. Length in proportion to F (9 × 10¹¹ N = 10 cm;
  the third charge's: its balance force, 4.4 × 10¹¹ N, = 12 cm), cut at 30 cm (the note on the view then says so).
- Steps (one tap each, slow, never auto-advancing; each step word jumps there):
  ① charge them: +1 C and −1 C at 10 cm (example a): two equal and opposite arrows, আকর্ষণ;
  ② the right sphere becomes positive: the arrows shrink, turn and grow back, বিকর্ষণ;
  ③ twice the distance: the right sphere slides from 10 to 20 cm, the arrows shrink to a quarter beside a faint ghost
     of the old one; the panel's F–r graph appears with the 1/r² curve, the old point as a ring, the new as a dot
     ("১/৪ গুণ"); the sphere can now be dragged (10–40 cm, 1 cm steps; the arrow keys too);
  ④ the law: back to the book's example, the formula worked live (F = 9×10⁹ × (+1) × (−1)/(0.10)² N = −9 × 10¹¹ N),
     steppers for q₁ and q₂ (−2 … +2 C, in the graph's corner) and the drag;
  ⑤ example (b): +9 C and +16 C 1 m apart, a third charge +q at 0.2 m with its two pushes F₁ (from +9 C, right) and
     F₂ (from +16 C, left); the student drags +q (or taps the action, which slides it) until they balance at
     x = 0.43 m (it snaps within 1.2 cm); the graph shows the net force on +q against x, crossing zero there (the
     crossing is marked only once found). Dimension lines x and 1 − x on the bench, as in the book's picture.
- Panel: a calm intro card; per step the action, the result (while a step plays, its question), the graph, the rule
  in the book's words. The lead-in line before the action shows on tall side panels only; on phones the action's
  words carry it (room). Kit 1.9.0: createDragHandle on both draggable parts, createRotateCue, createHowTo (collapse:
  only the drag that applies), shader warm-up of every later part.
- Test (5): like charges (−,−: which way?), twice as far (reads F = 8 × 10¹¹ N and r = 15 cm off the picture),
  three times the charge (reads F), the meaning of F's minus sign (+2 C and −1 C, F = −4.5 × 10¹¹ N), the no-force
  point between +4 C and +1 C 0.9 m apart (0.6 m). Every wrong choice has its own note. The graph shows empty axes
  in the test (it would give answers away), except for the last question, which it does not touch.

## Decisions and honesty
- The book's charges (1 C, 9 C, 16 C) are kept: they are the book's numbers. Real charged lab spheres hold nC–μC
  (a million times less and more); a note on wide views in step ④ says "চার্জ বইয়ের হিসাবের, বাস্তবে অনেক কম". The
  spheres are drawn as the book's বিন্দু চার্জ (their centres are what r measures).
- The book's +q is not given a value; for the arrows and the graph of step ⑤ it is +1 C (the place where the forces
  balance does not depend on q, as the rule line says).
- The sign rule is the book's: F > 0 repulsion, F < 0 attraction; the panel shows the sign in the formula.
- Not shown (one idea): the coulomb–ampere remark, the hydrogen example (its r = 0.5 × 10⁻⁸ m is 100× the real Bohr
  radius, a slip noted in pages/10.4.md) and the earth–moon example.
- Added words not on the page: "লব্ধি বল" (the resultant, the term of chapter 3) on the graph of step ⑤, "বর্গের
  ব্যস্তানুপাতিক" (inverse square, the usual NCTB words; the page states only the formula), "দূরত্ব দ্বিগুণ".

## Terms (as in the book)
বৈদ্যুতিক বল, কুলম্বের সূত্র, বিন্দু চার্জ, চার্জ, পজিটিভ / নেগেটিভ, বিপরীত চার্জ, এক ধরনের চার্জ, আকর্ষণ, বিকর্ষণ, ধ্রুবক k,
কুলম্ব (C), দূরত্ব r, "কোনো বল অনুভব না করে", চার্জদ্বয়ের মধ্যবর্তী রেখাংশ; from 10.3: ধাতব গোলক, বিদ্যুৎ অপরিবাহী স্ট্যান্ড.

## Performance (2026-11-07, 844 × 390, shadows on, headless Chromium with software WebGL)
- Heaviest view (step ⑤, three stands and two arrows): a live frame that redraws the shadow map, 53 draw calls and
  21,840 triangles; a `capture` (the ch7 perf.mjs count, which draws more passes) 141 draws and 45,456 triangles, the same
  from four azimuths 90° apart. Step ④: 40 draws and 16,000 triangles live.
- JS per animated frame under 6× CPU throttling (step ④ → ⑤ playing): median 0.9 ms, 90th percentile 2.1 ms.
- Idle: 0 draws; after an orbit, 0 once the damping settles. Ready in about 2.3 s.
- Textures: the rule's two 1024 × 64 canvases, the 4 × 256 backdrop, two 128 × 128 signs; geometry and materials shared
  by the three stands; the later steps' parts are made at load and compiled by `stage.warmUp`.
- GLB (the two spheres on their stands and the metre rule): 146 KB, 4,000 triangles.

## Open questions
- Should step ⑤ show the book's x = −3 root ("নিজেরা চিন্তা করে বের করো")? Left to the student, as the book does.
- "বর্গের ব্যস্তানুপাতিক" is not on page 280; the book team may prefer only the formula.
