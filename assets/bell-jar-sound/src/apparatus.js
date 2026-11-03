// The bell-jar apparatus, procedural three.js in metres (the bench top is y = 0), at its real size: a cast-iron pump
// plate (a ground steel disc on a painted base, a rubber seal, the port in its middle); a thick glass bell jar (30 cm
// tall, 21 cm across, a ground flange at the bottom, a neck with a rubber stopper); inside it a real electric calling
// bell (a bakelite base board, an electromagnet of two copper coils on an iron yoke, a soft-iron armature on a flat
// spring, the contact screw, the hammer rod and its ball, a nickel-plated gong) hung from the stopper by a steel rod,
// its two wires out through the stopper to a battery box with a push switch; a side pipe from the plate with a vacuum
// gauge (0–100 kPa, a needle) and the valve that lets air back in (its red lever turns), and a rubber hose to a rotary
// vacuum pump on the bench. The moving parts (the hammer, the needle, the valve lever, the pump's light) are exposed
// for the app. Modest in triangles; the shared materials come from the kit.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GAUGE_MAX } from './reading.js';

/** Where the parts are (m). */
export const PLATE_Y = 0.05; // the steel plate's top, where the jar stands
export const JAR = { r: 0.105, wall: 0.005, h: 0.3, neckR: 0.026, flangeR: 0.118 };
export const JAR_TOP = PLATE_Y + JAR.h; // the neck's lip
export const GAUGE = { x: 0.215, y: 0.142, z: 0.02, r: 0.042 };
export const VALVE_X = 0.262;
export const PUMP = { x: 0.43, z: -0.2 };
export const BATTERY = { x: -0.25, z: -0.13 };

// The calling bell, in its own frame (a real bell's size, facing +z): the gong, the base board, the hammer's hinge
// (where the flat spring holds it) and its ball resting on the gong's rim.
export const GONG = { x: 0, y: 0.152, z: 0.012, r: 0.043, depth: 0.026 };
export const BELL = { y0: 0.176, y1: 0.285, w: 0.084 };
export const BALL_R = 0.0085;
const FRONT = -0.0135; // the board's front face
const HINGE = new THREE.Vector2(0.047, 0.236);
// the ball's centre at rest: on the gong's rim, straight below the hinge
const BALL_AT = new THREE.Vector2(HINGE.x, GONG.y + Math.sqrt((GONG.r + BALL_R - 0.002) ** 2 - HINGE.x ** 2));
const TERMINALS = [-0.03, 0.03];
/** How the bell's frame sits in the jar: 1.3 times larger than life about BELL_C, turned a little (radians). */
export const BELL_S = 1.3;
export const BELL_C = new THREE.Vector3(0, 0.205, -0.01);
export const BELL_ROT = -0.26;
const BELL_M = new THREE.Matrix4()
  .compose(BELL_C, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), BELL_ROT), new THREE.Vector3(BELL_S, BELL_S, BELL_S))
  .multiply(new THREE.Matrix4().makeTranslation(-BELL_C.x, -BELL_C.y, -BELL_C.z));
const BELL_INV = BELL_M.clone().invert();
/** A point of the bell's frame in the world. */
export const bellToWorld = (x, y, z, out = new THREE.Vector3()) => out.set(x, y, z).applyMatrix4(BELL_M);
/** A world point in the bell's frame. */
export const worldToBell = (p, out = new THREE.Vector3()) => out.copy(p).applyMatrix4(BELL_INV);
/** The gong's centre (world), where the sound rings start, and where the ball strikes it. */
export const GONG_W = bellToWorld(GONG.x, GONG.y, GONG.z + 0.008);
export const STRIKE_W = bellToWorld(HINGE.x - BALL_R * 0.8, BALL_AT.y - BALL_R * 0.5, GONG.z + 0.006);
/** The hammer ball's resting place (world). */
export const BALL_W = bellToWorld(BALL_AT.x, BALL_AT.y, GONG.z + 0.003);
/** The bell's corners (world), for labels to keep clear of it. */
export const BELL_BOX_W = [
  bellToWorld(-BELL.w / 2, GONG.y - GONG.r, 0.03),
  bellToWorld(BELL.w / 2 + 0.01, GONG.y - GONG.r, 0.03),
  bellToWorld(-BELL.w / 2, BELL.y1, 0.0),
  bellToWorld(BELL.w / 2, BELL.y1, 0.0),
];
/** The top of the bell (world), where its hanging rod starts. */
const BELL_TOP_W = bellToWorld(0, BELL.y1 + 0.004, -0.018);

function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
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

