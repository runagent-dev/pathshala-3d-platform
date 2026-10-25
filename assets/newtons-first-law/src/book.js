// The book that slides: a class 9–10 physics textbook lying flat (metres), drawn to be recognised at a glance on a
// phone: a hardcover whose boards stand a little proud of a cream page block (page lines on its three open edges),
// rounded outer corners, a rounded spine, and a printed cover: "পদার্থবিজ্ঞান", "নবম-দশম শ্রেণি" and an atom in a
// white disc, in the blue and green of the board's covers (a canvas texture in the bundled Noto Sans Bengali; the
// font is loaded before the figure is made). It lies with its spine at the back (−x, against the launcher's paddle)
// and the cover's top away from the viewer (−z), so the title reads upright in the side view. Its origin is on the
// floor under the middle of the front edge (+x), so x along the floor reads like the tape.
import * as THREE from 'three';
import { FONT, textMesh } from '@shared/student/materials.js';
import { BOOK } from './motion.js';

export const BOOK_COLORS = { cover: '#1d5aa0', band: '#2b8a3e', stripe: '#e03131', title: '#ffffff', klass: '#ffd43b' };
const BOARD = 0.0022; // m: board thickness
const OVERHANG = 0.003; // m: the boards stand this far proud of the pages on the three open edges
const CORNER = 0.006; // m: rounded outer corners of the boards

