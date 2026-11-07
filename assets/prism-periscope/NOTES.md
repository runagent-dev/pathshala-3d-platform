# Notes: Periscope and binoculars (পেরিস্কোপ ও বাইনোকুলার)

Book: physics-9-10 › 9.3.3 › p254 (bottom half), চিত্র ৯.১৩. Screenshot: `reference/page-254.png`. The critical angle and
the words for total internal reflection come from 9.2 (pp. 248–250, চিত্র ৯.০৬–৯.০৮).

## What the page shows
Three sentences: a submarine's periscope shows the scene above the water from under it; a periscope made with prisms and
their total internal reflection is much more effective than one made with ordinary mirrors; binoculars use total
internal reflection in prisms to be shorter. চিত্র ৯.১৩ draws two 45°-45°-90° prisms one above the other (no tube): a
flower's light goes level into the top prism, is totally reflected down at its hypotenuse, totally reflected again in
the bottom prism and goes level into a girl's eye. Caption: "আধুনিক পেরিস্কোপে আয়নার পরিবর্তে প্রিজম ব্যবহার হয়।"

## The one idea to teach
Two right-angle prisms each turn light 90° by total internal reflection (45° on the hypotenuse face, more than glass's
critical angle 41.8°), so a periscope sees over a wall; binoculars fold their light the same way to be shorter.

