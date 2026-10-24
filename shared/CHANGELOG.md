# Shared kit changelog

The version in `shared/lib/VERSION` covers everything figures load from `shared/lib/` (stage, bridge, tween, the
student kit). Every zip records it in `PACKAGE.json` as `kit`. Bump it with each change to `shared/lib/`:
patch for fixes, minor for additions, major when a figure has to change to keep working. Run the visual comparison
across all figures before merging a kit change (`npm run test:visual`).

## 1.0.0 (2026-10-24)

First versioned release: `stage.js` (renderer, studio lighting, render on demand, capture), `bridge.js` and
`host.js` (postMessage protocol), `tween.js`, and the student kit (`student/`: shell and layout, quiz, coach,
magnifier, materials, sounds, icons, annotations).
