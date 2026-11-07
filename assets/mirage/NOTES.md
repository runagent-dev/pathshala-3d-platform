# Notes: Mirage (মরীচিকা)

Book: physics-9-10 › 9.2.2 › pages 251 (bottom) – 252 (top two-thirds), চিত্র ৯.১০. Pages in `reference/page-251.png`,
`reference/page-252.png`; the exact Bangla is in the batch's `pages/9.2.2.md`.

## What the page shows
- p251: মরুভূমিতে মরীচিকা খুবই পরিচিত দৃশ্য; like the rainbow it happens because of পূর্ণ অভ্যন্তরীণ প্রতিফলন. The word comes from a
  দৃষ্টি বিভ্রম in hot places in the desert. Hot air rises, but the air right over the hot sand can be hotter than the layer above,
  so we can imagine the desert air as in চিত্র ৯.১০.
- p252: "সহজভাবে বোঝানোর জন্য এখানে মাত্র তিনটি স্তর দেখানো হয়েছে।" The upper layer is denser, so its প্রতিসরণাঙ্ক is higher; the lower
  layer is hot, less dense, lower প্রতিসরণাঙ্ক. Light from the tree is refracted at each layer, the angle of refraction grows, and at some
  layer it may be totally internally reflected. Seen from afar the angle of incidence is large and more likely to pass the ক্রান্তি কোণ:
  "তাই মরীচিকাকে দূর থেকে দেখা যায়, কাছে এলে দেখা যায় না।" A person sees the tree directly and its image below the tree, as if there were
  water; up close there is no water. The hot road on a summer day ("দূরে কালচে ভেজা রাস্তা … খটখটে শুকনো") is a mirage too.
- চিত্র ৯.১০: a thirsty man on hands and knees at the left, a palm at the right, a pink ray from the treetop curving through two thin
  lines over the ground (three layers), bottoming out and rising to his eye; a dotted line from the eye down below the ground to an
  upside-down palm.

## The one idea to teach
Air over hot sand is hotter and has a lower refractive index; light from a far tree bends more at each layer until, at the lowest
boundary, its angle of incidence passes the critical angle and it is totally reflected up into the eye, which sees an upside-down tree
below the ground, as if in water. From close by the angle is too small: no mirage.

