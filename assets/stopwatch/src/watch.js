// The stopwatch of the book's Figure 1.10, in millimetres: a black oval body standing on the table, a grey face
// with the LCD (minutes:seconds, hundredths smaller), a start/stop button on the upper right, a reset button on
// the upper left, and a lanyard through the ring on top, falling to the table on the right.
// The face looks along +z; the table is y = 0.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FONT, textMesh } from '@shared/student/materials.js';
import { format } from './reading.js';

const A = 32; // half width of the oval (before the rounded edge)
const B = 38; // half height
const EDGE = 3.5; // the rounded edge adds this all round
export const DIM = { centerY: B + EDGE, top: 2 * (B + EDGE), width: 2 * (A + EDGE), front: 9 };

const LCD_W = 512;
const LCD_H = 280;

/** A point on the oval (slightly narrower at the top, like the photo), angle in radians from +x, and its normal. */
function oval(a, scale = 1) {
  const k = 1 - 0.07 * Math.sin(a);
  const x = A * scale * Math.cos(a) * k;
  const y = B * scale * Math.sin(a);
  const n = new THREE.Vector2(x / (A * A), y / (B * B)).normalize();
  return { x, y, n };
}
function ovalShape(scale) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= 96; i++) {
    const { x, y } = oval((i / 96) * Math.PI * 2, scale);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

export function createWatch({ materials: M, t }) {
  const root = new THREE.Group();
  root.name = 'Stopwatch';
  const plastic = new THREE.MeshPhysicalMaterial({ name: 'Body', color: 0x16181b, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.45 });
  const face = new THREE.MeshPhysicalMaterial({ name: 'Face', color: 0x3b4048, roughness: 0.5, clearcoat: 0.2 });
  const cordMat = new THREE.MeshStandardMaterial({ name: 'Lanyard', color: 0x1d1f23, roughness: 0.85 });

  const watch = new THREE.Group(); // the watch itself, centred on its face
  watch.position.y = DIM.centerY;
  root.add(watch);

  const bodyGeo = new THREE.ExtrudeGeometry(ovalShape(1), {
    depth: 10,
    bevelEnabled: true,
    bevelThickness: 4,
    bevelSize: EDGE,
    bevelSegments: 6,
    curveSegments: 96,
  });
  bodyGeo.translate(0, 0, -5); // z from -9 to 9
  const body = new THREE.Mesh(bodyGeo, plastic);
  body.name = 'Body';
  watch.add(body);

  const faceGeo = new THREE.ExtrudeGeometry(ovalShape(0.84), {
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.6,
    bevelSize: 0.8,
    bevelSegments: 3,
  });
  const facePlate = new THREE.Mesh(faceGeo, face);
  facePlate.name = 'Face';
  facePlate.position.z = DIM.front - 0.2;
  watch.add(facePlate);

  // LCD: a canvas texture redrawn when the reading changes
  const canvas = document.createElement('canvas');
  canvas.width = LCD_W;
  canvas.height = LCD_H;
  const ctx = canvas.getContext('2d');
  const lcdTex = new THREE.CanvasTexture(canvas);
  lcdTex.colorSpace = THREE.SRGBColorSpace;
  lcdTex.anisotropy = 8;
  const zFace = DIM.front + 1.6;
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(47, 29, 1.6, 2, 1.2), plastic);
  bezel.position.set(0, 4, zFace + 0.4);
  watch.add(bezel);
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(42, 23), new THREE.MeshBasicMaterial({ map: lcdTex, toneMapped: false }));
  lcd.name = 'Display';
  lcd.position.set(0, 4, zFace + 1.25);
  watch.add(lcd);

  const brand = textMesh(t('brand'), 3.6, { color: '#d9dce1', weight: 700 });
  brand.position.set(0, -18.5, zFace);
  watch.add(brand);

  // buttons on the edge, each pushed in along its own direction; their names printed on the face next to them
  const buttons = {};
  const hits = [];
  const out = new THREE.Vector3();
  function button(name, angle, label) {
    const p = oval(angle);
    out.set(p.n.x, p.n.y, 0);
    const g = new THREE.Group();
    g.position.set(p.x + p.n.x * EDGE, p.y + p.n.y * EDGE, 0);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out);
    watch.add(g);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 4, 24), M.chrome);
    stem.position.y = 1;
    g.add(stem);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.4, 3.6, 32), M.satin);
    cap.name = `Button:${name}`;
    g.add(cap);
    // a generous invisible target, so a finger finds the button on a phone
    const hit = new THREE.Mesh(new THREE.BoxGeometry(22, 18, 24), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 4;
    hit.userData = { button: name, noExport: true };
    g.add(hit);
    hits.push(hit);
    const q = oval(angle, 0.66);
    const text = textMesh(label, 3.3, { color: '#f1f2f4', weight: 700 });
    text.position.set(q.x, q.y + 1, zFace);
    text.rotation.z = angle - Math.PI / 2;
    watch.add(text);
    buttons[name] = { group: g, cap, out: 3.4 };
    pressButton(name, false);
  }

  // the ring on top and the lanyard: a loose loop that falls to the table on the right
  const lug = new THREE.Mesh(new RoundedBoxGeometry(12, 6, 9, 2, 2), plastic);
  lug.position.set(0, B + EDGE + 1, 0);
  watch.add(lug);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.2, 1.4, 12, 32), M.chrome);
  ring.position.set(0, B + EDGE + 7, 0);
  ring.rotation.y = Math.PI / 2;
  watch.add(ring);
  const top = DIM.top + 7;
  const cord = new THREE.CatmullRomCurve3(
    [
      [0, top + 3, 0],
      [8, top + 9, -3],
      [22, top + 7, -7],
      [38, top - 6, -11],
      [50, 62, -14],
      [57, 30, -12],
      [62, 4, -4],
      [76, 1.6, 18],
      [98, 1.6, 12],
      [102, 1.6, -14],
      [82, 1.6, -28],
      [60, 10, -24],
      [46, 45, -16],
      [30, top - 14, -9],
      [12, top - 2, -4],
      [3, top + 1, -1],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    true,
    'centripetal',
  );
  const lanyard = new THREE.Mesh(new THREE.TubeGeometry(cord, 260, 1.5, 8, true), cordMat);
  lanyard.name = 'Lanyard';
  root.add(lanyard);

  button('start', THREE.MathUtils.degToRad(57), t('label_start'));
  button('reset', THREE.MathUtils.degToRad(123), t('label_reset'));

  function pressButton(name, down) {
    const b = buttons[name];
    if (!b) return;
    b.cap.position.y = down ? b.out - 2.2 : b.out;
  }

  // ── the display ─────────────────────────────────────────────────────────────
  let lastDraw = '';
  /** Draws the LCD: big minutes:seconds, small hundredths, ▶ while running. `hidden` shows dashes. */
  function drawDisplay({ seconds = 0, running = false, hidden = false } = {}) {
    const f = format(seconds);
    const key = hidden ? `hidden|${running}` : `${f.text}|${running}`;
    if (key === lastDraw) return;
    lastDraw = key;
    ctx.fillStyle = '#b9c4a6';
    ctx.fillRect(0, 0, LCD_W, LCD_H);
    const base = 208;
    const mainRight = 360;
    ctx.textBaseline = 'alphabetic';
    // faint "unlit segments"
    ctx.fillStyle = 'rgba(40, 52, 30, 0.07)';
    ctx.font = `700 156px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(t.num('88:88'), mainRight, base);
    ctx.font = `700 92px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(t.num('88'), mainRight + 14, base);
    ctx.fillStyle = '#1c2316';
    ctx.font = `700 156px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(hidden ? '-:--' : t.num(f.main), mainRight, base);
    ctx.font = `700 92px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(hidden ? '--' : t.num(f.small), mainRight + 14, base);
    if (running) {
      ctx.beginPath();
      ctx.moveTo(30, 26);
      ctx.lineTo(56, 42);
      ctx.lineTo(30, 58);
      ctx.fill();
    }
    lcdTex.needsUpdate = true;
  }

  drawDisplay({ seconds: 0 });
  const local = (x, y, z) => () => watch.localToWorld(new THREE.Vector3(x, y, z));
  return {
    root,
    watch,
    buttonHits: hits,
    drawDisplay,
    pressButton,
    points: {
      display: local(0, 4, zFace + 1.3),
      start: () => buttons.start.cap.localToWorld(new THREE.Vector3(0, 3, 0)),
      reset: () => buttons.reset.cap.localToWorld(new THREE.Vector3(0, 3, 0)),
      small: local(15, -1, zFace + 1.3), // the hundredths
    },
  };
}
