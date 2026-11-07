// The charges as signs: a red disc with a white "+" (positive, the protons that stay in the material) and a blue disc
// with a white "−" (an electron, the only charge that moves), each in a white ring, always facing the camera and drawn
// over the objects, as a textbook draws them (the sign is never colour alone). Two InstancedMeshes, one per sign: two
// draw calls for every charge in the scene. Each sign follows a function that writes its world position and returns
// its size (0 hides it), read once per drawn frame; nothing is allocated per frame.
import * as THREE from 'three';

export const POS = '#e03131';
export const NEG = '#1971c2';

/** A unit token in the xy plane: a white ring, the coloured disc, the white bars of the sign (drawn in that order). */
function tokenGeometry(color, plus) {
  const parts = [];
  const paint = (g, c) => {
    const col = new THREE.Color(c);
    const n = g.attributes.position.count;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) a.set([col.r, col.g, col.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    return g;
  };
  parts.push(paint(new THREE.CircleGeometry(1, 28), '#ffffff'));
  parts.push(paint(new THREE.CircleGeometry(0.8, 28), color));
  parts.push(paint(new THREE.PlaneGeometry(1.0, 0.22), '#ffffff'));
  if (plus) parts.push(paint(new THREE.PlaneGeometry(0.22, 1.0), '#ffffff'));
  // one geometry, the parts in draw order (no depth test: later triangles paint over earlier ones)
  const out = new THREE.BufferGeometry();
  const pos = [];
  const col = [];
  const idx = [];
  let base = 0;
  for (const g of parts) {
    const p = g.attributes.position;
    const c = g.attributes.color;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), 0);
      col.push(c.getX(i), c.getY(i), c.getZ(i));
    }
    const ix = g.index ? Array.from(g.index.array) : [...Array(p.count).keys()];
    for (const i of ix) idx.push(base + i);
    base += p.count;
  }
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.setIndex(idx);
  return out;
}

/**
 * createCharges({ max }) → { root, add(sign, place), update(camera, height, width), boxes(), count }. `place(out)`
 * writes the sign's world position into `out` and returns its size (1 = full, 0 = hidden). A sign's radius is the world
 * radius `radius`, or `minPx` pixels on the screen if that is bigger, so the signs stay readable on a phone.
 */
export function createCharges({ max = 96, radius = 0.0058, minPx = 7.5, order = 20 } = {}) {
  const root = new THREE.Group();
  root.name = 'Charges';
  root.userData.noExport = true;
  const mat = new THREE.MeshBasicMaterial({
    name: 'ChargeSign',
    vertexColors: true,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
    fog: false,
  });
  const meshes = {
    '+': new THREE.InstancedMesh(tokenGeometry(POS, true), mat, max),
    '-': new THREE.InstancedMesh(tokenGeometry(NEG, false), mat, max),
  };
  for (const [s, m] of Object.entries(meshes)) {
    m.name = s === '+' ? 'Positive' : 'Negative';
    m.count = 0;
    m.frustumCulled = false;
    m.renderOrder = order + (s === '-' ? 1 : 0); // the electrons over the protons (they are the ones that move)
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(m);
  }
  /** @type {{ sign: '+' | '-', place: (out: THREE.Vector3) => number }[]} */
  const list = [];
  const P = new THREE.Vector3();
  const S = new THREE.Vector3();
  const M = new THREE.Matrix4();
  const HIDE = new THREE.Matrix4().makeScale(0, 0, 0);

  // each shown sign's box on the screen (CSS pixels), for the labels to keep clear of; reused, never reallocated
  const boxes = [];
  let nBoxes = 0;
  const NDC = new THREE.Vector3();
  function add(sign, place) {
    list.push({ sign, place });
    return list.length - 1;
  }
  /** Places every sign for this frame. `height`: the view's height in CSS pixels. */
  function update(camera, height, width = height) {
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const n = { '+': 0, '-': 0 };
    nBoxes = 0;
    for (const c of list) {
      const k = c.place(P);
      const m = meshes[c.sign];
      const i = n[c.sign]++;
      if (!(k > 0)) {
        m.setMatrixAt(i, HIDE);
        continue;
      }
      const d = camera.position.distanceTo(P);
      const perPx = (2 * d * tanV) / Math.max(1, height);
      const r = Math.max(radius, minPx * perPx) * k;
      S.set(r, r, r);
      M.compose(P, camera.quaternion, S);
      m.setMatrixAt(i, M);
      NDC.copy(P).project(camera);
      const px = r / perPx + 1;
      const b = boxes[nBoxes] || (boxes[nBoxes] = { left: 0, top: 0, right: 0, bottom: 0 });
      nBoxes++;
      const x = (NDC.x * 0.5 + 0.5) * width;
      const y = (-NDC.y * 0.5 + 0.5) * height;
      b.left = x - px;
      b.right = x + px;
      b.top = y - px;
      b.bottom = y + px;
    }
    boxes.length = Math.max(boxes.length, nBoxes);
    for (const s of ['+', '-']) {
      meshes[s].count = n[s];
      meshes[s].instanceMatrix.needsUpdate = true;
    }
  }
  return {
    root,
    add,
    update,
    meshes,
    /** The boxes of the signs shown in the last frame (the array is reused: read it, don't keep it). */
    boxes: () => boxes.slice(0, nBoxes),
    get count() {
      return list.length;
    },
  };
}
