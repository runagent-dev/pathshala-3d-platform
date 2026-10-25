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
সংঘর্ষ, ভরবেগ, সম্মিলিত ভরবেগ, শক্তি, গতি শক্তি / গতিশক্তি (½mu²), সংরক্ষণশীলতা, নিত্যতা, ভরবেগের সংরক্ষণশীলতা বা
নিত্যতা, শক্তির নিত্যতার সূত্র, শক্তির সংরক্ষণশীলতার সূত্র, সংঘর্ষের আগে, সংঘর্ষের পর, বাইরে থেকে কোনো বল, সমতল,
সরলরেখা, ভর, বেগ, সমীকরণ, অজানা রাশি, "আমরা ধরে নিই সংঘর্ষে গতিশক্তি ব্যতীত অন্য কোনো শক্তির আদান-প্রদান ঘটেনি".
Symbols as printed: m₁, m₂, u₁, u₂, v₁, v₂ (HTML sub/sup; the font has no ₁ ₂). Units: kg, m/s, kg m/s, J (the
book gives no numbers here; the figure's numbers are its own). "চিত্র ৩.০৪" is written with Bangla digits.
The balls are called "ভর" / "m₁ ভরটি" as the book does, never "বল" (in this figure বল is force: বাইরে থেকে কোনো বল).

## How the figure works
- 3D: a smooth straight track (a line along it, a mark every 10 cm on the front edge) and two balls whose size
  follows the mass (same material, r = 8 cm × ∛(m/kg)); m₁ dark slate, m₂ ivory (told apart by size, tint and
  labels, never by the quantity colours). Each has a blue velocity arrow (0.07 m per m/s; to the right positive)
  above it, on two heights so they never overlap, tied to its ball by a thin dashed stalk; labels "u₁ = ২ m/s"
  (before), "১.৫ m/s" (while touching), "v₁ = ১ m/s" (after), and "m₁ = ৩ kg" under each ball.
- Examples (the panel's four chips, a small picture of the balls and arrows on each): ভারী পেছনে 3 kg at 2 m/s into
  1 kg at rest → 1 and 3 m/s; সমান ভর 2 kg + 2 kg, 3 and 1 m/s → swap; হালকা পেছনে 1 kg at 2 m/s into 3 kg at rest →
  −1 and 1 m/s; মুখোমুখি 3 kg at 2 m/s, 1 kg at −2 m/s → 0 and 4 m/s. Masses always add up to 4 kg, velocities are whole
  m/s, so every v is a whole or a half and every sum shows exactly.
- The student drags a ball's arrow (or the ball) sideways to set u (whole m/s, −3…3; u₁ > u₂ or they never meet: a
  hint says so); a tap on a ball, the চালাও button or Space plays/pauses; the scrubber (the collision in yellow) or ←/→
  moves through the run; ↑/↓ (Shift: m₂) change u; 1–4 pick the examples.
- One run (collision.js, a pure function of the playback time, so it can be scrubbed and filmed): the balls approach
  10 times slower than real ("সময় ১০ গুণ ধীর"), touch (a flash, as in চিত্র ৩.০৪), and while they touch the moment is
  slowed much more ("ধাক্কার মুহূর্ত আরও ধীরে"): the velocities change over smoothly as a very stiff spring between
  them would do it (the relative velocity goes from w to −w as w·cos πk; positions held), so half way both move with
  the centre of mass. Then they part with v₁ and v₂ from both conservation laws. Before, during and after, the start
  point is chosen so both balls and their arrows stay in view (at most 0.25 s of real time before and after).
- Under the picture, a momentum strip (green, kg m/s): two rows, আগে and এখন/পরে, each with m₁'s and m₂'s momentum as
  arrows laid tip to tail (one above the other when their signs differ), a dashed line at the total that never moves,
  and the sum in numbers ("৪.৫ + ১.৫ = ৬" while touching). At the tightest size (stage under 300 px) only the এখন row.
- The panel: the book's two equations as a table (before | after; numbers over their symbols, momentum green, energy
  amber), the after side "?" until the balls have collided; the assumption line; one sentence for the moment (before:
  what are v₁, v₂, one equation has two unknowns, so the energy equation is needed; touching: what one loses the other
  gains; after: no outside force → the same total: ভরবেগের সংরক্ষণশীলতা বা নিত্যতা; kinetic energy too: শক্তির
  সংরক্ষণশীলতা); the play button and the scrubber.
- Test (5 questions, each on its own scene, reshuffled): the total momentum before (strip hidden; head-on half the
  time, so signs matter), v₂ from the momentum equation (after state, v₂ hidden, the before row of the strip gives the
  total), the kinetic energy after (with the book's assumption), then one of equal masses (predict v₁; the run plays
  after the answer) or a light ball into a heavy one (what m₁ does), and one of what stays the same (the run plays,
  strip hidden) or why the momentum equation alone is not enough. Wrong answers come from real mistakes (sign of u₂
  dropped, one mass only, masses and velocities paired wrongly, velocities added, (m₁+m₂)(u₁+u₂), no ÷m₂, ½ or the
  square forgotten, the momentum given for the energy …) and each gets its own line in the worked answer.

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
- Words the figure adds that are not on the page: ভারী, হালকা, পেছনে, মুখোমুখি (the examples), ধাক্কা (the moment they
  touch), এখন, মোট.
- Whether a stuck-together (inelastic) example, where momentum is kept but kinetic energy is not, belongs here or in
  the energy chapter (not built; the book's 3.5.1 assumes the energy is kept).
- The Bangla wording needs a person's check against the book.
