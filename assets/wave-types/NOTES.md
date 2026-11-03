# Notes: Transverse and longitudinal waves (অনুপ্রস্থ ও অনুদৈর্ঘ্য তরঙ্গ)

Book: physics-9-10 › 7.2.2 (তরঙ্গের প্রকারভেদ) › pages 193–195. Screenshots: `reference/page-193.png` (the heading and
চিত্র ৭.০৪), `reference/page-194.png` (the spring paragraph and চিত্র ৭.০৫), `reference/page-195.png` (the rope paragraph).

## What the page shows
- p193: the heading 7.2.2 and চিত্র ৭.০৪: a girl speaking to a boy, a sine line above bands of crowded and spread dots
  (sound: "বাতাসের চাপের কারণে সংকোচন এবং প্রসারণের একটি অনুদৈর্ঘ্য তরঙ্গ", λ marked).
- p194: "একটা স্প্রিংয়ের মধ্য দিয়ে একটা তরঙ্গ প্রবাহিত হওয়ার সময় তরঙ্গটি স্প্রিংকে সংকুচিত এবং প্রসারিত করে এগিয়ে যায়।
  আবার একটা দড়ির এক প্রান্তে একটা ঝাঁকুনি দিয়ে একটা তরঙ্গ তৈরি করলে সেটা দড়ির মধ্য দিয়ে এগিয়ে যায়। … স্প্রিংয়ে
  তরঙ্গটি ছিল সংকোচন এবং প্রসারণের, এবং সেই সংকোচন এবং প্রসারণের দিক এবং তরঙ্গের বেগের দিক একই। এই ধরনের তরঙ্গের নাম
  অনুদৈর্ঘ্য তরঙ্গ। শব্দ (চিত্র ৭.০৪) হচ্ছে এক ধরনের অনুদৈর্ঘ্য তরঙ্গ (Longitudinal Wave)।" Then চিত্র ৭.০৫, a paper model
  (a spiral disc turned behind a slit) of how a longitudinal wave moves on.
- p195: "দড়ির কণাগুলোর কম্পন কিন্তু তরঙ্গের বেগের দিকে ঘটে না। কম্পনের দিক অর্থাৎ দড়ির ওঠা এবং নামা, তরঙ্গের বেগের সাথে
  লম্ব। এরকম তরঙ্গের নাম অনুপ্রস্থ তরঙ্গ (Transverse Wave)। পানির ঢেউ হচ্ছে এর আরেকটি উদাহরণ।" Then the নিজে করো with
  চিত্র ৭.০৫, and 7.2.3 begins ("মাধ্যমের কোনো একটা কণার দিকে তাকিয়ে থাকি … সরল স্পন্দিত কম্পন").

## The one idea to teach
In a transverse wave (অনুপ্রস্থ তরঙ্গ) the particles of the medium vibrate at right angles (লম্ব) to the wave's
velocity; in a longitudinal wave (অনুদৈর্ঘ্য তরঙ্গ) they vibrate along it (the same direction), making সংকোচন and
প্রসারণ. In both the particles only vibrate in place; the wave (energy) moves on.

## Terms (as in the book)
তরঙ্গ, মাধ্যম, কণা, কম্পন, তরঙ্গের বেগের দিক, লম্ব, ওঠা এবং নামা, ঝাঁকুনি, দড়ি, স্প্রিং, সংকোচন, প্রসারণ (সংকুচিত, প্রসারিত),
অনুপ্রস্থ তরঙ্গ (Transverse Wave), অনুদৈর্ঘ্য তরঙ্গ (Longitudinal Wave), শব্দ, পানির ঢেউ. The page writes উপর.
The book does not use তরঙ্গশীর্ষ / তরঙ্গপাদ here, so the figure doesn't either.

