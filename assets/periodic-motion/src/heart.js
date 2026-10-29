// The beating heart (হৃৎপিণ্ডের স্পন্দন), in metres: an anatomical model seen from the front (ventricles with the
// apex to the student's right, the atria, the aorta and its arch, the pulmonary trunk and the vena cava), a little
// larger than life, and under it an ECG strip that runs to the left past a pen, as on a hospital recorder. The
// heart gives a quick squeeze after each tall R wave; the same wave comes again and again, and each R wave passing
// the pen (the mark) is one beat. The paper moves at a fixed speed, so a faster heart puts the beats closer. The
// trace is a stylised ECG.
import * as THREE from 'three';
import { COLORS } from './parts.js';
import { ecg, heartSqueeze } from './motion.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createHeartModel } from './heart-model.js';

const STRIP_W = 0.16;
const STRIP_H = 0.05;
const SPEED = 0.05; // the paper moves 5 cm a second (one big square, 0.2 s, is 1 cm)
const AMP = 0.026; // height of the R wave on the strip, m
const BASE = -STRIP_H / 2 + 0.015; // the trace's baseline
const PEN_X = STRIP_W / 2;
// what must be in the picture, with the strip under the heart or beside it
const TALL = new THREE.Box3(new THREE.Vector3(-0.088, -0.065, -0.07), new THREE.Vector3(0.105, 0.285, 0.07));
const WIDE = new THREE.Box3(new THREE.Vector3(-0.075, 0.04, -0.06), new THREE.Vector3(0.305, 0.285, 0.07));

/** ECG paper: one big square (0.2 s) of five by five small ones (0.04 s), repeated over the strip. */
function gridTexture() {
  const S = 160;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#fff6f6';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 5; i++) {
    const big = i === 0;
    g.fillStyle = big ? '#ee9aa0' : '#f8d3d5';
    const w = big ? 4 : 2;
    g.fillRect((i * S) / 5, 0, w, S);
    g.fillRect(0, (i * S) / 5, S, w);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(STRIP_W / (SPEED * 0.2), STRIP_H / (SPEED * 0.2));
  tex.anisotropy = 8;
  return tex;
}

