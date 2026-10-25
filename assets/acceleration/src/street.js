// The two places the CNG drives, in metres (x east, z south, y up), both repeating without end so the CNG can
// drive on for as long as the student likes (follow(x, z) keeps the pieces round the CNG; the patterns repeat, so
// nothing jumps):
//  - the straight road: two lanes of asphalt with a dashed centre line, kerbs painted black and white (as on
//    Bangladesh's roads), and trees on the far side only, so nothing ever passes in front of the CNG;
//  - the open field for the bend: mown grass in stripes (so turning and moving show) with trees here and there,
//    and the CNG's track on the grass, grey where it went straight and coloured where it turned.
import * as THREE from 'three';

const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const texture = (c, repeatX = 1, repeatY = 1) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
};

export const ROAD = { width: 7, lane: -1.75, period: 48, dash: 6 };

/** Trees: a trunk and a round crown, as two instanced meshes (cheap even when there are many). */
function createTrees(name, spots, { crown = '#79ad63', trunk = '#83664a' } = {}) {
  const g = new THREE.Group();
  g.name = name;
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1, 7).translate(0, 0.5, 0);
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ name: 'Trunk', color: trunk, roughness: 0.9 }), spots.length);
  const crowns = new THREE.InstancedMesh(
    crownGeo,
    new THREE.MeshStandardMaterial({ name: 'Leaves', color: crown, roughness: 0.85, flatShading: true }),
    spots.length * 3,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const r = rand(5);
  spots.forEach(([x, z, size], i) => {
    const h = 2.2 * size;
    trunks.setMatrixAt(i, m.compose(p.set(x, 0, z), q.identity(), s.set(size, h, size)));
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + r();
      const rr = 1.1 * size * (0.85 + 0.3 * r());
      p.set(x + Math.cos(a) * 0.7 * size, h + 0.9 * size + k * 0.25 * size, z + Math.sin(a) * 0.7 * size);
      q.setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3));
      crowns.setMatrixAt(i * 3 + k, m.compose(p, q, s.set(rr, rr * 0.82, rr)));
    }
  });
  trunks.castShadow = crowns.castShadow = true;
  g.add(trunks, crowns);
  return g;
}

export function createStreet() {
  const root = new THREE.Group();
  root.name = 'Street';
  const L = ROAD.period * 3; // the pieces cover 144 m round the CNG; the fog hides the ends
  const half = ROAD.width / 2;

  // asphalt with the dashed centre line and the white edge lines, one dash period (6 m) in the texture
  {
    const c = canvas(384, 448); // 64 px per metre
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#7b8086';
    ctx.fillRect(0, 0, 384, 448);
    const r = rand(3);
    for (let i = 0; i < 2600; i++) {
      const g = 100 + Math.floor(r() * 50);
      ctx.fillStyle = `rgba(${g},${g + 3},${g + 6},0.5)`;
      ctx.fillRect(r() * 384, r() * 448, 2, 2);
    }
    ctx.fillStyle = '#f3f3ee';
    ctx.fillRect(0, 224 - 5, 192, 10); // the centre dash: 3 m painted, 3 m not
    ctx.fillRect(0, 13, 384, 7); // edge lines
    ctx.fillRect(0, 448 - 20, 384, 7);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(L, ROAD.width),
      new THREE.MeshStandardMaterial({ name: 'Asphalt', map: texture(c, L / ROAD.dash, 1), roughness: 0.92 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    road.name = 'Road';
    root.add(road);
  }
  // kerbs painted black and white, half a metre each (a stripe texture on one long block per side)
  {
    const c = canvas(128, 8);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f2f2ee';
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = '#2a2d31';
    ctx.fillRect(64, 0, 64, 8);
    const kerbMat = new THREE.MeshStandardMaterial({ name: 'Kerb', map: texture(c, L, 1), roughness: 0.8 });
    for (const z of [-half - 0.1, half + 0.1]) {
      const kerb = new THREE.Mesh(new THREE.BoxGeometry(L, 0.14, 0.2), kerbMat);
      kerb.position.set(0, 0.07, z);
      kerb.receiveShadow = true;
      root.add(kerb);
    }
  }
  // shoulders of packed earth, then grass
  {
    const earth = new THREE.MeshStandardMaterial({ name: 'Earth', color: '#d9c9a8', roughness: 1 });
    for (const z of [-half - 0.95, half + 0.95]) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.5), earth);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.005, z);
      s.receiveShadow = true;
      root.add(s);
    }
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(L, 80), new THREE.MeshStandardMaterial({ name: 'Grass', color: '#cfe0bb', roughness: 1 }));
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.01;
    grass.receiveShadow = true;
    root.add(grass);
  }
  // trees on the far side only (behind the CNG and well back, pale in the haze), at uneven places that repeat
  // every 48 m
  {
    const spots = [];
    for (let k = -1; k <= 1; k++)
      for (const [x, z, size] of [
        [2.3, -26, 2.2],
        [9.8, -31, 2.5],
        [18.4, -24, 2],
        [26.7, -33, 2.6],
        [34.2, -27, 2.3],
        [42.5, -30, 2.4],
      ])
        spots.push([x + (k - 0.5) * ROAD.period, z, size]);
    root.add(createTrees('StreetTrees', spots));
  }
  // low round bushes along the far shoulder and grass tufts on the near side: nothing that reaches the arrows
  // over the CNG, and the same every 48 m
  {
    const r = rand(17);
    const bushes = Array.from({ length: 7 }, (_, i) => [(i + r() * 0.6) * (ROAD.period / 7), -half - 3 - r() * 2, 0.32 + r() * 0.2]);
    const tufts = Array.from({ length: 12 }, (_, i) => [(i + r()) * (ROAD.period / 12), half + 2.2 + r() * 2.5]);
    const bush = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({ name: 'Bush', color: '#86b56d', roughness: 0.9, flatShading: true }),
      bushes.length * 3,
    );
    const tuft = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.22, 0.32, 5).translate(0, 0.16, 0),
      new THREE.MeshStandardMaterial({ name: 'Tuft', color: '#9fc283', roughness: 1, flatShading: true }),
      tufts.length * 3,
    );
    const m = new THREE.Matrix4();
    let nb = 0;
    let nt = 0;
    for (let k = -1; k <= 1; k++) {
      for (const [x, z, s] of bushes) bush.setMatrixAt(nb++, m.makeScale(s * 1.3, s * 0.75, s).setPosition(x + (k - 0.5) * ROAD.period, s * 0.45, z));
      for (const [x, z] of tufts) tuft.setMatrixAt(nt++, m.makeTranslation(x + (k - 0.5) * ROAD.period, 0, z));
    }
    root.add(bush, tuft);
  }

  return {
    root,
    /** Keep the road round the CNG (the patterns repeat every 48 m, so the jump does not show). */
    follow(x) {
      root.position.x = Math.round(x / ROAD.period) * ROAD.period;
    },
  };
}

