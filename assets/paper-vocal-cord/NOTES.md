# Notes: A paper vocal cord (কাগজের ভোকাল কর্ড)

Book: physics-9-10 › 7.3 শব্দ তরঙ্গ › pages 198–199 (চিত্র ৭.১০ and the নিজে করো at the foot of page 198). Pages in
`reference/page-198.png` and `reference/page-199.png`. Sister on the same page: `bell-jar-sound` (order 2, চিত্র ৭.১১:
sound needs a medium); this figure does not repeat that.

## What the page shows

- Page 198, 7.3: a sound wave needs a source (উৎস), a medium (মাধ্যম) and a receiver (রিসিভার); the most familiar
  source is our voice (কণ্ঠ): air pushed out past the vocal cords makes them vibrate (কম্পন). Above the wind pipe is the
  larynx (স্বরযন্ত্র), where two membranes work like valves: the vocal cords. "বয়সের সাথে সাথে পুরুষের ভোকাল কর্ড শক্ত
  হয়ে যায়, নারীদেরটি কোমল থাকে। সে জন্য পুরুষেরা কম কম্পাঙ্কের শব্দ তৈরি করে মেয়েরা বেশি কম্পাঙ্কের শব্দ তৈরি করে। সে
  কারণে পুরুষের গলার স্বর মোটা, নারীর স্বর তীক্ষ্ণ।"
- নিজে করো: cut a paper as in চিত্র ৭.১০, hold it between two fingers at the lips and blow: the two cut pieces vibrate
  like the vocal cords and make a sound; try cutting it in different ways for different sounds.
- চিত্র ৭.১০ (page 199): scissors cutting a folded strip at the fold, the opened strip with the cut pieces, a boy
  blowing on it held between his fingers. Caption: "কাগজ দিয়ে ভোকাল কর্ড তৈরি করে সেটাকে ফুঁ দিয়ে কাঁপিয়ে শব্দ তৈরি করা
  যায়।" Page 199 also lists other sources (speaker diaphragm, school bell, guitar string, tuning fork).

## The one idea to teach

Blown air makes the two cut paper flaps vibrate like the two vocal cords; the vibration pushes the air into
compressions and rarefactions that travel out as sound (the particles only swing in place); shorter flaps vibrate
faster (higher কম্পাঙ্ক, তীক্ষ্ণ স্বর), longer ones slower (মোটা স্বর), as men's and women's voices.

## Terms (as in the book)

শব্দ তরঙ্গ, উৎস, মাধ্যম, রিসিভার, কণ্ঠ, ভোকাল কর্ড (Vocal Cord), স্বরযন্ত্র (Larynx), কম্পন, কম্পাঙ্ক, মোটা / তীক্ষ্ণ
স্বর, ফুঁ দাও, কাগজের কাটা টুকরো; chapter 7's সংকোচন, প্রসারণ, তরঙ্গদৈর্ঘ্য (λ), Hz (হার্টজ, glossed once). The page
writes উপরে.

## How the figure works

- **The object** (`src/paper.js`, `src/clip.js`, millimetres): a 52 × 60 mm strip of a ruled exercise book (fibres,
  faint blue rules every 8 mm, which continue across the flaps) folded in half and opened to a V of 80°, 0.3 mm thick as
  drawn (writing paper is 0.1 mm). From the top edge a slit runs 14 mm down the crease with a short cut across at its
  foot, L mm into each half: each half has a flap 14 mm tall, hinged L mm back from the fold and free at the crease,
  where the two free edges meet like the two vocal cords. Each flap is a 16-piece slab bent every frame as a cantilever
  (zero at the hinge), slightly shortened as it bends; while it vibrates a faint grey ghost shows it at its widest swing.
  The cuts are drawn 0.9 mm wide so they read. A small black binder clip (19 mm, spring steel with rolled jaws and two
  chrome wire handles) holds the foot of the crease; it replaces the first version's fingers, which looked cartoonish.
- **The view**: 58° from above, from behind the open back of the fold and 8° inside its near half, looking down into
  the cut the way a doctor's mirror looks down on the real vocal cords: the far flap is seen face-on as a paper tongue,
  the near one nearly edge-on beside it, and the sound spreads up and to the right of the tip. The camera frames the
  cut, the green particle and the λ bracket (a list of points, `src/camera.js`), so the cut is large at every size;
  the bottom of the strip and the clip run off the lower edge. Backdrop: a calm blue-grey to pale warm-stone gradient.
- **ফুঁ দাও** (the one action; also a tap on the paper, Space or Enter): one breath of 8 s (picture time). An outlined
  blue arrow "ফুঁ" and pale streaks go down the middle of the fold; the streaks wait at the shut slot and rush through
  when it opens. The flaps open and shut once a period (`opening = ½ − ½ cos ωt`), slowed 100 times. In front of the
  slot a level half-disc of air (in the upper part of the slot, so the flaps never hide it) shows the slice of the sound
  in two layers: a smooth surface coloured by how squeezed the air is (darker teal সংকোচন, lighter প্রসারণ), so the
  compressions are clear curved bands centred on the slot, and about 3 400 small particles over it, each swinging in
  place along the way the sound goes, ξ = −a·sin ω(t − r/v), so they bunch in the dark bands. The wave front leaves the
  slot when the blowing starts and the tail leaves when it stops; a compression leaves when the flaps are most open.
  One green particle with a mark at its resting place shows it only swings. An orange bracket along a ray from the slot
  spans exactly one λ between two compression centres (it rides with the wave; drawn 0.01 of real; its label gives the
  real value). Arrows keep a steady thickness in pixels at every zoom.
