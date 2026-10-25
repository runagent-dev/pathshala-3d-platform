// The book that slides: a class 9–10 physics textbook lying flat (metres). Soft cover in the green of the
// Bangladesh textbooks, cream page edges, the title on the cover in Noto Sans Bengali. Its origin is on the floor
// under the middle of the front edge (+x), so x along the floor reads like the tape.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { BOOK } from './motion.js';

const COVER = '#2f7a43';

/** A box with gently rounded vertical edges (the page block and the covers). */
function roundedSlab(w, h, d, r) {
  const s = new THREE.Shape();
  const x = w / 2;
  const z = d / 2;
  s.moveTo(-x + r, -z);
  s.lineTo(x - r, -z);
  s.quadraticCurveTo(x, -z, x, -z + r);
  s.lineTo(x, z - r);
  s.quadraticCurveTo(x, z, x - r, z);
  s.lineTo(-x + r, z);
  s.quadraticCurveTo(-x, z, -x, z - r);
  s.lineTo(-x, -z + r);
  s.quadraticCurveTo(-x, -z, -x + r, -z);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 4 });
  g.rotateX(Math.PI / 2); // extruded along −y, from 0 down to −h
  g.translate(0, h, 0);
  return g;
}

/** Fine horizontal lines on the page edges, so the block reads as paper. */
function pagesTexture() {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f3ecd9';
  ctx.fillRect(0, 0, 16, 128);
  for (let y = 0; y < 128; y += 3) {
    ctx.fillStyle = `rgba(150,130,95,${0.18 + ((y * 7) % 5) * 0.03})`;
    ctx.fillRect(0, y, 16, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/**
 * @param {{ t: (key: string) => string }} options
 */
export function createBook({ t }) {
  const root = new THREE.Group();
  root.name = 'Book';
  const { length: L, width: W, thick: H } = BOOK;
  const coverT = 0.0016;
  const cover = new THREE.MeshPhysicalMaterial({ name: 'BookCover', color: COVER, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 });
  const pages = new THREE.MeshStandardMaterial({ name: 'BookPages', map: pagesTexture(), roughness: 0.85 });

  const body = new THREE.Group(); // centred on the book; root's origin is at the front edge
  body.position.x = -L / 2;
  root.add(body);
  const bottom = new THREE.Mesh(roundedSlab(L, coverT, W, 0.004), cover);
  const top = new THREE.Mesh(roundedSlab(L, coverT, W, 0.004), cover);
  top.position.y = H - coverT;
  const block = new THREE.Mesh(new THREE.BoxGeometry(L - 0.006, H - 2 * coverT, W - 0.006), pages);
  block.position.set(0, H / 2, 0.0015);
  // the spine along the far side (−z): the cover wraps round it (half a flattened cylinder, axis along x)
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(H / 2, H / 2, L, 16, 1, false, Math.PI / 2, Math.PI), cover);
  spine.rotation.z = Math.PI / 2;
  spine.position.set(0, H / 2, -W / 2 + 0.001);
  spine.scale.z = 0.45;
  body.add(bottom, top, block, spine);

  // the cover: the title, the class, and a thin frame
  const title = textMesh(t('book_title'), 0.03, { color: '#ffffff', weight: 700 });
  title.rotation.x = -Math.PI / 2;
  title.position.set(0.01, H + 0.0004, 0.012);
  const sub = textMesh(t('book_class'), 0.015, { color: '#e6f2e8', weight: 600 });
  sub.rotation.x = -Math.PI / 2;
  sub.position.set(0.01, H + 0.0004, 0.05);
  const frameMat = new THREE.MeshBasicMaterial({ name: 'BookFrame', color: '#cfe6d4', toneMapped: false });
  const frame = new THREE.Group();
  for (const [w, d, x, z] of [
    [L - 0.03, 0.0018, 0, -W / 2 + 0.018],
    [L - 0.03, 0.0018, 0, W / 2 - 0.016],
    [0.0018, W - 0.034, -L / 2 + 0.015, 0.001],
    [0.0018, W - 0.034, L / 2 - 0.015, 0.001],
  ]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), frameMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, H + 0.0003, z);
    frame.add(m);
  }
  body.add(title, sub, frame);

  return {
    root,
    /** Points on the book in its own frame (for arrows and pointers). */
    size: { L, W, H },
  };
}
