// The sync itself: read the repo and the library, plan, and (with apply) bring the library up to date.
//
//   reconcile(options) → report        options as in scripts/library-sync.mjs; `log` receives the progress lines
//
// The order inside one figure is the safety of the tool: the lab, poster and models are put in the library first, the manifest
// last. The manifest is the commit point: a book designer finds a lab through its manifest, so until it is written the library
// shows the previous version, whole. A run that stops anywhere leaves the old version working and the next run finishes the job.
// One figure failing does not stop the others.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadBooks } from '../books.mjs';
import { gitInfo } from '../git.mjs';
import { ASSETS_DIR, ROOT, SHARED_DIR } from '../paths.mjs';
import { LIBRARY_MODES, catalogTag } from './build-libraries.mjs';
import { libraryPreflight, loadCatalog } from './catalog.mjs';
import { closeExportBrowser, exportedFiles, isLabVerified, labFile, libraryFile, markLabVerified } from './build.mjs';
import { DEFAULT_FORMATS, loadConfig, parseFormats } from './config.mjs';
import { buildCodeHashes, toolVersions } from './fingerprint.mjs';
import { figureIds, figuresTouchedBy, describeFigure } from './local.mjs';
import { acquireLock } from './lock.mjs';
import {
  GLB_TYPE,
  LAB_HTML_TYPE,
  LAB_MANIFEST_TYPE,
  LIBRARY_JS_TYPE,
  POSTER_TYPE,
  VIDEO_TYPE,
  defaultParams,
  labManifest,
  recordTags,
  resolveLicense,
  tagValue,
  validateLabManifest,
} from './manifest.mjs';
import { currentItems, groupByFigure, planAll, summarize } from './plan.mjs';
import { LibraryError, createLibrary } from './registry.mjs';
import { verifyLab } from './verify-lab.mjs';

export const DEFAULT_CACHE_DIR = path.join(ROOT, '.cache', 'library');
const MAX_WITHDRAWALS_WITHOUT_CONFIRM = 3;
const KiB = (n) => `${(n / 1024).toFixed(0)} KiB`;

const stamp = () => new Date().toISOString().replace(/[-:.]/g, '');
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

function writeJsonAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

