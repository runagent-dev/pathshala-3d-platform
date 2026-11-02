// The apparatus: two vessels of liquid on a lab bench in front of a tiled wall, one thing different about the second
// (a fan, a wide plate instead of a glass, a volatile liquid, a bell jar with the air pumped out, a warm plate, dry
// instead of humid air). The liquid's depth follows reading.js; vapour rises from each vessel in proportion to how
// fast it is evaporating. Units: centimetres, the bench top is y = 0, the vessels stand at x = ∓9 on z = 0. The
// whole set can be mirrored (swap) so the changed vessel is on either side.
import * as THREE from 'three';
import { CASES, depth, radiusOf, vapour } from './reading.js';

export const SIDE = 9; // distance of each vessel from the middle
export const WALL_Z = -10.5;

function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvasTexture(w, h, draw, { repeat = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });
const lathe = (pts, seg = 32) =>
  new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(r, y)),
    seg,
  );
const glassMat = (opacity = 0.26) =>
  new THREE.MeshStandardMaterial({
    color: 0xe3f2fa,
    transparent: true,
    opacity,
    roughness: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.8,
  });

function benchTexture() {
  return canvasTexture(
    512,
    256,
    (g, w, h) => {
      g.fillStyle = '#c9985f';
      g.fillRect(0, 0, w, h);
      const r = rng(3);
      for (let i = 0; i < 90; i++) {
        const y = r() * h;
        g.strokeStyle = `rgba(${r() < 0.5 ? '120,70,30' : '235,200,150'},${0.1 + r() * 0.18})`;
        g.lineWidth = 1 + r() * 2.2;
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 8, w * 0.7, y + (r() - 0.5) * 8, w, y + (r() - 0.5) * 6);
        g.stroke();
      }
      g.fillStyle = 'rgba(90,50,20,0.28)';
      for (let y = 0; y < h; y += 64) g.fillRect(0, y, w, 2);
    },
    { repeat: [5, 3] },
  );
}

function wallTexture() {
  return canvasTexture(
    512,
    512,
    (g, w, h) => {
      const r = rng(9);
      const n = 4;
      const s = w / n;
      g.fillStyle = '#a9c1cf';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const k = r();
          g.fillStyle = `rgb(${Math.round(104 + k * 14)},${Math.round(140 + k * 14)},${Math.round(165 + k * 12)})`;
          g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
          const gl = g.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
          gl.addColorStop(0, 'rgba(255,255,255,0.16)');
          gl.addColorStop(0.5, 'rgba(255,255,255,0)');
          gl.addColorStop(1, 'rgba(0,0,0,0.08)');
          g.fillStyle = gl;
          g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        }
    },
    { repeat: [10, 4.5] },
  );
}

/** Soft puffs rising from a vessel (or, with `mist`, drifting about it), moved in the vertex shader: no per-frame work. */
function makePuffs({ count, mist = false, size = 2.4 }) {
  const r = rng(mist ? 33 : 21);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    seed[i * 4] = r() * Math.PI * 2;
    seed[i * 4 + 1] = Math.sqrt(r());
    seed[i * 4 + 2] = (mist ? 0.05 : 0.14) + r() * 0.1;
    seed[i * 4 + 3] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const uniforms = {
    uTime: { value: 0 },
    uInt: { value: 0 },
    uSurf: { value: 1 },
    uTop: { value: 4 },
    uR: { value: 3.5 },
    uScale: { value: 600 },
    uSize: { value: size },
  };
  const rise = `
      float life = fract(uTime * aSeed.z + aSeed.w);
      float shown = step(fract(aSeed.w * 7.31), uInt);
      float y = mix(uSurf + 0.25, uTop + 6.5, life);
      float rad = aSeed.y * uR * (0.8 + life * 0.7);
      float ang = aSeed.x + life * 1.4;
      vec3 p = vec3(cos(ang) * rad, y, sin(ang) * rad);
      vA = shown * smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.45, 1.0, life));
      float grow = mix(0.9, 2.2, life);`;
  const drift = `
      float life = fract(uTime * aSeed.z + aSeed.w);
      float y = uSurf + aSeed.w * uTop;
      float rad = (0.25 + aSeed.y) * uR;
      float ang = aSeed.x + uTime * aSeed.z * 2.0;
      vec3 p = vec3(cos(ang) * rad, y + sin(uTime * 0.6 + aSeed.x * 3.0) * 0.4, sin(ang) * rad * 0.7);
      vA = uInt * (0.5 + 0.5 * sin(uTime * aSeed.z * 9.0 + aSeed.x * 5.0));
      float grow = 1.2;`;
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute vec4 aSeed;
      uniform float uTime, uInt, uSurf, uTop, uR, uScale, uSize;
      varying float vA;
      void main() {
        ${mist ? drift : rise}
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * grow * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.04, d) * vA * ${mist ? '0.32' : '0.5'};
        if (a < 0.01) discard;
        gl_FragColor = vec4(${mist ? '0.82, 0.92, 1.0' : '0.98, 0.99, 1.0'}, a);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 6;
  points.userData.noExport = true;
  points.onBeforeRender = (renderer, _scene, camera) => {
    uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  };
  return { points, uniforms };
}

