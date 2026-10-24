// Turns uploaded 3D files into one GLB ready for a model figure, in the browser (the studio's upload dialog and
// `npm run import` both use this file). Reads GLB/glTF (+ .bin and textures; Draco and meshopt compression), OBJ
// (+ .mtl and textures), STL, FBX (binary or ASCII, version 7+), or a .zip of any of them.
//
//   const { glb, scene, stats, warnings } = await convertModel(files, { units: 'mm', up: 'z' });
//
// files: [{ name, data: ArrayBuffer }] (or File objects). The model is scaled to metres, turned Y-up, centred and
// stood on the floor (y = 0); Phong/Lambert materials become physically based ones; lights and cameras are dropped;
// animations are kept; textures are capped at 2048 px by the exporter.
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { unzipSync } from 'three/addons/libs/fflate.module.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

export const UNITS = { m: 1, cm: 0.01, mm: 0.001, in: 0.0254 };
export const MAIN_FORMATS = ['glb', 'gltf', 'fbx', 'obj', 'stl'];
export const LIMITS = { triangles: 300_000, bytes: 10 * 1024 * 1024 };

const ext = (name) => name.toLowerCase().split('.').pop();
const base = (name) => name.replace(/\\/g, '/').split('/').pop();

/** [{ name, data }] with zips unpacked (folders flattened to file names). */
export async function readFiles(files) {
  const out = [];
  for (const f of files) {
    const data = f.data ?? (await f.arrayBuffer());
    if (ext(f.name) === 'zip') {
      for (const [name, bytes] of Object.entries(unzipSync(new Uint8Array(data)))) {
        if (!name.endsWith('/') && !name.startsWith('__MACOSX')) out.push({ name: base(name), data: bytes.slice().buffer });
      }
    } else out.push({ name: base(f.name), data });
  }
  return out;
}

/** The file to open: the first GLB/glTF, else FBX, OBJ, STL. */
export function mainFile(files) {
  for (const kind of MAIN_FORMATS) {
    const f = files.find((x) => ext(x.name) === kind);
    if (f) return f;
  }
  return null;
}

/** Physically based copy of an old-style material (OBJ and FBX use Phong and Lambert). */
function toStandard(m) {
  if (m.isMeshStandardMaterial || !m.isMaterial) return m;
  const s = new THREE.MeshStandardMaterial({
    name: m.name,
    color: m.color?.clone() ?? new THREE.Color(0xcccccc),
    map: m.map ?? null,
    normalMap: m.normalMap ?? null,
    emissive: m.emissive?.clone() ?? new THREE.Color(0x000000),
    emissiveMap: m.emissiveMap ?? null,
    alphaMap: m.alphaMap ?? null,
    transparent: m.transparent,
    opacity: m.opacity,
    side: m.side,
    vertexColors: m.vertexColors,
    roughness: m.shininess != null ? 1 - Math.min(m.shininess / 100, 1) * 0.8 : 0.7,
    metalness: 0,
  });
  return s;
}

async function load(files, { onMissing }) {
  const byName = new Map(files.map((f) => [f.name.toLowerCase(), f]));
  const urls = new Map();
  const urlFor = (name) => {
    const f = byName.get(base(decodeURIComponent(name)).toLowerCase());
    if (!f) return null;
    if (!urls.has(f.name)) urls.set(f.name, URL.createObjectURL(new Blob([f.data])));
    return urls.get(f.name);
  };
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (/^(blob:|data:)/.test(url)) return url;
    const found = urlFor(url);
    if (!found) onMissing(base(decodeURIComponent(url)));
    return found || url;
  });
  const main = mainFile(files);
  if (!main) throw new Error(`no 3D file found (use ${MAIN_FORMATS.join(', ')}, or a zip of one)`);
  const kind = ext(main.name);
  try {
    if (kind === 'glb' || kind === 'gltf') {
      const draco = new DRACOLoader().setDecoderPath(new URL('../../vendor/three/addons/libs/draco/gltf/', import.meta.url).href);
      const loader = new GLTFLoader(manager).setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.parseAsync(kind === 'glb' ? main.data : new TextDecoder().decode(main.data), '');
      draco.dispose();
      return { kind, root: gltf.scene, animations: gltf.animations };
    }
    if (kind === 'fbx') {
      const root = new FBXLoader(manager).parse(main.data, ''); // binary, or text (ASCII) from FBX 7.0 on
      return { kind, root, animations: root.animations || [] };
    }
    if (kind === 'obj') {
      const loader = new OBJLoader(manager);
      const mtl = files.find((f) => ext(f.name) === 'mtl');
      const wanted = /^mtllib\s+(.+)$/m.exec(new TextDecoder().decode(main.data))?.[1]?.trim();
      if (wanted && !mtl) onMissing(base(wanted));
      if (mtl) {
        const materials = new MTLLoader(manager).parse(new TextDecoder().decode(mtl.data), '');
        materials.preload();
        loader.setMaterials(materials);
      }
      return { kind, root: loader.parse(new TextDecoder().decode(main.data)), animations: [] };
    }
    const geometry = new STLLoader(manager).parse(main.data);
    // many STL files write 0 0 0 for every normal: then work them out from the triangles
    const n = geometry.attributes.normal?.array;
    if (!n?.some((v) => v !== 0)) geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      name: 'STL',
      color: geometry.attributes.color ? 0xffffff : 0xb8bec7,
      roughness: 0.6,
      metalness: 0,
      vertexColors: Boolean(geometry.attributes.color),
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = main.name.replace(/\.stl$/i, '');
    return { kind, root: new THREE.Group().add(mesh), animations: [] };
  } finally {
    // blob URLs are released after the export below has read the textures
    setTimeout(() => {
      for (const u of urls.values()) URL.revokeObjectURL(u);
    }, 60_000);
  }
}