/** A copper coil's winding: fine turns round a cylinder (u along the turns, v along the axis). */
function windingTexture() {
  return canvasTex(64, 256, (g, W, H) => {
    g.fillStyle = '#b0612e';
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) {
      const gr = g.createLinearGradient(0, y, 0, y + 4);
      gr.addColorStop(0, '#6e3110');
      gr.addColorStop(0.45, '#e9a06b');
      gr.addColorStop(1, '#7a3a16');
      g.fillStyle = gr;
      g.fillRect(0, y, W, 4);
    }
  });
}

/** Turning marks on the gong (the lathe's v runs from the dome's top to its rim): fine concentric rings. */
function turnedTexture() {
  return canvasTex(8, 512, (g, W, H) => {
    const r = rng(23);
    g.fillStyle = '#c4c8cd';
    g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 3) {
      const v = 150 + r() * 80;
      g.fillStyle = `rgba(${v},${v + 4},${v + 8},0.6)`;
      g.fillRect(0, y, W, 1.5);
    }
    for (const y of [0.12, 0.3, 0.46]) {
      g.fillStyle = 'rgba(70,76,84,0.55)';
      g.fillRect(0, y * H, W, 3);
    }
  });
}

/** Hammered paint (the base, the pump): a fine mottled bump. */
function hammeredTexture() {
  return canvasTex(
    256,
    256,
    (g, W, H) => {
      const r = rng(11);
      g.fillStyle = '#808080';
      g.fillRect(0, 0, W, H);
      for (let i = 0; i < 900; i++) {
        const x = r() * W;
        const y = r() * H;
        const rad = 2 + r() * 6;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        const v = 100 + r() * 70;
        gr.addColorStop(0, `rgba(${v},${v},${v},0.6)`);
        gr.addColorStop(1, 'rgba(128,128,128,0)');
        g.fillStyle = gr;
        g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
      }
    },
    { repeat: [3, 3], srgb: false },
  );
}

