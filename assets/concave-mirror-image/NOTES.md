# Notes: Images in a concave mirror (অবতল আয়নায় প্রতিবিম্ব)

Book: physics-9-10 › 8.6.1 › p230 (with pp 229–234, topic 8.7). Page images in `reference/`.

## What the pages show
- p229: 8.6.1: a concave mirror gives two kinds of image, nearer or farther than the focal distance. The three rules: (i) a ray along a
  radius comes straight back (OP, ON); (ii) a ray parallel to the axis goes through F after reflection (XQ, QF); (iii) a ray through F comes
  back parallel (FQ, QX).
- p230: inside the focus (চিত্র ৮.২২, pencil XY, image X′Y′ behind): virtual, upright, bigger; bigger and farther the nearer F; at F the
  reflected rays are parallel and cannot meet.
- p231: beyond the focus (চিত্র ৮.২৩, ৮.২৪): "প্রথমবার ... বাস্তব প্রতিবিম্ব", where the light really gathers: inverted.
- p232: (a)–(d) and the table of seven rows. p233: 1/u + 1/v = 1/f; a real image can be thrown on a screen; the example: X′Y′ as the object has
  XY as its image; চিত্র ৮.২৫. p234: 8.7: m = l′/l.

## The one idea to teach
Where the object stands decides the image in a concave mirror: beyond F the rays really meet in front of the mirror (a real, inverted image a
screen can catch: smaller beyond O, equal at O, bigger between O and F), at F there is none, and inside F the rays only seem to meet behind
(virtual, upright, bigger); 1/u + 1/v = 1/f and m = l′/l give the same answers.

## Terms (as in the book)
অবতল আয়না, প্রতিবিম্ব, বাস্তব, অবাস্তব, উল্টো, সোজা, খর্বিত, বিবর্ধিত, সমান দৈর্ঘ্যের, শূন্য দৈর্ঘ্যের, অসীম দূরত্ব, ফোকাস বিন্দু / ফোকাসবিন্দু F, কেন্দ্রবিন্দু O, মেরু বিন্দু / মেরুবিন্দু P,
প্রধান অক্ষ, সমান্তরাল, পর্দা, কেন্দ্রীভূত, বিবর্ধন m = l′/l, u, v, f, বস্তু XY, প্রতিবিম্ব X′Y′. The chips on the 3D say ছোট and বড় (the book's plain words on pp 231–232); the panel says
খর্বিত and বিবর্ধিত. Added by the figure, not on the page: "সমান" alone in the chip (for সমান দৈর্ঘ্যের), ঝাপসা and স্পষ্ট for the picture on the screen, টেনে সরাও.

## How the figure works
- **A calm start (the owner, after chapter 8: "start simpler, with some lines of explanation in the white panel").** The first screen shows only a few warm everyday sentences in a `.pvc-note` card (`intro`; `intro_short` on the 390 × 520 phone) and the action: no term and no number yet. After that, one plain line above the action says what the next tap will show (`lead_*`), and the rule below says what it meant, the book's term last and in bold.
- The owner's two rules decide the pace: a student gets the idea from the 3D, and nothing gets complex too fast. It opens on just the pencil, the
  mirror and the image, with its words beside it. Then one thing a tap (`STAGES`, `POSE` in `src/app.js`): F, O, P → the parallel ray, its rule on
  the ray → the ray through F, meeting at X′ → the screen (dragged, or the action does it) until sharp: "real" → the pencil to 30, 22.5, 15, 10,
  the chip beside the image changing live → only then the formula, m and the table → an offer of the test.
- The owner's pace: objects move in 1.5–2.5 s, a ray leg takes 1.2 s, the camera about 2 s, and each result holds still for 1 s before anything may change it. Nothing advances by itself; taps while a step plays are ignored, not queued. The quiet ▶ (or the word of the case) plays a finished step again. The kit's পরীক্ষা tab stays where it is in every figure; the action only offers the test after the last step.
- From the pencil's first move the student may drag it, by finger or arrow keys, in half centimetres, from 4 to 60 cm (so 15 and 30 are reached exactly; beyond 60 the image is too small to read). The words of the panel,
  ৪০ · ৩০ · ২২.৫ · ১৫ · ১০ · সারণি, jump. The panel's lines read the place of the pencil, not the step, so they never lie after a drag.
- `run()` walks any jump in one order: what must go, the camera and the pencil, then the light. The camera is not tweened from pose to pose: each frame the wanted box
  (`FRAMES` in `src/bench.js`) is worked out, and the box in use eases toward it, so it follows the image across F, where the wanted box jumps. The drag maps the finger
  into the plane of the rays, so it holds while the camera glides.
- **The rays.** Two at a time, as the book's figures draw: the parallel ray always; the second is through F outside F (চিত্র ৮.২৩–২৫), along the radius inside it
  (চিত্র ৮.২২). They must land on the real mirror (`lands`): for u of about 12–24 cm neither does on a mirror 20 cm wide, so the ray to the pole P takes over and the panel says so.
- **Rays and the formula.** The image comes from 1/u + 1/v = 1/f. A mirror 20 cm wide on a 30 cm radius is much stronger than the formula assumes: a ray traced with the law alone misses the book's X′
  (u = 40: 0.34 cm for the parallel ray, 0.09 cm for the F ray; u = 30: 0.48 and 0.43; u = 22.5: 0.84; u = 10: 0.96), and on a view of this size the rays would visibly not meet. The sister figure shows that spread
  on purpose (rim rays cross at 14.2 cm). Here each ray goes by the book's rule and passes exactly through X, through F, O or P, and through X′: the parallel ray lands where the line F–X′ meets the sphere (under 3 mm below the
  level of X), and after the mirror each ray is aimed at X′. How far that is from the bare law (`lawError`, tested): in the book's five cases at most 1.8° (u = 40: 0.7° and 0.2°; 30: 0.8° and 0.8°; 22.5: 1.0° and the ray to P exact; 15: 1.3° and exact;
  10: 1.8° and the radius exact). Between the cases: the parallel ray at most 1° for u ≥ 22.5 and 2.8° at u = 6; the F ray reaches 3.3° at u = 23.5, the last place it still lands on the mirror; the worst of all is 4.1° at the very end of the track, u = 4.
  Rays to P and along a radius always obey the law exactly. A smaller mirror would lose the F ray over more of the bench; aiming at a flat line through P would stop the rays 5–9 px short of the silver.