## How the figure works
- **Scene** (metres, `units: "m"`): a long oiled-teak lab bench under a dusk backdrop, a dark slate floor. Only the
  apparatus: a mechanical wave driver (a charcoal case with grille, knob, pilot lamp and rubber feet; a chrome drive rod
  in a bronze bush), the medium, and a retort stand at the far end (cast-iron base, chrome rod, boss head, arm, a bronze
  jaw for the rope or a peg through the spring's end loop). No hands, no people (the chapter's "no extra scenery").
- **The two media, the book's two examples**, chosen by one row of words দড়ি · স্প্রিং:
  - the rope: a 36 mm three-strand manila rope (twisted-fibre texture + bump), stretched 0.3 m above the bench; the
    driver's rod shakes its end up and down;
  - the spring: a long steel helical spring (44 coils of 9 mm wire, 13 cm across, 1.6 m, pitch 36 mm) lying on the bench, its
    first coil on the driver's round plate, its far end bent into a crossover loop over the stand's peg; the driver
    pushes and pulls its end along the axis.
- **Physics** (`src/reading.js`, unit-tested in `test/unit/wave-types.test.mjs`): one travelling wave
  displacement = a sin(kx − ωt) with λ = 0.5 m, f = 1.25 Hz (v = fλ = 0.625 m/s, not taught here: 7.2.3's
  `wave-quantities` does), a = 9 cm across the rope, a = 5 cm along the spring (a·k ≈ 0.63: the 36 mm pitch never closes below 13 mm, the wire
  is 9 mm, so coils never cross).
  The driver's amplitude eases up over its first period, so the wave has a clean front moving at v and nothing ahead
  of it moves. The spring's coils are each displaced along the axis by s(x, t), so compressions (ds/dx < 0) and
  rarefactions travel; their places are computed exactly (cos(kx − ωt) = ∓1) for the labels and the test.
