// The beating heart (হৃৎপিণ্ডের স্পন্দন), in metres: an anatomical model seen from the front (ventricles with the
// apex to the student's right, the atria, the aorta and its arch, the pulmonary trunk and the vena cava), and
// under it an ECG strip that runs to the left past a pen, as on a hospital recorder. The same wave comes again
// and again; each tall R wave passing the pen (the mark) is one beat. The trace is a stylised ECG.
import * as THREE from 'three';
import { COLORS } from './parts.js';
import { ecg, heartSqueeze } from './motion.js';

const STRIP_W = 0.2;
const STRIP_H = 0.064;
const BEATS = 5; // beats on the strip at once
const AMP = 0.03; // height of the R wave on the strip, m
const BASE = -STRIP_H / 2 + 0.019; // the trace's baseline
const PEN_X = STRIP_W / 2;

function ecgTexture() {
  const W = 512;
  const H = Math.round((W * STRIP_H * BEATS) / STRIP_W);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#fff6f6';
  g.fillRect(0, 0, W, H);
  // ECG paper: a big square is 0.2 s, a small one 0.04 s (one period of 0.8 s is 4 big squares)
  const px = W / 20; // one small square
  for (let i = 0; i * px <= W + 1; i++) {
    g.fillStyle = i % 5 === 0 ? '#ee9aa0' : '#f8d3d5';
    const w = i % 5 === 0 ? 3 : 1.5;
    g.fillRect(i * px - w / 2, 0, w, H);
  }
  for (let j = 0; j * px <= H + 1; j++) {
    g.fillStyle = j % 5 === 0 ? '#ee9aa0' : '#f8d3d5';
    const w = j % 5 === 0 ? 3 : 1.5;
    g.fillRect(0, H - j * px - w / 2, W, w);
  }
  g.strokeStyle = '#1d2733';
  g.lineWidth = 12;
  g.lineJoin = g.lineCap = 'round';
  g.beginPath();
  const toY = (v) => H * (1 - (BASE + STRIP_H / 2 + v * AMP) / STRIP_H);
  for (let i = -4; i <= 260; i++) {
    const p = i / 256;
    const x = p * W;
    const y = toY(ecg(p));
    if (i === -4) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(BEATS, 1);
  tex.anisotropy = 8;
  return tex;
}

function tube(points, radius, material, closed = false) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    closed,
  );
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 16, closed), material);
}

function capped(mesh, at, radius, material) {
  const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 10), material);
  cap.position.copy(at);
  mesh.add(cap);
  return mesh;
}

