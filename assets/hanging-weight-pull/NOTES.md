# Notes: Hanging weight pulls a block (ঝুলন্ত ভর ও টেবিলের বস্তু)

Book: physics-9-10 › 3.7 › p81–83. Page images: `reference/page-81.png`, `reference/page-82-83.png`; the owner's
reference picture: `reference/owner-tension-examples.png` (all dev only).

## What the page shows
Page 81 (topic 3.7, second law at work): "একটি ভর ব্যবহার করে আমরা অন্য একটি বস্তুর উপর বল প্রয়োগ করতে পারি।" Picture
চিত্র ৩.০৯ ("একটি বস্তুর ওজন অন্য বস্তুর উপরে বল প্রয়োগ করছে।"): a block **m** on a table, a string from its right side
over a pulley at the table's right edge, an iron weight **M** hanging from the string; pink arrows **T** (to the right,
along the string, above the block) and **T** (up, on the string above the weight) and **Mg** (down, below the weight).
The text then says, in the book's words:

- Sign convention: "সমীকরণের বাম দিকে থাকবে বল সমূহের ভেক্টর যোগফল, আর ডান দিকে থাকবে ভর গুণ ত্বরণ। … প্রচলিত রীতি
  অনুযায়ী ডান দিকের রাশি ধনাত্মক। আর বাম দিকের রাশি ঋণাত্মক এবং উপরের দিকের রাশি ধনাত্মক আর নিচের দিকের রাশি ঋণাত্মক।"
  (The page's "বাম দিকে / ডান দিকে" there means the left- and right-hand side of an equation first, then the
  directions; the figure uses it for the directions: right and up are positive.)
- The block: "ভরের উপর ডানদিকে কাজ করছে সুতার টান বল T, মনে রাখতে হবে যে **একটি সুতায় একটি মাত্র টান বল কাজ করে**, এবং
  **টান বল সব সময় সুতা বরাবর এবং বস্তু থেকে দূরের দিকে কাজ করে**। এখানে T এর দিক হচ্ছে ডান দিক, এবং m বস্তুর ত্বরণও ডান
  দিকে, সুতরাং **T = ma**". Vertically on m: "মাধ্যাকর্ষণ বল mg এবং উপরের দিকে তলের প্রতিক্রিয়া বল N কাজ করছে (যা সম্পর্কে
  তোমরা এই অধ্যায়ের পরবর্তি অংশে জানবে) এই দুটো বলের লব্ধি শূন্য বলে উল্লম্ব বরাবর m বস্তুর কোনো ত্বরণ নেই।"
- The hanging mass: "দ্বিতীয় বস্তুর উপর, দুটো বল কাজ করছে, মাধ্যাকর্ষণ বল Mg নিচের দিকে, এবং টান বল T (একই সুতা বলে একই
  টান বল T) উপরের দিকে … **T − Mg = M(−a)**. এখানে ত্বরণের আগে ঋণাত্মক চিহ্ন দেওয়া হয়েছে কারণ M ভরের ত্বরণ নিচের দিকে এবং
  বস্তু দুটো সুতা দিয়ে আটকানো বলে M বস্তুর ত্বরণের মানও a। উপরের সমীকরণ দুটো সমাধান করে আমরা পাই, **a = Mg/(M + m)**."

Pages 82–83, চিত্র ৩.১০ ("কপিকল দিয়ে একটি ভরকে দুই পাশ থেকে দুটি ওজনের মাধ্যমে বল প্রয়োগ করা হচ্ছে"): a body **m** on a
bench with a pulley at each end and a weight hanging at each end: **m₂ = 10 kg** on the left, **m₁ = 5 kg** on the right.
"তিনটি বস্তু দুটো সুতা দিয়ে আটকানো আছে, যার ফলে সবার ত্বরণের মান একই হবে।" m₂ goes down, m to the left, m₁ up; two strings,
two tensions T₁ (m₁ and m) and T₂ (m₂ and m). The book's working: **T₁ − m₁g = m₁a**, i.e. T₁ − 5g = 5a; **T₁ − T₂ = m(−a)**;
vertically on m, N and mg cancel; **T₂ − m₂g = m₂(−a)**, i.e. T₂ − 10g = 10(−a); so **T₁ − T₂ = 15a − 5g** and
**a = 5g/(m + 15)**: "এখানে m বস্তুর ভর ব্যতীত ত্বরণের মান বের করা সম্ভব নয়।"

