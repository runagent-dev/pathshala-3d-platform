# Notes: Electromagnetic force (তড়িৎ চৌম্বক বল)

Book: physics-9-10 › 3.2.2 › p68 (`order: 2` of the four fundamental forces, 3.2.1–3.2.4)

## What the page shows
Section ৩.২.২ তড়িৎ চৌম্বক বল বা বিদ্যুৎ চৌম্বকীয় বল (Electromagnetic Force), text only, no picture: combing hair and
picking up bits of paper with the comb, magnets attracting and repelling each other; electric and magnetic forces
seem different but are the same force; it is far stronger than gravity (10³⁶ গুণ, ট্রিলিয়ন ট্রিলিয়ন ট্রিলিয়ন গুণ):
the whole Earth pulls the paper with all its mass, yet the comb's tiny charge wins; its range is infinite.
Screenshot: `reference/page-68.png` (3.2.1–3.2.3; this is the second section).

## The one idea to teach
Electric and magnetic forces are one force, the electromagnetic force, and it is enormously stronger than gravity:
a comb's tiny charge lifts a bit of paper against the pull of the whole Earth. Its range is infinite.

## Terms (as in the book)
তড়িৎ চৌম্বক বল, বিদ্যুৎ চৌম্বকীয় বল, চিরুনি, চুল আঁচড়ানো, কাগজের টুকরো, আকর্ষণ, বিকর্ষণ, চুম্বক, আধান,
মাধ্যাকর্ষণ বল, পাল্লা, অসীম; the four forces: মহাকর্ষ বল, দুর্বল নিউক্লীয় বল, তড়িৎ চৌম্বক বল, সবল নিউক্লীয় বল
(agent-kit forces.json, shared with the other three figures). Not on this page but standard NCTB words used for the
coil example: তারের কুণ্ডলী (কয়েল), তড়িৎ কোষ, সুইচ, দণ্ড চুম্বক, উত্তর/দক্ষিণ মেরু (N, S), সমমেরু, বিপরীত মেরু.

## How it works
- Two examples, two chips in the panel: **চিরুনি** (first, the book's own experiment) and **চুম্বক**.
- **চিরুনি**: a student (side view, light blue school shirt, as in speed-velocity) at a desk. The comb sits in the
  hair; the student drags it along the hair (or presses **চুল আঁচড়াও**: three passes). About every pass adds one
  charge level (0–5): blue "−" discs appear on the comb (two per level), the panel's আধান meter fills, and loose
  hairs on the crown stand up (charged hair). **কাগজের কাছে আনো** flies the comb to the desk (the camera follows)
  and lowers it slowly over eleven bits of paper (8–13 mm, plausible torn bits). A bit jumps when the comb's pull is
  bigger than its weight: pull ÷ weight = (q/5)² × (45 mm / d)⁵ (a small polarisable bit in the comb's field: the
  pull grows very fast as the comb comes closer). So a fully charged comb lifts paper from 4.5 cm, a one-stroke comb
  from 2.4 cm, an uncharged comb never. The student can drag the comb up and down over the paper.
- One bit (at the right end of the comb, so its arrows stay clear of the comb) carries two arrows: পুরো পৃথিবীর টান
  (down, purple, the মহাকর্ষ colour of 3.2.1) and চিরুনির টান (up, blue #1c7ed6, তড়িৎ চৌম্বক বল), drawn to the same
  scale until the comb's is 2.5 times the weight (then it stays at 2.5: close to the comb the real pull is much
  bigger still). The panel compares the two live (চিরুনির টান < / > পুরো পৃথিবীর টান) and, once the paper is lifted,
  says the book's sentence with 10³⁶. **আবার শুরু করো**: the bits fall back, the comb (charge 0) returns to the hair.
- **চুম্বক**: a coil of copper wire on a plastic tube (no iron, so it is not attracted when off), a 1.5 V cell and a
  knife switch behind it; a bar magnet (N red, S dark blue) on a little cart. Main button **সুইচ চালু করো** (or tap
  the switch): the current flows, the coil's ends turn red/blue, named N and S under them: the coil has become a magnet
  (তড়িৎ আর চুম্বকের বল একই বল). Unlike poles attract (the cart rolls in and clicks against the coil), like poles
  repel (it rolls to the block at the end). Tap the magnet (or **চুম্বক উল্টাও**) to turn it round; drag it along
  the track. Two equal and opposite blue arrows above show the force on each, shrinking with distance as 1/r⁴
  (r between their middles) but never zero; at the end of the track the pull still beats the wheels' friction, so
  the magnet always comes back: পাল্লা অসীম. The poles follow the right-hand grip rule: the current goes in at the
  coil's left end and round as a right-handed screw (its front turns carry current downwards), so the right end
  (facing the magnet) is N.
- Panel: the idea line (changes with the state, always the book's words), the live comparison, the strip of the four
  fundamental forces under the heading shared by the four figures, "চার মৌলিক বল (সবচেয়ে দুর্বল → সবচেয়ে শক্তিশালী)":
  মহাকর্ষ, দুর্বল নিউক্লীয়, তড়িৎ চৌম্বক, সবল নিউক্লীয়, this one highlighted, each with its range (অসীম, 10⁻¹⁸ m, অসীম,
  10⁻¹⁵ m), as an order only, never on a number scale; then the chips and the main button. On wide frames the
  comparison and the strip sit side by side.
- The labels in the picture place themselves every frame (src/labels.js): each tries a few spots and takes one that
  is inside the picture and clear of the corner buttons, the other labels, the comb and the arrows; a label whose
  point is out of the picture is not shown. (Kit gap: the kit's createAnnotations pins labels at fixed offsets.)
- Test (5 questions, tap answers, the 3D sets each up and plays the outcome after the answer): why the paper rises
  (or: what an uncharged comb does, then it comes down and nothing jumps); like or unlike poles from the letters in
  the picture (a 2×2 of সমমেরু/বিপরীত মেরু × আকর্ষণ/বিকর্ষণ); the coil with the switch off (then it switches on and
  pulls); which force is stronger and by how much (তড়িৎ চৌম্বক/মাধ্যাকর্ষণ × 10³⁶/৩৬); the range (অসীম, contact
  only, 10⁻¹⁵ m, 10⁻¹⁸ m). Wrong answers get a short note on the mistake.
- Keys: space/enter the main button, 1/2 the examples, ← → comb along the hair / move the comb or the cart, ↑ ↓ the
  comb's height over the paper, x turns the magnet round, f/v views.

## Open questions
- The book's numbers for the four forces disagree: 3.2.2 says the electromagnetic force is 10³⁶ times gravity;
  3.2.4 says the strong force is 10⁴¹ times gravity and 100 times the electromagnetic force (which would make it
  10³⁸). The figures show the strengths as an order only (weakest to strongest), and quote each section's own
  sentence. 10³⁶ matches the electric ÷ gravitational force between two protons (1.24 × 10³⁶, unit-tested). For the
  book team.
- Stylised on purpose: the coil is an air-core coil fed by one cell, which in real life is a weak magnet; its pull on
  the cart is drawn about as strong as a small iron-core electromagnet's (the falling-off with distance is real).
  The comb's arrow is capped at 2.5 times the weight's.
- "সুইচ" and "তারের কুণ্ডলী (কয়েল)" are not on page 68; please check they are the words the book uses later.
