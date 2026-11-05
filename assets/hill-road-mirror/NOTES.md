# Notes: Mirror at a hill-road bend (পাহাড়ি রাস্তার অদৃশ্য বাঁক)

Book: physics-9-10 › 8.8.4 › p236 (with 8.8.2 উত্তল আয়না, p235). The page image is in `reference/`.

## What the page shows
p236, 8.8.4 has no picture, only the paragraph: hill roads wind, a high hill on one side and a deep valley on the other;
at a nearly right-angle bend there is no way of knowing what is coming; large plane or convex mirrors are set at 45°;
then vehicles on both sides can see the other side and driving becomes comparatively safe. p235, 8.8.2 gives the convex
mirror: upright, small, a big scene in a small place.

## The one idea
A mirror at 45° at a blind bend turns light through exactly 90°, along the other road, because θi = θr = 45°: the driver
sees what the hill hides. A convex mirror shows a much wider strip of road, with a smaller upright image.

## How the figure works
Seven tapped steps on the clean sheet, one element each, with a camera for each idea:
1. the car and the bus drive to the bend (wide view); the bus's light stops on the rock at a red cross; the small window
   ("চালকের চোখে") shows the rock from the driver's own eye;
2. the view flies to the bend, the mirror rises, its face and the two roads' directions are drawn with the 45° between them;
3. the view flies back, the light runs bus → mirror → eye, and only then does the window swing to the mirror and the bus is
   in it;
4. close up: normal, θi, θr, the right-angle mark;
5. the bus driver's eye: the same path backwards, the car in the mirror (the book's "দুই পাশের সব যানবাহনই");
6. the convex mirror: the strip of road it shows is painted on the road itself, wider, the image small and upright, and the
   CNG in the next lane comes in; the word row switches back to the plane mirror to compare;
7. the student drags the bus (or the arrow keys) with everything live.

The bus shows that it can be moved whenever it is in view: a white disc with a thin dark ring and arrows along the road on
the verge beside it, a faint dashed track for its range (nose 14–25 m along the east road, so the handle stays in the view
at every size), the word "টেনে সরাও" and a gentle pulse until the first drag, then smaller and calm. Hidden in the close-ups
and the test. The disc is an element, so its pulse costs no 3D frames; written in the figure until the kit's
`createDragHandle` arrives.

## The exactness (for the reviewer)
- **The plan is built so that 45° is exact, not nearly.** The road is rounded (radius 12 m), so the two drivers' straight-
  ahead lines cross just outside its outer edge (2 m). The mirror's pole stands there. The car driver's eye is due south of the
  mirror and the bus driver's due east, so the path between them turns 90° on the level; the heights differ (eyes at 1.15 m
  and 2.35 m), so the true angle in 3D is 45.03°, which rounds to the 45° shown. `reading.js` traces it (the image of one
  eye joined to the other) and the unit tests check θi = θr for every position of the bus. Traffic keeps left and both
  drivers sit on the right, as in Bangladesh.
- **What the eye sees in the mirror is traced per pixel** (`roadmirror.js`): the ray from the eye is reflected off the true
  surface and looked up in a small picture of the road. For the plane mirror the picture is taken from the image of the eye,
  so every ray in it is a true ray. For the convex mirror it is taken from the mirror's centre and each ray is followed to
  the plane of the other vehicle first (the rays start up to 0.8 m apart): exact at the vehicle's distance, a tiny offset
  for what is much nearer or farther. The face's normals are the true sphere (ρ = 5 m, f = −2.5 m).
- **From the student's camera above** a real mirror shows ground and sky, not the bus: the face there shows a soft sky-and-
  ground gradient. The window is the only exact view, and it is labelled as a driver's eye.
- **The strip on the road** is the exact field of view: the edge rays through the mirror's rim (`fieldOfView`), tested in the
  road's shader. For the plane mirror its edges meet at the image of the eye (unit-tested).
- Numbers at the default positions: plane mirror 2.4–2.8 m of road, convex about 12–15 m; m = l′/l ≈ 0.11 (1/u + 1/v = 1/f with
  f = −2.5 m), so the bus is about 9 times smaller in the convex mirror.

## Scale and honesty
- Rays are drawn visible, and a single ray stands for countless ones (the corner note says so).
- The mirror is 1.6 m across and the vehicles wait 15–17 m from it: real enough, but real road mirrors are usually 0.8–1.2 m.
  Mounted lower than a real one (centre 1.8 m), so the bus's image sits in the middle of the face for the car driver.
- The hill's slopes are kept gentler than the view from above along the two arms (so it hides the road from the drivers but
  not from the student) and steeper at the bend itself.
- The CNG waits in the next lane on purpose: outside the plane mirror's strip, inside the convex mirror's.

## Performance
One terrain mesh (fine at the bend, opening out to the ridges), road and rail ribbons, instanced posts, sky, mirror, and two
draws per vehicle (body with vertex colours, glass). No textures but a 256 px detail tile and a 512 px sky; rock and road
paint are per pixel. Three passes when something the mirror shows moves (its picture, the main view, the window), two when
only the camera moves. Measured: 29 draw calls and 63k triangles in a frame without the mirror's picture.

## Terms (as in the book)
পাহাড়ি রাস্তা, অদৃশ্য বাঁক, সমকোণে বাঁক, খাদ, 45° কোণে, সমতল আয়না, উত্তল আয়না, যানবাহন, নিরাপদ; from the chapter: আপতিত রশ্মি, প্রতিফলিত
রশ্মি, অভিলম্ব, আপতন কোণ θi, প্রতিফলন কোণ θr, প্রতিবিম্ব, সোজা, 1/u + 1/v = 1/f.

## Open questions for the book team
- The page says "সমতল বা উত্তল আয়না" and has no figure: the mirror's size, height and ρ here are ours.
- The word "সিএনজি" is not in the book; it is what students call the three-wheeler.
- The test's "turned mirror" and the formula question go a little past the page (they use 8.2 and 8.7).
