// Metres: a red 2 kg demonstration crate, two optional 1 kg weights, a teal floor and articulated rope pullers.
// The contact plane is y = 0. Hit boxes, glows and helpers are marked noExport.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createPuller } from './person.js';
import { textMesh } from '@shared/student/materials.js';

export const DIM = {
  block: { w: 0.9, h: 1.0, d: 0.65 },
  weight: { w: 0.2, h: 0.13, d: 0.2 },
  table: { w: 5.8, h: 0.12, d: 2.0, leg: 0.0 },
  pad: { t: 0.022, h: 0.1, d: 0.1 },
  gap: 0.03, // m between the pad and the block when nobody pushes
};
export const WEIGHT_X = { 1: [0], 2: [-0.14, 0.14] }; // where the weights stand on the block for 1 and 2 weights
export const COLORS = { push: '#ffb326', friction: '#ff3f76', heat: '#ff6a2b' };

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function rng(seed) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}
/** Wood with grain along x: base colour as [r, g, b], a few knots when asked. */
export function woodTexture(base, seed, aniso) {
  const W = 512;
  const H = 256;
  const c = canvasOf(W, H);
  const ctx = c.getContext('2d');
  const r = rng(seed);
  const [br, bg, bb] = base;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgb(${br + 8},${bg + 6},${bb + 4})`);
  g.addColorStop(1, `rgb(${br - 8},${bg - 6},${bb - 4})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) {
    const y0 = r() * H;
    const amp = 2 + r() * 7;
    const freq = 0.004 + r() * 0.012;
    const ph = r() * 10;
    ctx.strokeStyle = `rgba(${br * 0.55},${bg * 0.5},${bb * 0.45},${0.1 + r() * 0.22})`;
    ctx.lineWidth = 0.8 + r() * 2.2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 3.3 + ph) * amp * 0.25;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}
