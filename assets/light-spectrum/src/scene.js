// The setting: a calm slate backdrop, a dark lab bench, and on the bench only what the নিজে করো needs: a real CD held in a
// small stand, and a white wall. Sunlight falls on the disc from above; there is no room and no window. The disc's rainbow
// sheen is computed, not painted: for each pixel the shader asks the grating equation which wavelength reaches the eye from
// that point, so it shifts as the view turns, as a real disc's does. Centimetres.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { alongWall, CD, DISC, landing, landingAt, linearColour, PITCH_NM, SLIT_HALF, SPOT, WALL, WALL_NORMAL, wallPoint } from './reading.js';

const box = (a, b, c, d, e, f) => new THREE.Box3(new THREE.Vector3(a, b, c), new THREE.Vector3(d, e, f));

/** What the camera shows, step by step: a box to fill, and the angle to see it from. All of them read as 3D. */
export const FRAMES = {
  start: { box: box(-17, 3.5, -6, 20, 23.5, 6), az: 5, el: 15 },
  light: { box: box(-17, 3.5, -6, 20, 23.5, 6), az: 5, el: 15 },
  grooves: { box: box(2.5, 7.4, -7, 20.5, 21, 5), az: -28, el: 13 },
  wall: { box: box(-19, 10.6, 0, -4.5, 19.4, 3.2), az: 12, el: 9 },
  beyond: { box: box(-19, 9.4, 0, -4.5, 23.2, 3.2), az: 12, el: 9 },
};

const V = (p) => new THREE.Vector3(p.x, p.y, p.z);

function backdropGeometry() {
  const g = new THREE.SphereGeometry(320, 40, 20);
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  const d = new THREE.Vector3();
  const back = new THREE.Vector3(0.3, 0.14, -1).normalize();
  for (let i = 0; i < p.count; i++) {
    d.fromBufferAttribute(p, i).normalize();
    const k = Math.max(0, d.dot(back));
    const v = 0.03 + 0.1 * k ** 5 + 0.05 * k ** 24;
    c[i * 3] = v * 0.84;
    c[i * 3 + 1] = v;
    c[i * 3 + 2] = v * 1.26;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

/** A soft round glow (white in the middle), tinted by the material. */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 1, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.32, 'rgba(255,255,255,0.5)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The bench top: painted slate with a fine grain. Made once. */
function benchTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * 512;
    g.strokeStyle = `rgba(0,0,0,${0.006 + Math.random() * 0.016})`;
    g.lineWidth = 0.5 + Math.random() * 1.2;
    g.beginPath();
    g.moveTo(Math.random() * 512, y);
    g.lineTo(Math.random() * 512, y + (Math.random() - 0.5) * 5);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 3);
  t.anisotropy = 4;
  return t;
}

/** The spectrum as a strip of linear colour, 380 … 780 nm, for the disc's shader. */
function spectrumTexture() {
  const n = 256;
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const c = linearColour(380 + (400 * (i + 0.5)) / n);
    data[i * 4] = c[0] * 255;
    data[i * 4 + 1] = c[1] * 255;
    data[i * 4 + 2] = c[2] * 255;
    data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

/** The disc's data area: a polished metal with the grating's colours added. The lamp is broad, so the colours fan out. */
function dataMaterial() {
  const m = new THREE.MeshStandardMaterial({ name: 'cd-data', color: 0xc4cad2, metalness: 1, roughness: 0.22, envMapIntensity: 0.9 });
  const uniforms = {
    labC: { value: V(DISC.centre) },
    labN: { value: V(DISC.normal) },
    labL: { value: new THREE.Vector3(-0.36, 0.86, 0.36).normalize() }, // the soft lamp over the bench
    labS: { value: spectrumTexture() },
  };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 labW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nlabW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 labW; uniform vec3 labC; uniform vec3 labN; uniform vec3 labL; uniform sampler2D labS;`,
      )
      .replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
        vec3 labR = normalize(labW - labC);
        vec3 labT = cross(labN, labR);
        vec3 labH = labL + normalize(cameraPosition - labW);
        float labAlong = abs(dot(labH, labR));
        float labAcross = dot(labH, labT);
        float labW0 = exp(-labAcross * labAcross / 0.16);
        vec3 labC0 = vec3(0.0);
        for (int i = 1; i <= 3; i++) {
          float labNm = labAlong * ${PITCH_NM.toFixed(1)} / float(i);
          labC0 += texture2D(labS, vec2((labNm - 380.0) / 400.0, 0.5)).rgb / float(i);
        }
        gl_FragColor.rgb += labC0 * labW0 * 0.4;`,
      );
  };
  return m;
}

