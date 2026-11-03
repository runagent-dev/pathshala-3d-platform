# Notes: Sound needs a medium (শব্দ সঞ্চালনে মাধ্যম)

Book: physics-9-10 › 7.3 শব্দ তরঙ্গ › p199, চিত্র ৭.১১ (order 2 on the page; `paper-vocal-cord`, চিত্র ৭.১০, is order 1).

## What the page shows
Page 199, after the voice and other sources of sound: "কম্পন দিয়ে শব্দ তৈরি করার পর সেটিকে এক জায়গা থেকে অন্য জায়গায়
প্রবাহিত করার জন্য একটা মাধ্যমের দরকার হয়। তরল ও কঠিন পদার্থের ভেতর দিয়েও শব্দ প্রবাহিত করা যায়, কিন্তু আমরা বাতাসের
মাধ্যমেই শব্দ শুনে অভ্যস্ত। মাধ্যম ছাড়া যে শব্দ যেতে পারে না সেটি দেখানোর জন্য ল্যাবরেটরিতে ৭.১১ চিত্রে দেখানো উপায়ে একটা
জারের মধ্য একটা কলিং বেল রেখে সেটাকে বাইরে থেকে বিদ্যুৎ সরবরাহ করে বাজানো যেতে পারে। তারপর একটা পাম্প দিয়ে জারটিকে
ধীরে ধীরে বায়ুশূন্য করা শুরু করলে কলিং বেলের শব্দ মৃদু হতে শুরু করে। বেলজারটি পুরোপুরি বায়ুশূন্য করা হলে ভেতরে কলিং বেলটি
কাঁপতে থাকলেও বাইরে থেকে কোনো শব্দ শোনা যায় না।" The picture: a bell jar with a stopper on a square plate, a calling bell
(coils, gong) hung inside by two wires, a hose to the pump. Caption: "চিত্র ৭.১১: বেলজার থেকে বাতাস পাম্প করে সরিয়ে নিলে কলিং
বেলে শব্দটি আর শোনা যাবে না।" Page 200 adds: "শব্দ একটি যান্ত্রিক তরঙ্গ … সেটি সঞ্চালনের জন্যও একটি স্থিতিস্থাপক মাধ্যমের
দরকার হয়", and the speeds (বায়বীয় মাধ্যমে কম, তরলে তার চেয়ে বেশি, কঠিন পদার্থে আরো বেশি). Pages in `reference/`.

## The one idea to teach
Sound needs a medium: as the air is pumped out of the bell jar the bell grows soft and then cannot be heard at all,
though its hammer is still seen striking the gong; let the air back in and the sound returns.

## Terms (as in the book)
মাধ্যম, বেলজার / জার, কলিং বেল, পাম্প, বায়ুশূন্য, মৃদু, কম্পন, প্রবাহিত, সঞ্চালন, যান্ত্রিক তরঙ্গ, স্থিতিস্থাপক মাধ্যম,
শব্দ তরঙ্গ. Added by the figure (not on the page): ভালভ, গেজ / চাপ (kPa), হাতুড়ি, বাতাসের কণা, শব্দের জোর.

## How the figure works
- The apparatus at real size (metres): a painted cast-iron pump plate with a ground steel disc, a rubber seal and the
  port; a 30 cm thick-glass bell jar (flange, dome, neck, rubber stopper; a Fresnel rim so the glass reads on a phone);
  a real electric calling bell inside (bakelite board, two copper-wound coils on an iron yoke, a soft-iron armature on
  a flat spring, the contact screw, the hammer rod and ball, a nickel gong), hung from the stopper on a steel rod, its
  red and black wires out through the stopper to a battery box with a push switch; a side pipe with a 0–100 kPa vacuum
  gauge (needle) and the air-in valve (a red lever), a rubber hose to a rotary vane pump with a running light. A dark
  iroko lab bench and a dusk-plum backdrop; no other props.
- The hammer strikes the gong 8 times a second all the time (|sin| swing, a hit and a bounce); it never changes with
  the air. 380 small particles stand for the jar's air and jiggle in place; teal rings (a dark compression with a
  lighter rarefaction behind, the chapter's shading) leave the gong every other strike, cross the glass and fade in the
  room. Their strength, the particles' number and the synthesized bell's loudness all follow the air left.
- One action (createAction, badge on the gauge, then on the valve): "পাম্প চালিয়ে বায়ু বের করো" → the pump runs (a tap
  stops it half way: "আরও বায়ু বের করো" continues) → no air → "ভালভ খুলে বায়ু ঢোকাও" → the sound returns. The pump
  takes a share of the air left every second and a little more (`reading.js`: empties in about 7.4 s, slowly at the
  end, "ধীরে ধীরে"); the valve fills it in about 2 s.
- Panel: two meters (air in the jar with its kPa, the sound outside: জোরে / মৃদু / খুব মৃদু / শোনা যায় না), one result
  line, one rule growing from "একটা মাধ্যমের দরকার" to the book's two sentences and then the law (মাধ্যম ছাড়া শব্দ যেতে পারে
  না; যান্ত্রিক তরঙ্গ, স্থিতিস্থাপক মাধ্যম); an honest note (dots = air particles, rings = the sound wave, much slowed;
  330 m/s in air). On wide panels (≥ 1000×680) a small graph: the loudness heard at each amount of air, as the student
  goes.
- Keys: Space/Enter/→ the action, ↓/↑ 10 % less/more air at once, R reset. Taps on the gauge, the valve or the pump do
  the action too.
- Test (5): read the gauge (a close-up; 20, 30 or 70 kPa; wrong: read from the other end, "still full" 101, "empty"
  0); why softer at half the air (hammer weaker, pump noise, battery); the hammer with no air (stopped, glass blocks,
  no current); water instead of air (yes; "yes but slower", "only air", "no vibration in water"); the Moon (nothing;
  faint, as on Earth, later). Each wrong choice has its own note.

## Simplifications (said honestly)
- Loudness outside is modelled as in proportion to the air left (the panel's "শব্দের জোর" and the graph are this
  model, not a measurement). In a real lab a little sound still leaks through the hanging wires and the plate; the
  book says none is heard, and so does the figure.
- The sound rings are slowed enormously (said in the note) and drawn every other strike so they stay apart.
- 101 kPa for the room's air; the gauge reads absolute pressure from 0.

## Open questions
- The figure's title: the book has no heading for this experiment; "শব্দ সঞ্চালনে মাধ্যম" comes from page 200's
  "সঞ্চালনের জন্য … মাধ্যমের দরকার". Confirm.
- kPa on the gauge is not used on this page (chapter 5 uses Pa); is a gauge in kPa acceptable, or should it read %?
- The book's picture has no gauge, valve or battery; they are added so the student sees why the needle and the sound
  fall together, and where the bell's power comes from.
- The Bangla needs a person's check against the book.
