# Contributing

Thank you for helping students see what the book describes. The rules and the workflow are in **[AGENTS.md](AGENTS.md)**
(written for people and AI agents alike); the references are in [`docs/`](docs/).

## Set up (once)

```bash
git clone <repository-url> pathshala-3d
cd pathshala-3d
npm run setup                         # dev tools, git hooks, Chromium for the tests
git config --global github.user <your-github-name>   # new figures list you as maintainer
npm run dev                           # the studio: http://127.0.0.1:4800
```

With Claude Code, open the folder and ask for a figure, e.g. "make the figure for page 22, topic 1.6.2" with a
screenshot of the page; the `/new-figure` skill walks through the steps.

## Make a change

1. Branch: `git switch -c fig/<id>/<what>` (or `kit/…`, `studio/…`).
2. Work in the studio; `npm run check -- <id>` often.
3. `npm run verify -- <id>`, look at `test-results/<id>/`.
4. Commit (Conventional Commits: `feat(<id>): …`), push, open a pull request and fill in its checklist.

The hooks check what you commit (`npm run check`) and push (unit tests, types); CI runs only the fast checks. The
browser tests (`npm run verify -- <id>`), the visual comparison (`npm run test:visual`) and packaging run on your
machine before you push; say in the pull request which ones you ran. The figure's maintainers and the platform owners review it.