function createDisc() {
  const root = new THREE.Group();
  root.name = 'cd';
  // the disc's own axes: its local z is the normal of the shining side
  const zAxis = V(DISC.normal);
  const yAxis = V(DISC.up);
  const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
  root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
  root.position.copy(V(DISC.centre));
  const SEG = 96;
  const t = CD.thick;
  const [from, to] = CD.data;
  const metal = dataMaterial();
  const data = new THREE.Mesh(new THREE.RingGeometry(from, to, SEG, 1), metal);
  data.position.z = t / 2;
  // the bright band of the stamper, between the hub and the tracks, and a clear edge
  const band = new THREE.Mesh(
    new THREE.RingGeometry(1.9, from, SEG, 1),
    new THREE.MeshStandardMaterial({ name: 'cd-band', color: 0xdfe4ea, metalness: 1, roughness: 0.32 }),
  );
  band.position.z = t / 2;
  const clear = new THREE.MeshStandardMaterial({
    name: 'cd-clear',
    color: 0xe8f0f4,
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const hub = new THREE.Mesh(new THREE.RingGeometry(CD.hole, 1.9, SEG, 1), clear);
  hub.position.z = t / 2;
  const rim = new THREE.Mesh(new THREE.RingGeometry(to, CD.radius, SEG, 1), clear);
  rim.position.z = t / 2;
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(CD.radius, CD.radius, t, SEG, 1, true), clear);
  edge.rotation.x = Math.PI / 2;
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(CD.hole, CD.hole, t, 32, 1, true), clear);
  hole.rotation.x = Math.PI / 2;
  // the printed side
  const label = new THREE.Mesh(
    new THREE.RingGeometry(1.9, CD.data[1], SEG, 1),
    new THREE.MeshStandardMaterial({ name: 'cd-label', color: 0xd8dde2, roughness: 0.5, metalness: 0.05, side: THREE.BackSide }),
  );
  label.position.z = -t / 2;
  data.castShadow = true;
  root.add(data, band, hub, rim, edge, hole, label);
  return root;
}

/** The stand: a heavy foot, a steel rod and a soft jaw that holds the disc by its lower edge. */
function createStand() {
  const root = new THREE.Group();
  root.name = 'disc-stand';
  const iron = new THREE.MeshStandardMaterial({ name: 'stand-iron', color: 0x2c3138, roughness: 0.46, metalness: 0.62 });
  const steel = new THREE.MeshStandardMaterial({ name: 'stand-steel', color: 0xa9b0ba, roughness: 0.34, metalness: 0.9 });
  const rubber = new THREE.MeshStandardMaterial({ name: 'stand-rubber', color: 0x16191d, roughness: 0.8 });
  const low = V(DISC.centre).addScaledVector(V(DISC.up), -CD.radius + 0.5); // where the jaw grips
  const foot = new THREE.Mesh(new RoundedBoxGeometry(7.5, 0.8, 6, 2, 0.16), iron);
  foot.position.set(low.x, 0.4, low.z);
  foot.rotation.y = THREE.MathUtils.degToRad(40);
  foot.castShadow = true;
  const h = low.y - 1;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, h, 16), steel);
  rod.position.set(low.x, h / 2, low.z);
  rod.castShadow = true;
  const jaw = new THREE.Group();
  jaw.position.copy(low);
  jaw.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(V(DISC.up), V(DISC.normal)).normalize(), V(DISC.up), V(DISC.normal)),
  );
  const block = new THREE.Mesh(new RoundedBoxGeometry(3.2, 1.3, 0.34, 2, 0.08), iron);
  block.position.set(0, -0.2, 0.26);
  const block2 = block.clone();
  block2.position.z = -0.26;
  const pad = new THREE.Mesh(new RoundedBoxGeometry(2.4, 0.5, 0.2, 1, 0.04), rubber);
  pad.position.set(0, -0.72, 0);
  const knurl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 12), steel);
  knurl.rotation.x = Math.PI / 2;
  knurl.position.set(1.1, -0.3, 0);
  jaw.add(block, block2, pad, knurl);
  block.castShadow = true;
  root.add(foot, rod, jaw);
  return root;
}

/** The white wall: a thick painted board in a low iron foot, standing on the bench. */
function createWall() {
  const w = WALL.half * 2;
  const root = new THREE.Group();
  root.name = 'wall';
  const yaw = THREE.MathUtils.degToRad(WALL.yaw);
  const inward = V(WALL_NORMAL).multiplyScalar(-0.41);
  const board = new THREE.Mesh(
    new RoundedBoxGeometry(w, WALL.height, 0.8, 2, 0.1),
    new THREE.MeshStandardMaterial({ name: 'wall', color: 0xe9ecef, roughness: 0.82, metalness: 0, envMapIntensity: 0.35 }),
  );
  board.position.copy(V(wallPoint(0, WALL.height / 2))).add(inward);
  board.rotation.y = yaw;
  board.receiveShadow = true;
  board.castShadow = true;
  const foot = new THREE.Mesh(
    new RoundedBoxGeometry(w + 0.6, 0.9, 3, 2, 0.12),
    new THREE.MeshStandardMaterial({ name: 'wall-foot', color: 0x2c3138, roughness: 0.46, metalness: 0.62 }),
  );
  foot.position.copy(V(wallPoint(0, 0.45))).add(inward);
  foot.rotation.y = yaw;
  foot.castShadow = true;
  root.add(board, foot);
  return root;
}

