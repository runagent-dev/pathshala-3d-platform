# 1. Git is the source of truth

Date: 2026-10-24. Status: accepted.

**Context.** Several people, each with their own AI agent, add figures; reviewers comment in the studio; the owner
sets statuses. Work must not be lost and every change must be reviewable.

**Decision.** Everything people make lives in git: code, manifests, notes, reviews, status. The studio server is a
git client like any contributor: its edits are commits. Outside git: logins, sessions, export outputs, original
uploads, caches.

**Consequences.** History, review and backup come from git and the remote. Files the studio writes are shaped to
avoid merge conflicts: one file per review, status in `status.json` apart from `asset.json`, no edit dates in files.
