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
push, as contact-noncontact-force says "মেঝে ঠেলে ধরে রেখেছে"), হাতে ধরা, দাগ, টানটান, হাত দূরে / হাত কাছে
and, for the tip-to-tail drawing, "তীর পরপর জুড়ে দিলে".

## How the figure works
- Two chips, the page's two pictures (with their numbers: চিত্র ৩.০২, চিত্র ৩.০৩). Everything is real size, in metres.
- **চিত্র ৩.০২, a body on a string.** A 1 kg polished steel ball (6.2 cm) hangs on a dark cord, 45 cm from the hook of
  a lab stand, 20 cm above a pale bench. W = mg = 9.8 N (g = 9.8 ms⁻², as falling-bodies). On a phone the hook and
  the stand run off the edges: the ball, its arrows and the bench fill the view (the ball is 36 px at 390×700).
  - At rest: T (orange) up along the cord, W (violet) down, the same length, labelled "সুতার টান T = ৯.৮ N",
    "ওজন W = ৯.৮ N"; a callout "লব্ধি বল = ০"; the panel: **সাম্যাবস্থা**, "লব্ধি বল = ০, তাই ত্বরণ নেই" and the book's
    sentence. The first-use hand points at the ball: "পাশে টেনে ছেড়ে দাও".
  - Pulled aside by a finger (or ←/→, 5° a step; at most 35°, the book's "একটুখানি"): a hand holds the ball on its far
    side; T now slants along the cord, T = mg cos θ, and the resultant of T and W appears (black, half see-through
    while the hand holds it), mg sin θ, at right angles to the cord, along the path towards the lowest point. The
    state word is **হাতে ধরা** and the line says "T ও W-এর লব্ধি = ৪.৯ N; হাত ধরে রেখেছে" (the hand is a third force
    that balances it: the panel never calls a held ball unbalanced).
  - Let go (lift the finger, or Space/Enter): the resultant acts and the ball swings, in real time, the real swing
    of a 45 cm pendulum (period 1.35 s), worked out in 1/400 s steps (RK4) so it depends only on time. The arrows stay
    correct throughout: T = mg cos θ + mLω² (the radial equation), the resultant = T + W (along the path mg sin θ,
    towards the hook mLω²; at the bottom it points up, 2mg(1 − cos θ₀)). While it swings the labels shorten to T, W,
    লব্ধি and give way when there is no room; the panel says **অসাম্যাবস্থা** "লব্ধি বল শূন্য নয়, তাই ত্বরণ আছে" and
    "দোলার সময় লব্ধি কখনো শূন্য হয় না". Air slows the swing (damping 0.1/s: the swing halves in about 14 s); below 0.3°
    it hangs still again (balanced). A finger on the swinging ball catches it.
  - Cut (tap the cord where to cut it, the button "সুতা কাটো", or C): the top piece stays on the hook, the cut piece
    goes with the ball. T is gone: only W, labelled "ওজন W: অসাম্য বল"; the ball falls 20 cm (0.2 s) **five times
    slower**, leaving a dot every 0.04 s of real time, so the growing gaps show the acceleration; the note says "সময় ৫
    গুণ ধীর · দাগ প্রতি ০.০৪ সেকেন্ডে". It lands on the bench and the cut piece falls over beside it; the panel: the
    table holds it now (টেবিলের ঠেলা = W), balanced again. The 3D shows no arrows on the bench (W would go down into the
    bench); the tip-to-tail drawing shows W and the table's push. "আবার ঝোলাও" (R) hangs it again.
- **চিত্র ৩.০৩, a book on a rope.** A 1 kg book (24 × 17 × 3 cm, maroon hardcover, turned a little so its pages show) hangs from the middle of a rope; each
  half (40 cm) goes up to a hand (fist, sleeve running off the picture). T₁, T₂ from the knot along the ropes, W from
  the book's lower edge, labelled with their sizes; "লব্ধি বল = ০". Drag a hand (or "হাত দূরে" / "হাত কাছে", ←/→): both
  hands move on a circle round the knot, so the rope's angle α above the horizontal goes from 20° to 70° and the book
  stays where it is; T = W / (2 sin α) (9.8 N at 30°, where all three forces are equal; 14.3 N at 20°, 5.2 N at 70°);
  the resultant is zero at every angle. After the first change the line says "দড়ি যত টানটান, T₁ ও T₂ তত বড়; তবু
  তিনটি বলের লব্ধি শূন্যই থাকে … তিনটি বল মিলেও সাম্যাবস্থা তৈরি হয়।"
- **Arrows**: lengths ∝ force, 1.8 cm per N, the same in both scenes (note: "তীরের দৈর্ঘ্য বলের মানের সমানুপাতিক"); drawn
  over the picture from the body's surface outwards (like a diagram on a photo), so they never cover the ball and stay
  visible over the bench. Colours (batch decision): pulls #e8590c, weight #7048e8, resultant #212529; every arrow
  carries its symbol.
- **The panel**: the state word (সাম্যাবস্থা in green with a ring, অসাম্যাবস্থা in black with a dot, হাতে ধরা in grey),
  one line with the resultant and the acceleration, the book's sentence for that moment, and a small drawing of the
  forces **tip to tail**: each arrow starts where the one before ended; when the last one comes back to the ring where
  the first began the resultant is zero (the closed triangle of T₁, T₂, W; T and W side by side, equal and opposite);
  otherwise the dashed black লব্ধি goes from the ring to the end. It is drawn from the same state as the 3D.
- **Test** (5 questions, 4 tap answers, a worked answer leading with the answer and a note on the mistake picked; the
  tension question always before the cut one, whose scene shows T = W, and the book's sum before the pull):
  1. a ball of 0.5–1.2 kg hangs still, its W shown with its size, T asked ("সুতার টান T = ?"): mg up / mg down / 0
     ("it is at rest") / 2mg up; the answer draws T.
  2. a ball hangs still: cut the cord, which force is unbalanced? W down / T up / none / T and W, zero; the answer
     cuts it (the slowed fall).
  3. the ball let go at 24–30° (to the right, clear of the buttons), only the cord and four grey arrows ক–ঘ: which way
     does the resultant of the pull and the weight point? along the path towards the middle / straight down (only W)
     / along the cord (only T) / level; the answer draws T, W and the resultant, then lets it swing.
  4. the book at 20–50° with T₁, T₂ and W's sizes on the picture: the resultant? 0 / T₁ + T₂ + W / T₁ + T₂ − W / W.
  5. the book at 45–55°: the hands move apart: the pulls grow and the resultant stays zero / they shrink / they grow
     and the resultant points up / they stay the same; the answer pulls the rope to 22°.
- Keys: 1/2 the pictures, ←/→ pull aside or move the hands, Space/Enter let go, C cut, R hang again (or the rope back
  to 30°), F/V views. During the test the scene keys, chips and drags rest (the locked hint).
- Bridge `set`: `scene`, `hold` (deg), `release` (deg, then `at` s of the swing), `cut` (true or 0…1 down the cord,
  then `at` s of the slowed fall; `animate: false` lands it), `rehang`, `alpha` (deg), `view`. `get` returns the
  phase, the state word, the forces (N) and the resultant.

## Decisions
- One mass for both scenes (1 kg, W = 9.8 N) so the arrows share one scale.
- The held ball: the hand's own force is not drawn (the book does not draw it either); instead the state is called
  "হাতে ধরা", the resultant of T and W is drawn half see-through and the line says the hand holds it. With a hand
  pushing at right angles to the cord, T = mg cos θ while held is exact, and equals T at the moment it is let go.
- Moving the hands on a circle round the knot keeps the book still (with the hands at a fixed height the book would
  rise as they part); the forces are the same for the same α.
- Newton is used as the unit of force (the batch's decision; the book has not defined it by page 69). F = ma is not
  taught here.

## Open questions
- The tip-to-tail drawing adds vector addition, which the book only implies ("বল একটি ভেক্টর", "সম্মিলিত লব্ধি"). Keep it,
  or replace it with a plain readout?
- N for forces before the book defines the newton.
- The resultant while swinging points up at the bottom (centripetal), which the book does not discuss; the figure
  shows it because it is true and the panel only says "লব্ধি কখনো শূন্য হয় না".
- Every Bangla line needs a person's check against the book.
