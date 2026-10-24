#!/usr/bin/env node
// Writes the parts of each figure's README that come from its asset.json, between markers, so they never drift:
//   <!-- generated:params (npm run docs) -->  …  <!-- /generated:params -->   URL parameters table
//   <!-- generated:bridge (npm run docs) -->  …  <!-- /generated:bridge -->   commands and events
//
//   npm run docs                  all figures
//   npm run docs -- screw-gauge   one figure
// A README without the markers is left alone. `npm run check` fails when a marked section is out of date.
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS_DIR } from './lib/paths.mjs';

const esc = (s) =>
  String(s ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');
const code = (s) => (s === '' || s == null ? '' : `\`${esc(s)}\``);

function paramsTable(params = []) {
  if (!params.length) return 'This figure reads no URL parameters.';
  const rows = params.map((p) => {
    const values =
      p.type === 'select'
        ? p.options.map((o) => (Array.isArray(o) ? `${code(o[0]) || '(empty)'} ${esc(o[1])}` : code(o))).join(' · ')
        : p.type === 'boolean'
          ? '`1` · `0`'
          : p.type;
    return `| \`${p.name}\` | ${esc(p.label || '')}${p.help ? ` (${esc(p.help)})` : ''} | ${values} | ${code(p.default)} |`;
  });
  return ['| Param | Meaning | Values | Default |', '|---|---|---|---|', ...rows].join('\n');
}

function bridgeTables(manifest) {
  const seen = new Map();
  for (const c of manifest.commands || []) if (!seen.has(c.name)) seen.set(c.name, c.payload || {});
  const commands = [...seen].map(([name, payload]) => `| \`${name}\` | \`${esc(JSON.stringify(payload))}\` |`);
  const events = (manifest.events || []).map((e) => `\`${e}\``).join(', ');
  return [
    'Every figure answers `ping` with `{ asset, version }`. Send commands with `figure.call(name, payload)` (see `shared/lib/host.js`).',
    '',
    '| Command | Example payload |',
    '|---|---|',
    ...commands,
    '',
    `Events: ${events || 'none'}.`,
  ].join('\n');
}

/** { params, bridge } section bodies for a manifest. */
export const readmeSections = (manifest) => ({ params: paramsTable(manifest.params), bridge: bridgeTables(manifest) });

/** The README text with every marked section replaced by its generated body. */
export function applySections(text, sections) {
  return text.replace(/(<!-- generated:(\w+)[^>]*-->)[\s\S]*?(<!-- \/generated:\2 -->)/g, (m, open, name, close) =>
    name in sections ? `${open}\n${sections[name]}\n${close}` : m,
  );
}

/** Figures whose README has marked sections that are out of date. */
export function staleReadmes(ids) {
  const stale = [];
  for (const id of ids) {
    const file = path.join(ASSETS_DIR, id, 'README.md');
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(ASSETS_DIR, id, 'asset.json'), 'utf8'));
    if (applySections(text, readmeSections(manifest)) !== text) stale.push(id);
  }
  return stale;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const { allFigures } = await import('./check/index.mjs');
  const named = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  for (const id of named.length ? named : allFigures()) {
    const file = path.join(ASSETS_DIR, id, 'README.md');
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(ASSETS_DIR, id, 'asset.json'), 'utf8'));
    const next = applySections(text, readmeSections(manifest));
    if (next !== text) {
      fs.writeFileSync(file, next);
      console.log(`✓ ${id}: README sections updated`);
    } else console.log(`· ${id}: up to date${text.includes('<!-- generated:') ? '' : ' (no generated sections)'}`);
  }
}
