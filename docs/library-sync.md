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

Decision records: [0007](decisions/0007-library-sync.md), [0008](decisions/0008-shared-library-catalog.md) (the three.js
libraries are chalk-format's bytes). Chalk side: the lab spec (`spec/1.1` §3, `spec/1.5`) and the
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
| **Libraries** | `text/javascript`, one per module | three.js and the add-ons the labs import; chalk-format's catalog bytes, shared by every lab in every book, published once (see "The shared libraries") |

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
  the code of the lab adapter, the bundler and the exporter;
- for a lab, the **pinned library catalog** (a hash of its specifiers, versions and keys) or `own` with `--libraries own`.
  The keys of the libraries a lab imports are part of that hash, so a lab is rebuilt when any shared library changes. A
  catalog change that touches a library the labs do not use also rebuilds them (the hash is of the whole catalog, not of
  the libraries each lab uses); it is rare and cheap.

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

three.js and its add-ons are **not** in the file. They are the lab's `libraries` (spec 1.5 §2): built once each, as the
catalog's bytes (next section), so thirty labs share one 700 KB copy of three.js, and so does every other lab in the book.
The lab is run in the sandbox against exactly those bytes (`verify-lab.mjs` gets the library bytes the manifest will name).

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

## The shared libraries (three.js, one copy per book)

chalk-format builds three.js and a few add-ons once (`tools/lab-libraries.ts`, `libraries/catalog.json`): the same bytes
are the same `c1:` key, so a book that holds labs from several makers carries **one** copy of three.js. This repo pins
that catalog and builds its libraries to match it, byte for byte (decision 0008):

- `scripts/lib/library/lab-library-catalog.json` is the pinned copy (specifier, version, key, size, plus `source`: the
  chalk-format commit it was taken from and the esbuild it was built with). Refresh it with
  `npm run library:catalog -- --from <chalk-format>/libraries/catalog.json` (a file, a checkout, or a raw GitHub URL;
  `--dry-run` only shows the difference). It validates the file, shows what changed (a changed key is a different copy in
  every book), writes it, and says what else has to move (three, esbuild-catalog).
- `scripts/lib/library/build-libraries.mjs` builds with chalk-format's exact recipe (esbuild `bundle`, `minify`, format
  `esm`, target `es2020`, `legalComments: inline`, add-ons `external: ['three']`) from `node_modules/three`
  (`build/three.module.js`, `examples/jsm/...`), **not** from `shared/vendor/three`, and compares each key with the
  catalog. A different key is never published: the run stops with the cause (this repo's three or esbuild is not the
  version the catalog was built with) and the fix.
