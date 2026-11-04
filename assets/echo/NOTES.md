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
- A class-9 student in school uniform (half-sleeved shirt with pocket, badge and buttons, navy trousers; real
  proportions, calm face) stands on flat dry ground in front of a tall layered sandstone cliff, on a yellow measuring
  tape from the cliff's foot (0 m) to 41 m. Sky with a warm haze. The cliff's beds are painted once into a strata
  picture that follows the beds, so the colour breaks are sharp and sit on the ledges (hard beds stand out up to 1 m
  and overhang the soft ones); a few rounded fallen blocks lie at its foot, off the student's line.
- The camera follows the student from behind their right, low (about 11° up) and 19–30° off the line to the cliff
  (less on a narrow frame): the student is 55–160 px tall at 390×700 and at least 54 px at 390×520, and the cliff fills
  the back with its top running off the frame.
- A dark bar with end ticks beside the tape marks d, from the cliff's foot to the student, labelled "d = … m".
- The student is dragged along the tape (4–40 m, 0.5 m steps; arrow keys too), or a word (৫ / ১০ / ২০ / ৩৫ m)
  walks them there. The action "ডাক দাও" (button, the ring on the student, a tap on the student, Space) calls.
- The call, as people really do it at a hill: the student stands relaxed (arms down, calm mouth), then in 0.5 s turns
  to the cliff and brings both hands to the mouth: real hands (palm, four fingers together, thumb) in a funnel, palms
  angled in and forward, elbows out and forward just under shoulder height, chest forward, head tilted up toward the
  cliff's top. The mouth opens as the word starts. The pose is held until the echo has faded, then 0.6 s back to rest.
  The student stays turned about 38° from the cliff's normal, so the camera behind them still sees the hands.
- The word: "হ্যালো" (English "Hello"), everywhere. It shows for a moment near the mouth as a plain word on a solid chip
  (no bubble, no leader line), and again, smaller and fainter, near the head when the echo returns.
- The wave train: five wavelengths (λ = 1 m), compressions darker teal and rarefactions lighter, full strength for
  the first half and a decaying tail after it, drawn three ways: the lower part of each spherical front (ground to
  2.5 m, fading at its top) as an upright curved band that sweeps over the ground and over the student; the rings
  where the fronts meet the ground; and a row of air particles that move back and forth in place. It spreads from
  the mouth. The echo spreads as a sphere centred on the image of the mouth behind the cliff face (law of reflection),
  only in front of the face, a little lighter. The outgoing bands fade once the front has reached the face, so the
  echo coming back is the one front seen; when it reaches the student a teal ring spreads once round the head. Slowed
  20 times: "ছবিতে সময় ২০ গুণ ধীর; আওয়াজ আসল সময়ে" in the view's top-left corner (with sound on, the voice plays in
  real time, so the note says so).
