# Making many figures at once: builder and reviewer agents

How the chapter 2 and 3 figures (pages 36–69, eighteen figures) were made, so the next batch can be made the same
way by any Claude Code session (the `/figure-batch` skill) or another agent. One orchestrating session reads the
book pages, writes a brief per figure, and runs a builder agent per figure, then an independent reviewer per figure,
then a second round where the builder fixes everything and opens the pull request. The orchestrator looks at the
pictures itself at every step and merges only with the owner's OK.

Files here:

| File | For |
|---|---|
| `builder-brief.md` | every builder: the owner's wishes, safety rules, setup, the quality bar, proof, git |
| `reviewer-brief.md` | every reviewer: read-only rules, what to check, the report format |
| `round2.md` | the builder after the review: fix, re-prove, push, open the PR |
| `lessons.md` | what reviews found again and again; builders and reviewers check every point |
| `shot.mjs`, `touch-example.mjs` | helper templates: pictures at chosen sizes and states; a touch test in a phone browser |
| `merge-prs.sh` | merging the batch's PRs in book order (CODEOWNERS rebase between merges) |
| `../book-notes.md` | decisions shared across figures (units, terms, the four forces, open questions) |
| `../status.md` | what is on `main`, what is open, what to do next |

## The owner's taste (what "do it extremely well" means here)

- The book's **text** defines the idea and the exact Bangla terms; the **visuals come from imagination**, not from
  copying the book's picture: vivid, clear, physically correct, delightful, never cluttered.
- Simple: the 3D object, one idea, a short tap test. White page, plain textbook look. All text Bangla (NCTB terms),
  Bangla digits, Noto Sans Bengali.
- Phones first: it must work, and look good, at 390×700, 390×520, 844×390, 640×400, 800×500 and 1280×800, by touch.
- Every figure gets an independent review and a fix round; nothing goes to the owner as "done" without the
  orchestrator having looked at its pictures.
- One figure per PR, Conventional Commits, merged only when the owner says so. The owner wants to see new figures
  in the studio dashboard after merging.
- The owner runs the studio on port 4800 from `/root/pathshala-3d` (on `main`); never stop it, never kill node by
  pattern, never switch that checkout's branch. All work happens in worktrees.

## 1. Read the pages and write the briefs

- Page images come as `images/P-<page>-T-<topic>[-<topic>…].png` (P = page, T = topic; a file can hold several
  topics, e.g. `P-68-T-3.2.1-3.2.2-3.2.3.png` is three figures). Read every image with the Read tool.
- One figure per topic (sometimes a page has several, e.g. page 36 topic 2.2 had three kinds of motion). For each:
  - `id` (stable English slug), title "English (বাংলা)", page, topic, `order` within the page, `placement`;
  - **the book's text, transcribed exactly** (the builder can't always read small print), and its terms;
  - **the one idea** in one sentence;
  - starting ideas (yours to improve; say so), and how it should differ from its neighbours;
  - what the neighbouring figures are (so sister figures agree; write shared facts into `docs/book-notes.md`).
- `npm run find -- p<page>` and `npm run find -- <topic>`: nothing may exist yet.
- `books/books.json` must have the chapter (`{ "number": 3, "title": { "bn": "বল", "en": "Force" } }`); add it on
  `main` first as `chore(books): chapter <n>, <title>`, or the release check fails for every builder.

## 2. Ports (one set per figure, so parallel browser tests never share a server)

| Figure n (0–9) | Builder dev / test | Reviewer dev / test |
|---|---|---|
| n | 4850+n / 4830+n | 4870+n / 4860+n |

4800 is the owner's studio; 4820 is the default browser-test port; use neither. More than ten at once: continue at
4890+ (and check `ss -ltn` first).

## 3. Builders

Launch with the Agent tool, `isolation: "worktree"`, `run_in_background: true`, one per figure, all in one message.
Prompt template:

```
You are a builder. First read, all of it, the shared builder brief and the lessons file, and follow them exactly:
docs/agents/builder-brief.md, docs/agents/lessons.md and docs/book-notes.md (in your worktree).

## Your figure
- id: `<id>`; title: `<English (বাংলা)>`; type: interactive
- book: physics-9-10, page <n>, topic <t>, `order: <k>`
- placement: "<Book page n, topic t: <section>. Next to …>"
- book page image: /root/pathshala-3d/images/<file>.png
- your ports: DEV_PORT=<4850+n>, PATHSHALA_TEST_PORT=<4830+n> (also use PATHSHALA_TEST_WORKERS=1)

## The book's text (exact)
<transcription>
Terms: <…>

## The one idea
<one sentence>

## Starting ideas (yours to improve; the visuals are your imagination)
- <…>
- Neighbours: <which figures sit next to it and how to differ / agree>

When the first round is done, report as the brief says (commit, do not push).
```

