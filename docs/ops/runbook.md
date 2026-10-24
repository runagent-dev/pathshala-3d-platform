# Running the studio on a server

The production studio is `npm run studio` (scripts/studio.mjs) under systemd, behind the machine's reverse proxy
(Coolify's Traefik on this server) which adds HTTPS. Everyone logs in; every change made in the studio is a git
commit by the person who made it; the checkout pulls and pushes in the background. Files: `deploy/`.

## Install (once, as root)

```bash
useradd --system --create-home --home-dir /srv/pathshala --shell /usr/sbin/nologin pathshala
mkdir -p /srv/pathshala/{data,exports,cache,backups} /etc/pathshala
git clone <repository-url> /srv/pathshala/repo
chown -R pathshala:pathshala /srv/pathshala
cd /srv/pathshala/repo
sudo -u pathshala npm ci --no-audit --no-fund
sudo -u pathshala env PLAYWRIGHT_BROWSERS_PATH=/srv/pathshala/cache/ms-playwright npx playwright install chromium
apt install -y ffmpeg                         # pictures and video exports
cp deploy/studio.env.example /etc/pathshala/studio.env && chmod 600 /etc/pathshala/studio.env
# edit /etc/pathshala/studio.env: the domain (PATHSHALA_STUDIO_URL), a long random PATHSHALA_WEBHOOK_SECRET
cp deploy/systemd/pathshala-studio.service deploy/systemd/pathshala-backup.{service,timer} /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now pathshala-studio pathshala-backup.timer
journalctl -u pathshala-studio -n 20         # prints the first admin login once: write it down
```

HTTPS: point the domain's DNS at the server, copy `deploy/traefik/pathshala.yml` to
`/data/coolify/proxy/dynamic/pathshala.yaml` with the domain filled in; Traefik picks it up and gets a certificate.

Moving from the old `npm run dev:public` studio: its logins in `.studio-auth.json` move into `data/users.json` on
the first start (copy `.studio-auth.json` into the new checkout once, or create accounts with `npm run user`).

## Git remote

The studio pushes to the checkout's `origin` remote on branch `main`.
- Give the `pathshala` user a deploy key with write access (GitHub: repository → Settings → Deploy keys), in
  `/srv/pathshala/.ssh/`, and clone over SSH.
- If `main` is protected, let that key bypass the rule (the studio commits data: reviews, status, notes, uploads).
- Webhook (GitHub: Settings → Webhooks): URL `https://<domain>/api/hooks/git`, content type JSON, the secret from
  `studio.env`, "just the push event". The studio then pulls at once after a merge (otherwise within a minute).

When the pull brings new studio code (`scripts/`, `package.json`, the lockfile), the studio runs `npm ci` if the
lockfile changed and exits; systemd starts it again on the new code. Figures, the kit and the dashboard reload live.

## People

```bash
cd /srv/pathshala/repo
sudo -u pathshala env $(cat /etc/pathshala/studio.env | xargs) npm run user -- add rahim --role reviewer --name "Rahim Uddin"
```
prints an invite link (valid 7 days) to send to the person; they choose their own password. `npm run user -- list`,
`invite <name>` (a new link, also for a forgotten password), `role <name> contributor`, `disable <name>`.
Roles: **admin** (everything, approves and releases), **contributor** (makes, uploads and exports figures, answers
reviews, status up to "review"), **reviewer** (sees figures in review, writes reviews).

## When something goes wrong

| Symptom | What to do |
|---|---|
| Banner "studio commits were saved on studio/rescue-…" | The remote changed the same files as the studio. The studio's commits are on that branch (pushed). Merge it on a computer (`git merge origin/studio/rescue-…`), push, and the banner goes away after the next sync. |
| Banner "sync failed: …" | Usually the deploy key or the network. `sudo -u pathshala git -C /srv/pathshala/repo push` shows the real error. |
| Exports refuse to start | Less than 10 GB free: `/api/health` shows `diskFreeGB`. Delete old previews: `rm -rf /srv/pathshala/exports/_preview/*`. |
| Exports say "dev tools" | `npm ci` and the Playwright Chromium are missing in the checkout (see Install). |
| Locked out after wrong passwords | Wait 15 minutes, or restart the service (the counter is in memory). |
| Forgot the admin password | `npm run user -- invite <admin>` prints a new link. |

Health: `curl -s https://<domain>/api/health` answers `{"ok":true}` (HTTP 503 when disk is low or a rescue is
pending); logged-in makers get the details. Logs: `journalctl -u pathshala-studio -f`.

## Backups and restore

`pathshala-backup.timer` runs `deploy/backup/backup.sh` nightly: `data/` (accounts, sessions, jobs, original
uploads), the official releases, and a `git bundle` of the whole history, kept 14 days in
`/srv/pathshala/backups/`. Set `BACKUP_RCLONE_REMOTE` in `/etc/pathshala/backup.env` to copy them off the machine.

Restore on a new machine: install as above, then
```bash
tar -xzf state-<stamp>.tar.gz -C /                # data/ and releases
git clone repo-<stamp>.bundle /srv/pathshala/repo  # only if the remote is gone; else clone the remote
```

## Upgrading three.js or Node

three.js: `npm i -E three@<v> @types/three@<v>`, `npm run vendor:three`, `npm run test:visual`, review, merge.
Node: install the new version, `npm ci`, `systemctl restart pathshala-studio`.
