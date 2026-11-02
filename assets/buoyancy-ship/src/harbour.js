// The harbour round the ship: a warm afternoon sky with the sun and a few clouds, a far shore of low hills (nothing
// else, so the ship stands out), and the water. The water's surface is y = 0 and ends at x = XC, where it is cut away: a
// glass-like face of blue water, paler at the top and deeper below, lets the student see the hull under the water
// (everything below the surface behind it is tinted by it). A sandy bottom 7 m down. All procedural, no image files;
// nothing moves (renders on demand). Lighting and an environment map made from the same sky, so the water and the
// steel reflect it.
import * as THREE from 'three';

export const XC = 14.6; // where the water is cut away, just behind the ship's stern (x = 14)
export const FLOOR = -7; // the harbour's bottom (m)

function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const stops = (g, list) => {
  for (const [k, c] of list) g.addColorStop(k, c);
};
const SKY = [
  [0, '#2b6fd4'],
  [0.38, '#5d9fe8'],
  [0.66, '#a9cff2'],
  [0.86, '#f6dcb4'],
  [1, '#ffd29c'],
];

/** A tiny repeatable random (the same scene every time). */
function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * @param {THREE.Scene} scene @param {THREE.WebGLRenderer} renderer
 * @param {{ transparent?: boolean, shadow?: boolean }} options
 */
