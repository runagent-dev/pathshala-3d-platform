// Pathshala 3D Studio — dev dashboard. Talks to scripts/dev.mjs (/api/*, /__dev/events).
import { connectAsset } from '../shared/lib/host.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(`studio:${key}`);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`studio:${key}`, JSON.stringify(value));
    } catch {}
  },
};

const STATUS_LABEL = { idea: 'Idea', 'in-progress': 'In progress', review: 'Review', changes: 'Changes', approved: 'Approved' };
const TYPES = {
  interactive: { tag: '3D', short: 'Interactive', long: 'Interactive (three.js)' },
  animation: { tag: 'ANIM', short: 'Animation', long: 'Animation (plays by itself, three.js)' },
  model: { tag: 'GLB', short: 'Static GLB', long: 'Static model (GLB)' },
};
const typeOf = (a) => TYPES[a.type] || TYPES.interactive;

// Bangla: the Reviews tab always; for reviewers, everything they see.
const STATUS_BN = { idea: 'ভাবনা', 'in-progress': 'কাজ চলছে', review: 'রিভিউ চলছে', changes: 'সংশোধন দরকার', approved: 'অনুমোদিত' };
const TYPE_BN = { interactive: 'ইন্টারঅ্যাকটিভ', animation: 'অ্যানিমেশন', model: 'স্থির মডেল' };
const FRAME_BN = {
  fill: 'পুরো জায়গা',
  '1024x640': 'বইয়ের দুই পাতা',
  '800x500': 'বইয়ের কলাম',
  '640x400': 'ছোট জায়গা',
  '1180x820': 'আইপ্যাড আড়াআড়ি',
  '820x1180': 'আইপ্যাড খাড়া',
  '844x390': 'ফোন আড়াআড়ি',
  '390x844': 'ফোন খাড়া',
};
const bnDigits = (x) => String(x).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const agoBn = (ms) => {
  if (!ms) return '';
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'এইমাত্র';
  if (s < 3600) return `${bnDigits(Math.floor(s / 60))} মিনিট আগে`;
  if (s < 86400) return `${bnDigits(Math.floor(s / 3600))} ঘণ্টা আগে`;
  return new Date(ms).toLocaleDateString('bn-BD');
};
const SERVER_ERRORS_BN = {
  'Please give your name': 'আপনার নাম লিখুন',
  'Please write your feedback': 'আপনার মতামত লিখুন',
  'The picture must be a PNG, JPEG or WebP': 'ছবিটি যোগ করা গেল না',
  'The picture is too large (max 1 MB)': 'ছবিটি খুব বড়',
};
const bnError = (msg) => SERVER_ERRORS_BN[msg] || 'পাঠানো গেল না, আবার চেষ্টা করুন';
const bnUI = () => state.role === 'reviewer';
const tr = (en, bn) => (bnUI() ? bn : en);
const statusLabel = (s) => tr(STATUS_LABEL[s] || s, STATUS_BN[s] || s);
const typeShort = (a) => tr(typeOf(a).short, TYPE_BN[a.type] || TYPE_BN.interactive);
const ICON_CUBE = '<svg viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>';

const state = {
  assets: [],
  statuses: Object.keys(STATUS_LABEL),
  current: null, // full asset (with readme)
  filter: store.get('filter', 'all'),
  query: '',
  device: store.get('device', 'fill'),
  bg: store.get('bg', 'light'),
  inspector: store.get('inspector', true),
  tab: store.get('tab', 'info'),
  unseenEvents: 0,
  role: 'owner', // 'owner' | 'reviewer' (from /api/me)
  reviews: [],
  reviewFilter: store.get('reviewFilter', 'open'),
};
const OWNER_TABS = new Set(['info', 'params', 'notes', 'events', 'handoff']); // reviewers see only মতামত
const isOwner = () => state.role === 'owner';

const frame = $('#frame');
const conn = connectAsset(frame, { timeout: 20000 });

// ── API ───────────────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(`/api/${path}`, opts);
  const type = res.headers.get('content-type') || '';
  const body = type.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(body?.error || res.statusText);
  return body;
}

const timers = {}; // pending timeouts by name (toast, reload flash, param reload)
function later(name, fn, ms) {
  clearTimeout(timers[name]);
  timers[name] = setTimeout(fn, ms);
}

function toast(text, ms = 2200) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  later('toast', () => el.classList.remove('show'), ms);
}

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const timeAgo = (ms) => {
  if (!ms) return '';
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(ms).toLocaleDateString();
};

// ── library ───────────────────────────────────────────────────────────────────
async function loadAssets() {
  const data = await api('assets');
  state.assets = data.assets;
  state.statuses = data.statuses;
  state.books = data.books || [];
  renderBookOptions();
  renderFilters();
  renderList();
}

function renderFilters() {
  const counts = { all: state.assets.length };
  for (const a of state.assets) {
    counts[a.status] = (counts[a.status] || 0) + 1;
    counts[`type:${a.type}`] = (counts[`type:${a.type}`] || 0) + 1;
  }
  const items = [['all', tr('All', 'সব')], ...state.statuses.filter((s) => counts[s]).map((s) => [s, statusLabel(s)])];
  counts.reviews = state.assets.filter((a) => a.reviews?.open).length;
  if (counts.reviews) items.push(['reviews', tr('Open reviews', 'বাকি মতামত')]);
  const types = Object.keys(TYPES).filter((k) => counts[`type:${k}`]);
  if (types.length > 1) items.push(...types.map((k) => [`type:${k}`, tr(TYPES[k].short, TYPE_BN[k])]));
  $('#filters').innerHTML = items
    .map(
      ([k, label]) =>
        `<button class="chip ${state.filter === k ? 'on' : ''}" data-f="${k}">${label} <span>${tr(counts[k] || 0, bnDigits(counts[k] || 0))}</span></button>`,
    )
    .join('');
}