- The panel: the result line works the sum from the call's start to the echo's start with the student's distance
  (t = 2 × d ÷ 330, "≈" when rounded) and says whether the echo is heard on its own; a time line (real time, 0–0.6 s,
  drawn 1:1 at the panel's width in three sizes) draws the call as a bar of its real length (0.35 s) from 0 and, once
  it is back, the echo as the same bar from t, with a strong mark at each bar's start (the moments the rule compares)
  and the shaded "০.১ s পর্যন্ত" band from the call's start, its words under the axis; the rule grows: sound is
  reflected → the 0.1 s (and "now try further / closer") → 0.1 s × 330 m/s = 33 m, half 16.5 m (then marked crimson
  on the tape). The times found show under the words. Once both sides are found, the rule shows the book's sum as a formula: 0.1 s
  × 330 m/s = 33 m, half of that 16.5 m. From 800×500 the panel adds a list of the distances called from
  with their times and "গমগম" / "আলাদা প্রতিধ্বনি".
- With sound on, a human-like voice made in code (`src/voice.js`, no audio files): breath noise for /h/, a glottal
  source at 225 → 195 Hz, three formant resonators moving /æ/ → /l/ → /o/, an amplitude envelope dipping at the /l/;
  then the same buffer, quieter and low-passed at 2.6 kHz, started exactly 2d ÷ 330 s later: near the cliff they merge
  and the call just sounds longer. `pulse`'s shapes, `reading.js`'s `CALL` and the voice are unit-tested (pitch, the
  vowels' formants, the /l/ dip), but no person has listened to it yet: that needs an ear before release.
- Bridge: `set { call: true }` (the older `clap: true` still works; `get` reports `called` and the older `clapped`).
- Test (5): what the returning sound is called (word labels hidden; the echo's band is on its way back); the least
  time gap; the cliff's distance from the time written above the student's head (tape numbers hidden; wrong choices
  v t without halving, v t ÷ 4 and the book's 16.5 m); is the echo heard here (read the distance off the tape; the four
  choices are yes/no × "comes back after 0.1 s" / "before 0.1 s", so each wrong one is a different mistake); what a
  bat learns from its echo. Every wrong choice has its own note.
- Colours: time crimson #c2255c (band, cursor, time numbers), sound/echo teal #0b7285 (chapter decision).

## Honest simplifications
- d is measured to the student (the ears), as before. The sound is drawn starting at the mouth, about 0.1 m in front
  of the ears (and turned 38° from the cliff, so about 0.1 m nearer the cliff), so the true path to the ears is about
  0.1 m shorter than 2d: 0.3 ms at 330 m/s, far too small to matter next to 0.1 s. The numbers use d.
- **The two starts.** The word lasts about 0.35 s, longer than the book's 0.1 s. The figure compares what the book's
  sum compares: the START of the call and the START of its echo, the same sound arriving again, 2d ÷ 330 s apart. So
  "heard apart" here means the echo's start is heard apart from the call's start. At every distance on the tape
  (up to 40 m) the echo starts while the word is still being said (`startsDuringCall`): its bars overlap on the time
  line, honestly; only beyond 57.75 m (0.35 s × 330 ÷ 2) would the whole word come back after it ended. In real life a
  long word at 20 m is heard as a doubled start, not a clean repeat; a clean repeat of a whole word needs a farther
  cliff. The book's numbers (330 m/s, 0.1 s, 33 m, 16.5 m) are kept.
- The word is not shortened: "হ্যালো" stays two syllables. 0.35 s is a typical length for it called out; it is a choice,
  not a measurement.
- The real sound train is 0.35 s × 330 m/s ≈ 115 m long and about 200 Hz (λ ≈ 1.65 m) with many other frequencies in
  it. The picture draws only its first five waves, of 1 m (chosen to be seen), with a tail that dies away.
- Slowed 20 times, the word would take 7 s, longer than any trip in the picture (about 5 s at most), so the whole picture
  happens inside the word: the student holds the call until the echo has faded and rests then, without waiting for
  the word's real end. The 0.5 s raising of the hands comes before τ = 0 and is not part of the time line.
- The student faces about 38° off the cliff's normal, to show the hands to the camera; the wave is drawn as spreading
  round the mouth in every direction anyway (a real call does, stronger forward).
- Only the lower part (up to 2.5 m) of a ±66° cap of each sphere is drawn, so the cliff stays clear; the real fronts
  are whole spheres. The air particles' movement is drawn far bigger than life.
- The cliff face is treated as the plane x = 0 (its relief is ±0.5 m).

## Left out on purpose
- The bat: no bat in the scene (one idea, uncluttered); it appears only as the test's last question. 100 kHz and the
  p202 box question (ultrasound vs infrasound) are not shown.
- The big empty hall (গমগম) is said in the panel's result for short distances, not drawn.

## Open questions for the book team
- The book's 0.1 s rule fits a short sound (its example does not name one). For a word, its echo starts during the word
  at up to 57.75 m; the figure compares the two starts and says so. Is that the reading the book wants?
- The book uses 330 m/s here but 334 m/s in the worked example just above (p201): the figure keeps 330 m/s, as the
  echo paragraph does (0.1 s × 330 m/s = 33 m, half 16.5 m); with 334 the half would be 16.7 m.
- Should "অনুভূতিটা 0.1 s পর্যন্ত থেকে যায়" be named (persistence of hearing) for class 9?

## Performance
Measured with SwiftShader: the cliff face is one grid (200 × 120 cells, about 48 k triangles) with one 512 × 1024
strata picture, its top, 12 merged boulders, the ground, the tape, the student (about 17 k triangles, indexed), the
waves (20 caps, one ground plane, 180 instanced particles); shadows from the student and the boulders only, 1024 map.
GLB (cliff cropped to 60 m with a coarser grid and a 256 × 512 strata picture, the student, the tape): about 0.84 MB
(was 2.3 MB with a 420 m cliff).

## Round 2 (0.2.0)
Acted on the independent review of 0.1.0: the follow camera is lower and nearer, so the student is big on phones; the
student has fuller proportions and uniform detail; the fronts are upright bands of the lower spheres (dark
compressions, light rarefactions) and the echo is seen coming back to the student; the time line is drawn at its
real size (the kit's 18 px icon rule had shrunk it) with its words clear of the marks; side panels show the book's
chain and the distances tried; the test's wrong choices are real slips; the tape's numbers are upright and
screen-sized; the note says the sound plays in real time; the cliff has sharp strata, ledges and overhangs; the GLB
is under 1 MB.

## Voice (0.3.0)
The owner: at a hill people do not clap, they call, and it must be very accurate. The clap became a call: the pose and
real hands, the sound from the mouth, the word "হ্যালো", the call as a bar of real length on a longer time line (0–0.6 s)
with the two starts marked, a five-wave train with a decaying tail, a voice made in code, and all the words. The action
is "ডাক দাও". `set { clap: true }` still works. The poster holds the train on its way to the cliff with the word showing.
Measured with the same script, shadows on, on the poster's frame: 58 → 78 draw calls, 122 k → 166 k triangles (budget 150 and
300 k): the ten more shells, and the student's joints and hands (17 k triangles, 22 meshes).
