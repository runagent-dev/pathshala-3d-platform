# Notes: Relation between temperature scales (ভিন্ন স্কেলের মাঝে সম্পর্ক)

Book: physics-9-10 › 6.2.1 › p165–166 (the page images are in `reference/`: `page-165.png`, `page-166.png`)

## What the pages show
Pages 165–166 have **no picture**: only the relation between the three scales and four worked examples (উদাহরণ).
- "যদি একটি নির্দিষ্ট তাপমাত্রা সেলসিয়াস, কেলভিন এবং ফারেনহাইট স্কেলে যথাক্রমে T_C, T_K আর T_F দেখায় তাহলে আমরা
  লিখতে পারি:" (T_C − 0)/(100 − 0) = (T_K − 273.15)/(373.15 − 273.15) = (T_F − 32)/(212 − 32), "কিংবা"
  T_C/100 = (T_K − 273.15)/100 = (T_F − 32)/180, "T_C এর সাপেক্ষে কেলভিন স্কেল এবং ফারেনহাইট স্কেল যথাক্রমে":
  T_C = T_K − 273.15° and T_C = 5/9 (T_F − 32°).
- The examples: (1) at what temperature are Celsius and Fahrenheit equal? −40° (9T_C = 5T_F − 5 × 32°, 4T_C = −160°);
  (2) Kelvin and Fahrenheit equal? T_K = 574.59 K; (3) a healthy body, 98.4° F, in Celsius? 36.89° (≈ 37° C);
  (4) Celsius and Kelvin equal? "কখনোই না।"
- A boxed thinking question (p166, "মহাশূন্যে যেখানে কোনো অণু-পরমাণু নেই সেখানে কি তাপমাত্রার অস্তিত্ব আছে?") belongs
  to the end of 6.2 and is not drawn (no answer on the page).
- The rest of p166 is 6.3 / 6.3.1 (thermal expansion), made by other figures.

## The one idea to teach
One temperature, one liquid height, three numbers: the same level on a Celsius, a Kelvin and a Fahrenheit scale, joined
by the book's relation. The student drags the liquid (or taps "পরের উদাহরণ") and sees the three readings move
together, the two relations T_C = T_K − 273.15° and T_C = 5/9 (T_F − 32°) worked with their own numbers, and the
book's four examples land on the thermometers: −40 is the same number on C and F, 574.59 on K and F, and C and K
always differ by 273.15.

## The figure
- One 3D object: a wooden board with three thermometers side by side, in the book's order (Celsius, Kelvin,
  Fahrenheit), each on a cream scale plate. 1 mm of height = 1° C × 0.6 (`SCALE_Y`); the scales run from −50° C to
  310° C so that all four examples fit (574.59 K = 301.44° C is the highest). This is a demonstration scale: a real
  thermometer would not reach 310° C (the rule is about the scales, not the liquid).
- The two marks the formula uses (0 and 100 on C, 273.15 and 373.15 on K, 32 and 212 on F) sit on the same two levels
  and carry coloured chips; a dashed line runs across the board at each. Kelvin's ticks start at 273.15 so they line up
  with the Celsius ticks. A red line across the board marks the liquid's level. One chip above each plate shows the
  reading with its unit (amber ring on the two that read the same number in examples 1 and 2).
- Panel (the kit's clean sheet): the four examples as a row of words (C = F, K = F, সুস্থ দেহ, C = K), the numbered
  button "পরের উদাহরণ" (its ring is on the middle (Kelvin) bulb), the three readings, the printed relation and the two
  sums with the student's numbers, the example's result in the book's words, the book's sentence as the rule.
- Test: five questions (C → F, F → C, C → K with random numbers; the book's 98.4° F; the book's "C and F equal").
  In a question the liquid of the scale being asked about is hidden (and the level line) until the answer, so the
  scale cannot simply be read; each wrong choice is a real mistake with its own note.

## Terms (as in the book)
সেলসিয়াস, কেলভিন, ফারেনহাইট স্কেল; তাপমাত্রা; T_C, T_K, T_F; "ভিন্ন স্কেলের মাঝে সম্পর্ক"; উদাহরণ; "সুস্থ দেহের
তাপমাত্রা"; "কোন তাপমাত্রায় সেলসিয়াস এবং ফারেনহাইট স্কেল সমান?"; "কখনোই না।" Units as the book prints them:
−40° C, 574.59 K, 98.4° F.

## Open questions
- The book's "Tc = Tk − 273.15°" mixes a degree sign with kelvin; the figure follows the page.
- The extra explanation in example 4's outcome ("T_K সব সময় T_C এর চেয়ে ২৭৩.১৫ বেশি") is not on the page (the page
  says only "কখনোই না।"); it follows from T_C = T_K − 273.15°.
- Colours for the three scales (C blue, K violet, F orange) are this figure's own; other chapter-6 figures may want to
  reuse them.

## Polish pass (0.2.0)
- Sets this lab apart from `temperature-scales`: that lab is the scales themselves (fixed points, one reading); this one
  is the book's relation. A coloured bar beside each tube runs from the lower fixed level (0° C = 273.15 K = 32° F) to
  the liquid, and the panel shows the page's own form (T_C − 0)/100 = (T_K − 273.15)/100 = (T_F − 32)/180 with the
  student's numbers, so the three fractions are seen to be equal.
- Each example shows the book's প্রশ্ন sentence word for word; fractions are stacked like the page's.
- Plates are rounded, with screws; the liquid has a meniscus and the glass a glint.
- The book writes 574.59 K for example 2 and 36.89° for example 3 (≈ 37° C), as before.
