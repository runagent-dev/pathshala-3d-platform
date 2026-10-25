# Round 2: act on the review, then open the pull request

An independent reviewer has checked your figure; their report (and the orchestrator's decisions, which settle any
open choices) is in the message you received. Work in the same worktree, on the same branch, with the same ports,
following `docs/agents/builder-brief.md` as before.

1. **Fix every "Must fix" and every "Should fix".** If you disagree with one, you may skip it only with a clear,
   physics- or student-based reason, which you state in your report. Take the "Nice to have" items that make the
   figure better without making it busier (use judgement; the owner wants the absolute best, and simple).
   The reviewer's pictures are in the folder named in the report; look at them.
2. Bump nothing yet: the figure is new (version 0.1.0) until it is merged.
3. Prove it again, all of it: `PATHSHALA_TEST_PORT=<port> PATHSHALA_TEST_WORKERS=1 npm run verify -- <id>` green;
   read the six pictures and the poster; re-take the pictures of the states the reviewer flagged and check each
   finding is really fixed; the touch test passes at both sizes; your measure script; `npm run test:unit`;
   `npx biome check --write assets/<id> test/unit/<id>.test.mjs`.
4. Commit the fixes as a new commit on `fig/<id>/first-version`, e.g. `fix(<id>): act on the review (…)`, plain
   sentences in the body, ending with the `Co-Authored-By:` line.
5. Bring the branch up to date and push it:
   ```bash
   git fetch origin && git rebase origin/main
   # if .github/CODEOWNERS conflicts: npm run generate && git add .github/CODEOWNERS && GIT_EDITOR=true git rebase --continue
   git push -u origin fig/<id>/first-version
   ```
   (the pre-push hook runs the unit tests and types; never skip it).
6. Open the pull request with `gh pr create --base main --head fig/<id>/first-version --title "<the feat commit's
   subject>" --body-file <file>`. The body, in this shape:
   ```
   ## What and where

   New figure `<id>`: physics-9-10 › <topic> › p<page> (<section title in Bangla>), <placement>.

   - <3–6 bullets: what the student sees and does, the one idea, the test>
   - <anything stylised on purpose, and open questions for the book team>

   ## Definition of done

   - [x] `npm run verify -- <id>` passes (check, browser tests, offline zip, GLB, pictures)
   - [x] I looked at the pictures in `test-results/<id>/` (phone portrait and landscape included), plus <states>
   - [ ] The Bangla wording matches the book (NCTB terms), digits are Bangla: needs a person to check
   - [x] It is simple for a student: the object, the one idea, a short tap-to-answer test
   - [x] Version in `asset.json` (0.1.0, new figure)
   - [x] Open reviews handled (none yet)
   - [ ] For a kit change: not a kit change

   Touch-tested in a phone browser (390×700 and 844×390, pixel ratio 3). Reviewed by an independent reviewer; all
   must-fix and should-fix findings addressed.

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```
   Do not merge it; do not enable auto-merge.
7. Clean up: stop your dev server (by its PID file; if the PID file holds the `setsid` wrapper, stop the node child
   after checking its cwd is your worktree), delete your `scripts/.*-tmp.mjs` helpers (never committed).
8. Report: the PR URL, the new commit, one line per review finding (fixed how / skipped why), the verify and
   touch-test results, and the absolute paths of 3–5 pictures of the final figure (390×700, 844×390, the test).

If the orchestrator later sends one more small fix: make it, re-run verify, commit it as a new commit (no amend, no
force), push to the same branch, and report in two lines.
