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
  One proton sits on the outside, touching the outermost ball, so the gap between it and the nucleus is exactly
  how far it has been pulled. The student drags it straight out (or presses → / ←, Space lets go). Two arrows act
  on it: orange = সবল নিউক্লীয় বল (pulling inward), blue = তড়িৎ বিকর্ষণ (the other protons pushing out).
  The reach is a shape: a soft orange shell round the nucleus with a dashed edge 1 × 10⁻¹⁵ m outside its surface
  (label "সবল বলের পাল্লা"); the proton is out of reach once its near side has passed the dashed line. A scale from
  the nucleus's surface reads the gap (numbers and unit are page labels, readable at every size); the panel shows
  the same number. Within 1 × 10⁻¹⁵ m the orange arrow is far bigger; from 0.6 to 1.0 it visibly shrinks (still
  bigger than the blue one, so it snaps back when let go); from 1.1 on it is gone and the proton flies away (slow
  motion, said so). The wording says "প্রায়" (about) for the edge, as the book does.
- **ভাঙা**: a slow neutron reaches a big nucleus (symbolic, 92 balls, "যেমন ইউরেনিয়াম"), it wobbles, stretches and
  splits into two smaller nuclei (45 + 45) and three neutrons (the one that came in and two more), with a flash and
  amber rays labelled শক্তি: 92 + 1 = 45 + 45 + 3, as U-235 + n → Ba + Kr + 3n. The panel: "বড় নিউক্লিয়াস + নিউট্রন
  → দুটি ছোট নিউক্লিয়াস + ৩টি নিউট্রন + শক্তি" and the book's reason (energy stored by the huge force), with nuclear power
  plants (Rooppur) as the example. The note says fewer particles are shown.
- **জোড়া দেওয়া**: hydrogen-2 and hydrogen-3 rush together against their electric repulsion (they must come within
  10⁻¹⁵ m for the strong force to grab them) and join into helium-4, giving off a neutron and energy
  (2p + 3n = 2p + 2n + n); the Sun as the example.
- The panel's last row: the four fundamental forces, weakest → strongest (order only, no numbers), in the shared
  colours, সবল নিউক্লীয় highlighted with its range; brackets under them name the book's three kinds: মহাকর্ষ |
  ইলেকট্রো উইক (দুর্বল নিউক্লীয় + তড়িৎ চৌম্বক) | নিউক্লিয়ার বল.
- The test (5): between which particles the strong force acts (all protons and neutrons, from the book); a proton
  held clearly inside (0.2–0.6) or clearly outside (1.6–2.4 × 10⁻¹⁵ m) the reach, what happens when let go (then
  it is let go); two protons an atom apart (10⁻¹⁰ m), which force is bigger; how to get energy from the big
  nucleus (or the two small ones) shown (then it plays); which of the three kinds the weak nuclear force belongs
  to. Wrong choices are the usual mistakes (only protons, neutrons as the glue, electrons, "the strongest always
  wins", joining a big nucleus, splitting small ones, burning, "নিউক্লিয়ার" because of the name …) and each worked
  answer starts with the right option's words and names the mistake. The scale and the reach are hidden in the
  questions they would answer.

## The model behind the arrows (src/reading.js, unit-tested)
- Electric push: Coulomb's law, k·e² = 230.7 N·fm², from the other 5 protons at an effective 2.4 fm: about
  200 N near the nucleus, falling as 1/r².
- Strong pull: grows as the proton is pulled out (a short, stiff spring) to 100 × the electric push (the book's
  "একশ গুণ"), then fades to zero just past 1 fm: within 10⁻¹⁵ m it wins, beyond it is zero.
- Arrows on a compressed (logarithmic) scale, since the forces differ a hundredfold ("তীরের দৈর্ঘ্য মাপমতো নয়" on
  screen); the orange one is capped at 2.35 fm so its tip stays within the nucleus. Distances are read in steps of
  0.1 × 10⁻¹⁵ m, so the reading and what happens on letting go always agree. Ball sizes (0.85 fm) and the scale
  are in the same fm, so the pull scene's sizes are not symbolic; the split's particle count is.

## Open questions (for the book team)
- **The book's numbers conflict.** 3.2.4 says the strong force is 10⁴¹ × gravity and 100 × the electromagnetic
  force; 3.2.2 says the electromagnetic force is 10³⁶ × gravity, which would make the strong force 10³⁸ × gravity.
  (Usual textbook values: strong ≈ 100 × EM ≈ 10³⁸ × gravity at nuclear distances.) The figure quotes each
  sentence as written and never puts the forces on one numeric axis.
- 3.2.3 gives the weak force's range as 10⁻¹⁸ m; the strip shows only the strong force's range (10⁻¹⁵ m).
- The closing paragraph's "নিউক্লিয়ার বল" (one of the three kinds) is read as the strong nuclear force (the strip's
  bracket under সবল নিউক্লীয়). Is that the book's intent?
