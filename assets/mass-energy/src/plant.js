// The scenery (procedural three.js, nothing loaded): the reactor pool behind the nuclei, and a nuclear power plant
// (নিউক্লিয়ার শক্তিকেন্দ্র) on a river bank at dusk, cut open to show the book's chain from heat to electricity:
// the reactor's core glows blue in its water, steam runs to the turbine, the turbine turns the generator, and the
// power runs along the lines to a town whose windows light up. Units: metres, roughly to scale with each other.
import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function tex(c, { repeat = null } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/**
 * The water of the reactor pool, behind the nuclei: bright at the top, deeper blue below, the fuel assemblies at
 * the bottom giving off their blue glow, light rippling down from the surface.
 */
export function poolBackground() {
  const W = 1024;
  const H = 1024;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(3);
  const lg = g.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, '#f2fbff');
  lg.addColorStop(0.35, '#bfe9f8');
  lg.addColorStop(0.72, '#6cc4ea');
  lg.addColorStop(1, '#2d8fcb');
  g.fillStyle = lg;
  g.fillRect(0, 0, W, H);
  // light rays from the surface
  for (let i = 0; i < 14; i++) {
    const x = r() * W;
    const w = 30 + r() * 90;
    const ray = g.createLinearGradient(0, 0, 0, H * 0.9);
    ray.addColorStop(0, 'rgba(255,255,255,0.32)');
    ray.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = ray;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + w, 0);
    g.lineTo(x + w * 2.2 + 120, H * 0.9);
    g.lineTo(x + 120, H * 0.9);
    g.closePath();
    g.fill();
  }
  // ripples of light near the surface
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.lineWidth = 2;
  for (let i = 0; i < 70; i++) {
    const x = r() * W;
    const y = r() * H * 0.28;
    const s = 10 + r() * 34;
    g.beginPath();
    g.ellipse(x, y, s, s * 0.35, r() * 0.4, 0, Math.PI * 2);
    g.stroke();
  }
  // the fuel assemblies at the bottom, rows of rods glowing blue (Cherenkov light)
  const base = H * 0.8;
  for (let i = 0; i < 9; i++) {
    const x0 = 40 + i * 112 + r() * 10;
    const glow = g.createRadialGradient(x0 + 40, base + 30, 4, x0 + 40, base + 30, 120);
    glow.addColorStop(0, 'rgba(150,235,255,0.75)');
    glow.addColorStop(1, 'rgba(90,190,255,0)');
    g.fillStyle = glow;
    g.fillRect(x0 - 90, base - 100, 260, 260);
    for (let k = 0; k < 7; k++) {
      const x = x0 + k * 12;
      const rod = g.createLinearGradient(0, base - 10, 0, H);
      rod.addColorStop(0, 'rgba(225,250,255,0.9)');
      rod.addColorStop(1, 'rgba(120,200,240,0.4)');
      g.fillStyle = rod;
      g.fillRect(x, base - 10 + (k % 2) * 6, 6, H);
    }
    g.fillStyle = 'rgba(40,90,130,0.55)';
    g.fillRect(x0 - 4, base - 22, 92, 10);
  }
  // a soft vignette, so the middle (where the nuclei are) stays the brightest
  const v = g.createRadialGradient(W / 2, H * 0.45, W * 0.2, W / 2, H * 0.45, W * 0.75);
  v.addColorStop(0, 'rgba(255,255,255,0.28)');
  v.addColorStop(1, 'rgba(0,40,80,0.12)');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  return tex(c);
}

