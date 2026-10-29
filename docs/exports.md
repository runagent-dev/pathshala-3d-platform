# Exports: what the book developers get

For each figure the exporter makes, in headless Chromium with a fixed (virtual) clock so the same commit gives the
same files:

| File | What |
|---|---|
| `<id>-v<version>.zip` | The figure folder, runs offline from any static server (see README "Handoff") |
| `poster.png` | 1600×1000 (the 800×500 book column at 2×), in the `export.poster` state |
| `poster-800x500.webp`, `thumb-400x250.webp` | Smaller copies of the poster |
| `phone-780x1400.png` | How it looks on a phone (390×700 at 2×) |
| `render-1600x1000.png` | The 3D alone, transparent background |
| `<id>.glb`, `<id>-<pose>.glb` | glTF 2.0 binary in metres, one per pose in `export.glb`; checked with the Khronos validator, cleaned (dedup, prune, weld) |
| `<id>-1280x720.mp4` + `video-poster.png` | H.264 video from `export.video`, frame by frame |
| `export.json` | Version, book reference, commit, kit/three/Chromium/ffmpeg versions, and the size and SHA-256 of every file |

## Commands

```bash
npm run export -- screw-gauge                    # preview: zip, pictures, GLB → exports/_preview/screw-gauge/
npm run export -- screw-gauge --formats all      # + video (software rendering: roughly 0.1–1 s per frame)
npm run export -- --all --formats zip,glb
npm run export -- screw-gauge --official         # a release (below)
npm run export -- screw-gauge --ref <commit>     # export an older commit, built in a clean git worktree
```

In the studio: the figure's **Handoff** tab → **Exports for the book**: choose formats, **Export preview**, or
**Release**. Exports run on the server one at a time with a progress bar; the files are linked when done.

## Releases

A release is an official export: allowed only when the figure's status is **approved**, its files and `shared/`
have no uncommitted changes, and its version has no release yet. It exports every format into
`exports/<book>/<id>/<version>/`, points `exports/<book>/<id>/latest` at it, adds it to `exports/<book>/index.json`
(the catalog for the book developers), and tags the commit `<id>@v<version>`. To release again, bump the version.

## Making a figure exportable (asset.json "export")

- `poster`: URL parameters and commands for the poster state, e.g. an object clamped in the instrument.
- `glb`: poses (`[{ "name": "default" }, { "name": "open", "setup": [...] }]`) or `{ "skip": "why" }` (e.g. an
  animation spanning 40 orders of magnitude). The figure needs an `export-glb` command (via `exportRoot()` and
  `connectFigure`, or `exportGLB` from `@shared/export-glb.js`); set `units` so the GLB comes out in metres.
- `video`:
  - `timeline` for animations: with `seek` the exporter renders exact frames; without, it plays the animation on
    the virtual clock (`params` such as `loop: "0"` apply).
  - `script` for interactive figures: commands sent at set times (`at`, seconds); each plays out frame by frame
    (e.g. `set` with animation), so motion comes from the figure itself.
  - `turntable` for models: the camera goes once round the model.

Exports are not stored in git (`exports/` is ignored). Exports refuse to start with less than 10 GB free disk
(`PATHSHALA_MIN_FREE_GB` lowers the limit on a small disk).

To get the poster and the GLBs into the Chalk library, and keep them there as figures change, use
`npm run library:sync` ([library-sync.md](library-sync.md)): it runs this exporter for the figures that need it.
