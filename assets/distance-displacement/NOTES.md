# Notes: Distance and displacement (দূরত্ব ও সরণ)

Book: physics-9-10 › 2.4 › p39

## What the page shows
Section ২.৪ দূরত্ব ও সরণ (Distance and Displacement). চিত্র ২.০৪: a winding road (আঁকাবাঁকা রাস্তা) with the
distance along it from A marked in kilometres (0 … 7): "এই রাস্তাটিতে A বিন্দুর সাপেক্ষে রাস্তার অতিক্রান্ত দূরত্বগুলো
কিলোমিটারে 1, 2, 3 সংখ্যা দিয়ে দেখানো হয়েছে". You are at A and ride a bicycle 4 km along the road to B: the distance
between A and B is 4 km, and since distance is a scalar (দূরত্ব একটি স্কেলার রাশি) no direction is needed. The
displacement (সরণ) of B is the position of B with respect to A (A বিন্দুর অবস্থানের সাপেক্ষে B বিন্দুর অবস্থান), drawn as
a straight arrow from A to B (তির চিহ্নিত সরলরেখা); in the picture its magnitude (মান) is 2 km and the arrow's way is
its direction (তিরের দিকটি হচ্ছে সরণের দিক) … (the screenshot is cut off there; displacement is a vector, ভেক্টর রাশি).
The picture also marks C near km 6 with a short arrow A → C. Screenshot: `reference/page-39.png`.

## The one idea to teach
দূরত্ব is how far you went along the path (a scalar: just a number, and the way back counts too); সরণ is the
straight arrow from where you started to where you are (a vector: মান and দিক). Riding 4 km on the winding road
from A to B, the সরণ is only 2 km; back at A it is zero, however far you rode.

## Terms (as in the book)
দূরত্ব, সরণ, আঁকাবাঁকা রাস্তা/পথ, অতিক্রান্ত দূরত্ব, অবস্থান, সাপেক্ষে, স্কেলার রাশি, ভেক্টর রাশি, তির চিহ্নিত সরলরেখা,
তিরের দিক, মান, দিক, km (the book writes km). The page spells **তির** (not তীর). Directions: উত্তর, উত্তর-পূর্ব,
পূর্ব … (the compass on the map shows উ).

## How it works (v0.2.0, the clean panel)
- The cyclist is scaled up on small maps (1 to 1.8 times, worked out every frame so the bike is about 40 px long:
  about 36 px at 390×700, 31 px at 390×520), on top of being drawn 230 times bigger than real.
- A 3D tile of Bangladeshi countryside in spring (mustard, ripe paddy, ploughed earth, ponds, homes with tin roofs,
  flowering trees) under a pale blue sky, with the book's road. The
  road is the shared one in `src/road.js` (also used by the speed figure on page 41): B is 4 km along it and 2.000
  km from A, C is 6 km along it and 1.311 km from A. The road and distances are to scale; houses, trees, posts and
  the cyclist are drawn much bigger than real, and a quiet line under the key says so
  ("রাস্তা ও দূরত্ব মাপমতো; সাইকেল, বাড়ি, গাছ বড় করে আঁকা"; until v0.4.0 it was a note on the 3D view).
- On the map: kilometre posts 0–7 (the book's km scale along the road; their plates are quiet grey, the posts with
  A, B, C keep a dark number under the letter), a compass and a 1 km scale bar. দূরত্ব (blue): the trail on the road,
  out on one side and back on the other (Bangladesh keeps left), a second stripe for a second pass. সরণ (orange): a
  flat arrow from A to the cyclist. Their values sit beside them on the map ("দূরত্ব ৪ km" by the rider,
  "সরণ ২ km" beside the arrow, or on its middle like a line's label when there is no room beside it, "সরণ ০" beside
  A after a round trip, placed before the distance there), placed every frame where they cover nothing:
  not the road, the arrow, the cyclist, the plates, the action's ring (and the room round it where the badge goes)
  or the corner buttons (`src/values.js`; the room round the ring and the grey road ahead are given up before a value
  is left out); a value with no free place is left out, the panel always has it (at 390×520 at C the 52 px arrow
  between the C label, the ring round A and the blue path has no room for it). The
  badge in turn keeps off the values, the plates, the cyclist, the arrow and the blue path (the path only when there
  is room elsewhere: on a small map after a long ride it runs all round the next stop).
