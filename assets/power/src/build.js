// Small helpers for building the scene: many small parts of one material as one mesh (fewer draw calls, so phones
// stay smooth), a run of pipe with fittings at its bends, a sagging cable.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Collects geometries placed in the world (or in a group's frame) and merges them into one mesh.
 * `add(geo, x, y, z, rx, ry, rz)` places one; `mesh(mat, name)` returns the merged mesh. With a `color`, every part
 * is painted that colour (a vertex colour), so several of these can merge into one mesh: see merged().
 * @param {THREE.ColorRepresentation} [color]
 */
export function parts(color) {
  /** @type {THREE.BufferGeometry[]} */
  const list = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const one = new THREE.Vector3(1, 1, 1);
  return {
    add(geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, scale = one) {
      m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), scale);
      return this.push(geo.applyMatrix4(m));
    },
    /** A geometry already placed. */
    push(geo) {
      if (color != null) tint(geo, color);
      for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(name)) geo.deleteAttribute(name);
      list.push(geo);
      return this;
    },
    get count() {
      return list.length;
    },
    /** The geometries collected so far. */
    get list() {
      return list;
    },
    mesh(mat, name = '') {
      // the same attributes on every part (a part without uv gets zeros, without colours white), so they merge
      const colored = list.some((g) => g.attributes.color);
      for (const g of list) {
        if (!g.attributes.normal) g.computeVertexNormals();
        if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        if (colored && !g.attributes.color) tint(g, '#ffffff');
      }
      // indexed when every part is (smaller to draw and to export), else all without an index
      const all = list.every((g) => g.index) ? list : list.map((g) => (g.index ? g.toNonIndexed() : g));
      const mesh = new THREE.Mesh(all.length ? mergeGeometries(all) : new THREE.BufferGeometry(), mat);
      mesh.name = name;
      return mesh;
    },
  };
}

/**
 * Several painted part lists (see parts(color)) as one mesh of one material with `vertexColors: true`: one draw call
 * for parts of many colours.
 * @param {Array<ReturnType<typeof parts>>} lists
 * @param {THREE.Material} mat
 */
export function merged(lists, mat, name = '') {
  const all = parts();
  for (const l of lists) for (const g of l.list) all.push(g);
  /** @type {any} */ (mat).vertexColors = true;
  return all.mesh(mat, name);
}

/**
 * Paints a geometry one colour (a vertex colour), so parts of many colours can share one material with
 * `vertexColors: true` and draw as one mesh (the flowers, the washing on the line, the blossom on the trees).
 * @param {THREE.BufferGeometry} geo
 * @param {THREE.ColorRepresentation} color
 */
export function tint(geo, color) {
  const c = new THREE.Color(color); // linear, as the renderer expects vertex colours
  const n = geo.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}

/** A key for materials that draw the same (same type, colours, maps and settings), so their meshes can merge. */
function materialKey(m) {
  const c = (x) => (x?.isColor ? x.getHexString() : '');
  return [
    m.type,
    c(m.color),
    c(m.emissive),
    m.emissiveIntensity,
    m.roughness,
    m.metalness,
    m.map?.uuid || '',
    m.transparent,
    m.opacity,
    m.side,
    m.alphaTest,
    m.depthWrite,
    m.flatShading,
    m.vertexColors,
    m.polygonOffset,
    m.polygonOffsetFactor,
    m.fog,
    m.wireframe,
  ].join('|');
}

/** A material that is only a colour (no texture, opaque, not glowing), so a vertex colour can stand for it. */
function isPlain(m) {
  return (
    m.type === 'MeshStandardMaterial' &&
    !m.map &&
    !m.transparent &&
    !m.vertexColors &&
    !m.alphaTest &&
    !m.polygonOffset &&
    !m.wireframe &&
    m.emissive.getHex() === 0 &&
    m.depthWrite
  );
}
/** Plain materials whose roughness and metalness are close enough to look the same share a key. */
function plainKey(m) {
  return ['plain', Math.round(m.roughness / 0.15), Math.round(m.metalness / 0.3), m.side, m.flatShading, m.fog].join('|');
}

/** One geometry per material index of a multi-material mesh (a box with a different face, …). */
function splitByGroups(geo) {
  const out = new Map();
  const src = geo.index ? geo : null;
  for (const gr of geo.groups) {
    const g = new THREE.BufferGeometry();
    for (const name of ['position', 'normal', 'uv']) if (geo.attributes[name]) g.setAttribute(name, geo.attributes[name].clone());
    if (src) g.setIndex(Array.from(src.index.array.slice(gr.start, gr.start + gr.count)));
    else g.setIndex(Array.from({ length: gr.count }, (_, i) => gr.start + i));
    if (!out.has(gr.materialIndex)) out.set(gr.materialIndex, []);
    out.get(gr.materialIndex).push(g);
  }
  return out;
}

