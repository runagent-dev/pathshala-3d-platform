# Notes: Specific heat (আপেক্ষিক তাপ)

Book: physics-9-10 › 6.5 › p178–179. Page images: `reference/page-178.png`, `reference/page-179.png` (dev only).
Neighbouring topics (other figures): 6.6 ক্যালোরিমিতির মূলনীতি starts on p179 and is not part of this figure.

## What the pages show
Topic ৬.৫ আপেক্ষিক তাপ (Specific Heat) has **no printed picture**, only text and the worked numbers. The text:
- A pan of water on a stove (চুলা) needs a long time to warm; about the same mass of metal is brought to the same
  temperature in very little time, because water's specific heat is large and a metal's is small.
- "1 kg পদার্থের তাপমাত্রা 1 K বাড়াতে যে পরিমাণ তাপের প্রয়োজন সেটি হচ্ছে ঐ পদার্থের আপেক্ষিক তাপ।" For a mass m taken from
  T₁ to T₂ with heat Q: **s = Q / m(T₂ − T₁)**; the unit is **J kg⁻¹K⁻¹**.
- **তাপ ধারণক্ষমতা C** = the heat to raise the whole body by 1 K, **C = ms**.
- The example: 10 kg of gold, C = 10 × 230 = 2300 J K⁻¹; 10 kg of water, C = 10 × 4200 = 42,000 J K⁻¹, "প্রায় 20 গুণ
  বেশি". "তার অর্থ সোনা কিংবা অন্য কোনো ধাতুকে চট করে উত্তপ্ত করা যায় কিন্তু পানিকে এত সহজে উত্তপ্ত করা যায় না।"
(The top of p178 is the end of 6.4 evaporation; the 6.6 calorimetry text and its ice-in-water example are the next topic.)

## The one idea to teach
The same heat warms the same mass of different substances by very different amounts, and the number that says how much
is the specific heat s = Q / m(T₂ − T₁): water 4200, gold 230 J kg⁻¹K⁻¹ (C = ms).

## Design (v0.1.0)
Because the book has no picture, the figure draws what the text describes, with the book's own numbers: one electric stove
(the book's চুলা) with two identical iron plates; on the left a steel pot with 10 kg (10 litres) of water, on the right a 10 kg
gold bar; between them two glass thermometers with the same scale (20–110 °C) and a blue line at the starting 30 °C.
- One tap on the button (or the stove's knob) gives both the same heat: 42,000 J, the amount that warms 10 kg of water by
  exactly 1 K (= C of the water). The plates glow while it runs, the red columns rise (water 1 K a press, gold about 18.3 K),
  up to four presses (168,000 J: water 34 °C, gold 103 °C), then the button starts again.
- The row of words পানি · সোনা chooses whose readings the panel shows: m, Q, T₁, T₂, T₂ − T₁, then the sum
  s = Q ÷ m(T₂ − T₁) (≈ 230 for the gold, 4200 for the water, from the numbers on the picture) and C = ms.
- The rule grows in the book's words: the definition, then the formula and unit, then "water's s is bigger … C is about
  20 times". (42,000 ÷ 2,300 = 18.3: the book says "প্রায় 20 গুণ", the figure quotes the book and its own numbers show 18.3.)
- Test (5 questions): which gets hotter on the picture; the definition's name (specific heat, not heat capacity, latent
  heat or temperature); s from Q, m and the rise on the picture (gold, 23,000 J, 10 K → 230); C = ms for the water or the gold
  with s shown; the unit of s. Every wrong choice has its own note.
- Scale: the gold bar is true to size (10 kg of gold is only about 500 cc, a bar 22 cm long), the pot holds 10 litres.
  Gold at 103 °C is nowhere near melting; the figure never goes past that.

## Terms (as in the book)
আপেক্ষিক তাপ (specific heat, s), তাপ ধারণক্ষমতা (heat capacity, C), তাপ Q, ভর m, তাপমাত্রা T₁, T₂, চুলা, সোনা, পানি.
Units: J kg⁻¹K⁻¹, J K⁻¹, kg, K, °C (the example in 6.6 writes °C).

## Open questions
- The book writes "প্রায় 20 গুণ" for 42,000 / 2,300 (= 18.3). Kept as the book says it; confirm with the book team.
- Temperatures T₁ and T₂ are drawn in °C on the thermometers, the difference T₂ − T₁ in K (the same number).

## Polish pass 0.2.0
- The gold bar has a raised rim round a stamped panel (fineness and mass) and a glossier finish.
- Bangla strings re-checked against pages 178–179: they follow the book. The "প্রায় 20 গুণ" sentence stays as the
  book writes it; the panel's own numbers show 42,000 ÷ 2,300 = 18.3.
