// The exporter: makes the deliverables of one figure from the files in this checkout, in headless Chromium with the
// virtual clock (so the same commit gives the same pictures and frames).
//
//   zip      the handoff folder and zip (scripts/lib/package.mjs)
//   images   poster.png (1600×1000), poster-800x500.webp, thumb-400x250.webp, phone-780x1400.png,
//            render-1600x1000.png (the 3D alone, transparent)
//   glb      <id>.glb (+ <id>-<pose>.glb), validated (Khronos) and cleaned (dedup, prune, weld)
//   video    <id>-1280x720.mp4 (H.264) + its first frame as video-poster.png
//
// What to show comes from asset.json "export" (docs/manifest.md). Progress goes to `onProgress({ step, done, total })`.
import { spawn, execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import { freeBytes } from '../fsutil.mjs';
import { MIN_FREE_BYTES } from '../release.mjs';
import { packageAsset } from '../package.mjs';
import { gitInfo } from '../git.mjs';
import { bookRef } from '../books.mjs';
import { ROOT, SHARED_DIR, assetDir as readFigureDir } from '../paths.mjs';
import { serveStatic } from '../static-server.mjs';
import { CHROMIUM_ARGS, inspectPng, openFigure, preparePage, readFigureManifest } from './driver.mjs';
import { glbInfo, optimizeGlb, validateGlb } from './glb.mjs';

export const FORMATS = ['zip', 'images', 'glb', 'video'];
export const DEFAULT_FORMATS = ['zip', 'images', 'glb'];
export { MIN_FREE_BYTES };
const VIDEO = { width: 1280, height: 720, fps: 30 };

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const readText = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : null);

function ffmpegVersion() {
  try {
    return execFileSync('ffmpeg', ['-version'], { encoding: 'utf8' }).split('\n')[0];
  } catch {
    return null;
  }
}

/**
 * Runs ffmpeg with `args`; `input` (a Buffer) or a writable stdin via `feed(stdin)`.
 * @param {string[]} args
 * @param {{ input?: Buffer, feed?: (stdin: import('node:stream').Writable) => Promise<void> }} [options]
 */
