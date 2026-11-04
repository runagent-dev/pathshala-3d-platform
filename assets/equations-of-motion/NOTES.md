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
With uniform acceleration (সমত্বরণ) the position is x = x₀ + ut + ½at² and the velocity v = u + at: the position is
the sum of three parts (where it started, how far it would go at its first velocity, and the extra from the
acceleration), so x grows as a parabola in time while v grows in a straight line.

## Terms (as in the book)
গতির সমীকরণ, আদি বেগ (u), শেষ বেগ (v), ত্বরণ (a), সময় (t), অতিক্রান্ত দূরত্ব (s), গড় বেগ (V), সমত্বরণ, সুষম ত্বরণ,
ধনাত্মক, ঋণাত্মক, মন্দন; "বেগ–সময় গ্রাফ" for the graph, as the book's উদাহরণ and the 2.6 figure write it. Formulas in
Latin letters and digits as the book prints them (v = u + at, s = ut + ½at², v² = u² + 2as, V = (u+v)/2); numbers in
Bangla digits. Units as the book: m/s for velocity (p40), ms⁻² for acceleration (p44), m, s; a number and its unit
never part at a line break.

## Version 2.0.0: the owner's reference (2026-11)
The owner sent a GeoGebra lab, "Uniform Acceleration in One Dimension" (`reference/owner-uniform-acceleration.png`,
dev only), and asked: "replace the train with this one, exactly this; just the 3D background can be a bit light blue,
but very beautiful." So the train, the railway, the four equation chips, the derivation sheet and the worked-example
street (versions 0.1–0.4, below in git history) are gone, and the figure is that lab, in 3D and in Bangla:

- What the reference has, all kept: a car on a straight number line (−7 to 10, numbered ticks) with its position
  marked by a dot at x; sliders for x₀ (red), the initial velocity (blue), a (green) and t (grey), each with its
  value; Run, Pause, Reset and the two time steps; the formula x = x₀ + ut + ½at²; a live x–t graph (a parabola) and
  v–t graph (a straight line) with the moment marked, growing as t runs; under the graphs the live equations with the
  numbers filled in, x = (½a)t² + (u)t + (x₀) and v = (a)t + (u); and under the axis the three parts as arrows from
  the start, x₀ red, ut blue, ½at² green, stacked tip to tail so x is their sum.
- Symbol: the book writes the initial velocity **u** (p45: "u: আদি বেগ"), the reference v₀; the figure follows the
  book everywhere (x = x₀ + ut + ½at², v = u + at; the bridge parameter is `u`). x₀ is not on the page: it is called
  আদি অবস্থান, অবস্থান x as in 2.5–2.6.
- Ranges as the reference: x₀ −5…5 m, u −5…5 m/s, a −3…3 ms⁻², t 0…6 s, all in steps of 0.1. The opening values are
  the reference's (x₀ = −0.8 m, u = 1.9 m/s, a = 1.7 ms⁻², t = 0).
- Physics exact: x(t) = x₀ + ut + ½at², v(t) = u + at. When the car reaches an end of the axis (−7 m or 10 m) it
  stops there (the run ends at that exact moment, e.g. 2.62 s for the opening values), its label says
  "শেষ মাথায় থামল" and the panel's sentence says so; the t slider can't go past that moment. With u and a opposite,
  the sentence says when the car stops for a moment and turns back (t = −u/a).

## How the figure works
- **The 3D**: a raised road deck under a light-blue sky (a screen gradient, deeper at the top) on a seamless pale-blue
  floor whose far colour is the sky's lower colour, so they meet without a line; a soft darker patch and the sun's
  soft shadow ground the deck. No scenery or props. The deck's front edge is a white ruler band: the axis line with an
  arrowhead past 10, a tick every metre (0 bolder) and every half metre; the numbers and "x (m)" are drawn on a 2D
  overlay at a readable size (every other number where a metre is under 22 px, e.g. on a phone held upright). Under
  the band, on the deck's pale face, three lanes (thin lines between them) carry the three parts as outlined flat
  arrows: x₀ (red) from 0, ut (blue) from x₀, ½at² (green) ending at x, a dot where a part is 0, each with a chip
  "x₀ = −০.৮ m" placed beyond its tip (else its tail, else above it), never on another chip; a faint line down from
  0 where they all start, and a dashed line from the car's dot down to the end of ½at² (= x).