/** Checks the options and fills the defaults; throws Error with a message for the person at the keyboard. */
export function normalizeOptions(o) {
  const config = o.config ?? loadConfig();
  const tier = o.tier || config.tier || 'staging';
  if (!['staging', 'production'].includes(tier)) throw new Error(`--tier must be staging or production, not "${tier}"`);
  const formats = parseFormats(o.formats ?? config.formats ?? DEFAULT_FORMATS);
  const apply = Boolean(o.apply);
  if (apply && !o.library) throw new Error('--apply needs --library <address of the library server>');
  const token = o.token ?? (o.tokenEnv ? process.env[o.tokenEnv] : undefined);
  if (apply && !token) throw new Error(`--apply needs a token: set the environment variable ${o.tokenEnv || '(--token-env NAME)'}`);
  const lic = resolveLicense({ cli: o.license, config: config.license, tier });
  if (apply && lic.problems.length) throw new Error(lic.problems[0]);
  const libraries = o.libraries || 'catalog';
  if (!LIBRARY_MODES.includes(libraries)) throw new Error(`--libraries must be ${LIBRARY_MODES.join(' or ')}, not "${libraries}"`);
  if (o.confirmWithdraw && !o.allowWithdraw) throw new Error('--confirm-withdraw only goes with --allow-withdraw');
  return {
    tier,
    formats,
    apply,
    library: o.library || null,
    token,
    license: lic.license,
    licenseWarnings: lic.warnings,
    only: o.only
      ? [
          ...new Set(
            []
              .concat(o.only)
              .flatMap((s) => String(s).split(','))
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        ]
      : [],
    changedSince: o.changedSince || null,
    allowWithdraw: Boolean(o.allowWithdraw),
    confirmWithdraw: Boolean(o.confirmWithdraw),
    verify: o.verify !== false,
    libraries,
    cacheDir: path.resolve(o.cacheDir || DEFAULT_CACHE_DIR),
    reportPath: o.reportPath ? path.resolve(o.reportPath) : null,
    size: config.size || {},
    assetsDir: o.assetsDir || ASSETS_DIR,
    sharedDir: o.sharedDir || SHARED_DIR,
    root: o.root || ROOT,
    fetch: o.fetch,
    log: o.log || (() => {}),
  };
}

/** The libraries (three and its add-ons) the labs of this run import, as the library items to publish or already there. */
function libraryRecords(snapshot) {
  const out = new Map();
  for (const r of snapshot) {
    if (tagValue(r, 'kind') !== 'library') continue;
    const name = `${tagValue(r, 'library')}@${tagValue(r, 'library-version')}`;
    if (!out.has(name) || tagValue(r, 'state') !== 'superseded') out.set(name, r); // a superseded copy never hides the current one
  }
  return out;
}

export async function reconcile(rawOptions) {
  const opt = normalizeOptions(rawOptions);
  const { log, cacheDir } = opt;
  // the shared libraries are the catalog's bytes: this repo's three.js must be the catalog's version before anything is built
  const catalog = opt.libraries === 'catalog' ? loadCatalog(path.join(opt.root, 'scripts', 'lib', 'library', 'lab-library-catalog.json')) : null;
  if (catalog) {
    const problems = libraryPreflight({ root: opt.root, catalog });
    if (problems.length) throw new Error(problems[0]);
  }
  fs.mkdirSync(cacheDir, { recursive: true });
  const lock = acquireLock(path.join(cacheDir, 'sync.lock'), { tier: opt.tier, library: opt.library, apply: opt.apply });
  const startedAt = new Date().toISOString();
  try {
    const library = opt.library ? createLibrary(opt.library, { token: opt.token, fetch: opt.fetch }) : null;
    const snapshot = library ? await library.snapshot() : [];
    const remote = groupByFigure(snapshot);
    const tools = toolVersions(opt.root, { libraries: opt.libraries });
    const code = buildCodeHashes(opt.root);
    const books = loadBooks();
    const git = gitInfo();

    // 1. the figures this run is about
    let ids = figureIds(opt.assetsDir);
    const all = new Set(ids);
    if (opt.only.length) {
      const unknown = opt.only.filter((id) => !all.has(id));
      if (unknown.length) throw new Error(`no such figure: ${unknown.join(', ')}`);
      ids = ids.filter((id) => opt.only.includes(id));
    }
    const locals = [];
    for (const id of ids) {
      const state = readJson(path.join(cacheDir, 'state', `${id}.json`));
      locals.push(await describeFigure(id, { ...opt, remote: remote.get(id), tools, code, books, state }));
    }
    let selected = locals;
    if (opt.changedSince) {
      const changed = changedSince(opt.changedSince);
      const touched = new Set(
        figuresTouchedBy(
          changed,
          locals.filter((l) => l.fp),
        ),
      );
      selected = locals.filter((l) => touched.has(l.id) || !l.fp);
      log(`--changed-since ${opt.changedSince}: ${selected.length} of ${locals.length} figures touched`);
    }

    // 2. the labs, built in the cache (cheap): their size, and the libraries they import
    const labs = new Map();
    for (const l of selected) {
      if (!l.fp || !l.isPage || !opt.formats.has('lab') || l.problems.length) continue;
      try {
        const lab = await labFile(l, { cacheDir });
        labs.set(l.id, lab);
        if (lab.errors.length) l.problems.push(...lab.errors);
      } catch (err) {
        l.problems.push(`the lab cannot be built: ${err.message}`);
      }
    }

    // 3. the plan
    const plannable = selected.filter((l) => l.fp).map((l) => ({ ...l, problems: l.problems }));
    const broken = selected.filter((l) => !l.fp);
    const plans = planAll({
      locals: plannable,
      records: snapshot,
      detectRemoved: !opt.only.length && !opt.changedSince,
      knownIds: locals.map((l) => l.id),
    });
    for (const l of broken)
      plans.push({
        id: l.id,
        category: 'blocked',
        reasons: l.problems,
        problems: l.problems,
        build: { lab: false, poster: false, video: false, glb: [], manifest: false },
        demote: [],
        withdraw: [],
      });
    const needs = [...new Set([...labs.values()].flatMap((lab) => lab.libraries))].sort();
    const have = libraryRecords(snapshot);
    const threeVersion = tools.three.match(/three@(\d+\.\d+\.\d+)/)?.[1];
    // built now, and in catalog mode checked against the catalog's keys: a build that is not the catalog's bytes stops the run here
    const libraryBuilds = new Map();
    for (const specifier of needs)
      libraryBuilds.set(
        specifier,
        await libraryFile(specifier, { cacheDir, sharedDir: opt.sharedDir, root: opt.root, libraries: opt.libraries, catalog }),
      );
    const missingLibraries = library
      ? needs.filter((s) => have.get(`${s}@${libraryBuilds.get(s).version}`)?.key !== libraryBuilds.get(s).key)
      : needs;
    const counts = summarize(plans);

    // 4. the report so far
    const byId = new Map(locals.map((l) => [l.id, l]));
    const figures = plans
      .map((p) => {
        const l = byId.get(p.id);
        const lab = labs.get(p.id);
        return {
          id: p.id,
          category: p.category,
          reasons: p.reasons,
          changes: l?.changes || [],
          warnings: l?.warnings || [],
          version: l?.asset?.version ?? null,
          publishedVersion: l?.version ?? null,
          status: l?.status ?? null,
          build: p.build,
          lab: lab
            ? { bytes: lab.bytes, gzipBytes: lab.gzipBytes, libraries: lab.libraries, warnings: lab.warnings, errors: lab.errors, cached: lab.cached }
            : null,
          poses: l?.poses ?? [],
          result: p.category === 'unchanged' ? 'unchanged' : opt.apply ? 'pending' : 'planned',
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
    const report = {
      startedAt,
      mode: opt.apply ? 'apply' : 'dry-run',
      tier: opt.tier,
      library: opt.library,
      commit: git?.commit || null,
      formats: [...opt.formats],
      license: opt.license,
      counts,
      libraries: {
        mode: opt.libraries,
        needed: needs,
        version: threeVersion,
        missing: missingLibraries,
        keys: Object.fromEntries(needs.map((s) => [s, { key: libraryBuilds.get(s).key, origin: libraryBuilds.get(s).origin }])),
        catalog: catalog ? { commit: catalog.source.commit ?? null, ref: catalog.source.ref ?? null } : null,
      },
      figures,
      withdrawn: [],
      notes: [...opt.licenseWarnings, ...(opt.library ? [] : ['no --library: planned against an empty library (everything shows as new)'])],
    };

    printPlan(report, log);

    // 5. apply
    if (opt.apply) {
      await applyPlan({ opt, library, plans, byId, labs, remote, report, git, missingLibraries, libraryBuilds, snapshot, catalog });
      report.results = countResults(report.figures);
    }
    report.finishedAt = new Date().toISOString();
    const reportFile = opt.reportPath || path.join(cacheDir, 'report.json');
    writeJsonAtomic(reportFile, report);
    log(`report: ${reportFile}`);
    if (!opt.apply) log('This was a dry run: nothing was published. Add --apply to do it.');
    return report;
  } finally {
    await closeExportBrowser();
    lock.release();
  }
}

function changedSince(ref) {
  const out = new Set();
  const info = gitInfo();
  if (!info) throw new Error('--changed-since needs a git checkout');
  for (const f of changedFilesSince(ref)) out.add(f);
  return [...out];
}

function changedFilesSince(ref) {
  const git = (args) =>
    execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      .split('\n')
      .filter(Boolean);
  try {
    return [
      ...git(['diff', '--name-only', `${ref}...HEAD`]),
      ...git(['diff', '--name-only', 'HEAD']),
      ...git(['ls-files', '--others', '--exclude-standard']),
    ];
  } catch (err) {
    throw new Error(
      `--changed-since ${ref}: git could not compare (${
        String(err.stderr || err.message)
          .trim()
          .split('\n')[0]
      })`,
    );
  }
}

const countResults = (figures) => {
  const c = {};
  for (const f of figures) c[f.result] = (c[f.result] || 0) + 1;
  return c;
};

function printPlan(report, log) {
  log(`Library sync (${report.mode}, ${report.tier}${report.library ? `, ${report.library}` : ''}): ${report.figures.length} figures`);
  for (const f of report.figures) {
    const size = f.lab ? `lab ${KiB(f.lab.bytes)}${f.lab.bytes > 300 * 1024 ? ' (over 300 KiB)' : ''}` : '';
    const why = f.reasons.length ? `  ${f.reasons.slice(0, 2).join('; ')}` : '';
    log(`  ${f.category.padEnd(9)} ${f.id.padEnd(34)} ${String(f.version ?? '').padEnd(7)} ${size}${why}`);
  }
  if (report.libraries.needed.length)
    log(
      `  libraries: ${report.libraries.needed.length} used (three ${report.libraries.version}, ${
        report.libraries.mode === 'own' ? 'own copies' : `chalk-format catalog ${report.libraries.catalog?.commit?.slice(0, 8) ?? ''}`
      }), ${report.libraries.missing.length} to publish`,
    );
  const c = report.counts;
  log(
    `Summary: ${Object.entries(c)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ')}`,
  );
  for (const n of report.notes) log(`note: ${n}`);
}

// ---------------------------------------------------------------------------------------------------------------------
// apply

async function applyPlan({ opt, library, plans, byId, labs, remote, report, git, missingLibraries, libraryBuilds, snapshot, catalog }) {
  const { log } = opt;
  const runStamp = stamp();
  const resultOf = (id) => report.figures.find((f) => f.id === id);
  const libraryKeys = new Map(); // specifier → { specifier, version, asset }

  async function ensureLibrary(specifier) {
    if (libraryKeys.has(specifier)) return libraryKeys.get(specifier);
    const lib =
      libraryBuilds.get(specifier) ??
      (await libraryFile(specifier, { cacheDir: opt.cacheDir, sharedDir: opt.sharedDir, root: opt.root, libraries: opt.libraries, catalog }));
    const done = await library.publish(lib.bytes, {
      type: LIBRARY_JS_TYPE,
      filename: `${specifier.replace(/[^A-Za-z0-9.]+/g, '-')}-${lib.version}.js`,
      title: `${specifier} ${lib.version} (library for labs)`,
      tags: [
        ...recordTags({ kind: 'library', specifier, libraryVersion: lib.version, state: 'current', published: runStamp }),
        catalogTag(lib.origin),
        ...(lib.origin !== 'own' && catalog?.source.commit ? [`catalog-ref:chalk-format-${catalog.source.commit.slice(0, 12)}`] : []),
      ],
      subject: 'physics',
    });
    // an earlier copy of the same library under other bytes (an own build) stays, for books that use it, but is no longer current
    for (const old of snapshot)
      if (
        tagValue(old, 'kind') === 'library' &&
        tagValue(old, 'library') === specifier &&
        tagValue(old, 'state') === 'current' &&
        old.key !== done.key
      )
        await library.retag(old, retagged(old, 'superseded'));
    const entry = { specifier, version: lib.version, asset: done.key, uploaded: done.uploaded, bytes: lib.bytes };
    libraryKeys.set(specifier, entry);
    return entry;
  }

  // libraries that are missing from the library are put there first (repair), whichever figures use them
  for (const specifier of missingLibraries) {
    try {
      const l = await ensureLibrary(specifier);
      log(`  library ${specifier} ${l.version}: published`);
    } catch (err) {
      log(`  library ${specifier}: FAILED ${err.message}`);
      report.notes.push(`library ${specifier} could not be published: ${err.message}`);
    }
  }

  for (const plan of plans) {
    const res = resultOf(plan.id);
    if (!res || plan.category === 'unchanged' || plan.category === 'withdraw') continue;
    if (plan.category === 'blocked') {
      res.result = 'blocked';
      continue;
    }
    const local = byId.get(plan.id);
    try {
      log(`  ${plan.category} ${plan.id} ...`);
      const done = await publishFigure({
        opt,
        library,
        plan,
        local,
        lab: labs.get(plan.id),
        remote: remote.get(plan.id),
        runStamp,
        git,
        ensureLibrary,
      });
      Object.assign(res, { result: 'published', published: done });
      writeJsonAtomic(path.join(opt.cacheDir, 'state', `${plan.id}.json`), {
        fp: { files: local.fp.files, tools: local.fp.tools },
        version: local.version,
        source: local.fp8,
        publishedAt: new Date().toISOString(),
      });
      log(`  published ${plan.id} ${local.version}`);
    } catch (err) {
      const blocked = err instanceof LibraryError && err.code === 'gone';
      res.result = blocked ? 'blocked' : 'failed';
      res.error = err.message;
      if (blocked)
        res.reasons = [
          ...res.reasons,
          'an item of it was withdrawn from the library earlier; its key can never be used again (change the figure so its bytes differ)',
        ];
      log(`  ${res.result.toUpperCase()} ${plan.id}: ${err.message}`);
    }
  }

  await withdrawRemoved({ opt, library, plans, report, runStamp });
}

function retagged(record, state) {
  return record.tags.map((t) => (t.startsWith('state:') ? `state:${state}` : t));
}

async function publishFigure({ opt, library, plan, local, lab, remote, runStamp, git, ensureLibrary }) {
  const { asset, book } = local;
  const cur = currentItems(remote);
  const base = {
    figure: asset.id,
    figureVersion: asset.version,
    page: asset.page,
    topic: asset.topic,
    book: asset.book,
    subject: book.subject,
    license: opt.license,
    fp8: local.fp8,
    fingerprints: local.fp,
    commit: git?.commit || local.commit,
    state: 'current',
    published: runStamp,
  };
  const title = asset.title;
  const made = { lab: null, poster: null, video: null, glb: {}, manifest: null };
  const newKeys = new Set();
  const keep = (key) => newKeys.add(key);

  // models, poster, video: only the parts the plan says changed
  const kinds = new Set();
  if (plan.build.poster) kinds.add('poster');
  if (plan.build.video) kinds.add('video');
  if (plan.build.glb.length) kinds.add('glb');
  const files = kinds.size ? await exportedFiles(local, { cacheDir: opt.cacheDir, kinds, poses: plan.build.glb }) : { glb: {} };

  // the lab: always made when the manifest is rewritten (its key goes in the manifest); the library skips the upload if it has it
  let labKeys = null;
  if (local.isPage && opt.formats.has('lab') && (plan.build.lab || plan.build.manifest)) {
    if (!lab || lab.errors?.length) throw new Error('the lab was not built');
    const libs = [];
    for (const specifier of lab.libraries) libs.push(await ensureLibrary(specifier));
    if (opt.verify && !isLabVerified(local, { cacheDir: opt.cacheDir })) {
      const manifestForTest = labManifestFor({ opt, local, keys: { entry: 'c1:aaaaaaaaaaaaaaaaaaaaaaaaaa4', libraries: [] }, glb: [] });
      const params = {
        ...defaultParams(manifestForTest),
        ...Object.fromEntries(['shadow', 'sound', 'coach'].filter((k) => k in (manifestForTest.params.properties || {})).map((k) => [k, false])),
      };
      const verdict = await verifyLab({
        html: lab.html,
        libraries: libs.map((l) => ({ specifier: l.specifier, bytes: l.bytes })),
        lab: { id: local.labId, version: asset.version, entry: manifestForTest.entry, params },
      });
      if (!verdict.ok)
        throw new Error(
          `the lab did not run in the sandbox: ${verdict.checks
            .filter((c) => !c.ok)
            .map((c) => `${c.name} (${c.detail || 'failed'})`)
            .join('; ')}`,
        );
      markLabVerified(local, { cacheDir: opt.cacheDir });
    }
    const done = await library.publish(Buffer.from(lab.html, 'utf8'), {
      type: LAB_HTML_TYPE,
      filename: `${asset.id}.lab.html`,
      title: `${title} (lab)`,
      tags: recordTags({ ...base, kind: 'lab', needs: lab.libraries }),
      subject: book.subject,
      license: opt.license || undefined,
    });
    made.lab = done;
    keep(done.key);
    labKeys = { entry: done.key, libraries: libs.map((l) => ({ specifier: l.specifier, version: l.version, asset: l.asset })) };
  }

  if (files.poster) {
    const done = await library.publish(fs.readFileSync(files.poster.file), {
      type: POSTER_TYPE,
      filename: `${asset.id}.poster.webp`,
      title: `${title} (poster)`,
      tags: recordTags({ ...base, kind: 'poster' }),
      subject: book.subject,
      license: opt.license || undefined,
    });
    made.poster = done;
    keep(done.key);
  }
  if (files.video) {
    const done = await library.publish(fs.readFileSync(files.video.file), {
      type: VIDEO_TYPE,
      filename: `${asset.id}.mp4`,
      title: `${title} (video)`,
      tags: recordTags({ ...base, kind: 'video' }),
      subject: book.subject,
      license: opt.license || undefined,
    });
    made.video = done;
    keep(done.key);
  }
  for (const [pose, f] of Object.entries(files.glb)) {
    const done = await library.publish(fs.readFileSync(f.file), {
      type: GLB_TYPE,
      filename: pose === 'default' ? `${asset.id}.glb` : `${asset.id}-${pose}.glb`,
      title: pose === 'default' ? `${title} (3D model)` : `${title} (3D model: ${pose})`,
      tags: recordTags({ ...base, kind: 'glb', pose }),
      subject: book.subject,
      license: opt.license || undefined,
    });
    made.glb[pose] = done;
    keep(done.key);
  }

  // the manifest, last: keys of what was just made, and of what is current and unchanged
  if (plan.build.manifest && labKeys) {
    const glb = local.poses.map((pose) => ({ pose, asset: made.glb[pose]?.key || cur.glb[pose]?.key })).filter((g) => g.asset);
    const keys = { ...labKeys, ...(made.poster?.key || cur.poster?.key ? { poster: made.poster?.key || cur.poster.key } : {}) };
    const manifest = labManifestFor({ opt, local, keys, glb });
    const problems = validateLabManifest(manifest);
    if (problems.length) throw new Error(`the manifest is not valid: ${problems.join('; ')}`);
    const done = await library.publish(Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'), {
      type: LAB_MANIFEST_TYPE,
      filename: `${asset.id}.lab.json`,
      title: `${title} (lab manifest)`,
      tags: recordTags({ ...base, kind: 'manifest' }),
      subject: book.subject,
      license: opt.license || undefined,
      // the record names its poster too (registry API §4): the library's pickers take the thumbnail from the record, not from the file
      poster: keys.poster,
    });
    made.manifest = done;
    keep(done.key);
  }

  // what is now superseded: the previous current items whose place was taken by a new key, and the planner's demotions
  const demote = [...plan.demote];
  const replaced = (item, now) => item && now && item.key !== now.key && demote.push(item);
  replaced(cur.manifest, made.manifest);
  replaced(cur.lab, made.lab);
  replaced(cur.poster, made.poster);
  replaced(cur.video, made.video);
  for (const [pose, now] of Object.entries(made.glb)) replaced(cur.glb[pose], now);
  const seen = new Set();
  let demoted = 0;
  for (const item of demote) {
    if (seen.has(item.key) || newKeys.has(item.key)) continue;
    seen.add(item.key);
    await library.retag(item, retagged(item, 'superseded'));
    demoted += 1;
  }

  return {
    manifest: made.manifest?.key ?? null,
    lab: made.lab?.key ?? null,
    poster: made.poster?.key ?? null,
    video: made.video?.key ?? null,
    glb: Object.fromEntries(Object.entries(made.glb).map(([p, d]) => [p, d.key])),
    uploaded: [made.manifest, made.lab, made.poster, made.video, ...Object.values(made.glb)].filter((d) => d?.uploaded).length,
    demoted,
  };
}

function labManifestFor({ opt, local, keys, glb }) {
  return labManifest({
    asset: local.asset,
    book: local.book,
    version: local.version,
    fp8: local.fp8,
    keys,
    glb,
    license: opt.license,
    size: opt.size,
  });
}

async function withdrawRemoved({ opt, library, plans, report, runStamp }) {
  const removed = plans.filter((p) => p.category === 'withdraw');
  if (!removed.length) return;
  if (!opt.allowWithdraw) {
    for (const p of removed) report.figures.find((f) => f.id === p.id).result = 'not-withdrawn';
    report.notes.push(`${removed.length} figure(s) are in the library but no longer in the repo; nothing was withdrawn (use --allow-withdraw)`);
    return;
  }
  if (removed.length > MAX_WITHDRAWALS_WITHOUT_CONFIRM && !opt.confirmWithdraw) {
    for (const p of removed) report.figures.find((f) => f.id === p.id).result = 'not-withdrawn';
    report.notes.push(
      `${removed.length} figures would be withdrawn; more than ${MAX_WITHDRAWALS_WITHOUT_CONFIRM} needs --confirm-withdraw. Nothing was withdrawn.`,
    );
    return;
  }
  for (const p of removed) {
    const res = report.figures.find((f) => f.id === p.id);
    try {
      const users = [];
      for (const item of p.withdraw) for (const b of await library.books(item.key)) users.push(`${b.bookId} (${tagValue(item, 'kind')})`);
      if (users.length) {
        res.result = 'blocked';
        res.reasons = [...res.reasons, `books still use it: ${users.join(', ')}`];
        continue;
      }
      for (const item of p.withdraw) await library.withdraw(item.key, `removed from the pathshala-3d repo (sync ${runStamp})`);
      res.result = 'withdrawn';
      report.withdrawn.push({ id: p.id, keys: p.withdraw.map((i) => i.key) });
    } catch (err) {
      res.result = 'failed';
      res.error = err.message;
    }
  }
}
