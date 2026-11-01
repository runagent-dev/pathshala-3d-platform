# Notes: Laws of falling bodies (পড়ন্ত বস্তুর সূত্র)

Book: physics-9-10 › 2.8 › pp. 48–49 (`reference/page-48.png`)

## What the page shows
Topic 2.8 has no picture: the text says that g is the familiar example of uniform acceleration, then states
Galileo's three laws in a box (from rest, without hindrance: equal distances in equal times; v ∝ t; h ∝ t²). Page 49
writes the equations of motion with h and g (v = u + gt; h = ut + ½gt²; v² = u² + 2gh), says Galileo's laws are
nothing but these, and explains the paper and the stone: in daily life the stone lands first because of air
hindrance; in a tube without air the paper and the stone land together, because there is no mass in the equations.

## The one idea to teach
Without air's hindrance every body, heavy or light, falls the same way: the same distance in the same time,
v ∝ t and h ∝ t² (v = gt, h = ½gt² from rest); a paper falls slower than a stone only because of air.

## Terms (as in the book)
পড়ন্ত বস্তু, মাধ্যাকর্ষণজনিত ত্বরণ (g), সমত্বরণ, স্থির অবস্থান, বিনা বাধায়, মুক্তভাবে পড়া, সমান সময়ে সমান পথ
অতিক্রম, সমানুপাতিক, প্রথম / দ্বিতীয় / তৃতীয় সূত্র, (নিম্নমুখী) অতিক্রান্ত উচ্চতা বা দূরত্ব (h), বেগ (v), বাতাসের
বাধা, বাতাসহীন টিউব, ভর, গ্যালিলিও. The figure writes "দূরত্ব h" (law 3: "দূরত্ব (h)"), since the scale counts
downward from the start and an everyday "height" would be 0 at the floor. Units are the book's SI symbols: s, m/s,
ms⁻², m, cm (one place: `UNITS` in `src/i18n.js`); Bangla words stay in sentences ("০.৩ সেকেন্ডে").

## How the figure works
- The book's own experiment as the hero: two clear tubes of the same height (0.441 m inside, 15 cm wide, real size),
  one open (বাতাস আছে) and one sealed with a valve (বাতাসহীন, "the air was pumped out"). Each holds a small stone
  (6.8 cm pebble) and a piece of exercise-book paper (7 cm square) on a shutter at the same height. The red button on
  the release box on top of the scale (or a tap on a tube's top, or ছেড়ে দাও) opens both shutters at once.
- The camera frames the falls only (felt pads to the bodies): the wooden base and the valve may run off the edges, so
  the bodies are big on a phone (stone about 37 px wide at 390×700, 20 px at 390×520, 40 px at 844×390).
- Real physics, shown 8 times slower (the note says so): without air both bodies fall freely (h = ½gt², down in
  exactly 0.3 s); in air the drag ½ρCAv² gives h = (vt²/g)·ln cosh(gt/vt) with terminal speeds 47 m/s (stone: lands
  0.1 ms later, invisible) and 1 m/s (flat paper, which also flutters: lands at 0.51 s). The crumpled paper (same
  mass, a 2.8 cm ball) has vt ≈ 4.2 m/s and lands at 0.31 s, "almost with the stone". All in `src/fall.js`,
  unit-tested.
- In the empty tube a faint picture of both bodies is left every 0.1 s, with an orange dashed line across the
  centimetre scale (h read on the scale: 4.9, 19.6, 44.1 cm) and a blue velocity arrow ending at each line (lengths
  1 : 2 : 3, labelled "বেগ v"). The panel's table fills in t, v = gt and h = ½gt² with "×1 ×2 ×3" and "×1 ×4 ×9";
  under it the book's laws ("দ্বিতীয় সূত্র: v ∝ t", "তৃতীয় সূত্র: h ∝ t²") and equations (v = u + gt,
  h = ut + ½gt², u = 0 from rest); after landing the panel states the first law.
