# Notes: Electric field (তড়িৎ ক্ষেত্র)

Book: physics-9-10 › 10.5 তড়িৎ ক্ষেত্র (Electric Field) › pages 283–286. Reference: `reference/page-283.png` … `page-286.png`.
The exact Bangla of the topic: `ch9-10-briefs/pages/10.5.md`.

## What the page shows
- p.283: the field is defined like g for gravity: a quantity that, multiplied by a charge, gives the force on it. Boxed:
  E = kq/r² (তড়িৎ ক্ষেত্র বা ক্ষেত্র প্রাবল্য).
- p.284: F = Eq; E is a vector, unit N/C. The field can't be seen; তড়িৎ বলরেখা are "পুরোপুরি কাল্পনিক" lines (Faraday). The
  world is three-dimensional, so the lines spread everywhere; they are drawn in one plane only to show them. চিত্র ১০.১১:
  16 lines out of + and into −. Rules (a) out of +, into −, the tangent is the field's direction; (b) more charge, more
  lines; (c) the closer the lines, the bigger E; (d) a line of one charge never runs over a line of another.
- p.285: চিত্র ১০.১২ (a) unlike: the lines of one end on the other, they seem to pull; (b) like: they seem to push apart, the
  fields cancel in the middle, a point where E = 0. Two negatives: only the directions change.
- p.286: examples 5 C at 10 m → 4.5 × 10⁸ N/C; 10 N on 3 C → 3.33 N/C; চিত্র ১০.১৩: −2q and +q.

## The one idea to teach
Every charge fills the space round it with an electric field (E = kq/r², the force on a unit positive charge); the lines
start on + and end on −, never cross, and crowd where the field is strong.

## How the figure works
- Scene (metres, book bench top y = 0): polished metal spheres (r = 2.5 cm) on clear acrylic rods on heavy bases, 16 cm
  apart in a pair, on a plain sand bench in the calm blue; a small red test charge q₀ on its own thin stand. Same red +
  and blue − as `coulombs-law`, sign always drawn, facing the camera.
- Lines: traced from the real field (E added as vectors, RK4, `src/field.js`), never drawn by hand. 24 from each q all
  round (a Fibonacci lattice) or, in "সমতলে দেখো", 16 in the plane z = 0 as চিত্র ১০.১১. Light gold #ffd43b tubes with a dark
  hull, one merged mesh per configuration; arrowheads one instanced mesh. Every set is built at load and hidden. They
  grow along the field (a shader discards what lies past `grow` metres) and nothing is rebuilt per frame.
- Six steps, one tap each, slow: ① +q; ② q₀ to half the distance, E four times (12 → 6 cm, 2,500 → 10,000 N/C), the old
  point stays on the graph as a ring; ③ −q: the lines draw in and the force turns (q₀ at 10 cm, 3,600 N/C, so the arrow clears
  the sphere); ④ unlike pair; ⑤ like pair, E = 0 in the middle; ⑥ −2q and +q, twice the lines. q₀ can be dragged in ①–③ and ⑤.
- Panel (lead on tall panels only, the action says it on phones): action, result, the reading and graph, the rule. One
  charge: E against r. A pair: size of E along the line between the spheres, with E = 0 marked for the like pair. The
  4 × 10⁻⁹ C note stands next to the reading. On a tall panel the book's first example is printed under the rule.
- q₀ stops every half centimetre, so r and E on the panel are of the same place, and E = 0 can really be reached.
- Force arrow: teal #0ca678, white outline, dark edge, starts on q₀: 4 mm of arrow per 1000 N/C, always to scale. In ③ q₀
  may not go nearer than 7 cm, so the pull's arrow never runs into the sphere; in ④ (11,250 N/C, 4.5 cm) it just clears −q.

## Decisions, and what isn't the book's
- **q = 4 × 10⁻⁹ C** for the live numbers: kq = 36 N m²/C, so E comes out round. The book's examples use whole coulombs; a
  real lab charge is nC–μC (common.md: keep the book's numbers as its own, don't pretend). The reading says "q = … ধরে"
  and the tall panel says why q is small.
- **q₀ / টেস্ট চার্জ** is from the next page (p.287, ১০.৬). This page says "কোনো চার্জ q আনা হয়", but the same letter is
  already the sphere's charge in E = kq/r², so the figure needs a second name. The sentence F = Eq keeps the book's form.
- The test charge is shown only on the axis, where the force is along the line of the charges (off the axis the panel
  would need vectors the page doesn't draw).
- Lines stop at the bench top. The real field runs on below it; the bench is a stand, not part of the physics.
- Pair lines stop 40 cm from the middle or 15 cm from the charges' plane, thinning out at the cut (a long loop would swing
  past the camera). −2q and +q also have a second zero beyond +q, about 39 cm out: the page doesn't mention it, and nothing shows it.
- The book's second example (10 N on 3 C → 3.33 N/C) isn't shown; it is a division, with nothing to see.

## Terms (as in the book)
তড়িৎ ক্ষেত্র, ক্ষেত্র প্রাবল্য, তড়িৎ বলরেখা, কাল্পনিক, পজিটিভ / নেগেটিভ চার্জ, কেন্দ্রীভূত, স্পর্শক, বিপরীত চার্জ, সমচার্জ, কাটাকাটি, ওপর (p.284
writes ওপর); units N/C. Added from p.287: টেস্ট চার্জ, q₀.

## Measured (software rendering, shadows on, 844×390)
| Step | Draw calls | Triangles | Ready (ms) |
|---|---|---|---|
| ① +q | 24 | 22,942 | 2686 |
| ④ unlike | 31 | 42,428 | 2362 |
| ⑤ like | 25 | 55,338 | 2622 |
| ⑥ −2q | 18 | 52,930 | 2519 |

Only one set of lines shows at a time and the lines are not frustum culled, so the count doesn't change with the angle. The
per-frame line update takes about 0.001 ms in node (8 sets, 50 lines). JS per animated frame under 6× throttling couldn't be
measured: the CDP counter read 0 under the virtual clock.

Canvas height, the same in every step, flat view, test question and answer: 364 (390×700), 229 (390×520), 390 (844×390),
400 (640×400), 500 (800×500), 800 (1280×800).

## Open questions
- Should the book's second example (3.33 N/C) appear? Left out as above.
- q₀ and "টেস্ট চার্জ" are a page early; the alternative is "ছোট চার্জ", with F = Eq reading oddly.
- The book prints a repeated phrase ("কাল্পনিক এক ধরনের রেখা এঁকে" twice) on p.284: not reproduced.