## The owner's request (2026-10-31)
"for this one you see second and third picture is actual content but instead of the current one we want something like a
person pulling water from well. but very realistic with proper formula interactive and everything very very properly with
proper concept reflecting the actual book content of second and third image." Then: "has to be very colorful but not green or
white too much and very realistic". Reference picture: a "Tension examples" slide (a man pulling a rope over a pulley at a
well, T₁, T₂, W; a man lifting a crate over a pulley; "the pulleys shown are magic … serve only to bend the line of action of
the force"). Asked how the well should carry the book's two set-ups, the owner chose: the well with a person pulling a
bucket as the main scene, and the book's own pictures (চিত্র ৩.০৯, ৩.১০) as a worked-example window.

### Second look (2026-10-31, v0.3.0)
The owner: "the arrow mark is not very visible … main scenery is too much but the actual thing, force arrow and
everything, is very little visible", and "ঢিল দাও is not the correct word … show the concept beautifully with much more
detail". So: the arrows are about twice as thick and a third longer, flat colour in a white outline, drawn on top of
everything (the orange T no longer melts into the orange wall); the yard behind the well is hazed; a new black arrow
shows the resultant (লব্ধি বল) T − Mg next to a, so the student sees the difference of the two forces drive the
acceleration; ঢিল দাও became **কম টানো** (pull less than the weight; short enough for the row of four words).

## The one idea to teach
Newton's second law for each body joined by a string: the sum of the forces on it (up and right positive) equals its mass
times its acceleration. One string carries one tension, along the string and away from the body; a pulley only turns it.
At the well: the man's pull is the rope's pull T on the bucket, so T − Mg = Ma. T = Mg: no acceleration (held still);
T > Mg: it speeds up going up; T < Mg: a is negative, it speeds up going down (the book's M(−a)); more water with the same
pull: less acceleration. In the book's pictures the same law, body by body, gives a = Mg/(M + m) and a = 5g/(m + 15).

## How the figure works
- **The scene (realistic, colourful, little green or white):** a village courtyard of packed ochre earth, a house with a
  terracotta mud wall, blue doors and window shutters with yellow frames, a corrugated tin roof on bamboo posts, a golden
  haystack, a bamboo fence, one banana plant, clay pitchers by the well, a deep blue sky. The well is a round brick well
  with a low parapet and a cement cap on a cement apron, **cut in half** at the front so its shaft, the water and the
  bucket can be seen (said on the stage); the cut shows the brick courses and the layers of soil (topsoil, red laterite,
  sand, grey clay by the water). Over it a wooden frame (two sal posts, a beam, braces) holds a red iron pulley on a fork.
  A man in a royal-blue shirt, grey trousers rolled to the calf, and blue sandals stands in a
  stride, leans back and pulls the jute rope hand over hand (one fist moves with the rope for a stroke while the other
  goes back for a new hold); the rest of the rope lies coiled behind him. The rope's strands slide as it runs and the
  pulley turns with it. The bucket is a big yellow plastic bucket with a steel handle; its water level follows M (the empty
  bucket is 1 kg, a litre of water 1 kg). Everything is procedural (canvas textures), so it works offline.
- **Numbers:** g = 9.8 ms⁻²; the pull T from 0 to 200 N (steps of 2 N), the bucket with its water M from 3 to 15 kg. The
  well is shallow enough to keep the bucket big on a phone (water 1 m below the yard). The bucket starts half way down,
  held; a run goes up to the parapet or down to the water, or stays for 2.4 s when T = Mg. Time is slowed 3 times.
- **The panel** (the kit's clean sheet): the row of words **ধরে রাখো** (T 98 N, M 10 kg: a = 0), **জোরে টানো** (130 N, 10 kg:
  +3.2), **কম টানো** (70 N, 10 kg: −2.8), **বেশি পানি** (130 N, 12 kg: +1.03), each leaving its a under its word; one numbered
  action (ধরে রাখো / টানো / কম টানো, then the next word); quiet buttons for the book's examples and the reset; then **the
  formula**: two steppers (T দড়ির টান, M বালতি ও পানি), the law **T − Mg = Ma** with each symbol a button (a tap makes its
  arrow pulse), and the sum with the student's numbers, live: "১৩০ − ১০ × ৯.৮ = ১০ × a ⇒ a = +৩.২ ms⁻²". The steppers put the
  bucket back at the start (held) and a run of them is not kept in the row. One rule line, in the book's words, chosen by
  what is happening: "একটি সুতায় একটি মাত্র টান বল…", "টান বল সব সময় সুতা বরাবর, বস্তু থেকে দূরের দিকে…", "T = Mg হলে লব্ধি বল
  শূন্য…", "উপরের দিক ধনাত্মক: T < Mg হলে a ঋণাত্মক… বই লেখে T − Mg = M(−a)", "একই টানে ভর বেশি হলে ত্বরণ কম…", and once
  all four are tried, the law with "বাম দিকে বলগুলোর যোগফল, ডান দিকে ভর × ত্বরণ".
- **The picture while it runs:** T up from the bucket's handle and T at his fists towards the pulley (orange, the same
  number), Mg down from the bucket's middle (purple), the resultant **লব্ধি বল = T − Mg** on its left (black, "লব্ধি বল =
  +৩২ N", or "০" beside the bucket when held) and a on its right (teal, the same way as the resultant: F = Ma); the
  bucket's mass under it. The arrows are thick, in flat colour with a white outline, and drawn over the scenery; the
  yard behind the well (house, haystack, banana) sits in a light haze so the well, the bucket and the arrows stand out. Force arrows share
  one scale, the acceleration has its own (said under the rule on wide frames). A chip at the bottom right gives the
  bucket's velocity and the time (v grows by a each second, "৩ গুণ ধীরে"). The sign rule "↑ উপরের দিক ধনাত্মক" sits at the end
  of the law in the panel; "the well is cut in half, light rope, smooth pulley" is a quiet line under the rule (not on
  phones). No arrows while the bucket is simply held at the start (before a run nothing is claimed about the forces).
