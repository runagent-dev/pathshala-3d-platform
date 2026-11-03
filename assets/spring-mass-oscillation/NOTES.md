# Notes: Mass on a spring: simple harmonic motion (সরল স্পন্দন গতি)

Book: physics-9-10 › 7.1 › pages 188–190 (the figure goes beside চিত্র ৭.০১ on page 189). Page images in `reference/`.

## What the page shows
- p188: a mass on a vertical spring, pulled down and let go, goes up and down; friction makes it stop some time, else
  it would go on for ever; its গতিশক্তি and স্থিতি শক্তি trade. Hooke: the restoring force (প্রত্যয়নী বল) F = −kx;
  the motion it causes is সরল স্পন্দন গতি. T = 2π√(m/k) (and, for a pendulum, T = 2π√(l/g), mentioned only).
- p189: hung on the spring the mass stretches it and rests: the সাম্য অবস্থা (চিত্র ৭.০১-০). Pulled down by a and let
  go (৭.০১-১) it rises past the সাম্যাবস্থা to a above it, comes down again, and goes on. চিত্র ৭.০১: ten pictures
  (0)–(9) of the block, v = 0 at the ends, v arrows up and down between.
- p190: one পূর্ণ স্পন্দন is back at the same place moving the same way (2 → 6, not 2 → 4); পর্যায়কাল / দোলনকাল T;
  কম্পাঙ্ক f = 1/T in হার্টজ (Hz) or s⁻¹; বিস্তার (amplitude) a; দশা (phase), which comes back after one period.

## The one idea to teach
Pulled down by a and let go, the mass oscillates about its সাম্যাবস্থা between +a and −a; K and U trade back and
forth; one full oscillation takes T = 2π√(m/k), which depends on m and k, not on a.

## Terms (as in the book)
সরল স্পন্দন গতি, সাম্যাবস্থা (সাম্য অবস্থা), প্রত্যয়নী বল F = −kx, স্প্রিং ধ্রুবক k, ভর m, বিস্তার a, পূর্ণ স্পন্দন,
দোলনকাল / পর্যায়কাল T, কম্পাঙ্ক f, হার্টজ (Hz), দশা, গতিশক্তি K, স্থিতি শক্তি U. The page writes উপরে.

## How the figure works
- **The apparatus** (`src/apparatus.js`, metres, real lab sizes): a retort stand (enamelled base, chrome rod, boss
  head, arm); an open-coil steel spring, 30 turns of 2.2 mm wire, 22 mm across, a 100 mm body unloaded (66 mm with
  the coils closed), with machine loops (the top one round the arm). The wire is a tube rebuilt in place every frame
  (parallel-transport frames), so the coils really open and bunch and the wire keeps its round section. A hanger
  (hook, rod, base plate, black pointer to the rule) carries 1, 2 or 4 slotted brass masses of 250 g (discs 64 mm ×
  11 mm; brass that size would weigh a little more, about 0.3 kg: drawn a bit large so the mass reads on a phone).
  A metre rule in cm behind the mass; a teak bench; a light blue-grey backdrop. The stand, the rule and the spring
  are turned 25° toward the camera, the bench is not, so its edge runs across the picture.
- **The view**: a three-quarter view 38° to the side and 22° above. A follow camera keeps a fixed window round the
  equilibrium: the mass at both ends of the largest travel, the lower spring, the labels; the arm and the spring's top
  leave the frame. It moves only when m or k change the stretch. At 390×700 the mass is about 66 px wide and the
  largest travel (±8 cm) is 42 % of the 3D height.
