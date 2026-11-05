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
- **Three steps, each built one tap at a time.**
  1. সাধারণ আয়না (camera from 31° to the side): he raises his left hand; the image's hand rises on the same side of the picture, and
     that is a right hand (`বাম হাত` / `ডান হাত`) → the camera zooms to the two cards: the real one reads বাম, the one in the mirror is reversed.
  2. দুটি আয়না: the two mirrors are one flat mirror on a hinge. The student folds them, by the knob on the mirror, the big button, or the
     arrow keys (5° a press). The handle follows the finger along its arc and the view holds still under the finger, then comes round to
     the front on release; a button or key fold moves the camera with the mirrors. The angle reads live on the floor. At 90° (it catches):
     three images → the camera zooms to the real card and the corner image: it reads বাম too, on his left hand, 2 reflections → back to
     the whole: the two at the sides, 1 reflection, right hands.
  3. হাতের মুঠি: the camera turns to the book's plan, the right way up (A left, B up, as চিত্র ৮.১৫), the mirrors low, on a calm slate
     mat. The left fist in AOB, then its ghost in A′OB, in AOB′ and in A′OB′, each with the dashed line carried past O, and one ray traced
     from the fist by BO and AO into an eye, with the dashed lines back to A′OB and to A′OB′ (the book's "image of an image").
  The newest thing is highlighted and its tab turns yellow, as in the sister figures.
- **What can be moved shows itself** (the owner, 2026-11-06). One part moves, the mirror, so it carries the handle: a white disc with a thin
  dark ring and arrows along its way on the screen, a 44 px hit area (68 px by touch), a faint dashed arc for its range with a dot at each
  end, "টেনে সরাও" until the mirrors are folded by hand, and a gentle pulse until the first drag; then it stays, smaller. It is drawn in
  `diagram.js` (the pulse is CSS, so it asks the 3D view for no frames, and it stays off with `coach=0`) and will move to the kit's
  `createDragHandle`. It hides in the zoom on the corner image, where it is out of the frame, and in the test.
- **Images are exact, with no render to texture.** A plane mirror shows the world reflected in its plane, so each image is the same
  geometry under the mirror's own transform (a matrix of determinant −1), drawn only through the mirror's frame: four clipping
  planes from the camera through the frame's edges, set every frame. An image of an image goes under two transforms, cut by the first
  frame and by the picture of the second mirror in the first: eight planes. Between 90° and 180° light can meet the mirrors at most
  twice, so a mirror each way and two double images are all there is, at any fold; at 90° the two double images are one, parted by the
  hinge. Depth does the rest. The picture of each mirror (its edge and rail) is drawn the same way. This is the technique of
  `parallel-mirrors`' view into M₁; the kit's renderer has no stencil buffer, so it is planes. The text proves it: the reversed
  বাম and the true বাম are the same texture under those transforms.
- **Rays are traced** (`reading.js`): aimed by unfolding, then r = d − 2(d·n)n at each mirror; θi = θr, the miss at the eye and the miss at the
  image are read back from the vectors, in the unit tests and in `get`.
- **The test** (numbers only: the kit's quiz compares numbers; a browser test answers all five right and checks ৫ টির মধ্যে ৫ টি): the
  angle that keeps the writing; reflections read off a marked image; the marked image's hand and writing; a mark on the floor for A′OB′
  with the fist moved; which quarter a drawn ray seems to come from. `get` carries the current question's kind and right answer.
- **The drawing** follows `reflection-laws`: a 2D canvas over the view, painted from exact 3D points through the camera.

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
- He stands a little to one side of the corner so that he hides none of his images; the book's example does not say where the hand is.
- From the view in step 2 the cards of the two side images are almost edge-on (a card facing the corner, in a mirror at 45°, faces
  across the view), so their writing cannot be read there. The panel says only "ডান হাত" for them; step 1 shows the reversal.
- The mirror is drawn as a pale film over what stands behind it, so the images look a little paler than the real boy. That is a look,
  not a measure. The glass is drawn 16 mm thick so that its green edge reads on a phone; the reflecting plane is the silver at its back.
- In step 3 the fist is many times life size and the low mirrors are shorter than in step 2. A ray is one of countless (a note says so).
- The plan's ghosts are the chapter's 45 % ghost; the views of the boy are the true look, solid in the glass.

## Terms (as in the book)
সাধারণ আয়না, ডান-বাম, অবিকৃত, 90°, সমকোণ(ে) (the caption's), প্রতিবিম্ব, প্রতিবিম্বের প্রতিবিম্ব, প্রতিফলন, AO, BO, AOB, A′OB, AOB′, A′OB′, বাম হাত, ডান হাত,
সামনা-সামনি, উপর-নিচ, প্রকৃত. p223 writes উপর. Added by the figure: কার্ড, কব্জা (hinge), লেখা ঠিক / উল্টো, ঘর (a quarter of the plan, in the test).

## Numbers
Measured at 844×390, one counted frame: three images at 90°, 28 draw calls and about 79k triangles; the plan, 19 draw calls and about 26k triangles.
Ready in about 3.5 s. At rest nothing is drawn. The budget is 150 draw calls and 300k triangles.

## Open questions
- p234 prints "90°" with Latin-looking digits; the figure shows ৯০° through `t.num()`.
- Sister figures' briefs list চিত্র ৮.১৫ and ৮.২৬ under `parallel-mirrors`; that figure left them out on purpose, so they live here.
- The action's words in step 3 (A′OB তে দেখো) name a quarter; "সামনা-সামনি" and "উপর-নিচ" appear in the rule line.
- A person's wording check of the Bangla against the book.
