# Notes: Scalar and vector quantities (স্কেলার ও ভেক্টর রাশি)

Book: physics-9-10 › 2.3 › p38 (chapter 2, গতি). Screenshot: `reference/page-38.png`.

## 2026-10-28 — v0.3.0: a simpler illustrated journey
The owner found the school-field story complex and supplied a winding-path/straight-arrow diagram as a visual reference (`reference/journey-style.png`). The new view uses one start, one finish, one winding blue path and one straight coral arrow, with a small pond and three symbolic trees. No people, school, ring of possible places, question marks or multi-child sequence.

- Rich green, cyan, coral and blue replace the earlier pale scene. The map fills the frame; the explanation sits beside it on wide screens. Labels are checked for overlap at all six sizes and grow on larger classroom displays.
- The path is exactly 120 m; the finish is 20 m north of the start. The path length is a scalar; the finish's **position relative to the start** is a vector. The arrow is labelled **অবস্থান** to follow topic 2.3; the term সরণ belongs to the next section and is not introduced here.
- One action walks the path and reveals its scalar length; the next reveals magnitude and direction for the position vector. Labels point directly to the path and arrow, without relying on colour alone.
- Steps 3–5 compare only two arrows at a time, using the book's exact A/B/C/D relationships and caption. No extra actors or simultaneous four-arrow layout.
- Five questions read the diagram: scalar information, vector information, direction, equal vectors, and changed magnitude/direction. Each question resets its scene and locks scene-changing controls. Learn state is restored on leaving the test.
- Top-down is the default and is forced in the test. The optional tilted view retains the same diagram. The stage size stays fixed across all steps and test questions.
- The main bridge and URL names stay supported, including steps 0–5, act, compare, home, reset, capture and GLB export. The story attached to the steps has changed as above; `get.journey` exposes the path reading and actual position vector.

## Previous implementation (v0.2.0)

## What the page shows
Section ২.৩ স্কেলার ও ভেক্টর রাশি. What we can measure is a রাশি (আনন্দ or দুঃখ is not; তাপমাত্রা is). Body
temperature 37° C (98.4° F) is given by one value. "অবস্থান ছিল সে রকম একটি রাশি, যেটা বোঝানোর জন্য আমাদের শুধু দূরত্ব
দিয়ে কাজ হয়নি, তার দিকটিও নির্দেশ করতে হয়েছিল!" A quantity given by one value is a স্কেলার (তাপমাত্রা, সময়, দৈর্ঘ্য,
ভর); one that also needs a দিক is a ভেক্টর (অবস্থান, বেগ, বল). Vectors are printed মোটা (Bold) (**A**, **B**); by hand a
small তির চিহ্ন goes on top (A⃗).

চিত্র ২.০৩: four arrows. Caption: "A ও B ভেক্টর হুবহু এক, যদিও ভিন্ন অবস্থানে রয়েছে, C ভেক্টর A ও B থেকে ভিন্ন,
কারণ মান সমান হলেও দিক ভিন্ন। D ভেক্টর C ভেক্টর থেকে ভিন্ন, কারণ দিক একই হলেও মান সমান নয়।"

## The one idea to teach
A scalar is fully given by its মান alone; a vector needs মান and দিক. Two vectors are the same only when both মান
and দিক match, wherever they are drawn.

## Terms (as in the book)
রাশি, স্কেলার রাশি, ভেক্টর রাশি, মান, দিক, তাপমাত্রা, অবস্থান, দূরত্ব, সময়, দৈর্ঘ্য, ভর, বেগ, বল, তির (the book spells
তির, not তীর), হুবহু এক, ভিন্ন অবস্থানে, মান সমান হলেও দিক ভিন্ন, দিক একই হলেও মান সমান নয়. Directions: উত্তর, দক্ষিণ,
পূর্ব, পশ্চিম, উত্তর-পূর্ব, … (the compass letters উ পূ দ প).

