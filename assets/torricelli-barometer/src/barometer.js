// Torricelli's barometer (procedural three.js, metres; the bench top is y = 0): a glass dish of mercury, a glass tube
// closed at one end (its pose set by the app: upright on the bench to be filled, turned over, its mouth under the
// mercury, tilted), the mercury inside it (a column scaled to its length, never rebuilt, with mercury's convex
// meniscus), a thumb that seals the mouth, a hole that can be made at the top, and a cream scale in cm whose 0 touches
// the dish's surface, held by a retort stand. The tube is drawn a little thicker than a real one so it reads on a
// phone.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { TUBE } from './reading.js';

export const DISH = { r: 0.1, h: 0.075, wall: 0.005, floor: 0.006 };
/** The mercury's surface in the dish (world y). The scale's 0 is here. */
export const SURFACE_Y = 0.055;
/** The tube's mouth when it stands in the dish (world y): TUBE.mouthDepth under the surface. */
export const MOUTH_Y = SURFACE_Y - TUBE.mouthDepth;
export const TUBE_R = { outer: 0.0135, inner: 0.0098 };
/** Where the scale is (world x of its left edge, its z). */
export const SCALE = { x: 0.017, z: -0.024, width: 0.07, top: 1.0 };

/**
 * What the mercury mirrors: a small room drawn as an equirectangular picture (a dark room, a bright window to the
 * front right, a softer light behind the viewer, a lit ceiling). On a column it makes the bright and dark bands of a
 * liquid metal; on the dish's flat surface a bright sheen.
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
  // bands round the horizon (u = 0.5 is +x, 0.75 is +z toward the viewer, 0.25 is −z behind the tube)
  const band = (u, w, color, y0 = 0.3, y1 = 0.7) => {
    const x = u * W;
    const gr = ctx.createLinearGradient(x - w * W, 0, x + w * W, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.5, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x - w * W, y0 * H, 2 * w * W, (y1 - y0) * H);
  };
  band(0.75, 0.05, 'rgba(255,255,255,0.95)', 0.1, 0.72); // the light behind the viewer: a bright stripe down the middle
  band(0.62, 0.035, 'rgba(255,244,222,1)', 0.18, 0.7); // the window
  band(0.88, 0.012, 'rgba(240,248,255,0.9)');
  band(0.4, 0.02, 'rgba(170,190,210,0.5)');
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Shared materials: mercury (liquid metal), glass, skin, the scale's cream paint. */
export function barometerMaterials() {
  return {
    // liquid metal: a mirror-bright silver that never goes dark against the slate (a little glow of its own)
    mercury: new THREE.MeshPhysicalMaterial({
      name: 'Mercury',
      color: '#f2f5f8',
      metalness: 1,
      roughness: 0.1,
      envMap: mercuryReflection(),
      envMapIntensity: 1.6,
      emissive: '#3a4148',
      emissiveIntensity: 1,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      name: 'Glass',
      color: '#e6f4ff',
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      side: THREE.FrontSide,
      envMapIntensity: 0.9,
      specularIntensity: 0.8,
    }),
    glassRim: new THREE.MeshPhysicalMaterial({
      name: 'GlassRim',
      color: '#cfe9ff',
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      envMapIntensity: 2,
    }),
    skin: new THREE.MeshStandardMaterial({ name: 'Skin', color: '#d99a72', roughness: 0.55 }),
    cream: new THREE.MeshStandardMaterial({ name: 'ScalePaint', color: '#f4ead2', roughness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ name: 'Steel', color: '#b9c0c8', metalness: 0.9, roughness: 0.32 }),
    iron: new THREE.MeshStandardMaterial({ name: 'CastIron', color: '#2f363d', metalness: 0.5, roughness: 0.55 }),
    ink: new THREE.MeshBasicMaterial({ name: 'ScaleInk', color: '#1b1f24', toneMapped: false }),
  };
}

/** A lathe profile of the tube: inside from the closed top down to the mouth, across the rim, outside back up. */
function tubeGeometry(L, ri, ro) {
  const pts = [];
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * (Math.PI / 2); // inner dome from the axis down to the wall
    pts.push(new THREE.Vector2(Math.max(1e-4, ri * Math.sin(a)), L - ri + ri * Math.cos(a)));
  }
  pts.push(new THREE.Vector2(ri, 0), new THREE.Vector2(ro, 0), new THREE.Vector2(ro, L - ri));
  for (let i = 1; i <= N; i++) {
    const a = (i / N) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, ro * Math.cos(a)), L - ri + ro * Math.sin(a)));
  }
  return new THREE.LatheGeometry(pts, 40);
}

