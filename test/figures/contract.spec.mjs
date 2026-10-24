// The figure contract, for every figure: it gets ready, answers ping with its id and version, answers every
// command its manifest lists, captures a real picture, exports a GLB when it says it does, and never errors or
// reaches the internet.
import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';
import { inspectPng, openFigure, preparePage } from '../../scripts/lib/export/driver.mjs';
import { figuresUnderTest } from './figures.mjs';

// Commands that start something long-lived (a tour, the test); they are covered by figure-specific tests.
const SKIP = new Set(['tour', 'practice', 'play']);

for (const { id, manifest } of figuresUnderTest()) {
  if (!/\.html?$/.test(manifest.entry || 'index.html')) continue; // a bare GLB has no page to test
  test(`${id}: bridge contract`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 640 });
    const log = await preparePage(page);
    const fig = await openFigure(page, id);

    expect(await fig.call('ping')).toEqual({ asset: id, version: manifest.version });

    const seen = new Set();
    for (const c of manifest.commands || []) {
      if (SKIP.has(c.name) || c.name === 'capture' || c.name === 'export-glb') continue;
      await test.step(`${c.name} ${JSON.stringify(c.payload || {})}`, async () => {
        await fig.call(c.name, c.payload || {});
        seen.add(c.name);
      });
    }

    await test.step('capture', async () => {
      const png = inspectPng(await fig.call('capture', { width: 400, height: 250 }), PNG);
      expect({ width: png.width, height: png.height }).toEqual({ width: 400, height: 250 });
      expect(png.blank, 'the capture is one flat colour').toBe(false);
    });

    if (Array.isArray(manifest.export?.glb)) {
      await test.step('export-glb', async () => {
        const glb = await fig.call('export-glb', {});
        const bytes = Buffer.from(glb.base64 ?? '', 'base64');
        expect(bytes.subarray(0, 4).toString('latin1'), 'GLB magic').toBe('glTF');
        expect(bytes.length).toBeGreaterThan(1000);
      });
    }

    await fig.advance(500);
    expect(log.errors).toEqual([]);
    expect(log.external).toEqual([]);
    expect(log.failed).toEqual([]);
  });
}
