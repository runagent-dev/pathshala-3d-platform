# Notes: Why a rose looks red (শোষণ: বস্তুর রং)

Book: physics-9-10 › 8.2.1 › p217 (the part শোষণ). Page image: `reference/page-217.png`.

## What the page shows
The heading শোষণ, the question why a red rose among green leaves is red and its leaf green, and the surprise: in green
light the rose looks কুচকুচে কালো, in red light the leaf does. চিত্র ৮.০৬: a red rose with green leaves; grey arrows
"সাদা (সব রং)" going in, red arrows "লাল" and green arrows "সবুজ" coming out. Caption: "একটা বস্তু সব রং শোষণ করে যেটা
প্রতিফলিত করে সেটাকেই তার রং বলে মনে হয়।"

## The one idea to teach
An object reflects only its own colour and absorbs the rest, so its colour depends on the light: a red rose is red in
white or red light but black in green light, and a green leaf is black in red light.

## Terms (as in the book)
শোষণ, সাদা আলো, বর্ণহীন, সব রং, লাল আলো, সবুজ আলো, প্রতিফলিত, কুচকুচে কালো, গোলাপ ফুল, পাতা. The page writes "সম্পূর্ণ লাল আলো".
Colours of the band: বেগুনি নীল সবুজ হলুদ কমলা লাল (the owner's list; same order as the spectrum).

## How the figure works
- The owner's direction (2026-11-05): the band of spectrum colours, the absorbed ones ending at the surface, only red and
  green leaving toward an eye (reference `owner-ref-absorption-apple.png`), but with the book's rose. It replaces the first
  idea of a coloured lamp alone. The owner's rule for the chapter ("very very clear, proper 3D angle, proper zooming") is
  the shape of the run below.
- **The camera tells the story** (`run` in `src/app.js`, `FRAMES` in `src/scene.js`). `full`: the lamp, the rose, the eye. The
  band to the petal comes; the camera goes close to the petal while the colours sink in, and the red arrow leaves
  (`rose`). The band to the leaf comes as the camera moves to the leaf, and the green arrow leaves (`leaf`). Then it stands
  back to `both`, the picture of the whole idea. A new light goes back to `full` for the filter, then close to the object
  that goes black, then `both`. About 7 s for white, 5 s for a colour; a tap on a word interrupts it. The test uses no close-ups.
- **The drawing** (`src/rays.js`) follows `reflection-laws`: a 2D canvas over the view, every point projected from 3D through
  the camera, a thin dark edge. It grows a little as the camera comes closer. Each ribbon is six stripes side by side, red on
  the eye's side. On the bloom the stripes end on the projected circle of `LAYOUT.bloomCentre`; on the leaf, on its projected
  midrib. An absorbed colour fades out in its own colour with alpha, so no grey shows at the end. The object's own colour
  stops hard, and its arrow starts from the exact point where that stripe landed, aimed at the iris and stopping at the eye's
  edge. Only what leaves gets a strong arrow; a band carries two slim white marks, narrower than itself. Where no arrow
  comes, a faint dashed line of sight goes from the eye to the black object.
- **Labels** are pinned to the drawing: at the end of the band (শোষণ, only where something is absorbed), on the arrow
  (প্রতিফলন), on the object (কালো দেখায়). They use fixed offsets, not `spots`, so none is ever dropped. The test checks the set.
- **The colours are physics** (`src/reading.js`): the 3D view multiplies light by `REFLECTANCE`, channel by channel, and nothing
  else. All lights take the lamp's colour, there is no environment map, and tone mapping is off: the kit's neutral tone
  mapping desaturates bright colours, which leaks one channel into the others.
- **The room stays dark.** The wall is a fixed slate (unlit), and the beam is a narrow spot cone on the rose, its leaves and the
  top of the vase. The table has a fixed slate tone of its own plus a very low reflectance: a black leaf must still
  show against it, and only a small pool of the beam falls on it. The vase is a dark neutral glaze.
- **Why the absorbed channels are so small** (rose G 0.0055, leaf R 0.0045): reflectance 0.04, the brief's first number,
  still shows on a screen at about a fifth of full brightness (sRGB is not linear): a clear dark green, not কুচকুচে কালো. A real
  petal reflects a few per cent of green. A faint line along each lip (G 0.011) keeps the shape of the petals in the black.
- The petals' and the leaf's sheen and specular are in their own colour for the same reason (a real waxy surface does give a
  little white back; drawn, that would be a green glint on a rose the panel says reflects nothing).
- **The rose** (`src/rose.js`): 27 petals in a spiral at the golden angle. Each is a disc-shaped sheet, so its grid's edge is its
  round outline, with no point at the tip; it is laid on a cupped curve walked up from the claw, tight in the heart and open
  outside, and its rim rolls outward along the outline. Soft shade between petals is baked once into the vertex colours from a
  coarse density grid and smoothed along each petal; it changes brightness only, so the channel ratios stay exact. The
  bloom casts a shadow on the leaves but does not receive any: shadow maps speckle on thin double-sided petals. Five sepals, a
  hip, a stem with five thorns, five leaflets with soft rounded teeth and veins (texture 512 px, its red channel almost empty).
- **The lamp** has a filter on a hinge that swings over the lens. It is drawn a little turned toward the viewer, so that the
  lit lens shows, and the key light comes from the lamp's side but further forward than the lamp is drawn (z = 13 against
  −3): from the lamp's true place the bloom's face would be dark.
- Blue light is not in the row of words (the book has only red and green); it is one test question, and `?light=blue` works.
- The test, in a fixed order so that no scene gives away a later answer: predict (leaf in red or rose in green), why, the light
  read from the objects (the other colour, with the lamp out of the frame), where light reaches the eye from in blue light, and
  white paper in red light. Each finishes the picture after the answer. Only one answer is "black". The first-round questions
  on counting the stripes were dropped: that answer depended on the drawing, not the physics.

## Honesty (also said on the view: "রং ও রশ্মি বোঝার জন্য আলাদা করে আঁকা")
- In white light the colours are mixed, not side by side; six stripes stand for countless wavelengths.
- A petal scatters its red in all directions; only the ray to the eye is drawn. The arrows do not obey a mirror's law on purpose:
  this is ব্যাপ্ত প্রতিফলন from a rough surface.
- A real rose and leaf reflect a little of the neighbouring colours (a leaf some yellow); a real filter passes a band, not one
  wavelength. The figure follows the book's "সম্পূর্ণ লাল আলো". The eye is a diagram, not to scale.
- Blue light: a real red rose looks a very dark purple in blue light, not perfect black, because it reflects a little blue;
  the figure and its test question use the book's simple rule.

## Open questions
- `শোষণ` has no topic number of its own on the page; the figure sits under 8.2.1 as the brief says.
- The English word for কুচকুচে কালো is given as "jet black".
- Added words not on the page: ফিল্টার (the lamp's filter), সাদা কাগজ (the test's paper); the six colour names' order is the owner's.
- Bangla wording needs a person's check against the book.
