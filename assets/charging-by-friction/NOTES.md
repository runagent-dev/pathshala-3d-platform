# Notes: Static electricity by rubbing (ঘর্ষণে স্থির বিদ্যুৎ)

Book: physics-9-10 › 10.2 › p274 (the topic runs to the top of p275). Page images in `reference/`.

## What the page shows
চিত্র ১০.০২ (p274): hands rub a glass rod with silk ("+" on the glass, "−" on the silk) and a plastic rod with flannel ("−" on
the plastic, "+" on the flannel). চিত্র ১০.০৩ (p275): three panels of a bar hanging from a thread at its middle, a second bar
held near one end: + and + (away), − and − (away), − hanging and + held (toward). The text: "কাচ থেকে ইলেকট্রনগুলো সিল্কে আসতে
শুরু করবে", "ফ্লানেল থেকে ইলেকট্রন চলে আসবে প্লাস্টিকের টুকরোতে", the silk thread is "বিদ্যুৎ অপরিবাহী", mass has one kind and
charge two, so gravity only attracts and the electric force does both.

## The one idea to teach
Rubbing moves electrons from one material to the other (glass → silk, flannel → plastic); like charges repel, unlike attract.

## Terms (as in the book)
ঘর্ষণে স্থির বিদ্যুৎ, ঘষা, সিল্ক, ফ্লানেল (পশমি কাপড়), ইলেকট্রন, প্রোটন, পজিটিভ বা ধনাত্মক চার্জযুক্ত, নেগেটিভ চার্জযুক্ত, আসক্তি, আহিত,
সিল্কের সুতা, বিদ্যুৎ অপরিবাহী, ঝুলন্ত, দণ্ড, বিকর্ষণ, আকর্ষণ, "একই ধরনের চার্জ একে অন্যকে বিকর্ষণ করে এবং ভিন্ন ভিন্ন চার্জ একে অন্যকে
আকর্ষণ করে", মহাকর্ষ, "ঋণাত্মক ভর বলে কিছু নাই"; চার্জ নিরপেক্ষ and "ইলেকট্রন আলাদা করার একটা উপায় হচ্ছে ঘর্ষণ" come from 10.1.

## How the figure works
- Ten steps in the book's order: glass (look, rub), plastic (look, rub), + + / − − / + − (take the rod, bring it near). Each waits
  for a tap on the numbered action, or on the part in its ring; the cloth and the rod can also be dragged (`createDragHandle`).
- Rubbing: every body starts with equal + and −. Each sign stands for a great many charges (the panel says so). One stroke moves
  nothing, then one electron per stroke: three in four strokes. Protons never move.
- The stands: only the rods are in the picture, thick (22 mm, against about 13 mm in a real lab), in the air over the blue. The
  rubbing table, its blocks and cloths are hidden there; the stands are hidden at the rubbing places. The camera looks from 54°
  above, so a turn about the vertical thread reads as an angle, and it is fitted on the line of the hanging rod. The stands stand
  behind the table on their own bases, with long arms, so nothing sits behind the rods.
- Signs at the stands: four spaced signs of extra charge per rod, as the book draws them, not the neutral pairs (the rule line says
  so). An insulator keeps its charge where it was rubbed, so they sit on the rubbed half.
- The swing: a Coulomb torque about the thread between point charges on the two rubbed ends (`src/physics.js`), softened because
  the charge is spread round a thick rod; a thread that twists back harder as it winds up; air drag. Arbitrary units: only signs and
  shapes are meant, and the turn is far bigger than a real one, so it can be seen. At the far end of its travel the rod in the hand
  has no effect at all (`heldReach`), so the hanging rod is truly at rest in the "before" steps.
- The force arrows and the বিকর্ষণ / আকর্ষণ label appear only once the rod is more than a third of the way in. Teal, outlined, one on
  each rod, equal and opposite. A dashed rest line and a curved arrow at the plain end show the turn, as the book does.
- Test: five questions. In the hidden rod's question the hanging rod is grey with no signs and the rod in the hand is glass or
  plastic at random; both are repulsions, because a neutral rod can also be attracted (that is 10.3's induction).

## Measured (844×390, software rendering)
- Whole scene (intro, shadows on): 32 draw calls, 26.2 k triangles. At the stands: 40 draw calls with charges, arrows and turn mark
  (12.4 k triangles); the rubbing places: 12 draw calls, 13.6 k triangles. The whole scene is about that, so no azimuth can exceed it.
- Real clock, 6× CPU throttle: rubbing 1.3 ms median, 2.3 ms p95 per animated frame; bringing near and the swing 1.1 ms median, 2 ms
  p95. 0 draws idle. Time to ready about 4 s under load.
- No `transmission`; shadow map 1024; textures 128 and 256; charges in two InstancedMeshes (two draw calls). Nothing allocated
  per frame in the swing, the charges or the labels' points; the turn mark shows its fixed arc with `drawRange`.

## Open questions
- The book draws square-section bars; the figure uses thick round rods. "দণ্ড" is the book's word.
- No hand is drawn: the rod "in the hand" floats and the student's own finger is the hand. The label says হাতের কাচ.
- The hanging rods are said to be charged "the same way" before the student sees them charged (the book says the same).
- ঘষা ১/৪ counts of 4 strokes and 3 electrons are the figure's; the book gives no numbers.
- The rule step's sentence on gravity is shortened from the book's paragraph.
