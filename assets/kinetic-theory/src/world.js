// The room (metres): a deep-blue wall with a sunny window and paper bunting, a walnut table, and on it the four
// things of page 152–153 left to right: a brick (a solid), a glass tank of water with a small hole low in its side, a
// closed glass box of gas, and a yellow balloon on a stick. The balloon's shape is one formula, S(θ, φ), used for its
// skin, the sellotape stuck on it and the hole, so they stay on the skin while it grows and shrinks (by scaling).
import * as THREE from 'three';

export const X = { solid: -1.2, liquid: -0.45, gas: 0.3, balloon: 1.12 };
export const TANK = { w: 0.22, h: 0.2, d: 0.13, wall: 0.006, level: 0.145 };
export const HOLE_Y = 0.03; // the tank's hole, above the table
export const BALLOON = { R: 0.12, Ry: 0.145, knot: 0.012, stick: 0.24 };
export const TAPE = { theta: 1.3, phi: 0.6, dTheta: 0.1, dPhi: 0.36, lift: 0.0012 };

function canvasTexture(w, h, draw, { repeat = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

/** A soft round shadow on the table under a thing (cheaper and calmer than a shadow map). */
let shadowTex = null;
function contactShadow(w, d, strength = 0.45) {
  shadowTex ??= canvasTexture(128, 128, (g, W, H) => {
    const r = g.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, W / 2);
    r.addColorStop(0, 'rgba(20,10,5,1)');
    r.addColorStop(0.55, 'rgba(20,10,5,0.45)');
    r.addColorStop(1, 'rgba(20,10,5,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, W, H);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ name: 'ContactShadow', map: shadowTex, transparent: true, opacity: strength, depthWrite: false }),
  );
  m.name = 'ContactShadow';
  m.position.y = 0.0006;
  m.renderOrder = 1;
  return m;
}

/** The balloon's skin at polar angle θ (0 at the top) and azimuth φ, in the balloon's own space (knot at y = 0). */
export function balloonPoint(theta, phi, out = new THREE.Vector3()) {
  const { R, Ry, knot } = BALLOON;
  const c = Math.cos(theta);
  // a little wider above the middle and pinched towards the knot, like a real balloon
  const rho = R * Math.sin(theta) * (1 + 0.1 * c) * (1 - 0.18 * Math.max(0, -c) ** 3);
  return out.set(rho * Math.sin(phi), Ry * c + Ry + knot, rho * Math.cos(phi));
}
/** The outward normal there (numerically). */
export function balloonNormal(theta, phi, out = new THREE.Vector3()) {
  const e = 1e-4;
  const a = balloonPoint(theta + e, phi);
  const b = balloonPoint(theta - e, phi);
  const c = balloonPoint(theta, phi + e);
  const d = balloonPoint(theta, phi - e);
  const dt = a.sub(b);
  const dp = c.sub(d);
  if (dp.lengthSq() < 1e-14) return out.set(0, Math.cos(theta) >= 0 ? 1 : -1, 0);
  return out.copy(dt).cross(dp).normalize();
}

function patchGeometry(rows, cols, at) {
  // columns first, so a draw range reveals the patch from one end to the other (the tape being smoothed on)
  const pos = [];
  const uv = [];
  for (let i = 0; i <= cols; i++)
    for (let j = 0; j <= rows; j++) {
      const p = at(i / cols, j / rows);
      pos.push(p.x, p.y, p.z);
      uv.push(i / cols, j / rows);
    }
  const index = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const a = i * (rows + 1) + j;
      const b = a + rows + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function buildRoom() {
  const room = new THREE.Group();
  room.name = 'Room';
  // the wall: deep blue paint, a warm sunny window, paper bunting
  const wallTex = canvasTexture(2048, 1024, (g, W, H) => {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#2457c5');
    grad.addColorStop(1, '#173f93');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.045)';
    for (let x = 0; x < W; x += 64) g.fillRect(x, 0, 26, H);
    // window (sunlight)
    const win = (x, y, w, h) => {
      g.fillStyle = '#f7f0e0';
      g.fillRect(x - 14, y - 14, w + 28, h + 28);
      const sky = g.createLinearGradient(0, y, 0, y + h);
      sky.addColorStop(0, '#ffe08a');
      sky.addColorStop(1, '#ffb347');
      g.fillStyle = sky;
      g.fillRect(x, y, w, h);
      g.fillStyle = '#f7f0e0';
      g.fillRect(x + w / 2 - 7, y, 14, h);
      g.fillRect(x, y + h / 2 - 7, w, 14);
    };
    win(1220, 300, 300, 330);
    win(330, 330, 240, 280);
    // bunting on a string
    const colours = ['#ff6b35', '#ffd23f', '#ee4266', '#3bceac', '#ffffff', '#f77f00'];
    g.strokeStyle = '#fff5d6';
    g.lineWidth = 3;
    g.beginPath();
    const sag = (x) => 120 + 60 * Math.sin((x / W) * Math.PI);
    g.moveTo(0, sag(0));
    for (let x = 0; x <= W; x += 16) g.lineTo(x, sag(x));
    g.stroke();
    for (let i = 0, x = 30; x < W - 40; x += 74, i++) {
      g.fillStyle = colours[i % colours.length];
      g.beginPath();
      g.moveTo(x, sag(x));
      g.lineTo(x + 54, sag(x + 54));
      g.lineTo(x + 27, sag(x + 27) + 70);
      g.closePath();
      g.fill();
    }
    // a warm skirting band
    g.fillStyle = '#f2a541';
    g.fillRect(0, H - 120, W, 22);
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ name: 'Wall', map: wallTex, toneMapped: false }));
  wall.name = 'Wall';
  wall.position.set(0, 1.0, -1.25);
  room.add(wall);

  // the table: polished walnut
  const wood = canvasTexture(1024, 512, (g, W, H) => {
    g.fillStyle = '#7b4524';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) {
      const y = (i * 37) % H;
      g.strokeStyle = i % 3 ? 'rgba(60,25,8,0.18)' : 'rgba(255,190,120,0.12)';
      g.lineWidth = 1 + (i % 4);
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 32) g.lineTo(x, y + 6 * Math.sin(x / 90 + i));
      g.stroke();
    }
  });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(3, 1);
  const woodMat = new THREE.MeshStandardMaterial({ name: 'Walnut', map: wood, roughness: 0.42, metalness: 0 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.05, 1.3), woodMat);
  top.name = 'TableTop';
  top.position.set(0, -0.025, -0.2);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.04), woodMat);
  apron.name = 'TableApron';
  apron.position.set(0, -0.11, 0.42);
  room.add(top, apron);
  return room;
}

