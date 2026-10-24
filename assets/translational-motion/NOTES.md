# Notes: Translational motion (চলন গতি)

Book: Physics 9–10 (পদার্থবিজ্ঞান), chapter 2 (গতি), page 36, topic 2.2, the third of three paragraphs on the page
(after সরলরৈখিক গতি and ঘূর্ণন গতি). Screenshot: `reference/page-36.png`.

## What the page shows
Text only, no picture for this paragraph:

> চলন গতি (Translational Motion): কোনো কিছু যদি এমনভাবে চলতে থাকে যেন বস্তুর সকল কণা একই সময় একই দিকে যেতে
> থাকে তাহলে সেটা হচ্ছে চলন গতি। আমরা আমাদের চারপাশে মাঝে মাঝে এরকম অনেক উদাহরণ দেখতে পাই। গাড়ির ঘূর্ণায়মান চাকা
> বিবেচনায় না আনলে সোজা এগিয়ে যাওয়া একটা গাড়ির গতি চলন গতির উদাহরণ; গাড়ির প্রতিটি বিন্দু একই সময় একই দিকে একই
> দূরত্ব অতিক্রম করে।

## The one idea to teach
In চলন গতি every particle (every point) of the body moves the same distance in the same direction at the same time.

## Terms (as in the book)
চলন গতি, কণা, একই সময়, একই দিক, একই দূরত্ব, অতিক্রম করে, ঘূর্ণায়মান চাকা, বিবেচনায় না আনলে, বিন্দু, সোজা এগিয়ে
যাওয়া গাড়ি. Units: মিটার (the book's chapter uses দূরত্ব for distance; সরণ comes later).

## How the figure works
- The book's own example, made visible: a real-size family car (4 m long, wheels 0.637 m across, so one turn of a
  wheel = 2 m) on a road, with four painted points (stickers): সামনের বাম্পার, দরজা, ছাদ, পেছনের বাম্পার, one
  colour each (the same colour in 3D, trail and panel).
- The student drags the car along the road (or taps it, or presses চালাও; arrow keys too). Each point leaves a
  trail with an arrowhead from a ring where it started; a faint outline stays where the car started. The panel
  reads how far each point went: straight ahead `৪.০ = ৪.০ = ৪.০ = ৪.০` and the verdict ✓ চলন গতি. Metre marks on the
  road let the student check it.
- The two conditions in the book's sentence become the two contrasts:
  - **ঘূর্ণায়মান চাকা** (button চাকার বিন্দু): a point on the front tyre rolls along up-and-down arches (a cycloid:
    it touches the road, stops for an instant, rises, comes down after each 2 m) and goes about 4.8 m while the body
    goes 4 m. That is why the book leaves the wheels out. The camera turns more to the side so the arches show;
    the body's trails turn lighter so the wheel's path stands out.
  - **সোজা এগিয়ে যাওয়া** (top-left choice সোজা / বাঁক): round a bend (rear axle radius 5 m, a quarter turn) the car
    turns as it goes, each point follows its own circle: ১০.৪ ≠ ৯.৭ ≠ ৮.০ ≠ ৯.৩ মিটার, ✗ চলন গতি নয়. Same car, same
    points, only the motion changes: চলন গতি is about how a body moves, not what it is.
- The camera is a long lens from far away (field of view 10°), almost a parallel projection, so equal trails
  look equal on screen wherever they are. It frames the whole drive for the frame's shape: from the front corner
  on tall phones, more from the side on wide frames, from higher up for the bend.
- Speeds are a car creeping off (top speed 1.6 m/s straight, 2.2 m/s round the bend) with a gentle start and stop;
  real time, not slowed down.
- The test (5 questions, 4 tap choices each, a worked answer each):
  1. `dist` (always first): the car drives d m; one point's distance is given, another's asked. Wrong choices:
     where that point ends up on the metre marks, one car length more, double, half.
  2. `which`: which of these is (or is not) চলন গতি: লিফট, ড্রয়ার, ট্রেনের বগি vs বৈদ্যুতিক পাখা, ঘড়ির কাঁটা, লাটিম,
     বাঁক নেওয়া গাড়ি (the page's own examples of ঘূর্ণন গতি are পাখা and ঘড়ির কাঁটা).
  3. `wheel`: which path does this point on the wheel take (a label points at it); the worked answer drives the
     car and draws the arches. Wrong choices: straight with the car (the book's warning), a circle in one place (the
     view from inside the car), straight backwards.
  4. `turn`: the car takes the bend; is it চলন গতি? Wrong choices include "no, because the wheels turn" (they turn
     going straight too).
  5. `lift`: a lift's floor rises d m, how far does its roof rise (the lift is 2.5 m tall): d, not d + 2.5.

## Bridge
`get` → `{ path, distance, distances: { front, door, roof, back, wheel }, translational, wheel, playing, view, mode }`
(metres, 2 decimals; `distance` is how far the rear axle has gone). `set` takes `path`, `distance` (with
`animate: false` it jumps, otherwise the car drives there), `wheel`, `playing`, `view`. Events: `change`, `drive`,
`path`, `view`, `dragstart`, `dragend`, `practice-*`. GLB: the car with its painted points (metres).

## Open questions
- The book's paragraph has no picture: the placement is "next to the paragraph". A book developer may prefer it
  after the paragraph.
- Car colour: neutral silver so the four point colours carry the meaning; a Bangladeshi vehicle (CNG, bus) was
  considered but the book says গাড়ি.
