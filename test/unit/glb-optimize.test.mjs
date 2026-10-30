import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Document, NodeIO } from '@gltf-transform/core';
import { optimizeGlb, validateGlb } from '../../scripts/lib/export/glb.mjs';

/** One triangle with the given RGBA vertex colours. */
async function triangle(colors) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const accessor = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const primitive = doc
    .createPrimitive()
    .setAttribute('POSITION', accessor('VEC3', new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])))
    .setAttribute('COLOR_0', accessor('VEC4', new Float32Array(colors)))
    .setIndices(accessor('SCALAR', new Uint16Array([0, 1, 2])));
  doc.createScene().addChild(doc.createNode().setMesh(doc.createMesh().addPrimitive(primitive)));
  return new NodeIO().writeBinary(doc);
}

describe('optimizeGlb', () => {
  it('keeps vertex colours inside 0..1 (weld() can average them to 1.0026, which the validator rejects)', async () => {
    const raw = await triangle([1.0026, 0.5, -0.001, 1, 1, 1, 1, 1, 0, 0, 0, 1]);
    assert.ok((await validateGlb(raw)).errors > 0, 'the input is invalid, as a welded mesh can be');
    const cleaned = await optimizeGlb(raw);
    assert.equal((await validateGlb(cleaned)).errors, 0);
    const doc = await new NodeIO().readBinary(new Uint8Array(cleaned));
    const colors = doc.getRoot().listMeshes()[0].listPrimitives()[0].getAttribute('COLOR_0').getArray();
    assert.ok(colors.every((v) => v >= 0 && v <= 1));
    assert.equal(colors[1], 0.5, 'values inside the range are left alone');
  });
});
