import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { cssUrls, figureGraph, htmlRefs, jsSpecifiers, licenceFiles, stripJsComments } from '../../scripts/lib/depgraph.mjs';
import { ROOT, tempDir } from '../helpers.mjs';

const specs = (src) => jsSpecifiers(src).map((s) => s.spec);

describe('stripJsComments', () => {
  it('removes line and block comments', () => {
    assert.equal(stripJsComments('a; // x\nb; /* y */ c').replace(/\s+/g, ' ').trim(), 'a; b; c');
  });
  it('keeps // and /* inside strings and template literals', () => {
    const src = "const u = 'https://x.org/a'; const t = `/* not a comment */`;";
    assert.equal(stripJsComments(src), src);
  });
  it('keeps regular expressions that contain quotes or slashes', () => {
    const src = "const r = /['\"]/g; const s = /\\/\\//; const x = 'ok';";
    assert.equal(stripJsComments(src), src);
  });
  it('keeps line numbers', () => {
    assert.equal(stripJsComments('a;\n/* one\ntwo\nthree */\nb;').split('\n').length, 5);
  });
  it('does not mistake division for a regular expression', () => {
    assert.equal(stripJsComments('const a = b / c; // comment').trim(), 'const a = b / c;');
  });
});

describe('jsSpecifiers', () => {
  it('finds static, re-export, dynamic and import.meta.url loads', () => {
    const src = `import * as THREE from 'three';
import { a } from "./a.js";
import './side-effect.js';
export { b } from './b.js';
export * from './c.js';
const m = await import('./d.js');
const url = new URL('./model.glb', import.meta.url);`;
    assert.deepEqual(specs(src), ['three', './a.js', './side-effect.js', './b.js', './c.js', './d.js', './model.glb']);
  });
  it('reads minified code', () => {
    assert.deepEqual(specs('import{a as b}from"./three.core.min.js";export{c}from"./x.js";'), ['./three.core.min.js', './x.js']);
  });
  it('ignores imports in comments and plain strings', () => {
    const src = "/** @example import { M } from 'https://cdn.example/x.js'; */\nconsole.warn('loaded from \"srgb-linear\"');";
    assert.deepEqual(specs(src), []);
  });
});

describe('cssUrls and htmlRefs', () => {
  it('finds @import and url()', () => {
    assert.deepEqual(cssUrls('@import url(\'a.css\'); @import "b.css"; .x { background: url(img/c.png) } /* url(no.png) */'), [
      'a.css',
      'b.css',
      'img/c.png',
    ]);
  });
  it('reads the import map, scripts, stylesheets and inline modules', () => {
    const html = `<link rel="stylesheet" href="./style.css"><!-- <script src="old.js"></script> -->
<script type="importmap">{ "imports": { "three": "../../shared/vendor/three/three.module.min.js" } }</script>
<script type="module" src="./src/main.js"></script><script type="module">import x from './inline.js';</script>`;
    const r = htmlRefs(html);
    assert.deepEqual(r.importMap, { three: '../../shared/vendor/three/three.module.min.js' });
    assert.deepEqual(r.urls.sort(), ['./src/main.js', './style.css']);
    assert.equal(r.inline.length, 1);
  });
});

describe('figureGraph', () => {
  it('walks the real figures without problems', () => {
    for (const id of ['vernier-caliper', 'si-prefixes', 'screw-gauge']) {
      const { files, problems } = figureGraph(path.join(ROOT, 'assets', id));
      assert.deepEqual(problems, [], id);
      assert.ok(
        [...files].some((f) => f.endsWith('three.core.min.js')),
        `${id} reaches three.core through three.module`,
      );
    }
  });
  it('reports missing, external, bare, absolute and outside references', () => {
    const dir = path.join(tempDir(), 'fig');
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'index.html'),
      `<script type="importmap">{ "imports": { "three": "https://cdn.example/three.js" } }</script><script type="module" src="./src/main.js"></script>`,
    );
    fs.writeFileSync(path.join(dir, 'src/main.js'), "import './missing.js';\nimport 'lodash';\nimport '/abs.js';\nimport '../../../etc/x.js';\n");
    const kinds = figureGraph(dir, 'index.html', { allowed: [dir] })
      .problems.map((p) => p.kind)
      .sort();
    assert.deepEqual(kinds, ['absolute', 'bare', 'external', 'missing', 'outside']);
  });
  it('licenceFiles adds three.js LICENSE and the font licence', () => {
    const { files } = figureGraph(path.join(ROOT, 'assets', 'screw-gauge'));
    const names = [...licenceFiles(files)].map((f) => path.relative(ROOT, f)).sort();
    assert.ok(names.includes('shared/vendor/three/LICENSE'));
    assert.ok(names.includes('shared/fonts/noto-sans-bengali/OFL.txt'));
  });
});
