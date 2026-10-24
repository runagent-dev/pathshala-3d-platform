---
name: verify-figure
description: Check that a Pathshala 3D figure is done - run npm run verify, read the result and look at the pictures it writes. Use before saying a figure is finished, before a pull request, or when asked whether a figure works on phones.
---

# Verifying a figure

1. `npm run verify -- <id>`. It runs: release-profile check, README sections, version bump, browser tests
   (contract, six viewports, the figure's own tests), the packaged zip offline, the GLB, and pictures.
2. For every ✗, read the message, fix the cause (not the test), and run it again. Browser failures: open
   `npx playwright show-report`, or rerun with `FIGURES=<id> npm run test:figures`.
3. When everything is ✓, Read the pictures in `test-results/<id>/`: 390x700, 390x520, 844x390, 640x400, 800x500,
   1280x800 and poster.png. Look for: text cut off or overlapping, controls hidden behind the 3D, the object too
   small to read, English or Latin digits in the Bangla UI, a dark or busy look. Software rendering hides shadows
   and soft details; that's expected.
4. Report to the user what passed, what you fixed, and anything only a person can judge (the wording against the
   book, whether a student would understand it).
