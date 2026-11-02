// The apparatus of the book's চিত্র ৬.০১ (page 162), in centimetres: a tall narrow glass tube on the left, a wide open
// glass vessel on the right, a glass pipe low down between them with a tap (a tan plug and a brown knob), water in
// each. The tap's knob turns a quarter (across the pipe: shut, along it: open). While water runs, small bubbles drift
// along the pipe, one flat arrow shows the way, and each surface has a dashed level line, so "which is higher" is seen.
// The water's height is the whole idea: setLevels(left, right) moves both surfaces.
import * as THREE from 'three';
import { GEOM } from './reading.js';

export const LAYOUT = (() => {
  const tubeOuter = GEOM.tubeR + 0.2;
  const vesselOuter = GEOM.vesselR + 0.2;
  const gap = 8;
  const vx = tubeOuter + gap + vesselOuter; // the vessel's centre
  return { tubeOuter, vesselOuter, gap, vx, pipeY: 1.5, pipeR: 0.7, tapX: tubeOuter + gap / 2, arrowY: 5.4 };
})();

const COLORS = {
  glass: '#cfe6f0',
  rim: '#eef7fa',
  waterCool: new THREE.Color('#1f8fe0'),
  waterHot: new THREE.Color('#ee8a3c'),
  brass: '#b9893a',
  plug: '#d6b07a',
  knob: '#7a5230',
  line: '#1d3550',
  arrow: '#ff9f1a',
  arrowEdge: '#1b2a3b',
};

/** A hollow glass vessel as a surface of revolution: outer wall, rim, inner wall, rounded bottom. */
function glassGeometry(outerR, wall, height, floor, corner = 0.7, segments = 48) {
  const innerR = outerR - wall;
  const pts = [];
  const arc = (cx, cy, r, a0, a1, n = 6) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push(new THREE.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
    }
  };
  pts.push(new THREE.Vector2(0, 0));
  arc(outerR - corner, corner, corner, -Math.PI / 2, 0); // outer bottom corner
  pts.push(new THREE.Vector2(outerR, height));
  pts.push(new THREE.Vector2(innerR, height));
  const ic = Math.max(0.2, corner - wall);
  pts.push(new THREE.Vector2(innerR, floor + ic));
  arc(innerR - ic, floor + ic, ic, 0, -Math.PI / 2); // inner bottom corner
  pts.push(new THREE.Vector2(0, floor));
  return new THREE.LatheGeometry(pts, segments);
}

/** A soft dark spot on the bench under a vessel. */
function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, 'rgba(20,16,10,0.55)');
  grad.addColorStop(0.55, 'rgba(20,16,10,0.28)');
  grad.addColorStop(1, 'rgba(20,16,10,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Dashes for the level lines: white dashes on a clear strip, tinted by the material's colour. */
function dashTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 40, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Warm laminated wood for the bench: long grain, a few darker lines. */
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#b48759';
  g.fillRect(0, 0, 512, 256);
  let s = 7;
  const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 90; i++) {
    const y = r() * 256;
    g.strokeStyle = `rgba(${r() < 0.5 ? '90,56,28' : '214,170,120'},${0.1 + r() * 0.16})`;
    g.lineWidth = 1 + r() * 2;
    g.beginPath();
    g.moveTo(0, y);
    g.bezierCurveTo(150, y + (r() - 0.5) * 8, 330, y + (r() - 0.5) * 8, 512, y + (r() - 0.5) * 4);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** A flat arrow facing +z (length along x, pointing +x), dark edge behind a bright face: reads on any background. */
function flatArrow(len = 4.4, thick = 0.8, headLen = 2.0, headW = 2.5, edge = 0.28) {
  const shape = (grow) => {
    const s = new THREE.Shape();
    const h = thick / 2 + grow;
    const hw = headW / 2 + grow * 1.6;
    const hl = headLen + grow * 1.2;
    const x0 = -len / 2 - grow;
    const x1 = len / 2 + grow * 1.4;
    s.moveTo(x0, -h);
    s.lineTo(x1 - hl, -h);
    s.lineTo(x1 - hl, -hw);
    s.lineTo(x1, 0);
    s.lineTo(x1 - hl, hw);
    s.lineTo(x1 - hl, h);
    s.lineTo(x0, h);
    s.closePath();
    return s;
  };
  const g = new THREE.Group();
  g.name = 'FlowArrow';
  const back = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape(edge), { depth: 0.3, bevelEnabled: false }),
    new THREE.MeshBasicMaterial({ color: COLORS.arrowEdge, toneMapped: false }),
  );
  const face = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape(0), { depth: 0.3, bevelEnabled: false }),
    new THREE.MeshBasicMaterial({ color: COLORS.arrow, toneMapped: false }),
  );
  face.position.z = 0.12;
  g.add(back, face);
  g.userData.noExport = true;
  return g;
}

