# `asset.json` (manifest, schema version 2)

Every figure has one. The contract is written once in `scripts/lib/manifest/spec.mjs`; `npm run generate` writes it
to `schemas/asset.schema.json`, which editors use for autocompletion through the `"$schema"` line. The studio, the
scaffolder and `npm run check` validate against it. The file has one canonical format (key order, short arrays on
one line): `npm run check -- --fix` rewrites it.

## Fields

| Field | Required | Meaning |
|---|---|---|
| `$schema` | | `"../../schemas/asset.schema.json"` |
| `schemaVersion` | yes | `2` |
| `id` | yes | Stable English slug, same as the folder (`screw-gauge`). Never changes. |
| `title` | yes | Name in the studio, e.g. `"Screw gauge (স্ক্রু-গেইজ)"` |
| `type` | yes | `interactive`, `animation` or `model` |
| `entry` | yes | The page (`index.html`) |
| `version` | yes | Semantic version; bump it when the figure's files change |
| `book` | yes | A book id from `books/books.json` (`physics-9-10`) |
| `page` | release | Printed page number (integer) |
| `topic` | release | Topic number in the book, `"1.6.1"` |
| `placement` | release | Which picture or paragraph it goes with, for the book developer |
| `order` | | Order among figures on the same page |
| `maintainers` | release | GitHub usernames of whoever looks after it (CODEOWNERS is generated from this) |
| `units` | | `mm`, `cm` or `m`: the unit of the 3D scene (GLB exports are scaled to metres) |
| `description` | release | What it does, in a few sentences |
| `tags` | | Free words for search |
| `params` | | URL parameters: `[{ name, label, type: select|boolean|number|text, options, default, placeholder, help }]` |
| `commands` | | Example bridge commands for the studio: `[{ name, payload }]` |
| `events` | | Events the figure emits |
| `export` | release* | How pictures, GLB and video are made (below) |
| `packageExclude` | | Files of the folder left out of the zip |

"release": warnings during work, errors with `--profile release` (used by `npm run verify`). *`export.glb` must be
decided for interactive and animation figures.

Not here on purpose: the status (in `status.json`, set by the studio), subject/chapter/class (from
`books/books.json`), the edit date (from git).

## `export`

```json
"export": {
  "poster": { "params": { "coach": "0" }, "setup": [{ "command": "set", "payload": { "object": "wire" } }] },
  "glb": [{ "name": "default" }, { "name": "open", "setup": [{ "command": "set", "payload": { "gap": 12 } }] }],
  "video": { "kind": "script", "seconds": 20, "fps": 30, "script": [{ "at": 1, "command": "set", "payload": { "value": 5.21 } }] }
}
```
- `poster`: the state the pictures show (URL parameters, then commands).
- `glb`: one GLB per pose (`<id>.glb` for `default`, `<id>-<name>.glb` for the others), or `{ "skip": "why not" }`.
- `video.kind`: `timeline` (an animation plays; needs `seek`/`duration`), `script` (commands at set times; numbers
  between steps are not interpolated: one step, one state), `turntable` (the camera goes round a model).

See `docs/exports.md` for what the exporter makes from these.

## Checks

Errors: unknown fields, wrong types or formats, id ≠ folder, unknown book, missing entry file, duplicate params,
a select default that is not an option, a script video without a script or out of order. Warnings (errors in the
release profile): no page, topic, placement, maintainers, description, or GLB decision.