/** A dusk sky: deep blue overhead, violet, then pink and orange at the horizon (the horizon is at v = 0.38). */
export function duskBackground() {
  const W = 512;
  const H = 1024;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, '#3a5bb0');
  lg.addColorStop(0.3, '#7a78c8');
  lg.addColorStop(0.5, '#e98fae');
  lg.addColorStop(0.62, '#ffb878');
  lg.addColorStop(0.7, '#ffd59a');
  lg.addColorStop(1, '#ffe2b3');
  g.fillStyle = lg;
  g.fillRect(0, 0, W, H);
  const r = rng(9);
  // thin clouds lit from below
  for (let i = 0; i < 16; i++) {
    const y = H * (0.18 + r() * 0.36);
    const x = r() * W;
    const w = 90 + r() * 200;
    const cg = g.createLinearGradient(0, y - 6, 0, y + 8);
    cg.addColorStop(0, 'rgba(255,214,200,0)');
    cg.addColorStop(0.5, `rgba(255,${190 + Math.round(r() * 40)},${170 + Math.round(r() * 40)},0.55)`);
    cg.addColorStop(1, 'rgba(255,200,180,0)');
    g.fillStyle = cg;
    g.beginPath();
    g.ellipse(x, y, w, 7 + r() * 6, 0, 0, Math.PI * 2);
    g.fill();
  }
  return tex(c);
}

// ── materials ─────────────────────────────────────────────────────────────────────────────────────────────────
/** Ripe golden paddy at harvest: plots in amber and mustard shades, a few cut and ploughed, on earth bunds. */
function fieldTexture() {
  const S = 512;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const r = rng(21);
  g.fillStyle = '#9a6a3c'; // the bunds between plots
  g.fillRect(0, 0, S, S);
  const shades = ['#e8b23a', '#f0c24a', '#dba032', '#f3cf5e', '#e6a92e', '#d89a2a'];
  const N = 4;
  const cell = S / N;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const ploughed = r() < 0.14;
      const x = i * cell + 3;
      const y = j * cell + 3;
      const w = cell - 6;
      const h = cell - 6;
      g.fillStyle = ploughed ? '#b9814e' : shades[Math.floor(r() * shades.length)];
      g.fillRect(x, y, w, h);
      // rows of stalks (or furrows) across the plot
      const across = r() < 0.5;
      g.strokeStyle = ploughed ? 'rgba(120,70,35,0.35)' : 'rgba(170,110,20,0.28)';
      g.lineWidth = 2;
      for (let k = 6; k < (across ? h : w); k += 7) {
        g.beginPath();
        if (across) {
          g.moveTo(x, y + k);
          g.lineTo(x + w, y + k);
        } else {
          g.moveTo(x + k, y);
          g.lineTo(x + k, y + h);
        }
        g.stroke();
      }
    }
  }
  for (let i = 0; i < 7000; i++) {
    const v = Math.round(r() * 50);
    g.fillStyle = `rgba(${200 + v},${140 + v},${40 + v / 2},0.22)`;
    g.fillRect(r() * S, r() * S, 2, 2);
  }
  return tex(c, { repeat: [10, 10] });
}
function waterTexture() {
  const W = 512;
  const H = 128;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, '#5d8fd0');
  lg.addColorStop(1, '#3b74bd');
  g.fillStyle = lg;
  g.fillRect(0, 0, W, H);
  const r = rng(4);
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = r() < 0.5 ? 'rgba(255,200,190,0.45)' : 'rgba(255,255,255,0.35)';
    g.lineWidth = 1.5;
    const x = r() * W;
    const y = r() * H;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 8 + r() * 26, y);
    g.stroke();
  }
  return tex(c, { repeat: [6, 2] });
}
function concreteTexture(base = '#e8e2d6') {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  const r = rng(13);
  for (let i = 0; i < 3000; i++) {
    const v = Math.round(r() * 30);
    g.fillStyle = `rgba(${120 + v},${110 + v},${100 + v},0.12)`;
    g.fillRect(r() * S, r() * S, 2, 2);
  }
  g.strokeStyle = 'rgba(120,110,100,0.25)';
  g.lineWidth = 2;
  for (let y = 0; y < S; y += 64) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(S, y);
    g.stroke();
  }
  return tex(c, { repeat: [4, 2] });
}
/** A facade with rows of windows; `lit` draws only the window lights (for the emissive map). */
function facadeTexture(wall, seed, lit = false) {
  const W = 128;
  const H = 256;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(seed);
  g.fillStyle = lit ? '#000000' : wall;
  g.fillRect(0, 0, W, H);
  for (let y = 14; y < H - 10; y += 30)
    for (let x = 12; x < W - 14; x += 26) {
      if (lit) {
        if (r() < 0.82) {
          g.fillStyle = r() < 0.7 ? '#ffd27a' : '#fff1c4';
          g.fillRect(x, y, 14, 17);
        }
      } else {
        g.fillStyle = '#3a4a5c';
        g.fillRect(x, y, 14, 17);
        g.fillStyle = 'rgba(255,255,255,0.25)';
        g.fillRect(x, y, 14, 4);
      }
    }
  return tex(c);
}

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...extra });