/**
 * @param {{ shadow?: boolean }} [options]
 */
export function createApparatus({ shadow = true } = {}) {
  const { tubeOuter, vesselOuter, vx, pipeY, pipeR, tapX, arrowY } = LAYOUT;
  const root = new THREE.Group();
  root.name = 'HeatFlowApparatus';

  // ── the bench ───────────────────────────────────────────────────────────────
  const wood = woodTexture();
  wood.repeat.set(3, 1.2);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(80, 2, 36), new THREE.MeshLambertMaterial({ map: wood }));
  bench.name = 'Bench';
  bench.position.set(vx / 2, -1, 0);
  bench.receiveShadow = true;
  bench.userData.noExport = true;
  root.add(bench);
  if (shadow) {
    const blob = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false });
    for (const [x, r] of [
      [0, 3.4],
      [vx, 8.4],
    ]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), blob);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.015, 0.4);
      m.userData.noExport = true;
      root.add(m);
    }
    const pipeBlob = new THREE.Mesh(new THREE.PlaneGeometry(LAYOUT.gap + 2.5, 2.4), blob);
    pipeBlob.rotation.x = -Math.PI / 2;
    pipeBlob.position.set(tapX, 0.016, 0.5);
    pipeBlob.userData.noExport = true;
    root.add(pipeBlob);
  }

  // ── glass ───────────────────────────────────────────────────────────────────
  // glass: a pale film with a bright highlight (Phong: no environment lookup, so the big transparent walls stay cheap)
  const glassMat = new THREE.MeshPhongMaterial({
    name: 'Glass',
    color: COLORS.glass,
    specular: '#ffffff',
    shininess: 120,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    name: 'GlassRim',
    color: COLORS.rim,
    roughness: 0.2,
    metalness: 0,
    transparent: true,
    opacity: 0.85,
  });
  const tube = new THREE.Mesh(glassGeometry(tubeOuter, 0.2, GEOM.tubeH, GEOM.floor, 0.6, 40), glassMat);
  tube.name = 'Tube';
  tube.renderOrder = 4;
  const vessel = new THREE.Mesh(glassGeometry(vesselOuter, 0.2, GEOM.vesselH, 0.4, 1.0, 64), glassMat);
  vessel.name = 'Vessel';
  vessel.position.x = vx;
  vessel.renderOrder = 4;
  const rim = (r, h, x) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r - 0.1, 0.1, 8, 56), rimMat);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, h, 0);
    m.renderOrder = 5;
    return m;
  };
  root.add(tube, vessel, rim(tubeOuter, GEOM.tubeH, 0), rim(vesselOuter, GEOM.vesselH, vx));

  // the pipe (glass, with water in it always) from the tube's wall to the vessel's wall
  const pipeLen = LAYOUT.gap + 0.6;
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(pipeR, pipeR, pipeLen, 24, 1, true), glassMat);
  pipe.name = 'Pipe';
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(tubeOuter + LAYOUT.gap / 2, pipeY, 0);
  pipe.renderOrder = 4;
  root.add(pipe);

  // ── water ───────────────────────────────────────────────────────────────────
  const matL = new THREE.MeshLambertMaterial({
    name: 'WaterTube',
    color: COLORS.waterCool,
    transparent: true,
    opacity: 0.88,
    emissive: COLORS.waterCool,
    emissiveIntensity: 0.35,
    depthWrite: false,
  });
  const matR = matL.clone();
  matR.name = 'WaterVessel';
  const surfMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.2, depthWrite: false, toneMapped: false });
  const column = (r, mat, x, name) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 48).translate(0, 0.5, 0), mat);
    m.name = name;
    m.position.x = x;
    m.renderOrder = 2;
    return m;
  };
  const waterL = column(GEOM.tubeR - 0.02, matL, 0, 'WaterTube');
  const waterR = column(GEOM.vesselR - 0.02, matR, vx, 'WaterVessel');
  const surfL = new THREE.Mesh(new THREE.CircleGeometry(GEOM.tubeR - 0.02, 32), surfMat);
  const surfR = new THREE.Mesh(new THREE.CircleGeometry(GEOM.vesselR - 0.02, 48), surfMat);
  for (const [s, x] of [
    [surfL, 0],
    [surfR, vx],
  ]) {
    s.rotation.x = -Math.PI / 2;
    s.position.x = x;
    s.renderOrder = 3;
    s.userData.noExport = true;
  }
  // the pipe's water: the tube's colour on the tap's left, the vessel's on its right
  const pipeWater = (mat, x0, x1, name) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(pipeR - 0.14, pipeR - 0.14, x1 - x0, 20), mat);
    m.rotation.z = Math.PI / 2;
    m.position.set((x0 + x1) / 2, pipeY, 0);
    m.renderOrder = 2;
    m.name = name;
    return m;
  };
  const waterPipe = pipeWater(matL, tubeOuter - 0.7, tapX, 'WaterPipe');
  const waterPipeR = pipeWater(matR, tapX, tubeOuter + LAYOUT.gap + 0.7, 'WaterPipeRight');
  root.add(waterL, waterR, surfL, surfR, waterPipe, waterPipeR);

  // ── the tap ─────────────────────────────────────────────────────────────────
  const tap = new THREE.Group();
  tap.name = 'Tap';
  tap.position.set(tapX, pipeY, 0);
  const brass = new THREE.MeshStandardMaterial({ name: 'Brass', color: COLORS.brass, roughness: 0.34, metalness: 0.75 });
  const plugMat = new THREE.MeshStandardMaterial({ name: 'TapPlug', color: COLORS.plug, roughness: 0.5, metalness: 0.1 });
  const knobMat = new THREE.MeshStandardMaterial({ name: 'TapKnob', color: COLORS.knob, roughness: 0.55, metalness: 0.05 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 2.3, 28), brass);
  body.rotation.z = Math.PI / 2;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.5, 28), brass);
  collar.position.y = 1.0;
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 1.5, 28), plugMat);
  plug.position.y = 1.55;
  const handle = new THREE.Group();
  handle.position.y = 2.3;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.8, 16), knobMat);
  stem.position.y = 0.2;
  const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 2.2, 6, 14), knobMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.y = 0.65;
  handle.add(stem, bar);
  tap.add(body, collar, plug, handle);
  for (const m of [body, collar, plug, stem, bar]) m.castShadow = shadow;
  // a hit box, bigger than the tap, so a finger finds it
  const hit = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.6, 3.6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 1.2;
  hit.userData.noExport = true;
  tap.add(hit);
  root.add(tap);

  // ── level lines (dashed), one for each surface, in the middle plane ─────────
  const dash = dashTexture();
  const lineMat = new THREE.MeshBasicMaterial({ map: dash, color: COLORS.line, transparent: true, depthWrite: false, toneMapped: false });
  const makeLine = (z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.24), lineMat.clone());
    m.material.map = dash.clone();
    m.material.map.needsUpdate = true;
    m.material.map.wrapS = THREE.RepeatWrapping;
    m.position.z = z;
    m.renderOrder = 6;
    m.userData.noExport = true;
    return m;
  };
  const lineL = makeLine(0.02);
  const lineR = makeLine(-0.02);
  root.add(lineL, lineR);
  const spanLine = (m, x0, x1, y) => {
    m.scale.x = x1 - x0;
    m.position.x = (x0 + x1) / 2;
    m.position.y = y;
    m.material.map.repeat.x = (x1 - x0) / 0.9;
  };

  // ── the arrow and the drifting bubbles ──────────────────────────────────────
  const arrow = flatArrow();
  arrow.position.set(tapX, arrowY, 0.9);
  arrow.visible = false;
  root.add(arrow);

  const BUBBLES = 14;
  const bubbles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.2, 10, 8),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, toneMapped: false }),
    BUBBLES,
  );
  bubbles.frustumCulled = false;
  bubbles.renderOrder = 7;
  bubbles.userData.noExport = true;
  bubbles.visible = false;
  const seeds = Array.from({ length: BUBBLES }, (_, i) => ({
    u: i / BUBBLES,
    y: ((i * 7) % 5) / 5 - 0.4,
    z: ((i * 3) % 4) / 4 - 0.35,
  }));
  root.add(bubbles);

  const pipeX0 = tubeOuter + 0.3;
  const pipeX1 = tubeOuter + LAYOUT.gap - 0.3;
  const m4 = new THREE.Matrix4();

  const api = {
    root,
    /** The tap (a Group), and the objects a tap lands on. */
    tap,
    pickable: [hit],
    bench,
    /** Move both water surfaces (cm above the bench). */
    setLevels(left, right) {
      waterL.scale.y = Math.max(0.001, left - GEOM.floor);
      waterL.position.y = GEOM.floor;
      waterR.scale.y = Math.max(0.001, right - 0.4);
      waterR.position.y = 0.4;
      surfL.position.y = left + 0.005;
      surfR.position.y = right + 0.005;
      spanLine(lineL, tubeOuter + 0.1, vx + GEOM.vesselR, left);
      spanLine(lineR, -tubeOuter - 0.9, tubeOuter + LAYOUT.gap - 0.1, right);
    },
    /** The two surfaces' points (for labels). */
    surfacePoint(side, target) {
      return target.set(side === 'left' ? 0 : vx, side === 'left' ? waterL.position.y + waterL.scale.y : waterR.position.y + waterR.scale.y, 0);
    },
    /** Colour the water by temperature (0 cool … 1 hot) or back to plain blue (null). */
    setWarmth(left, right) {
      for (const [mat, w] of [
        [matL, left],
        [matR, right],
      ]) {
        if (w == null) mat.color.copy(COLORS.waterCool);
        else mat.color.setHSL((0.58 + 0.52 * w) % 1, 0.85, 0.5, THREE.SRGBColorSpace); // blue, through violet and red, to orange
        mat.emissive.copy(mat.color);
      }
    },
    /** The tap's knob: 0 across the pipe (shut) to 1 along it (open). */
    setTap(open) {
      handle.rotation.y = (1 - open) * (Math.PI / 2);
    },
    /** The arrow: dir +1 pointing right, -1 left, 0 hidden; y its height (cm) and k its size (0 to 1). */
    setArrow(dir, y = arrowY, k = 1) {
      arrow.visible = dir !== 0;
      if (!dir) return;
      arrow.position.y = y;
      arrow.scale.set(dir, Math.max(0.5, k), 1);
    },
    /** Drift the bubbles along the pipe (cm/s, signed); false when they are hidden (nothing moves). */
    drift(dt, speed) {
      const moving = Math.abs(speed) > 0.01;
      bubbles.visible = moving;
      if (!moving) return false;
      const len = pipeX1 - pipeX0;
      for (let i = 0; i < BUBBLES; i++) {
        const s = seeds[i];
        s.u = (((s.u + (speed * dt) / len) % 1) + 1) % 1;
        m4.makeTranslation(pipeX0 + s.u * len, pipeY + s.y * 0.7, s.z * 0.8);
        bubbles.setMatrixAt(i, m4);
      }
      bubbles.instanceMatrix.needsUpdate = true;
      return true;
    },
    /** The box that holds the whole apparatus (for the camera), cm. */
    box: new THREE.Box3(
      new THREE.Vector3(-tubeOuter - 0.8, -0.2, -vesselOuter),
      new THREE.Vector3(vx + vesselOuter + 0.8, GEOM.tubeH + 0.6, vesselOuter),
    ),
    dispose() {
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) {
          m.map?.dispose();
          m.dispose();
        }
      });
    },
  };
  api.setLevels(GEOM.tubeH / 2, GEOM.vesselH / 2);
  api.setTap(0);
  return api;
}