- **The panel is the kit's clean sheet** (kit 1.3.0), so it explains the whole picture:
  - **the key**: one row of two words with a little picture each, in the map's colours: "নীল পথ: দূরত্ব" (পথ ধরে
    মোট যতটা গেলে) and "কমলা তির: সরণ" (A থেকে সোজা, দিকসহ). On short frames only the first line of each.
  - **one action**, the book's story (`src/story.js`): "১ B পর্যন্ত চালাও" → "২ C পর্যন্ত চালাও" → "৩ A-তে ফিরে
    চলো", then "আবার B পর্যন্ত চালাও" (a new trip; no number, the story is done). The same numbered badge sits
    just outside a dashed ring round the next stop's label on the map; a tap on the badge, inside the ring, on the
    button, or Enter/Space all ride there.
    Arriving at the next stop any other way (a tap on the map, a drag, the arrow keys) counts too.
  - **one result line** comparing the two in their colours (the word and the number, never colour alone): before
    riding "তুমি A বিন্দুতে: এখনো দূরত্ব ০, সরণ ০"; while riding the live values (two decimals); at B "B-তে: পথ ধরে
    দূরত্ব ৪ km, কিন্তু A থেকে সোজা সরণ ২ km, উত্তর-পূর্ব দিকে"; at C "… দূরত্ব ৬ km … সরণ ১.৩১ km, উত্তর দিকে";
    back at A "A-তে ফিরে এলে সরণ ০, কিন্তু দূরত্ব ৬ + ৬ = ১২ km"; elsewhere "এখানে: …".
  - **one rule that grows**, one sentence each (it never shrinks during a trip): before the first stop, what the
    posts' numbers are and the book's সরণ ("A বিন্দুর সাপেক্ষে তোমার অবস্থান"); after a stop, "দূরত্ব একটি স্কেলার
    রাশি (শুধু মান), সরণ ভেক্টর রাশি (মান ও দিক): তিরের দিকটি হচ্ছে সরণের দিক"; after C, the distance only grows
    while the displacement can shrink; back at A, "সরণের মান কখনো দূরত্বের চেয়ে বেশি হয় না".
  - the quiet "নতুন করে শুরু" (an icon on phones) starts a new trip.
