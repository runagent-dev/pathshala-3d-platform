#!/bin/bash
# Merge figure pull requests one after another, in the order given (book order: page, then topic). Every figure PR
# adds a line to the generated .github/CODEOWNERS, so each PR after the first is rebased on the new main and
# CODEOWNERS regenerated before it is squash-merged. Stops at the first problem. Merge only with the owner's OK.
#
#   docs/agents/merge-prs.sh <pr>:<worktree> [<pr>:<worktree> …]
#
# <worktree> is the builder's worktree (absolute, or a name under /root/pathshala-3d/.claude/worktrees/), checked out
# on the PR's branch with nothing uncommitted. Run it from anywhere; it never touches the studio's checkout.
set -u
R=/root/pathshala-3d/.claude/worktrees
[ $# -gt 0 ] || { sed -n 2,9p "$0"; exit 2; }
for item in "$@"; do
  n=${item%%:*}; W=${item#*:}; [ "${W#/}" = "$W" ] && W=$R/$W
  echo "=== PR #$n ($W)"
  state=$(gh pr view "$n" --json state -q .state)
  if [ "$state" = MERGED ]; then echo "already merged"; continue; fi
  (
    set -e
    cd "$W"
    branch=$(git branch --show-current)
    [ "$branch" = "$(gh pr view "$n" --json headRefName -q .headRefName)" ] || { echo "worktree is on $branch, not the PR's branch"; exit 1; }
    dirty=$(git status --porcelain | grep -v ' node_modules$' || true)
    [ -z "$dirty" ] || { echo "worktree not clean: $dirty"; exit 1; }
    git fetch -q origin
    if ! git rebase -q origin/main; then
      conflicts=$(git diff --name-only --diff-filter=U)
      if [ "$conflicts" != ".github/CODEOWNERS" ]; then echo "unexpected conflicts: $conflicts"; git rebase --abort; exit 1; fi
      npm run -s generate >/dev/null
      git add .github/CODEOWNERS
      GIT_EDITOR=true git rebase --continue >/dev/null
    fi
    npm run -s generate >/dev/null
    if ! git diff --quiet; then git add .github/CODEOWNERS && git commit -q --amend --no-edit; fi
    git log --oneline -3
    git push -q --force-with-lease origin "HEAD:$branch"
  ) || { echo "STOPPED at PR #$n"; exit 1; }
  head=$(git -C "$W" rev-parse HEAD)
  title=$(gh pr view "$n" --json title -q .title)
  for try in 1 2 3 4 5 6 7 8 9 10; do
    if gh pr merge "$n" --squash --match-head-commit "$head" --subject "$title (#$n)" \
      --body "$(printf 'A figure for Physics 9–10, built, independently reviewed and fixed; touch-tested in a phone browser.')" 2>&1; then break; fi
    sleep 15
  done
  [ "$(gh pr view "$n" --json state -q .state)" = MERGED ] || { echo "STOPPED: PR #$n did not merge"; exit 1; }
  echo "merged #$n → $(git -C "$W" fetch -q origin && git -C "$W" log --oneline -1 origin/main)"
done
echo "ALL MERGED"
