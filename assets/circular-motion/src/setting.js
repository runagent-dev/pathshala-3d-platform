// Where each example is: the fan under the ceiling of a room in an old house (plastered ceiling between wooden
// rafters, blue walls, a window, a red-oxide floor), the clock on that room's blue plastered wall, and the Moon in
// the starry sky. None of it is exported (noExport) and none of it is drawn on a transparent background.
// Cheap on purpose: the room is one box (three materials), its wood one merged mesh, the stars two point clouds;
// one small plaster canvas (512 px) shared by every surface through its own repeat.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

let plasterBase = null;
/**
 * A seamless plaster grain (light, so a material's colour tints it): soft trowel blotches (two octaves of tiling
 * value noise) and fine grit, computed straight into a pixel array (a few milliseconds, and no 2D canvas: drawing
 * it on one held a slow phone up for seconds).
 */
function plasterPixels() {
  const N = 512;
  const d = new Uint8Array(N * N * 4);
  const r = rand(11);
  const octave = (cells) => {
    const v = new Float32Array(cells * cells).map(() => r());
    return (x, y) => {
      const fx = (x / N) * cells;
      const fy = (y / N) * cells;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const sx = fx - x0;
      const sy = fy - y0;
      const ux = sx * sx * (3 - 2 * sx);
      const uy = sy * sy * (3 - 2 * sy);
      const at = (i, j) => v[(j % cells) * cells + (i % cells)];
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * ux;
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * ux;
      return top + (bottom - top) * uy;
    };
  };
  const broad = octave(6);
  const fine = octave(24);
  for (let y = 0, i = 0; y < N; y++)
    for (let x = 0; x < N; x++, i += 4) {
      const n = 240 + (broad(x, y) - 0.5) * 12 + (fine(x, y) - 0.5) * 12 + (r() - 0.5) * 24;
      d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, n));
      d[i + 3] = 255;
    }
  return { data: d, size: N };
}

/**
 * The plaster grain repeated so that one tile covers `tile` cm of a surface `w` × `h` cm. Every copy shares one
 * image (a clone keeps the source), so the grain is made and uploaded once.
 */
function plaster(w, h, tile = 150) {
  if (!plasterBase) {
    const { data, size } = plasterPixels();
    plasterBase = new THREE.DataTexture(data, size, size);
    plasterBase.colorSpace = THREE.SRGBColorSpace;
    plasterBase.magFilter = THREE.LinearFilter;
    plasterBase.minFilter = THREE.LinearMipmapLinearFilter;
    plasterBase.generateMipmaps = true;
    plasterBase.needsUpdate = true;
    plasterBase.wrapS = plasterBase.wrapT = THREE.RepeatWrapping;
    plasterBase.anisotropy = 1;
  }
  const t = plasterBase.clone();
  t.repeat.set(w / tile, h / tile);
  return t;
}

function box(w, h, d, x, y, z) {
  return new THREE.BoxGeometry(w, h, d).translate(x, y, z);
}

/**
 * The room round the ceiling fan, in the fan's world centimetres: the ceiling at y = `ceiling`, the fan's axis at
 * x = z = 0. A plastered ceiling, lighter towards the window and darker in the corners, with two wooden beams (kori)
 * across it well clear of the fan; blue walls with a picture rail and a window; a red-oxide floor.
 */
