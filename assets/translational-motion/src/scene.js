// The rest of the scene, procedural three.js in metres: the road (straight, or with the bend), the metre marks
// along the straight road, and the trails the painted points leave behind (tubes along their sampled paths, grown
// with drawRange so nothing is rebuilt while the car moves, each with a dark outline so it stands out from the
// white car and the road alike). The street round the road is in setting.js.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { FONT } from '@shared/student/materials.js';
import { CAR, D_MAX, TURN_R } from './motion.js';

export const ROAD_W = 3.4;

/** The road's middle line (x, z), along the rear axle's path, with a little road before and after. */
export function centreLine(path) {
  const pts = [];
  if (path !== 'turn') {
    for (const x of [-30, CAR.rearAxle + D_MAX.straight + 34]) pts.push([x, 0]); // on out of the picture
    return pts;
  }
  pts.push([-30, 0]);
  const cx = CAR.rearAxle;
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * (Math.PI / 2);
    pts.push([cx + TURN_R * Math.sin(a), -TURN_R + TURN_R * Math.cos(a)]);
  }
  pts.push([cx + TURN_R, -TURN_R - 34]);
  return pts;
}

/** A flat band of width w along a line of (x, z) points, at height y. */
export function band(pts, w, y, offset = 0) {
  const pos = [];
  const idx = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    const nx = -tz / l; // to the right of the direction of travel (+z when going +x)
    const nz = tx / l;
    const [x, z] = pts[i];
    pos.push(x + nx * (offset + w / 2), y, z + nz * (offset + w / 2), x + nx * (offset - w / 2), y, z + nz * (offset - w / 2));
    if (i) {
      const k = i * 2; // wound so that every face points up
      idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** The road for one path: asphalt (map: its texture, 3 m square, in world coordinates) and its two edge lines. */
export function createRoad(path, map = null) {
  const g = new THREE.Group();
  g.name = `Road_${path}`;
  const pts = centreLine(path);
  const asphalt = new THREE.MeshStandardMaterial({ name: 'Road', color: map ? 0xffffff : 0x34495d, map, roughness: 0.95, metalness: 0 });
  const edge = new THREE.MeshStandardMaterial({ name: 'RoadEdge', color: 0xe9ecef, roughness: 0.7 });
  const geo = band(pts, ROAD_W, 0, 0);
  const p = geo.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) uv.set([p.getX(i) / 3, p.getZ(i) / 3], i * 2);
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const road = new THREE.Mesh(geo, asphalt);
  road.receiveShadow = true;
  const lines = new THREE.Mesh(mergeGeometries([-1, 1].map((side) => band(pts, 0.1, 0.003, side * (ROAD_W / 2 - 0.14)))), edge);
  lines.receiveShadow = true;
  g.add(road, lines);
  return g;
}

/**
 * Metre marks along the near edge of the straight road, numbered from where the rear bumper starts (0), so a
 * student can check how far each point went. digits(n) gives the number in the figure's language. Each metre
 * has a short upright peg (it reads as a ruler's mark from any side); the numbers face the camera and sit just
 * under their pegs on the screen (face(camera) before each frame), the unit under the last number.
 */
export const RULER = { z: ROAD_W / 2 - 0.32, max: 8, below: 0.4, digit: 0.5, unitBelow: 0.48, unit: 0.36 };
export function createRuler({ digits, unit }) {
  const { max, z: z0 } = RULER;
  const g = new THREE.Group();
  g.name = 'MetreMarks';
  // the pegs and the line along them: one mesh
  const PEG = 0.16;
  const parts = [];
  for (let i = 0; i <= max; i++) {
    const peg = new THREE.BoxGeometry(0.035, PEG, 0.035);
    peg.translate(i, PEG / 2, z0);
    parts.push(peg);
  }
  const line = new THREE.BoxGeometry(max + 0.035, 0.006, 0.035);
  line.translate(max / 2, 0.004, z0);
  parts.push(line);
  const marks = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshBasicMaterial({ name: 'Marks', color: 0xffe9a8 }));
  g.add(marks);

  // the numbers and the unit: one texture (light figures with a dark outline, readable on the road and on the
  // footpath alike) and one mesh of quads that turn to face the camera before each frame
  const texts = [...Array.from({ length: max + 1 }, (_, i) => digits(String(i))), unit];
  const F = 96; // px font size in the texture
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');
  const cells = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < texts.length; i++) {
    const size = i <= max ? F : Math.round(F * 0.8);
    ctx.font = `${i <= max ? 600 : 500} ${size}px ${FONT}`;
    const w = Math.ceil(ctx.measureText(texts[i]).width + size * 0.34);
    const h = Math.ceil(size * 1.3);
    if (x + w > c.width) {
      x = 0;
      y += Math.ceil(F * 1.3);
    }
    cells.push({ x, y, w, h, size });
    x += w;
  }
  for (let i = 0; i < texts.length; i++) {
    const { x: cx, y: cy, w, h, size } = cells[i];
    ctx.font = `${i <= max ? 600 : 500} ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = 'rgba(24,28,34,0.9)';
    ctx.strokeText(texts[i], cx + w / 2, cy + h / 2 + size * 0.04);
    ctx.fillStyle = '#fff0c6';
    ctx.fillText(texts[i], cx + w / 2, cy + h / 2 + size * 0.04);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const n = texts.length;
  const pos = new Float32Array(n * 4 * 3);
  const uv = new Float32Array(n * 4 * 2);
  const idx = [];
  const half = []; // half width and height of each quad, in metres
  for (let i = 0; i < n; i++) {
    const { x: cx, y: cy, w, h, size } = cells[i];
    const metres = (i <= max ? RULER.digit : RULER.unit) / size; // as tall as the old labels
    half.push([(w * metres) / 2, (h * metres) / 2]);
    const u0 = cx / c.width;
    const u1 = (cx + w) / c.width;
    const v0 = 1 - (cy + h) / c.height;
    const v1 = 1 - cy / c.height;
    uv.set([u0, v0, u1, v0, u1, v1, u0, v1], i * 8);
    const k = i * 4;
    idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const labels = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ name: 'MetreNumbers', map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }),
  );
  labels.name = 'MetreNumbers';
  labels.frustumCulled = false;
  labels.renderOrder = 4; // on the road's near edge, nothing stands in front of them
  g.add(labels);
  const down = new THREE.Vector3();
  const right = new THREE.Vector3();
  const upv = new THREE.Vector3();
  const centre = new THREE.Vector3();
  const corner = new THREE.Vector3();
  const quad = (i) => {
    const [hw, hh] = half[i];
    let j = i * 12;
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      corner
        .copy(centre)
        .addScaledVector(right, sx * hw)
        .addScaledVector(upv, sy * hh);
      pos[j++] = corner.x;
      pos[j++] = corner.y;
      pos[j++] = corner.z;
    }
  };
  const last = new THREE.Quaternion(0, 0, 0, 0);
  const pv = new THREE.Vector3();
  return {
    group: g,
    /** The numbers' boxes on the screen (canvas pixels), for labels to keep clear of. */
    boxes(camera, width, height) {
      if (!g.visible) return [];
      const out = [];
      for (let i = 0; i < n; i++) {
        const b = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
        for (let j = 0; j < 4; j++) {
          pv.fromArray(pos, (i * 4 + j) * 3).project(camera);
          const x = (pv.x * 0.5 + 0.5) * width;
          const y = (-pv.y * 0.5 + 0.5) * height;
          b.left = Math.min(b.left, x);
          b.right = Math.max(b.right, x);
          b.top = Math.min(b.top, y);
          b.bottom = Math.max(b.bottom, y);
        }
        // the glyphs fill about the middle of their quads
        const sx = (b.right - b.left) * 0.15;
        const sy = (b.bottom - b.top) * 0.18;
        out.push({ left: b.left + sx, right: b.right - sx, top: b.top + sy, bottom: b.bottom - sy });
      }
      return out;
    },
    face(camera) {
      if (last.equals(camera.quaternion)) return;
      last.copy(camera.quaternion);
      right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      upv.set(0, 1, 0).applyQuaternion(camera.quaternion);
      down.copy(upv).negate(); // the screen's "down", in the world
      for (let i = 0; i <= max; i++) {
        centre.set(i, 0, z0).addScaledVector(down, RULER.below);
        quad(i);
      }
      centre.set(max, 0, z0).addScaledVector(down, RULER.below + RULER.unitBelow);
      quad(max + 1);
      posAttr.needsUpdate = true;
      geo.computeBoundingSphere();
    },
  };
}

/**
 * A tube along sampled points (from sampleTrail), built once; show(k) draws its first k segments. Frames are
 * carried along the path (parallel transport), so the tube does not twist, even where the tyre point stops.
 */
export function createTrail(points, { radius = 0.035, radial = 8, material, outline = null }) {
  const n = points.length / 3 - 1;
  const pos = new Float32Array((n + 1) * radial * 3);
  const P = (i) => new THREE.Vector3(points[i * 3], points[i * 3 + 1], points[i * 3 + 2]);
  const t = new THREE.Vector3(1, 0, 0);
  const tPrev = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  // the first tangent that is not zero
  for (let i = 0; i < n; i++) {
    v.copy(P(i + 1)).sub(P(i));
    if (v.lengthSq() > 1e-12) {
      t.copy(v).normalize();
      break;
    }
  }
  normal.set(0, 1, 0);
  if (Math.abs(normal.dot(t)) > 0.9) normal.set(0, 0, 1);
  normal.sub(v.copy(t).multiplyScalar(normal.dot(t))).normalize();
  for (let i = 0; i <= n; i++) {
    tPrev.copy(t);
    const a = P(Math.max(0, i - 1));
    const b = P(Math.min(n, i + 1));
    v.copy(b).sub(a);
    if (v.lengthSq() > 1e-12) t.copy(v).normalize();
    q.setFromUnitVectors(tPrev, t);
    normal.applyQuaternion(q);
    binormal.crossVectors(t, normal);
    const c = P(i);
    for (let j = 0; j < radial; j++) {
      const ang = (j / radial) * Math.PI * 2;
      v.copy(c)
        .addScaledVector(normal, Math.cos(ang) * radius)
        .addScaledVector(binormal, Math.sin(ang) * radius);
      pos.set([v.x, v.y, v.z], (i * radial + j) * 3);
    }
  }
  const idx = new Uint32Array(n * radial * 6);
  let k = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      idx.set([a, b, a + radial, b, b + radial, a + radial], k); // wound outwards: the normals point out
      k += 6;
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  geo.setDrawRange(0, 0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.userData.noExport = true;
  if (outline) {
    // the same tube, a little fatter, seen from inside: a dark rim round it (it shares the draw range)
    const rim = new THREE.Mesh(geo, outline);
    rim.frustumCulled = false;
    rim.name = 'Outline';
    rim.renderOrder = material.depthTest ? 0 : 4.9;
    mesh.add(rim);
  }
  return {
    mesh,
    show(count) {
      geo.setDrawRange(0, Math.max(0, Math.min(n, Math.floor(count))) * radial * 6);
    },
  };
}

/**
 * A dark outline material for a trail, an arrowhead or a ring: drawn from inside, pushed out along the normals
 * by `width` metres. depthTest as the thing it outlines.
 */
export function outlineMaterial({ width = 0.024, color = '#141a22', depthTest = true } = {}) {
  const m = new THREE.MeshBasicMaterial({ name: 'Outline', color, side: THREE.BackSide, depthTest, toneMapped: false });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.outlineWidth = { value: width };
    shader.vertexShader = `uniform float outlineWidth;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\ntransformed += normalize(normal) * outlineWidth;',
    );
  };
  m.customProgramCacheKey = () => `outline-${width}`;
  return m;
}

/** A copy of a geometry with smooth normals (one per position), so pushing it out along them leaves no cracks. */
export function smoothNormals(geo) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', geo.attributes.position.clone());
  if (geo.index) g.setIndex(geo.index.clone());
  const merged = mergeVertices(g, 1e-5);
  merged.computeVertexNormals();
  return merged;
}
