# Notes: Kinetic theory of matter (পদার্থের আণবিক গতিতত্ত্ব)

Book: physics-9-10 › 5.6.1 › p152–153 (the heading is at the foot of page 152; `reference/page-153.png` shows both).

## What the page shows
No picture: text and a নিজে করো box.
- A solid on a table presses only where it touches the table. A liquid would spread over the table, so it is kept in a
  container; it presses down and on every side wall (a hole in the wall lets the liquid out, pushed by the pressure).
  A gas must be kept in a closed space and presses on every part of it; a balloon holds gas, and a hole made without
  bursting it lets the air out, pushed by its pressure.
- নিজে করো: blow up a balloon, stick a piece of স্কচটেপ firmly on it, make a hole through the tape with a সুচ: the
  balloon does not burst and the air comes out through the hole.
- Why a gas presses (আণবিক গতিতত্ত্ব): molecules in a closed space rush about, hit the wall and bounce back
  (প্রতিফলিত), "একটি ভরবেগে দেয়ালে আঘাত করে অন্য ভরবেগে ফিরে যায়". Changing momentum needs a force, so the molecule pushes
  the wall; by Newton's third law the wall pushes back (পাল্টা বল) and bounces it off. Countless molecules: "এই সম্মিলিত
  বলটিই গ্যাসের চাপ হিসেবে দেখা যায়". Heating raises their গতিশক্তি, they hit harder, the pressure rises (details in the
  next chapter).

The owner's reference for the molecule look: `reference/owner-states-particles.png` (solid, liquid and gas with their
particles inside). The owner asked for the book's concept, explained with the balloon, non-interactive, vivid, and
"no white or green background".

## The one idea to teach
A gas presses on its container because its moving molecules keep hitting the wall: each hit is a force on the wall
(with an equal and opposite force on the molecule), and countless hits add up to the pressure.

## Terms (as in the book)
কঠিন পদার্থ, তরল, গ্যাস, পাত্র, ফুটো, আবদ্ধ জায়গা, চাপ, বেলুন, স্কচটেপ, সুচ, বাতাস বের হয়ে যাচ্ছে, ফাটবে না, আণবিক
গতিতত্ত্ব, অণু, আঘাত, প্রতিফলিত, ভরবেগ (অন্য ভরবেগ), বল, নিউটনের তৃতীয় সূত্র, পাল্টা বল, অসংখ্য অণু, সম্মিলিত বল,
তাপ, গতিশক্তি. The page writes "উপর".

## Design
- An animation (78 s) on `timeline.js`; seven chips: কঠিন, তরল, গ্যাস, বেলুন, কারণ, চাপ, তাপ. Captions are CUES in
  `src/i18n.js`, in the book's words.
- One scene: the room, and the molecule close-ups far below it. A second camera draws a close-up into a round
  magnifier (states, heat) or, opened as an iris from the balloon's middle, fills the view ("inside the balloon"), so
  going in and out is seamless.
- Colours: pressure arrows red #e03131 (as `pressure`); forces at the wall purple #7048e8 (force F as in `pressure`),
  the reaction dashed in the same colour (as `newtons-third-law`); momentum green #2f9e44 (book-notes). Molecules one
  glossy cobalt blue #2b59c3 in every state (the same molecules), the followed one gold #f6b40e. The balloon is yellow
  so red arrows stand out on it; inside it the light through the rubber is warm cream, the outside the room's blue.
- Liquid side arrows grow with depth (pressure grows with depth, topic 5.2); the gas arrows are all the same length.
- Molecule time slows (×0.35), pauses at the hit and speeds up when heated (×1.9), as a closed-form integral
  (`motion.js clock`), so seeking is exact. Notes on screen: drawn huge / slowed / paused / not to scale (the needle).
- No shadow map (soft contact shadows instead), instanced molecules (≈ 130), so software WebGL stays quick.

## Open questions
- The page has no figure number; placement is beside the নিজে করো box.
- "পাল্টা বল" is the book's word for the wall's force on the molecule; English says "reaction force".
- The heat lamp is our way to "গ্যাসের তাপ বাড়িয়ে দেওয়া"; the book does not say how.
- A fresh balloon is used for the "why" part (the leaking one is swapped during a short blue dip).
- Sister figure: `states-of-matter` (page 150, topic 5.6) is being made at the same time; align the molecule colour if
  it chose another.