- **The graph** (`src/graph.js`, only where the side panel has room: 800 × 500 and 1280 × 800): the air's pressure
  against the distance from the source, 0–4 m in real metres, live and in step with the 3D; সংকোচন over a peak,
  প্রসারণ over a trough, and λ between two peaks with its value. With one range for every cut, the long flaps' waves are
  long and the short flaps' crowd together.
- **The row of words** cuts the flaps long (14 mm), medium (10 mm) or short (7 mm). The camera widens a little for the
  long wave. The action's next suggestion (dotted word) walks medium → short → long.
- **The honest model** (`src/reading.js`, unit-tested): each flap is a cantilever, f = (1.875²/2π)(t/L²)√(E/12ρ) with
  t = 0.1 mm, E = 3 GPa, ρ = 800 kg/m³: 160, 313, 638 Hz, shown rounded to 10 Hz with "প্রায়". λ = 330 m/s ÷ the
  shown f: 2.06, 1.06, 0.52 m. Voice: below 250 Hz মোটা, below 450 Hz মাঝারি, else তীক্ষ্ণ. In the picture the speed
  is the same for every cut (330 × 0.01 / 100 m/s = 33 mm/s), so λ shrinks as f rises (v = fλ).
- **Sound**: with `sound=1`, a sawtooth buzz at the real frequency (not slowed) while blowing, with a little breath
  noise (`src/sound.js`; the kit's `createAudio` has only short UI sounds, so this is the figure's own: a kit gap).
- **The panel** (clean sheet): the row of words with each tried frequency under its word; the action; the result
  ("প্রতি সেকেন্ডে প্রায় ৩১০ বার কাঁপে: কম্পাঙ্ক ৩১০ Hz (হার্টজ), মাঝারি স্বর।"); a quiet key line (swatches for সংকোচন
  and প্রসারণ, "সময় ১০০ গুণ ধীর, λ ছোট করে আঁকা"); the rule, growing: the flaps vibrate like vocal cords → source,
  medium, receiver and particles swinging in place → short = high and তীক্ষ্ণ, long = low and মোটা, λ shorter → the
  book's sentence on men's and women's voices.
- **Labels on the picture**: কাটা টুকরো, λ ≈ … m, বাতাসের একটি কণা.
- **The test** (5 questions, choices shuffled, a note for each wrong choice): what vibrates (the flap label hidden);
  what the green particle does; what a shorter cut does (then the short flaps are shown); why men's voices are deep
  (the long flaps); what sound needs.
- **Bridge**: `get` → `{ cut, flapLength, frequency, wavelength, voice, blowing, opening, tried, next, mode }`;
  `set({ cut, blow, animate })` (`animate: false`: steady blowing, the air already full of the wave, until stopped);
  `reset`, `practice`, `capture`, `export-glb` (the paper as bent now and the clip, in mm → metres).

## Open questions for the book team

- The book says men's vocal cords grow **শক্ত** (stiff) and so make lower frequencies. Physically a stiffer cord
  vibrates *faster*; men's cords are longer and heavier, which is why they vibrate slower. The figure quotes only the
  book's conclusion (পুরুষেরা কম কম্পাঙ্কের শব্দ তৈরি করে … পুরুষের গলার স্বর মোটা, নারীর স্বর তীক্ষ্ণ) and never says
  "শক্ত → কম কম্পাঙ্ক". Should the text be changed?
- How the paper is cut is the figure's own reading of চিত্র ৭.১০ (a slit along the crease and two cuts across it: two
  flaps meeting at the fold like vocal cords). The 160–640 Hz values are from a simple model; a real paper reed's note
  also depends on how hard one blows (hence "প্রায়").
- Words added that are not on the page: "লম্বা টুকরো / মাঝারি / ছোট টুকরো", "বাতাসের একটি কণা", "হার্টজ", "চাপ" (the
  graph), "ক্লিপ" (the book's boy holds the paper between his fingers; the figure clips it so the flaps stay in view).
- An inset of a real larynx (the two vocal cords opening and shutting in step with the flaps) was considered and left
  out to keep the picture uncluttered; it could be added if the owner wants it.

## Performance (0.2.0, 844×390, shadows on, steady blowing)

72 draw calls (with the shadow pass), about 34 000 triangles (12 000 of them the sound's band surface) and 3 360 air
particles (one `Points` object; positions and colours of particles and bands updated in place, no allocation per frame),
8 textures (all canvas-made: paper, its bump, the backdrop, the dot). Ready in about 3.9 s in headless software
rendering. An idle figure draws nothing: the ticker runs only while the flaps vibrate or the last wave is still crossing
the picture. (First version: 60 calls, 19 000 triangles, 6 200 particles, ready in 3.4 s.)

## 0.2.0: the redesign

The owner singled this figure out ("it has to be really great"). The flaps were invisible from the old front view and
the fingers looked cartoonish. Now: the view looks down into the cut, the flaps are framed large and ghosted at their
widest swing; a binder clip holds the paper; the breath is an outlined arrow plus streaks through the fold; the sound is
a level slice of clear curved bands centred on the slot (never over the paper), with λ between two compression
centres; a calm cool backdrop; a live pressure–distance graph in the panel on wide frames; the test's "fingers" choices
now name the clip.
