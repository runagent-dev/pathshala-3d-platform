# CI: what runs, and what it skips

The checks in `.github/workflows/ci.yml` are slow because every figure is opened in headless Chromium with software 3D
(about 1 frame per second). They are written to do as little as is safe.

| Job | Runs for | Skips |
|---|---|---|
| Check, lint, types, unit tests | every push to `main`, every pull request | nothing (about a minute) |
| Handoff zips | the same | nothing (under half a minute) |
| Figures in the browser | pushes to `main`, pull requests | **release pull requests (`main` into `prod`)**; figures that already passed with the same inputs |
| Visual comparison | pull requests | **release pull requests (`main` into `prod`)**; figures whose inputs are the same as in the base |

**Why a release pull request (`main` into `prod`) skips the two slow jobs.** It only carries commits that already went
through them on `main`. Only a pull request from this repository's `main` counts: any other branch (or a fork's `main`) going
into `prod` runs both jobs.

## "The same inputs": hashes instead of file paths

`scripts/lib/ci/figure-hashes.mjs` computes two hashes per figure.

- **testHash** (browser tests): the figure's files, the kit modules it imports (found by reading its imports, the same walk the
  packager and the library sync use), its `asset.json`, its own `tests/`, the test harness (`test/figures`, `test/harness.html`,
  the Playwright config, the studio server, the exporter driver, fonts, `books/`, `schemas/`, `package.json`, `package-lock.json`),
  and the machine: the resolved Node version and, on GitHub, the runner image.
- **renderHash** (visual comparison): the same without the tests, plus the renderer (`scripts/visual.mjs`, the exporter driver,
  the static server, fonts). Both sides of a comparison are drawn by the pull request's renderer, so a base picture is kept under
  the base's files and the pull request's renderer.

A change to one kit module changes the hash of exactly the figures that import it. A change to the library sync, the CI scripts,
the docs or a figure's notes changes none (`scripts/lib/ci/figure-tests.mjs` lists what counts as "touches no figure").
Over-including costs a test run; leaving something out could skip a test that mattered, so the lists err on the side of including.

**Browser tests.** After the tests, `node scripts/ci-figures.mjs --record` writes an empty marker file named by the hash for each figure
whose tests all passed, in `.cache/figure-tests`, which the workflow saves in the Actions cache (even when another figure failed). The
next run restores the newest folder, and tests only the figures the change touches **and** that have no marker. With no folder (the
first run, or a cache evicted after seven days unused) it tests every figure the change touches, as before. A failing figure never gets a
marker, so it is tested again until it passes.

**Visual comparison.** `npm run test:visual -- --changed` draws only the figures whose renderHash differs between the base and
the pull request, and keeps every picture in `.cache/visual-shots` under its hash and size, so a picture is drawn once. CI saves that
folder in the Actions cache; the key includes the runner image version and `package-lock.json` (a new Chromium or font setup starts from
scratch, so a cached picture is never compared with a freshly drawn one from a different setup). A difference in a figure whose own files
did not change still fails the run, as before.

## Chromium

`.github/actions/playwright` downloads Chromium once per Playwright version (Actions cache) and installs only the system libraries
on later runs. The library publish workflow (`library-publish.yml`) goes further: it plans first and installs Chromium only when the plan
builds a lab, poster, model or video; when nothing is new, changed or missing it skips the publish and the check.

## Doing the same on your computer

`node scripts/ci-figures.mjs origin/main --markers .cache/figure-tests` prints the figures the tests would run for;
`FIGURES=a,b npm run test:figures` runs them. `npm run test:visual -- --changed` does the visual comparison the way CI does.
