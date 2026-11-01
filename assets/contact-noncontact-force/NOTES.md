# Notes: Force: contact and non-contact (বল: স্পর্শ ও অস্পর্শ বল)

Book: physics-9-10 › 3.1.2 › p67 (the only figure for this topic; Newton's first law 3.1 and inertia 3.1.1 are their
own figures on page 64, and the four fundamental forces 3.2.x are their own figures on pages 68–69)

## What the page shows
Page 67 (`reference/page-67.png`), topic ৩.১.২ বল (Force), text only, no picture:

> নিউটনের প্রথম সূত্রে প্রথমবার 'বল' শব্দটা ব্যবহার করা হয়েছে কিন্তু মজার ব্যাপার হচ্ছে বল বলতে আমরা কী বুঝি, সেটা
> এখনো বলা হয়নি। আসলে নিউটনের প্রথম সূত্রটাই বলের সংজ্ঞা হতে পারে! যার প্রয়োগের কারণে স্থির বস্তু চলতে শুরু করে আর
> গতিশীল বস্তুর বেগের পরিবর্তন হয় সেটাই হচ্ছে বল। …
> তোমরা যখন তোমাদের দৈনন্দিন জীবনে নানা কাজে বল ব্যবহার করো, তখন তোমাদের মনে হতে পারে কোনো কোনো বল প্রয়োগ করতে হলে
> স্পর্শ করতে হয় (ক্রেন দিয়ে ভারী জিনিস তোলা, কোনো কিছুকে ধাক্কা দেওয়া, কিংবা চলতে চলতে ঘর্ষণের জন্য চলন্ত বস্তুর থেমে
> যাওয়া) আবার তোমরা লক্ষ করেছ কোনো কোনো বল প্রয়োগের জন্য বস্তুকে স্পর্শ করতে হয় না। যেমন কোনো কিছু ছেড়ে দিলে
> মাধ্যাকর্ষণ বলের জন্য নিচে পড়া, চুম্বকের আকর্ষণ! কাজেই আমরা বলকে স্পর্শ এবং অস্পর্শ দুই ধরনের বলে ভাগ করতে পারি।

## The one idea to teach
A force is what starts a body at rest moving or changes a moving body's velocity; some forces act only by touching
(স্পর্শ বল: a crane's cable, a push, friction), others act without touching (অস্পর্শ বল: gravity on a falling
body, a magnet's pull). The student must be able to tell at a glance which is which, from the picture itself.

## Terms (as in the book)
বল, স্থির বস্তু চলতে শুরু করে, গতিশীল বস্তুর বেগের পরিবর্তন, স্পর্শ বল, অস্পর্শ বল, স্পর্শ করতে হয় / স্পর্শ করতে হয়
না, ক্রেন দিয়ে ভারী জিনিস তোলা, কোনো কিছুকে ধাক্কা দেওয়া, চলতে চলতে ঘর্ষণের জন্য চলন্ত বস্তুর থেমে যাওয়া, কোনো কিছু
ছেড়ে দিলে মাধ্যাকর্ষণ বলের জন্য নিচে পড়া, চুম্বকের আকর্ষণ, বলকে স্পর্শ এবং অস্পর্শ দুই ধরনের বলে ভাগ. The rule
line quotes the book's definition of force word for word and the book's "স্পর্শ করতে হয় / হয় না" for the two kinds;
each example's result line at rest starts with its phrase from the page (shortened where it must fit one line on a
phone: "ঘর্ষণে চলন্ত বস্তুর থেমে যাওয়া", "ছেড়ে দিলে নিচে পড়া"). Other words the figure uses: ছুঁয়ে আছে / ছোঁয়নি
(touching / not touching), ফাঁক (gap), ট্রলি. Lengths in cm, as the book's symbol (docs/book-notes.md). The ball is
always called ফুটবল: on this page বল means force ("স্থির বল পড়তে শুরু করল" would read as "a force started to fall").

## What changed in 0.2.0, and why
The owner, about 0.1.0: "for all tasks and exams it is very difficult to understand, basically from the part below,
which is the touch force and which is the non-touch force." The panel had five boxed chips with icons, a definition, a
sentence, a play button, a speed readout, a counter and two boxes to sort into; the scene marked the touching place
with a thin hollow ring and the gap with a thin dashed bracket. The answer to "touch or no touch" was in the boxes
under the picture, not in the picture.

