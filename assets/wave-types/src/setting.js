// The setting, in metres (the bench's top is y = 0): a soft light blue-grey backdrop (screen space), a long oiled-oak
// lab bench (fine grain with pores, bevelled edges, a visible thickness) and a plain pale floor that melts into the
// backdrop. Procedural, no image files; the textures are made once.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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

/** A copy of a canvas texture at 1/2 (shift 1) or 1/4 size (shift 2), for the exported GLB. */
export function halfTexture(tex, shift = 1) {
  const src = tex.image;
  const c = document.createElement('canvas');
  c.width = src.width >> shift;
  c.height = src.height >> shift;
  /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')).drawImage(src, 0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = tex.colorSpace;
  t.wrapS = tex.wrapS;
  t.wrapT = tex.wrapT;
  return t;
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The backdrop: a soft light blue-grey, a little deeper at the top (screen space), like the chapter's other figures. */
export function backdropTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#8fa5b6');
    s.addColorStop(0.5, '#b2c2cf');
    s.addColorStop(1, '#d4dde4');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/**
 * Oak boards along the bench, the grain running along x. One drawing, two readings: `bump` gives the height (grain
 * lines and pores as small dents) and the colour version the tone. 1024 × 512, made once (the top is 2.7 m × 0.6 m).
 */
function oak(bump) {
  return canvasTex(
    1024,
    512,
    (ctx, W, H) => {
      const r = rng(11);
      const boards = 5;
      const bh = H / boards;
      ctx.fillStyle = bump ? '#bdbdbd' : '#b48658';
      ctx.fillRect(0, 0, W, H);
      for (let p = 0; p < boards; p++) {
        const y0 = p * bh;
        // each board a slightly different tone, lighter and darker across it (the same random draws in both readings,
        // so the grain of the colour and of the bump line up)
        const l = 47 + r() * 7;
        const g = ctx.createLinearGradient(0, y0, 0, y0 + bh);
        g.addColorStop(0, `hsl(${29 + r() * 4}, ${34 + r() * 8}%, ${l - 3}%)`);
        g.addColorStop(0.5, `hsl(${30 + r() * 3}, ${36 + r() * 6}%, ${l + 3}%)`);
        g.addColorStop(1, `hsl(${29 + r() * 4}, ${34 + r() * 8}%, ${l - 2}%)`);
        if (!bump) {
          ctx.fillStyle = g;
          ctx.fillRect(0, y0, W, bh);
        }
        // the grain: many fine lines that wander a little and thin out, some darker (late wood)
        const lines = 150;
        for (let i = 0; i < lines; i++) {
          const y = y0 + r() * bh;
          const dark = r();
          const a = 0.08 + dark * dark * 0.38;
          ctx.strokeStyle = bump ? `rgba(40,40,40,${a * 1.4})` : `rgba(92,52,22,${a})`;
          ctx.lineWidth = 0.4 + r() * 1.1;
          const ph = r() * 6.28;
          const fr = 0.003 + r() * 0.004;
          const x0 = r() * W * 0.5;
          const x1 = x0 + W * (0.4 + r() * 0.8);
          ctx.beginPath();
          for (let x = x0; x <= Math.min(W, x1); x += 12) {
            const yy = y + Math.sin(x * fr + ph) * 3.2 + Math.sin(x * 0.021 + i) * 0.6;
            x === x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
          }
          ctx.stroke();
        }
        // pores: tiny dark dashes along the grain
        for (let i = 0; i < 520; i++) {
          ctx.fillStyle = bump ? 'rgba(20,20,20,0.5)' : 'rgba(70,38,16,0.28)';
          ctx.fillRect(r() * W, y0 + r() * bh, 1 + r() * 4, 0.7);
        }
        // the joint between boards
        ctx.fillStyle = bump ? '#000000' : 'rgba(44,24,10,0.7)';
        ctx.fillRect(0, y0, W, 1.6);
        ctx.fillStyle = bump ? '#ffffff' : 'rgba(255,230,190,0.18)';
        ctx.fillRect(0, y0 + 1.6, W, 1);
      }
    },
    {},
  );
}

/** The floor: a plain, pale cool grey with one soft pool of light; alpha fades it into the backdrop at the far edges. */
function floorTexture() {
  return canvasTex(256, 256, (ctx, W, H) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    g.addColorStop(0, '#d6dde2');
    g.addColorStop(0.5, '#c4cdd5');
    g.addColorStop(1, '#b3bec8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
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

/** A soft dark pool under the bench (a baked contact shadow: no shadow map needed, no hard edge). */
function poolTexture() {
  return canvasTex(
    256,
    128,
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      // only the blurred shadow is wanted: the rectangle itself is drawn off the canvas, its shadow offset back onto it
      ctx.shadowColor = 'rgba(60,74,90,0.34)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = W * 2;
      ctx.fillStyle = '#000';
      ctx.fillRect(56 - W * 2, 38, W - 112, H - 76);
    },
    {},
  );
}

export const BENCH = { x0: -1.42, x1: 1.3, z0: -0.34, z1: 0.24, t: 0.05, height: 0.82 };

/** The bench (top, apron, legs) and the floor. */
export function createSetting() {
  const root = new THREE.Group();
  root.name = 'Setting';
  const len = BENCH.x1 - BENCH.x0;
  const depth = BENCH.z1 - BENCH.z0;
  const cx = (BENCH.x0 + BENCH.x1) / 2;
  const cz = (BENCH.z0 + BENCH.z1) / 2;
  const topMat = new THREE.MeshStandardMaterial({
    name: 'Oak',
    map: oak(false),
    bumpMap: oak(true),
    bumpScale: 1.6,
    roughness: 0.52,
    metalness: 0,
  });
  const frameMat = new THREE.MeshStandardMaterial({ name: 'BenchFrame', color: '#6b4a30', roughness: 0.62 });
  // the top: a thick board, every edge and corner rounded (a real bench's top is eased, never razor sharp)
  const top = new THREE.Mesh(new RoundedBoxGeometry(len, BENCH.t, depth, 2, 0.011), topMat);
  top.position.set(cx, -BENCH.t / 2, cz);
  top.receiveShadow = true;
  top.name = 'BenchTop';
  // below it: an apron rail round the frame, so the top has a visible thickness over a frame
  const apron = new THREE.Mesh(new RoundedBoxGeometry(len - 0.12, 0.1, depth - 0.1, 2, 0.006), frameMat);
  apron.position.set(cx, -BENCH.t - 0.05, cz);
  const legGeo = new RoundedBoxGeometry(0.065, BENCH.height - BENCH.t, 0.065, 2, 0.006);
  for (const x of [BENCH.x0 + 0.08, BENCH.x1 - 0.08])
    for (const z of [BENCH.z0 + 0.07, BENCH.z1 - 0.07]) {
      const leg = new THREE.Mesh(legGeo, frameMat);
      leg.position.set(x, -BENCH.t - (BENCH.height - BENCH.t) / 2, z);
      root.add(leg);
    }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Floor', map: floorTexture(), alphaMap: fade(), transparent: true, roughness: 0.92, depthWrite: false }),
  );
  floor.position.y = -BENCH.height;
  floor.renderOrder = -1;
  floor.userData.noExport = true;
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(len + 1.5, depth + 1.1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: poolTexture(), transparent: true, depthWrite: false, toneMapped: false }),
  );
  pool.position.set(cx, -BENCH.height + 0.002, cz);
  pool.renderOrder = 0;
  pool.userData.noExport = true;
  root.add(floor, pool, top, apron);
  return { root, top };
}
