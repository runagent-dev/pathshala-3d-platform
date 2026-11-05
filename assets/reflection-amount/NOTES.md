# Notes: How much light is reflected (কতটুকু প্রতিফলন)

Book: physics-9-10 › 8.2.1 › p216, চিত্র ৮.০৫

## What the page shows
After the laws of reflection the page asks the most important question, "কতটুকু প্রতিফলন হবে?". A mirror reflects nearly all of
it, but reflection can happen between any two media. The law is ফ্রেনেলের (Fresnel) সূত্র, left for later; for now: আপতন
কোণ যত বেশি হবে প্রতিফলনও হবে তত বেশি। Ordinary glass reflects only 4 % to 5 %, the rest goes in, refracted; near 80° or
90° the reflected light grows very much. "জানালার কাচের পাশে দাঁড়িয়ে তোমরা এখনই সেটা পরীক্ষা করে দেখতে পারো।"
চিত্র ৮.০৫: a boy on the left, a red flower on the right, a black bar between them, the normal, θᵣ on his side and θᵢ on the
flower's. Caption: "আপতন কোণ বেশি হলে প্রতিফলন অনেক বেশি হয়।"

## The one idea to teach
How much light a surface reflects depends on the angle: glass gives back 4–5 % at small angles and much more near 80°–90°.

## Terms (as in the book)
কতটুকু প্রতিফলন, ফ্রেনেলের (Fresnel) সূত্র, আপতন কোণ (θᵢ), প্রতিফলন কোণ (θᵣ), অভিলম্ব, আপতিত রশ্মি, প্রতিফলিত রশ্মি / প্রতিফলিত
আলো, প্রতিসরিত, কাচ, জানালার কাচ. The page writes ওপর. Added by the figure, not on the page: জ্যাক (in the screen-reader text only),
নকশা, জবা (screen-reader text only).

## How the figure works
- **The book's picture, with one thing that moves.** The eye and the flower stay where they are, at one height, 40 cm apart.
  The glass lies on a scissor jack between them and goes up toward the line from one to the other, so the light always meets it
  at the same point, half way, and tan θ = 20 cm ÷ depth under the line (`src/reading.js`). Moving the eye and the flower down
  is the same thing, but a real flower cannot move and an eye alone would have to travel over a metre to reach 85°.
- **One action** (`কাচ ওপরে তোলো`, its ring on the jack, a tap on the glass or the jack): 30° → 60° → 80° → 87°, then down again.
  The row of words goes to any stop and collects each stop's percent. A drag on the glass lifts it by hand, in whole degrees; arrow keys
  step it by 1° (Shift: 5°). The camera closes in as the glass rises (the frame follows it) and drops a little, so the subject stays large.
- **The rays are thick in proportion to the light they carry** (`src/rays.js`): 4 px comes in and splits into R and 1 − R (thin
  lines stop at 0.9 px). Crisp vector lines over the view from exact 3D points, like `reflection-laws` and `light-at-boundary`.
  The numbers are `percent()`, Fresnel for unpolarised light and n = 1.5: 4 % at 30°, 9 % at 60°, 39 % at 80°, 74 % at 87°.
- **What he sees** is the picture in the corner: a real second pass from his eye, looking at the point of incidence. There R
  is worked out for each pixel by the same equations, in the shader, so near the far edge the glass is more of a mirror than near him,
  as it is in life. The paper's pattern fades and the flower comes up. The pass runs only when the angle or the size changes.
- **The mirror world** (`src/scene.js`, top comment): mirrored copies of the flower, the boy and the wall are drawn first, the
  depth is cleared, the top of the glass (the printed paper) is laid over them with opacity 1 − R, and the rest of the scene is
  then drawn over all that. No stencil (the kit's renderer has none), no render target, no second pass for the outside view. Each copy
  turns its normals back in the shader, so it is lit as the real one, and is cut off at the glass, so what is below the
  glass's plane is not reflected. A cost of about 20 more draw calls.
- **The paper's parallax:** the paper really lies under the 3 cm slab, so the shader moves it by the refracted ray's path (Snell).
- **The graph** in the panel is the same function, drawn at its real pixel size so its words stay 12 px. It is not shown at 390×520.
- **The test:** the book's 4–5 % read at the scene's small angle; the glass rises in front of the student (both grew); the
  picture from his eye alone, with rays and angles hidden until the answer; where the rest goes; the book's window. The kit scores numbers,
  so the choices are places in a list. A browser test answers all five right, and one wrong.

## Honest stylisation
- The outside view's glass uses the boy's R all over, not the R of the student's own angle. That one (about 76° from
  above the bench) would look the same for every position of the glass. The picture from his eye is the exact one.
- The canvas blends encoded colours, not light. `pow(R, 0.62)` turns R into the opacity that gives the right brightness for a bright
  flower on the dark paper (fitted, not derived); bright lines of the paper dim a little more than 1 − R.
- One surface only: the paper is taken to touch the glass, so its underside gives no second reflection. A pane in a window, with air
  on both sides, reflects about twice as much (8 %), and the page's 4–5 % is for one surface.
- All that is not reflected counts as refracted: the small part absorbed (`light-at-boundary`) is left out.
- A ray does not show in clean air; the corner note says they are drawn. The refracted ray stops at the paper.
- 87° is the highest angle: the slab's top is then 1 cm under the flower's heart. Only the part of the flower above the glass's
  plane can be mirrored, as in life, so its image is cut there.
- The flower is the book's in spirit: a hibiscus (জবা), the book's five red petals and long column. The second flower and bud are
  there because a plant has them.
- The boy is the student of `plane-mirror-image` (`src/boy.js` is a copy with his own head mesh), in the book's yellow shirt, with short curls.

- The GLB has the jack, the glass and the plant, not the boy: with him it is 1.8 MB, against the chapter's 1 MB.

## Open questions for the book team
- The page says "প্রতিফলন কোণ যদি বেশি হয় 80°" where it means আপতন কোণ as well (they are equal). The figure says আপতন কোণ throughout.
- The jack and the paper are not in the book. They make one thing move, and give something to see through.
- The panel's "ওপরে" follows this page's spelling. Should a book-wide spelling win?
- Does the book want the words "ফ্রেনেলের (Fresnel) সূত্র" only after the last stop, as here, or from the start?
