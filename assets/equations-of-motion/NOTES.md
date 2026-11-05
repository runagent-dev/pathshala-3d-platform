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
With uniform acceleration (সমত্বরণ) the distance gone from where the motion starts is s = ut + ½at² and the velocity is
v = u + at: s is the sum of two parts (how far it would go at its first velocity, and the extra from the acceleration),
so s grows as a parabola in time while v grows in a straight line.

## Terms (as in the book)
গতির সমীকরণ, আদি বেগ (u), শেষ বেগ (v), ত্বরণ (a), সময় (t), অতিক্রান্ত দূরত্ব (s), গড় বেগ (V), সমত্বরণ, সুষম ত্বরণ,
ধনাত্মক, ঋণাত্মক, মন্দন; "বেগ–সময় গ্রাফ" for the graph, as the book's উদাহরণ and the 2.6 figure write it. Formulas in
Latin letters and digits as the book prints them (v = u + at, s = ut + ½at², v² = u² + 2as, V = (u+v)/2); numbers in
Bangla digits. Units as the book: m/s for velocity (p40), ms⁻² for acceleration (p44), m, s; a number and its unit
never part at a line break.

## Version 3.1.0: deep blue (2026-11-05)
The owner, with a screenshot of the pale frame: "can you make the thing in a deep blue background so it is vivid and
everything looks very beautiful." The layout, the content and the behaviour are exactly 3.0.0; only the look changed,
and this replaces every light-blue colour written below (the 2D part is in style.css only, the kit is untouched):
- **The frame**: a vertical gradient #0b2a5b → #123d7a, a soft glow behind the formula, a faint vignette. The kit's
  tokens are set for this figure on `.pvc.eom`; `--panel` and `--soft` stay opaque for the kit's cards, and what floats
  on the frame (buttons, tabs, test options) is glass, rgba(255,255,255,0.08) with a thin light border.
