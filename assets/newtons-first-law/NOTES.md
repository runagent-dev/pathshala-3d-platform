# Notes: Newton's first law of motion (নিউটনের প্রথম গতি সূত্র)

Book: physics-9-10 › 3.1 › p64 (first of two figures on the page, `order: 1`; 3.1.1 জড়তা is the other)

## What the page shows
Section ৩.১ **জড়তা এবং বলের ধারণা: নিউটনের প্রথম গতি সূত্র**, with no picture. The boxed law:
"নিউটনের প্রথম সূত্র: বল প্রয়োগ না করলে স্থির বস্তু স্থির থাকবে এবং সমবেগে চলতে থাকা বস্তু সমবেগে চলতে থাকবে।
(বুঝতেই পারছ বেগ যেহেতু ভেক্টর তাই সমবেগে চলতে হলে দিক পরিবর্তন করতে পারবে না, সরলরেখায় সমদ্রুতিতে যেতে হবে।)"
Then the paragraph: the first half is easy (a thing at rest does not move until pushed); the second half is hard
because moving things always seem to stop by themselves; everyday life suggests a force is needed to keep
something moving, but that is wrong: if a moving body stops, some force acted on it. "ঘর্ষণ, বাতাসের বাধা, এ ধরনের
বল বেগের বিপরীত দিকে কাজ করে বলে চলমান একটি বস্তু থেমে যায়। যদি এ ধরনের কোনো বল না থাকত, তাহলে সমবেগে চলতে
থাকা একটি বস্তু অনন্তকাল ধরে সমবেগেই চলত।" Screenshot: `reference/page-64.png`.

## The one idea to teach
Without a force, a body at rest stays at rest and a moving body keeps moving in a straight line at the same speed
for ever; the things we push stop only because forces like friction and air resistance act against their motion.

## Terms (as in the book)
নিউটনের প্রথম সূত্র, বল প্রয়োগ, স্থির বস্তু, সমবেগ, সরলরেখা, সমদ্রুতি, ঘর্ষণ, বাতাসের বাধা, বেগের বিপরীত দিকে,
অনন্তকাল, বেগ, অতিক্রান্ত দূরত্ব (shortened to দূরত্ব in the readout). Our own words: মাদুর, কাঠের মেঝে, বরফ,
"ঘর্ষণ নেই" (the imagined floor), ধাক্কা (the push), দেয়াল (the test's curved wall), পথ ক–ঘ, দাগ (the dots).

## Changes in 0.2.0: the clean panel and a real book (the owner's feedback, 2026-10-25)
The owner found the part under the picture of most figures too boxy and a bit overwhelming, and asked: keep the
content, but make it cleaner, and wherever the student should touch something (in the picture or in the panel) give
a distinctive button that can be seen. For this figure: explain a bit more, and make the book a proper, recognisable
book (it read as a green slab). The owner approved the sketch "one action, one result, one rule" (kit 1.3.0:
`cleanSheet`, `createAction`), and this figure is the first one built on it:
- **The floors are one row of words** (মাদুর · কাঠ · বরফ · ঘর্ষণ নেই), the chosen one underlined; once a floor is
  tried its stop distance sits under its word ("১.৩১ মি"; ঘর্ষণ নেই: "থামে না", honestly: it never stops). No boxes,
  no "?" for floors not tried.
- **One big action**: an accent pill "১ বইটিকে ধাক্কা দাও ☝". The same numbered badge sits just outside a dashed ring
  round the book on the 3D view (the ring is drawn under the labels, the badge above them) and pulses for about three
  beats each time it appears; a tap on the button, on the badge or on the book (or the launcher, Space, Enter, →) is
  the same push. The ring hides while the book moves and during the test; it replaces the first-use hand. Once a
  floor has been tried (the book stopped, or with no friction ran past every stop), the action offers the next floor
  not tried yet, in the row's order, and that word is marked in the row (a dotted underline): "২ কাঠের মেঝেতে চালাও",
  "বরফে চালাও", "ঘর্ষণহীন তলে চালাও" (one tap chooses that floor and pushes; "চালাও", not "… ধাক্কা দাও", which could
  read as "push the floor"). The badge's number is the student's own step: the floors tried so far + 1 (choosing বরফ
  first is still step ১). While the book moves, and once every floor is tried, it is "আবার ধাক্কা দাও" with no number.
  To repeat a floor: শুরুতে ফেরাও, then push. The `coach` parameter now only says whether the ring pulses.
- **One result line**, the number large and in its colour: at rest "বইটি স্থির: বেগ ০ মি/সে"; moving "বেগ ২.৪১ মি/সে,
  দূরত্ব ০.৬২ মি" (blue, like the velocity arrow); stopped "মাদুরে বইটি ১.৩১ মি গিয়ে থামল" (in the floor's stop-line
  colour); with no friction, past the ice "থামছে না: বেগ ৩.০০ মি/সে, দূরত্ব …". The old boxed বেগ / দূরত্ব readouts
  are gone (their numbers are in this line).
