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

## What changed in 0.2.0, and why (the owner's feedback, kit 1.3.0)
The owner: "You can see I can only see the hair part, not the paper; I have to zoom out or something, because no one
will see 'চুল আঁচড়াও'." In 0.1.0 the comb-and-hair view filled the picture with a big head of hair and the bits of
paper were off-screen until the comb flew there, so the point of the experiment (a charged comb lifts paper against the
pull of the whole Earth) could not be seen; the panel had a boxed strip of the four forces, a tug line, charge circles,
a চিরুনি/চুম্বক toggle and a big button. Now:
- **One frame for the whole experiment**, the same at every size and through every step (no camera flights within an
  example): the student's head at the edge of the picture (its back cut off), the comb in the front of the hair, and
  the bits of paper on the table right under the face. To fit a phone: the student bends low over the table's left
  end, the comb is a 12 cm pocket comb, the bits are 2.4–2.8 cm (torn bits of coloured notebook paper, each with a darker edge, so they still show once
  lifted against the white page), the camera looks from 42°
  above (bits read as bits, not slivers) through a long lens (fov 20°, so the head, nearer the camera, is not drawn
  bigger), and the table is only 11 cm deep so the lifted bits hang above its far edge. Measured: each bit is 23–28 px
  wide at 390×700, 13–16 px at 390×520, 17–21 px at 800×500 and 29–36 px at 844×390.
- **One action in two numbered steps** (kit createAction): "১ চিরুনি দিয়ে চুল আঁচড়াও", its badge and dashed ring on
  the comb; five strokes along the front of the hair, a level of charge each (two blue "−" discs per stroke; loose hairs
  stand up). Then "২ চিরুনি কাগজের কাছে আনো", the ring round the bits of paper: the comb flies over them, comes down,
  they jump up and cling, it lifts them into the air. Then "আবার চুল আঁচড়াও" (no number, no ring over the result).
  A tap on the comb does the step too; a tap on the paper brings the comb at once (with no charge: nothing jumps);
  the comb can still be dragged (through the hair: it charges; over the paper: up and down).
- **One result line**: "চিরুনিতে আধান নেই" → "৫ বার আঁচড়ানো, চিরুনিতে আধান জমেছে" → "চিরুনির টান < পুরো পৃথিবীর টান"
  → "চিরুনির টান > পুরো পৃথিবীর টান" (the two names in their arrows' colours; the sign large). It is read from the same
  bit as the arrows, so the line and the picture never disagree.
- **One rule line**, growing with what the student has seen, ending in the book's rule: "তড়িৎ বল ও চৌম্বক বল মিলে তড়িৎ
  চৌম্বক বল; মাধ্যাকর্ষণ বলের তুলনায় অনেক শক্তিশালী (বই বলছে 10³⁶ গুণ); পাল্লা অসীম" (shown once both examples have
  been seen). The comb's win and the book's 10³⁶ are in separate clauses ("… হারিয়ে দিল: … অনেক শক্তিশালী (বই বলছে
  10³⁶ গুণ)"), so it never says this comb pulls 10³⁶ times the paper's weight (book-notes).
- **The magnet example keeps its scene, in two steps**: "১ সুইচ চালু করো" (ring on the switch) and "২ চুম্বকটি ঘুরিয়ে
  দাও" (ring on the magnet), then "চুম্বকটি আবার ঘুরিয়ে দাও". The orchestrator suggested pins jumping to a magnet; the
  coil and the cart show what pins cannot: the book's own magnet sentence (চুম্বক দিয়ে অন্য চুম্বককে আকর্ষণ-বিকর্ষণ)
  and its central claim that electric and magnetic forces are one force (a current makes the coil a magnet).
- **The four forces strip**: kept (book-notes: every four-force figure has it, with its exact heading, at every size)
  but as quiet words under the rule, no boxes, no ranges; তড়িৎ চৌম্বক marked by colour, weight and an underline.
  The tug line, the charge circles and the toggle are gone (the row of words is the toggle).
- Labels use the kit's annotations (spots, avoid; src/labels.js is gone): they keep off the ring, the badge, the
  comb, the arrows and the other bits; the two pulls' names are left out when there is no room (the result line names
  them in the same colours).

