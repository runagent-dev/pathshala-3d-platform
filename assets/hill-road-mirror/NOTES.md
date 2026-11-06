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
Seven steps on the clean sheet, one element to a tap, with a camera for each idea. Every step plays slowly (camera 1.6 s,
objects about 2 s, about a second for each leg of the ray, a hold on the result), then waits; taps during a step are ignored;
the quiet "আবার দেখো" button plays the step just finished again from the picture before it.
1. the car and the bus drive to the bend (wide view); the bus's light stops on the rock at a red cross; the window
   ("চালকের চোখে") shows the rock from the driver's own eye;
2. the view flies to the bend, the mirror rises, its face and the two roads' directions are drawn with the 45° between them;
3. the view flies back, the light runs bus → mirror → eye, named on the rays, and only then does the window swing to the
   mirror with the bus in it;
4. close up: normal, θi, θr, the right-angle mark;
5. the bus driver's eye: the same path backwards, the car in the mirror (the book's "দুই পাশের সব যানবাহনই");
6. plane and convex side by side, two windows for the same bus, each with its image size; the strip of road the chosen
   mirror shows is marked on the road (translucent amber, dashed outline; the rule names it), the word row chooses which;
7. the student drags the bus (or the arrow keys) with everything live, and the test is offered in one quiet line.

The bus shows that it can be moved whenever it is in view: the kit's `createDragHandle` on the verge beside it, a dashed track
for its range (nose 12.5–20 m along the east road; the wide framing follows its tail, so
it stays whole), the word "টেনে সরাও" and a gentle pulse until the first drag, then smaller and calm. Hidden in the close-ups
and the test. The test tab stays usable (the kit's shell), but is quiet until the offer appears.

## The exactness (for the reviewer)
- **The plan is built so that 45° is exact, not nearly.** The road is rounded (radius 10 m), so the two drivers' straight-
  ahead lines cross just outside its outer edge. The mirror's pole stands there. The car driver's eye is due south of the
  mirror and the bus driver's due east, so the path between them turns 90° on the level; the heights differ (eyes at 1.15 m
  and 2.35 m), so the true angle in 3D is a few hundredths of a degree over 45°, which rounds to the 45° shown. `reading.js`
  traces it (the image of one eye joined to the other) and the unit tests check θi = θr for every position of the bus.
  Traffic keeps left and both drivers sit on the right, as in Bangladesh.
- **The hill really hides them.** The waiting places were chosen so that a straight line from the driver's eye enters the rock
  for the bus at every position and for the CNG; the rock is cut steeply beside the road at the bend for this. Moved closer,
  the rounded corner would open the view and the figure would be false.
- **What the eye sees in the mirror is traced per pixel** (`roadmirror.js`): the ray from the eye is reflected off the true
  surface and looked up in a small picture of the road. For the plane mirror the picture is taken from the image of the eye,
  so every ray in it is a true ray. For the convex mirror it is taken from the mirror's centre and each ray is followed to
  the plane of the other vehicle first (the rays start up to 1 m apart): exact at the vehicle's distance, a tiny offset
  for what is much nearer or farther. The face's normals are the true sphere (ρ = 8 m, f = −4 m). The drivers' views are drawn
  without the strip: it is a mark for the student, not paint on the road.
- **From the student's camera above** a real mirror shows ground and sky, not the bus: the face there shows a soft sky-and-
  ground sheen, and a ring marks it in the wide view. The windows are the only exact views, and they are labelled.
- **The strip on the road** is the exact field of view: the edge rays through the mirror's rim (`fieldOfView`), tested in the
  road's shader. For the plane mirror its edges meet at the image of the eye (unit-tested).
- **"প্রায় ৫ গুণ ছোট" is the mirror formula, on the axis** (1/u + 1/v = 1/f, m = l′/l). The rays really strike the convex mirror
  45° off its axis, where a mirror has two focal lengths: tangential (ρ/2)cos 45° in the plane of the rays, sagittal (ρ/2)/cos 45°
  across it. So the traced bus comes out narrower and taller than a plain 1/5, which the window shows. That is true of a real
  roadside mirror; the words keep "প্রায়" and the book's formula.
- Numbers at the default place: the mirror shows about 3 m of width at the bus when plane, about 10 m when convex.

## The whole way round
The camera turns all the way round (polar 5°–88°, zoom 0.6–1.8 × the distance when the student took over), damped; a tap is not a turn (8 px). It can never go
under the ground or into the hill: `keepAboveGround` holds it 2.5 m above the terrain under it. Every side of each object is
modelled, so nothing is open from behind, and the terrain runs on all sides to the far ridges. A step's guided framing comes
back with the next step, or with the quiet "সামনে" button. The kit's rotate cue, a dark pill, says "⟲ ৩৬০° ঘুরিয়ে দেখো" until the first
turn, then ⟲ ৩৬০° stays: it does not look like the bus's round handle, which moves a part, not the view. A resize never takes a turned
view away (the kit reports its lower resolution as a resize, and a browser test holds this); an unturned view fits again. The rays are
drawn over the scene, so from behind the hill they show through it: they are a drawing, and that keeps the path readable.

## Scale and honesty
- Rays are drawn visible, and a single ray stands for countless ones (the corner note says so). The windows are enlarged
  (they say so): the driver's own view of a mirror 14 m away is far smaller.
- The mirror is 2 m across, about twice a real one, and mounted lower (centre 1.8 m), so it can be found at phone size and the
  bus's image sits in the middle of the face. Its ring in the wide view is a mark, not a thing.
- The hill's slopes are kept gentler than the view from above along the two arms (so it hides the road from the drivers but
  not from the student) and steeper at the bend itself.
- The CNG waits in the next lane on purpose: outside the plane mirror's strip, inside the convex mirror's.

## Performance
One terrain mesh (fine at the bend, opening out to the ridges), road and rail ribbons, instanced posts, sky, mirror, and two
draws per vehicle (body with vertex colours, glass). No textures but a 256 px detail tile and a 512 px sky, and two 512 px
pictures of the road; rock and road paint are per pixel. Up to five passes when something moves in the last step (two
pictures, the main view, two windows), three while only the camera or a drawing moves (the pictures are kept until a
vehicle or the eye moves), and none when nothing changes.

## Terms (as in the book)
পাহাড়ি রাস্তা, অদৃশ্য বাঁক, সমকোণে বাঁক, খাদ, 45° কোণে, সমতল আয়না, উত্তল আয়না, যানবাহন, নিরাপদ; from the chapter: আপতিত রশ্মি, প্রতিফলিত
রশ্মি, অভিলম্ব, আপতন কোণ θi, প্রতিফলন কোণ θr, প্রতিবিম্ব, সোজা, 1/u + 1/v = 1/f.

## Open questions for the book team
- The page says "সমতল বা উত্তল আয়না" and has no figure: the mirror's size, height and ρ here are ours.
- The word "সিএনজি" is not in the book; it is what students call the three-wheeler.
- The test's "turned mirror" and the formula question go a little past the page (they use 8.2 and 8.7).
- Should the mirror be larger than life at all? Here it is twice a real one, so a phone can show it; the book says only "বড় আকারের".