/** "p. 20 · 1.6": where the figure goes in the book. */
function bookRef(a, long = false) {
  const parts = [];
  const bn = bnUI();
  const n = (x) => (bn ? bnDigits(x) : x);
  if (a.page != null && a.page !== '') parts.push(long ? `${bn ? 'পৃষ্ঠা' : 'Page'} ${n(a.page)}` : `${bn ? 'পৃ.' : 'p.'} ${n(a.page)}`);
  if (a.topic) parts.push(long ? `${bn ? 'অনুচ্ছেদ' : 'Topic'} ${n(a.topic)}` : n(a.topic));
  return parts.join(' · ');
}

function visibleAssets() {
  const q = state.query.trim().toLowerCase();
  return state.assets.filter((a) => {
    if (state.filter === 'reviews') {
      if (!a.reviews?.open) return false;
    } else if (state.filter.startsWith('type:') ? a.type !== state.filter.slice(5) : state.filter !== 'all' && a.status !== state.filter)
      return false;
    if (!q) return true;
    return [a.id, a.title, a.book, a.chapter?.title?.bn, a.chapter?.title?.en, bookRef(a), a.page != null ? `p${a.page}` : '', ...(a.tags || [])]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}

function renderList() {
  const list = visibleAssets();
  $('#assetList').innerHTML = list.length
    ? list
        .map(
          (a) => `<li class="asset-item ${state.current?.id === a.id ? 'active' : ''}" data-id="${a.id}">
        <div class="asset-thumb" style="${a.thumbnail ? `background-image:url('${a.thumbnail}')` : ''}">${a.thumbnail ? '' : ICON_CUBE}</div>
        <div>
          <div class="asset-name">${escapeHtml(a.title || a.id)}</div>
          <div class="asset-sub">${bookRef(a) ? `<span class="book-tag">${escapeHtml(bookRef(a))}</span>` : ''}<span class="pill" data-s="${a.status}">${statusLabel(a.status)}</span>
          <span class="type-tag">${typeOf(a).tag}</span>${a.reviews?.open ? `<span class="rev-tag" title="${tr('Open reviews', 'বাকি মতামত')}">${tr(`${a.reviews.open} open`, `${bnDigits(a.reviews.open)}টি বাকি`)}</span>` : ''}${a.notesLength ? '<span class="notes-mark" title="Has notes">✎</span>' : ''}</div>
        </div></li>`,
        )
        .join('')
    : `<li class="hint" style="padding:12px">No assets match.</li>`;
}

// ── selection & preview ──────────────────────────────────────────────────────
function paramState(asset) {
  return store.get(`params:${asset.id}`, {});
}

function buildUrl(asset) {
  const qs = new URLSearchParams();
  const values = paramState(asset);
  for (const p of asset.params || []) {
    const v = values[p.name];
    if (v !== undefined && v !== '' && String(v) !== String(p.default ?? '')) qs.set(p.name, v);
  }
  const base = asset.entryUrl;
  const q = qs.toString();
  return q ? `${base}${base.includes('?') ? '&' : '?'}${q}` : base;
}

async function selectAsset(id, { keepFrame = false } = {}) {
  if (!id) return;
  let asset;
  try {
    asset = await api(`assets/${id}`);
  } catch (err) {
    toast(err.message);
    return;
  }
  const changed = state.current?.id !== id;
  state.current = asset;
  store.set('last', id);
  if (location.hash !== `#/${id}`) history.replaceState(null, '', `#/${id}`);
  $('#empty').hidden = true;
  $('#frameWrap').hidden = false;
  renderList();
  renderHeader();
  renderInfo();
  renderParams();
  renderHandoff();
  if (changed) {
    if (isOwner()) loadNotes();
    clearEvents();
    loadReviews();
  }
  if (!keepFrame || changed) loadFrame();
}

function loadFrame() {
  const url = buildUrl(state.current);
  frame.src = url;
  $('#openBtn').href = url;
  $('#paramUrl').textContent = url;
}

function reloadFrame(flash = false) {
  if (!state.current) return;
  frame.src = buildUrl(state.current);
  if (flash) {
    const el = $('#reloadFlash');
    el.classList.add('show');
    later('reloadFlash', () => el.classList.remove('show'), 1200);
  }
}

function renderHeader() {
  const a = state.current;
  $('#assetTitle').textContent = a.title || a.id;
  $('#assetMeta').innerHTML = [
    bookRef(a) ? `<b class="book-ref">${escapeHtml(bookRef(a, true))}</b>` : '',
    `<span class="pill" data-s="${a.status}">${statusLabel(a.status)}</span>`,
    typeShort(a),
    a.version && !bnUI() ? `v${escapeHtml(a.version)}` : '', // version and folder are for the owner
    bnUI() ? '' : `<code>assets/${a.id}/</code>`,
    a.updatedAt ? tr(`edited ${timeAgo(a.updatedAt)}`, `${agoBn(a.updatedAt)} বদলানো`) : '',
  ]
    .filter(Boolean)
    .join('<span>·</span>');
}

// ── phone layout: drawers ─────────────────────────────────────────────────────
// Below 820 px the preview fills the screen and the asset list / side panel slide in over it.
const phone = matchMedia('(max-width: 820px)');
function setDrawer(name) {
  state.drawer = phone.matches ? name : null;
  $('#shell').dataset.drawer = state.drawer || '';
  $('#scrim').hidden = !state.drawer;
}
phone.addEventListener('change', () => {
  setDrawer(null);
  applyDevice();
});

// ── device frames ─────────────────────────────────────────────────────────────
function applyDevice() {
  const wrap = $('#frameWrap');
  const sizeLabel = $('#frameSize');
  $('#deviceSelect').value = state.device;
  if (state.device === 'fill' || phone.matches) {
    // on a phone the phone is the frame
    wrap.classList.remove('sized');
    wrap.style.transform = '';
    sizeLabel.textContent = '';
    return;
  }
  const [w, h] = state.device.split('x').map(Number);
  wrap.classList.add('sized');
  wrap.style.setProperty('--fw', `${w}px`);
  wrap.style.setProperty('--fh', `${h}px`);
  const box = $('#preview').getBoundingClientRect();
  const scale = Math.min(1, (box.width - 36) / w, (box.height - 56) / h);
  wrap.style.transform = `scale(${scale})`;
  sizeLabel.textContent = `${w}×${h}${scale < 1 ? ` · shown at ${Math.round(scale * 100)}%` : ''}`;
}
new ResizeObserver(applyDevice).observe($('#preview'));

function applyBg() {
  const p = $('#preview');
  p.classList.remove('bg-checker', 'bg-dark', 'bg-light');
  p.classList.add(`bg-${state.bg}`);
  $$('#bgSeg button').forEach((b) => b.classList.toggle('on', b.dataset.bg === state.bg));
}

function applyInspector() {
  $('#shell').classList.toggle('no-inspector', !state.inspector);
  $('#panelBtn').classList.toggle('on', state.inspector);
  requestAnimationFrame(applyDevice);
}

function selectTab(tab) {
  if (!isOwner() && OWNER_TABS.has(tab)) tab = 'reviews';
  state.tab = tab;
  store.set('tab', tab);
  $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  $$('.tab-panel').forEach((p) => (p.hidden = p.dataset.panel !== tab));
  if (tab === 'events') {
    state.unseenEvents = 0;
    updateEventBadge();
  }
}

// ── info tab ──────────────────────────────────────────────────────────────────
function renderInfo({ force = false } = {}) {
  const a = state.current;
  $('#statusPicker').innerHTML = state.statuses
    .map((s) => `<button class="pill ${a.status === s ? 'on' : ''}" data-s="${s}" data-status="${s}">${STATUS_LABEL[s] || s}</button>`)
    .join('');
  const rows = [
    ['Folder', `assets/${a.id}/`],
    ['Type', typeOf(a).long],
    ['Chapter', a.chapter ? `${a.chapter.number}. ${a.chapter.title.bn}${a.chapter.title.en ? ` (${a.chapter.title.en})` : ''}` : ''],
    ['Version', a.version],
    ['Edited', a.updatedAt ? timeAgo(a.updatedAt) : ''],
    ['Maintainers', (a.maintainers || []).map((m) => `@${m}`).join(', ')],
    ['Tags', (a.tags || []).join(', ')],
  ].filter(([, v]) => v);
  $('#infoKv').innerHTML = rows.map(([k, v]) => `<div class="k">${k}</div><div class="v">${escapeHtml(v)}</div>`).join('');
  const desc = $('#descInput');
  if (document.activeElement !== desc) desc.value = a.description || '';
  const fill = (sel, v) => (force || document.activeElement !== $(sel)) && ($(sel).value = v ?? '');
  fill('#bookInput', a.book);
  fill('#pageInput', a.page);
  fill('#topicInput', a.topic);
  fill('#placementInput', a.placement);
  $('#readme').innerHTML = a.readme ? renderMarkdown(a.readme) : '<p class="hint">No README.md yet.</p>';
}

/** The book picker lists books/books.json (one book for now; more later). */
function renderBookOptions() {
  const opts = state.books
    .map((b) => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.title.bn)} · ${escapeHtml(b.title.en)} (${escapeHtml(b.id)})</option>`)
    .join('');
  $('#bookInput').innerHTML = opts;
  newField('book').innerHTML = opts;
}

/** Saves fields of asset.json. On a refused change (the server validates), says why and shows the saved value again. */
async function patchCurrent(patch) {
  let updated;
  try {
    updated = await api(`assets/${state.current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  } catch (err) {
    toast(`Not saved: ${err.message}`, 5000);
    renderInfo({ force: true }); // put the saved values back, even in the field being edited

    throw err;
  }
  applyUpdate(updated);
}

async function setStatus(status) {
  applyUpdate(
    await api(`assets/${state.current.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),
  );
}

function applyUpdate(updated) {
  Object.assign(state.current, updated);
  const i = state.assets.findIndex((x) => x.id === updated.id);
  if (i >= 0) state.assets[i] = { ...state.assets[i], ...updated };
  renderFilters();
  renderList();
  renderHeader();
  renderInfo();
}

// ── params tab ────────────────────────────────────────────────────────────────
function renderParams() {
  const a = state.current;
  const values = paramState(a);
  const params = a.params || [];
  $('#paramForm').innerHTML = params.length
    ? params
        .map((p) => {
          const v = values[p.name] ?? p.default ?? '';
          let input;
          if (p.type === 'select') {
            input = `<select data-param="${p.name}">${p.options
              .map((o) => {
                const [val, label] = Array.isArray(o) ? o : [o, o];
                return `<option value="${escapeHtml(val)}" ${String(val) === String(v) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
              })
              .join('')}</select>`;
          } else if (p.type === 'boolean') {
            input = `<input type="checkbox" data-param="${p.name}" ${String(v) === '1' || v === true ? 'checked' : ''} />`;
          } else {
            input = `<input type="${p.type === 'number' ? 'number' : 'text'}" step="any" data-param="${p.name}" value="${escapeHtml(v)}" placeholder="${escapeHtml(p.placeholder || '')}" />`;
          }
          return `<div class="param"><div class="pl"><b>${escapeHtml(p.label || p.name)}</b><span>${p.name}${p.help ? ` · ${escapeHtml(p.help)}` : ''}</span></div>${input}</div>`;
        })
        .join('')
    : '<p class="hint">This asset declares no URL params (add a "params" list to asset.json).</p>';
  $('#paramUrl').textContent = buildUrl(a);
}

function onParamInput(e) {
  const el = e.target.closest('[data-param]');
  if (!el) return;
  const a = state.current;
  const values = paramState(a);
  values[el.dataset.param] = el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value;
  store.set(`params:${a.id}`, values);
  $('#paramUrl').textContent = buildUrl(a);
  later('params', loadFrame, el.tagName === 'INPUT' && el.type !== 'checkbox' ? 500 : 0);
}

// ── notes tab ─────────────────────────────────────────────────────────────────
async function loadNotes() {
  const id = state.current.id;
  $('#notesPath').textContent = `assets/${id}/NOTES.md`;
  const text = await api(`assets/${id}/notes`).catch(() => '');
  if (state.current?.id !== id) return;
  $('#notes').value = typeof text === 'string' ? text : '';
  $('#notesState').textContent = ' ';
  updateNotesBadge();
}

function updateNotesBadge() {
  const lines = $('#notes')
    .value.split('\n')
    .filter((l) => /^\s*[-*]\s+\S/.test(l)).length;
  const b = $('#notesBadge');
  b.hidden = !lines;
  b.textContent = lines;
}

let notesTimer;
function onNotesInput() {
  updateNotesBadge();
  $('#notesState').textContent = 'Editing…';
  $('#notesState').classList.remove('ok');
  clearTimeout(notesTimer);
  notesTimer = setTimeout(saveNotes, 700);
}
async function saveNotes() {
  if (!state.current) return;
  try {
    await api(`assets/${state.current.id}/notes`, { method: 'PUT', headers: { 'Content-Type': 'text/markdown' }, body: $('#notes').value });
    $('#notesState').textContent = `Saved ${new Date().toLocaleTimeString()}`;
    $('#notesState').classList.add('ok');
  } catch (err) {
    $('#notesState').textContent = `Not saved: ${err.message}`;
  }
}

// ── events tab ────────────────────────────────────────────────────────────────
const MAX_EVENTS = 200;
function logEvent(type, payload, dir = 'in') {
  const li = document.createElement('li');
  const body = payload === undefined ? '' : `<pre>${escapeHtml(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 1))}</pre>`;
  li.innerHTML = `<div class="ev-head"><span class="ev-type ${dir === 'out' ? 'out' : ''}">${dir === 'out' ? '→ ' : ''}${escapeHtml(type)}</span><span class="ev-time">${new Date().toLocaleTimeString()}</span></div>${body}`;
  const log = $('#eventLog');
  log.prepend(li);
  while (log.children.length > MAX_EVENTS) log.lastChild.remove();
  if (state.tab !== 'events') {
    state.unseenEvents++;
    updateEventBadge();
  }
}
function clearEvents() {
  $('#eventLog').innerHTML = '';
  state.unseenEvents = 0;
  updateEventBadge();
}
function updateEventBadge() {
  const b = $('#eventsBadge');
  b.hidden = !state.unseenEvents;
  b.textContent = state.unseenEvents > 99 ? '99+' : state.unseenEvents;
}

// Coalesce noisy events (e.g. "change" while dragging) so the log stays readable.
let lastEvent = { type: '', at: 0, li: null };
conn.on('*', (payload, msg) => {
  const now = performance.now();
  if (msg.type === lastEvent.type && now - lastEvent.at < 400 && lastEvent.li?.isConnected) {
    lastEvent.li.querySelector('pre').textContent = JSON.stringify(payload, null, 1);
    lastEvent.li.querySelector('.ev-time').textContent = new Date().toLocaleTimeString();
    lastEvent.at = now;
    return;
  }
  logEvent(msg.type, payload);
  lastEvent = { type: msg.type, at: now, li: $('#eventLog').firstElementChild };
  if (msg.type === 'ready') onAssetReady();
});

function renderCommands() {
  const cmds = [{ name: 'ping', payload: {} }, ...(state.current.commands || [])];
  $('#cmdSelect').innerHTML = cmds.map((c, i) => `<option value="${i}">${escapeHtml(c.name)}</option>`).join('');
  $('#cmdSelect').onchange = () => {
    const c = cmds[$('#cmdSelect').value];
    $('#cmdPayload').value = JSON.stringify(c.payload ?? {}, null, 2);
  };
  $('#cmdSend').onclick = async () => {
    const c = cmds[$('#cmdSelect').value];
    let payload;
    try {
      payload = JSON.parse($('#cmdPayload').value || '{}');
    } catch {
      return toast('Payload is not valid JSON');
    }
    logEvent(c.name, payload, 'out');
    try {
      const result = await conn.call(c.name, payload);
      const shown =
        typeof result === 'string' && result.length > 300
          ? `${result.slice(0, 120)}… (${result.length} chars)`
          : result instanceof ArrayBuffer
            ? `ArrayBuffer(${result.byteLength})`
            : result;
      logEvent(`${c.name}:result`, shown);
    } catch (err) {
      logEvent(`${c.name}:error`, err.message);
    }
  };
  $('#cmdSelect').onchange();
}

// ── handoff tab ───────────────────────────────────────────────────────────────
function renderHandoff() {
  const a = state.current;
  renderCommands();
  $('#thumbPreview').src = a.thumbnail || '';
  $('#thumbPreview').style.visibility = a.thumbnail ? 'visible' : 'hidden';
  if (isOwner()) loadExports();
  const entry = a.entry || (a.type === 'model' ? 'model.glb' : 'index.html');
  const params = (a.params || [])
    .slice(0, 2)
    .map((p) => `${p.name}=${p.default}`)
    .join('&');
  const where = a.placement || bookRef(a, true); // tells the book developer where this goes
  $('#snippet').textContent =
    (where ? `<!-- ${where} -->\n` : '') +
    (/\.(glb|gltf)$/.test(entry)
      ? `<!-- Static model: ${a.id}/${entry} -->\n<model-viewer src="${a.id}/${entry}" camera-controls auto-rotate style="width:100%;aspect-ratio:16/10"></model-viewer>`
      : `<iframe\n  src="${a.id}/${entry}${params ? `?${params}` : ''}"\n  style="width:100%;aspect-ratio:16/10;border:0"\n  allow="fullscreen"\n  loading="lazy"></iframe>\n\n<script type="module">\n  import { connectAsset } from './${a.id}/shared/lib/host.js';\n  const asset = connectAsset(document.querySelector('iframe'));\n  await asset.ready;\n  asset.on('change', (e) => console.log(e));\n</script>`);
}

async function captureThumbnail({ silent = false } = {}) {
  const id = state.current?.id;
  if (!id) return;
  const dataUrl = await conn.call('capture', { width: 800, height: 500 });
  await api(`assets/${id}/thumbnail`, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: dataUrl });
  if (!silent) toast('Thumbnail saved');
}

let autoThumbTimer;
function onAssetReady() {
  clearTimeout(autoThumbTimer);
  if (isOwner() && state.current && !state.current.thumbnail) {
    autoThumbTimer = setTimeout(() => captureThumbnail({ silent: true }).catch(() => {}), 2500);
  }
}

// ── reviews: feedback from the people invited to review ────────────────────────
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
const frameLabel = (device) => FRAME_BN[device] || device;

async function loadReviews() {
  const id = state.current?.id;
  if (!id) return;
  try {
    const { reviews } = await api(`assets/${id}/reviews`);
    if (state.current?.id !== id) return;
    state.reviews = reviews;
  } catch {
    state.reviews = [];
  }
  renderReviews();
}

function renderReviews() {
  const all = state.reviews.slice().reverse(); // newest first
  const open = all.filter((r) => r.status !== 'done');
  const done = all.filter((r) => r.status === 'done');
  const badge = $('#reviewsBadge');
  badge.hidden = !open.length;
  badge.textContent = bnDigits(open.length);
  const f = state.reviewFilter;
  $('#reviewFilter').innerHTML = [
    ['open', `বাকি ${bnDigits(open.length)}`],
    ['done', `সম্পন্ন ${bnDigits(done.length)}`],
    ['all', `সব ${bnDigits(all.length)}`],
  ]
    .map(([k, label]) => `<button class="chip ${f === k ? 'on' : ''}" data-rf="${k}">${label}</button>`)
    .join('');
  const list = f === 'open' ? open : f === 'done' ? done : all;
  $('#reviewList').innerHTML = list.length
    ? list.map(reviewCard).join('')
    : `<li class="hint">${f === 'open' ? 'কোনো বাকি মতামত নেই।' : 'এখনো কিছু নেই।'}</li>`;
}

function reviewCard(r) {
  const ctx = r.context || {};
  const where = [
    ctx.frame ? `${frameLabel(ctx.frame)}${ctx.frame === 'fill' && ctx.size ? ` ${bnDigits(ctx.size)}` : ''}` : '',
    ctx.state?.stop ? `ধাপ: ${ctx.state.stop}` : '',
    ctx.state?.specimen?.kind ? `বস্তু: ${ctx.state.specimen.kind}` : '',
    ctx.state?.mode && ctx.state.mode !== 'explore' ? `মোড: ${ctx.state.mode}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const img = r.image
    ? `<a href="/assets/${state.current.id}/${r.image}" target="_blank" rel="noopener"><img class="review-shot" src="/assets/${state.current.id}/${r.image}" alt="রিভিউকারী যা দেখেছেন" loading="lazy" /></a>`
    : '';
  const reply = r.reply ? `<div class="review-reply"><small>উত্তর · ${agoBn(Date.parse(r.repliedAt))}</small>${escapeHtml(r.reply)}</div>` : '';
  const actions = isOwner()
    ? `<div class="review-actions">
        <button class="btn small" data-ra="toggle">${r.status === 'done' ? 'আবার খুলুন' : 'সম্পন্ন করুন'}</button>
        <button class="btn small ghost" data-ra="reply">${r.reply ? 'উত্তর বদলান' : 'উত্তর দিন'}</button>
        <button class="btn small ghost" data-ra="delete">মুছুন</button>
      </div>`
    : '';
  return `<li class="review ${r.status === 'done' ? 'done' : ''}" data-rid="${r.id}">
    <div class="review-head"><b>${escapeHtml(r.author)}</b><span>${agoBn(Date.parse(r.createdAt))}</span>
      <span class="review-state ${r.status === 'done' ? 'done' : 'open'}">${r.status === 'done' ? 'সম্পন্ন' : 'বাকি'}</span></div>
    ${where ? `<div class="review-ctx">${escapeHtml(where)}</div>` : ''}
    <p class="review-text">${escapeHtml(r.text)}</p>
    ${img}${reply}${actions}
  </li>`;
}

$('#reviewFilter').addEventListener('click', (e) => {
  const b = e.target.closest('[data-rf]');
  if (!b) return;
  state.reviewFilter = b.dataset.rf;
  store.set('reviewFilter', state.reviewFilter);
  renderReviews();
});

$('#reviewList').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-ra]');
  const card = e.target.closest('.review');
  if (!b || !card || !isOwner()) return;
  const rid = card.dataset.rid;
  const r = state.reviews.find((x) => x.id === rid);
  const base = `assets/${state.current.id}/reviews/${rid}`;
  const json = (method, body) => api(base, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    if (b.dataset.ra === 'toggle') {
      await json('PATCH', { status: r.status === 'done' ? 'open' : 'done' });
    } else if (b.dataset.ra === 'delete') {
      if (b.dataset.sure !== '1') {
        b.dataset.sure = '1';
        b.textContent = 'সত্যিই মুছবেন?';
        return;
      }
      await api(base, { method: 'DELETE' });
    } else if (b.dataset.ra === 'reply') {
      const box = card.querySelector('.review-actions');
      if (!box.querySelector('textarea')) {
        box.insertAdjacentHTML(
          'afterbegin',
          `<textarea rows="3" placeholder="রিভিউকারীকে উত্তর: কী বদলেছেন, বা কেন বদলাননি">${escapeHtml(r.reply || '')}</textarea>`,
        );
        b.textContent = 'উত্তর সংরক্ষণ করুন';
        box.querySelector('textarea').focus();
        return;
      }
      await json('PATCH', { reply: box.querySelector('textarea').value });
    }
    await loadReviews();
    loadAssets();
  } catch (err) {
    toast(bnError(err.message));
  }
});

$('#reviewAuthor').value = store.get('reviewer', '');
$('#reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const a = state.current;
  if (!a) return;
  const author = $('#reviewAuthor').value.trim();
  const text = $('#reviewText').value.trim();
  if (!author || !text) return;
  store.set('reviewer', author);
  const send = $('#reviewSend');
  send.disabled = true;
  send.textContent = 'পাঠানো হচ্ছে…';
  // What the reviewer was looking at: frame size, view options, the figure's own state, and a picture.
  const box = frame.getBoundingClientRect();
  const context = { frame: state.device, size: `${Math.round(box.width)}×${Math.round(box.height)}`, params: paramState(a) };
  if ((a.commands || []).some((c) => c.name === 'get')) {
    try {
      context.state = await withTimeout(conn.call('get'), 2500);
    } catch {}
  }
  let image = null;
  if ($('#reviewShot').checked && (a.commands || []).some((c) => c.name === 'capture')) {
    try {
      image = await toWebp(await withTimeout(conn.call('capture', { width: 960, height: 600 }), 5000));
    } catch {}
  }
  try {
    await api(`assets/${a.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text, image, context }),
    });
    $('#reviewText').value = '';
    state.reviewFilter = state.reviewFilter === 'done' ? 'open' : state.reviewFilter;
    toast('ধন্যবাদ, আপনার মতামত জমা হয়েছে');
    await loadReviews();
    loadAssets();
  } catch (err) {
    toast(bnError(err.message));
  } finally {
    send.disabled = false;
    send.textContent = 'মতামত পাঠান';
  }
});

