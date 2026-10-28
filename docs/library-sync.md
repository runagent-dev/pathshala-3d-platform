# Library sync: keeping the Chalk library up to date with the figures

The figures in this repo go to the book through a **Chalk library server** (the media library the book editor
uses). The repo keeps changing: new figures appear, existing ones change. `npm run library:sync` is the one
command that finds the difference between the repo and the library and closes it: it exports a GLB where
`asset.json` says so, builds an interactive or animated figure as a **Chalk lab** (one sandboxed HTML file), and
publishes only what is new or changed. It is safe to run again and again, and it only looks until you say
`--apply`.

```bash
git pull
npm run library:sync                                    # dry run: what would change (needs no library)
npm run library:sync -- --library <url>                 # dry run against a library
LIBRARY_TOKEN=… npm run library:sync -- --library <url> --apply
```

Decision record: [0007](decisions/0007-library-sync.md). Chalk side: the lab spec (`spec/1.1` §3, `spec/1.5`) and the
registry API (`spec/1.2/registry-api.md`) in the chalk-format repo.

## What it publishes

For each figure, as separate library items that a book can use on their own or together:

| Item | Type | When |
|---|---|---|
| **Lab** | `text/html`, one self-contained file | figures with a page (`interactive`, `animation`); `--formats lab` |
| **Lab manifest** | `application/vnd.chalk.lab+json` | with the lab; this is what a book designer finds and places |
| **Poster** | `image/webp` (the exporter's 800×500 picture) | `--formats poster`; named by the manifest, shown before the lab starts |
| **Models** | `model/gltf-binary`, one per pose in `export.glb` | `--formats glb`; models from `export.glb`, or the figure itself for a `model` figure |
| **Video** | `video/mp4` | only with `--formats video` (slow); figures that have `export.video` |
| **Libraries** | `text/javascript`, one per module | three.js and the add-ons the labs import; shared by every lab, published once |

The default is `lab,poster,glb`. Every item is tagged `origin:pathshala-3d`, `kind:…`, `figure:<id>`,
`figure-version:<v>`, `page:<n>`, `topic:<x.y.z>`, `book:<id>`, the subject, `license:<spdx>`, `source:<hash8>`,
`fp-lab`/`fp-glb`/`fp-poster`/`fp-video`, `commit:<sha12>` and `state:current|superseded`. The library searches by
exact tag, so the next run reads the whole library state in a few requests (`GET /v1/search?tag=origin:pathshala-3d`).

## How a run goes

1. **Read the repo.** Per figure: its fingerprints (below), whether it may be published, which poses it exports.
2. **Read the library.** One tag search; nothing is fetched twice.
3. **Plan.** Each figure is `new`, `changed`, `repair`, `unchanged`, `withdraw` or `blocked`, with the reason and the
   parts to build (lab, poster, each pose, manifest). This is what a dry run prints and writes to the report.
4. **Apply** (only with `--apply`). Per figure, in this order: libraries, lab (run once in the sandbox first), poster,
   models, video, **then the manifest**, then the previous items are marked `state:superseded`.

The manifest is the **commit point**: a book designer finds a lab through its manifest, so until it is written the
library still shows the previous version, whole. A run that stops anywhere (a crash, a kill, a dropped connection)
leaves the old version working, and the next run finishes the job: if two items are current for one part, the newer
wins and the older is demoted. One figure failing does not stop the others; the exit code is 1 if any failed.

| Category | Means | What `--apply` does |
|---|---|---|
| `new` | the library has nothing of this figure | publishes everything |
| `changed` | a fingerprint or the figure's `source` differs | builds only the parts whose fingerprint changed, writes the manifest |
| `repair` | the figure is current but an item is missing (or was retagged) | publishes only the missing part |
| `unchanged` | nothing to do | nothing (no build, no request that writes) |
| `withdraw` | the library has it, the repo does not | nothing, unless `--allow-withdraw` (below) |
| `blocked` | may not be published (production gates, an item withdrawn earlier, a lab over budget) | nothing; the reason is in the report |

## Fingerprints: when something counts as changed

`scripts/lib/library/fingerprint.mjs` hashes, **per figure and per kind of item**, only what that item depends on:

- the figure's deliverable files (its folder minus `NOTES.md`, `status.json`, `thumbnail.png`, `reviews/`, `exports/`,
  `reference/`, `tests/`, `packageExclude` and documents);
- the kit modules **in its import closure** (found by reading its imports, the same walk the packager uses), so a change
  to `shared/lib/student/loupe.js` rebuilds the figures that import it and no others;
- the fields of `asset.json` the item depends on: a lab depends on `id`, `version`, `type`, `units`, `book`, `page`,
  `topic`, `params` (what the kit reads at run time); the models and the poster depend on everything except the
  descriptive fields (`title`, `description`, `tags`, `maintainers`, `placement`, `order`, `commands`, `events`) and `version`;
