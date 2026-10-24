// Checking and cleaning GLB files in Node (tooling tier: needs `npm ci`). Used by verify, the exporter and uploads.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, getBounds, prune, weld } from '@gltf-transform/functions';
import validator from 'gltf-validator';

const io = () => new NodeIO().registerExtensions(ALL_EXTENSIONS);

/** Khronos glTF-Validator report: { errors, warnings, messages: [{ code, message, pointer, severity }] }. */
export async function validateGlb(bytes) {
  const report = await validator.validateBytes(new Uint8Array(bytes), { maxIssues: 50 });
  return {
    errors: report.issues.numErrors,
    warnings: report.issues.numWarnings,
    messages: report.issues.messages.map(({ code, message, pointer, severity }) => ({ code, message, pointer, severity })),
  };
}

/** Size in metres, counts and names: what a book developer wants to know about a GLB. */
export async function glbInfo(bytes) {
  const doc = await io().readBinary(new Uint8Array(bytes));
  const root = doc.getRoot();
  const scene = root.getDefaultScene() || root.listScenes()[0];
  const { min, max } = getBounds(scene);
  let triangles = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const n = prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION')?.getCount() ?? 0;
      if (prim.getMode() === 4) triangles += n / 3;
    }
  }
  return {
    bytes: bytes.byteLength ?? bytes.length,
    size: max.map((v, i) => +(v - min[i]).toFixed(4)),
    meshes: root.listMeshes().length,
    materials: root.listMaterials().length,
    textures: root.listTextures().length,
    triangles: Math.round(triangles),
    nodes: root.listNodes().length,
    extras: root.listNodes()[0]?.getExtras() || {},
  };
}

/** Removes duplicates and unused data, merges identical vertices. Same look, smaller file. */
export async function optimizeGlb(bytes) {
  const doc = await io().readBinary(new Uint8Array(bytes));
  await doc.transform(dedup(), prune(), weld());
  return io().writeBinary(doc);
}