$('#feedbackBtn').addEventListener('click', () => {
  if (phone.matches) setDrawer('inspector');
  else if (!state.inspector) {
    state.inspector = true;
    applyInspector();
  }
  selectTab('reviews');
  $('#reviewText').focus();
});

// Reviewers: read-only info, no owner tools.
function applyRole() {
  document.body.classList.toggle('role-reviewer', !isOwner());
  for (const sel of ['#descInput', '#pageInput', '#topicInput', '#placementInput']) $(sel).readOnly = !isOwner();
  $('#bookInput').disabled = !isOwner();
  if (isOwner()) return;
  document.documentElement.lang = 'bn';
  document.title = 'পাঠশালা ৩D · মতামত';
  for (const el of $$('[data-bn]')) el.textContent = el.dataset.bn;
  for (const el of $$('[data-bn-placeholder]')) el.placeholder = el.dataset.bnPlaceholder;
  for (const el of $$('[data-bn-title]')) el.title = el.dataset.bnTitle;
  if (OWNER_TABS.has(state.tab)) selectTab('reviews');
  if (state.reviewFilter === 'open') state.reviewFilter = 'all';
}

/** Re-encodes a captured PNG as WebP (much smaller; reviews are kept in git). Falls back to the PNG. */
async function toWebp(dataUrl, quality = 0.85) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1280 / img.naturalWidth);
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  const webp = canvas.toDataURL('image/webp', quality);
  return webp.startsWith('data:image/webp') ? webp : dataUrl;
}