- **The far end is an absorbing end** (the amplitude eases to 0 over the last 25 cm): no reflected wave comes back, so
  the student sees one wave going one way. The panel says so in one line once the wave reaches the end ("দূরের প্রান্ত
  থেকে তরঙ্গ ফিরে আসা দেখানো হয়নি"). Reflection is 7.4's subject.
- **The green particle**: a green band round the rope, a green-painted coil with a small green tag on the spring; its
  rest place is marked (a white ring on the rope's dashed rest line, a strip of white tape with a tick on the bench).
  Once the wave reaches it and it swings fully, an outlined green double arrow (কণার কম্পন) shows its swing (up-down
  on the rope, back-forth on the spring) and an outlined blue arrow (তরঙ্গের দিক) shows the wave going on.
- **সংকোচন / প্রসারণ**: shaded on the bench under the spring, darker teal where crowded, lighter where spread (the
  chapter's teal #0c8599, as `paper-vocal-cord`), with one moving label each.
- **Panel** (clean sheet): the words দড়ি · স্প্রিং (the wave's name appears under each once found), one action (দড়ির
  প্রান্তে ঝাঁকুনি দাও / স্প্রিংয়ের প্রান্ত ঠেলো আর টানো, then থামাও / আবার চালাও; the same numbered badge rings the driver,
  and a tap on the driver does it), one result line naming the wave and how the particle moves, one rule in the book's
  sentences that grows (start → rope or spring → both: কণা নিজের জায়গায় কাঁপে, এগিয়ে যায় তরঙ্গ (শক্তি)). On frames at
  least 620 px tall the side panel also shows a two-row comparison (green particle arrow vs blue wave arrow, লম্ব /
  একই দিকে, the wave's name once found). Keys: Space/Enter start-pause, ← rope, → spring, R start again.
- **Camera**: a gentle three-quarter view (25° to the side, about 13° above) of a window round the green particle
  (0.55 m from the driver), the driver at the left edge and the far end running off the right edge, so the medium is big
  on a phone; tall frames get a narrower window. The wave's direction arrow lies on the bench in front of the medium.
- **Live strip** (side panel, landscape): the medium's particles seen from the side as dots (the book's চিত্র ৭.০৪
  style), in sync with the 3D, the green one with its rest tick.
- **Test** (5), every one set up on the picture, every wrong choice a real mistake with its own note, choices of
  parallel length:
  1. the rope running (arrows hidden): how the green particle moves (in place up-down ✓ / in place back-forth / carried
     right / up-down and right as well);
  2. the spring running a long time: how the green coil moves (in place back-forth ✓ / up-down / carried right / moved
     a little and stopped);
  3. the paused spring, a ringed place clear of the green coil, bands hidden: compression or rarefaction (at random) /
     the other / সাম্যাবস্থা (no displacement: true for the middle coil of a compression, but the gaps are unequal) /
     the wave has not arrived;
  4. the rope running with its arrows: what kind of wave and why (অনুপ্রস্থ: rises and falls ✓ / অনুদৈর্ঘ্য: the wave
     moves forward / অনুদৈর্ঘ্য: the rope is long / both kinds);
  5. the spring running with its green arrow: what kind and why (অনুদৈর্ঘ্য ✓ / অনুপ্রস্থ because it lies down /
     because the coils turn / both kinds, as there are compressions and rarefactions).
  Reveals show the answer on the picture (the arrows and labels come back; the ring is named and the bands return).
  Questions 1 and 2 don't name the wave's kind, so they don't give 4 and 5 away. Sound and water waves stay in the rule.

## Round 2 (0.2.0, after the independent review of 0.1.0)
- The media were far too small on phones. Now: chunkier spring (44 coils, 13 cm across, 9 mm wire), thicker rope
  (36 mm) with a larger green sleeve, a = 9 cm / 5 cm; the camera frames a window round the green particle at 25°
  yaw and a lower elevation instead of fitting the whole 1.6 m.
- Measured (`window.figure.measure()`, dev only), while running:

  | frame | spring diameter | green arrow (spring) | rope band | rope swing | green arrow (rope) |
  |---|---|---|---|---|---|
  | 390×700 | 38 px | 51 px | 25 × 17 px | 56 px | 67 px |
  | 390×520 | 28 px | 39 px | 19 × 13 px | 41 px | 49 px |
  | 844×390 | 43 px | 59 px | 29 × 19 px | 62 px | 75 px |
  | 640×400 | 36 px | 47 px | 24 × 16 px | 53 px | 63 px |
  | 800×500 | 52 px | 68 px | 34 × 24 px | 76 px | 91 px |
  | 1280×800 | 88 px | 117 px | 59 × 40 px | 130 px | 156 px |

  The 3D keeps its height in every state and test question at all six sizes; no label overlaps, none off the view.
- The test was rewritten (above): no filler choices, no give-aways, every scene carries its question.
- The side panel is filled: the live strip, larger comparison rows on big screens.
- The wave's direction arrow lies on the bench, no longer in mid-air. The teal bands keep a steady opacity (no
  patches near neutral points). The floor has no grid; canvas textures use mipmaps and full anisotropy.
- A bug: the bands showed during question 3 (`visible` was `undefined`, which three.js draws); fixed.
- A tap on the driver no longer counts as turning the view.

## Open questions for the book team
- The book's examples are a spring and a rope; the figure drives both with a lab wave driver instead of a hand (no
  people in the scene). The action still says ঝাঁকুনি দাও / ঠেলো আর টানো.
- The figure shows an absorbing far end (no reflection). Should a later version add a "fixed end" option?
- The water-wave question follows the book ("পানির ঢেউ … আরেকটি উদাহরণ" of a transverse wave); strictly, water
  particles move in small circles. The figure keeps the book's simple statement.
- The marked particle is called a কণা for the spring too (one coil stands for a particle of the medium).

## Performance
Rope: 260 × 15 vertices, spring: 1 629 × 11 vertices, rebuilt in place each frame into reused buffers (no allocations
per frame); about 45 k triangles in all, about 40 draw calls, one 1024 shadow map fitted to the bench. Idle: nothing
draws (the ticker returns false when paused).
