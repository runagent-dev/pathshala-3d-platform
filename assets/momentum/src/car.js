// The small car (ছোট গাড়ি): a red hatchback, 3.5 m long, 1.62 m wide, 1.5 m tall, in real metres. Origin on the
// ground under its back end, +x forward, +y up. Every body panel is built in the car's own frame, so crumple(c)
// can push the back end in by c metres and fold the panels behind the rear wheels, like a real crumple zone (the
// rear glass cracks when the dent is deep). The wheels never bend. roll(m) turns them.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const CAR = { length: 3.5, width: 1.62, height: 1.5, wheel: 0.29, axles: [0.66, 2.86] };

const mat = (name, color, roughness = 0.6, metalness = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness, metalness, ...extra });

/** A box made of many small faces (so it can bend), its vertices moved by shape(v) in the car's frame. */
function shapedBox(w, h, d, segs, center, shape) {
  const g = new THREE.BoxGeometry(w, h, d, ...segs);
  g.translate(center.x, center.y, center.z);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    shape(v);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function crackedGlass(base) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(235, 242, 248, 0.85)';
  ctx.lineWidth = 1.6;
  let s = 11;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + r() * 0.3;
    ctx.beginPath();
    ctx.moveTo(64, 70);
    let x = 64;
    let y = 70;
    for (let k = 0; k < 4; k++) {
      x += Math.cos(a + (r() - 0.5) * 0.6) * 18;
      y += Math.sin(a + (r() - 0.5) * 0.6) * 18;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (const rad of [14, 30]) {
    ctx.beginPath();
    ctx.arc(64, 70, rad, 0, Math.PI * 2);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createCar({ name = 'SmallCar', color = '#c8423a' } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const M = {
    paint: mat('CarPaint', color, 0.32, 0.25),
    glass: mat('CarGlass', '#2c3944', 0.1, 0.45),
    cracked: mat('CrackedGlass', '#ffffff', 0.3, 0.1, { map: crackedGlass('#3a4752') }),
    trim: mat('Trim', '#41464d', 0.55, 0.2),
    tyre: mat('Tyre', '#23262a', 0.88),
    hub: mat('HubCap', '#c9ced4', 0.3, 0.8),
    tail: mat('TailLamp', '#d0322a', 0.3, 0, { emissive: '#8f1a14', emissiveIntensity: 0.35 }),
    head: mat('Headlamp', '#fff6d8', 0.2, 0, { emissive: '#fff1c4', emissiveIntensity: 0.3 }),
    plate: mat('Plate', '#f4f4f0', 0.6),
  };
  const L = CAR.length;
  const smooth = THREE.MathUtils.smoothstep;
  const parts = []; // meshes that crumple: { mesh, base: Float32Array }

  // the lower body: rounded corners seen from above, a sloping bonnet, ends tucked in at the bottom
  const lower = shapedBox(L, 0.62, CAR.width, [28, 4, 6], new THREE.Vector3(L / 2, 0.55, 0), (v) => {
    const end = Math.max(smooth(0.28 - v.x, 0, 0.28), smooth(v.x - (L - 0.32), 0, 0.32)); // 0 mid, 1 at an end
    v.z *= 1 - 0.1 * end * end;
    const top = v.y > 0.6;
    if (top) v.y -= 0.1 * smooth(v.x, L - 0.95, L) + 0.03 * smooth(0.3 - v.x, 0, 0.3); // bonnet slope, rounded tail
    if (v.y < 0.4) v.y += 0.07 * end;
  });
  // the cabin: sloping windscreen and hatch, narrower at the roof
  const cabin = shapedBox(2.3, 0.62, 1.5, [16, 3, 4], new THREE.Vector3(1.38, 1.17, 0), (v) => {
    const k = (v.y - 0.86) / 0.62; // 0 at the waist, 1 at the roof
    if (v.x > 1.5)
      v.x = 1.5 + (v.x - 1.5) * (1 - 0.62 * k); // the windscreen leans back
    else v.x = 1.5 - (1.5 - v.x) * (1 - 0.22 * k); // the hatch leans forward a little
    v.z *= 1 - 0.13 * k;
  });
  const addPart = (geo, m, nm) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.name = nm;
    root.add(mesh);
    parts.push({ mesh, base: Float32Array.from(geo.attributes.position.array) });
    return mesh;
  };
  addPart(lower, M.paint, 'Body');
  addPart(cabin, M.glass, 'Cabin');
  // the roof and the pillars in the body colour
  addPart(
    shapedBox(1.4, 0.06, 1.32, [10, 1, 2], new THREE.Vector3(1.2, 1.49, 0), () => {}),
    M.paint,
    'Roof',
  );
  const pillar = (x0, y0, x1, y1, z, nm) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const g = new THREE.BoxGeometry(0.08, len, 0.06, 1, 4, 1);
    g.rotateZ(-Math.atan2(x1 - x0, y1 - y0));
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, z);
    addPart(g, M.paint, nm);
  };
  for (const s of [-1, 1]) {
    const zb = s * 0.75;
    const zt = s * 0.66;
    pillar(2.55, 0.88, 1.9, 1.47, (zb + zt) / 2, 'APillar');
    pillar(1.45, 0.88, 1.42, 1.47, (zb + zt) / 2, 'BPillar');
    pillar(0.25, 0.88, 0.5, 1.47, (zb + zt) / 2, 'CPillar');
  }
  // the hatch's rear glass: it cracks when the dent is deep
  const rearGlass = addPart(
    shapedBox(0.04, 0.5, 1.22, [1, 4, 4], new THREE.Vector3(0.215, 1.16, 0), (v) => (v.x += (v.y - 0.91) * 0.45)),
    M.glass,
    'RearGlass',
  );
  // bumpers, lamps, the number plate
  addPart(new RoundedBoxGeometry(0.16, 0.24, 1.66, 2, 0.05).translate(0.04, 0.36, 0), M.trim, 'RearBumper');
  addPart(new RoundedBoxGeometry(0.16, 0.24, 1.66, 2, 0.05).translate(L - 0.04, 0.36, 0), M.trim, 'FrontBumper');
  for (const s of [-1, 1]) {
    addPart(new THREE.BoxGeometry(0.05, 0.17, 0.24).translate(0.02, 0.72, s * 0.6), M.tail, 'TailLamp');
    addPart(new THREE.BoxGeometry(0.05, 0.13, 0.28).translate(L - 0.02, 0.7, s * 0.58), M.head, 'Headlamp');
    addPart(new RoundedBoxGeometry(0.12, 0.09, 0.08, 1, 0.02).translate(2.42, 0.98, s * 0.86), M.trim, 'Mirror');
  }
  addPart(new THREE.BoxGeometry(0.02, 0.13, 0.42).translate(-0.01, 0.55, 0), M.plate, 'Plate');

  // wheels (they do not bend)
  const wheels = [];
  const tyreGeo = new THREE.CylinderGeometry(CAR.wheel, CAR.wheel, 0.2, 24).rotateX(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.21, 16).rotateX(Math.PI / 2);
  for (const x of CAR.axles)
    for (const s of [-1, 1]) {
      const w = new THREE.Group();
      w.name = 'Wheel';
      w.position.set(x, CAR.wheel, s * 0.7);
      w.add(new THREE.Mesh(tyreGeo, M.tyre), new THREE.Mesh(hubGeo, M.hub));
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.22), M.trim);
      w.add(spoke);
      root.add(w);
      wheels.push(w);
    }

  // a big invisible box round it, for taps
  const hit = new THREE.Mesh(new THREE.BoxGeometry(L + 0.4, 1.7, CAR.width + 0.4), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(L / 2, 0.8, 0);
  hit.userData.noExport = true;
  hit.name = 'CarHit';
  root.add(hit);

  let dent = -1;
  /**
   * Push the back end in by c m: the crumple zone grows with the dent; points near the end move almost by c,
   * points past the zone stay; the panels fold in small waves and bulge out a little.
   */
  function crumple(c) {
    c = Math.max(0, c);
    if (Math.abs(c - dent) < 1e-4) return;
    dent = c;
    const span = 0.35 + 2.2 * c;
    const fold = Math.min(0.09, 0.4 * c);
    const bulge = 0.08 * Math.min(1, c / 0.2);
    // a deep dent knocks the rear bumper loose: one end hangs down
    const hang = 0.24 * THREE.MathUtils.smoothstep(c, 0.08, 0.25);
    for (const { mesh, base } of parts) {
      const p = mesh.geometry.attributes.position;
      const a = p.array;
      const bumper = mesh.name === 'RearBumper';
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        const z = base[i * 3 + 2];
        if (x >= span || c === 0) {
          a[i * 3] = x;
          a[i * 3 + 1] = y;
          a[i * 3 + 2] = z;
          continue;
        }
        const w = 1 - Math.max(0, x) / span;
        const k = w ** 1.4;
        const wave = Math.sin(x * 15 + y * 9 + z * 3);
        a[i * 3] = x + c * k;
        // the panels fold (up and down, in and out), the hatch buckles up, the bumper sags
        a[i * 3 + 1] =
          y +
          (y > 0.32 ? fold * wave * w : 0) +
          (y > 0.8 ? 0.45 * c * k : 0) -
          (y < 0.5 ? 0.25 * c * k : 0) -
          (bumper ? (hang * (z + CAR.width / 2)) / CAR.width : 0);
        a[i * 3 + 2] = z * (1 + bulge * w) + Math.sign(z) * fold * 0.7 * Math.cos(x * 13 + y * 7) * w;
      }
      p.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
    }
    rearGlass.material = c > 0.09 ? M.cracked : M.glass;
  }

  return {
    root,
    hit,
    crumple,
    /** Turn the wheels for `distance` m (positive forward). A skidding car's wheels are locked: pass the same value. */
    roll(distance) {
      for (const w of wheels) w.rotation.z = -distance / CAR.wheel;
    },
    get dent() {
      return Math.max(0, dent);
    },
  };
}