/** One beat of the trace on a clear background; repeated along the strip, one copy per period. */
function traceTexture() {
  const W = 1024;
  const H = Math.round((W * STRIP_H) / (SPEED * 0.8));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.strokeStyle = '#1d2733';
  g.lineWidth = 22;
  g.lineJoin = g.lineCap = 'round';
  g.beginPath();
  const toY = (v) => H * (1 - (BASE + STRIP_H / 2 + v * AMP) / STRIP_H);
  for (let i = -4; i <= 260; i++) {
    const p = i / 256;
    if (i === -4) g.moveTo(p * W, toY(ecg(p)));
    else g.lineTo(p * W, toY(ecg(p)));
  }
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export function createHeart() {
  const root = new THREE.Group();
  root.name = 'HeartAndECG';
  const model = new THREE.Group();
  model.name = 'Heart';
  root.add(model);
  const anatomy = createHeartModel();
  const heart = anatomy.root;
  heart.position.set(0.006, 0.142, 0);
  heart.scale.setScalar(1.2);
  model.add(heart);

  // the ECG strip (the paper, and the trace on it) and the recorder's pen at its right end
  // the paper and the recorder: under the heart on a tall view, beside it on a wide one (arrange)
  const paper = new THREE.Group();
  paper.name = 'ECG';
  root.add(paper);
  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(STRIP_W + 0.014, STRIP_H + 0.014, 0.008, 4, 0.003),
    new THREE.MeshStandardMaterial({ name: 'ECGFrame', color: '#e6eef2', roughness: 0.65 }),
  );
  frame.position.z = -0.005;
  paper.add(frame);
  const grid = gridTexture();
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(STRIP_W, STRIP_H), new THREE.MeshBasicMaterial({ map: grid, toneMapped: false }));
  strip.name = 'ECGStrip';
  paper.add(strip);
  const tex = traceTexture();
  const trace = new THREE.Mesh(
    new THREE.PlaneGeometry(STRIP_W, STRIP_H),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  trace.position.z = 0.0004;
  paper.add(trace);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xc9cfd6, roughness: 0.6 });
  for (const y of [STRIP_H / 2 + 0.002, -STRIP_H / 2 - 0.002]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(STRIP_W + 0.004, 0.004, 0.004), frameMat);
    edge.position.set(0, y, -0.001);
    paper.add(edge);
  }
  const recorder = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, STRIP_H + 0.014, 0.014),
    new THREE.MeshStandardMaterial({ color: 0x5f6973, roughness: 0.5 }),
  );
  recorder.position.set(PEN_X + 0.011, 0, -0.002);
  paper.add(recorder);
  // the mark: an orange line where the pen writes; the pen is a dot riding on it
  const markMat = new THREE.MeshStandardMaterial({ color: COLORS.mark, roughness: 0.45, emissive: COLORS.mark, emissiveIntensity: 0.25 });
  const markLine = new THREE.Mesh(new THREE.BoxGeometry(0.0022, STRIP_H, 0.002), markMat);
  markLine.position.set(PEN_X - 0.0011, 0, 0.001);
  markLine.userData.noExport = true;
  paper.add(markLine);
  const pen = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 16, 12), new THREE.MeshStandardMaterial({ color: 0x1d2733, roughness: 0.4 }));
  pen.position.set(PEN_X, BASE, 0.003);
  paper.add(pen);
  for (const obj of [strip, trace, recorder, pen]) obj.userData.noExport = true;

  let flash = 0;
  return {
    id: 'heart',
    root,
    model,
    /** The heart at a phase of its beat, `t` seconds after it started, beating once every `period` s. */
    setPhase(phase, t = 0, period = 0.8) {
      // the paper has moved SPEED·t; one beat takes SPEED·period of it, and the right end of the strip is now
      grid.offset.x = (t * SPEED) / (SPEED * 0.2);
      tex.repeat.x = STRIP_W / (SPEED * period);
      tex.offset.x = phase - (tex.repeat.x % 1);
      pen.position.y = BASE + ecg(phase) * AMP;
      const sq = heartSqueeze(phase);
      anatomy.beat(sq.atria, sq.ventricles);
    },
    samples: [], // the mark stays at the pen
    phaseOfSample: () => 0.25,
    markPose: () => ({
      pos: paper.position.clone().add(new THREE.Vector3(PEN_X, BASE + AMP, 0.004)),
      across: new THREE.Vector3(1, 0, 0),
      vel: new THREE.Vector3(),
    }),
    ownMark: {
      flash() {
        flash = 1;
      },
      tick(dt) {
        if (flash <= 0) return false;
        flash = Math.max(0, flash - dt * 2.4);
        markMat.emissiveIntensity = 0.25 + flash * 0.9;
        markLine.scale.set(1 + flash * 1.5, 1, 1);
        return true;
      },
    },
    normal: new THREE.Vector3(0, 0, 1),
    particle: () => pen.getWorldPosition(new THREE.Vector3()),
    strip: () => strip.localToWorld(new THREE.Vector3(-STRIP_W * 0.3, STRIP_H / 2, 0)),
    markLength: 0,
    arrowThickness: 0.002,
    velocityScale: 0,
    views: {
      front: new THREE.Vector3(0, 0.06, 1).normalize(),
      '3d': new THREE.Vector3(0.6, 0.28, 0.75).normalize(),
    },
    bounds: TALL.clone(),
    /** The ECG strip under the heart (a tall view) or beside it (a wide one), so the heart can be large. */
    arrange(wide) {
      paper.position.set(wide ? 0.2 : 0, wide ? 0.11 : -0.025, 0);
      this.bounds.copy(wide ? WIDE : TALL);
    },
    ground: null,
  };
}
