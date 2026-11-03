// The setting, in metres (the bench top is y = 0): a calm light backdrop (blue-grey above, warm grey low, in screen
// space, like the chapter's other figures) and a lab bench of pale oak boards with a rounded front edge; the bench's far
// part fades into the backdrop (the fade is in the texture's alpha). Nothing else: no shelves or props. Procedural, no
// image files; one 1024×512 texture, made once, not repeated.
import * as THREE from 'three';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * One white 1×1 map, shared by every material that has no picture of its own: with a map on all of them, the opaque
 * parts share one shader program and the transparent ones another (two to compile instead of four; the compile is
 * what makes the first picture slow on a phone).
 */
export const plainMap = (() => {
  const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  t.name = 'Plain';
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
})();

/** The backdrop: soft blue-grey at the top to a warm light grey low down. */
export function backdropTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#8ea6bd');
    s.addColorStop(0.45, '#b4c4d2');
    s.addColorStop(0.8, '#d7d6d0');
    s.addColorStop(1, '#ddd7cb');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/**
 * Pale oak boards seen from above, running left to right, with butt joints and fine grain; the far part fades to
 * nothing (alpha), the top of the picture being the far side of the bench.
 */
function oakTop() {
  return canvasTex(1024, 512, (ctx, W, H) => {
    const r = rng(17);
    const rows = 11;
    const rh = H / rows;
    for (let p = 0; p < rows; p++) {
      const y0 = p * rh;
      // each board is cut in two lengths, so the joints do not line up
      const cut = W * (0.25 + r() * 0.5);
      for (const [x0, x1] of [
        [0, cut],
        [cut, W],
      ]) {
        ctx.fillStyle = `hsl(${31 + r() * 4}, ${26 + r() * 8}%, ${45 + r() * 7}%)`;
        ctx.fillRect(x0, y0, x1 - x0, rh);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, y0, x1 - x0, rh);
        ctx.clip();
        for (let i = 0; i < 16; i++) {
          const y = y0 + r() * rh;
          ctx.strokeStyle = r() < 0.35 ? `rgba(255,236,205,${0.1 + r() * 0.12})` : `rgba(96,62,32,${0.1 + r() * 0.2})`;
          ctx.lineWidth = 0.5 + r() * 1.1;
          ctx.beginPath();
          const ph = r() * 6;
          const am = 1 + r() * 2.2;
          for (let x = x0; x <= x1 + 12; x += 12) {
            const yy = y + Math.sin(x * 0.007 + ph) * am + Math.sin(x * 0.03 + i) * 0.5;
            if (x === x0) ctx.moveTo(x, yy);
            else ctx.lineTo(x, yy);
          }
          ctx.stroke();
        }
        ctx.restore();
        ctx.fillStyle = 'rgba(70,44,22,0.5)';
        ctx.fillRect(x0, y0, 1, rh);
      }
      ctx.fillStyle = 'rgba(70,44,22,0.55)';
      ctx.fillRect(0, y0, W, 1.5);
    }
    // the far part fades into the backdrop
    ctx.globalCompositeOperation = 'destination-out';
    const fade = ctx.createLinearGradient(0, 0, 0, H * 0.42);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, H * 0.42);
  });
}

export function createSetting() {
  const root = new THREE.Group();
  root.name = 'Setting';
  root.userData.noExport = true;
  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.8),
    new THREE.MeshStandardMaterial({ name: 'BenchTop', map: oakTop(), transparent: true, roughness: 0.62, metalness: 0 }),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.set(0.1, 0, -0.35);
  top.receiveShadow = true;
  top.renderOrder = -1;
  root.add(top);
  // the bench's rounded front edge and its face
  const edge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 3.2, 16, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ name: 'BenchEdge', map: plainMap, color: '#a97f55', roughness: 0.55 }),
  );
  edge.rotation.z = Math.PI / 2;
  edge.rotation.x = Math.PI;
  edge.position.set(0.1, -0.02, 0.55);
  root.add(edge);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.5),
    new THREE.MeshStandardMaterial({ name: 'BenchFace', map: plainMap, color: '#8a6643', roughness: 0.7 }),
  );
  face.position.set(0.1, -0.27, 0.57);
  root.add(face);
  return { root };
}