function buildSolid() {
  const g = new THREE.Group();
  g.name = 'Brick';
  const tex = canvasTexture(256, 128, (c, W, H) => {
    c.fillStyle = '#a8442a';
    c.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) {
      c.fillStyle = i % 2 ? 'rgba(90,25,10,0.25)' : 'rgba(255,190,150,0.18)';
      c.fillRect((i * 97) % W, (i * 53) % H, 2, 2);
    }
  });
  const brick = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.065, 0.095),
    new THREE.MeshStandardMaterial({ name: 'BrickClay', map: tex, roughness: 0.88 }),
  );
  brick.name = 'BrickBody';
  brick.position.y = 0.0325;
  // where it touches the table: a bright outline round its footprint (the only place it presses)
  const ring = new THREE.MeshBasicMaterial({ name: 'Footprint', color: '#ff3b3b', toneMapped: false, transparent: true, opacity: 0 });
  const foot = new THREE.Group();
  foot.name = 'Footprint';
  for (const [w, d, x, z] of [
    [0.214, 0.006, 0, 0.0505],
    [0.214, 0.006, 0, -0.0505],
    [0.006, 0.107, 0.1045, 0],
    [0.006, 0.107, -0.1045, 0],
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.002, d), ring);
    m.position.set(x, 0.001, z);
    foot.add(m);
  }
  foot.userData.noExport = true;
  g.add(contactShadow(0.3, 0.17, 0.55), brick, foot);
  g.userData.footprint = ring;
  g.position.x = X.solid;
  return g;
}

