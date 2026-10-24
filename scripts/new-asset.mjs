#!/usr/bin/env node
// Creates a new figure folder from a template.
//
//   npm run new -- --slug screw-gauge --title "Screw gauge (স্ক্রু-গেইজ)" --page 21 --topic 1.6.1 [--type interactive|animation|model] [--book physics-9-10]
//   npm run new -- screw-gauge "Screw gauge" --page 21 --topic 1.6.1        (same, shorter)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { scaffoldAsset } from './lib/scaffold.mjs';
import { DEFAULT_BOOK } from './lib/books.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const usage =
  'Usage: npm run new -- --slug <id> --title "<Title>" --page <n> --topic <1.6.1> [--type interactive|animation|model] [--book physics-9-10] [--placement "…"]';

const opts = {
  id: flag('slug'),
  title: flag('title'),
  page: flag('page'),
  topic: flag('topic') ?? '',
  placement: flag('placement') ?? '',
  book: flag('book') ?? DEFAULT_BOOK,
  type: flag('type') ?? (args.includes('--model') ? 'model' : args.includes('--animation') ? 'animation' : 'interactive'),
};
const [posId, posTitle] = args.filter((a) => !a.startsWith('--'));
opts.id ??= posId;
opts.title ??= posTitle;
if (!opts.id) {
  console.log(usage);
  process.exit(1);
}

// The person running this looks after the figure, if their GitHub username is set in git.
try {
  const gh = execFileSync('git', ['config', 'github.user'], { encoding: 'utf8' }).trim();
  if (gh) opts.maintainers = [gh];
} catch {}

try {
  const r = await scaffoldAsset(opts);
  console.log(`✓ Created ${r.dir}`);
  // the new figure's README tables and CODEOWNERS line
  const { generatedFiles } = await import('./generate.mjs');
  for (const g of generatedFiles()) fs.writeFileSync(g.file, g.content);
  const { applySections, readmeSections } = await import('./docs.mjs');
  const readme = path.join(r.dir, 'README.md');
  if (fs.existsSync(readme))
    fs.writeFileSync(
      readme,
      applySections(fs.readFileSync(readme, 'utf8'), readmeSections(JSON.parse(fs.readFileSync(path.join(r.dir, 'asset.json'), 'utf8')))),
    );
  console.log(`  Next: npm run dev, open http://127.0.0.1:4800/dashboard/#/${r.id}, then npm run verify -- ${r.id}`);
  if (!opts.maintainers) console.log('  Tip: run `git config --global github.user <your-github-name>` so new figures list you as maintainer.');
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}