/** The ground steel plate: fine circular lapping marks. */
function lappedTexture() {
  return canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = '#b9bfc6';
    g.fillRect(0, 0, W, H);
    const r = rng(5);
    for (let i = 0; i < 220; i++) {
      const rad = r() * W * 0.5;
      g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '70,78,88'},${0.05 + r() * 0.08})`;
      g.lineWidth = 0.6 + r() * 1.4;
      g.beginPath();
      g.arc(W / 2, H / 2, rad, 0, Math.PI * 2);
      g.stroke();
    }
  });
}

/** The gauge's dial: 0–120 kPa, a long mark every 20, a short one every 10, the numbers in the book's digits. */
function dialTexture(num, unit) {
  return canvasTex(512, 512, (g, W) => {
    const c = W / 2;
    g.fillStyle = '#fbfaf6';
    g.fillRect(0, 0, W, W);
    // the vacuum part of the scale, a pale band
    g.lineWidth = 22;
    g.strokeStyle = '#d7ecf0';
    g.beginPath();
    const a0 = (-135 - 90) * (Math.PI / 180);
    const a1 = (135 - 90) * (Math.PI / 180);
    g.arc(c, c, 200, a0, a1);
    g.stroke();
    g.strokeStyle = '#1d2733';
    g.fillStyle = '#1d2733';
    for (let v = 0; v <= GAUGE_MAX; v += 5) {
      const a = ((-135 + (270 * v) / GAUGE_MAX - 90) * Math.PI) / 180;
      const long = v % 20 === 0;
      const mid = v % 10 === 0;
      const r0 = long ? 176 : mid ? 188 : 196;
      g.lineWidth = long ? 7 : mid ? 4.5 : 2.5;
      g.beginPath();
      g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
      g.lineTo(c + Math.cos(a) * 214, c + Math.sin(a) * 214);
      g.stroke();
      if (long) {
        g.font = '700 60px "Noto Sans Bengali", Arial, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(num(v), c + Math.cos(a) * 128, c + Math.sin(a) * 128);
      }
    }
    g.font = '600 44px "Noto Sans Bengali", Arial, sans-serif';
    g.fillText(unit, c, c + 120);
  });
}

/** The materials of the apparatus. */
export function apparatusMaterials(kit) {
  const hammer = hammeredTexture();
  return {
    steel: kit.steel,
    chrome: kit.chrome,
    brass: kit.brass,
    plate: new THREE.MeshPhysicalMaterial({ name: 'GroundSteel', map: lappedTexture(), metalness: 0.85, roughness: 0.36, clearcoat: 0.3 }),
    base: new THREE.MeshStandardMaterial({ name: 'CastIron', color: '#34495e', metalness: 0.45, roughness: 0.55, bumpMap: hammer, bumpScale: 0.6 }),
    pump: new THREE.MeshStandardMaterial({ name: 'PumpPaint', color: '#5b6f86', metalness: 0.4, roughness: 0.5, bumpMap: hammer, bumpScale: 0.5 }),
    motor: new THREE.MeshStandardMaterial({ name: 'MotorBlack', color: '#24272c', metalness: 0.5, roughness: 0.45 }),
    rubber: new THREE.MeshStandardMaterial({ name: 'Rubber', color: '#1c1d20', metalness: 0, roughness: 0.8 }),
    hose: new THREE.MeshStandardMaterial({ name: 'Hose', color: '#3a3d42', metalness: 0, roughness: 0.62 }),
    stopper: new THREE.MeshStandardMaterial({ name: 'RubberStopper', color: '#b4532a', metalness: 0, roughness: 0.75 }),
    bakelite: new THREE.MeshPhysicalMaterial({ name: 'Bakelite', color: '#4a2a1c', metalness: 0, roughness: 0.32, clearcoat: 0.6 }),
    iron: new THREE.MeshStandardMaterial({ name: 'SoftIron', color: '#5d6168', metalness: 0.85, roughness: 0.42 }),
    coil: new THREE.MeshStandardMaterial({ name: 'CopperWinding', map: windingTexture(), metalness: 0.7, roughness: 0.32 }),
    fibre: new THREE.MeshStandardMaterial({ name: 'FibreCap', color: '#26201c', metalness: 0, roughness: 0.6 }),
    gong: new THREE.MeshStandardMaterial({
      name: 'TurnedNickel',
      map: turnedTexture(),
      color: '#d3d7dc',
      metalness: 0.85,
      roughness: 0.42,
      envMapIntensity: 0.8,
    }),
    gongRim: new THREE.MeshStandardMaterial({ name: 'NickelRim', color: '#9aa1a9', metalness: 0.9, roughness: 0.35 }),
    red: new THREE.MeshStandardMaterial({ name: 'RedWire', color: '#c92a2a', metalness: 0, roughness: 0.5 }),
    black: new THREE.MeshStandardMaterial({ name: 'BlackWire', color: '#212529', metalness: 0, roughness: 0.5 }),
    lever: new THREE.MeshStandardMaterial({ name: 'ValveLever', color: '#d6336c', metalness: 0.1, roughness: 0.45 }),
    battery: new THREE.MeshStandardMaterial({ name: 'BatteryBox', color: '#2b2f36', metalness: 0.1, roughness: 0.55 }),
    cell: new THREE.MeshStandardMaterial({ name: 'Cell', color: '#e8930c', metalness: 0.3, roughness: 0.4 }),
    needle: new THREE.MeshStandardMaterial({ name: 'Needle', color: '#c2255c', metalness: 0.2, roughness: 0.4 }),
    glass: new THREE.MeshPhysicalMaterial({
      name: 'Glass',
      color: '#e6f4ff',
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 1.6,
      specularIntensity: 1,
    }),
    glassEdge: new THREE.MeshPhysicalMaterial({
      name: 'GlassEdge',
      color: '#d4ecfa',
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      envMapIntensity: 2,
    }),
    light: new THREE.MeshStandardMaterial({ name: 'PumpLight', color: '#2b3a2e', emissive: '#000000', roughness: 0.3 }),
  };
}

/** A glass shell's silhouette: brighter where the glass is seen edge-on (a Fresnel rim), drawn on top of the jar. */
function fresnelMaterial() {
  return new THREE.ShaderMaterial({
    name: 'GlassFresnel',
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: { color: { value: new THREE.Color('#f3fbff') }, strength: { value: 0.85 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 color; uniform float strength; varying vec3 vN; varying vec3 vV;
      void main() { float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); f = pow(f, 2.6); gl_FragColor = vec4(color, f * strength); }`,
  });
}

const V2 = (x, y) => new THREE.Vector2(x, y);
const mesh = (geo, mat, name) => {
  const m = new THREE.Mesh(geo, mat);
  if (name) m.name = name;
  return m;
};

/** The jar's outside profile (r, y from its foot), for the glass and the Fresnel rim. */
function jarProfile(offset = 0) {
  const { r, h, neckR, wall } = JAR;
  const R = r + offset;
  const pts = [V2(R + 0.013, 0), V2(R + 0.013, 0.012), V2(R, 0.018)];
  const shoulder = h - 0.075;
  for (let i = 0; i <= 8; i++) pts.push(V2(R, 0.018 + ((shoulder - 0.018) * i) / 8));
  // a dome from the wall to the neck (a quarter ellipse)
  const dr = R - (neckR + offset);
  for (let i = 1; i <= 14; i++) {
    const a = (i / 14) * (Math.PI / 2);
    pts.push(V2(neckR + offset + dr * Math.cos(a), shoulder + 0.05 * Math.sin(a)));
  }
  pts.push(V2(neckR + offset, h - 0.006), V2(neckR + offset + 0.004, h - 0.003), V2(neckR + offset + 0.004, h));
  return { pts, wall };
}

