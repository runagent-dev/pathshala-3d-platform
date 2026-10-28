#!/usr/bin/env node
// Scenarios for the library sync, run against a LOCAL library server (docs/library-sync.md, "Trying it"):
//
//   (a) the first sync publishes every figure that bundles        (b) a second sync is a no-op
//   (c) edit one figure file: only that figure is republished     (d) edit one kit module: exactly its importers are rebuilt
//   (e) delete a figure: planned as withdraw, withdrawn only with --allow-withdraw
//   (f) an item withdrawn or retagged by hand: reported / repaired
//   (g) kill the process mid-apply: the rerun converges, no duplicate manifests
//   (h) bump a tool version: everything is rebuilt
//
//   node scripts/library-scenarios.mjs --library http://127.0.0.1:4900 --token dev-token --admin-token dev-admin
//
// The library must be EMPTY and local (it refuses anything else, and never touches a real one): start one with
//   DATABASE_URL=pglite:./data/db STORAGE=disk DISK_DIR=./data/files TOKENS='me:dev-token,admin!:dev-admin' PORT=4900 chalk-library serve
// The figures and the kit are never edited: the scenarios work on a copy of the repo in .cache/library/scenarios/repo.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { ROOT } from './lib/paths.mjs';

const { values } = parseArgs({
  options: {
    library: { type: 'string' },
    token: { type: 'string' },
    'admin-token': { type: 'string' },
    'export-figures': { type: 'string', default: 'screw-gauge,stopwatch' },
    'no-verify': { type: 'boolean', default: false },
    only: { type: 'string' },
  },
});
const need = (k) => values[k] || (console.error(`--${k} is required`), process.exit(2));
const library = need('library');
const token = need('token');
const adminToken = need('admin-token');
const host = new URL(library).hostname;
if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(host)) {
  console.error(`refusing to run scenarios against ${host}: they publish and withdraw. Use a local library.`);
  process.exit(2);
}
const exportFigures = values['export-figures'].split(',').filter(Boolean);

const SCRATCH = path.join(ROOT, '.cache', 'library', 'scenarios');
const REPO = path.join(SCRATCH, 'repo');
const CACHE = path.join(SCRATCH, 'cache');

// ---- a scratch copy of the repo -----------------------------------------------------------------------------------
fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(REPO, { recursive: true });
for (const dir of ['assets', 'shared', 'scripts', 'books', 'test', 'dashboard', 'templates', 'schemas'])
  fs.cpSync(path.join(ROOT, dir), path.join(REPO, dir), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(REPO, 'package.json'));
fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(REPO, 'node_modules'));

const mod = (rel) => import(pathToFileURL(path.join(REPO, rel)).href);
const { reconcile } = await mod('scripts/lib/library/reconcile.mjs');
const { createLibrary } = await mod('scripts/lib/library/registry.mjs');
const { figureIds } = await mod('scripts/lib/library/local.mjs');
const { figureGraph } = await mod('scripts/lib/depgraph.mjs');
const { tagValue } = await mod('scripts/lib/library/manifest.mjs');

