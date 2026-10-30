// Checking and cleaning GLB files in Node (tooling tier: needs `npm ci`). Used by verify, the exporter and uploads.
import { Accessor, Logger, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, getBounds, prune, weld } from '@gltf-transform/functions';
import validator from 'gltf-validator';

// Quiet: extensions gltf-transform doesn't know (e.g. EXT_materials_bump, optional) are dropped without a fuss.
const quiet = new Logger(Logger.Verbosity.ERROR);
const io = () => new NodeIO().setLogger(quiet).registerExtensions(ALL_EXTENSIONS);

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

/**
 * Keeps vertex colours inside 0..1. weld() averages the colours of the vertices it merges in floating point, which can land
 * a hair above 1 (1.0026); the format and the validator (ACCESSOR_NON_CLAMPED) want 0..1. Integer colours cannot leave the range.
 */
function clampColors(doc) {
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives())
      for (const semantic of prim.listSemantics().filter((s) => s.startsWith('COLOR_'))) {
        const accessor = prim.getAttribute(semantic);
        if (!accessor || accessor.getComponentType() !== Accessor.ComponentType.FLOAT) continue;
        const values = accessor.getArray();
        if (!values) continue;
        for (let i = 0; i < values.length; i++) values[i] = Math.min(1, Math.max(0, values[i]));
        accessor.setArray(values);
      }
}

/** Removes duplicates and unused data, merges identical vertices. Same look, smaller file. */
export async function optimizeGlb(bytes) {
  const doc = await io().readBinary(new Uint8Array(bytes));
  doc.setLogger(quiet);
  await doc.transform(dedup(), prune(), weld());
  clampColors(doc);
  return io().writeBinary(doc);
}
