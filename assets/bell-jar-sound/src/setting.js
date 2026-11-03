// The setting, in metres (the bench top is y = 0): a soft dusk-plum backdrop (screen space) and a lab bench of dark
// oiled iroko with a rounded front edge; the bench's far part fades into the backdrop. Nothing else: no shelves or
// props. Procedural, no image files.
import * as THREE from 'three';

function canvasTex(w, h, draw, { repeat = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 8;
  return t;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The backdrop: a deep slate-plum at the top to a warm dusky rose low down. */
export function backdropTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#2c2f4a');
    s.addColorStop(0.45, '#4a4566');
    s.addColorStop(0.8, '#7b6a83');
    s.addColorStop(1, '#8e7b8c');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/** Oiled iroko planks, seen from above, running left to right. */
function iroko() {
  return canvasTex(
    1024,
    512,
    (ctx, W, H) => {
      const r = rng(17);
      const rows = 5;
      for (let p = 0; p < rows; p++) {
        const y0 = (p * H) / rows;
        ctx.fillStyle = `hsl(${24 + r() * 5}, ${38 + r() * 8}%, ${27 + r() * 5}%)`;
        ctx.fillRect(0, y0, W, H / rows);
        for (let i = 0; i < 22; i++) {
          const y = y0 + r() * (H / rows);
          ctx.strokeStyle = `rgba(${r() < 0.3 ? '190,120,70' : '40,18,6'},${0.08 + r() * 0.18})`;
          ctx.lineWidth = 0.6 + r() * 1.8;
          ctx.beginPath();
          const ph = r() * 6;
          for (let x = 0; x <= W; x += 16) {
            const yy = y + Math.sin(x * 0.006 + ph) * 3 + Math.sin(x * 0.02 + i) * 0.8;
            x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
          }
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(20,8,2,0.55)';
        ctx.fillRect(0, y0, W, 2);
      }
    },
    { repeat: [2, 1.4] },
  );
}

/** How the bench fades into the backdrop far behind (alpha). */
function fadeAlpha() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#000');
    s.addColorStop(0.35, '#fff');
    s.addColorStop(1, '#fff');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

export function createSetting() {
  const root = new THREE.Group();
  root.name = 'Setting';
  root.userData.noExport = true;
  const wood = iroko();
  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.8),
    new THREE.MeshStandardMaterial({ name: 'BenchTop', map: wood, alphaMap: fadeAlpha(), transparent: true, roughness: 0.55, metalness: 0 }),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.set(0.1, 0, -0.35);
  top.receiveShadow = true;
  top.renderOrder = -1;
  root.add(top);
  // the bench's rounded front edge and its face
  const edge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 3.2, 16, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ name: 'BenchEdge', map: wood, color: '#d9c6b8', roughness: 0.5 }),
  );
  edge.rotation.z = Math.PI / 2;
  edge.rotation.x = Math.PI;
  edge.position.set(0.1, -0.02, 0.55);
  root.add(edge);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.5),
    new THREE.MeshStandardMaterial({ name: 'BenchFace', color: '#3d2416', roughness: 0.7 }),
  );
  face.position.set(0.1, -0.27, 0.57);
  root.add(face);
  return { root };
}
