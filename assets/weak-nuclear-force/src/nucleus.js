// The radioactive nucleus and what comes out of it, drawn in femtometres (1 fm = 10⁻¹⁵ m): 6 protons (red, with
// "+") and 8 neutrons (grey) packed in a ball; one neutron at the front right is the one that changes. The β
// electron (blue, with "−") and its straight track; the spark where the weak force acts inside the neutron; and
// the weak force's reach (a sphere of radius 10⁻¹⁸ m) that the zoom shows inside that neutron.
// Proton, neutron and electron colours are the same as in the strong-nuclear-force figure.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { NUCLEON_R, NUCLEUS, REACH_R, packNucleons } from './physics.js';

export const COLORS = { proton: 0xd23a50, neutron: 0x9aa3ad, electron: 0x1971c2, weak: 0x2b8a3e };
export const EXIT = new THREE.Vector3(1, 0.12, 0.34).normalize(); // the way the β electron leaves (to the right)

const nucleonMat = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.38, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.35 });

/** A "+" or "−" that always faces the camera from the front of its ball (see faceCamera). */
function sign(text, size) {
  const m = textMesh(text, size, { color: '#ffffff', weight: 700 });
  m.material.depthTest = true;
  m.renderOrder = 3;
  m.userData.noExport = true;
  return m;
}

/**
 * The nucleus: { root, nucleons: [{ mesh, kind, sign, pos }], changing, labelled: { p, n }, radius, centres, hits,
 * setChange(k) }.
 */
export function createNucleus() {
  const root = new THREE.Group();
  root.name = 'Nucleus';
  const pts = packNucleons(NUCLEUS.protons + NUCLEUS.neutrons, NUCLEON_R).map((p) => new THREE.Vector3(...p));
  const best = (dir) => {
    const d = new THREE.Vector3(...dir).normalize();
    let bi = -1;
    for (let i = 0; i < pts.length; i++) if (!taken.has(i) && (bi < 0 || pts[i].dot(d) > pts[bi].dot(d))) bi = i;
    taken.add(bi);
    return bi;
  };
  const taken = new Set();
  const changing = best([0.85, 0.05, 0.62]); // front right: the electron leaves on this side
  const labelP = best([-0.55, 0.8, 0.45]); // upper left, well in sight: the proton the label names
  const labelN = best([-0.85, -0.25, 0.45]); // left, well in sight: the neutron the label names
  // the other protons: four of the balls in front (so a student counting from the front sees five of the six) and
  // one at the back; the rest are neutrons
  const kinds = new Array(pts.length).fill('n');
  kinds[labelP] = 'p';
  const front = new THREE.Vector3(0, 0.1, 1).normalize();
  const rest = pts.map((_, i) => i).filter((i) => !taken.has(i));
  rest.sort((a, b) => pts[b].dot(front) - pts[a].dot(front));
  for (const i of [...rest.slice(0, NUCLEUS.protons - 2), rest[rest.length - 1]]) kinds[i] = 'p';

  const geo = new THREE.SphereGeometry(NUCLEON_R, 40, 26);
  const proton = nucleonMat(COLORS.proton);
  const neutron = nucleonMat(COLORS.neutron);
  const changingMat = nucleonMat(COLORS.neutron); // its own, so its colour can turn
  const nucleons = pts.map((pos, i) => {
    const kind = kinds[i];
    const mesh = new THREE.Mesh(geo, i === changing ? changingMat : kind === 'p' ? proton : neutron);
    mesh.name = i === changing ? 'Neutron (changes)' : kind === 'p' ? 'Proton' : 'Neutron';
    mesh.position.copy(pos);
    mesh.userData.nucleon = i;
    root.add(mesh);
    let plus = null;
    if (kind === 'p' || i === changing) {
      plus = sign('+', NUCLEON_R * 1.15);
      root.add(plus);
      plus.visible = kind === 'p';
    }
    return { mesh, kind, sign: plus, pos };
  });

  const grey = new THREE.Color(COLORS.neutron);
  const red = new THREE.Color(COLORS.proton);
  return {
    root,
    nucleons,
    changing,
    labelled: { p: labelP, n: labelN },
    radius: Math.max(...pts.map((v) => v.length())) + NUCLEON_R,
    centres: pts,
    hits: nucleons.map((x) => x.mesh),
    /** The changing neutron becomes a proton: k = 0 grey, 1 red with its "+". */
    setChange(k) {
      changingMat.color.copy(grey).lerp(red, k);
      const s = nucleons[changing].sign;
      s.visible = k > 0.02;
      s.material.opacity = Math.min(1, k * 1.4);
    },
  };
}

/**
 * Each sign sits on the side of its ball that faces the camera, upright on the screen. balls: the centres of the
 * other balls (radius r); a sign is hidden when one of them covers it, so no half-hidden fragments of "+" show.
 */
