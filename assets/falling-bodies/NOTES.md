# Notes: Laws of falling bodies (পড়ন্ত বস্তুর সূত্র)

Book: physics-9-10 › 2.8 › pp. 48–49 (`reference/page-48.png`)

## What the page shows
Topic 2.8 has no picture: the text says that g is the familiar example of uniform acceleration, then states
Galileo's three laws in a box (from rest, without hindrance: equal distances in equal times; v ∝ t; h ∝ t²). Page 49
writes the equations of motion with h and g (v = u + gt; h = ut + ½gt²; v² = u² + 2gh), says Galileo's laws are
nothing but these, and explains the paper and the stone: in daily life the stone lands first because of air
hindrance; in a tube without air the paper and the stone land together, because there is no mass in the equations.

## The one idea to teach
Without air's hindrance every body, heavy or light, falls the same way: the same distance in the same time,
v ∝ t and h ∝ t² (v = gt, h = ½gt² from rest); a paper falls slower than a stone only because of air.

## Terms (as in the book)
পড়ন্ত বস্তু, মাধ্যাকর্ষণজনিত ত্বরণ (g), সমত্বরণ, স্থির অবস্থান, বিনা বাধায়, মুক্তভাবে পড়া, সমান সময়ে সমান পথ,
সমানুপাতিক, উচ্চতা (h), বেগ (v), বাতাসের বাধা, বাতাসহীন টিউব, ভর, গ্যালিলিও.

## How the figure works
- The book's own experiment as the hero: two clear tubes of the same height (0.441 m inside, real size), one open
  (বাতাস আছে) and one sealed with a valve (বাতাসহীন). Each holds a small stone (4.4 cm pebble) and a piece of
  exercise-book paper (5.8 cm square) on a shutter at the same height. The red button on the base (or ছেড়ে দাও) opens
  both shutters at once.
- Real physics, shown 8 times slower (the note says so): without air both bodies fall freely (h = ½gt², down in
  exactly 0.3 s); in air the drag ½ρCAv² gives h = (vt²/g)·ln cosh(gt/vt) with terminal speeds 47 m/s (stone: lands
  0.1 ms later, invisible) and 1 m/s (flat paper, which also flutters: lands at 0.51 s). The crumpled paper (same
  mass) has vt ≈ 4.2 m/s and lands at 0.31 s, "almost with the stone". All in `src/fall.js`, unit-tested.
- In the empty tube a faint picture of both bodies is left every 0.1 s, with an orange dashed line across the
  centimetre scale (h read on the scale: 4.9, 19.6, 44.1 cm) and a blue velocity arrow ending at each line (lengths
  1 : 2 : 3). The panel's table fills in t, v = gt and h = ½gt² with "×1 ×2 ×3" and "×1 ×4 ×9" (v ∝ t, h ∝ t²).
- Actions: ছেড়ে দাও / থামাও / চালাও / আবার ছেড়ে দাও; "০.১ সে" plays one 0.1 s step and stops (arrow keys step
  forward and back); কাগজ দলা পাকাও swaps both papers for crumpled ones (and back).
- Test (5 questions, from: which lands first without air; why the paper lags in air (scene frozen when the stone
  lands); v from v = gt or from the arrow at 0.1 s; h from ½gt² or from the scale at 0.1 s; the ratio of heights
  or velocities after 1, 2, 3 s; a 1 kg and a 10 kg ball). Wrong choices are the usual mistakes (½gt² for v, no ½,
  no square, 1 : 3 : 5, heavier falls first, g smaller in air…), each with its own note in the worked answer.

## Open questions
- The book has no picture for 2.8; the tube experiment and the crumpled paper are our choices (the crumpled paper
  is not in the text, but shows "air, not mass" with the same object).
- Units in the panel are written in Bangla (সে, মি/সে, সেমি), as in the stopwatch and SHM figures; the book's
  examples use SI symbols. To be checked with the book team.
