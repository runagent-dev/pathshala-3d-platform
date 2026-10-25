# Notes: Momentum (ভরবেগ)

Book: physics-9-10 › 3.4 › p71 (first figure on the page, `order: 1`; 3.5.1 ভরবেগের সংরক্ষণ is the other, built as
`conservation-of-momentum`). The section's last paragraph continues on page 72 (not in `reference/`).

## What the page shows
Section **৩.৪ ভরবেগ (Momentum)**, no picture. The thought experiment: "ধরা যাক একটি ট্রাক এবং একটি বাইসাইকেল একই
বেগে গিয়ে একটি ছোট গাড়িকে আঘাত করেছে। … কোনটি ছোট গাড়িটার বেশি ক্ষতি করতে পারবে? অবশ্যই ট্রাক, কারণ তার ভর অনেক
বেশি। … সেজন্য তার ভরবেগ অনেক বেশি। ভরবেগ সহজভাবে ভর এবং বেগের গুণফলকে বলা হয়।" Then **p⃗ = mv⃗**; "ভর স্কেলার
রাশি কিন্তু বেগ ভেক্টর, তাই ভরবেগ ভেক্টর"; momentum can change through the mass too; the photon (আলোর কণা) has no
mass but has momentum, so momentum is more fundamental than mass and velocity. A box: "ভরবেগের একক হলো kg m/s",
"ভরবেগের মাত্রা হলো [p] = MLT⁻¹". The last paragraph starts on সম্মিলিত ভরবেগ (leading to collisions, 3.5).
Screenshot: `reference/page-71.png`.

## The one idea to teach
Momentum is mass × velocity (p⃗ = mv⃗), a vector pointing the way the body moves; at the same velocity the heavier
body (the truck) has far more momentum than the bicycle, so it does far more damage when it hits.

## Terms (as in the book)
ভরবেগ (p⃗), ভর (m), বেগ (v⃗), গুণফল (said as "ভরবেগ = ভর × বেগ"), স্কেলার রাশি, ভেক্টর, ট্রাক, সাইকেল (the book says
বাইসাইকেল first, then সাইকেল), ছোট গাড়ি, আঘাত, ক্ষতি, একক kg m/s, মাত্রা [p] = MLT⁻¹. Our own words: আরোহী (the
rider), দৌড়বিদ (the runner), গাড়ি (a moving car in the test), উল্টো দিকে, সরেছে প্রায় … (how far a car was pushed),
দুমড়ে (crumpled), ধাক্কা (the hit), ধনাত্মক / ঋণাত্মক, মান (size of a vector).

## How it works
- **The book's thought experiment, run by the student.** A town street of three lanes (kerbs painted black and white,
  tiled footpaths, a whitewashed wall). In the far lane a loaded Bangladeshi truck (mustard cab, painted crown over
  the cab, wooden body, khaki tarp), in the near lane a black roadster bicycle with its rider; each heads for a red
  small car parked 6 m ahead in its lane. The middle lane stays empty, so nothing of one lane sits over the other.
- **Arrows, one colour per quantity** (as in chapter 3): velocity v⃗ blue #1c6fd9 on top, momentum p⃗ green
  #2f9e44 under it, both from the middle of the body, each with its label ("v⃗ = ৫ m/s", "p⃗ = ৪০০ kg m/s"). The
  two v⃗ arrows have the same length (0.32 m per m/s): the same velocity. **Both p⃗ arrows are on one scale** (1 m per
  200 kg m/s): the bicycle's is 2 m at 5 m/s, the truck's would be 250 m, so it runs off the screen; its label sits
  at the screen's edge with an arrow and "তীরটি সাইকেলের তীরের ১২৫ গুণ লম্বা". Nothing is stretched or broken: the
  picture is honest, and the off-screen arrow *is* the point. The front view uses a long lens (8° field of view,
  far back) so both lanes are drawn at almost the same scale and equal arrows look equal.
- **Mass tags** under the bodies ("ট্রাক · ১০ ০০০ kg", "সাইকেল ও আরোহী · ৮০ kg") give way when there is no room
  (the panel has the masses too).
