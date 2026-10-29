#!/usr/bin/env node
// Reads the plan of `library:sync` and says what a publish run needs, as `work=` and `browser=` lines for $GITHUB_OUTPUT:
// work (is anything new, changed or to repair?) and browser (does any of it build a lab, poster, model or video, which
// needs Chromium?). A run with no work skips the publish and the Chromium install; one that only rewrites manifests skips Chromium.
//
//   node scripts/ci/library-work.mjs <plan.json>
import fs from 'node:fs';

const TODO = new Set(['new', 'changed', 'repair']);

/** What the plan asks for: { work, browser, figures }. */
export function workOf(report) {
  const todo = report.figures.filter((f) => TODO.has(f.category));
  const browser = todo.some((f) => f.build?.lab || f.build?.poster || f.build?.video || (f.build?.glb ?? []).length > 0);
  return { work: todo.length > 0, browser, figures: todo.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    if (!Array.isArray(report.figures)) throw new Error('not a sync report');
    const { work, browser, figures } = workOf(report);
    console.error(`library-work: ${figures} figure(s) to publish${browser ? ', Chromium needed' : ''}`);
    console.log(`work=${work}`);
    console.log(`browser=${browser}`);
  } catch (err) {
    console.error(`library-work: cannot read ${process.argv[2] ?? '(no file given)'}: ${err.message}`);
    process.exit(2);
  }
}
