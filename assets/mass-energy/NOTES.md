# Notes: Relation between mass and energy (ভর ও শক্তির সম্পর্ক)

Book: physics-9-10 › 4.6 › p119

## What the page shows
`reference/page-119.png`. Section ৪.৬ ভর ও শক্তির সম্পর্ক: Einstein's theory of relativity says mass and energy are the
same thing; a mass m fully turned into energy gives E = mc², c the speed of light (3 × 10⁸ m/s), "অনেক বেশী। সেটাকে
বর্গ করা হলে আরো বড় হয়ে যায়", so a little mass gives a lot of energy, and a নিউক্লিয়ার শক্তিকেন্দ্র does exactly this.
The fuel is ইউরেনিয়াম 235 (92 protons, 143 neutrons); natural uranium is only 0.7% U-235, with a half-life of
703,800,000 (704 million) years. A U-235 nucleus easily takes another neutron (if it is slow) and becomes completely
unstable (পুরোপুরি অস্থিতিশীল), splitting into ⁹²Kr and ¹⁴¹Ba with three more neutrons (চিত্র ৪.০৬, নিউক্লিয়ার বিক্রিয়ায়
শক্তি উৎপাদন: n from the left, the ²³⁵U ball of red and white nucleons, a yellow star "শক্তি", ¹⁴¹Ba and ⁹²Kr, three
n): ¹₀n + ²³⁵₉₂U → ⁹²₃₆Kr + ¹⁴¹₅₆Ba + 3¹₀n. The mass of the right side is less than the left; the missing mass came out
as energy by E = mc². The three neutrons come out very fast; once slowed, they split other U-235 nuclei, giving more
energy and more neutrons: চেইন রি-অ্যাকশন (Chain Reaction). The great heat boils water to steam, the steam turns a
turbine, and the generator makes electricity (continued on the next page).

## The one idea to teach
A tiny mass becomes a huge energy, E = mc², because c² is huge: in the book's reaction the right side weighs a little
less than the left, and that missing mass is the energy that comes out.

## Terms (as in the book)
ভর, শক্তি, শক্তিতে রূপান্তর, আলোর বেগ, বর্গ, নিউক্লিয়ার শক্তিকেন্দ্র, জ্বালানি, ইউরেনিয়াম ২৩৫, প্রোটন, নিউট্রন,
অস্থিতিশীল, দুটো ছোট নিউক্লিয়াসে ভাগ হয়ে যায়, বাম পাশ / ডান পাশ, ডান পাশে ভর কম, প্রচণ্ড গতিতে, গতি কমে আসার পর,
চেইন রি-অ্যাকশন (Chain Reaction), তাপশক্তি, বাষ্প, টারবাইন, জেনারেটর, বিদ্যুৎ, চিত্র ৪.০৬.

