# Notes: Displaced water: a model ship (অপসারিত পানি: জাহাজের মডেল)

Book: physics-9-10 › 5.3.1 › p137 (with p138, 5.3.2). Sister figure: `buoyancy-ship` (same page and topic, `order` 1;
this one is `order` 2). The owner (2026-11-07) asked for অপসারিত পানি as its own figure, after their reference picture
(`reference/owner-ref.png`: an overflow beaker, a 200 g weight on a digital hanging scale lowered into it, the overflow
caught in a pot on a kitchen scale), "much easier", with a ship that takes containers instead of a block, and the
book's formula.

## What the page shows
`reference/page-137.png`, `reference/page-138.png`. 5.3.1 আর্কিমিডিসের নীতি এবং প্লবতা: "কোনো বস্তু তরলে নিমজ্জিত
করলে সেটি যে পরিমাণ তরল অপসারণ করে সেইটুকু তরলের সমান ওজন বস্তুটির ওজন থেকে কমে যায়।" চিত্র ৫.০৪ (a cylinder of
face area A, height h, in a liquid; "একটি বস্তু যতটুকু তরল অপসারিত করে তার সমপরিমাণ ওজন হারায়"), P₁ = h₁ρg,
P₂ = h₂ρg, F = F₂ − F₁ = A(h₂ − h₁)ρg = Ahρg, "Ah হচ্ছে সিলিন্ডারের আয়তন, ρ তরলের ঘনত্ব এবং g মাধ্যাকর্ষণজনিত ত্বরণ …
ঊর্ধ্বমুখী এই বলটিকে প্লবতা (Buoyancy) বলে।" Page 138, 5.3.2 বস্তুর ভেসে থাকা বা ডুবে যাওয়া: "ঠিক যে পরিমাণ ডুবে
থাকলে বস্তুর সমান ওজনের পানি অপসারণ করবে, ততটুকুই ডুববে, বাকি অংশটুকু পানিতে ডুবে যাবে না।"

## The one idea to teach
A body in water loses as much weight as the water it pushes aside; a floating ship has pushed aside exactly its own
weight of water (প্লবতা = অপসারিত পানির ওজন = জাহাজের ওজন), and each container added pushes aside exactly its own
weight more. F = Vρg.

## How the figure shows it
A lab table in the calm blue setting: a clear glass tank filled to the lip of its spout (an overflow can), a low glass
beaker with printed cm³ marks under the spout on a digital kitchen scale (ON/TARE), a lab stand whose arm holds a digital
hanging scale (UNIT/ON/TARE, as in the owner's picture), a toy cargo ship hanging from it by four cords to a ring, and
six toy containers of 50 g on the table. The displays are real LCDs with Bangla digits; the same numbers are on chips
beside them (the displays are small on a phone). Four steps, one tap each (the row of words ওজন · নামাও · প্লবতা ·
বোঝাই), each with a lead-in line, the result and the book's words:
1. **ওজন**: both scales come on (888 for a moment): the ship 200 g, the empty beaker 0 g. W = mg = 0.2 kg × 9.8 m/s² =
   1.96 N; ρ = 1 g/cm³, so 1 cm³ of water has a mass of 1 g (the key to reading the beaker in grams).
2. **নামাও**: the stand's arm slides down (5.2 s). As the hull goes under, the hanging scale reads less and exactly that
   much water runs out of the spout (a thin stream) into the beaker; the result line follows both live. It ends at 0 g on
   the hanging scale, 200 g in the beaker: the ship floats. The rule is the book's sentence. Then the arm can be dragged
   (kit drag handle, or ↑ ↓) both ways: lifting the ship lowers the tank's water below the lip and the beaker keeps its
   200 g ("বিকারের পানি আর ফেরে না"); lowering again refills the tank to the lip and spills nothing more.
3. **প্লবতা**: the cords are taken off and the scale goes up out of view; the ship floats on its own. ওজন W (violet,
   down onto the deck) and প্লবতা F (orange, up under the keel), equal, 1.96 N; V = 200 cm³ on the beaker; "অপসারিত
   পানি 200 cm³, তার ভর 200 g; F = Vρg = 0.2 kg × 9.8 m/s² = 1.96 N"; ঊর্ধ্বমুখী এই বলটিকে প্লবতা বলে.
4. **বোঝাই**: each tap (the button, or a tap on a container) lifts the next container over the glass onto the deck
   (1.7 s); the ship settles 0.5 cm deeper (1.4 s, smoothly: no bob, which would spill extra) and exactly 50 g more
   water runs out. Two bars, জাহাজ + মাল (the ship's navy and each container's colour) and অপসারিত পানি, stay the same
   length; the rule is p138's sentence, with V = Ah = 100 cm² × h (h on a chip by the hull's draft marks). At six the
   water is at the load line (5 cm), and the action becomes the test.

Optional "sinking" step (too much cargo): left out on purpose (the owner asked for it "only if it stays simple"; six
containers already reach the load line). Open question below.

## Numbers (honest, exact)
- The hull below the deck is a prism (straight sides, flat bottom, the bow pointed only seen from above), beam 5 cm,
  parallel part 16 cm, bow 6 cm (a parabola): waterplane A = 5 × (16 + ⅔ × 6) = 100 cm² at every draft, so V = Ah
  exactly. Keel to deck 6 cm, bulwark 0.8 cm; 22 cm long. Average density empty 200 g / 600 cm³ ≈ 0.33 g/cm³, the same
  as buoyancy-ship's 260 t / 800 m³ ≈ 0.33.
