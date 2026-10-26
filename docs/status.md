# Status: what is done, what is open, how to continue

Snapshot of 2026-10-26. Update it whenever a batch lands (the `/figure-batch` skill's last step).

## On `main`: 26 figures (Physics 9–10)

| Page | Topic | Figure | Title |
|---|---|---|---|
| 17 | 1.5.2 | `si-prefixes` | কোনটা কত বড়? (SI prefixes) |
| 20 | 1.6 | `vernier-caliper` | স্লাইড ক্যালিপার্স |
| 21 | 1.6.1 | `screw-gauge` | স্ক্রু-গেইজ |
| 23 | 1.6.2 | `digital-balance` | ডিজিটাল ব্যালান্স |
| 23 | 1.6.3 | `stopwatch` | থামা ঘড়ি |
| 36 | 2.2 | `linear-motion`, `circular-motion`, `translational-motion` | সরলরৈখিক, ঘূর্ণন, চলন গতি |
| 37 | 2.2 | `periodic-motion`, `simple-harmonic-motion` | পর্যায়বৃত্ত, সরল স্পন্দন গতি |
| 38 | 2.3 | `scalar-vector` | স্কেলার ও ভেক্টর রাশি |
| 39 | 2.4 | `distance-displacement` | দূরত্ব ও সরণ |
| 40 | 2.5 | `speed-velocity` | দ্রুতি এবং বেগ |
| 43 | 2.6 | `acceleration` | ত্বরণ |
| 45 | 2.7 | `equations-of-motion` | গতির সমীকরণ |
| 48 | 2.8 | `falling-bodies` | পড়ন্ত বস্তুর সূত্র |
| 64 | 3.1 | `newtons-first-law` | নিউটনের প্রথম গতি সূত্র |
| 64 | 3.1.1 | `inertia` | জড়তা |
| 67 | 3.1.2 | `contact-noncontact-force` | বল: স্পর্শ ও অস্পর্শ বল |
| 68 | 3.2.1 | `gravitational-force` | মহাকর্ষ বল |
| 68 | 3.2.2 | `electromagnetic-force` | তড়িৎ চৌম্বক বল |
| 68 | 3.2.3 | `weak-nuclear-force` | দুর্বল নিউক্লীয় বল |
| 69 | 3.2.4 | `strong-nuclear-force` | সবল নিউক্লীয় বল |
| 69 | 3.3 | `balanced-forces` | বলের সাম্যাবস্থা ও অসাম্যাবস্থা |
| 71 | 3.4 | `momentum` | ভরবেগ |
| 72 | 3.5.1 | `conservation-of-momentum` | ভরবেগ এবং শক্তির সংরক্ষণশীলতা |

Every figure from page 36 on was built by a builder agent, reviewed by an independent reviewer agent, fixed, and
touch-tested (see `docs/agents/`). The ones from page 36 on are at studio status "idea": the owner moves them to
"review" in the studio when reviewers should see them. Their Bangla still needs a person's check against the book.

## In progress

- **The clean panel ("one action, one result, one rule")**, from the owner's feedback of 2026-10-25: the panels
  under the picture had too many boxes. The kit gets a big action button with a numbered badge that matches a
  marker on the 3D object, one result line and one rule line (`kit/action-panel`, kit 1.3.0); `newtons-first-law`
  is redone on it first (with a real-looking textbook) for the owner to see, then the owner's other four:
  `scalar-vector` (a simpler idea instead of the board of arrows), `distance-displacement` (the panel tied to the
  picture: path = দূরত্ব, arrow = সরণ), `contact-noncontact-force` (which force touches and which doesn't, in the
  scene and the test), `electromagnetic-force` (frame the comb, the hair and the paper together), then the rest of
  chapter 2 and the batch-3 figures.
- `images/` (untracked, in the studio checkout) holds pages 43–72; all of them are done. New pages come as new
  images there.

## Recently merged

- **Batch 3 (pages 69–73)**: #32 `balanced-forces` (3.3), #34 `momentum` (3.4), #33 `conservation-of-momentum`
  (3.5.1), each built, independently reviewed, fixed and touch-tested; merged on the local checks (CI was blocked,
  below). Shared decisions in `docs/book-notes.md` ("Forces and momentum").
- **#18 kit 1.2.0** (`shared/CHANGELOG.md`): what the chapter-2 figures worked around is now in the kit: labels
  placed clear of each other and of the corner buttons (`createAnnotations` `spots` + `avoid`), `createArrow`, the
  quiz's `lines` (steady sheet height) and `reveal(q, correct, picked)`, the coach's `inset` / `labelAt`. New
  figures use these instead of their own `src/labels.js`; the existing figures keep their copies for now. Visual
  comparison over all 23 figures: identical apart from the two flaky ones below.
- **#17 `fix(verify)`**: verify's pictures are in the poster state, setup commands included (as `npm run export`).
  `npm run verify` passes for all 23 figures (`screw-gauge`, `si-prefixes` and `vernier-caliper` got their
  `maintainers` at the same time).

## Open pull requests (not merged)

- **#1–#4**: Dependabot updates (actions, tooling). Review and merge when convenient.

## Known issues

- **GitHub Actions don't start** since 2026-10-25 ~19:00 UTC: "recent account payments have failed or your
  spending limit needs to be increased" (the `runagent-dev` account's billing). Until the owner fixes it, every PR
  shows a red check with nothing run; the local `npm run verify`, touch tests and the pre-push hook are the proof.
- **CI "Visual comparison" flakes** on `speed-velocity` (up to ~160 px) and `periodic-motion` (15–76 px) in PRs that
  don't touch them: those two figures aren't fully deterministic under the virtual clock (they differ even when
  `main` is compared with itself). Every other check is reliable. Fix in the figures (or the kit) in its own PR;
  until then read the log to see which figures differ.
- **Kit gap left**: camera fitting with per-side margins (`src/camera.js` in several figures).
- **Units** in `newtons-first-law`, `inertia`, `stopwatch`, `simple-harmonic-motion` are Bangla abbreviations
  (মি/সে); the kinematics figures use the book's symbols (see `docs/book-notes.md`). Owner to decide.

## How to continue (for a new session or account)

Give the session the pages and say what you want, for example:

> The images in /root/pathshala-3d/images are book pages, named P-<page>-T-<topic>. Extract the concept of each,
> then make a figure per topic with builder and reviewer agents, as in docs/agents/README.md (/figure-batch). Do it
> extremely well, to the owner's taste in that file.

or, to finish the batch above: "Read docs/status.md and finish what is in progress, then merge with my OK."

The studio: `npm run dev:public` (see `CLAUDE.md`, "This server"). After merging, update the studio's checkout with
`git -C /root/pathshala-3d pull --ff-only` so new figures appear in the dashboard.