// ── markdown (tiny, enough for READMEs) ───────────────────────────────────────
// Links may only be web links or relative paths: README and NOTES come from contributors, and a
// `javascript:` or `data:` link would run in the studio with the viewer's rights.
const safeHref = (href) => /^(https?:\/\/|\/|\.{0,2}\/|#)/i.test(href) || /^[\w.-]+(\/[\w.-]*)*([?#].*)?$/.test(href);

function renderMarkdown(src) {
  const inline = (s) =>
    escapeHtml(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, href) =>
        safeHref(href) ? `<a href="${href}" target="_blank" rel="noopener">${text}</a>` : text,
      );
  const out = [];
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const code = [];
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]);
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
    } else if (/^#{1,6} /.test(line)) {
      const level = Math.min(3, line.match(/^#+/)[0].length);
      out.push(`<h${level}>${inline(line.replace(/^#+ /, ''))}</h${level}>`);
    } else if (/^\s*[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^\s*[-*] /, ''))}</li>`);
      i--;
      out.push(`<ul>${items.join('')}</ul>`);
    } else if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      i--;
      const cells = (r) =>
        r
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
      const body = rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r));
      out.push(
        `<table>${body
          .map(
            (r, ri) =>
              `<tr>${cells(r)
                .map((c) => (ri === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`))
                .join('')}</tr>`,
          )
          .join('')}</table>`,
      );
    } else if (line.trim()) {
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  return out.join('');
}

