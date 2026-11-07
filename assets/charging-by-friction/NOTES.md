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
- Every body starts with equal + and −. Each sign stands for a great many charges (the panel says so). One stroke moves
  nothing, then one electron per stroke: three in four strokes. Protons never move.
- The hanging rod turns from a Coulomb torque about the thread between point charges on the two rubbed ends (`src/physics.js`), a
  weak thread twist and air drag, in arbitrary units: only the signs and shapes are meant. It is exaggerated to be seen, and the
  charge sits on the rubbed end because an insulator keeps it where it was rubbed.
- The force arrows and the বিকর্ষণ / আকর্ষণ label appear only once the rod is more than a third of the way in, so the "before" steps
  never give the answer away. Teal, outlined, one on each rod, equal and opposite.
- On a phone held upright the camera at the stands looks from the other side (azimuth −14° instead of 16°), so the rod in the hand
  runs up the narrow view rather than off its edge.
- Test: five questions. The hidden rod's question picks glass or plastic in the hand at random and hides the hanging rod's signs;
  both are repulsions, because a neutral rod can also be attracted (that is 10.3's induction), so an attraction would not settle it.

## Measured (844×390, load ~30, software rendering)
- 39 draw calls and 25.4 k triangles at most (shadows on); the whole scene is about that, so no azimuth can exceed it.
- Rubbing, 6× CPU throttle, real clock: 1.6 ms median and 3 ms p95 per animated frame. 0 draws idle.
- No `transmission`; shadow map 1024; textures 128 and 256; charges in two InstancedMeshes (two draw calls). Nothing allocated
  per frame in the swing, the charges or the labels' points.

## Open questions
- The book draws square-section bars; the figure uses round rods, as a school lab has. "দণ্ড" is the book's word.
- No hand is drawn: the rod "in the hand" floats and the student's own finger is the hand. The label says হাতের কাচ.
- The hanging rods are said to be charged "the same way" before the student sees them charged (the book says the same).
- ঘষা ১/৪ counts of 4 strokes and 3 electrons are the figure's; the book gives no numbers.
- The rule step's sentence on gravity is shortened from the book's paragraph.
