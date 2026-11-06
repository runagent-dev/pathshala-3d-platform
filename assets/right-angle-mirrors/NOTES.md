# Notes: Two mirrors at a right angle (সমকোণে দুটি আয়না)

Book: physics-9-10 › 8.8.1 › p234, চিত্র ৮.২৬; the last step also serves the উদাহরণ on p223 (চিত্র ৮.১৫). Page images are in
`reference/`.

## What the pages show
- p234, 8.8.1 সাধারণ আয়না: "সাধারণ আয়নায় ডান এবং বাম দিক বদলে যায়। … যদি আমাদের ডান-বাম অবিকৃত রাখতে হয় তাহলে একটি আয়নার প্রতিবিম্ব অন্য
  একটি আয়নার দ্বিতীয়বার প্রতিফলিত করে আবার ঠিক করে নিতে হয়।" "দুটি আয়নাকে পরস্পরের সাথে 90° তে রেখে সেটাকেই একটি আয়না হিসেবে ব্যবহার করলে
  ডান-বামের পরিবর্তন হয় না।" চিত্র ৮.২৬: a girl showing two fingers in one mirror and in two mirrors at 90°.
- p223, চিত্র ৮.১৫: mirrors AO and BO at right angles, a left fist in AOB; A′OB the সামনা-সামনি image, AOB′ the উপর-নিচ image, both of them
  right hands; A′OB′ the প্রতিবিম্বের প্রতিবিম্ব, a left hand again; it is the image of either of the other two.

## The one idea
One reflection swaps left and right. Two mirrors at 90° reflect twice, so the image in their corner keeps left as left; of the
three images only that one is not swapped.

