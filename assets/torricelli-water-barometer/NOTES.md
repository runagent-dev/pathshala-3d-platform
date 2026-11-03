# Notes: A water barometer (পানির ব্যারোমিটার)

Book: physics-9-10 › 5.4.1 › p145. Screenshot: `reference/page-145.png` (both pages). The owner's picture of a clean
Torricelli barometer: `reference/owner-barometer.png`. Split from `torricelli-barometer` (1.0.0), where it was the fifth
of six scenes.

## What the page shows
A 10.5 m straw would lift a cold drink only to 10.3 m however hard you suck (a cold drink is about as dense as
water). A mercury straw stops at 76 cm, because mercury is 13.6 times as dense as water (পানির ঘনত্ব থেকে পারদের
ঘনত্ব 13.6 গুণ বেশি).

## The one idea to teach
The same air's pressure holds up 76 cm of mercury or about 10.3 m of water (76 cm × 13.6 ≈ 10.3 m): the less dense
the liquid, the taller the column.

## What the student does (2.0.0: a rebuild)
The owner on 1.0.0 (a tall pipe in a tub against a three-storey school, the camera following the water up): "very bad
and difficult to understand; it has to be much, much more accurate and explainable". 2.0.0 is one guided sequence,
one big step button, one short line and one reason per step, clean like the owner's picture (no building, no props):

1. **The mercury barometer** (as the owner's picture, the mercury lab's tube, dish and mercury): the glass tube closed
   at the top, the silver column at 76 cm, শূন্যতা above, an outlined বাতাসের চাপ arrow on the dish, an orange 76 cm
   dimension line. Gentle three-quarter view.
2. **পারদের বদলে পানি দিলে?** The same tube and dish, 11 m tall, with lightly tinted blue water appear beside it; the
   camera pulls back while the water rises and stops at 10.3 m with a vacuum above. A 0–11 m staff stands beside the
   water tube, and a 1.6 m student at its foot ("প্রায় ৬ জন মানুষের সমান"). The mercury barometer stays at the foot,
   tiny, with an equal air-pressure arrow (the arrows are equal: the same air).
3. **দুটো স্তম্ভ তুলনা করো**: the camera dips to the mercury column, one orange 76 cm piece appears beside it, then
   13.6 pieces of 76 cm stack up beside the water column while the camera rises with them. The panel: পানির ঘনত্ব থেকে
   পারদের ঘনত্ব 13.6 গুণ বেশি, তাই একই চাপে পানি 13.6 গুণ উঁচুতে ওঠে; 76 cm × 13.6 ≈ 10.3 m.
4. **স্ট্র দিয়ে চুমুক দিলে?** The camera rises to the top; the tube shortens to the book's 10.5 m straw and the water
   turns into a cold drink; it stays at 10.3 m and the top 0.2 m is empty (labels: স্ট্র 10.5 m, ফাঁকা 0.2 m).

Then আবার দেখো. ← / → keys step back and on, R goes to the start. Test: 4 questions (how tall a water column, why so
tall, what is above it, a 12 m straw), each wrong choice with its own note; the picture shows the answer only after.

Physics note: in step 2 the water is shown rising "when the air is taken out of the tube" (like sucking on the straw,
the book's story); its end state is the real water barometer (10.3 m, vacuum above). Strictly the space above the
water holds a little water vapour; the book calls it শূন্যতা and so does the figure.

## Honest scale
Both tubes are drawn thicker than real ones (a real one is about 1 cm across): the mercury tube 7 cm, the water tube
20 cm, so the water column is still a few pixels wide on a phone when the whole 11 m shows. The panel says so
(নলগুলো আসলের চেয়ে মোটা করে আঁকা). All heights are true to scale: 76 cm, 10.3 m, 10.5 m, the 1.6 m person.

## Terms (as in the book)
কোল্ড ড্রিংকস, স্ট্র, চুমুক, 10.3 মিটার, 10.5 মিটার, পারদ, পারদ স্তম্ভ, ঘনত্ব, "13.6 গুণ", শূন্যতা, বাতাসের চাপ.

## Look
A round teak platform under a calm evening-blue backdrop (the floor round it fades into it). Colours: air's pressure
blue (outlined arrows), heights orange (dashed dimension lines, the 76 cm pieces), water light blue, mercury silver.

## Parameters (2.0.0)
`step` (1–4) replaces `view`, which the side layout no longer has: a major bump. `set { step, animate }` plays the
next step or lands on any step; `get` reports `step`, `water` (m), `mercury` (cm).

## Open questions
- The book writes 10.3 m with Latin digits; the figure follows the project rule (Bangla digits).
- Every Bangla line needs a person's check against the book.
- Step 2's "air taken out of the tube" has no pump drawn (kept out on purpose: no props). Say if the owner prefers the
  Torricelli way instead (a full 11 m tube turned over, the water dropping to 10.3 m).