0.2.0 puts the answer in the picture and moves the panel to the kit's clean sheet (kit 1.3.0, one action, one
result, one rule):
- **In the scene**, at the moment the force acts: a contact force lights a glowing patch where the two bodies meet
  (the hook in the block's ring, the palms on the carton, the floor under the sliding crate with its touching front
  edge) and a big tag "ছুঁয়ে আছে: স্পর্শ বল" points at it; a non-contact force shows the empty space between the two
  bodies as a dimension line with a tick on each surface (the football and the floor, the nail and the magnet's N
  face) and the tag "ছোঁয়নি, তবু টানে: অস্পর্শ বল" with the measured gap ("ফাঁক ৬০ cm", "ফাঁক ২.৩ cm"). The arrow, the
  patch or gap and the tag take the kind's colour, aligned with the chapter-3 figures (review round 2): স্পর্শ বল
  orange #e8590c, the pull and tension of `balanced-forces` and `momentum` (blue #1c6fd9 is velocity there, so it is
  not used for a force here); অস্পর্শ বল violet #7048e8, gravity's colour from 3.2.1. Friction keeps the contact
  orange here (in `newtons-first-law` its arrow is crimson #c2255c): in this figure the colour says the kind. The
  kind is also in words and in the shape (solid tag at a patch, dashed tag at a gap): never colour alone. The force's
  name stays beside its arrow when there is room.
- **One action**: a big numbered button with the example's own verb (ক্রেন দিয়ে তোলো, ধাক্কা দাও, পিছলে যেতে দাও,
  ফুটবলটি ছেড়ে দাও, পেরেকের কাছে চুম্বক আনো) whose twin badge rings the body the force acts on (the block, the carton
  on its trolley, the crate, the football, the nail); a tap on the body does the same. The run holds at the telling
  moment: later the hands let go, the crate stops, the football lands and the nail clicks onto the magnet, and the
  picture would no longer show the touch or the gap (the note says "থামিয়ে দেখানো"). The button then offers the next
  example not seen yet (its word gets a dotted underline), so pressing the one button walks through all five; the
  badge's number counts the student's own steps; replays have no number.
- **One result line** names the force and its kind: "ক্রেনের তার ব্লকটিকে ছুঁয়ে টেনে তুলছে: স্পর্শ বল", "চুম্বক
  পেরেকটিকে না ছুঁয়েই টানছে: অস্পর্শ বল". At rest it gives the book's phrase for the example and says the body is
  still.
- **One rule** grows: first the book's definition of force; after a first example its kind in the book's words
  ("স্পর্শ বল প্রয়োগ করতে হলে বস্তুকে স্পর্শ করতে হয়"), and what this force does in the definition's words ("এখানে
  বলের প্রয়োগে স্থির বস্তু চলতে শুরু করল", "… গতিশীল বস্তুর বেগের পরিবর্তন হচ্ছে: বেগ কমছে"); after both kinds,
  both; after all five, the book's conclusion (বলকে দুই ভাগ করা যায়).