/** A soft round shadow under a thing (a transparent texture), so it sits on the table even without the sun. */
function blobTexture() {
  const c = canvasOf(128, 128);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, 'rgba(40,24,10,0.55)');
  g.addColorStop(0.6, 'rgba(40,24,10,0.22)');
  g.addColorStop(1, 'rgba(40,24,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
/** A soft warm patch (an ellipse that fades out), for the table where the block is rubbed. */
function glowTexture() {
  const c = canvasOf(256, 128);
  const ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 0.5, 0, 32);
  const g = ctx.createRadialGradient(128, 64, 10, 128, 64, 126);
  g.addColorStop(0, 'rgba(255,106,43,0.95)');
  g.addColorStop(0.55, 'rgba(255,106,43,0.55)');
  g.addColorStop(1, 'rgba(255,106,43,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const noExport = (o) => {
  o.userData.noExport = true;
  return o;
};

/**
 * @param {{ t: (key: string, vars?: object) => string, aniso?: number }} options
 */
export function createRig({ t, aniso = 8 }) {
  const root = new THREE.Group();
  root.name = 'FrictionForce';

  // ── the table: its top surface is y = 0 ──
  const tableMat = new THREE.MeshStandardMaterial({ name: 'TableWood', map: woodTexture([25, 120, 135], 7, aniso), roughness: 0.68, metalness: 0 });
  const table = new THREE.Group();
  table.name = 'Table';
  const slab = new THREE.Mesh(new RoundedBoxGeometry(DIM.table.w, DIM.table.h, DIM.table.d, 3, 0.008), tableMat);
  slab.position.y = -DIM.table.h / 2;
  slab.name = 'TableTop';
  table.add(slab);
  root.add(table);
  const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xffc34b });
  for (const z of [-0.94, 0.94]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(DIM.table.w, 0.008, 0.025), stripeMaterial);
    stripe.position.set(0, 0.005, z);
    table.add(stripe);
  }

  // ── the block: origin on the table under its middle ──
  const { w, h, d } = DIM.block;
  const blockMat = new THREE.MeshStandardMaterial({ name: 'BlockWood', map: woodTexture([236, 55, 20], 31, aniso), roughness: 0.62, metalness: 0 });
  const heatColor = new THREE.Color(COLORS.heat);
  const block = new THREE.Group();
  block.name = 'Block';
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.006), blockMat);
  body.position.y = h / 2;
  body.name = 'BlockBody';
  block.add(body);
  const mass = textMesh(t('l_block', { n: 2 }), 0.14, { color: '#fff1bd', weight: 700 });
  mass.position.set(0, h * 0.5, d / 2 + 0.0008);
  block.add(mass);
  const hit = noExport(new THREE.Mesh(new THREE.BoxGeometry(w + 0.07, h + 0.1, d + 0.06), new THREE.MeshBasicMaterial({ visible: false })));
  hit.position.y = (h + 0.1) / 2 - 0.02;
  block.add(hit);
  const blob = noExport(
    new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.16, d + 0.18),
      new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false }),
    ),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.0004;
  block.add(blob);
  // the contact line glows when it warms (a strip along the bottom front edge, and the block warms a little)
  const edgeMat = new THREE.MeshBasicMaterial({ color: COLORS.heat, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const edge = noExport(new THREE.Mesh(new THREE.PlaneGeometry(w * 0.98, 0.014), edgeMat));
  edge.position.set(0, 0.007, d / 2 + 0.001);
  block.add(edge);
  root.add(block);

  // the table warms along the strip the block rubs
  const trackMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    map: glowTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  const track = noExport(new THREE.Mesh(new THREE.PlaneGeometry(1, d + 0.05), trackMat));
  track.rotation.x = -Math.PI / 2;
  track.position.y = 0.0007;
  root.add(track);

  // ── the 1 kg weights (iron, written on the front), on top of the block ──
  const ironMat = new THREE.MeshStandardMaterial({ name: 'Iron', color: 0x4b5563, roughness: 0.5, metalness: 0.6 });
  function makeWeight() {
    const g = new THREE.Group();
    g.name = 'Weight';
    const b = new THREE.Mesh(new RoundedBoxGeometry(DIM.weight.w, DIM.weight.h, DIM.weight.d, 3, 0.006), ironMat);
    b.position.y = DIM.weight.h / 2;
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.015, 0.016, 20), ironMat);
    knob.position.y = DIM.weight.h + 0.008;
    const tx = textMesh(t('l_weight', { n: 1 }), 0.065, { color: '#ffffff', weight: 700 });
    tx.position.set(0, DIM.weight.h * 0.5, DIM.weight.d / 2 + 0.0008);
    g.add(b, knob, tx);
    return g;
  }
  const weights = [makeWeight(), makeWeight()];
  for (const wt of weights) {
    wt.visible = false;
    root.add(wt);
  }

  // Each puller faces the box, leans away and grips a horizontal rope.
  // Rubbing uses two visible people taking turns, rather than teleporting a person.
  const ropeMat = new THREE.MeshStandardMaterial({ name: 'Rope', color: 0x50321d, roughness: 0.95 });
  const strapPoints = [
    [-w / 2 - 0.008, -d / 2 - 0.008],
    [w / 2 + 0.008, -d / 2 - 0.008],
    [w / 2 + 0.008, d / 2 + 0.008],
    [-w / 2 - 0.008, d / 2 + 0.008],
    [-w / 2 - 0.008, -d / 2 - 0.008],
  ].map(([x, z]) => new THREE.Vector3(x, 0.9, z));
  const wrap = new THREE.CurvePath();
  for (let i = 1; i < strapPoints.length; i++) wrap.add(new THREE.LineCurve3(strapPoints[i - 1], strapPoints[i]));
  const strap = new THREE.Mesh(new THREE.TubeGeometry(wrap, 40, 0.011, 8, false), ropeMat);
  block.add(strap);
  function makePuller(side) {
    const rootGroup = new THREE.Group();
    rootGroup.name = side > 0 ? 'RightPuller' : 'LeftPuller';
    const human = createPuller();
    human.root.scale.x = -side;
    const rope = new THREE.Mesh(new THREE.BufferGeometry(), ropeMat);
    rope.name = 'TensionRope';
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 16).rotateX(Math.PI / 2), ropeMat);
    grip.name = 'RopeGrip';
    rootGroup.add(human.root, rope, grip);
    root.add(rootGroup);
    return { root: rootGroup, human, rope, grip };
  }
  const pullers = { 1: makePuller(1), '-1': makePuller(-1) };
  const pushers = { 1: pullers[1].root, '-1': pullers[-1].root };

  const rig = {
    root,
    table,
    block,
    body,
    hit,
    pushers,
    weights,
    heat: 0,
    /** The block's middle (x) and how high it sits off the table (lift, m: rides over the teeth: never visible here). */
    placeBlock(x) {
      block.position.x = x;
      this.x = x;
    },
    x: 0,
    /**
     * The weights on the block for `load` (0…2); drop: how far above their place the last one is (m, 0 = resting),
     * so a tween can lower it. The block's x moves them along.
     */
    placeWeights(load, drop = 0, x = this.x) {
      const spots = WEIGHT_X[load] || [];
      weights.forEach((wt, i) => {
        const on = i < load;
        wt.visible = on;
        if (!on) return;
        const last = i === load - 1;
        wt.position.set(x + spots[i], h + (last ? drop : 0), 0);
      });
    },
    /** side is the force direction; the human stands on that side and pulls outward. */
    placePusher(side, x, press, visible = true, rubbing = false) {
      const puller = pullers[side];
      puller.root.visible = visible;
      if (!visible) return;
      const baseX = rubbing ? x * 0.5 : x;
      puller.human.root.position.set(baseX + side * 1.42, 0, 0);
      const reach = 0.29 - (rubbing ? side * x * 0.5 : 0);
      puller.human.pose({
        lean: -0.12 - 0.1 * press,
        hipY: 0.81 - 0.04 * press,
        distance: -side * baseX,
        walking: Math.abs(baseX) > 0.008,
        hands: [new THREE.Vector3(reach, 0.9, 0.12), new THREE.Vector3(reach, 0.9, -0.12)],
      });
      const start = new THREE.Vector3(this.x + (side * w) / 2, 0.9, 0);
      const end = new THREE.Vector3(baseX + side * (1.42 - reach), 0.9, 0);
      const mid = start.clone().lerp(end, 0.5);
      mid.y -= press > 0.02 ? 0 : 0.09;
      puller.rope.geometry.dispose();
      puller.rope.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start, mid, end]), 20, 0.011, 8, false);
      puller.grip.position.copy(end);
    },
    /** The warm strip on the table from x0 to x1 and how warm (0…1); the block and its edge glow too. */
    setHeat(k, x0 = -0.12, x1 = 0.12) {
      this.heat = k;
      trackMat.opacity = 0.85 * Math.min(1, 1.7 * k); // clear already when only half warm
      track.visible = k > 0.01;
      track.scale.x = Math.max(0.01, x1 - x0 + w);
      track.position.x = (x0 + x1) / 2;
      edgeMat.opacity = 0.9 * Math.min(1, 1.7 * k);
      edge.visible = k > 0.01;
      blockMat.emissive.copy(heatColor).multiplyScalar(0.3 * Math.min(1, 1.5 * k));
    },
    /** Current crate, people and ropes; the microscopic explanation is an inset. */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'FrictionForce';
      copy.add(
        table.clone(true),
        block.clone(true),
        ...weights.filter((w) => w.visible).map((w) => w.clone(true)),
        ...Object.values(pushers)
          .filter((p) => p.visible)
          .map((p) => p.clone(true)),
      );
      return copy;
    },
  };
  rig.setHeat(0);
  return rig;
}
