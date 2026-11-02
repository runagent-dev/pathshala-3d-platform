# Notes: Circular motion (ঘূর্ণন গতি)

Book: physics-9-10 › 2.2 › p36 (second of three figures on the page: সরলরৈখিক গতি, ঘূর্ণন গতি, চলন গতি)

## What the page shows
Page 36 (`reference/page-36.png`), the second paragraph, with no picture:

> ঘূর্ণন গতি (Circular Motion): একটি বস্তু যদি একটা নির্দিষ্ট বিন্দু থেকে সমদূরত্বে থেকে বৃত্তাকার পথে ঘুরতে থাকে,
> তাহলে তার গতিকে বলে ঘূর্ণন গতি। বৈদ্যুতিক পাখা, ঘড়ির কাঁটা এগুলো ঘূর্ণন গতির উদাহরণ হলেও চমকপ্রদ একটা উদাহরণ
> হচ্ছে আকাশের চাঁদ। চাঁদকে কোনো কিছু দিয়ে পৃথিবীর সাথে বেঁধে রাখা নেই তবু এটা পৃথিবীকে ঘিরে ঘুরছে, শুধু তাই নয়,
> এটা টুপ করে পৃথিবীতে পড়েও যাচ্ছে না!

## The one idea to teach
An object that keeps the same distance from a fixed point and goes round it on a circle is in ঘূর্ণন গতি.

## Terms (as in the book)
ঘূর্ণন গতি, নির্দিষ্ট বিন্দু, সমদূরত্ব (সমদূরত্বে), বৃত্তাকার পথ, বৈদ্যুতিক পাখা, ঘড়ির কাঁটা, চাঁদ, পৃথিবী; for the fan's
blade the figure says "ফ্যানের পাখা" as page 37 does. The panel quotes the book's definition word for word, with
its three key terms in the colours of the drawing: নির্দিষ্ট বিন্দু purple (the dot at the centre), সমদূরত্বে orange
(the dashed line and the measured numbers), বৃত্তাকার পথে blue (the traced path). Under it, the book's line about
the chosen example (for the Moon: "চাঁদকে কোনো কিছু দিয়ে পৃথিবীর সাথে বেঁধে রাখা নেই, তবু …").

## How the figure works
- Three chips switch between the book's examples: a ceiling fan seen from below (as from a bed), a wall clock's
  second hand, and the Moon going round the Earth. Each turns by itself (the right way: the fan anticlockwise seen
  from below, the clock clockwise, the Moon anticlockwise seen from above the North Pole, always the same face to
  the Earth). The first time (with the pointers on) the camera starts beside the fan, so it reads as a ceiling fan
  with its rod and canopy, then settles under it, where its circle is round.
- Each shows the fixed point (purple dot, labelled just below the hub), a dashed orange line from it to the moving
  point, and the blue circular path the point traces (labelled once half of it is drawn). For the Moon the whole
  orbit is also drawn faintly from the start, since in empty space nothing else shows the circle.
- The dashed line says "? সেমি" until the student measures. The student touches the moving point (or anywhere on
  the turning blade/hand/Moon, not the motor): it stops under the finger and its distance is measured. A thin line
  is left there, the number appears on the dashed line and goes into the panel: `৭০ = ৭০ = ৭০ = ৭০`. Four
  measurements at four different places (a second one at the same place does not count) give the finding:
  "দূরত্ব সবসময় সমান!" (for the Moon "দূরত্ব প্রায় সমান!"), the numbers flash, and the next example's chip glows.
  Dragging turns the example round by hand (the point can only move along its circle); letting go measures there.
  The panel's দূরত্ব মাপো measures on pointerdown; থামাও/চালাও pauses and plays. Keys: arrows turn it, M measures,
  space plays/pauses, 1/2/3 choose the example, F/V the view.
- Labels move with the example and keep clear of it: the distance rides beside the dashed line and steps aside
  from the Earth, the Moon, the hub and the other labels.
- Honest stylisation, said quietly after the book's line in the panel (until v0.2.0 it was a note in the corner of
  the 3D view): the fan turns much slower in the picture (ছবিতে পাখা অনেক ধীরে ঘোরে), the clock's time runs faster
  (ছবিতে সময় দ্রুত চলে), and for the Moon sizes, distance and time are not to scale (আকার, দূরত্ব, সময় মাপমতো নয়).
