// The charges drawn as small round chips that always face the camera, as in the sister figures: positive red (#e03131)
// with a white "+", negative (electrons) blue (#1971c2) with a white "−", each with a thin dark edge so it reads on
// gold, glass, the dark comb and the blue backdrop; the sign is always drawn, never colour alone. Two Points objects
// (one draw call each); every chip has a position and an opacity, written in place each frame (no allocations). A chip
// is nudged a few millimetres toward the camera so it sits in front of the thin part it is on, from any side, and can
// be stacked up or down the view: a neutral place is a "+" over a "−".
import * as THREE from 'three';

export const CHARGE_COLORS = { plus: '#e03131', minus: '#1971c2', edge: '#10213a' };

function beadTexture(color, sign) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  g.beginPath();
  g.arc(32, 32, 29, 0, Math.PI * 2);
  g.fillStyle = CHARGE_COLORS.edge;
  g.fill();
  g.beginPath();
  g.arc(32, 32, 25.5, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
  g.fillStyle = '#ffffff';
  g.fillRect(17, 28, 30, 8);
  if (sign === '+') g.fillRect(28, 17, 8, 30);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

function beads(name, color, sign, count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 4).fill(1);
  for (let i = 0; i < count; i++) col[i * 4 + 3] = 0;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.PointsMaterial({
    name,
    map: beadTexture(color, sign),
    size: 7,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: false,
    depthTest: false, // always in view: a chip is a sign drawn on the picture, not a thing in the bottle
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = name;
  pts.frustumCulled = false;
  pts.renderOrder = 12;
  pts.userData.noExport = true;
  return pts;
}

/**
 * plusCount / minusCount: how many chips of each kind at most. Use: begin(camera), then put('plus' | 'minus',
 * position, opacity, lift) for each chip shown, then end(); the rest are hidden.
 */
export function createCharges(plusCount, minusCount) {
  const plus = beads('PositiveCharges', CHARGE_COLORS.plus, '+', plusCount);
  const minus = beads('Electrons', CHARGE_COLORS.minus, '−', minusCount);
  const sets = { plus: { pts: plus, n: 0, max: plusCount }, minus: { pts: minus, n: 0, max: minusCount } };
  const toCam = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  let chipMm = 7; // one chip's height in mm at the target's distance
  return {
    plus,
    minus,
    begin(camera) {
      camPos.setFromMatrixPosition(camera.matrixWorld);
      camUp.setFromMatrixColumn(camera.matrixWorld, 1);
      sets.plus.n = 0;
      sets.minus.n = 0;
    },
    /** One chip at p (world, mm) with opacity a, lifted `lift` mm toward the camera; `stack` moves it up the view,
     * in chip heights (+0.5 and −0.5 make a "+" over a "−"). */
    put(kind, p, a, lift = 3.5, stack = 0) {
      const set = sets[kind];
      if (a <= 0.01 || set.n >= set.max) return;
      const i = set.n++;
      toCam.copy(camPos).sub(p).normalize();
      const pos = set.pts.geometry.attributes.position.array;
      const up = stack * chipMm;
      pos[i * 3] = p.x + toCam.x * lift + camUp.x * up;
      pos[i * 3 + 1] = p.y + toCam.y * lift + camUp.y * up;
      pos[i * 3 + 2] = p.z + toCam.z * lift + camUp.z * up;
      set.pts.geometry.attributes.color.array[i * 4 + 3] = Math.min(1, a);
    },
    end() {
      for (const set of Object.values(sets)) {
        const col = set.pts.geometry.attributes.color.array;
        for (let i = set.n; i < set.max; i++) col[i * 4 + 3] = 0;
        set.pts.geometry.attributes.position.needsUpdate = true;
        set.pts.geometry.attributes.color.needsUpdate = true;
        set.pts.geometry.setDrawRange(0, Math.max(set.n, 0));
        set.pts.visible = set.n > 0;
      }
    },
    /** The chips' size (world mm, as PointsMaterial reads it) so each is `px` CSS pixels across at the target's
     * distance (or `mm` across, if that is bigger). */
    setSize(camera, distance, heightPx, px, mm) {
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      // PointsMaterial: on-screen size (buffer px) = size × (buffer height / 2) / depth, so for a bead `px` CSS px
      // across: size = 2 px depth / CSS height. A bead `mm` across: px = mm × height / (2 depth tan).
      const mmPx = (mm * heightPx) / (2 * distance * tan);
      const want = Math.max(px, mmPx);
      const size = (2 * want * distance) / Math.max(1, heightPx);
      plus.material.size = size;
      minus.material.size = size;
      chipMm = (want * 2 * distance * tan) / Math.max(1, heightPx);
      return want;
    },
  };
}
