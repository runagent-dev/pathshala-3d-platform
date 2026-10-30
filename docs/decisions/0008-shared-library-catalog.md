# 8. The three.js libraries are chalk-format's bytes (a pinned catalog)

Date: 2026-10-28. Status: accepted. Amends [0007](0007-library-sync.md) (which built the libraries from `shared/vendor/three`).

**Context.** A lab imports three.js by name; the reader supplies it from an asset the lab's manifest names (spec 1.5 §2).
Assets are content-addressed, so two copies of three.js that differ by one byte are two assets, and a book that holds labs
from two makers carries both (about 700 KB each). chalk-format builds the shared libraries once
(`tools/lab-libraries.ts`, `libraries/catalog.json`) so that every lab can name the same key. Until now this repo built its
own copy from the vendored files with a different esbuild target, so the keys never matched.

**Decision.** The sync publishes chalk-format's bytes.

- *The catalog is pinned here*, in `scripts/lib/library/lab-library-catalog.json`, with the chalk-format commit it came from.
  `npm run library:catalog -- --from <path|url>` refreshes it, validates it and shows the difference.
- *The libraries are built with chalk-format's recipe* (same options, same entry files of the npm `three` package, an
  esbuild of the same version, installed as `esbuild-catalog` next to the esbuild that bundles labs) *and verified against the
  catalog*. A key that differs fails the run with the cause and the fix; the sync never publishes a different copy of a
  library the catalog names. Add-ons the catalog does not list are built the same way and tagged `catalog:extra`.
- *This repo's three.js must be the catalog's version*: `npm run library:sync` (any mode) and `npm run check` fail otherwise,
  with a one-line fix. The vendored copy the figures run, `package.json` and the installed package are all checked.
- *Lab fingerprints include the catalog's hash*, so a catalog change rebuilds the labs; the manifest carries the catalog's
  versions and keys; labs are run in the sandbox against the catalog's bytes.
- `--libraries own` keeps the previous behaviour for someone who has to leave the shared set; it is tagged `catalog:own`.

**Consequences.** One copy of three.js per book however many makers' labs it holds. Moving three.js is one decision taken in
two repositories (refresh the catalog, `npm install` the version, `npm run vendor:three`); the gate makes forgetting half of
it impossible. A different esbuild or three silently producing different bytes becomes a loud stop instead of a quiet second
copy. The catalog's bytes are a build of three's source, not the vendored file, so the figures (which run the vendored copy)
and the labs (which run the build) are the same version but not the same file; the sandbox run is the check that they behave
alike. Add-ons used here and not in the catalog (today `RoomEnvironment`, `RoundedBoxGeometry`, `BufferGeometryUtils`) are
shared with nobody until chalk-format lists them; adding them there and refreshing the catalog fixes that.
