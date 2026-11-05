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
- **The story comes first (0.3.0, the owner: "Where is the glass here?… students need a proper understanding").** Five states, one idea to a tap, nothing moves on by itself and a tap during a step is ignored: 0 the glass and the pattern under it (`কাচের দিকে তাকাও`); 1 the light of the pattern comes up through the glass to his eye (প্রতিসরণ), and the picture from his eye opens; 2 the glass rises to 85° in 3 s and the flower comes up in it (প্রতিফলন): the beam to his eye is drawn in two bands side by side, pale for the pattern's share (1 − R) and amber for the flower's (R), always the same width together; 3 the normal, then the two arcs, with only the two angles, অভিলম্ব and the two ray names; 4 how much: the glass goes back to 30°, the percentages on the rays and the graph appear, and the action walks 30° → 60° → 80° → 87°. When all four stops are seen the action offers the test, never forcing it. The same four words in the panel are the steps, then the stops (each with its percent). A step's word or `আবার দেখো` plays it again; a word further on waits its turn.
- **Labels:** the ray names have hand-picked places and then a grid of fallbacks; a browser test checks at four sizes that no label lies under the picture or the handle, in any step and at any stop. The picture is avoided by its box, not its element: the kit skips an element while it fades in, and with nothing drawing afterwards a label would stay under it.
- **The numbers wait.** No percent on the view and no graph before step 4 (a browser test checks this). `step` (URL and `set`) opens a step; an `angle` other than 30° opens step 4, since the book is asking for an angle.
- **The handle:** a white disc with ↕ on the lower edge of the glass, on the side nearest the camera, from step 2 on, with the dashed range of the glass beside it and `টেনে সরাও` until the first drag (the disc then stays, smaller). A drag on the handle or the glass lifts it in whole degrees; a tap on the glass is the action; arrow keys step it by 1° (Shift: 5°). The camera closes in as the glass rises (the frame follows it), and each step flies to its own framing in at least 1.9 s.
- **The whole way round:** no azimuth limits, polar 5°–88°, zoom limited, damping on. The view turns only after 8 px, so a tap stays a tap. The dark `360° ঘুরিয়ে দেখো` tab shrinks to its icon after the first turn; `সামনে` (the kit's front button) brings back the guided view, and so does the next step. The kit lowers the resolution of a slow phone while something moves and reports it as a resize: the figure keeps the student's turn unless the size really changed, or the first drags on a slow phone would snap back. The glass has an underside for a low camera; the boy, the plant and the jack are whole.
- **The rays are thick in proportion to the light they carry** (`src/rays.js`): 6 px comes in and splits into R and 1 − R. A ray under
  about 18 % stops at 1.1 px and fades instead (opacity down to 0.5), and the corner note says thin rays are drawn thicker than true. Crisp vector lines over the view from exact 3D points, like `reflection-laws` and `light-at-boundary`.
  The numbers are `percent()`, Fresnel for unpolarised light and n = 1.5: 4 % at 30°, 9 % at 60°, 39 % at 80°, 74 % at 87°.
- **What he sees** is the picture in the corner: a real second pass from his eye, looking at the point of incidence. There R
  is worked out for each pixel by the same equations, in the shader, so near the far edge the glass is more of a mirror than near him,
  as it is in life. The paper's pattern fades and the flower comes up. The pass runs only when the angle or the size changes.
- **The mirror world** (`src/scene.js`, top comment): mirrored copies of the flower, the boy and the wall are drawn first, the
  depth is cleared, the top of the glass (the printed paper) is laid over them with opacity 1 − R, and the rest of the scene is
  then drawn over all that. No stencil (the kit's renderer has none), no render target, no second pass for the outside view. Each copy
  turns its normals back in the shader, so it is lit as the real one, and is cut off at the glass, so what is below the
  glass's plane is not reflected. A cost of about 20 more draw calls. Worst view from any side: see the pull request (at most 150 draw calls, 300k triangles).
- **The paper's parallax:** the paper really lies under the 4 cm slab, so the shader moves it by the refracted ray's path (Snell).
- **The graph** in the panel is the same function, drawn at its real pixel size so its words stay 12 px. It is not shown at 390×520.
- **The faint dashed line** from the eye to the flower is the line the glass rises toward (step 2 and the test). The labels `ফুলের প্রতিবিম্ব` and `নিচের নকশা` with small arrows inside the picture come and go with how much of each there is (R ≥ 9 %, R < 50 %), and are off in the test.
- **The test:** the amount at the scene's small angle (four single numbers); the glass rises with a dashed outline and rays of where it was (`আগে`) staying on the view (both grew);
  the picture from his eye alone, large, at 30°, 60° or 85° at random; the percent that goes in, read off the reflected ray's label at 60°, 80° or 87°; and the window, as an
  angle to the glass (5°, 30°, 60°, 90°: the trap is that 90° to the glass is 0° from the normal). The kit scores numbers,
  so the choices are places in a list. A browser test answers all five right, and one wrong.

## Honest stylisation
- **The glass is drawn big:** 32 × 32 × 4 cm where a real sheet of this size would be about 1 cm thick, so that it reads as glass on a phone. It stands on four rubber feet, 1.4 cm above the jack's dark plate, so that nobody takes one for the other.
- **The clear margin is a tint.** The printed card is 22 cm square, stuck under the middle of the glass (it was indigo edge to edge and read as a black tabletop). The 5 cm margin round it mirrors the world like the rest, but what lies under it is a flat pale blue-green, not the jack and the bench seen through it: that would need the scene twice, and real clear glass over a dark jack would look dark. The edges' bright green lines and the two soft diagonal highlights are painted; neither is in the picture from his eye.
- The card being pale means a little less contrast for the flower than the old dark sheet: this is why the story's lift ends at 85° (R = 58 %), not 80°.
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
