# Notes: Superposition of water waves (তরঙ্গের উপরিপাতন)

Book: physics-9-10 › 7.2.1 › p192 (item (v) উপরিপাতন, চিত্র ৭.০৩) and p193 (the end of (v) and the নিজে করো with a
plate of water). Screenshots: `reference/page-192.png`, `reference/page-193.png`.

## What the page shows
Item (v) of তরঙ্গের বৈশিষ্ট্য: two waves of the same quantity, from two different places, arrive at one point; if one is
positive (ধনাত্মক) while the other is negative (ঋণাত্মক), what happens? "দুটো তরঙ্গ একটি আরেকটিকে বড় করে দিতে পারে
আবার একটি আরেকটিকে ধ্বংসও করে দিতে পারে।" চিত্র ৭.০৩ shows two columns: sine + sine in step = a sine twice as tall;
sine + the opposite sine = a flat line. Caption: "দুটি তরঙ্গ যোগ হয়ে আরো বড় তরঙ্গ হতে পারে, আবার একটি অন্যটিকে
নিঃশেষও করে দিতে পারে।" Items (i) (particles only vibrate in place) and (ii) (energy carried ∝ amplitude², double the
amplitude → four times the energy) are on the same pages; the নিজে করো (p193) has waves spreading on all sides from a
touched point in a plate of water.

## The one idea to teach
Where two waves meet, their displacements add: crest + crest makes a bigger wave, crest + trough cancels (নিঃশেষ), so
two dipping sources make a pattern of strong ridges and still lines on the water.

## Terms (as in the book)
তরঙ্গ, উপরিপাতন, বিস্তার (a), ধনাত্মক / ঋণাত্মক, নিঃশেষ, মাধ্যমের কণা ("মাধ্যমের কণাগুলো নিজ অবস্থানে থেকে শুধু
স্পন্দিত হয়"), প্রবাহিত শক্তি ("বিস্তারের বর্গের সমানুপাতিক"), তরঙ্গদৈর্ঘ্য λ, কম্পাঙ্ক f (7.2.3). Words the figure
adds: উৎস (source), শীর্ষ (crest) and খাদ (trough), বল ক / খ (the two floating balls), যোগফল (sum).

## How the figure works
- **The scene** (metres, `units: m`): a real ripple tank on an iroko lab bench under a dusk-blue backdrop: a shallow tray
  (6.4 mm of water, so v = √(gh) ≈ 0.25 m/s) with a satin aluminium frame, rubber feet, a pale floor with a 2 cm grid,
  and sloped grey foam beaches inside the rim (they absorb the ripples, so nothing reflects back: the pattern stays
  clean). Above it a vibrator: two steel uprights clamped to the frame, a crossbar, two helical springs, a flat
  aluminium bar with a small blue motor and its brass eccentric weight (it turns once a cycle), two clamps with steel
  rods and white bead dippers. Two orange cork balls float on the water: **ক** on the centre line, **খ** on the second
  still line (paths differ by 1½λ). Nothing else in the view.
- **The physics** (`src/reading.js`, unit-tested): f = 5 Hz, v = 0.25 m/s, λ = v/f = 5 cm, dippers 15 cm apart (3λ; 10
  and 20 cm by `?gap=` / `set({ gap })`). Each dipper's ripple is y = a(r)·sin(ω(t − r/v)) with a(r) ∝ 1/√(r₀ + r)
  (the energy of a ring spreads over a longer circle), a front (and, after a dipper is lifted, a tail) that moves at v.
  The water's height is the plain sum. Ball খ is "প্রায় স্থির" (about 0.1a, not exactly 0, because the two ripples
  have travelled different distances and so fallen off a little differently: true of a real tank too).
- **The water** (`src/water.js`): a 200 × 148 grid (about 3 mm, 16 points a wavelength), heights updated in place each
  frame, normals from the exact slope of each ripple, a colour that follows the height (crests light aqua, troughs
  deep blue), slightly clear over the gridded floor. Heights are drawn 6 times taller and time runs 5 times slower;
  the picture says so in its bottom-left corner ("ঢেউ ৬ গুণ উঁচু, ৫ গুণ ধীর").
- **The panel** (clean sheet): the row of words **১ম তরঙ্গ · ২য় তরঙ্গ · দুটো একসাথে**; one numbered action that walks
  them in order (শুধু ১ম উৎস চালাও → শুধু ২য় উৎস চালাও → দুটো উৎস চালাও → পানি শান্ত করো), with the same badge in a
  dashed ring on the dipper that goes in next (a tap on the dipper does it too); quiet pause/play and start-over. The
  result line gives the two balls' amplitudes in a ("বিস্তার: ক-তে ২a, খ-তে প্রায় ০") once the waves have reached both
  balls ("তরঙ্গ উৎস থেকে চারদিকে ছড়িয়ে পড়ছে…" until then). Under it a **live চিত্র ৭.০৩**: for each ball, the 1st
  wave, the 2nd wave and their sum (green, the chapter's displacement colour) against time, the last three periods,
  now at the right. The rule grows: the question (start) → (i) particles only vibrate in place (1st wave) → the 2nd
  wave alone also makes both balls bob (2nd) → the book's caption and crest/trough at ক and খ (both). The small line
  under it: a = one wave's amplitude, λ = 5 cm, f = 5 Hz (hidden on phones held upright).
- **Keys**: → or Enter = the action, 1/2/3 = the words, Space or P = pause, R = start over. Dragging turns the view
  (no zoom); the start-view icon brings it back.
- **The test** (5 questions, each wrong choice with its own note): crest meets trough at one point (one source running,
  so the picture doesn't give it away; the reveal runs both); which ball bobs most (balls on a new row, one on a
  strong line, one on a still line, named at random); খ is still, what if the 2nd source is lifted (the reveal lifts
  it, খ bobs again); how does ball ক move as the wave passes (book (i)); double amplitude, how much energy (book (ii),
  4 times). The graph's sum row shows "?" until the answer; on a phone held upright the test hides the graph so the
  3D stays big.
- **Camera**: a three-quarter view from the front right, about 35° above (steeper than the 10–20° of lessons.md 42: a
  water surface seen lower hides its pattern), framed on the water; the top of the vibrator may run off the frame.

## Numbers (polish-pass §5)
28 draw calls, about 75 k triangles (the water 59 k), one 1024 shadow map fitted to the tank, canvas textures of 1024
at most. The water costs about 30 k vertex updates a frame while waves move; the figure draws nothing when the water is
calm or paused. On a slow device the time step is capped (the kit's 50 ms), so the waves slow rather than jump.

## Open questions for the book team
- The book's pages do not name crest and trough; the figure says শীর্ষ (+) and খাদ (−), next to the book's ধনাত্মক /
  ঋণাত্মক. Should it be তরঙ্গশীর্ষ / তরঙ্গপাদ (older NCTB editions)?
- "১ম / ২য় তরঙ্গ" for the two waves, and the floating balls ক and খ, are the figure's; the book draws only sine curves.
- The page's নিজে করো is about one touch and the reflection from the plate's rim; this figure stays on two sources and
  uses absorbing beaches (no reflections), so the one idea stays clean. A reflection figure could be a separate one.
- Speed of ripples: 0.25 m/s is for 6.4 mm deep water (√(gh)); real ripple tanks are of this order.