- the tool versions: esbuild and `@chalk-format/core` (labs), Playwright and the glTF tools (models, poster), the
  vendored three.js (everything, via `shared/vendor/three/VERSION`, not by hashing its bytes), the kit version, and
  the code of the lab adapter, the bundler and the exporter.

So a changed description rebuilds no lab (it rewrites the manifest only), a version bump rebuilds the lab only, a
changed export pose rebuilds the models and the poster only, and a new esbuild rebuilds every lab and nothing else.
`.cache/library/state/<id>.json` remembers the last published file hashes so the report can say *which file* or
*which kit module* changed.

## How a figure becomes a lab

`scripts/lib/library/bundle-lab.mjs` uses the figure's own `index.html` as the template and esbuild to make **one
HTML file** (no network, UTF-8, under the 2 MiB hard limit of spec 1.1 §3.4). Neither the figure nor the kit is
edited; four substitutions are made at build time (`scripts/lib/library/runtime/`):

| In the figure | In the lab |
|---|---|
| `@shared/bridge.js` (postMessage to the book page) | a stub: the figure's commands and events go to the Host API adapter |
| `@shared/export-glb.js` | a stub (models are exported by the exporter and published as their own items) |
| `location.search` (the figure reads its settings from the URL) | the designer's settings (`init.params`), with the reader's language for `lang` |
| `fetch('./asset.json')` | the runtime fields of `asset.json`, inlined |

The adapter (`runtime/lab-prelude.js`) connects with `connectLab` from `@chalk-format/core/lab/client`, holds animation
frames while the reader says the lab is not visible, calls the figure's `reset` command on the reader's "start over",
and reports `ready` when the figure's own `ready` event fires. Opened on its own (no reader answers within 1.5 s) the
lab starts with its defaults. Stylesheets (the Noto Sans Bengali font as data URLs, the student kit CSS, the figure's own)
are inlined in page order.

three.js and its add-ons are **not** in the file. They are bundled once each from `shared/vendor/three` as ES modules and
published as the lab's `libraries` (spec 1.5 §2), so thirty labs share one 700 KB copy of three.js and the lab runs the
exact three.js this repo's figures were made and tested with (the library's version is in the item tags and the manifest).

**Size.** Of the 34 figures, all fit the 2 MiB limit (258–343 KiB); 16 are over the recommended 300 KiB. About 190 KiB
of every lab is the Noto Sans Bengali font as base64 (the Bangla and Latin subsets), which the file must carry because a
lab has no network. The build fails a lab over 2 MiB and warns over 300 KiB.

**Run in the sandbox before publishing** (`scripts/lib/library/verify-lab.mjs`, on by default with `--apply`,
`--no-verify` to skip): the lab is run in headless Chromium inside `<iframe sandbox="allow-scripts">` with the lab CSP, mounted
by the real host code of `@chalk-format/core` (`createLabHost`), with every request blocked. It must say hello and get `init`,
report ready, receive the designer's settings (the query the figure reads, and the figure's own state, checked on `screw-gauge`'s
`value`), stop drawing frames while hidden and resume when visible, call `reset`, draw something, and raise no error or CSP
violation. It does **not** check teaching content, touch input, phone layout (the existing `npm run verify` does), the Chalk
reader's own UI, or the `state`/`progress` capabilities (see Limits).

## The manifest

`scripts/lib/library/manifest.mjs` turns `asset.json` into a `chalk.lab` manifest:

| asset.json | manifest |
|---|---|
| `id` + the book's subject | `id` `org.pathshalax.<subject>.<slug>` |
| `version` | `version` (staging work that did not bump it: `<version>+<fingerprint8>`) |
| `title` "English (বাংলা)" | `title` `{ en, bn }` |
| `description` | `description` `{ en }` |
| book `subject`, `classes` | `subject`, `classes` |
| `tags`, `maintainers` | `tags`, `authors` |
| `params` | `params`, a JSON Schema: `select` → string + `enum`, `boolean` ("1"/"0") → boolean, `number` → number, `text` → string, with defaults |
| the lab, poster and libraries built | `entry`, `poster`, `libraries` (`specifier`, `version`, asset key) |
| (phase 1) | `capabilities: []`, `size` 800×500 (min 390×390) |
| book, page, topic, units, models, source | `x-pathshala` (the format ignores keys it does not know) |

The bytes are deterministic (no date, no commit, no path): the same figure at the same version gives the same key. What
changes with each run (commit, fingerprints, time) is in the item tags. All 34 figures' manifests pass the Chalk reader's own
schema, and a lab placed with its defaults passes the reader's own settings check (`test/unit/library-manifest.test.mjs`).

## Safety

- **Dry run by default.** Without `--apply` nothing is published, withdrawn or retagged. A dry run needs no token and, without
  `--library`, no library (it plans against an empty one).