- **উদাহরণ (বইয়ের উদাহরণ):** a window with two tabs. চিত্র ৩.০৯: a body m on a smooth table pulled by a hanging mass M over
  a pulley (the previous version's bench and iron weight, on a warm background), steppers for M and m (the page has only
  letters; 2 kg and 5 kg to start), and five lines one at a time: T = ma; N − mg = 0; T − Mg = M(−a); a = Mg/(M + m) with the
  numbers; T = ma, less than Mg (the bench on a slate-blue classroom wall, so the orange T arrows stand out). চিত্র ৩.১০: the book's 10 kg and 5 kg, a stepper for m (5 kg to start), and five lines:
  T₁ − 5g = 5a; T₁ − T₂ = m(−a); T₂ − 10g = 10(−a); T₁ − T₂ = 15a − 5g; a = 5g/(m + 15) with the numbers. A tap on the bench
  (or ছেড়ে দাও) runs it, slowed 4 times, with arrows and labels.
- **Test (5 questions, each with its own scene):** a from T and M (the bucket goes up); T when held still (Mg); which way
  when T < Mg (down, a negative); one rope, one tension (the pull at his fists is the pull on the bucket); the same pull
  with more water. Every wrong choice is a real mistake (gravity forgotten, Mg added, divided by the weight; kg as N, zero,
  double; up, none, "up slowly"; the weight, the resultant, half; unchanged, scaled by the masses only) with its own note.
- **For the book's code:** `set({ id, T, M, release, at, home, view, tried, example })`; `example` is true/false or
  `{ kind: 'single' | 'two', M, m, part, playing }`; `get()` gives T, M, W, net, a, phase, time, height, speed, end and the
  example's state.

## Terms (as in the book)
নিউটনের দ্বিতীয় গতিসূত্র; টান বল T; মাধ্যাকর্ষণ বল Mg; ভর M, m; ত্বরণ a; কপিকল; সুতা; তলের প্রতিক্রিয়া বল N; লব্ধি; ধনাত্মক,
ঋণাত্মক; উপরের / নিচের দিক (the page spells উপরের). The well's own words: কূপ, দড়ি (for the book's সুতা), বালতি, পানি, দড়ির
টান. Units: kg, নিউটন (N on the picture), ms⁻² (book-notes), m/s for the velocity, g = ৯.৮.

