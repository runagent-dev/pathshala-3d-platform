import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { bundleLab } from '../../scripts/lib/library/bundle-lab.mjs';
import { SHARED_DIR } from '../../scripts/lib/paths.mjs';
import { tempDir } from '../helpers.mjs';

// a 1×1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

function figure(source) {
  const assets = tempDir();
  const dir = path.join(assets, 'pic');
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'media'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'asset.json'), JSON.stringify({ id: 'pic', version: '0.1.0', type: 'interactive', entry: 'index.html' }));
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    '<!doctype html><html><head><title>t</title></head><body><script type="module" src="./src/main.js"></script></body></html>',
  );
  fs.writeFileSync(path.join(dir, 'media', 'dot.png'), PNG);
  fs.writeFileSync(path.join(dir, 'src', 'main.js'), source);
  return assets;
}
const build = (assetsDir) => bundleLab('pic', { assetsDir, sharedDir: SHARED_DIR, labId: 'org.example.pic', version: '0.1.0' });

describe('a lab inlines the files its code names with new URL(file, import.meta.url)', () => {
  it('turns an image next to the figure into a data: URL, so the sandbox (img-src data: blob:) can load it', async () => {
    const built = await build(figure("export const url = new URL('../media/dot.png', import.meta.url).href;\nconsole.log(url);\n"));
    assert.ok(built.html.includes(`data:image/png;base64,${PNG.toString('base64')}`));
    assert.ok(!built.html.includes('dot.png'));
    assert.deepEqual(built.errors, []);
  });

  it('leaves a directory, a missing file, a kind of file that is not inlined, and a non-relative address as they are', async () => {
    const source = [
      "console.log(new URL('../media/', import.meta.url).href);",
      "console.log(new URL('../media/gone.png', import.meta.url).href);",
      "console.log(new URL('../media/dot.bin', import.meta.url).href);",
      "console.log(new URL('/abs/dot.png', import.meta.url).href);",
    ].join('\n');
    const built = await build(figure(source));
    assert.ok(!built.html.includes('data:image/png'));
    assert.ok(built.html.includes('gone.png') && built.html.includes('dot.bin'));
  });
});
