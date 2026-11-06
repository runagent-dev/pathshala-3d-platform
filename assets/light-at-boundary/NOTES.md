# Notes: Reflection, refraction, absorption (প্রতিফলন, প্রতিসরণ ও শোষণ)

Book: physics-9-10 › 8.2 › p214, চিত্র ৮.০২

## What the page shows
Section 8.2 প্রতিফলন opens by saying reflection is much wider than a mirror: whenever light is sent from one medium to
another, three different things happen. চিত্র ৮.০২ is a flat line drawing: a straight boundary, প্রথম মাধ্যম on the left,
দ্বিতীয় মাধ্যম (tinted) on the right, one ray coming in, three lines going out, labelled প্রতিফলন, প্রতিসরণ, শোষণ
(the last a short faint line). Caption: "এক মাধ্যম থেকে অন্য মাধ্যমে আলোর প্রতিফলন, প্রতিসরণ ও শোষণ।" Below it the page says
light needs no medium, and that air is so light that treating it as empty is no great mistake.

## The one idea to teach
When light reaches another medium, three things happen at once: part comes back (প্রতিফলন), part goes in (প্রতিসরণ) and part
is absorbed (শোষণ).

## Terms (as in the book)
প্রতিফলন, প্রতিসরণ, শোষণ, শোষিত, প্রথম মাধ্যম, দ্বিতীয় মাধ্যম, মাধ্যম, আলো, খানিকটা, শূন্য মাধ্যম, "দুই মাধ্যমের মধ্যের তল"
(the book: "দুই মাধ্যমের মধ্যের তলে"), "বিদ্যুৎ এবং চৌম্বক ক্ষেত্রের তরঙ্গ". Added by the figure, not on the page: টর্চ, টেবিল.

## How the figure works
- **One object, one ray.** A block of clear glass on a bench and a small torch in a clamp stand. The owner asked for a very
  simple figure, the concept at first sight, so no normal, no angles and no slider: those belong to `reflection-laws` and
  `reflection-amount`. The boundary is the top face (horizontal), not vertical as in the book: light falling on a block
  on a table needs no explaining.
- **Three taps, one action** (the big button, its ring on the point where the light arrives, a tap on either). The camera
  goes to the place first (`FRAMES` in `src/scene.js`), then the part comes out of the point of arrival. What was seen
  before dims. The result line fills in: আলো ভাগ হয়: ? + ? + ? (a division of the light, not an equation). The fourth tap shows all three together, the
  picture of the book and the poster. The row of words goes back to any part.
- **The rays are traced** in `src/reading.js`: the reflected ray at the same angle, the refracted ray by Snell's law with
  n = 1.5 (50° → 30.7°), each from exact 3D points. `src/rays.js` projects them through the camera and paints them on a 2D
  canvas over the view, in the style of `reflection-laws` and `colour-of-objects`: thin lines with a halo, small filled
  chevrons. A thinner line carries less light: incident 3 px, refracted 2.8, reflected 1.5, absorbed 1.2.
- **Absorption** is not a fourth ray: a thin solid line that dies away within 2 cm, into a bright warm mark on the surface at
  the point of arrival, labelled "তলে শোষিত". No dashes: in this chapter a dashed amber line is a ray behind a mirror and a
  dashed slate one the normal. The book's sentence places it at the surface
  between the two media, so the beam does not fade along its way through the glass.
- **The stand** stands behind the torch in the plane of the rays, so that nothing of it shows through the glass in any
  view the figure opens. Its base may run off the left edge.
- **The glass** is not `transmission`: two passes of one rounded box (back faces, then front faces) whose opacity and
  faint green rise where the surface turns from the eye, a real block's bright edges, cheap on any phone.
- **The test** reads the picture. A new letter on each ray every time, so "রশ্মি ক" must be looked at; the wrong choices are
  the other rays (the incoming one is the trap). The medium labels stay off until the question about the first medium has
  been answered. Then another angle (the torch really moves; the rays are traced anew at 65°, and the student finds the
  refracted one), and the book's empty medium, whose wrong choices are real mistakes (all absorbed, no reflection).
- **The test's scoring:** the kit scores numbers, so the choices are places in a list (as `paper-vocal-cord`). A browser
  test answers all five right and checks the green mark and "৫টির মধ্যে ৫টি", and answers one wrong. `get` gives
  `question: { kind, right }` for that.
- **How to use** (v0.3.0, kit 1.8.0 `createHowTo`): under the action, the same icons as on the view, with a few words: the ⟲ ৩৬০° pill and the সামনে button (nothing here is dragged; the tap on the point of arrival is the action itself, which already carries its ring on the view). Tapping an item points at its control on the view.

## Honest stylisation
- A torch's light does not show as a line in clean air. The ray is drawn; a corner note says so ("রশ্মি বোঝার জন্য আঁকা").
- The torch has a cap with a small hole: that is why a narrow pencil leaves it.
- The line widths only say "less light" (incident > refracted > reflected). They are not shares. Real clear glass at 50°
  reflects about 6 % and absorbs far less than that; the figure shows no percentages (the amounts are `reflection-amount`).
- The refracted ray stops on the bench under the block. What happens at that second surface is left out on purpose.

## Open questions for the book team
- The book puts absorption at the surface between the media. In real glass most absorption happens along the way, and very
  little; the figure follows the book's sentence.
- Words added: টর্চ, টেবিল, "কাচের ব্লক" (in the screen-reader text only).
- Should the figure name "চিত্র ৮.০২"? It does so in the caption on tall panels (1280×800) only.
