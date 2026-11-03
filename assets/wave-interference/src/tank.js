// The ripple tank, in metres (the still water's surface is y = 0): a shallow tray with a satin aluminium frame and
// sloped foam beaches inside its rim (they swallow the ripples, so nothing reflects back), standing on rubber feet
// on a lab bench; a vibrator above it (two steel uprights clamped to the frame, a crossbar, two helical springs, a flat
// aluminium bar with a small motor and its eccentric weight); two point dippers (white plastic beads on steel rods)
// clamped to the bar; two floating cork balls. The water itself is src/water.js. Procedural, no image files.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SOURCE_Z, TANK } from './reading.js';

const BEACH = 0.03; // foam beach width round the water
const WALL = 0.014; // frame thickness
const RIM_Y = 0.016; // top of the frame above the water
const FLOOR_Y = -0.0064; // the tank's glass floor (6.4 mm deep: v = √(gh) ≈ 0.25 m/s)
export const OUTER = { w: TANK.w + 2 * (BEACH + WALL), d: TANK.d + 2 * (BEACH + WALL) };
export const BENCH_Y = -0.05; // the bench top
export const BAR_Y = 0.15; // the vibrator bar's underside at rest
const ROD_LEN = 0.155; // a dipper's rod, bar to bead centre
export const BEAD_R = 0.0075;
export const BALL_R = 0.0105;
const POST_X = OUTER.w / 2 + 0.018;
const CROSS_Y = 0.255;
const SPRING_X = 0.135;

function canvasTex(w, h, draw, repeat = null) {
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
/** Merges geometries whether or not they are indexed (all made non-indexed, uv kept). */
function merge(list) {
  return mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)));
}
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The backdrop: a soft dusk teal-blue to a warm sand low down (screen space): never white, never green. */
export function backdropTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#3d5a73');
    s.addColorStop(0.45, '#6f8799');
    s.addColorStop(0.8, '#b8a58a');
    s.addColorStop(1, '#c9b494');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/** A lab bench of oiled iroko planks, fading out at its far edges so it melts into the backdrop. */
function benchTexture() {
  return canvasTex(1024, 512, (ctx, W, H) => {
    const r = rng(11);
    const planks = 6;
    for (let p = 0; p < planks; p++) {
      const y0 = (p * H) / planks;
      ctx.fillStyle = `hsl(${26 + r() * 6}, ${40 + r() * 10}%, ${34 + r() * 7}%)`;
      ctx.fillRect(0, y0, W, H / planks);
      for (let i = 0; i < 22; i++) {
        const y = y0 + r() * (H / planks);
        ctx.strokeStyle = `rgba(60,28,10,${0.08 + r() * 0.2})`;
        ctx.lineWidth = 0.5 + r() * 1.5;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 16) {
          const yy = y + Math.sin(x * 0.006 + i * 1.7) * 2.5;
          x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(30,12,4,0.55)';
      ctx.fillRect(0, y0, W, 2);
    }
  });
}

/** Grey open-cell foam (the beaches). */
function foamTexture() {
  return canvasTex(
    256,
    256,
    (ctx, W, H) => {
      const r = rng(5);
      ctx.fillStyle = '#5d6168';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = r() < 0.5 ? `rgba(30,32,36,${0.25 + r() * 0.4})` : `rgba(150,155,162,${0.15 + r() * 0.3})`;
        ctx.beginPath();
        ctx.arc(r() * W, r() * H, 0.6 + r() * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [6, 1],
  );
}

/** The glass floor over a pale screen with a faint 2 cm grid (as the ripple tank's viewing screen). */
function floorTexture() {
  return canvasTex(1024, 1024, (ctx, W, H) => {
    ctx.fillStyle = '#e9f1f4';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(30,70,100,0.5)';
    ctx.lineWidth = 2;
    const n = 34; // 2 cm squares over the ~0.68 m floor
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.moveTo(0, x);
      ctx.lineTo(W, x);
      ctx.stroke();
    }
  });
}

/** A helix (spring) from y0 down to y1 at x, z, with end hooks. */
function springGeometry(turns, radius, wire, length) {
  const pts = [];
  const n = turns * 24;
  pts.push(new THREE.Vector3(0, 0, 0));
  pts.push(new THREE.Vector3(0, -0.004, 0));
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, -0.008 - (i / n) * (length - 0.016), Math.sin(a) * radius));
  }
  pts.push(new THREE.Vector3(0, -length + 0.004, 0));
  pts.push(new THREE.Vector3(0, -length, 0));
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, n + 8, wire, 6, false);
}

