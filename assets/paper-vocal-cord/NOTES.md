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

- **The object** (`src/paper.js`, `src/clip.js`, `src/setting.js`, millimetres): a 40 × 27 mm strip of a ruled
  exercise book (fibre texture, faint blue rules every 8 mm that continue across the flaps, a fibre bump, a faint warm
  glow where light comes through) folded in half and opened to a V of 116°, 0.3 mm thick as drawn (writing paper is
  0.1 mm) with greyer cut edges. From the top edge a slit runs 14 mm down the crease with a short cut across at its
  foot (a thin dark gap), L mm into each half: each half has a flap 14 mm tall, hinged L mm back from the fold and free
  at the crease, where the two free edges meet like the two vocal cords. Each flap is a 16-piece slab bent every frame
  as a cantilever (zero at the hinge), slightly shortened as it bends; its free edge swings out up to 0.14·L. The flaps
  are a hair warmer than the walls. While they vibrate, a faint copy shows each flap at its widest swing. Between the
  two free edges a thin dark slit opens and shuts (0.4 of the real gap; the lit inside of the fold shows round it);
  shut, the free edges stay a hair apart, like lips. A 15 mm black binder clip (spring steel with rolled jaws, a bevel
  and two chrome wire handles) stands on its folded-down handles on a plain bench, mouth up, pinching the foot of the
  crease.
- **The view** (0.3.2): a gentle three-quarter view from the front, 22° above and 58° round from the side: the whole
  strip like a half-open book with its spine toward the student, both flaps and the slit between them facing the
  camera, the clip on the bench below. The camera frames the whole strip, the clip, the breath arrow's tail, the green
  particle and the λ bracket's reach (a list of points, `src/camera.js`). At 844 × 390 the flap pair at its widest is
  about 23 % of the 3D width. Backdrop: a calm blue-grey to pale warm-stone gradient.
- **ফুঁ দাও** (the one action; also a tap on the paper, Space or Enter): one breath of 8 s (picture time). A slim
  outlined blue arrow "ফুঁ" and a few fine streaks come from behind and above the open back of the fold down into it
  (the paper hides them as they go in); the streaks wait at the shut slit and slip through when it opens. The flaps
  open and shut once a period (`opening = ½ − ½ cos ωt`), slowed 100 times. The sound is a slice in the upright plane
  through the slot that faces the camera, a fan from 24° to 108° above the level (above the paper, never over the
  flaps): about 6 000 fine particles, evenly spread at rest, each swinging in place along its ray,
  ξ = −a·sin ω(t − r/v), so they bunch into darker, fuller teal shells (সংকোচন) and thin out into lighter ones
  (প্রসারণ) that travel outward. The particles (and the green one) show only where the wave is: air at rest is not
  drawn, so the idle sky stays clean. The wave front leaves the slot when the blowing starts and the tail leaves when it
  stops; a compression leaves when the flaps are most open. One green particle (on a low ray, so it swings sideways on
  screen) with a mark at its resting place shows it only swings. An orange bracket (`src/bracket.js`, drawn over the
  picture in screen space with a cap and an arrow head at each end) runs along a ray from the slot 52° up and spans
  exactly one λ from one shell's centre to the next (it rides with the wave; drawn 0.008 of real). Its label gives the
  real value and stays beside the far half of the bracket's reach, never over it. The "ফুঁ" chip sits at the breath
  arrow's tail. Arrows keep a steady thickness in pixels at every zoom.
- **The graph** (`src/graph.js`, only where the side panel has room: 800 × 500 and 1280 × 800): the air's pressure
  against the distance from the source, 0–4 m in real metres, live and in step with the 3D; সংকোচন over a peak,
  প্রসারণ over a trough, and λ between two peaks with its value. With one range for every cut, the long flaps' waves are
  long and the short flaps' crowd together. Not at 844 × 390 or 640 × 400: there the side panel is full (action, result,
  key and rule) and a graph squeezed under them would be too small to read; the λ label on the picture stays.
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
- **The test** (5 questions, choices shuffled, a note for each wrong choice; 0.3.0 replaced two text-only questions
  with two read off the scene): what vibrates (the flap label hidden); what the green particle does; what a shorter cut
  does (then the short flaps are shown); what comes out of the slot when the flaps are open widest (a compression; the
  λ bracket hidden); what distance the orange λ mark shows (two neighbouring compressions). The book's sentence on
  men's and women's voices stays in the rule.
- **Stills**: `set({ blow: true, animate: false })` moves the picture's clock to a moment that has the flaps open widest
  1.6 s later (the exports and verify wait 1.5 s after their setup, the bridge call 0.1 s), so the poster and the
  pictures show the vocal cords open.
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

## 0.3.2: the whole folded paper, real and detailed

After the owner looked at 0.3.1's poster (the camera sat deep in the fold: two cream wings, a dark leaf-shaped blob, a
fat blue arrow and blurry teal fog with scattered dots; a diagram, not a real piece of paper):