/**
 * Bakes the still meshes under `group` into one mesh per material (materials that draw the same count as one), in
 * the group's own frame: the scenery's hundreds of parts become a few dozen draw calls, with every detail kept.
 * Left as they are: `keep` (and what is under them), groups marked noExport (bake those on their own), sprites,
 * lights, instanced and hidden meshes. Empty groups left behind are removed. Returns the merged meshes.
 * @param {THREE.Object3D} group
 * @param {{ keep?: THREE.Object3D[], name?: string, materials?: Map<string, THREE.Material> }} [o]
 *   materials: a shared table, so two bakes (the two pumps…) use the very same material objects
 */
export function bake(group, { keep = [], name = group.name, materials = new Map() } = {}) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const m = new THREE.Matrix4();
  /** @type {Map<string, { mat: THREE.Material, parts: ReturnType<typeof parts>, cast: boolean, receive: boolean }>} */
  const bins = new Map();
  const bin = (mat, mesh) => {
    // plain painted materials (one colour, no texture) of about the same finish share one material with vertex
    // colours: the white plaster and the off-white trim, the PVC, the conduit and the switch boards, …
    const plain = isPlain(mat);
    const k = plain ? plainKey(mat) : materialKey(mat);
    if (!materials.has(k))
      materials.set(
        k,
        plain
          ? new THREE.MeshStandardMaterial({
              name: `Painted${Math.round(mat.roughness * 10)}${mat.metalness > 0.15 ? 'Metal' : ''}`,
              vertexColors: true,
              roughness: mat.roughness,
              metalness: mat.metalness,
              side: mat.side,
              flatShading: mat.flatShading,
            })
          : mat,
      );
    if (!bins.has(k)) bins.set(k, { mat: materials.get(k), parts: parts(), cast: false, receive: false });
    const b = bins.get(k);
    b.cast ||= mesh.castShadow;
    b.receive ||= mesh.receiveShadow;
    return { push: (g) => b.parts.push(plain ? tint(g, mat.color) : g) };
  };
  // an exported group never takes in parts kept out of the model (they are baked on their own); inside a group
  // that is itself left out of the model, everything may merge
  let hidden = false;
  for (let a = group; a; a = a.parent) hidden ||= Boolean(a.userData.noExport);
  const visit = (o) => {
    for (const c of [...o.children]) {
      if (keep.includes(c) || (c.userData.noExport && !hidden) || !c.visible) continue;
      const mesh = /** @type {THREE.Mesh} */ (c);
      if (mesh.isMesh && !(/** @type {any} */ (mesh).isInstancedMesh) && !mesh.children.length) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        if (mats.some((x) => x.visible === false)) continue;
        m.multiplyMatrices(inv, mesh.matrixWorld);
        if (Array.isArray(mesh.material)) {
          for (const [i, list] of splitByGroups(mesh.geometry)) for (const g of list) bin(mats[i], mesh).push(g.applyMatrix4(m));
        } else bin(mesh.material, mesh).push(mesh.geometry.clone().applyMatrix4(m));
        o.remove(mesh);
      } else if (!mesh.isMesh && !(/** @type {any} */ (c).isLight) && !(/** @type {any} */ (c).isSprite)) visit(c);
    }
    // groups emptied by the bake go too
    if (o !== group && !o.children.length && !o.isMesh && o.parent) o.parent.remove(o);
  };
  visit(group);
  const out = [];
  let i = 0;
  for (const b of bins.values()) {
    const mesh = b.parts.mesh(b.mat, b.mat.name ? `${name}_${b.mat.name}` : `${name}_${++i}`);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    group.add(mesh);
    out.push(mesh);
  }
  return out;
}

/** A cylinder between two points (for pipes, rods and posts). */
export function rod(a, b, r, seg = 12) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

/** A run of pipe through points, with a fitting at every bend; one mesh for the pipe, one for the fittings. */
export function pipeRun(points, mat, fitMat, r) {
  const g = new THREE.Group();
  const pipe = parts();
  const fits = parts();
  for (let i = 0; i < points.length - 1; i++) if (points[i].distanceTo(points[i + 1]) > 1e-4) pipe.push(rod(points[i], points[i + 1], r, 16));
  for (let i = 1; i < points.length - 1; i++) fits.add(new THREE.SphereGeometry(r * 1.32, 16, 12), points[i].x, points[i].y, points[i].z);
  // a coupling every metre or so along the long runs
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = a.distanceTo(b);
    for (let d = 0.9; d < len - 0.3; d += 1.1) {
      const p = a.clone().lerp(b, d / len);
      fits.push(
        rod(
          p.clone().addScaledVector(b.clone().sub(a).normalize(), -0.035),
          p.clone().addScaledVector(b.clone().sub(a).normalize(), 0.035),
          r * 1.18,
          16,
        ),
      );
    }
  }
  g.add(pipe.mesh(mat, 'Pipe'), fits.mesh(fitMat, 'Fittings'));
  return g;
}

/** A soft cable through points (a smooth curve). */
export function cable(points, r = 0.007) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2), Math.max(8, points.length * 10), r, 6);
}
