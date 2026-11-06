# Notes: Light and its spectrum (আলোর প্রকৃতি)

Book: physics-9-10 › 8.1 › pp212–214, চিত্র ৮.০১ and the first নিজে করো on p213

## What the page shows
Section 8.1 আলোর প্রকৃতি: we see because light enters the eye; light is an electromagnetic wave, a periodic wave, so it has a
wavelength, and only 400 nm to 700 nm is visible. Short is violet; as it grows, নীল সবুজ হলুদ কমলা লাল, then invisible.
চিত্র ৮.০১: a scale of wavelengths 10⁻¹⁴ … 10⁶ m with the bands named, and the visible sliver opened into the curve of
চোখের সংবেদনশীলতা, filled with the spectrum. নিজে করো (p213): hold a CD in sunlight, reflect the light on a nearby wall, and
you see the whole spectrum; the CD's very fine grooves work as a grating. Then ultraviolet, X-rays, gamma rays below, and
infrared, microwaves, radio waves above.

## The one idea to teach
Light is an electromagnetic wave; the colours we see are light of different wavelengths; only 400–700 nm is visible (violet
shortest, red longest); a CD's fine grooves spread white sunlight into that whole spectrum.

## Terms (as in the book)
আলোর প্রকৃতি, বিদ্যুৎ চৌম্বকীয় তরঙ্গ, তরঙ্গদৈর্ঘ্য, দৃশ্যমান আলো, বর্ণালী, স্পেকট্রাম (the caption), গ্রেটিং, খাঁজ, চোখের সংবেদনশীলতা,
বেগুনি নীল সবুজ হলুদ কমলা লাল, আলট্রা ভায়োলেট বা অতিবেগুনী, ইনফ্রারেড বা অবলোহিত, এক্স-রে, গামা রে, মাইক্রোওয়েভ, রেডিও ওয়েভ, সিডি, দেয়াল.
Added by the figure, not on the page: সাদা দাগ.

