// Metres: a red 2 kg demonstration crate, two optional 1 kg weights, the store room's cement floor and articulated
// rope pullers. The contact plane is y = 0. Hit boxes, glows and helpers are marked noExport.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createPuller } from './person.js';
import { createRoom, ROOM } from './room.js';
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
/**
 * A rope: a tube through three points (start, the middle where it sags, end), its vertices updated in place.
 * The rope always lies in an x–y plane, so each ring is round the tangent in that plane and z.
 */
function createRope(material, segments = 20, radial = 8, radius = 0.011) {
  const geo = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(1, 0, 0)), segments, radius, radial, false);
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  pos.setUsage(THREE.DynamicDrawUsage);
  nor.setUsage(THREE.DynamicDrawUsage);
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = 'TensionRope';
  mesh.frustumCulled = false;
  const p = new THREE.Vector3(),
    tan = new THREE.Vector3(),
    n = new THREE.Vector3(),
    Z = new THREE.Vector3(0, 0, 1),
    tmp = new THREE.Vector3();
  let last = '';
  return {
    mesh,
    set(a, m, b) {
      const key = `${a.x},${a.y},${m.x},${m.y},${b.x},${b.y}`;
      if (key === last) return;
      last = key;
      // a quadratic curve through a and b whose middle is m: control point c = 2m − (a + b) / 2
      for (let i = 0; i <= segments; i++) {
        const u = i / segments,
          k = 1 - u;
        tmp.copy(m).multiplyScalar(2).addScaledVector(a, -0.5).addScaledVector(b, -0.5); // the control point
        p.copy(a)
          .multiplyScalar(k * k)
          .addScaledVector(tmp, 2 * k * u)
          .addScaledVector(b, u * u);
        tan
          .copy(tmp)
          .sub(a)
          .multiplyScalar(2 * k)
          .addScaledVector(tmp.sub(b).negate(), 2 * u);
        tan.normalize();
        n.crossVectors(tan, Z).normalize();
        for (let j = 0; j <= radial; j++) {
          const ang = (j / radial) * Math.PI * 2,
            c = Math.cos(ang),
            s = Math.sin(ang);
          const idx = i * (radial + 1) + j;
          const nx = n.x * c,
            ny = n.y * c,
            nz = s;
          nor.setXYZ(idx, nx, ny, nz);
          pos.setXYZ(idx, p.x + radius * nx, p.y + radius * ny, p.z + radius * nz);
        }
      }
      pos.needsUpdate = true;
      nor.needsUpdate = true;
    },
  };
}
// marks on the floor (the soft shadow, the warm strip) are drawn over it without fighting its depth
const DECAL = { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 };
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

  // ── the store room; its floor (y = 0) is what the crate rubs on ──
  const room = createRoom({ aniso });
  const table = new THREE.Group();
  table.name = 'Floor';
  table.add(room.floor);
  root.add(table, room.root);

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
      new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false, ...DECAL }),
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
    ...DECAL,
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
  strap.name = 'Strap';
  block.add(strap);
  const gripGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.3, 16).rotateX(Math.PI / 2);
  function makePuller(side) {
    const rootGroup = new THREE.Group();
    rootGroup.name = side > 0 ? 'RightPuller' : 'LeftPuller';
    const human = createPuller();
    human.root.scale.x = -side;
    const rope = createRope(ropeMat);
    const grip = new THREE.Mesh(gripGeo, ropeMat);
    grip.name = 'RopeGrip';
    rootGroup.add(human.root, rope.mesh, grip);
    root.add(rootGroup);
    return { root: rootGroup, human, rope, grip };
  }
  const ropeStart = new THREE.Vector3(),
    ropeMid = new THREE.Vector3(),
    ropeEnd = new THREE.Vector3();
  const handTargets = [new THREE.Vector3(), new THREE.Vector3()];
  const pullers = { 1: makePuller(1), '-1': makePuller(-1) };
  const pushers = { 1: pullers[1].root, '-1': pullers[-1].root };

  /** For export: a 6 m × 3 m piece of the floor round the crate and the people (the room's floor is 24 m wide). */
  function floorPatch() {
    const W = 6,
      D = 3;
    const g = new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2);
    // the same texture scale as the room's floor: its UVs span the whole floor
    const uv = g.attributes.uv;
    const depth = ROOM.floorFront - ROOM.wallZ;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * (W / ROOM.width), 0.5 + (uv.getY(i) - 0.5) * (D / depth));
    const m = new THREE.Mesh(g, room.floor.material);
    m.name = 'Floor';
    return m;
  }
  const rig = {
    root,
    table,
    room: room.root,
    background: room.background,
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
      const reach = 0.34 - (rubbing ? side * x * 0.5 : 0);
      handTargets[0].set(reach, 0.9, 0.12);
      handTargets[1].set(reach, 0.9, -0.12);
      puller.human.pose({
        lean: -0.12 - 0.1 * press,
        hipY: 0.86 - 0.025 * press,
        distance: -side * baseX,
        walking: Math.abs(baseX) > 0.008,
        hands: handTargets,
      });
      ropeStart.set(this.x + (side * w) / 2, 0.9, 0);
      ropeEnd.set(baseX + side * (1.42 - reach), 0.9, 0);
      ropeMid.copy(ropeStart).lerp(ropeEnd, 0.5);
      ropeMid.y -= press > 0.02 ? 0 : 0.09;
      puller.rope.set(ropeStart, ropeMid, ropeEnd);
      puller.grip.position.copy(ropeEnd);
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
        floorPatch(),
        block.clone(true),
        ...weights.filter((w) => w.visible).map((w) => w.clone(true)),
        ...Object.values(pullers)
          .filter((p) => p.root.visible)
          .map((p) => {
            const g = new THREE.Group();
            g.name = p.root.name;
            g.add(p.human.exportCopy(), p.rope.mesh.clone(), p.grip.clone());
            return g;
          }),
      );
      return copy;
    },
  };
  rig.setHeat(0);
  return rig;
}
