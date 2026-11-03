# Notes: Echo (প্রতিধ্বনি)

Book: physics-9-10 › 7.3.1 › p201–202. Page images: `reference/page-201.png`, `reference/page-202.png`.

## What the page shows
No picture: a paragraph. Sound is a wave, so it can be reflected; in a big empty hall we hear a গমগম sound, which is
reflection (প্রতিধ্বনি), but the distance is too short to hear it separately. The feeling of a sound stays for 0.1 s,
so two sounds are heard separately only if at least 0.1 s apart. Sound goes at 330 m/s, so in 0.1 s it travels 33 m;
in front of a big wall, building or steep hill (খাড়া পাহাড়) at least half of that, 16.5 m, away, the sound comes
back after 0.1 s and we hear the echo. Then (p202) bats: they make sound in flight, judge distance from how long the
echo takes, and so fly in the dark without bumping into things; their sound is ultrasound, about 100 kHz.

## The one idea
An echo is reflected sound; it is heard on its own only if it returns at least 0.1 s after the original, i.e. the
reflecting surface is at least 16.5 m away (2d = 330 m/s × 0.1 s).

## Terms (as in the book)
প্রতিধ্বনি, প্রতিফলন / প্রতিফলিত, গমগম, অনুভূতিটা 0.1 s পর্যন্ত থেকে যায়, আলাদাভাবে শোনা, কমপক্ষে 0.1 s এর একটা
ব্যবধান, শব্দের বেগ 330 m/s, 33 m, অর্ধেক দূরত্বে (16.5 m), দেয়াল, দালান, খাড়া পাহাড়, বাদুড়, আলট্রাসাউন্ড. Units as
the book: m, s, m/s.

## How the figure works
- A class-9 student in school uniform (real proportions, calm face) stands on flat dry ground in front of a tall
  layered sandstone cliff, on a yellow measuring tape from the cliff's foot (0 m) to 41 m. Sky with a warm haze.
- A dark bar with end ticks beside the tape marks d, from the cliff's foot to the student, labelled "d = … m".
- The student is dragged along the tape (4–40 m, 0.5 m steps; arrow keys too), or a word (৫ / ১০ / ২০ / ৩৫ m)
  walks them there. The action "হাততালি দাও" (button, the ring round the hands, a tap on the student, Space) claps.
- The pulse: three spherical wavefronts (compression darker teal, rarefaction lighter, compression), drawn as a cap
  toward the cliff plus their rings on the ground. The echo spreads as a sphere centred on the image of the hands
  behind the cliff face (law of reflection), only in front of the face. The surfaces fade as they spread (the wave
  weakens), the ground rings stay. Slowed 20 times: "ছবিতে সময় ২০ গুণ ধীর" in the view's top-left corner.
- The panel: the result line works the sum with the student's distance (t = 2 × d ÷ 330, "≈" when rounded) and says
  whether the echo is heard on its own; a time line (real time, 0–0.25 s) shows the clap, the echo and the shaded
  "০.১ s পর্যন্ত" band; the rule grows: sound is reflected → the 0.1 s (and "now try further / closer") → 0.1 s ×
  330 m/s = 33 m, half 16.5 m (then marked crimson on the tape). The times found show under the words.
- With sound on, the real clap and its echo play at the real delay (2d ÷ 330 s): near the cliff they merge.
- Test (5): what the returning sound is called (word label hidden); the least time gap; the cliff's distance from a
  time label on the student (tape numbers hidden); is the echo heard here (read the distance off the tape); what a
  bat learns from its echo. Every wrong choice has its own note.
- Colours: time crimson #c2255c (band, cursor, time numbers), sound/echo teal #0b7285 (chapter decision).

## Honest simplifications
- d is measured to the student (the ears); the clap is drawn at the hands, 0.36 m nearer: the numbers use d.
- Only ±29° caps of the spheres are drawn, so the view stays clear; the real fronts are whole spheres.
- The cliff face is treated as the plane x = 0 (its relief is ±0.5 m).

## Left out on purpose
- The bat: no bat in the scene (one idea, uncluttered); it appears only as the test's last question. 100 kHz and the
  p202 box question (ultrasound vs infrasound) are not shown.
- The big empty hall (গমগম) is said in the panel's result for short distances, not drawn.

## Open questions for the book team
- The book uses 330 m/s here but 334 m/s in the worked example just above (p201): the figure uses 330 as the echo
  paragraph does.
- Should "অনুভূতিটা 0.1 s পর্যন্ত থেকে যায়" be named (persistence of hearing) for class 9?

## Performance
Measured with SwiftShader at 800×500: see the verify output; the scene is one cliff grid (about 19 k triangles), the
ground, the tape, the student (about 10 k), the pulse (6 caps, one ground plane), shadows from the student and boulders
only, 1024 map. GLB (cliff, student, tape): 37.8 k triangles, 2.3 MB; the cliff is 420 m long so it runs off
every frame (the GLB box is 68 × 15 × 420 m).
