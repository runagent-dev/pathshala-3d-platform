// Two Torricelli barometers built the same way (procedural three.js, metres; the platform's top is y = 0): a glass
// dish of liquid, a glass tube closed at the top standing with its mouth under the liquid, the column inside it (scaled
// to its height, never rebuilt) and the empty glass above it (the vacuum). The mercury one is the mercury lab's
// (assets/torricelli-barometer): a silver column with mercury's bulging meniscus. The water one is the same design made
// 11 m tall, with lightly tinted blue water and a flat top. Both liquids' surfaces in their dishes are at the same
// height, SURFACE_Y, so the two columns are measured from one level. The tubes are drawn thicker than real ones (a
// real one is about 1 cm across) so they read on a phone; the water's much more, as its tube is seen from far away.
import * as THREE from 'three';

/** The liquids' surface in both dishes (world y). Heights of the columns are measured from here. */
export const SURFACE_Y = 0.055;
/** How deep the tubes' mouths stand under that surface (m). */
export const MOUTH_DEPTH = 0.028;

/** The mercury barometer (as the mercury lab): a 1.05 m tube in a 16 cm dish. */
export const HG = { length: 1.05, ri: 0.026, ro: 0.036, dishR: 0.19, dishH: 0.08 };
/** The water barometer: the same design, the tube's closed top 11 m above the water in the dish. */
export const WATER = { length: 11 + MOUTH_DEPTH, ri: 0.075, ro: 0.098, dishR: 0.4, dishH: 0.08 };

/**
 * What the mercury mirrors: a small room drawn as an equirectangular picture (a bright window to the front right, a
 * softer light behind the viewer, a lit ceiling). On a column it makes the bright and dark bands of a liquid metal.
 */
function mercuryReflection() {
  const W = 512;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f1f4f7');
  g.addColorStop(0.4, '#c3cad1');
  g.addColorStop(0.5, '#7d868f');
  g.addColorStop(0.68, '#6c737a');
  g.addColorStop(0.8, '#76583c');
  g.addColorStop(1, '#4a3220');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const band = (u, w, color, y0 = 0.3, y1 = 0.7) => {
    const x = u * W;
    const gr = ctx.createLinearGradient(x - w * W, 0, x + w * W, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.5, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x - w * W, y0 * H, 2 * w * W, (y1 - y0) * H);
  };
  band(0.75, 0.05, 'rgba(255,255,255,0.95)', 0.1, 0.72);
  band(0.62, 0.035, 'rgba(255,244,222,1)', 0.18, 0.7);
  band(0.88, 0.012, 'rgba(240,248,255,0.9)');
  band(0.4, 0.02, 'rgba(170,190,210,0.5)');
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The water's colours: lightly tinted blue water, and the cold drink of the book's straw (about as dense). */
export const LIQUID = { water: '#4aa8f0', drink: '#8a4416' };

/** Shared materials: mercury (liquid metal), water, glass. */
export function barometerMaterials() {
  return {
    mercury: new THREE.MeshPhysicalMaterial({
      name: 'Mercury',
      color: '#cdd3d9',
      metalness: 1,
      roughness: 0.18,
      envMap: mercuryReflection(),
      envMapIntensity: 1.25,
      emissive: '#14181c',
      emissiveIntensity: 1,
    }),
    water: new THREE.MeshPhysicalMaterial({
      name: 'Water',
      color: LIQUID.water,
      metalness: 0,
      roughness: 0.12,
      transparent: true,
      opacity: 0.9,
      emissive: '#1b6fb8',
      emissiveIntensity: 0.55,
      envMapIntensity: 1.2,
      depthWrite: false,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      name: 'Glass',
      color: '#e2f2ff',
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 1.2,
      specularIntensity: 0.9,
    }),
    glassRim: new THREE.MeshPhysicalMaterial({
      name: 'GlassRim',
      color: '#d6efff',
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      envMapIntensity: 2,
    }),
  };
}

/** A lathe profile of the tube: inside from the closed top down to the mouth, across the rim, outside back up. */
function tubeGeometry(L, ri, ro) {
  const pts = [];
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, ri * Math.sin(a)), L - ri + ri * Math.cos(a)));
  }
  pts.push(new THREE.Vector2(ri, 0), new THREE.Vector2(ro, 0), new THREE.Vector2(ro, L - ri));
  for (let i = 1; i <= N; i++) {
    const a = (i / N) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, ro * Math.cos(a)), L - ri + ro * Math.sin(a)));
  }
  return new THREE.LatheGeometry(pts, 36);
}

/** A glass dish (a crystallising dish): a lathe of the wall and floor. */
function dishGeometry(r, h) {
  const wall = r * 0.045;
  const floor = 0.008;
  const pts = [
    new THREE.Vector2(1e-4, floor),
    new THREE.Vector2(r - wall, floor),
    new THREE.Vector2(r - wall, h),
    new THREE.Vector2(r - wall * 0.5, h + wall * 0.35),
    new THREE.Vector2(r, h),
    new THREE.Vector2(r, 0.004),
    new THREE.Vector2(r - 0.004, 0),
    new THREE.Vector2(1e-4, 0),
  ];
  return new THREE.LatheGeometry(pts, 64);
}

