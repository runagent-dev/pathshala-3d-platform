// The lesson's arrows: bold, in a flat colour inside a dark edge inside a white halo, drawn over the scenery (no depth
// test), so a gold push never melts into the wooden boat and a violet pull stays clear against space. The two forces of
// a pair are the same kind of force, so they have the same colour; one is drawn solid and the other dashed (with the
// same swatch in its label), so they are told apart by more than colour. The halo and the edge follow each dash and
// the head, a little longer and wider, so every end is outlined.
//
//   const a = createLessonArrow({ name, color, dashed });
//   a.set(from, dir, length);   // head included; length 0 hides it
//   a.tip, a.root, a.material, a.hide()
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const SIZE = { radius: 0.043, headRadius: 0.11, head: 0.23, dash: 0.12, gap: 0.075, max: 12 };
const MATERIALS = new Map();
/** A flat, unlit material that draws over everything (shared per colour). */
function flat(color) {
  if (!MATERIALS.has(color))
    MATERIALS.set(
      color,
      new THREE.MeshBasicMaterial({ name: `Arrow${color}`, color, depthTest: false, depthWrite: false, toneMapped: false, fog: false }),
    );
  return MATERIALS.get(color);
}
const GEOMETRY = new Map();
function geometry(key, make) {
  if (!GEOMETRY.has(key)) GEOMETRY.set(key, make());
  return GEOMETRY.get(key);
}

/** One layer of the arrow (`pad` wider than the colour all round): a shaft (or its dashes) and a cone. */
function layer(material, pad, dashed, order) {
  const r = SIZE.radius + pad;
  const coneH = SIZE.head + pad * 2.8;
  const unit = geometry(`shaft${r}`, () => new THREE.CylinderGeometry(r, r, 1, 12).translate(0, 0.5, 0));
  const coneGeo = geometry(`cone${pad}`, () => new THREE.ConeGeometry(SIZE.headRadius + pad * 2, coneH, 20).translate(0, coneH / 2, 0));
  const group = new THREE.Group();
  const shafts = Array.from({ length: dashed ? SIZE.max : 1 }, () => new THREE.Mesh(unit, material));
  const cone = new THREE.Mesh(coneGeo, material);
  for (const m of [...shafts, cone]) {
    m.renderOrder = order;
    m.frustumCulled = false;
    group.add(m);
  }
  return {
    group,
    /** body: the shaft's length; h: the head's (shorter than SIZE.head on a short arrow). */
    place(body, h) {
      const s = h / SIZE.head;
      cone.scale.setScalar(s);
      cone.position.y = body - pad * s;
      if (!dashed) {
        shafts[0].visible = body > 1e-6;
        shafts[0].position.y = -pad;
        shafts[0].scale.set(1, Math.max(body + pad, 1e-6), 1);
        return;
      }
      let y = 0;
      for (const m of shafts) {
        if (y >= body - 1e-6) {
          m.visible = false;
          continue;
        }
        const len = Math.min(SIZE.dash, body - y);
        m.visible = true;
        m.position.y = y - pad;
        m.scale.set(1, len + 2 * pad, 1);
        y += SIZE.dash + SIZE.gap;
      }
    },
  };
}

/**
 * @param {{ name: string, color: string, dashed?: boolean, edge?: string, halo?: string | null }} options
 *   edge: the dark outline's colour; halo: the outer rim's (null: none).
 */
export function createLessonArrow({ name, color, dashed = false, edge = '#142b46', halo = '#ffffff' }) {
  const root = new THREE.Group();
  root.name = name;
  root.visible = false;
  root.userData.noExport = true;
  const material = new THREE.MeshBasicMaterial({ name: `${name}Colour`, color, depthTest: false, depthWrite: false, toneMapped: false, fog: false });
  const layers = [...(halo ? [layer(flat(halo), 0.042, dashed, 8)] : []), layer(flat(edge), 0.02, dashed, 9), layer(material, 0, dashed, 10)];
  for (const l of layers) root.add(l.group);
  const tip = new THREE.Vector3();
  const d = new THREE.Vector3();
  return {
    root,
    material,
    tip,
    set(from, dir, length) {
      tip.copy(from);
      const n = dir.length();
      root.visible = length > 1e-9 && n > 1e-12;
      if (!root.visible) return;
      d.copy(dir).divideScalar(n);
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(UP, d);
      const h = Math.min(SIZE.head, length * 0.6);
      for (const l of layers) l.place(length - h, h);
      tip.addScaledVector(d, length);
    },
    hide() {
      root.visible = false;
    },
  };
}
