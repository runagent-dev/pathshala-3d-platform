# Status: what is done, what is open, how to continue

Snapshot of 2026-10-25. Update it whenever a batch lands (the `/figure-batch` skill's last step).

## On `main`: 23 figures (Physics 9–10)

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

Every figure from page 36 on was built by a builder agent, reviewed by an independent reviewer agent, fixed, and
touch-tested (see `docs/agents/`). The ones from page 36 on are at studio status "idea": the owner moves them to
"review" in the studio when reviewers should see them. Their Bangla still needs a person's check against the book.

## In progress

Nothing: the batch for pages 43–69 (ten figures) is merged. `images/` (untracked, in the studio checkout) still
holds those ten pages; they are all done. New pages come as new images there.

## Open pull requests (not merged)

- **#18 `feat(kit)`: kit 1.2.0** (what the chapter-2 figures worked around: arrows, annotations with collision
  avoidance, coach, loupe, quiz reveal getting the picked index…). Needs a rebase on the new `main` and
  `npm run test:visual` over all 23 figures (the ten new ones weren't in its comparison), then the owner's OK.
- **#17 `fix(verify)`**: verify's pictures in the poster state including setup commands. Needs a rebase and a
  verify run over the new figures before merging.
- **#1–#4**: Dependabot updates (actions, tooling). Review and merge when convenient.

## Known issues

- **CI "Visual comparison" flakes** on `speed-velocity` (up to ~160 px) and `periodic-motion` (15–76 px) in PRs that
  don't touch them: those two figures aren't fully deterministic under the virtual clock. Every other check is
  reliable. Fix in the figures (or the kit) in its own PR; until then read the log to see which figures differ.
- **Kit gaps** many figures worked around (candidates for the kit): a screen-space label placer with collision
  avoidance (`src/labels.js` in several figures), camera fitting with per-side margins (`src/camera.js`), the quiz's
  `reveal` not receiving the picked index, the coach refusing spots within 48 px of the stage bottom.
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
