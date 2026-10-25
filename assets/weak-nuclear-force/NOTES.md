# Notes: Weak nuclear force (দুর্বল নিউক্লীয় বল)

Book: physics-9-10 › 3.2.3 › p68 (screenshot: `reference/page-68.png`, the third section of the page)

## What the page shows
Page 68 has three short sections of the four fundamental forces, text only (no picture): 3.2.1 মহাকর্ষ বল,
3.2.2 তড়িৎ চৌম্বক বল, 3.2.3 দুর্বল নিউক্লীয় বল. The 3.2.3 paragraph, exactly:

> ৩.২.৩ দুর্বল নিউক্লীয় বল (Weak Nuclear Force): এটাকে দুর্বল বলা হয় কারণ এটা তড়িৎ চৌম্বক বল থেকে দুর্বল (প্রায়
> ট্রিলিয়ন গুণ) কিন্তু মোটেও মহাকর্ষ বলের মতো এত দুর্বল নয়। মহাকর্ষ এবং তড়িৎ চৌম্বক বল যেকোনো দূরত্ব থেকে কাজ করতে
> পারে কিন্তু এই বলটা খুবই অল্প দূরত্বে (10⁻¹⁸ m) কাজ করে। তেজস্ক্রিয় নিউক্লিয়াস থেকে যে বিটা (β) রশ্মি বা
> ইলেকট্রন বের হয় সেটার কারণ এই দুর্বল নিউক্লীয় বল।

## The one idea to teach
The weak nuclear force is weaker than the electromagnetic force (about a trillion times) but far stronger than
gravity; it acts only over a tiny distance (10⁻¹⁸ m), and it is why a radioactive nucleus shoots out a beta (β) ray,
an electron.

## Terms (as in the book)
দুর্বল নিউক্লীয় বল, তড়িৎ চৌম্বক বল, মহাকর্ষ বল, দূরত্ব, 10⁻¹⁸ m, তেজস্ক্রিয় নিউক্লিয়াস, বিটা (β) রশ্মি, ইলেকট্রন,
ট্রিলিয়ন গুণ. From the neighbouring sections: পাল্লা (range: "মহাকর্ষ বলের পাল্লা অসীম"), সবল নিউক্লীয় বল (3.2.4).
Also used, from the students' chemistry: প্রোটন, নিউট্রন, পরমাণু.

## How the figure works
- **The hero, β emission**: a radioactive nucleus, 6 protons (red, "+") and 8 neutrons (grey), as in carbon-14 (a
  real β emitter; not named in the figure). Tap it (the first-use hand points at it) or press "β রশ্মি দেখো": a
  green spark where the weak force acts inside one neutron, the neutron turns red with a "+" (now a proton), and an
  electron (blue, "−") shoots out in a straight line, leaving a track; a click as it leaves. The panel says it in the
  book's words and counts protons 6 → 7, neutrons 8 → 7. "সময় অনেক ধীর করে দেখানো" in the corner.
- **How short the reach is**: three zoom stops (chips): পরমাণু (the cloud, with a line "পরমাণু: প্রায় 10⁻¹⁰ m",
  and "the electromagnetic force pulls the electrons"), নিউক্লিয়াস, দুর্বল বলের পাল্লা (the zoom dives a thousand
  times into the neutron: a green sphere of radius 10⁻¹⁸ m, "a neutron is about a thousand times bigger"). A scale
  bar (always a power of ten) follows the zoom, so the student sees 10⁻¹⁵ → 10⁻¹⁶ → 10⁻¹⁷ → 10⁻¹⁸ m go by. With
  the pointers on, the figure opens on the atom and zooms into the nucleus by itself.
- **Strength**: a strip "চার মৌলিক বল ও পাল্লা", weakest first (forces.json order and colours), the weak force
  filled in, each with its range (অসীম / 10⁻¹⁸ m / অসীম / 10⁻¹⁵ m), and the book's sentence under it. No numeric
  strength scale (see the open question).
- **Test (5 questions)**: which force causes the β ray (the emission plays with a neutral spark and no force label);
  what the β ray is (electron / proton / neutron / light) or how many protons are left after it (the labels give
  "প্রোটন: ৬টি", "নিউট্রন: ৮টি"; the answer then plays and the numbers change); the range (10⁻¹⁸ /
  10⁻¹⁵ / 10⁻¹⁰ m / any distance, the sphere's label hidden) or which of gravity and the weak force acts from far
  away; strength ("called weak, but stronger than which?" or where it goes when the four are ordered); where it acts
  (book examples of the other forces as wrong answers). Worked answers lead with the answer and name the mistake.
- Sizes are honest where they can be: the nucleus (radius about 2.9 fm) and the reach (10⁻¹⁸ m) are to scale with
  the scale bar; at the atom stop the nucleus and electrons are drawn much bigger (the note says so).

## Decisions
- The scene is drawn in femtometres. The camera never moves through the powers of ten: each frame the world is
  scaled by 1/R and shifted so the point looked at is at the origin (as in si-prefixes).
- The book says only that β rays are electrons and that the weak force causes them. The figure adds one step
  students can count: a neutron becomes a proton when the electron leaves. It does not show the antineutrino that
  also leaves (not in the book; see the open questions), and the panel never writes it as an equation.
- The weak force's reach is drawn round a point inside the changing neutron (where the change happens). Quarks
  are not shown (not in the book).
- GLB: the nucleus only (6 protons, 8 neutrons), with the scene's femtometres written as millimetres: the file is
  10¹² times life size (a nucleus about 6 mm across), since a model at its real size (10⁻¹⁵ m) shows nothing in
  any viewer. The β parts, the atom and the reach sphere are not exported.

## Open questions
- The book's strength numbers do not agree (3.2.2: EM is 10³⁶ × gravity; 3.2.4: strong is 10⁴¹ × gravity and
  100 × EM, which would make it 10³⁸ × gravity). The four figures show strength only as an order (forces.json) and
  quote each section's own sentence. For the book team.
- β decay also gives out an antineutrino; the book does not mention it, so the figure does not either. Should a
  later edition say "an electron (and a very light particle)"?
- The book writes 10⁻¹⁸ m with Latin digits; the figure follows the repo rule (Bangla digits, ১০⁻¹⁸ m). A person
  should confirm that this reads naturally.