/** The bell jar: a lathe of the glass's outside and inside, its flange and lip a little brighter. */
function createJar(m) {
  const g = new THREE.Group();
  g.name = 'BellJar';
  const { pts } = jarProfile(0);
  const inner = jarProfile(-JAR.wall).pts;
  // one closed profile: outside up, inside down
  const prof = [...pts, ...inner.slice(2).reverse()];
  prof.push(V2(JAR.r - JAR.wall, 0), V2(JAR.r + 0.013, 0));
  const glass = mesh(new THREE.LatheGeometry(prof, 64), m.glass, 'Glass');
  glass.renderOrder = 4;
  g.add(glass);
  const rim = mesh(new THREE.LatheGeometry(pts, 64), fresnelMaterial(), 'GlassRim');
  rim.renderOrder = 5;
  rim.userData.noExport = true;
  g.add(rim);
  const flange = mesh(new THREE.TorusGeometry(JAR.r + 0.008, 0.0065, 8, 64), m.glassEdge, 'Flange');
  flange.rotation.x = Math.PI / 2;
  flange.position.y = 0.008;
  flange.scale.z = 0.9;
  flange.renderOrder = 4;
  g.add(flange);
  const lip = mesh(new THREE.TorusGeometry(JAR.neckR + 0.003, 0.003, 8, 40), m.glassEdge, 'Lip');
  lip.rotation.x = Math.PI / 2;
  lip.position.y = JAR.h - 0.002;
  lip.renderOrder = 4;
  g.add(lip);
  // the rubber stopper: a taper in the neck, its top above the lip
  const stopper = mesh(new THREE.CylinderGeometry(JAR.neckR + 0.004, JAR.neckR - 0.004, 0.04, 28), m.stopper, 'Stopper');
  stopper.position.y = JAR.h + 0.008;
  g.add(stopper);
  g.position.y = PLATE_Y;
  return g;
}

/** The pump plate: a painted cast-iron base on rubber feet, the ground steel disc, the rubber seal, the port. */
function createPlate(m) {
  const g = new THREE.Group();
  g.name = 'PumpPlate';
  const base = mesh(new THREE.BoxGeometry(0.34, 0.03, 0.34), m.base, 'Base');
  base.position.y = 0.006 + 0.015;
  base.castShadow = base.receiveShadow = true;
  g.add(base);
  // a bevelled top edge on the base
  const bevel = mesh(new THREE.CylinderGeometry(0.162, 0.168, 0.006, 48), m.base, 'BaseCollar');
  bevel.position.y = 0.039;
  g.add(bevel);
  for (const [x, z] of [
    [-0.15, -0.15],
    [0.15, -0.15],
    [-0.15, 0.15],
    [0.15, 0.15],
  ]) {
    const foot = mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.006, 16), m.rubber);
    foot.position.set(x, 0.003, z);
    g.add(foot);
  }
  const disc = mesh(new THREE.CylinderGeometry(0.15, 0.15, PLATE_Y - 0.042, 64), [m.steel, m.plate, m.steel], 'Plate');
  disc.position.y = (PLATE_Y + 0.042) / 2;
  disc.receiveShadow = true;
  g.add(disc);
  const seal = mesh(new THREE.TorusGeometry(JAR.r + 0.006, 0.0042, 8, 64), m.rubber, 'Seal');
  seal.rotation.x = Math.PI / 2;
  seal.position.y = PLATE_Y + 0.001;
  seal.scale.z = 0.6;
  g.add(seal);
  const port = mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.004, 24), m.brass, 'Port');
  port.position.y = PLATE_Y + 0.002;
  g.add(port);
  const hole = mesh(new THREE.CircleGeometry(0.006, 20), m.motor, 'PortHole');
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = PLATE_Y + 0.0042;
  g.add(hole);
  return g;
}

/** A tube along points (a pipe, a wire, the hose). */
function tube(points, r, mat, name, seg = 48) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  return mesh(new THREE.TubeGeometry(curve, seg, r, 10, false), mat, name);
}

/**
 * The electric calling bell, built in its own frame at its real size (about 11 cm tall, facing +z), then drawn 1.3
 * times larger than a real one beside this jar (so it reads on a phone; the panel's note says the picture is not to
 * scale) and turned a little to the viewer's left so the gong's dome shows its profile. The hammer hangs from a flat
 * spring to the right of the coils: at rest the magnet holds the armature up and the ball on the gong's rim; it swings
 * out to the right (turn its pivot about z) and back, hitting the gong at every stroke.
 */
