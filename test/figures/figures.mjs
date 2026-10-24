// Which figures the browser tests cover: all of them, or FIGURES=a,b (CI passes the changed ones).
import { allFigures } from '../../scripts/check/index.mjs';
import { readFigureManifest } from '../../scripts/lib/export/driver.mjs';

export function figuresUnderTest() {
  const all = allFigures();
  const wanted = (process.env.FIGURES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const id of wanted) if (!all.includes(id)) throw new Error(`FIGURES: no figure "${id}"`);
  return (wanted.length ? wanted : all).map((id) => ({ id, manifest: readFigureManifest(id) }));
}

/** The viewports every figure must work in (phones portrait and landscape, book frames, desktop). */
export const VIEWPORTS = [
  { width: 390, height: 700 },
  { width: 390, height: 520 },
  { width: 844, height: 390 },
  { width: 640, height: 400 },
  { width: 800, height: 500 },
  { width: 1280, height: 800 },
];