## How it works
- Two examples in the row of words: **চিরুনি** (first, the book's own experiment) and **চুম্বক**.
- **চিরুনি**: about every pass of the comb along the front of the hair adds one charge level (0–5): blue "−" discs on
  the comb (two per level), loose hairs on the crown stand up, leaning towards the comb (charged hair). Brought to the
  paper, the comb arrives 6.2 cm above the table and comes down slowly over seven bits. A bit jumps when the comb's pull
  is bigger than its weight: pull ÷ weight = (q/5)² × (45 mm / d)⁵ (a small polarisable bit in the comb's field: the
  pull grows very fast as the comb comes closer). So a fully charged comb lifts paper from 4.5 cm, a one-stroke comb
  from 2.4 cm, an uncharged comb never. The comb stops a little inside its reach (`stopHeight`), waits, and lifts the
  bits up to 6 cm, where they clearly hang in the air ("কাগজকে আকর্ষণ করে তুলে নাও").
- The bit with the arrows lies right under the comb's last teeth, so it is always the first to jump; it sticks at the
  comb's end, half beyond it, so its arrows stay clear of the comb. Its arrows: পুরো পৃথিবীর টান (down, purple, the
  মহাকর্ষ colour of 3.2.1, 26 mm) and চিরুনির টান (up, blue #1c7ed6, তড়িৎ চৌম্বক বল), drawn to the same scale until the
  comb's is 2 times the weight (then it stays: close to the comb the real pull is much bigger still). They show while
  the comb is over the paper (and in the test only after the answer). On a picture less than 400 px tall both are
  drawn longer and thicker by the same factor (up to 2), so their ratio stays the same; their names sit beside the
  shafts (the leader dot on the middle of the shaft, never on a head).
- **চুম্বক**: a coil of copper wire on a plastic tube (no iron, so it is not attracted when off), with a 1.5 V cell
  (+ at its right end) and a knife switch lying on the bench in front of it (round 2: the row is about a third shorter
  than with the cell and switch beside the coil, so a phone shows it a third bigger); the camera looks from 38° above,
  so they show in front of the coil, not on it. The current goes + → switch → the coil's right end → round it → its
  left end → −; the winding turns anticlockwise seen from the magnet, so the right end is N. At the start the coil,
  the cell, the switch and the magnet are named (the coil's name while no current flows: then its poles name it;
  the cell's and the switch's until the switch has been used). A bar
  magnet (N red, S grey: not blue, the force's colour) on a little cart. Switched on (the action, or a tap on the
  switch), amber chevrons run along the wires (the current, "তড়িৎ চলছে"), the coil's ends turn red/grey, named N and S
  under them: the coil has become a magnet. Unlike poles attract (the cart rolls in and clicks against the coil), like
  poles repel (it rolls to the block at the end of the 6 cm track). The action (or a tap on the magnet, or x) turns
  the magnet round; it can be dragged along the track.
- The forces: two equal and opposite blue arrows at the facing ends, just above them, with আকর্ষণ / বিকর্ষণ above the
  gap. The force falls off as 1/r⁴ (r between the middles); the arrows are 8 + 30·(F/F₀)^0.35 mm long, which keeps
  shrinking along the whole track but never reaches zero. At the end of the track the pull still beats the wheels'
  friction, so the magnet comes back: পাল্লা অসীম. The poles follow the right-hand grip rule (the right end, facing
  the magnet, is N).
- If step 2 is cut short (the other example chosen while the comb comes down), the button offers step 2 again; after
  bringing down a comb with no charge it offers step 1 ("১ চিরুনি দিয়ে চুল আঁচড়াও").
- The button waits (greyed) while a step plays; its ring hides then and comes back on the next thing to touch. Double
  taps within 400 ms are ignored; a drag on the comb stops a running step.
- Test (5 questions, tap answers, the 3D sets each up and plays the outcome after the answer; the arrows only after
  the answer): from the picture, what a comb with or without "−" on it does when lowered to the paper (the same four
  answers either way: the student reads the comb; then it comes down and the bits jump, or nothing does); why the
  paper rises; like or unlike poles from the letters in the picture; the coil with the switch open, or (one of the two)
  whether the coil still pulls the magnet at the far end of the track; which
  force is stronger and by how much (তড়িৎ চৌম্বক/মাধ্যাকর্ষণ × 10³⁶/৩৬, and the worked answer says the 10³⁶ is for like
  particles such as two protons). The comb-lowering question always comes before the two whose pictures show a charged
  comb holding the bits up. Wrong answers get a short note on the mistake (not on the strength question).
- Keys: space/enter the action, 1/2 the examples (or the arrow keys in the row of words), ← → comb along the hair /
  move the comb or the cart, ↑ ↓ the comb's height over the paper, x turns the magnet round, f/v views.

## Open questions
- The book's numbers for the four forces disagree: 3.2.2 says the electromagnetic force is 10³⁶ times gravity;
  3.2.4 says the strong force is 10⁴¹ times gravity and 100 times the electromagnetic force (which would make it
  10³⁸). The figures show the strengths as an order only (weakest to strongest), and quote each section's own
  sentence. 10³⁶ matches the electric ÷ gravitational force between two protons (1.24 × 10³⁶, unit-tested). For the
  book team.
- Stylised on purpose: the student bends low over the table and the bits are 2.4–2.8 cm, so the head, the comb and
  the paper fit one phone picture; the comb is drawn along the front of the hair (real combing strokes front to back,
  which from the side would show the comb end-on). Also (a corner note in the magnet example says the first): the coil is an air-core coil fed by one
  cell, which in real life is a weak magnet; its pull on the cart is drawn about as strong as a small iron-core
  electromagnet's (the falling-off with distance is real). The force arrows are not to scale (see above). The comb's
  arrow is capped at 2 times the weight’s.
- Switch wording: "সুইচ বন্ধ" means "off" in everyday Bangla but could be read against "বন্ধ বর্তনী" (closed circuit),
  which the book teaches later; the figure says "সুইচ চালু করো" / "সুইচ খুলে দাও" and "সুইচ খোলা". Please check.
- "সুইচ" and "তারের কুণ্ডলী (কয়েল)" are not on page 68; please check they are the words the book uses later.
- The page's second name, বিদ্যুৎ চৌম্বকীয় বল, appears once, in the book's rule at the end.
