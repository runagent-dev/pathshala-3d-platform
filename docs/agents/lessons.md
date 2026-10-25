# Lessons from the first eighteen figures' reviews

Every figure on `main` from chapter 2 and 3 (pages 36–69) went through an independent review. Most first versions
came back "needs real work", for the same reasons. Read those figures' code: they now do these things right. Check
yourself against every point below before you report. (Batch 1, pages 36–41: `linear-motion`, `circular-motion`,
`translational-motion`, `periodic-motion`, `simple-harmonic-motion`, `scalar-vector`, `distance-displacement`,
`speed-velocity`. Batch 2, pages 43–69: `acceleration`, `equations-of-motion`, `falling-bodies`,
`newtons-first-law`, `inertia`, `contact-noncontact-force`, `gravitational-force`, `electromagnetic-force`,
`weak-nuclear-force`, `strong-nuclear-force`.)

## The picture
1. **The thing that moves is big on a phone.** Frame the camera on the moving part and its path (with room for its
   labels), not on the whole apparatus; let stands, bases, frames and legs run off the edges. Target: the motion
   spans at least half the 3D width in portrait, and the subject is ≥ 35 px at 390×700 and ≥ 20 px at 390×520.
   Measure it in pixels at 390×700, 390×520 and 844×390. Empty white above a desk or floor is wasted: lower or
   steepen the camera.
2. **Long motions: follow the subject.** A camera that fits the whole run shrinks the subject as the run grows (a
   train became 20 px on a 225 m run). Use a follow camera on a fixed window, and show the whole trip in a 2D bar.
3. **Nothing ever sits in front of the subject.** No pole, frame, label or hint over the moving body, its path,
   its arrow or its key label. Check every phase of the motion (both ends, mid-way), not just the start.
4. **Labels are placed in screen space and never collide** with each other, the arrow, the object, the corner
   buttons, the scale note, or the coach bubble. Project the anchors, measure the label boxes, try several
   candidate spots, and hide an unimportant label when nothing fits (the panel still has the number). Re-check
   while things move and after every resize. The kit's `createAnnotations` does this since 1.2.0 (`spots`,
   `avoid`, `optional`); older figures have their own `src/labels.js`.
5. **A label never hides what it names.** Put it beside an arrow, not on it; outside a body, not on it; its leader
   dot on the body's rim, never on a sign ("+") that matters; short leader lines (40–50 px).
6. **Perspective lies.** An arrow drawn at roof height does not visibly point at a marker on the ground in a tilted
   view. Put the marker at the arrow's height (a stalk down to the ground) and check on screen that the line
   passes through it. Arrows meant to be vertical lean in wide frames unless the camera is low.
7. **Hints at the bottom of the stage cover the 3D view.** Prefer the panel for sentences; use the stage hint only
   briefly, and never while it would cover the subject. Hide it when leaving the test.
8. **Honest scale and time.** If the scene is slowed, sped up, drawn bigger than life or stronger than life, say so
   in one short note (e.g. "সময় ৮ গুণ ধীর", "আকার প্রকৃত অনুপাতে নয়"), in a corner that collides with nothing.
   Never show false precision (say "প্রায়").
9. **The key moment must be visible in the final still.** Don't end on a pose that looks like the start (paper
   "lifted" 1 cm, looking as if it never left the desk) or with the subject flown off screen (the β electron).
   Keep the result in view and relabel it ("নিউট্রন → প্রোটন").
10. **Wide frames (800×500, 1280×800):** choose the camera elevation and distance by the stage's aspect, so the
    object is big; keep views of angles or shapes undistorted.
11. **Animations stay inside their box.** A triangle turning about a point swept out of the graph over the 3D
    view: animate it as folds, clip to the plot, give it time (≈2 s after a 1 s hold), and let a tap replay it.

## The panel and layout
12. **Steady layout:** the 3D view must keep exactly the same size in every state and every test question. Any
    panel line whose text changes gets a `min-height` for its longest version; the test's question and
    worked-answer lines get reserved heights. Measure every string in its box at every size with a script.
13. **No big empty space in the panel**: the learn and test sheets share one grid cell (the test sheet sets the
    height). Fill the learn sheet usefully (the book's rule, the equations with the student's numbers, the book's
    names for the results) rather than leaving ~100 px blank.
14. **390×520 is the tightest size**: compact the panel there (smaller chips, sums on one row) and check labels.
15. **Landscape side panel**: don't shrink text below ~14 px when there is free space; sums must fit one line.
16. **Steppers and chips**: check the widest value ("−১.৫") fits its box at 360–390 px wide; never hide units on
    phones.

## Correctness and words
17. **Units must be right** in every sum (km ÷ minutes is not km/h; convert first, show the conversion). Use the
    book's symbols (see `docs/book-notes.md`).
