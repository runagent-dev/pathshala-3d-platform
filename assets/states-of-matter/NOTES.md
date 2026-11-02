# Notes: Three states of matter (পদার্থের তিন অবস্থা)

Book: physics-9-10 › 5.6 › p150 (the topic runs on to p151 and the table on p152). Pages: `reference/page-150.png`
(pp. 150–151) and `reference/page-152.png` (pp. 151–152).

## What the page shows
- p150: everything is made of অণু; অণু of পরমাণু; পরমাণু of ইলেকট্রন, প্রোটন, নিউট্রন; প্রোটন and নিউট্রন of কোয়ার্ক (and
  perhaps strings). A substance's properties stay in its molecule, so the molecule is taken as its smallest unit.
- p151: পানির অণুতে পানির সব ধর্ম আছে; split it and it is no longer water, but one oxygen and two hydrogen atoms. Whether
  a substance is কঠিন, তরল or গ্যাস depends on how its molecules are arranged; water is all three: বরফ, পানি, জলীয়
  বাষ্প. **চিত্র ৫.১৩**: (a) কঠিন, (b) তরল, (c) গ্যাস, three boxes of pink spheres: packed in rows; close but irregular;
  a few far apart.
- p151 text: gas: অণুগুলো মুক্ত অবস্থায়, দূরত্ব অনেক বেশি, মুক্তভাবে ছোটাছুটি করতে পারে, কোনো নিয়মিত আয়তন বা আকার নেই.
  Liquid: তুলনামূলকভাবে কাছে, একটার সাপেক্ষে অন্যটি নড়তে পারে, কাঁপে এবং একটার পাশ দিয়ে অন্যটি চলে যেতে পারে,
  নির্দিষ্ট আয়তন থাকলেও কোনো নিয়মিত আকার নেই. Solid: খুব কাছাকাছি, নিজ অবস্থানে থেকে কাঁপলেও স্থান পরিবর্তন করতে
  পারে না, নির্দিষ্ট আয়তন এবং নিয়মিত আকার আছে. We cannot see molecules, but their behaviour shows in what we see.
- p152: a table per state, "আণবিক ধর্ম" against "তার প্রতিফলন" (a gas fills its container and can be compressed; a liquid
  takes its container's shape, flows, can't be compressed; a solid keeps its shape, can't be compressed or poured).
  Left out: it is the next step (the evidence), and the one idea here is the arrangement. The liquid's shape is still
  visible: the melted water takes the pan's round shape.

## The one idea to teach
The same water molecule makes ice, water and vapour; what differs is how the molecules are arranged and move: in a
regular pattern only vibrating (fixed shape and volume), close but sliding (fixed volume only), far apart and free
(neither).

## How it is built
- An animation on `timeline.js` (72 s, five chips: অণু, কঠিন, তরল, গ্যাস, তিন অবস্থা). The kitchen (`kitchen.js`): a gas
  stove on a teak worktop in front of tiles lit by a sunset (orange to deep blue, never white or green), a steel pan, a
  glassy ice cube (transparent shell and a frosted heart, no transmission pass, to stay light for software WebGL),
  clear blue water, bubbles, sprite steam.
- The magnifier (`lens.js`) is a second WebGL pass in pixels after the kitchen: glossy space-filling H₂O molecules
  (oxygen red, hydrogen white; 43 in the solid and liquid, 10 in the gas: two instanced meshes, no geometry rebuilt).
  The rims, the dashed cone to the object and the arrows are SVG; the words HTML.
- The molecules (`molecules.js`): the solid is a hexagonal lattice, every molecule turned the same way, vibrating
  about its place (a pure function of t). The liquid is simulated once at start (fixed seed): the same molecules on
  their places, tied by springs that let go as the ice melts, jostled by heat, pushing apart on contact, kept inside
  the lens. The gas: ten molecules, elastic bounces off each other and the rim, same speed. All sampled by time, so
  seek and video frames are exact. About 0.1 s to simulate.
- The kitchen frames itself into the room the lens leaves (`layout.js`): tall frames lens top right, pan below; wide
  frames lens on the right. The last part: tall frames zigzag ice (bottom left) → water (middle right) → vapour (top
  left); wide frames ice and water along the bottom, vapour top right. Words are placed clear of the arrows.

## Terms (as in the book) and where they come from
- অণু, পরমাণু, অক্সিজেন, হাইড্রোজেন, "আর পানি থাকে না" (p150–151).
- কঠিন, তরল, গ্যাস; বরফ, পানি, জলীয় বাষ্প (p151).
- কাঁপে, নিজ অবস্থানে, স্থান পরিবর্তন, একটার পাশ দিয়ে অন্যটি চলে যেতে পারে, দূরত্ব অনেক বেশি, মুক্তভাবে ছোটাছুটি (p151).
- "নিয়মিত আকার" and "নির্দিষ্ট আয়তন" (p151). The page also writes "নিয়মিত আয়তন" once (gas); the figure says নির্দিষ্ট
  আয়তন throughout, as the page does for the solid and the liquid.
- "অণুগুলো কীভাবে আছে তার ওপর" (p151, which writes ওপর there and উপর later).
- **The changes of state are not named on these pages** (no গলন, স্ফুটন, বাষ্পীভবন, ঘনীভবন, হিমায়ন). So the arrows say
  what is done, not a term: "তাপ দিলে" and "ঠান্ডা করলে"; captions use everyday verbs (গলে, ফুটতে থাকে).
- Added words not on the page: চুলা/প্যান are not named on screen; "অনেক বড় করে দেখানো" (honest scale note), "তাপ" by
  the flame.

## Open questions
- Whether to name the changes of state (গলন, বাষ্পীভবন, ঘনীভবন, হিমায়ন) here, if a later chapter of the edition uses them.
- The visible cloud over boiling water is really tiny droplets; true water vapour is invisible. The figure follows the
  book and the owner's brief and calls the steam জলীয় বাষ্প.
- The lens shows a 2D slice; molecules are drawn as space-filling H₂O (the book uses plain spheres).
