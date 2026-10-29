# Automatic library sync (CI/CD): design note

> **Status: design only. Nothing in this note is built or enabled.** No workflow file exists, no secret is set, no code
> was changed for it. It is written so that someone (or Claude) can build it later from this page alone.
> Written 2026-10-29 for PR #58 (`studio/library-sync`). What was **verified in the code** and what is **assumed** is
> marked in the last section ("Verified and assumed").

Today a person runs `npm run library:sync` by hand (see the "Publishing runbook" in [library-sync.md](library-sync.md)).
The goal is that a change in this repository reaches the library, and then the books, **by itself**:

- a new figure is **added**,
- a changed figure is **updated**,
- a figure that is gone from the repo is **marked and warned about, never deleted by default**; deleting is a separate,
  explicit setup.

Not the highest priority: the manual way works. This note is the plan for when it is.

## At a glance (the decisions)

| Question | Decision | Why |
|---|---|---|
| What runs | the existing `npm run library:sync`, unchanged, called from GitHub Actions | the tool is already idempotent and safe to repeat; CI only calls it |
| When | push to `main` (filtered), manual dispatch, a PR job that only plans, a nightly drift check | publish after review; plan before merge; catch drift |
| Where | decide first: hosted runner (needs the billing fix) or a self-hosted runner on the studio server | **Actions does not start on this private repo today** (billing); see "Runner" |
| Who may publish | a protected GitHub *environment* with required reviewers, holding a **dedicated non-admin** library token | least privilege; a person approves every publish |
| Missing in the repo | **mark** (`orphaned:<date>` tag, items stay current), warn in the Books editor; never withdraw | deleting is final and a mistaken merge must not delete anything |
| Deleting | a separate manual workflow, its own environment, an **administrator** token only that environment has, typed confirmation | the library already needs an admin token to withdraw: a natural split |
| Version bumps | a PR check fails when a changed figure kept its version | production refuses it anyway; fail early, before merge |
| Books follow | the sync already tells the Books server which figures changed | built and tested (PR #6) |

## What exists today (verified)

- `scripts/library-sync.mjs` + `scripts/lib/library/*`. One run reads the repo, reads the library with **one tag search**
  (`origin:pathshala-3d`), plans each figure (`new / changed / repair / unchanged / withdraw / blocked`), and with
  `--apply` publishes. The **manifest is written last** and is the commit point: a run that stops anywhere leaves the old
  version whole, and the next run finishes the job. It is safe to run again and again.
- A file **lock** in `.cache/library` keeps two runs on one machine apart (`lock.mjs`). It does **not** work across
  machines, and a fresh hosted runner has an empty cache: CI needs its own `concurrency` group (below).
- **Exit codes** (`scripts/library-sync.mjs`): `0` done; `1` a figure `failed`, or `--check` and the library is behind
  (`new/changed/repair/withdraw`); `2` usage or other error; `3` another sync holds the lock.
  **A `blocked` figure does not make the exit code non-zero.** CI must read `report.json` itself (`counts.blocked`; a failure is `figures[].result === 'failed'`, there is no `counts.failed`).
- `report.json` (`--report`, default `.cache/library/report.json`): `mode, tier, library, commit, counts, libraries, figures[]
  (id, category, reasons, version, result …), withdrawn, notes`. Good for the step summary and for a PR comment.
- **Tiers.** `--tier production` publishes **every** figure (status and license are **not** gates any more, owner decision),
  but needs a clean worktree (the commit is recorded) and refuses a **changed figure under an old version**
  (`blocked`: "bump the version in asset.json").
- **Withdrawal today.** A figure that is in the library but not in the repo is category `withdraw`. By default **nothing is
  withdrawn** (`not-withdrawn`, with a note); `--allow-withdraw` withdraws, more than 3 also needs `--confirm-withdraw`,
  and a figure whose items a book uses is `blocked` instead (`library.books(key)`). A selection (`--only`,
  `--changed-since`) never plans a withdrawal. Nothing is *marked* today, so a person sees it only in the run's notes.
- **Telling the Books server** (`notify.mjs`): after a production `--apply` that changed something, `POST` to
  `LIBRARY_SYNC_HOOK_URL` with `{tier, syncedAt, published, withdrawn, figures:[…]}`; failure never fails the sync.
  The server updates only those figures' labs and models in books; a major version or settings the book uses are held for
  a person (the *Updates* page); pinned items are never touched.
- **Existing CI** (`.github/workflows/ci.yml`): `ubuntu-24.04`, `actions/setup-node` with `.nvmrc` (22), `npm ci`, a
  `paths-ignore` for what the studio commits on its own (`assets/*/reviews/**`, `status.json`, `NOTES.md`). Actions are
  referenced by tag (`@v4`), not by commit SHA. The new workflows should follow the same conventions.
- **The studio server** (`docs/ops/runbook.md`) already commits reviews, status, notes and uploads to `main` as people use
  it, and pulls on a git webhook. Those commits must **not** trigger a publish: same `paths-ignore`.

## Triggers

| Trigger | Does | Publishes? | Notes |
|---|---|---|---|
| `pull_request` touching `assets/**`, `shared/**`, `scripts/lib/library/**`, `package-lock.json` | dry run against the library; comments the plan table; **fails when a figure is `blocked` or `failed`** | no | needs no secret (library reads are open), so it also works for PRs from forks; this is the version-bump check |
| `push` to `main` (same paths, `paths-ignore` the studio's data files) | publishes the state of that commit | yes, after approval | idempotent: the whole repo state is planned, unchanged figures cost nothing, so no `--changed-since` is needed |
| `workflow_dispatch` | the same, with inputs: `only` (figure ids), `formats`, `dry_run` (default **true**) | only when `dry_run` is off | for a first publish, a re-send, posters or models later |
| `schedule` nightly | `--check`: fails when the library is behind | no | the safety net: a missed run, a failed run, a hand-edited library |

**Concurrency.** `group: library-publish`, `cancel-in-progress: false`: runs queue, none is killed half way (a killed run is
safe, but wasteful). GitHub keeps one waiting run per group and replaces older waiting ones, which is right here: a run
publishes the whole state of its commit, so the newest wins. The file lock does not help on hosted runners (fresh disk
each run), so the `concurrency` group is the real guard; on a self-hosted runner both work (a second run on the same
machine ends with exit code 3, never a double publish).

## Runner

**The blocker first.** GitHub Actions on this private repository does not start today (the account's billing/spending limit,
seen on PR #58; the checks never run). Whatever is chosen below, the first step is an owner decision. Options:

| Option | Cost | Risk / work | Fits |
|---|---|---|---|
| **A. Fix billing**: set a small monthly spending limit and use GitHub-hosted `ubuntu-24.04` | pay per minute (about $0.008 per Linux minute on a 2-core runner **from memory: check GitHub's pricing page**); a 5-minute publish is a few cents; the included free minutes may already cover it | simplest; nothing to maintain; environments, reviews and PR comments just work; a hosted runner has a fresh disk (browsers re-downloaded each time unless cached) | **recommended** |
| **B. Self-hosted runner on the studio server** | no minutes; the server already has Chromium and ffmpeg and the repo | the runner must be hardened: a private repo's own code only (never run fork PRs on it: set "require approval for all outside collaborators" and keep the PR job on a hosted runner or off); shares CPU and disk with the studio; one more service to keep updated | good fallback; makes the file lock effective and the Playwright cache persistent |
| **C. No GitHub Actions: the studio server runs the sync after its own git pull** (the webhook that pulls on push already exists) | none | no PR comments, no required reviewers (an approval step would have to be built into the studio), tokens would live in `/etc/pathshala/studio.env`; couples publishing to the studio's uptime | only if A and B are both rejected |

**Recommendation: A**, with B as the fallback if the owners prefer to pay nothing. C is possible but loses the approval gate.

**Runner facts** (for any option):

- Node 22 (`.nvmrc`), `npm ci`. The sandbox check that runs **every lab before it is published** needs headless Chromium
  (`npx playwright install --with-deps chromium`, Playwright is pinned to 1.64.0); `--no-verify` would skip it: do not.
- **Disk.** The exporter (posters, models, video) refuses to start with less than **10 GB** free; `PATHSHALA_MIN_FREE_GB` lowers
  it. On a laptop with 3 GB free, posters ran fine with the limit at 1 GB and used no measurable disk. A hosted runner has
  roughly 14 GB of disk (**assumption, check**): set `PATHSHALA_MIN_FREE_GB: '2'` and publish `lab,poster` first; models
  (56 poses over 33 figures) are bigger and **were not run yet**: try one figure, then all.
- **Time.** *Measured:* one figure's poster plus manifest took **28 s** (screw-gauge, my laptop, wall clock). *Estimated, not
  measured:* a normal push touching 1-3 figures takes 1-3 minutes plus about 1-2 minutes of setup (`npm ci`, Chromium);
  a first publish of all 34 labs 10-20 minutes; models more. Set `timeout-minutes: 90`.
- **Caching.** Cache `~/.cache/ms-playwright` (key: the lockfile hash) and the npm cache (`setup-node`). `.cache/library` does
  **not** need caching: the library itself is the memory (fingerprints are tags on its items); the cache only holds built
  files and "what changed" hints.

## Secrets and safety

| Name | Kind | Where | What it is |
|---|---|---|---|
| `LIBRARY_TOKEN` | secret | GitHub environment `library-production` | a **write** token of `library.pathshalax.com`. Make it a **dedicated non-admin token** for CI, not the one a person uses. Minting: owner edits the `TOKENS` setting of the Coolify app `chalk-library` (`name:token,name:token`; a name ending in `!` is an administrator), adds e.g. `ci:<long random>`, redeploys. Never print or paste it |
| `LIBRARY_SYNC_HOOK_TOKEN` | secret | same environment | the same value as on the Books server (Coolify app `chalkbook-internal:main`) |
| `LIBRARY_SYNC_HOOK_URL` | variable | same environment | `https://internal.pathshalax.com/api/library-sync/hook` |
| `LIBRARY_ADMIN_TOKEN` | secret | **only** environment `library-withdraw` | an administrator token; used only by the deletion workflow |

Rules for the workflows:

- **Environment with required reviewers** on `library-production`: a publish waits for a person's approval. (A push to `main`
  already passed review as a PR; the approval is the second look at *publishing*. Owners may drop it for push if they trust
  the PR check.) Branch restriction: only `main`.
- **No secrets for fork PRs** (GitHub's default: keep it). The PR job needs none (library reads are open).
- **Least privilege:** `permissions: contents: read` (the PR job adds `pull-requests: write` to comment).
- **Pin third-party actions by full commit SHA** in the new workflows (the existing `ci.yml` uses tags; do not copy that). Look
  the SHAs up when building (`gh api repos/actions/checkout/git/ref/tags/v4`); the sketch below has `<sha>` placeholders on
  purpose: they were not looked up.
- **No script injection.** Never put `${{ inputs.* }}` or other event text directly inside a `run:` script. Pass it as an
  environment variable and validate it (`^[a-z0-9][a-z0-9._,-]*$` for figure ids), as the sketch does.
- **The token is never printed:** the sync reads it from the environment and does not log it (its safety rules say so, the notification tests assert it for the hook token, and I grepped a real publish log for the library token: no hit); GitHub also masks secrets.
- **Failure behaviour:** a failed or cancelled publish is harmless: items are put in the library first and the **manifest
  last**, so designers see the old version until the new one is whole, and the next run finishes it. One figure failing does
  not stop the others (exit code 1 at the end). A failed Books notification never fails the run; the log says how to re-send
  (`--notify`).
- **Same rules as by hand:** clean worktree (a checkout is clean), and a changed figure needs a bumped `version`.

## The add/update flow end to end

1. A PR changes `assets/<id>/…` and bumps `version` in `asset.json`. The **plan job** comments the table: that figure `changed`,
   which parts will be rebuilt, the lab size. If the version was not bumped, the figure is `blocked` and the job fails.
2. The PR is reviewed and merged. The **publish job** starts on the push; a reviewer approves the environment.
3. `npm run library:sync -- --library https://library.pathshalax.com --tier production --formats lab,poster,glb --apply`
   runs: lab (sandbox-checked), poster, models, then the manifest; the previous items become `state:superseded`.
4. The sync tells the Books server `{figures:[…]}`; the server updates those figures in every book that uses them:
   the same major version is applied, a **new major version or settings the book uses are held** (*Updates* page), pinned
   items are not touched. The answer line (`Books updated: n applied, n need review, n failed (figures: …)`) goes into the step summary.
5. A new figure only appears in the library (nothing to update in books); designers add it from the author picker.

## Missing in the repo: mark and warn, never delete by default

### The default: orphan marking (the sync, this repo)

When a figure's items are in the library and the figure is not in the repo, and the run saw the **whole** repo (no `--only`,
no `--changed-since`; the same rule that already protects withdrawal):

- the sync **adds the tag `orphaned:<YYYYMMDD>`** (the date it was first seen missing) to that figure's current manifest, lab,
  poster, video and model items. It re-registers each record with the new tag list (`library.retag`, which the sync already
  uses for `state:superseded`; it needs only the **write** token). The date is not renewed by later runs.
- **`state:current` stays.** This is the key choice. The Books server's update job asks the library for items tagged
  `state:current` per figure; the author picker lists them. If the mark replaced `state:current` (for example with
  `state:orphaned`), a wrong merge that drops a figure would make it vanish from the picker and from the update job at
  once, which is deleting by another name. With an added tag, everything keeps working and the mark is information.
- **Unmarking is automatic.** If the figure comes back in the repo, the planner sees an `orphaned:` tag on a figure that exists,
  plans a `repair` ("the figure is back: the orphan mark is removed") and retags without it. Restoring a deleted folder from
  git therefore needs no manual step in the library.
- **Safety against a bad checkout:** marking more than **3 figures in one run** (or more than 25% of the library's figures)
  refuses and fails, like `--confirm-withdraw` does for withdrawal today (`--confirm-orphans`). A corrupted or empty
  checkout must not flag everything.
- Flag: `--orphans mark|warn|ignore` (default `mark` with `--apply`, `warn` in a dry run, where it only prints). `--check` should
  treat orphans as a **warning** (exit 0 with a notice); today `withdraw` counts as "behind" and would fail the nightly check
  forever.
- Report: `report.orphaned: [{id, since}]`, and a line in the step summary.

### What a person sees (the Books server and the editor)

Chalkbook-internal (`apps/dashboard`, `packages/db/src/embeds`), verified facts: `chalk_book_embeds.status` is a plain `text`
column (migration 0007), so a new status needs **no migration**, only the TypeScript list `EMBED_STATUSES`
(`current / update_pending / needs_review / failed`); the *Updates* page lists `needs_review, update_pending, failed`; the update job asks
the library for `state:current` and decides per embed.

- New row status **`source_removed`** (label "Source removed"). The update job, when the current manifest's tags include
  `orphaned:`, **changes nothing in the book** (it is still up to date) and sets this status with the note
  "no longer in the 3D source since 2026-10-29". When the tag disappears the next run sets the row back to `current`.
- The *Updates* page lists it (informational, grey, not red); a book's *Library items* panel shows the badge on that row;
  the *Books* list can show a count. What an author **does**: nothing is urgent (the book keeps its own copy of the lab); they
  may **pin** it, replace it with another lab, or leave it. Nothing is lost.
- **The author picker** (reader, `packages/reader` in chalk-format): a small badge "no longer in source" on items whose record
  carries an `orphaned:` tag, sorted after live items. Keep the reader generic: a host-supplied
  `libraryItemBadge?: (item) => string | null` prop (the dashboard returns the badge from the tag), instead of the reader knowing our tag names.
  Tags are free-form in the registry, so **no format or spec change** is needed.

### The explicit deletion setup (separate, off by default)

- A **separate workflow** `library-withdraw`: `workflow_dispatch` only, never on push or schedule; its own environment
  `library-withdraw` with required reviewers; the only place `LIBRARY_ADMIN_TOKEN` (an administrator, `name!`) exists, because
  the library only lets an administrator withdraw. Inputs: `figures` (ids) and `confirm` (the same ids typed again, or the text
  `WITHDRAW <n>`); the job refuses if they differ.
- It runs the sync with `--allow-withdraw --confirm-withdraw` and a **new flag `--withdraw-only <ids>`** (code to add) that limits
  withdrawal to the listed ids and **refuses ids that are not orphaned** (an id still in the repo, or not marked). Today a
  selection never plans withdrawals; this is the only path that does.
- **It withdraws only figures' own items** (manifest, lab, poster, video, models). The shared libraries (three.js and add-ons)
  are not figure items and are never touched (verified: the plan's withdraw list is those five kinds).
- **"Never an item a book uses" must be made true first.** The sync asks the library `GET v1/assets/{key}/books`, and the
  library only knows what authoring tools registered with `PUT v1/books/{bookId}/assets` (registry API §6). **Nothing on our
  side calls it** (checked in the reader, the core client and the dashboard): today the answer is always empty for our books,
  so the guard is **blind**. Two ways to fix, pick one before building the deletion workflow:
  - **(a) Register usage:** the Books server calls `PUT v1/books/<slug>/assets` after each save and each update run, with the
    keys the book carries (lab entry, lab assets, libraries, model keys, posters). Standard, helps every tool, but the Books
    server then needs a library **write** token (`CHALK_LIBRARY_TOKEN`; reads stay open). **Recommended.**
  - **(b) Ask the Books server:** an endpoint `GET /api/library-sync/usage?figure=<id>` (same bearer token as the hook) answering
    which books have rows for that figure (`chalk_book_embeds` already knows); the deletion job calls it and refuses on any use.
    No new token on the server, but non-standard and only our tools benefit.
- **Withdrawn is final** (registry API §8): the key answers `410 Gone` for good and the same bytes can never be uploaded again.
  So after a withdrawal, restoring the figure needs **different bytes** (a bumped `version` that changes the lab; the sync says
  so when it meets a withdrawn key and marks the figure `blocked`).
- **Books keep opening** after a withdrawal: a book carries its own copy of the lab's files (verified: the update job writes the
  files into the book's own store). What a withdrawal removes is picking the lab for new books and updating existing ones.
  (Whether an external reference without a carried copy could exist is an assumption; the usage guard above is the protection.)

### Decision table

| What happened | What the sync sees | What happens by default | What a person does |
|---|---|---|---|
| Figure removed on purpose | in library, not in repo | **marked** `orphaned:<date>`, books keep working, a warning in *Updates* | decide: leave it marked, or later run the deletion workflow once no book uses it |
| Removed by mistake (a bad merge, a wrong branch) | same | same (and the 3-figure safety stops mass marking) | restore from git (`git revert`); the next run **unmarks** by itself; nothing was lost |
| Id renamed (`assets/old` → `assets/new`) | `new` is new, `old` is orphaned | both are live; `old` is marked | move books to `new` in the editor, then delete `old` explicitly. Ids are meant to be stable (AGENTS.md), so this is rare |
| Page or topic moved | same id, `asset.json` fields changed | `changed`: manifest rewritten; no lab rebuild unless the lab depends on the field | none |
| Hide from designers but keep in books | still in the repo | **not expressible today** | open decision: an `asset.json` flag `"library": "retired"` that adds a `retired:` tag, shown like an orphan mark |
| Withdrawn by hand in the library | repo has it, library item is `withdrawn` | `blocked` ("an item was withdrawn earlier") | change the figure so its bytes differ and bump the version |

## Observability

- **Step summary** (`$GITHUB_STEP_SUMMARY`): the plan table (id, category, version, reasons), counts, the libraries line, orphans,
  the Books answer line. A small script `scripts/ci/library-summary.mjs` (to write, about 40 lines) turns `report.json`
  into Markdown and prints `blocked/failed` counts; the PR job also posts it as a comment (update the same comment, do not add one per push).
- **Artifacts:** `report.json` and the run log, kept 30 days.
- **Failure notifications:** GitHub emails the person who triggered a failed run and the repo's "Actions" watchers. For a team
  channel, add a final `if: failure()` step posting to a Slack incoming webhook (`SLACK_WEBHOOK_URL` secret) if the owners
  use Slack; **not available by default**, nothing is configured.
- **Drift:** the nightly `--check` job; also run it right after any manual change to the library. Exit 1 means the library is
  behind the repo.
- **Books side:** the *Updates* page and `chalk_book_embeds` statuses already show what the last update did.

## Rollout, in small steps (each has an acceptance check)

| Step | Build | Acceptance |
|---|---|---|
| 0 | the runner decision (billing, or a self-hosted runner) | a trivial workflow runs on a PR |
| 1 | PR plan job + `scripts/ci/library-summary.mjs` | a PR that changes a figure without a version bump fails with the figure `blocked`; one with a bump passes and comments the table; a PR from a fork runs without secrets |
| 2 | `library-publish` by **manual dispatch only**, environment with reviewers, dedicated `ci` token; first run `dry_run: true`, then real with `only: screw-gauge` | the figure's items appear/update; a second run says `unchanged`; the step summary shows the Books answer; the token is nowhere in the log |
| 3 | enable the `push` trigger (with `paths-ignore` for the studio's commits) and the nightly `--check` | a merge that touches one figure publishes only that figure; a studio-only commit (a review) triggers nothing; a deliberately broken library state makes the nightly job fail |
| 4 | orphan marking in the sync (`--orphans`, `--confirm-orphans`), the Books server's `source_removed` status and badge, the picker badge | removing a figure's folder in a test branch marks its items; books keep working; the *Updates* page shows "Source removed"; restoring the folder unmarks it; removing 4+ figures refuses |
| 5 | usage registration (a) or endpoint (b), then the `library-withdraw` workflow with `--withdraw-only` | withdrawing an orphan nobody uses works only with both approvals and the admin token; an orphan a book uses is refused; a non-orphan id is refused |

Code to add, by repository:

- **pathshala-3d-platform:** `--orphans`, `--confirm-orphans`, `--withdraw-only`; planner: orphan repair on return; `--check`
  treats orphans as a warning; `report.orphaned`; `scripts/ci/library-summary.mjs`; tests with the in-memory fake library
  (`test/library-fake.mjs`) for marking, unmarking, the safety limit and refusal of non-orphans.
- **chalkbook-internal:** `EMBED_STATUSES` + `source_removed` (no migration), update job reads `orphaned:` tags, *Updates*
  page and *Library items* panel labels; usage registration or the usage endpoint (step 5).
- **chalk-format (reader):** the `libraryItemBadge` prop in the author picker. No spec change.
- **GitHub / Coolify (owners):** the billing or runner decision, environments, secrets, and the `ci` token in `TOKENS`.

## Workflow sketch (UNTESTED, not enabled, not in `.github/workflows`)

Steps 1-3. `<sha>` marks an action to pin by full commit SHA when it is built. Scripts named here that do not exist yet are marked.

```yaml
# ---- .github/workflows/library-plan.yml  (step 1) ----
name: Library plan
on:
  pull_request:
    paths: ['assets/**', 'shared/**', 'scripts/lib/library/**', 'package-lock.json']
permissions:
  contents: read
  pull-requests: write
concurrency: { group: library-plan-${{ github.ref }}, cancel-in-progress: true }
jobs:
  plan:
    runs-on: ubuntu-24.04
    env: { LIBRARY_URL: 'https://library.pathshalax.com' }
    steps:
      - uses: actions/checkout@<sha> # v4
      - uses: actions/setup-node@<sha> # v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      # a dry run reads the library (open reads: no secret) and builds the labs to size them; it writes nothing
      - run: node scripts/library-sync.mjs --library "$LIBRARY_URL" --tier production --formats lab,poster,glb --report plan.json
      # blocked does not change the sync's exit code: read the report. (to write: scripts/ci/library-summary.mjs)
      - run: node scripts/ci/library-summary.mjs plan.json --fail-on blocked,failed >> "$GITHUB_STEP_SUMMARY"
      - if: always()
        uses: actions/upload-artifact@<sha> # v4
        with: { name: library-plan, path: plan.json, retention-days: 30 }

# ---- .github/workflows/library-publish.yml  (steps 2 and 3) ----
name: Library publish
on:
  workflow_dispatch:
    inputs:
      only:    { description: 'figure ids, comma separated (empty = all)', required: false, default: '' }
      formats: { description: 'lab,poster,glb', required: false, default: 'lab,poster,glb' }
      dry_run: { description: 'only plan', type: boolean, default: true }
  push:                      # enable in step 3 only
    branches: [main]
    paths: ['assets/**', 'shared/**', 'scripts/lib/library/**', 'package-lock.json']
    paths-ignore: ['assets/*/reviews/**', 'assets/*/status.json', 'assets/*/NOTES.md']
permissions:
  contents: read
concurrency: { group: library-publish, cancel-in-progress: false }
jobs:
  publish:
    runs-on: ubuntu-24.04
    environment: library-production        # required reviewers; holds the secrets below
    timeout-minutes: 90
    env:
      LIBRARY_URL: 'https://library.pathshalax.com'
      PATHSHALA_MIN_FREE_GB: '2'
    steps:
      - uses: actions/checkout@<sha> # v4
      - uses: actions/setup-node@<sha> # v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - uses: actions/cache@<sha> # v4
        with: { path: ~/.cache/ms-playwright, key: "playwright-${{ hashFiles('package-lock.json') }}" }
      - run: npx playwright install --with-deps chromium
      - name: Sync
        env:
          # event text goes through the environment, never into the script text
          ONLY: ${{ inputs.only }}
          FORMATS: ${{ inputs.formats || 'lab,poster,glb' }}
          DRY: ${{ inputs.dry_run }}
          EVENT: ${{ github.event_name }}
          LIBRARY_TOKEN: ${{ secrets.LIBRARY_TOKEN }}
          LIBRARY_SYNC_HOOK_URL: ${{ vars.LIBRARY_SYNC_HOOK_URL }}
          LIBRARY_SYNC_HOOK_TOKEN: ${{ secrets.LIBRARY_SYNC_HOOK_TOKEN }}
        run: |
          set -euo pipefail
          [[ "$FORMATS" =~ ^[a-z,]+$ ]] || { echo "bad formats"; exit 2; }
          args=(--library "$LIBRARY_URL" --tier production --formats "$FORMATS" --report report.json)
          if [ -n "$ONLY" ]; then
            [[ "$ONLY" =~ ^[a-z0-9][a-z0-9._,-]*$ ]] || { echo "bad figure ids"; exit 2; }
            args+=(--only "$ONLY")
          fi
          # a push publishes; a dispatch publishes only when dry_run is off
          if [ "$EVENT" = "push" ] || [ "$DRY" = "false" ]; then args+=(--apply); fi
          node scripts/library-sync.mjs "${args[@]}"
      - if: always()
        run: node scripts/ci/library-summary.mjs report.json >> "$GITHUB_STEP_SUMMARY"   # (to write)
      - if: always()
        uses: actions/upload-artifact@<sha> # v4
        with: { name: library-report, path: report.json, retention-days: 30 }

# ---- .github/workflows/library-drift.yml  (step 3) ----
name: Library drift
on:
  schedule: [{ cron: '17 2 * * *' }]
  workflow_dispatch: {}
permissions:
  contents: read
jobs:
  check:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@<sha> # v4
      - uses: actions/setup-node@<sha> # v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      # exit 1 when the library is behind the repo; no secret needed
      - run: node scripts/library-sync.mjs --library https://library.pathshalax.com --tier production --formats lab,poster,glb --check --report drift.json
```

## Open decisions for the owners

1. **Runner:** fix billing (A, recommended), a self-hosted runner on the studio server (B), or publish from the studio server (C).
2. **Approval:** require a reviewer for every publish, or only for manual runs (push after a reviewed PR publishes at once).
3. **Dedicated CI token:** mint `ci:<token>` in the library's `TOKENS` (Coolify `chalk-library`); and later an administrator token only for the deletion environment.
4. **Usage guard for deletion:** register book usage with the library (a, recommended; needs a write token on the Books server) or a Books-server endpoint (b).
5. **Retired figures:** do we need "hide from designers but keep in books" (an `asset.json` flag), or is the orphan mark enough?
6. **Models and video in CI:** publish `glb` (56 poses, not yet run anywhere) and `video` (slow) automatically, or by manual dispatch only.
7. **Notifications:** is there a Slack/Discord channel for failure messages?

## Verified and assumed

**Verified in the code** (read on `studio/library-sync`, 2026-10-29): the exit codes and that `blocked` does not fail a run; the
file lock and its limits; `--check`; the plan's `withdraw` category and `withdrawRemoved` (default does not withdraw; the
3-figure confirm; the `books(key)` guard); `retag` and tag replacement; `report.json` keys; the notification body and
`MAX_FIGURES`; `ci.yml` conventions, `.nvmrc` = 22; that **no code calls `PUT v1/books/{id}/assets`**; the Books server's embed
statuses, that the `status` column is text, that the update job asks for `state:current`; that books carry their own lab files; the registry
rules (write token to register, administrator to withdraw, a withdrawn key is gone for good).

**Measured:** 28 s for one figure's poster-plus-manifest on a laptop; posters used no measurable disk (3 GB free before and after).

**Assumed, to check when building:** hosted runner disk (about 14 GB) and per-minute price; GitHub's behaviour that a pending
`concurrency` run is replaced by a newer one; that Playwright's browser cache restores correctly on the hosted runner; the
runtimes marked "estimated"; that no external (non-carried) lab references exist in books; that GitHub Actions works again once
the billing limit is lifted (it never ran on this repo, so no workflow here has been tested).