// ── wiring ────────────────────────────────────────────────────────────────────
$('#assetList').addEventListener('click', (e) => {
  const li = e.target.closest('.asset-item');
  if (!li) return;
  selectAsset(li.dataset.id);
  setDrawer(null);
});
$('#menuBtn').addEventListener('click', () => setDrawer(state.drawer === 'assets' ? null : 'assets'));
$('#inspectorClose').addEventListener('click', () => setDrawer(null));
$('#scrim').addEventListener('click', () => setDrawer(null));
$('#filters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  state.filter = chip.dataset.f;
  store.set('filter', state.filter);
  renderFilters();
  renderList();
});
$('#search').addEventListener('input', (e) => {
  state.query = e.target.value;
  renderList();
});
$('#deviceSelect').addEventListener('change', (e) => {
  state.device = e.target.value;
  store.set('device', state.device);
  applyDevice();
});
$('#bgSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.bg = b.dataset.bg;
  store.set('bg', state.bg);
  applyBg();
});
$('#reloadBtn').addEventListener('click', () => reloadFrame(true));
$('#panelBtn').addEventListener('click', () => {
  if (phone.matches) return setDrawer(state.drawer === 'inspector' ? null : 'inspector');
  state.inspector = !state.inspector;
  store.set('inspector', state.inspector);
  applyInspector();
});
$$('.tabs button').forEach((b) => b.addEventListener('click', () => selectTab(b.dataset.tab)));
$('#statusPicker').addEventListener('click', (e) => {
  const b = e.target.closest('[data-status]');
  if (b && state.current)
    setStatus(b.dataset.status).then(
      () => toast(`Status → ${STATUS_LABEL[b.dataset.status]}`),
      (err) => toast(err.message, 5000),
    );
});
// Each field saves on change; a refused value is reported by patchCurrent (the catch only stops the chain).
const saveField = (patch, done) => state.current && patchCurrent(patch).then(done, () => {});
$('#descInput').addEventListener('change', (e) => saveField({ description: e.target.value }));
$('#bookInput').addEventListener('change', (e) => saveField({ book: e.target.value }, () => (renderHandoff(), toast('Book saved'))));
$('#pageInput').addEventListener('change', (e) => {
  const v = e.target.value.trim();
  saveField({ page: v === '' ? null : /^\d+$/.test(v) ? Number(v) : v }, () => (renderHandoff(), toast('Page saved')));
});
$('#topicInput').addEventListener('change', (e) => saveField({ topic: e.target.value.trim() }, () => (renderHandoff(), toast('Topic saved'))));
$('#placementInput').addEventListener('change', (e) => saveField({ placement: e.target.value.trim() }, renderHandoff));
$('#paramForm').addEventListener('input', onParamInput);
$('#paramForm').addEventListener('change', onParamInput);
$('#paramReset').addEventListener('click', () => {
  store.set(`params:${state.current.id}`, {});
  renderParams();
  loadFrame();
});
$('#paramCopy').addEventListener('click', () => {
  navigator.clipboard?.writeText(new URL(buildUrl(state.current), location.href).href).then(() => toast('URL copied'));
});
$('#notes').addEventListener('input', onNotesInput);
$('#clearEvents').addEventListener('click', clearEvents);
$('#copySnippet').addEventListener('click', () => navigator.clipboard?.writeText($('#snippet').textContent).then(() => toast('Snippet copied')));