- **Colours**: text #f1f5ff; u #6cb6ff, a #5fd38a, t #d5dbe7, s #b79cff (one `COLORS` in app.js and `--c-*` in style.css).
  The arrows on the slope keep fuller fills (#2a86ff, #1fb45c, `ARROWS`): the pale text colours washed out under the
  3D lights. A chosen tab or the main test button is bright blue with dark text (white on #6cb6ff fails contrast).
- **The strip**: the canvas is transparent, so the frame is its sky. The slope is deep blue concrete, the ruler strip dark
  with light ticks, the numbers near-white, the chips dark (#0c2450) with bright borders, the arrows outlined in near-
  white. The asphalt, the car and the road paint are unchanged; the kerbs are a little bluer so they don't glare. A soft
  horizon glow sits behind the road: `.eom-strip::before`, at `--horizon`, which app.js sets from the road's far edge;
  `capture` paints the same glow.
- **Contrast**, measured on rendered pixels at 1280×800, 844×390 and 390×700 (learn, running, test, answered): every text
  ≥ 4.5 : 1. A wrong or right answer on the phone needed a darker fill than a tint of its own colour.
- `bg=transparent` keeps the light text, so it now suits a dark host page only (the parameter's help says so). The value
  `light` keeps its name (a URL parameter), though it now means the deep blue frame.

## Version 3.0.0: the book's form, no x₀ (2026-11-05)
The owner, looking at 2.0.0: **"here you can see why we added x₀, but in the book, is there any x₀?"** There isn't: x₀
came with the owner's reference lab; the book writes s = ut + ½at² (with v = u + at, v² = u² + 2as, s = ((u+v)/2)t). So
the one-frame layout stays exactly (the owner's explicit choice, below) and the content is now the book's:
- The formula is s = ut + ½at² and the sentence says s is the sum of the two parts ut and ½at². The x₀ slider, arrow and
  chip are gone; the car always starts at 0 on the number line. The axis stays −7…10 m, so a negative u or a can still
  show the car going back, and with s < 0 the sentence says so (the book, p45: all but t can be ধনাত্মক or ঋণাত্মক).
- Term: **অতিক্রান্ত দূরত্ব s** (দূরত্ব–সময় গ্রাফ), the book's word on p45 and the word `falling-bodies` uses. Not সরণ:
  the book's list on p45 says দূরত্ব, even though it lets s be negative along the line. Not অবস্থান: nothing here is
  a position any more.
- The sliders are u, a, t; the graphs s–t and v–t with s = (½a)t² + (u)t and v = (a)t + (u); under the axis ut (blue) from 0
  and ½at² (green) ending at s; the car's chip says "s = … m". Where the frame is at least 640 px tall, a quiet check line
  under the graphs: v² = u² + 2as = … m²s⁻² (it fits nowhere shorter without crowding).
- Bridge: `x0` is gone from the URL parameters and from `set` (a host that still sends it is ignored); `get` reports `s`
  and parts { ut, half } in place of `x` and parts { x0, ut, half }; the `end` event carries `s`. Hence 3.0.0.
- The opening values stay u = 1.9 m/s, a = 1.7 ms⁻²; the car now reaches 10 m at about 2.49 s (2.62 s before).

**The graphs' colours** (the owner, same day: "make the graph colour a little bit slightly colourful"): s is violet
(#6741d9) across the figure, the curve, the dot on the axis, the drop line and the car's chip, because it is its own
quantity and blue already means u. The v–t line runs from the blue of u to the green of a along the run (v = u + at),
and stays blue when a = 0. Both are solid: the run so far bold, the rest thin and faint, the moment's dot filled in the
curve's colour there. The plots are tinted #f3f8ff with soft blue-grey axes and grid.

## Version 2.0.0: the owner's reference (2026-11)
(Everything below about x₀, the x–t graph and the three arrows is the history of 2.0.0: see 3.0.0 above.)
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
  "শেষ মাথায় থামল" and the sentence under the formula says so; the t slider can't go past that moment. With u and a opposite,
  the sentence says when the car stops for a moment and turns back (t = −u/a).

## The one-frame layout: the owner's override of the kit's side panel (2026-11-04)
The owner sent the reference again and said: **"I want exactly this layout, just the background colour a bit blue, but
with our book's topic concept."** So, for this figure only, the kit's standard layout (`buildStudentShell(…, { layout:
'side' })`: the panel beside the 3D, full height, with a hide tab) is not used: everything sits in one frame, as in the
reference. The figure still builds the kit's shell (for the test, the hint and the turn-sideways card on touch phones
held upright) and rearranges it: its panel is not shown, the tabs and the full-screen button go to the top-left corner,
the test sheet takes the place of the sliders while it is open, and the 3D stage becomes the bottom strip. Nothing in
`shared/` changed, and `npm run check` and the layout test pass as they are (neither checks for the side layout).

## How the figure works
- **The frame** (style.css, a grid over the deep blue gradient, #0b2a5b → #123d7a): at the top the formula
  s = ut + ½at² (½ stacked) with one short sentence under it; on the left the buttons stacked, white with a thin
  border as the reference: চালাও, থামাও (each greyed while it can't act), আবার শুরু, and the two time steps side by
  side (an icon and a small word, পেছনে / সামনে; 0.1 s on the grid); in the middle three long sliders, u blue, a green,
  t grey (darker track, black knob), each value written over its knob in its colour ("u = ১.৯ m/s", kept inside the
  track) and its Bangla name (আদি বেগ, ত্বরণ, সময়) at its right end; on the right the s–t graph and under it its live
  equation s = (½a)t² + (u)t, then the v–t graph with v = (a)t + (u), the numbers in their quantities' colours, then on
  a tall frame the check line v² = u² + 2as; along the bottom, across the full width, the 3D strip. Landscape frames
  scale the same layout down (the strip is about a quarter of the width tall, at most 43–47 % of the height); portrait
  frames stack it: the tabs and the formula, the two graphs side by side, the sliders, the buttons in one row, the
  strip (on a short portrait frame the sentence is dropped). Nothing scrolls; every control is at least 24 px.
- **The sentence** under the formula: the sum "সমত্বরণে অতিক্রান্ত দূরত্ব s দুই অংশের যোগফল: ut আর ½at²" (each part in
  its colour), or the moment the car stops for a moment and turns back (t = −u/a), or that s is negative, or that it
  reached an end of the axis (in orange). At most two lines.
- **The graphs** (graphs.js): dark glass cards with light axes with arrowheads, named s or v and t, a few small
  numbers and faint grid lines, colours as under 3.0.0. In a test question the planned curve is not shown. Each SVG is
  drawn at its own pixel size (redrawn when its box changes), so its text keeps its size.
- **The 3D strip** (track.js, car.js): seen from the side as the reference (straight on, 9° from above, a narrow 9°
  field of view so it is almost free of perspective and the drop line stays upright), with a transparent background.
  A dark asphalt road with a dashed centre line, white edge lines and light kerbs runs out of the picture at both
  sides; its front is a gentle slope (62°) of deep blue concrete that runs out of the picture at the bottom. Along
  its top a dark ruler strip is the number line (the axis line from the left edge to an arrowhead past 10, a tick
  every metre, a small one every half metre; the numbers −7 … 10, bold, and "s (m)" are drawn on a 2D overlay so they
  stay crisp, every other one where a metre is under 22 px). Under it two rows carry the parts as thick outlined
  flat arrows tip to tail: ut (blue) from 0, ½at² (green) ending at s, a dot where a part is 0, each with a dark chip
  "ut = ৩.৮ m" beyond its tip (else its tail, and never over the other arrow); a faint line down from 0, and a dashed
  drop line from under the car through its dot on the axis down to where ½at² ends (= s). The car: a blue four-door
  sedan, 4.1 m long, glossy, with windows, lights and five-spoke rims that turn with the motion (backwards when it
  reverses; a blur at speed); it always faces +x (a negative velocity is the car reversing). A violet dot on the axis
  marks s, a dark chip over its roof says "s = ৭.২ m". The camera fits the whole axis with the car at either end into
  the strip; the strip can't be turned by dragging (the reference's picture is fixed); `set({ view: '3d' })` still
  flies to a three-quarter view and the corner's "শুরুর দৃশ্য" button brings it back.
- **Behaviour**: চালাও runs the time in real seconds from where it is (from 0 after the end). A change of u or a
  while running goes back to the start of the new run; while paused it shows the same moment with the new numbers
  (as the reference). Dragging t pauses and shows that moment. Keyboard: Space runs or pauses, the arrow keys step
  the time (a focused slider moves itself), Tab reaches every control.
- **Test** (in the place of the sliders and the graphs while it is open, its head beside the tabs; 5 tap questions,
  one of each kind in a random order): s after t s (the car's label hidden); v = u + at; a read from an s equation (½a
  is the t² number); when v = 0 from a v equation; and the part ½at² read off the picture (s from the axis, ut from
  its chip, its own chip "?"). Wrong choices are real mistakes (no ½, only ut, only ½at², the final velocity for the
  whole time, only one second, sign, multiplied, a/u, ½a doubled twice, the whole s, ut added instead of taken away,
  no square, …), each named in the worked answer; the reveal runs the car to that moment. While a question is open
  the live equations show "(?)" for their numbers (they would give the answer away) until the answer is revealed.
- **Bridge**: set { u, a } (kept in range on 0.1 steps), { t } (seconds, or 'end'), { playing }, { step: ±1 },
  { view }; a `x0` is ignored; get reports u, a, t, s, v, parts { ut, half }, tEnd, end ('left' | 'right' | null),
  playing, phase (ready | running | paused | done), mode, view; events change (at most every 0.2 s while running), run,
  pause, end, view. The GLB is the road with its number line and the two arrows, and the car where it is, in metres
  (the road is 51 m long, so it runs out of every frame; the graphs are HTML and not in it).

## Open questions
- The book has no picture here; the lab's form is the owner's choice (a GeoGebra lab), its content the book's.
- A negative s called অতিক্রান্ত দূরত্ব: the book's own wording (p45), but a teacher may prefer সরণ for those cases.
- The book's s = Vt and its worked example are no longer shown; they were in version 0.4 (git history).
- The car faces +x even when it moves left (reversing), as the reference's.
- The layout departs from the kit's side panel on the owner's word (above); if the kit later gains a "one frame"
  layout, this figure is its first user.
