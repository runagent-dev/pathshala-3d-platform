# Notes: A straw and the air's pressure (স্ট্র ও বাতাসের চাপ)

Book: physics-9-10 › 5.4.1 › p145. Screenshot: `reference/page-145.png` (both pages). Split from
`torricelli-barometer` (1.0.0), where it was the first of six scenes.

## What the page shows
A straw works because of the air's pressure. A straw held in the bottle without sucking: the air in the mouth and
over the drink press the same, no net force (কার্যকর বল), nothing rises. Sucking lowers the mouth's pressure and the
air over the drink pushes it up. However hard you suck, a cold drink (about as dense as water) rises at most 10.3 m.

## The one idea to teach
The drink is pushed up by the outside air, not pulled up by the mouth: sucking only lowers the pressure in the mouth.

## What the student does
The owner on v1.0.2: "make this far more better and understandable, not funny, it will look bad" (a cartoon head
filled the view, the straw and bottle were the smallest things on screen). So, since 1.1.0: the glass and the straw
are the main object, there is no face, and the air's push is made visible.

- **The object:** a clear glass of cold drink (dark amber, a meniscus, a few bubbles) on a plain table, a clear plastic
  straw in it, bending at the top into a plain **cut-away of a mouth** (a section through the lips and the space
  inside, as a physics book draws it: no eyes, nose or hair), labelled মুখের ভেতর. Chosen over a bare "মুখ" region
  because the section shows where the air in the mouth is, and the lips closing round the straw read at once.
- **The air as particles:** one crowd (cyan) over the drink, the same crowd (violet) inside the mouth. The glass's
  particles are spaced a little wider in space so the two crowds look equally close on the screen (the glass is seen
  through its whole depth, the mouth only through its thin section).
- **Three steps**, one tap each, slow (seconds), the step words (চুমুক ছাড়া / চুমুক দিলে / কত উঁচু?) to jump:
  ① the arrows come in: four cyan ones on the drink (the outside air), three violet ones in the mouth, all the same
  length; no net force, the drink stays level with the glass. ② চুমুক দাও: two in three of the mouth's particles go
  back into the throat, its arrows get shorter and only one stays; a green arrow up the straw (কার্যকর বল) appears and
  the drink rises to the mouth. ③ সবচেয়ে উঁচুতে কত?: the camera pulls back while the glass grows four times; a 10.5 m
  straw (the book's) beside a person (1.6 m) and a scale in metres; the drink rises and stops at 10.3 m.
- **The panel:** the first screen is a calm card (a few everyday sentences, no term yet) and the action; after it, per
  step one lead-in line, the result and the rule with the book's term in bold. The kit's how-to row: turn the view,
  back to the start view, tap the glass (a tap on the glass or straw is the action).
- **Test:** 4 questions (no sucking, where the pressure falls, why it rises, how high at most), each wrong choice
  with its own note.

## Terms (as in the book)
স্ট্র, কোল্ড ড্রিংকস, চুমুক, বাতাসের চাপ, কার্যকর বল, "আসলে ব্যাপারটি ঘটে বাতাসের চাপের জন্য", 10.3 মিটার.

## Look
A calm deep-blue gradient backdrop (`BG ['#0b2a5b', '#123d7a']`, as equations-of-motion) and a plain round table top
in a quiet sand colour; nothing else. Panel white. Three meanings, three colours, every arrow in a white outline with a
thin dark edge, drawn over everything: the outside air cyan, the air in the mouth violet (as their particles), the net
push green. Short labels only on the 3D; sentences in the panel.

## Performance (1.1.0, measured in headless Chromium, 1280 × 800, no shadows)
At most 59 draw calls and about 41 k triangles a frame (the first screen 17 draws; step ③ 21 draws, 12 k triangles);
0 draws while idle (nothing moves unless a step plays). The particles are one InstancedMesh (about 200 icosahedra),
updated only while the mouth's air thins out; no per-frame allocations. GLB: the glass, drink, straw and mouth
section, 0.14 × 0.21 × 0.08 m, 20.8 k triangles, 604 KB.

## Open questions
- Every Bangla line needs a person's check against the book.
