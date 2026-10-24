# Pathshala 3D: working notes

3D/interactive figures for Bangla interactive books. See README.md for layout and commands.

- Start of a session: read `assets/<id>/NOTES.md` for the asset you're touching (the user's notes), and `assets/<id>/reviews/reviews.json` (feedback from invited reviewers; `status: "open"` items are to do, pictures next to it). After acting on a review, set its `status` to `"done"` and add a short `reply` (what changed, which version); reviewers see the reply in the studio.
- Dev server: `npm run dev` (port 4800, zero deps). Pages under `/assets/` live-reload on save.
- On this server it runs as `npm run dev:public` (all addresses, Basic auth; login in `.studio-auth.json`, log in `/tmp/pathshala-dev.log`). Restart: `setsid nohup node scripts/dev.mjs --public > /tmp/pathshala-dev.log 2>&1 < /dev/null &`. Requests from 127.0.0.1 skip the login, so headless checks work without credentials.
- Each asset must stay self-contained: shared code only via the import map (`three`, `three/addons/`, `@shared/`) or `../../shared/` links in HTML. The packager rewrites `../../shared/` → `./shared/`.
- Audience: students who today get only a printed picture. Keep each figure simple: the 3D object, the one idea to read off it, and a short test (tap answers, not typing). No toolbars full of options; extras go behind `?ui=full`.
- Three kinds of asset: `interactive` (student acts, e.g. vernier-caliper), `animation` (plays by itself; students may tap to jump to a part, e.g. si-prefixes), `model` (static GLB). "Non-interactive" usually means `animation`, not GLB, when there is text or a sequence to show.
- Every figure must work on phones, portrait and landscape. Check 390×700, 390×520, 844×390, 640×400, 800×500 and 1280×800 before handing over.
- User preferences for the books: white background, all UI text in Bangla (NCTB terminology), plain textbook-style UI. Avoid glassy/dark/neon "generated-looking" UI.
- Font: Noto Sans Bengali (bundled in `shared/fonts/`). Hind Siliguri was rejected because its Bangla digits (especially ১) looked unrecognizable. Check the digits ০–৯ whenever a font changes.
- Ask for (or record) the book page and topic of each new figure: `page`, `topic`, `placement` in `asset.json`, plus the line at the top of its README.
- New interactive figures build on `shared/lib/student/` (see vernier-caliper and screw-gauge): `buildStudentShell` + `learnSheet` for the layout, `createQuiz` with hooks for the test, `createCoach` with the figure's grab spots for pointers, the magnifier, materials and `student.css`. Keep only figure-specific code in the asset.
- Put user-facing strings in the asset's i18n file, never inline. Bangla numerals via `t.num()`.
- Verify visually with headless Chromium (Playwright browsers in ~/.cache/ms-playwright). Software rendering is slow (~1 fps with shadows); add `?shadow=0` for functional checks.
