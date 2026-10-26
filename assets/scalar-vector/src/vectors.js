// The arrows on the field (ভেক্টর): the kit's 3D arrow lying on the grass, with a white band every 10 m so its মান can
// be counted against the scale bar, an invisible hit box a finger finds, and the translucent copy that slides onto
// another arrow's tail to compare the two. Also the orange arc between two দিক. Scene units: metres.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
import { components } from './reading.js';
import { COLORS, P } from './field.js';

export const ARROW = { radius: 1.1, head: 6.2, headRadius: 2.9 };
const LIFT = ARROW.headRadius * 0.55; // the arrow's axis above the grass (the head just touches it)
const TICK = 10; // m between the bands

/**
 * One arrow on the field. set(v, f, lift): the vector { tail: [x, y], length, angle } drawn `f` (0…1) of the way from
 * its tail, `lift` metres higher than usual (the copy that slides).
 */
export function createFieldArrow({ name = 'Arrow', color = COLORS.vector, opacity = 1, ticks = true, hit = true } = {}) {
  const arrow = createArrow({ color, ...ARROW, opacity, name: `${name}Body`, segments: 14 });
  arrow.material.emissiveIntensity = 0.12;
  const root = new THREE.Group(); // the arrow you see, and beside it (not inside) its hit box
  root.name = name;
  root.add(arrow.root);
  let bands = null;
  if (ticks) {
    bands = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(ARROW.radius * 1.14, ARROW.radius * 1.14, 0.55, 14),
      new THREE.MeshStandardMaterial({ name: `${name}Band`, color: '#ffffff', roughness: 0.5, transparent: opacity < 1, opacity }),
      6,
    );
    bands.name = `${name}Bands`;
    bands.count = 0;
    arrow.root.add(bands);
  }
  let box = null;
  if (hit) {
    box = new THREE.Mesh(new THREE.BoxGeometry(7, 1, 7), new THREE.MeshBasicMaterial({ visible: false }));
    box.userData.noExport = true;
    box.name = `${name}Hit`;
    root.add(box);
  }
  const state = { v: null, f: 0, lift: 0 };
  const from = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const tip = new THREE.Vector3();
  const m4 = new THREE.Matrix4();

  function set(v, f = 1, lift = 0) {
    state.v = v;
    state.f = f;
    state.lift = lift;
    const len = v.length * Math.max(0, Math.min(1, f));
    const [cx, cy] = components(1, v.angle);
    P(v.tail[0], v.tail[1], LIFT + lift, from);
    dir.set(cx, 0, -cy);
    arrow.set(from, dir, len);
    tip.copy(arrow.tip);
    mid.copy(from).addScaledVector(dir, len / 2);
    if (bands) {
      // a band at every 10 m that is on the shaft (not on the head)
      let n = 0;
      for (let d = TICK; d < len - Math.min(arrow.head, len * 0.6) - 0.6 && n < 6; d += TICK) {
        m4.makeTranslation(0, d, 0);
        bands.setMatrixAt(n++, m4);
      }
      bands.count = n;
      bands.instanceMatrix.needsUpdate = true;
    }
    if (box) {
      box.position.copy(mid);
      box.quaternion.copy(arrow.root.quaternion);
      box.scale.set(1, Math.max(0.01, len), 1);
      box.visible = arrow.root.visible && len > 0.5;
    }
  }

  return {
    root,
    arrow,
    /** The arrow you see (shaft, head, bands): what the action's marker fits round. */
    body: arrow.root,
    hit: box,
    set,
    /** The vector it shows now, or null. */
    get vector() {
      return arrow.root.visible ? state.v : null;
    },
    get visible() {
      return arrow.root.visible;
    },
    /** World point at the middle of what is drawn (for its name). */
    middle: () => mid,
    /** World point at the tip. */
    tip: () => tip,
    setOpacity(a) {
      arrow.setOpacity(a);
      if (bands) {
        bands.material.opacity = a * opacity;
        bands.material.transparent = a * opacity < 1;
      }
    },
    hide() {
      arrow.hide();
      if (box) box.visible = false;
      state.v = null;
    },
  };
}

/** The orange arc between two দিক (map degrees) round a map point: the angle that makes two arrows differ. */
export function createArc({ color = COLORS.direction, name = 'DirectionArc' } = {}) {
  const mat = new THREE.MeshBasicMaterial({ name, color, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.name = name;
  mesh.renderOrder = 2;
  mesh.visible = false;
  let drawn = '';
  /** @type {THREE.Vector3[]} */
  const pts = [];
  const mid = new THREE.Vector3();
  return {
    mesh,
    /** The arc at map point `at`, from a0 to a1 degrees (the short way), radius r; opacity 0 hides it. */
    set(at, a0, a1, r = 10, opacity = 1) {
      mesh.visible = opacity > 0.01;
      mat.opacity = opacity;
      let d = ((((a1 - a0) % 360) + 540) % 360) - 180; // the short way, −180…180
      const start = d >= 0 ? a0 : a0 + d;
      d = Math.abs(d);
      const key = `${at}|${start}|${d}|${r}`;
      if (key !== drawn) {
        drawn = key;
        mesh.geometry.dispose();
        mesh.geometry = new THREE.RingGeometry(
          r - 0.5,
          r + 0.5,
          Math.max(8, Math.round(d / 3)),
          1,
          (start * Math.PI) / 180,
          (d * Math.PI) / 180,
        ).rotateX(-Math.PI / 2);
        mesh.position.copy(P(at[0], at[1], 0.12));
        const m = ((start + d / 2) * Math.PI) / 180;
        P(at[0] + (r + 0.8) * Math.cos(m), at[1] + (r + 0.8) * Math.sin(m), 0.5, mid);
        pts.length = 0;
        for (let a = 0; a <= d + 1e-6; a += Math.max(5, d / 8)) {
          const ra = ((start + a) * Math.PI) / 180;
          pts.push(P(at[0] + r * Math.cos(ra), at[1] + r * Math.sin(ra), 0.3));
        }
      }
    },
    /** Points along the arc (world), for labels to keep off it. */
    points: () => pts,
    /** The middle of the arc (world), for its label. */
    middle: () => mid,
    hide() {
      mesh.visible = false;
    },
  };
}
