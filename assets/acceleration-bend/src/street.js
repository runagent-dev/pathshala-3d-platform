// The open ground the CNG drives on, in metres (x east, z south, y up), repeating without end so the CNG can drive
// on for as long as the student likes (follow(x, z) keeps the pieces round the CNG; the pattern repeats, so nothing
// jumps): soft sand in broad stripes (so turning and moving show), nothing else, and the CNG's track on it, grey
// where it went straight and coloured where it turned.
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
