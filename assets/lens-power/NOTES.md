# Notes: Power of a lens (লেন্সের ক্ষমতা)

Book: physics-9-10 › 9.4.3 › p264 (pages 264–266). Page images in `reference/` (page-264, 265, 266).

## What the pages show
- p264 (last lines) – p265: spectacles are made of convex or concave lenses; people talk of their "পাওয়ার" (ক্ষমতা). The idea comes
  from how much a lens enlarges or shrinks: two convex lenses, a thing at the same distance near them; the one that shows it bigger
  has more power, and that is the one with the shorter focal length (চিত্র ৯.২৭: two ray diagrams, the pencil XY inside F′ of both,
  the image X′Y′ about 1.5× and about 3×). So P is inversely proportional to f; with f in metres P is in ডায়াপটার. The example:
  glasses of power 2.5 have f = 1/P = 1/2.5 m = 0.4 m. A concave lens: the smaller it shows a thing at the same distance, the more
  power and the shorter f. Convex: power positive; concave: negative.
- p266, নিজে করো: draw the rays and find the image for XY before a concave lens, outside F (চিত্র ৯.২৮); before a convex lens inside
  f (চিত্র ৯.২৯ a) and outside f, F close to the lens (চিত্র ৯.২৯ b).

## The one idea to teach
A lens's power is P = 1/f (f in metres, unit ডায়াপটার): the shorter the focal length, the more the lens bends light and the bigger it
shows a thing at the same distance; convex lenses have a positive power, concave lenses a negative one.

## Terms (as in the book)
লেন্সের ক্ষমতা (পাওয়ার) P, ফোকাস দূরত্ব f, ব্যস্তানুপাতিক, ডায়াপটার (the page spells it so; common.md writes ডায়অপ্টার: the figure
follows the page), চশমা, উত্তল লেন্স, অবতল লেন্স, ধনাত্মক বা পজিটিভ, ঋণাত্মক বা নেগেটিভ, "একই দূরত্বে", নিজে করো. From 9.4.1–9.4.2
(and as the sister figures): ফোকাস বিন্দু, আলোকীয় কেন্দ্র O, প্রধান অক্ষ, সমান্তরাল, প্রতিবিম্ব (অবাস্তব / বাস্তব), সোজা / উল্টো, বস্তু
XY, X′. Added by the figure, not on the page: আলোর বাক্স (as lens-types), "আগের লেন্সের F′" (the focus of the lens before), বেশি
বাঁকা / আরও বাঁকা লেন্স (a lens with more curved faces), গুণ (how many times as big), u, v, m (as convex-lens-image).

## How the figure works
- **Calm first card** (`intro`, `intro_short` at 390 × 520 and on a phone held sideways): the book's own question about spectacles,
  the ray box and the convex lens on the table, "চলো দেখি". Then one plain lead-in line, the result and the rule per step, the
  book's term last and in bold. Nothing advances by itself; a tap while a step plays is ignored (the hint says wait).