/**
 * A barometer at x: `spec` is HG or WATER, `liquid` the liquid's material, `kind` 'mercury' (a bulging meniscus) or
 * 'water' (a flat top with a bright ring). Its tube's mouth is at SURFACE_Y − MOUTH_DEPTH.
 * setLevel(h): the column's top h metres above SURFACE_Y; setTop(h): the tube's closed top h metres above it (the
 * straw shortens the water tube to 10.5 m); setShown(k): 0 … 1, the apparatus appearing (the tube grows up out of
 * the dish).
 */
export function createBarometer(mats, spec, { liquid, kind = 'mercury', name = 'Barometer', x = 0, glassOpacity = 0.2, edges = 0.5 } = {}) {
  const root = new THREE.Group();
  root.name = name;
  root.position.x = x;
  const { length: L, ri, ro, dishR, dishH } = spec;
  const mouthY = SURFACE_Y - MOUTH_DEPTH;

  // the dish and its liquid
  const dishGlass = mats.glass.clone();
  dishGlass.opacity = 0.24;
  const dish = new THREE.Mesh(dishGeometry(dishR, dishH), dishGlass);
  dish.name = `${name}Dish`;
  dish.renderOrder = 6;
  const wall = dishR * 0.045;
  const poolR = dishR - wall - 0.0006;
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(poolR, poolR, SURFACE_Y - 0.008, 64), liquid);
  pool.position.y = (SURFACE_Y + 0.008) / 2;
  pool.name = `${name}Pool`;
  pool.receiveShadow = true;
  pool.renderOrder = 4;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(dishR - wall * 0.5, wall * 0.55, 8, 64), mats.glassRim);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = dishH + 0.0005;
  lip.renderOrder = 7;
  root.add(pool, dish, lip);

  // the tube's glass (its own group, so the straw can shorten it) and the column (outside it, never scaled with it)
  const glassGroup = new THREE.Group();
  glassGroup.name = `${name}Tube`;
  glassGroup.position.y = mouthY;
  const tubeGlass = mats.glass.clone();
  tubeGlass.opacity = glassOpacity;
  const glass = new THREE.Mesh(tubeGeometry(L, ri, ro), tubeGlass);
  glass.name = `${name}TubeGlass`;
  glass.renderOrder = 8;
  const mouthRim = new THREE.Mesh(new THREE.TorusGeometry((ri + ro) / 2, (ro - ri) / 2, 8, 32), mats.glassRim);
  mouthRim.rotation.x = Math.PI / 2;
  mouthRim.renderOrder = 8;
  glassGroup.add(glass, mouthRim);
  // two faint bright lines down the glass (the edges a real tube catches the light on), so a thin tube reads
  const edgeMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: edges, depthWrite: false, toneMapped: false });
  const edgeGeo = new THREE.BoxGeometry(ro * 0.16, L - ro, ro * 0.16).translate(0, (L - ro) / 2, 0);
  for (const s of edges > 0 ? [-1, 1] : []) {
    const e = new THREE.Mesh(edgeGeo, edgeMat);
    e.position.set(s * ro * 0.9, 0, ro * 0.3);
    e.renderOrder = 9;
    glassGroup.add(e);
  }
  root.add(glassGroup);

  const rc = ri - 0.0005;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(rc, rc, 1, 28, 1, true).translate(0, 0.5, 0), liquid);
  column.name = `${name}Column`;
  column.renderOrder = 5;
  column.position.y = mouthY;
  const cap =
    kind === 'mercury'
      ? new THREE.Mesh(new THREE.SphereGeometry(rc, 28, 8, 0, Math.PI * 2, 0, Math.PI / 2), liquid)
      : new THREE.Mesh(new THREE.CircleGeometry(rc, 28).rotateX(-Math.PI / 2), liquid);
  if (kind === 'mercury') cap.scale.y = 0.42; // mercury's surface bulges up in glass
  cap.renderOrder = 5;
  const ring =
    kind === 'water'
      ? new THREE.Mesh(
          new THREE.TorusGeometry(rc * 0.94, rc * 0.07, 6, 28).rotateX(Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: '#e8f6ff', toneMapped: false }),
        )
      : null;
  root.add(column, cap);
  if (ring) root.add(ring);

  let level = 0;
  let shown = 1;
  let topH = L - MOUTH_DEPTH;
  function apply() {
    const h = Math.max(0, level);
    const len = h + MOUTH_DEPTH;
    column.scale.y = Math.max(1e-4, len);
    cap.position.y = SURFACE_Y + h;
    if (ring) ring.position.y = SURFACE_Y + h;
    // appearing: the tube grows up out of the dish (only the glass; the column is 0 then)
    const k = Math.max(1e-4, shown);
    glassGroup.scale.y = (k * (topH + MOUTH_DEPTH)) / L;
    root.visible = shown > 0;
    dish.scale.setScalar(Math.min(1, 0.6 + 0.4 * Math.min(1, k * 4)));
    pool.scale.copy(dish.scale);
    lip.scale.copy(dish.scale);
  }
  apply();

  return {
    root,
    glass,
    column,
    dish,
    /** The tube's centre line (world x). */
    x,
    ro,
    dishR,
    setLevel(h) {
      level = h;
      apply();
    },
    setTop(h) {
      topH = h;
      apply();
    },
    setShown(k) {
      shown = Math.max(0, Math.min(1, k));
      apply();
    },
    get level() {
      return level;
    },
  };
}