## How it works
- **A calm start (the owner, after chapter 8: "start simpler, with some lines of explanation in the white panel").** The first screen shows only a few warm everyday sentences in a `.pvc-note` card (`intro`; `intro_short` on the 390 × 520 phone) and the action: no term and no number yet. After that, one plain line above the action says what the next tap will show (`lead_*`), and the rule below says what it meant, the book's term last and in bold. Same layout and classes as the spherical-mirror figures (`.lab-lead`, `.lab-calm`).
- **Three steps, each built one tap at a time.**
  1. সাধারণ আয়না (camera from 31° to the side): he raises his left hand; the image's hand rises on the same side of the picture, and
     that is a right hand (`বাম হাত` / `ডান হাত`) → the camera zooms to the two cards: the real one reads বাম, the one in the mirror is reversed.
  2. দুটি আয়না: the two mirrors are one flat mirror on a hinge. The student folds them, by the knob on the mirror, the big button, or the
     arrow keys (5° a press). The handle follows the finger along its arc and the view holds still under the finger, then comes round to
     the front on release; a button or key fold moves the camera with the mirrors. The angle reads live on the floor. At 90° (it catches):
     three images → the camera zooms to the real card and the corner image: it reads বাম too, on his left hand, 2 reflections → back to
     the whole: the two at the sides, 1 reflection, right hands.
  3. হাতের মুঠি: the camera turns to the book's plan, the right way up (A left, B up, as চিত্র ৮.১৫), the mirrors low, on a calm slate
     mat, and opens on the fist's quarter alone, big. The left fist in AOB, then its ghost in A′OB, in AOB′ and in A′OB′, the view widening as
     they come, each with the dashed line carried past O. Then a tap of its own: one ray from the fist by BO and AO into an eye, a stretch
     at a time, then the dashed lines back to A′OB and to A′OB′ (the book's "image of an image").
  The newest thing is highlighted and its tab turns yellow, as in the sister figures.
- **Unhurried** (the owner, 2026-11-06: a lab must not finish before the student understands). One tap, one idea; nothing advances by
  itself. Camera flights 1.6 s (2.2 s to and from the plan, 1.2 s after a drag and in the test), the hand 2 s, the fold 2.5 s, the mirrors
  opening 2 s, the ray 1 s a stretch (`RAY_PLAY`). The action waits ("দেখো…") through every move and flight and about 1 s more
  (`hold`), and taps meanwhile are ignored, not queued. The quiet ▶ "আবার দেখো" plays the last move again, the step's earlier moves staying;
  the word or ↺ restarts the step. The test is offered at the end: "বুঝেছ? তাহলে পরীক্ষা দাও". The পরীক্ষা tab is open from the start: that is the kit's.
- **What can be moved shows itself** (the owner, 2026-11-06). One part moves, the mirror, so it carries the kit's `createDragHandle`: its
  range is a curved track along the arc, "টেনে সরাও" stays until the mirrors are folded by hand, and the pulse stays off with `coach=0`. It
  hides in the zoom on the corner image, where it is out of the frame, and in the test.
- **Images are exact, with no render to texture.** A plane mirror shows the world reflected in its plane, so each image is the same
  geometry under the mirror's own transform (a matrix of determinant −1), drawn only through the mirror's frame: four clipping
  planes from the camera through the frame's edges, set every frame. An image of an image goes under two transforms, cut by the first
  frame and by the picture of the second mirror in the first: eight planes. Between 90° and 180° light can meet the mirrors at most
  twice, so a mirror each way and two double images are all there is, at any fold; at 90° the two double images are one, parted by the
  hinge. Depth does the rest. The picture of each mirror (its edge and rail) is drawn the same way. This is the technique of
  `parallel-mirrors`' view into M₁; the kit's renderer has no stencil buffer, so it is planes. The text proves it: the reversed
  বাম and the true বাম are the same texture under those transforms.
- **All the way round** (the owner, 2026-11-06). The view turns 360°, 5°–88° from straight up, so never under the floor, with zoom limited round the
  step's own distance. An image shows only from its mirror's silvered side: the camera must be in front of the mirror, and for a double
  image the camera's own picture in the first mirror must stand in front of the second. From behind a mirror there is its back: painted
  glass and three steel braces, one mesh, drawn only from that side (from the front the view goes through). In a view the student has
  turned, the images' labels go, since their points may lie outside the glass: "সামনে" brings them back. Each step's guided camera still flies to its frame, and "সামনে" brings it back. The dark pill in a corner (⟲ ৩৬০° ঘুরিয়ে দেখো,
  then ⟲ ৩৬০°) is the kit's rotate cue, nothing like the white handle on the mirror. A tap is not a turn: it takes 8 px. A resize never takes a
  turned view away (the kit reports its lower resolution as a resize, and a browser test holds this); an unturned view fits again.
- **Rays are traced** (`reading.js`): aimed by unfolding, then r = d − 2(d·n)n at each mirror; θi = θr, the miss at the eye and the miss at the
  image are read back from the vectors, in the unit tests and in `get`.
- **The test** (numbers only: the kit's quiz compares numbers; a browser test answers all five right and checks ৫ টির মধ্যে ৫ টি): the
  angle that keeps the writing in the corner (front) image; reflections read off a marked image; the marked image's hand and writing, the
  camera close on it; a mark on the floor for A′OB′ with the fist moved; which quarter a drawn ray seems to come from. `get` carries the current question's kind and right answer.
- **The drawing** follows `reflection-laws`: a 2D canvas over the view, painted from exact 3D points through the camera.
- **How to use** (v0.2.0, kit 1.8.0 `createHowTo`): under the action, the same ⟲ ৩৬০° pill and সামনে button as on the view, with a few words, and the fold's white disc ("টেনে আয়না ভাঁজ করো"), unseen but in place outside its step. Tapping an item points at its control on the view.

## Lightweight, on purpose
- The boy is `plane-mirror-image`'s, about half its triangles, one mesh with colour and finish in the vertices, so he and each image
  are one draw plus his card. The left arm's vertices are placed from two bones in `setArm`, only while the arm moves; all five copies share
  the geometry. No shadow-map pass: a small soft blob at his feet, mirrored with him (a shadow map would not be seen in the mirrors).
  The `shadow` parameter turns the blobs off.
- The floor is plain, so one floor serves in front of the mirrors and in them: no mirrored floor draw.
- Only the arm's tween and a camera flight draw frames; at rest the figure draws nothing (a browser test checks it).

## Honest simplifications
- The lights are not mirrored: each image is lit from the viewer's side, so that its face can be seen. Only the light differs; the geometry
  is exact.
- The hinged mirrors are a device of this figure: the book just says to put two mirrors at 90°. Folding shows what the second mirror does.
  At 180° they are one flat mirror with a thin seam; the book's plain mirror has none.
- The card is the figure's, not the book's: a white card reading বাম on both faces, so that the reversal can be seen at a glance. চিত্র
  ৮.২৬ shows fingers. His wristwatch is on his left wrist too.
- He holds the card out beside him from the start, so that it shows from behind him as well as in the mirror.
- In step 2 he turns the card as the mirrors close, to 30° off the view, so that the two side images show its reversed writing: a card
  square to the corner would be edge-on in them. The real and the corner cards show about 0.87 of their width, the side ones about half.
- He stands a little to one side of the corner so that he hides none of his images; the book's example does not say where the hand is.
- The mirror is drawn as a thin dark film with a hint of green over what stands behind it: real silver sends back about 90 %. The glass is drawn 16 mm thick so that its green edge reads on a phone; the reflecting plane is the silver at its back.
- In step 3 the fist is many times life size and the low mirrors are shorter than in step 2. A ray is one of countless (a note says so).
- The plan's ghosts are the chapter's 45 % ghost; the views of the boy are the true look, solid in the glass.

## Terms (as in the book)
সাধারণ আয়না, ডান-বাম, অবিকৃত, 90°, সমকোণ(ে) (the caption's), প্রতিবিম্ব, প্রতিবিম্বের প্রতিবিম্ব, প্রতিফলন, AO, BO, AOB, A′OB, AOB′, A′OB′, বাম হাত, ডান হাত,
সামনা-সামনি, উপর-নিচ, প্রকৃত. p223 writes উপর. Added by the figure: কার্ড, কব্জা (hinge), লেখা ঠিক / উল্টো, ঘর (a quarter of the plan, in the test).

## Numbers
Measured at 844×390, one counted frame, from eight azimuths at two heights, at 90° and part way through the fold: the worst is 26 draw
calls and about 79k triangles; the plan at most 19 draw calls and about 26k triangles. The budget is 150 and 300k. Ready in about 3.5 s,
GLB 488 KB, zip 456 KB. At rest nothing is drawn, after a turn of the view too.

## Open questions
- p234 prints "90°" with Latin-looking digits; the figure shows ৯০° through `t.num()`.
- The পরীক্ষা tab is open from the start (the kit's), though the figure offers the test only at the end.
- Q1 could let the student drag the angle; the kit's test is tap-only, so the question names the corner (front) image instead.
- Sister figures' briefs list চিত্র ৮.১৫ and ৮.২৬ under `parallel-mirrors`; that figure left them out on purpose, so they live here.
- The action's words in step 3 (A′OB তে দেখো) name a quarter; "সামনা-সামনি" and "উপর-নিচ" appear in the rule line.
- A person's wording check of the Bangla against the book.