function glassMaterial(name) {
  return new THREE.MeshPhysicalMaterial({
    name,
    color: '#e6f6ff',
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMapIntensity: 1.6,
    clearcoat: 1,
  });
}

/** An open-topped glass box (or closed, with a lid): walls as thin boxes, plus bright edges so it reads as glass. */
function glassBox(name, closed) {
  const { w, h, d, wall } = TANK;
  const g = new THREE.Group();
  g.name = name;
  const mat = glassMaterial(`${name}Glass`);
  const panes = [
    [w, wall, d, 0, wall / 2, 0],
    [wall, h, d, -w / 2 + wall / 2, h / 2, 0],
    [wall, h, d, w / 2 - wall / 2, h / 2, 0],
    [w, h, wall, 0, h / 2, -d / 2 + wall / 2],
    [w, h, wall, 0, h / 2, d / 2 - wall / 2],
  ];
  for (const [a, b, c, x, y, z] of panes) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), mat);
    m.position.set(x, y, z);
    m.renderOrder = 4;
    g.add(m);
  }
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)).translate(0, h / 2, 0),
    new THREE.LineBasicMaterial({ name: `${name}Edges`, color: '#f4fbff', transparent: true, opacity: 0.85 }),
  );
  edges.name = `${name}Edges`;
  g.add(edges);
  if (closed) {
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.012, 0.016, d + 0.012),
      new THREE.MeshPhysicalMaterial({ name: 'Lid', color: '#ff7a1a', roughness: 0.35, clearcoat: 0.6 }),
    );
    lid.name = 'Lid';
    lid.position.y = h + 0.008;
    g.add(lid);
  }
  return g;
}

function buildLiquid() {
  const { w, d, wall, level } = TANK;
  const g = new THREE.Group();
  g.name = 'WaterTank';
  g.position.x = X.liquid;
  const water = new THREE.Mesh(
    new THREE.BoxGeometry(w - 2 * wall, level - wall, d - 2 * wall),
    new THREE.MeshPhysicalMaterial({
      name: 'Water',
      color: '#1c7ed6',
      roughness: 0.08,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      clearcoat: 1,
    }),
  );
  water.name = 'Water';
  water.position.y = wall + (level - wall) / 2;
  water.renderOrder = 3;
  g.add(contactShadow(0.36, 0.22, 0.4), water, glassBox('Tank', false));
  // the hole: a dark ring low in the right-hand wall, towards the front
  const hole = new THREE.Mesh(
    new THREE.RingGeometry(0.0035, 0.0065, 20).rotateY(Math.PI / 2),
    new THREE.MeshBasicMaterial({ name: 'HoleRim', color: '#0b2f57', side: THREE.DoubleSide }),
  );
  hole.name = 'Hole';
  hole.position.set(w / 2 + 0.0005, HOLE_Y, 0.025);
  hole.visible = false;
  g.add(hole);
  // the jet: a parabola from the hole into a little bowl; revealed from the hole outwards with a draw range
  const v0 = 0.62; // m/s out of the hole (Torricelli for ~2 cm of water head, drawn a little stronger)
  const gAcc = 9.8;
  const fall = HOLE_Y + 0.002 - 0.012; // down to the water in the bowl
  const tFall = Math.sqrt((2 * fall) / gAcc);
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const s = (i / 24) * tFall;
    pts.push(new THREE.Vector3(w / 2 + v0 * s, HOLE_Y - 0.5 * gAcc * s * s, 0.025));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const jetGeo = new THREE.TubeGeometry(curve, 24, 0.0058, 8, false);
  const jet = new THREE.Mesh(
    jetGeo,
    new THREE.MeshPhysicalMaterial({ name: 'Jet', color: '#1c7ed6', roughness: 0.05, transparent: true, opacity: 0.92, clearcoat: 1 }),
  );
  jet.name = 'Jet';
  jet.userData.indexPerSegment = 8 * 6;
  const landX = w / 2 + v0 * tFall;
  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.034, 0.022, 28, 1, true).translate(0, 0.011, 0),
    new THREE.MeshPhysicalMaterial({ name: 'Bowl', color: '#ffd23f', roughness: 0.3, clearcoat: 0.8, side: THREE.DoubleSide }),
  );
  bowl.name = 'Bowl';
  bowl.position.set(landX, 0, 0.025);
  const bowlBase = new THREE.Mesh(new THREE.CircleGeometry(0.034, 28).rotateX(-Math.PI / 2), bowl.material);
  bowlBase.position.set(landX, 0.001, 0.025);
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(0.036, 28).rotateX(-Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ name: 'BowlWater', color: '#3d9cf0', roughness: 0.05, transparent: true, opacity: 0.8 }),
  );
  puddle.name = 'BowlWater';
  puddle.position.set(landX, 0.004, 0.025);
  const bowlShadow = contactShadow(0.13, 0.13, 0.4);
  bowlShadow.position.set(landX, 0.0006, 0.025);
  g.add(bowlShadow, bowl, bowlBase, puddle, jet);
  return { group: g, jet, hole, puddle, landX };
}