/** A glass dish (a crystallising dish): a lathe of the wall and floor. */
function dishGeometry() {
  const { r, h, wall, floor } = DISH;
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
 * The barometer. `mats` from barometerMaterials() (shared with the yard's small one); `num(x)` writes the scale's
 * numbers (t.num, Bangla digits); `scale: false` leaves out the scale and its stand.
 */
export function createBarometer(mats, { num = String, scale = true, name = 'Barometer' } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const L = TUBE.length;
  const ri = TUBE_R.inner;
  const ro = TUBE_R.outer;

  // the dish and its mercury
  const dishGlass = mats.glass.clone();
  dishGlass.side = THREE.DoubleSide;
  const dish = new THREE.Mesh(dishGeometry(), dishGlass);
  dish.name = 'Dish';
  dish.renderOrder = 6;
  const pool = new THREE.Mesh(
    new THREE.CylinderGeometry(DISH.r - DISH.wall - 0.0005, DISH.r - DISH.wall - 0.0005, SURFACE_Y - DISH.floor, 64),
    mats.mercury,
  );
  pool.position.y = (SURFACE_Y + DISH.floor) / 2;
  pool.name = 'MercuryInDish';
  pool.castShadow = false;
  pool.receiveShadow = true;
  // a thin bright rim where the mercury meets the glass (a little meniscus)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(DISH.r - DISH.wall - 0.002, 0.0018, 8, 64), mats.mercury);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = SURFACE_Y - 0.0012;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(DISH.r - DISH.wall * 0.5, DISH.wall * 0.55, 8, 64), mats.glassRim);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = DISH.h + 0.0005;
  lip.renderOrder = 7;
  root.add(pool, rim, dish, lip);

  // the tube: its group's origin is the mouth, the closed end along +y
  const tube = new THREE.Group();
  tube.name = 'Tube';
  // the tube's glass on both sides (inside and out), faint, so the vacuum looks empty but the tube still shows
  const tubeGlass = mats.glass.clone();
  tubeGlass.side = THREE.DoubleSide;
  tubeGlass.opacity = 0.09;
  const glass = new THREE.Mesh(tubeGeometry(L, ri, ro), tubeGlass);
  glass.name = 'TubeGlass';
  glass.renderOrder = 8;
  const mouthRim = new THREE.Mesh(new THREE.TorusGeometry((ri + ro) / 2, (ro - ri) / 2, 8, 32), mats.glassRim);
  mouthRim.rotation.x = Math.PI / 2;
  mouthRim.renderOrder = 8;
  // the mercury in the tube: a column scaled along y, a dome when it fills the closed end, a meniscus on its free side
  const rc = ri - 0.0004;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(rc, rc, 1, 28, 1, true).translate(0, 0.5, 0), mats.mercury);
  column.name = 'MercuryColumn';
  column.castShadow = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(rc, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), mats.mercury);
  dome.position.y = L - ri;
  dome.scale.y = (ri - 0.0004) / rc;
  const meniscus = new THREE.Mesh(new THREE.SphereGeometry(rc, 28, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.mercury);
  meniscus.scale.y = 0.42; // mercury's surface bulges up in glass
  meniscus.name = 'Meniscus';
  const base = new THREE.Mesh(new THREE.CircleGeometry(rc, 28), mats.mercury);
  base.rotation.x = Math.PI / 2;
  tube.add(column, dome, meniscus, base, glass, mouthRim);

  // the thumb that seals the mouth: a soft pad with a nail
  const thumb = new THREE.Group();
  thumb.name = 'Thumb';
  const pad = new THREE.Mesh(new THREE.CapsuleGeometry(0.0125, 0.034, 6, 16), mats.skin);
  pad.rotation.z = Math.PI / 2;
  pad.scale.set(1, 1, 0.82);
  const nail = new THREE.Mesh(
    new THREE.SphereGeometry(0.0105, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6),
    new THREE.MeshStandardMaterial({ color: '#efc3b0', roughness: 0.3 }),
  );
  nail.scale.set(1.3, 0.35, 0.95);
  nail.position.set(-0.012, -0.0105, 0);
  nail.rotation.x = Math.PI;
  thumb.add(pad, nail);
  thumb.position.y = -0.0115;
  thumb.visible = false;
  tube.add(thumb);

  // the hole at the top (a dark ring with a chipped bright edge), shown once it is made
  const hole = new THREE.Group();
  hole.name = 'Hole';
  const holeRing = new THREE.Mesh(new THREE.TorusGeometry(0.0028, 0.0011, 8, 18), new THREE.MeshBasicMaterial({ color: '#1a1a1a' }));
  const holeDot = new THREE.Mesh(new THREE.CircleGeometry(0.0024, 18), new THREE.MeshBasicMaterial({ color: '#4a5560' }));
  hole.add(holeDot, holeRing);
  hole.position.set(0, L - 0.035, ro + 0.0004);
  hole.visible = false;
  tube.add(hole);
  root.add(tube);

  /** The tube's pose: its mouth at (x, y) and turned by `angle` about z (0: upright, mouth down; π: mouth up). */
  function setPose(x, y, angle) {
    tube.position.set(x, y, 0);
    tube.rotation.z = angle;
    tube.updateMatrixWorld();
  }
  setPose(0, MOUTH_Y, 0);

  /**
   * The mercury in the tube, from `from` to `to` along it (m from the mouth). `top`: what the far end (toward the
   * closed end) looks like: 'meniscus' (a free surface), 'dome' (it fills the closed end) or 'flat' (sealed by the
   * thumb at the mouth: the mouth side is the free one); `low`: a meniscus at the mouth end instead (filling, mouth up).
   */
  function setColumn(from, to, { top = 'meniscus', low = false } = {}) {
    const len = Math.max(0, to - from);
    column.visible = len > 1e-4;
    column.position.y = from;
    column.scale.y = Math.max(1e-4, len);
    dome.visible = top === 'dome' && len > 1e-4;
    base.position.y = from;
    base.visible = len > 1e-4 && !low;
    meniscus.visible = len > 1e-4 && (top === 'meniscus' || low);
    if (low) {
      meniscus.position.y = from;
      meniscus.rotation.x = Math.PI; // bulging toward the mouth (the world's up while the mouth is up)
    } else {
      meniscus.position.y = to;
      meniscus.rotation.x = 0;
    }
  }

  // ── the scale and its stand ────────────────────────────────────────────────
  let scaleGroup = null;
  if (scale) {
    scaleGroup = new THREE.Group();
    scaleGroup.name = 'Scale';
    const H = SCALE.top + 0.04;
    const board = new THREE.Mesh(new THREE.BoxGeometry(SCALE.width, H, 0.007), mats.cream);
    board.position.set(SCALE.x + SCALE.width / 2, SURFACE_Y - 0.004 + H / 2, SCALE.z - 0.004);
    board.castShadow = true;
    board.receiveShadow = true;
    scaleGroup.add(board);
    // the marks: every cm short, every 5 cm longer, every 10 cm long (one instanced mesh)
    const markGeo = new THREE.BoxGeometry(1, 1, 0.0008);
    const marks = new THREE.InstancedMesh(markGeo, mats.ink, 101);
    marks.name = 'ScaleMarks';
    const M = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let cm = 0; cm <= 100; cm++) {
      const len = cm % 10 === 0 ? 0.024 : cm % 5 === 0 ? 0.015 : 0.009;
      const thick = cm % 10 === 0 ? 0.0016 : 0.0011;
      p.set(SCALE.x + len / 2, SURFACE_Y + cm / 100, SCALE.z + 0.0002);
      s.set(len, thick, 1);
      M.compose(p, q, s);
      marks.setMatrixAt(cm, M);
    }
    scaleGroup.add(marks);
    for (let cm = 0; cm <= 100; cm += 10) {
      const label = textMesh(num(String(cm)), 0.0125, { color: '#1b1f24', weight: 700, align: 'left' });
      label.position.set(SCALE.x + 0.029, SURFACE_Y + cm / 100, SCALE.z + 0.0004);
      scaleGroup.add(label);
    }
    const unit = textMesh('cm', 0.012, { color: '#1b1f24', weight: 700, align: 'left' });
    unit.position.set(SCALE.x + 0.029, SURFACE_Y + 1.022, SCALE.z + 0.0004);
    scaleGroup.add(unit);
    // the retort stand behind the dish: a cast-iron foot, a steel rod, two clamps to the board
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.014, 0.13), mats.iron);
    foot.position.set(0.19, 0.007, -0.1);
    foot.castShadow = true;
    foot.receiveShadow = true;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 1.14, 16), mats.steel);
    rod.position.set(0.16, 0.57, -0.1);
    rod.castShadow = true;
    scaleGroup.add(foot, rod);
    for (const y of [0.32, 0.9]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.13, 10), mats.steel);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = -0.85;
      arm.position.set(0.122, y, -0.062);
      const boss = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.024, 0.022), mats.iron);
      boss.position.set(0.16, y, -0.1);
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.03, 0.016), mats.iron);
      jaw.position.set(SCALE.x + SCALE.width + 0.004, y, SCALE.z - 0.006);
      arm.castShadow = boss.castShadow = jaw.castShadow = true;
      scaleGroup.add(arm, boss, jaw);
    }
    root.add(scaleGroup);
  }

  return {
    root,
    tube,
    glass,
    dish,
    pool,
    thumb,
    hole,
    scale: scaleGroup,
    setPose,
    setColumn,
    /** Meshes a tap can hit to act on the tube. */
    hitMeshes: [glass, column],
  };
}
