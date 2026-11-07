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
- Lines: traced from the real field (E added as vectors, RK4, `src/field.js`), never drawn by hand. About 16 from each q all
  round (a Fibonacci lattice of 20, without those aimed steeply down the stand into the bench) or, in "সমতলে", 16 in the
  plane z = 0 as চিত্র ১০.১১. Loose ends are blunt, not needles. Light gold #ffd43b tubes with a dark
  hull, one merged mesh per configuration; arrowheads one instanced mesh. Every set is built at load and hidden. They
  grow along the field (a shader discards what lies past `grow` metres) and nothing is rebuilt per frame.
- Six steps, one tap each, slow: ① +q; ② q₀ to half the distance, E four times (10 → 5 cm, 3,600 → 14,400 N/C), the old
  point stays on the graph as a ring; ③ −q: the lines draw in and the force turns (q₀ back at 10 cm: the same size as ①, the
  other way); ④ unlike pair; ⑤ like pair, E = 0 in the middle; ⑥ −2q and +q, twice the lines. q₀ can be dragged in ①–③ and ⑤.
- Panel (lead on tall panels only, the action says it on phones): action, result, the reading (E, and F = q₀E worked out)
  and graph, the rule. One charge: E against r. A pair: size of E along the line between the spheres, with E = 0 marked for
  the like pair. q and q₀ stand in the graph's top row. On a tall panel the book's first example is printed under the rule.
- The result is always true of where q₀ stands: dragged off the middle of the like pair it gives that E; dragged in ② it
  gives the r and E of that place.
- The test runs on the flat cut: lines that can be read and counted. In a 3D view −2q and +q is a tangle.
- "সমতলে" pulses gently after each step until it has been tried (`coach` param).
- A 3D view under 260 px (390×520): tighter framing, no word beside q₀'s handle. Upright, q₀ is drawn 1.3 times bigger.
- q₀ stops every half centimetre, so r and E on the panel are of the same place, and E = 0 can really be reached.
- Force arrow: teal #0ca678, white outline, dark edge, starts on q₀: 3.5 mm of arrow per 1000 N/C, always to scale. In ③ q₀
  may not go nearer than 7 cm, so the pull's arrow never runs into the sphere; in ④ (11,250 N/C, 3.9 cm) it just clears −q.

## Decisions, and what isn't the book's
- **q = 4 × 10⁻⁹ C** for the live numbers: kq = 36 N m²/C, so E comes out round. The book's examples use whole coulombs; a
  real lab charge is nC–μC (common.md: keep the book's numbers as its own, don't pretend). The reading says "q = … ধরে"
  and the tall panel says why q is small.
- **q₀ / টেস্ট চার্জ** is from the next page (p.287, ১০.৬). This page says "কোনো চার্জ q আনা হয়", but the same letter is
  already the sphere's charge in E = kq/r², so the figure needs a second name, and writes the book's F = Eq as F = q₀E.
- **q₀ = 1 × 10⁻⁹ C** for the reading's F. It is a test charge: its own field is left out of the lines.
- The test charge is shown only on the axis, where the force is along the line of the charges (off the axis the panel
  would need vectors the page doesn't draw).
- Lines stop at the bench top. The real field runs on below it; the bench is a stand, not part of the physics.
- Pair lines stop 40 cm from the middle or 15 cm from the charges' plane (a long loop would swing past the camera). These cut
  lines are big closing loops, so "+q এর বলরেখা গিয়ে −q তে শেষ" holds for them too, though about a third are cropped, as the
  book's own figure crops them. −2q and +q also have a second zero beyond +q, at d/(√2 − 1) ≈ 39 cm from +q (46.6 cm from the
  middle of the pair): the page doesn't mention it, and nothing shows it.
- The round view seeds no line steeper than about 33° below level: they would only run down the stand into the bench.
- The book's second example (10 N on 3 C → 3.33 N/C) isn't shown; it is a division, with nothing to see.

## Terms (as in the book)
তড়িৎ ক্ষেত্র, ক্ষেত্র প্রাবল্য, তড়িৎ বলরেখা, কাল্পনিক, পজিটিভ / নেগেটিভ চার্জ, কেন্দ্রীভূত, স্পর্শক, বিপরীত চার্জ, সমচার্জ, কাটাকাটি, ওপর (p.284
writes ওপর); units N/C. Added from p.287: টেস্ট চার্জ, q₀.

## Measured (software rendering, shadows on, 844×390)
| Step | Draw calls | Triangles | Ready (ms) |
|---|---|---|---|
| ① +q | 24 | 23,906 | 2414 |
| ④ unlike | 31 | 34,390 | 2565 |
| ⑤ like | 25 | 43,760 | 2469 |
| ⑥ −2q | 18 | 40,070 | 2011 |

Only one set of lines shows at a time and the lines are not frustum culled, so the count doesn't change with the angle. While
q₀ slides, the graph moves three parts by their attributes (2 rebuilds in the whole slide, not one per frame).

GLB sizes by step: ① 421 KB, ④ 509 KB (the shipped one, `export.glb`), ⑤ 697 KB, ⑥ 651 KB. `npm run verify` checks the first
screen's GLB, not the shipped one: these were read off `export-glb` after each `set`.

q₀ across: 35 px at 390×700, 30 px at 390×520, 25 px at 844×390.

Canvas height, the same in every step, flat view, test question and answer: 364 (390×700), 229 (390×520), 390 (844×390),
400 (640×400), 500 (800×500), 800 (1280×800).

## Open questions
- Should the book's second example (3.33 N/C) appear? Left out as above (the review agrees).
- The book prints a repeated phrase ("কাল্পনিক এক ধরনের রেখা এঁকে" twice) on p.284: not reproduced.