function createBell(m) {
  const outer = new THREE.Group();
  outer.name = 'CallingBell';
  outer.position.copy(BELL_C);
  outer.scale.setScalar(BELL_S);
  outer.rotation.y = BELL_ROT;
  const g = new THREE.Group();
  g.position.copy(BELL_C).multiplyScalar(-1);
  outer.add(g);
  const { y0, y1, w } = BELL;
  const cy = (y0 + y1) / 2;
  // the base board, with rounded corners
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = (y1 - y0) / 2;
  const rr = 0.008;
  shape.moveTo(-hw + rr, -hh);
  shape.lineTo(hw - rr, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + rr);
  shape.lineTo(hw, hh - rr);
  shape.quadraticCurveTo(hw, hh, hw - rr, hh);
  shape.lineTo(-hw + rr, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - rr);
  shape.lineTo(-hw, -hh + rr);
  shape.quadraticCurveTo(-hw, -hh, -hw + rr, -hh);
  const board = mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.007,
      bevelEnabled: true,
      bevelThickness: 0.0012,
      bevelSize: 0.0012,
      bevelSegments: 2,
      curveSegments: 6,
    }),
    m.bakelite,
    'BaseBoard',
  );
  board.position.set(0, cy, -0.022);
  board.castShadow = true;
  g.add(board);
  const front = FRONT;
  // the electromagnet: an iron yoke across the top, two coils hanging from it
  const yoke = mesh(new THREE.BoxGeometry(0.048, 0.007, 0.012), m.iron, 'Yoke');
  yoke.position.set(-0.001, 0.27, front + 0.012);
  g.add(yoke);
  const bracket = mesh(new THREE.BoxGeometry(0.008, 0.012, 0.012), m.iron, 'YokeBracket');
  bracket.position.set(-0.001, 0.27, front + 0.004);
  g.add(bracket);
  const coilGeo = new THREE.CylinderGeometry(0.0105, 0.0105, 0.026, 28, 1, true);
  const capGeo = new THREE.CylinderGeometry(0.0125, 0.0125, 0.0025, 28);
  const coreGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.033, 16);
  for (const x of [-0.016, 0.014]) {
    const coil = mesh(coilGeo, m.coil, 'Coil');
    coil.position.set(x, 0.252, front + 0.012);
    coil.castShadow = true;
    g.add(coil);
    for (const dy of [0.0135, -0.0135]) {
      const cap = mesh(capGeo, m.fibre, 'CoilCap');
      cap.position.set(x, 0.252 + dy, front + 0.012);
      g.add(cap);
    }
    const core = mesh(coreGeo, m.iron, 'Core');
    core.position.set(x, 0.2505, front + 0.012);
    g.add(core);
  }
  // the gong: a turned nickel dome on a post, its open side to the board, a rolled rim, a boss and its fixing screw
  const post = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.03, 12), m.steel, 'GongPost');
  post.rotation.x = Math.PI / 2;
  post.position.set(GONG.x, GONG.y, front + 0.006);
  g.add(post);
  const arm = mesh(new THREE.BoxGeometry(0.008, 0.03, 0.004), m.iron, 'GongArm');
  arm.position.set(GONG.x, GONG.y + 0.017, front);
  g.add(arm);
  const dome = [];
  const { r, depth } = GONG;
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * (Math.PI / 2);
    dome.push(V2(Math.max(1e-4, r * Math.sin(a)), depth * Math.cos(a)));
  }
  dome.push(V2(r - 0.003, -0.002));
  for (let i = 18; i >= 0; i--) {
    const a = (i / 18) * (Math.PI / 2);
    dome.push(V2(Math.max(1e-4, (r - 0.003) * Math.sin(a)), (depth - 0.003) * Math.cos(a) - 0.002));
  }
  const gong = new THREE.Group();
  gong.name = 'Gong';
  gong.position.set(GONG.x, GONG.y, GONG.z - 0.004);
  g.add(gong);
  const shell = mesh(new THREE.LatheGeometry(dome, 56), m.gong, 'GongDome');
  shell.rotation.x = Math.PI / 2;
  shell.castShadow = true;
  gong.add(shell);
  const rim = mesh(new THREE.TorusGeometry(r - 0.0005, 0.0022, 10, 56), m.gongRim, 'GongRim');
  gong.add(rim);
  const boss = mesh(new THREE.CylinderGeometry(0.008, 0.0095, 0.004, 28), m.gongRim, 'GongBoss');
  boss.rotation.x = Math.PI / 2;
  boss.position.z = depth + 0.0012;
  gong.add(boss);
  const screw = mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.0025, 20), m.brass, 'GongScrew');
  screw.rotation.x = Math.PI / 2;
  screw.position.z = depth + 0.004;
  gong.add(screw);
  const slot = mesh(new THREE.BoxGeometry(0.0065, 0.0011, 0.0012), m.motor, 'GongScrewSlot');
  slot.position.z = depth + 0.0055;
  slot.rotation.z = 0.5;
  gong.add(slot);
  // the hammer: a pivot at the flat spring; the armature (to the left, under the coils), the rod and the ball turn with it
  const pivot = new THREE.Group();
  pivot.name = 'Hammer';
  pivot.position.set(HINGE.x, HINGE.y, front + 0.012);
  g.add(pivot);
  const armLen = HINGE.x + 0.03;
  const armature = mesh(new THREE.BoxGeometry(armLen, 0.004, 0.012), m.iron, 'Armature');
  armature.position.set(-armLen / 2, -0.004, 0);
  pivot.add(armature);
  const ballZ = GONG.z + 0.003 - (front + 0.012);
  const rodLen = HINGE.y - BALL_AT.y;
  const rod = mesh(new THREE.CylinderGeometry(0.0024, 0.0024, rodLen, 10), m.steel, 'HammerRod');
  rod.position.set(0, -rodLen / 2, 0);
  pivot.add(rod);
  const stem = mesh(new THREE.CylinderGeometry(0.0022, 0.0022, Math.abs(ballZ), 8), m.steel, 'HammerStem');
  stem.rotation.x = Math.PI / 2;
  stem.position.set(0, -rodLen, ballZ / 2);
  pivot.add(stem);
  const knob = mesh(new THREE.SphereGeometry(BALL_R, 22, 16), m.brass, 'HammerBall');
  knob.position.set(0, -rodLen, ballZ);
  pivot.add(knob);
  // the flat spring above the hinge and its block; the contact screw on its pillar touching the armature
  const spring = mesh(new THREE.BoxGeometry(0.0012, 0.024, 0.01), m.steel, 'FlatSpring');
  spring.position.set(HINGE.x + 0.001, HINGE.y + 0.012, front + 0.012);
  g.add(spring);
  const block = mesh(new THREE.BoxGeometry(0.009, 0.008, 0.016), m.iron, 'SpringBlock');
  block.position.set(HINGE.x + 0.002, HINGE.y + 0.026, front + 0.008);
  g.add(block);
  const pillar = mesh(new THREE.BoxGeometry(0.005, 0.016, 0.006), m.brass, 'ContactPillar');
  pillar.position.set(0.033, 0.258, front + 0.003);
  g.add(pillar);
  const cscrew = mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.016, 10), m.brass, 'ContactScrew');
  cscrew.position.set(0.033, 0.243, front + 0.012);
  g.add(cscrew);
  const cHead = mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.0025, 14), m.brass, 'ContactScrewHead');
  cHead.position.set(0.033, 0.252, front + 0.012);
  g.add(cHead);
  for (const x of TERMINALS) {
    const term = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.005, 12), m.brass, 'Terminal');
    term.rotation.x = Math.PI / 2;
    term.position.set(x, y1 - 0.008, front + 0.002);
    g.add(term);
  }
  const hook = mesh(new THREE.BoxGeometry(0.014, 0.005, 0.01), m.steel, 'HangClamp');
  hook.position.set(0, y1 + 0.0015, -0.018);
  g.add(hook);
  return { root: outer, hammer: pivot, ball: knob, gong };
}

