# Notes: Floating or sinking (বস্তুর ভেসে থাকা বা ডুবে যাওয়া)

Book: physics-9-10 › 5.3.2 › p138 (the section and its উদাহরণ run onto p139). Page image: `reference/page-138.png`
(dev only).

## What the page shows
Topic ৫.৩.২ বস্তুর ভেসে থাকা বা ডুবে যাওয়া, text only, three paragraphs and a worked example:
- A body put in water feels, because of প্লবতা, an upward force equal to the weight of the water it has pushed aside
  ("যতটুকু পানি সরিয়েছে উপরের দিকে সেই পানির ওজনের সমপরিমাণ বল অনুভব করে"). If that force is more than its weight it
  floats: "ঠিক যে পরিমাণ পানিতে ডুবে থাকলে বস্তুর সমান ওজনের পানি অপসারণ করবে, ততটুকুই ডুববে, বাকি অংশটুকু পানিতে ডুবে
  যাবে না।"
- "যদি বস্তুটার ওজন অপসারিত পানির ওজন থেকে বেশি হয়, তাহলে সেটি পানিতে ডুবে যাবে। তবে পানিতে ডুবে থাকা অবস্থায় তার ওজন
  কিন্তু সত্যিকার ওজন থেকে কম মনে হবে।"
- "যদি কোনোভাবে বস্তুটার ওজন অপসারিত পানির ওজনের ঠিক সমান করে ফেলা যায়, তাহলে বস্তুটাকে পানির ভেতরে যেখানেই রাখা হবে
  সেটা সেখানেই থাকবে, উপরেও ভেসে উঠবে না নিচেও ডুবে যাবে না।" … "পানির নিচে দিয়ে চলাচল করার জন্য সাবমেরিনে এটি করা হয়।"
- উদাহরণ (p139): "এক টুকরো কাঠ পানিতে ভাসিয়ে দিলে তার কত শতাংশ ডুবে থাকবে? (কাঠের ঘনত্ব ρ = 0.5 × 10³ kg/m³ পানির
  ঘনত্ব ρw = 10³ kg/m³)". উত্তর: "কাঠকে ভেসে থাকতে হলে তার ডুবন্ত অংশের সমপরিমাণ পানির ভর কাঠের ভরের সমান হতে হবে":
  Vρ = V₁ρw, V₁/V = ρ/ρw = 0.5 × 10³ / 10³ × 100 = 50%.

## The one idea to teach
Weight against the weight of the water pushed aside decides it: more, it sinks (and seems lighter under water); less,
it floats, sunk just so far that the two are equal (V₁/V = ρ/ρw); exactly equal, it stays wherever it is put (a
submarine).

## Design
- A glass tank of clear water on a teak table by a lake at golden hour (sky, violet hills in the haze, the sun's
  streaks on the lake; no white or green page). The tank's floor is sand with rippled light; its back wall a blue
  backing as in an aquarium, so the water reads rich blue and the arrows stand out. The water multiplies what is
  behind and inside it by a blue tint (deeper is bluer), so a red brick stays red-brown under water and the part of a
  block under water is plainly a different colour from the part above.
