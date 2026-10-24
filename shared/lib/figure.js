// Starting a figure: what every figure's src/main.js used to repeat. It reads the figure's own asset.json (so the
// id, version and URL parameters are written down once), waits for the Bangla font, creates the app and connects
// it to the book with the standard bridge commands.
//
//   import { startFigure } from '@shared/figure.js';
//   import { createApp } from './app.js';
//   await startFigure({ create: createApp, events: ['change'] });
//
// The app object `create(root, options, manifest)` returns may have: ready (Promise), getState(), set(p), reset(),
// capture({ width, height }), exportRoot() (the Object3D for GLB export), seek(t) + duration (animations),
// on(type, fn) (events).
import { createBridge } from './bridge.js';
import { exportGLB } from './export-glb.js';

/** The figure's asset.json, next to its page. */
export async function loadManifest(url = new URL('./asset.json', document.baseURI)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not read ${url} (${res.status}): every figure needs its asset.json next to index.html`);
  return res.json();
}

const OFF = ['0', 'false', 'no', 'off'];

/**
 * URL parameters, typed by the figure's "params" in asset.json ([{ name, type }]) or by { name: type }.
 * Only parameters present (and not empty) are returned, so defaults stay in the app.
 */
export function readParams(spec, search = location.search) {
  const q = new URLSearchParams(search);
  const types = Array.isArray(spec) ? Object.fromEntries(spec.map((p) => [p.name, p.type])) : spec;
  const out = {};
  for (const [name, type] of Object.entries(types)) {
    const raw = q.get(name);
    if (raw == null || raw === '') continue;
    if (type === 'number') {
      if (!Number.isNaN(Number(raw))) out[name] = Number(raw);
    } else if (type === 'boolean') out[name] = !OFF.includes(raw.toLowerCase());
    else out[name] = raw;
  }
  return out;
}

/** Waits (briefly) for the Bangla webfont, so text drawn into the 3D scene uses it. */
export function loadFonts({ weights = ['400', '500', '600', '700'], timeout = 2500 } = {}) {
  if (!document.fonts?.load) return Promise.resolve();
  const loads = weights.map((w) => document.fonts.load(`${w} 24px "Noto Sans Bengali"`, 'অআ০১২৩ab12')); // check:allow-bangla font sample, not shown
  return Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, timeout))]).catch(() => {});
}

/**
 * Connects an app to the book. Standard commands come from what the app has (get, set, reset, capture,
 * export-glb, seek, duration); `commands` adds or overrides. Every type in `events` is forwarded. Emits "ready"
 * with { asset, version, state } once app.ready resolves.
 */
export function connectFigure({ app, manifest, events = [], commands = {} }) {
  const asset = manifest.id;
  const version = manifest.version;
  const std = {};
  if (app.getState) std.get = () => app.getState();
  if (app.set) std.set = (p) => app.set(p);
  if (app.reset) std.reset = async () => (await app.reset(), app.getState?.());
  if (app.capture)
    std.capture = (/** @type {{ width?: number, height?: number, background?: string | null }} */ { width, height, background } = {}) =>
      app.capture({ width, height, background });
  if (app.exportRoot) {
    std['export-glb'] = () =>
      exportGLB(app.exportRoot(), {
        units: manifest.units || 'm',
        name: asset,
        extras: { pathshala: { id: asset, version, book: manifest.book, page: manifest.page ?? null, topic: manifest.topic || '' } },
      });
  }
  if (app.seek) {
    std.seek = ({ t = 0 } = {}) => (app.seek(Number(t)), app.getState?.());
    std.duration = () => app.duration;
  }
  const bridge = createBridge({ asset, version, commands: { ...std, ...commands } });
  for (const type of events) app.on?.(type, (payload) => bridge.emit(type, payload));
  Promise.resolve(app.ready).then(() => bridge.emit('ready', { asset, version, state: app.getState?.() }));
  return bridge;
}

/**
 * The whole start-up: manifest → URL parameters → font → app → bridge. `commands` may be a function of the app.
 * Returns { app, bridge, manifest, options }; the app is also window.figure, handy in the console.
 */
export async function startFigure({ create, events = [], commands = {}, root = document.getElementById('app') }) {
  const manifest = await loadManifest();
  const options = readParams(manifest.params || []);
  document.body.classList.add(`bg-${options.bg || 'light'}`);
  await loadFonts();
  const app = await create(root, options, manifest);
  const bridge = connectFigure({ app, manifest, events, commands: typeof commands === 'function' ? commands(app) : commands });
  Object.assign(window, { figure: app });
  return { app, bridge, manifest, options };
}
