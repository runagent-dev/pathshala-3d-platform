# 7. The library is reconciled from the repo, with fingerprints

Date: 2026-10-28. Status: accepted.

**Context.** Figures reach the book through a Chalk library server. The repo changes all the time (new figures,
changed figures, a changed kit), so a one-time conversion goes stale. Doing it by hand is how a library ends up holding
a different version of a figure than the one the team approved.

**Decision.** One command, `npm run library:sync`, compares the repo with the library and brings the library up to
date. The repo is the source of truth and the sync only ever moves the library towards it.

- *Drift is found by fingerprints, kept in the library.* Each item is tagged with the fingerprint of what it was built from
  (per kind: lab, models, poster, video; over the figure's files, the kit modules in its import closure, the relevant
  `asset.json` fields and the tool versions). The next run compares tags; it fetches no bytes and keeps no database. A kit
  change therefore rebuilds exactly the figures that import the module.
- *The manifest is written last.* The lab, poster and models are put in the library first; the lab manifest is the commit
  point, because it is what a book designer finds. An interrupted run leaves the previous version complete and the next
  run finishes the job, so there is no lock-step state to repair.
- *Items are immutable and versions are kept.* A new build is a new item (a new key) that becomes `state:current`; the previous
  one is marked `state:superseded`, not removed, because books may use it. Production refuses to publish different contents
  under a version the library already has.
- *Withdrawing is rare and explicit.* Only for figures removed from the repo, only with `--allow-withdraw`, never for an item a
  book uses. The library does not allow a withdrawn key to come back, so a hand-withdrawn item is reported, not resurrected.
- *Dry run by default; no default address; the token only from the environment; writes only to `.cache/library` and the
  report.* Production publishes from a clean worktree only, with a new version when contents changed (a figure's status and a license are not gates: this is our own work; items carry a license only when someone sets one).
- *Labs are built, not rewritten.* The figure's own page is bundled to one HTML file by esbuild; its bridge, `location.search`
  and `asset.json` fetch are replaced at build time by a small Host API adapter. Neither the figure nor the kit changes, so
  the same source serves the zip handoff and the lab. three.js is shared as the lab's libraries, not repeated in each file.

**Consequences.** Drift is closed by a command, not a conversation, and a rerun costs one library search when nothing has
changed. Tags are the memory: someone retagging an item by hand makes the sync repair it, and a library whose tags were
lost looks empty to the sync (it would publish everything again, with the same keys, so no bytes are duplicated). The lab
adapter and the bundler are code we maintain against Chalk's lab spec; their changes are part of the lab fingerprint, so
changing them rebuilds every lab. State, progress and the reader's own checks are phase 2.