- **The panel**: "ভরবেগ = ভর × বেগ" and the velocity stepper (1–8 m/s, whole numbers; ৫ m/s = 18 km/h to start);
  a small table "ভরবেগ p⃗ (kg m/s) = ভর m (kg) × বেগ v⃗ (m/s)" for ট্রাক and সাইকেল with the numbers (SI digit
  groups, Bangla digits); one line that says what it means now (the same velocity, 125 times the mass, so 125 times
  the momentum: far more damage / the vector sentence when going left / the result after the crash); the actions
  উল্টো দিকে and চালাও; and the book's box (একক kg m/s, মাত্রা [p] = MLT⁻¹). The table is "the momentum it hits
  with" in every state, so it never says something false (after the crash the arrows are gone: they fade at the
  impact).
- **The run, in real time** (a tap on the truck or bicycle, চালাও, Space or Enter): both go at v⃗ over the 6 m gap
  (1.2 s at 5 m/s), the camera follows the truck in narrow frames so it stays big (32 px/m at 390×700: the bicycle
  56 px long, the truck 218 px; 16 px/m at 390×520), then the crash. Afterwards a dimension line in the middle lane
  and a label over each car show how far it moved: the truck's about 2 m (crumpled: the back pushed in, panels
  folded, the hatch buckled, the rear glass cracked), the bicycle's about 1 cm (a small dent; the bicycle bounces
  back a couple of centimetres and the rider is thrown forward a little).
- **Direction** (উল্টো দিকে, ← →): the whole run is mirrored; v and p become negative ("−৫", "−৫০ ০০০"), the arrows
  point left, the panel line becomes the book's vector sentence: "ভর স্কেলার রাশি, বেগ ভেক্টর, তাই ভরবেগ ভেক্টর:
  বেগ বাম দিকে (−) হলে ভরবেগও বাম দিকে (−)।" (to the right is positive, as in `conservation-of-momentum`).
- **The crash model** (`src/physics.js`, believable, not taught: conservation is 3.5.1): during the impact the car's
  end crumples by `crush` while the vehicle keeps its speed; then the two separate as in a collision with
  restitution 0.15; the parked car skids on locked tyres (0.7 g), the truck brakes at 5.5 ms⁻², the rider at
  3 ms⁻². The crumple depth comes from the energy lost (½ μ (1 − e²) u², a share of it into a 400 kN/m crumple
  zone): 22 cm from the truck at 5 m/s, 5 cm from the bicycle. Pushed: truck 0.08 m at 1 m/s, 2.0 m at 5, 5.1 m at
  8; bicycle 0.1–3.4 cm. The unit tests check the car always stays ahead of the vehicle at every speed.
- **Test** (5 questions, one of each kind, new order each time, each on its own picture with its own numbers, so no
  picture or answer gives away another; the momentum arrows hidden until the answer):
  1. which does more damage and why (truck and bicycle at 3 or 6 m/s, equal blue arrows): the truck, far more
     momentum / the same, same velocity / the truck, it is faster / the bicycle, lighter; the answer plays the crash
     with the momentum arrows;
  2. p of one body read off the picture (truck 4 m/s, car 5, runner 5, bicycle 7): m v / m ÷ v / m + v / m v in
     kg m/s² (the unit of force);
  3. two bodies, which has more momentum (a car at 1 m/s vs a runner at 4; a runner at 4.5 vs a bicycle at 3; a car
     at 0.4 vs a bicycle at 5, equal): either body / both the same / can't be compared;
  4. the bicycle's velocity doubled (its p shown): 2p / 4p (as if with v²) / p / p ÷ 2; the answer speeds it up;
  5. a body moving left with only the size of its velocity shown ("v⃗ এর মান ৪ m/s"), right positive: −m v / +m v /
     −m ÷ v / +m ÷ v.
  Every wrong choice gets its own line on that mistake. During the test the scene keys and taps rest, with the
  locked hint at the top of the view.

## Open questions
- The photon remark (no mass, yet momentum) is left out of the figure on purpose (one idea; it is in the text next
  to it). Add a quiet line if the book team wants it.
- Words the figure adds that aren't on the page: আরোহী, দৌড়বিদ, উল্টো দিকে, দুমড়ে, সরেছে প্রায়, মান. Please check.
- The Bangla wording needs a person's check against the book.
