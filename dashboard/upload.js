// The "New 3D model" dialog: converts the chosen files in the browser (shared/lib/import/convert.js), shows the
// result and its numbers, then sends the files and the converted GLB to the server, which checks it and makes a
// model figure. Loaded only when the dialog opens (it pulls in three.js and the loaders).
import * as THREE from 'three';
import { convertModel } from '@shared/import/convert.js';
import { createStage } from '@shared/stage.js';

const $ = (s) => document.querySelector(s);
const field = (name) => /** @type {HTMLInputElement} */ ($('#uploadForm').elements.namedItem(name));
const safeName = (name) =>
  name
    .replace(/[^\w .()+-]/g, '_')
    .replace(/^[^\w]/, '_')
    .slice(0, 120);
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);

let stage = null;
let shown = null;
let files = [];
let result = null;
let token = 0;

function preview(model) {
  if (!stage) stage = createStage($('#uploadCanvas'), { fov: 35, environment: 'studio-light' });
  if (shown) stage.scene.remove(shown);
  shown = model;
  stage.scene.add(model);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const r = box.getSize(new THREE.Vector3()).length() / 2 || 1;
  const d = (r / Math.sin(THREE.MathUtils.degToRad(stage.camera.fov / 2))) * 1.1;
  stage.camera.near = d / 100;
  stage.camera.far = d * 100;
  stage.camera.updateProjectionMatrix();
  stage.camera.position.copy(center).add(new THREE.Vector3(0.6, 0.45, 1).normalize().multiplyScalar(d));
  stage.controls.target.copy(center);
  stage.controls.update();
  stage.invalidate();
}

async function convert() {
  const my = ++token;
  result = null;
  $('#uploadSave').disabled = true;
  $('#uploadError').textContent = '';
  $('#uploadWarnings').innerHTML = '';
  if (!files.length) return;
  $('#uploadStats').textContent = 'Converting…';
  $('#uploadPreview').hidden = false;
  try {
    const r = await convertModel(files, { units: /** @type {any} */ (field('units').value), up: /** @type {any} */ (field('up').value) });
    if (my !== token) return;
    result = r;
    preview(r.scene);
    const s = r.stats;
    $('#uploadStats').textContent =
      `${s.format.toUpperCase()} · ${s.size.map((v) => `${v} m`).join(' × ')} · ${s.triangles.toLocaleString()} triangles · ${s.materials} materials · ${s.textures} textures${s.animations ? ` · ${s.animations} animations` : ''} · GLB ${s.bytes < 1024 * 1024 ? `${Math.max(1, Math.round(s.bytes / 1024))} KB` : `${(s.bytes / 1024 / 1024).toFixed(1)} MB`}`;
    $('#uploadWarnings').innerHTML = r.warnings
      .map((w) => `<li>${w.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</li>`)
      .join('');
    $('#uploadSave').disabled = false;
    if (!field('title').value) {
      const name = files.find((f) => /\.(glb|gltf|fbx|obj|stl|zip)$/i.test(f.name))?.name.replace(/\.\w+$/, '') || '';
      field('title').value = name.replace(/[_-]+/g, ' ');
      field('id').value = slug(name);
    }
  } catch (err) {
    if (my !== token) return;
    $('#uploadStats').textContent = '';
    $('#uploadError').textContent = `Could not read the files: ${err.message}`;
  }
}

async function save({ api, onSaved }) {
  if (!result) return;
  const btn = $('#uploadSave');
  btn.disabled = true;
  $('#uploadError').textContent = '';
  const uploadId = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => b.toString(16).padStart(2, '0')).join('');
  const put = (name, body, type = 'application/octet-stream') =>
    api(`uploads/${uploadId}/${encodeURIComponent(name)}`, { method: 'PUT', headers: { 'Content-Type': type }, body });
  try {
    const originals = [];
    for (const f of files) {
      btn.textContent = `Sending ${f.name}…`;
      const name = safeName(f.name);
      await put(name, await f.arrayBuffer());
      originals.push(name);
    }
    btn.textContent = 'Checking…';
    await put('_converted.glb', result.glb, 'model/gltf-binary');
    const png = await (await fetch(stage.capture({ width: 800, height: 500 }))).arrayBuffer();
    await put('_thumbnail.png', png, 'image/png');
    const page = field('page').value.trim();
    const r = await api(`uploads/${uploadId}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: field('id').value.trim(),
        title: field('title').value.trim(),
        book: field('book').value,
        page: page ? (/^\d+$/.test(page) ? Number(page) : page) : null,
        topic: field('topic').value.trim(),
        placement: field('placement').value.trim(),
        units: field('units').value,
        up: field('up').value,
        source: { license: field('license').value, credit: field('credit').value.trim(), url: field('url').value.trim() },
        glb: '_converted.glb',
        thumbnail: '_thumbnail.png',
        originals,
        stats: result.stats,
      }),
    });
    /** @type {HTMLDialogElement} */ ($('#uploadDialog')).close();
    onSaved(r);
  } catch (err) {
    $('#uploadError').textContent = err.message;
  } finally {
    btn.disabled = !result;
    btn.textContent = 'Save model';
  }
}

let wired = false;
/** Opens the dialog. `books`: books.json list; `api(path, init)`; `onSaved(result)`. */
export function openUpload({ books, api, onSaved }) {
  const form = /** @type {HTMLFormElement} */ ($('#uploadForm'));
  form.reset();
  files = [];
  result = null;
  $('#uploadPreview').hidden = true;
  $('#uploadWarnings').innerHTML = '';
  $('#uploadError').textContent = '';
  $('#uploadSave').disabled = true;
  field('book').innerHTML = books.map((b) => `<option value="${b.id}">${b.title.bn} · ${b.title.en}</option>`).join('');
  if (!wired) {
    wired = true;
    $('#uploadFiles').addEventListener('change', (e) => {
      const input = /** @type {HTMLInputElement} */ (e.target);
      files = Array.from(input.files || []);
      convert();
    });
    const drop = $('#uploadDrop');
    drop.addEventListener('dragover', (e) => (e.preventDefault(), drop.classList.add('over')));
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('over');
      files = [...(e.dataTransfer?.files || [])];
      convert();
    });
    for (const name of ['units', 'up']) field(name).addEventListener('change', () => files.length && convert());
    field('title').addEventListener('input', (e) => {
      if (!field('id').dataset.touched) field('id').value = slug(/** @type {HTMLInputElement} */ (e.target).value);
    });
    field('id').addEventListener('input', () => (field('id').dataset.touched = '1'));
    form.addEventListener('submit', (e) => {
      if (/** @type {HTMLButtonElement} */ (/** @type {SubmitEvent} */ (e).submitter)?.value !== 'save') return;
      e.preventDefault();
      save({ api, onSaved: openUpload.onSaved });
    });
  }
  openUpload.onSaved = onSaved;
  delete field('id').dataset.touched;
  /** @type {HTMLDialogElement} */ ($('#uploadDialog')).showModal();
}
openUpload.onSaved = (_r) => {};
