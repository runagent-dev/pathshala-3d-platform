# Pathshala 3D: instructions for contributors and AI agents

3D and interactive figures for Bangla school textbooks (NCTB), starting with **Physics, classes 9–10**. Today a
student gets a printed picture; each figure here goes next to (or in place of) one picture in the interactive
book, on phones first. One folder per figure in `assets/<id>/`, handed to the book developers as a self-contained
zip, a GLB model, pictures and a video.

This file is the source of truth for anyone working on the repo, people and agents alike (Claude Code reads it
through `CLAUDE.md`; Codex, Cursor and others read it directly). Deeper references: `docs/`.

## Before you start

- Once per clone: `npm run setup` (dev tools, git hooks, Chromium for tests). Node 22+.
- Run the studio: `npm run dev`, then open <http://127.0.0.1:4800>. It previews figures in book-sized frames and
  reloads them on save.
- Before changing a figure, read its `assets/<id>/NOTES.md` (the owner's notes) and its open reviews:
  `assets/<id>/reviews/*.json` with `"status": "open"` (pictures next to them). See "Reviews" below.
- `npm run find -- p21` / `npm run find -- 1.6.1` shows what already exists for a page or topic.

## Making a figure for a book page and topic

You get a **page number**, a **topic number** (e.g. 1.6.1) and usually a **screenshot of the page**.

1. Check nothing exists yet: `npm run find -- p<page>` and `npm run find -- <topic>`.
2. Pick the kind:
   - `interactive`: the student does something (drags, turns, measures). Example: `screw-gauge`.
   - `animation`: plays by itself; students may tap to jump to a part. Example: `si-prefixes`.
     "Non-interactive" usually means this, not a bare model, when there is text or a sequence to show.
   - `model`: a static 3D model (GLB), e.g. an uploaded file.
3. Create it: `npm run new -- --slug <english-id> --title "<English (বাংলা)>" --page <n> --topic <x.y.z> --type <kind>`.
   The id is a stable English slug (`screw-gauge`); it never changes, even if the page does.
4. Save the screenshot as `assets/<id>/reference/page-<n>.png` (dev only, never packaged) and fill in the brief in
   `NOTES.md`: what the page shows, the one idea to teach, the book's exact Bangla terms.
5. Build it on the shared student kit, following the template's structure (see `docs/figure-guide.md`):
   - `src/<object>.js`: the 3D model (procedural three.js, in millimetres for instruments);
   - `src/reading.js` (or similar): the maths, pure functions, unit-tested;
   - `src/i18n.js`: every string, Bangla and English;
   - `src/app.js`: the figure (layout, interaction, the test), using `@shared/student/…`;
   - `src/main.js`: `startFigure(…)`, nothing else.
6. Run `npm run verify -- <id>` until it is all green, then **look at the pictures** in `test-results/<id>/`.
7. Commit on a branch `fig/<id>/<what>` and open a pull request (one figure per pull request).

Before designing, read `docs/agents/lessons.md` (what reviews of the first eighteen figures found again and again)
and `docs/book-notes.md` (units, terms and colours shared across figures). **Many figures at once** (a folder of
page images named `P-<page>-T-<topic>.png`): one orchestrator, a builder agent and an independent reviewer agent per
figure, a fix round, then pull requests merged in book order; the method and prompts are in `docs/agents/README.md`.
What is done and what is open: `docs/status.md`.

## Rules

These are checked where possible (`npm run check`, the browser tests); the rest is up to you and the reviewer.

**Students first**
- Keep each figure simple: the 3D object, the one idea to read off it, and a short test (tap answers, never typing).
  No toolbars full of options; extras go behind `?ui=full`.
- Phones first. Every figure must work at 390×700, 390×520, 844×390, 640×400, 800×500 and 1280×800: nothing
  scrolls, every control is on screen and at least 24 px. The layout test checks all six.
- Accessible: keyboard works (arrows move the part), buttons have labels, nothing relies on colour alone.

**Look and language**
- White page, plain textbook styling. No glassy, dark or neon "generated-looking" UI.
- All text the student sees is Bangla, in the book's NCTB terms, with English as the second language. Strings live
  in `src/i18n.js` only (the checker refuses Bangla anywhere else in code); numbers go through `t.num()` so they
  show Bangla digits.
- Font: Noto Sans Bengali (bundled in `shared/fonts/`). Never Hind Siliguri: its digits (especially ১) are hard to
  read. When a font changes, check the digits ০১২৩৪৫৬৭৮৯.

**Self-contained and offline**
- A figure loads only its own folder and `shared/`: through the import map (`three`, `three/addons/`, `@shared/`)
  and `../../shared/` links in HTML. No CDNs, no network requests: the book works offline. The checker refuses
  anything else, and the packaged zip is tested with the network blocked.
- Use the kit (`shared/lib/student/`) for layout, test, pointers, magnifier, materials and sounds. Keep only
  figure-specific code in the figure.

**The figure contract** (tested for every figure)
- `src/main.js` calls `startFigure` from `@shared/figure.js`, which reads `asset.json`, the URL parameters it
  declares, the font, and connects the bridge.
- The figure emits `ready`, answers `ping` with its id and version, and implements what it can of `get`, `set`,
  `reset`, `capture`, `export-glb` (3D figures) and `seek`/`duration` (animations). Every command and event it
  supports is listed in `asset.json`.
- `asset.json` records where it goes: `book`, `page`, `topic` (typed in from the printed book) and `placement`
  (which picture or paragraph). The scaffolder also writes it at the top of the README.
- Set `units` (`mm` for instruments); GLB exports are scaled to metres.
- Bump `version` whenever the figure's files change: patch for fixes, minor for features, major when the bridge or
  URL parameters change incompatibly.

**Don't edit by hand**
- `assets/<id>/status.json`: the studio sets the status (idea → in-progress → review → changes → approved).
- `shared/vendor/`: `npm run vendor:three` copies three.js from the pinned npm package.
- Generated files: `schemas/asset.schema.json`, `.github/CODEOWNERS` (`npm run generate`) and the marked README
  sections (`npm run docs`). `npm run check -- --fix` rewrites all of them.
- The shared kit (`shared/lib/`) changes only in its own pull request, with `npm run test:visual` showing no change
  in other figures, and `shared/lib/VERSION` + `shared/CHANGELOG.md` updated.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | The studio on port 4800 (no install needed) |
| `npm run new -- …` | A new figure from a template (see above) |
| `npm run check` | Fast checks of every figure and the repo (`--fix`, `--changed`, `--profile release`, `<id>`) |
| `npm run verify -- <id>` | The definition of done for one figure: checklist + pictures in `test-results/<id>/` |
| `npm test` | Unit tests, then the browser tests (`FIGURES=<id>` for one figure) |
| `npm run test:visual` | Pixel comparison of every figure against `origin/main` (or `--base <ref>`) |
| `npm run test:templates` | Makes a figure from each template and tests it |
| `npm run lint` / `npm run format` | Biome (JS and JSON) |
| `npm run types` | TypeScript checks of the JavaScript (JSDoc); figures opt in with `// @ts-check` |
| `npm run docs` | Rewrites README sections from `asset.json` |
| `npm run find -- p21` | Figures on a page, in a topic, or by name |
| `npm run package -- <id>` | The handoff zip in `dist/` (byte-identical for the same commit) |
| `npm run export -- <id>` | Zip, pictures, GLB (and video with `--formats all`) → `exports/`; `--official` releases (docs/exports.md) |
| `npm run library:sync` | Dry run: what differs between the figures and the Chalk library; `--apply` publishes labs, posters and models (docs/library-sync.md) |
| `npm run generate` | Rewrites generated files |

## Definition of done

`npm run verify -- <id>` passes: release-profile check (maintainers, placement, description, GLB decision all
filled), README sections current, version bumped, contract and layout tests at six sizes, the figure's own tests,
the zip running offline, a valid GLB, and non-blank pictures. Then, by eye: the pictures look right on a phone, the
Bangla matches the book, and a student would understand it without help. The pull request template repeats this.

## Reviews

Invited reviewers write feedback in the studio's মতামত tab. Each review is a file
`assets/<id>/reviews/<rid>.json` (plus a picture of what they saw). To act on one: make the change, bump the
version, then in that file set `"status": "done"` and add `"reply": "<what changed> (v0.2.1)"`. Reviewers see the
reply in the studio.

## Testing notes

- Browser tests use headless Chromium with software WebGL, which is slow (about 1 fps with shadows): the tests
  load figures with `?shadow=0&sound=0&coach=0&seed=1` and a virtual clock (`scripts/lib/export/virtual-time.js`),
  so the same commit always renders the same pixels.
- Put a figure's own tests in `assets/<id>/tests/*.spec.mjs` (see the template); drive it with
  `openFigure` / `call` from `scripts/lib/export/driver.mjs`.
- Pure maths goes in unit tests under `test/unit/` (`import … from '../../assets/<id>/src/reading.js'`).

## Layout

```
assets/<id>/        one figure: asset.json, index.html, src/, style.css, README.md, NOTES.md, status.json,
                    reviews/, reference/, tests/ (the last five are dev only, never packaged)
books/books.json    the books (physics-9-10)
shared/lib/         the kit: stage, figure, bridge/host, tween, timeline, export-glb, model-viewer, student/
shared/vendor/      three.js r185 (from npm, via npm run vendor:three)
templates/          interactive, animation, model
dashboard/          the studio UI           scripts/   studio server, checker, packager, tools
test/               unit and browser tests   docs/      references and decisions
```

## Git

- Branches: `fig/<id>/<what>`, `kit/<what>`, `studio/<what>`. One figure per pull request; kit changes apart.
- Commit messages: Conventional Commits with a scope, e.g. `feat(screw-gauge): zero error`, `fix(kit): …`.
- The pre-commit hook runs `npm run check` on what you staged; pre-push runs unit tests and types. Don't skip them.
