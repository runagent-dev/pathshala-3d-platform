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
- **Setting** (the owner's calm-blue wish): the deep-blue gradient backdrop, a round patch of light sand, the observer as
  an eye on a slim stand (no face), the sun drawn near and low behind it, a light curtain of raindrops (one instanced
  mesh) in front. Nothing else.
- **Steps** (one tap each, never auto-advancing): calm card → ① *কণায় ঢোকে*: the camera flies (2.4 s) into one drop of
  the bow, which grows into a big cut-away sphere of water (the far half clear water, the cut face pale, the near half a
  faint ghost); a white ray goes in and its colours fan out inside (প্রতিসরণ; violet bends most) → ② *ফিরে আসে*: the
  colours are reflected at the back (প্রতিফলন; a faint part goes on out of the back, because the reflection is partial)
  and come out, further apart; red leaves more steeply downward → ③ *রংধনু*: the camera pulls back (the drop shrinks into
  the sky); sunlight past the eye and on, dashed, toward the point opposite the sun; parallel sunlight reaches two drops
  at the top of the bow, the drop at about 42° sends red to the eye, the drop at about 41° violet (angles drawn at the
  eye); the band appears, red outside → ④ *ভরদুপুরে*: the sun climbs to 55° (3 s), the bow sinks below the horizon. From
  step ③ on, the sun can be dragged (kit drag handle, 5°–60°) or moved with ↑/↓; the result line says how high the top of
  the bow is (42° − the sun's height), or that it is below the horizon.
- **Rays**: traced exactly in `src/reading.js` (vector Snell's law at each surface, mirror reflection at the back), drawn on
  a 2D canvas over the view (`src/rays.js`) in the chapter's ray style (constant-width lines, dark edge, chevrons).
  White light white, each colour in its spectrum colour.
- **Test**: 5 tap questions, each scene set up by the figure: where to look (sky, no bow), which colour bends most (the
  drop), which colour reaches the eye from the outer drop ক (the two drops, lines drawn white), why there is no rainbow at
  midday (sun 60°), how high the top stands with the sun at 20° (bow hidden: 22°). Every wrong choice has its own note.
- **GLB**: the raindrop cut open, radius 1 mm, with each colour's path as a thin tube (`units: mm`).

## Physics and honesty
- **Water's index** (the book gives none): typical values at about 20 °C from a Cauchy fit n = 1.324 + 3100 nm²/λ²
  (656 nm 1.3311, 589 nm 1.3330, 486 nm 1.3371, 405 nm 1.3428). Rainbow angles from minimum deviation (4r − 2i):
  red (660 nm) 42.35°, violet (410 nm) 40.72°; shown as **প্রায় ৪২°** and **প্রায় ৪১°** (whole degrees, honest
  rounding; common texts say "40°–42°", which uses the violet edge at about 40.5°).
- **The big drop** is drawn with the colours' index differences ×6 (`SPREAD`), still traced with Snell's law: in a real
  drop the colours part by under 2° and would lie on one line. The corner note says "কণাটি অনেক বড় করে, রঙের ফাঁক বাড়িয়ে
  দেখানো". The angles the figure names (42°, 41°) come from the true indices; the sky view is drawn at the true angles.
- **The sky** is not to scale ("দূরত্ব ও আকার প্রকৃত অনুপাতে নয়"): the drops of the bow stand 10 units from the eye, the
  sun is drawn 5.5 units away at its true height as seen from the eye; sunlight to the drops is drawn parallel to the
  sun-to-eye line (the sun is really far away), fading in from far.
- The horizon is taken at eye level: the band is shown only above it, so the bow is gone exactly when the sun is higher
  than the red angle (about 42.4°).

## Performance (844×390, shadows on, 4 azimuths per view; scripts/.perf-tmp.mjs, removed after)
| view | draw calls | triangles |
|---|---|---|
| intro (sky) | 22–58 | 54k–156k |
| drop (step ②) | 13–55 | 16k–56k |
| bow (step ③) | 46–48 | 125k–131k |
| noon (step ④) | 48 | 125k |
Idle: 0 draws (render on demand). JS per animated frame at 6× CPU throttling (the back → bow flight, 193 frames):
median 0.7 ms, 90th percentile 2.0 ms. Ready in about 3.7 s under software rendering. The 3D band and the drop are made
at load and warmed (`stage.warmUp({ show: [band, drop] })`). Shadow map 512² fitted round the eye's stand.

## Open questions
- **Book slip (for the owner/book team):** the book says the rainbow is made by পূর্ণ অভ্যন্তরীণ প্রতিফলন inside the drops.
  In a real drop the light meets the back at about 40°, below water's critical angle (48.6°): it is an ordinary, partial
  reflection (some light goes on out of the back; the figure draws that faintly). Following the orchestrator's decision,
  the panel says the light is প্রতিফলিত at the back of the drop and never calls it total; the book's other words are kept.
  Should the figure add a one-line note on this, or keep silent?
- Violet's angle: shown as প্রায় ৪১° (true for 410 nm). If the book team prefers the common "৪০°–৪২°", the violet ray
  could be taken at 390–400 nm (40.5°), which still rounds to 41°; a "৪০°" would need a deeper violet than the eye sees well.
- The observer is an eye on a stand (no person, per the owner); the book shows a boy.