- esbuild has two entries in `package.json`: `esbuild` (bundles the labs) and `esbuild-catalog`
  (`npm:esbuild@0.25.12`, chalk-format's version) for the libraries. The key depends on the esbuild that made the bytes;
  keep them apart so the labs can move to a newer esbuild without moving the catalog.
- Tags: `catalog:shared` and `catalog-ref:chalk-format-<commit12>` for a library the catalog lists; `catalog:extra` for an
  add-on it does not list yet (built the same way, a candidate for the catalog: a lab that uses it still works, its key is
  just not shared); `catalog:own` with `--libraries own`.
- **Three.js version gate.** `npm run library:sync` (dry run or not, so `--check` too) and `npm run check` fail when this
  repo's three.js (`package.json`, `shared/vendor/three/VERSION`, the installed package) is not the catalog's version, with a
  one-line fix: `npm install --save-exact three@<v> && npm run vendor:three`, or refresh the catalog.
- `--libraries own` is the old behaviour (built from `shared/vendor/three` with this repo's esbuild): the labs run, the
  libraries are not shared with anyone. An older own copy stays in the library, marked `state:superseded` once the catalog
  copy is published, because books may use it.

The manifest's `libraries[]` carries the catalog's `specifier`, `version` and key, so a book holding this repo's labs and
a chalk-format lab names the same asset (`test/unit/library-sharing.test.mjs` packs both into one `.chalk` and checks that
three.js is stored once).

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
  (a changed figure with the same version is blocked, so a published version always means the same bytes). A figure that fails a gate is `blocked` with the reason, not skipped silently.
- **License.** `--license <SPDX>` or `"license"` in `library-sync.config.json`; written on every item and the manifest.
  It is **optional** in both tiers (this is our own work): without one the items carry no `license` field. One that is given must be an SPDX expression.
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
`--formats lab,poster,glb,video`, `--tier`, `--license`, `--libraries catalog|own`, `--no-verify`, `--check` (exit 1 when the library is behind, for CI),
`--cache-dir`, `--report`, `--json`, `--notify` / `--no-notify` (see "Telling the Books server").

`library-sync.config.json` (optional, at the repo root; read only): `{ "license": "CC-BY-4.0", "formats": ["lab", "poster",
"glb"], "size": { "width": 800, "height": 500, "minWidth": 390, "minHeight": 390 } }`.

Exports need headless Chromium and, like `npm run export`, 10 GB free disk; `PATHSHALA_MIN_FREE_GB` lowers that limit
(a small disk, or CI).

## Telling the Books server

The books in the Books dashboard (chalkbook-internal) hold labs and 3D models by exact version. Their update job brings every book up to
the library's current versions (same-major updates apply by themselves; a major or breaking one waits for a person). So that this happens
**at once** and not on some timer, a production sync ends by telling the Books server, **naming the figures it changed**: the server then looks only
at the labs and models of those figures.

| Setting (environment only, never a flag) | |
|---|---|
| `LIBRARY_SYNC_HOOK_URL` | the endpoint, for example `https://<books host>/api/library-sync/hook`. `https`, except `http://127.0.0.1` and `http://localhost` (for tests) |
| `LIBRARY_SYNC_HOOK_TOKEN` | the shared secret, sent as `Authorization: Bearer`. It is never printed or written anywhere, not even if the server echoes it |

**When it fires:** after `--apply --tier production` (not a dry run, not `--check`, not staging), when at least one figure was
published or withdrawn, or a shared library was repaired. Nothing changed: nothing is sent. `--notify` sends it anyway (still only
for a production `--apply`; it explains itself when it does not), `--no-notify` never sends.

**What is sent:** `POST` with `{"tier":"production","syncedAt":"<time>","published":<n>,"withdrawn":<n>,"figures":["screw-gauge","vernier-caliper"]}`:
numbers and figure ids only. `figures` are the ids (the slug the library tags its items with, `figure:<id>`) of every figure this sync
**published or withdrew**, unique and sorted; unchanged, blocked and failed figures are not in it. The server runs the update **before it
answers** (up to 10 minutes; the sync then gives up waiting and says the update may still be running) and replies
`{"ok":true,"applied":n,"review":n,"failed":n,"books":n}`, printed as `Books updated: 3 applied, 1 need review, 0 failed (figures: screw-gauge, vernier-caliper)`
(at most five names, then `+N more`). Items that need review are listed in the dashboard under Books, Updates.

| `figures` | When | What the server does |
|---|---|---|
| a list | the normal case | updates only the labs and models of those figures |
| `[]` | the sync only repaired a shared library; no figure changed | nothing to update in books; answers ok |
| left out | more than 200 figures changed (a first full publish), or `--notify` (always a full run), or the report cannot say | updates everything; the line says `(all figures)` |

A figure id that is not a plausible id (`^[a-z0-9][a-z0-9._-]{0,120}$`) is left out of the list, with one line saying which. A server
that answers `"scope":"all"` (one that does not read `figures` yet) is believed: the line then says `(all figures)`, and nothing is lost,
because the update is complete whichever way it runs. The server must read `figures` for the narrowing to happen.

**When it goes wrong, the sync does not.** The library is already updated at that point, so a failed notification never changes
the exit code and never undoes anything. It prints what happened and ends with `Books were NOT notified; run: npm run library:sync
-- --notify`:

| Answer | Meaning | What the sync does |
|---|---|---|
| nothing set | not configured | one line, `Books notification: not configured (LIBRARY_SYNC_HOOK_URL)` |
| only one setting | half configured | a clear line, nothing sent |
| 409 | an update was already running on the server | says so; repeat later with `--notify` |
| 401 / 403 | wrong token | prints the status and the server's message (200 characters at most) |
| 503 | the Books server is not set up for this call, or is starting | retried twice (2 s, 6 s), then reported |
| 502 / 504, network error | server or network trouble | retried twice, then reported |
| a redirect | refused: it could carry the token to another host | reported; use the final address |

`--notify` is a **full run**: it sends no `figures`, so it also repairs a notification that was missed. To re-send without publishing anything: `npm run library:sync -- --library <url> --tier production --apply --notify` (nothing is
republished when nothing changed). The last outcome is kept in `<cache-dir>/last-notification.json` (time, status, counts, `scope` and the number of figures; no secrets).

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
items changed by hand, a killed run, a tool version bump, and that the library holds chalk-format's three.js bytes once and a
changed figure does not republish the libraries. It refuses a library that is not on this machine.

## Limits of phase 1 (what is not done or not verified)

- **No `state` or `progress` capability.** Labs declare `capabilities: []`: a student's place in a figure is not saved, and
  there is no progress report. The figures have `get`/`set`; wiring them to `state.save`/`load` needs the Host API round trip
  checked in a real reader first.
- **Only the reference reader was used** (the host code of `@chalk-format/core` in headless Chromium), not the Chalk
  reader's editor or the phone app. Phone layout is covered by the existing `npm run verify`, not by this.
- **three.js version.** The labs use the catalog's three.js (0.185.1, chalk-format's, see "The shared libraries"), so a book
  with labs from both worlds carries one copy. Moving to another three.js is a catalog refresh, together in chalk-format and here.
  The figures themselves run the vendored copy in `shared/vendor/three` (same version, enforced); the lab runs the catalog's
  build of that version, a bundled and minified build of the same source, not the vendored file.
- **License.** The repo has none, and none is required: set one (`--license`, or in the config) when the owners decide; until then items carry no license.
- **Withdrawn is final.** Hand-withdrawn items are reported, not resurrected (above).
- **Fonts.** About 190 KiB of every lab is the embedded Bengali font; a shared font as a lab `asset` would shrink them if the
  reader supports fonts from assets.
- **Video** is only built with `--formats video` and was not run in the scenarios.
- **Telling the Books server** is tested here against a stand-in HTTP server. The `figures` list needs the Books server to read it (chalkbook-internal); until it does, every notification is a full update, which is correct, only not narrowed.
- Which library to publish to (staging or production) is for the owners to say; nothing here knows or defaults to either.
