---
name: import-model
description: Turn a 3D file (GLB, glTF, OBJ, STL or FBX) into a Pathshala 3D model figure for a book page and topic. Use when someone has a 3D model file to add to the book.
---

# Importing a 3D model

Two ways, same result (a `model` figure with `model.glb` in metres, viewed with the student viewer):

- **In the studio** (no tools needed): New 3D model → choose the file(s) (for glTF or OBJ also the .bin/.mtl and
  textures, or one zip) → set units and up axis, book page, topic, title and the source/licence → check the preview
  and the numbers (size in metres, triangles) → Save. The studio converts, checks and commits it.
- **From the command line:** `npm run import -- <file> --slug <id> --title "<English> (<বাংলা>)" --page <n> --topic <t>
  [--units mm|cm|m] [--up y|z] --license "<licence>" --credit "<author/source>"`.

Then:
1. `npm run verify -- <id>`; Read `test-results/<id>/` pictures (is it the right way up? the right size?).
2. Fill in `placement` and `description` in `asset.json` and the brief in `NOTES.md`.
3. Always record where the model came from and its licence (`source` in `assets/<id>/source.json`); don't import
   models whose licence doesn't allow use in a free textbook.
4. Over 10 MB or 300k triangles is too heavy for phones: simplify it first (e.g. Blender's Decimate) and import again.
