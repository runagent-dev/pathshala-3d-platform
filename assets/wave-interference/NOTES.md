# Notes: Superposition of water waves (তরঙ্গের উপরিপাতন)

Book: physics-9-10 › 7.2.1 › p192 (item (v) উপরিপাতন, চিত্র ৭.০৩) and p193 (the end of (v) and the নিজে করো with a
plate of water). Screenshots: `reference/page-192.png`, `reference/page-193.png`.

## What the page shows
Item (v) of তরঙ্গের বৈশিষ্ট্য: two waves of the same quantity, from two different places, arrive at one point; if one is
positive (ধনাত্মক) while the other is negative (ঋণাত্মক), what happens? "দুটো তরঙ্গ একটি আরেকটিকে বড় করে দিতে পারে
আবার একটি আরেকটিকে ধ্বংসও করে দিতে পারে।" চিত্র ৭.০৩ shows two columns: sine + sine in step = a sine twice as tall;
sine + the opposite sine = a flat line. Caption: "দুটি তরঙ্গ যোগ হয়ে আরো বড় তরঙ্গ হতে পারে, আবার একটি অন্যটিকে
নিঃশেষও করে দিতে পারে।" Items (i) (particles only vibrate in place) and (ii) (energy carried ∝ amplitude², double the
amplitude → four times the energy) are on the same pages; the নিজে করো (p193) has waves spreading on all sides from a
touched point in a plate of water.

## The one idea to teach
Where two waves meet, their displacements add: crest + crest makes a bigger wave, crest + trough cancels (নিঃশেষ), so
two dipping sources make a pattern of strong ridges and still lines on the water.

## Terms (as in the book)
তরঙ্গ, উপরিপাতন, বিস্তার (a), ধনাত্মক / ঋণাত্মক, নিঃশেষ, মাধ্যমের কণা ("মাধ্যমের কণাগুলো নিজ অবস্থানে থেকে শুধু
স্পন্দিত হয়"), প্রবাহিত শক্তি ("বিস্তারের বর্গের সমানুপাতিক"), তরঙ্গদৈর্ঘ্য λ, কম্পাঙ্ক f (7.2.3). Words the figure
adds: উৎস (source), শীর্ষ (crest) and খাদ (trough), কর্ক ক / খ / গ (the floating corks; not বল, which means force in
this book), স্থির রেখা (still line), যোগফল (sum).

## How the figure works
- **The scene** (metres, `units: m`): a real ripple tank on an iroko lab bench under a soft blue-grey to sand backdrop: a shallow tray
  (6.4 mm of water, so v = √(gh) ≈ 0.25 m/s) with a satin aluminium frame, rubber feet, a pale floor with a 2 cm grid,
  and sloped pale grey foam beaches inside the rim (they absorb the ripples, so nothing reflects back: the pattern stays
  clean). Above it a vibrator: two steel uprights clamped to the frame, a crossbar, two helical springs, a flat
  aluminium bar with a small blue motor and its brass eccentric weight (it turns once a cycle), two clamps with steel
  rods and white bead dippers. Two orange-painted corks (3 cm across) float on the water: **কর্ক ক** on the centre line,
  **কর্ক খ** on the second still line (paths differ by 1½λ). Nothing else in the view.
- **The physics** (`src/reading.js`, unit-tested): f = 5 Hz, v = 0.25 m/s, λ = v/f = 5 cm, dippers 15 cm apart (3λ; 10
  and 20 cm by `?gap=` / `set({ gap })`). Each dipper's ripple is y = a(r)·sin(ω(t − r/v)) with a(r) ∝ 1/√(r₀ + r)
  (the energy of a ring spreads over a longer circle), a front (and, after a dipper is lifted, a tail) that moves at v.
  The water's height is the plain sum. Cork খ is "প্রায় স্থির" (about 0.1a, not exactly 0, because the two ripples
  have travelled different distances and so fallen off a little differently: true of a real tank too).
