// The road, procedural three.js, in metres (1 m on the axis = 1 unit): a dark asphalt road with a dashed centre line,
// white edge lines and light kerbs, on a low causeway over a soft blue-grey ground. The causeway's front is a gentle
// slope of pale concrete facing the viewer: along its top a clean white ruler strip is the number line from −7 m to
// 10 m (a tick every metre, 0 bolder, a small one every half metre, an arrowhead past 10; the numbers are drawn on
// the figure's 2D overlay so they keep a readable size on a phone), and under it three rows carry the parts of x drawn
// tip to tail as thick outlined arrows: x₀ (red) from 0, ut (blue) from x₀, ½at² (green) ending at x, as the owner's
// reference stacks them under its axis, with a faint line down from 0 where they all start.
import * as THREE from 'three';
import { AXIS } from './motion.js';

// the road runs well past both ends of the axis, so it leaves the picture at both sides on every frame
export const ROAD = { x0: -24, x1: 27, back: -1.9, front: 1.9, lane: 0.72 };
/** The ground under the causeway, and the front slope (its angle from the ground and its length). */
export const GROUND_Y = -3.4; // deeper than the strip shows: the slope runs out of the picture at the bottom
const SLOPE_ANGLE = THREE.MathUtils.degToRad(62);
const SLOPE_LEN = -GROUND_Y / Math.sin(SLOPE_ANGLE);
const KERB = { w: 0.32, h: 0.14 };
const TOP_Z = ROAD.front + KERB.w; // where the slope starts
/** On the slope, measured down from its top edge (m): the ruler strip, the axis line, the numbers, the three rows. */
export const SLOPE = { band: 0.78, axis: -0.1, numbers: -0.52, rows: { x0: -1.18, ut: -1.8, half: -2.42 }, len: SLOPE_LEN };

const SHAFT = 0.13; // half height of an arrow's shaft
const HEAD_L = 0.5;
const HEAD_H = 0.3; // half height of the head
const OUT = 0.055; // the dark outline

function boxes(list, material) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, material, list.length);
  const m = new THREE.Matrix4();
  list.forEach(([x, y, z, w, h, d], i) => {
    m.makeScale(w, h, d).setPosition(x, y, z);
    mesh.setMatrixAt(i, m);
  });
  return mesh;
}

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Dark asphalt with a fine grain (one small canvas texture). */
function asphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#41474f';
  ctx.fillRect(0, 0, 256, 256);
  const rnd = seeded(7);
  for (let i = 0; i < 3800; i++) {
    const v = 52 + Math.floor(rnd() * 46);
    ctx.fillStyle = `rgba(${v},${v + 3},${v + 8},${0.35 + rnd() * 0.4})`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 1.8, 1 + rnd() * 1.8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((ROAD.x1 - ROAD.x0) / 2.5, 1.4);
  tex.anisotropy = 8;
  return tex;
}

