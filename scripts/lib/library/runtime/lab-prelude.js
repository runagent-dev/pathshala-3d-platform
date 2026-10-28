// The adapter that runs before a figure in a lab (the bundler puts it first; docs/library-sync.md). It makes a figure,
// which is written for an iframe of the book page, work as a Chalk lab (spec 1.1, the Host API) without changing the
// figure or the kit:
//
//   asset.json      the figure fetches its own asset.json; a lab has no network, so the file is served from the bundle
//   parameters      the figure reads its settings from the URL (location.search); the designer's settings (init.params),
//                   and the reader's language, are turned into that query before the figure starts
//   visibility      while the reader says the lab is off screen, animation frames are held, not run
//   reset           the reader's "start over" calls the figure's own reset command
//   ready           the figure's "ready" event tells the reader its first frame is up (it hides the poster)
//
// Opened on its own (no reader answers `hello` within the time below) the lab starts with the figure's defaults.
import { connectLab } from '@chalk-format/core/lab/client';

// replaced by the bundler: { id, version, manifest } (the figure's asset.json)
const LAB = __PATHSHALA_LAB__;
const ANSWER_WITHIN_MS = 1500;

const g = globalThis;
const lab = (g.__pathshalaLab = { search: '', session: null, commands: null, asset: null, hidden: false, onEvent: null });

// 1. asset.json
const realFetch = typeof g.fetch === 'function' ? g.fetch.bind(g) : null;
g.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : (input?.url ?? String(input));
  if (/(^|\/)asset\.json(\?|#|$)/.test(url))
    return Promise.resolve(new Response(JSON.stringify(LAB.manifest), { headers: { 'content-type': 'application/json' } }));
  return realFetch ? realFetch(input, init) : Promise.reject(new TypeError('a lab has no network'));
};

// 2. visibility: hold animation frames while hidden
const nativeRaf = g.requestAnimationFrame.bind(g);
const nativeCancel = g.cancelAnimationFrame.bind(g);
const held = new Map();
let heldId = 2 ** 30;
g.requestAnimationFrame = (cb) => {
  if (!lab.hidden) return nativeRaf(cb);
  heldId += 1;
  held.set(heldId, cb);
  return heldId;
};
g.cancelAnimationFrame = (id) => {
  if (!held.delete(id)) nativeCancel(id);
};
function setHidden(hidden) {
  lab.hidden = hidden;
  if (hidden) return;
  const callbacks = [...held.values()];
  held.clear();
  for (const cb of callbacks) nativeRaf(cb);
}

// 3. settings: the figure's declared parameters, from what the designer set, as the URL query the figure reads
function toQuery(session) {
  const q = new URLSearchParams();
  const declared = Array.isArray(LAB.manifest.params) ? LAB.manifest.params : [];
  const given = session?.params || {};
  for (const p of declared) {
    let v = given[p.name];
    if (v === undefined && p.name === 'lang' && session?.locale) {
      const language = String(session.locale).split('-')[0];
      const options = (p.options || []).map((o) => (Array.isArray(o) ? o[0] : o));
      if (options.includes(language)) v = language;
    }
    if (v === undefined || v === null || v === '') continue;
    q.set(p.name, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

let session = null;
try {
  session = await connectLab({ id: LAB.id, version: LAB.version }, { timeoutMs: ANSWER_WITHIN_MS, helloEveryMs: 100 });
} catch {
  // opened on its own: the figure's defaults
}
lab.session = session;
lab.search = toQuery(session);
if (session) {
  setHidden(!session.visible);
  session.on('visibility', (visible) => setHidden(!visible));
  session.on('reset', () => {
    Promise.resolve(lab.commands?.reset?.()).catch(() => {});
  });
  lab.onEvent = (type) => {
    if (type === 'ready') session.ready();
  };
}

export const labReady = Promise.resolve();
