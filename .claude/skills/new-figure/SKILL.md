---
name: new-figure
description: Make a new Pathshala 3D figure (interactive, animation or model) for a textbook page and topic, e.g. "make the figure for page 22, topic 1.6.2" with a screenshot of the page. Use whenever someone asks for a new figure, lab, simulation or animation for a book page.
---

# A new figure for a book page and topic

Follow AGENTS.md ("Making a figure", "Rules"). In short:

1. **Get the inputs.** Page number, topic number and a screenshot of the page. If any is missing, ask; never guess
   page or topic numbers. Read the screenshot: what does the printed picture show, what is the one idea, which
   Bangla terms does the book use?
2. **Check it doesn't exist:** `npm run find -- p<page>` and `npm run find -- <topic>`.
3. **Choose the kind** (`interactive` if the student does something, `animation` if it plays by itself, `model` for
   a static object) and an English slug. Tell the user your plan in two or three sentences (what the student will
   do, what the test asks) before building.
4. **Create it:** `npm run new -- --slug <id> --title "<English> (<বাংলা>)" --page <n> --topic <t> --type <kind>`.
5. **Record the brief:** save the screenshot to `assets/<id>/reference/page-<n>.png`; fill in `NOTES.md` (what the
   page shows, the one idea, the book's terms) and `placement`/`description` in `asset.json`.
6. **Build it** like the template it came from (see docs/figure-guide.md and docs/student-kit.md; `screw-gauge` and
   `si-prefixes` are full examples): 3D in `src/<object>.js`, maths in `src/reading.js` with unit tests in
   `test/unit/`, strings only in `src/i18n.js` (Bangla first, NCTB terms, `t.num()` for numbers), the figure in
   `src/app.js` on `@shared/student/…`. Keep it simple: the object, the one idea, a short tap-to-answer test.
   The শেখো panel is the kit's clean sheet, **one action, one result, one rule** (`cleanSheet` + `bindCleanSheet` in
   `shell.js`, `createAction` in `action.js`; the interactive template already uses them): the examples as one row of
   words, one big numbered action button whose same badge rings the part to touch on the 3D view, one result line
   with the number that matters, one rule in the book's words. Secondary actions are quiet icons.
7. **Its own test:** adapt `assets/<id>/tests/figure.spec.mjs` to check the reading through `set`/`get`.
8. **Verify:** `npm run verify -- <id>` until everything is ✓. Then Read the pictures in `test-results/<id>/`
   (390x700 and 844x390 first, then poster.png) and fix what looks wrong: clipped text, tiny controls, the object
   too small, English left in the UI.
9. **Finish:** bump nothing (it is 0.1.0), commit on `fig/<id>/first-version` with `feat(<id>): …`, and tell the user
   what to review in the studio (`/dashboard/#/<id>`).