- Real numbers: a 56-inch (1400 mm) fan, the mark near the blade tip 70 cm from the axis; a 31 cm clock, the mark on
  the second hand 12 cm from the pin; the Moon about 3,84,400 km = 3.84 lakh km from the Earth's centre, always
  with "প্রায়" (the real orbit is slightly elliptical, 3.63–4.06 lakh km; the book's circle model is enough here).
  The distances are measured on the model (the point's position relative to the fixed point), not typed in.
- Test (5 questions, order shuffled), each with a worked answer:
  1. which of four lettered points is the fixed point (the example keeps turning, so three letters go round and one
     stays; the clock's minute-hand tip is a slow trap; each letter sits on its own side of its point);
  2. the distance from the fixed point after half a turn or one turn, fan or clock (wrong answers: the distance from
     the start, the length of path walked, half the radius or the diameter); the answer then plays as an animation;
  3. what does not change (distance from the fixed point vs position, direction of motion, distance from the start;
     the dashed line shows "?" until the answer);
  4. which everyday motion is circular (a paper pinwheel's tip or a stone on a string vs the book's straight-line
     examples), over the plain turning fan;
  5. the Moon: what kind of motion it is (ঘূর্ণন, সরলরৈখিক, চলন, সরল স্পন্দন), or where its fixed point is (Earth's
     centre, surface, the Moon's centre, halfway), the Earth's and the Moon's names on the far sides of the bodies.
- Period (পর্যায়কাল) and periodic motion are not taught here: they are the next figure (page 37). That is also why
  "পর্যায়বৃত্ত গতি" is not a choice in the Moon question: by page 37 the Moon's motion is periodic too.

## Open questions
- Should the fan have a speed regulator (the fan turns faster, the distance stays the same)? Left out to keep it
  simple.
- The Earth's own spin is not shown (it would turn 27 times per lunar turn); the panel's aside says the time is not
  to scale.

## Owner colour update (0.1.1)
The owner explicitly requested vivid backgrounds and strong object contrast, overriding the usual white scene.
The learning panel stays white; transparent embeds and explicit capture backgrounds remain supported.

Navy/teal backdrop, turquoise fan blades and copper-orange hub/clock rim; bright scene paths retain darker matching label inks.
(Replaced in v0.2.0 by a setting for each example, below.)

## Polish pass (2026-11-01, v0.2.0)
The owner's standard for every figure (docs/agents/polish-pass.md).
- **Layout.** 3D on top, the panel below (beside it only on short, wide frames, as the kit does); no figure CSS moves
  it. On a phone held upright the 3D view has 389 of 700 px (56 %, was 376): the test sheet is a little tighter
  there (44 px answers, 16 px question), so the panel is 311 px. The panel keeps one height in every state: every
  line was filled with every text it can show (Bangla and English) at all six sizes; the English lines that ran to
  an extra line were shortened.
- **Text on the 3D view.** Labels only: নির্দিষ্ট বিন্দু, the distance (`? সেমি`, `৭০ সেমি`, `প্রায় ৩.৮৪ লক্ষ কিমি`) and
  বৃত্তাকার পথ. The corner note moved into the panel, after the book's line; the Moon's fixed-point label lost its
  "পৃথিবীর কেন্দ্র" (32 characters), which now heads the measurements instead ("পৃথিবীর কেন্দ্র থেকে দূরত্ব").
- **Setting and colour.** No more flat navy backdrop. The fan hangs from the warm plastered ceiling of a room
  (lighter towards the window, darker in the corners, its faint soft shadow beside it), with two wooden beams, blue
  walls with a picture rail and a window, a red-oxide floor; the camera stays under the ceiling. The clock hangs on
  that blue plastered wall (lighter towards the lamp). The Moon goes round the Earth in a night sky of stars, thick
  along a Milky Way band. The motor is now dark copper, so the orange distance line stands out on it.
- **Arrows and marks.** Every mark is in its panel colour inside a white rim: the blue path, the orange dashed
  distance, the measured lines and their dots, the ring of the test's "after half a turn". Before, pale inks made
  for the navy backdrop (a yellow dashed line, a light blue path) were hard to see on the clock's white face. Orange
  text (labels, panel words, measured numbers) uses the darker #c2410c (5.2:1 on white; #e8590c was 3.6:1).
- **Smooth, with the detail kept.**
  - Shadows: soft VSM at 512 px in a box fitted round the casters (the fan's motor, rod and blades; the clock's frame),
    instead of 2048 px over a loose box with every part casting; at this softness they look the same.
  - The clock's dial (60 ticks and 12 numerals) is drawn once into one 1024 px texture: one draw call instead of 14.
  - The room is one inside-out box, one ceiling, one merged woodwork mesh, all on one shader (plaster map and vertex
    shading); the plaster grain is one 512 px array computed in a few milliseconds and shared by every surface (a
    canvas-drawn version held the start up for seconds on a slow device). No anisotropic filtering on it (software
    rendering drew three times slower with it).
  - The stars are two point clouds; every overlay dot shares one sphere.
  - Label placement allocates nothing per frame (it runs every frame while the example turns).
  - A moment after the start, the other examples' shaders are compiled and their textures uploaded, so the first tap
    on ঘড়ির কাঁটা or চাঁদ does not stall.
  - The turning itself is the lesson (the fan, the clock and the Moon go round by themselves until paused), so the
    figure keeps drawing while it plays; paused, it draws nothing.
- **Numbers** (headless Chromium, software GL, shadows on, 390×700; before → after): draw calls avg 37 / max 79 →
  40 / 81 (the room, rims and stars added; the dial's 13 calls saved); triangles max 36k → 35k; texture memory
  54 MB (largest 2048 px) → 16.5 MB (largest 1024 px, all three examples' textures included); time to first frame
  about the same (1.6–3.4 s before, 2.3–2.8 s after on the same loaded machine); text on the 3D view 41 characters
  in 3 boxes → 22 in 2; frames drawn while it turns about 9 a second, as before.
- **Bugs fixed.** The pale inks on the clock's white face; the English test's longest questions and answers ran to a
  third line on phones, so the 3D view shrank mid-test (shortened); a transparent capture now leaves the setting
  out. Turning the view now keeps the camera under the ceiling and in front of the clock's wall.

## Declutter pass (2026-11, 0.3.0)
- The scenes were already one object each (the fan, the clock, the Moon); nothing was taken out.
- Panel in the labs' one order: the examples, the actions (দূরত্ব মাপো, থামাও), the measured distances, the
  definition and the book's sentence.
