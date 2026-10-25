// Small pieces the scenes share: materials by colour, a tube between two points, a wheel, a ground patch with a
// soft edge (so each scene stands on the white page), a canvas texture, and an invisible tap target.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const cache = new Map();

/** A plain material (cached by its settings). */
export function mat(color, { roughness = 0.7, metalness = 0, name } = {}) {
  const key = `${color}|${roughness}|${metalness}`;
  if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ name: name || `Paint ${color}`, color, roughness, metalness }));
  return cache.get(key);
}

const unitTube = new THREE.CylinderGeometry(1, 1, 1, 12);
const tmp = new THREE.Vector3();

/** Put a unit-tube mesh between a and b with radius r (returns the mesh). */
export function placeTube(mesh, a, b, r) {
  tmp.subVectors(b, a);
  const len = tmp.length();
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UP, tmp.divideScalar(len || 1));
  mesh.scale.set(r, len, r);
  return mesh;
}
export function tube(a, b, r, material, parent) {
  const mesh = placeTube(new THREE.Mesh(unitTube, material), a, b, r);
  parent?.add(mesh);
  return mesh;
}

export const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** A box with its centre at (x, y, z). */
export function box(w, h, d, material, x = 0, y = 0, z = 0, parent) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  parent?.add(mesh);
  return mesh;
}

/** A wheel turning about z: tyre, rim and hub. */
export function wheel(r, width, { tyre = '#23262b', rim = '#c3c9d0', hub = '#8a929c' } = {}) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, width, 28), mat(tyre, { roughness: 0.85 }));
  t.rotation.x = Math.PI / 2;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, width * 1.04, 20), mat(rim, { roughness: 0.4, metalness: 0.6 }));
  disc.rotation.x = Math.PI / 2;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, width * 1.12, 12), mat(hub, { roughness: 0.4, metalness: 0.5 }));
  cap.rotation.x = Math.PI / 2;
  g.add(t, disc, cap);
  // two bolts make the turning visible
  for (const a of [0, Math.PI]) {
    const bolt = new THREE.Mesh(new THREE.BoxGeometry(r * 0.16, r * 0.16, width * 1.1), mat('#5c636c', { roughness: 0.5 }));
    bolt.position.set(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, 0);
    g.add(bolt);
  }
  return g;
}

/** A canvas texture drawn by `draw(ctx, w, h)`. */
export function canvasTexture(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  return t;
}

/**
 * A ground patch w × d (m) that fades out at its edges into the white page: the scene stands on something, and
 * nothing ends in a hard line. `draw` paints the middle (floor boards, concrete, a table top…).
 */
export function groundPatch(w, d, { color = '#eef0f2', draw = null, fade = 0.22, px = 512 } = {}) {
  const ratio = d / w;
  const tex = canvasTexture(px, Math.max(8, Math.round(px * ratio)), (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    draw?.(ctx, W, H);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(1, 1);
  const alpha = canvasTexture(
    128,
    128,
    (ctx, W, H) => {
      const img = ctx.createImageData(W, H);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const ex = Math.min(x, W - 1 - x) / (W * fade);
          const ey = Math.min(y, H - 1 - y) / (H * fade);
          const a = Math.max(0, Math.min(1, ex, ey));
          const v = Math.round(255 * a * a * (3 - 2 * a));
          const i = (y * W + x) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
      ctx.putImageData(img, 0, 0);
    },
    { srgb: false },
  );
  alpha.wrapS = alpha.wrapT = THREE.ClampToEdgeWrapping;
  alpha.repeat.set(1, 1);
  const m = new THREE.MeshStandardMaterial({
    name: 'Ground',
    map: tex,
    alphaMap: alpha,
    transparent: true,
    roughness: 0.92,
    metalness: 0,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.renderOrder = -1;
  mesh.name = 'Ground';
  return mesh;
}

/** An invisible box a finger can hit (never exported). */
export function hitBox(w, h, d, x, y, z, parent) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  mesh.position.set(x, y, z);
  mesh.userData.noExport = true;
  parent?.add(mesh);
  return mesh;
}

/** A soft round shadow blob (for things in the air, so their height reads). */
export function blob(r, opacity = 0.35) {
  const tex = canvasTexture(
    64,
    64,
    (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, `rgba(20, 28, 38, ${opacity})`);
      g.addColorStop(1, 'rgba(20, 28, 38, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    },
    { srgb: false },
  );
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * r, 2 * r),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.userData.noExport = true;
  return mesh;
}

/** Cast shadows from every opaque mesh under root. */
export function castShadows(root) {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o.material && !o.material.transparent && o.material.visible !== false) o.castShadow = true;
  });
}