$('#captureBtn').addEventListener('click', () => captureThumbnail().catch((err) => toast(`Capture failed: ${err.message}`)));
// ── exports (zip, pictures, GLB, video), run as jobs on the server ───────────
const STEP_LABEL = { zip: 'zip', images: 'pictures', glb: 'GLB', video: 'video' };
const kb = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

async function loadExports() {
  const id = state.current?.id;
  if (!id) return;
  let data;
  try {
    data = await api(`assets/${id}/exports`);
  } catch (err) {
    $('#exportFiles').textContent = err.message;
    return;
  }
  if (id !== state.current?.id) return;
  $('#exportBtn').disabled = $('#releaseBtn').disabled = !data.ready;
  const active = data.jobs.find((j) => j.status === 'queued' || j.status === 'running');
  renderJob(active || null);
  const files = (record) =>
    `<ul>${record.files.map((f) => `<li><a href="${escapeHtml(f.url)}" download>${escapeHtml(f.name)}</a> <span>${kb(f.bytes)}</span></li>`).join('')}</ul>`;
  const stamp = (r) =>
    `v${escapeHtml(r.version)} · ${escapeHtml(timeAgo(Date.parse(r.exportedAt)))}${r.commit ? ` · ${escapeHtml(r.commit.slice(0, 7))}` : ''}${r.uncommitted ? ' · <b>uncommitted changes</b>' : ''}`;
  $('#exportFiles').innerHTML = [
    !data.ready ? '<p class="hint">Exports need the dev tools on this server (npm ci).</p>' : '',
    data.preview
      ? `<div class="export-set"><b>Latest preview</b> <span class="hint">${stamp(data.preview)}</span>${files(data.preview)}</div>`
      : '<p class="hint">Nothing exported yet.</p>',
    ...data.releases.map((r) => `<div class="export-set"><b>Release</b> <span class="hint">${stamp(r)}</span>${files(r)}</div>`),
  ].join('');
}

