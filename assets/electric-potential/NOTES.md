# Notes: Electric potential (তড়িৎ বিভব)

Book: physics-9-10 › 10.6 and 10.6.1 › pp. 287–289

## What the page shows
চিত্র ১০.১৪ (p. 287): a positive charge q with radial lines, a line to a smaller test charge q₀, the arrow বিকর্ষণ বল on
q₀ and the dimension r. The text: bringing q₀ toward q needs work against the repulsion, more the closer it comes; no force
at infinite distance; V = W/q₀ (printed W/q), V(r) = kq/r, a scalar, 1 V = 1 J/1 C. 10.6.1 (no figure): charge flows because
of a potential *difference*, not its value; the crow on a high-voltage wire; workers from helicopters; the earth as zero
potential; earthing. Page pictures: `reference/page-287.png` … `page-289.png`.

## The one idea to teach
The potential at a point is the work done to bring a unit positive charge from infinity to there (V = kq/r); charge flows
only between points with a potential difference, like water between different levels.

## How the figure works
Five steps, one tap each (ring and numbered badge on the 3D, the same number on the action):
1. **আনা**: q₀ comes in at constant speed from 30 cm to 10 cm. Repulsion (teal) and the equal applied force (orange) grow as
   1/r²; the graph draws W. q₀ can then be dragged (handle, arrow keys).
2. **বিভব**: the same line's numbers change from nJ to V (W ÷ 2 nC); shells at 900, 450 and 300 V.
3. **তার**: B comes in, the wire is drawn, electrons run B → A until 1,050 V each. Panel columns level like water.
4. **কাক**: a crow lands on the wire: its potential is the wire's. No difference, no shock.
5. **মাটি**: a cable joins B to earth, electrons come up, everything at 0 V.

Numbers: q = 10 nC, R = 5 cm, q₀ = 2 nC, k = 9 × 10⁹, so V = 90/r (r in m): round volts at the rail's marks, honest lab sizes.
W in nJ is twice V in volts, so "W ÷ q₀" keeps the line's shape and changes only the numbers.

## Decisions
- **The rail is 30 cm, not longer.** With a 50 cm rail sphere A was 40 px on a phone. At 30 cm, seen from A's side, A is about
  78 px at 390×700 and the line runs away toward infinity.
- **q₀ never starts at infinity.** The graph's r axis has a break and an ∞ tick; a dashed tail comes down to W = 0 there, so
  the 600 nJ at the rail's far end is explained: that work was done on the way in.
- **Book slip:** V = W/q is printed; by its own definition it means W/q₀. The figure shows W/q₀.
- **Water** is the brief's comparison, not the book's: the columns, and one clause in the rule that says only that the flow
  stops when level. It says nothing about direction: water runs high to low, but these electrons run low to high (they are
  negative), the same effect as positive charge going from A to B. The rule says so once.
- **q₀ = 2 nC is not "very small"** beside 10 nC, as the book's test charge should be. The numbers treat it as if it did not
  disturb q (the sphere's charge stays put), and it is drawn big so a phone can show it. Chosen for W = 2V in round numbers.
- **Sphere B's 300 V** before any charge reaches it: A's field reaches B. Each sphere's potential is kQ/R + kQ′/d with the
  far sphere as a point charge (good to a few % at d = 6R). 1,800 V and 300 V give 1,050 V each. B stands on the 300 V shell,
  which stays until the wire comes, so B's 300 V is seen before it is read. The V graph runs up to A's surface at 1,800 V (level
  inside, on the same 0–2,000 V scale as the columns), so A's value is read off it at every size; a 3D label says it too where it fits.
- **Earthing** physically sends electrons up from the ground into A and B (they are positive): electrons move, protons don't,
  as in 10.2/10.3. The book's text says charge can go either way; the arrow here is what this charge sign gives.
- **The crow** is a small model, labelled "not to scale", not a cartoon: no face, the grey neck of the house crow.
- The helicopter workers are left out: same idea as the crow. The "ten thousand volts" warning is only words, in the lead-in
  line before the crow (tall panels).

## Terms (as in the book)
তড়িৎ বিভব, টেস্ট চার্জ q₀, ধনাত্মক আধান, বিকর্ষণ বল, অসীম দূরত্ব, সমবেগে, প্রতি একক টেস্ট চার্জের জন্য কৃত কাজ, স্কেলার রাশি, ভোল্ট,
বিভব পার্থক্য, ভোল্টেজ, ইলেকট্রন, হাইভোল্টেজ তার, কাক, শূন্য বিভব, ভূমির সাথে লাগানো (Earthing).
Added by the figure: প্রযুক্ত বল, গোলক A / B, পৃথিবী.

## Performance
Measured at 844×390, counted at the WebGL calls: 29 draw calls and 23.5 k triangles at the potential step, 34 and 27.9 k with
the crow. After turning the view (shadow pass redrawn): at most 90 draw calls and 58 k triangles. 0 draws in 1.5 s idle.
JS self-time per animated frame under 6× CPU throttling (CDP profiler, WebGL calls left out): bring 0.83 ms, potential 0.58,
join 0.47, crow 0.42, earth 0.53. Every step draws about 28 calls a frame. Under the virtual clock the software GPU falls
behind and some WebGL calls then block for tens of ms: that is the test machine's renderer, not the figure's JS.
A bead is 1 nC, so the charges, the labels and the columns change as each electron arrives (150 V a step, whole volts), not
every frame; the words and the graph are redrawn at most 15 times a second while a step plays.

## Open questions
- Should the book team want the helicopter workers too, a sixth step would need a new model; the crow makes the same point.