/** Waits until every texture image is decoded (OBJ/MTL and FBX load them in the background). */
async function texturesReady(root, ms = 10_000) {
  const images = new Set();
  root.traverse((o) => {
    for (const m of [].concat(o.material || [])) for (const v of Object.values(m)) if (v?.isTexture && !v.image) images.add(v);
  });
  const start = Date.now();
  while ([...images].some((t) => !t.image) && Date.now() - start < ms) await new Promise((r) => setTimeout(r, 50));
}

/**
 * @param {Array<{ name: string, data?: ArrayBuffer, arrayBuffer?: () => Promise<ArrayBuffer> }>} input
 * @param {{ units?: keyof typeof UNITS, up?: 'y' | 'z', name?: string }} [options]
 * @returns {Promise<{ glb: ArrayBuffer, scene: THREE.Group, animations: THREE.AnimationClip[], stats: any, warnings: string[] }>}
 */
export async function convertModel(input, { units = 'm', up = 'y', name = 'Model' } = {}) {
  const files = await readFiles(input);
  const warnings = [];
  const missing = new Set();
  const { kind, root, animations } = await load(files, { onMissing: (n) => missing.add(n) });
  await texturesReady(root);

  // drop lights and cameras; physically based materials everywhere
  const drop = [];
  root.traverse((o) => {
    if (o instanceof THREE.Light || o instanceof THREE.Camera) drop.push(o);
    if (o instanceof THREE.Mesh) o.material = Array.isArray(o.material) ? o.material.map(toStandard) : toStandard(o.material);
  });
  for (const o of drop) o.removeFromParent();

  // metres, Y up, centred, on the floor
  const model = new THREE.Group();
  model.name = name;
  const inner = new THREE.Group();
  inner.add(root);
  inner.scale.setScalar(UNITS[units] ?? 1);
  if (up === 'z') inner.rotation.x = -Math.PI / 2;
  model.add(inner);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) throw new Error('the file has no visible geometry');
  const center = box.getCenter(new THREE.Vector3());
  inner.position.set(-center.x, -box.min.y, -center.z);
  model.updateMatrixWorld(true);
  box.setFromObject(model);
  const size = box.getSize(new THREE.Vector3());

  let triangles = 0;
  let meshes = 0;
  const materials = new Set();
  const textures = new Set();
  model.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    meshes++;
    const g = o.geometry;
    triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
    for (const m of [].concat(o.material)) {
      materials.add(m);
      for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
    }
  });
  if (missing.size) warnings.push(`files it refers to but which were not uploaded: ${[...missing].join(', ')}`);
  if (triangles > LIMITS.triangles)
    warnings.push(`${Math.round(triangles).toLocaleString()} triangles: heavy for phones (keep it under ${LIMITS.triangles.toLocaleString()})`);
  if (Math.max(size.x, size.y, size.z) > 50 || Math.max(size.x, size.y, size.z) < 0.005)
    warnings.push(
      `it is ${size
        .toArray()
        .map((v) => v.toFixed(3))
        .join(' × ')} m: check the units`,
    );
  if (!materials.size) warnings.push('no materials');
  if (!triangles) warnings.push('no surfaces (0 triangles): only lines or points, nothing solid to show');

  const glb = /** @type {ArrayBuffer} */ (
    await new GLTFExporter().parseAsync(model, { binary: true, onlyVisible: true, maxTextureSize: 2048, animations })
  );
  if (glb.byteLength > LIMITS.bytes)
    warnings.push(`the GLB is ${(glb.byteLength / 1024 / 1024).toFixed(1)} MB (the limit is ${LIMITS.bytes / 1024 / 1024} MB)`);
  return {
    glb,
    scene: model,
    animations,
    stats: {
      format: kind,
      files: files.map((f) => ({ name: f.name, bytes: f.data.byteLength })),
      triangles: Math.round(triangles),
      meshes,
      materials: materials.size,
      textures: textures.size,
      animations: animations.length,
      size: size.toArray().map((v) => +v.toFixed(4)),
      bytes: glb.byteLength,
    },
    warnings,
  };
}
