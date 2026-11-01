// The setting and the marks on the ground: a plain sandy field under a soft sky, the start line, boy 1's zig-zag
// path (the part run drawn blue, দূরত্ব), boy 2's straight line (orange, সরণ), the east line and the angle arc.
// Map coordinates e (east), n (north) → three.js x = e, z = -n.
import * as THREE from 'three';
import { PATH, START } from './motion.js';

const at = (e, n, h = 0) => new THREE.Vector3(e, h, -n);
const Y = { edge: 0.012, line: 0.02, top: 0.028 }; // heights of the marks, so they never flicker into the ground

/** A canvas texture made once: the sky, light blue at the top to a warm haze at the horizon. */
export function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#8fbfe8');
  grad.addColorStop(0.7, '#cfe2f1');
  grad.addColorStop(1, '#f3e3cc');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Sandy ground with a little grain, tiling (256 px, made once). */
function groundTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#d8b98c';
  g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 2600; i++) {
    const v = rnd();
    g.fillStyle = v < 0.5 ? 'rgba(150,110,70,0.16)' : 'rgba(255,240,215,0.22)';
    const r = 0.6 + rnd() * 1.6;
    g.fillRect(rnd() * 256, rnd() * 256, r, r);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = 4;
  return tex;
}

/** A flat strip along a polyline (map points), `width` wide, as separate quads so a draw range can reveal it. */
function stripGeometry(points, width, step = 0.08) {
  // resample evenly so the revealed part follows the runner smoothly
  const pts = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const n = Math.max(1, Math.ceil(Math.hypot(b.e - a.e, b.n - a.n) / step));
    for (let j = i === 1 ? 0 : 1; j <= n; j++) pts.push({ e: a.e + ((b.e - a.e) * j) / n, n: a.n + ((b.n - a.n) * j) / n });
  }
  const pos = [];
  const lengths = [0];
  const half = width / 2;
  const side = (i) => {
    const p = pts[Math.max(0, i - 1)];
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(q.e - p.e, q.n - p.n) || 1;
    return { e: -(q.n - p.n) / l, n: (q.e - p.e) / l };
  };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const sa = side(i - 1);
    const sb = side(i);
    const v = [
      [a.e + sa.e * half, a.n + sa.n * half],
      [a.e - sa.e * half, a.n - sa.n * half],
      [b.e + sb.e * half, b.n + sb.n * half],
      [b.e - sb.e * half, b.n - sb.n * half],
    ];
    for (const j of [0, 1, 2, 2, 1, 3]) pos.push(v[j][0], 0, -v[j][1]);
    lengths.push(lengths[lengths.length - 1] + Math.hypot(b.e - a.e, b.n - a.n));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return { geo, lengths };
}

const flat = (color, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });

export function createField({ colors, background = true }) {
  const root = new THREE.Group();
  root.name = 'Field';

  if (background) {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(60, 48).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ name: 'Ground', map: groundTexture(), roughness: 1, metalness: 0 }),
    );
    ground.name = 'Ground';
    ground.receiveShadow = true;
    ground.userData.noExport = true; // the GLB holds the boys and the marks, not the whole field
    root.add(ground);
  }

  // the start line, chalk white, across both starting places
  const startLine = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 5).rotateX(-Math.PI / 2), flat('#ffffff'));
  startLine.position.copy(at(-0.45, 0, Y.line));
  root.add(startLine);

  // boy 1's path: the whole way faint, the part run blue with a white edge
  const wide = stripGeometry(PATH, 0.3);
  const thin = stripGeometry(PATH, 0.18);
  const pathAhead = new THREE.Mesh(thin.geo, flat(colors.distance, 0.28));
  pathAhead.position.y = Y.line - 0.004;
  const pathEdge = new THREE.Mesh(wide.geo, flat('#ffffff'));
  pathEdge.position.y = Y.edge;
  const pathRun = new THREE.Mesh(thin.geo.clone(), flat(colors.distance));
  pathRun.position.y = Y.top;
  root.add(pathAhead, pathEdge, pathRun);
  const lengths = thin.lengths; // units along the path at the end of each quad

  // boy 2's straight line (unit long along +x, turned and stretched): faint ahead, orange where run
  const unitStrip = (w) => new THREE.PlaneGeometry(1, w).rotateX(-Math.PI / 2).translate(0.5, 0, 0);
  const lineGroup = new THREE.Group();
  lineGroup.position.copy(at(START.two.e, START.two.n));
  const lineAhead = new THREE.Mesh(unitStrip(0.18), flat(colors.displacement, 0.28));
  lineAhead.position.y = Y.line - 0.004;
  const lineEdge = new THREE.Mesh(unitStrip(0.3), flat('#ffffff'));
  lineEdge.position.y = Y.edge;
  const lineRun = new THREE.Mesh(unitStrip(0.18), flat(colors.displacement));
  lineRun.position.y = Y.top;
  lineGroup.add(lineAhead, lineEdge, lineRun);
  root.add(lineGroup);

  // the east line (dashed, dark) from boy 2's start, and the arc of the angle
  const EAST = 3.2;
  const dashes = [];
  for (let x = 0.15; x < EAST; x += 0.36) {
    const g = new THREE.PlaneGeometry(0.2, 0.07).rotateX(-Math.PI / 2);
    g.translate(x + 0.1, 0, 0);
    dashes.push(g);
  }
  const dashGeo = new THREE.BufferGeometry();
  {
    const all = dashes.flatMap((g) => Array.from(g.toNonIndexed().attributes.position.array));
    dashGeo.setAttribute('position', new THREE.Float32BufferAttribute(all, 3));
  }
  const ink = flat(colors.ink);
  const east = new THREE.Mesh(dashGeo, ink);
  east.position.copy(at(START.two.e, START.two.n, Y.line));
  root.add(east);
  const ARC_R = 1.3;
  const arc = new THREE.Mesh(new THREE.BufferGeometry(), ink);
  arc.position.copy(at(START.two.e, START.two.n, Y.top + 0.004));
  root.add(arc);

  let lastAngle = null;
  function setAngle(angle) {
    lineGroup.rotation.y = (angle * Math.PI) / 180;
    if (angle === lastAngle) return;
    lastAngle = angle;
    arc.geometry.dispose();
    arc.geometry = new THREE.RingGeometry(
      ARC_R - 0.09,
      ARC_R + 0.09,
      Math.max(4, Math.round(angle / 6)),
      1,
      0,
      (Math.max(angle, 0.5) * Math.PI) / 180,
    ).rotateX(-Math.PI / 2);
  }

  return {
    root,
    setAngle,
    /** How far each boy has run, in units: the coloured parts follow them. */
    setRun(u1, u2, total2) {
      let quads = 0;
      while (quads < lengths.length - 1 && lengths[quads + 1] <= u1 + 1e-6) quads++;
      pathRun.geometry.setDrawRange(0, quads * 6);
      pathEdge.geometry.setDrawRange(0, quads * 6);
      const l2 = Math.max(0.001, u2);
      lineRun.scale.x = lineEdge.scale.x = l2;
      lineEdge.visible = lineRun.visible = u2 > 0.01;
      lineAhead.scale.x = total2;
      pathRun.visible = pathEdge.visible = quads > 0;
    },
    points: {
      east: () => at(START.two.e + EAST + 0.2, START.two.n, 0.05),
      arc: (angle) => {
        const a = ((angle / 2) * Math.PI) / 180;
        return at(START.two.e + (ARC_R + 1.6) * Math.cos(a), START.two.n + (ARC_R + 1.6) * Math.sin(a), 0.05);
      },
    },
  };
}