- **Why the ray to P.** For u of about 12–24 cm neither the F ray nor the radius ray lands on a mirror 20 cm wide. The panel does not explain this limit of the model at its busiest step: it only says what the ray is.
- **Handles.** The pencil (from the cases on) and the paper (in its step, and while it follows a real image) carry the chapter's handle: a white disc with arrows, a dashed track for the range (4–60 cm, 6–78 cm), words the first time, a pulse until the first drag, calmer afterwards, none in the test. They are the same as in `convex-mirror-image`. A paper dragged off the image stays there until the pencil moves.
- **The silver** is the sister figure's (bright metal with its own studio). What is seen in it is traced for each pixel (the method of `convex-mirror-image`): the pencil and its rod, so a far
  pencil shows small and inverted, a near one big and upright. No render-to-texture.
- **The screen** stands on its own foot behind the rail, its arm reaching across: pencil and screen must pass each other, and at O the image comes exactly under the pencil. For the same reason the pencil's rod
  stands at the front of its carrier with a short arm to the axis. The bench, rail, scale, carriers, ring, pencil and ray colours are as in the sister figures (their code, copied).
- What falls on the paper (`onScreen`): each point spreads over the mirror's width × |1 − s/v|; the picture is the pencil's own, read from a smaller copy of its texture for the blur.
  The paper is thin: the image shows through from behind, which is the side the camera sees (the silver must face the camera, and the light comes from the silver).
- The light between the rims of the mirror is a thin wash on the drawing layer: gathering to X′, spreading after it, stopped by the paper and the rail.
- The real image is a solid pencil hanging upside down, the virtual one a ghost at 55 %; both are drawn last, from a fresh depth, so that neither rail nor glass cuts them.
- The opening stands at u = 40 cm (v = 24, m = 0.6, whole numbers), not the 45 first planned, so that the image is about 40 px on a phone held upright; there the frame gives up the far half of the mirror.
- At F and inside it the frame comes close (`close`), at the same three-quarter angle as the rest; the wash of light fades as the pencil comes to F, so that nothing lies behind the pencil, and the picture keeps X, X′, one chip and F.

## Honest notes
- Only two rays in one plane are drawn, out of countless.
- The mirror is drawn large: 20 cm across on a 30 cm radius, as in the sister figures; "আয়না বাস্তবের চেয়ে বড় করে আঁকা" says so on the view. So the rays are the book's rules, not a raw trace (above).
- The silver is on the front surface, so no refraction in the glass comes into it (the note of `spherical-mirror-focus`).
- A real image of a lit pencil is dim in a bright room; the figure shows it clearly. An image longer than the paper (m > 2) runs past its lower edge, as it would.
- Between about u = 15 and 21 cm the inverted image is longer than the height of the axis over the rail: it is drawn through the rail, like a ray drawing (the book's row "O ও অসীমের মাঝে"). Past v = 62 cm it leaves the frame; a short tab says so and the panel has the number. Behind the mirror the same happens past 42 cm.
- At F and inside it the paper goes, outside the screen step: there is nothing to catch, and the picture needs the room. The panel says a screen cannot catch it, and the test asks.
- The image is scaled by m in all directions; in truth depth scales by m². A pencil is thin, so it does not show.
- The bright room in the silver is the sister figure's invented studio; the pencil and rod in it are real traces, a far pencil kept at least 1.5 px wide. The paper and the rail are not traced in it.

## Open questions for the book team
- **The table** (p232) writes "অসীম দুরত্ব" and "দুরত্বের" in places, and "কোন" for কোনো; the figure spells দূরত্ব. Its compact table shortens rows ("O ও অসীমের মাঝে") for a narrow column.
- **Row 4 of the table:** the object "কেন্দ্রবিন্দু O এবং ফোকাসবিন্দু F এর মাঝে"; **p232 (a)** then says the image is "কেন্দ্রের বাইরে": they agree.
- **চিত্র ৮.২৩** draws the ray through F landing on a mirror much taller than any on this bench. On a 20 cm mirror that ray misses; the figure uses the ray to P there. Is that acceptable?
- The book gives no sign rule for v; the figure says "আয়নার পেছনে" and shows −৩০ only in the formula step, with a line saying what the minus means. m is a size, without a sign: m = l′/l, as p234.
- p233's example is used in the test (object and image change places).