/** The side pipe from the base, the vacuum gauge on its tee, the air-in valve and its lever. */
function createGaugeAndValve(m, num, unit, dir) {
  const g = new THREE.Group();
  g.name = 'GaugeAndValve';
  const y = 0.02;
  const pipe = mesh(new THREE.CylinderGeometry(0.0065, 0.0065, VALVE_X + 0.03 - 0.17, 16), m.brass, 'SidePipe');
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set((0.17 + VALVE_X + 0.03) / 2, y, 0.02);
  g.add(pipe);
  // the tee and the gauge's stem
  const tee = mesh(new THREE.BoxGeometry(0.018, 0.018, 0.018), m.brass, 'Tee');
  tee.position.set(GAUGE.x, y, 0.02);
  g.add(tee);
  const stem = mesh(new THREE.CylinderGeometry(0.005, 0.005, GAUGE.y - y - GAUGE.r + 0.004, 14), m.brass, 'GaugeStem');
  stem.position.set(GAUGE.x, (y + GAUGE.y - GAUGE.r) / 2 + 0.002, 0.02);
  g.add(stem);
  const hexNut = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 6), m.brass, 'GaugeNut');
  hexNut.position.set(GAUGE.x, GAUGE.y - GAUGE.r - 0.002, 0.02);
  g.add(hexNut);
  // the gauge: a chrome case turned to face the viewer, the dial, the needle
  const head = new THREE.Group();
  head.name = 'Gauge';
  head.position.set(GAUGE.x, GAUGE.y, GAUGE.z);
  head.rotation.y = Math.atan2(dir.x, dir.z) * 0.85;
  g.add(head);
  const caseGeo = new THREE.CylinderGeometry(GAUGE.r + 0.004, GAUGE.r + 0.004, 0.022, 48);
  const gcase = mesh(caseGeo, m.chrome, 'GaugeCase');
  gcase.rotation.x = Math.PI / 2;
  gcase.castShadow = true;
  head.add(gcase);
  const bezel = mesh(new THREE.TorusGeometry(GAUGE.r + 0.002, 0.003, 10, 48), m.chrome, 'Bezel');
  bezel.position.z = 0.011;
  head.add(bezel);
  const dial = mesh(
    new THREE.CircleGeometry(GAUGE.r, 48),
    new THREE.MeshStandardMaterial({ name: 'Dial', map: dialTexture(num, unit), roughness: 0.6 }),
    'Dial',
  );
  dial.position.z = 0.0112;
  head.add(dial);
  const needle = new THREE.Group();
  needle.name = 'Needle';
  needle.position.z = 0.0125;
  head.add(needle);
  const nShape = new THREE.Shape();
  nShape.moveTo(-0.0022, -0.006);
  nShape.lineTo(0.0022, -0.006);
  nShape.lineTo(0.0006, GAUGE.r * 0.86);
  nShape.lineTo(-0.0006, GAUGE.r * 0.86);
  const nMesh = mesh(new THREE.ShapeGeometry(nShape), m.needle, 'NeedleBlade');
  needle.add(nMesh);
  const hub = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 16), m.chrome, 'NeedleHub');
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.001;
  needle.add(hub);
  const lens = mesh(new THREE.CircleGeometry(GAUGE.r + 0.001, 48), m.glass, 'GaugeGlass');
  lens.position.z = 0.0142;
  lens.renderOrder = 4;
  head.add(lens);
  // the valve: a brass body, a stem up, the red lever (turns a quarter to open)
  const body = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.024, 20), m.brass, 'ValveBody');
  body.rotation.z = Math.PI / 2;
  body.position.set(VALVE_X, y, 0.02);
  g.add(body);
  const vstem = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.016, 10), m.steel, 'ValveStem');
  vstem.position.set(VALVE_X, y + 0.016, 0.02);
  g.add(vstem);
  const lever = new THREE.Group();
  lever.name = 'ValveLever';
  lever.position.set(VALVE_X, y + 0.025, 0.02);
  g.add(lever);
  const leverBar = mesh(new THREE.BoxGeometry(0.05, 0.005, 0.009), m.lever, 'LeverBar');
  leverBar.position.x = 0.02;
  leverBar.castShadow = true;
  lever.add(leverBar);
  const leverHub = mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.007, 14), m.lever, 'LeverHub');
  lever.add(leverHub);
  return { root: g, needle, lever, gaugeHead: head };
}

