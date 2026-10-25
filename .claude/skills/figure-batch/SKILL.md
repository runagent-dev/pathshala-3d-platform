---
name: figure-batch
description: Make several Pathshala 3D figures at once from book page images (e.g. the images/ folder with files named P-<page>-T-<topic>.png), with a builder agent and an independent reviewer agent per figure, a fix round, pull requests, and merging in book order. Use when asked to do a batch of pages or topics, "spin up builder and reviewer agents", or to continue the batch work described in docs/status.md.
---

# A batch of figures with builder and reviewer agents

The full method, the prompt templates and the owner's taste are in `docs/agents/README.md`; read it first, then
`docs/agents/lessons.md`, `docs/book-notes.md` and `docs/status.md` (what is already done and what is open).

1. **Read the pages.** Every image in the folder the user names (usually `images/`): `P-<page>-T-<topic>[-<topic>…]`.
   One figure per topic. Check `npm run find -- p<page>` / `-- <topic>`, and that `books/books.json` has the
   chapter (add it on main first if not).
2. **Write a brief per figure**: id, title, page, topic, order, placement, the book's text transcribed exactly, the
   terms, the one idea, starting ideas, neighbours. Put decisions shared by several figures into
   `docs/book-notes.md`. Tell the user the list of figures in a short table before launching.
3. **Builders**: one Agent per figure, `isolation: "worktree"`, in the background, with the builder prompt template
   and its own ports (README, "Ports"). Keep a status table in your scratchpad.
4. **Look, then review**: when a builder reports, read its pictures yourself, then launch an independent reviewer
   (`isolation: "worktree"`) with the reviewer template and your own first-look notes.
5. **Round 2**: SendMessage the whole review plus your decisions to the builder (it follows `docs/agents/round2.md`
   and opens the PR). Read the final pictures; send small leftovers back as one more commit on the same PR.
6. **Report and merge**: tell the user which PRs are ready (one line each, what the student sees). Merge only with
   the user's OK, with `docs/agents/merge-prs.sh <pr>:<worktree> …` in book order; then `git -C /root/pathshala-3d
   pull --ff-only` so the studio shows them, clean up worktrees and branches, and update `docs/status.md`.

Never stop the owner's studio (port 4800) or touch `/root/pathshala-3d`'s branch; all work happens in worktrees.