## Version 0.2.0: a new way to teach it (the owner's feedback)
The owner, on 0.1.0: "In the first image experiment, use a different way to teach instead of the carrom board,
because this is a bit complex." 0.1.0 was graph paper on a wooden drawing board (it read as a carrom board) with four
arrow pieces, a compass, angles, a thermometer and a panel of readouts, and the student dragged heads and tails. The
owner also wants every figure on the clean panel (kit 1.3.0): one action, one result, one rule, no boxes.

0.2.0 tells the page's own argument as a story the student plays: **find your friend** on a school field. The book
says a position could not be given by the distance alone, its direction was needed too; here the student feels it.

## How the figure works
- A school field seen from slightly above (north up): mown grass, the white line, trees, the school and the national
  flag beyond it. You (white shirt, "তুমি") stand on a chalk compass (উ পূ দ প; the উত্তর point is longest and its
  letter farthest out, so a child standing on the compass never hides it, and no label may cover the letters); a 10 m
  bar lies on the grass in the bottom right corner. The children, trees and school are drawn bigger than life so they
  can be seen on a phone; distances are to scale. A note under the bar says so (the label reads "১০ m", under it
  "মানুষ ৫ গুণ বড় করে আঁকা"; a child is drawn 9 m tall, about 5 times a child of 1.65 m).