// ── the vessels ────────────────────────────────────────────────────────────────────────────────────────
const KINDS = {
  dish: (r) => ({
    h: 3.4,
    body: new THREE.Mesh(
      lathe([
        [0, 0],
        [r - 0.4, 0],
        [r, 0.4],
        [r, 3.4],
        [r + 0.2, 3.6],
      ]),
      glassMat(0.3),
    ),
  }),
  glass: (r) => ({
    h: 8.2,
    body: new THREE.Mesh(
      lathe([
        [0, 0],
        [r - 0.3, 0],
        [r, 0.3],
        [r, 8.2],
        [r + 0.15, 8.3],
      ]),
      glassMat(0.3),
    ),
  }),
  plate: (r) => ({
    h: 1.7,
    body: new THREE.Mesh(
      lathe([
        [0, 0],
        [r - 1.4, 0],
        [r - 1.1, 0.12],
        [r - 0.4, 0.5],
        [r, 1.6],
        [r + 0.35, 1.7],
        [r + 0.3, 1.5],
        [r - 0.2, 0.6],
        [r - 1.0, 0.25],
        [0, 0.25],
      ]),
      new THREE.MeshStandardMaterial({ color: 0xd3d9df, roughness: 0.3, metalness: 0.85, side: THREE.DoubleSide, envMapIntensity: 1.3 }),
    ),
  }),
};

function makeVessel(kind, A, tint) {
  const r = radiusOf(A);
  const g = new THREE.Group();
  const k = KINDS[kind](r);
  k.body.renderOrder = 4;
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.15, r - 0.15, 1, 36), [
    std(tint.side, { transparent: true, opacity: 0.62, roughness: 0.12, depthWrite: false, envMapIntensity: 1.2 }),
    std(tint.top, { transparent: true, opacity: 0.85, roughness: 0.08, depthWrite: false }),
    std(tint.side, { transparent: true, opacity: 0.62, roughness: 0.12, depthWrite: false }),
  ]);
  liquid.renderOrder = 1;
  // a thin ring where the liquid started, so how much has gone can be read off the vessel
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(r + 0.02, 0.07, 6, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.renderOrder = 5;
  const floor = kind === 'plate' ? 0.25 : 0.1; // the inside bottom
  g.add(k.body, liquid, ring);
  return { root: g, body: k.body, liquid, ring, r, h: k.h, floor, A, kind };
}

