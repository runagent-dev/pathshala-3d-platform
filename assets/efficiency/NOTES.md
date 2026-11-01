# Notes: Efficiency (কর্মদক্ষতা)

Book: physics-9-10 › 4.8 › p121 (chapter 4, কাজ, ক্ষমতা ও শক্তি). Page image: `reference/page-121.png`.

## What the page shows

Text, two formulas and a worked example (no picture). Transcribed:

- Heading: **৪.৮ কর্মদক্ষতা (Efficiency)**.
- "আমরা একটু আগে বলেছিলাম যে শক্তিকে এক রূপ থেকে অন্য রূপে রূপান্তরিত করার বেলায় সব সময়ই খানিকটা শক্তির অপচয় হয়।
  কাজেই সব সময়েই আমরা যে পরিমাণ কাজ করতে চাই তার সমপরিমাণ শক্তি দিলে হয় না, একটু বেশি শক্তি দিতে হয়। … সব সময়েই দেখা
  যায় সেগুলোতে ঘর্ষণ বা অন্যান্য কারণে শক্তির অপচয় হয়। সেজন্য প্রায় সময়ই একটি যন্ত্র বা ইঞ্জিন কতটুকু দক্ষতার সাথে শক্তি
  ব্যবহার করছে আমাদেরকে তার পরিমাণ করতে হয়। সেজন্য আমরা কর্মদক্ষতা বলে একটি নতুন রাশি ব্যবহার করে থাকি। কর্মদক্ষতাকে
  শতকরা হিসাবে এভাবে লেখা যায়:"
- কর্মদক্ষতা হচ্ছে: **= কাজের পরিমাণ / প্রদত্ত শক্তি × 100%** **= (প্রদত্ত শক্তি − শক্তির অপচয়) / প্রদত্ত শক্তি × 100%**
- **উদাহরণ.** প্রশ্ন: 1000 W এর একটি মোটর ব্যবহার করে 15 s এ একটি 100 kg ভরের বস্তুকে 10 m উপরে তোলা হলে শক্তির
  অপচয় কত? কর্মদক্ষতা কত? উত্তর: কাজের পরিমাণ: 100 × 9.8 × 10 J = 9,800 J; প্রদত্ত শক্তি: 1000 × 15 J = 15,000 J;
  শক্তির অপচয়: 15,000 J − 9,800 J = 5,200 J; কর্মদক্ষতা = 9,800 J / 15,000 J × 100% = 65.3%.
- "তোমরা শুনে অবাক হবে একটা বিদ্যুৎকেন্দ্রে বিদ্যুৎ উৎপাদন করার সময় প্রতিটি ধাপেই শক্তির অপচয় হয় এবং সবগুলো অপচয় হিসেবে
  নেওয়ার পর বিদ্যুৎকেন্দ্রের কর্মদক্ষতা 30% এ নেমে আসতে পারে।"

The page writes "উপরে তোলা" (উপর), and the units as Latin symbols (W, s, kg, m, J), as the figure does.

## The one idea to teach

Whenever a machine turns energy into work, some energy is always wasted (here as heat and sound); efficiency is the
part that does work, কাজের পরিমাণ / প্রদত্ত শক্তি × 100%, always under 100%.

## How the figure shows it

The owner's reference (`/root/pathshala-3d/images/ref-efficiency-motor-gears.png`: a battery IN, red and blue leads, a
small DC motor, a worm and spur gears to the output OUT) built as the book's example: a 1000 W motor on a rooftop winch
lifts 100 kg of bricks 10 m from the street. The owner asked for the waste to be shown very properly, vividly, with an
interactive formula.

- **The machine.** A 48 V battery (IN) with a display (P and t) and a rotary switch, red (+) and blue (−) cables, a blue
  finned motor with a window onto its copper windings and turning rotor, a steel worm (single start) on a bronze worm
  wheel (20 teeth: 20 : 1), a 14-tooth pinion on a 42-tooth gear (3 : 1), a yellow drum (rope at 0.12 m) and a pulley
  on a jib (OUT). All involute teeth, in mesh at every moment (the wheel's tooth sits in the worm's thread gap; the big
  gear's gap faces the pinion's tooth). For 10 m in 15 s the drum turns at about 53 rpm and the motor at about 3,200 rpm,
  a real motor speed, so the worm is a blur, as it would be.
