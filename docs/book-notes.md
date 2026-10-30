# Book notes: decisions shared across figures

Facts and choices that more than one figure depends on, so figures in a chapter read the same. Builders read this
before designing; reviewers check against it. When a new decision is taken for a batch, add it here.

## Units and symbols

- Wherever a unit is shown, use the book's Latin SI symbols: **m/s** for velocity (book p40), **ms⁻²** for
  acceleration (book p44), **s**, **m**, **cm** on scales, **km/h** where the book uses it. The words around them stay
  Bangla ("০.৩ সেকেন্ডে", "২ নিউটন বলে"). Pass units into strings as `{vars}` from one place in `i18n.js`.
- Followed by `acceleration` (2.6), `equations-of-motion` (2.7), `falling-bodies` (2.8) and `speed-velocity` (2.5).
- Not yet aligned: `newtons-first-law`, `inertia`, `stopwatch` and `simple-harmonic-motion` write মি/সে / সে. Open
  question for the owner: switch them to the symbols in a follow-up (patch versions), or keep Bangla abbreviations
  for figures without equations.

## Terms

- The velocity–time graph is "**বেগ–সময় গ্রাফ**" on screen (the book's উদাহরণ writes গ্রাফ); "লেখচিত্র" only in
  aria labels.
- Falling bodies: h is "**দূরত্ব**" / "অতিক্রান্ত দূরত্ব", never "উচ্চতা" (the scale reads 44.1 at the floor).
- Spelling follows the page the figure belongs to: page 68 writes "ওপর", most others "উপর"; check the image.
- In a figure about force, a ball is "ফুটবল" (বল also means force).

## The four fundamental forces (topics 3.2.1–3.2.4, pages 68–69)

| Force | Topic | Colour | Range | The book's strength sentence (quote, don't plot) |
|---|---|---|---|---|
| মহাকর্ষ বল | 3.2.1 | #7048e8 | অসীম | চার বলের মধ্যে সবচেয়ে দুর্বল |
| দুর্বল নিউক্লীয় বল | 3.2.3 | #2b8a3e | 10⁻¹⁸ m | তড়িৎ চৌম্বক বল থেকে দুর্বল (প্রায় ট্রিলিয়ন গুণ), কিন্তু মহাকর্ষের মতো এত দুর্বল নয় |
| তড়িৎ চৌম্বক বল | 3.2.2 | #1c7ed6 | অসীম | মাধ্যাকর্ষণ বলের তুলনায় 10³⁶ গুণ শক্তিশালী |
| সবল নিউক্লীয় বল | 3.2.4 | #e8590c | 10⁻¹⁵ m | মহাকর্ষের 10⁴¹ গুণ এবং তড়িৎ চৌম্বক বল থেকেও একশ গুণ বেশি শক্তিশালী |

- Order weakest first: মহাকর্ষ, দুর্বল নিউক্লীয়, তড়িৎ চৌম্বক, সবল নিউক্লীয়. Each of the four figures has a
  small strip in this order with the current force highlighted, headed exactly
  "**চার মৌলিক বল (সবচেয়ে দুর্বল → সবচেয়ে শক্তিশালী)**" (en "The four fundamental forces (weakest → strongest)").
  Keep the heading visible at every size: an order-only strip without it has no order cue.
- **The book's numbers conflict** (3.2.2: EM = 10³⁶ × gravity; 3.2.4: strong = 10⁴¹ × gravity and 100 × EM, which
  would make it 10³⁸ × gravity). Never put the four on one numeric axis; quote each section's sentence; the conflict
  is recorded in each figure's NOTES as a question for the book team.
- "10³⁶ গুণ" compares two particles (e.g. two protons) at the same distance; a comb lifting paper only shows the
  electric pull beating the Earth's pull, not by 10³⁶. Say "বই বলছে …".
- Particle colours (nucleus figures): proton #d23a50 with a camera-facing "+", neutron #9aa3ad, electron #1971c2
  ("−"), energy amber #f59f00. Nucleus GLBs use `units: "cm"` with 1 cm = 1 fm.
