# Notes: Coin in water (পানিতে মুদ্রা)

Book: physics-9-10 › 9.1.1 › p246 (`order: 1`), the নিজে করো box with চিত্র ৯.০৩. Page image: `reference/page-246.png`.

## What the page shows
চিত্র ৯.০৩, two side views of a cup with a coin on its bottom. Left: the cup is empty; the eye's line of sight passes
the near rim and meets the far wall, a red "?" by the eye: the coin is hidden. Right: the cup is full of water; a ray
leaves the coin, bends at the surface away from the normal and goes over the rim to the eye; its straight-line
extension into the water ends at a raised grey bar, the coin as it looks. The text: "একটি কাপের মাঝে একটা মুদ্রা রেখে
সেটাকে সামনে এমনভাবে রাখো যেন সেটি দেখা না যায়। মাথা না নাড়িয়ে মুদ্রাটি কীভাবে দেখা সম্ভব? কাপে পানি ঢাললেই মুদ্রাটি
দৃশ্যমান হয়ে যাবে (চিত্র ৯.০৩)। প্রতিসরণের কারণে আলো বাঁকা হয়ে এসে তোমার চোখে পড়বে। তোমার চোখ ঐ বাঁকা আলোর দিক বরাবর
মুদ্রাটি দেখতে পাবে। শুধু তাই নয়, তোমার কাছে মনে হবে মুদ্রাটি বুঝি উপরে উঠে এসেছে।" (The caption prints "কাঁচের";
the activity is with water.)

## The one idea to teach
Water bends the light from the coin at the surface (away from the normal, water → air), so a coin hidden behind the
rim becomes visible when water is poured in, and it looks raised, closer to the surface than it is.

