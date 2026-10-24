# 2. Flat figure folders with stable English ids

Date: 2026-10-24. Status: accepted.

**Context.** Figures belong to a book page and topic, which get corrected and may differ between editions.

**Decision.** Figures live in `assets/<id>/`; the id is a stable English slug. Book, page and topic are fields in
`asset.json`, never part of the path or the id.

**Consequences.** Correcting a page moves no folder and breaks no `../../shared/` path, URL or zip name. Finding a
figure by page or topic is `npm run find` (and the studio's search), not the file tree.
