# 5. Visual comparison renders base and head on the same machine

Date: 2026-10-24. Status: accepted.

**Context.** Software WebGL is deterministic on one machine, but fonts and rendering differ between contributors'
machines, so committed reference pictures would fail spuriously.

**Decision.** `npm run test:visual` renders every figure from a git worktree of the base commit and from the working
tree, with the virtual clock, and compares pixels. A difference in a figure whose own files did not change fails.

**Consequences.** No reference pictures in git; kit changes cannot silently change other figures.
