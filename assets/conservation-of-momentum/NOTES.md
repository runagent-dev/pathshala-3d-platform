# Notes: Conservation of momentum and energy (ভরবেগ এবং শক্তির সংরক্ষণশীলতা)

Book: physics-9-10 › 3.5.1 › p72 (the topic runs onto page 73). Page image: `reference/page-72.png` (the batch file
was named P-71-T-3.5.1.png; its second half is headed page ৭৩, so the topic starts on page 72).

## What the page shows
৩.৫ সংঘর্ষ (Collision), ৩.৫.১ ভরবেগ এবং শক্তির সংরক্ষণশীলতা. Two masses m₁ and m₂ move along a straight line on a
plane (সমতলে … সরলরেখায়) with velocities u₁ and u₂, collide, and leave with v₁ and v₂ (চিত্র ৩.০৪: three rows,
before, touching with a flash, after; m₁ the bigger ball behind, both moving right, the small one ahead after).
The text: the total momentum before, m₁u₁ + m₂u₂, equals the total after, m₁v₁ + m₂v₂, because no force acts from
outside (ভরবেগের সংরক্ষণশীলতা বা নিত্যতা). That is one equation with two unknowns (v₁, v₂), so a second one is needed:
assuming no energy other than kinetic energy changes hands, the kinetic energy (½mu²) is kept too:
½m₁u₁² + ½m₂u₂² = ½m₁v₁² + ½m₂v₂² (শক্তির সংরক্ষণশীলতা).

## The one idea to teach
In a collision with no outside force the total momentum is the same before and after (and at every moment in
between), although each ball's velocity changes; with the book's assumption the kinetic energy is the same too, and
the two equations together give v₁ and v₂.

