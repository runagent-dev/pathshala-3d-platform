#!/usr/bin/env node
// Brings the Chalk library up to date with the figures in this repo (docs/library-sync.md, decisions/0007).
//
//   npm run library:sync                                     DRY RUN: what would change (needs no library, no token)
//   npm run library:sync -- --library http://127.0.0.1:4900  dry run against a library: new, changed, repair, withdraw, blocked
//                                                            (reads with LIBRARY_TOKEN, else LIBRARY_READ_TOKEN, else no token)
//   npm run library:sync -- --library <url> --token-env LIBRARY_TOKEN --apply
//
// Options
//   --library <url>        the library server (never has a default)
//   --token-env <NAME>     environment variable holding the token (default LIBRARY_TOKEN); the token is never printed. A dry run
//                          without it reads with LIBRARY_READ_TOKEN (a reader key) when that is set, which a library that needs a
//                          token for reading (PUBLIC_READ=false) asks for
//   --apply                do it (without it nothing is published)
//   --tier staging|production     both publish every figure; production also needs a clean worktree and a new version (default staging)
//   --only <id[,id]>       only these figures
//   --changed-since <ref>  only figures touched since a git ref (their files, or the kit files they import)
//   --formats lab,poster,glb,video   what to publish (default lab,poster,glb; video is slow)
//   --license <SPDX>       license written on every item (or "license" in library-sync.config.json); optional: without one, items carry none
//   --libraries catalog|own  catalog (default): the three.js libraries are built to match chalk-format's pinned catalog and shared with
//                          every other lab; own: this repo's own copies, nothing shared (tagged catalog:own)
//   --no-verify            do not run each new lab in the sandbox before publishing it
//   --allow-withdraw       withdraw items of figures removed from the repo (not used by any book); more than 3 needs --confirm-withdraw
//   --cache-dir <dir>      default .cache/library (the only place this writes, besides the report)
//   --report <file>        where to write the JSON report (default <cache-dir>/report.json)
//   --check                exit 1 when the library is behind (for CI); changes nothing
//   --json                 print the report as JSON instead of the table
//   --notify / --no-notify after a production --apply that changed the library, the Books server is told (LIBRARY_SYNC_HOOK_URL and
//                          LIBRARY_SYNC_HOOK_TOKEN in the environment) so it updates the labs and models in books; --notify sends it
//                          even when nothing changed, --no-notify never does. A failed notification never fails the sync.
import path from 'node:path';
import { parseArgs } from 'node:util';
import { LockedError } from './lib/library/lock.mjs';
import { ENV_FILE_NAME, loadEnvFile } from './lib/library/env-file.mjs';
import { announceSync } from './lib/library/notify.mjs';
import { DEFAULT_CACHE_DIR, reconcile } from './lib/library/reconcile.mjs';

const HELP = `Usage: npm run library:sync -- [--library <url>] [--apply] [options]   (see the top of scripts/library-sync.mjs)`;

let values;
try {
  ({ values } = parseArgs({
    options: {
      library: { type: 'string' },
      'token-env': { type: 'string', default: 'LIBRARY_TOKEN' },
      apply: { type: 'boolean', default: false },
      tier: { type: 'string' },
      only: { type: 'string', multiple: true },
      'changed-since': { type: 'string' },
      formats: { type: 'string' },
      license: { type: 'string' },
      libraries: { type: 'string' },
      'no-verify': { type: 'boolean', default: false },
      'allow-withdraw': { type: 'boolean', default: false },
      'confirm-withdraw': { type: 'boolean', default: false },
      'cache-dir': { type: 'string' },
      report: { type: 'string' },
      check: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      notify: { type: 'boolean', default: false },
      'no-notify': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  }));
} catch (err) {
  console.error(`${err.message}\n${HELP}`);
  process.exit(2);
}
if (values.notify && values['no-notify']) {
  console.error(`--notify and --no-notify cannot be used together\n${HELP}`);
  process.exit(2);
}
if (values.help) {
  console.log(HELP);
  process.exit(0);
}

// settings kept in a git-ignored file at the repo root (.env.library: LIBRARY_TOKEN, LIBRARY_READ_TOKEN, LIBRARY_SYNC_HOOK_URL,
// LIBRARY_SYNC_HOOK_TOKEN); the shell wins
const envFile = loadEnvFile(path.resolve(import.meta.dirname, '..', ENV_FILE_NAME));
if (envFile.found && !values.json) {
  console.log(
    `${ENV_FILE_NAME}: ${envFile.loaded.length ? `took ${envFile.loaded.join(', ')} (values are never shown)` : 'nothing new (the shell already sets what it has)'}`,
  );
  if (envFile.ignored.length)
    console.log(
      `${ENV_FILE_NAME}: ignored ${envFile.ignored.join(', ')} (only the library token and the Books notification settings are read from it)`,
    );
  if (envFile.open) console.log(`${ENV_FILE_NAME}: other users of this computer can read it; run: chmod 600 ${ENV_FILE_NAME}`);
}

try {
  const report = await reconcile({
    library: values.library,
    tokenEnv: values['token-env'],
    apply: values.apply && !values.check,
    tier: values.tier,
    only: values.only,
    changedSince: values['changed-since'],
    formats: values.formats,
    license: values.license,
    verify: !values['no-verify'],
    libraries: values.libraries,
    allowWithdraw: values['allow-withdraw'],
    confirmWithdraw: values['confirm-withdraw'],
    cacheDir: values['cache-dir'],
    reportPath: values.report,
    log: values.json ? () => {} : (line) => console.log(line),
  });
  if (values.json) console.log(JSON.stringify(report, null, 2));
  // the library is already up to date here: telling the Books server is a courtesy that can fail without failing the sync
  await announceSync({
    report: values.check ? { ...report, mode: 'dry-run' } : report,
    flags: { notify: values.notify, noNotify: values['no-notify'] },
    log: values.json ? (line) => console.error(line) : (line) => console.log(line),
    cacheDir: path.resolve(values['cache-dir'] || DEFAULT_CACHE_DIR),
  });
  const failed = report.figures.filter((f) => f.result === 'failed').length;
  const behind =
    report.figures.filter((f) => ['new', 'changed', 'repair', 'withdraw'].includes(f.category)).length + (report.libraries?.missing?.length ?? 0);
  // a shared library that could not be published leaves the labs without their runtime: that is a failure too
  if (failed || report.libraries?.failed?.length) process.exit(1);
  if (values.check && behind) process.exit(1);
} catch (err) {
  console.error(`library:sync: ${err.message}`);
  process.exit(err instanceof LockedError ? 3 : 2);
}
