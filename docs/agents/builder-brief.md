# Builder brief: one Pathshala 3D figure for Physics 9–10

You build ONE figure, end to end, to the highest standard. Other builders are doing other figures in parallel, each
in its own worktree; an independent reviewer will check your work afterwards, and you will then fix what they find
(`round2.md`). Your figure-specific brief (id, page, topic, the book's text, the one idea, starting ideas, your
ports) is in your prompt.

**Before you design anything, read `docs/agents/lessons.md`** (what independent reviewers found again and again in
the first eighteen figures; getting those right from the start is the difference between "ready" and "needs real
work") and **`docs/book-notes.md`** (decisions shared across figures: units, terms, colours, sister figures).

## The owner's wishes (read twice)

- **Use your imagination.** The owner said: "you don't directly have to follow the book's image and things, you
  have your own imagination." The book's TEXT defines the idea and the exact Bangla terms; the scene, objects,
  interaction and look are yours. Make it the best possible way for a class 9–10 student in Bangladesh to *see*
  and *understand* this idea: vivid, clear, physically correct, delightful, but never cluttered.
- Students today only get a printed picture. Keep each figure simple: **the 3D object(s), the one idea to read
  off it, and a short test (tap answers, never typing)**. No toolbars full of options; extras go behind `?ui=full`.
- **Phones first** (the books are used on phones): it must work at 390×700, 390×520, 844×390, 640×400, 800×500 and
  1280×800, by touch, portrait and landscape.
- **White page, plain textbook look.** No glassy, dark, neon or "generated-looking" UI. Colour carries meaning
  (one colour per quantity), not decoration.
- **All student-facing text in Bangla**, in the book's NCTB terms (exactly as the page writes them), English as the
  second language. Every string in `src/i18n.js` (the checker refuses Bangla anywhere else). Numbers through
  `t.num()` so they show Bangla digits. Font: Noto Sans Bengali (bundled; never Hind Siliguri).
- Build on the shared student kit (`shared/lib/student/`): `buildStudentShell` (custom learn panel HTML is fine),
  `createQuiz` with hooks (`lines` keeps the sheet's height steady), `createCoach` (first-use pointer on the 3D
  object; `loupe: null` if no magnifier; `inset`, `labelAt`), `createAnnotations` (labels pinned to 3D points; give
  them `spots` and `avoid` so they stay clear of each other, the corner buttons and the hint), `createArrow` (3D
  vector arrows), `createMaterials`, `textMesh`, `createAudio`, `createTweener`, `createStage`. Kit 1.2.0 added
  these for what earlier figures worked around (`docs/student-kit.md`). Keep only figure-specific code in the figure.

## Read before you start

1. `AGENTS.md` and `CLAUDE.md` (repo rules), `docs/figure-guide.md`, `docs/student-kit.md`, `docs/manifest.md`.
2. `.claude/skills/new-figure/SKILL.md` and `.claude/skills/verify-figure/SKILL.md` (follow them).
3. Reference figures (read their code; copy their patterns):
   - `assets/stopwatch/`: phone-polished: custom learn panel with a sum of coloured terms, actions in the panel
     foot, 3D buttons with big invisible hit boxes acting on pointerdown, a test with mistake-based wrong answers,
     a coach on a 3D part, camera framing that fits the stage, steady layout.
   - `assets/equations-of-motion/`: a follow camera on a fixed window, a 2D graph drawn over the stage with
     collision-checked labels, a scrubbable graph, a test that reads values off the picture.
   - `assets/falling-bodies/`, `assets/weak-nuclear-force/`, `assets/newtons-first-law/`, `assets/inertia/`:
     honest stylisation notes, screen-space label placers (`src/labels.js`, written before the kit's annotations
     could avoid collisions: use `spots`/`avoid` instead), camera fitting per side (`src/camera.js`), cancellable
     runs with tokens, questions that set up their own scenes.
   - `assets/digital-balance/`: things you tap to move, flights between places, an "inside" view with labels.
   - `assets/screw-gauge/`, `assets/vernier-caliper/`: dragging a part, magnifier, reading maths.
   - `assets/si-prefixes/`: an `animation` figure with stops (if part of your figure plays by itself).
4. The book page image(s) for your figure (path in your prompt): read them with the Read tool.

## Safety: you share a machine with the owner's live studio

- Your working directory is your OWN git worktree (created for you). First thing: run `pwd`,
  `git rev-parse --show-toplevel` and `git branch --show-current`, and confirm it is NOT `/root/pathshala-3d`.
- **Never** run git, npm or file edits in `/root/pathshala-3d` itself: that is the live studio's checkout and must
  stay on `main`. Never touch port 4800. Never `pkill`/`killall node`; stop only processes you started, by PID.
- Use ONLY your assigned ports (in your prompt): your dev server on `DEV_PORT`, and `PATHSHALA_TEST_PORT` for every
  `npm run verify`, `npm test`, `npx playwright test` (the browser tests reuse any server already on their port, so
  sharing a port with another builder silently tests the wrong worktree). Add `PATHSHALA_TEST_WORKERS=1`.
- Do not change `shared/` (the kit), other figures, `books/`, `scripts/`, `test/` (except your own new unit-test
  file), the templates or CI. If the kit lacks something, implement it inside your figure and mention it in your
  report ("kit gap").

## Setup (in your worktree)

```bash
git fetch origin && git checkout -B fig/<id>/first-version origin/main
[ -e node_modules ] || ln -s /root/pathshala-3d/node_modules node_modules
export PATHSHALA_TEST_PORT=<your test port> PATHSHALA_TEST_WORKERS=1
PORT=<your dev port> HOST=127.0.0.1 setsid nohup node scripts/dev.mjs > /tmp/<id>-dev.log 2>&1 < /dev/null & echo $! > /tmp/<id>-dev.pid
npm run new -- --slug <id> --title "<English (বাংলা)>" --page <n> --topic <t> --type interactive --placement "<…>"
```

Then: copy your page image to `assets/<id>/reference/page-<n>.png`; in `asset.json` set `order` (from your
prompt), `maintainers: ["RadeenXALNW"]`, a good `description` and `tags`, `units` (`mm` for small objects, `m` for
big scenes; the GLB is exported in metres); fill `NOTES.md` (what the page shows, the one idea, the book's exact
terms, how the figure works, open questions for the book team). Delete template leftovers (`src/ruler.js`, the
template test). If `books/books.json` lacks the chapter, tell the orchestrator (don't edit it yourself).

Shell note: each Bash call may start in your worktree root again; use absolute paths or `cd` in the same call.

## Building it

- Files: `src/<object>.js` (procedural three.js models), `src/reading.js` (or a better name: the pure maths,
  unit-tested), `src/i18n.js`, `src/app.js` (layout, interaction, the test), `src/main.js` (`startFigure` only),
  `style.css` (term colours, figure-only styles), `tests/figure.spec.mjs` (your own bridge test).
- Unit tests for your maths: a NEW file `test/unit/<id>.test.mjs` (do not edit the shared `figure-logic.test.mjs`;
  parallel builders would conflict). Run with `npm run test:unit` (it needs the repo's import loader).
- Bridge: implement `get`, `set` (all the state a book page or a test needs, with `animate: false`), `reset`,
  `practice`, `capture`, `export-glb` (exportRoot = the meaningful 3D objects only; helpers/labels have
  `userData.noExport`), list every command and event in `asset.json`, and give `export.poster`, `export.glb` and an
  `export.video` script that shows the idea in ~15–20 s.
- Animation: drive motion from the stage clock (tickers with `dt`) or `performance.now()`; the tests run on a
  virtual clock, so everything must be deterministic given time (`Math.random` is seeded by the test harness, so
  it is fine to use it).
- Physics must be right: real formulas, sensible real-world numbers and units, correct directions of arrows.
  When the scene is stylised, say so honestly (e.g. "সময় ধীর করে দেখানো").

## The quality bar (the reviewer checks all of this)

- **One idea, instantly visible.** Someone glancing at the poster understands what the figure is about. The panel
  states the idea in one short line in the book's words, plus at most one live readout/sum that makes it concrete.
- **The student does something meaningful** within seconds (tap, drag, play/pause, choose an example), guided by
  the coach pointer on the 3D object. Controls: a few clear Bangla buttons at most.
- **The test**: 5 questions, 4 tap choices each, wrong choices from real mistakes, a worked answer after each
  (the kit's `reveal`), questions varied (not five copies of one), correct physics, unambiguous Bangla. The 3D
  scene sets up each question ("look at this and answer"); most questions should need the picture.
- **Phone layout**: nothing scrolls; every control on screen and ≥ 24 px (aim for 36+); the 3D object large and
  well framed at all six sizes (fit the camera to the stage aspect and leave room for the top-right buttons);
  labels never overlap or get clipped; 3D tap targets are big (invisible hit boxes); drags work by touch.
- **Steady layout**: the 3D view must not change size while the student uses the figure. If panel text varies
  between states, give that line a `min-height` for its longest version (see `.sw-extra` in the stopwatch).
- **Timing fairness**: if the student times something by tapping, act on `pointerdown`, not on click.
- **Keyboard**: arrows/keys do the main actions; buttons have labels.
- **Look**: realistic, well-lit, tasteful 3D (the kit's materials, soft shadows when `shadow=1`), white
  background, consistent colours; Bangla text crisp; Bangla digits everywhere (check ০–৯ appear correctly).
- **Performance**: software rendering in tests is slow; keep geometry modest (a few tens of thousands of
  triangles), avoid per-frame allocations, render only when something changes (`stage.invalidate()`).

## Proving it works (all of this before you report)

1. `PATHSHALA_TEST_PORT=<port> PATHSHALA_TEST_WORKERS=1 npm run verify -- <id>` is all green.
2. Read every picture in `test-results/<id>/` with the Read tool (390×700 and 844×390 first) and fix what looks
   wrong. Also take pictures of the key states with `docs/agents/shot.mjs` (copy it to `scripts/.shot-tmp.mjs`):
   playing, each example, the test with an answer chosen, any special view.
3. Touch test in a phone browser: copy `docs/agents/touch-example.mjs` to `scripts/.touch-tmp.mjs`, rewrite the
   figure-specific part for your figure (every tap/drag a student does, every panel button, the test), run it at
   both sizes, and look at its pictures. All checks must pass.
4. Write a small measure script (`scripts/.measure-tmp.mjs`): the canvas height in every state and test question
   at all six sizes, label boxes against each other and the corner buttons, the moving subject's size in px.
5. `npm run test:unit` passes (your new unit tests included); `npx biome check --write assets/<id> test/unit/<id>.test.mjs`.

## Git

- Commit on `fig/<id>/first-version`: Conventional Commits, e.g. `feat(<id>): <what> for page <n>, topic <t>`,
  body in plain sentences, ending with the line `Co-Authored-By: <the model> <noreply@anthropic.com>`.
- Stage explicitly: `assets/<id>`, `test/unit/<id>.test.mjs`, `.github/CODEOWNERS` (regenerated with your
  maintainer line; commit it). Never commit `scripts/.*-tmp.mjs` or `node_modules`.
- The pre-commit hook runs `npm run check` + Biome; the pre-push hook runs unit tests and types. Don't skip them.
- **First round: commit, do NOT push.** After the review you will be told to fix, then push and open the PR.

## Your report (end of the first round)

Short and factual:
- worktree path, branch, commit;
- what the figure does (5–8 lines) and why this design teaches the idea well;
- the verify output, the touch-test output, the unit tests;
- the paths of the pictures that show it best (absolute paths);
- open questions, kit gaps, anything you were unsure about.

Keep your dev server running until the end of the whole task (the reviewer may use pictures); stop it (by its
PID file) only when told the work is finished.