## How the figure works
- **The book's নিজে করো, exact.** A real CD (120 mm, 15 mm hole, 1.2 mm thick, clear hub and rim, a bright stamper band, the
  silvered data area, a plain printed back) held by its lower edge in a small stand, and a white wall on the bench. Sunlight
  comes down from above; there is no room, no window and no slit plate (a plate near the beam would stand in the camera's
  way, since the sun is on the camera's side of the disc).
- **The grating is traced in 3D** (`src/reading.js`): the sunlight falls on the upward radius of the disc, where the tracks run
  level. Each ray leaves with the sun's along-the-disc part plus λ/d along the radius (d = 1.6 µm), and the part along the
  normal is what is left of a unit vector. λ = 0 is the plain law of reflection: the white patch. The unit tests check the
  textbook angles at normal incidence (400 nm → 14.5°, 700 nm → 25.9°), and the spread on the wall follows from the real
  angle of incidence, about 66° (the sun is well to one side of the disc's normal). Violet lands nearest the white patch, red farthest. The band flares a little
  toward red, because each end of the sliver of sunlight sits on a slightly different radius; that is what a real disc does.
- **Why the fan stands up.** An earlier layout spread the colours sideways on a wall seen at a slant: the fan was edge-on to
  the camera, a thin streak, and the white ray lay over the band. With the sunlight on the upward radius the fan opens in
  a plane that faces the camera, and heights on the wall are not foreshortened.
- **The disc's rainbow sheen is computed**: for each pixel the shader finds the wavelength that the grating sends from a soft
  lamp to the eye (orders 1–3), so the colours shift as the view turns, like a real disc. No texture, no transmission.
- **Six steps, one action** (the big button, its ring on the part, and a tap on the disc): 1 the light falls and the fan comes
  out; 2 the grooves in a magnifying circle; 3 the marker goes from violet to red, its ray carrying a wave that stretches;
  4 past red; 5 before violet; 6 how much we see. The camera flies first, cause before effect. The row of colour words goes
  to any colour at any time, and brings the light if it is not on yet.
- **The marker** is a knob on a scale printed beside the band. Drag it on the view (anywhere near the band), on the curve in
  the panel, or use the arrow keys. It names the colour and gives λ; past the ends the wall shows nothing and the panel says
  অতিবেগুনী or অবলোহিত, while the ray goes on as a dashed line.
- **The graph** (`src/graph.js`) is চিত্র ৮.০১: the bar of all wavelengths with the visible sliver, and the curve across that sliver,
  filled with the spectrum. A tall panel shows both, joined as in the book. A low panel shows the curve for visible light and
  the bar for the rest. At 390×520 it is left out; the result line still gives λ and the colour.
- **The numbers of the eye and of the colours are measured**: the CIE 1931 2° observer every 10 nm, ȳ being the book's curve
  (peak 1 at 555 nm). Colours: XYZ to linear sRGB, what falls below zero cut off, a touch of white so that no screen primary
  looks neon, and a fade to nothing at 396 and 704 nm. Not a hue wheel.
- **The drawing over the view** (`src/rays.js`) is a 2D canvas, from exact 3D points through the camera, in the style of
  `light-at-boundary`.
- **The test** is on the picture: which lettered part of the disc has the grooves (the sunlight is off until the answer, since
  where it falls would give it away), which mark has the longest wavelength, read a wavelength off the scale, which colour
  looks brightest, and what falls at a black dot outside the colours (a coin toss between the two ends each time). The panel
  teaches the fourth: the rule names the eye's peak, and the result line gives the sensitivity at every wavelength, also
  at 390×520 where the graph is left out. The kit scores numbers, so the choices are places in a list; a browser test answers all five right and one wrong.
  `get` gives `question: { kind, right }` for that.
- **How to use** (v0.3.0, kit 1.8.0 `createHowTo`): under the action, the same icons as on the view, with a few words: the ⟲ ৩৬০° pill, the সামনে button and the marker's ↕ disc ("টেনে রং বদলাও", from the light step on, in its place before that). The caption is short so that the row is one line in a side panel; a phone held sideways has a slightly lower graph (88 px) to make room. Tapping an item points at its control on the view.

## Honest stylisation
- Rays and the wave are drawn; the corner note says so. A beam is not seen in clean air. The wave is about 40 000 times too
  big (400 nm drawn as 1.7 cm), and its colour and its proportions are right: 700 nm is drawn 1.75 times as long as 400 nm.
  Only the electric part of the wave is drawn: a second, flat sine read as noise at this angle.
- The other orders: at this slant the −1 order does not exist (the grating equation has no solution). The second order
  does: on a real disc it would start 1.4 cm above the first order's red end (400 nm lands at 15.5 cm on the wall, 700 nm of
  the first order at 14.1 cm), so it overlaps where the marker's infrared end lies. The second order is left out so that one
  idea reads, and the corner note says so past the two ends ("পরের ক্রমের বর্ণালী দেখানো হয়নি"); the test says "এই রঙগুলোর
  বাইরে". The disc's sheen does include orders 1–3.
- The white patch is the mirror image of the sliver, about 0.5 cm by 0.2 cm of real light. It is drawn about 3 cm across with
  a soft edge, like the glare of a real patch, so that it is the brightest thing on the wall.
- The wall is kept white by a little of its own light (the emissive part of its material), since the bench lamp meets it at
  a slant.
- Sunlight is not equally strong at all wavelengths, and a real grating does not send equal shares to each colour; the band
  shows each colour at full strength, fading out by its opacity at the two ends (never through black).
- The two ends: the eye's sensitivity falls smoothly, and the book's 400 and 700 nm are round numbers. The figure stops
  showing colour at 396 and 704 nm so that "past the ends the wall shows nothing" is true.
- The polycarbonate of a real disc absorbs the shortest ultraviolet, so the marker stops at 330 nm.

## Open questions for the book team
- The figure says "দেয়াল" for a free-standing white board, because the book says দেয়াল. Is that fine?
- The page writes অতিবেগুনী beside বেগুনি; the figure keeps both as printed.
- Words added: সাদা দাগ; the panel's "খাঁজের দূরত্ব ১.৬ µm" is a number the book does not give.
- Should the second নিজে করো (a TV remote seen by a phone's camera) be a figure of its own? Here it is one sentence in the rule for infrared.