// ---- helpers --------------------------------------------------------------------------------------------------------
const results = [];
const say = (line) => console.log(line);
const check = (scenario, name, ok, detail = '') => {
  results.push({ scenario, name, ok: Boolean(ok), detail });
  say(`    ${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
};

let writes = 0;
const countingFetch = (input, init) => {
  if ((init?.method || 'GET') !== 'GET' && !String(input).endsWith('/v1/assets/check')) writes += 1;
  return fetch(input, init);
};
const sync = async (over = {}) => {
  writes = 0;
  return reconcile({
    library,
    token,
    fetch: countingFetch,
    license: 'CC-BY-4.0',
    cacheDir: CACHE,
    formats: 'lab',
    verify: !values['no-verify'],
    log: () => {},
    ...over,
  });
};
const lib = (t = token) => createLibrary(library, { token: t });
const snapshot = () => lib().snapshot();
const currentOf = (records, figure, kind) =>
  records.filter((r) => tagValue(r, 'figure') === figure && tagValue(r, 'kind') === kind && tagValue(r, 'state') === 'current');
const resultsOf = (report) => Object.fromEntries(report.figures.map((f) => [f.id, f]));
const byResult = (report, r) => report.figures.filter((f) => f.result === r).map((f) => f.id);
const write = (rel, text) => fs.writeFileSync(path.join(REPO, rel), text);
const append = (rel, text) => fs.appendFileSync(path.join(REPO, rel), text);
const ids = figureIds(path.join(REPO, 'assets'));
const title = (s) => say(`\n(${s})`);
const want = (letter) => !values.only || values.only.split(',').includes(letter);

// the figures that import a kit file, found by reading imports (not by asking the sync)
const importersOf = (kitFile) =>
  ids.filter((id) =>
    figureGraph(path.join(REPO, 'assets', id), 'index.html', { allowed: [path.join(REPO, 'assets', id), path.join(REPO, 'shared')] }).files.has(
      path.join(REPO, kitFile),
    ),
  );

// ---- the library must be empty -----------------------------------------------------------------------------------
if ((await snapshot()).length) {
  console.error('the library is not empty: start a fresh local library for the scenarios');
  process.exit(2);
}

// ---------------------------------------------------------------------------------------------------------------------
if (want('a')) {
  title('a) first sync publishes every figure that bundles (labs, each run in the sandbox)');
  const t0 = Date.now();
  const report = await sync({ apply: true });
  const published = byResult(report, 'published');
  const failed = report.figures.filter((f) => ['failed', 'blocked'].includes(f.result));
  check(
    'a',
    `${published.length} of ${ids.length} figures published`,
    published.length + failed.length === ids.length && failed.length === 0,
    failed.map((f) => `${f.id}: ${f.error || f.reasons[0]}`).join('; '),
  );
  const records = await snapshot();
  check(
    'a',
    'each has one current manifest and one current lab',
    ids.every((id) => currentOf(records, id, 'manifest').length === 1 && currentOf(records, id, 'lab').length === 1),
  );
  check('a', `took ${((Date.now() - t0) / 1000).toFixed(0)} s`, true);

  say(`  models and posters, for ${exportFigures.join(', ')} only (they need Chromium and disk)`);
  const full = await sync({ apply: true, formats: 'lab,poster,glb', only: exportFigures });
  check(
    'a',
    'poster and models published for those figures',
    exportFigures.every((id) => resultsOf(full)[id]?.result === 'published'),
    JSON.stringify(exportFigures.map((id) => resultsOf(full)[id]?.result)),
  );
  const after = await snapshot();
  check(
    'a',
    'they have a poster and a model each, current',
    exportFigures.every((id) => currentOf(after, id, 'poster').length === 1 && currentOf(after, id, 'glb').length >= 1),
  );
  check(
    'a',
    'and still one current manifest',
    exportFigures.every((id) => currentOf(after, id, 'manifest').length === 1),
  );
}

if (want('b')) {
  title('b) a second sync is a no-op');
  const report = await sync({ apply: true });
  check('b', 'every figure unchanged', report.counts.unchanged === ids.length, JSON.stringify(report.counts));
  check('b', 'nothing registered or uploaded', writes === 0, `${writes} writes`);
  check(
    'b',
    'nothing built (every lab came from the cache)',
    report.figures.filter((f) => f.lab).every((f) => f.lab.cached !== false),
  );
}

if (want('c')) {
  title('c) edit one figure file: only that figure is republished');
  const before = await snapshot();
  const target = 'speed-velocity';
  append(`assets/${target}/src/main.js`, '\nglobalThis.__scenarioC = 1; // scenario c: an edit\n');
  write(
    'assets/walking-third-law/asset.json',
    `${JSON.stringify({ ...JSON.parse(fs.readFileSync(path.join(REPO, 'assets/walking-third-law/asset.json'), 'utf8')), description: 'A different description (scenario c)' }, null, 2)}\n`,
  );
  const report = await sync({ apply: true });
  const changed = report.figures.filter((f) => f.category !== 'unchanged').map((f) => f.id);
  check(
    'c',
    'exactly the two edited figures are not unchanged',
    JSON.stringify(changed.sort()) === JSON.stringify([target, 'walking-third-law'].sort()),
    changed.join(', '),
  );
  const after = await snapshot();
  const lab = (r, id) => currentOf(r, id, 'lab')[0]?.key;
  check(
    'c',
    `${target}: a new lab and a new manifest`,
    lab(after, target) !== lab(before, target) && currentOf(after, target, 'manifest')[0].key !== currentOf(before, target, 'manifest')[0].key,
  );
  check(
    'c',
    'walking-third-law: a description edit rewrites the manifest and not the lab',
    lab(after, 'walking-third-law') === lab(before, 'walking-third-law') &&
      currentOf(after, 'walking-third-law', 'manifest')[0].key !== currentOf(before, 'walking-third-law', 'manifest')[0].key,
  );
  check(
    'c',
    'the previous manifest is still in the library, as superseded',
    before
      .filter((r) => tagValue(r, 'figure') === target && tagValue(r, 'kind') === 'manifest')
      .every((r) => after.find((x) => x.key === r.key && tagValue(x, 'state') === 'superseded')),
  );
  check(
    'c',
    'one current manifest per figure',
    ids.every((id) => currentOf(after, id, 'manifest').length === 1),
  );
}

if (want('d')) {
  title('d) edit one kit module: exactly the figures that import it are rebuilt');
  const candidates = [
    'shared/lib/student/loupe.js',
    'shared/lib/student/audio.js',
    'shared/lib/student/pointer.js',
    'shared/lib/tween.js',
    'shared/lib/timeline.js',
  ];
  let kit = null;
  let expected = [];
  for (const c of candidates.filter((f) => fs.existsSync(path.join(REPO, f)))) {
    const who = importersOf(c);
    if (who.length > 0 && who.length < ids.length) {
      kit = c;
      expected = who;
      break;
    }
  }
  check('d', 'a kit module imported by some figures but not all was found', Boolean(kit), kit || '');
  if (kit) {
    append(kit, '\nexport const __scenarioD = 1; // scenario d: an edit\n');
    const report = await sync({ apply: true });
    const rebuilt = report.figures
      .filter((f) => f.category !== 'unchanged')
      .map((f) => f.id)
      .sort();
    check('d', `${kit} is imported by ${expected.length} figures`, true, expected.length);
    check(
      'd',
      'exactly those figures were rebuilt',
      JSON.stringify(rebuilt) === JSON.stringify([...expected].sort()),
      `rebuilt ${rebuilt.length}, expected ${expected.length}`,
    );
    check(
      'd',
      'they were published',
      rebuilt.every((id) => resultsOf(report)[id].result === 'published'),
    );
  }
}

if (want('e')) {
  title('e) delete a figure: planned as withdraw, withdrawn only with the flag');
  const gone = 'safe-journey';
  const keysBefore = (await snapshot()).filter((r) => tagValue(r, 'figure') === gone).map((r) => r.key);
  fs.rmSync(path.join(REPO, 'assets', gone), { recursive: true });
  const dry = await sync();
  check('e', 'the dry run plans it as withdraw', resultsOf(dry)[gone]?.category === 'withdraw');
  const noFlag = await sync({ apply: true });
  check(
    'e',
    'apply without --allow-withdraw withdraws nothing',
    (await snapshot()).filter((r) => tagValue(r, 'figure') === gone).length === keysBefore.length &&
      resultsOf(noFlag)[gone].result === 'not-withdrawn',
  );
  const flagged = await sync({ apply: true, token: adminToken, allowWithdraw: true });
  const statuses = await Promise.all(
    keysBefore.map((k) =>
      lib(adminToken)
        .get(k)
        .then((r) => r.status),
    ),
  );
  check(
    'e',
    'apply with --allow-withdraw withdraws its current items',
    resultsOf(flagged)[gone].result === 'withdrawn' && statuses.some((s) => s === 'withdrawn'),
    statuses.join(','),
  );
  const recorded = fs.existsSync(path.join(CACHE, 'report.json'));
  check('e', 'the report says what was withdrawn', recorded && flagged.withdrawn.some((w) => w.id === gone));
}

if (want('f')) {
  title('f) an item changed or withdrawn in the library by hand');
  const [figure, other] = exportFigures;
  // earlier scenarios changed the kit for some figures: bring the models and posters of these two up to date first
  await sync({ apply: true, formats: 'lab,poster,glb', only: exportFigures, verify: false });
  const records = await snapshot();
  const manifest = currentOf(records, other, 'manifest')[0];
  await lib().retag(
    manifest,
    manifest.tags.map((t) => (t === 'state:current' ? 'state:superseded' : t)),
  );
  const healed = await sync({ apply: true, formats: 'lab,poster,glb', only: [other] });
  check(
    'f',
    'a manifest retagged by hand is a repair, and is repaired',
    resultsOf(healed)[other].category === 'repair' && resultsOf(healed)[other].result === 'published',
  );
  check('f', 'and is current again, once', currentOf(await snapshot(), other, 'manifest').length === 1);

  const poster = currentOf(await snapshot(), figure, 'poster')[0];
  check('f', `${figure} has a current poster to withdraw`, Boolean(poster));
  if (poster) {
    await lib(adminToken).withdraw(poster.key, 'scenario f: withdrawn by hand');
    const blocked = await sync({ apply: true, formats: 'lab,poster,glb', only: [figure] });
    check(
      'f',
      'a poster withdrawn by hand is noticed (repair) and reported as blocked: the library never accepts that key again',
      resultsOf(blocked)[figure].category === 'repair' && resultsOf(blocked)[figure].result === 'blocked',
      resultsOf(blocked)[figure].reasons.at(-1),
    );
    check('f', 'the figure keeps its manifest', currentOf(await snapshot(), figure, 'manifest').length === 1);
  }
}

if (want('g')) {
  title('g) kill the process mid-apply: the rerun converges');
  const edit = ['momentum', 'inertia', 'acceleration'].filter((id) => fs.existsSync(path.join(REPO, 'assets', id)));
  for (const id of edit) append(`assets/${id}/src/main.js`, '\nglobalThis.__scenarioG = 1; // scenario g: an edit\n');
  const childFile = path.join(SCRATCH, 'killed-run.mjs');
  fs.writeFileSync(
    childFile,
    `import { reconcile } from ${JSON.stringify(pathToFileURL(path.join(REPO, 'scripts/lib/library/reconcile.mjs')).href)};
let registered = 0;
const killAfter = Number(process.env.KILL_AFTER);
const f = (input, init) => {
  if ((init?.method || 'GET') === 'POST' && String(input).endsWith('/v1/assets') && ++registered > killAfter) process.kill(process.pid, 'SIGKILL');
  return fetch(input, init);
};
await reconcile({ library: ${JSON.stringify(library)}, token: ${JSON.stringify(token)}, fetch: f, license: 'CC-BY-4.0', cacheDir: ${JSON.stringify(CACHE)}, formats: 'lab', verify: false, apply: true, only: ${JSON.stringify(edit)} });
`,
  );
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [childFile], { stdio: 'ignore', env: { ...process.env, KILL_AFTER: '4' } });
    child.on('exit', (c, signal) => resolve(signal || c));
  });
  check('g', 'the run was killed in the middle of publishing', code === 'SIGKILL', String(code));
  check('g', 'it left its lock behind', fs.existsSync(path.join(CACHE, 'sync.lock')));
  const mid = await snapshot();
  say(`    after the kill: ${edit.map((id) => `${id} manifests current ${currentOf(mid, id, 'manifest').length}`).join(', ')}`);
  const report = await sync({ apply: true, only: edit, verify: false });
  check(
    'g',
    'the rerun took over the stale lock and finished',
    edit.every((id) => ['published', 'unchanged'].includes(resultsOf(report)[id].result)),
    JSON.stringify(edit.map((id) => resultsOf(report)[id].result)),
  );
  const after = await snapshot();
  check(
    'g',
    'exactly one current manifest and one current lab per figure',
    edit.every((id) => currentOf(after, id, 'manifest').length === 1 && currentOf(after, id, 'lab').length === 1),
  );
  const again = await sync({ apply: true, only: edit, verify: false });
  check('g', 'and the next run is a no-op', again.counts.unchanged === edit.length && writes === 0);
}

if (want('h')) {
  title('h) bump a tool version: everything is rebuilt');
  // a copy of node_modules/esbuild whose package.json says another version (the tool reads the installed version)
  const real = fs.realpathSync(path.join(ROOT, 'node_modules'));
  const nm = path.join(REPO, 'node_modules');
  fs.rmSync(nm, { force: true });
  fs.mkdirSync(nm);
  for (const entry of fs.readdirSync(real)) if (entry !== 'esbuild') fs.symlinkSync(path.join(real, entry), path.join(nm, entry));
  fs.mkdirSync(path.join(nm, 'esbuild'));
  for (const entry of fs.readdirSync(path.join(real, 'esbuild')))
    if (entry !== 'package.json') fs.symlinkSync(path.join(real, 'esbuild', entry), path.join(nm, 'esbuild', entry));
  const pkg = JSON.parse(fs.readFileSync(path.join(real, 'esbuild', 'package.json'), 'utf8'));
  fs.writeFileSync(path.join(nm, 'esbuild', 'package.json'), JSON.stringify({ ...pkg, version: '0.99.0' }));
  const dry = await sync({ verify: false });
  const left = ids.filter((id) => fs.existsSync(path.join(REPO, 'assets', id)));
  check(
    'h',
    'every lab is planned as changed',
    left.every((id) => resultsOf(dry)[id].category === 'changed'),
    JSON.stringify(dry.counts),
  );
  const report = await sync({ apply: true, verify: false });
  check(
    'h',
    'and republished',
    left.every((id) => resultsOf(report)[id].result === 'published'),
    `${byResult(report, 'published').length} of ${left.length}`,
  );
  const records = await snapshot();
  check(
    'h',
    'one current manifest per figure after the rebuild',
    left.every((id) => currentOf(records, id, 'manifest').length === 1),
  );
}

// ---------------------------------------------------------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
say(`\n${results.length - failed.length} of ${results.length} checks passed`);
for (const f of failed) say(`  FAILED (${f.scenario}) ${f.name} ${f.detail}`);
process.exit(failed.length ? 1 : 0);
