# Pathshala 3D

3D and interactive figures for the Pathshala interactive books (Bangla, NCTB), starting with Physics 9–10. Each
figure lives in its own folder under `assets/` and is handed to the book developers as a self-contained zip, a GLB
model, pictures and a video.

- **Contributing** (people and AI agents): [AGENTS.md](AGENTS.md) has the workflow and the rules,
  [CONTRIBUTING.md](CONTRIBUTING.md) the setup. References: [docs/](docs/) (figure guide, the shared kit, the
  manifest, the bridge protocol, architecture, decisions).
- **Figures so far:** `npm run find`.

## Quick start

```bash
npm run setup     # once: dev tools, git hooks, Chromium for the tests
npm run dev       # the studio on http://127.0.0.1:4800 (works even without npm run setup)
```

The studio lists every figure in book order, previews it in book-sized frames (phones, the book column, iPad),
reloads it whenever a file changes, lets you try its URL options, shows the messages it sends to the book, keeps
notes and reviews, captures thumbnails, exports a static GLB and builds the handoff zip.

## The studio on a server

The proper setup is `npm run studio` as a service behind HTTPS: see [docs/ops/runbook.md](docs/ops/runbook.md).
For a quick look, tunnel the port (`ssh -L 4800:127.0.0.1:4800 root@<server>`), or open it on every address:

```bash
npm run dev:public
```

Everyone logs in with their own account (`npm run user -- add <name> --role reviewer|contributor|admin` prints an
invite link; accounts live in `data/users.json`, git-ignored, never served). The first start creates an admin and
prints its password once (logins from an old `.studio-auth.json` are moved over). Requests from the server itself
skip the login. Plain HTTP: use the production setup for real passwords. Changes made in the studio (reviews,
status, notes, uploads) are committed to git as the person who made them.

The preview runs each figure in a sandboxed frame (no cookies, no access to the studio's API), so figure files are
served to anyone (only the deliverable files: notes, reviews and status need a login).

On a phone the preview fills the screen; ☰ opens the figure list and the panel button opens Info / Params / Notes /
Events / Handoff. To see one figure the way a student will, open `/assets/<id>/` directly.

## Reviews

Invite people to review the figures: give them the studio address and the **reviewer login** (printed when
`npm run dev:public` starts, stored in `.studio-auth.json` under `reviewer`). Reviewers see the studio in Bangla: the
figure list, frame sizes (ফোন খাড়া, বইয়ের কলাম …) and the **মতামত** tab, opened by the **মতামত দিন** button.
Each review keeps their name, the text, the frame size and the figure's state at that moment, and optionally a
picture of the 3D view. They can't change status, notes or anything else; the server refuses it.

With your own login, the Reviews tab lets you mark a review done, reply (reviewers see the reply) or delete it. The
list shows "N open" next to figures with open reviews, and the "Open reviews" filter lists just those.

Reviews live in `assets/<id>/reviews/`, one `<rid>.json` per review plus its picture (so reviews never conflict in
git), and are never put in the handoff zip.

## Handoff

```bash
npm run package -- vernier-caliper     # dist/vernier-caliper/ and dist/vernier-caliper-v0.3.2.zip
npm run package:all
```

Inside, `../../shared/` paths become `./shared/` and exactly the shared files the figure uses are copied in (with
three.js's licence and the font's), so the folder runs on its own from any static server, offline. The same commit
always gives the same zip, byte for byte. `PACKAGE.json` says where the figure goes in the book, its version, the
kit and three.js versions and the commit. The book side talks to a figure through `shared/lib/host.js`
(see [docs/bridge-protocol.md](docs/bridge-protocol.md)).

## Layout

```
assets/<id>/        one figure (see AGENTS.md)           books/       books.json: the books figures belong to
shared/lib/         the kit figures share                templates/   interactive, animation, model
shared/vendor/      three.js r185 (npm run vendor:three) dashboard/   the studio UI
scripts/            studio server, checker, packager, verify, exporter and other tools
test/               unit tests, browser tests, harness   docs/        references and decisions
schemas/            JSON Schema for asset.json (generated)
dist/ .cache/ test-results/ playwright-report/          outputs and caches (git-ignored)
```
