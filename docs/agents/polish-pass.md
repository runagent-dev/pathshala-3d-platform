# The polish pass: one standard for every figure (2026-11)

The owner looked at all the figures together and asked for:
- one layout;
- no wordy text on the 3D view;
- every figure working on every device;
- a proper coloured setting in every figure;
- arrows and explanations that are crystal clear;
- figures that run butter smooth without losing detail.

Every figure is checked against this list, fixed, verified and merged in its own pull request. New figures follow it
from the start.

## 1. Layout: the 3D, the panel beside it

- **Where the panel goes.** The kit's shell (kit 1.5.0) puts the panel beside the 3D on every landscape frame
  (aspect ≥ 1 and at least 600 px wide: 640×400, 800×500, 844×390, 1280×800), full height, scrolling if needed,
  with a tab on the 3D's right edge that hides it. On portrait frames (390×700, 390×520) it stays below, and a touch
  phone held upright gets a card asking to turn it sideways.
  - A figure's CSS never moves the panel itself. Remove old figure rules that set `.pvc-shell` columns or rows.
  - The side panel is a container named `pvc`: a figure's `@container pvc (…)` rules for its sheet measure the
    panel. Write the sheet for a narrow column (280–400 px): one column, no wide two-column grids.
- **Heights.** On a phone held upright (390×700) the 3D gets at least about 55 % of the height. Beside the 3D the
  panel may scroll, but the action button and the reading should be visible without scrolling at 844×390.
- **The 3D framing.** Beside the panel the 3D view is about 2/3 of the width: frame the camera so the main object
  fills it at 844×390 and 1280×800, and stays whole with the panel hidden.
- **The same frame everywhere.** Use the kit's classes before inventing new ones.

## 1b. Only the main object

- Keep the object(s) the idea is about, big, and a simple coloured setting (a floor and a soft coloured backdrop or
  sky gradient; never white or green). Remove decorative buildings, trees, crowds, pots, flags, extra props.
- Few arrows and few colours: one arrow per force that matters, each outlined so it reads on its background, each
  with a short label. If three arrows say the same thing, show one.

## 2. Text on the 3D view: labels only

- **What may stay on the 3D view:** short labels naming a part or a force, with its value. A symbol or two or three
  words plus a number and a unit, about 24 characters at most. For example `T = ৯.৮ নিউটন`, `ওজন W`, `সরণ = ৪০০ মি`.
- **What moves to the panel:**
  - sentences, captions, legends ("the arrow's length is proportional to the force"), explanations and instructions;
  - each one goes into the rule line, the result line, or a short line in the sheet.
- **The hint line.** The kit's hint line on the view may carry one short prompt while it matters, and nothing more.
- **Labels must not:** overlap each other, the corner buttons or the action marker; leave the view; or be clipped, at
  any of the six sizes.

## 3. Colour and clarity

- **The setting.**
  - No white or near-white background, and no green or grass-dominated background.
  - Every figure has a proper coloured, detailed setting that fits the topic: a room, a workshop, a sky at a time of
    day, a courtyard, a sea.
  - The floor, walls and sky are real-looking, not one flat colour.
- **Arrows.**
  - Every arrow stands out from what is behind it: bold, with an outline (white or dark).
  - Its colour must not be close to the background or the object it sits on: no red arrow on a red wall, no blue arrow
    over blue water.
  - Arrows that mean different things have different colours and are also named in their labels, because colour is
    never the only cue.
- **Labels.**
  - Labels have a solid chip with a contrast of at least 4.5:1.
  - A label's colour matches its arrow.
- **Explanations.** In the panel, in the book's words, one idea at a time; crystal clear to a student without help.

## 4. Every device

- **Sizes.** The six sizes are 390×700, 390×520, 844×390, 640×400, 800×500 and 1280×800. At all of them:
  - nothing scrolls;
  - every control is on screen and at least 24 px (aim for 44 px);
  - no text is clipped;
  - labels stay inside the view.
- **Touch.** Touch, mouse and keyboard all work: the arrows move the part, and Tab reaches every control.
- **Rotation.** Turning the phone or resizing the window in the middle of an animation leaves nothing broken.

## 5. Butter smooth, with the detail kept

The kit (1.4.0) already does three things:
- it redraws shadow maps only when the scene changes, never when only the camera moves;
- it pauses while the figure is off screen;
- it lowers the pixel ratio a little on a device that can't keep up.

In each figure:

- **Shadows.**
  - Fit the shadow camera tightly round what casts shadows (left/right/top/bottom/near/far).
  - Then choose `mapSize`. With a tight fit, 1024 usually looks the same as 2048 on a loose fit. Keep 2048 only where
    a large area's shadows are seen up close.
  - Keep `radius` as small as still looks soft.
  - Only objects whose shadows are seen should `castShadow`. Small details, labels and arrows should not.
- **Geometry.**
  - Match segment counts to the size on screen: 24–32 segments for small round parts, 64 for a large hero sphere,
    rarely more.
  - Merge static scenery into a few meshes, one per material (`BufferGeometryUtils.mergeGeometries`).
  - Use `InstancedMesh` for repeats: trees, fence posts, bricks, particles, coins.
  - Aim for 150 draw calls or fewer and 300 k triangles or fewer in view.
- **Materials and textures.**
  - Share geometries and materials.
  - Avoid `transmission` (it renders the whole scene a second time). A transparent standard or physical material with
    a good environment reflection usually looks the same.
  - Canvas textures are made once, sized to a power of two, 1024 at most (512 for label art).
- **Per frame.**
  - No new objects in tickers: reuse vectors and matrices.
  - No rebuilt geometry: update attributes in place, or scale.
  - Write to the DOM only when the text changes, and read layout before writing it.
  - A ticker returns true only while something really moves, so an idle figure draws nothing.
- **Cleanup.** Dispose of geometries, materials and textures that are removed.
- **Measure before and after.** Record draw calls, triangles, texture memory and time to ready. Write the numbers in
  `NOTES.md`.

## 6. Bugs

Look for:
- console errors;
- a reset that doesn't reset everything;
- a test (quiz) that can get stuck;
- a control that does nothing in some state;
- labels that jump;
- an animation that breaks when it is interrupted (tapping again, switching tabs, rotating).

Fix what you find.

## For each figure

1. Read `NOTES.md`, open reviews and the book page in `reference/`.
2. Measure. Take pictures at the six sizes.
3. Fix sections 1–6.
4. Bump `version`: patch, or minor when the layout or the setting changes visibly. Add a short "Polish pass" section to
   `NOTES.md` with what changed and the before/after numbers.
5. Run `npm run verify -- <id>`, then look at every picture.
6. Open one pull request per figure, `fix(<id>): polish pass: …`, and merge it once CI is green.
