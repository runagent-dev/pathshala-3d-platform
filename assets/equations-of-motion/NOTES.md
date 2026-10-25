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
গতির সমীকরণ, আদি বেগ (u), শেষ বেগ (v), ত্বরণ (a), সময় (t), বিবেচ্য সময়কাল, অতিক্রান্ত দূরত্ব (s), গড় বেগ (V),
সমত্বরণ, সুষম ত্বরণ, ধনাত্মক, ঋণাত্মক, বেগ (graph axis), সময় (graph axis). Formulas in Latin letters and digits as the
book prints them (v = u + at, s = ut + ½at², v² = u² + 2as, V = (u+v)/2); numbers in Bangla digits. Units: m, m/s,
m/s² (the book writes m/s for velocity on page 40 and ms⁻² for acceleration on page 44; m/s² keeps the pair alike).

## How the figure works
- A commuter train car (16 m, broad gauge as in Bangladesh) on a straight double-track railway, seen from the front
  a little above; white posts every 10 m with their numbers. Real sizes, real time (a 6 s run takes 6 s).
- Three steppers set u (0–15 m/s), a (−1.5 to 1.5 m/s² in steps of 0.5: what a real train does) and t (1–10 s).
  A braking train stops and never goes backwards: if a would stop it before t, t is cut to when it stops (the panel
  says so); one more second is refused, and a negative a at rest is refused (it would go backwards).
- চালাও (or a tap on the train) runs it. The graph draws v = u + at; the area under it fills in 1-second strips in
  two blues, the same as the distance bar under the train (from the start post to the nose): equal seconds,
  unequal distances, and the area is always where the train is. A drag on the train shows any moment.
- On the far track a see-through train (raspberry, the colour of V) runs the whole time at V = (u + v)/2 and arrives
  with the real one. The dashed V line crosses the velocity line at half the time (the book's sentence). At the end
  the triangle above V turns half round into the gap below it: the trapezium becomes the rectangle V × t, s = Vt.
- The panel writes v = u + at, V = (u + v)/2, s = Vt, s = ut + ½at², v² = u² + 2as with the student's numbers, and one
  line on what to see now.
- The graph and the railway's labels are drawn on a 2D overlay canvas (crisp, collision-checked, part of `capture`);
  the camera fits the railway into its part of the stage with an off-centre projection.
- Test (5 tap questions, one of each kind, numbers from a real train): the final velocity; the distance (by
  ut + ½at² or from the graph's area); the average velocity or the velocity at half time; no acceleration (v or s);
  braking to a stop (the distance from v² = u² + 2as, or the time from v = u + at). Wrong choices are real mistakes
  (forgot u, forgot ½, used v × t, divided wrongly, the sign of a, …); the worked answer names the mistake, and the
  run then plays to check it.

## Open questions
- The book writes ms⁻² for acceleration (page 44); the figure writes m/s² beside m/s. Change if the owner prefers.
- The book's picture is a graph only; the train is our own idea (the 2.6 figure uses a street vehicle).
