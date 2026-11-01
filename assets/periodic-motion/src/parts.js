// Pieces every example uses: the dashed path (গতিপথ), the mark on it (দাগ), the velocity arrow at the mark (বেগ)
// and the coloured dot that is the moving particle (বস্তুকণা). Sizes are given by each example (in metres).
import * as THREE from 'three';

export const COLORS = {
  path: 0x3d6f99, // calm colours that read on the soft, light backdrop
  mark: 0xe8590c, // the count is taken at the mark: same orange as "পুনরাবৃত্তি" in the panel
  velocity: 0x2b8a3e,
  particle: 0xc2255c,
};

let stripes = null;
/** A tileable stripe (dash) texture used as an alpha map along a tube. */
function stripeTexture() {
  if (stripes) return stripes;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 4;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, 64, 4);
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 38, 4);
  stripes = new THREE.CanvasTexture(c);
  stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping;
  return stripes;
}

/** A dashed tube along a curve: `dash` is the length of one dash + gap, in metres. Not exported (a drawing aid). */
export function dashedPath(curve, { radius, dash, color = COLORS.path, closed = false, segments = 400 }) {
  const geo = new THREE.TubeGeometry(curve, segments, radius, 6, closed);
  const map = stripeTexture().clone();
  map.needsUpdate = true;
  map.repeat.set(Math.max(1, Math.round(curve.getLength() / dash)), 1);
  const mat = new THREE.MeshBasicMaterial({ color, alphaMap: map, alphaTest: 0.5, toneMapped: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'Path';
  mesh.userData.noExport = true;
  return mesh;
}

/** The mark: a short rounded bar across the path (it lies along +x; the example turns it across its path). */
export function createMark(length) {
  const root = new THREE.Group();
  root.name = 'Mark';
  root.userData.noExport = true;
  const mat = new THREE.MeshStandardMaterial({ color: COLORS.mark, roughness: 0.45, emissive: COLORS.mark, emissiveIntensity: 0.25 });
  const r = length * 0.14;
  const bar = new THREE.Mesh(new THREE.CapsuleGeometry(r, length - 2 * r, 6, 16), mat);
  bar.rotation.z = Math.PI / 2;
  root.add(bar);
  let flash = 0;
  return {
    root,
    /** Light up for a moment (a pass). */
    flash() {
      flash = 1;
    },
    /** Fade the flash; returns true while it is still fading. */
    tick(dt) {
      if (flash <= 0) return false;
      flash = Math.max(0, flash - dt * 2.4);
      mat.emissiveIntensity = 0.25 + flash * 0.9;
      bar.scale.setScalar(1 + flash * 0.35);
      return true;
    },
  };
}

/** A velocity arrow (shaft and head, pointed with set()): the particle's own, or a faint ghost left at the mark. */
export function createArrow(thickness, { color = COLORS.velocity, ghost = false } = {}) {
  const root = new THREE.Group();
  root.name = ghost ? 'VelocityGhost' : 'VelocityArrow';
  root.userData.noExport = true;
  // the ghost: a faint copy left at the mark, which the particle's own arrow lands on one period later
  const mat = ghost
    ? new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, depthWrite: false })
    : new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive: color, emissiveIntensity: 0.2 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(thickness, thickness, 1, 14), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(thickness * 2.6, 1, 20), mat);
  root.add(shaft, head);
  const headLen = thickness * 6.5;
  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  let flash = 0;
  return {
    root,
    /** The particle is here again, at the same velocity: the arrow glows for a moment. */
    flash() {
      flash = 1;
    },
    tick(dt) {
      if (flash <= 0) return false;
      flash = Math.max(0, flash - dt * 2);
      if (ghost) mat.opacity = 0.32 + flash * 0.5;
      else mat.emissiveIntensity = 0.2 + flash * 0.8;
      return true;
    },
    /** Point it from `from` along `vector` (world units); a very short arrow keeps a small head. */
    set(from, vector) {
      const len = vector.length();
      root.visible = len > 1e-6;
      if (!root.visible) return;
      root.position.copy(from);
      dir.copy(vector).divideScalar(len);
      root.quaternion.setFromUnitVectors(up, dir);
      const h = Math.min(headLen, len * 0.6);
      const s = Math.max(0, len - h);
      shaft.scale.set(1, Math.max(1e-4, s), 1);
      shaft.position.y = s / 2;
      shaft.visible = s > 1e-4;
      head.scale.set(h / headLen, h, h / headLen);
      head.position.y = s + h / 2;
    },
  };
}

let glowMap = null;
/** A soft pink glow round the particle, so the eye finds it (a picture, not exported). */
export function particleGlow(size) {
  if (!glowMap) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(230, 73, 128, 0.55)');
    grad.addColorStop(0.45, 'rgba(230, 73, 128, 0.22)');
    grad.addColorStop(1, 'rgba(230, 73, 128, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    glowMap = new THREE.CanvasTexture(c);
    glowMap.colorSpace = THREE.SRGBColorSpace;
  }
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowMap, depthWrite: false, depthTest: false, transparent: true, toneMapped: false }),
  );
  sprite.scale.set(size, size, 1);
  sprite.renderOrder = 1;
  sprite.userData.noExport = true;
  return sprite;
}