export function createTank() {
  const root = new THREE.Group();
  root.name = 'RippleTank';

  const M = {
    alu: new THREE.MeshPhysicalMaterial({ name: 'Aluminium', color: 0xc9ced4, metalness: 0.85, roughness: 0.38, clearcoat: 0.2 }),
    steel: new THREE.MeshPhysicalMaterial({ name: 'Steel', color: 0xd8dde3, metalness: 1, roughness: 0.25 }),
    dark: new THREE.MeshStandardMaterial({ name: 'BlackPlastic', color: 0x22252a, roughness: 0.55, metalness: 0.1 }),
    rubber: new THREE.MeshStandardMaterial({ name: 'Rubber', color: 0x1b1c1f, roughness: 0.9 }),
    bead: new THREE.MeshPhysicalMaterial({ name: 'Dipper', color: 0xf7f7f2, roughness: 0.28, clearcoat: 0.6 }),
    motor: new THREE.MeshPhysicalMaterial({ name: 'Motor', color: 0x2c5f9e, metalness: 0.5, roughness: 0.35, clearcoat: 0.5 }),
    brass: new THREE.MeshPhysicalMaterial({ name: 'Brass', color: 0xd2a24c, metalness: 1, roughness: 0.3 }),
    foam: new THREE.MeshStandardMaterial({ name: 'Foam', map: foamTexture(), roughness: 0.95 }),
    bench: new THREE.MeshStandardMaterial({ name: 'Bench', map: benchTexture(), roughness: 0.62 }),
    floor: new THREE.MeshStandardMaterial({ name: 'TankFloor', map: floorTexture(), roughness: 0.7 }),
    ball: new THREE.MeshPhysicalMaterial({ name: 'CorkBall', color: 0xf08c2e, roughness: 0.45, clearcoat: 0.3 }),
  };

  // ── the bench ──
  const bench = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.04, 0.95, 3, 0.006), M.bench);
  bench.position.set(0, BENCH_Y - 0.02, 0.02);
  bench.receiveShadow = true;
  bench.name = 'Bench';
  bench.userData.noExport = true; // the setting, not the apparatus
  root.add(bench);

  // ── the tray: the frame (four rounded rails), the floor under the water, rubber feet ──
  const trayY0 = BENCH_Y + 0.012; // the tray's underside on its feet
  const railH = RIM_Y - trayY0;
  const rails = [];
  const ow = OUTER.w;
  const od = OUTER.d;
  const rail = (w, d, x, z) => {
    const g = new RoundedBoxGeometry(w, railH, d, 2, 0.004);
    g.translate(x, trayY0 + railH / 2, z);
    rails.push(g);
  };
  rail(ow, WALL, 0, -od / 2 + WALL / 2);
  rail(ow, WALL, 0, od / 2 - WALL / 2);
  rail(WALL, od - 2 * WALL, -ow / 2 + WALL / 2, 0);
  rail(WALL, od - 2 * WALL, ow / 2 - WALL / 2, 0);
  const base = new THREE.BoxGeometry(ow - 0.004, 0.006, od - 0.004);
  base.translate(0, trayY0 + 0.003, 0);
  rails.push(base);
  const frame = new THREE.Mesh(merge(rails), M.alu);
  frame.name = 'TankFrame';
  frame.castShadow = true;
  frame.receiveShadow = true;
  root.add(frame);
  const feet = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const g = new THREE.CylinderGeometry(0.012, 0.014, 0.012, 20);
      g.translate(sx * (ow / 2 - 0.03), BENCH_Y + 0.006, sz * (od / 2 - 0.03));
      feet.push(g);
    }
  const feetMesh = new THREE.Mesh(merge(feet), M.rubber);
  feetMesh.name = 'Feet';
  root.add(feetMesh);
  // a floor just under the water (seen only at the beaches' foot)
  const floor = new THREE.Mesh(new THREE.BoxGeometry(ow - 2 * WALL, 0.004, od - 2 * WALL), M.floor);
  floor.position.y = FLOOR_Y - 0.002;
  floor.name = 'TankFloor';
  root.add(floor);

  // ── the beaches: sloped foam from below the water's edge up to the rim ──
  const beaches = [];
  const beach = (len, alongX, sign) => {
    // a wedge: the slope rises outward from 3 mm under the surface at the water's edge to the rim
    const shape = new THREE.Shape();
    shape.moveTo(0, FLOOR_Y);
    shape.lineTo(0, -0.003);
    shape.lineTo(BEACH, RIM_Y - 0.002);
    shape.lineTo(BEACH, FLOOR_Y);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
    // shape x → outward, extrude z → along the side
    if (alongX) {
      g.rotateY(-Math.PI / 2); // extrude along −x … make it along x
      g.translate(len / 2, 0, 0);
      if (sign < 0) g.rotateY(Math.PI);
      g.translate(0, 0, sign * (TANK.d / 2));
    } else {
      g.translate(0, 0, -len / 2);
      if (sign < 0) g.rotateY(Math.PI);
      g.translate(sign * (TANK.w / 2), 0, 0);
    }
    beaches.push(g);
  };
  beach(TANK.w + 2 * BEACH, true, 1);
  beach(TANK.w + 2 * BEACH, true, -1);
  beach(TANK.d, false, 1);
  beach(TANK.d, false, -1);
  const foam = new THREE.Mesh(merge(beaches), M.foam);
  foam.name = 'Beaches';
  foam.receiveShadow = true;
  root.add(foam);

  // ── the vibrator: uprights clamped to the frame's sides, a crossbar, two springs, the bar ──
  const frameParts = [];
  for (const sx of [-1, 1]) {
    const post = new THREE.CylinderGeometry(0.0055, 0.0055, CROSS_Y - trayY0 + 0.01, 20);
    post.translate(sx * POST_X, (CROSS_Y + trayY0) / 2, SOURCE_Z);
    frameParts.push(post);
    // a boss clamp holding the post to the rail
    const boss = new RoundedBoxGeometry(0.03, 0.026, 0.03, 2, 0.004);
    boss.translate(sx * (POST_X - 0.004), RIM_Y - 0.008, SOURCE_Z);
    frameParts.push(boss);
    // a clamp where the crossbar meets the post
    const top = new RoundedBoxGeometry(0.022, 0.022, 0.022, 2, 0.003);
    top.translate(sx * POST_X, CROSS_Y, SOURCE_Z);
    frameParts.push(top);
  }
  const posts = new THREE.Mesh(merge(frameParts), M.steel);
  posts.name = 'Stand';
  posts.castShadow = true;
  root.add(posts);
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 2 * POST_X + 0.02, 20), M.steel);
  cross.rotation.z = Math.PI / 2;
  cross.position.set(0, CROSS_Y, SOURCE_Z);
  cross.name = 'Crossbar';
  cross.castShadow = true;
  root.add(cross);

  // the moving part: the bar, the motor, the clamps and the dippers (moved up and down together)
  const bar = new THREE.Group();
  bar.name = 'Vibrator';
  root.add(bar);
  const beam = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.01, 0.026, 2, 0.003), M.alu);
  beam.position.set(0, BAR_Y + 0.005, SOURCE_Z);
  beam.castShadow = true;
  beam.name = 'Bar';
  bar.add(beam);
  const motor = new THREE.Group();
  motor.name = 'Motor';
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.034, 28), M.motor);
  can.rotation.x = Math.PI / 2;
  const capF = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.012, 0.004, 28), M.steel);
  capF.rotation.x = Math.PI / 2;
  capF.position.z = 0.019;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.01, 10), M.steel);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = 0.024;
  motor.add(can, capF, shaft);
  motor.position.set(0, BAR_Y + 0.023, SOURCE_Z - 0.002);
  const cam = new THREE.Group(); // the eccentric weight: a half disc on the shaft, turning once a cycle
  const half = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.004, 24, 1, false, 0, Math.PI), M.brass);
  half.rotation.x = Math.PI / 2;
  cam.add(half);
  cam.position.set(0, BAR_Y + 0.023, SOURCE_Z + 0.027);
  for (const m of [can, capF]) m.castShadow = true;
  bar.add(motor, cam);
  // springs from the crossbar to the bar
  const springs = [];
  const springLen = CROSS_Y - (BAR_Y + 0.01);
  for (const sx of [-1, 1]) {
    const sp = new THREE.Mesh(springGeometry(9, 0.0045, 0.0007, springLen), M.steel);
    sp.position.set(sx * SPRING_X, CROSS_Y, SOURCE_Z);
    sp.name = 'Spring';
    springs.push(sp);
    root.add(sp);
  }
  // the dippers: a clamp on the bar, a rod through it, a bead at the bottom
  const dippers = [0, 1].map((i) => {
    const g = new THREE.Group();
    g.name = `Dipper${i + 1}`;
    const clamp = new THREE.Mesh(new RoundedBoxGeometry(0.016, 0.018, 0.034, 2, 0.003), M.dark);
    clamp.position.y = BAR_Y + 0.005;
    clamp.castShadow = true;
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.008, 14), M.steel);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(0, BAR_Y + 0.005, 0.021);
    const slider = new THREE.Group(); // the rod and bead: lifted out of the water to stop this source
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, ROD_LEN, 12), M.steel);
    rod.position.y = ROD_LEN / 2;
    rod.castShadow = true;
    const bead = new THREE.Mesh(new THREE.SphereGeometry(BEAD_R, 32, 20), M.bead);
    bead.castShadow = true;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 14, 10), M.dark);
    knob.position.y = ROD_LEN + 0.002;
    slider.add(rod, bead, knob);
    slider.position.y = BEAD_R * 0.35; // the bead's centre: it dips a little under the still surface
    g.add(clamp, screw, slider);
    g.position.z = SOURCE_Z;
    bar.add(g);
    // a big invisible box round it for a finger
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.07), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.09;
    hit.userData.noExport = true;
    g.add(hit);
    return { group: g, slider, bead, hit };
  });

  // the floating cork balls
  const balls = [0, 1].map((i) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 32, 20), M.ball);
    b.name = `Ball${i + 1}`;
    b.castShadow = true;
    root.add(b);
    return b;
  });

  const LIFT = 0.035; // how far a dipper is lifted out of the water
  return {
    root,
    materials: M,
    dippers,
    balls,
    springs,
    pickable: dippers.map((d) => d.hit),
    /** The gap between the dippers (m). */
    setGap(gap) {
      dippers[0].group.position.x = -gap / 2;
      dippers[1].group.position.x = gap / 2;
    },
    /** lift: 0 dipping … 1 lifted clear; y: the bar's vertical shake (m); turn: the motor's angle. */
    setLift(i, lift) {
      dippers[i].slider.position.y = BEAD_R * 0.35 + LIFT * lift;
    },
    setShake(y, turn) {
      bar.position.y = y;
      cam.rotation.z = turn;
      for (const sp of springs) sp.scale.y = 1 - y / springLen;
    },
    /** A ball floats at (x, z) on a surface at height h (drawn). */
    setBall(i, x, z, h) {
      balls[i].position.set(x, h + BALL_R * 0.35, z);
    },
    /** The point just above a dipper's bead (for its ring and label). */
    beadTop(i, out = new THREE.Vector3()) {
      return dippers[i].bead.getWorldPosition(out);
    },
  };
}