/** A rotary vane vacuum pump on the bench: a painted body and pump block, a black motor with a ribbed fan cover. */
function createPump(m) {
  const g = new THREE.Group();
  g.name = 'VacuumPump';
  const base = mesh(new THREE.BoxGeometry(0.27, 0.012, 0.15), m.pump, 'PumpBase');
  base.position.y = 0.006;
  base.castShadow = base.receiveShadow = true;
  g.add(base);
  const block = mesh(new THREE.BoxGeometry(0.1, 0.11, 0.11), m.pump, 'PumpBlock');
  block.position.set(-0.07, 0.067, 0);
  block.castShadow = true;
  g.add(block);
  const blockTop = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 32, 1, false, 0, Math.PI), m.pump, 'PumpBlockTop');
  blockTop.rotation.z = Math.PI / 2;
  blockTop.rotation.y = Math.PI / 2;
  blockTop.position.set(-0.07, 0.122, 0);
  g.add(blockTop);
  const motor = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.13, 32), m.motor, 'Motor');
  motor.rotation.z = Math.PI / 2;
  motor.position.set(0.05, 0.068, 0);
  motor.castShadow = true;
  g.add(motor);
  const ribs = [];
  for (let i = 0; i < 9; i++) {
    const rib = new THREE.TorusGeometry(0.053, 0.0025, 6, 32);
    rib.rotateY(Math.PI / 2);
    rib.translate(0.0 + i * 0.012, 0.068, 0);
    ribs.push(rib);
  }
  g.add(mesh(mergeGeometries(ribs), m.motor, 'MotorFins'));
  const fan = mesh(new THREE.CylinderGeometry(0.05, 0.054, 0.03, 32), m.pump, 'FanCover');
  fan.rotation.z = Math.PI / 2;
  fan.position.set(0.13, 0.068, 0);
  g.add(fan);
  const inlet = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 16), m.chrome, 'Inlet');
  inlet.position.set(-0.09, 0.19, 0.02);
  g.add(inlet);
  const sight = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 24), m.glassEdge, 'OilSight');
  sight.rotation.x = Math.PI / 2;
  sight.position.set(-0.07, 0.05, 0.056);
  g.add(sight);
  const handle = tube(
    [new THREE.Vector3(-0.1, 0.17, -0.03), new THREE.Vector3(-0.07, 0.205, -0.03), new THREE.Vector3(-0.04, 0.17, -0.03)],
    0.005,
    m.motor,
    'Handle',
    16,
  );
  g.add(handle);
  const light = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 16), m.light, 'PumpLight');
  light.rotation.x = Math.PI / 2;
  light.position.set(-0.04, 0.09, 0.056);
  g.add(light);
  g.position.set(PUMP.x, 0, PUMP.z);
  g.rotation.y = -0.5;
  g.updateMatrixWorld(true);
  return { root: g, light, inletTop: inlet.localToWorld(new THREE.Vector3(0, 0.015, 0)) };
}