function ffmpeg(args, { input, feed } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', (e) => reject(new Error(`ffmpeg could not start (${e.message}): install ffmpeg to export pictures and video`)));
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg failed (${code}): ${err.trim()}`))));
    if (feed)
      feed(p.stdin).then(
        () => p.stdin.end(),
        (e) => (p.kill(), reject(e)),
      );
    else p.stdin.end(input);
  });
}

/** A page with the figure in the harness, set up as `spec` says ({ params, setup }). */
async function openState(browser, baseUrl, id, { viewport, scale = 1, params = {}, setup = [] }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale });
  const page = await context.newPage();
  const log = await preparePage(page);
  const fig = await openFigure(page, id, { base: baseUrl, params });
  for (const step of setup) await fig.call(step.command, step.payload || {});
  await fig.advance(1500); // let animations started by the setup finish
  return { context, page, fig, log };
}

async function images({ browser, baseUrl, id, manifest, out, progress }) {
  const poster = manifest.export?.poster || {};
  /** @type {Array<Record<string, any>>} */
  const files = [];
  const shots = [
    { name: 'poster.png', viewport: { width: 800, height: 500 }, scale: 2 },
    { name: 'phone-780x1400.png', viewport: { width: 390, height: 700 }, scale: 2 },
  ];
  for (const [i, s] of shots.entries()) {
    progress('images', i, shots.length + 1);
    const { context, page, fig, log } = await openState(browser, baseUrl, id, { ...s, params: poster.params, setup: poster.setup });
    try {
      const png = await page.screenshot();
      if (inspectPng(`data:image/png;base64,${png.toString('base64')}`, PNG).blank) throw new Error(`${s.name} came out blank`);
      if (log.errors.length) throw new Error(`errors while drawing ${s.name}: ${log.errors.join('; ')}`);
      fs.writeFileSync(path.join(out, s.name), png);
      files.push({ name: s.name, kind: 'image', width: s.viewport.width * s.scale, height: s.viewport.height * s.scale });
      if (s.name === 'poster.png') {
        const render = await fig.call('capture', { width: 1600, height: 1000, background: null }).catch(() => null);
        if (render) {
          fs.writeFileSync(path.join(out, 'render-1600x1000.png'), Buffer.from(render.split(',')[1], 'base64'));
          files.push({ name: 'render-1600x1000.png', kind: 'image', width: 1600, height: 1000, transparent: true });
        }
      }
    } finally {
      await context.close();
    }
  }
  progress('images', shots.length, shots.length + 1);
  for (const [name, w, h] of /** @type {Array<[string, number, number]>} */ ([
    ['poster-800x500.webp', 800, 500],
    ['thumb-400x250.webp', 400, 250],
  ])) {
    await ffmpeg([
      '-i',
      path.join(out, 'poster.png'),
      '-vf',
      `scale=${w}:${h}:flags=lanczos`,
      '-c:v',
      'libwebp',
      '-quality',
      '86',
      path.join(out, name),
    ]);
    files.push({ name, kind: 'image', width: w, height: h });
  }
  return files;
}

async function glbs({ browser, baseUrl, id, manifest, out, progress }) {
  const poses = Array.isArray(manifest.export?.glb) ? manifest.export.glb : manifest.type === 'model' ? [{ name: 'default' }] : [];
  /** @type {Array<Record<string, any>>} */
  const files = [];
  for (const [i, pose] of poses.entries()) {
    progress('glb', i, poses.length);
    const { context, fig } = await openState(browser, baseUrl, id, { viewport: { width: 800, height: 500 }, params: pose.params, setup: pose.setup });
    try {
      const answer = await fig.call('export-glb', {});
      const raw = Buffer.from(answer.base64 ?? '', 'base64');
      const before = await validateGlb(raw);
      if (before.errors)
        throw new Error(
          `invalid GLB from ${id} (${pose.name}): ${before.messages
            .filter((m) => m.severity === 0)
            .map((m) => m.code)
            .join(', ')}`,
        );
      const bytes = Buffer.from(await optimizeGlb(raw));
      const report = await validateGlb(bytes);
      if (report.errors)
        throw new Error(
          `the cleaned GLB is invalid: ${report.messages
            .filter((m) => m.severity === 0)
            .map((m) => m.code)
            .join(', ')}`,
        );
      const info = await glbInfo(bytes);
      const name = pose.name === 'default' ? `${id}.glb` : `${id}-${pose.name}.glb`;
      fs.writeFileSync(path.join(out, name), bytes);
      files.push({ name, kind: 'glb', pose: pose.name, sizeMetres: info.size, triangles: info.triangles, validatorWarnings: report.warnings });
    } finally {
      await context.close();
    }
  }
  progress('glb', poses.length, poses.length);
  return files;
}

async function video({ browser, baseUrl, id, manifest, out, progress }) {
  const spec = manifest.export?.video;
  if (!spec) return [];
  const fps = spec.fps || VIDEO.fps;
  const total = Math.round(spec.seconds * fps);
  const frameMs = 1000 / fps;
  const params = { ...(spec.params || {}), ...(spec.kind === 'timeline' ? { autoplay: '0' } : {}) };
  const { context, page, fig, log } = await openState(browser, baseUrl, id, {
    viewport: { width: VIDEO.width, height: VIDEO.height },
    params,
    setup: spec.setup,
  });
  const name = `${id}-${VIDEO.width}x${VIDEO.height}.mp4`;
  try {
    let next;
    if (spec.kind === 'timeline') {
      const seekable = (manifest.commands || []).some((c) => c.name === 'seek');
      if (seekable) next = async (i) => (await fig.call('seek', { t: i / fps }), fig.advance(frameMs, frameMs));
      else {
        await fig.call('play', {}).catch(() => {});
        next = (i) => (i === 0 ? Promise.resolve() : fig.advance(frameMs, frameMs));
      }
    } else if (spec.kind === 'script') {
      const steps = [...(spec.script || [])];
      next = async (i) => {
        const t = i / fps;
        while (steps.length && steps[0].at <= t + 1e-9) {
          const s = steps.shift();
          await page.evaluate(([type, payload]) => window.harness.start(type, payload), [s.command, s.payload || {}]); // don't wait: it plays out frame by frame
        }
        if (i > 0) await fig.advance(frameMs, frameMs);
      };
    } else {
      const state = await fig.call('get', {});
      const target = state.target || [0, 0, 0];
      const cam = state.camera || [0, 0, 5];
      const r = Math.hypot(cam[0] - target[0], cam[2] - target[2]);
      const a0 = Math.atan2(cam[0] - target[0], cam[2] - target[2]);
      next = async (i) => {
        const a = a0 + (2 * Math.PI * i) / total;
        await fig.call('set', { camera: [target[0] + r * Math.sin(a), cam[1], target[2] + r * Math.cos(a)], target, animate: false });
        await fig.advance(frameMs, frameMs);
      };
    }
    let first = null;
    await ffmpeg(
      [
        '-f',
        'image2pipe',
        '-framerate',
        String(fps),
        '-c:v',
        'png',
        '-i',
        '-',
        '-c:v',
        'libx264',
        '-preset',
        'slow',
        '-crf',
        '18',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        path.join(out, name),
      ],
      {
        feed: async (stdin) => {
          for (let i = 0; i < total; i++) {
            await next(i);
            const png = await page.screenshot();
            if (!first) first = png;
            if (!stdin.write(png)) await new Promise((r) => stdin.once('drain', r));
            if (i % 10 === 0) progress('video', i, total);
          }
        },
      },
    );
    if (log.errors.length) throw new Error(`errors while recording: ${log.errors.slice(0, 3).join('; ')}`);
    fs.writeFileSync(path.join(out, 'video-poster.png'), first);
    progress('video', total, total);
    return [
      { name, kind: 'video', width: VIDEO.width, height: VIDEO.height, fps, seconds: spec.seconds, frames: total },
      { name: 'video-poster.png', kind: 'image', width: VIDEO.width, height: VIDEO.height },
    ];
  } finally {
    await context.close();
  }
}

/**
 * Exports one figure into `out` (emptied first) and writes export.json there. Returns the export.json object.
 * `official` stamps it as a release (the caller checks status, tag and a clean tree).
 *
 * @param {string} id
 * @param {{ out: string, formats?: string[], official?: boolean, onProgress?: (p: { id: string, step: string, done: number, total: number }) => void,
 *           browser?: import('@playwright/test').Browser }} options
 */
export async function exportFigure(id, { out, formats = DEFAULT_FORMATS, official = false, onProgress = () => {}, browser: given }) {
  const unknown = formats.filter((f) => !FORMATS.includes(f));
  if (unknown.length) throw new Error(`unknown format(s): ${unknown.join(', ')} (use ${FORMATS.join(', ')})`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (freeBytes(path.dirname(out)) < MIN_FREE_BYTES)
    throw new Error(`less than ${MIN_FREE_BYTES / 1024 ** 3} GB free on the disk: free some space first`);
  const manifest = readFigureManifest(id);
  const isPage = /\.html?$/.test(manifest.entry || 'index.html');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const progress = (step, done, total) => onProgress({ id, step, done, total });
  /** @type {Array<Record<string, any>>} */
  const files = [];

  if (formats.includes('zip')) {
    progress('zip', 0, 1);
    const pkg = await packageAsset(id, { outDir: path.join(out, '.package') });
    const name = path.basename(pkg.zip);
    fs.renameSync(pkg.zip, path.join(out, name));
    fs.rmSync(path.join(out, '.package'), { recursive: true, force: true });
    files.push({ name, kind: 'zip', files: pkg.files });
    progress('zip', 1, 1);
  }
  const browserNeeded = isPage && formats.some((f) => f !== 'zip');
  let chromiumVersion = null;
  if (browserNeeded) {
    const browser = given || (await chromium.launch({ args: CHROMIUM_ARGS }));
    chromiumVersion = browser.version();
    const server = await serveStatic(ROOT);
    const ctx = { browser, baseUrl: server.url, id, manifest, out, progress };
    try {
      if (formats.includes('images')) files.push(...(await images(ctx)));
      if (formats.includes('glb')) files.push(...(await glbs(ctx)));
      if (formats.includes('video')) files.push(...(await video(ctx)));
    } finally {
      await server.close();
      if (!given) await browser.close();
    }
  }
  for (const f of files) {
    const buf = fs.readFileSync(path.join(out, f.name));
    Object.assign(f, { bytes: buf.length, sha256: sha256(buf) });
  }
  const git = gitInfo([path.relative(ROOT, readFigureDir(id)), 'shared']);
  const record = {
    id,
    title: manifest.title,
    version: manifest.version,
    type: manifest.type,
    book: manifest.book,
    page: manifest.page ?? null,
    topic: manifest.topic || '',
    ref: bookRef(manifest),
    placement: manifest.placement || '',
    official,
    commit: git?.commit || null,
    uncommitted: Boolean(git?.dirty),
    exportedAt: new Date().toISOString(),
    tools: {
      kit: readText(path.join(SHARED_DIR, 'lib/VERSION')),
      three: readText(path.join(SHARED_DIR, 'vendor/three/VERSION')),
      chromium: chromiumVersion,
      ffmpeg: formats.some((f) => f === 'images' || f === 'video') ? ffmpegVersion() : null,
      node: process.version,
    },
    files,
  };
  fs.writeFileSync(path.join(out, 'export.json'), `${JSON.stringify(record, null, 2)}\n`);
  return record;
}
