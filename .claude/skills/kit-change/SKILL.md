---
name: kit-change
description: Change the shared Pathshala 3D kit (shared/lib/, student.css, stage, quiz, coach, magnifier...) without breaking figures. Use for any edit under shared/ or when a fix belongs in the kit rather than in one figure.
---

# Changing the shared kit

Every figure loads the kit, so a kit change is its own pull request.

1. Branch `kit/<what>`; don't mix figure work in.
2. Keep it backward compatible (new options with defaults, new functions). If a figure has to change, that's a
   major version: say so to the user first.
3. Make the change, with JSDoc types on new options (`npm run types` checks shared/lib strictly).
4. `npm run test:visual` (against origin/main, or `--base <ref>`): no picture of a figure you didn't mean to change
   may differ; open `test-results/visual/index.html` for the details. Then `npm run test:templates` and `npm test`.
5. Bump `shared/lib/VERSION` (patch: fix, minor: addition, major: breaking) and add an entry to `shared/CHANGELOG.md`.
6. Update `docs/student-kit.md` if the API changed. Commit `feat(kit): …` or `fix(kit): …`.