- The book's unification sentence: তড়িৎ চৌম্বক আর দুর্বল নিউক্লীয় বল একই সূত্রে, তাই বল তিন ধরনের: মহাকর্ষ, ইলেকট্রো
  উইক (Electro-weak) এবং নিউক্লিয়ার বল।

## Forces and momentum (topics 3.3–3.5.1, pages 69–73)

- Colours, one per quantity: a pull or tension (T, T₁, T₂, a hand's pull in a lighter orange) #e8590c; weight W
  #7048e8 (gravity's colour); the resultant (লব্ধি বল) #212529; velocity #1c6fd9; momentum #2f9e44 for arrows and
  #237a35 for green text (contrast); kinetic energy #f59f00. Every arrow also carries its symbol or label.
- Forces in Bangla as "নিউটন" (English "N"), as `newtons-first-law` and `gravitational-force` do, with a no-break
  space between number and unit. Momentum "kg m/s" (book p71), [p] = MLT<sup>−1</sup>; energy "J (জুল)" glossed once.
- One-dimensional vectors: to the right is positive, said in these words: "ডান দিক ধনাত্মক (+) ধরে"; a left
  velocity or momentum shows its "−" (U+2212) and its arrow points left. "বাম দিকে", never "বাঁ দিকে".
- The book's words: "সম্মিলিত ভরবেগ" (not "মোট"); "সংঘর্ষ" / "আঘাত" (not "ধাক্কা"); p⃗ = mv⃗ with arrows in 3.4,
  plain m₁u₁ in 3.5.1 (each as its page prints it). Superscripts and subscripts as <sup>/<sub>: the bundled
  Noto Sans Bengali has no ⁻ ¹ ² ₁ ₂ →.
- Big numbers with Bangladeshi commas (৫,০০০, ৫০,০০০), never a thin space.
- A body at rest never carries a non-zero "লব্ধি বল" label: when a hand holds it, draw the hand's pull too
  (`balanced-forces`).

## Work, energy and power (topics 4.1–4.8, pages 100–121)

- Colours: work W green #237a35 (`work`, `power`); a distance along the force s, or a height h, blue #1c6fd9; the push F
  orange #ff6a13 (`work`); time t crimson #c2255c (a stopwatch hand); power P grape #862e9c; potential energy violet
  #6741d9 and kinetic energy amber #e8930c (`energy`, `kinetic-energy`).
- Units as Latin symbols: N, m, s, kg, J (জুল glossed once), W (ওয়াট glossed once), ms⁻²; g = 9.8 ms⁻² as the
  book's worked examples (p121).
- `power` uses ideal pumps and says so; efficiency (কর্মদক্ষতা) is 4.8, p121.

## Open questions for the book team

- The strength numbers in 3.2.2 vs 3.2.4 (above).
- Page 41: confirm the units (km/h) of the speed example.
- ওপর / উপর, গ্রাফ / লেখচিত্র: which spelling and term the edition wants.
- "সুইচ বন্ধ" (switched off) vs "বন্ধ বর্তনী" (closed circuit, current flows) can confuse; the EM figure avoids
  "বন্ধ" for the switch.
- Words the figures add that aren't on the page (e.g. সুইচ, তারের কুণ্ডলী (কয়েল), দণ্ড চুম্বক, সমমেরু, বিপরীত মেরু;
  the crumpled-paper extra in falling-bodies, marked "বাড়তি পরীক্ষা (বইয়ে নেই)").
- Page 69–70: "নিউটন" is used before the book defines the newton; the hand's pull in `balanced-forces` is not in
  the book's picture; its 1 kg ball is drawn 8 cm across (a hollow bob) so the hook fits on a phone.
- Page 72–73: whether to name "চিত্র ৩.০৪" on screen; whether a stuck-together (inelastic) example belongs here.
- Page 71: the photon remark is left out of `momentum` on purpose (one idea).
- Every figure's Bangla wording needs a person's check against the book (the unchecked box in each PR).
