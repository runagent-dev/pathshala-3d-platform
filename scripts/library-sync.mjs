#!/usr/bin/env node
// Brings the Chalk library up to date with the figures in this repo (docs/library-sync.md, decisions/0007).
//
//   npm run library:sync                                     DRY RUN: what would change (needs no library, no token)
//   npm run library:sync -- --library http://127.0.0.1:4900  dry run against a library: new, changed, repair, withdraw, blocked
//   npm run library:sync -- --library <url> --token-env LIBRARY_TOKEN --apply
//
// Options
//   --library <url>        the library server (never has a default)
//   --token-env <NAME>     environment variable holding the token (default LIBRARY_TOKEN); the token is never printed
//   --apply                do it (without it nothing is published)
//   --tier staging|production     staging publishes everything; production only approved figures from a clean worktree (default staging)
//   --only <id[,id]>       only these figures
//   --changed-since <ref>  only figures touched since a git ref (their files, or the kit files they import)
//   --formats lab,poster,glb,video   what to publish (default lab,poster,glb; video is slow)
//   --license <SPDX>       license written on every item (or "license" in library-sync.config.json); production refuses without
//   --no-verify            do not run each new lab in the sandbox before publishing it
//   --allow-withdraw       withdraw items of figures removed from the repo (not used by any book); more than 3 needs --confirm-withdraw
//   --cache-dir <dir>      default .cache/library (the only place this writes, besides the report)
//   --report <file>        where to write the JSON report (default <cache-dir>/report.json)
//   --check                exit 1 when the library is behind (for CI); changes nothing
//   --json                 print the report as JSON instead of the table
import { parseArgs } from 'node:util';
import { LockedError } from './lib/library/lock.mjs';
import { reconcile } from './lib/library/reconcile.mjs';

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
      'no-verify': { type: 'boolean', default: false },
      'allow-withdraw': { type: 'boolean', default: false },
      'confirm-withdraw': { type: 'boolean', default: false },
      'cache-dir': { type: 'string' },
      report: { type: 'string' },
      check: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  }));
} catch (err) {
  console.error(`${err.message}\n${HELP}`);
  process.exit(2);
}
if (values.help) {
  console.log(HELP);
  process.exit(0);
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
    allowWithdraw: values['allow-withdraw'],
    confirmWithdraw: values['confirm-withdraw'],
    cacheDir: values['cache-dir'],
    reportPath: values.report,
    log: values.json ? () => {} : (line) => console.log(line),
  });
  if (values.json) console.log(JSON.stringify(report, null, 2));
  const failed = report.figures.filter((f) => f.result === 'failed').length;
  const behind = report.figures.filter((f) => ['new', 'changed', 'repair', 'withdraw'].includes(f.category)).length;
  if (failed) process.exit(1);
  if (values.check && behind) process.exit(1);
} catch (err) {
  console.error(`library:sync: ${err.message}`);
  process.exit(err instanceof LockedError ? 3 : 2);
}
