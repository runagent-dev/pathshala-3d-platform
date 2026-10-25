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

## Open questions for the book team

- The strength numbers in 3.2.2 vs 3.2.4 (above).
- Page 41: confirm the units (km/h) of the speed example.
- ওপর / উপর, গ্রাফ / লেখচিত্র: which spelling and term the edition wants.
- "সুইচ বন্ধ" (switched off) vs "বন্ধ বর্তনী" (closed circuit, current flows) can confuse; the EM figure avoids
  "বন্ধ" for the switch.
- Words the figures add that aren't on the page (e.g. সুইচ, তারের কুণ্ডলী (কয়েল), দণ্ড চুম্বক, সমমেরু, বিপরীত মেরু;
  the crumpled-paper extra in falling-bodies, marked "বাড়তি পরীক্ষা (বইয়ে নেই)").
- Every figure's Bangla wording needs a person's check against the book (the unchecked box in each PR).
