# Notes: Rainbow (রংধনু)

Book: physics-9-10 › 9.2.1 › p251 (`reference/page-251.png`).

## What the page shows
Topic ৯.২.১ রংধনু, in the middle of page 251, between the worked critical-angle example of ৯.২ and ৯.২.২ মরীচিকা. Two
paragraphs: anyone who has seen a rainbow has seen পূর্ণ অভ্যন্তরীণ প্রতিফলন; the rainbow is made by it in water; anyone who
could not split white light with a prism has seen it happen in a rainbow; after rain, when the sun comes out, there are
water drops (পানির কণা) in the air, and as the light is reflected inside them "ভিন্ন ভিন্ন রঙের আলো ভিন্ন ভিন্ন পরিমাণে বেঁকে
যায়", and these rays make the rainbow's different coloured bands (ব্যান্ড (Band)). **চিত্র ৯.০৯ : রংধনু**: a sun at the upper
left, a grey ray to a drop on a rainbow arc (red outside), a ray from it down to a boy's eye; a thick arrow from the drop to
an enlarged circle where a white ray enters at the top, reflects off the back and leaves at the lower left as a red and a
violet ray. After the figure: a rainbow is always seen in the sky opposite the sun. Boxed question: ভরদুপুরে রংধনু দেখা যায়
না কেন?

## The one idea to teach
Sunlight going into a raindrop is refracted, reflected at the back of the drop and refracted again on the way out; each
colour bends by a different amount, so the drops send the colours back at slightly different angles (red about 42°,
violet about 41° from the point opposite the sun); that is why the bow is red outside and violet inside, always opposite
the sun, and why with the sun higher than about 42° (midday) there is no rainbow.

## Terms (as in the book)
রংধনু, পানির কণা, সাদা আলো, রং / রংগুলোতে ভাগ, প্রিজম, ভিন্ন ভিন্ন রঙের আলো ভিন্ন ভিন্ন পরিমাণে বেঁকে যায়, ব্যান্ড (Band), সূর্যের
বিপরীত আকাশে, ভরদুপুরে; from the chapter: প্রতিসরণ, প্রতিফলন / প্রতিফলিত. The page writes উপর. The figure adds: চোখ, দিগন্ত,
সূর্যের বিপরীত দিক, the colour names লাল, কমলা, হলুদ, সবুজ, আসমানি, নীল, বেগুনি (only লাল and বেগুনি are named on screen).

