// The setting, in metres (the bench's top is y = 0): a warm dusk backdrop (screen space), a long oiled-teak lab bench
// with a bevelled edge, and a dark slate floor below it that fades into the backdrop. Procedural, no image files.
import * as THREE from 'three';

export function canvasTex(w, h, draw, { repeat = null, color = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 16; // the stage clamps it to what the device has; with mipmaps, no stair-steps at a high DPR
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The backdrop: a deep dusk plum at the top to a warm sand low down (screen space). */
export function backdropTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#3b3552');
    s.addColorStop(0.45, '#64587a');
    s.addColorStop(0.8, '#a88c8e');
    s.addColorStop(1, '#bfa294');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/** Oiled teak boards along the bench (x along the texture's width). */
function teak() {
  return canvasTex(
    1024,
    256,
    (ctx, W, H) => {
      const r = rng(11);
      const boards = 4;
      for (let p = 0; p < boards; p++) {
        const y0 = (p * H) / boards;
        ctx.fillStyle = `hsl(${24 + r() * 5}, ${46 + r() * 10}%, ${38 + r() * 7}%)`;
        ctx.fillRect(0, y0, W, H / boards);
        for (let i = 0; i < 26; i++) {
          const y = y0 + r() * (H / boards);
          ctx.strokeStyle = `rgba(66,30,8,${0.1 + r() * 0.22})`;
          ctx.lineWidth = 0.6 + r() * 1.6;
          ctx.beginPath();
          const ph = r() * 6;
          for (let x = 0; x <= W; x += 16) {
            const yy = y + Math.sin(x * 0.006 + ph) * 3 + Math.sin(x * 0.03 + i) * 0.8;
            x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
          }
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(36,14,4,0.55)';
        ctx.fillRect(0, y0, W, 1.5);
      }
    },
    { repeat: [1, 1] },
  );
}

function slate() {
  return canvasTex(
    256,
    256,
    (ctx, W, H) => {
      const r = rng(5);
      ctx.fillStyle = '#4a4458';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 1400; i++) {
        ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.02 + r() * 0.03})` : `rgba(14,10,24,${0.04 + r() * 0.05})`;
        const d = 2 + r() * 7;
        ctx.fillRect(r() * W, r() * H, d, d);
      }
    },
    { repeat: [12, 12] },
  );
}
function fade() {
  return canvasTex(
    256,
    256,
    (ctx, W, H) => {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.1, '#ffffff');
      g.addColorStop(0.42, '#000000');
      g.addColorStop(1, '#000000');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },
    { color: false },
  );
}

export const BENCH = { x0: -1.42, x1: 1.3, z0: -0.34, z1: 0.24, t: 0.045, height: 0.82 };

/** The bench (top, apron, legs) and the floor. */
export function createSetting() {
  const root = new THREE.Group();
  root.name = 'Setting';
  const len = BENCH.x1 - BENCH.x0;
  const depth = BENCH.z1 - BENCH.z0;
  const cx = (BENCH.x0 + BENCH.x1) / 2;
  const cz = (BENCH.z0 + BENCH.z1) / 2;
  const topMat = new THREE.MeshStandardMaterial({ name: 'Teak', map: teak(), roughness: 0.48, metalness: 0 });
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'TeakEdge', color: '#7a3f1a', roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ name: 'BenchFrame', color: '#3a2a22', roughness: 0.7 });
  // the top: a flat board with the grain along x, its front edge rounded (a bevel strip)
  const topGeo = new THREE.BoxGeometry(len, BENCH.t, depth);
  const top = new THREE.Mesh(topGeo, [edgeMat, edgeMat, topMat, edgeMat, edgeMat, edgeMat]);
  top.position.set(cx, -BENCH.t / 2, cz);
  top.receiveShadow = true;
  top.name = 'BenchTop';
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(BENCH.t / 2, BENCH.t / 2, len, 24).rotateZ(Math.PI / 2), edgeMat);
  nose.position.set(cx, -BENCH.t / 2, BENCH.z1);
  nose.receiveShadow = true;
  const apron = new THREE.Mesh(new THREE.BoxGeometry(len - 0.12, 0.09, depth - 0.1), darkMat);
  apron.position.set(cx, -BENCH.t - 0.045, cz);
  const legGeo = new THREE.BoxGeometry(0.06, BENCH.height - BENCH.t, 0.06);
  for (const x of [BENCH.x0 + 0.08, BENCH.x1 - 0.08])
    for (const z of [BENCH.z0 + 0.07, BENCH.z1 - 0.07]) {
      const leg = new THREE.Mesh(legGeo, darkMat);
      leg.position.set(x, -BENCH.t - (BENCH.height - BENCH.t) / 2, z);
      root.add(leg);
    }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Floor', map: slate(), alphaMap: fade(), transparent: true, roughness: 0.9, depthWrite: false }),
  );
  floor.position.y = -BENCH.height;
  floor.receiveShadow = true;
  floor.renderOrder = -1;
  floor.userData.noExport = true;
  root.add(floor, top, nose, apron);
  return { root, top };
}
