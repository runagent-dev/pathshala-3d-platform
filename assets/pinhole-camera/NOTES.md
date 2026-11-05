# Notes: Pinhole camera (পিন হোল ক্যামেরা)

Book: physics-9-10 › 8.3.1 › p222 (the একক কাজ with চিত্র ৮.১৪); বাস্তব প্রতিবিম্ব is defined on p220.
Page images are in `reference/`.

## What the page shows
চিত্র ৮.১৪: a candle, a pale board with a tiny hole, a sheet of paper with the flame upside down on it; two rays from the top
and the foot of the flame cross at the hole. The একক কাজ: in a dark room, make a very small hole in a board, put it before a
burning candle, put white paper on the other side, keep other light off it; the image of the flame shows, and moving the paper
makes it bigger or smaller. The book asks: real or virtual? upright or inverted? same or different distance? big or small? It
answers: "প্রতিবিম্বটি বাস্তব, উল্টো, সকল দূরত্বে স্পষ্ট এবং যত দূরে তৈরি হয় তত বড়। এই পদ্ধতিতে পিন হোল ক্যামেরা তৈরি হয়।"

## The one idea
Light travels in straight lines, so the rays from the top and the bottom of the flame cross at the tiny hole and make a real,
upside-down image on the paper; moving the paper farther makes the image bigger (size ∝ distance), and it stays sharp at every
distance. It is the first real image of the chapter (`plane-mirror-image` has a virtual one).

## Terms (as in the book)
সূক্ষ্ম ফুটো, বোর্ড, জ্বলন্ত মোমবাতি, শিখা, সাদা কাগজ, অন্ধকার ঘর, প্রতিবিম্ব, বাস্তব, অবাস্তব, উল্টো, সকল দূরত্বে, স্পষ্ট, পিন হোল
ক্যামেরা. Letters from চিত্র ৮.১০: X, Y, X′, Y′ (the flame's tip and foot, then their images); l, l′, u, v as the chapter's mirror
figures use them. Added by the figure, not on the page: শিখার ডগা / গোড়া, ঝাপসা, ক্ষীণ, চাকতি, বড় ফুটো.

## How it works
- **Seven states on one action** (`stage` 0–6, `app.js`): the dark paper → (1) prick the hole (camera to the hole, the first light
  goes through, camera with it to the paper, the image comes up) → (2) the ray from X → (3) the ray from Y, the bow-tie between
  them; then the camera widens and the distances and lengths come in → (4) drag the paper (and the candle), or tap for a slide to
  v = 24 cm → (5) a big hole, close on the paper → (6) the tiny hole again, the paper sweeping near and far. The words
  (বাস্তব · উল্টো · দূরে বড় · স্পষ্ট) go to the place where each is found.
- **Geometry** (`reading.js`, unit-tested): the hole is the origin of the rail's scale, the candle at x = −u, the paper at x = +v.
  m = v/u, l′ = l × v/u. A point lands as a disc of diameter d(u + v)/u. Brightness per unit of paper goes as (d/v)²: the light in
  grows as d²/u², the area it covers as (v/u)²; u cancels. Numbers: l = 4 cm, u 9–21 cm, v 6–27 cm, d = 1 mm or 8 mm.
- **The image is exact.** The paper's shader takes each point of the paper back through the hole to the flame (it reads the
  flame's own picture, `flameTexture`, the one the 3D flame shows) and averages 13 taps over the disc the hole makes. So the size,
  the flip (both ways), the blur and the flicker are all the real thing. Brightness on screen is (d/v)² to the power 0.4 (the eye's
  response, roughly), held short of white: the true ratio of 64 for the big hole cannot be shown on a screen.
- **The candle's light is by hand** (`lit` in `setting.js`): each material adds the flame's warm light, and a point past the board
  asks whether the straight line back to the flame passes through the board. So the shadow is exact, moves with the candle, and
  costs no shadow map or extra light. The only three.js lights are a dim room: the paper's room light is halved in its shader, and
  the GLB keeps the paper white.
- **The flame** is a camera-facing quad (a flame is round) with one picture drawn once at start-up, swayed in the shader. It runs
  at 24 frames a second at most, without redrawing the shadow map, and stops for prefers-reduced-motion. The GLB has a plain lathe
  flame (on a layer the camera does not draw).
- **The drawing** (`diagram.js`) follows the chapter: a 2D canvas over the view, painted from exact 3D points through the camera.
- **The panel graph** (only where the side panel has room): l′ against v, a straight line through zero whose slope changes with u.

## Honest simplifications
- Rays are drawn; a few chosen lines out of countless. The corner note says so.
- The board is drawn thin (42 %) once rays are shown, as the book's picture draws it, because the rays past the hole lie behind it
  from this side. The corner note says so.
- The hole is 1 mm, but is drawn no smaller than 2.8 mm, or a phone could not show it. The note says so. The image's blur uses the
  real 1 mm.
- The room is not fully dark: dim enough for the image to glow, light enough to see the apparatus.
- Diffraction is left out: at 1 mm and v = 27 cm it is about 0.4 mm, less than the geometric blur of 3.3 mm.
- The flame's sway on the paper is a mirror of the sway seen on the flame's quad, not a true 3D sway.

## Open questions for the book team
- The book writes no measurements; the 4 cm flame and the ranges are this figure's.
- "সকল দূরত্বে স্পষ্ট" is true of the geometry here (the blur stays under 8 % of the image at every distance on the rail). The
  brightness rule ("দূরে ক্ষীণ") and the big hole are not on the page; they are the honest other side of it and the test asks them.
