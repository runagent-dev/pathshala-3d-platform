# 4. Any git remote; GitHub features behind an adapter

Date: 2026-10-24. Status: accepted.

**Context.** The remote was not decided when the platform was built (GitHub is likely).

**Decision.** Everything works with any git URL. GitHub-only features (opening pull requests from the studio,
webhook signatures, Actions) sit behind small adapters and are optional. CI steps only call npm scripts.

**Consequences.** Moving to another host means a new CI file and adapter, not new tooling.