function buildGas() {
  const { w, h, d, wall } = TANK;
  const g = new THREE.Group();
  g.name = 'GasBox';
  g.position.x = X.gas;
  const haze = new THREE.Mesh(
    new THREE.BoxGeometry(w - 2 * wall, h - 2 * wall, d - 2 * wall),
    new THREE.MeshBasicMaterial({ name: 'GasHaze', color: '#c9b8ff', transparent: true, opacity: 0.2, depthWrite: false }),
  );
  haze.name = 'GasHaze';
  haze.position.y = h / 2;
  haze.renderOrder = 3;
  g.add(contactShadow(0.36, 0.22, 0.4), haze, glassBox('Box', true));
  return { group: g };
}

/** Clear tape: a faint milky film with glossy streaks and a darker cut edge (in the texture, so it stays thick). */
function tapeTexture() {
  return canvasTexture(512, 128, (g, W, H) => {
    g.fillStyle = 'rgba(255,253,235,0.55)';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 9; i++) {
      g.lineWidth = 3 + (i % 3) * 3;
      g.beginPath();
      g.moveTo(40 + i * 55, H);
      g.lineTo(90 + i * 55, 0);
      g.stroke();
    }
    g.strokeStyle = 'rgba(150,105,20,0.95)';
    g.lineWidth = 9;
    g.strokeRect(4, 4, W - 8, H - 8);
    // the torn ends
    g.fillStyle = 'rgba(150,105,20,0.95)';
    for (let y = 0; y < H; y += 12) {
      g.fillRect(0, y, 10 + (y % 24 ? 4 : 0), 6);
      g.fillRect(W - 14 + (y % 24 ? 0 : 4), y, 14, 6);
    }
  });
}