export const FIELD = { period: 32, stripe: 8 };

/** The open field for the bend, with the CNG's track. */
export function createField({ colors }) {
  const root = new THREE.Group();
  root.name = 'Field';
  const ground = new THREE.Group();
  root.add(ground);
  const S = FIELD.period * 6;
  {
    const c = canvas(256, 256); // one stripe period (8 m) each way: two bands of mown grass
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#d4e7bc';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#bdd7a0';
    ctx.fillRect(0, 0, 256, 128);
    const r = rand(23);
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(150,185,120,0.35)' : 'rgba(225,238,205,0.4)';
      ctx.fillRect(r() * 256, r() * 256, 2, 3);
    }
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(S, S),
      new THREE.MeshStandardMaterial({ name: 'MownGrass', map: texture(c, S / FIELD.stripe, S / FIELD.stripe), roughness: 1 }),
    );
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    ground.add(grass);
  }
  // low tufts of grass here and there (nothing tall: the CNG may drive anywhere and must never be hidden)
  {
    const PER = 9;
    const tuft = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.2, 0.3, 5).translate(0, 0.15, 0),
      new THREE.MeshStandardMaterial({ name: 'Tuft', color: '#93ba76', roughness: 1, flatShading: true }),
      49 * PER,
    );
    const m = new THREE.Matrix4();
    const r = rand(29);
    const spots = Array.from({ length: PER }, () => [r() * FIELD.period, r() * FIELD.period, 0.8 + r() * 0.7]);
    let n = 0;
    for (let i = -3; i <= 3; i++)
      for (let j = -3; j <= 3; j++)
        for (const [x, z, k] of spots) tuft.setMatrixAt(n++, m.makeScale(k, k, k).setPosition(x + i * FIELD.period, 0, z + j * FIELD.period));
    ground.add(tuft);
  }

  // the track: a ribbon on the grass, two corners per point, coloured per point
  const MAX = 900;
  const pos = new Float32Array(MAX * 2 * 3);
  const col = new Float32Array(MAX * 2 * 3);
  const index = [];
  for (let i = 0; i < MAX - 1; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setIndex(index);
  geo.setDrawRange(0, 0);
  const track = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      name: 'Track',
      vertexColors: true,
      side: THREE.DoubleSide,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  track.frustumCulled = false;
  track.userData.noExport = true;
  track.name = 'Track';
  root.add(track);
  const C = { straight: new THREE.Color(colors.track), turn: new THREE.Color(colors.turn) };
  let count = 0;
  const points = []; // [e, north, h, turning]
  const HALF = 0.14;
  function write(i, [e, north, h, turning]) {
    const nx = -Math.sin(h) * HALF; // across the track (east, north)
    const nn = Math.cos(h) * HALF;
    const c = turning ? C.turn : C.straight;
    for (const [k, sgn] of [
      [i * 2, 1],
      [i * 2 + 1, -1],
    ]) {
      pos[k * 3] = e + sgn * nx;
      pos[k * 3 + 1] = 0.03;
      pos[k * 3 + 2] = -(north + sgn * nn);
      col[k * 3] = c.r;
      col[k * 3 + 1] = c.g;
      col[k * 3 + 2] = c.b;
    }
  }
  function rebuild() {
    count = Math.min(points.length, MAX);
    for (let i = 0; i < count; i++) write(i, points[points.length - count + i]);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.setDrawRange(0, Math.max(0, count - 1) * 6);
  }

  return {
    root,
    follow(x, z) {
      ground.position.set(Math.round(x / FIELD.period) * FIELD.period, 0, Math.round(z / FIELD.period) * FIELD.period);
    },
    /** Add a point of the track (east, north in m; heading; turning there?). */
    addPoint(e, north, h, turning) {
      points.push([e, north, h, turning]);
      if (points.length > MAX * 1.5) points.splice(0, points.length - MAX);
      if (points.length > MAX) return rebuild();
      write(count, points[points.length - 1]);
      count++;
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.setDrawRange(0, Math.max(0, count - 1) * 6);
    },
    clearTrack() {
      points.length = 0;
      count = 0;
      geo.setDrawRange(0, 0);
    },
    /** How much of the track is turning and straight (m), for the panel. */
    get points() {
      return points;
    },
  };
}