## Terms (as in the book)
মরীচিকা, মরুভূমি, দৃষ্টি বিভ্রম, উত্তপ্ত বালু / বাতাস, স্তর, ঘনত্ব, প্রতিসরণাঙ্ক, প্রতিসরিত, প্রতিসরণ কোণ, আপতন কোণ, ক্রান্তি কোণ (the
page's word; 9.2 says "ক্রান্তি কোণ বা সংকট কোণ"), পূর্ণ অভ্যন্তরীণ প্রতিফলন, প্রতিবিম্ব. The page writes "উপরের". Added by the figure, as
in the sister figures of chapter 9: লম্ব for the normal (chapter 9's word, never অভিলম্ব), "প্রতিবিম্ব (অবাস্তব)" for the image, i and r
for the angles, n for the refractive index on the layer labels, "মাঝের স্তর", "পানি মনে হয়" / "পানি নেই".

## How the figure works
- **Setting:** the calm deep-blue gradient of the sister figures (`#0b2a5b` → `#123d7a`); one finite strip of desert sand (wind ripples
  as a bump map, fine grain, a few pebbles: one instanced mesh) floating in it. No dunes, sky, buildings or people.
- **Objects:** a procedural coconut palm (ringed trunk with a lean, 14 feathered fronds cut out of one 512×128 alpha texture, four
  coconuts; one mesh per material); a textbook eye on a thin stand (eyeball, iris, pupil, clear cornea; no face, as the owner asked).
- **The three layers:** faint tinted slabs (warm orange by the sand, light amber in the middle, pale blue above) with a light line round
  each boundary, labelled উপরের স্তর · n বেশি, মাঝের স্তর, নিচের স্তর · n কম.
- **Rays:** `src/optics.js` traces the light exactly, Snell's law at each boundary (n₁ sin i₁ = n₂ sin i₂, angles from the vertical লম্ব),
  total reflection where sin would pass 1, the path symmetric about the reflection; for an eye at distance D the launch angle is found by
  bisection. `src/rays.js` draws it over the view on a 2D canvas from the projected points, in the chapter-9 style: amber with a dark
  edge and chevrons, the eye's line carried on dashed amber below the ground, the লম্ব dashed slate in a white halo, i blue and r green.
- **Steps** (one tap each, slow; the ring and badge on the 3D part; never auto-advancing; a tapped step word replays it):
  ① সরাসরি: the straight ray from the treetop to the eye. ② স্তর: the sand heats, the three layers come in. ③ বাঁকা পথ: a second ray
  leaves the treetop downward (≈1 s per piece), the camera flies close to the bends, the লম্ব and the arcs i, r show r > i at the first
  boundary, and at the second the ray is totally reflected (label পূর্ণ অভ্যন্তরীণ প্রতিফলন); the panel gives i, r and i at the bottom
  against the ক্রান্তি কোণ. ④ প্রতিবিম্ব: the camera pulls back, the ray climbs into the eye, the eye's line is carried on dashed below
  the ground, and a pale upside-down palm (প্রতিবিম্ব (অবাস্তব)) fades in with a short shimmer, over a pale "water" patch where that line
  meets the ground. ⑤ কাছে: the eye walks up to the tree; the ray must come down steeply, its angle of incidence at the lowest boundary
  falls below the critical angle, it ends in the sand, and the image and the water fade ("পানি নেই"). After step ④ the eye can be dragged
  (the kit's drag handle on its foot, or the arrow keys) and the mirage comes and goes at one distance; the panel says the angle each time.
- **Panel:** calm intro card (short version at 390×520), then per step a lead-in line (only where the panel is beside the 3D), the result
  and the rule in the book's words with the term in bold; the kit's how-to row (orbit, front, drag the eye).
- **Test (5 questions, tap answers, indices):** which layer has the highest n (labels without n); r against i at the first boundary (the
  arcs on screen); why the light turns back at the lowest boundary; where and which way up the image is (the dashed line shown, the image
  hidden); the book's hot road, why it doesn't look wet up close. Each wrong choice has its own note.

## Honesty and numbers (choices made)
- The book gives no refractive indices for air layers. Real air differs only in the fourth decimal (about 1.00029 over cool air, 1.00025
  over hot sand), so a real mirage ray arrives within about 1° of the ground and bends gradually, not at three sharp boundaries. To make the
  bends visible the figure uses its own exaggerated ratios, n_mid / n_top = cos 25° and n_low / n_top = cos 35°, and thick layers. Its
  numbers (i ≈ ৬১°, r ≈ ৭৪°, ক্রান্তি কোণ ৬৫° at the lowest boundary) are the model's, not real air's. The view carries the note
  "স্তর ও কোণ বাড়িয়ে দেখানো"; no n values are printed (only "n বেশি / n কম"), so no unreal index is shown as a fact.
- The book's model: refraction at each layer, then total internal reflection at "কোনো একটা স্তরে". The figure always reflects at the
  lowest boundary (the steepest ray that is still reflected sets where the mirage ends: about 3 model units from the treetop). A layered
  model also allows paths reflected at the upper boundary for very far eyes; the figure shows the one reflected lowest, which matches the
  book's picture (two lines, the U at the lower line).
- The image: the eye sees along the arriving ray's line; the figure ends that dashed line at the tree's distance (where the brain puts a
  reflection in water) and hangs the upside-down palm from the ground with its top exactly there (its height 0.87–1.1 of the tree’s,
  set by the ray). Drawn see-through over the sand, like the book's figure.
- Inverting is shown with the one ray from the treetop (as the book's figure does): its image is the lowest point of the upside-down tree.

## Performance (measured 2026-11-07, `scripts/.perf-tmp.mjs`, 844 × 390, shadows on, software WebGL)
| view | draw calls (az 0° / 90° / 180° / 270°) | triangles (max) |
|---|---|---|
| layers | 30 / 53 / 53 / 53 | 23,292 |
| bend (close up) | 21 / 29 / 20 / 29 | 14,550 |
| image (the heaviest: the palm and its image) | 35 / 63 / 63 / 63 | 30,028 |
| near | 30 / 53 / 53 / 53 | 23,292 |
- Idle: 0 draws (after an orbit, once the damping settles: 2–3 s).
- Main-thread task time per animated frame (a step playing) under 6× CPU throttling: 1.0–1.4 ms (CDP TaskDuration over the run, divided
  by the frames drawn; includes the test driver, so an upper bound).
- Textures: sand colour + bump 512² each, the frond 512×128, the bark 64², the water spot 128², the backdrop 4×256. Shared materials;
  pebbles instanced; the rays cost no draw calls (a 2D canvas). Parts of later steps (the layers, the image, the water) exist at load,
  hidden, and are compiled by `stage.warmUp({ show })`.
- Ready in about 3.3 s under the test harness (software rendering, a loaded machine).

## Open questions for the book team
- The page names "ক্রান্তি কোণ"; 9.2 says "ক্রান্তি কোণ বা সংকট কোণ". The figure says ক্রান্তি কোণ only, as this page does.
- The book's typo "ধরনেরে" (p251) is not repeated.
- Whether to show real air's indices (1.00029 / 1.00025) as a note; the figure keeps to "n বেশি / n কম" and the exaggeration note.
- The road example is used only in the test (one idea on screen).
