# Notes: The falling apple (মহাকর্ষ: আপেল কেন পড়ে)

Book: physics-9-10 › 3.7 › p79. A new figure the owner asked for, beside `law-of-gravitation` (two iron spheres, p78) and
`law-of-gravitation-earth` (the cut-open Earth and a 1 kg weight). The page is in `reference/page-79.png` (the owner's
crop). The owner's concept picture is a third-party cartoon carrying another company's logo, so it stays out of the repo
and was used only for the idea.

## What the page shows
The law F = G m₁m₂/r² with G = 6.67 × 10⁻¹¹ Nm²kg⁻² (চিত্র ৩.০৭); each mass attracts the other with the same F; for a body
on the Earth, F = G mM/R², "এই বলটিই আসলে বস্তুটির ওজন"; R is measured from the Earth's centre, not from its surface, and
small heights don't count (প্রায় 6370 km); G mM/R² = mg, so g = G M/R²; M = 5.98 × 10²⁴ kg, R = 6.37 × 10⁶ m.

## The one idea
The apple falls because the Earth pulls it with F = GmM/R² (its weight, mg). Divide by m: every body near the ground gets
the same g = GM/R² ≈ 9.8 ms⁻² whatever its mass, and the apple pulls the Earth back with the same F.

## The owner's request
"For gravitational force add another 3D which represents this one [Newton under an apple tree as an apple falls], with
the book's proper content and an interactive formula to show the students how actually the fall happened, with everything
very properly interactive: formula, maybe an easy slider or whatever." Realistic, not cartoonish; one tree, no hills.

## How it works
- **The formula is the panel's heart.** F = G mM/R² with each symbol a button and its value under it, always live. A tap
  shows what the symbol stands for: m and F zoom to the apple and its arrow, M and R fade to the Earth from afar (cut open,
  R from the centre, the two equal pulls, the Earth's own acceleration in the rule), G explains the constant. `g` in the
  line under it turns the formula into g = G M/R², with m gone from it.
- **Two sliders**, m (100–500 g) and h (1–5 m). m changes the apple's size (cube root of the mass) and the arrow (0.25 m
  per newton, to scale); the line under the formula divides F by m, so F grows and g doesn't. There are five real apples, one
  at each whole metre; the h slider picks one and a tap on any apple lets it go.
- **The fall**: exact free fall from `reading.js` on the stage clock, five times slower than life and saying so; a picture
  every 0.1 s; a follow camera rides down with the apple (about 1.1 m tall, so the apple is big on a phone), then pulls back to the
  whole tree so the final still shows the whole trail, with the time and speed on a label.
- **The Earth view repeats `law-of-gravitation-earth`'s cut-open Earth on purpose**, as one step: here it shows where R starts
  and the equal pull on the Earth, for the same apple.
- **h is the apple's lowest point above the ground**, so the fall distance is exactly h whatever the apple's drawn size.
- **It opens close**, on the 2 m apple with the reader and the pole beside it, 32° to the side so the three stand close
  together. A higher apple brings the view up to its own part of the tree; the whole tree shows only with the finished trail.
- **The rule grows**: the pull and the weight → the force stays the same so the speed grows → two masses, same time →
  two heights, the same g.
- **The test**: what stays the same in the fall (the trail), the weight of the apple shown (the mass read off the label),
  which of three alike lines is R (the Earth cut open), the race of 100 g and 500 g on the bare low bough (the reveal plays
  it), the apple's pull on the Earth (a ? on the Earth, the reveal draws the equal arrow). Wrong answers each have their own
  note. Order and masses are shuffled.
- Tall panels (tablet, desktop) also get two small graphs, F against m and g against m, with the student's apple as a dot.
- The reader never moves and is not touched by the apple: the apple lands beside him. The story that it hit his head is
  not history, and the figure doesn't tell it. He is not named on screen ("নিউটন" is also the unit here).

## Honesty
- "আপেল ২.৫ গুণ বড় করে আঁকা · সময় ৫ গুণ ধীর": a real 8 cm apple would be 7 px on a phone. In the corner of the view.
- "গাছ অনেক বড় করে আঁকা" on the Earth view.
- The race question says "বাতাসের বাধা ধরা হয়নি"; the fall ignores air everywhere (at 5 m it hardly matters for an apple).
- GM/R² with the book's values is 9.83; the book rounds to 9.8, and so do the sister figures. Every number here starts
  from g = 9.8 (F = mg: 0.2 kg → 1.96 N, so F ÷ m is exactly 9.8 at every slider stop). The 9.83 shows once, on the Earth
  view: g = GM/R² = ৯.৮৩ ≈ ৯.৮ ms⁻². A student who works the chips out by hand gets 1.97 N, and that step shows why.

## Open questions for the book team
- The page writes মহাকর্ষ and মাধ্যাকর্ষণ both; the figure keeps মহাকর্ষ বল for the force and মাধ্যাকর্ষণের ত্বরণ for g.
- "টান" is used beside the book's "আকর্ষণ করে" where a plain word reads better (as in the sister figures).
- Newton's clothes follow the 1660s, drawn from general knowledge of the period, not from a portrait.
- The 5 m apple needs a tall old standard tree, as was usual then; modern orchards are lower.

## Weight
One frame during a fall, on the software renderer, is about 40–47 draw calls and 59–75k triangles. The foliage is one
instanced mesh with its shade baked per spray, so it needs no lights or shadows of its own; idle, nothing is drawn. It takes
about 5 s to build there. CPU time per frame on a real phone is not measured.
The GLB is 941 KB: tree, reader, pole, apples, with every tenth leaf spray drawn 2.6 times bigger (`LeavesLight`, on a layer
the camera never draws). Bark 256 px, apple skin 256 × 128.