- **Where the energy goes, on the scene.** Beads of current run out along the red cable and back along the blue
  (প্রদত্ত শক্তি); the load rises (কাজের পরিমাণ, with a height gauge on the right of the view, since only the last metre is
  in view); heat shimmers off the motor and the windings glow, sparks and a warm glow at the two meshes, purple rings of
  sound from the gears (শক্তির অপচয়). Each effect's strength follows its share of the wasted power.
- **The result line** is a flow (Sankey) diagram: প্রদত্ত শক্তি in, splitting into কাজের পরিমাণ and শক্তির অপচয়, which fans out
  into মোটরে তাপ, ঘর্ষণে তাপ and শব্দ. Grey with "? J" before the first run (so it never shows the answer first); the numbers
  grow while it runs. **The rule** is the book's formula with the numbers (the second form with "অন্যভাবে লেখো"); each
  term is a button that rings its part of the machine.
- **Three motors** (the row of words): the book's (15 s → 65.3%), oiled gears (14 s → 70%), worn gears (20 s → 49%).
  The motor always takes 1000 W; less waste means the same 9,800 J of work sooner, so less energy is supplied. Once two
  are found, the rule adds the book's power plant (30%).
- **উদাহরণ** opens the book's worked example as a sheet: the question in the book's words, steppers for P, t, m, h, the
  answer line by line in the book's layout (both forms), "বইয়ের উত্তর" on the book's numbers, a warning when the work
  would be as large as the energy supplied (it can never be: 100% is impossible), and "যন্ত্রে চালিয়ে দেখো" runs the
  numbers on the machine.
- **Test** (5 of 6, shuffled): the efficiency and the waste from two labels on a frozen scene, the energy supplied from
  the motor's power and time, where the heat comes from, what oiling does, the power plant's 30%.

Colours: প্রদত্ত শক্তি blue #1c6fd9 (the current), কাজের পরিমাণ green #2b8a3e (the load going up), শক্তির অপচয় orange
#e8590c, split as মোটরে তাপ #f76707, ঘর্ষণে তাপ #e03131, শব্দ #7048e8. Every colour also has its word.

## Honest about what the book doesn't give

- **The split of the waste** between the motor's heat, friction in the gears and sound is the figure's own
  illustration (book: 2,250 J + 2,850 J + 100 J = 5,200 J), marked ≈ on the flow's three parts and said in the
  rule while it runs ("… অপচয় হচ্ছে (ভাগ আনুমানিক)"). The total is always exactly input − work. Sound is kept tiny on purpose (it is in real machines).
