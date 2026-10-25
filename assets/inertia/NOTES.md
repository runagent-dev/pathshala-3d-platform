# Notes: Inertia (জড়তা)

Book: physics-9-10 › 3.1.1 › pp. 64–65 (order 2 on page 64; Newton's first law, 3.1, is order 1)

## What the page shows
Text only, no picture (screenshot in `reference/page-64.png`). Topic ৩.১.১ জড়তা (Inertia) defines inertia and gives
two everyday cases:

> বল প্রয়োগ না করা পর্যন্ত স্থির বস্তু যে স্থির থাকতে চায় কিংবা গতিশীল বস্তু যে গতিশীল থাকতে চায়, বস্তুর এই
> বৈশিষ্ট্যটাই হচ্ছে জড়তা। হঠাৎ গাড়ি চলতে শুরু করলে জড়তার কারণে আমরা পেছনের দিকে হেলে পড়ি। শরীরের নিচের অংশ
> গাড়ির সাথে লেগে থাকে। গাড়ির সাথে সাথে সেটা চলতে শুরু করে কিন্তু শরীরের ওপরের অংশ তখনো স্থির। এবং জড়তার কারণে
> স্থির থাকতে চায়! তাই শরীরের ওপরের অংশ পেছনের দিকে হেলে পড়ে। যেহেতু এটা স্থির থাকার জড়তা তাই এটাকে বলে স্থিতি
> জড়তা।
>
> গতি জড়তার কারণে আমরা মানুষজনকে চলন্ত বাস, ট্রেন থেকে নামতে গিয়ে আছাড় খেতে দেখি। চলন্ত বাস, ট্রেনের মানুষটির
> পুরো শরীরটাই গতিশীল, সে যখন মাটিতে পা দেয় তখন নিচের অংশ থেমে যায়: উপরের অংশ গতি জড়তার কারণে তখনো ছুটছে। তাই
> সে হুমড়ি খেয়ে পড়ে!

## The one idea to teach
A body wants to keep doing what it is doing: at rest it wants to stay at rest (স্থিতি জড়তা: the bus starts, the feet
go with it, the upper body stays, you lean back); moving it wants to keep moving (গতি জড়তা: step off a moving bus,
the feet stop, the upper body runs on, you tumble forward).

## Terms (as in the book)
জড়তা, স্থিতি জড়তা, গতি জড়তা, স্থির থাকতে চায়, গতিশীল থাকতে চায়, পেছনের দিকে হেলে পড়া, হুমড়ি খেয়ে পড়া,
শরীরের নিচের অংশ, শরীরের ওপরের অংশ. The book writes both ওপরের (first paragraph) and উপরের (second); the figure uses
ওপরের throughout, as in the list of terms.

## How the figure works
- A Dhaka city bus (green and cream, red stripe, white roof), with its left side cut away so the passenger, a
  school student in uniform with a school bag, is seen whole. The camera looks at the bus's left side, where a
  Bangladeshi bus has its doors (we drive on the left), so the bus drives toward the left of the picture.
- Four events (the panel's buttons, keys 1–4); each plays in slow motion (time 3× slower, the coin 10×; said on the
  view) and stops at the end; tap the bus (or the play button, Space) to play, pause or play again:
  1. হঠাৎ চলা শুরু: 2.5 m/s² for 1 s (0 → 2.5 m/s). The feet go with the bus; the upper body lags; he leans back
     about 18° (স্থিতি জড়তা), then straightens as the bus runs on steadily.
  2. হঠাৎ ব্রেক: from 4.5 m/s at 3 m/s². The feet stop with the bus; the upper body runs on; he leans forward
     about 22° (গতি জড়তা).
  3. চলন্ত বাস থেকে নামা: the bus moves at 3 m/s; he hops down from the step of the rear door (0.4 m, 0.35 s in
     the air, keeping the bus's speed); on the road his feet stop and the upper body runs on; he tumbles forward
     onto his hands and knees (গতি জড়তা). The rear door is behind the rear wheel, so only the back of the bus passes
     him (no wheel rolls past a boy on the road); the camera then comes a little lower and closer.
  4. কয়েন ও কার্ড: a finger flicks a card from under a coin on a glass (card 2.2 m/s); the coin stays and drops into
     the glass (স্থিতি জড়তা). A home experiment.
- A blue arrow on the feet (or the card) and an orange arrow on the chest (or the coin) show each part's speed along
  the road (0.28 m of arrow per m/s); the panel shows the two speeds in m/s (one decimal), the book's definition, and
  the book's explanation of the event (before an event: what is about to happen). While the event happens, labels
  say what each part does ("নিচের অংশ: বাসের সাথে চলে", "ওপরের অংশ: স্থির থাকতে চায়", …), placed so they never cover
  the passenger, the arrows or the buttons.
- The camera moves on at the speed everything had before the push (an inertial frame) until a moment after it, so
  the student sees the upper body stay where it was while the feet are carried away (or stopped); then it follows the
  feet smoothly.
- Test (5 questions, in random order, each sets up its own scene with the arrows and labels hidden; after the answer
  the scene plays on and shows the answer): why one leans back on a start, or which way (start); inertia of motion
  or rest, with its reason (name × reason: each wrong choice mixes up one), or which way (brake); which way one falls
  stepping off; what the coin does; how much one leans if the bus starts gently.

## Physics
- Bus: a(t) switched on and off over 0.08 s (sudden) or 1.5 s (gentle, 0.45 m/s²).
- Passenger: an inverted pendulum about the ankles, in the bus's frame:
  `I θ'' = m g L sin θ + m a L cos θ − K θ − C θ'`, I = 1.3 m L² (a body, not a point), L = 0.92 m (centre of mass),
  muscles K, C for a natural sway of ω = 2.8 rad/s with damping ratio 0.4. The drawn pose spreads θ over the legs
  (0.7 θ) and the trunk (1.6 θ); the chest's speed comes from the drawn pose.
- Stepping off: angular momentum about the stopped feet, m v L = I ω, then gravity, until the hands reach the road
  (then a short, drawn move to hands and knees, hands staying where they landed).
- Coin: kinetic friction μ = 0.25 while the card slides under it (≈ 25 ms), so the coin gets only ≈ 7 cm/s; it falls
  0.11 m into the glass (≈ 0.15 s) about 1 cm off centre.
- All of it is computed once per event with a fixed 1/240 s step (deterministic), unit-tested in
  `test/unit/inertia.test.mjs`.

## Open questions
- The book's idealisation says the upper body is "তখনো স্থির"; in the model it is much slower than the feet but not
  quite at rest (e.g. 0.9 m/s against 1.4 m/s at the moment the poster shows). The labels say "স্থির থাকতে চায়"
  (wants to stay at rest), which is true; the numbers show the lag honestly.
- The 4th button (coin and card) is not in the book's text; it is the classic home experiment for স্থিতি জড়তা.
