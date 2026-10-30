#!/usr/bin/env node
// Turns the report of `library:sync` into Markdown for a pull request comment or the job summary, and says whether the
// workflow should fail (docs/ci-library-sync.md). Reads only the report file: no library, no token.
//
//   node scripts/ci/library-summary.mjs <report.json> [--fail-on blocked,failed] [--heading "Library plan"]
//
// Prints Markdown on stdout. Exit 1 when a figure is in one of the --fail-on states, 2 when the report cannot be read.
//   States: the sync's categories (new, changed, repair, unchanged, withdraw, blocked), results (failed, not-withdrawn) and `library` (a shared library missing or not published).
import fs from 'node:fs';
import { parseArgs } from 'node:util';

const CATEGORIES = ['new', 'changed', 'repair', 'unchanged', 'withdraw', 'blocked'];

/** The states one figure is in: its category and, when the sync ran, its result. */
export function statesOf(figure) {
  return [figure.category, figure.result].filter(Boolean);
}

/** Shared libraries in a state that fails: those an apply could not publish, or (dry run) those the library is missing. State `library`. */
export function libraryOffenders(report, failOn) {
  if (!failOn.includes('library')) return [];
  return (report.mode === 'apply' ? report.libraries?.failed : report.libraries?.missing) ?? [];
}

/** The figures in any of the given states. */
export function offenders(report, failOn) {
  const wanted = new Set(failOn);
  return report.figures.filter((f) => statesOf(f).some((s) => wanted.has(s)));
}

const cell = (text) =>
  String(text ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ');

/** Markdown for the report: the counts, the figures that are not unchanged, the notes. */
export function summarize(report, { heading = 'Library sync', failOn = [] } = {}) {
  const lines = [`### ${heading}`, ''];
  const where = report.library ? `\`${report.library}\`` : 'no library (an empty one)';
  lines.push(
    `${report.mode === 'apply' ? 'Published to' : 'Planned against'} ${where}, tier \`${report.tier}\`, commit \`${String(report.commit ?? '').slice(0, 8)}\`.`,
    '',
  );
  lines.push(CATEGORIES.map((c) => `**${report.counts?.[c] ?? 0}** ${c}`).join(' · '), '');

  const shown = report.figures.filter((f) => f.category !== 'unchanged' || f.result === 'failed');
  if (shown.length) {
    lines.push('| Figure | Version | What | Result | Why |', '|---|---|---|---|---|');
    for (const f of shown) {
      const why = f.error ?? [...(f.reasons ?? []), ...(f.warnings ?? [])].join('; ');
      lines.push(`| \`${cell(f.id)}\` | ${cell(f.version)} | ${cell(f.category)} | ${cell(f.result)} | ${cell(why)} |`);
    }
    lines.push('');
  } else lines.push('Every figure is already in the library, unchanged.', '');

  for (const n of report.notes ?? []) lines.push(`- ${n}`);
  if (report.notes?.length) lines.push('');

  const badLibraries = libraryOffenders(report, failOn);
  if (badLibraries.length)
    lines.push(
      `**Fails:** shared ${badLibraries.length > 1 ? 'libraries' : 'library'} ${badLibraries.map((s) => `\`${s}\``).join(', ')} (library).`,
      '',
    );
  const bad = offenders(report, failOn);
  if (bad.length)
    lines.push(
      `**Fails:** ${bad
        .map(
          (f) =>
            `\`${f.id}\` (${statesOf(f)
              .filter((s) => failOn.includes(s))
              .join(', ')})`,
        )
        .join(', ')}.`,
      '',
    );
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values, positionals } = parseArgs({
    options: { 'fail-on': { type: 'string', default: '' }, heading: { type: 'string', default: 'Library sync' } },
    allowPositionals: true,
  });
  let report;
  try {
    report = JSON.parse(fs.readFileSync(positionals[0], 'utf8'));
    if (!Array.isArray(report.figures)) throw new Error('not a sync report');
  } catch (err) {
    console.error(`library-summary: cannot read ${positionals[0] ?? '(no file given)'}: ${err.message}`);
    process.exit(2);
  }
  const failOn = values['fail-on']
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  console.log(summarize(report, { heading: values.heading, failOn }));
  process.exit(offenders(report, failOn).length || libraryOffenders(report, failOn).length ? 1 : 0);
}