- **The oiled (14 s, 70%) and worn (20 s, 49%) motors** are the figure's own, chosen so the times are whole seconds.
- The load rises at a steady speed (no speeding up at the start); the motor takes 1000 W from the first moment.
- Words not on the page: ব্যাটারি, সুইচ, ওয়ার্ম গিয়ার (only in the aria text), তাপ, শব্দ, ঘর্ষণে তাপ, মোটরে তাপ, সাধারণ গিয়ার,
  তেলযুক্ত গিয়ার, ক্ষয়প্রাপ্ত গিয়ার (the three motors' names).

## Terms (as in the book)

কর্মদক্ষতা, কাজের পরিমাণ, প্রদত্ত শক্তি, শক্তির অপচয়, ঘর্ষণ, যন্ত্র, ইঞ্জিন, মোটর, ভর, বস্তু, উপরে তোলা, উদাহরণ, প্রশ্ন, উত্তর,
বিদ্যুৎকেন্দ্র, শতকরা (%), g = 9.8 m/s².

## Open questions for the book team

- The waste split and the two extra motors are illustrations (above): acceptable, or show only the total?
- Is "ব্যাটারি" right for a 1000 W supply (the owner's reference shows a battery), or would "বিদ্যুৎ সরবরাহ" be better?

## Polish pass (2026-11-01, 0.2.0)

Against `docs/agents/polish-pass.md`:

- **Layout.** The kit's frame: the tinted panel is gone (white, like every figure). The panel is lower: a thinner
  flow (58 px on phones), the rule kept to the formula and one or two lines, tighter gaps, two lines for a question;
  on wide frames the flow and the formula side by side with the book's sentence on one line under them. The 3D gets
  54 % of 390×700 (was 46 %), 55 % of 800×500 (was 45 %), 71 % of 1280×800 (was 65 %), 44 % of 390×520 (was 40 %);
  the second form of the formula and every state keep the same height. No CSS of its own moves the panel.
- **Text on the 3D view.** The note "অপচয়ের ভাগ … আনুমানিক" left the view (≈ on the flow's parts, "(ভাগ আনুমানিক)" in
  the rule). Labels are short names: "কাজ: বোঝা উঠছে" is now "কাজের পরিমাণ"; the term rings say only the term
  ("শক্তির অপচয়", not "শক্তির অপচয়: মোটরে ও গিয়ারে"). The rule's sentences are shorter (one line at 800 px, two on a
  phone) and so are the longest worked answers (three lines on a phone). Left on the view: the gauge ("উচ্চতা",
  "৯.৭ m") and, while it runs, প্রদত্ত শক্তি, তাপ, ঘর্ষণ, শব্দ, কাজের পরিমাণ.
- **Colour.** The roof is cast concrete in a warmer mid grey with formwork seams, tie holes and damp patches (it read
  as near-white); the houses are stronger Dhaka colours (no near-white or mint ones). Labels: their colour on a solid
  white chip rimmed in the same colour, every text colour at least 4.5 : 1 (the blue, green and orange went a shade
  darker); the term ring is dashed in a white halo, its word white on the dark colour; the gauge is a solid chip.
  There are no 3D arrows in this figure.
- **Smooth.** The site is merged into about fifteen meshes: plain-coloured parts carry their colour in the vertices
  and share three materials, the twelve houses' faces are one 1024 px atlas, the clouds one mesh (`src/bake.js`). The
  winch's static parts (skid, battery, motor body, bearings, jib, cables) are one mesh per material, each moving part
  (rotor, worm shaft, wheel, drum, pulley, hook) merged in its own frame, the four slings one instanced mesh, the 18
  beads of current one points mesh read from a table, the heat haze one mesh. Standard instead of physical
  (clear-coat) materials, a slightly lower roughness keeping the gloss. The shadow frustum fitted to the winch
  (3.5 m, was 4.4 m) at 512 px (was 1024); only the winch casts, the ropes and its labels don't; the street and the
  houses don't receive. Nothing allocated per frame (the rope round the pulley was a new torus every frame; label
  points made new vectors), the rule written only when its words change, the flow's bands only when their shape
  changes, the gauge and the ring only on change; the figure no longer asks for a redraw when the camera turns (the
  stage does that). A held start (`hold=1`, the poster) draws once and waits instead of animating the waste.
- **Bugs.** The friction label asked for spots that did not exist (`SPOTS.down`), so it fell anywhere; the rule was
  rewritten ten times a second while running, so a focused term button lost the keyboard focus; the friction and
  sound labels showed during the test; a held start kept the flow's stripes moving; switching to oiled gears changed
  the shader (clear coat on and off), a hitch on slow phones.

Measured (headless Chromium, software GL, shadows on, 390×700; the machine was very busy, so times are noisy):

| | before (0.1.1) | after (0.2.0) |
|---|---|---|
| draw calls avg / max (idle) | 396 / 418 | 116 / 138 |
| draw calls per frame while running | 406 | 107 (214 with the shadow pass) |
| GPU time per running frame (gl.finish) | 8–17 ms | 4–5 ms |
| triangles max | 77k | 82k (hoops on the drums) |
| texture memory | 21.2 MB | 15.7 MB (shadow map 512, one atlas) |
| the poster's screenshot (1280×800, CI's visual step) | 24–31 s | 0.7–2.5 s |
| time to ready | 2.5–4.5 s | 2.2–4.5 s (same within noise) |
| text on the 3D view | 74 characters in 3 boxes | 11 in 2 (the gauge) |


## Declutter pass (2026-11, 0.3.0)
- Only the winch and its roof: the houses, the tower crane, the trees, the clouds, the truck, the mixer, the sand and
  brick piles, the scaffolding and net, the column stubs with bars, the cement bags and the drums are gone. The roof
  slab with its painted edge, the brick floors below, plain earth and a soft, muted sky stay.
- The height gauge left the 3D view: it is the first reading in the panel (a small bar and the value).
- The old wide-panel grid (for the panel under the 3D) is gone: the panel is beside the 3D now.
