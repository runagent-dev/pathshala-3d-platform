# Notes: Equations of motion (গতির সমীকরণ)

Book: physics-9-10 › 2.7 › p45 (the section runs onto page 46 and beyond). Screenshot: `reference/page-45.png`.

## What the page shows
Section ২.৭ গতির সমীকরণ (Equations of Motion). Text only on page 45: the quantities of straight-line motion
(u: আদি বেগ, a: বস্তুকণার ত্বরণ, t: বিবেচ্য সময়কাল, v: শেষ বেগ, s: অতিক্রান্ত দূরত্ব); along that line all but t
can be ধনাত্মক or ঋণাত্মক. With no acceleration v = u and s = vt; with সমত্বরণ v = u + at. Splitting the time into
many tiny equal parts, the distances in each part are not equal, because the velocity keeps changing; adding them
needs calculus, unless the acceleration is সুষম. Page 46: we cannot write s = vt, but with the গড় বেগ V we can write
s = Vt; for uniform acceleration the average velocity over a time is the velocity at its exact middle. The page's
only picture is a বেগ–সময় graph: a straight line from u to v, with V = (u+v)/2 at the middle. The book goes on (as
its falling-bodies section confirms) to s = ((u+v)/2)t, s = ut + ½at² and v² = u² + 2as.

## The one idea to teach
With uniform acceleration the velocity grows in a straight line (v = u + at); the distance is the average velocity
V = (u + v)/2 times the time, which is the area under the বেগ–সময় line; from that come s = ut + ½at² and
v² = u² + 2as.

## Terms (as in the book)
গতির সমীকরণ, আদি বেগ (u), শেষ বেগ (v), ত্বরণ (a), সময় (t), অতিক্রান্ত দূরত্ব (s), গড় বেগ (V), সমত্বরণ, সুষম ত্বরণ,
ধনাত্মক, ঋণাত্মক, মন্দন; "বেগ–সময় গ্রাফ" for the graph, as the book's উদাহরণ and the 2.6 figure write it. Formulas in
Latin letters and digits as the book prints them (v = u + at, s = ut + ½at², v² = u² + 2as, V = (u+v)/2); numbers in
Bangla digits. Units as the book: m/s for velocity (p40), ms⁻² for acceleration (p44), m, s; a number and its unit
never part at a line break.

## How the figure works
- A commuter railcar (16 m, diesel, broad gauge as in Bangladesh) on a straight double-track railway, seen from the
  front a little above; white posts every 10 m with their numbers. Real sizes, real time (a 6 s run takes 6 s).
- The camera follows the trains on a fixed 40 m stretch (the train and the widest gap to the V-train, 18.75 m, always
  fit): the train stays about 145 px long on a 390 px phone, 180 px at 844×390, 265 px at 1280×800, in every run and
  in the test; the posts stream past faster and faster.
- Under the railway a trip bar from ০ to the whole distance fills in 1-second segments in two blues, each second's
  distance written on it, with the nose mark and s; the graph's 1-second strips have the same colours.
- Three steppers set u (0–15 m/s), a (−1.5 to 1.5 ms⁻² in steps of 0.5: what a real train does) and t (1–10 s). A
  braking train stops and never goes backwards: if a would stop it before t, t is cut to the last whole second before
  it stops, and the panel says honestly when it stops (to 0.1 s, "প্রায়" when not on a whole second); one more second
  is refused, and a negative a at rest is refused (it would go backwards). A stepper during a run goes back to the
  start of the new plan.
- চালাও (or a tap on the train) runs it. The বেগ–সময় গ্রাফ draws v = u + at; the area under it fills in 1-second
  strips. Touching or dragging the graph or the bar shows any moment, to 0.1 s.
- On the far track an imagined see-through train (raspberry, the colour of V) runs the whole time at V = (u + v)/2 and
  arrives with the real one. The dashed V line crosses the velocity line at half the time (the book's sentence). One
  second after arriving, the triangle above V folds into the gap below it in two flips that stay inside the graph
  (across the half-time line, then down across V), while the s = Vt row is lit; a touch on the triangle or on that
  row folds it again. The panel then says: আয়তক্ষেত্র V × t, ক্ষেত্রফল একই: s = Vt.
- The panel: a headline in the book's words (সুষম ত্বরণে দূরত্ব = গড় বেগ × সময় = বেগ–সময় গ্রাফের নিচের
  ক্ষেত্রফল; on the tightest phone and beside the picture in landscape there is no room, and the sentence under the
  sums says it at the end), then v = u + at, V = (u + v)/2, s = Vt, s = ut + ½at², v² = u² + 2as with the student's
  numbers and the book's names (শেষ বেগ, গড় বেগ, অতিক্রান্ত দূরত্ব), and one line on what to see now.
- The graph, the bar and the railway's labels are drawn on a 2D overlay canvas (crisp, collision-checked, part of
  `capture`); the camera fits the railway into its part of the stage with an off-centre projection.
- Test (5 tap questions, numbers from a real train): the final velocity or the distance by formula; the distance as
  the area under the graph (read off the graph); the average velocity or the velocity at half time read off the graph
  (no numbers in the question); the next second's distance after the first (equal seconds, unequal distances); and no
  acceleration or braking to a stop (from v² = u² + 2as or v = u + at). Wrong choices are real mistakes; the worked
  answer names the mistake; the run then replays (with V, its train and the fold only for the average-velocity
  questions).

## Open questions
- The book's picture is a graph only; the train is our own idea (the 2.6 figure uses a street vehicle).