// ── pieces ────────────────────────────────────────────────────────────────────────────────────────────────────
/** A cylindrical wall (two shells, a top rim and the cut faces) with a wedge open toward the viewer. */
function cutCylinder({ r, h, wall, open, at, material, inner }) {
  const g = new THREE.Group();
  const start = at + open / 2;
  const len = Math.PI * 2 - open;
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, true, start, len), material);
  const innerM = new THREE.Mesh(new THREE.CylinderGeometry(r - wall, r - wall, h, 64, 1, true, start, len), inner);
  innerM.material.side = THREE.BackSide;
  outer.position.y = innerM.position.y = h / 2;
  const rim = new THREE.Mesh(new THREE.RingGeometry(r - wall, r, 64, 1, 0, len), material);
  rim.rotation.x = -Math.PI / 2;
  // RingGeometry's angle runs from +x toward +y; turned flat it runs from +x toward −z: start it at `start`
  rim.rotation.z = start - Math.PI / 2;
  rim.position.y = h;
  g.add(outer, innerM, rim);
  for (const a of [start, start + len]) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(wall, h), mat('#cfc6b6', { side: THREE.DoubleSide }));
    face.position.set(Math.sin(a) * (r - wall / 2), h / 2, Math.cos(a) * (r - wall / 2));
    face.rotation.y = a + Math.PI / 2;
    g.add(face);
  }
  return g;
}

/** A lattice pylon (simplified): four leaning legs, braces and three cross-arms. Returns it and the arm tips. */
function pylon(h) {
  const g = new THREE.Group();
  const steel = mat('#8b939c', { metalness: 0.5, roughness: 0.45 });
  const base = h * 0.16;
  const top = h * 0.04;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const a = new THREE.Vector3(sx * base, 0, sz * base);
      const b = new THREE.Vector3(sx * top, h, sz * top);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, a.distanceTo(b), 6), steel);
      leg.position.copy(a).add(b).multiplyScalar(0.5);
      leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      g.add(leg);
    }
  for (let k = 1; k < 6; k++) {
    const y = (k / 6) * h;
    const w = base + (top - base) * (k / 6);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(w * 2, 0.09, 0.09), steel);
    brace.position.y = y;
    const brace2 = brace.clone();
    brace2.rotation.y = Math.PI / 2;
    g.add(brace, brace2);
  }
  const tips = [];
  for (const [y, w] of [
    [h * 0.72, h * 0.3],
    [h * 0.86, h * 0.24],
    [h * 0.98, h * 0.16],
  ]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, w * 2), steel);
    arm.position.y = y;
    g.add(arm);
    tips.push(new THREE.Vector3(0, y - 0.25, -w), new THREE.Vector3(0, y - 0.25, w));
  }
  return { root: g, tips: tips.slice(0, 3) };
}

function tree(r, kind = 'round') {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * r, 0.18 * r, 1.6 * r, 6), mat('#7a5232'));
  trunk.position.y = 0.8 * r;
  g.add(trunk);
  if (kind === 'palm') {
    trunk.scale.y = 2.6;
    trunk.position.y = 2.1 * r;
    const leaf = mat('#3f8f3a', { side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.35 * r, 2.4 * r, 4, 1, true), leaf);
      f.scale.z = 0.25;
      const a = (i / 7) * Math.PI * 2;
      f.position.set(Math.cos(a) * 0.9 * r, 4.1 * r, Math.sin(a) * 0.9 * r);
      f.rotation.set(Math.sin(a) * 1.9, 0, -Math.cos(a) * 1.9);
      g.add(f);
    }
    return g;
  }
  const shades = ['#4c9a3c', '#3f8a35', '#5aa846', '#6bb44a'];
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 * r, 0), mat(shades[Math.floor(r * 7) % shades.length], { flatShading: true }));
  crown.position.y = 2.3 * r;
  crown.scale.y = 0.9;
  g.add(crown);
  return g;
}