- Ship 200 g → h = 2 cm; each container 50 g → +0.5 cm; six → 500 g, h = 5 cm = the load line, 1 cm below the deck.
- Tank inside 27 × 12 cm (324 cm²), water 11 cm deep to the spout's lip; the beaker's inside radius is √(100/π) cm, so
  100 cm³ stand 1 cm high and the printed marks are 1 cm apart.
- The tank's water is tracked as a volume (`settle` in `src/reading.js`): while the cord holds the keel, the level is
  where the water round the hull fills the tank; anything above the lip runs out and is added to the beaker; the hanging
  scale reads the mass less the water pushed aside (ρ = 1 g/cm³), and once that reaches 0 the cord goes slack and the
  ship floats, pushing aside its own mass. Unit tests check reading + spilled = 200 g at every point of the lowering,
  spilled = mass afloat, +50 g per container, V = Ah, and the lift-back case.
- g = 9.8 m/s² (the book's); F in newtons with no false precision (1.96, 2.45 … 4.9 N).
- The bridle eyes and the containers are centred on the waterplane's centre (x = 0.95 cm), and the bridge is aft (unlike
  buoyancy-ship's big ship), so the model floats level with an even number of containers. With an odd number it would
  heel very slightly; the picture keeps it level (the draft and the spilled water are the same either way).
- The 50 g toy containers are small (3.9 × 2.3 × 2.3 cm): solid, weighted toys, not hollow boxes (marked "50 g").

## Terms (as in the book)
আর্কিমিডিসের নীতি, প্লবতা, তরল, নিমজ্জিত, অপসারণ / অপসারিত, আয়তন V, ঘনত্ব ρ, মাধ্যাকর্ষণজনিত ত্বরণ g, ওজন W,
ঊর্ধ্বমুখী, A, h, F = Ahρg (here F = Vρg with V = Ah), ভেসে থাকা, ডুবে যাওয়া (p138). Units as the book's examples
(kg, m/s², N; g, cm³ for the toy). Scene words not on the page: জাহাজ, কন্টেইনার, বিকার, ডিজিটাল নিক্তি / ঝুলন্ত
নিক্তি, নল, সুতা, হাতল, বোঝাই রেখা, উপচে পড়া পানি. The page writes উপর.

## Colours
Mass on the hanging scale violet (#6741d9 chip, as W); water blue (#1864ab); ওজন W #7048e8, প্লবতা F #e8590c (both as
buoyancy-ship); h grey. Arrows: flat colour, white outline, thin dark edge, drawn over the glass and water (as
torricelli-barometer-straw).

## Test (4 questions, every one read off the picture)
1. The ship part-way down, the hanging scale hidden ("---", "? g"): from the beaker's reading (60/80/120/140 g), what
   does the hanging scale read? (200 − w; wrong: the beaker's own number, 200 unchanged, 200 + w.)
2. Floating, scale 0 g: what carries the ship's weight? (প্লবতা; wrong: the cords, the tank's bottom (look: it does not
   touch), "nothing, the weight is zero".) The answer shows the two arrows.
3. 2 or 3 containers on board: read the beaker; one more container, how much in all? (+50; wrong: unchanged, +100, only
   50.) The answer loads it.
4. 1, 2 or 4 containers: read the beaker; the weight of that water = buoyancy in N? (Vρg; wrong: kg not × g, grams × g,
   ÷ g.)
The kit's quiz scores with numbers (choice indices); a browser test answers all four right and checks 4/4.

## Performance (0.1.0, headless Chromium, 844×390, shadows on)
- Per frame (renderer.info, shadow pass included), at 4 azimuths 90° apart: first screen 107 draws / 8.9k triangles;
  step ② 109 / 9.1k; step ③ and ④ (six containers) 105 / 7.6k. The same at every azimuth.
- 0 frames drawn while idle (also after an orbit, once the damping settles).
- The figure's own JS per animated frame at 6× CPU throttling (frame callbacks minus the `renderer.render` call):
  lowering median 0.7 ms, p90 2.4 ms, max 4.9 ms (345 frames); a container median 0.2, p90 1.8, max 4.1 ms. No shader
  is compiled on any step's first tap (15 programs before and after; later parts warmed with `stage.warmUp`).
- The displays are 256×128 canvases redrawn only when their number changes; the stream is one tube shown with a draw
  range; no geometry is made after load. Textures: 18 (the LCDs, two device faces, the beaker's marks 256², labels).
- GLB (ship with two containers, tank, beaker, kitchen scale): 316 KB. Ready in about 5 s on the software renderer.

## Open questions
- The sinking step (5.3.2: "যদি বস্তুটার ওজন অপসারিত পানির ওজন থেকে বেশি হয়, তাহলে সেটি পানিতে ডুবে যাবে"): a seventh,
  heavy load that sinks the ship? Left out to keep it simple; easy to add as a fifth step.
- Units: the toy works in g and cm³ (ρ = 1 g/cm³), the formula in kg, m/s², N, as the book. OK for the book team?
- Words not on the page (বিকার, ঝুলন্ত নিক্তি, নল, হাতল, উপচে পড়া পানি): please check.
