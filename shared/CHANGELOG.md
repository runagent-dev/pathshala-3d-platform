# Shared kit changelog

The version in `shared/lib/VERSION` covers everything figures load from `shared/lib/` (stage, bridge, tween, the
student kit). Every zip records it in `PACKAGE.json` as `kit`. Bump it with each change to `shared/lib/`:
patch for fixes, minor for additions, major when a figure has to change to keep working. Run the visual comparison
across all figures before merging a kit change (`npm run test:visual`).

## 1.1.1 (2026-10-24)

Fixes for phones; nothing changes for existing figures (visual comparison: identical):
- `stage.js`: draws again at once when the stage is resized. Before, the canvas stayed blank until the next
  frame: a white flash when a phone turned, or when the panel under the 3D view changed height.
- `student.css`: the student view's buttons get `touch-action: manipulation`, so quick taps (start, stop, next)
  never zoom the page on a phone.
- Tested in `test/browser/phone.spec.mjs`.

## 1.1.0 (2026-10-24)

Added, nothing changed for existing figures (visual comparison: identical):
- `figure.js`: `startFigure` (asset.json → URL parameters → font → app → bridge), `connectFigure` with the standard
  commands (get, set, reset, capture, export-glb, seek, duration), `readParams`, `loadFonts`, `loadManifest`.
- `export-glb.js`: GLB export of any figure in metres, instanced marks baked to vertex-coloured meshes.
- `timeline.js`: animations as a pure function of time (seek, loop, exact video frames).
- `model-viewer.js` (+ `.pvc-model` styles in student.css): the student viewer for static GLB figures.
- `icons.js`: `pause`.
- JSDoc types for `tween.animate` and `createLoupe` options.

## 1.0.0 (2026-10-24)

First versioned release: `stage.js` (renderer, studio lighting, render on demand, capture), `bridge.js` and
`host.js` (postMessage protocol), `tween.js`, and the student kit (`student/`: shell and layout, quiz, coach,
magnifier, materials, sounds, icons, annotations).
