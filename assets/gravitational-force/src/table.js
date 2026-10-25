// The apples stop: two 200 g apples on a wooden table, in real centimetres. The left one stays put; the student
// drags the right one along the table. Their pulls on each other (violet arrows from their near sides, equal) are
// drawn very much bigger than real, in proportion to the pull, so they shrink to a small arrowhead far apart but
// never vanish. A dimension line on the table in front gives the distance between their centres.
import * as THREE from 'three';
import { createArrow, createDashes } from './draw.js';
import { appleMaterials, createApple } from './people.js';
import { FACTS, GAP } from './physics.js';

export const LEFT_X = -18; // cm: where the left apple stands
const R = FACTS.apple.radius;
const ARROW_AT_START = 6; // cm: each arrow's length at the starting (and smallest) distance; in proportion to the pull
const LINE_Z = R + 3.2; // the dimension line, in front of the apples

export function createTable({ materials }) {
  const root = new THREE.Group();
  root.name = 'TwoApples';
  const top = new THREE.Mesh(new THREE.BoxGeometry(120, 2.6, 46), materials.wood);
  top.name = 'TableTop';
  top.position.set(8, -1.3, 0);
  root.add(top);

  const M = appleMaterials();
  const left = createApple(R, M);
  const right = createApple(R, M);
  left.rotation.y = 0.8;
  right.rotation.y = -2.1;
  const y = R * 0.86; // the apple's lowest point is about 0.86 R below its centre
  left.position.set(LEFT_X, y, 0);
  right.position.set(LEFT_X + GAP.start, y, 0);
  root.add(left, right);

  const onLeft = createArrow({ radius: 0.2, head: 1.1, headRadius: 0.5, name: 'PullOnLeftApple' });
  const onRight = createArrow({ radius: 0.2, head: 1.1, headRadius: 0.5, name: 'PullOnRightApple' });
  root.add(onLeft.root, onRight.root);

  // the dimension line: dashes between two short end marks, lying on the table
  const dim = createDashes({ radius: 0.09, dash: 0.7, gap: 0.5, top: false, name: 'Distance' });
  root.add(dim.mesh);
  const tickGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.8, 6);
  const tickMat = new THREE.MeshBasicMaterial({ color: '#5c6672', toneMapped: false });
  const ticks = [new THREE.Mesh(tickGeo, tickMat), new THREE.Mesh(tickGeo, tickMat)];
  for (const t of ticks) {
    t.rotation.x = Math.PI / 2;
    t.userData.noExport = true;
    root.add(t);
  }

  // a generous invisible target round the right apple (a finger on a phone)
  const hit = new THREE.Mesh(new THREE.SphereGeometry(R * 2, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  root.add(hit);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const xAxis = new THREE.Vector3(1, 0, 0);
  const minus = new THREE.Vector3(-1, 0, 0);
  let arrowLen = ARROW_AT_START;
  return {
    root,
    left,
    right,
    hit,
    /** Put the right apple `gap` cm from the left one (centre to centre); the arrows shrink as 1 / gap². */
    setGap(gap) {
      const x = LEFT_X + gap;
      right.position.x = x;
      hit.position.copy(right.position);
      const len = ARROW_AT_START * (GAP.start / gap) ** 2;
      arrowLen = len;
      onLeft.set(a.set(LEFT_X + R, y, 0), xAxis, len);
      onRight.set(a.set(x - R, y, 0), minus, len);
      dim.set(a.set(LEFT_X, 0.15, LINE_Z), b.set(x, 0.15, LINE_Z));
      ticks[0].position.set(LEFT_X, 0.15, LINE_Z);
      ticks[1].position.set(x, 0.15, LINE_Z);
    },
    setPulls(on) {
      onLeft.root.visible = onRight.root.visible = on;
    },
    points: {
      right: (out = new THREE.Vector3()) => right.getWorldPosition(out),
      left: (out = new THREE.Vector3()) => left.getWorldPosition(out),
      /** The middle of the dimension line (its label goes just in front of it). */
      dimMid: (out = new THREE.Vector3()) => root.localToWorld(out.set(LEFT_X + (right.position.x - LEFT_X) / 2, 0.15, LINE_Z)),
      /** The middle of the arrow on the right apple (the arrows' label goes beside it), and that apple's radius. */
      rightArrow: (out = new THREE.Vector3()) => root.localToWorld(out.set(right.position.x - R - arrowLen / 2, y, 0)),
    },
    /** The x range the right apple moves in, and the height of things, for framing the camera. */
    extent: { x0: LEFT_X - R - 1, x1: LEFT_X + GAP.max + R + 1, top: 2 * R + 1.5, front: LINE_Z + 2.5, back: -R - 1 },
  };
}