/** The battery box (two cells) with a push switch, behind the jar to the left. */
function createBattery(m) {
  const g = new THREE.Group();
  g.name = 'BatteryBox';
  const box = mesh(new THREE.BoxGeometry(0.1, 0.03, 0.075), m.battery, 'Box');
  box.position.y = 0.015;
  box.castShadow = true;
  g.add(box);
  const cellGeo = new THREE.CylinderGeometry(0.0165, 0.0165, 0.085, 24);
  for (const z of [-0.018, 0.018]) {
    const c = mesh(cellGeo, m.cell, 'Cell');
    c.rotation.z = Math.PI / 2;
    c.position.set(0, 0.032, z);
    g.add(c);
  }
  const sw = mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.008, 18), m.red, 'Switch');
  sw.position.set(0.035, 0.034 + 0.016, 0);
  g.add(sw);
  g.position.set(BATTERY.x, 0, BATTERY.z);
  g.rotation.y = 0.35;
  g.updateMatrixWorld(true);
  return { root: g, left: g.localToWorld(new THREE.Vector3(-0.05, 0.03, 0)), right: g.localToWorld(new THREE.Vector3(0.05, 0.03, 0)) };
}

/**
 * The whole apparatus. `num` writes the gauge's numbers (Bangla digits), `unit` its unit; `dir` is the camera's
 * direction (the gauge turns to it). Returns the parts the app moves.
 */
export function createApparatus(m, { num, unit, dir }) {
  const root = new THREE.Group();
  root.name = 'BellJarApparatus';
  const plate = createPlate(m);
  const jar = createJar(m);
  const bell = createBell(m);
  const gv = createGaugeAndValve(m, num, unit, dir);
  const pump = createPump(m);
  const battery = createBattery(m);
  root.add(plate, jar, bell.root, gv.root, pump.root, battery.root);
  // the steel rod the bell hangs from, up to the stopper
  const rodLen = JAR_TOP - 0.008 - BELL_TOP_W.y;
  const hang = mesh(new THREE.CylinderGeometry(0.0022, 0.0022, rodLen, 10), m.steel, 'HangingRod');
  hang.position.set(BELL_TOP_W.x, BELL_TOP_W.y + rodLen / 2, BELL_TOP_W.z);
  root.add(hang);
  // the hose: from the valve's end along the bench to the pump's inlet
  const hoseStart = new THREE.Vector3(VALVE_X + 0.03, 0.02, 0.02);
  const inlet = pump.inletTop;
  root.add(
    tube(
      [
        hoseStart,
        new THREE.Vector3(VALVE_X + 0.07, 0.018, 0.02),
        new THREE.Vector3(0.36, 0.016, -0.06),
        new THREE.Vector3(inlet.x - 0.02, 0.09, inlet.z + 0.03),
        new THREE.Vector3(inlet.x, inlet.y + 0.02, inlet.z),
      ],
      0.009,
      m.hose,
      'Hose',
    ),
  );
  // the wires: from the bell's terminals up through the stopper, then over to the battery box
  const top = JAR_TOP + 0.03;
  for (const [i, mat] of [
    [-1, m.red],
    [1, m.black],
  ]) {
    const end = i < 0 ? battery.right : battery.left;
    const pts = [
      bellToWorld(TERMINALS[i < 0 ? 0 : 1], BELL.y1 - 0.008, FRONT + 0.004),
      bellToWorld(i * 0.024, BELL.y1 + 0.016, -0.008),
      new THREE.Vector3(i * 0.004, JAR_TOP - 0.02, -0.006),
      new THREE.Vector3(i * 0.004, top, -0.004),
      new THREE.Vector3(i * 0.004 - 0.03, top + 0.04, -0.03),
      new THREE.Vector3(BATTERY.x + 0.06, 0.22, BATTERY.z + 0.02 * i),
      new THREE.Vector3(end.x + 0.01, end.y + 0.04, end.z),
      end,
    ];
    const w = tube(pts, 0.0013, mat, 'Wire', 96);
    root.add(w);
  }
  return {
    root,
    jar,
    bell,
    hammer: bell.hammer,
    gong: bell.gong,
    needle: gv.needle,
    lever: gv.lever,
    gauge: gv.gaugeHead,
    pump: pump.root,
    pumpLight: pump.light,
    battery: battery.root,
  };
}

/** The angle the hammer turns away from the gong at full swing (radians). */
export const HAMMER_SWING = 0.46;
