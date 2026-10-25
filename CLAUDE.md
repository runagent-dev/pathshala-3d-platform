# Pathshala 3D: notes for Claude Code

@AGENTS.md

## Claude-specific

- Project skills (in `.claude/skills/`): `/new-figure` (a figure for a page and topic), `/fix-reviews` (act on open
  reviews), `/verify-figure` (run verify and look at the pictures), `/import-model` (a GLB/OBJ/STL/FBX as a model
  figure), `/kit-change` (changing `shared/lib/` safely), `/figure-batch` (many figures from page images with builder
  and reviewer agents; see `docs/agents/README.md` and `docs/status.md`).
- After every Edit/Write in a figure, a hook runs the fast checks for that figure and shows you what is wrong. Fix
  it before moving on.
- Look at the pictures `npm run verify` writes to `test-results/<id>/` with the Read tool: phone portrait
  (390x700) and landscape (844x390) first. Software rendering is slow; use `?shadow=0` for quick looks.
- Ask the user for the book page, topic and a screenshot if you don't have them; don't guess page numbers.

## This server

- The studio runs as `npm run dev:public` (all addresses; accounts in `data/users.json`, moved from
  `.studio-auth.json` on first start; log in `/tmp/pathshala-dev.log`). Restart:
  `setsid nohup node scripts/dev.mjs --public > /tmp/pathshala-dev.log 2>&1 < /dev/null &`.
  Requests from 127.0.0.1 skip the login, so headless checks work without credentials. Studio edits (reviews,
  status, notes, uploads) are committed to git automatically in this mode: expect "review(…)"/"chore(…)" commits.
  The target setup is `npm run studio` under systemd (docs/ops/runbook.md).
- Use another port for your own test servers (e.g. `PORT=4810 node scripts/dev.mjs`); the browser tests start one on
  4820. Never stop the owner's server on 4800 by pattern-matching process names.