- **One rule that grows** with what the student has found: before any push "বল প্রয়োগ না করলে স্থির বস্তু স্থির
  থাকে: বইটি নিজে থেকে নড়ে না। প্রতিবার একই ধাক্কা: বইটি ৩ মি/সে বেগে ছাড়া পায়।" (every comparison depends on the
  same push); during the 0.2 s push "ধাক্কার বল বইটির বেগ বাড়াচ্ছে।" (never "the velocity does not change" while the
  paddle still pushes); sliding "ঘর্ষণ বেগের বিপরীত দিকে কাজ করে, তাই বেগ কমছে।"; after the first floor
  "মাদুরের ঘর্ষণ বইটিকে তাড়াতাড়ি থামাল।" (wood and ice have their own); after a second floor a comparison with the
  floor tried before ("কাঠের মেঝেতে ঘর্ষণ মাদুরের চেয়ে কম, তাই বইটি আরও দূরে গেল। ঘর্ষণ যত কম, বই তত দূরে যায়।
  ঘর্ষণ একেবারে না থাকলে কী হবে?"); with no friction "সামনে-পেছনে কোনো বল নেই, তাই বেগ বদলাচ্ছে না: বইটি সরলরেখায়
  একই দ্রুতিতে, অর্থাৎ সমবেগে চলছে; দাগগুলোও সমান দূরে দূরে।" (the book's parenthesis on সমবেগ), and once it
  has run past every floor's stop, the book's law word for word: "নিউটনের প্রথম সূত্র: বল প্রয়োগ না করলে স্থির বস্তু
  স্থির থাকবে এবং সমবেগে চলতে থাকা বস্তু সমবেগে চলতে থাকবে।" From then on a stop on a floor quotes the book's
  paragraph: "ঘর্ষণ, বাতাসের বাধা, এ ধরনের বল বেগের বিপরীত দিকে কাজ করে বলে চলমান একটি বস্তু থেমে যায়।"
- **শুরুতে ফেরাও** is a quiet icon (with its words where the panel is wide), never a second big button. The action
  row keeps the height of a two-line pill, so a longer verb never moves the lines under it (a long verb wraps inside
  the pill on narrow side panels). The row of words is one Tab stop; the arrow keys move and choose there and never
  push the book.
- **Labels**: no label sits on the ring or under the badge; the stop label of the floor just tried is placed first
  and never hidden (it used to vanish in the view down the lane at 390×520).
- **The poster** is the side view with no friction: the book large, evenly spaced dots, the বেগ arrow, all four
  results in the row and the law in the rule (it was a thin lane with a speck of a book).
- **The curved-wall question** shows the whole wall and its run-in below the note (the book's path radius is 0.38 m,
  so the wall stands where it did before the book got wider), and the answer slides the book 0.6 m straight on, so it
  is still in the final picture.
- **The book** is now a hardcover class 9–10 physics textbook: a printed cover (canvas texture in Noto Sans
  Bengali: "পদার্থবিজ্ঞান" across about 90 % of the cover and "নবম-দশম শ্রেণি" across about 65 %, so they read on a
  phone, an atom in a smaller white disc, a red line and a green band at the foot, on blue; 512 px wide), boards standing 3 mm proud of a cream page block with page lines on its three open edges, rounded outer
  corners, a rounded spine with the title. It slides short side first (19 × 26 × 2.5 cm), spine against the paddle,
  so the cover reads upright in the side view. The physics is unchanged (distances are measured at its front edge).

## How it works
- **Galileo's and Newton's thought experiment, run by the student.** A class 9–10 physics textbook waits on a
  launcher: a smooth steel plate with rails, a wooden paddle pushed by a coil spring.
  The spring is always squeezed to the same red notch and held by two red latch pins: "the same push" is visible.
  A tap on the book or the launcher (or the big button, Space, →) drops the pins: the paddle pushes the book for 0.2 s
  (0.3 m) and stops at the plate's end, so the book always leaves at the same 3 m/s, its whole length already on
  the floor (front edge at the tape's 0); from then on only the floor acts on it. The orange ধাক্কা arrow (the
  longest force arrow, 0.34 m: the push, 15 m/s², is the biggest force; not to the friction arrows' scale) shows
  only while the paddle touches the book.
- **The side view** shows about 0.8 m of floor at the book's line on a phone (up to 1.2 m on wide frames), looking
  down as steeply as the frame allows, so the book is about a quarter of the width (measured in the 0.2.0 report). At rest the paddle is just inside the left edge (the plate behind it runs off). The book crosses to two
  thirds of the width before the camera follows it, which leaves room for both arrows.
- **Four floors** (the row of words, keys 1–4): মাদুর (jute mat, μ ≈ 0.35), কাঠ (varnished wood, μ ≈ 0.18), বরফ (ice,
  μ ≈ 0.05), ঘর্ষণ নেই (an imagined floor drawn like graph paper, with a note on the stage "কাল্পনিক তল: ঘর্ষণ ও
  বাতাসের বাধা নেই"). With friction the book slows evenly (a = μg) and stops after
  v²/(2μg): **1.31 m, 2.55 m, 9.18 m**, in 0.87 s, 1.70 s, 6.12 s. A dashed line in the floor's colour marks each
  stop, labelled "মাদুর ১.৩১ মি", "কাঠ ২.৫৫ মি", "বরফ ৯.১৮ মি".
- **The view down the lane** (the comparison seen at once): 0.9 s after a stop the camera pulls back behind the
  launcher and looks down the lane: every stop line with its label, the book on its own line, the tape. With no
  friction, once the book passes the ice's stop (and is still at 3.00 m/s; its word then says থামে না) the view
  looks down the lane for 1.6 s, with a "বই" tag on the small book far beyond every line, and then goes back beside
  it, following it for ever. A push, a floor, শুরুতে ফেরাও or the view buttons bring the side view back.
- **What the student reads off**: the blue বেগ arrow (length ∝ speed) shrinking or staying the same; the crimson
  ঘর্ষণ arrow at the floor behind the book, pointing against the velocity, its length ∝ μ (tiny on ice, none on
  the imagined floor); the dots it leaves every 0.05 s, captioned "দাগ: প্রতি ০.০৫ সেকেন্ডে" (closer and closer as it
  slows, evenly spaced without friction); the result line (বেগ and দূরত্ব from the release point, where the yellow
  tape starts, then where it stopped); and the rule line, which leads with the book's words (above).
- Real time throughout (no slow motion): the mat stop (0.87 s) is quick on purpose; the arrows and the dots stay
  readable in the stopped picture and the view down the lane.
- Without friction we write "সামনে-পেছনে কোনো বল নেই" (no force forward or back), not "no force at all": weight and
  the floor's push still act, up and down, and cancel. The book's own wording is "বল প্রয়োগ না করলে".
- Air resistance on a book sliding flat at 3 m/s is about 0.02 N, under a tenth of even the ice's friction
  (0.25 N for a 0.5 kg book), so the model leaves it out; the imagined floor removes both, as the book says.
- **Test** (৫ questions, one of each kind, random order, each on a clean scene, force arrows hidden until the answer;
  the two on the floor without friction never come one after the other):
  1. the launcher on a floor with no friction: what will the book do after the push? (keeps the same velocity /
     slows and stops / stops when the push ends / speeds up); the answer plays it.
  2. a book on the mat or wood slides and stops (shown): which force, forward or back, acted on it before it
     stopped? (only friction, backward / the push, forward, fading / none, things stop by themselves / the push
     forward and friction back); the answer replays it with the arrows.
  3. predict ice from the mat's and wood's distances (stops beyond 2.55 m / never stops / stops at 2.55 m / stops
     before 1.31 m), or the mat from wood and ice; the answer plays it.
  4. seen from above on the imagined floor, the book goes round a curved wall at 0.7 m/s, leaving a faint trail:
     which of four 0.9 m paths after the wall ends? (straight on; on round the circle; a slackening spiral; flung
     outward, 15° off the radius so it clears the wall's end); the answer slides it straight on. This is the book's
     parenthesis: সমবেগ cannot turn, turning needs a force (the wall).
  5. either a book gliding at 3 m/s on the floor without friction: what is needed to stop it? (a force against the
     velocity / nothing, it will stop soon / another force along the velocity / take the push away); the answer
     applies a steady backward force (an orange "বল" arrow, 4 m/s²) and the book slows to rest; or a book alone in
     the middle of that floor (no launcher): what will it do after a while? The answer lets time pass ("৫ সেকেন্ড
     পরেও এখানেই").
  Every wrong answer gets a one-line note on that mistake. During the test the scene keys and taps rest, and the
  locked hint shows at the top of the view (clear of the paths and their letters).
- Keys: 1–4 floors, Space/Enter/→ push, R or Home back to the start, F/V views.

## Open questions
- The friction values are typical for a paper cover on those floors, not measured; the distances (1.31, 2.55,
  9.18 m) follow from them and from 3 m/s.
- "The same push" is defined by the speed the book leaves with (3 m/s every time): during the 0.2 s push the
  book's front is already sliding onto the floor, and the launcher makes up for that floor's friction. The
  friction arrow shows from the moment it is let go.
- The push arrow is drawn longest but not to the friction arrows' scale (it would be 1.07 m).
