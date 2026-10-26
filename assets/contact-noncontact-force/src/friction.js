// চলতে চলতে ঘর্ষণের জন্য চলন্ত বস্তুর থেমে যাওয়া: a wooden crate slides on a board floor at 2 m/s and friction
// from the floor slows it to a stop in about 1 m (kinetic friction about 0.2: it slows by about 2 m/s every
// second). Real size, metres, sliding along +x. The arrow lies on the floor along the crate's bottom edge,
// pointing back; faint lines behind the crate show that it moves, and a scuff on the boards shows where it slid. The
// contact patch is the floor under the crate, lit a little wider than the crate, with its touching front edge.
import * as THREE from 'three';
import { createArrow } from './arrow.js';
import { V, box, canvasTexture, castShadows, glowPatch, groundPatch, hitBox } from './parts.js';

const CRATE = { w: 0.6, h: 0.48, d: 0.5 };
const X0 = -0.98; // the crate's middle at the start

export function createFrictionScene({ color, materials }) {
  const root = new THREE.Group();
  root.name = 'FrictionScene';
  const model = new THREE.Group();
  model.name = 'SlidingCrate';
  root.add(model);

  // the crate: boards on the faces, darker battens on the edges
  const crate = new THREE.Group();
  crate.name = 'Crate';
  model.add(crate);
  const boards = new THREE.MeshStandardMaterial({
    name: 'CrateBoards',
    roughness: 0.75,
    map: canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#c8955c';
      ctx.fillRect(0, 0, w, h);
      for (let i = 1; i < 4; i++) {
        ctx.fillStyle = 'rgba(90,55,25,0.45)';
        ctx.fillRect(0, (i * h) / 4 - 1, w, 3);
      }
      for (let i = 0; i < 60; i++) {
        ctx.strokeStyle = `rgba(110,70,35,${0.08 + Math.random() * 0.12})`;
        ctx.beginPath();
        const y = Math.random() * h;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + 4, w * 0.6, y - 4, w, y + 2);
        ctx.stroke();
      }
    }),
  });
  box(CRATE.w, CRATE.h, CRATE.d, boards, 0, CRATE.h / 2, 0, crate);
  const batten = materials.wood;
  for (const [x, z] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ])
    box(0.06, CRATE.h + 0.01, 0.06, batten, (x * (CRATE.w - 0.05)) / 2, CRATE.h / 2, (z * (CRATE.d - 0.05)) / 2, crate);
  for (const y of [0.03, CRATE.h - 0.03]) for (const z of [-1, 1]) box(CRATE.w + 0.01, 0.06, 0.06, batten, 0, y, (z * (CRATE.d - 0.05)) / 2, crate);

  // speed lines behind the crate (not part of the model)
  const lineMat = new THREE.MeshBasicMaterial({ color: '#8b96a3', transparent: true, opacity: 0.6, depthWrite: false });
  const lines = [0.12, 0.24, 0.36].map((y, i) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(1, 0.012, 0.012), lineMat);
    l.userData.noExport = true;
    l.position.set(0, y, CRATE.d / 2 - 0.02);
    l.userData.len = [0.22, 0.32, 0.18][i];
    root.add(l);
    return l;
  });
  // a scuff where the crate has slid (darker, matt)
  const scuff = new THREE.Mesh(
    new THREE.PlaneGeometry(1, CRATE.d * 0.9),
    new THREE.MeshBasicMaterial({ color: '#7a5a3a', transparent: true, opacity: 0.1, depthWrite: false }),
  );
  scuff.rotation.x = -Math.PI / 2;
  scuff.position.y = 0.002;
  scuff.userData.noExport = true;
  root.add(scuff);

  const floor = groundPatch(4.2, 2.4, {
    color: '#e7d2b4',
    draw: (ctx, w, h) => {
      const n = 9;
      for (let i = 0; i < n; i++) {
        const y = (i * h) / n;
        ctx.fillStyle = i % 2 ? 'rgba(160,110,60,0.10)' : 'rgba(255,255,255,0.08)';
        ctx.fillRect(0, y, w, h / n);
        ctx.fillStyle = 'rgba(110,70,35,0.35)';
        ctx.fillRect(0, y, w, 2);
        const off = (i * 137) % w;
        for (let x = off; x < w + off; x += w / 2.2) ctx.fillRect(x % w, y, 2, h / n);
      }
    },
  });
  floor.position.set(-0.45, 0, 0);
  root.add(floor);
  castShadows(model);

  const hits = [hitBox(0.95, 0.85, 0.85, 0, 0.35, 0, crate)];
  const arrow = createArrow({ color, radius: 0.013, head: 0.085, headRadius: 0.036 });
  root.add(arrow.root);
  // the contact patch: the floor under the crate (the rim shows round it) and the crate's touching front edge
  const patch = glowPatch(CRATE.w + 0.16, CRATE.d + 0.2, color);
  patch.position.y = 0.003;
  const edge = new THREE.Mesh(new THREE.BoxGeometry(CRATE.w + 0.02, 0.018, 0.012), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  edge.userData.noExport = true;
  edge.position.set(0, 0.009, CRATE.d / 2 + 0.004);
  const contactMarks = new THREE.Group();
  contactMarks.userData.noExport = true;
  contactMarks.add(patch, edge);
  patch.visible = true;
  contactMarks.visible = false;
  root.add(contactMarks);

  const v = new THREE.Vector3();
  const touch = new THREE.Vector3();
  const body = new THREE.Box3();
  let x = X0;

  function update(m, { arrowOn = false, moving = false, marks = false } = {}) {
    x = X0 + m.pos;
    crate.position.set(x, 0, 0);
    contactMarks.position.x = x;
    contactMarks.visible = marks && m.touching;
    touch.set(x, 0.01, CRATE.d / 2);
    // the lines show that it moves (also in the first, still picture, where it is already sliding)
    const k = Math.min(1, m.speed / 2);
    for (const l of lines) {
      const len = l.userData.len * (0.4 + 0.6 * k);
      l.scale.x = len;
      l.position.x = x - CRATE.w / 2 - 0.05 - len / 2;
      l.visible = moving && m.speed > 0.05;
    }
    lineMat.opacity = 0.25 + 0.4 * k;
    const slid = m.pos;
    scuff.visible = slid > 0.02;
    scuff.scale.x = Math.max(0.001, slid);
    scuff.position.x = X0 + slid / 2;
    arrow.setOpacity(arrowOn ? 1 : 0);
    // along the bottom front edge, from the middle backwards (friction acts on the face that touches the floor)
    if (arrowOn) arrow.set(v.set(x + 0.08, 0.016, CRATE.d / 2 + 0.17), V(-1, 0, 0), 0.46);
  }

  return {
    id: 'friction',
    root,
    model,
    hits,
    arrow,
    // where it slid from (the scuff behind it) to where it is held at its telling moment, with room for the tag
    fit: { min: V(-1.45, -0.02, -0.3), max: V(0.2, 0.55, 0.55) },
    // a little from above, so the lit floor round the crate shows
    views: { front: V(0.12, 0.42, 1).normalize(), '3d': V(0.7, 0.55, 0.8).normalize() },
    shadow: { center: V(-0.5, 0, 0), r: 1.6 },
    update,
    /** The body the force acts on (the action's ring goes round it): the crate. */
    subject: () => body.set(V(x - CRATE.w / 2, 0, -CRATE.d / 2), V(x + CRATE.w / 2, CRATE.h, CRATE.d / 2)),
    /** Where the floor's friction touches the crate: its bottom face (the middle of its front edge for the tag). */
    contact: () => touch,
    gap: () => null,
    bodies: () => [{ min: V(x - CRATE.w / 2, 0, -CRATE.d / 2), max: V(x + CRATE.w / 2, CRATE.h, CRATE.d / 2) }],
  };
}
