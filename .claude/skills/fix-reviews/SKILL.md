---
name: fix-reviews
description: Act on reviewers' feedback for a Pathshala 3D figure (the মতামত tab in the studio, stored in assets/<id>/reviews/). Use when asked to handle, fix or answer reviews or feedback for a figure.
---

# Acting on reviews

1. List the open reviews: every `assets/<id>/reviews/<rid>.json` with `"status": "open"`. Each has the reviewer's
   `text` (often Bangla), the frame size and figure state they saw (`context`), and maybe a picture (`image`, next
   to it): Read the picture.
2. Read `assets/<id>/NOTES.md` too: the owner's notes may decide between conflicting feedback.
3. For each review: reproduce what they saw (open the studio at their frame size, or load the figure with their
   `context.params`), make the change, and keep the figure's rules (simple, phone-first, Bangla in i18n.js).
   If a review asks for something against the rules or unclear, don't change the figure; reply asking.
4. Bump the figure's version (patch for fixes, minor for new features) and run `npm run verify -- <id>`.
5. In each handled review file set `"status": "done"` and add `"reply": "<what changed, in the reviewer's language> (v<new version>)"`.
   Don't delete reviews. Leave unhandled ones open and tell the user why.
6. Commit: `fix(<id>): <summary> (reviews)`.