- The panel is the kit's clean sheet. One big numbered button leads five steps; its same numbered badge rings what to
  touch on the field (you, or the child waiting to be sent; a tap on either, or on the thing itself, does it). The
  number is the student's own step. While a step plays the button waits (greyed) and the ring hides; a double tap never
  skips a step.
  1. **বন্ধুকে ডাকো**: the friend answers with a size only, "আমি ২৫ m দূরে!". A measuring line sweeps once round you,
     drawing the ring of every place 25 m away; question marks pop up all round it; you look about. Only then the result
     ("… তাহলে সে এই বৃত্তের যেকোনো জায়গায় থাকতে পারে।") and the rule: 25 m is a মান; a quantity one value describes
     completely, like temperature, is a স্কেলার রাশি; but the মান alone did not say where the friend is.
  2. **দিকও জিজ্ঞেস করো**: "২৫ m, উত্তর-পূর্ব দিকে!". The উত্তর-পূর্ব point of the compass glows orange, the question marks
     fade, one violet arrow A⃗ grows to exactly one place, the friend (red) pops up, you walk over (stopping 7 m away, so
     the ring round the next thing to touch never cuts the friend) and the friend waves. Result: "ঠিক এখানে: পেয়ে গেছ!".
     Rule: the book's sentence (অবস্থান needed the দিক too), so it is a ভেক্টর রাশি. B appears, waiting at its start.
     This is the poster.
  3. **B-কে পাঠাও**: "B-কে বলা হলো: ২৫ m, উত্তর-পূর্ব দিকে" (your clue). B's arrow grows, B walks it, then a copy of B's
     arrow lifts off and slides, unturned and unstretched, onto A's tail and covers A exactly: "হুবহু এক". Rule: the
     caption, "A ও B ভেক্টর হুবহু এক, যদিও ভিন্ন অবস্থানে রয়েছে।" C appears.
  4. **C-কে পাঠাও**: 25 m উত্তর-পশ্চিম; C's copy at A's tail is as long but points another way; an orange arc (radius
     15 m, clear of the compass's উ) marks the angle: "দিক ভিন্ন". Rule: "C ভেক্টর A ও B থেকে ভিন্ন, কারণ মান সমান হলেও দিক ভিন্ন।" D appears.
  5. **D-কে পাঠাও**: 12.5 m উত্তর-পশ্চিম; D's copy at C's tail runs along C but ends half way: "মান সমান নয়". Rule: two
     vectors are the same only if মান and দিক are both equal; স্কেলার: তাপমাত্রা, সময়, দৈর্ঘ্য, ভর; ভেক্টর: অবস্থান, বেগ, বল.
  Then "আবার শুরু করো". A tap on an arrow already compared (or its child) slides it again. The quiet round arrow goes
  back to the start. Keys: → / Space / Enter the next step, ← one step back, R the start, F/V the views.
- Labels on the field are the kit's annotations with spots, kept off the arrows, the children, the orange arc, the
  compass letters, the ring and the badge. An arrow's name is just its letter (A⃗): its মান and দিক are in the result
  line, in the same colours; a long label "A: ২৫ m, উত্তর-পূর্ব দিকে" could not be kept off the উ on a phone. The result line colours its key words by meaning: মান blue, ভেক্টর violet,
  the same vector green, দিক orange.
- Test (5 questions, 4 tap answers of one form each, a scene set up for each, an order in which no scene gives away a
  later answer):
  - **clue**: Raju says only "২০ m দূরে"; three flags with their distances chalked on the grass (the flag's name over
    its distance), two at 20 m and one at 12 m; no compass in this scene (nothing here has a direction). Where can he be? Right: either of the two 20 m flags. Wrong: only one of them (one distance, one place), or
    any of the three (the distances not read). The reveal draws the 20 m ring through the two.
  - **find**: "২০ m, দক্ষিণ-পূর্ব দিকে" (a random diagonal); four flags 20 m away on the diagonals. Wrong: the
    opposite way, east and west swapped, north and south swapped. The reveal lights the compass point, draws the arrow
    and the friend pops up by the flag.
  - **why**: two arrows P and Q in different places; why are they different vectors? (only the দিক, only the মান, or
    both differ; the misconception "drawn in different places"). The reveal slides Q onto P's tail.
  - **equal**: five arrows; which equals A? (wrong: turned, half as long, reversed). The reveal slides the right one
    onto A's tail.
  - **kind**: the picture of the found friend (the ring, the arrow A, the friend by it): either which is right
    about "২৫ m দূরে" and A (the distance a scalar and A a vector; swapped; both scalars; both vectors), or which part
    of the story needs a দিক as well (where the friend is; how far, how long you walked, the friend's temperature).

## Decisions
- **Distances**: the clue is 25 m (a school field is about 120 m across) and the arrows are to scale with the 10 m
  bar. The frame is set by the ring's width on a phone held upright, so 25 m (rather than 50 m) keeps the children
  about 35 px tall at 390×700; they are drawn about five times bigger than life, and the note says so.
- **Directions** are the eight compass words; the camera looks north so উত্তর is up, a little tilted (44° on phones, a
  little lower on wide frames) so the children stand up. The rotated view (ঘুরিয়ে দেখো) starts about 53° above the
  field, so arrows are not squashed.
- **C and D point উত্তর-পশ্চিম** as in the book's picture; the layout of B, C, D was searched so that no two arrows or
  comparison copies come within 9 m, no standing child hides another arrow, and everything fits the frame (unit tests
  check it).
- **Comparing**: the copy slides onto the partner's tail, unturned and unstretched, the way the caption compares; the
  partner is the caption's (B with A, C with A, D with C).
- **Notation**: vector names carry a small arrow on top everywhere (A⃗), as a student writes them by hand; the panel
  is not bold for names, since <b> marks the key words. The notation question of 0.1.0 is gone (the test is now about
  the idea); the book's print/hand convention could come back as a question if the team wants it.
- No thermometer object: temperature is named in the rule (৩৭° C) and in the test; the owner found the extra objects
  complex.
- Words not on the page: মাঠ, বন্ধু, পতাকা, হাঁটা, গোড়া (an arrow's tail). The clue is simply what the friend says;
  "সূত্র" is avoided for it (in physics it means a law).

## Open questions
- বেগ and বল are named as vectors (the book does), but they are only introduced in the next chapter.
- Units: distances use the Latin symbol m as chapter 2 does (page 39 writes km; docs/book-notes.md), the words round
  them Bangla ("২৫ m দূরে", "২৫ m, উত্তর-পূর্ব দিকে"), with a no-break space so a number never parts from its unit.
