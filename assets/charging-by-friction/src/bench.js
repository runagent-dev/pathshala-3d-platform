// The objects, procedural three.js in metres: a plain sand table top; two glass rods and two plastic rods (25 cm,
// 13 mm thick); a piece of silk and a piece of flannel draped over the rubbed end of a rod lying on two wooden V-blocks;
// two lab stands, each with a rod hanging from a silk thread tied at its middle. Static parts are merged, one mesh per
// material; the rods and cloths are separate meshes because they move.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AXIS_Y, BLOCKS, CLOTH, ROD, STAND, STATION, TABLE } from './layout.js';

/** Merges geometries made in different ways (some indexed, some not). */
const merge = (list) => mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)));

/** A rounded rectangle in the (x, y) plane. */
function roundedRect(x0, x1, y0, y1, r) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r);
  s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1);
  s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

/** A small seeded random (the cloth's folds are the same on every load). */
function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A weave texture for a cloth (power of two, made once): fine threads for silk, a soft twill fuzz for flannel. */
function clothTexture(kind) {
  const n = kind === 'silk' ? 128 : 256;
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  const g = c.getContext('2d');
  const r = rand(kind === 'silk' ? 7 : 11);
  g.fillStyle = '#808080';
  g.fillRect(0, 0, n, n);
  if (kind === 'silk') {
    for (let y = 0; y < n; y += 2) {
      g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.06})`;
      g.fillRect(0, y, n, 1);
    }
    for (let x = 0; x < n; x += 3) {
      g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.04})`;
      g.fillRect(x, 0, 1, n);
    }
  } else {
    // twill: diagonal ribs, then fuzz
    for (let k = -n; k < n; k += 6) {
      g.strokeStyle = 'rgba(255,255,255,0.10)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k + n, n);
      g.stroke();
    }
    for (let i = 0; i < 2600; i++) {
      const x = r() * n;
      const y = r() * n;
      const a = r() * Math.PI;
      const l = 2 + r() * 5;
      g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.08 + r() * 0.1})`;
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(kind === 'silk' ? 3 : 2, kind === 'silk' ? 6 : 4);
  return tex;
}

/**
 * A cloth draped over a rod lying along x (the rod's axis at the origin): over the top, down both sides with soft
 * folds, its hem resting on the table `drop` m below the axis. `len` along the rod, `width` across (hem to hem).
 */
export function drapeGeometry({ len, width, R, drop, seed = 1, nu = 26, nv = 44 }) {
  const r = rand(seed);
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28];
  const pos = [];
  const uv = [];
  const idx = [];
  const arc = (Math.PI / 2) * R; // over the top to each side
  const side = drop - 0.003; // straight down to just above the table
  const p = new THREE.Vector2();
  /** The cross-section at arc length v from the top (v ≥ 0 on the +z side): p = (y, z); returns how far it hangs (0…1). */
  function section(v, out) {
    const a = Math.abs(v);
    const sgn = Math.sign(v) || 1;
    if (a <= arc) {
      const phi = a / R;
      out.set(R * Math.cos(phi), sgn * R * Math.sin(phi));
      return 0;
    }
    const d = a - arc;
    if (d <= side) {
      // down the side, flaring out a little like a bell
      const k = d / side;
      out.set(-d, sgn * (R + 0.018 * k * k));
      return k;
    }
    // along the table
    out.set(-side - 0.001, sgn * (R + 0.018 + (d - side)));
    return 1;
  }
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const x = (i / nu - 0.5) * len;
      const xu = (2 * x) / len;
      // the hem is uneven: the cloth's width varies a little along its length
      const w = (width / 2) * (1 + 0.06 * Math.sin(xu * 2.1 + ph[0]) + 0.04 * Math.sin(xu * 5.3 + ph[1]));
      const v = (j / nv - 0.5) * 2 * w;
      const hang = section(v, p);
      let y = p.x;
      let z = p.y;
      // folds: ripples along the rod that grow as the cloth hangs, and a sag at the two free ends
      const fold = hang * (0.0075 * Math.sin(xu * 7.5 + ph[2] + v * 30) + 0.003 * Math.sin(xu * 13 + ph[3]));
      z += Math.sign(z || 1) * fold;
      y -= 0.003 * xu * xu * (1 - hang * 0.6);
      if (hang >= 1) y += 0.0004 * Math.sin(xu * 9 + v * 40);
      pos.push(x * (1 + 0.04 * hang * xu * xu), y, z);
      uv.push(i / nu, j / nv);
    }
  }
  const row = nu + 1;
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * row + i;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A rod along x: a cylinder with rounded (fire-polished) ends, 36 sides. */
function rodGeometry(r = ROD.r, half = ROD.half) {
  const pts = [];
  const cap = r * 0.55;
  pts.push(new THREE.Vector2(0, -half));
  for (let k = 1; k <= 5; k++) {
    const a = (k / 5) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - cap + cap * Math.sin(a), -half + cap - cap * Math.cos(a)));
  }
  for (let k = 0; k <= 5; k++) {
    const a = (k / 5) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - cap + cap * Math.cos(a), half - cap + cap * Math.sin(a)));
  }
  pts.push(new THREE.Vector2(0, half));
  const g = new THREE.LatheGeometry(pts, 36);
  g.rotateZ(-Math.PI / 2); // the lathe's y axis → x
  return g;
}

export function createBench() {
  const root = new THREE.Group();
  root.name = 'Bench';

  // ── the table: a rounded slab of light sand, its edge a shade darker ──
  const slab = new THREE.ExtrudeGeometry(roundedRect(TABLE.x0, TABLE.x1, -TABLE.z1, -TABLE.z0, TABLE.r), {
    depth: TABLE.th,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 8,
  });
  slab.rotateX(-Math.PI / 2); // the shape's y → −z, its depth → +y
  slab.translate(0, -TABLE.th - 0.004, 0);
  {
    const n = slab.attributes.normal;
    const c = new Float32Array(n.count * 3);
    const top = new THREE.Color('#ab9069');
    const edge = new THREE.Color('#7f6847');
    for (let i = 0; i < n.count; i++) {
      const col = n.getY(i) > 0.7 ? top : edge;
      c.set([col.r, col.g, col.b], i * 3);
    }
    slab.setAttribute('color', new THREE.BufferAttribute(c, 3));
  }
  const table = new THREE.Mesh(slab, new THREE.MeshStandardMaterial({ name: 'TableTop', vertexColors: true, roughness: 0.86, metalness: 0 }));
  table.name = 'Table';
  table.receiveShadow = true;
  table.userData.noExport = true;
  root.add(table);

  // ── wooden V-blocks under the two rubbing rods (one merged mesh) ──
  const vShape = new THREE.Shape();
  const bw = 0.036; // across (z)
  const bh = 0.034;
  const notch = AXIS_Y - ROD.r * 1.41; // the V's bottom: a rod of radius r touches both faces of a 90° V
  vShape.moveTo(-bw / 2, 0);
  vShape.lineTo(bw / 2, 0);
  vShape.lineTo(bw / 2, bh);
  vShape.lineTo(bw / 2 - 0.004, bh);
  vShape.lineTo(0, notch);
  vShape.lineTo(-bw / 2 + 0.004, bh);
  vShape.lineTo(-bw / 2, bh);
  vShape.closePath();
  const vBlock = new THREE.ExtrudeGeometry(vShape, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.0012, bevelSize: 0.0012, bevelSegments: 1 });
  vBlock.translate(0, 0, -0.009);
  vBlock.rotateY(Math.PI / 2); // the V across z, the block's depth along x
  const blocks = [];
  for (const st of [STATION.glass, STATION.plastic]) for (const bx of BLOCKS) blocks.push(vBlock.clone().translate(st.x + bx, 0, st.z));
  const wood = new THREE.MeshStandardMaterial({ name: 'Wood', color: '#9a6a3f', roughness: 0.7 });
  const blockMesh = new THREE.Mesh(merge(blocks), wood);
  blockMesh.name = 'VBlocks';
  blockMesh.castShadow = true;
  blockMesh.receiveShadow = true;
  root.add(blockMesh);

  // ── the rods ──
  const rodGeo = rodGeometry();
  const coreGeo = rodGeometry(ROD.r * 0.74, ROD.half - 0.0015);
  const glassMat = new THREE.MeshPhysicalMaterial({
    name: 'Glass',
    color: '#c4efe4',
    metalness: 0,
    roughness: 0.04,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.6,
    specularIntensity: 1,
  });
  // the faint green of soda glass, seen through its thickness (and at the ends)
  const glassCore = new THREE.MeshStandardMaterial({
    name: 'GlassTint',
    color: '#46c9ab',
    roughness: 0.2,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
  });
  // a dark edge round the glass (the back faces of a slightly fatter rod) and a long bright streak, as glass shows a window
  const glassEdge = new THREE.MeshBasicMaterial({ name: 'GlassEdge', color: '#0b3f3a', side: THREE.BackSide, fog: false });
  const streakMat = new THREE.MeshBasicMaterial({
    name: 'GlassStreak',
    color: '#ffffff',
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    fog: false,
  });
  const edgeGeo = rodGeometry(ROD.r + 0.0013, ROD.half + 0.0013);
  const streakGeo = new THREE.BoxGeometry(ROD.len - 0.04, 0.0009, 0.0026);
  streakGeo.translate(0, ROD.r * 0.86, ROD.r * 0.42);
  // the test's rod of unknown charge: a plain grey, so its colour says nothing
  const greyMat = new THREE.MeshStandardMaterial({ name: 'UnknownRod', color: '#aeb6bf', roughness: 0.45, metalness: 0.1 });
  const plasticMat = new THREE.MeshPhysicalMaterial({
    name: 'Plastic',
    color: '#c22f4d',
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
  });
  function makeRod(kind, name) {
    const g = new THREE.Group();
    g.name = name;
    if (kind === 'glass') {
      const core = new THREE.Mesh(coreGeo, glassCore);
      core.renderOrder = 1;
      const shell = new THREE.Mesh(rodGeo, glassMat);
      shell.renderOrder = 2;
      shell.castShadow = true;
      const edge = new THREE.Mesh(edgeGeo, glassEdge);
      edge.userData.noExport = true;
      const streak = new THREE.Mesh(streakGeo, streakMat);
      streak.renderOrder = 3;
      streak.userData.noExport = true;
      g.add(edge, core, shell, streak);
      g.userData.parts = { edge, core, streak };
    } else {
      const m = new THREE.Mesh(rodGeo, plasticMat);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    }
    g.userData.kind = kind;
    return g;
  }
  const rods = {
    glass: makeRod('glass', 'GlassRod'), // the one the student rubs; later held near a hanging rod
    plastic: makeRod('plastic', 'PlasticRod'),
    hangGlass: makeRod('glass', 'HangingGlassRod'),
    hangPlastic: makeRod('plastic', 'HangingPlasticRod'),
  };
  root.add(rods.glass, rods.plastic);

  // ── the cloths: silk (a pale gold, smooth, with a sheen) and flannel (a soft woollen pink, matt and fuzzy) ──
  const drop = AXIS_Y;
  const silkGeo = drapeGeometry({ len: CLOTH.len, width: CLOTH.width, R: ROD.r + 0.0012, drop, seed: 3 });
  const flannelGeo = drapeGeometry({ len: CLOTH.len, width: CLOTH.width * 0.95, R: ROD.r + 0.0024, drop, seed: 9 });
  const silkTex = clothTexture('silk');
  const flannelTex = clothTexture('flannel');
  const silkMat = new THREE.MeshPhysicalMaterial({
    name: 'Silk',
    color: '#d9b92e',
    roughness: 0.38,
    metalness: 0,
    sheen: 0.6,
    sheenColor: new THREE.Color('#fff1b0'),
    sheenRoughness: 0.35,
    bumpMap: silkTex,
    bumpScale: 0.15,
    side: THREE.DoubleSide,
  });
  const flannelMat = new THREE.MeshPhysicalMaterial({
    name: 'Flannel',
    color: '#b3566f',
    roughness: 0.95,
    metalness: 0,
    sheen: 0.6,
    sheenColor: new THREE.Color('#f2c4d2'),
    sheenRoughness: 0.8,
    bumpMap: flannelTex,
    bumpScale: 0.6,
    side: THREE.DoubleSide,
  });
  const silk = new THREE.Mesh(silkGeo, silkMat);
  silk.name = 'Silk';
  const flannel = new THREE.Mesh(flannelGeo, flannelMat);
  flannel.name = 'Flannel';
  for (const m of [silk, flannel]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  root.add(silk, flannel);

  // ── the two stands: a heavy painted base, a steel pillar, a boss and an arm; a silk thread down to the rod ──
  const paint = new THREE.MeshStandardMaterial({ name: 'StandPaint', color: '#33475e', roughness: 0.55, metalness: 0.2 });
  const steel = new THREE.MeshStandardMaterial({ name: 'StandSteel', color: '#c9ced4', roughness: 0.32, metalness: 0.9 });
  const threadMat = new THREE.MeshStandardMaterial({ name: 'SilkThread', color: '#f4efe2', roughness: 0.6 });
  const painted = [];
  const metal = [];
  const threads = [];
  const side = 0; // the pillar stands straight behind the hanging rod, clear of its swing (its ends turn 12.5 cm round)
  const back = STAND.back;
  for (const c of [STAND.A, STAND.B]) {
    const px = c.x + side;
    const pz = c.z - back;
    // a broad heavy base, longest toward the arm's side so the long arm cannot tip it
    const base = new THREE.ExtrudeGeometry(roundedRect(-0.085, 0.085, -0.075, 0.075, 0.014), {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
      curveSegments: 4,
    });
    base.rotateX(-Math.PI / 2);
    base.translate(px, 0.003, pz);
    painted.push(base);
    const boss = new THREE.BoxGeometry(0.022, 0.026, 0.022);
    boss.translate(px, STAND.arm, pz);
    painted.push(boss);
    const pillar = new THREE.CylinderGeometry(0.0055, 0.0055, 0.44, 20);
    pillar.translate(px, 0.22 + 0.01, pz);
    metal.push(pillar);
    // the arm from the boss to over the rod's middle: along −x, then a short bend forward to the knot's hook
    const armLen = Math.hypot(side, back) + 0.012;
    const arm = new THREE.CylinderGeometry(0.0042, 0.0042, armLen, 16);
    arm.rotateZ(Math.PI / 2);
    arm.rotateY(-Math.atan2(back, side));
    arm.translate((px + c.x) / 2, STAND.arm, (pz + c.z) / 2 + 0.006);
    metal.push(arm);
    const knob = new THREE.CylinderGeometry(0.004, 0.004, 0.018, 12);
    knob.rotateZ(Math.PI / 2);
    knob.translate(px + 0.018, STAND.arm, pz);
    metal.push(knob);
    // the thread, from under the arm's end down to the top of the rod
    const len = STAND.arm - 0.004 - (c.y + ROD.r);
    const th = new THREE.CylinderGeometry(0.002, 0.002, len, 8);
    th.translate(c.x, c.y + ROD.r + len / 2, c.z);
    threads.push(th);
  }
  const standMesh = new THREE.Mesh(merge(painted), paint);
  standMesh.name = 'StandBases';
  const metalMesh = new THREE.Mesh(merge(metal), steel);
  metalMesh.name = 'StandRods';
  const threadMesh = new THREE.Mesh(merge(threads), threadMat);
  threadMesh.name = 'SilkThreads';
  // a dark edge round the thread: the back faces of a fatter copy, so a thread reads on the blue and over the rods
  const threadGeo = threadMesh.geometry;
  const threadEdge = new THREE.Mesh(
    merge(
      [STAND.A, STAND.B].map((c) => {
        const len = STAND.arm - 0.004 - (c.y + ROD.r);
        return new THREE.CylinderGeometry(0.0032, 0.0032, len, 8).translate(c.x, c.y + ROD.r + len / 2, c.z);
      }),
    ),
    new THREE.MeshBasicMaterial({ name: 'ThreadEdge', color: '#10213a', side: THREE.BackSide, fog: false }),
  );
  threadEdge.name = 'SilkThreadEdges';
  threadEdge.userData.noExport = true;
  threadMesh.geometry = threadGeo;
  for (const m of [standMesh, metalMesh]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  root.add(standMesh, metalMesh, threadMesh, threadEdge);

  // the hanging rods turn about their thread: each in a group at the knot, with the knot's loop round the rod
  const loopGeo = new THREE.TorusGeometry(ROD.r + 0.0012, 0.0019, 6, 24);
  loopGeo.rotateY(Math.PI / 2); // the loop round the rod's x axis
  const hangers = {};
  for (const [id, c, rod] of [
    ['A', STAND.A, rods.hangGlass],
    ['B', STAND.B, rods.hangPlastic],
  ]) {
    const g = new THREE.Group();
    g.name = `Hanger${id}`;
    g.position.copy(c);
    rod.rotation.y = Math.PI; // its rubbed end (own +x) hangs at the left, toward the rod brought near
    const loop = new THREE.Mesh(loopGeo, threadMat);
    loop.name = 'Knot';
    g.add(rod, loop);
    root.add(g);
    hangers[id] = g;
  }

  /** Puts a rod on its V-blocks (its rubbed end to the right). */
  function onBlocks(rod, station) {
    rod.position.copy(STATION[station]);
    rod.quaternion.identity();
  }
  onBlocks(rods.glass, 'glass');
  onBlocks(rods.plastic, 'plastic');
  /** A cloth's middle at x along its rod (the rod's own x; 0 is its centre). */
  function placeCloth(which, x) {
    const st = which === 'silk' ? STATION.glass : STATION.plastic;
    const m = which === 'silk' ? silk : flannel;
    m.position.set(st.x + x, st.y, st.z);
  }
  placeCloth('silk', CLOTH.rest);
  placeCloth('flannel', CLOTH.rest);

  /** The test's unknown rod: both hanging rods a plain grey, or back to glass and plastic. */
  const grey = (on) => {
    const parts = rods.hangGlass.userData.parts;
    parts.core.visible = !on;
    parts.edge.visible = !on;
    parts.streak.visible = !on;
    for (const m of [...rods.hangGlass.children, ...rods.hangPlastic.children])
      if (m.material === glassMat || m.material === plasticMat || m.material === greyMat)
        m.material = on ? greyMat : m.parent === rods.hangGlass ? glassMat : plasticMat;
  };
  return {
    root,
    rods,
    cloths: { silk, flannel },
    hangers,
    table,
    /** What belongs to the rubbing places: hidden while the camera is at the stands. */
    stations: [blockMesh, silk, flannel, table],
    /** What belongs to the stands: hidden while the camera is at the rubbing places. */
    stands: [standMesh, metalMesh, threadMesh, threadEdge, hangers.A, hangers.B],
    grey,
    onBlocks,
    placeCloth,
    materials: { glassMat, plasticMat, silkMat, flannelMat },
  };
}
