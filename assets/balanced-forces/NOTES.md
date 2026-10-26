# Notes: Balanced and unbalanced forces (বলের সাম্যাবস্থা ও অসাম্যাবস্থা)

Book: physics-9-10 › 3.3 › p69 (second figure on the page, `order: 2`; strong-nuclear-force 3.2.4 is the first). The
topic's heading is at the foot of page 69; the text goes on and its two pictures are on page 70. Screenshot (both
pages): `reference/page-69.png` (the batch image was named `P-70-T-3.3.png`).

## What the page shows
৩.৩ বলের সাম্যাবস্থা ও অসাম্যাবস্থা (Balanced and Unbalanced Forces):

> বল একটি ভেক্টর। কাজেই কোনো বস্তুর ওপর যদি বল প্রয়োগ করা হয়, তাহলে বিপরীত দিক থেকে অন্য একটি বল প্রয়োগ করে সেই
> বলটিকে কাটাকাটি করে দেওয়া সম্ভব। … দুই বা ততোধিক বল একটি বস্তুর উপর প্রয়োগ করার পর বলগুলোর সম্মিলিত লব্ধি যদি শূন্য
> হয়, তাহলে বস্তুটির ত্বরণ থাকে না।

Then three examples. চিত্র ৩.০২ (page 70): a body hung on a string (the pull T straight up, the weight W straight
down: "দুটি বল একটি আরেকটির বিপরীত দিকে কাজ করে পরস্পরকে নিষ্ক্রিয় করে সাম্যাবস্থার সৃষ্টি করেছে"); if the string is
cut only W is left, "অসাম্য বল", and the body falls with মাধ্যাকর্ষণজনিত ত্বরণ; pulled aside (a hand holds it in the
picture) T and W are no longer opposite, together they give a লব্ধি বল that acts the moment it is let go, and the
body swings ("অসাম্য বলের আরেকটি উদাহরণ"). চিত্র ৩.০৩: a heavy book tied with a rope, the two ends pulled from both
sides by two hands; the book is at rest, so its weight W and the two pulls T₁ and T₂ have a resultant of zero.

## The one idea to teach
When the resultant (লব্ধি) of all the forces on a body is zero the forces are balanced (সাম্যাবস্থা) and the body has
no acceleration; when it is not zero there is an unbalanced force (অসাম্য বল) and the body starts to move in its
direction.

## Terms (as in the book)
বল একটি ভেক্টর, কাটাকাটি, সাম্যাবস্থা, অসাম্যাবস্থা, অসাম্য বল, লব্ধি / লব্ধি বল, সম্মিলিত লব্ধি, শূন্য, ত্বরণ, পৃথিবীর আকর্ষণ
বল, ওজন W, সুতার টান T, সুতা, দড়ি, টান T₁ এবং T₂, অভিকর্ষ বল, মাধ্যাকর্ষণজনিত ত্বরণ, পেন্ডুলাম, দুলতে থাকবে, স্থির
অবস্থা, নিষ্ক্রিয়. The page writes "ওপর" for "on (a body)" and "উপরের দিকে" for upward; so does the figure. The ball
is always "বস্তু" / "বস্তুটি", as on the page (বল is force). Words the figure adds: হুক, টেবিল, টেবিলের ঠেলা (the table's
push, as contact-noncontact-force says "মেঝে ঠেলে ধরে রেখেছে"), হাতের টান, হাতে ধরে রাখা, দাগ, টানটান, হাত দূরে / হাত
কাছে, নিউটন (the unit), and for the tip-to-tail drawing "তীর পরপর জোড়া".

## How the figure works
- Two chips, the page's two pictures (with their numbers: চিত্র ৩.০২, চিত্র ৩.০৩). Everything is real size, in metres.
  Forces are given in নিউটন (English N), always with a no-break space before the unit.
