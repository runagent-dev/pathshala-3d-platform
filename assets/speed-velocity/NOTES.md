# Notes: Speed and velocity (দ্রুতি এবং বেগ)

Book: physics-9-10 › 2.5 › p40 (the section runs onto p41)

## What the page shows
Section ২.৫ দ্রুতি এবং বেগ (Speed and Velocity), text only (no picture of its own). দ্রুতি is the rate of change of
দূরত্ব with time (20 সেকেন্ডে 100 m → v = 100 m / 20 s = 5 m/s; মাত্রা [v] = LT⁻¹). বেগ is the rate of change of
সরণ with time (50 m in a given direction in 20 s → 2.5 m/s, in that direction); বেগ is a ভেক্টর, so its দিক must be
given. In সরল রৈখিক গতি the two hardly differ: বেগের মানটিই দ্রুতি. Then উদাহরণ on page 41: the winding road of
চিত্র ২.০৪ (page 39), by cycle from A to B in 20 minutes: গড় দ্রুতি = মোট অতিক্রান্ত দূরত্ব / মোট সময় (the
screenshot is cut off there; on চিত্র ২.০৪ A→B is 4 km along the road and the সরণ is 2 km). Screenshot:
`reference/page-40.png` (pages 40 and 41).

## The one idea to teach
Every motion has both. দ্রুতি uses the length of the path (দূরত্ব) and has no direction; বেগ uses the সরণ (the
straight line from start to end) and has a direction. On a winding path the two differ (4 km of road, a 2 km সরণ:
12 km/h against 6 km/h towards the north-east); on a straight path the বেগের মান equals the দ্রুতি. On the way the
speed can stay the same while the velocity keeps changing, because its direction changes.

## Terms (as in the book)
দ্রুতি, বেগ, দূরত্ব, সরণ, সময়, গড় দ্রুতি, গড় বেগ, মোট অতিক্রান্ত দূরত্ব, মোট সময়, ভেক্টর, দিক, মান (বেগের মান),
আঁকাবাঁকা রাস্তা/পথ, তির (the book's spelling); km, km/h, মিনিট, ঘণ্টা. Compass words: উত্তর, উত্তর-পূর্ব, পূর্ব …

## How it works (2.0.0: one ride, both দ্রুতি and বেগ)
The owner on 1.x (boy 1 ran a zig-zag and got only দ্রুতি, boy 2 ran straight and got only বেগ): "how is the zig-zag not
velocity? … students will have a hard time getting the concept". 2.0.0 drops the two boys and teaches with the book's
own example, as one guided sequence: one big numbered button, one short result and one short rule per step.
- **The setting**: a calm sandy plain under a soft sky (no scenery), the road of চিত্র ২.০৪ (the same data as
  `distance-displacement`'s `src/road.js`, copied, and a unit test keeps the two identical), A and B with a white post
  each, a small compass on the ground inside the bend (labelled উত্তর). The road and distances are to scale; the
  road is drawn 90 m wide and the cyclist 300 times bigger than real (the same cyclist as distance-displacement).
  The view opens in a gentle three-quarter view from the south-south-west (34° down), framed on the whole ride
  A→B at every size; a drag turns it, and the "starting view" button comes back. No zoom (the framing is worked out).
- **১ সাইকেল চালাও**: the cyclist rides A→B, 20 minutes in 8 s (the rule line says "সময় ১৫০ গুণ দ্রুত দেখানো
  হচ্ছে"). The road behind fills blue (দূরত্ব); the panel counts the distance and the time and names the direction of
  the velocity now ("বেগের দিক এখন: উত্তর-পশ্চিম"). An outlined violet arrow "বেগ" on the cycle, always the same
  length, turns with the road; fainter arrows are left behind every kilometre so the turning stays in sight. Rule:
  "দ্রুতি একই, কিন্তু দিক বদলাচ্ছে, তাই বেগ বদলাচ্ছে।" No বেগ arrow while the cycle stands at A or B.
- **At B**: "মোট অতিক্রান্ত দূরত্ব ৪ km, মোট সময় ২০ মিনিট"; label "দূরত্ব ৪ km" on the road; rule: distance is the length
  of the whole path, only a size.
- **২ সরণ দেখাও**: the straight orange সরণ arrow grows from A to B, labelled "সরণ ২ km"; "সরণ ২ km, উত্তর-পূর্ব দিকে";
  rule: সরণ has a size and a direction, so it is a vector.
- **৩ তুলনা করো**: the book's two sums one under the other, with units: গড় দ্রুতি = মোট অতিক্রান্ত দূরত্ব ÷ মোট সময় =
  ৪ km ÷ ২০ মিনিট = ১২ km/h, দিক নেই; গড় বেগ = সরণ ÷ সময় = ২ km ÷ ২০ মিনিট = ৬ km/h, উত্তর-পূর্ব দিকে; and the
  conversion ২০ মিনিট = ১/৩ ঘণ্টা. Rule: "আঁকাবাঁকা পথেও বেগ আছে: বেগ মাপে শুরু থেকে শেষ পর্যন্ত সোজা সরণ দিয়ে,
  দ্রুতি মাপে পুরো পথ দিয়ে।"
- **আবার দেখো** rides again from A.
- **সোজা পথ** (the chip beside আঁকাবাঁকা পথ): a straight road from A to the same B; the same steps give দূরত্ব ২ km =
  সরণ, ৬ km/h both, "দ্রুতি একই, দিকও একই, তাই বেগ বদলায় না", and "সোজা পথে দূরত্ব = সরণ, তাই গড় দ্রুতি = গড়
  বেগের মান। তবু বেগের সঙ্গে দিকও বলতে হয়।" A chip always goes back to A.
- Reset (the quiet icon) goes back to A. Keys: Space/Enter the next step, ← → one minute back or on (paused), F the
  starting view.
- Colours: দূরত্ব blue #1c6fd9 and সরণ orange #e8590c as in distance-displacement; বেগ violet #7048e8. Every arrow
  has a white outline and a label with its name.
- **Test** (৫ questions, tap answers): first "does this winding ride have a velocity?" (yes, from A towards B; the
  picture shows the ride done, no সরণ), then shuffled: a book-style calculation from the picture's 4 km and 2 km with
  a new time (গড় দ্রুতি or গড় বেগের মান, km/h, the conversion in the answer); the velocity on a bend at the same speed
  (it changes); the straight road (speed = size of velocity); there and back in 30–60 minutes (average velocity 0).
  Every wrong choice gets its own note.
- URL parameters (2.0.0, incompatible with 1.x: `angle` and `view` are gone, `time` is now minutes): `path`
  (winding | straight), `step` (start | displacement | compare), `time` (0–20 minutes of the ride, paused there).
  The poster is `step=compare`.

## Open questions
- The page-41 screenshot is cut off after "গড় দ্রুতি = মোট অতিক্রান্ত দূরত্ব/মোট সময়": the numbers (4 km, 2 km) come from
  চিত্র ২.০৪ and the units (km/h, by converting 20 minutes to 1/3 hour) are ours; docs/book-notes.md already asks the
  book team to confirm the units of this example.
- The faint earlier বেগ arrows on the road are not in the book; they are there so a still picture of the ride shows the
  direction turning.
