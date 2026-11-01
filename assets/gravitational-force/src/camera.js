// The camera: each stop is framed as big as the view allows, clear of the corner buttons: in the middle; or moved
// down below the buttons; or, on short frames where moving down costs much, moved left of them. The frame is made from points that do not move (the whole circle a body can
// be on), so the camera never jumps while something moves. "wide" frames an orbit stop from much further back, so
// a body whose pull is taken away stays in view for seconds on its straight path.
import * as THREE from 'three';
import { ease } from '@shared/tween.js';
import { H as PERSON_H, R as EARTH_R } from './globe.js';

export const WIDE = 2.1; // how much further back the camera goes for the straight path

/** World points the camera keeps in view for a stop. */
export function framePoints(id, sc, { wide = false } = {}) {
  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  const circle = (r, plane = 'xz') => {
    const list = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      list.push(plane === 'xz' ? P(r * Math.cos(a), 0, r * Math.sin(a)) : P(r * Math.cos(a), r * Math.sin(a), 0));
    }
    return list;
  };
  if (id === 'apples') {
    const e = sc.apples.extent;
    const list = [];
    for (const x of [e.x0, e.x1]) for (const y of [0, e.top]) for (const z of [e.back, e.front]) list.push(P(x, y, z));
    return list;
  }
  // the people's heads all round (in a boat too), and the globe's depth
  if (id === 'earth') return [...circle(EARTH_R + PERSON_H * 1.16, 'xy'), P(0, 0, EARTH_R), P(0, 0, -EARTH_R)];
  if (id === 'galaxy') return [...circle(sc.galaxy.RG + 1), P(0, 3, 0), P(0, -3, 0)];
  const S = sc[id].S;
  return [...circle((S.r + S.small + 0.6) * (wide ? WIDE : 1)), P(0, S.big, 0), P(0, -S.big, 0)];
}

export function createCamera({ stage, controls, tweener, corner }) {
  const { camera } = stage;
  const f = new THREE.Vector3();
  const r = new THREE.Vector3();
  const u = new THREE.Vector3();
  const d = new THREE.Vector3();
  const v = new THREE.Vector3();

  /** Fit the points in the view looking along `dir`, inside the margins (px), as big as they can be. */
  function fit(dir, pts, margin) {
    f.set(...dir).normalize();
    r.crossVectors(Math.abs(f.y) > 0.98 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0), f).normalize();
    u.crossVectors(f, r);
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const p of pts) {
      x0 = Math.min(x0, p.dot(r));
      x1 = Math.max(x1, p.dot(r));
      y0 = Math.min(y0, p.dot(u));
      y1 = Math.max(y1, p.dot(u));
    }
    const c = new THREE.Vector3().addScaledVector(r, (x0 + x1) / 2).addScaledVector(u, (y0 + y1) / 2);
    const W = Math.max(stage.width, 1);
    const Hh = Math.max(stage.height, 1);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * (W / Hh);
    const nx0 = -1 + (2 * margin.left) / W;
    const nx1 = 1 - (2 * margin.right) / W;
    const ny0 = -1 + (2 * margin.bottom) / Hh;
    const ny1 = 1 - (2 * margin.top) / Hh;
    const sx = (nx1 - nx0) / 2;
    const sy = (ny1 - ny0) / 2;
    let D = 1;
    for (const p of pts) {
      d.subVectors(p, c);
      const z = d.dot(f);
      D = Math.max(D, Math.abs(d.dot(r)) / (sx * tanH) + z, Math.abs(d.dot(u)) / (sy * tanV) + z);
    }
    const target = c
      .clone()
      .addScaledVector(r, -((nx0 + nx1) / 2) * tanH * D)
      .addScaledVector(u, -((ny0 + ny1) / 2) * tanV * D);
    return { target, position: target.clone().addScaledVector(f, D), distance: D };
  }

  /** The corner buttons' box in stage pixels (a little bigger), as it is laid out now. */
  function boxes() {
    const sr = stage.canvas.getBoundingClientRect();
    return [corner].map((e) => {
      const b = e.getBoundingClientRect();
      return { x0: b.left - sr.left - 6, x1: b.right - sr.left + 6, y0: b.top - sr.top - 6, y1: b.bottom - sr.top + 6, w: b.width };
    });
  }
  /** Does a stage point fall under the corner buttons? */
  function underBoxes(x, y, list = boxes()) {
    return list.some((b) => b.w > 0 && x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1);
  }
  /** Does any of the points land under the corner buttons, seen from this pose? */
  function hits(pose, pts) {
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld(true);
    const list = boxes();
    return pts.some((p) => {
      v.copy(p).project(camera);
      return underBoxes((v.x * 0.5 + 0.5) * stage.width, (-v.y * 0.5 + 0.5) * stage.height, list);
    });
  }

  /** The best pose for these points looking along `dir`. */
  function pose(dir, pts) {
    const side = stage.width < 480 ? 6 : 12;
    const p0 = camera.position.clone();
    const q0 = camera.quaternion.clone();
    const cornerBottom = corner.offsetTop + corner.offsetHeight;
    const tries = [
      { m: { top: 8, bottom: 6, left: side, right: side }, gain: 1 },
      { m: { top: cornerBottom + 8, bottom: 6, left: side, right: side }, gain: 1 },
      { m: { top: 8, bottom: 6, left: side, right: corner.offsetWidth + 16 }, gain: 1.08 },
    ];
    let best = null;
    for (const tr of tries) {
      const pz = fit(dir, pts, tr.m);
      if (hits(pz, pts)) continue;
      if (!best || pz.distance * tr.gain < best.pose.distance) best = { pose: pz, tr };
    }
    best ??= { pose: fit(dir, pts, tries[1].m), tr: tries[1] };
    camera.position.copy(p0);
    camera.quaternion.copy(q0);
    return best.pose;
  }

  function flyTo({ position, target }, duration = 0.8) {
    tweener.cancel('camera');
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }

  return { pose, flyTo, boxes, underBoxes };
}