## Open questions for the book team
- The well is cut in half to show the bucket inside; is a cutaway acceptable in the book's style (the owner's reference is
  a cutaway "physical picture")?
- The well's case (a man's pull as the tension, T − Mg = Ma) is not on the page; the page's own two set-ups are in the
  উদাহরণ window. Is that the right balance?
- চিত্র ৩.০৯ has no numbers on the page; the window starts at M = 2 kg, m = 5 kg. চিত্র ৩.১০ leaves m as a letter; the window
  starts at 5 kg.
- Friction: the page assumes none without saying so; the figure says "দড়ি হালকা, কপিকল মসৃণ" and "মসৃণ টেবিল".

## Polish pass (2026-11-01, v0.4.0)
- **Layout.** The 3D on top and the panel below at every size except a phone held sideways (the kit's rule; nothing in
  this figure's CSS moves the panel). On phones each stepper's name sits beside it and the law and the sum share one
  box, so the 3D gets more of the screen: 390×700 from 48 % to 52 % of the height (390×520 from 40 % to 41 %).
- **Text on the 3D.** The notes in the top left (the cut well, the light rope and smooth pulley, the slowed time, the
  sign rule, the arrows' scale) left the picture: the sign rule is at the end of the law ("↑ উপরের দিক ধনাত্মক", "↑ ধনাত্মক" in
  a narrow side panel), the rest a quiet line under the rule on wide frames. On the picture only the labels with their
  values and one chip with v and t (and "৩ গুণ ধীরে"). The after-run sentence on the chip went (the result is under
  its word in the row).
- **Colour and arrows.** The well keeps its v0.3.0 arrows and colours. The book-example window had thin, unoutlined
  arrows with the orange T on a warm orange wall: now a slate-blue classroom wall and the same bold, white-outlined
  arrows as the well (`src/arrows.js`), labels on solid white chips. Fixed on the way: the outline was sometimes drawn
  over its arrow's colour (both had the same draw order).
- **Smooth, same detail.** Static parts merged into one mesh per material (`src/merge.js`: the well, the frame, the
  yard, the bucket, the man's head, trunk, fists and feet; the yard's plain colours in one vertex-coloured mesh): 196
  meshes to 64. Tiny parts (eyes, buttons, the bail, the elbows, the doorway planes…) cast no shadow; PCF shadows at
  1024 instead of VSM at 2048 (VSM also drew every shadow receiver into the shadow map), the same picture. The rope is
  rewritten in place (a fixed tube, resampled) instead of a new TubeGeometry every frame; no allocations per frame in
  the run (the fists, the arrows, the label boxes); the ripples are hidden when still; the example window's labels are
  rebuilt only when their words change.
- **Bugs fixed.** In the book-example window on short frames (390×520, 640×400) the worked lines ran under the buttons
  and over the title: now the words under a sum show only for the newest line there, and the text column never centres
  past its top; its labels stay inside the picture (T₂ was cut off at 640×400); its steppers no longer squash to a
  sliver beside the bench. A quick second tap on a symbol of the law no longer cut the first highlight short. On wide
  frames (800×500) the row of words keeps its own height instead of stretching to the formula's.
- **Numbers** (headless Chromium, software GL, shadows on, 390×700): draw calls avg 402 / max 424 → 125 / 147;
  triangles max 129k → 108k; texture memory 58 MB (largest 2048) → 18 MB (largest 1024); text on the 3D 41 characters
  in 4 boxes → 9 in 1 (844×390: 102/5 → 9/1); idle frames 0/s before and after. Time to ready is within the noise of
  a loaded machine (1.5–5 s before and after).


## Declutter (2026-11-01, v0.5.0)
Only the well, its frame and pulley, the rope, the bucket and the man pulling: the house, the palm, the fence, the
haystack and the clay pitchers are gone, and the sky is a calmer blue. The panel sits beside the 3D (kit 1.5.0): the
old wide-frame grid and sideways-phone rules are gone. No front/turn buttons: a drag turns the view (not during the
test), a front icon brings it back.