function renderJob(job) {
  const box = $('#exportJob');
  box.hidden = !job || !['queued', 'running'].includes(job.status);
  if (box.hidden) return;
  box.dataset.job = job.id;
  const p = job.progress;
  const pct = p?.total ? Math.round((p.done / p.total) * 100) : 0;
  box.querySelector('i').style.width = `${pct}%`;
  box.querySelector('.export-job-text').textContent =
    job.status === 'queued'
      ? 'Queued…'
      : p
        ? `${job.official ? 'Release' : 'Export'}: ${STEP_LABEL[p.step] || p.step} ${p.done}/${p.total}`
        : 'Starting…';
}

function onJob(job) {
  if (job.figure !== state.current?.id || !isOwner()) return;
  renderJob(job);
  if (job.status === 'done') {
    toast(`${job.official ? 'Released' : 'Exported'} ${job.figure}`);
    loadExports();
  } else if (job.status === 'failed') {
    toast(`Export failed: ${job.error}`, 8000);
    loadExports();
  } else if (job.status === 'cancelled') loadExports();
}

async function startExport({ official = false } = {}) {
  const formats = official ? ['zip', 'images', 'glb', 'video'] : $$('#exportFormats input:checked').map((i) => i.value);
  if (!formats.length) return toast('Choose at least one format');
  try {
    renderJob(
      await api(`assets/${state.current.id}/exports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formats, official }),
      }),
    );
  } catch (err) {
    toast(err.message, 8000);
  }
}
$('#exportBtn').addEventListener('click', () => startExport());
$('#releaseBtn').addEventListener('click', (e) => {
  const b = e.currentTarget;
  if (b.dataset.confirm !== '1') {
    b.dataset.confirm = '1';
    b.textContent = `Release v${state.current.version}?`;
    setTimeout(() => {
      b.dataset.confirm = '';
      b.textContent = 'Release';
    }, 4000);
    return;
  }
  b.dataset.confirm = '';
  b.textContent = 'Release';
  startExport({ official: true });
});
$('#exportCancel').addEventListener('click', () =>
  api(`jobs/${$('#exportJob').dataset.job}`, { method: 'DELETE' }).catch((err) => toast(err.message)),
);

// New asset dialog
$('#newAssetBtn').addEventListener('click', () => {
  $('#newError').textContent = '';
  $('#newForm').reset();
  delete newField('id').dataset.touched;
  $('#newDialog').showModal();
});
const newField = (name) => $('#newForm').elements.namedItem(name);
newField('title').addEventListener('input', (e) => {
  const idInput = newField('id');
  if (!idInput.dataset.touched)
    idInput.value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64);
});
newField('id').addEventListener('input', (e) => (e.target.dataset.touched = '1'));
$('#newForm').addEventListener('submit', async (e) => {
  if (e.submitter?.value !== 'create') return;
  e.preventDefault();
  /** @type {Record<string, any>} */
  const body = Object.fromEntries(new FormData(e.target));
  const page = String(body.page || '').trim();
  body.page = page ? (/^\d+$/.test(page) ? Number(page) : page) : null;
  try {
    const created = await api('assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    $('#newDialog').close();
    await loadAssets();
    selectAsset(created.id);
    toast(`Created assets/${created.id}/`);
  } catch (err) {
    $('#newError').textContent = err.message;
  }
});

document.addEventListener('keydown', (e) => {
  if (/** @type {Element} */ (e.target).closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape') setDrawer(null);
  if (e.key === 'r') reloadFrame(true);
  if (e.key === 'p') $('#panelBtn').click();
});
window.addEventListener('hashchange', () => {
  const id = location.hash.replace(/^#\//, '');
  if (id && id !== state.current?.id) selectAsset(id);
});

// ── live reload ───────────────────────────────────────────────────────────────
function connectLive() {
  const es = new EventSource('/__dev/events');
  es.onopen = () => $('#liveDot').classList.add('on');
  es.onerror = () => $('#liveDot').classList.remove('on');
  es.addEventListener('reload', (e) => {
    const d = JSON.parse(e.data);
    if (d.scope === 'dashboard') return location.reload();
    if (d.scope === 'shared' || d.id === state.current?.id) reloadFrame(true);
    if (d.scope === 'asset') loadAssets().then(() => state.current && renderHeader());
  });
  es.addEventListener('job', (e) => onJob(JSON.parse(e.data)));
  es.addEventListener('meta', async (e) => {
    const d = JSON.parse(e.data);
    await loadAssets();
    if (d.id === state.current?.id) {
      const fresh = await api(`assets/${d.id}`);
      const paramsChanged = JSON.stringify(fresh.params) !== JSON.stringify(state.current.params);
      state.current = fresh;
      renderHeader();
      renderInfo();
      renderHandoff();
      if (paramsChanged) renderParams();
      loadReviews(); // a reviewer may have just written
    }
  });
}

// ── boot ──────────────────────────────────────────────────────────────────────
state.role = (await api('me').catch(() => ({ role: 'owner' }))).role;
applyBg();
applyInspector();
applyDevice();
selectTab(state.tab);
applyRole();
connectLive();
await loadAssets();
const initial = location.hash.replace(/^#\//, '') || store.get('last') || state.assets[0]?.id;
if (initial && state.assets.some((a) => a.id === initial)) selectAsset(initial);
else if (state.assets[0]) selectAsset(state.assets[0].id);