## Terms (as in the book)
মুদ্রা, কাপ, প্রতিসরণ, "আলো বাঁকা হয়ে এসে তোমার চোখে পড়বে", "বাঁকা আলোর দিক বরাবর", "মনে হবে মুদ্রাটি বুঝি উপরে উঠে
এসেছে"; from pp 244–245 (the same topic): লম্ব (chapter 9's word for the normal, never অভিলম্ব), আপতন কোণ θ₁, প্রতিসরণ
কোণ θ₂, প্রতিসরণের দ্বিতীয় সূত্র n₁ sin θ₁ = n₂ sin θ₂, ঘন মাধ্যম / হালকা মাধ্যম, "ঘন মাধ্যম থেকে হালকা মাধ্যমে যাবার সময়
আলো লম্ব থেকে দূরে সরে যায়" (চিত্র ৯.০২); পানি 1.33 (table ৯.০১). The page writes উপরে. Added by the figure, not on
the page: "মুদ্রা যেমন দেখায়" beside "আসল মুদ্রা" for the raised coin (the page's plain idea; the chapter's প্রতিবিম্ব /
অবাস্তব are 9.4's words, so not used here), "ধার" for the coin's edge (কিনারা is the cup's rim), "কাপটি কেটে ভেতর
দেখানো", "আলো আটকে গেল", "দেখা যায়", "ধার দেখা যায়", "তেরছাভাবে", the graph's words, "পানি বাড়াও-কমাও".

## How the figure works
- **The scene (cm):** a wide glazed tea cup (inner radius 5.2, inner depth 6.0, terracotta glaze outside, cream inside,
  a handle at the back), a 2.4 cm steel coin on its bottom, on a plain sand table top in the calm deep-blue setting.
  The eye is drawn on the 2D layer as the book draws it: an eye in profile with lids, iris and lashes in a soft patch
  of skin, no face; it always looks at the rim.
- **The steps** (one tap each; `TARGET` and `planFor` in `src/app.js`): a calm card (≤ 40 words; a shorter one at
  390×520) → ① "কাপটি কেটে ভেতরে দেখো": the front half of the cup fades away (1.8 s; a note "কাপটি কেটে ভেতর দেখানো"
  stays in the corner), the eye's line of sight is drawn past the rim (white dashes) and lands on the bottom beyond the
  coin, then the coin's light toward the eye, stopped by the wall (a red bar, "আলো আটকে গেল", "?" at the eye) →
  ② "কাপে পানি ঢালো": a steel jug comes in, tilts and pours (3.6 s of rising water); the light from the coin is traced
  every frame; it first meets the wall, and once there is about 3.9 cm of water it clears the rim and reaches the eye
  (a glow, the eye's iris lights, "দেখা যায়") → ③ "লম্ব আঁকো": the normal (লম্ব) at the point where the light leaves
  the water, then θ₁ (blue, in the water) and θ₂ (green, in the air) with their values; the panel gives
  1.33 × sin θ₁ = 1 × sin θ₂ in numbers and the second law → ④ "মুদ্রা কোথায় দেখায়?": the eye's line goes straight
  back through the surface (dashed amber) to a translucent ghost coin, raised; the panel gives the real and apparent
  depths, and on tall landscape panels a live graph. Then the test is offered. Every step can be replayed (▶) and the
  step words jump.
- **The student changes the water level** from step ② on: the kit's drag handle on the water's cut face, a drag along
  the water line, or ↑/↓ (0.2 cm). The panel follows the level, not the step: "আড়ালে" / "ধার দেখা যায়" /
  "দেখা যায়", the angles, and "এই পানিতে চোখ মুদ্রা দেখে না" when there is too little water for the image.
- **The light is exact** (`src/reading.js`): the point S where the light leaves the water is found by bisection so that
  n sin θ₁ = sin θ₂ and the bent ray goes exactly to the eye; the eye sees the coin if that ray passes over the rim.
  Unit-tested: Snell's law at S to 1e-9, θ₂ > θ₁, the empty cup hides the whole coin, n = 1 never shows it, the image
  lies on the eye's line.
- **Where the coin seems to be:** straight above the real coin, on the eye's line, at depth d·tan θ₁/tan θ₂ (d/n seen
  from straight above). That is where the rays from one point of the coin meet, traced back, for two eyes side by side
  (across the plane of the rays), so it is what a person with two eyes sees; the book's drawing places the raised coin
  further along the line (a sketch). At the full level: 5.2 cm real, about 3.0 cm apparent (the eye looks in at about
  52° from the normal, so the coin rises more than the d/n = 3.9 cm of looking straight down).
- **The eye is placed honestly**: with n = 1.33 a coin "just hidden" by the rim shows when water is poured, but not one
  hidden far behind it. So the eye's line of sight lands 0.8 cm beyond the coin's far edge (the book's sketch lets it
  reach the far wall, which with real water would never show the coin). The light drawn is from the middle of the coin;
  its far edge peeks out first, at about 1.4 cm of water ("ধার দেখা যায়"), the middle at 3.9 cm.
- **Drawing:** the rays, the normal, the arcs, the eye and the sight line are painted on a 2D canvas over the view from
  the exact points projected through the camera, in the chapter's style (amber with a dark edge and chevrons, the
  normal dashed slate, θ₁ blue, θ₂ green, the extension dashed amber), as in `refraction-of-light` and
  `total-internal-reflection`. Seen from behind the cup the drawing goes faint and the handle hides. `capture`
  composites the drawing.
- **The test** (4 questions, in this order so no scene shows a later answer): why the empty cup hides the coin; which
  way the light bends leaving the water (normal shown); θ₂ for θ₁ = 35° (the scene is set to the level where the light
  leaves at 35°, the θ₂ arc hidden until the answer; choices 50°, 26° n on the wrong side, 35° no bending, 40° measured
  from the surface); where the coin will look (the ghost appears with the answer). Each wrong choice has its own note.

## Look
Calm deep-blue backdrop (`BG ['#0b2a5b', '#123d7a']`) and a finite sand table top with a darker edge band, nothing
else. The cup is cut through its axis; the cut face is the cup's pale unglazed body with a thin glaze line. The water
is a translucent surface (scaled to the level, no new geometry) and its cut face (14 rows of vertices moved in place).
Short labels only on the 3D (চোখ, মুদ্রা / আসল মুদ্রা, ?, আলো আটকে গেল, দেখা যায় / ধার দেখা যায়, পানি, লম্ব, θ₁, θ₂, মুদ্রা যেমন দেখায়),
placed by the kit's annotations clear of the rays and of each other.

## Performance (0.1.0, headless Chromium, 844×390, shadows on)
Draw calls / triangles of one frame (shadow pass included), at 4 azimuths 90° apart: first screen 11–25 / 12–25k; step
① 27 / 16k; step ④ 48 / 18k; the heaviest, mid-pour with the jug: 63 / 30k. 0 draws while idle (the orbit included,
once damping settles). JS per animated frame during the pour at 6× CPU throttling: median 0.7 ms, p90 2.0 ms, max
3.0 ms (300 frames). Ready in about 3.7 s on the software renderer. Textures: a 256² coin face and a 4×256 backdrop.
Hidden parts of later steps (jug, stream, water, ghost) are warmed with `stage.warmUp`.

## Round 2 (after the independent review)
- **The 3D keeps one size in every state** at all six sizes (first screen, steps, the ধার state, every test question and
  the result): the calm card takes exactly the room of the steps' lead-in, result and rule (measured from a hidden
  stand-in, `fitCalm`), and the how-to row keeps its room, unseen, during the test. Measured: 390×700 315 px, 390×520
  202 px, 844×390 390, 640×400 400, 800×500 500, 1280×800 800 in all 16 states; no panel or page scroll.