- Actions: ছেড়ে দাও / থামাও / চালাও / আবার ছেড়ে দাও; "০.১ সে" plays one 0.1 s step and stops (arrow keys step
  forward and back); কাগজ দলা পাকাও swaps both papers for crumpled ones (and back), marked in the panel as a
  "বাড়তি পরীক্ষা" (an extra the book doesn't do).
- Test (5 questions, from: where the hidden paper is in the empty tube when the stone is at the 0.2 s line; why the
  paper lags in air (scene frozen when the stone lands); v from v = gt or from the arrow at 0.1 s; h from ½gt² or
  from the scale at 0.1 s; the ratio of distances or velocities after 1, 2, 3 s; a 1 kg and a 5 or 10 kg ball).
  Wrong choices are the usual mistakes (½gt² for v, no ½, no square, 1 : 3 : 5, "a little sooner" for the heavier
  ball, g smaller in air, the paper lagging as it does in air…), each with its own note in the worked answer.

## Open questions
- The book has no picture for 2.8; the tube experiment and the crumpled paper are our choices (the crumpled paper
  is not in the text, but shows "air, not mass" with the same object).

## Polish pass (2026-11-01, v0.2.0)
Against `docs/agents/polish-pass.md`.
- **Layout.** The 3D on top and the panel below at every size but the kit's short-and-wide one (844×390, 640×400);
  nothing in this figure's CSS moves the panel. On a phone held upright the panel is tighter (line heights in the
  table and the laws, 4 px between rows, the test's choices 42 px, its head 34 px): the 3D view has 389 of 700 px
  (55.6 %, 53.4 % before). The panel keeps one height in every state (ready, falling, the empty tube down, paused,
  done, crumpled) and every question of the test, in both languages and at all six sizes; the English test lines
  were shortened so they fit the same room as the Bangla (they made the view jump by up to 42 px).
- **Text on the 3D.** The corner note "সময় ৮ গুণ ধীর (করে দেখানো)" left the picture: the panel's line says it while
  the bodies fall ("পড়ছে (সময় ৮ গুণ ধীর করে দেখানো)…"). Left on the view: the short names (পাথর, কাগজ, বাতাস আছে,
  বাতাসহীন) and, after a release, the times at the lines and "বেগ v". Text on the 3D at the start: 39 characters in 5 boxes →
  25 in 4 (390×700; 50/5 → 25/4 at 844×390).
- **Setting and arrows.** The white page became the teacher's desk in a classroom (`src/scenery.js`, canvas
  textures): a large slate blackboard behind the apparatus (chalk dust, eraser swipes, wiped-off lines, and at its
  sides two chalk sketches without words: Galileo's leaning tower with a big and a small ball, and a tube with a
  feather and a coin beside a strobe column of dots), its frame and chalk ledge, an ochre wall with a dark red dado,
  a teak desk with drawers, a red-oxide floor. On the desk, right of the empty tube, the vacuum pump that emptied it
  (motor, pump head, a gauge with its needle at vacuum), its red rubber hose pushed onto a new nozzle on the valve and
  routed above the speed arrows. The dark board lets the clear glass, the cream paper, the stone and the orange lines
  read; the release box is pale enamel and its wires cream (they were dark on dark), the felt pads burgundy (no
  green), the glass clearer (opacity 0.2 → 0.1), the pictures of the fall pale with paler edges. The speed arrows are
  bold flat blue in a white outline, drawn over the picture (`src/arrows.js`, as in balanced-forces); the dashed lines
  are a little thicker and brighter orange. The turned view stays in front of the board and above the desk (orbit
  limits; the room beyond is a warm grey).
- **Smooth, same detail.** The kit's material set (brushed-steel and wood canvases at 512–1024 px with mipmaps, made
  for millimetre instruments) is no longer built: plain polished steel and brass that take their look from the room's
  reflections, and a 256 px wood. The scale's face is one 128 × 1024 canvas (ticks, numbers, unit) instead of an
  instanced mesh of ticks and six text meshes. The still parts of the apparatus (base, release box and wires, the
  tubes' collars, rings, caps, valve, pads and glass, the scale's foot) are merged into one mesh per material
  (`src/merge.js`), the classroom into a few (one vertex-coloured mesh for all its plain parts). PCF shadows at 1024
  in a box fitted from the light round the apparatus, the pump and where their shadows land (VSM at 2048 on a loose
  box before, every opaque part casting); only the base, the collars, the scale, the box and the bodies cast, the
  desk, the board, the base and the pads receive. No allocation per frame in the dashed lines. Measured (headless
  Chromium, software GL, shadows on, 390×700; the same for 844×390): draw calls avg 116 / max 138 → 101 / 123,
  triangles max 34k → 38k (the classroom and the pump added, the apparatus merged), texture memory 58 MB (largest
  2048) → 18.5 MB (largest 1024), frames drawn while idle 0/s → 0/s, loaded 1246 → 1281 KB, time to ready (both
  measured back to back on a loaded machine) 4.5 s → 1.6 s.
- **Bugs.** A three.js warning at every load (a polyhedron made non-indexed twice) is gone. The English test no
  longer changes the 3D view's height between questions; its two-line choices no longer overflow their buttons on a
  phone held sideways.