## Terms (as in the book)
সংঘর্ষ, আঘাত (the caption: "পরস্পরকে আঘাত করার পর"), ভরবেগ, সম্মিলিত ভরবেগ, শক্তি, গতি শক্তি / গতিশক্তি (½mu²),
সংরক্ষণশীলতা, নিত্যতা, ভরবেগের সংরক্ষণশীলতা বা নিত্যতা, শক্তির নিত্যতার সূত্র, শক্তির সংরক্ষণশীলতার সূত্র, সংঘর্ষের
আগে, সংঘর্ষের পর, বাইরে থেকে কোনো বল, সমতল, সরলরেখা, ভর, বেগ, সমীকরণ, অজানা রাশি, "আমরা ধরে নিই সংঘর্ষে গতিশক্তি
ব্যতীত অন্য কোনো শক্তির আদান-প্রদান ঘটেনি".
Symbols as printed: m₁, m₂, u₁, u₂, v₁, v₂ (HTML sub/sup; the font has no ₁ ₂). Units: kg, m/s, kg m/s, J, glossed
once as "J (জুল)" (the book gives no numbers here; the figure's numbers are its own). "চিত্র ৩.০৪" is written with
Bangla digits. The balls are called "ভর" / "m₁ ভরটি" as the book does, never "বল" (in this figure বল is force: বাইরে
থেকে কোনো বল). The total is "সম্মিলিত ভরবেগ" everywhere (never "মোট ভরবেগ"); the moment is "সংঘর্ষ" or "আঘাত", never
"ধাক্কা". Signs as the sister figure `momentum`: "ডান দিক ধনাত্মক (+) ধরে", to the left "বাম দিকে" (negative).

## How the figure works
- 3D: a smooth straight track (a line along it, a mark every 10 cm on the front edge) and two balls whose size
  follows the mass (same material, r = 8 cm × ∛(m/kg)); m₁ dark slate, m₂ ivory (told apart by size, tint and tags,
  never by the quantity colours). Each has a blue velocity arrow (0.1 m per m/s, a short arrow keeps a short head, so
  ½ m/s is about 12 px at 390×520; to the right positive) above it, m₁'s a little higher than m₂'s so they never
  overlap.
- One tag per ball, always on its outer side (m₁'s to the left of its stalk, m₂'s to the right: never towards the
  other ball): its mass over its velocity ("m₁ = ৩ kg" / "u₁ = ২ m/s" before, "বেগ ১.৫ m/s" while they touch, "v₁ = ১
  m/s" after). It hangs on the top of a thin dashed stalk that rises from the ball past its arrow's tail; the tag's dot
  is on the stalk, never on an arrow. Both tags sit at the same height above m₁'s arrow, so they meet no arrow and no
  ball; the camera keeps that row under the corner buttons and the note. Checked with an all-setups probe (every
  reachable setup at nine moments and while playing, six sizes: no tag on another, an arrow, a ball, the buttons, the
  note or the strip).
- Examples (the panel's four chips, a small picture of the balls and arrows on each; names only on short phones):
  ভারী পেছনে 3 kg at 2 m/s into 1 kg at rest → 1 and 3 m/s; সমান ভর 2 kg + 2 kg, 3 and 1 m/s → swap; হালকা পেছনে 1 kg
  at 2 m/s into 3 kg at rest → −1 and 1 m/s; মুখোমুখি 3 kg at 2 m/s, 1 kg at −2 m/s → 0 and 4 m/s. Masses always add up
  to 4 kg, velocities are whole m/s, so every v is a whole or a half and every sum shows exactly.
- The student drags a ball's arrow (or the ball) sideways to set u (whole m/s, −3…3; u₁ > u₂ or they never meet,
  u₁ − u₂ ≤ 4 so that no velocity after is faster than 5 m/s and the run fits the picture: the panel's sentence line
  says which, for a moment); a tap on a ball, the চালাও button or Space plays/pauses; the scrubber (the collision in
  yellow) or ←/→ moves through the run; ↑/↓ (Shift: m₂) change u; 1–4 pick the examples. 54 setups are reachable.
- One run (collision.js, a pure function of the playback time, so it can be scrubbed and filmed): the balls approach
  10 times slower than real ("সময় ১০ গুণ ধীর"), touch (a flash, as in চিত্র ৩.০৪), and while they touch the moment is
  slowed much more ("সংঘর্ষ আরও ধীরে"): the velocities change over smoothly as a very stiff spring between them would
  do it (the relative velocity goes from w to −w as w·cos πk; positions held), so half way both move with the centre
  of mass. Then they part with v₁ and v₂ from both conservation laws. The start point is chosen so both balls and
  their arrows stay in view (at most 0.25 s of real time before and after). The note about time shows once the run
  has moved (it is not needed on the still start, and the first-use pointer's words have room there).
- Under the picture, a momentum strip (green, kg m/s): two rows, আগে and এখন/পরে (slim and without the title on short
  phones), each with m₁'s and m₂'s momentum as arrows laid tip to tail (one above the other whenever their signs
  differ, a total of zero included), a dashed line at the total that never moves, named "সম্মিলিত ভরবেগ", the sum in
  numbers ("৪.৫ + ১.৫ = ৬" while touching), and under zero the sign cue "− ← ০ → +".
- The panel: the book's two equations as a table (before | after; numbers over their symbols, momentum green, energy
  amber), each under the name of its law (ভরবেগের সংরক্ষণশীলতা বা নিত্যতা, শক্তির সংরক্ষণশীলতা; where there is room),
  the after side "?" until the balls have collided; the assumption line; one sentence for the moment (before: the
  momentum equation is one, the unknowns two, so the energy equation is needed; with a velocity to the left first the
  sign convention; touching: what one loses the other gains; after: no outside force → the same সম্মিলিত ভরবেগ:
  ভরবেগের সংরক্ষণশীলতা; kinetic energy too: শক্তির সংরক্ষণশীলতা); the play button and the scrubber.
- Test (5 questions, each on its own scene, reshuffled): the total momentum before (strip hidden; head-on half the
  time, then the question says "ডান দিক ধনাত্মক (+) ধরে"; m₂ never at rest), v₂ from the momentum equation (end of
  the run, v₂ hidden, the before row of the strip gives the total), which of four (v₁, v₂) pairs, all keeping the
  momentum, also keeps the kinetic energy (an example's start; the run plays after the answer), one of equal masses
  (predict v₁) or a light ball into a heavy one at rest (what m₁ does), both played after the answer, and one of
  what stays the same (the run plays, strip hidden; parallel answers) or the kinetic energy after. Every wrong choice
  is a real mistake with its own note (sign of u₂ dropped, subtracting, one mass only, masses and velocities paired
  wrongly, velocities added, (m₁+m₂)(u₁+u₂), no ÷m₂, v₁ instead of m₁v₁, the stuck-together velocity, ½ or the square
  forgotten, the momentum given for the energy, …); a setup that does not give three such mistakes is not used.
  During the test the scene stays put: a touch on it says so in the test's own line.

## Deliberate differences and kit gaps
- Phones (≤ 560 px wide) have no front/turn buttons, only full screen: turning a straight track adds little, makes
  the arrows and tags harder to read, and the buttons would crowd the tags and the note. The sister figures keep them.
- 16:10 book frames (800×500, any frame 461–620 px high and at least 3:2) put the panel beside the picture, as on a
  phone held sideways, so the track keeps the width it needs (otherwise an 800×243 view). Kit gap: the kit's side
  panel stops at 460 px high; the figure's CSS only undoes the kit's ≥ 720 px panel grid there. A kit option (e.g.
  `buildStudentShell(…, { side: 'wide' })`) would make this a one-liner.
- Kit gaps also: the quiz's `say()` writes plain text, so a question with subscripts is put in by the figure; and
  `src/camera.js` is the fourth copy of `fitPose` across figures (worth a kit `fitPose`).

## Honest stylisation
- Time: 10 times slower before and after; the contact much slower still (a real one lasts a tiny fraction of a
  second). Both are said on the picture.
- The contact is drawn as touching with a flash; the balls are not shown squashed.
- The kinetic energy dips while they touch (stored in the squeeze) and comes back; the figure only shows it before and
  after, as the book does, and says the book's assumption. Momentum is shown at every moment.
- Friction and rolling are left out (a smooth track, "no outside force"); the balls are not shown spinning.

## Open questions
- The book's caption has Latin "3.04" in the text (চিত্র 3.04); the figure writes চিত্র ৩.০৪ only in these notes and
  the placement. Should the figure name the picture on screen?
- Words the figure adds that are not on the page: ভারী, হালকা, পেছনে, মুখোমুখি (the examples), এখন, জুল, the sign
  convention's words (as in `momentum`).
- Whether a stuck-together (inelastic) example, where momentum is kept but kinetic energy is not, belongs here or in
  the energy chapter (not built; the book's 3.5.1 assumes the energy is kept; the pairs question names it once).
- The Bangla wording needs a person's check against the book.

## Declutter and side panel (0.2.0)
The 3D view is only the track and the two balls with their tags, on a soft blue-grey backdrop instead of the white
page. The momentum strip (before / now, tip to tail) left the bottom of the view and is drawn in the panel under the
play row, at the panel's width (src/ledger.js unchanged); on a phone held upright it is left out, with the laws'
captions and the note on the assumption, so the 3D keeps 55 % of 390×700 (the table still carries every number).
The panel reads in the order of every lab: the four examples, play and the time slider, the strip, the equations,
the assumption, the sentence. Kit 1.5.0 puts the panel beside the 3D, so the figure's own `.pvc-shell` rules (for
16:10 frames and phones on their side) and the wide two-column sheet are gone; a narrow side panel (≤ 340 px) keeps
the compact type.
No সামনে / ঘুরিয়ে দেখো buttons (kit): the lab starts from the front, a drag turns it, and the small "front" icon
then brings it back.