18. **The panel must never say something false** in any state: after a release, after a key press, after a drag,
    mid-demo, paused just after a landing, at non-whole stop times. Drive every line that describes the same thing
    from the same state (a "the comb won" line and a "<" comparison read from different bits contradicted each
    other). Labels show only while what they say is true ("ওপরের অংশ স্থির থাকতে চায়" only until it moves).
19. **Never overclaim a number.** "10³⁶ times stronger" is for two particles at the same distance, not this comb
    and this paper; say "বই বলছে …" and keep the picture's own ratio honest.
20. **Numbers that should agree must agree.** A dragged moment snapped to 0.1 s, then v and s computed from that
    snapped time; never show a rounded time next to values from the unrounded one.
21. **Numbers in sentences without trailing zeros** (৪ কিমি, not ৪.০০ কিমি); fixed decimals only in live readouts.
    Bangla digits everywhere, through `t.num()`; never hard-code Bangla digits inside strings (pass `{vars}`). Say
    big numbers the way people do ("২ হাজার ৯০০ কোটি", not "২,৯০০ কোটি"). Keep "৬ → ৭" and "১ m/s" from breaking
    across lines (nowrap / no-break space).
22. **Use the book's exact words** for terms and its spelling on that page (page 68 writes ওপর, others উপর: check
    the image). Natural, grammatical Bangla a class-9 student reads easily. Avoid a word with two meanings in the
    same figure (বল = force and ball: say "ফুটবল"), and words that read wrongly at the start of a sentence ("তার"
    = "its" before "the cable": write "ক্রেনের তার").
23. **Name what the book names.** If the page states laws or equations (প্রথম/দ্বিতীয়/তৃতীয় সূত্র, v = u + gt …),
    the learn panel shows them next to what demonstrates them, not only in test answers.

## The test (5 questions)
24. **No give-away**: the right answer must not be the only choice with (or without) a certain word, the only
    "না…", the longest, or the one that repeats the question's words or numbers. Wrong choices are real mistakes,
    never filler, and each wrong choice gets its own one-line note naming the mistake.
25. **The question needs the picture**: avoid questions where every number is in the text; read values off the
    graph or the scene. The picture must not show the answer, and no question's scene may show the answer to a
    later question (fix the order). Reshuffle on "আবার পরীক্ষা দাও".
26. **Questions about shapes or angles force the front view** (a circle seen at an angle is an ellipse).
27. **Every question sets up its own scene** (clear earlier marks/trails; nothing left from the previous question
    or learn mode), says which object it means ("বাতাসহীন টিউবে…"), and its reveal waits for any camera flight to
    arrive (chain on the flight's promise, guarded by a question token).
28. **The worked answer leads with the answer** ("<b>৪.২৫ m</b>: …"), finishes its sum with units, and names the
    student's specific mistake.
29. Realistic numbers only (a swing that goes end to end in 0.5 s would need a 25 cm rope).

## Behaviour and state (break-it tests the reviewers ran)
30. **Pending animations are cancellable**: give each run a token; bump it on reset, example change, entering or
    leaving the test, a new drag, a step button; after every `await` re-check the token and the test lock.
31. **During the test, keys, chips and view buttons that change the scene are ignored** (show the locked hint); a
    drag in progress is cancelled when the test starts.
32. **A stepper or chip tap during a run** goes to the start of the new plan, not to its end.
33. **A rotation or resize mid-animation must not lose the student's action.**
34. **Double taps**: a second tap within ~400 ms must not undo the first.
35. **The first-use demo must not show the conclusion** before the student acts, and the coach label must not
    cover a key label.
36. **Pinch/wheel zoom** is off in the front view (it broke the auto-framing for good); a finger on a graph drawn
    over the stage should scrub the graph, not zoom the 3D.
37. **Leaving the test** restores a sensible learn state.
38. **The poster** (`export.poster`) shows the idea at a glance.

## Sister figures
39. **Figures in one chapter agree**: same units and symbols, same term for the same thing ("বেগ–সময় গ্রাফ"), same
    colours for the same particle, the same strip heading, the same GLB scale for the same kind of model. Read
    `docs/book-notes.md` and the neighbouring figures before building.

## Process
40. Don't trust your own first pictures: re-shoot every state above at 390×700, 390×520, 844×390, 640×400 and
    800×500, look at each with the Read tool, and write a small script that checks label overlaps, the subject's
    size and the canvas height across states.
41. The machine is shared and can be very loaded (load 50 on 12 cores): run browser tests with
    `PATHSHALA_TEST_WORKERS=1`, give screenshots generous timeouts (90–180 s), and re-run a step that timed out
    before you suspect the figure. Never run two verifies on the same test port.