- **The view** pulls back to a gentle three-quarter view from the front, 22° above, 58° round from the side: the whole
  strip stands like a half-open book with its spine (the crease) toward the student, the near half's outer face, the
  far half receding, the cut at the top of the crease with both flaps and the slit between them facing the camera. The
  strip is 40 × 27 mm (halves 20 mm, V opened to 116°), so the flaps (14 mm tall) are half its height. The camera frames
  the whole strip, the clip down to the bench, the breath arrow's tail, the green particle and the λ bracket's reach.
  At 844 × 390 the flap pair at its widest is about 23 % of the 3D width (near flap ≈ 85 px, far flap ≈ 45 px of
  557 px): with the whole strip, the clip and the sound in one frame, the 30 % of 0.3.1's close view is not reachable
  without cropping the strip; the flaps are the largest single part of the paper.
- **The paper**: a 1024 px fibre texture (soft cloudy formation, 4 200 fine curved fibres, faint blue rules 0.2 mm wide
  every 8 mm, seamless), a matching bump map, a faint warm emissive glow for light coming through it (no transmission
  pass), real cut edges in a greyer edge colour on every outline and on the flaps' slabs, a rounded crease, and the cut
  across under each flap a thin dark gap. The flaps are a hair warmer than the walls. No outlines drawn over the
  picture any more.
- **The slit** replaces the dark lens: a thin dark strip between the two free edges (0.4 of the real gap, so the lit
  inside of the fold shows round it), hidden when the flaps are shut. The swing is 0.14·L (1.4 mm for the medium flaps),
  so the gap is a slit, not a hole; a faint copy of each flap at its widest swing shows the motion.
- **The holder**: the 0.3.1 binder clip, now 15 mm, standing on its folded-down handles on a plain bench (a fine-grain
  512 px top fading into the backdrop, receiving the shadows), mouth up, pinching the foot of the crease.
- **The breath**: a slim outlined arrow (1.5 px core) from behind and above the open back of the fold down into it,
  and 18 fine translucent streaks (line segments faded at the tail) on the same path, hidden by the paper as they go in,
  slipping out through the slit when it opens.
- **The sound**: the band surface (the "fog") is gone. About 6 000 fine particles (1.05 mm, a crisp round dot), evenly
  spread (jittered rings, two thin layers) over a fan in the upright plane through the slot that faces the camera,
  from 24° to 108° above the level, so it rises above the paper and never covers the flaps. Each swings in place along
  its ray; colour and opacity follow the squeeze, darker and fuller in the compressions (সংকোচন), lighter and thinner
  in the rarefactions (প্রসারণ); the fan fades out at its edges. λ is drawn 0.008 of real (was 0.01) so two
  wavelengths fit above the paper. The λ bracket runs along a ray 52° up; the green particle sits on a low ray (30°),
  where its to-and-fro reads sideways, not up-and-down (the test's wrong choice).
- **Lighting**: the sun more from the front so both flaps are lit; a warm back light on the inside of the fold.

Performance (844 × 390, shadows on, steady blowing, `perf.mjs`, both versions measured the same day; the measure
counts three renders because the capture answers one poll later on this machine): 0.3.1 192 draw calls, 100 374
triangles, ready 3.7–4.3 s → 0.3.2 189 draw calls, 28 182 triangles, ready 3.2–3.9 s; 1 ms per animated frame in both.
GLB 376 KB → 612 KB (the paper's texture is exported at 512 px, without the glow and bump maps; the paper and the
clip are now fully in the file). Per render: 64 → 63 draw calls (shadow pass included), 33 k → 9.4 k triangles (the 12 k-triangle band surface is
gone). The owner's earlier single-render figures for 0.3.1: 64 calls, 33 k triangles, ready 2.7 s, GLB 376 KB.

## 0.3.1: two paper vocal cords at a glance

After the owner looked at 0.3.0's poster: the big dark rectangle between the flaps is now a narrow dark lens (about
14 % of the flap pair at its widest, the swing 0.3·L); the camera pulls back so the folded strip reads as an object
(the strip shortened to 44 mm so the V, the clip under the crease's foot and the flaps fit with the flaps still 30 %
of the width at 844 × 390); the flaps are a shade warmer than the walls and outlined, their free edges heavier; the λ
bracket is a screen-space bracket along a sideways ray from band to band, its label beside its far end; the "ফুঁ" chip
is at the arrow's tail.

## 0.3.0: two vocal cords, flapping

After the independent review of 0.2.0 ("the picture doesn't yet show two vocal cords flapping"): a symmetric view from
behind the open fold shows both flaps as a pair; a bigger swing (0.6·L), a paper-coloured trail instead of grey fins,
a dark slot between the free edges and lips a hair apart at rest; the breath arrow ends in the slot; air particles only
where the wave is; the "ফুঁ" and other labels 14 px on phones held upright; the clip's steel lighter with a visible
bevel (it is now mostly hidden behind the crease); two scene questions replace "why men's voices are deep" and "what
sound needs"; wrong choices that were filler now name real mistakes; "ছোট টুকরো শক্ত" removed from a note (it
contradicted the book's শক্ত remark below); the rule says why a short flap is fast ("দৈর্ঘ্য কম, তাই দ্রুত কাঁপে").

## 0.2.0: the redesign

The owner singled this figure out ("it has to be really great"). The flaps were invisible from the old front view and
the fingers looked cartoonish. Now: the view looks down into the cut, the flaps are framed large and ghosted at their
widest swing; a binder clip holds the paper; the breath is an outlined arrow plus streaks through the fold; the sound is
a level slice of clear curved bands centred on the slot (never over the paper), with λ between two compression
centres; a calm cool backdrop; a live pressure–distance graph in the panel on wide frames; the test's "fingers" choices
now name the clip.