/**
 * The power plant. Returns { root, set(power, dt), anchors: { core, steam, turbine, generator, lines, town }, box }.
 * power: 0 (off) … 1 (running): the control rods rise, the core glows, steam runs, the turbine spins, the town lights.
 */
export function createPlant() {
  const root = new THREE.Group();
  root.name = 'PowerPlant';
  const r = rng(31);

  // ground, river, the plant's concrete yard and a road
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ map: fieldTexture(), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 26),
    new THREE.MeshStandardMaterial({ map: waterTexture(), roughness: 0.25, metalness: 0.1, emissive: '#5a3a5a', emissiveIntensity: 0.25 }),
  );
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.03, 34);
  const bank = new THREE.Mesh(new THREE.PlaneGeometry(700, 4), mat('#d9c08c'));
  bank.rotation.x = -Math.PI / 2;
  bank.position.set(0, 0.02, 19.5);
  root.add(river, bank);
  const yard = new THREE.Mesh(
    new THREE.BoxGeometry(62, 0.3, 34),
    new THREE.MeshStandardMaterial({ map: concreteTexture('#cfcac0'), roughness: 0.9 }),
  );
  yard.position.set(2, 0.15, -6);
  yard.receiveShadow = true;
  root.add(yard);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 120), mat('#5d6168'));
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = 0.5;
  road.position.set(30, 0.05, -30);
  root.add(road);

  // ── the reactor building, cut open toward the viewer ───────────────────────────────────────────────────────
  const RX = -15;
  const RZ = -2;
  const OPEN = THREE.MathUtils.degToRad(115);
  const AT = THREE.MathUtils.degToRad(28); // the open wedge faces the camera's side (from +z toward +x)
  const concrete = new THREE.MeshStandardMaterial({ map: concreteTexture(), roughness: 0.8 });
  const reactor = new THREE.Group();
  reactor.position.set(RX, 0.3, RZ);
  root.add(reactor);
  const RR = 8;
  const RH = 13;
  reactor.add(cutCylinder({ r: RR, h: RH, wall: 0.7, open: OPEN, at: AT, material: concrete, inner: mat('#bdb4a4') }));
  const domeStart = AT + OPEN / 2 + Math.PI / 2;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(RR, 48, 16, domeStart, Math.PI * 2 - OPEN, 0, Math.PI / 2), concrete);
  dome.position.y = RH;
  const domeIn = new THREE.Mesh(
    new THREE.SphereGeometry(RR - 0.7, 48, 16, domeStart, Math.PI * 2 - OPEN, 0, Math.PI / 2),
    mat('#bdb4a4', { side: THREE.BackSide }),
  );
  domeIn.position.y = RH;
  reactor.add(dome, domeIn);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(RR - 0.7, 48), mat('#9aa0a6'));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  reactor.add(floor);
  // the reactor vessel (steel, cut open too), its glowing core of fuel rods in water, the control rods above
  const steel = new THREE.MeshStandardMaterial({ color: '#aeb6bf', metalness: 0.75, roughness: 0.32 });
  const vessel = cutCylinder({ r: 2.4, h: 7.2, wall: 0.3, open: OPEN * 1.1, at: AT, material: steel, inner: mat('#6f7a86') });
  vessel.position.set(0, 0.6, 0.6);
  reactor.add(vessel);
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.08, 2.08, 5.6, 32),
    new THREE.MeshStandardMaterial({
      color: '#8fe1ff',
      transparent: true,
      opacity: 0.32,
      emissive: '#2fb8ff',
      emissiveIntensity: 0.25,
      depthWrite: false,
    }),
  );
  water.position.set(0, 3.6, 0.6);
  reactor.add(water);
  const rodGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.4, 8);
  const coreMat = new THREE.MeshStandardMaterial({ color: '#d8f4ff', emissive: '#38c6ff', emissiveIntensity: 0.6, roughness: 0.4 });
  const spots = [];
  for (let x = -1.6; x <= 1.6; x += 0.36) for (let z = -1.6; z <= 1.6; z += 0.36) if (x * x + z * z < 1.8 * 1.8) spots.push([x, z]);
  const core = new THREE.InstancedMesh(rodGeo, coreMat, spots.length);
  core.name = 'ReactorCore';
  const m4 = new THREE.Matrix4();
  for (const [i, [x, z]] of spots.entries()) core.setMatrixAt(i, m4.makeTranslation(x, 2.9, z + 0.6));
  reactor.add(core);
  const coreLight = new THREE.PointLight('#5fd0ff', 0, 14, 1.6);
  coreLight.position.set(0, 3.5, 2.2);
  reactor.add(coreLight);
  const coreGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex('rgba(200,245,255,1)', 'rgba(60,190,255,0.6)'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  coreGlow.position.set(0, 3, 1.6);
  coreGlow.scale.setScalar(7);
  coreGlow.userData.noExport = true;
  reactor.add(coreGlow);
  const ctrl = new THREE.Group();
  const ctrlMat = mat('#30363d', { metalness: 0.4, roughness: 0.5 });
  for (const [x, z] of [
    [-0.9, -0.9],
    [0.9, -0.9],
    [-0.9, 0.9],
    [0.9, 0.9],
    [0, 0],
  ]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 4, 8), ctrlMat);
    rod.position.set(x, 0, z + 0.6);
    ctrl.add(rod);
  }
  ctrl.position.y = 4.3;
  reactor.add(ctrl);
  const head = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2), steel);
  head.position.set(0, 7.8, 0.6);
  head.scale.y = 0.5;
  // (the head sits above the cut vessel; drawn as a lid you can see under)
  reactor.add(head);
  // the steam generator beside it, with the hot (red) and cool (blue) water pipes
  const sg = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 6.2, 8, 24), steel);
  sg.position.set(-4.2, 4.6, -1.8);
  reactor.add(sg);
  const tube = (pts, color, radius) =>
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 40, radius, 10),
      mat(color, { roughness: 0.4, metalness: 0.2 }),
    );
  reactor.add(
    tube(
      [
        [-1.6, 5.6, 0.2],
        [-2.7, 6.2, -0.8],
        [-3.6, 6.4, -1.6],
      ],
      '#d9480f',
      0.32,
    ),
  );
  reactor.add(
    tube(
      [
        [-3.6, 2.2, -1.6],
        [-2.6, 1.6, -0.8],
        [-1.7, 1.9, 0.2],
      ],
      '#1c7ed6',
      0.32,
    ),
  );

  // ── steam line: from the steam generator, out through the wall, into the turbine hall ─────────────────────
  const steamPts = [
    new THREE.Vector3(RX - 4.2, 9.2, RZ - 1.8),
    new THREE.Vector3(RX - 1, 11.2, RZ - 3.5),
    new THREE.Vector3(RX + 7, 11, RZ - 3.4),
    new THREE.Vector3(-1, 8.6, -3.2),
    new THREE.Vector3(3.2, 5.6, -2.4),
  ];
  const steamCurve = new THREE.CatmullRomCurve3(steamPts);
  const steamPipe = new THREE.Mesh(
    new THREE.TubeGeometry(steamCurve, 80, 0.55, 14),
    new THREE.MeshStandardMaterial({ color: '#f1f3f5', transparent: true, opacity: 0.5, roughness: 0.2, depthWrite: false }),
  );
  steamPipe.name = 'SteamLine';
  root.add(steamPipe);
  const puffs = [];
  const puffMat = new THREE.SpriteMaterial({ map: glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,0.7)'), transparent: true, depthWrite: false });
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(puffMat.clone());
    s.userData.noExport = true;
    s.scale.setScalar(1.2);
    puffs.push(s);
    root.add(s);
  }

  // ── turbine hall: back wall, ends and half a roof; the turbine and generator on their bed ──────────────────
  const hall = new THREE.Group();
  hall.position.set(10, 0.3, -4);
  root.add(hall);
  const clad = new THREE.MeshStandardMaterial({ map: facadeTexture('#6f93b8', 2), roughness: 0.7 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 0.4), clad);
  back.position.set(0, 5, -4.5);
  const endL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 9), mat('#7fa1c4'));
  endL.position.set(-11, 5, 0);
  const endR = endL.clone();
  endR.position.x = 11;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.4, 4.6), mat('#5c6f84'));
  roof.position.set(0, 10.1, -2.4);
  const hallFloor = new THREE.Mesh(new THREE.BoxGeometry(22, 0.2, 9), mat('#a3a9b0'));
  hallFloor.position.y = 0.1;
  hall.add(back, endL, endR, roof, hallFloor);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(17, 1.6, 3), mat('#8d949c'));
  bed.position.set(0.5, 0.9, 0);
  hall.add(bed);
  // the turbine: three stages of blades on one shaft, half-cased, turning together
  const rotor = new THREE.Group();
  rotor.position.set(-4.5, 3.6, 0);
  hall.add(rotor);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 17, 12), steel);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = 5;
  rotor.add(shaft);
  const bladeMat = new THREE.MeshStandardMaterial({ color: '#d5dbe1', metalness: 0.8, roughness: 0.28 });
  const stages = [
    [-2.6, 1.1, 14],
    [0, 1.5, 18],
    [2.8, 1.9, 22],
  ];
  for (const [x, rad, n] of stages) {
    const disc = new THREE.Group();
    disc.position.x = x;
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, rad, 0.08), bladeMat);
      b.position.y = rad / 2 + 0.25;
      b.rotation.y = 0.5;
      const arm = new THREE.Group();
      arm.rotation.x = (i / n) * Math.PI * 2;
      arm.add(b);
      disc.add(arm);
    }
    rotor.add(disc);
    const casing = new THREE.Mesh(
      new THREE.CylinderGeometry(rad + 0.55, rad + 0.55, 2.2, 32, 1, true, Math.PI, Math.PI),
      mat('#4f6d8a', { side: THREE.DoubleSide, metalness: 0.3, roughness: 0.5 }),
    );
    casing.rotation.z = Math.PI / 2;
    casing.position.set(-4.5 + x, 3.6, 0);
    hall.add(casing);
  }
  // the generator: a big green drum on the same shaft, its stripes turning
  const genTex = (() => {
    const c = canvas(256, 64);
    const g = c.getContext('2d');
    g.fillStyle = '#2b8a3e';
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#237032';
    for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 12, 64);
    return tex(c);
  })();
  const generator = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 1.9, 4.4, 32),
    new THREE.MeshStandardMaterial({ map: genTex, roughness: 0.45, metalness: 0.2 }),
  );
  generator.rotation.z = Math.PI / 2;
  generator.position.set(6.6, 3.6, 0);
  hall.add(generator);
  const genEnd = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.3, 32), mat('#1f6b30'));
  genEnd.rotation.z = Math.PI / 2;
  genEnd.position.set(8.9, 3.6, 0);
  hall.add(genEnd);
  // the transformer outside and its wire to the first pylon
  const trafo = new THREE.Group();
  trafo.position.set(25, 0.3, -2);
  const tbox = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 2.2), mat('#7d8790'));
  tbox.position.y = 1.3;
  trafo.add(tbox);
  for (let i = 0; i < 3; i++) {
    const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.4, 8), mat('#b5651d'));
    ins.position.set(-0.9 + i * 0.9, 3.2, 0);
    trafo.add(ins);
  }
  root.add(trafo);

  // ── the cooling tower behind, its plume of vapour ─────────────────────────────────────────────────────────
  const towerPts = [];
  for (let i = 0; i <= 20; i++) {
    const y = (i / 20) * 26;
    const k = (y - 18) / 18;
    towerPts.push(new THREE.Vector2(5.4 + 4.2 * k * k * (y < 18 ? 1 : 0.35), y));
  }
  const tower = new THREE.Mesh(
    new THREE.LatheGeometry(towerPts, 48),
    new THREE.MeshStandardMaterial({ map: concreteTexture('#e3ddd2'), roughness: 0.85, side: THREE.DoubleSide }),
  );
  tower.position.set(-3, 0.3, -30);
  root.add(tower);
  const plume = [];
  const plumeMat = new THREE.SpriteMaterial({
    map: glowTex('rgba(255,250,248,0.95)', 'rgba(255,236,232,0.6)'),
    transparent: true,
    depthWrite: false,
  });
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Sprite(plumeMat.clone());
    s.userData.noExport = true;
    plume.push(s);
    root.add(s);
  }

  // ── power lines to the town ──────────────────────────────────────────────────────────────────────────────
  const pylonAt = [new THREE.Vector3(27, 0, -15), new THREE.Vector3(25, 0, -30), new THREE.Vector3(22, 0, -45)];
  const tipsAll = [];
  for (const p of pylonAt) {
    const py = pylon(13);
    py.root.position.copy(p);
    py.root.rotation.y = Math.atan2(1, -0.15); // the arms across the line, which runs back toward the town
    root.add(py.root);
    py.root.updateMatrixWorld(true);
    tipsAll.push(py.tips.map((tp) => tp.clone().applyMatrix4(py.root.matrixWorld)));
  }
  const wireMat = new THREE.MeshBasicMaterial({ color: '#2f343a' });
  const cables = [];
  const trafoTop = [-0.9, 0, 0.9].map((dx) => new THREE.Vector3(25 + dx, 3.9, -2));
  const chain = [trafoTop, ...tipsAll];
  for (let w = 0; w < 3; w++)
    for (let s = 0; s < chain.length - 1; s++) {
      const a = chain[s][w];
      const b = chain[s + 1][w];
      const mid = a.clone().lerp(b, 0.5);
      mid.y -= a.distanceTo(b) * 0.06;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.05, 5), wireMat);
      root.add(cable);
      cables.push(curve);
    }
  const sparkMat = new THREE.SpriteMaterial({
    map: glowTex('rgba(255,255,230,1)', 'rgba(255,214,90,0.9)'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparks = cables.map(() => {
    const s = new THREE.Sprite(sparkMat.clone());
    s.userData.noExport = true;
    s.scale.setScalar(1.6);
    root.add(s);
    return s;
  });

  // ── the town: colourful houses and flats; their windows light up when the power comes ────────────────────
  const town = new THREE.Group();
  town.position.set(20, 0, -66);
  root.add(town);
  const walls = ['#f3c5c5', '#f6e3a1', '#a8dadc', '#f1f3f5', '#ffd8a8', '#c3e6cb', '#d0bfff', '#ffc9de'];
  const windows = [];
  for (let i = 0; i < 18; i++) {
    const w = 3 + r() * 3;
    const d = 3 + r() * 3;
    const h = 4 + r() * (i % 4 === 0 ? 12 : 6);
    const wall = walls[i % walls.length];
    const m = new THREE.MeshStandardMaterial({
      map: facadeTexture(wall, 40 + i),
      emissiveMap: facadeTexture(wall, 40 + i, true),
      emissive: '#ffffff',
      emissiveIntensity: 0,
      roughness: 0.8,
    });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    const col = i % 6;
    const row = Math.floor(i / 6);
    b.position.set(col * 7.5 - 18 + r() * 2, h / 2, row * 9 - 9 + r() * 2);
    const roofTop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.4, d + 0.3), mat('#8f5b4a'));
    roofTop.position.set(b.position.x, h + 0.2, b.position.z);
    town.add(b, roofTop);
    windows.push({ m, at: 0.55 + 0.4 * (Math.abs(col - 2.5) / 2.5) * 0.6 + r() * 0.15 });
  }
  const lamps = [];
  for (let i = 0; i < 8; i++) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 6), mat('#4a4f55'));
    pole.position.set(-20 + i * 6, 1.7, 14);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 8),
      new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: '#ffc94d', emissiveIntensity: 0 }),
    );
    bulb.position.set(-20 + i * 6, 3.5, 14);
    town.add(pole, bulb);
    lamps.push(bulb.material);
  }

  // ── trees along the bank and round the yard; hills far off ───────────────────────────────────────────────────
  for (let i = 0; i < 46; i++) {
    const palm = i % 3 === 0;
    const t = tree(0.8 + r() * 0.7, palm ? 'palm' : 'round');
    let x;
    let z;
    if (i < 22) {
      x = -70 + i * 6.6 + r() * 3;
      z = 18 + r() * 3;
    } else {
      x = -60 + r() * 140;
      z = -20 - r() * 70;
      if (x > -26 && x < 30 && z > -40) z -= 30;
      if (x > -6 && x < 46 && z < -50) x -= 56; // not in the town
    }
    t.position.set(x, 0, z);
    t.rotation.y = r() * 6;
    root.add(t);
  }
  const hillMat = mat('#8a7fb8', { flatShading: true }); // far hills go violet in the dusk haze
  for (let i = 0; i < 9; i++) {
    const h = new THREE.Mesh(new THREE.IcosahedronGeometry(30 + r() * 30, 1), hillMat);
    h.scale.y = 0.35;
    h.position.set(-160 + i * 45, -4, -150 - r() * 40);
    root.add(h);
  }

  // ── running it ────────────────────────────────────────────────────────────────────────────────────────────
  let spin = 0;
  let clock = 0;
  const tmpV = new THREE.Vector3();
  const smooth = (a, b, x) => {
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  /** power 0…1; dt: seconds since the last call (the turbine and the steam move on). */
  function set(power, dt = 0) {
    clock += dt;
    const k = power;
    ctrl.position.y = 4.3 + 2.4 * smooth(0, 0.4, k);
    coreMat.emissiveIntensity = 0.5 + 2.2 * smooth(0.05, 0.5, k);
    coreLight.intensity = 60 * smooth(0.05, 0.5, k);
    coreGlow.material.opacity = 0.25 + 0.75 * smooth(0.05, 0.5, k);
    const steam = smooth(0.25, 0.6, k);
    for (const [i, s] of puffs.entries()) {
      const u = (i / puffs.length + clock * 0.22) % 1;
      steamCurve.getPointAt(u, s.position);
      s.material.opacity = steam * 0.85 * Math.sin(Math.PI * Math.min(1, u * 1.15));
      s.visible = steam > 0.01;
    }
    spin += dt * 9 * smooth(0.35, 0.8, k);
    rotor.rotation.x = spin;
    generator.rotation.x = spin;
    const elec = smooth(0.6, 0.85, k);
    for (const [i, s] of sparks.entries()) {
      const u = (clock * 0.45 + i * 0.137) % 1;
      cables[i].getPoint(u, s.position);
      s.visible = elec > 0.01;
      s.material.opacity = elec;
    }
    for (const w of windows) w.m.emissiveIntensity = 1.1 * smooth(w.at, w.at + 0.12, k);
    for (const l of lamps) l.emissiveIntensity = 2 * smooth(0.7, 0.85, k);
    // the cooling tower's vapour: always a little, a full plume when running
    const vap = 0.3 + 0.7 * smooth(0.3, 0.8, k);
    for (const [i, s] of plume.entries()) {
      const u = (i / plume.length + clock * 0.06) % 1;
      s.position.set(-3 + Math.sin(i * 1.7) * 1.5 + u * 9, 26.5 + u * 16, -30 + Math.cos(i) * 1.5);
      s.scale.setScalar(7 + u * 14);
      s.material.opacity = vap * 0.7 * Math.sin(Math.PI * u);
    }
  }
  set(0, 0);

  const anchor = (obj, local) => () => obj.localToWorld(tmpV.copy(local));
  return {
    root,
    set,
    anchors: {
      core: anchor(reactor, new THREE.Vector3(0, 3.2, 1.6)),
      reactor: anchor(reactor, new THREE.Vector3(0, RH + RR * 0.7, 0)),
      steam: () => steamCurve.getPointAt(0.55, tmpV),
      turbine: anchor(hall, new THREE.Vector3(-4.5, 5.4, 0)),
      generator: anchor(hall, new THREE.Vector3(6.6, 5.5, 0)),
      lines: () => tmpV.copy(tipsAll[0][2]),
      town: anchor(town, new THREE.Vector3(-6, 10, 0)),
    },
    /** What the camera frames: the reactor, the hall, the tower's top and the first pylon. */
    box: new THREE.Box3(new THREE.Vector3(-24, 0, -32), new THREE.Vector3(32, 29, 6)),
  };
}

function glowTex(inner, outer) {
  const S = 128;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.35, outer);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);
  return tex(c);
}
