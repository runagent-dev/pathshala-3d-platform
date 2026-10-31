// The bucket (metres): a big yellow plastic bucket (it holds up to 14 litres here) with ribs, a rolled rim and a steel bail handle, water inside
// whose level shows how much it holds, and drops that fall from it while it rises out of the well. The group's origin
// is the middle of the bucket's bottom; the rope ties to the top of the handle (KNOT above the origin).
import * as THREE from 'three';
import { BUCKET } from './reading.js';

export const BUCKET_SIZE = { rBottom: 0.15, rTop: 0.195, h: 0.37 };
/** Where the rope is tied: the top of the handle, above the bucket's bottom. */
export const KNOT = BUCKET_SIZE.h + 0.13;
const LITRES = 15;

export function createBucket() {
  const root = new THREE.Group();
  root.name = 'Bucket';
  const { rBottom, rTop, h } = BUCKET_SIZE;
  const plastic = new THREE.MeshPhysicalMaterial({
    name: 'YellowPlastic',
    color: '#f5b80f',
    roughness: 0.38,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.35,
    side: THREE.DoubleSide,
  });
  const plasticDark = new THREE.MeshStandardMaterial({ name: 'BucketRib', color: '#d99a05', roughness: 0.45 });
  const steel = new THREE.MeshStandardMaterial({ name: 'Steel', color: '#c9ced4', roughness: 0.25, metalness: 0.9 });
  const waterMat = new THREE.MeshPhysicalMaterial({
    name: 'BucketWater',
    color: '#2a86a8',
    roughness: 0.05,
    clearcoat: 1,
    transparent: true,
    opacity: 0.9,
  });
  const mesh = (g, m, name) => {
    const o = new THREE.Mesh(g, m);
    o.name = name;
    o.castShadow = true;
    o.receiveShadow = true;
    root.add(o);
    return o;
  };
  // the body: an open cone with a thick wall, its bottom a little recessed
  const wall = 0.006;
  mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0, 0.012),
        new THREE.Vector2(rBottom - 0.012, 0.012),
        new THREE.Vector2(rBottom - 0.004, 0),
        new THREE.Vector2(rBottom, 0.006),
        new THREE.Vector2(rTop, h),
        new THREE.Vector2(rTop - wall, h),
        new THREE.Vector2(rBottom - wall, 0.02),
        new THREE.Vector2(0, 0.02),
      ],
      48,
    ),
    plastic,
    'BucketBody',
  );
  // the rolled rim and three ribs round the body
  const rimRing = mesh(new THREE.TorusGeometry(rTop + 0.004, 0.011, 10, 48), plasticDark, 'BucketRim');
  rimRing.rotation.x = Math.PI / 2;
  rimRing.position.y = h;
  for (const k of [0.25, 0.55, 0.82]) {
    const r = rBottom + (rTop - rBottom) * k + 0.003;
    const rib = mesh(new THREE.TorusGeometry(r, 0.0045, 6, 48), plasticDark, 'BucketRib');
    rib.rotation.x = Math.PI / 2;
    rib.position.y = h * k;
  }
  // the handle: two lugs and a steel bail over the top, with a plastic grip in the middle
  for (const side of [-1, 1]) {
    const lug = mesh(new THREE.BoxGeometry(0.02, 0.05, 0.035), plasticDark, 'HandleLug');
    lug.position.set(side * (rTop + 0.008), h - 0.035, 0);
  }
  const bail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-(rTop + 0.016), h - 0.03, 0),
    new THREE.Vector3(-(rTop - 0.01), h + 0.06, 0),
    new THREE.Vector3(-0.07, KNOT - 0.01, 0),
    new THREE.Vector3(0, KNOT, 0),
    new THREE.Vector3(0.07, KNOT - 0.01, 0),
    new THREE.Vector3(rTop - 0.01, h + 0.06, 0),
    new THREE.Vector3(rTop + 0.016, h - 0.03, 0),
  ]);
  mesh(new THREE.TubeGeometry(bail, 48, 0.0042, 8, false), steel, 'Bail');
  const grip = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 14), plasticDark, 'HandleGrip');
  grip.rotation.z = Math.PI / 2;
  grip.position.y = KNOT - 0.006;

  // the water: a disc at its level (a litre is a kilogram), with a dark ring where it meets the plastic
  const water = mesh(new THREE.CircleGeometry(1, 48), waterMat, 'WaterInBucket');
  water.rotation.x = -Math.PI / 2;
  water.castShadow = false;
  /** The water's height for `litres` (the cone's volume up to that height). */
  const levelFor = (litres) => {
    const target = Math.max(0, litres) / 1000; // m³
    let lo = 0;
    let hi = h - 0.02;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      const r1 = rBottom - wall;
      const r2 = r1 + ((rTop - rBottom) * mid) / h;
      const vol = (Math.PI * mid * (r1 * r1 + r1 * r2 + r2 * r2)) / 3;
      if (vol < target) lo = mid;
      else hi = mid;
    }
    return 0.02 + lo;
  };

  // drops falling from the bottom while the bucket rises out of the water (placed by drip())
  const drops = [];
  const dropMat = new THREE.MeshPhysicalMaterial({ name: 'Drop', color: '#7cc6e0', roughness: 0.05, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), dropMat);
    d.scale.y = 1.5;
    d.visible = false;
    d.userData.noExport = true;
    root.add(d);
    drops.push({ mesh: d, x: (Math.random() - 0.5) * rBottom * 1.4, z: (Math.random() - 0.5) * rBottom, phase: i / 6 });
  }

  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop + 0.06, rBottom + 0.06, KNOT + 0.08, 16),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.position.y = (KNOT + 0.08) / 2 - 0.04;
  hit.userData.noExport = true;
  root.add(hit);

  return {
    root,
    hit,
    /** The bucket with its water weighs M kg: the water level follows (the empty bucket is BUCKET kg). */
    setMass(M) {
      const litres = Math.min(LITRES, Math.max(0, M - BUCKET));
      const y = levelFor(litres);
      const r = rBottom - wall + ((rTop - rBottom) * (y - 0.02)) / h;
      water.position.y = y;
      water.scale.setScalar(Math.max(0.001, r));
      water.visible = litres > 0.05;
    },
    /** Drops under the bucket: `time` in s (drives the fall), `on` while it has just left the water. */
    drip(time, on) {
      for (const d of drops) {
        if (!on) {
          d.mesh.visible = false;
          continue;
        }
        const k = (time * 1.6 + d.phase) % 1;
        d.mesh.visible = true;
        d.mesh.position.set(d.x, -0.02 - k * k * 0.5, d.z);
      }
    },
    /** The bucket's box (world), for labels and the camera. */
    box: (() => {
      const b = new THREE.Box3();
      return () => {
        b.makeEmpty();
        root.updateWorldMatrix(true, true);
        for (const c of root.children) if (c !== hit && c.visible && !drops.some((d) => d.mesh === c)) b.expandByObject(c);
        return b;
      };
    })(),
  };
}
