// The two places the CNG drives, in metres (x east, z south, y up), both repeating without end so the CNG can
// drive on for as long as the student likes (follow(x, z) keeps the pieces round the CNG; the patterns repeat, so
// nothing jumps):
//  - the straight road: two lanes of asphalt with a dashed centre line, kerbs painted black and white (as on
//    Bangladesh's roads), on soft sand, nothing else;
//  - the open ground for the bend: soft sand in broad stripes (so turning and moving show), nothing else, and the
//    CNG's track on it, grey where it went straight and coloured where it turned.
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
  // shoulders of packed earth, then soft sand
  {
    const earth = new THREE.MeshStandardMaterial({ name: 'Earth', color: '#d9c9a8', roughness: 1 });
    for (const z of [-half - 0.95, half + 0.95]) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.5), earth);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.005, z);
      s.receiveShadow = true;
      root.add(s);
    }
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(L, 80), new THREE.MeshStandardMaterial({ name: 'Ground', color: '#ddd1b8', roughness: 1 }));
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.01;
    grass.receiveShadow = true;
    root.add(grass);
  }
  // nothing else beside the road (no trees, bushes or tufts): the CNG is the one thing to look at

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
    const c = canvas(256, 256); // one stripe period (8 m) each way: two bands of soft sand
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#e3d8c2';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#d6c8ad';
    ctx.fillRect(0, 0, 256, 128);
    const r = rand(23);
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(150,125,90,0.18)' : 'rgba(245,238,222,0.3)';
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
  };
}