- **The two boxes became a quiet tally**: once seen, each example's word gets its kind under it (স্পর্শ / অস্পর্শ).
- Gone: chips with icons, the sorting boxes and the stop to sort, the speed readout, the counter, the first-use hand
  (the action's marker replaces it), the "আবার দেখো" button (the action replays).
- **The test** (5 questions, order shuffled): a new contact case (a rope pulling a cart, or a parachute), the comb
  lifting paper (a new non-contact case), friction on the crate with nobody pushing (contact although nothing seems
  to push it), gravity on the falling football (nothing touches it), and what the magnet's pull does to the nail (the
  book's definition: its velocity increases). The scene of each question is set up first; its arrow is a plain grey
  "এই বল" (the kind's colour would give the answer away). The answer lights the patch or measures the gap and turns
  the arrow to the kind's colour; the worked answer leads with the answer and points at the picture ("ছবিতে দেখো,
  ফুটবল আর মেঝের মাঝে ৬০ cm ফাঁক …"), speaking to the student's own mistake. Every "which kind?" question has two
  স্পর্শ and two অস্পর্শ answers, each wrong one a real misconception with its own note, no "কোনো বল নয়" filler: the
  person does not touch the cart / the long rope pulls from a distance / the wheels touch; air cannot be seen /
  gravity slows it / the ground pushes from below; nobody touches the crate / the Earth pulls it to a stop / the
  earlier push still pushes it; the air pushes the football down / the Earth touches it through the floor / the
  hands' push is still in it; the hand holds the comb / the paper sticks to it / the paper is light.
- Framing: each view is now framed on the body up to its telling moment (not on its whole run), so the bodies are
  larger on a phone; the crate is seen a little more from above so the lit floor round it shows.
- Bridge: `seen` replaces `sorted` (URL parameter and `set`), `act: true` does what the big button does, `get` adds
  `marks` ('contact' | 'gap' | null) and `next` ({ example, step }); the `sort` command and event are gone.

## How the figure works
- The five examples, in the page's order, as one row of words. Each scene is real size, in metres:
  1. ক্রেন: a truck crane on its outriggers lifts a concrete block (1.5 m × 1 m × 1 m) by its steel ring, at up to
     0.5 m/s (a real hoist speed), real time; held half a metre up, rising at 0.5 m/s.
  2. ধাক্কা: a student in school uniform pushes a carton on a flat trolley (0 → 0.9 m/s in 0.9 s), real time; held
     with the hands pushing, at 0.5 m/s.
  3. ঘর্ষণ: a wooden crate slides on a board floor at 2 m/s (already sliding in the first picture, with its friction
     arrow: the book's "চলন্ত বস্তু"); friction (μ ≈ 0.2, −1.96 m/s²) slows it; shown 2 × slower; held at about
     1.1 m/s, still sliding.
  4. মাধ্যাকর্ষণ: a student holds a football (22 cm) out with both hands, its bottom 1.04 m above the floor, and lets
     go; it falls at g; shown 3 × slower; held 0.3 s into the fall (2.9 m/s), 60 cm above the floor. Its weight arrow
     is there from the first picture (the hands hold it up).
  5. চুম্বক: a hand brings a bar magnet (6 cm, N red, S blue) from 5 cm to 3 cm from an iron nail (5 cm); the nail
     then rushes to the N pole, faster and faster (about 0.12 s in reality; shown 10 × slower); held with 2.3 cm
     still to go. The hand touches the magnet, nothing touches the nail.
- The arrow is shown exactly while the force acts; the patch or the gap and the tag from the moment the body moves
  under the force (not while the cable tightens, the hands reach the carton or open, the magnet is brought near).
- Keys: 1–5 or ←/→ choose the example (on the row of words the kit's radio group takes the arrows), Space/Enter does
  the action, F/V views.
- The kit's labels place the tag first (round the patch or the gap's middle, clear of the bodies, the arrow, the gap
  line, the corner buttons, the note and the action's ring), then the force's name (hidden when there is no room).

- Held pictures (decided in review round 2): a tap on a held picture replays the example from rest; it never runs on
  to the end. The end pictures erase the lesson: the hands have let go of the carton, the crate has stopped (no
  friction acts any more), the football lies on the floor (the floor now touches it) and the nail sits on the magnet
  (no gap). The test's last question plays the magnet to its end on purpose: the answer is "its velocity grows".
- The comb is brought down until its teeth are about 2 cm above the paper (real pickup with a rubbed comb is about
  1–3 cm), and its tag sits below the gap line, not on it.

## Open questions
- The Earth pulling the Moon (suggested for the test) is left to the gravitational-force figure (3.2.1). Kicking a
  football was left out as too close to the push. A magnet pulling through a sheet of paper would be a good test case
  (a real confusion) but needs a new scene; for now the comb is the new non-contact case.
- The crane is held rising at a steady 0.5 m/s: there the cable's pull equals the block's weight (net force zero);
  only the pull is drawn, to keep the picture simple. "স্থির বস্তু চলতে শুরু করল" stays true (it started from rest).
- The football's bounce (restitution 0.45) and the trolley rolling to a stop still exist for `at: 'end'` and the GLB,
  not in the learn view.
- The crane's arrow is drawn beside the cable (not on it) so the hook stays visible; the football's weight arrow is
  drawn from its middle, over the ball. The parachute's contact patch is drawn on the middle of the canopy: the air
  touches the whole cloth.

## Polish and declutter (0.3.0)
Carried over from the unfinished polish pass (its layout for the old bottom panel left out): each example now has a
simple coloured place instead of the white page (src/setting.js: a building site under the sky for the crane, a
school corridor for the push, a store room for friction, a classroom for the fall, a teak table for the magnet and
the comb, a yard and a sky for the test); how time is shown (held, slowed, real) sits at the end of the action's row
in the panel, not on the view; outlined arrows; soft PCF shadows in a box fitted round each example, only the bodies
cast; the examples' static parts merged (src/merge.js).

Declutter (the owner: only the main objects): every place is only its floor, wall or sky; no site fence, building,
town, sand and bricks, notice board, door, window, bench, sacks and crates, blackboard, teacher's table, exercise
book or pencil. Kit 1.5.0 puts the panel beside the 3D, so the rules for a wide sheet under the view are gone, and the
old phone-on-its-side rule now serves any narrow side panel (≤ 340 px). No সামনে / ঘুরিয়ে দেখো buttons: the lab starts
from the front, a drag turns it, and the small "front" icon then brings it back.
