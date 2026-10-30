// Which figures the browser tests must run for, and remembering which have passed (docs/ci.md).
//
// A "marker" is an empty file named by a figure's testHash, kept in a folder that CI saves in the Actions cache between
// runs. A figure whose marker exists passed these exact inputs before, so it is not run again.
import fs from 'node:fs';
import path from 'node:path';
import { figuresTouched } from '../../check/index.mjs';
import { testHash, hashPaths, TEST_HARNESS } from './figure-hashes.mjs';

/** Changes that touch no figure: the studio's own commits (reviews, status, notes). */
const STUDIO_ONLY = /^assets\/[^/]+\/(reviews\/|status\.json$|NOTES\.md$)/;
/** Tooling that no figure test or template depends on: the library sync, the CI scripts, the visual comparison. */
const TOOLING_ONLY = /^scripts\/(ci\/|ci-figures\.mjs$|visual\.mjs$|lib\/ci\/|lib\/library\/|library-)/;

/** The changed files that can change what a figure does. */
export const relevantFiles = (files) => files.filter((f) => !STUDIO_ONLY.test(f) && !TOOLING_ONLY.test(f));

/** Whether the templates (and the converter's browser tests) must run. */
export const templatesAffected = (files) => relevantFiles(files).some((f) => /^(templates|shared|scripts)\//.test(f) || f === 'package-lock.json');

/** Changes to what runs the figure tests (not a figure's own files): every figure is a candidate, and the markers decide which really run. */
const HARNESS_CHANGE = /^(test\/figures\/|playwright\.config\.|\.nvmrc$|package(-lock)?\.json$)/;
export const harnessAffected = (files) => relevantFiles(files).some((f) => HARNESS_CHANGE.test(f));

const markerFile = (dir, hash) => path.join(dir, hash);
const hasMarkers = (dir) => fs.existsSync(dir) && fs.readdirSync(dir).length > 0;

/**
 * Plans a run. `changedFiles` is the diff against the base. The figures to test are the ones the change touches whose
 * inputs have no marker; with an empty marker folder (a cold cache) that is every figure the change touches.
 */
export function planRun({ root, ids, changedFiles, markersDir, touchedOf = figuresTouched }) {
  const touched = (harnessAffected(changedFiles) ? ids : touchedOf(relevantFiles(changedFiles))).filter((id) => ids.includes(id));
  const warm = hasMarkers(markersDir);
  const harness = hashPaths(root, TEST_HARNESS);
  const figures = warm ? touched.filter((id) => !fs.existsSync(markerFile(markersDir, testHash(id, { root, harness })))) : touched;
  return { figures, touched, skipped: touched.length - figures.length, warm, templates: templatesAffected(changedFiles) };
}

/** The figure a Playwright spec belongs to: its folder under assets/, or the `<id>:` its generated tests start with. */
export function figureOfSpec(spec) {
  const byFile = /^assets\/([^/]+)\//.exec(spec.file || '');
  if (byFile) return byFile[1];
  return /^([a-z0-9][a-z0-9-]*):/.exec(spec.title || '')?.[1] ?? null;
}

/** From a Playwright JSON report: the figures that ran and had every one of their tests pass. */
export function passedFigures(report) {
  const status = new Map(); // id → { ok: true while every spec passed, ran: at least one test really ran }
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      const id = figureOfSpec({ file: spec.file || suite.file, title: spec.title });
      if (!id) continue;
      const tests = spec.tests ?? [];
      const ok = tests.length > 0 && tests.every((t) => ['expected', 'skipped'].includes(t.status));
      const before = status.get(id) ?? { ok: true, ran: false };
      status.set(id, { ok: before.ok && ok, ran: before.ran || tests.some((t) => t.status === 'expected') });
    }
    for (const child of suite.suites ?? []) visit({ ...child, file: child.file || suite.file });
  };
  for (const suite of report.suites ?? []) visit(suite);
  return [...status]
    .filter(([, s]) => s.ok && s.ran) // a figure whose tests were all skipped has not passed
    .map(([id]) => id)
    .sort();
}

/**
 * Writes a marker for each figure that passed, and removes markers that no figure in this checkout has any more (so the
 * saved folder stays small). Returns { written, pruned }.
 */
export function recordPassed({ root, ids, passed, markersDir }) {
  fs.mkdirSync(markersDir, { recursive: true });
  const harness = hashPaths(root, TEST_HARNESS);
  const current = new Map(ids.map((id) => [testHash(id, { root, harness }), id]));
  let written = 0;
  for (const id of passed) {
    if (!ids.includes(id)) continue;
    const file = markerFile(markersDir, testHash(id, { root, harness }));
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, `${id}\n`);
      written++;
    }
  }
  let pruned = 0;
  for (const name of fs.readdirSync(markersDir)) {
    if (!current.has(name)) {
      fs.rmSync(path.join(markersDir, name), { force: true });
      pruned++;
    }
  }
  return { written, pruned };
}