/** The spectrum on the wall: each row a wavelength, from the rays of the two ends of the sliver of sunlight. */
function createBand() {
  const from = 396;
  const to = 704;
  const step = 4;
  const cols = Math.floor((to - from) / step) + 1;
  const ROWS = [
    [1, 0],
    [0.82, 1],
    [-0.82, 1],
    [-1, 0],
  ];
  const pos = new Float32Array(cols * ROWS.length * 3);
  const col = new Float32Array(cols * ROWS.length * 4);
  const idx = [];
  const off = V(WALL_NORMAL).multiplyScalar(0.03);
  for (let i = 0; i < cols; i++) {
    const nm = from + i * step;
    const c = linearColour(nm);
    ROWS.forEach(([k, a], j) => {
      const p = landingAt(nm, k * SLIT_HALF);
      const at = (i * ROWS.length + j) * 3;
      pos[at] = p.x + off.x;
      pos[at + 1] = p.y + off.y;
      pos[at + 2] = p.z + off.z;
      const q = (i * ROWS.length + j) * 4;
      col[q] = c[0];
      col[q + 1] = c[1];
      col[q + 2] = c[2];
      col[q + 3] = a;
    });
    if (i < cols - 1)
      for (let j = 0; j < ROWS.length - 1; j++) {
        const a = i * ROWS.length + j;
        const b = a + ROWS.length;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  g.setIndex(idx);
  const m = new THREE.Mesh(
    g,
    new THREE.MeshBasicMaterial({
      name: 'spectrum',
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  );
  m.renderOrder = 3;
  m.userData.noExport = true;
  m.userData.perColumn = (ROWS.length - 1) * 6;
  m.userData.columns = cols - 1;
  return m;
}

export function createSetting({ stage, shadow }) {
  const { scene, renderer } = stage;
  const back = new THREE.Mesh(
    backdropGeometry(),
    new THREE.MeshBasicMaterial({ name: 'backdrop', vertexColors: true, side: THREE.BackSide, dithering: true, toneMapped: false, fog: false }),
  );
  back.userData.noExport = true;
  scene.add(back);

  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(420, 4, 110),
    new THREE.MeshStandardMaterial({ name: 'bench', color: 0x47566a, map: benchTexture(), roughness: 0.58, metalness: 0.05, envMapIntensity: 0.5 }),
  );
  bench.position.set(0, -2, 8);
  bench.receiveShadow = true;
  bench.userData.noExport = true;
  scene.add(bench);

  const apparatus = new THREE.Group();
  apparatus.name = 'apparatus';
  scene.add(apparatus);
  const disc = createDisc();
  apparatus.add(disc, createStand(), createWall());

  const glow = glowTexture();
  const band = createBand();
  scene.add(band);

  const onWallMat = (color) => new THREE.MeshBasicMaterial({ map: glow, color, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  // the white reflection on the wall: the sliver, stretched by the slant of the ray
  const whiteAt = landing(0);
  const spotW = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), onWallMat(0xffffff));
  spotW.scale.set(alongWall(landingAt(0, -SLIT_HALF)) - alongWall(landingAt(0, SLIT_HALF)) + 1.5, 1.7, 1);
  spotW.position.copy(V(whiteAt)).addScaledVector(V(WALL_NORMAL), 0.04);
  spotW.rotation.y = THREE.MathUtils.degToRad(WALL.yaw);
  spotW.renderOrder = 4;
  spotW.visible = false;
  spotW.userData.noExport = true;
  scene.add(spotW);

  // where the sunlight falls on the disc
  const onDisc = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.6),
    new THREE.MeshBasicMaterial({
      map: glow,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  onDisc.position.copy(V(SPOT)).addScaledVector(V(DISC.normal), CD.thick / 2 + 0.03);
  onDisc.quaternion.copy(disc.quaternion);
  onDisc.renderOrder = 4;
  onDisc.visible = false;
  onDisc.userData.noExport = true;
  scene.add(onDisc);

  // the big invisible target for a finger, on the disc
  const hit = new THREE.Mesh(new THREE.SphereGeometry(5.4, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.copy(V(DISC.centre));
  hit.userData.noExport = true;
  scene.add(hit);

  // the lights: a soft lamp over the bench; optics reads best a little dim
  const key = new THREE.DirectionalLight(0xfff3e4, 1.75);
  key.position.set(-10, 48, 34);
  key.target.position.set(0, 6, 0);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.04;
    key.shadow.radius = 5;
    Object.assign(key.shadow.camera, { left: -30, right: 30, top: 30, bottom: -24, near: 10, far: 90 });
  }
  scene.add(new THREE.HemisphereLight(0xcfe0f4, 0x20262e, 0.9));

  const whole = band.userData.columns;
  return {
    apparatus,
    hit,
    /** k: how much of the spectrum (from violet), 0 … 1. */
    spectrum(k) {
      band.visible = k > 0.001;
      band.geometry.setDrawRange(0, Math.round(whole * k) * band.userData.perColumn);
    },
    /** How bright the white spot on the wall and the sunlight on the disc are, 0 … 1. */
    white(k) {
      spotW.visible = k > 0.01;
      spotW.material.opacity = k;
    },
    sun(k) {
      onDisc.visible = k > 0.01;
      onDisc.material.opacity = k;
    },
  };
}
