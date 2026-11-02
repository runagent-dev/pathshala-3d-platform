# Notes: Acceleration on a bend (বাঁকে ত্বরণ)

Book: physics-9-10 › 2.6 › p43. Split from `acceleration` (v1.0.0, one scene per lab): that lab has the straight
road, the pedals and the বেগ–সময় graph; this one the paragraph on turning (a winding path, চিত্র ২.০৫).

## What the page shows
Section ২.৬ ত্বরণ (Acceleration), text, an উদাহরণ and one picture. Text: a body moving at সমবেগ has no ত্বরণ; whenever
the বেগ changes there is ত্বরণ: ত্বরণ হচ্ছে সময়ের সাথে বেগের পরিবর্তনের হার. As বেগ has both দিক and মান, it can change
in two ways: on a winding path, every turn changes the বেগ (ত্বরণ) even at সমদ্রুতি; a stone whirled on a string
(চিত্র ২.০৫) keeps changing direction, so it accelerates. In সরলরৈখিক গতি there is no change of direction: the ত্বরণ
comes only from the change of বেগের মান (দ্রুতি); বেগ বাড়লে বেগের দিকে ধনাত্মক ত্বরণ, কমলে ঋণাত্মক ত্বরণ বা মন্দন
(deceleration). ত্বরণ একটি ভেক্টর রাশি. উদাহরণ: চিত্র ২.০৬ (সময়ের সাথে বেগের পরিবর্তন), a বেগ–সময় graph with four pieces:
A rising (ধনাত্মক ত্বরণ), B flat (ত্বরণ নেই), C rising, D falling (মন্দন বা নেগেটিভ ত্বরণ). Page 44: only straight-line
motion from here on; for সমত্বরণ, ত্বরণ = (অতিক্রান্ত সময়ের শেষে বেগ − অতিক্রান্ত সময়ের আদিতে বেগ) / অতিক্রান্ত সময়, i.e.
a = (v − u)/t; মাত্রা [a] = LT⁻², একক ms⁻². Screenshot: `reference/page-43.png` (page 43 and the top of 44).

## The one idea to teach
বেগ has a direction as well as a size, so turning at a steady speed (সমদ্রুতি) changes the বেগ: it is ত্বরণ, pointing
towards the middle of the turn. Going straight at the same speed there is no ত্বরণ.

## Terms (as in the book)
ত্বরণ, সমবেগ, বেগের পরিবর্তনের হার, দিক, মান, দ্রুতি, সমদ্রুতি, ধনাত্মক ত্বরণ, ঋণাত্মক ত্বরণ, মন্দন, সমত্বরণ, আদি বেগ,
শেষ বেগ, সময়, ভেক্টর রাশি; m/s, s, ms⁻² (the book writes ms⁻² for ত্বরণ; বেগ in m/s, as in 2.5).

## How it works
- A CNG auto-rickshaw (as in `acceleration`) on open sand (soft stripes, nothing else) at a steady 2.5 m/s; **বাঁয়ে** and **ডানে** (held) turn it on a
  circle of 3 m (about the tightest a CNG can turn). The speedometer stays at ২.৫, but the বেগ arrow turns (and a
  compass in the panel shows its direction, with a compass word); while it turns, the circle it goes round is drawn
  dashed on the grass with its middle marked (বাঁকের কেন্দ্র: a dot on the ground and, on a thin stalk, a marker at the
  arrows' height with a dashed radius out to the CNG, so the arrow lines up with the marker on screen in every view; a
  level arrow over the roof would otherwise aim above a mark on the ground), a purple **ত্বরণ** arrow lies along that
  radius and points at the marker (v²/r ≈ 2.1 ms⁻², no
  number shown: the book has no formula for it), and its track on the grass is purple; going straight, the track is
  grey and the label says ত্বরণ নেই. The camera looks half-way between the CNG and the middle of its turn, so both are
  in the picture. The labels there find a free spot every frame (past or beside the arrow tips, round the CNG), clear
  of the buttons, the speedometer, the pedals, the CNG and each other. The panel: দ্রুতি সবসময় একই, বেগের দিক
  বদলাচ্ছে / একই থাকছে, ত্বরণ আছে / নেই.
- Panel: আবার শুরু; the pedals বাঁয়ে / ডানে (press and hold; keys ← / →) and the speed; the compass and the two
  readings (দ্রুতি সবসময় একই, বেগের দিক); ত্বরণ আছে / নেই; one sentence. Views: উপর থেকে (from above, tilted 42°,
  north up) and ঘুরিয়ে দেখো.
- Test (3 questions in a shuffled order, tap answers; the pedals are hidden; the ত্বরণ arrow, the circle and the
  coloured track show only with the answer):
  1. `bend`: going round at the same speed, is there ত্বরণ? (wrong: no, the speed stays the same; no, a change of
     direction does not change the velocity; yes, the speed grows);
  2. `dir`: which way does the ত্বরণ point? (towards the middle; wrong: forwards, backwards, outwards);
  3. `straight`: going straight at the same speed, is there ত্বরণ? (no; wrong: yes because it moves, because of its
     speed, forwards).

## Bridge
`get` → `{ view, mode, pedal, speed, heading, direction, turning, acceleration }`. `set` takes `pedal` ('left' |
'right' | 'none', held until changed), `drive` ([[steer, seconds], …] turned at once from the start, the last one
held; the poster uses it), `restart`, `view`. Events: `change`, `pedal`, `view`, `practice-*`.
