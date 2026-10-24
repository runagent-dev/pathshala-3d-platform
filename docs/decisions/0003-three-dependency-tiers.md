# 3. Three dependency tiers

Date: 2026-10-24. Status: accepted.

**Context.** The book must work offline for years; contributors should be able to run the studio right after
cloning; quality tools need npm packages.

**Decision.** Figure runtime: no dependencies (vendored three.js copied from the pinned npm package by
`npm run vendor:three`). Studio core: Node built-ins only. Tooling (tests, types, lint, glTF tools, exporter):
exact-pinned devDependencies with a lockfile, loaded only when needed.

**Consequences.** `npm run dev` works without an install; zips contain only static files; upgrading three.js is a
deliberate step (bump, re-vendor, visual comparison).
