# Notes: Car taking a bend (বাঁক নেওয়া গাড়ি)

Book: Physics 9–10 (পদার্থবিজ্ঞান), chapter 2 (গতি), page 36, topic 2.2, the third of three paragraphs on the page
(after সরলরৈখিক গতি and ঘূর্ণন গতি). Screenshot: `reference/page-36.png`.

## What the page shows
Text only, no picture for this paragraph:

> চলন গতি (Translational Motion): কোনো কিছু যদি এমনভাবে চলতে থাকে যেন বস্তুর সকল কণা একই সময় একই দিকে যেতে
> থাকে তাহলে সেটা হচ্ছে চলন গতি। আমরা আমাদের চারপাশে মাঝে মাঝে এরকম অনেক উদাহরণ দেখতে পাই। গাড়ির ঘূর্ণায়মান চাকা
> বিবেচনায় না আনলে সোজা এগিয়ে যাওয়া একটা গাড়ির গতি চলন গতির উদাহরণ; গাড়ির প্রতিটি বিন্দু একই সময় একই দিকে একই
> দূরত্ব অতিক্রম করে।

## The one idea to teach
The book's example of চলন গতি is a car going straight ahead (সোজা এগিয়ে যাওয়া). The same car taking a bend is not
চলন গতি: each point goes its own distance, in its own direction. Split from `translational-motion` (v1.0.0): one
scene per lab; that lab has the straight road.

## Terms (as in the book)
চলন গতি, কণা, একই সময়, একই দিক, একই দূরত্ব, অতিক্রম করে, ঘূর্ণায়মান চাকা, বিবেচনায় না আনলে, বিন্দু, সোজা এগিয়ে
যাওয়া গাড়ি. Units: মিটার (the chapter uses দূরত্ব for distance; সরণ comes later). Spelling as the book: উপরে.


## How the figure works
- The same real-size family car as `translational-motion` (4 m long, wheelbase 2.4 m, wheels 0.637 m across) with
  the same four painted points (সামনের বাম্পার, পেছনের দিক, জানালা, ছাদ; one hue each, names on labels while the car
  stands at the start). The tyre point is hidden: it belongs to the straight road.
- The car takes a quarter turn (rear axle radius 5 m), turning as it goes; each point follows its own circle round
  the turn centre and leaves an outlined trail with an arrowhead: ১০.৪ ≠ ৯.৪ ≠ ৮.০ ≠ ৯.৩ মিটার, ✗ চলন গতি নয় (shown
  after 0.5 m). Same car, same points as the straight lab, only the motion changes.
- No metre marks (they belong to the straight road). The camera is a long lens from far away (10°), from higher up
  so the arcs show, fitted to the car's real path. Top speed 2.2 m/s with a gentle start and stop.
- Drag the car, tap it, press চালাও, or arrow keys.

## The test (3 questions, 4 tap choices each, a worked answer naming the student's own mistake)
1. `turn`: the car takes the bend; is it চলন গতি? Wrong choices include "no, because the wheels turn" (they turn going
   straight too). If answered mid-drive, the bend is finished so the numbers are the end's.
2. `far`: which point went farthest round the bend (all four labelled)? The front bumper: farthest from the turn
   centre, biggest circle.
3. `which`: which of these is (or is not) চলন গতি, with look-alike pairs (ড্রয়ার/দরজা, বাক্স পিছলে/বল গড়িয়ে, লিফট,
   বাঁক নেওয়া গাড়ি, সাইকেলের চাকা).

## Bridge
`get` → `{ distance, distances: { front, window, roof, back }, translational: false, playing, view, mode }` (metres,
2 decimals; `distance` is how far the rear axle has gone, 0 to 7.85). `set` takes `distance` (with `animate: false`
it jumps, otherwise the car drives there), `playing`, `view`. Events: `change`, `drive`, `view`, `dragstart`,
`dragend`, `practice-*`. GLB: the car with its painted points (metres).