export function createHarbour(scene, renderer, { transparent = false, shadow = true } = {}) {
  const root = new THREE.Group();
  root.name = 'Harbour';
  root.userData.noExport = true;
  scene.add(root);

  // ── sky, its light and its reflection ───────────────────────────────────────
  if (!transparent) {
    scene.background = canvas(4, 256, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      stops(g, SKY);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 4, 256);
    });
    scene.fog = new THREE.Fog('#f4dcbc', 150, 900);
  }
  // the environment: the same sky above, a deep blue below the horizon (what the water and steel reflect)
  const equirect = canvas(64, 32, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 32);
    stops(g, [
      [0, '#3d7fdc'],
      [0.3, '#8fc0ef'],
      [0.47, '#ffe2bb'],
      [0.5, '#e9d3b3'],
      [0.53, '#2f6e9a'],
      [1, '#123a5c'],
    ]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 32);
    // the sun's patch, so shiny things catch a highlight
    const r = ctx.createRadialGradient(40, 9, 0, 40, 9, 6);
    r.addColorStop(0, 'rgba(255,250,235,1)');
    r.addColorStop(1, 'rgba(255,250,235,0)');
    ctx.fillStyle = r;
    ctx.fillRect(30, 0, 22, 18);
  });
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(equirect).texture;
  scene.environmentIntensity = 0.75;
  pmrem.dispose();

  const hemi = new THREE.HemisphereLight('#d9ecff', '#2b6c8f', 0.9);
  const sun = new THREE.DirectionalLight('#fff0d6', 2.3);
  sun.position.set(30, 46, 34);
  sun.target.position.set(4, 0, 0);
  root.add(hemi, sun, sun.target);
  if (shadow && !transparent) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 10, far: 120 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
  }

  if (!transparent) {
    // the sun and a few clouds, far away in the sky ahead
    const glow = canvas(128, 128, (ctx) => {
      const r = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, 'rgba(255,253,240,1)');
      r.addColorStop(0.18, 'rgba(255,240,200,0.95)');
      r.addColorStop(0.45, 'rgba(255,220,160,0.28)');
      r.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = r;
      ctx.fillRect(0, 0, 128, 128);
    });
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, fog: false, depthWrite: false, toneMapped: false }));
    sunSprite.position.set(-700, 250, 330);
    sunSprite.scale.setScalar(220);
    root.add(sunSprite);
    const puff = canvas(128, 64, (ctx) => {
      for (const [x, y, r] of [
        [40, 40, 22],
        [64, 32, 28],
        [90, 40, 20],
        [70, 46, 22],
      ]) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 64);
      }
    });
    const rand = rng(11);
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, fog: false, depthWrite: false, opacity: 0.85 }));
      s.position.set(-750 + rand() * 100, 120 + rand() * 170, -520 + i * 160 + rand() * 60);
      const k = 110 + rand() * 120;
      s.scale.set(k * 2, k, 1);
      root.add(s);
    }
  }

  // ── the water ───────────────────────────────────────────────────────────────
  // the surface: clearer near the ship, more solid far away (alpha in the vertex colours), small ripples
  const ripples = canvas(128, 128, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const a = (x / w) * Math.PI * 2;
        const b = (y / h) * Math.PI * 2;
        const dx = 0.5 * Math.cos(a * 3 + Math.sin(b * 2) * 1.5) + 0.3 * Math.cos(a * 7 + b * 2);
        const dy = 0.5 * Math.cos(b * 4 + Math.sin(a * 2) * 1.2) + 0.3 * Math.sin(b * 6 - a * 3);
        const i = (y * w + x) * 4;
        img.data[i] = 128 + 60 * dx;
        img.data[i + 1] = 128 + 60 * dy;
        img.data[i + 2] = 255;
        img.data[i + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  });
  ripples.colorSpace = THREE.NoColorSpace;
  ripples.wrapS = ripples.wrapT = THREE.RepeatWrapping;
  ripples.repeat.set(90, 90);
  const SIZE = 1600;
  const surfGeo = new THREE.PlaneGeometry(SIZE, SIZE, 48, 48);
  surfGeo.rotateX(-Math.PI / 2);
  surfGeo.translate(XC - SIZE / 2, 0, 0);
  const col = new Float32Array(surfGeo.attributes.position.count * 4);
  const p = surfGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const d = Math.hypot(p.getX(i), p.getZ(i) * 0.8);
    const near = Math.min(1, Math.max(0, (d - 18) / 90));
    col.set([1, 1, 1, 0.5 + 0.42 * near], i * 4);
  }
  surfGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  const surface = new THREE.Mesh(
    surfGeo,
    new THREE.MeshStandardMaterial({
      color: '#1689c2',
      vertexColors: true,
      transparent: true,
      roughness: 0.1,
      metalness: 0,
      normalMap: ripples,
      normalScale: new THREE.Vector2(0.28, 0.28),
      depthWrite: false,
    }),
  );
  surface.name = 'WaterSurface';
  surface.renderOrder = 1;
  surface.receiveShadow = false;
  root.add(surface);

  // the cut face: pale turquoise at the top, deep blue below; a bright line along its top edge
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, -FLOOR),
    new THREE.MeshBasicMaterial({
      map: canvas(4, 256, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        stops(g, [
          [0, 'rgba(96,206,238,0.40)'],
          [0.1, 'rgba(40,162,218,0.50)'],
          [0.45, 'rgba(18,106,182,0.58)'],
          [1, 'rgba(12,66,132,0.6)'],
        ]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 4, 256);
      }),
      transparent: true,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
    }),
  );
  face.rotation.y = Math.PI / 2;
  face.position.set(XC, FLOOR / 2, 0);
  face.name = 'WaterCutFace';
  face.renderOrder = 2;
  root.add(face);
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.07, SIZE),
    new THREE.MeshBasicMaterial({ color: '#e8fbff', transparent: true, opacity: 0.9, fog: false }),
  );
  edge.position.set(XC, 0, 0);
  edge.name = 'WaterEdge';
  root.add(edge);

  // the bottom: sand, seen through the face; its own cut face below; deep water far off
  const sand = canvas(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#d8c08e';
    ctx.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 900; i++) {
      const v = 170 + Math.floor(r() * 70);
      ctx.fillStyle = `rgba(${v},${v - 22},${v - 70},0.55)`;
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
  });
  sand.wrapS = sand.wrapT = THREE.RepeatWrapping;
  sand.repeat.set(20, 20);
  // under water the sand looks blue-green, darker further off (vertex colours)
  const floorGeo = new THREE.PlaneGeometry(90, 240, 18, 1);
  floorGeo.rotateX(-Math.PI / 2);
  floorGeo.translate(XC - 45, FLOOR, 0);
  const fc = [];
  const fp = floorGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) {
    const k = Math.min(1, (XC - fp.getX(i)) / 70);
    fc.push(0.9 - 0.5 * k, 1 - 0.42 * k, 0.95 - 0.25 * k);
  }
  floorGeo.setAttribute('color', new THREE.Float32BufferAttribute(fc, 3));
  const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ map: sand, roughness: 1, vertexColors: true }));
  floor.name = 'HarbourBottom';
  root.add(floor);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, 14),
    new THREE.MeshBasicMaterial({
      map: canvas(4, 128, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 128);
        stops(g, [
          [0, '#7d6a4f'],
          [0.15, '#5f4f3b'],
          [0.6, '#46392b'],
          [1, '#2e261d'],
        ]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 4, 128);
      }),
      fog: false,
    }),
  );
  ground.rotation.y = Math.PI / 2;
  ground.position.set(XC, FLOOR - 7, 0);
  ground.name = 'GroundCutFace';
  root.add(ground);
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(240, -FLOOR + 0.5), new THREE.MeshBasicMaterial({ color: '#0e4f86', fog: false }));
  deep.rotation.y = Math.PI / 2;
  deep.position.set(XC - 90, FLOOR / 2 - 0.25, 0);
  deep.name = 'DeepWater';
  root.add(deep);

  // ── the far shore ───────────────────────────────────────────────────────────
  if (!transparent) {
    const shore = new THREE.Group();
    shore.name = 'Shore';
    const X = -420;
    const r = rng(17);
    // hills: a ragged band
    const hill = new THREE.Shape();
    hill.moveTo(-900, -2);
    for (let z = -900; z <= 900; z += 30) hill.lineTo(z, 18 + 22 * Math.sin(z / 140) + 12 * Math.sin(z / 47 + 1) + r() * 6);
    hill.lineTo(900, -2);
    const hills = new THREE.Mesh(new THREE.ShapeGeometry(hill), new THREE.MeshLambertMaterial({ color: '#6f8f7d' }));
    hills.rotation.y = Math.PI / 2;
    hills.position.set(X - 60, 0, 0);
    shore.add(hills);
    // a strip of sandy land (no buildings: the ship is what matters)
    const land = new THREE.Mesh(new THREE.BoxGeometry(40, 3, 1800), new THREE.MeshLambertMaterial({ color: '#c9b48a' }));
    land.position.set(X, 1.5, 0);
    shore.add(land);
    root.add(shore);
  }

  return {
    root,
    sun,
    surface,
    face,
  };
}