- Three steps in the row of words (the owner's "one idea on screen at a time"):
  1. **তিন অবস্থা**: three 10 cm cubes, the same size (so a whole one always pushes aside 1 litre, 9.8 N): wood
     (0.5 × 10³ kg/m³), a brick (2 × 10³) and a sealed tin with just enough sand inside (as heavy as its water, the
     book's "কোনোভাবে"). They hang on cords; one numbered button (its badge ringing the body) lets them go in the book's
     order: the wood bobs and floats half under, the brick sinks to the floor, the tin is put under water by hand and
     stays. ④ puts the tin at another depth: it stays there too. Then any body can be dragged up or down under water and
     let go (the wood comes back up, the brick sinks, the tin stays), or moved with the arrow keys.
  2. **উদাহরণ: কাঠ**: the book's example made playable. The block is dropped, bobs, settles; the camera goes close to
     the waterline; a white scale with a mark every cm on its side and a yellow V₁ bar, and a yellow waterline round
     it, show half of it under; the panel works it out: V₁/V = ρ/ρw = 0.5 × 10³ ÷ 10³ → 50%. Chips: cork (0.24, 24%),
     wood, ice (0.92, 92%), brick (2: it sinks, and the rule says the formula holds only while it floats). Changing
     the material lets the simulation move it from where it is (cork pops up, the brick goes down).
  3. **সাবমেরিন**: a red toy submarine with a window on its ballast tank (white mark at half). ① take water in (its
     weight grows past the buoyancy: down), ② let some out until weight = buoyancy (the water slows it, it stays at
     whatever depth it has reached), ③ blow it all out (up, and it floats). Bubbles from its sail while the valves
     work; a gauge in the panel shows the kg of water in the tanks.
- Forces: weight purple #7048e8 (as `pressure` and the force figures) pointing down and buoyancy orange #f76707
  pointing up, from the body's middle height on one line beside its right face (so neither hides the body, and their
  lengths compare at a glance), flat colour in a white outline, drawn over the water and the glass, **length ∝ force**
  (1.2 cm per newton); each has its word and number ("ওজন ৪.৯ N", "প্লবতা ৪.৯ N"). On the floor, the floor's push is a
  thinner grey arrow under the body ("তলার ঠেলা ৯.৮ N") = W − B: the book's "seems lighter under water", and a body at
  rest never shows unbalanced forces. A note: "তীরের দৈর্ঘ্য বলের সমানুপাতিক".
- The motion is a small damped simulation (reading.js): weight, buoyancy from the depth under water, the water's drag
  (linear and quadratic), an added mass of half the water pushed aside, and the floor. A body that comes within a
  hair of rest is put exactly where it settles, so the numbers come out as the book's. Real time, no slow motion.
  The panel never says "rising" while a body is still going down: moving bodies are described by the forces and the
  way they move together ("ওঠানামা করছে: প্লবতা আর ওজন সমান হওয়ার জায়গা খুঁজছে" while it bobs).
- Test (five, tap answers, wrong choices are real mistakes each with its note): which of three identical tins
  sinks (their weights on the picture; the reveal lets them go); per cent under water for ρ (the part above, all of it,
  forgetting × 100); ρ from the waterline on the scale (the part above, ρw ÷ fraction, not dividing by 10 cm); how
  heavy a stone seems under water from the arrows (W, W + B, B itself); what a hovering submarine must do to rise, or a
  floating one to dive.

## Terms (as in the book)
বস্তুর ভেসে থাকা বা ডুবে যাওয়া, প্লবতা, অপসারিত পানি, পানি অপসারণ, ওজন, সত্যিকার ওজন, "ওজন … কম মনে হবে", ঘনত্ব, ভর,
আয়তন, ডুবন্ত অংশ, শতাংশ, সাবমেরিন, উদাহরণ, ρ, ρw, V, V₁. The page writes উপর. Units as Latin symbols (N, kg/m³, cm,
kg); numbers in Bangla digits. Words the figure adds, not on the page: ট্যাংক (the submarine's), কৌটা, মাপমতো বালু,
তলার ঠেলা, কর্ক, বরফ, ইট, পাথর, মাপকাঠি, ওঠানামা.

## Sister figures
- `pressure` (5.1, p129): the same force colour (purple for weight) and white-outlined arrows over the scene.
- Built at the same time by other sessions: density (5.2, p131), liquid pressure (5.3, p134), Archimedes and
  buoyancy with a ship (5.3.1, p137), Pascal's law (5.3.3, p141). No ship here on purpose (5.3.1 has it). Same terms:
  প্লবতা, অপসারিত পানি, ঘনত্ব. When they land, check that buoyancy has the same colour in all of them.

## Open questions
- The book gives no symbol for buoyancy; the figure writes the word প্লবতা on its arrow (English "Buoyancy").
- The floor's push (তলার ঠেলা) is not on the page; it is drawn so the sunk brick's forces balance and to show the
  book's "seems lighter under water" (W − B).
- Ice is 0.92 × 10³ kg/m³ (real ice 0.917), cork 0.24, brick 2: picture values, not from the book.
- The submarine is a toy (1 litre, 0.8 kg empty, tanks of 0.4 kg); real submarines also trim with planes while moving.
- The drag and the bobbing are made to look right (a 10 cm block bobs for about 3 s), not measured.
