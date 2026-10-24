# 6. Exports are built from commits

Date: 2026-10-24. Status: accepted.

**Context.** Book developers receive zips, GLB files, pictures and videos; they must be able to tell exactly what
they got and get the same again.

**Decision.** An export is a function of (commit, figure id). Official exports are built from a clean worktree at a
tag `<id>@v<version>`, and record the commit, tool versions and file hashes in `export.json`. Export outputs are
not stored in git.

**Consequences.** Any export can be rebuilt; the version in a file name always means the same bytes.