export function createRoom({ ceiling }) {
  const root = new THREE.Group();
  root.name = 'Room';
  root.userData.noExport = true;
  const W = 660; // the room is W × W, 300 cm high
  const H = 300;
  // Every surface of the room shares one shader: front-sided, plaster-mapped, shaded by vertex colours (the walls
  // darker towards the floor, the ceiling lighter towards the window). The box is turned inside out for that.
  const shade = (geo, fn) => {
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const k = fn(pos.getX(i), pos.getY(i), pos.getZ(i));
      colors.set([k, k, k], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  };
  const surface = (name, color, map, roughness = 0.95) => new THREE.MeshStandardMaterial({ name, color, map, roughness, vertexColors: true });
  const wall = surface('Wall', 0x7f9fbe, plaster(W, H, 150));
  const floor = surface('Floor', 0x9a4434, plaster(W, W, 90), 0.55);
  const none = new THREE.MeshBasicMaterial({ visible: false }); // the box's top: the ceiling below is its own mesh
  const boxGeo = new THREE.BoxGeometry(W, H, W, 1, 4, 1);
  const index = boxGeo.index.array;
  for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]]; // inside out
  const normals = boxGeo.attributes.normal.array;
  for (let i = 0; i < normals.length; i++) normals[i] = -normals[i];
  shade(boxGeo, (_x, y) => 0.8 + 0.25 * (y / H + 0.5)); // y from −H/2 (floor) to H/2 (ceiling)
  const roomBox = new THREE.Mesh(boxGeo, [wall, wall, none, floor, wall, wall]);
  roomBox.position.y = ceiling - H / 2;
  roomBox.name = 'RoomBox';
  root.add(roomBox);

  // the ceiling: light pooling from the window side (−x, −z), the corners in shade; it takes the fan's soft shadow
  const ceilingGeo = shade(
    new THREE.PlaneGeometry(W, W, 16, 16).rotateX(Math.PI / 2),
    (x, _y, z) => 1.28 - Math.hypot(x + 60, z + 90) / 900 - (Math.max(Math.abs(x), Math.abs(z)) / (W / 2)) ** 6 * 0.18,
  );
  const ceilingMesh = new THREE.Mesh(ceilingGeo, surface('Ceiling', 0xf5d995, plaster(W, W, 150)));
  ceilingMesh.name = 'Ceiling';
  ceilingMesh.position.y = ceiling;
  ceilingMesh.receiveShadow = true;
  root.add(ceilingMesh);

  // the wood: two beams across the ceiling, a picture rail round the walls, the window frame
  const wood = surface('Wood', 0x9a6a42, plaster(40, 600, 150), 0.7);
  const parts = [];
  for (const z of [-215, 215]) parts.push(box(W, 18, 16, 0, ceiling - 9, z));
  const rail = ceiling - 34;
  parts.push(box(W, 4, 3, 0, rail, -W / 2 + 1.5), box(W, 4, 3, 0, rail, W / 2 - 1.5));
  parts.push(box(3, 4, W, -W / 2 + 1.5, rail, 0), box(3, 4, W, W / 2 - 1.5, rail, 0));
  // a window in the far wall (z = −W/2): frame, sill, a cross bar
  const wx = -70;
  const wy = ceiling - 150;
  const ww = 120;
  const wh = 130;
  const wz = -W / 2 + 2;
  parts.push(box(ww + 16, 8, 6, wx, wy + wh / 2 + 4, wz), box(ww + 24, 7, 12, wx, wy - wh / 2 - 3.5, wz + 3));
  parts.push(box(8, wh, 6, wx - ww / 2 - 4, wy, wz), box(8, wh, 6, wx + ww / 2 + 4, wy, wz));
  parts.push(box(5, wh, 5, wx, wy, wz + 1), box(ww, 5, 5, wx, wy + 18, wz + 1));
  const woodMesh = new THREE.Mesh(
    shade(mergeGeometries(parts), () => 1),
    wood,
  );
  woodMesh.name = 'Woodwork';
  root.add(woodMesh);

  // the window's light: a bright sky and a far line of trees (the brightest thing in the room)
  const sky = document.createElement('canvas');
  sky.width = 64;
  sky.height = 128;
  const g = sky.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#6fb3e8');
  grad.addColorStop(0.7, '#cfe8f7');
  grad.addColorStop(0.71, '#5d7f52');
  grad.addColorStop(1, '#3f5e3a');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 128);
  const skyTex = new THREE.CanvasTexture(sky);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  // (made bright by its vertex colours rather than drawn unlit, so it shares the room's shader)
  const glass = new THREE.Mesh(
    shade(new THREE.PlaneGeometry(ww, wh), () => 1.7),
    surface('WindowView', 0xffffff, skyTex, 1),
  );
  glass.position.set(wx, wy, wz - 1.5);
  root.add(glass);
  return root;
}

/** The clock's wall: blue plaster, a little lighter towards the lamp (upper left) and darker at the far edges. */
export function createWall({ z }) {
  const W = 420;
  const H = 320;
  const geo = new THREE.PlaneGeometry(W, H, 12, 10);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const lit = 1.06 - Math.hypot(pos.getX(i) + 40, pos.getY(i) - 50) / 420; // brighter round the lamp's side
    colors.set([lit, lit, lit], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const wall = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ name: 'Wall', color: 0x86a6c4, map: plaster(W, H, 110), vertexColors: true, roughness: 0.95 }),
  );
  wall.name = 'Wall';
  wall.position.set(0, -20, z);
  wall.receiveShadow = true; // the clock's soft shadow
  wall.userData.noExport = true;
  return wall;
}

/** The night sky round the Earth and the Moon: dim stars thick along a Milky Way band, and a few bright ones. */
export function createStars() {
  const root = new THREE.Group();
  root.name = 'Stars';
  root.userData.noExport = true;
  const dot = document.createElement('canvas');
  dot.width = dot.height = 32;
  const g = dot.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const map = new THREE.CanvasTexture(dot);
  const r = rand(23);
  const band = new THREE.Vector3(0.35, 0.8, -0.48).normalize(); // the band's pole
  const v = new THREE.Vector3();
  const tints = [
    [1, 1, 1],
    [0.78, 0.86, 1],
    [1, 0.9, 0.74],
  ];
  function cloud(count, size, bright, inBand) {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // uniform on the sphere; a share pulled towards the band's great circle
      do {
        v.set(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
      } while (v.lengthSq() > 1 || v.lengthSq() < 0.01);
      v.normalize();
      if (r() < inBand) v.addScaledVector(band, -v.dot(band) * (0.75 + r() * 0.25)).normalize();
      pos.set([v.x * 3000, v.y * 3000, v.z * 3000], i * 3);
      const t = tints[Math.floor(r() * tints.length)];
      const k = bright * (0.45 + r() * 0.55);
      col.set([t[0] * k, t[1] * k, t[2] * k], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size, map, vertexColors: true, sizeAttenuation: false, transparent: true, depthWrite: false, toneMapped: false }),
    );
    pts.frustumCulled = false;
    return pts;
  }
  root.add(cloud(1600, 3.2, 0.85, 0.55), cloud(160, 5.5, 1, 0.2));
  return root;
}

/** A vertical gradient for the scene's background: what shows past the room, or the night sky's depth. */
export function gradientTexture(top, bottom) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
