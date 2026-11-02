# Notes: Expansion of Solids (কঠিন পদার্থের প্রসারণ)

Book: physics-9-10 › 6.3.1 কঠিন পদার্থের প্রসারণ › p167 (চিত্র ৬.০৪), formulas pp168–170, examples pp168–171

## What the pages show
- p167, চিত্র ৬.০৪: "তাপ প্রয়োগ করলে কঠিন পদার্থের দৈর্ঘ্য, প্রস্থচ্ছেদ এবং আয়তন বেড়ে যায়।" Three pairs of the same
  body, each pair a cold one and a bigger heated one over a flame: two bars (দৈর্ঘ্য), two squares (ক্ষেত্রফল), two
  cubes (আয়তন).
- p168: the three coefficients, each from "T₁ তাপমাত্রায় … T₂ করার পর": α = (L₂ − L₁)/L₁ ÷ (T₂ − T₁) so
  L₂ = L₁ + αL₁(T₂ − T₁); β with A for ক্ষেত্রফল; γ with V for আয়তন; all in K⁻¹, "মাত্রা [α] = [β] = [γ] = T⁻¹".
  Example: a copper rod, 10 m at 20° C, 10.0167 m at 120° C: α = 16.7 × 10⁻⁶ °C⁻¹ (p168–169).
- pp169–170: why β = 2α and γ = 3α (the α² and α³ parts are so small they are left out).
- p170: rail gaps, dental fillings, a jar lid under hot water (not drawn here: no picture on the page).
- p171 examples: a glass cracks with hot water (uneven expansion); gold, 19.30 gm/cc, α = 14 × 10⁻⁶ °C⁻¹, heated by
  100° C: ρ' = 0.9958ρ = 19.22 gm/cc; 1000° C more would pass gold's melting point 1064° C (not asked in the test).

## The one idea to teach
A solid grows in length, area and volume when heated, and the growth per degree is the coefficient: α for length,
β = 2α for area, γ = 3α for volume.

## How the figure follows the pages
- The same arrangement as চিত্র ৬.০৪, three columns (rod, plate, cube), the cold body above, the heated body below
  over its flame. (The book puts the plates and cubes side by side; stacked, the same pictures fit a phone held
  sideways and are twice as big.) All copper, since the worked example is a copper rod.
- One action: "তাপ দাও" heats the lower row to 120° C (the book's T₂) and then "আবার ঠান্ডা করো"; pulling a flame up or
  down, or the arrow keys, set any T₂ between 20 and 120° C.
- The panel's readings are the book's numbers: the rod 10 → 10.0167 m is exactly the worked example; the plate and
  cube have sides of 10 m, so 100 → 100.334 m² (β = 2α) and 1000 → 1005.01 m³ (γ = 3α); each with its % growth, which
  makes 1 : 2 : 3 visible. The chips (দৈর্ঘ্য / ক্ষেত্রফল / আয়তন) choose which one the formula, the coefficient and the
  rule are about, and show an amber frame of the cold size over that heated body.
- The drawn bodies grow about 100 times too much (said in the panel), else nothing could be seen; the numbers are the
  book's first-order ones.
- Test: five questions from the book's own examples: α from the copper rod, β = 2α and γ = 3α in per cent, the gold
  density (19.22 gm/cc), and why a glass cracks.

## Terms (as in the book)
দৈর্ঘ্য, ক্ষেত্রফল, আয়তন, প্রসারণ সহগ (দৈর্ঘ্য / ক্ষেত্রফল / আয়তন প্রসারণ সহগ), তাপমাত্রা, তাপ প্রয়োগ করা, প্রসারিত
হয়, বাহু, ঘনত্ব, ভর.

## Open questions
- The book prints Latin digits in its worked examples (10 m, 120° C, 16.7 × 10⁻⁶); the figure follows the repo's rule
  (Bangla digits through `t.num`). Say if the formulas should keep Latin digits.
- Units: the book writes °C⁻¹ in the example and K⁻¹ in the box; both are shown.
- Bangla wording needs a person's check against the book.

## Performance
Draw calls ≈ 6 bodies (+6 edge sets) + 3 burners × 4 + bench, wall + 1 frame ≈ 30; a few hundred triangles besides
the flames. No allocation per frame; the ticker returns false when the lower row is cold or the flames are still
(`?motion=0`).