function buildBalloon() {
  const root = new THREE.Group(); // at the stick's top, where the knot is
  root.name = 'BalloonOnStick';
  root.position.set(X.balloon, BALLOON.stick, 0);
  const balloon = new THREE.Group(); // scaled as it is blown up, leaks or warms
  balloon.name = 'Balloon';
  root.add(balloon);

  const skinMat = new THREE.MeshPhysicalMaterial({
    name: 'BalloonRubber',
    color: '#ffb000',
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 0.55,
    transparent: true,
    opacity: 0.96,
    emissive: new THREE.Color('#ff5a00'),
    emissiveIntensity: 0,
  });
  const skin = new THREE.Mesh(
    patchGeometry(40, 56, (u, v) => balloonPoint(Math.min(Math.PI - 0.02, 0.0001 + v * Math.PI), u * Math.PI * 2)),
    skinMat,
  );
  skin.name = 'BalloonSkin';
  // the patch is built inside-out (φ then θ); flip the faces so they face out
  skin.geometry.index.array.reverse();
  skin.geometry.computeVertexNormals();
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 10).scale(1, 0.8, 1), skinMat);
  knot.name = 'Knot';
  knot.position.y = 0.004;
  balloon.add(skin, knot);

  // the sellotape: a clear, slightly yellow, glossy strip on the skin
  const { theta, phi, dTheta, dPhi, lift } = TAPE;
  const tapeAt = (u, v) => {
    const th = theta + (v - 0.5) * 2 * dTheta;
    const ph = phi + (u - 0.5) * 2 * dPhi;
    return balloonPoint(th, ph).addScaledVector(balloonNormal(th, ph), lift);
  };
  const tape = new THREE.Mesh(
    patchGeometry(4, 24, tapeAt),
    new THREE.MeshPhysicalMaterial({
      name: 'Sellotape',
      map: tapeTexture(),
      color: '#ffffff',
      roughness: 0.1,
      clearcoat: 1,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  tape.name = 'Sellotape';
  tape.userData.indexPerColumn = 4 * 6;
  tape.renderOrder = 5;
  const edgePts = [];
  for (let i = 0; i <= 24; i++) edgePts.push(tapeAt(i / 24, 0));
  for (let j = 0; j <= 4; j++) edgePts.push(tapeAt(1, j / 4));
  for (let i = 24; i >= 0; i--) edgePts.push(tapeAt(i / 24, 1));
  for (let j = 4; j >= 0; j--) edgePts.push(tapeAt(0, j / 4));
  const tapeEdge = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(edgePts),
    new THREE.LineBasicMaterial({ name: 'SellotapeEdge', color: '#b08a2e', transparent: true, opacity: 0.9 }),
  );
  tapeEdge.name = 'SellotapeEdge';
  balloon.add(tape, tapeEdge);

  const holePoint = balloonPoint(theta, phi).addScaledVector(balloonNormal(theta, phi), lift * 2);
  const holeNormal = balloonNormal(theta, phi);
  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(0.0028, 16),
    new THREE.MeshBasicMaterial({ name: 'BalloonHole', color: '#3a1d05', polygonOffset: true, polygonOffsetFactor: -4 }),
  );
  hole.name = 'BalloonHole';
  hole.position.copy(holePoint);
  hole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), holeNormal);
  balloon.add(hole);

  // the stick and its cup, on a little round base
  const plastic = new THREE.MeshPhysicalMaterial({ name: 'StickPlastic', color: '#f5f5f0', roughness: 0.3, clearcoat: 0.5 });
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, BALLOON.stick, 10).translate(0, -BALLOON.stick / 2, 0), plastic);
  stick.name = 'Stick';
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.006, 0.02, 16, 1, true).translate(0, -0.006, 0), plastic);
  cup.name = 'StickCup';
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.05, 0.012, 28).translate(0, -BALLOON.stick + 0.006, 0),
    new THREE.MeshPhysicalMaterial({ name: 'StickBase', color: '#ee4266', roughness: 0.35, clearcoat: 0.6 }),
  );
  base.name = 'StickBase';
  const shadow = contactShadow(0.16, 0.16, 0.5);
  shadow.position.y = -BALLOON.stick + 0.0006;
  root.add(shadow, stick, cup, base);

  // the needle: shiny steel, tip at the origin pointing down its −Y… placed along the hole's normal each frame
  const steel = new THREE.MeshStandardMaterial({ name: 'Steel', color: '#dfe5ec', metalness: 1, roughness: 0.18 });
  const needle = new THREE.Group();
  needle.name = 'Needle';
  const len = 0.1;
  const r = 0.0026;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r, 0.016, 14).rotateX(Math.PI).translate(0, 0.008, 0), steel);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len - 0.016, 14).translate(0, 0.016 + (len - 0.016) / 2, 0), steel);
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.0042, 0.0014, 8, 18).translate(0, len + 0.002, 0), steel);
  const thread = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, len + 0.002, 0),
        new THREE.Vector3(0.012, len + 0.02, 0.004),
        new THREE.Vector3(0.006, len + 0.05, -0.006),
        new THREE.Vector3(0.02, len + 0.075, 0),
      ]),
      20,
      0.0012,
      6,
    ),
    new THREE.MeshStandardMaterial({ name: 'Thread', color: '#e8384f', roughness: 0.7 }),
  );
  needle.add(tip, shaft, eye, thread);
  needle.visible = false;

  // air rushing out of the hole: small soft puffs (instanced)
  const puffs = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 8),
    new THREE.MeshStandardMaterial({ name: 'AirPuff', color: '#ecf8ff', roughness: 0.7, transparent: true, opacity: 0.55, depthWrite: false }),
    36,
  );
  puffs.name = 'AirPuffs';
  puffs.userData.noExport = true;
  puffs.frustumCulled = false;
  puffs.visible = false;

  return { root, balloon, skin, skinMat, tape, tapeEdge, hole, holePoint, holeNormal, needle, puffs };
}

