#!/usr/bin/env node
// Claude Code PostToolUse hook (.claude/settings.json): after an Edit or Write inside a figure, run the fast checks
// for that figure and, if something is wrong, tell the agent at once (exit code 2 sends stderr back to it).
// Reads the hook's JSON from stdin; silent and successful for files outside assets/ and templates/.
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS_DIR, ROOT } from '../lib/paths.mjs';
import { runChecks } from './index.mjs';

let input = '';
for await (const chunk of process.stdin) input += chunk;
let file = '';
try {
  const data = JSON.parse(input || '{}');
  file = data.tool_input?.file_path || data.tool_input?.path || '';
} catch {
  process.exit(0);
}
const rel = path.relative(ROOT, path.resolve(file));
const m = /^assets\/([^/]+)\//.exec(rel);
const isTemplate = rel.startsWith('templates/');
if ((!m || !fs.existsSync(path.join(ASSETS_DIR, m[1], 'asset.json'))) && !isTemplate) process.exit(0);

const results = await runChecks({ ids: m ? [m[1]] : [], repo: isTemplate });
const errors = results.filter((r) => r.level === 'error' && (isTemplate ? r.rule === 'templates' : true));
if (!errors.length) process.exit(0);
console.error(`npm run check found problems in ${m ? m[1] : 'the templates'} after this edit:`);
for (const e of errors) console.error(`  ${e.file ? `${e.file}: ` : ''}${e.message}  [${e.rule}]`);
console.error('Fix them before going on (npm run check -- --fix fixes formatting and generated sections).');
process.exit(2);