- **No default address.** `--library` is required to touch a server, and `--apply` also needs the token in the environment
  variable named by `--token-env` (default `LIBRARY_TOKEN`). The token is never printed or written.
- **Writes only to `.cache/library`** (the built files, the lock, the state, the report) **and the `--report` file**.
- **Tiers.** `--tier staging` (default) publishes every figure. `--tier production` publishes only figures whose status is
  `approved`, from a clean worktree (no uncommitted change to the figure or the kit files it imports), with a new version
  (a changed figure with the same version is blocked, so a published version always means the same bytes), and with a
  license. A figure that fails a gate is `blocked` with the reason, not skipped silently.
- **License.** `--license <SPDX>` or `"license"` in `library-sync.config.json`; written on every item and the manifest.
  Production refuses without one (the repo has no LICENSE file: this is a decision for the owners); staging warns.
- **Withdrawing.** Only figures that are **gone from the repo**, only with `--allow-withdraw`, never an item a book uses
  (`GET /v1/assets/{key}/books`; the figure is `blocked` instead), never superseded versions (books may use old ones), and
  more than three figures in one run also needs `--confirm-withdraw`. A withdrawn key is gone for good (spec 1.2 §8).
  A figure's items withdrawn **by hand** are seen as missing; the sync cannot put the same bytes back (the library answers
  `gone`), so that figure is reported `blocked` until it changes. A retagged item is repaired.
- **One run at a time.** `.cache/library/sync.lock` (`pid`, host, start time). A lock whose process is gone on this machine
  is taken over; one held by a live process or another machine stops the run (exit 3).
- **Reruns.** A finished figure is not built or uploaded again. Built files are cached by fingerprint, written to a temporary
  name and renamed, so a half-written file is never used. An export that fails (software rendering misses its time limits on
  a busy machine) is tried once more before the figure is reported as failed.

## Options

`npm run library:sync -- --help` lists them; the top of `scripts/library-sync.mjs` explains each. The useful ones: `--only
<id,id>`, `--changed-since <git ref>` (figures whose files or imported kit modules changed since the ref; no withdrawals),
`--formats lab,poster,glb,video`, `--tier`, `--license`, `--no-verify`, `--check` (exit 1 when the library is behind, for CI),
`--cache-dir`, `--report`, `--json`.

`library-sync.config.json` (optional, at the repo root; read only): `{ "license": "CC-BY-4.0", "formats": ["lab", "poster",
"glb"], "size": { "width": 800, "height": 500, "minWidth": 390, "minHeight": 390 } }`.

Exports need headless Chromium and, like `npm run export`, 10 GB free disk; `PATHSHALA_MIN_FREE_GB` lowers that limit
(a small disk, or CI).

## Trying it on your machine

Never against production. A local library with nothing to install but the package:

```bash
mkdir lib && cd lib && npm init -y && npm install @chalk-format/library-server
DATABASE_URL=pglite:./db STORAGE=disk DISK_DIR=./files TOKENS='me:dev-token,admin!:dev-admin' PORT=4900 \
  PUBLIC_URL=http://127.0.0.1:4900 npx chalk-library serve

# in this repo
LIBRARY_TOKEN=dev-token npm run library:sync -- --library http://127.0.0.1:4900 --license CC-BY-4.0 --apply
```

`node scripts/library-scenarios.mjs --library http://127.0.0.1:4900 --token dev-token --admin-token dev-admin` (on an empty
library) runs the scenarios below on a copy of the repo in `.cache/library/scenarios`, never on the figures themselves: first
sync, a second that does nothing, one figure edited, one kit module edited, a figure deleted (and withdrawn only with the flag),
items changed by hand, a killed run, and a tool version bump. It refuses a library that is not on this machine.

## Limits of phase 1 (what is not done or not verified)

- **No `state` or `progress` capability.** Labs declare `capabilities: []`: a student's place in a figure is not saved, and
  there is no progress report. The figures have `get`/`set`; wiring them to `state.save`/`load` needs the Host API round trip
  checked in a real reader first.
- **Only the reference reader was used** (the host code of `@chalk-format/core` in headless Chromium), not the Chalk
  reader's editor or the phone app. Phone layout is covered by the existing `npm run verify`, not by this.
- **three.js version.** The labs ship with the repo's three.js (0.185.1); Chalk's own examples use 0.183.2. Libraries are
  keyed by bytes, so both can coexist; which one the book should standardise on is a decision.
- **License.** The repo has none. The sync takes one from you and refuses production without it.
- **Withdrawn is final.** Hand-withdrawn items are reported, not resurrected (above).
- **Fonts.** About 190 KiB of every lab is the embedded Bengali font; a shared font as a lab `asset` would shrink them if the
  reader supports fonts from assets.
- **Video** is only built with `--formats video` and was not run in the scenarios.
- Which library to publish to (staging or production) is for the owners to say; nothing here knows or defaults to either.