- **Steps** (the row of words: ফোকাস · পেনসিল · দুই লেন্স · ক্ষমতা · অবতল; the action walks eight scenes, `SEQ` in `src/app.js`):
  1. ফোকাস (`focus`): the lamp comes on; five parallel beams travel to the lens and out of it and meet at F′, 40 cm away (the book's
     glasses lens). ফোকাস বিন্দু F′, ফোকাস দূরত্ব f = ৪০ cm; the F′ point drops to the printed scale.
  2. পেনসিল (`pencil`): the ray box goes back along the rail, the pencil is set down 12 cm before the lens; the book's two rays
     (parallel → through F′; through O, straight), their dashed backward lines meet at X′: an upright ghost 1.43 times as big, the
     textbook eye on the far side. F and F′ marked, আলোকীয় কেন্দ্র O named. (চিত্র ৯.২৭, the first lens.)
  3. দুই লেন্স (`compare`): the lens is lifted out of its ring holder and a more curved one (f = 20 cm) set in: the same pencil now
     2.5 times as big; the F′ of the first lens stays as a faint ring. The rule: the book's sentence (চিত্র ৯.২৭).
  4. ক্ষমতা (`power`, then `power20`, `power10`): the first lens comes back (f = 40 cm, the book's glasses): the beams meet at 40 cm;
     P = 1/f = 1/(0.4 m) = +2.5 ডায়াপটার as a formula in the panel, the label on the lens, the P–f graph with its first dot; the rule
     says these are the book's glasses. Then the more curved lenses, one tap each: f = 20 cm, +5; f = 10 cm, +10 ("ফোকাস দূরত্ব অর্ধেক,
     ক্ষমতা দ্বিগুণ"), each a new dot.
  5. অবতল (`concave`, then `concave20`): a concave lens; the beams spread, dashed back to F 40 cm on the light's side: f = −0.4 m, P = 1/(−0.4 m) = −2.5; then a
     more curved one, −5 (the book's sentence on concave lenses). The graph's left branch (f < 0, P < 0) fills.
- **The test** is offered after the last scene only (the kit's পরীক্ষা tab stays): five questions, each setting up its own scene:
  read P for a new convex lens (f = 25 cm, drawn and labelled, because a phone cannot read the tilted scale between its tens: the student does the 1/f step; +4); the book's নিজে করো, one of চিত্র ৯.২৯(a), ৯.২৯(b), ৯.২৮ at random
  (F and F′ marked, no rays; after the answer the rays and the image are drawn); the comparison (a lens of less power in place of
  +5: smaller); read P for a new concave lens (the same way; −4); the book's glasses (P written on the lens; f = 0.4 m; on a retake
  another pair, +2.5, +2 or −2, so it cannot be answered from memory). No number in a question's text: the student reads it off the 3D
  (the f bar, the lens's label). Wrong answers are the usual mistakes (f left in cm: 0.04; P
  taken to be f: 25; the sign; 2.5 m; 0.4 cm; 4 m; bigger / same / upside down; real or virtual, bigger or smaller), each with its note.
- **Camera**: one guided three-quarter view per scene (from the light's side, as the sister lens figures, 22° round and 11° up; 30°
  on a tall view, which also gives up the far ends), flights of 1.7 s; 360° orbit with the kit's rotate cue and the সামনে button.
- **Interaction**: the action button, or a tap on the lens (or the ray box at first), does the next scene; the step words jump; the
  quiet ▶ plays the scene again (from the lens before); arrows ← → step, R resets, F returns to the start view. The kit's how-to row
  (orbit, front, tap the lens) beside the 3D on wide frames; on a phone held sideways and under the 3D it is left out (the view's pill
  and button stay).
- **Layout**: beside the 3D on every landscape frame (the kit's side layout), the graph growing into the free height; under the 3D the
  two sheets have one fixed height (286 px, 244 px at 390 × 520), so the 3D view keeps one height in every state, including the intro
  card and revealed answers (measured: see below).

## Copied from the sister figures
The lens glass, the two-half lens stand with its black ring (setShape), the carriers, the ray box with its five holes and the tracer
(`sag`, `makeLens`, `traceLens`, `refract`) are copied from **lens-types**; the rail, the two-row scale (0 at the lens), the pencil and
the image ghost/solid from **convex-lens-image**; the 2D ray drawing (amber rays with a dark edge, chevrons, dashed backward lines,
the eye, the f bar, the big F/F′/O letters on white tabs) follows both. A shared optics-bench kit module will come later; until then
these are copies, kept the same.

## Physics and honest notes
- **Exact rays for the measurement.** Each lens is two spherical faces of the book's glass (n = 1.52); its faces are chosen (by
  bisection) so that the traced focus of rays near the axis lies exactly f from the lens's centre. The five beams (±2.4 cm) are traced
  through both faces with Snell's law: the outer ones cross the axis a little nearer (39.8 cm for f = 40, 19.6 for 20, 9.1 for 10:
  spherical aberration), as real ones do. The pencil's two rays follow the book's thin-lens rules, bending once on the middle plane
  (as the book and convex-lens-image draw them); they pass exactly through X′ (unit-tested).
- **f carries the sign in P = 1/f.** The book gives no sign rule for f; it says the power of a convex lens is positive and of a concave
  lens negative. The figure uses the usual P = 1/f with f negative for a concave lens, shown in the reading (f = −0.4 m,
  P = 1/(−0.4 m) = −2.5), and the rule says so in one line. The f bar on the 3D shows the distance (f = 40 cm) in both cases.
- **F and F′** follow convex-lens-image and lens-types: F on the light's side, F′ on the far side (the book's চিত্র ৯.২৪/৯.২৬; চিত্র
  ৯.২৭ itself labels them the other way round). So the convex lens's beams meet at F′; the concave lens's seem to come from F.
- **The +10 ডায়াপটার lens is 10 cm across**, not 15: a 15 cm lens cannot have f = 10 cm (a hemisphere of glass gives about 11 cm).
  The other lenses are the sisters' 15 cm.
- The pencil is the sisters' 6 cm pencil at 12 cm: the images are 1.43 and 2.5 times as big (the book draws about 1.5 and 3).
- In the নিজে করো (b) question the lens is the 20 cm one with the pencil at 45 cm (beyond 2F): F′ is close to the lens, as the book
  draws it.

## Measurements (kit 1.9.1, Chromium software WebGL, 844 × 390, shadows on)
- Draw calls / triangles per frame in the guided view: power and concave20 40/19.2 k, compare 41/19.9 k; with the shadow map redrawn
  in the same frame (the lens lift, the ray box's slide) 75–76 / 34.7–35.9 k, after the review took the carriers and the stand rods
  out of the shadow pass (it was 139/59.1 k at the worst angle before). Budget 150 / 300 k.
- JS per animated frame at 6× CPU throttling (a scene played again: lens swap, beams): 0.9–1.0 ms on average, 4.5 ms at most.
- Idle: 0 draws once the orbit's damping has settled. Time to ready about 3–4 s under software rendering (shared machine).
- GLB 556 KB, 9,230 triangles; zip 471 KB.
- Layout (both languages, all six sizes, 20 states each: 9 scenes, 5 questions before and after the answer, the result): one canvas
  height per size (390 × 700: 345 px, 49 %; 390 × 520: 213; the side layouts the full height), panel scroll 0, no sheet overflow,
  the P–f graph 120–146 px on the short side layouts (340 at 1280 × 800), no label on another label, a ray, the action's badge, the corner buttons, the rotate pill or the panel tab, no `{placeholder}` left.

## Open questions for the book team
- ডায়াপটার (page) vs ডায়অপ্টার (the batch's common terms): the figure writes the page's spelling.
- চিত্র ৯.২৭ labels F′ on the object's side and F on the other; the chapter's sister figures use the opposite (৯.২৪/৯.২৬). Which?
- The book writes "চশমার ক্ষমতা যদি হয় 2.5" without a unit or a sign; the figure writes +২.৫ ডায়াপটার (convex).
- The book's নিজে করো is a drawing exercise; the figure asks for the kind of image and draws the rays after the answer. Is that
  acceptable in place of drawing?
