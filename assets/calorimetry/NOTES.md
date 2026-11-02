# Notes: Calorimetry: mixing and the balance of heat (ক্যালোরিমিতির মূলনীতি)

Book: physics-9-10 › 6.6 › pp179-181 (`reference/page-179.png`, `page-180.png`, `page-181.png`)

## What the pages show
Section 6.6 has **no picture**: it is text, two rules and three worked examples, so the figure builds the pictures the
sentences describe (the bucket, the hot water, the ice, the iron) on one bench, with the book's own numbers.
- p179: the winter bath (hot water poured into the bucket of cold water until it is comfortable), then the two rules:
  (i) বেশি তাপমাত্রার বস্তু কম তাপমাত্রার বস্তুর কাছে তাপ দিতে থাকবে যতক্ষণ পর্যন্ত না দুটো তাপমাত্রাই সমান হয়;
  (ii) উত্তপ্ত বস্তু যতটুকু তাপ পরিত্যাগ করবে, শীতল বস্তু ঠিক ততটুকু তাপ গ্রহণ করবে (no heat lost any other way).
  The page also ends the previous topic with C = ms (10 kg of gold 2300 J K⁻¹ against 10 kg of water 42,000 J K⁻¹): not
  part of 6.6, not drawn.
- p179-180 উদাহরণ: 1 liter of 30°C water, a 100 gm piece of ice (0°C) let go in it, L = 334 kJ/kg:
  m₁L + m₁sT = m₂s(30°C − T), T = (30°C × m₂s − m₁L) / ((m₁ + m₂)s) = 20°C.
- p180-181: 2 liter at 75°C with 1 liter at 20°C: m₁s(75°C − T) = m₂s(T − 20°C), T = (75×2 + 20)/(2 + 1) = 56.6°C.
- p181: 10 gm of 120°C iron in 1 kg of 30°C water, s₁ = 0.45×10³, s₂ = 4.2×10³ J kg⁻¹K⁻¹:
  m₁s₁(120°C − T) = m₂s₂(T − 30°C), T = (120m₁s₁ + 30m₂s₂)/(m₁s₁ + m₂s₂) = 30.1°C.
- p181 then starts 6.7 (pressure and the melting point): not this figure.

## The one idea to teach
Heat only goes from the hotter to the cooler body, until the temperatures are equal, and the hot body gives up exactly
what the cold body takes (nothing is lost): so the final temperature T comes from "heat given = heat taken".

## What was built (one figure, three chips)
One setting for all three examples (a 3 L glass beaker with a pen thermometer on a bench), so the three are chips:
বরফ (ice), দুই পানি (two waters), লোহা (iron). One button adds the thing, the thermometer follows the mixture, the
panel is in the lab's order: tabs → chips (with each T under it once run) → action → readings (the book's givens) →
the book's sum (balance, T in symbols; after the run T with the numbers, and the heat given = taken) → the rule
((i) first; (ii) and the note once it ran). Test: 5 tap questions on frozen scenes.
- `src/reading.js` the maths (unit tests `test/unit/calorimetry.test.mjs`); `src/scene.js` bench, beaker, thermometer,
  mug, ice, iron; `src/choreo.js` one pure function of (example, k) that poses everything.
- Real proportions in cm: beaker R 9 cm × 14.5 cm (3 L at 11.8 cm), mug 1 L, ice cube 4.8 cm (100 g), iron 1.5 cm
  (about 10 g, drawn with a glow so it can be seen). Water's tint (blue cold, peach hot) is a visual aid only; the
  thermometer carries the number.

## Terms (as in the book)
ক্যালোরিমিতির মূলনীতি, তাপমাত্রা, চূড়ান্ত তাপমাত্রা, উত্তপ্ত বস্তু, শীতল বস্তু, তাপ গ্রহণ / পরিত্যাগ, ভর (m),
আপেক্ষিক তাপ (s), গলনের সুপ্ততাপ (L), বরফ, পানি, লোহা, liter, kg, gm, kJ/kg, J kg⁻¹K⁻¹. Units as the page prints them
(Latin symbols).

## Open questions for the book team
- p181 two-waters example: the text says "1 liter পানির ভর m₁ = 1 kg, 2 liter পানির ভর m₂ = 2 kg", but the equation
  m₁s(75°C − T) = m₂s(T − 20°C) and the sum (75×2 + 20)/(2+1) use m₁ = 2 kg (the 75°C water) and m₂ = 1 kg. The
  figure follows the equation and the sum (m₁ = 2 kg at 75°C, m₂ = 1 kg at 20°C).
- p181: (75×2 + 20)/(2 + 1) = 56.67, which the book prints as 56.6°C; correct rounding is 56.7°C, and the figure shows
  56.7°C. p180: the exact answer is 20.04°C (the book rounds to 20°C; the figure shows "২০°C" and "প্রায়" for the heats).
- p179: the extra (ii)-note "(আমরা ধরে নিয়েছি … কোনো তাপ নষ্ট হচ্ছে না)" is shown after the first run, as the book gives it.
- The page has no picture, so the bench, beaker, mug, ice and iron are the figure's own; please confirm they suit the
  book's style.
- Every Bangla wording needs a person's check against the book.

## Measured (polish pass numbers)
See the PR description (draw calls, triangles, time to ready) once measured.
