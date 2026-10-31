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
  illustration (book: 2,250 J + 2,850 J + 100 J = 5,200 J), said on the view ("অপচয়ের ভাগ … আনুমানিক: বই শুধু মোট
  অপচয় দেয়"). The total is always exactly input − work. Sound is kept tiny on purpose (it is in real machines).
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
