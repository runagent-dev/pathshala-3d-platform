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
খর্বিত and বিবর্ধিত. Added by the figure, not on the page: "সমান" alone in the chip (for সমান দৈর্ঘ্যের), পর্দা's stand, ঝাপসা and স্পষ্ট for the picture on the screen.

## How the figure works
- The owner's two rules decide the pace: a student gets the idea from the 3D, and nothing gets complex too fast. It opens on just the pencil, the
  mirror and the image, with its words beside it. Then one thing a tap (`STAGES`, `POSE` in `src/app.js`): F, O, P → the parallel ray, its rule on
  the ray → the ray through F, meeting at X′ → the screen (dragged, or the action does it) until sharp: "real" → the pencil to 30, 22.5, 15, 10,
  the chip beside the image changing live → only then the formula, m and the table. Moves take 1.5–2.6 s, with a pause after each leg.
- From the pencil's first move the student may drag it, by finger or arrow keys, in half centimetres (so 15 and 30 are reached exactly). The words of the panel,
  ৪০ · ৩০ · ২২.৫ · ১৫ · ১০ · সারণি, jump. The panel's lines read the place of the pencil, not the step, so they never lie after a drag.
- `run()` walks any jump in one order: what must go, the camera and the pencil, then the light. The camera is not tweened from pose to pose: each frame the wanted box
  (`FRAMES` in `src/bench.js`) is worked out, and the box in use eases toward it, so it follows the image across F, where the wanted box jumps. The drag maps the finger
  into the plane of the rays, so it holds while the camera glides.
- **The rays.** Two at a time, as the book's figures draw: the parallel ray always; the second is through F outside F (চিত্র ৮.২৩–২৫), along the radius inside it
  (চিত্র ৮.২২). They must land on the real mirror (`lands`): for u of about 12–24 cm neither does on a mirror 20 cm wide, so the ray to the pole P takes over and the panel says so.
- **Rays and the formula.** The image comes from 1/u + 1/v = 1/f. A mirror 20 cm wide on a 30 cm radius is much stronger than the formula assumes: a ray traced with the law alone
  misses the book's X′ by up to about 1 cm (the sister figure shows the same thing on purpose: rim rays cross at 14.2 cm). Here each ray goes by the book's rule and passes exactly through
  X and F, O or P and X′: the parallel ray lands where the line F–X′ meets the sphere (under 3 mm below the level of X); after the mirror each ray is aimed at X′. Rays to P and along the radius obey the
  law exactly; the others differ from it by at most 3° in the book's cases (`lawError`, tested). The sphere itself is exact (`hitMirror`).
- **The silver** is the sister figure's (bright metal with its own studio). What is seen in it is traced for each pixel (the method of `convex-mirror-image`): the pencil and its rod, so a far
  pencil shows small and inverted, a near one big and upright. No render-to-texture.
- **The screen** stands on its own foot behind the rail, its arm reaching across: pencil and screen must pass each other, and at O the image comes exactly under the pencil. For the same reason the pencil's rod
  stands at the front of its carrier with a short arm to the axis. The bench, rail, scale, carriers, ring, pencil and ray colours are as in the sister figures (their code, copied).
- What falls on the paper (`onScreen`): each point spreads over the mirror's width × |1 − s/v|; the picture is the pencil's own, read from a smaller copy of its texture for the blur.
  The paper is thin: the image shows through from behind, which is the side the camera sees (the silver must face the camera, and the light comes from the silver).
- The light between the rims of the mirror is a thin wash on the drawing layer: gathering to X′, spreading after it, stopped by the paper and the rail.
- The real image is a solid pencil hanging upside down, the virtual one a ghost at 55 %; both are drawn last, from a fresh depth, so that neither rail nor glass cuts them.
- The opening stands at u = 40 cm (v = 24, m = 0.6, whole numbers), not the 45 first planned, so that the image is about 40 px on a phone held upright; there the frame gives up the far half of the mirror.

## Honest notes
- Only two rays in one plane are drawn, out of countless. "দুটি রশ্মি আঁকা" says so on the view.
- The mirror is drawn large: 20 cm across on a 30 cm radius, as in the sister figures; so the rays are the book's rules, not a raw trace (above).
- The silver is on the front surface, so no refraction in the glass comes into it (the note of `spherical-mirror-focus`).
- A real image of a lit pencil is dim in a bright room; the figure shows it clearly. An image longer than the paper (m > 2) runs past its lower edge, as it would.
- Between about u = 15 and 21 cm the inverted image is longer than the height of the axis over the rail: it is drawn through the rail, like a ray drawing. Past v = 62 cm it leaves the frame and a tab says where it is.
- The image is scaled by m in all directions; in truth depth scales by m². A pencil is thin, so it does not show.
- The bright room in the silver is the sister figure's invented studio; the pencil and rod in it are real traces, a far pencil kept at least 1.5 px wide. The paper and the rail are not traced in it.

## Open questions for the book team
- **The table** (p232) writes "অসীম দুরত্ব" and "দুরত্বের" in places, and "কোন" for কোনো; the figure spells দূরত্ব. Its compact table shortens rows ("O ও অসীমের মাঝে") for a narrow column.
- **Row 4 of the table:** the object "কেন্দ্রবিন্দু O এবং ফোকাসবিন্দু F এর মাঝে"; **p232 (a)** then says the image is "কেন্দ্রের বাইরে": they agree.
- **চিত্র ৮.২৩** draws the ray through F landing on a mirror much taller than any on this bench. With a real 20 cm mirror, that ray misses it; the figure uses the ray to P there. Is that acceptable?
- The book gives no sign rule for v; the figure says "আয়নার পেছনে" and shows −৩০ only in the formula step, with a line saying what the minus means. m is a size, without a sign: m = l′/l, as p234.
- p233's example is used in the test (object and image change places).