## How the figure works
- Three scenes from one row of words (the kit's clean sheet): **একটি নিউক্লিয়াস** (default), **চেইন রি-অ্যাকশন**,
  **শক্তিকেন্দ্র**. One big action button: নিউট্রন ছোড়ো / একটি নিউট্রন ছোড়ো / শক্তিকেন্দ্র চালু করো; its numbered badge
  rings the waiting neutron (or the reactor). The split and the chain are pure functions of time: replayed by the
  button, scrubbed by the slider beside it or the arrow keys.
- The nucleus is 236 balls (U-235 plus the neutron it takes) packed once (seeded). The top 141 become ¹⁴¹Ba (56 p),
  the bottom 92 become ⁹²Kr (36 p), three in the neck are the new neutrons: every ball is accounted for, as in the
  book's equation. It wobbles (growing stretch and squeeze), stretches into a dumbbell, splits; each fragment rounds
  off into its own packing. The fragments fly apart with equal and opposite momentum (Kr 141/92 times as far as Ba).
  The incoming neutron is slow (short streak), the three new ones fast (long streaks). A flash, a ring, and the book's
  yellow star with "শক্তি" (it stays in the final picture).
- The row under the scenes shows the book's equation with each side's mass under it (the right side's once it has
  split) and a small balance that tips to the heavier left. The result line: ডান পাশে ভর কম 0.1859 u = 3.09 × 10⁻²⁸ kg,
  then E = mc² = … = 2.78 × 10⁻¹¹ J. The rule grows from the U-235 facts to the book's sentence on the missing mass.
- Chain: 13 nuclei laid out as a tree (1 → 3 → 9), each first-step neutron leaving a faint trail to the nucleus it
  splits; a small 1 → 3 → 9 counter lights up as each step splits; the panel sums the energy (13 × 2.78 × 10⁻¹¹ J).
- Power plant at dusk on a river bank, reactor building and turbine hall cut open (said in the rule): control rods rise,
  the core glows blue (Cherenkov light) in its water, steam runs along the steam line, turbine and generator turn,
  power runs along the lines and a town's windows light up; the cooling tower's plume grows. Fuel m: 1 g, 10 g,
  100 g, 1 kg of U-235; "শক্তি হয়": 0.079% (split) or 100% (the book's "if fully converted"). E in J and how long a
  100 W bulb would glow on it.
- The plant is drawn to look real (v0.2.0), all procedural: golden paddy at harvest to the horizon haze, homesteads of
  trees and tin-roofed houses, a mud bank and country boats on the river; weathered concrete containment with its
  polar crane, steam generator, pressuriser and coolant pump; a hyperbolic cooling tower on its ring of legs; the
  ventilation stack, lattice pylons with insulator strings, a transformer with its fins and bushings; a town of flats
  with water tanks on the roofs. A dusk sky (low sun in the west) is both the background and what the materials
  reflect.
- The nucleus scenes stand in the deep blue water of a reactor pool (painted: light from the surface, the pool's lined
  wall, fuel assemblies glowing blue at the bottom): the nuclei are in the reactor's fuel. The first result line says
  nuclei are shown about 10¹² times bigger and much slower.

## Polish pass (2026-11-01, v0.3.0)
The owner's standard for every figure (docs/agents/polish-pass.md).
- **Layout.** 3D on top, the panel below (beside it only on short, wide frames, as the kit does). On a phone held
  upright the 3D view has 386 of 700 px (55 %, was 323): the result keeps two lines and the rule two (the rules were
  rewritten shorter, in the book's words); in the worked line E = mc² = … the units of the middle step are left out
  on phones (the answer keeps its unit), so it stays on one line; the test's questions were shortened to two lines.
  The panel keeps one height in every state, Bangla and English, at all six sizes (checked state by state, the test
  included).
- **Text on the 3D view.** Labels only. The corner notes went into the panel: "nuclei shown 10¹² times bigger and much
  slower" is the first result line of the single split (the action button already says what to do) and of the
  chain; "cut open to show the inside" is in the power plant's rule. 58 → 19 characters on the view at the start.
- **Setting and colour.** The reactor pool was a near-white wash; it is now deep clear water, light from the surface
  above, the pool's lined wall faint behind, the fuel assemblies glowing blue below, darker at the corners. The
  chain's neutron paths were blue on blue: now a pale line in a dark rim. Labels sit on solid white chips with a
  soft shadow; the energy colour is #a85700 (5.2:1 on white; #b86200 was 4.4:1). The dusk plant was already a
  proper setting.
- **Time to the first picture.** It was the slowest of the chapter (4.3 s on a quiet machine). Why: the whole power
  plant was built at the start although the figure opens on a nucleus — two dozen pictures painted pixel by pixel
  (each noise table filled through `Float32Array.from` with a function, about 260 000 calls each, for every
  texture), a 2048 px sky turned into reflected light, and two clear-coated physical shaders compiled before the
  first frame. Now: the plant is built in idle moments after the start (never while the split plays), a piece at a
  time, then its sky, then its shaders are compiled and its pictures uploaded, so the first tap on শক্তিকেন্দ্র is
  instant; the noise tables are filled with a plain loop and shared while the plant is built; the nucleons are one
  glossy standard shader (both have a skin), so one compile instead of two heavier ones.
- **Smooth, with the detail kept.**
  - The plant's ~700 still parts are merged by material (plain colours of a similar finish share one vertex-coloured
    material), in two sets: what casts a shadow and what doesn't. Its 24 town buildings are 6 meshes, one per style;
    each building's windows still light at their own moment, read in the shader from a number on its vertices. The
    turbine's 54 blades and the 5 control rods are one mesh each; the steam puffs, the plume and the sparks on the
    lines are one mesh each (sprites turned to the camera in the shader).
  - Shadows: PCF at 1024 px (was soft at 2048) in a box fitted round what is seen, seen from the sun; only parts
    whose shadow shows cast one (not the ground, floors, water, wires or decals, nor the far trees in the haze).
  - The fields' picture is 1024 px over 210 m (same 4.9 px a metre as 2048 px over 420 m); the sky 1024 × 512.
  - The chain's 13 nuclei use 8 × 7 spheres (each ball is a few pixels across there): 516k → 319k triangles.
  - Nothing is allocated per frame (camera framing, the flash light, fog, the shadow box); the DOM is written only
    when a value changes.

- **Measured** (headless Chromium, software GL, shadows on, 390 × 700; the machine was heavily loaded, so times are
  from back-to-back runs at the same load):
  | | before | after |
  |---|---|---|
  | time to the first picture | 25.6 s and 40.6 s (4.3 s on a quiet machine) | 0.9 s and 2.1 s |
  | draw calls, one nucleus (avg / max) | 39 / 72 | 27 / 49 |
  | triangles, one nucleus / chain | 126k / 516k | 126k / 319k |
  | texture memory at the start | 42.4 MB (largest 2048 px) | 10.4 MB (largest 1024 px) |
  | power plant running: draw calls (avg / max), triangles, textures | 771 / 1490, 639k, 138 MB | 97 / 104, 278k, 60 MB |
  | characters on the 3D view at the start | 58 in 4 boxes | 19 in 3 |
  The plant's textures are uploaded in the warm-up a moment after the start, so a probe that waits a few seconds
  counts about 50 MB in the nucleus scene too; the reflected light of its sky is made then (a few draw calls once).

## The numbers (checked)
- Atomic masses (AME2020, rounded to 4 places): n 1.0087 u, ²³⁵U 235.0439 u, ⁹²Kr 91.9262 u, ¹⁴¹Ba 140.9144 u. Left
  236.0526 u, right 235.8667 u, Δm = 0.1859 u = 3.09 × 10⁻²⁸ kg (1 u = 1.66054 × 10⁻²⁷ kg) → 2.78 × 10⁻¹¹ J ≈ 173 MeV,
  the known prompt energy of this channel. (Fission is often quoted as ≈ 200 MeV, "about 0.09%", because that also
  counts the fragments' later decays; the figure stays with the book's reaction.)
- c = 3 × 10⁸ m/s as the book rounds it (the exact 299 792 458 m/s changes E by 0.14%).
- Fraction of the uranium's mass: 0.1859 / 235.0439 = 0.079%. 1 g split → 7.12 × 10¹⁰ J ≈ 23 years of a 100 W bulb;
  1 g fully → 9 × 10¹³ J ≈ 29 000 years; 1 kg fully → 9 × 10¹⁶ J ≈ 2.9 crore years.
- Left out on purpose (one idea): matter–antimatter annihilation, chemical reactions, TNT equivalents.

## Open questions for the book team
- The book prints the equation and masses with Latin digits; the figure uses Bangla digits throughout (repo rule).
- "u" (পারমাণবিক ভর একক) is not on this page; the figure uses it for the two sides' masses. Should it be glossed?
- "চুল্লি" (reactor) and "জেনারেটর/টারবাইন" labels: the page says নিউক্লিয়ার শক্তিকেন্দ্র, টারবাইন, জেনারেটর; চুল্লি is added.
- The half-life (704 million years) and natural abundance (0.7%) are not shown (the half-life is a test distractor).
- The power-plant paragraph continues on page 120; this figure shows it as the third scene.

## Declutter (2026-11-01, v0.4.0)
- The nuclei float in calm, softly lit water (no fuel rods, light rays, ripples or wall plates behind them).
- The power plant keeps the reactor, the steam, the turbine, the generator, the lines and the town that lights up;
  the trees, palms, homesteads and boats round it are gone.
- The panel follows the order every lab uses: the examples, the action, the equation (or the fuel), the result, the
  rule; the old wide-frame grid is gone and the sideways-phone rules now apply to any narrow side panel (the three
  example names no longer run together at 844 × 390). No front/turn buttons: a drag turns the view (not during the
  test), a front icon brings it back.
