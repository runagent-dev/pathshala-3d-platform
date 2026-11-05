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
  idea of a coloured lamp alone.
- **The drawing** (`src/rays.js`) follows `reflection-laws`: a 2D canvas over the view, every point projected from 3D through
  the camera, even anti-aliased shapes, a thin dark edge, filled chevrons. Each ribbon is six stripes side by side, red on
  the eye's side. On the bloom the stripes end on the projected circle of `LAYOUT.bloomCentre`; on the leaf, on its projected
  midrib. An absorbed colour fades out over the last 26 px, in its own colour with alpha, so no grey shows at the end. The
  object's own colour stops hard, and its arrow starts from the exact point where that stripe landed. A coloured light is one
  stripe, 2.6 stripes wide. The chevron on a ribbon is the ribbon's own stripes, widened and cut to an arrowhead.
- **The colours are physics** (`src/reading.js`): the 3D view multiplies light by `REFLECTANCE`, channel by channel, and nothing
  else. All lights in the room (key, front, hemisphere) and the wall take the lamp's colour, there is no environment map,
  and tone mapping is off: the kit's neutral tone mapping desaturates bright colours, which leaks one channel into the others.
- **Why the absorbed channels are so small** (rose G 0.0055, leaf R 0.0045): reflectance 0.04, the brief's first number,
  still shows on a screen at about a fifth of full brightness (sRGB is not linear): a clear dark green, not কুচকুচে কালো. A real
  petal reflects a few per cent of green. The small remainder keeps a faint hint of the petals' shape in the black.
- The petals' sheen and specular are in the petal's own colour for the same reason (a real waxy surface does give a little
  white back; drawn, that would be a green glint on a rose the panel says reflects nothing).
- **The rose** (`src/rose.js`): 34 petals in a spiral at the golden angle. Each column of a petal is walked up from the claw with
  a turning tangent, so it is a true cupped curve, tight in the heart, open outside, the lip and edges rolled back; each
  overlaps its neighbour (`tuck`). Soft shade between petals is baked once into the vertex colours from a coarse density
  grid; it changes brightness only, so the channel ratios stay exact. The bloom casts a shadow on the leaves but does not
  receive any: shadow maps speckle on thin double-sided petals. Five sepals, a hip, a stem with eight thorns, five serrated
  leaflets with veins (texture 512 px, its red channel kept almost empty).
- **The lamp** has a filter on a hinge that swings over the lens. It is drawn a little turned toward the viewer, so that the
  lit lens shows, and the key light comes from the lamp's side but further forward than the lamp is drawn (z = 13 against
  −3): from the lamp's true place the bloom's face would be dark. Nobody can see the difference, and the lit side is right.
- The grey vase and table are neutral (equal channels): they show the light's own colour, so the figure needs no extra white card.
- The wall dims in pure light so that the black object still reads against it; the colour factors are by eye.
- Blue light is not in the row of words (the book has only red and green); it is the test's new case, and `?light=blue` works.
- The test: five questions in random order, each sets up its own scene and finishes the picture after the answer. `predict`
  and `which` always use opposite pairs (leaf in red with green light, or rose in green with red light), so that one scene
  never answers the other.
- Performance (844×390, shadows on): 19 draw calls, 62 k triangles a frame; ready in 1.6 s; GLB 0.95 MB. Nothing runs when idle.

## Honesty (also said on the view: "রং ও রশ্মি বোঝার জন্য আলাদা করে আঁকা")
- In white light the colours are mixed, not side by side; six stripes stand for countless wavelengths.
- A petal scatters its red in all directions; only the ray to the eye is drawn. The arrows do not obey a mirror's law on purpose:
  this is ব্যাপ্ত প্রতিফলন from a rough surface.
- A real rose and leaf reflect a little of the neighbouring colours (a leaf some yellow); a real filter passes a band, not one
  wavelength. The figure follows the book's "সম্পূর্ণ লাল আলো". The eye is a diagram, not to scale.

## Open questions
- `শোষণ` has no topic number of its own on the page; the figure sits under 8.2.1 as the brief says.
- The English word for কুচকুচে কালো is given as "jet black".
- Added words not on the page: ফিল্টার (the lamp's filter), the six colour names' order is the owner's.
- Bangla wording needs a person's check against the book.