/** Pale concrete for the slope: a soft grain, no joints (the face stays calm behind the arrows). */
function concreteTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d3e0ea';
  ctx.fillRect(0, 0, 256, 128);
  const rnd = seeded(11);
  for (let i = 0; i < 1400; i++) {
    const v = 196 + Math.floor(rnd() * 30);
    ctx.fillStyle = `rgba(${v - 8},${v + 4},${v + 14},0.35)`;
    ctx.fillRect(rnd() * 256, rnd() * 128, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((ROAD.x1 - ROAD.x0) / 2.5, 1);
  tex.anisotropy = 8;
  return tex;
}

/** A thick flat arrow in the slope's plane: a shaft and a head in the quantity's colour over a dark outline; a dot when 0. */
function flatArrow(color, outline) {
  const root = new THREE.Group();
  const fill = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 });
  const edge = new THREE.MeshStandardMaterial({ color: outline, roughness: 0.6 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const tri = (l, h, d) => {
    const s = new THREE.Shape();
    s.moveTo(0, -h);
    s.lineTo(l, 0);
    s.lineTo(0, h);
    s.lineTo(0, -h);
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(-l, 0, 0); // the tip at x = 0
    return g;
  };
  const shaftO = new THREE.Mesh(box, edge);
  const shaftF = new THREE.Mesh(box, fill);
  const headO = new THREE.Mesh(tri(HEAD_L + OUT * 2.4, HEAD_H + OUT * 1.8, 0.03), edge);
  const headF = new THREE.Mesh(tri(HEAD_L, HEAD_H, 0.03), fill);
  headO.position.set(OUT * 1.8, 0, 0.0);
  headF.position.z = 0.03;
  const dotO = new THREE.Mesh(new THREE.CircleGeometry(0.15 + OUT, 28), edge);
  const dotF = new THREE.Mesh(new THREE.CircleGeometry(0.15, 28), fill);
  dotO.position.z = 0.031;
  dotF.position.z = 0.062;
  const head = new THREE.Group();
  head.add(headO, headF);
  root.add(shaftO, shaftF, head, dotO, dotF);
  return {
    root,
    /** From x = a to x = b at height y (on the slope). */
    set(a, b, y) {
      const len = Math.abs(b - a);
      const dir = Math.sign(b - a) || 1;
      const zero = len < 0.03;
      dotO.visible = dotF.visible = zero;
      shaftO.visible = shaftF.visible = head.visible = !zero;
      dotO.position.set(a, y, dotO.position.z);
      dotF.position.set(a, y, dotF.position.z);
      if (zero) return;
      const k = Math.min(1, len / (HEAD_L * 1.4)); // a short arrow gets a smaller head
      const hl = HEAD_L * k;
      head.scale.set(dir * k, Math.max(0.6, k), 1); // a negative x scale points it left
      head.position.set(b, y, 0);
      const sl = Math.max(0.001, len - hl);
      const mid = a + (dir * sl) / 2;
      shaftF.scale.set(sl, SHAFT * 2, 0.03);
      shaftF.position.set(mid, y, 0.045);
      shaftO.scale.set(sl + OUT * 2, SHAFT * 2 + OUT * 2, 0.03);
      shaftO.position.set(mid - dir * OUT * 0.5, y, 0.015);
    },
  };
}

export function createTrack({ colors }) {
  const root = new THREE.Group();
  root.name = 'Track';
  const L = ROAD.x1 - ROAD.x0;
  const cx = (ROAD.x0 + ROAD.x1) / 2;

  // the causeway: its cross-section (z, y) extruded along x; the front slope gets its own face below
  const run = SLOPE_LEN * Math.cos(SLOPE_ANGLE);
  const backZ = ROAD.back - KERB.w;
  const prof = new THREE.Shape();
  prof.moveTo(-(backZ - run * 0.7), GROUND_Y); // the shape's x is −z (see the rotation below)
  prof.lineTo(-backZ, 0);
  prof.lineTo(-TOP_Z, 0);
  prof.lineTo(-(TOP_Z + run), GROUND_Y);
  prof.lineTo(-(backZ - run * 0.7), GROUND_Y);
  const causeGeo = new THREE.ExtrudeGeometry(prof, { depth: L, bevelEnabled: false });
  causeGeo.rotateY(Math.PI / 2); // depth → +x, shape x → −z
  causeGeo.translate(ROAD.x0, 0, 0);
  const concrete = new THREE.MeshStandardMaterial({ name: 'Concrete', color: 0xc2d2df, roughness: 0.92 });
  const cause = new THREE.Mesh(causeGeo, concrete);
  cause.name = 'Causeway';
  cause.receiveShadow = true;
  root.add(cause);

  // the front slope, facing the viewer: a group whose local y runs up the slope (0 at its top edge), local z out
  const slope = new THREE.Group();
  slope.name = 'Slope';
  slope.position.set(0, 0, TOP_Z);
  slope.rotation.x = SLOPE_ANGLE - Math.PI / 2;
  root.add(slope);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(L, SLOPE_LEN),
    new THREE.MeshStandardMaterial({ name: 'SlopeFace', map: concreteTexture(), roughness: 0.9 }),
  );
  face.position.set(cx, -SLOPE_LEN / 2, 0.004);
  face.receiveShadow = true;
  slope.add(face);
  // a soft darker foot where the slope meets the ground
  const foot = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.16), new THREE.MeshStandardMaterial({ name: 'Foot', color: 0xb9cad7, roughness: 0.9 }));
  foot.position.set(cx, -SLOPE_LEN + 0.08, 0.006);
  slope.add(foot);

  // the ruler strip along the slope's top: white, the axis line with its arrowhead, the ticks
  const white = new THREE.MeshStandardMaterial({ name: 'Ruler', color: 0xffffff, roughness: 0.5 });
  const band = new THREE.Mesh(new THREE.BoxGeometry(L - 0.1, SLOPE.band, 0.05), white);
  band.position.set(cx, -SLOPE.band / 2 - 0.02, 0.03);
  band.receiveShadow = true;
  band.name = 'NumberLine';
  slope.add(band);
  const ink = new THREE.MeshStandardMaterial({ name: 'Ink', color: 0x18202a, roughness: 0.5 });
  const zF = 0.062;
  const ay = SLOPE.axis;
  const ticks = [[(ROAD.x0 + 0.35 + AXIS.max + 0.9) / 2, ay, zF, AXIS.max + 0.9 - ROAD.x0 - 0.35, 0.045, 0.006]]; // the axis line, from the left edge
  for (let i = AXIS.min; i <= AXIS.max; i++) {
    const big = i === 0;
    ticks.push([i, ay - 0.13, zF, big ? 0.075 : 0.045, big ? 0.3 : 0.24, 0.006]);
    if (i < AXIS.max) ticks.push([i + 0.5, ay - 0.07, zF, 0.03, 0.13, 0.006]);
  }
  for (let i = AXIS.min - 2; i < AXIS.min; i++) ticks.push([i + 0.5, ay - 0.07, zF, 0.03, 0.13, 0.006]);
  slope.add(boxes(ticks, ink));
  const hs = new THREE.Shape();
  hs.moveTo(0, -0.14);
  hs.lineTo(0.4, 0);
  hs.lineTo(0, 0.14);
  hs.lineTo(0, -0.14);
  const arrowHead = new THREE.Mesh(new THREE.ShapeGeometry(hs), ink);
  arrowHead.position.set(AXIS.max + 0.88, ay, zF + 0.001);
  slope.add(arrowHead);

  // a faint line down the slope from 0, where the three parts start
  const faint = new THREE.MeshStandardMaterial({ name: 'Origin', color: 0x71879b, roughness: 0.7 });
  const originLen = -SLOPE.rows.half + 0.4 - SLOPE.band - 0.05;
  const origin = new THREE.Mesh(new THREE.BoxGeometry(0.035, originLen, 0.004), faint);
  origin.position.set(0, -SLOPE.band - 0.05 - originLen / 2, 0.01);
  slope.add(origin);

  // the road on top: asphalt between two light kerbs, white edge lines, a dashed centre line
  const asphalt = new THREE.MeshStandardMaterial({ name: 'Asphalt', map: asphaltTexture(), roughness: 0.88, metalness: 0 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(L, ROAD.front - ROAD.back), asphalt);
  road.rotation.x = -Math.PI / 2;
  road.position.set(cx, 0.002, (ROAD.front + ROAD.back) / 2);
  road.name = 'Road';
  road.receiveShadow = true;
  root.add(road);
  const kerbMat = new THREE.MeshStandardMaterial({ name: 'Kerb', color: 0xe4e9ee, roughness: 0.75 });
  const kerbs = boxes(
    [
      [cx, KERB.h / 2, ROAD.front + KERB.w / 2, L, KERB.h, KERB.w],
      [cx, KERB.h / 2, ROAD.back - KERB.w / 2, L, KERB.h, KERB.w],
    ],
    kerbMat,
  );
  kerbs.castShadow = true;
  kerbs.receiveShadow = true;
  kerbs.name = 'Kerbs';
  root.add(kerbs);
  const paint = new THREE.MeshStandardMaterial({ name: 'RoadPaint', color: 0xf4f6f8, roughness: 0.6 });
  const marks = [
    [cx, 0.006, ROAD.front - 0.2, L, 0.004, 0.11],
    [cx, 0.006, ROAD.back + 0.2, L, 0.004, 0.11],
  ];
  for (let x = ROAD.x0 + 0.6; x < ROAD.x1 - 1; x += 2.4) marks.push([x + 0.7, 0.006, (ROAD.front + ROAD.back) / 2, 1.4, 0.004, 0.1]);
  const lines = boxes(marks, paint);
  lines.receiveShadow = true;
  lines.name = 'RoadLines';
  root.add(lines);

  // the three arrows on the slope
  const arrows = {
    x0: flatArrow(colors.x0, '#3a0d0d'),
    ut: flatArrow(colors.u, '#0b2346'),
    half: flatArrow(colors.a, '#0f2c15'),
  };
  for (const [k, a] of Object.entries(arrows)) {
    a.root.name = `Arrow ${k}`;
    a.root.position.z = 0.02;
    slope.add(a.root);
  }

  // the car's position on the axis: a dark blue dot on the axis line, as the reference's
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 24, 16),
    new THREE.MeshStandardMaterial({ name: 'Dot', color: 0x1f3fd1, roughness: 0.35, emissive: 0x0a1a60, emissiveIntensity: 0.25 }),
  );
  dot.name = 'PositionDot';
  slope.add(dot);

  const v = new THREE.Vector3();
  return {
    root,
    dot,
    /** A point on the slope (x along the axis, y measured down from its top edge, z out of it), in world space. */
    onSlope(x, y, z = 0.08, out = new THREE.Vector3()) {
      root.updateMatrixWorld();
      return slope.localToWorld(out.copy(v.set(x, y, z)));
    },
    /** The three parts drawn tip to tail from 0: x₀, then ut, then ½at² ending at x. */
    setParts({ x0, ut, half }) {
      arrows.x0.set(0, x0, SLOPE.rows.x0);
      arrows.ut.set(x0, x0 + ut, SLOPE.rows.ut);
      arrows.half.set(x0 + ut, x0 + ut + half, SLOPE.rows.half);
    },
    setDot(x) {
      dot.position.set(x, SLOPE.axis, 0.1);
    },
  };
}