export function createLab() {
  const root = new THREE.Group();
  root.name = 'lab';
  const set = new THREE.Group(); // the apparatus (what the GLB export holds)
  const stations = new THREE.Group(); // mirrored to put the changed vessel on the other side
  set.add(stations);
  root.add(set);

  // the room
  const bench = new THREE.Mesh(new THREE.BoxGeometry(160, 4, 28), std(0xffffff, { map: benchTexture(), roughness: 0.62 }));
  bench.position.set(0, -2, 3.5);
  bench.receiveShadow = true;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(190, 72), std(0xffffff, { map: wallTexture(), roughness: 0.78 }));
  wall.position.set(0, 33, WALL_Z);
  wall.receiveShadow = true;
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(160, 1.1, 0.8), std(0x6b4a2e, { roughness: 0.6 }));
  skirt.position.set(0, 0.55, WALL_Z + 0.4);
  root.add(bench, wall, skirt);
  bench.userData.noExport = wall.userData.noExport = skirt.userData.noExport = true;

  // the two vapour clouds, the humid mist, and everything that belongs to one factor
  const puffs = [makePuffs({ count: 70 }), makePuffs({ count: 70 })];
  const mist = makePuffs({ count: 46, mist: true, size: 3.6 });
  const cork = (x) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.8, 0.3, 40), std(0xc9a26b, { roughness: 0.95 }));
    m.position.set(x, 0.15, 0);
    m.receiveShadow = true;
    return m;
  };
  const mats = [cork(-SIDE), cork(SIDE)];
  const plate = new THREE.Group(); // the warm plate under the changed vessel
  {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.4, 1.3, 40), std(0x2f353d, { roughness: 0.5, metalness: 0.5 }));
    body.position.y = 0.65;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 0.1, 40), new THREE.MeshBasicMaterial({ color: 0xe0661f, toneMapped: false }));
    top.position.y = 1.32;
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.5, 14), std(0xd62f25));
    knob.rotation.z = Math.PI / 2;
    knob.position.set(0, 0.65, 6.5);
    plate.add(body, top, knob);
  }
  plate.visible = false;
  const glow = new THREE.PointLight(0xff8a3a, 0, 20, 2);
  plate.add(glow);
  glow.position.set(0, 3, 1);

  // the fan
  const fan = new THREE.Group();
  let rotor = null;
  const streaks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1, 5),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, toneMapped: false, depthWrite: false }),
    10,
  );
  {
    const dark = std(0x37424e, { roughness: 0.5, metalness: 0.4 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 0.5, 24), dark);
    base.position.y = 0.25;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 12), dark);
    pole.position.y = 2.7;
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.2, 18), dark);
    motor.rotation.z = Math.PI / 2;
    motor.position.set(0, 5.6, 0);
    rotor = new THREE.Group();
    rotor.position.set(-1.4, 5.6, 0);
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.8, 1.5), std(0x5b8fd0, { roughness: 0.4 }));
      blade.position.y = 2.1;
      const holder = new THREE.Group();
      holder.rotation.x = (i * Math.PI) / 2;
      holder.add(blade);
      blade.rotation.y = 0.5;
      rotor.add(holder);
    }
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), dark);
    hub.position.set(-1.4, 5.6, 0);
    const cage = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.12, 6, 40), std(0xaeb6bf, { metalness: 0.8, roughness: 0.3 }));
    cage.rotation.y = Math.PI / 2;
    cage.position.set(-2.4, 5.6, 0);
    fan.add(base, pole, motor, rotor, hub, cage);
  }
  fan.visible = false;
  streaks.visible = false;
  streaks.frustumCulled = false;

  // the bell jar with the air pumped out, its hose and the pump
  const jar = new THREE.Group();
  let dome = null;
  {
    dome = new THREE.Mesh(
      lathe(
        [
          [0, 12],
          [3, 11.7],
          [5.4, 9.6],
          [6.2, 6],
          [6.3, 0.2],
        ],
        36,
      ),
      glassMat(0.2),
    );
    dome.renderOrder = 4;
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 0.5, 40), std(0xaab3bc, { metalness: 0.7, roughness: 0.35 }));
    flange.position.y = 0.25;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), std(0x37424e));
    knob.position.y = 12.3;
    const hose = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 12.3, 0),
          new THREE.Vector3(3.5, 14.6, 0),
          new THREE.Vector3(10, 14, 0),
          new THREE.Vector3(14, 8, 0),
          new THREE.Vector3(15.5, 3.8, 0),
        ]),
        28,
        0.26,
        8,
      ),
      std(0x2b2f36, { roughness: 0.6 }),
    );
    const pump = new THREE.Group();
    const pbody = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.6, 4.4), std(0x4d6f95, { roughness: 0.45, metalness: 0.3 }));
    pbody.position.y = 1.8;
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.2, 24), std(0xfbf7ea));
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, 2.1, 2.3);
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.05), std(0xd62f25));
    needle.position.set(-0.25, 2.2, 2.42);
    needle.rotation.z = 0.8;
    pump.add(pbody, dial, needle);
    pump.position.set(15.5, 0, 0);
    jar.add(dome, flange, knob, hose, pump);
  }
  jar.visible = false;

  fan.add(streaks); // the streaks leave the front of the fan
  stations.add(mats[0], mats[1], plate, fan, jar, puffs[0].points, puffs[1].points, mist.points);

  // what is built for the factor now
  const cur = { factor: 'wind', swap: false, vessels: [null, null], time: 0, play: 0 };
  const anchors = { plain: new THREE.Vector3(), changed: new THREE.Vector3() };
  const spots = { plain: [], changed: [] }; // where each name may sit, best first
  const boxes = { plain: new THREE.Box3(), changed: new THREE.Box3() };
  const frame = new THREE.Box3(); // what the camera keeps in view for this factor
  const pickable = [];
  const TINT_WATER = { side: 0x2f86d4, top: 0x9fd3f7 };
  const TINT_SPIRIT = { side: 0xe3b72b, top: 0xf6e08a };

  const worldX = (x) => (cur.swap ? -x : x);

  /** Builds the two vessels, the apparatus and the anchors for a factor (swap: the changed vessel on the left). */
  function setCase(factor, swap = false) {
    cur.factor = factor;
    cur.swap = swap;
    stations.scale.x = swap ? -1 : 1;
    stations.updateMatrixWorld(true);
    for (const v of cur.vessels) {
      if (!v) continue;
      stations.remove(v.root);
      v.root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
    }
    pickable.length = 0;
    const c = CASES[factor];
    const kinds = factor === 'area' ? ['glass', 'plate'] : ['dish', 'dish'];
    const tints = factor === 'liquid' ? [TINT_WATER, TINT_SPIRIT] : [TINT_WATER, TINT_WATER];
    cur.vessels = [makeVessel(kinds[0], c.plain.A, tints[0]), makeVessel(kinds[1], c.changed.A, tints[1])];
    const xs = [-SIDE, SIDE];
    const lift = factor === 'warm' ? 1.35 : 0.3;
    cur.vessels.forEach((v, i) => {
      v.root.position.set(xs[i], i === 1 ? lift : 0.3, 0);
      stations.add(v.root);
      v.ring.position.y = v.floor + depth(c[i ? 'changed' : 'plain'], 0);
      v.body.userData.side = i ? 'changed' : 'plain';
      pickable.push(v.body);
    });
    if (factor === 'pressure' && dome) pickable.push(dome); // a tap on the jar counts too
    plate.position.set(SIDE, 0, 0);
    plate.visible = factor === 'warm';
    glow.intensity = factor === 'warm' ? 14 : 0;
    fan.position.set(SIDE + 12.5, 0, -5);
    fan.rotation.y = 0.56; // turned toward the front so the blades show, blowing across the right vessel
    fan.visible = factor === 'wind';
    streaks.visible = factor === 'wind';
    jar.position.set(SIDE, 0.3, 0);
    jar.visible = factor === 'pressure';
    mist.points.position.set(-SIDE, 0, 0);
    mist.points.visible = factor === 'dry';
    mist.uniforms.uInt.value = factor === 'dry' ? 1 : 0;
    mist.uniforms.uSurf.value = 0.8;
    mist.uniforms.uTop.value = 8;
    mist.uniforms.uR.value = 6.5;
    mats[1].visible = factor !== 'warm';
    puffs.forEach((p, i) => {
      const v = cur.vessels[i];
      p.points.position.set(xs[i], i === 1 ? lift : 0.3, 0);
      p.uniforms.uTop.value = v.h;
      p.uniforms.uR.value = Math.max(v.r * 0.85, 2.4);
    });
    // anchors (world) and the boxes a ring can fit (world), for the mirrored set
    const tops = cur.vessels.map((v, i) => v.h + (i === 1 ? lift : 0.3));
    [
      ['plain', 0],
      ['changed', 1],
    ].forEach(([k, i]) => {
      const v = cur.vessels[i];
      const x = worldX(xs[i]);
      const jarred = factor === 'pressure' && i === 1; // under the bell jar: the name goes above its knob
      if (jarred) anchors[k].set(x, 12.9, 0);
      else anchors[k].set(x, tops[i] + 4.2, 0);
      spots[k] = jarred
        ? [
            { dx: 0, dy: -24 },
            { dx: -70, dy: -8 },
          ]
        : [
            { dx: 0, dy: -30 },
            { dx: 0, dy: -62 },
          ];
      const w = factor === 'pressure' && i === 1 ? 5.4 : v.r + 0.6; // the ring goes round the dish inside the jar
      const hgt = factor === 'pressure' && i === 1 ? 5.2 : tops[i] + 0.2;
      boxes[k].set(new THREE.Vector3(x - w, 0, -w), new THREE.Vector3(x + w, hgt, w));
    });
    // the camera's box: both vessels and this factor's apparatus (mirrored with the set)
    const leftExt = SIDE + cur.vessels[0].r + 1.4;
    let rightExt = SIDE + cur.vessels[1].r + 1.4;
    if (factor === 'wind') rightExt = SIDE + 16;
    if (factor === 'pressure') rightExt = SIDE + 19.5;
    if (factor === 'warm') rightExt = Math.max(rightExt, SIDE + 7.8);
    const lo = swap ? -rightExt : -leftExt;
    const hi = swap ? leftExt : rightExt;
    frame.set(new THREE.Vector3(lo, 0, -7), new THREE.Vector3(hi, factor === 'pressure' ? 15.8 : 13.5, 6));
    update(cur.time);
  }

  const dummy = new THREE.Object3D();
  function placeStreaks() {
    for (let i = 0; i < 10; i++) {
      const life = (cur.play * 0.55 + i * 0.1) % 1;
      const y = 2.4 + ((i * 37) % 10) * 0.55;
      const z = ((i * 53) % 9) * 0.5 - 2.2;
      dummy.position.set(-3.4 - life * 13, y, z);
      dummy.rotation.set(0, 0, Math.PI / 2);
      dummy.scale.set(1, 1.6 + (i % 3) * 0.5, 1);
      dummy.updateMatrix();
      streaks.setMatrixAt(i, dummy.matrix);
    }
    streaks.instanceMatrix.needsUpdate = true;
  }

  /** The vessels at time t (0 to T_END): liquid depth, vapour. */
  function update(t) {
    cur.time = t;
    const c = CASES[cur.factor];
    ['plain', 'changed'].forEach((k, i) => {
      const v = cur.vessels[i];
      if (!v) return;
      const d = depth(c[k], t);
      v.liquid.visible = d > 0.02;
      v.liquid.scale.y = Math.max(d, 0.001);
      v.liquid.position.y = v.floor + d / 2;
      puffs[i].uniforms.uSurf.value = v.floor + Math.max(d, 0) + 0.1;
      puffs[i].uniforms.uInt.value = vapour(c[k], t);
    });
    if (cur.factor === 'wind') placeStreaks();
  }

  /** While time runs: the vapour moves, the fan turns. */
  function tick(dt) {
    cur.play += dt;
    for (const p of puffs) p.uniforms.uTime.value = cur.play;
    mist.uniforms.uTime.value = cur.play;
    if (rotor) rotor.rotation.x += dt * 22;
    if (cur.factor === 'wind') placeStreaks();
  }

  setCase('wind', false);
  root.updateMatrixWorld(true);
  return {
    root,
    set,
    setCase,
    update,
    tick,
    anchors,
    spots,
    boxes,
    frame,
    pickable,
    get swap() {
      return cur.swap;
    },
    get factor() {
      return cur.factor;
    },
  };
}