- **The water** (`src/water.js`): computed on the GPU. A 200 × 148 grid (about 3 mm, 16 points a wavelength) whose
  vertex shader lifts each point by the sum of the two ripples (the same formula as `reading.js`); the fragment shader
  works out, per pixel, the exact slope (for the light), the colour from the height (crests light aqua, troughs deep
  navy, over a deep saturated blue), a calm grey-blue where the waves are present but cancel (the steady amplitude
  |a₁e^{−ikr₁} + a₂e^{−ikr₂}| is small), and faint white dashed lines exactly on the still lines (path difference ½λ,
  1½λ …, a constant 2–3 px on any screen, left out where they crowd by the dippers), labelled once "স্থির রেখা" on খ's
  line when the pattern has formed. The CPU only sets seven uniforms a frame. Right at a dipper the drawn ripple grows
  from zero over 3 cm and the light sees only a quarter of the drawn slope, so the steep rings by the beads no longer
  flash white. Heights are drawn 12 times taller and time runs 5 times slower; the picture says so in its bottom-left
  corner ("ঢেউ ১২ গুণ উঁচু, ৫ গুণ ধীর"). The GLB gets the same surface baked into a plain mesh.
- **The panel** (clean sheet): the row of words **১ম তরঙ্গ · ২য় তরঙ্গ · দুটো একসাথে**; one numbered action that follows what is on the
  water (শুধু ১ম উৎস চালাও → শুধু ২য় উৎস চালাও → দুটো উৎস চালাও → পানি শান্ত করো; each case keeps its number ১/২/৩, so
  the button never offers a case that is already running, also when a word or `set` chose it), with the same badge in a
  dashed ring on the dipper that changes (a tap on the dipper does it too); quiet pause/play and start-over. The
  result line gives the two corks' amplitudes in a ("বিস্তার: ক-তে ২a, খ-তে প্রায় ০") once the waves have reached both
  corks ("তরঙ্গ উৎস থেকে চারদিকে ছড়িয়ে পড়ছে…" until then). Under it a **live চিত্র ৭.০৩**: for each cork, the 1st
  wave, the 2nd wave and their sum (green, the chapter's displacement colour) against time, the last three periods,
  now at the right. The rule grows: the question (start) → (i) particles only vibrate in place (1st wave) → the 2nd
  wave alone also makes both corks bob (2nd) → the book's caption and crest/trough at ক and খ (both). Under the graph the book's (ii): "প্রবাহিত শক্তি বিস্তারের বর্গের
  সমানুপাতিক: বিস্তার ২a → শক্তি ৪ গুণ" (not on phones held upright, nor on short side panels). On a tall side panel
  (1280×800) the graph is 200 px with its axis words (বিচ্যুতি ↕, সময় (s) →). The small line
  under it: a = one wave's amplitude, λ = 5 cm, f = 5 Hz (hidden on phones held upright).
- **Keys**: → or Enter = the action, 1/2/3 = the words, Space or P = pause, R = start over. Dragging turns the view
  (no zoom); the start-view icon brings it back.
- **The test** (5 questions, every wrong choice a real mistake with its own note): crest meets trough at one point
  (one source running, so the picture doesn't give it away; the reveal runs both; wrong: doubles, like one wave, the
  trough wins); which cork bobs most (corks on a new row, one on a strong line, one on a still line, named at random;
  wrong: the other, both the same, both still); খ is still, what if the 2nd source is lifted (the reveal lifts it, খ
  bobs again; wrong: stays still, 2a, bobs once and stops); **read off the water**: cork গ on a new row, on a strong
  line or on a still line at random, either side: its amplitude (about 2a / about 0 / a / 4a, the still lines not drawn
  until the answer); double amplitude, how much energy (book (ii), 4 times; wrong: 2, √2 ≈ 1.4, 8). The graph's sum row
  shows "?" until the answer; on a phone held upright the test hides the graph so the 3D stays big.
- **Camera**: a three-quarter view from the front right, about 35° above (steeper than the 10–20° of lessons.md 42: a
  water surface seen lower hides its pattern), framed on the water; the top of the vibrator may run off the frame.

## Numbers (polish-pass §5)
28 draw calls, about 75 k triangles (the water 59 k), one 1024 shadow map fitted to the tank, canvas textures of 1024
at most. Round 2 moved the water to the GPU: before, about 30 k vertex updates (positions, normals, colours, a
1.8 MB upload) a frame on the CPU while waves moved; now seven uniforms a frame, the same draw calls and triangles.
The figure draws nothing when the water is calm or paused. On a slow device the time step is capped (the kit's 50 ms),
so the waves slow rather than jump.

### Polish 0.2.1 (measured with the chapter's perf script, 844×390, shadows on, software rendering)
| | before (0.2.0) | after (0.2.1) |
|---|---|---|
| draw calls / triangles (one capture, main + shadow pass) | 126 / 251 k | 126 / 251 k |
| ms per animated frame (the measure) | 53–55 | 1–2 |
| time to ready | 2.6–3.4 s | 2.7–2.9 s (same, within the machine's noise) |
| GLB (verify's export-glb) | 2.4 MB | 769 KB |

- The 53 ms was not JavaScript (a CPU profile shows about 1 ms of script a frame). The live graph was a 2D canvas, and
  every redraw of a 2D canvas waits for the GPU to finish the 3D view's previous frame (in software rendering, tens of
  ms). The graph is now SVG: built once per layout, and a frame moves six paths and six dots, so nothing waits.
- The water's wave sum (height, slope, steady swing) is now worked out once per vertex instead of once per pixel;
  the fragment shader only colours (and finds the dashed still lines, which need a pixel's own path difference).
- The look: the white blobs were the tank's floor showing through the troughs (the drawn ripples, 12 times taller, dipped
  below the 6.4 mm floor). The floor is now drawn 2.6 cm down, under any drawn trough. The water is clear and dark (low
  albedo, as real water), deeper-looking toward the middle, the pale floor faintly through the shallows by the beaches;
  Fresnel reflection of the studio environment and a small, sharp highlight (roughness 0.06) carry the ridges; no
  colour stripes painted from the height beyond a light tint. Brushed aluminium frame (fine lengthwise grain, a colour
  map so it shares the bench's shader and adds no start-up compile), matte foam (roughness 1).
- GLB: the water baked on an 8 mm grid (6 to a wavelength), and the tank's merged parts stored indexed in the file.

## Round 2 (after the independent review)
- Water on the GPU (above), deep saturated blue; no white glare round the dippers; pale, fine foam beaches; a lighter
  backdrop (blue-grey to sand).
- Nodal places a calm grey-blue, with faint dashed "স্থির রেখা" lines.
- The floats are কর্ক ক / খ (বল is force in this book), 3 cm across instead of 2.1, and the waves are drawn 12 times
  taller instead of 6: ক's bob is about 8 px from crest to trough at 390×700 (was about 4).
- The action follows what is on the water (the poster's two running sources now show "পানি শান্ত করো", not "শুধু ১ম
  উৎস চালাও").
- 1280×800: a taller graph with axis words and the book's "২a → ৪ গুণ শক্তি".
- Test: filler choices replaced by real mistakes, each with its note; the question on how a cork moves (book (i),
  still in the rule line) gave way to one read off the water.

## Open questions for the book team
- The book's pages do not name crest and trough; the figure says শীর্ষ (+) and খাদ (−), next to the book's ধনাত্মক /
  ঋণাত্মক. Should it be তরঙ্গশীর্ষ / তরঙ্গপাদ (older NCTB editions)?
- "১ম / ২য় তরঙ্গ" for the two waves, the floating corks ক, খ and গ, and "স্থির রেখা" are the figure's; the book draws
  only sine curves.
- The page's নিজে করো is about one touch and the reflection from the plate's rim; this figure stays on two sources and
  uses absorbing beaches (no reflections), so the one idea stays clean. A reflection figure could be a separate one.
- Speed of ripples: 0.25 m/s is for 6.4 mm deep water (√(gh)); real ripple tanks are of this order.
