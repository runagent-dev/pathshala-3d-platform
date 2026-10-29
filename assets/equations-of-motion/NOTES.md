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
Version 0.2.0 (the owner's three requests: colourful, a separate derivation window, simpler): one colour per
quantity, a sunny setting, one equation at a time, and the সমীকরণ কীভাবে এল sheet.

- A commuter railcar (16 m, diesel, broad gauge as in Bangladesh; cream above a bottle-green lower body with gold
  and red lines, a yellow panel on each cab) on a straight double-track railway, seen from the front a little above,
  in a sunny setting: grass on both sides, a row of round trees behind the far track, blue sky over them. White
  posts every 10 m with their numbers. Real sizes, real time (a 6 s run takes 6 s).
- Colours, one per quantity, the same in the graph, the steppers, the formulas, the derivation sheet and the tags on
  the railway: u teal #0b7285, v (and the velocity line) orange #c2410c, a green #2b7a3a, t purple #6741d9, s blue
  #1c6fd9 (the 1-second strips in two of its tints), V raspberry #c2255c, the triangle ½at² gold (#ffe08a, text
  #8a6100). Every text colour has at least 4.5 : 1 contrast on white; the panel and the graph stay on white.
- The camera follows the trains on a fixed 40 m stretch (the train and the widest gap to the V-train, 18.75 m, always
  fit): the train stays about 145 px long on a 390 px phone, 180 px at 844×390, 265 px at 1280×800, in every run and
  in the test; the posts stream past faster and faster.
- Under the railway a trip bar from 0 to the whole distance fills in 1-second segments in two blues, each second's
  distance written on it, with the nose mark and s; the graph's 1-second strips have the same colours.
- Three steppers set u (0–15 m/s), a (−1.5 to 1.5 ms⁻² in steps of 0.5: what a real train does) and t (1–10 s). A
  braking train stops and never goes backwards: if a would stop it before t, t is cut to the last whole second before
  it stops, and the panel says honestly when it stops (to 0.1 s, "প্রায়" when not on a whole second); one more second
  is refused, and a negative a at rest is refused (it would go backwards). A stepper during a run goes back to the
  start of the new plan.
- The one action (kit 1.3.0 clean sheet): the big numbered চালাও button, whose numbered ring sits on the train while
  it waits (a tap on either, or on the train, runs it; থামাও / চালিয়ে যাও / আবার চালাও follow). The বেগ–সময় গ্রাফ
  draws v = u + at; the area under it fills in 1-second strips. Touching or dragging the graph or the bar shows any
  moment, to 0.1 s.
- One equation at a time: a row of chips (v = u + at · s = ut + ½at² · v² = u² + 2as · s = Vt) chooses it. Under the
  chips the rule says it in plain words first, as a comparison (v: the velocity grows by the same amount every
  second, twice the time gives twice the gain; s: twice the time makes ut twice but ½at² four times, so with u = 0, s
  is exactly four times; braking: the distance grows less than twice; v²: no t in it, with u = 0 four times the
  distance gives twice the velocity; braking: twice the velocity, four times the stopping distance; s = Vt: the
  book's sentence on the average velocity). Then the equation, large, with the student's numbers and the answer in
  its colour (one line on phones, written a little smaller when the sum is long, so the panel never changes height;
  two rows beside the picture and on wide frames).
- Each letter of the big equation is a button: it lights its quantity (u and v as bars up the axes, t along the time
  axis, a as one second's step on the line with "+a", s as the outline of the area and a thicker trip bar, V as its
  line and the imagined train) and puts a tag over the train ("শুরুতে u = ৪ m/s", "প্রতি সেকেন্ডে বেগ +১ m/s", …);
  the rule line then says what the letter means. A second tap puts it out.
- The picture follows the chosen equation. s = ut + ½at² (stopped): the area splits into the rectangle ut (teal) and
  the triangle ½at² (gold; when braking it lies above the line inside the rectangle and is hatched: taken away).
  s = Vt (or V tapped): on the far track an imagined see-through train (raspberry) runs the whole time at
  V = (u + v)/2 and arrives with the real one; the dashed V line crosses the velocity line at half the time (the
  book's sentence); one second after arriving (or at once when the chip is chosen at the end) the triangle above V
  folds into the gap below it in two flips that stay inside the graph; tapping the triangle, V or s folds it again.
- সমীকরণ কীভাবে এল opens the derivation sheet over the whole figure (a card on a pale veil on big frames; closes with
  ✕, Escape, a tap on the veil or বন্ধ করো at the end). Four steps, each a tab: ১ ঢাল (a = (v − u) ÷ t, so
  v − u = at and v = u + at), ২ ক্ষেত্রফল (rectangle u × t, triangle ½ × t × (v − u), with v − u = at the triangle is
  ½at², so s = ut + ½at²), ৩ গড় বেগ (the book: the average velocity is the velocity half-way, V = (u + v) ÷ 2; the
  triangle flips into the gap, the area is the rectangle V × t, s = Vt; then the book's own way: v = u + at put into
  s = (u + v)/2 × t also gives s = ut + ½at²), ৪ t ছাড়া (t = (v − u) ÷ a put into s = Vt gives
  2as = (v + u)(v − u) = v² − u², so v² = u² + 2as; with a = 0 it says this division cannot be done and v = u).
  Each step: a small SVG বেগ–সময় গ্রাফ with the part in use lit in its colour, one plain sentence, then the lines;
  পরের ধাপ shows the next line (with its graph), আগের ধাপ goes back. Every line carries the student's own numbers
  (u, a, t from the steppers: 24 + 18 = 42 m by the area, 7 × 6 = 42 m by the fold, 100 = 16 + 84), and the last line
  of steps 2 and 3 says একই উত্তর. The arrow keys step, Tab stays inside the sheet.
- The graph, the bar and the railway's labels are drawn on a 2D overlay canvas (crisp, collision-checked, part of
  `capture`); the camera fits the railway into its part of the stage with an off-centre projection.
- Test (5 tap questions, numbers from a real train): the final velocity or the distance by formula; the distance as
  the area under the graph (read off the graph); the average velocity or the velocity at half time read off the graph
  (no numbers in the question); the next second's distance after the first (equal seconds, unequal distances); and no
  acceleration or braking to a stop (from v² = u² + 2as or v = u + at). Wrong choices are real mistakes; the worked
  answer names the mistake; the run then replays (with V, its train and the fold only for the average-velocity
  questions). The derivation sheet and the letters are closed and put out during the test.
- Bridge: set { eq: 'v' | 's2' | 'v2' | 'Vt' }, set { hl: 'u' | 'v' | 'a' | 't' | 's' | 'V' | null },
  set { derive: 1–4, part } opens the sheet at a step and line, set { derive: false } closes it; get reports eq, hl
  and derive; the event `derive` reports the sheet's step and line.

## Open questions
- The book's picture is a graph only; the train is our own idea (the 2.6 figure uses a street vehicle).
- The book derives s = ut + ½at² by putting v = u + at into s = (u + v)/2 × t; the sheet shows the area route first
  (as the owner asked) and names the book's route at the end of step ৩. A teacher may prefer the book's order.