- The cyclist can still be dragged along the road (no first-use hand: the action's marker is the guide), or sent
  anywhere by a tap on the road or a post. Arrow keys ride ±0.1 km (Shift ±1 km); b, c, a ride to B, C, A; n starts
  a new trip; f/v change the view. Zoom and turning are off in the view from above (the book's picture).
- Test (৫ questions, tap answers, each scene ridden first at the usual pace, the map's values hidden until the
  answer, a note on each wrong choice naming the mistake): how to state the displacement at B (size and direction vs.
  just a number, the road's 4 km); the direction of the displacement at km 1 or 2, against the way the cycle is
  riding there; the distance of an out-and-back ride (A → post k1 → post k2, never back to half way, where adding the
  post numbers would be right by chance); the displacement after a round trip to a post (zero; the post is read off
  the trail); the displacement at km 5 or 6 read off the map with the 1 km scale bar (about 1.4 or 1.3 km, against
  the distance, the book's 2 km for B, and more than the distance).
- A nudge off A and back (under 50 m) reads "এখানে: … দূরত্ব …, কিন্তু সরণ ০", never "A-তে ফিরে এলে".
- The ride is not to time on purpose: speed and velocity are the next figure (page 41).

## What changed in v0.2.0 and why
The owner, looking at v0.1.0: "In the second image, in the part below, the understanding is not clear about the
whole image." The panel had two boxed cards (দূরত্ব স্কেলার রাশি … with a long sum like "৭.৫২ + ৫.৯ + … + ৪";
সরণ ভেক্টর রাশি … উত্তর-পূর্ব দিকে), a dense sentence and a row of four boxed buttons, and nothing in it said which
mark on the map was which. Now the panel is the clean sheet (no boxes): the key ties the blue path and the orange
arrow to their names; one numbered action tells the book's story, with its twin badge on the map; one result line
compares the two in the map's colours at each stop with the book's numbers; one rule in the book's words grows with
the story. The posts' numbers are quieter and the first rule says what they are (the km scale along the road). The
unit is now km, as the book and the speed figure (page 41, the same road) write it. The test was rewritten around
the picture with a note for each mistake.

## What changed in v0.3.0 and why
The owner: "instead of green do something different color but vivid and properly understandable". The map was almost
all light-green rice fields and green trees on a white page. Now it is a spring countryside under a soft blue sky:
mustard in flower (সরিষা), ripe paddy, ploughed earth and a little lilac khesari in the fields; flowering trees
(crimson, pink, purple) with some dark mango; swept earth round the homes; blue tin among the roofs. The ground the
orange arrow sweeps is pale harvested stubble, so the orange সরণ arrow and the blue দূরত্ব path stay the clearest
things on the map; no orange-red trees, which would read like the arrow. The corner note is darker, with a white
halo, to read on the sky.

## Polish pass (2026-11-01, v0.4.0)
The owner's standard for every figure (docs/agents/polish-pass.md), keeping the v0.3.0 spring countryside, the
blue path #1c6fd9 and the orange সরণ arrow #e8590c.
- **Layout.** 3D on top, the panel below (beside it only on short, wide frames, as the kit does). Tighter lines on
  phones held upright, so the 3D view has 386 of 700 px (55 %, was 354); the panel is as tall as the test needs and
  keeps that height in every state (checked by filling each line with every text it can show, Bangla and English,
  at all six sizes). English gets one more line where it runs longer.
- **Text on the 3D view.** Labels only (the posts' numbers, A B C, উ, ১ km, and the two values "দূরত্ব ৪ km",
  "সরণ ২ km"). The corner note ("drawn bigger than real") moved under the key, in the book's words.
- **Colour and arrows.** The সরণ arrow is now bold: orange inside a white rim and a thin dark edge, so it stands out
  on the pale stubble, the grey road and the blue path; on a small map it is drawn thicker (about 6 px or more, up
  to 2.4 times) with a shorter head, so it stays an arrow. Orange words in the panel and on the value chip use a
  darker shade of the same orange (#c2410c, 5.2:1 on white; the bright orange was 3.6:1); the chips are bold with a
  firmer border. The tile's soil edge shades from warm brown to dark, like layered earth.
- **Smooth, with the detail kept.** Same picture, far less work per frame:
  - each map label (post number, letter disc, উ, ১ km) is drawn once into a small canvas and shown on one quad:
    10 draw calls instead of 37;
  - the eight kilometre posts are one instanced mesh (a tap on one still rides to its km), the compass one mesh,
    the road and the square at A one mesh, the tile two draw groups (soil, fields; no bottom face);
  - the cyclist is merged by finish (matt paint in vertex colours, the glossy frame, steel): 11 meshes instead of 45,
    the wheels and pedals still turn and the legs still follow the pedals (instanced thighs, shins and feet);
  - the trail's four stripes are one mesh, the arrow and its tail dot one mesh;
  - PCF shadows in a box fitted round the tile and the casters (1024 instead of a loose 2048 VSM map, which also drew
    every receiver into the map); the invisible shadow floor is gone; the ground texture is 1024 × 1024;
  - with kit 1.4.0 the cyclist's own shadow is redrawn when it grows or shrinks for a small map, even when only the
    camera moved.
- **Numbers** (headless Chromium, software GL, shadows on, 390 × 700 and 844 × 390):

  | | before (0.3.0) | after (0.4.0) |
  |---|---|---|
  | draw calls, avg / max | 221 / 243 | 73 / 95 |
  | triangles, max | 63k | 61k |
  | texture memory | 60.2 MB (largest 2048) | 18.4 MB (largest 1024) |
  | time to ready (this machine, same run) | 2.16 s | 1.99 s |
  | text on the 3D view | 26 characters in 1 box (46 at 844 × 390) | 0 |
- **Bugs looked for.** No console errors through a double tap on the action, turning the phone mid-ride, the arrow
  keys, switching to the test mid-ride and back, the 3D view and a tap on the map there, dragging the cyclist, a new
  trip, reset, and a whole test.

## Open questions
- The page is cut off after "এই ছবিতে সরণের মান 2 km এবং তিরের দিকটি হচ্ছে সরণের দিক": check the rest of the
  paragraph for any further term (e.g. how the book names the direction), and whether it says "সরণের মান কখনো
  দূরত্বের চেয়ে বেশি হয় না" (the figure's last rule; true, but not on the visible part of the page).
- Directions are given to the nearest of eight compass points (B is 40° east of north: উত্তর-পূর্ব; C is 14° west
  of north: উত্তর). Should C be "উত্তর" or something finer?
- The book writes km with Latin digits ("4 km"); the figure writes Bangla digits with km ("৪ km"), like the other
  figures.

## Declutter pass (2026-11, 0.5.0)
- Only the road, the posts, the cyclist and the two marks: the rice-field patchwork, the village homes, the trees and
  the ponds are gone; the tile is one calm sand colour with a little grain, under a softer, muted sky.
- Panel in the labs' one order: the action, then the key (what blue and orange mean), the result, the rule. The old
  wide-frame rules (for the panel under the 3D) are gone.
