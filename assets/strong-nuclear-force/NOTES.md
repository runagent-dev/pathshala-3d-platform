# Notes: Strong nuclear force (সবল নিউক্লীয় বল)

Book: physics-9-10 › 3.2.4 › p69 (screenshot: `reference/page-69.png`). One of four fundamental-force figures
(3.2.1–3.2.4) built together; colours, order and wording follow the shared `forces.json` so the four agree.

## What the page shows
No picture: two paragraphs. 3.2.4 says the strong nuclear force is the strongest force in creation (10⁴¹ ×
gravity and a hundred times the electromagnetic force) but acts only over a very short distance (10⁻¹⁵ m); it
acts between the protons and neutrons inside the nucleus and holds them together; because they are held by such
a force a lot of energy is stored, so splitting a big nucleus or joining small ones can release a lot of energy.
The closing paragraph: scientists try to explain all four forces by one theory; the electromagnetic and weak
nuclear forces have been joined (electro-weak), so one may say there are three kinds of force: gravitational,
electro-weak and nuclear.

## The one idea to teach
The strong nuclear force is the strongest of all but reaches only about 10⁻¹⁵ m, just across neighbouring
nucleons: there it holds protons and neutrons tightly together even though the protons repel each other
electrically; that tight binding stores so much energy that splitting a big nucleus or joining small ones
releases a lot of it.

## Terms (as in the book)
সবল নিউক্লীয় বল; সৃষ্টিজগতের সবচেয়ে শক্তিশালী বল; মহাকর্ষ বল; তড়িৎ চৌম্বক বল; দুর্বল নিউক্লীয় বল (the book also
writes "দুর্বল নিউক্লিয়ার বল" in the closing paragraph; the figure uses the section title's নিউক্লীয়); 10⁻¹⁵ m;
পরমাণু; নিউক্লিয়াস; প্রোটন; নিউট্রন; শক্তি; ভেঙে (ভাঙা); জোড়া দিয়ে (জোড়া দেওয়া); ইলেকট্রো উইক (Electro-weak);
নিউক্লিয়ার বল. Other words used: বিকর্ষণ (as in 3.2.2's আকর্ষণ-বিকর্ষণ), পাল্লা (as in 3.2.1/3.2.2's "বলের পাল্লা").

## How the figure works
- **প্রোটন টানো** (default): a carbon-12 nucleus (6 protons red with "+", 6 neutrons grey), seen from the front.
  The student drags the right-hand proton straight out (or presses → / ←). Two arrows act on it: orange =
  সবল নিউক্লীয় বল (pulling back), blue = তড়িৎ বিকর্ষণ (the other protons pushing out). A scale under its path reads
  the distance in 10⁻¹⁵ m, with the strong force's reach (0 to 1) in orange; the panel shows the same number.
  Within 1 × 10⁻¹⁵ m the orange arrow is far bigger, and on letting go the proton snaps back; from 1.1 on the
  orange arrow is gone, only the blue push is left, and on letting go it flies away (slow motion, said so).
- **ভাঙা**: a slow neutron enters a big nucleus (symbolic, 92 balls, "যেমন ইউরেনিয়াম"), it wobbles, stretches and
  splits into two smaller nuclei and two neutrons, with a calm burst of amber rays labelled শক্তি. The panel:
  "বড় নিউক্লিয়াস → দুটি ছোট নিউক্লিয়াস + শক্তি" and the book's reason (energy stored by the huge force), with nuclear
  power plants (Rooppur) as the example.
- **জোড়া দেওয়া**: hydrogen-2 and hydrogen-3 rush together (they must come within 10⁻¹⁵ m for the strong force to
  grab them) and join into helium-4, giving off a neutron and energy; the Sun as the example.
- The panel's last row: the four fundamental forces weakest → strongest (order only, no numbers), in the shared
  colours, সবল নিউক্লীয় highlighted with its range, and a bracket under the middle two: ইলেকট্রো উইক.
- The test (5): what holds the nucleus although protons repel; a proton held at a given distance, what happens
  when let go (then it is let go); the book's 10⁴¹ (or the range 10⁻¹⁵ m); how to get energy from the big nucleus
  (or the two small ones) shown (then it plays); which of the three kinds the weak nuclear force belongs to.
  Wrong choices are the usual mistakes (gravity, weak force, "infinite", 10³⁶, 100, joining a big nucleus,
  burning, "নিউক্লিয়ার" because of the name …) and each worked answer names the mistake.

## The model behind the arrows (src/reading.js, unit-tested)
- Electric push: Coulomb's law, k·e² = 230.7 N·fm², from the other 5 protons at an effective 2.4 fm: about
  200 N near the nucleus, falling as 1/r².
- Strong pull: grows as the proton is pulled out (a short, stiff spring) to 100 × the electric push (the book's
  "একশ গুণ"), then fades to zero just past 1 fm: within 10⁻¹⁵ m it wins, beyond it is zero.
- Arrows on a compressed (logarithmic) scale, since the forces differ a hundredfold: "তীর মাপমতো নয়" on screen.
  Distances are read in steps of 0.1 × 10⁻¹⁵ m, so the reading and what happens on letting go always agree.

## Open questions (for the book team)
- **The book's numbers conflict.** 3.2.4 says the strong force is 10⁴¹ × gravity and 100 × the electromagnetic
  force; 3.2.2 says the electromagnetic force is 10³⁶ × gravity, which would make the strong force 10³⁸ × gravity.
  (Usual textbook values: strong ≈ 100 × EM ≈ 10³⁸ × gravity at nuclear distances.) The figure quotes each
  sentence as written (the test asks for "বই অনুযায়ী" 10⁴¹) and never puts the forces on one numeric axis.
- 3.2.3 gives the weak force's range as 10⁻¹⁸ m; the strip shows only the strong force's range (10⁻¹⁵ m).
- The closing paragraph's "নিউক্লিয়ার বল" (one of the three kinds) is the strong nuclear force; the test explains
  this in a worked answer. Is that the book's intent?
