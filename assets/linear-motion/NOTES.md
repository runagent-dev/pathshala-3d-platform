# Notes: Linear motion: the push (সরলরৈখিক গতি: ধাক্কা)

Book: physics-9-10 › 2.2 › p36 (first of three figures on the page; `order: 1`)

## What the page shows
Section ২.২ (kinds of motion), the first paragraph, **সরলরৈখিক গতি (Linear Motion)**, with no picture:
"এটি সবচেয়ে সহজ গতির উদাহরণ। কোনো কিছু যদি সরল রেখার উপর চলাচল করে তাহলে তার গতিটি হচ্ছে সরলরৈখিক গতি।
কোনো কিছুকে সমতলপৃষ্ঠে ধাক্কা দিয়ে ছেড়ে দিলে সেটা সরল রেখায় চলতে থাকে। একটা বলকে উপর থেকে ছেড়ে দিলে সেটা
যদি মুক্তভাবে নিচের দিকে পড়ে, তাহলে সেটাও রৈখিক গতি।" The next paragraphs (ঘূর্ণন গতি, চলন গতি) and page 37
(পর্যায়বৃত্ত গতি, সরল স্পন্দন গতি) are other figures. Screenshot: `reference/page-36.png`.

## The one idea to teach
If something moves along a straight line, its motion is সরলরৈখিক গতি: a push on a flat surface traces a straight
line, even though the striker slows down. (The falling ball is its own lab, `linear-motion-ball`.)

## Terms (as in the book)
সরলরৈখিক গতি, রৈখিক গতি, সরল রেখা, সমতলপৃষ্ঠ, ধাক্কা, মুক্তভাবে (পড়া). দ্রুতি is used the way page 37 uses it.
Our own words: স্ট্রাইকার, বল, পথ, বাঁক## How it works
- One scene: a carrom board (74 cm square, units in metres), looked at lower on wide, short stages so the board fills
  the height. Since 1.0.0 the falling ball and the sideways throw are their own lab (`linear-motion-ball`).
- Drag out from the striker (an orange push arrow grows; longer = harder) and let go, or tap ধাক্কা দাও (a random push
  from the base line), or the arrow keys. It slides with friction (μ = 0.12, evenly slowing) and stops short of the
  frame. Real time. A push toward a frame that is too close first moves the striker to open space (with a hint), so a
  push always slides at least 12 cm. মুছে ফেলো clears the marks.
- The push leaves blue faint pictures every 0.1 s and a dotted path; when it stops, a green dashed straight line is
  laid through its ends (labelled সরল রেখা). The panel then says "পথ সরল রেখা → সরলরৈখিক গতি ✓" and a line on what the
  pictures show (the striker slows, the path stays straight).
- Test (৫ questions, one of each, in random order, each on a clean board): watch a push and say if it is linear *with
  the right reason* (wrong ones: "slows down so no", "not straight ahead so no", "same speed so yes"); which of four
  paths ক–ঘ a pushed striker takes; what the strobe gaps mean; which everyday motion is (or is not) linear; the
  definition. During the test the scene keys and taps rest (the view keys work).
- Keys: space/Enter push from the base line, arrows push that way, r again, f/v views.

arrows push (or let go), r again, f/v views.

## Open questions
- The everyday items avoid motions that are both periodic and linear (a mass on a spring, page 37) so the "which is
  not linear" question has one answer.

## Owner colour update (0.1.1)
The owner explicitly requested vivid backgrounds and strong object contrast, overriding the usual white scene.
The learning panel stays white; transparent embeds and explicit capture backgrounds remain supported.

Berry/plum backdrop, a teal carrom frame and stand, an orange ball, and brighter cyan/green airborne traces keep paths visible.

## Declutter pass (2026-11, 0.2.0)
- The dark purple-to-magenta backdrop is now a soft, slightly muted sky-blue to warm sand gradient (vivid means calm).
- Panel in the labs' one order: the examples, the actions (ধাক্কা দাও, মুছে ফেলো), then the path and its kind, then
  the sentence. The old wide-frame grid (for the panel under the 3D) is gone: the panel is beside the 3D now.

## Split (2026-11, 1.0.0)
One 3D scene per lab: the ball on its stand (free fall and the sideways throw) moved to `linear-motion-ball`. The
example chips, the `example` URL parameter and `set({ example })`, the `example` event and keys 1/2/3 went.