- **The car** (car.js): a blue four-door sedan, built 4.3 m long and drawn at 0.78 (3.35 m), so it sits on the axis
  like the reference's car: glossy paint, bonnet, cabin and boot, dark glass, pillars, mirrors, handles, grille,
  headlights, tail lights, number plates and five-spoke rims that turn with the motion (backwards when it reverses;
  the spokes blur at speed). It always faces +x, as the reference's (a negative velocity is the car reversing). A
  dark blue dot on the band marks its x; a chip over its roof says "x = ২.৪ m".
- **Camera**: a gentle three-quarter view (lessons 42): 20° to the right, 13° from above, looking down a little more
  (up to 22°) where the frame has height to spare, fitted so the whole axis (with the car at either end and its
  label) fills the view, clear of the corner buttons and the panel's tab. Dragging turns it; the front button
  returns. At 844×390 the car is about 80 px long, at 390×700 about 60 px.
- **The panel** (kit side layout; order: tabs, sliders, action, formula, readings and graphs, sentence): the four
  sliders (the value in its colour over the name, the track filled in its colour up to the thumb; two by two on short
  frames and phones held upright, names hidden on short frames); the kit's action (চালাও / থামাও / চালিয়ে যাও /
  আবার চালাও, its numbered badge on the car until it runs) and three quiet buttons (শুরুতে ফেরাও, এক ধাপ পেছনে,
  এক ধাপ সামনে: 0.1 s on the grid); the formula (`.pvc-formula`, ½ as a stacked fraction); the readings
  "অবস্থান x = …" and "বেগ v = …" over two small `.pvc-graph` SVGs (x from −7 to 10 m, v from −12 to 12 m/s, t from
  0 to 6 s, fixed scales; the planned curve faint and dashed, the part already run solid, a dot at the moment); the
  live equations under them, each number in its quantity's colour; and one sentence (`.pvc-note`): the sum
  "x = x₀ (লাল) + ut (নীল) + ½at² (সবুজ)" (names as well as colours), the turn-back moment, or the end of the axis.
- **Behaviour**: চালাও runs the time in real seconds from where it is (from 0 after the end). A change of x₀, u or a
  while running goes back to the start of the new run; while paused it shows the same moment with the new numbers
  (as the reference). Dragging t pauses and shows that moment. Keyboard: Space runs or pauses, the arrow keys step
  the time (a focused slider moves itself), Tab reaches every control.
- **Test** (5 tap questions, one of each kind in a random order): x after t s with x₀ read off the axis (the car's
  label hidden); v = u + at; a read from an x equation (½a is the t² number); when v = 0 from a v equation; and the
  part ½at² read off the picture (x from the axis, x₀ and ut from their chips, its own chip "?"). Wrong choices are
  real mistakes (no ½, no x₀, no a, the final velocity for the whole time, only one second, sign, multiplied, a/u,
  the whole x, …), each named in the worked answer; the reveal runs the car to that moment.
- **Bridge**: set { x0, u, a } (kept in range on 0.1 steps), { t } (seconds, or 'end'), { playing }, { step: ±1 },
  { view }; get reports x0, u, a, t, x, v, parts { x0, ut, half }, tEnd, end ('left' | 'right' | null), playing,
  phase (ready | running | paused | done), mode, view; events change (at most every 0.2 s while running), run, pause,
  end, view. The GLB is the road with its number line and the three arrows, and the car where it is, in metres.

## Open questions
- The book has no picture here; the lab is the owner's choice (a GeoGebra lab). x₀ and the position–time graph are
  not on page 45 (the book's 2.7 uses s, the distance gone): a teacher may want s = ut + ½at² named next to
  x − x₀ = ut + ½at².
- The book's other equations (s = Vt, v² = u² + 2as) and its worked example are no longer shown; they were in
  version 0.4 (git history).
- The car faces +x even when it moves left (reversing), as the reference's.
