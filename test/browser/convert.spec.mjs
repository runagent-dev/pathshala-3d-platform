// The model converter (shared/lib/import/convert.js) in the browser, on the test models in test/fixtures/models.
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { validateGlb } from '../../scripts/lib/export/glb.mjs';

const DIR = path.join(import.meta.dirname, '..', 'fixtures', 'models');
const load = (...names) => names.map((name) => ({ name, base64: fs.readFileSync(path.join(DIR, name)).toString('base64') }));

const CASES = [
  {
    name: 'OBJ + MTL + texture, millimetres',
    files: ['box.obj', 'box.mtl', 'checker.png'],
    opts: { units: 'mm' },
    size: [0.02, 0.02, 0.02],
    textures: 1,
  },
  { name: 'the same OBJ in a zip', files: ['box-obj.zip'], opts: { units: 'mm' }, size: [0.02, 0.02, 0.02], textures: 1 },
  { name: 'STL, millimetres, Z up', files: ['tetra.stl'], opts: { units: 'mm', up: 'z' }, size: [0.04, 0.06, 0.035], textures: 0 },
  { name: 'glTF + bin + texture', files: ['cube.gltf', 'cube.bin', 'checker.png'], opts: {}, size: [0.1, 0.1, 0.1], textures: 1 },
];

test.describe('model converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/converter.html');
    await page.waitForFunction(() => /** @type {any} */ (window).converterReady);
  });

  for (const c of CASES) {
    test(c.name, async ({ page }) => {
      const r = await page.evaluate(([files, opts]) => /** @type {any} */ (window).convert(files, opts), [load(...c.files), c.opts]);
      expect(r.warnings).toEqual([]);
      expect(r.stats.size.map((v) => +v.toFixed(3))).toEqual(c.size);
      expect(r.stats.textures).toBe(c.textures);
      const report = await validateGlb(Buffer.from(r.glb, 'base64'));
      expect(report.errors).toBe(0);
    });
  }

  test('warns about files the model refers to but which were not given', async ({ page }) => {
    const r = await page.evaluate((files) => /** @type {any} */ (window).convert(files, { units: 'mm' }), load('box.obj'));
    expect(r.warnings.join(' ')).toContain('box.mtl');
  });

  test('refuses a set of files without a 3D file', async ({ page }) => {
    const err = await page.evaluate(
      (files) =>
        /** @type {any} */ (window).convert(files, {}).then(
          () => '',
          (e) => e.message,
        ),
      load('checker.png'),
    );
    expect(err).toContain('no 3D file');
  });
});