- **The eye is closer**: (−8.7, 9.8), 65 % of the old distance along the same line of sight. Nothing the student sees
  changes (the light that just clears the rim is the same ray), the levels stay 1.36 cm (far edge) and 3.92 cm (middle);
  the camera box is tighter, so the cup is bigger, most of all at 390×520 (slimmer margins there too).
- **The coin's far edge (ধার)**: from 1.36 cm of water its light reaches the eye before the middle's; it is drawn as a
  second, thin ray, the eye says "ধার দেখা যায়", and the panel "মুদ্রার দূরের ধার দেখা যায়, মাঝখান এখনো আড়ালে".
  The main ray is the one from the coin's middle; the eye's place sets these "just hidden" levels (a design choice).
  At full water the coin's near edge still does not clear the rim, so the panel says "মুদ্রা দেখা যায়", not "পুরো".
- **Labels off the light**: "দেখা যায়" left of the eye; θ₁ left of the normal under the surface, θ₂ right of it above
  (the light runs the other way in each); the handle's word below it; labels of what is hidden go when the view is
  turned behind or to the side of the cup (the drawing fades there).
- Step ④ says "প্রায় ৩ cm" and why ("চোখ তেরছাভাবে দেখছে বলে এতটা উপরে"); the wide graph adds a dotted line for
  looking straight down (d/n). The graph stays on tall landscape panels only: at 800×500 only about 100 px are free.
- The eye icon: a smaller skin patch, a brow, the iris and pupil at the front, 1.3× on phones, a soft glow (not a yellow
  pupil) when the light arrives; tipped at most 30° so it stays upright.
- Test: Q3 no longer gives θ₁ in words: it is read off the picture (35°); Q1's wrong answers are also "how light goes"
  ideas (the light bends out of the cup; the eye's light can't reach the coin; no light comes from the coin).
- Title "Coin in water (পানিতে মুদ্রা)" (the book says মুদ্রা); the step word for ④ is "দেখায়"; the intro ends with
  the নিজে করো: "পরে তুমিও ঘরে একটি কাপ আর মুদ্রা নিয়ে করে দেখো।"

## Open questions
- The book's sketch has the line of sight meet the far wall; with water (n = 1.33) such a coin would never show. The
  figure places the eye where the rim just hides the coin (see above). Fine with the book team?
- Every Bangla line needs a person's check against the book.
