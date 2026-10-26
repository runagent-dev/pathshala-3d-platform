# Reviewer brief: an independent review of one new Pathshala 3D figure

A builder has made one figure for Physics 9–10 in its own git worktree, and claims it is done. Your job: find
everything that keeps it from being the best possible figure for a class 9–10 student in Bangladesh, on a phone. Do
not take the builder's report on trust; check every claim yourself. The builder will fix what you report, so be
concrete.

Read first: `AGENTS.md` (rules), `docs/agents/builder-brief.md` (the quality bar you are checking against),
`docs/agents/lessons.md` (the problems reviewers found most often before: check every one of them),
`docs/book-notes.md` (shared decisions), the figure-specific brief in your prompt, and the book page image(s).

The owner's wishes in one breath: simple (the 3D object, one idea, a short tap-answer test); phones first; white,
plain textbook look; all text in Bangla with the book's NCTB terms; Bangla digits; the book's text defines the idea
and terms but the visuals should come from imagination: vivid, clear, delightful, physically correct.

## Rules

- **Read-only.** Do not edit, commit or push anything in the builder's worktree. You have your own worktree, checked
  out detached at the builder's commit (your prompt says how). Temporary helper scripts must live in your
  worktree's `scripts/` folder to import the driver; name them `scripts/.review-*.mjs` and delete them when you are
  done. Write pictures to `/tmp/review-<id>/`.
- Never run anything in `/root/pathshala-3d` (the live studio checkout), never touch port 4800, never kill
  processes you did not start. Use only your assigned ports (in your prompt): `PATHSHALA_TEST_PORT` for
  verify/tests, `DEV_PORT` for your own dev server (start it from your worktree; stop it by PID at the end).

## What to do

1. Read the figure's `asset.json`, `NOTES.md`, `README.md`, all of `src/`, `style.css`, `tests/`, and the unit
   tests `test/unit/<id>.test.mjs`.
2. Run `PATHSHALA_TEST_PORT=<port> PATHSHALA_TEST_WORKERS=1 npm run verify -- <id>` and `npm run test:unit`, and
   read every picture in `test-results/<id>/` (all six sizes and the poster).
3. Start your dev server and take your own pictures with `docs/agents/shot.mjs` (copy it to
   `scripts/.review-shot.mjs`): the start state, the main interaction mid-way, every example or mode, the test with
   a right and a wrong answer chosen, and the result screen. Phones first (390×700, 844×390), then 640×400,
   390×520 and 1280×800.
4. Run the builder's touch test (`scripts/.touch-tmp.mjs`, copied from the builder's worktree) against your dev
   server, and try the interactions yourself by touch. Try to break it: tap fast, tap twice, drag off the edge,
   rotate between sizes mid-animation, start the test mid-animation, reset in the middle.
5. Measure, don't guess: the moving subject's size in px at each size, the canvas height across states, label
   boxes against each other.
6. Judge it as a student and as a physics teacher:
   - Is the one idea instantly clear? Would a student understand it without help? Is anything confusing,
     cluttered or missing? Is it delightful, or merely correct? What one change would make it much better?
   - Physics: formulas, numbers, units, arrow directions, the words used for each quantity. Anything wrong,
     misleading or overclaimed, even slightly? Does the panel stay true in every state and edge case?
   - Bangla: the book's exact terms (compare with the page image), grammar, spelling, natural phrasing for a
     student, consistent terms everywhere (panel, 3D labels, test). Bangla digits everywhere (no Latin digits).
   - The test: are the answers right? Are the wrong choices plausible mistakes (not silly)? Any ambiguity, any
     give-away, any question answerable without the picture or without understanding? Variety across the five
     questions? Is the worked answer clear?
   - Layout at every size: clipped or overlapping labels, tiny text, controls too small, the 3D object too small or
     badly framed, the layout jumping while in use, anything off-screen, scroll or zoom.
   - Look: does it look like a quality textbook figure (white, plain, well lit, tasteful colours), or generated?
   - The panel follows the owner's rule, **one action, one result, one rule** (kit 1.3.0: `cleanSheet`,
     `createAction`): examples as one row of words, one big numbered action button whose same badge rings the part to
     touch (a tap on either works; labels are never crossed by the ring or covered by the badge; the ring's
     `ringBox()` is in the labels' avoid list), one result line, one rule that grows with what the student found;
     no boxed readouts, no rows of small boxed buttons, secondary actions quiet. The action row never wraps (the
     panel must not jump when the verb changes), `step` counts the student's own steps.
   - Sister figures: does it agree with neighbouring figures (units, terms, colours, headings; see book-notes)?
   - Code: kit used properly (no copied kit code), strings only in `i18n.js`, `t.num()` for numbers, no dead code,
     no test-only hacks, comments in the style of the reference figures, `asset.json` complete and honest
     (commands/events/export), GLB export sensible (only the meaningful objects, real size).

## Your report

Start with a one-line verdict (ready / ready after small fixes / needs real work). Then the findings, most
important first, grouped as **Must fix**, **Should fix**, **Nice to have**. For each: what is wrong, where (file:line
or picture path), and a concrete fix. Then 2–4 lines on what is already good (so the builder keeps it). Include the
absolute paths of the pictures you took that show the problems. Delete your `scripts/.review-*.mjs` files and stop
your dev server before you finish.
