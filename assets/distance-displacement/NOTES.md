# Notes: Distance and displacement (দূরত্ব ও সরণ)

Book: physics-9-10 › 2.4 › p39

## What the page shows
Section ২.৪ দূরত্ব ও সরণ (Distance and Displacement). চিত্র ২.০৪: a winding road (আঁকাবাঁকা রাস্তা) with the
distance along it from A marked in kilometres (0 … 7). You are at A and ride a bicycle 4 km along the road to B:
the distance between A and B is 4 km, and since distance is a scalar (স্কেলার রাশি) no direction is needed. The
displacement (সরণ) of B is the position of B with respect to A (A বিন্দুর অবস্থানের সাপেক্ষে B বিন্দুর অবস্থান),
drawn as a straight arrow from A to B (তির চিহ্নিত সরলরেখা); in the picture its magnitude (মান) is 2 km and the
arrow's way is its direction (দিক) … (the screenshot is cut off there; displacement is a vector, ভেক্টর রাশি). The
picture also marks C near km 6 with a short arrow A → C. Screenshot: `reference/page-39.png`.

## The one idea to teach
দূরত্ব is how far you went along the path (a scalar: just a number, and the way back counts too); সরণ is the
straight arrow from where you started to where you are (a vector: মান and দিক). Riding 4 km on the winding road
from A to B, the সরণ is only 2 km; back at A it is zero, however far you rode.

## Terms (as in the book)
দূরত্ব, সরণ, আঁকাবাঁকা রাস্তা, অতিক্রান্ত দূরত্ব, অবস্থান, সাপেক্ষে, স্কেলার রাশি, ভেক্টর রাশি, তির চিহ্নিত সরলরেখা,
মান, দিক, কিমি (the book writes km). Directions: উত্তর, উত্তর-পূর্ব, পূর্ব … (the compass on the map shows উ).

## How it works
- A 3D tile of Bangladeshi countryside (rice fields, ponds, homes with tin roofs, trees) with the book's road. The
  road is the shared one in `src/road.js` (also used by the speed figure on page 41): B is 4 km along it and 2.000
  km from A, C is 6 km along it and 1.311 km from A. The road and distances are to scale; houses, trees, posts and
  the cyclist are drawn much bigger than real so that they can be seen (the description says so).
- Kilometre posts 0–7 with plates that always face the viewer and keep their size; A, B, C on the posts 0, 4, 6.
- The student drags the cyclist along the road (the coach's hand shows it), taps a place on the road or a post to
  ride there, or uses the buttons B-তে যাও, C-তে যাও, A-তে ফেরো, নতুন যাত্রা. Arrow keys ride ±0.1 km
  (Shift ±1 km); b, c, a ride to B, C, A; n starts a new trip; f/v change the view.
- দূরত্ব (blue): the trail on the road, out on one side and back on the other (Bangladesh keeps left); a piece
  ridden a second time the same way gets a second stripe further out, so the trail keeps showing how much was
  ridden. সরণ (orange): a flat arrow from A to the cyclist. Their values sit beside them on the map (the distance
  beside the rider like a trip meter, the displacement beside its arrow), placed every frame where they cover
  nothing (src/values.js); a value with no free place is left out, the panel always has it. The panel's distance
  card splits the distance at each turn-round ("যাওয়া ৬ + ফেরা ৬"); the সরণ card gives the direction (one of
  eight compass points, with a small needle). The panel's line says what to notice at B, at C and back at A
  ("C পর্যন্ত ৬ কিমি গিয়ে ৬ কিমি ফিরে এসেছ: দূরত্ব ৬ + ৬ = ১২ কিমি, কিন্তু সরণ শূন্য…"). Sentences and map
  values drop trailing zeros (৪, ২, ১.৩১); the live cards keep two decimals.
- A 1 km scale bar lies on the tile by the compass, so the arrow's length can be checked by eye.
- The first-use hand's little show moves only the model: nothing is measured until the student rides.
- Test (৫ questions, tap answers, the scene rides first at the usual pace, and the route is named in words): how to state the displacement at B or C (size and
  direction vs. just a number, the road's 4 km); the direction of the displacement at km 4 or 5, against the way
  the cycle is riding there; the distance of an out-and-back ride (A → k1 → k2); the displacement after a round
  trip (zero); which is always true (displacement ≤ distance).
- The ride is not to time on purpose: speed and velocity are the next figure (page 41).

## Open questions
- The page is cut off after "এই ছবিতে সরণের মান 2 km এবং তিরের দিকটি হচ্ছে সরণের দিক": check the rest of the
  paragraph for any further term (e.g. how the book names the direction).
- Directions are given to the nearest of eight compass points (B is 40° east of north: উত্তর-পূর্ব; C is 14° west
  of north: উত্তর). Should C be "উত্তর" or something finer?
- The book writes km with Latin digits ("4 km"); the figure uses কিমি with Bangla digits, like the other figures.