## Terms (as in the book)
পেরিস্কোপ, সাবমেরিন, "পানির নিচ থেকে পানির উপরের দৃশ্য", সাধারণ আয়না, কার্যকর, প্রিজম, পূর্ণ অভ্যন্তরীণ প্রতিফলন,
বাইনোকুলার, "বাইনোকুলারের দৈর্ঘ্য কমানোর জন্য"; from 9.2: ঘন / হালকা মাধ্যম, আপতন কোণ, সংকট কোণ (the book also writes
ক্রান্তি কোণ), কাচ-বাতাস বিভেদতল, "সবচেয়ে পরিপূর্ণ প্রতিফলন হয় পূর্ণ অভ্যন্তরীণ প্রতিফলনে". Chapter 9's লম্ব for the
normal (never chapter 8's অভিলম্ব), and অতিভুজ তল for the long face, as the sister figure total-internal-reflection.
Added by the figure (not on the page): দেয়াল, ফুল, চোখ, টেনে তোলো.

## What the student sees
- **The setting:** the chapter's calm deep-blue backdrop, a plain sand table; on it a low brick wall, a flower in a pot
  behind it, and on this side a **demonstration periscope**: aluminium frame, painted end walls with the windows, clear
  acrylic sides so the two glass prisms inside show from the front and the back, a fixed lower tube with an eyecup and a
  head that slides up out of it. A plain textbook **eye icon** at the eyecup (no face; the owner: no cartoon heads).
- **Calm first screen:** a short card (what is on the table, the submarine, "let us see how") under the action, and a
  question before it: দেয়ালের পেছনের ফুলটি কি চোখে পড়ে?
- **① দেয়াল** (tap the eye or the button): the flower's light runs straight toward the eye and stops at the wall (a red ✕).
- **② পেরিস্কোপ** (drag the head ↕ by its handle, or tap): the head rises above the wall; the flower's light comes in level,
  turns down in the top prism, turns again in the bottom prism and goes level into the eye. Dragged back below the wall's
  top, the light comes from the bricks instead, and the result line says the eye sees the wall.
- **③ প্রিজম**: the camera flies close to the top prism; the normal (লম্ব, dashed) and the angle of incidence (blue) on the
  hypotenuse face: ৪৫°, more than the critical angle ৪১.৮°, so all the light comes back and turns ৯০°. The bottom prism has
  its own normal and angle (seen when the view is turned or zoomed out).
- **④ বাইনোকুলার**: the camera flies to a pair of Porro-prism binoculars (they come onto the table for this step only, so
  they never crowd the periscope's picture): the near barrel is a cut-away shell; light comes in through the objective,
  is reflected twice in the first prism (up, then back), twice in the second (sideways, then forward), numbered ১–৪, and
  leaves through the eyepiece into an eye. Result: a path of about ২৭ cm inside a body about ১৪ cm long. Rule: the book's
  sentence.
- The panel: one action button (and its numbered badge on the 3D part), a lead-in line (side panels only), the result
  and the rule with the book's term in bold; quiet replay (আবার দেখো) and home buttons; the kit's how-to row (turn, front,
  drag the head). Step words jump to a step; tapping the current word replays it.
- **Test (5 questions)**, each with its own scene: what the eye sees with the head below the wall (no light drawn), the
  angle of incidence on the hypotenuse face (normal drawn, no angle), why all the light comes back (angle drawn), how many
  total reflections in one barrel (numbers hidden), why binoculars have prisms. Every wrong choice has its own note.

## Physics and numbers (reading.js, unit-tested)
- n(glass) = 1.5: the book prints θc = 41.8° for glass (from 1.00/1.52 rounded to 0.66); 1.5 gives 41.8° exactly, so
  the figure shows one value, 41.8°, everywhere (common.md's chapter-9 decision). Never 41.1°.
- Every ray is traced: square-on faces don't bend it; at each hypotenuse face the angle of incidence is computed from
  the face's normal (45°), compared with θc (total), and the ray reflected by d − 2(d·n)n. Each turn is 90°.
- The binoculars: one barrel's path through the objective, Porro prism A (folds in the vertical plane) and B (turned a
  quarter turn, folds sideways), four reflections at 45°; path 27.1 cm, body 14.2 cm (this model's numbers, said with
  "প্রায়").
- Honest simplifications: one ray (the central one) per path; the periscope is a table model (the wall 22 cm high); the
  red ✕ marks where the straight light meets the wall's far face (drawn over the wall, which the camera sees from the
  near side).

## Layout checks (measured with a script in every state, both languages)
- One 3D height per size in every state: intro, the four steps, the head low, every test question and every revealed
  answer, the result. The words round the action are stacks of layers (live words + hidden copies of every step's words)
  so the panel never changes height; the how-to row keeps its room in the test. 390×700: 349 px (bn) / 328 px (en);
  390×520: 211 / 208; side panels: the full height.
- Nothing scrolls at the six sizes in Bangla and English. Short side panels (844×390, 640×400) and 390×520 drop the
  lead-in line and the how-to row; the drag handle on the head carries its own word.
- Labels keep off the drawn light: the drawing reports small boxes along every line, arc and eye, and the labels and the
  action's badge avoid them.

## Performance (measured, headless Chromium, 844 × 390, shadows on)
- Draw calls / triangles per frame, four azimuths (0°, 90°, 180°, 270°): step ② 32 / 8.2 k at every side; step ③ 20–25 /
  4.3–7.5 k; step ④ 24 / 8.3 k at every side (the periscope is hidden there). Idle: 0 draws a second.
- Main-thread time per animated frame at 6× CPU throttling: 1.6–3.7 ms (each step's animation), 2.1–2.6 ms dragging the
  head with the view turned to each of the four sides.
- Shadow map 1024², fitted to the table; static parts merged one mesh per material; the light, normal and angles are a 2D
  canvas (no geometry); the binoculars are hidden outside their step and warmed up at load (`stage.warmUp`).
- GLB: 459 KB, 9,496 triangles, 0.73 × 0.30 × 0.35 m (the wall, the flower, the periscope with its prisms, the
  binoculars). Zip: 463 KB, runs offline.

## Open questions
- Every Bangla line needs a person's check against the book.
- The book's 41.8° comes from rounding 1/1.52 to 0.66 (exactly it is 41.1°); the figure uses n = 1.5.
- The binoculars, the wall and the flower are the figure's own (চিত্র ৯.১৩ has only the two prisms, the flower and a girl).
- At 390 × 520 the side panel's lead-in line and the how-to row are dropped (the action and the drag handle remain).
