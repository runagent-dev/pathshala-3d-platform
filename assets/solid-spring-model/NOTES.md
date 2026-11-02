# Notes: Solid as Atoms and Springs (কঠিন পদার্থের আণবিক মডেল)

Book: physics-9-10 › 6.3.1 কঠিন পদার্থের প্রসারণ › p167 (the model starts on p166, the picture is on p167)

## What the page shows
চিত্র ৬.০৩: "অণুগুলো একটি অন্যটির সাথে স্প্রিং দিয়ে যুক্ত কল্পনা করে নেওয়া যায়।" A cube: eight blue balls (the
atoms) at the corners, the twelve edges are grey coil springs. The text round it: a solid is many atoms; the force
between them is compared with a spring; heated, the atoms shake, the more the hotter; the spring is special (a little
force stretches it, much force squeezes it the same distance), so while shaking the atoms go closer a little but
move apart more; all atoms move apart and the whole solid is a little expanded.

## The one idea to teach
Heating makes the atoms shake more widely, and because they go further out than in, their average distance grows:
that is why a solid expands.

## How the figure follows the page
- The same picture: the cube seen from a corner, blue atoms, grey coil springs. A burner under it (the next picture,
  চিত্র ৬.০৪, draws the same flame) shows the heat; a thin amber frame marks the old (cold) size.
- The book's order, as one guided sequence with the one big button and the three words ঠান্ডা / উত্তপ্ত / আরও উত্তপ্ত:
  1. springs joining the atoms (the book's model), 2. "উত্তপ্ত করলে অণুগুলো কাঁপতে থাকে… তাপমাত্রা যত বেশি হবে,
  অণুগুলো তত বেশি বিস্তারে কাঁপবে", 3. "স্প্রিংটি বিশেষ ধরনের … কাছাকাছি যায় কম কিন্তু দূরে সরে যায় বেশি".
- The special spring is in the maths (`src/reading.js`): the shake goes 1.35 : 0.65 outwards : inwards, so the
  average place of each atom moves out by itself; nothing is scaled by hand. The expansion is drawn far too big
  (the panel says so).
- Test: four questions in the book's words (what the atoms do; the special spring; which way they go more; how the
  whole solid looks).

## Terms (as in the book)
কঠিন পদার্থ, অণু, আণবিক মডেল, আণবিক বল, স্প্রিং, উত্তপ্ত করা, তাপমাত্রা, কাঁপা, বিস্তার, সাম্য অবস্থা (not used on
screen), প্রসারিত, সংকুচিত, বিশেষ ধরনের স্প্রিং.

## Open questions
- The book says "অণু" for what is drawn as balls (atoms of a metal, say). Kept the book's word.
- Springs are drawn along the edges only (as in the book), no diagonals.
- Bangla wording needs a person's check against the book.

## Performance
Draw calls: 8 atoms + 12 springs + burner (4) + bench, wall ≈ 28; triangles ≈ 30 k. One shared geometry per kind, no
allocation per frame, the ticker returns false while the lattice is cold and still.