const toCam = new THREE.Vector3();
const seg = new THREE.Vector3();
const rel = new THREE.Vector3();
export function faceCamera(signs, parent, camera, balls = []) {
  parent.worldToLocal(toCam.copy(camera.position));
  for (const { sign: s, centre, r } of signs) {
    if (!s.visible) continue;
    s.position
      .copy(toCam)
      .sub(centre)
      .setLength(r * 1.01)
      .add(centre);
    s.quaternion.copy(camera.quaternion);
    // covered: the line from the camera to the sign passes close to another ball's centre
    seg.copy(s.position).sub(toCam);
    const len2 = seg.lengthSq();
    for (const c of balls) {
      if (c === centre) continue;
      rel.copy(c).sub(toCam);
      const k = rel.dot(seg) / len2;
      if (k <= 0 || k >= 1) continue;
      if (rel.addScaledVector(seg, -k).length() < r * 1.25) {
        s.material.visible = false;
        break;
      }
    }
  }
}

/** A glowing point drawn into a canvas: white in the middle, a ring of `light`, fading out in `color`. */
function spotTexture(light, color) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const rgb = (x) => {
    const col = new THREE.Color(x);
    return `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  };
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,1)');
  grad.addColorStop(0.34, `rgba(${rgb(light)},1)`);
  grad.addColorStop(0.62, `rgba(${rgb(color)},0.55)`);
  grad.addColorStop(1, `rgba(${rgb(color)},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * The β emission's parts: the electron (with "−"), its track, and the spark in the changing neutron. Nothing here
 * is exported (it is the moment, not the model).
 */
export function createBeta() {
  const root = new THREE.Group();
  root.name = 'Beta';
  root.userData.noExport = true;

  const electron = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 18), nucleonMat(COLORS.electron));
  ball.name = 'Electron';
  const minus = sign('−', 0.5);
  electron.add(ball);
  root.add(electron, minus);
  electron.visible = minus.visible = false;

  // the track: a thin straight tube from where the electron was made to where it is
  const trackGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 10, 1, true);
  trackGeo.translate(0, 0.5, 0);
  const track = new THREE.Mesh(
    trackGeo,
    new THREE.MeshBasicMaterial({ color: COLORS.electron, transparent: true, opacity: 0.45, depthWrite: false, toneMapped: false }),
  );
  track.renderOrder = 2;
  track.visible = false;
  root.add(track);

  // the spark: a small bright point drawn on top of the neutron (the weak force acts deep inside it)
  const sparkMats = {
    weak: new THREE.SpriteMaterial({ map: spotTexture(0x8ce99a, 0x40c057), depthTest: false, depthWrite: false, transparent: true }),
    plain: new THREE.SpriteMaterial({ map: spotTexture(0xffe066, 0xfab005), depthTest: false, depthWrite: false, transparent: true }),
  };
  const spark = new THREE.Sprite(sparkMats.weak);
  spark.renderOrder = 20;
  spark.visible = false;
  root.add(spark);

  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  return {
    root,
    electron,
    minus,
    spark,
    track,
    /** Neutral colours (a test question that asks which force it is). */
    setNeutral(on) {
      spark.material = on ? sparkMats.plain : sparkMats.weak;
    },
    /** The track from `from` to `to` (fm), or hidden when to is null. */
    setTrack(from, to) {
      track.visible = Boolean(to);
      if (!to) return;
      const len = from.distanceTo(to);
      track.position.copy(from);
      track.scale.set(1, Math.max(1e-4, len), 1);
      q.setFromUnitVectors(up, EXIT);
      track.quaternion.copy(q);
    },
  };
}

/** The weak force's reach: a sphere of radius 10⁻¹⁸ m (0.001 fm), with a line from its centre to its edge. */
export function createReach() {
  const root = new THREE.Group();
  root.name = 'WeakReach';
  root.userData.noExport = true;
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(REACH_R, 48, 32),
    new THREE.MeshPhysicalMaterial({ color: COLORS.weak, roughness: 0.4, transparent: true, opacity: 0.32, depthWrite: false }),
  );
  sphere.renderOrder = 5;
  // a crisp outline: a ring that faces the camera
  const ringPts = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    ringPts.push(new THREE.Vector3(Math.cos(a) * REACH_R, Math.sin(a) * REACH_R, 0));
  }
  const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: COLORS.weak }));
  ring.renderOrder = 6;
  const centre = new THREE.Mesh(new THREE.SphereGeometry(REACH_R * 0.045, 16, 10), new THREE.MeshBasicMaterial({ color: 0x1d2733 }));
  // the radius: from the centre to the edge, to the right on the screen
  const radius = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(REACH_R, 0, 0)]),
    new THREE.LineBasicMaterial({ color: 0x1d2733 }),
  );
  radius.renderOrder = 7;
  const facing = new THREE.Group(); // ring and radius turn to face the camera
  facing.add(ring, radius);
  root.add(sphere, facing, centre);
  return {
    root,
    facing,
    /** The middle of the radius line (its label goes above it). */
    mid: (out) => facing.localToWorld(out.set(REACH_R / 2, 0, 0)),
  };
}