- **The physics** (`src/reading.js`, unit-tested in `test/unit/spring-mass-oscillation.test.mjs`): x from the
  সাম্যাবস্থা, upward positive; after a release from −a at rest x = −a cos ωt, ω = √(k/m); T = 2π√(m/k); f = 1/T;
  K = ½mv², U = ½kx² (the spring's and gravity's potential energy together, measured from the equilibrium, so
  K + U = ½ka²). The static stretch mg/k (g = 9.8 m/s²) sets where the equilibrium is. No friction (the book: it would
  go on for ever). The largest pull is 8 cm, and never more than the static stretch + 3 cm (the open coils may be
  squeezed 3 cm before they would touch; Hooke's law holds both ways): at least 3.6 cm for every pair.
- **Choices**: m 0.25 / 0.5 / 1 kg, k 100 / 200 / 400 N/m (two rows of words; side by side on a phone held
  upright). The static stretch is 0.6–9.8 cm; T runs from 0.16 s to 0.63 s; four times m (0.25 → 1 kg) doubles T.
- **Time is 5 times slower** than real on the picture (said in its top-left corner); the graph's time axis and every
  number are real seconds.
- **The student**: drags the mass (by finger or mouse; arrow keys too) and lets go, or taps the big action button
  (whose numbered ring sits round the mass). The action leads to the discoveries in order: (1) pull 5 cm and let go;
  (2) pull less (2.5 cm) or more: the same T; (3) change the mass (the next word is dotted) and let go: a different T;
  then "pull and let go again". A quiet pause button stops it (the mass glides back to rest). A tap on a word or the
  action gives the keys back to the picture (arrows pull the mass); from the keyboard the arrows move along a row.
- **The picture**: the dashed dark সাম্যাবস্থা line on the rule's plane, two green lines with "v = ০" at both ends
  (চিত্র ৭.০১'s v = 0), a green bar from the সাম্যাবস্থা to the bottom line labelled "বিস্তার a", an outlined blue
  velocity arrow beside the mass (at the fastest 4 cm + 0.35 a long) labelled "বেগ v" while it shows. Labels that
  don't fit (390×520) hide; the সাম্যাবস্থা label never does.
- **The panel**: the m and k rows; the action; the graph (words সরণ x / বেগ v / ত্বরণ in a column at its left; four
  periods wide; a crimson dashed tick at every whole period after the release and "T" over the first; a green dashed
  band at ±a with "a"; K amber and U violet bars against the most this spring can hold, with K + U dashed across;
  it grows into the panel's free height beside the picture, up to 280 px); one result line (T and f); a rule that
  grows: start → T = 2π√(m/k), f = 1/T, v = 0 / all U at the ends, fastest / all K at equilibrium → the same T for
  another a → more mass longer T, stiffer spring shorter T → all of it, with the phase coming back every T.
- **The test** (5): the energy at the bottom end (the picture shows where; no words say it); on an x–t graph drawn on
  the picture, at which lettered point the mass is fastest (the steepest slope, at x = 0); when the same দশা first
  comes back (T, not T/2: the book's 2 → 6 vs 2 → 4), four choices of the same shape; read T off a graph with a 0.2 s
  grid and give f (≈ 1.6 Hz; the mistakes take T itself, half a period or two); twice the pull (the same T). Each
  wrong choice has its own note. "v = ০" labels hide in the test.

## Differs from its sisters
- `simple-harmonic-motion` (ch2, p37): a swing and a spring for "speed zero at the ends". `spring-potential-energy`
  (ch4): the energy stored in a stretched spring. This one is chapter 7's quantities: T, f, a, phase, T = 2π√(m/k).

## Open questions for the book team
- The caption says "সরল স্পন্দিত বেগে দুলছে"; the figure uses the section's term সরল স্পন্দন গতি.
- U here is the spring's and gravity's potential energy together (½kx² about the equilibrium); the book only says the
  energy trades between গতিশক্তি and স্থিতি শক্তি.
- The masses (0.25–1 kg) and springs (100–400 N/m) are the figure's choice; the book gives no numbers for the spring.
- The 8 cm largest pull and "time 5 times slower" are the figure's.
- f is shown to two decimals (২.২৫ Hz) next to T (০.৪৪ s); check that this precision is wanted.

## Performance
The exported model is 14.6 k triangles (verify's GLB check). The spring wire (about 5.5 k vertices) is updated in
place each frame while the mass moves; one 1024 shadow map is fitted to the apparatus; the figure draws nothing while
at rest. Draw calls and time to ready are not measured yet.