- **চিত্র ৩.০২, a body on a string.** A 1 kg metal ball (8 cm) hangs on a 30 cm dark cord from the hook of a lab
  stand (the hook and the stand's arm are always in the picture), 15 cm above a bench. W = mg = 9.8 N (g = 9.8 ms⁻²,
  as falling-bodies). The ball is about 44 px across at 390×700 and 25 px at 390×520.
  - At rest: T (orange) up along the cord, W (violet) down, the same length, labelled "সুতার টান T = ৯.৮ নিউটন",
    "ওজন W = ৯.৮ নিউটন"; a callout "লব্ধি বল = ০"; the panel: **সাম্যাবস্থা**, "লব্ধি বল = ০, তাই ত্বরণ নেই" and the
    book's sentence. The first-use hand points at the ball: "পাশে টেনে ছেড়ে দাও".
  - Pulled aside by a finger (or ←/→, 5° a step; at most 30°, the book's "একটুখানি"): a hand pinches the ball and
    pulls it, at right angles to the cord, away from the lowest point, with mg sin θ (light orange arrow along the
    arm, a dashed label "হাতের টান = ৪.৯ নিউটন"); T = mg cos θ along the cord; the three forces cancel: **সাম্যাবস্থা**
    (like চিত্র ৩.০৩). The line says what letting go will do, in the book's words: "ছেড়ে দেওয়া মাত্র হাতের টান থাকবে
    না, তখন সুতার টান আর ওজন মিলে একটি লব্ধি বল কাজ করবে।" No "লব্ধি বল = …" label ever sits on a body at rest.
  - Let go (lift the finger, or Space/Enter): the hand's arrow is gone, and T and W's resultant (black) acts: the ball
    swings, in real time, the real swing of a 30 cm pendulum (period 1.10 s), worked out in 1/400 s steps (RK4) so it
    depends only on time. The arrows stay correct throughout: T = mg cos θ + mLω² (the radial equation), the
    resultant = T + W (along the path mg sin θ, towards the hook mLω²; at the bottom it points up, 2mg(1 − cos θ₀)).
    While it swings the labels shorten to T, W, লব্ধি and give way when there is no room; the panel says
    **অসাম্যাবস্থা**, "লব্ধি বল শূন্য নয়, তাই ত্বরণ আছে" and "দোলার সময় লব্ধি কখনো শূন্য হয় না". Air slows the swing
    (damping 0.1/s); below 0.3° it hangs still again (balanced). A finger on the swinging ball catches it.
  - Cut (tap the cord where to cut it, the button "সুতা কাটো", or C), only while the ball hangs still (held or
    swinging, the button rests and a tap or C says "আগে বস্তুটিকে স্থির ঝুলতে দাও, তারপর সুতা কাটো।"): the top
    piece stays on the hook, the cut piece goes with the ball. T is gone: only W, labelled "ওজন W: অসাম্য বল"; the
    view flies down 18 cm (same height) so W stays whole; the ball falls 15 cm (0.17 s) **five times slower**, leaving
    a dot every 0.04 s of real time (the gaps grow); the note says "সময় ৫ গুণ ধীর · দাগ প্রতি ০.০৪ সেকেন্ডে". On the
    bench the cut piece falls over beside it, and W and the bench's push ("টেবিলের ঠেলা = ৯.৮ নিউটন", orange, up) are
    drawn as a balanced pair: সাম্যাবস্থা again. "আবার ঝোলাও" (R) hangs it again and the view goes back up; a tap on
    the ball on the bench makes that button pulse.
- **চিত্র ৩.০৩, a book on a rope.** A 1 kg book (24 × 17 × 3 cm, maroon hardcover, turned a little so its pages
  show) hangs from the middle of a rope; each half (32 cm) goes up to a hand (fist, sleeve running off the picture).
  T₁, T₂ from the knot along the ropes, W from the book's lower edge, labelled with their sizes; "লব্ধি বল = ০". Drag a
  hand (or "হাত দূরে" / "হাত কাছে", ←/→): both hands move on a circle round the knot, so the rope's angle α above the
  horizontal goes from 20° to 70° and the book stays where it is; T = W / (2 sin α) (9.8 N at 30°, where all three
  forces are equal; 14.3 N at 20°, 5.2 N at 70°); the resultant is zero at every angle. After the first change the
  line says "দড়ি যত টানটান, T₁ ও T₂ তত বড়; তবু তিনটি বলের লব্ধি শূন্যই থাকে … তিনটি বল মিলেও সাম্যাবস্থা তৈরি হয়।"
- **Arrows**: lengths ∝ force, 1.4 cm per N, the same in both scenes (note: "তীরের দৈর্ঘ্য বলের মানের সমানুপাতিক");
  drawn over the picture from the body's surface outwards (like a diagram on a photo), so they never cover the ball
  and stay visible over the bench. Colours (batch decision): pulls #e8590c (also the bench's push), the hand's pull a
  lighter #ffa94d with a dashed label, weight #7048e8, resultant #212529; every arrow carries its words.
- **The panel**: the state word (সাম্যাবস্থা in green with a ring, অসাম্যাবস্থা in black with a dot), one line with
  the resultant and the acceleration, the book's sentence for that moment, and a small drawing of the forces **tip
  to tail** (caption "তীর পরপর জোড়া: শুরুতে ফিরলে লব্ধি ০"): each arrow starts where the one before ended; when the
  last one comes back to the ring where the first began the resultant is zero (the closed triangle of T₁, T₂, W, or
  of T, W and the hand's pull; T and W side by side, equal and opposite); otherwise the dashed black লব্ধি goes from
  the ring to the end. Drawn at its own pixel size (symbols 11.5 px everywhere), fitted to every arrow, its symbols
  placed where they touch nothing; redrawn only when a force changes by more than 0.05 N.
- **Test** (5 questions, 4 tap answers; a right answer gets the worked answer, a wrong one leads with the answer and
  says what the picked choice got wrong; the tension question always before the cut one, whose scene shows T = W, and
  the book's question before the pull):
  1. a ball of 0.6–0.9 kg hangs still, its W shown with its size, "সুতার টান T = ?" on the cord: how big is T? W / 0
     ("at rest, so no force") / 2W ("must pull harder") / 9.8 N (the weight of 1 kg, the picture not read); the
     answer draws T.
  2. a ball hangs still: cut the cord, which force is unbalanced? W down / T up / none / T and W, zero; the answer
     plays the slowed fall, then holds the picture just after the cut: only W, "ওজন W: অসাম্য বল".
  3. the ball just let go at 32–35° (to the right, clear of the buttons), only the cord and four 12 cm grey arrows
     ক–ঘ (their letters a fixed distance past each head): which way does the resultant of the pull and the weight
     point? along the path towards the middle / straight down (only W) / along the cord (only T) / level; the answer
     draws T, W and the resultant on the right letter (the others fade), swings once and comes back to that moment.
  4. a book of 0.6–1.2 kg at 25–45° with T₁, T₂ and W's sizes on the picture: what do the two pulls add up to? W
     upward / T₁ + T₂ as plain numbers / 0 (the three-force sum mixed up) / one pull; the answer draws the two pulls'
     resultant straight up from the knot, "দুই টানের লব্ধি = … নিউটন".
  5. the book at 45–55°: the hands move apart: a full 2 × 2 (the pulls grow or shrink × the resultant stays zero or
     points up / down); the answer pulls the rope to 22°.
- Keys: 1/2 the pictures, ←/→ pull aside or move the hands (a hint at the limits; on the bench "আবার ঝোলাও" pulses),
  Space/Enter let go, C cut, R hang again (or the rope back to 30°), F/V views. During the test the scene keys, chips
  and drags rest (the locked hint). A press that ends outside the 3D view (over the panel) is still ended.
- Bridge `set`: `scene`, `hold` (deg), `release` (deg, then `at` s of the swing; `freeze: true` holds that moment),
  `cut` (true or 0…1 down the cord, then `at` s of the slowed fall; `animate: false` lands it), `rehang`, `alpha`
  (deg), `view`. `get` returns the phase, the state word, the forces (N, the hand's and the bench's included) and the
  resultant. The poster is the moment just after letting go at 30°, held still.

## Decisions
- One mass for both scenes (1 kg, W = 9.8 N) so the arrows share one scale. The ball is drawn 8 cm across (a hollow
  metal bob) so that it is big enough on a small phone with the hook in the picture.
- Every change takes one force away or adds one: held = three forces, zero; let go = the hand's pull goes; cut = T
  goes; on the bench = the bench's push comes. The hand's pull is −(T + W): a hand pulling at right angles to the cord.
- The cord is cut only while the ball hangs still (cutting a swinging ball would make it fly off sideways, which the
  page does not discuss).
- Moving the hands on a circle round the knot keeps the book still (with the hands at a fixed height the book would
  rise as they part); the forces are the same for the same α.
- The swing is real time (the orchestrator's decision); the fall is slowed 5 times and says so.
- Newton is used as the unit of force (the batch's decision; the book has not defined it by page 69). F = ma is not
  taught here.

## Open questions
- The tip-to-tail drawing adds vector addition, which the book only implies ("বল একটি ভেক্টর", "সম্মিলিত লব্ধি").
- নিউটন for forces before the book defines the newton.
- The hand's pull is not in the book's picture (it draws the hand, not its force).
- The resultant while swinging points up at the bottom (centripetal), which the book does not discuss; the figure
  shows it because it is true and the panel only says "লব্ধি কখনো শূন্য হয় না".
- Every Bangla line needs a person's check against the book.