function buildHeater() {
  // a small heat lamp on a stand, shining warm light at the balloon
  const g = new THREE.Group();
  g.name = 'HeatLamp';
  const dark = new THREE.MeshStandardMaterial({ name: 'LampMetal', color: '#30343b', metalness: 0.6, roughness: 0.35 });
  const red = new THREE.MeshPhysicalMaterial({ name: 'LampShade', color: '#d6332a', roughness: 0.3, clearcoat: 0.7, side: THREE.DoubleSide });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.014, 24).translate(0, 0.007, 0), dark);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.3, 10).translate(0, 0.15, 0), dark);
  const head = new THREE.Group();
  head.position.set(0, 0.3, 0);
  head.rotation.z = -(Math.PI / 2 + 0.25); // the shade's mouth (−Y) turned towards the balloon (−X), a little up
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.055, 0.07, 24, 1, true).translate(0, -0.035, 0), red);
  const bulbMat = new THREE.MeshStandardMaterial({ name: 'LampBulb', color: '#ffb36b', emissive: new THREE.Color('#ff6a00'), emissiveIntensity: 0 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14).translate(0, -0.04, 0), bulbMat);
  head.add(shade, bulb);
  const shadow = contactShadow(0.15, 0.15, 0.45);
  g.add(shadow, base, pole, head);
  g.position.set(X.balloon + 0.36, 0, -0.05);
  // the warm glow round the balloon (a soft additive disc that always faces the camera)
  const glowTex = canvasTexture(128, 128, (c, W, H) => {
    const r = c.createRadialGradient(W / 2, H / 2, 2, W / 2, H / 2, W / 2);
    r.addColorStop(0, 'rgba(255,170,60,0.9)');
    r.addColorStop(0.45, 'rgba(255,110,20,0.35)');
    r.addColorStop(1, 'rgba(255,80,0,0)');
    c.fillStyle = r;
    c.fillRect(0, 0, W, H);
  });
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ name: 'HeatGlow', map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }),
  );
  glow.name = 'HeatGlow';
  glow.userData.noExport = true;
  glow.scale.setScalar(0.9);
  // a soft beam of warm light from the lamp to the balloon
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.17, 1, 32, 1, true).translate(0, -0.5, 0),
    new THREE.MeshBasicMaterial({
      name: 'HeatBeam',
      color: '#ff8c1a',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  beam.name = 'HeatBeam';
  beam.userData.noExport = true;
  return { group: g, bulbMat, glow, beam };
}

export function buildWorld() {
  const model = new THREE.Group();
  model.name = 'KineticTheory';
  const room = buildRoom();
  const solid = buildSolid();
  const liquid = buildLiquid();
  const gas = buildGas();
  const balloon = buildBalloon();
  const heater = buildHeater();
  model.add(room, solid, liquid.group, gas.group, balloon.root, heater.group, heater.glow, heater.beam, balloon.needle, balloon.puffs);
  return { model, room, solid, liquid, gas, balloon, heater };
}
