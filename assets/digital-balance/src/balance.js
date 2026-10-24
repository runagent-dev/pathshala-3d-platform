// The digital balance of the book's Figure 1.09, in millimetres: a black body, a yellow console sloping towards
// the student with the LCD and the buttons, and a square steel pan at the back. Inside (seen with "look inside")
// a load cell: an aluminium bar the pan presses on, which bends a tiny bit under the weight.
// The front of the balance faces +z; the table is y = 0.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FONT, textMesh } from '@shared/student/materials.js';

export const DIM = {
  width: 180,
  depth: 230,
  height: 52,
  panSize: 136,
  panZ: -46, // centre of the pan
  panTop: 66, // top of the pan surface (unloaded)
};

const LCD_W = 512;
const LCD_H = 176;

export function createBalance({ materials: M, t }) {
  const root = new THREE.Group();
  root.name = 'DigitalBalance';
  const plastic = new THREE.MeshPhysicalMaterial({ name: 'Body', color: 0x17191c, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  const yellow = new THREE.MeshPhysicalMaterial({ name: 'Console', color: 0xf2c200, roughness: 0.38, clearcoat: 0.45, clearcoatRoughness: 0.3 });
  const blue = new THREE.MeshPhysicalMaterial({ name: 'ButtonBlue', color: 0x1f5fd0, roughness: 0.3, clearcoat: 0.6 });
  const red = new THREE.MeshPhysicalMaterial({ name: 'ButtonRed', color: 0xd9342b, roughness: 0.3, clearcoat: 0.6 });
  const shell = [plastic, yellow]; // made see-through by xray()

  // body: a rounded block on four small feet
  const body = new THREE.Mesh(new RoundedBoxGeometry(DIM.width, DIM.height, DIM.depth, 4, 6), plastic);
  body.name = 'Body';
  body.position.y = 4 + DIM.height / 2;
  root.add(body);
  for (const [x, z] of [
    [-70, -95],
    [70, -95],
    [-70, 95],
    [70, 95],
  ]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(7, 8, 4, 20), plastic);
    foot.position.set(x, 2, z);
    root.add(foot);
  }

  // the console: a yellow plate sloping down towards the front, holding the display and the buttons
  const consoleGroup = new THREE.Group();
  consoleGroup.name = 'Console';
  consoleGroup.position.set(0, 4 + DIM.height + 2, 72);
  consoleGroup.rotation.x = 0.24;
  root.add(consoleGroup);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(170, 7, 84, 3, 3), yellow);
  plate.name = 'ConsolePlate';
  consoleGroup.add(plate);

  // LCD: a canvas texture redrawn when the reading changes
  const canvas = document.createElement('canvas');
  canvas.width = LCD_W;
  canvas.height = LCD_H;
  const ctx = canvas.getContext('2d');
  const lcdTex = new THREE.CanvasTexture(canvas);
  lcdTex.colorSpace = THREE.SRGBColorSpace;
  lcdTex.anisotropy = 8;
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(100, 2, 40, 2, 1.5), plastic);
  bezel.position.set(-12, 3.6, -4);
  consoleGroup.add(bezel);
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(92, 31.6), new THREE.MeshBasicMaterial({ map: lcdTex, toneMapped: false }));
  lcd.name = 'Display';
  lcd.rotation.x = -Math.PI / 2;
  lcd.position.set(-12, 4.7, -4);
  consoleGroup.add(lcd);

  // buttons: power (left), tare and unit (right), with their names printed under them
  const buttons = {};
  const hits = [];
  function button(name, x, z, mat, label) {
    const g = new THREE.Group();
    g.position.set(x, 3.5, z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.6, 3.2, 32), mat);
    cap.position.y = 1.6;
    cap.name = `Button:${name}`;
    g.add(cap);
    const text = textMesh(label, 3.6, { color: '#1b1b1b', weight: 700 });
    text.rotation.x = -Math.PI / 2;
    text.position.set(0, 0.06, 10.5);
    g.add(text);
    // a generous invisible target, so a finger finds the button on a phone
    const hit = new THREE.Mesh(new THREE.BoxGeometry(22, 8, 26), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(0, 2, 4);
    hit.userData = { button: name, noExport: true };
    g.add(hit);
    consoleGroup.add(g);
    buttons[name] = { group: g, cap };
    if (name !== 'power') hits.push(hit);
  }
  button('power', -70, 8, red, t('label_power'));
  button('tare', 54, -12, blue, t('label_tare'));
  button('unit', 72, -12, blue, t('label_unit'));
  const brand = textMesh(t('brand'), 4.6, { color: '#1b1b1b', weight: 700 });
  brand.rotation.x = -Math.PI / 2;
  brand.position.set(-12, 3.56, 24);
  consoleGroup.add(brand);
  const spec = textMesh(t('spec'), 3.1, { color: '#2b2b2b', weight: 500 });
  spec.rotation.x = -Math.PI / 2;
  spec.position.set(-12, 3.56, 31);
  consoleGroup.add(spec);

  // the load cell inside (seen through the shell in xray mode), and the post that carries the pan
  const inside = new THREE.Group();
  inside.name = 'Inside';
  root.add(inside);
  const cellMat = new THREE.MeshStandardMaterial({ name: 'Aluminium', color: 0x8f9cad, metalness: 0.55, roughness: 0.4 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x2a3240 });
  const outline = (mesh) =>
    mesh.add(Object.assign(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat), { userData: { noExport: true } }));
  const mount = new THREE.Mesh(new THREE.BoxGeometry(30, 22, 18), cellMat);
  mount.position.set(0, 15, 40);
  outline(mount);
  inside.add(mount);
  const cellPivot = new THREE.Group(); // the load cell bends about its fixed (front) end
  cellPivot.position.set(0, 30, 40);
  inside.add(cellPivot);
  const cell = new THREE.Mesh(new THREE.BoxGeometry(22, 18, 110), cellMat);
  cell.name = 'LoadCell';
  cell.position.set(0, 0, -55);
  outline(cell);
  cellPivot.add(cell);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 22.4, 24), new THREE.MeshBasicMaterial({ color: 0x3a4048 }));
  hole.rotation.z = Math.PI / 2;
  hole.position.set(0, 0, -55);
  cellPivot.add(hole); // the hole that makes a real load cell bend where its strain gauge is
  const gauge = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.6, 14),
    new THREE.MeshStandardMaterial({ name: 'StrainGauge', color: 0xe07a1f, roughness: 0.6 }),
  );
  gauge.position.set(0, 9.4, -55);
  cellPivot.add(gauge);
  const wires = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0, 39.6, -14), new THREE.Vector3(0, 44, 20), new THREE.Vector3(-10, 50, 60)]),
      24,
      0.9,
      8,
    ),
    new THREE.MeshStandardMaterial({ name: 'Wire', color: 0xc0392b, roughness: 0.5 }),
  );
  inside.add(wires);
  inside.visible = false;

  // the pan: a square steel plate with a low rim, on a post down to the load cell
  const pan = new THREE.Group();
  pan.name = 'Pan';
  root.add(pan);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 26, 20), M.chrome);
  post.position.set(0, DIM.panTop - 15, DIM.panZ);
  post.name = 'PanPost';
  pan.add(post);
  const plateGeo = new RoundedBoxGeometry(DIM.panSize, 2.6, DIM.panSize, 3, 2);
  const panPlate = new THREE.Mesh(plateGeo, M.satin);
  panPlate.name = 'PanPlate';
  panPlate.position.set(0, DIM.panTop - 1.3, DIM.panZ);
  pan.add(panPlate);
  const rimMat = M.chrome;
  for (const [x, z, w, d] of [
    [0, DIM.panZ - 67, 136, 2],
    [0, DIM.panZ + 67, 136, 2],
    [-67, DIM.panZ, 2, 136],
    [67, DIM.panZ, 2, 136],
  ]) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), rimMat);
    rim.position.set(x, DIM.panTop + 0.6, z);
    pan.add(rim);
  }
  /** Where things sit on the pan (in the balance's coordinates). */
  const panSurface = () => new THREE.Vector3(0, DIM.panTop + pan.position.y, DIM.panZ);

  // the weight arrow (xray mode): from the pan down onto the load cell
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, DIM.panTop + 40, DIM.panZ), 30, 0xd9342b, 12, 9);
  arrow.visible = false;
  arrow.renderOrder = 10;
  arrow.traverse((m) => {
    if (m.material) Object.assign(m.material, { depthTest: false, transparent: true, linewidth: 2 });
  });
  root.add(arrow);

  // ── state ───────────────────────────────────────────────────────────────────
  let lastDraw = '';
  /** Draws the LCD: the number, the unit, and the NET / STABLE marks. `text` null shows dashes (hidden reading). */
  function drawDisplay({ text, unit, net, stable, negative = false }) {
    const key = `${text}|${unit}|${net}|${stable}|${negative}`;
    if (key === lastDraw) return;
    lastDraw = key;
    ctx.fillStyle = '#b8c3a4';
    ctx.fillRect(0, 0, LCD_W, LCD_H);
    // faint "unlit segments" look
    ctx.fillStyle = 'rgba(40, 52, 30, 0.07)';
    ctx.font = `700 118px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(t.num('8888.8'), LCD_W - 108, 140);
    ctx.fillStyle = '#1c2316';
    ctx.fillText(text == null ? '- - - -' : t.num(text), LCD_W - 108, 140);
    ctx.font = `700 44px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(t(unit === 'kg' ? 'unit_kg' : 'unit_g'), LCD_W - 96, 140);
    ctx.font = `700 30px ${FONT}`;
    if (net) ctx.fillText(t('lcd_net'), 18, 44);
    if (stable) {
      ctx.beginPath();
      ctx.moveTo(LCD_W - 120, 22);
      ctx.lineTo(LCD_W - 100, 33);
      ctx.lineTo(LCD_W - 120, 44);
      ctx.fill();
      ctx.fillText(t('lcd_stable'), LCD_W - 94, 44);
    }
    lcdTex.needsUpdate = true;
  }

  /** The pan sinks a little under load (exaggerated so it can be seen) and the load cell bends with it. */
  function setLoad(grams, { press = 0 } = {}) {
    const sink = Math.min(2.4, (grams / 1000) * 2.4) + press;
    pan.position.y = -sink;
    cellPivot.rotation.x = Math.atan2(sink, 92); // the free end (under the pan post) goes down with the pan
    const length = 24 + 56 * Math.sqrt(Math.min(1, grams / 600));
    arrow.setLength(length, Math.min(14, length * 0.35), 10);
    arrow.position.set(0, DIM.panTop - sink + 3 + length, DIM.panZ);
    arrow.userData.grams = grams;
    arrow.userData.top = DIM.panTop - sink + 3 + length;
  }

  function xray(on) {
    for (const m of shell) {
      m.transparent = on;
      m.opacity = on ? 0.15 : 1;
      m.depthWrite = !on;
      m.needsUpdate = true;
    }
    inside.visible = on;
    arrow.visible = on && arrow.userData.grams > 0;
  }

  function pressButton(name, down) {
    const b = buttons[name];
    if (b) b.cap.position.y = down ? 0.6 : 1.6;
  }

  drawDisplay({ text: '0.0', unit: 'g', net: false, stable: true });
  setLoad(0);
  return {
    root,
    pan,
    panSurface,
    buttonHits: hits,
    drawDisplay,
    setLoad,
    xray,
    pressButton,
    arrow,
    /** Points for labels and pointers (world space). */
    points: {
      display: () => lcd.localToWorld(new THREE.Vector3(0, 0, 0)),
      arrowTip: () => root.localToWorld(new THREE.Vector3(0, arrow.userData.top ?? DIM.panTop + 40, DIM.panZ)),
      cell: () => cell.localToWorld(new THREE.Vector3(11, 0, 20)),
      button: (name) => buttons[name].cap.getWorldPosition(new THREE.Vector3()),
    },
  };
}