## How the figure works
- **Setting** (the owner's calm-blue wish): the deep-blue gradient backdrop, a small round patch of light sand under the
  observer, the observer as a big eye (white, brown iris, pupil, upper and lower lid; no face) on a slim stand, turned
  to look at the bow, the sun drawn near and low behind it, a light curtain of rain as pale streaks (one draw of line
  segments) in front, denser round the bow.
- **First screen**: a calm card (in the place of the result and the rule, so the sheet keeps its height), the finished
  bow as a faint ghost so the student sees what will be explained, and the parallel sunlight. The ring marks one drop
  of the ghost bow.
- **Steps** (one tap each, never auto-advancing): ① *কণায় ঢোকে*: the camera flies (2.4 s) into that drop, which grows
  into a big cut-away sphere of water seen a little from below, against the blue; the white ray goes in, a dashed
  normal (লম্ব) at the entry point and a faint dashed line for where the light would have gone unbent; inside, the colours
  are a filled band from red to violet (প্রতিসরণ; violet bends most) → ② *ফিরে আসে*: the band is reflected at the back
  (প্রতিফলন), a faint part goes on out (labelled "কিছু আলো বেরিয়ে যায়": the reflection is partial), and the colours come
  out as separate rays, red more steeply downward → ③ *রংধনু*: the camera pulls back (about 47° round from behind the
  eye); a bundle of parallel sunlight from the sun's side (labelled সূর্যের আলো), one ray past the eye and on, dashed,
  to the bow's centre (a dot: the point opposite the sun); two drops either side of the top, the red one on the outer
  edge, the violet one on the inner; each sends every colour its own way (a small faded fan, drawn wider than life) and
  the eye catches one; the angles at the eye are labelled লাল ৪২° and বেগুনি ৪১°; the band comes up → ④ *ভরদুপুরে*: the
  sun climbs to 60° (3 s) and the bow sinks below the horizon. From step ③ on the sun can be dragged (kit drag handle,
  5°–70°) or moved with ↑/↓; the result line says how high the top of the bow is (42° − the sun's height) or, with the
  sun very high, that it is below the horizon.
- **Rays**: traced exactly in `src/reading.js` (vector Snell's law at each surface, mirror reflection at the back), drawn on
  a 2D canvas over the view (`src/rays.js`) in the chapter's ray style (constant-width lines, dark edge, chevrons).
- **Panel**: one height in every state at every size (the calm card and the result/rule share one grid cell; the how-to
  row keeps its place, hidden, during the test; the test's worked answers fit the reserved lines). On a phone held
  upright with less than 600 px the how-to row is left out for the picture's sake. In a short side panel (a phone held sideways,
  640 × 400) nothing may scroll: the how-to row is left out, the lead is one line and the rule takes its short form
  (`rule_*_short`; the bow step's "ব্যান্ড" sentence is kept for taller panels). Measured: the panel's scrollHeight −
  clientHeight is 0 in every step, every test question asked and answered and the result, at all six sizes, in Bangla
  and English.
- **Test**: 5 tap questions, each scene set up by the figure: where to look (sky, ghost bow hidden), which colour bends
  most (the drop with the band inside, the unbent line dashed), which colour reaches the eye from drop ক (two drops either
  side of the top, the angles from the point opposite the sun at the eye, all drawn white), why there is no rainbow at
  midday (sun 65°), how high the top stands with the sun at 20° (bow hidden: 22°). Every wrong choice is a real mistake
  with its own note.
- **GLB**: the raindrop cut open, radius 1 mm, with each colour's path as a thin tube (`units: mm`).

## Physics and honesty
- **Water's index** (the book gives none): typical values at about 20 °C from a Cauchy fit n = 1.324 + 3100 nm²/λ²
  (656 nm 1.3311, 589 nm 1.3330, 486 nm 1.3371, 405 nm 1.3428). Rainbow angles from minimum deviation (4r − 2i):
  red (660 nm) 42.35°, violet (410 nm) 40.72°; shown as **প্রায় ৪২°** and **প্রায় ৪১°** (whole degrees, honest
  rounding; common texts say "40°–42°", which uses the violet edge at about 40.5°).
- **The big drop** is drawn with the colours' index differences ×12 (`SPREAD`), still traced with Snell's law: in a real
  drop the colours part by under 2° and would lie on one line. The corner note says "কণাটি অনেক বড় করে, রঙের ফাঁক বাড়িয়ে
  দেখানো". The angles the figure names (42°, 41°) come from the true indices; the sky view is drawn at the true angles.
- **The sky** is not to scale ("দূরত্ব ও আকার প্রকৃত অনুপাতে নয়"): the drops of the bow stand 10 units from the eye, the
  sun is drawn 6.5 units away at its true height as seen from the eye. All sunlight is drawn parallel to the sun-to-eye
  line (the sun is really far away): a bundle of rays from the plane through the sun, square to the light. The small
  fans at the two drops draw the colours' spread 8 times wider than the true 1.7°.
- The horizon is taken at eye level: the band is shown only above it, so the bow is gone exactly when the sun is higher
  than the red angle (about 42.4°).

## Performance (844×390, shadows on, 4 azimuths per view; a temporary script, not committed)
| view | draw calls | triangles |
|---|---|---|
| intro (sky, ghost bow) | 25–67 | 25k–69k |
| drop (step ②) | 7–27 | 12k–40k |
| bow (step ③) | 49 | 32k |
| noon (step ④) | 43 | 20k |
Idle: 0 draws in every step (render on demand; round 2 fixed a label that redrew the midday step every frame). JS per
animated frame at 6× CPU throttling (the back → bow flight, 233 frames): median 0.1 ms, 90th percentile 1.9 ms. Ready
in about 4–5 s under software rendering on a loaded machine. The rain is one draw of 520 line segments (no triangles);
the band and the drop are made at load and warmed (`stage.warmUp({ show: [band, drop] })`). Shadow map 512² fitted
round the eye's stand.

## Open questions
- **Book slip (for the owner/book team):** the book says the rainbow is made by পূর্ণ অভ্যন্তরীণ প্রতিফলন inside the drops.
  In a real drop the light meets the back at about 40°, below water's critical angle (48.6°): it is an ordinary, partial
  reflection (some light goes on out of the back; the figure draws that faintly). Following the orchestrator's decision,
  the panel says the light is প্রতিফলিত at the back of the drop and never calls it total; the book's other words are kept.
  Should the figure add a one-line note on this, or keep silent?
- Violet's angle: shown as প্রায় ৪১° (true for 410 nm). If the book team prefers the common "৪০°–৪২°", the violet ray
  could be taken at 390–400 nm (40.5°), which still rounds to 41°; a "৪০°" would need a deeper violet than the eye sees well.
- The observer is an eye on a stand (no person, per the owner); the book shows a boy.
- The reviewer's "rainbow ray" (many parallel rays across one drop bunching near 42°) was left out to keep the drop
  simple; it would show why the bow is bright at 42°, which the book does not ask.