export function createHeart() {
  const root = new THREE.Group();
  root.name = 'HeartAndECG';
  const model = new THREE.Group();
  model.name = 'Heart';
  root.add(model);

  const muscle = new THREE.MeshPhysicalMaterial({ name: 'Muscle', color: 0xb5323a, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.3 });
  const atrium = new THREE.MeshPhysicalMaterial({ name: 'Atrium', color: 0x9e2c3b, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.35 });
  const artery = new THREE.MeshPhysicalMaterial({ name: 'Artery', color: 0xd2413f, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const vein = new THREE.MeshPhysicalMaterial({ name: 'Vein', color: 0x4c63c4, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const coronary = new THREE.MeshPhysicalMaterial({ name: 'Coronary', color: 0x7d1d2a, roughness: 0.4, clearcoat: 0.5 });

  const heart = new THREE.Group();
  heart.position.set(0.004, 0.158, 0);
  model.add(heart);

  // ventricles: a rounded cone with its apex down and to the student's right; it squeezes from the top
  const vent = new THREE.Group();
  vent.rotation.z = THREE.MathUtils.degToRad(28);
  heart.add(vent);
  const ventGeo = new THREE.LatheGeometry(
    [
      [0, 0.014],
      [0.024, 0.012],
      [0.04, 0.002],
      [0.047, -0.014],
      [0.049, -0.03],
      [0.045, -0.05],
      [0.034, -0.068],
      [0.018, -0.083],
      [0.006, -0.09],
      [0, -0.091],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    48,
  );
  const ventricles = new THREE.Mesh(ventGeo, muscle);
  ventricles.name = 'Ventricles';
  ventricles.scale.set(1.04, 1, 0.82);
  vent.add(ventricles);
  // the coronary artery down the front, between the two ventricles
  const groove = tube(
    [
      [-0.006, 0.004, 0.042],
      [0.0, -0.02, 0.041],
      [0.004, -0.045, 0.037],
      [0.006, -0.068, 0.026],
      [0.004, -0.084, 0.01],
    ],
    0.0022,
    coronary,
  );
  vent.add(groove);

  // atria
  const atria = new THREE.Group();
  atria.position.set(0, 0.008, 0);
  heart.add(atria);
  const ra = new THREE.Mesh(new THREE.SphereGeometry(0.026, 32, 20), atrium);
  ra.name = 'RightAtrium';
  ra.position.set(-0.034, 0.004, 0.004);
  ra.scale.set(1, 0.92, 0.86);
  const la = new THREE.Mesh(new THREE.SphereGeometry(0.023, 32, 20), atrium);
  la.name = 'LeftAtrium';
  la.position.set(0.024, 0.012, -0.018);
  const auricle = new THREE.Mesh(new THREE.SphereGeometry(0.012, 24, 14), atrium);
  auricle.position.set(0.04, 0.006, 0.014);
  auricle.scale.set(1.3, 0.7, 0.8);
  atria.add(ra, la, auricle);

  // great vessels
  const aorta = capped(
    tube(
      [
        [-0.006, 0.01, 0.004],
        [-0.006, 0.05, 0.008],
        [0.004, 0.076, 0.002],
        [0.024, 0.082, -0.012],
        [0.04, 0.066, -0.028],
        [0.044, 0.03, -0.036],
      ],
      0.0105,
      artery,
    ),
    new THREE.Vector3(0.044, 0.03, -0.036),
    0.0105,
    artery,
  );
  aorta.name = 'Aorta';
  heart.add(aorta);
  for (const [x, z] of [
    [-0.0, 0.0],
    [0.012, -0.007],
    [0.024, -0.014],
  ]) {
    const top = new THREE.Vector3(x - 0.002, 0.107, z);
    const branch = capped(
      tube(
        [
          [x, 0.074, z],
          [x - 0.001, 0.09, z],
          [x - 0.002, 0.107, z],
        ],
        0.0036,
        artery,
      ),
      top,
      0.0036,
      artery,
    );
    heart.add(branch);
  }
  const pulm = capped(
    tube(
      [
        [0.006, 0.004, 0.03],
        [0.012, 0.035, 0.026],
        [0.026, 0.054, 0.012],
        [0.05, 0.058, 0.0],
      ],
      0.0088,
      vein,
    ),
    new THREE.Vector3(0.05, 0.058, 0.0),
    0.0088,
    vein,
  );
  pulm.name = 'PulmonaryTrunk';
  heart.add(pulm);
  const vena = capped(
    tube(
      [
        [-0.038, 0.012, -0.004],
        [-0.039, 0.05, -0.006],
        [-0.04, 0.09, -0.008],
      ],
      0.0085,
      vein,
    ),
    new THREE.Vector3(-0.04, 0.09, -0.008),
    0.0085,
    vein,
  );
  vena.name = 'VenaCava';
  heart.add(vena);

  // the ECG strip and the recorder's pen at its right end
  const tex = ecgTexture();
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(STRIP_W, STRIP_H), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  strip.name = 'ECGStrip';
  root.add(strip);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xc9cfd6, roughness: 0.6 });
  for (const y of [STRIP_H / 2 + 0.002, -STRIP_H / 2 - 0.002]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(STRIP_W + 0.004, 0.004, 0.004), frameMat);
    edge.position.set(0, y, -0.001);
    root.add(edge);
  }
  const recorder = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, STRIP_H + 0.014, 0.014),
    new THREE.MeshStandardMaterial({ color: 0x5f6973, roughness: 0.5 }),
  );
  recorder.position.set(PEN_X + 0.011, 0, -0.002);
  root.add(recorder);
  // the mark: an orange line where the pen writes; the pen is a dot riding on it
  const markMat = new THREE.MeshStandardMaterial({ color: COLORS.mark, roughness: 0.45, emissive: COLORS.mark, emissiveIntensity: 0.25 });
  const markLine = new THREE.Mesh(new THREE.BoxGeometry(0.0022, STRIP_H, 0.002), markMat);
  markLine.position.set(PEN_X - 0.0011, 0, 0.001);
  markLine.userData.noExport = true;
  root.add(markLine);
  const pen = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 16, 12), new THREE.MeshStandardMaterial({ color: 0x1d2733, roughness: 0.4 }));
  pen.position.set(PEN_X, BASE, 0.003);
  root.add(pen);
  for (const obj of [strip, recorder, pen]) obj.userData.noExport = true;

  let flash = 0;
  return {
    id: 'heart',
    root,
    model,
    setPhase(phase) {
      tex.offset.x = phase; // the right end of the strip is now
      pen.position.y = BASE + ecg(phase) * AMP;
      const sq = heartSqueeze(phase);
      vent.scale.set(1 - 0.07 * sq.ventricles, 1 - 0.05 * sq.ventricles, 1 - 0.07 * sq.ventricles);
      atria.scale.setScalar(1 - 0.1 * sq.atria);
    },
    samples: [], // the mark stays at the pen
    phaseOfSample: () => 0.25,
    markPose: () => ({ pos: new THREE.Vector3(PEN_X, BASE + AMP, 0.004), across: new THREE.Vector3(1, 0, 0), vel: new THREE.Vector3() }),
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
    heartPoint: () => heart.localToWorld(new THREE.Vector3(-0.03, -0.03, 0.03)),
    markLength: 0,
    arrowThickness: 0.002,
    velocityScale: 0,
    views: {
      front: new THREE.Vector3(0, 0.06, 1).normalize(),
      '3d': new THREE.Vector3(0.6, 0.28, 0.75).normalize(),
    },
    bounds: new THREE.Box3(new THREE.Vector3(-0.105, -0.04, -0.06), new THREE.Vector3(0.135, 0.272, 0.06)),
    ground: null,
  };
}
