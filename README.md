# Pathshala 3D

3D and interactive figures for the Pathshala interactive books. Each figure lives in its own folder under
`assets/` and is packaged as a self-contained zip that another developer drops into the book.

## Run the studio (dashboard)

```bash
npm run dev
```

Opens on `http://127.0.0.1:4800` (plus this machine's Tailscale address, if it has one). No `npm install` needed:
there are no dependencies. From another computer, tunnel the port:

```bash
ssh -L 4800:127.0.0.1:4800 root@<server>
```

Or open it on the server's own address, behind a username and password:

```bash
npm run dev:public
```

This listens on every address of the machine (port 4800 must be open in the firewall). The login is created on first run,
printed at startup and kept in `.studio-auth.json` (git-ignored, never served). Set `STUDIO_USER` / `STUDIO_PASS` to choose
your own, or delete the file to get a new password. Requests from the server itself skip the login. It is plain HTTP, so
don't reuse an important password.

On a phone the preview fills the screen; ☰ opens the asset list and the panel button opens Info / Params / Notes /
Events / Handoff. To see just one figure the way a student will, open `/assets/<id>/` directly.

The studio lists every asset, previews it in book-sized frames, reloads it whenever a file changes, lets you try its URL
options, shows the messages it sends to the book, keeps review notes in `NOTES.md`, captures thumbnails, exports a
static GLB, and builds the handoff zip.

## Reviews

Invite people to review the figures: give them the studio address and the **reviewer login** (printed when
`npm run dev:public` starts, stored in `.studio-auth.json` under `reviewer`). Reviewers see the studio in Bangla: the
figure list, frame sizes (ফোন খাড়া, বইয়ের কলাম …) and the **মতামত** tab, opened by the **মতামত দিন** button. They write
their feedback there. Each review keeps their
name, the text, the frame size and the figure's state at that moment, and optionally a picture of the 3D view. They
can't change status, notes or anything else; the server refuses it.

With your own login, the Reviews tab lets you mark a review done, reply (reviewers see the reply) or delete it. The
list shows "N open" next to figures with open reviews, and the "Open reviews" filter lists just those.

Reviews live in `assets/<id>/reviews/` (`reviews.json` plus pictures) and are never put in the handoff zip.

## Layout

```
assets/<id>/          one folder per figure (what gets handed off)
  asset.json          manifest: title, type, status, book page/topic, URL params, commands, events (the studio reads this)
  index.html          entry page (iframe target)            ← interactive and animation assets
  model.glb           the model                             ← static "model" assets
  README.md           integration notes for the book developer
  NOTES.md            your notes (dev only, not packaged)
  reviews/            reviewers' feedback + pictures (dev only, not packaged)
  thumbnail.png       captured from the studio
shared/
  vendor/three/       three.js r185 + the addons we use
  lib/                stage (renderer, studio lighting, render-on-demand), bridge/host (postMessage), tween
  lib/student/        the student view every figure shares: layout + শেখো/পরীক্ষা panel (shell.js, student.css),
                      multiple-choice test (quiz.js), first-use pointers (coach.js), magnifier, materials, sounds, icons
  fonts/              Noto Sans Bengali (Bangla, OFL), self-hosted for offline use
  viewer/             generic GLB viewer used by the studio for "model" assets
dashboard/            the studio UI
scripts/              dev server, packager, scaffolder (Node, no dependencies)
templates/            starting points for new assets
dist/                 packaged output (git-ignored)
```

## Common tasks

```bash
npm run new -- convex-lens "Convex lens" --subject Physics --chapter "Light" --page 112 --topic 6.3
npm run new -- human-heart "Human heart" --model
npm run new -- water-cycle "Water cycle" --animation      # plays by itself, like si-prefixes
npm run package -- vernier-caliper
npm run package:all
```

`npm run package -- <id>` writes `dist/<id>/` and `dist/<id>-v<version>.zip`. Inside, `../../shared/` paths are
rewritten to `./shared/` and the shared code is copied in, so the folder runs on its own from any static server.

## Conventions

- Every asset records where it goes in the book: `page`, `topic` and a `placement` note in `asset.json` (editable in
  the studio's Info tab). The studio lists assets in book order, and the handoff zip carries them in `PACKAGE.json`
  and at the top of the README, so the book developer can find the spot.
- Asset ids: lowercase, dashes (`vernier-caliper`). Units in 3D scenes: millimetres for instruments, otherwise note it in the README.
- Assets import `three`, `three/addons/…` and `@shared/…` through the import map in `index.html`. Never use CDN URLs: the book must work offline.
- Every interactive asset uses `shared/lib/bridge.js`: answers `ping`, emits `ready`, supports `capture`, and lists its params, commands and events in `asset.json`.
- Keep figures simple for students (3D + the key idea + a short tap-to-answer test) and make them work on phones, portrait and landscape.
- Default look for the books: white page, Bangla text (Noto Sans Bengali; not Hind Siliguri, its digits read badly), plain textbook styling.
- Status flow: `idea` → `in-progress` → `review` → `changes` → `approved`.