/** The printed front cover (portrait: its width along x, its height along z, the top at −z). */
function coverTexture(t, aspect) {
  const W = 600;
  const H = Math.round(W / aspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  // the board's cloth: blue, a little lighter towards the top
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2366b3');
  g.addColorStop(1, BOOK_COLORS.cover);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // a thin frame inset from the edges
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, W - 44, H - 44);
  // the title and the class
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = BOOK_COLORS.title;
  const fit = (text, weight, size, max) => {
    let s = size;
    do ctx.font = `${weight} ${s--}px ${FONT}`;
    while (ctx.measureText(text).width > max && s > 10);
  };
  fit(t('book_title'), 700, 100, W - 150);
  ctx.fillText(t('book_title'), W / 2, H * 0.19);
  ctx.fillStyle = BOOK_COLORS.klass;
  fit(t('book_class'), 700, 52, W - 140);
  ctx.fillText(t('book_class'), W / 2, H * 0.28);
  // an atom in a white disc: the nucleus, three orbits, an electron on each
  const cx = W / 2;
  const cy = H * 0.58;
  const R = W * 0.3;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = BOOK_COLORS.cover;
  const orbit = R * 0.8;
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3 + Math.PI / 6;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbit, orbit * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    // its electron
    ctx.fillStyle = '#f08c00';
    ctx.beginPath();
    ctx.arc(orbit * Math.cos(1.1 + k * 2), orbit * 0.34 * Math.sin(1.1 + k * 2), 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // the nucleus: a little cluster of protons (red) and neutrons (grey)
  for (const [dx, dy, col] of [
    [-11, -8, '#d6336c'],
    [10, -10, '#868e96'],
    [-9, 11, '#868e96'],
    [12, 9, '#d6336c'],
    [0, 0, '#e03131'],
  ]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  // the bottom: a red line and a green band, as on the board's covers
  ctx.fillStyle = BOOK_COLORS.stripe;
  ctx.fillRect(0, H * 0.885, W, H * 0.014);
  ctx.fillStyle = BOOK_COLORS.band;
  ctx.fillRect(0, H * 0.899, W, H * 0.101);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Page lines on the page block's open edges (lines along the edge, stacked through the thickness). */
function pagesTexture() {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f6efdc';
  ctx.fillRect(0, 0, 8, 96);
  for (let y = 2; y < 96; y += 5) {
    ctx.fillStyle = `rgba(140,118,80,${0.3 + ((y * 7) % 5) * 0.05})`;
    ctx.fillRect(0, y, 8, 1.4);
  }
  // a little shade under the boards, top and bottom
  const g = ctx.createLinearGradient(0, 0, 0, 96);
  g.addColorStop(0, 'rgba(90,70,40,0.25)');
  g.addColorStop(0.12, 'rgba(90,70,40,0)');
  g.addColorStop(0.88, 'rgba(90,70,40,0)');
  g.addColorStop(1, 'rgba(90,70,40,0.25)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 96);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * A board: a slab x0…x1 along x, the book's width along z, `BOARD` thick, its outer corners (+x) rounded; its top
 * face carries `map` (u along x, v from the near edge +z up to the far edge −z, so a cover reads upright).
 */
function board(x0, x1, w, faceMat, edgeMat) {
  const r = CORNER;
  const z = w / 2;
  const s = new THREE.Shape();
  s.moveTo(x0, -z);
  s.lineTo(x1 - r, -z);
  s.quadraticCurveTo(x1, -z, x1, -z + r);
  s.lineTo(x1, z - r);
  s.quadraticCurveTo(x1, z, x1 - r, z);
  s.lineTo(x0, z);
  s.lineTo(x0, -z);
  const uv = {
    generateTopUV: (_g, v, a, b, c) => [a, b, c].map((i) => new THREE.Vector2((v[i * 3] - x0) / (x1 - x0), 0.5 - v[i * 3 + 1] / w)),
    generateSideWallUV: () => [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()],
  };
  const g = new THREE.ExtrudeGeometry(s, { depth: BOARD, bevelEnabled: false, curveSegments: 5, UVGenerator: uv });
  g.rotateX(Math.PI / 2); // the shape's y becomes z; extruded from y = 0 down to −BOARD; the cap at y = 0 faces up
  g.translate(0, BOARD, 0);
  return new THREE.Mesh(g, [faceMat, edgeMat]);
}

/**
 * @param {{ t: (key: string) => string }} options
 */
export function createBook({ t }) {
  const root = new THREE.Group();
  root.name = 'Book';
  const { length: L, width: W, thick: H } = BOOK;
  const cloth = new THREE.MeshStandardMaterial({ name: 'BookBoard', color: BOOK_COLORS.cover, roughness: 0.6 });
  const cover = new THREE.MeshStandardMaterial({ name: 'BookCover', map: coverTexture(t, L / W), roughness: 0.5 });
  const pageLines = pagesTexture();
  const pages = new THREE.MeshStandardMaterial({ name: 'BookPages', map: pageLines, roughness: 0.9 });
  const paper = new THREE.MeshStandardMaterial({ name: 'BookPaper', color: '#f6efdc', roughness: 0.9 });

  const body = new THREE.Group(); // centred on the book; the root's origin is at the front edge
  body.name = 'BookBody';
  body.position.x = -L / 2;
  root.add(body);

  const spineR = H / 2;
  const bulge = 0.006; // m: how far the rounded spine stands out behind the boards
  const x0 = -L / 2 + bulge; // the boards and the page block start where the spine's curve ends
  const x1 = L / 2;
  const bottom = board(x0, x1, W, cloth, cloth);
  const top = board(x0, x1, W, cover, cloth);
  top.position.y = H - BOARD;
  // the page block between the boards, a little in from their edges
  const blockL = x1 - OVERHANG - x0;
  const block = new THREE.Mesh(new THREE.BoxGeometry(blockL, H - 2 * BOARD, W - 2 * OVERHANG), [pages, paper, paper, paper, pages, pages]);
  block.position.set(x0 + blockL / 2, H / 2, 0);
  // the spine: a flattened half-cylinder along z, round the back of the page block
  const spineGeo = new THREE.CylinderGeometry(spineR, spineR, W, 18, 1, false, Math.PI, Math.PI);
  spineGeo.rotateX(Math.PI / 2);
  const spine = new THREE.Mesh(spineGeo, cloth);
  spine.scale.x = bulge / spineR;
  spine.position.set(x0, H / 2, 0);
  // the title along the spine, reading from the top of the book (far, −z) to its foot
  const spineTitle = textMesh(t('book_title'), H * 0.42, { color: '#ffffff', weight: 700 });
  spineTitle.rotation.y = -Math.PI / 2;
  spineTitle.position.set(-L / 2 - 0.0004, H / 2, -W * 0.12);
  body.add(bottom, top, block, spine, spineTitle);
  return { root, body };
}