## 4. Look, then review

When a builder reports: read its pictures yourself (`test-results/<id>/390x700.png`, `844x390.png`, `390x520.png`,
the poster, and the states it lists). Note what you see (subject too small? text false? units? sister-figure
mismatch?). Then launch an independent reviewer (Agent tool, `isolation: "worktree"`, background):

```
You are an independent reviewer. First read docs/agents/reviewer-brief.md, all of it, and follow it (it points you
to builder-brief.md, lessons.md and book-notes.md; check every point).

## Where the work is
- Figure `<id>` (<title>), physics-9-10, page <n>, topic <t>. Book page image: /root/pathshala-3d/images/<file>.png.
- The builder committed `<sha>` on `fig/<id>/first-version` in its worktree /root/pathshala-3d/.claude/worktrees/<agent-…>
  (do NOT edit anything there).
- Your OWN worktree is your working directory: `git checkout --detach <sha> && [ -e node_modules ] || ln -s
  /root/pathshala-3d/node_modules node_modules`, then `cp <builder worktree>/scripts/.*-tmp.mjs scripts/`. Never
  commit; delete your helper scripts at the end.
- Your ports: DEV_PORT=<4870+n>, PATHSHALA_TEST_PORT=<4860+n>; PATHSHALA_TEST_WORKERS=1, generous timeouts.
- The builder's pictures: <paths>.

## What the figure should teach
<the book's text and the one idea, as in the builder's brief>

## The builder's claims (check them, don't trust them)
<summary of the builder's report, including its open questions>

## The orchestrator's own first look (verify these too)
<what you noticed in the pictures; decisions you want checked>

Be demanding: the owner wants the absolute best. Report as reviewer-brief.md says.
```

## 5. Round 2

Send the reviewer's whole report to the builder with SendMessage (`to` = the builder's agent id; it resumes with its
own context). Start the message with the round-2 instruction and your decisions, which settle every open choice
(e.g. "units: ms⁻²", "take the reviewer's layout (a)–(d)", "keep the crumpled paper, marked as an extra"):

```
Round 2 for <id>: the independent review is below; follow docs/agents/round2.md (fix, re-prove, commit, rebase,
push, open the PR, clean up, report). Same worktree, branch, ports. Reviewer's pictures: <folder>.

Orchestrator decisions: <…>

<the review, complete>
```

When the PR report comes: read the final pictures yourself. If something small is still wrong (a word, an arrow
that doesn't point where it should), send it back as one more fix on the same PR. Keep a status table (figure,
builder id, ports, commits, reviewer id, verdict, PR) in your scratchpad so a lost context can be rebuilt.

## 6. Merge (only with the owner's OK)

- CI: "Check, lint, types, unit tests", "Figures in the browser" and "Handoff zips" must be green. "Visual comparison"
  may fail only on figures the PR doesn't touch (known flake in `speed-velocity` and `periodic-motion`, see
  status.md); read its log (`gh run view <id> --log-failed | grep '✗'`) to be sure.
- `docs/agents/merge-prs.sh 22:agent-aaa… 27:agent-bbb… …` in book order. Each PR adds a CODEOWNERS line, so every
  PR after the first is rebased and CODEOWNERS regenerated; the script does that, pushes with `--force-with-lease`,
  then squash-merges with `--match-head-commit`.
- Then bring the studio's checkout up to date so the owner sees the figures: `git -C /root/pathshala-3d pull
  --ff-only` (it is on `main` with no local changes; check `git -C /root/pathshala-3d status` first and stop if
  it is not clean apart from untracked `images/`).
- Clean up: `git worktree remove --force` each merged builder/reviewer worktree and delete its local branches
  (`git branch -D fig/<id>/first-version worktree-agent-…`); never remove a worktree whose agent is still running.

## Things that went wrong before (and the fix)

- **Git hooks inherited `GIT_DIR`** from a worktree and the unit tests committed into the repo: fixed in
  `.githooks/pre-push` (`unset $(git rev-parse --local-env-vars)`). Don't remove that line.
- **Two verifies on one test port** test the wrong worktree: always a unique `PATHSHALA_TEST_PORT`.
- **A `cd` into a worktree moves the orchestrator's working directory** for later commands: use `git -C <dir>` and
  absolute paths, or a subshell.
- **Agents stop** when the auto-mode classifier or the app is briefly unavailable ("no safety verdict"): resume each
  with SendMessage ("carry on from where you stopped: check your worktree state, restart your dev server if
  needed, finish and report"). Their worktree and commits survive.
- **`npm run test:templates` rewrote CODEOWNERS** in the past: fixed (PR #8); check `git status` after it anyway.
- **The machine gets very loaded** with several agents: verify can take 30–40 min; agents must use long timeouts
  and re-run steps that time out.
