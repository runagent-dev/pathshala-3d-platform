# Architecture

## Parts

```
contributors (Claude Code, own computers) ──git──▶ remote (GitHub) ──CI──▶ checks, browser tests, zips
        │                                              │
        ▼                                              ▼
  npm run dev (local studio)                 studio server (this machine): previews, reviews, status,
                                             uploads, exports; commits its own changes to git
```

- **Figures** (`assets/<id>/`): static files. Each runs in an iframe of the book, alone, offline.
- **Kit** (`shared/lib/`, `shared/vendor/`, `shared/fonts/`): code the figures share through the import map.
- **Studio** (`scripts/dev.mjs`, `dashboard/`): previews figures in book-sized frames with live reload, shows URL
  parameters and bridge events, collects reviews, sets status, packages zips.
- **Tools** (`scripts/`): checker, packager, scaffolder, docs and schema generators, test drivers, exporter.

## Dependency tiers

| Tier | What | Dependencies |
|---|---|---|
| Figure runtime | `assets/`, `shared/` | none: vendored three.js, no CDN, no build step |
| Studio core | server, API, packager, validator | Node built-ins only: `git clone && npm run dev` works without an install |
| Tooling | tests, types, lint, glTF tools, exporter | pinned devDependencies (`npm ci`); the studio loads them only when needed |

## Data

Git is the source of truth for everything people make: code, manifests, notes, reviews (one file each), status
(`status.json`, apart from `asset.json` so the studio and pull requests never edit the same file). Outside git:
studio logins and sessions, export outputs, original upload files, caches (`.cache/`), `dist/`.

## Determinism

- Zips are byte-identical for the same commit (sorted files, fixed dates from the commit time, `SOURCE_DATE_EPOCH`).
- Tests and exports run pages on a virtual clock (`scripts/lib/export/virtual-time.js`): the same commit renders
  the same pixels, so pictures can be compared and videos are frame-exact.
- The visual comparison renders the base commit (a git worktree) and the change on the same machine: no reference
  pictures in git, no differences from fonts or GPUs between machines.

## Checks, from fastest to slowest

| When | What |
|---|---|
| on every edit (Claude hook) | `npm run check` for the edited figure |
| pre-commit | `npm run check --staged`, Biome on staged files |
| pre-push | unit tests, types |
| CI on every pull request | check, lint, types, unit tests, browser tests for changed figures, templates, visual comparison, zips |
| before a figure is approved | `npm run verify -- <id>` + a person looking at it |

## Decisions

See `docs/decisions/`.
