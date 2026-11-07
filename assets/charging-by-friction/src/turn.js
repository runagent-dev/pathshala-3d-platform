// How far the hanging rod has turned, as the book draws it: a dashed line where the rod hung at rest, and a small curved
// arrow on its plain half from that line to the rod. Flat, white in a dark edge, drawn over the scene. One mark, moved to
// the stand in view. The arc is one fixed geometry shown up to the angle (drawRange), so nothing is rebuilt per frame.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const flat = (color, opacity = 1) =>
  new THREE.MeshBasicMaterial({
    color,
    opacity,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });

const MAX = (70 * Math.PI) / 180;
const SEGMENTS = 56;
const SHOW_FROM = (3 * Math.PI) / 180;

/** A ring sector in the rod's plane: angle a turns +x as rotation.y does, to (cos a, 0, −sin a). */
function arc(radius, width) {
  const pos = [];
  const idx = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const a = (i / SEGMENTS) * MAX;
    const c = Math.cos(a);
    const s = Math.sin(a);
    pos.push((radius - width / 2) * c, 0, -(radius - width / 2) * s, (radius + width / 2) * c, 0, -(radius + width / 2) * s);
    if (i < SEGMENTS) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

/** An arrowhead lying flat, pointing along −z (the way the arc runs at angle 0), its tip at the origin. */
function head(len, half) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -half, 0, len, half, 0, len], 3));
  g.setIndex([0, 1, 2]);
  return g;
}

/**
 * createTurnMark({ half, radius }) → { root, set(position, theta) , hide(), ends(a, b) }. `half`: half the rod's length;
 * `radius`: how far from the thread the arc runs (on the plain half, clear of the rod in the hand).
 */
export function createTurnMark({ half, radius = 0.116 }) {
  const root = new THREE.Group();
  root.name = 'TurnMark';
  root.userData.noExport = true;
  root.visible = false;

  // the rest line: dashes along x
  const dashes = [];
  for (let x = -half; x < half; x += 0.024) dashes.push(new THREE.PlaneGeometry(0.014, 0.0034).rotateX(-Math.PI / 2).translate(x + 0.007, 0, 0));
  const rest = new THREE.Mesh(mergeGeometries(dashes), flat('#ffffff', 0.9));
  rest.name = 'RestLine';
  rest.renderOrder = 12;

  const turn = new THREE.Group(); // scale.z −1 mirrors the mark for a turn the other way
  const width = 0.0046;
  const edgeArc = new THREE.Mesh(arc(radius, width + 0.0034), flat('#10213a'));
  const coreArc = new THREE.Mesh(arc(radius, width), flat('#ffffff'));
  const edgeHead = new THREE.Mesh(head(0.025, 0.014), flat('#10213a'));
  const coreHead = new THREE.Mesh(head(0.02, 0.0105), flat('#ffffff'));
  edgeArc.renderOrder = 36;
  edgeHead.renderOrder = 36;
  coreArc.renderOrder = 37;
  coreHead.renderOrder = 37;
  const tip = new THREE.Group();
  tip.add(edgeHead, coreHead);
  turn.add(edgeArc, coreArc, tip);
  root.add(rest, turn);

  const headAngle = 0.02 / radius;
  const shown = (a) => Math.round((Math.min(MAX, a) / MAX) * SEGMENTS) * 6;
  return {
    root,
    /** Shows the mark at a thread for a turn of `theta` (rad); a turn too small to see hides it. */
    set(position, theta) {
      const a = Math.abs(theta);
      if (a < SHOW_FROM) {
        root.visible = false;
        return;
      }
      root.visible = true;
      root.position.copy(position);
      turn.scale.z = theta > 0 ? 1 : -1;
      const n = shown(Math.max(0, a - headAngle));
      edgeArc.geometry.setDrawRange(0, n);
      coreArc.geometry.setDrawRange(0, n);
      tip.position.set(radius * Math.cos(a), 0, -radius * Math.sin(a));
      tip.rotation.y = a;
    },
    hide() {
      root.visible = false;
    },
    /** The world points the arc runs between, for the labels to keep off it. */
    ends(theta, a, b) {
      a.set(radius, 0, 0).add(root.position);
      b.set(radius * Math.cos(theta), 0, -radius * Math.sin(theta)).add(root.position);
    },
  };
}
