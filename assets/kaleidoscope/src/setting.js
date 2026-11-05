// The scene, in cm: a calm slate backdrop, a walnut table with no end, and on it three places the camera flies between: the
// kaleidoscope, one strip of glass with a bead in front of it, and two silvered mirrors at 60° with a small ray box.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { STRIP, traceWedge, WEDGE, wedgeSource } from './reading.js';

export const SITES = { tube: 0, strip: 70, two: 140 };
const TWIST = (2 * Math.PI) / 3; // the mirrors stand with the corner away from the viewer, both faces seen
const WEDGE_AT = { a: 7, b: -6.5 }; // the middle of the wedge in the plane of the picture, moved to the site

/** A point of the strip's plane in the world. */
export const stripWorld = (a, b, y = STRIP.ray) => [SITES.strip + a, y, b];
/** A point of the wedge's plane in the world. */
export function wedgeWorld(a, b, y = WEDGE.ray) {
  const c = Math.cos(TWIST);
  const s = Math.sin(TWIST);
  const u = a + WEDGE_AT.a;
  const w = b + WEDGE_AT.b;
  return [SITES.two + u * c - w * s, y, -(u * s + w * c) + 4];
}

function gradient(stops, w = 4, h = 256) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const r = g.createLinearGradient(0, 0, 0, h);
  for (const [at, colour] of stops) r.addColorStop(at, colour);
  g.fillStyle = r;
  g.fillRect(0, 0, w, h);
  return { c, g };
}
function texture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}
const BACKDROP = [
  [0, '#2c4058'],
  [0.5, '#4a6480'],
  [0.8, '#7890a6'],
  [1, '#94a5b5'],
];
/** The wood of the table: planks along the view, a slow grain, all from one small seeded generator. */
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  g.fillStyle = '#a97f5b';
  g.fillRect(0, 0, 512, 256);
  const planks = 4;
  for (let p = 0; p < planks; p++) {
    const y0 = (p * 256) / planks;
    const h = 256 / planks;
    g.fillStyle = ['#ad825d', '#a27855', '#b48a64', '#a87e59'][p];
    g.fillRect(0, y0, 512, h);
    for (let i = 0; i < 46; i++) {
      const y = y0 + rnd() * h;
      g.strokeStyle = `rgba(${rnd() < 0.5 ? '70,44,28' : '206,164,126'},${0.06 + rnd() * 0.12})`;
      g.lineWidth = 0.6 + rnd() * 1.6;
      g.beginPath();
      g.moveTo(-10, y);
      const bow = (rnd() - 0.5) * 7;
      g.bezierCurveTo(170, y + bow, 340, y - bow, 522, y);
      g.stroke();
    }
    g.fillStyle = 'rgba(30,18,12,0.42)';
    g.fillRect(0, y0, 512, 1.4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1200 / 80, 1200 / 40); // one tile: 80 × 40 cm of table
  t.anisotropy = 4;
  return t;
}
/** Silvered glass as it looks from the front: the room's dim light in it, one slanting sheen. */
function silverTexture() {
  const { c, g } = gradient(
    [
      [0, '#51697f'],
      [0.5, '#8ea5b6'],
      [1, '#5d7082'],
    ],
    128,
    64,
  );
  g.fillStyle = 'rgba(255,255,255,0.16)';
  for (const [x0, wide] of [
    [38, 26],
    [86, 9],
  ]) {
    g.beginPath();
    g.moveTo(x0, 64);
    g.lineTo(x0 + 26, 0);
    g.lineTo(x0 + 26 + wide, 0);
    g.lineTo(x0 + wide, 64);
    g.closePath();
    g.fill();
  }
  return texture(c);
}
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

export function createSetting({ stage, shadow, tube }) {
  const { scene } = stage;
  scene.background = texture(gradient(BACKDROP).c);

  // ── light ───────────────────────────────────────────────────────────────────────────────────────────────
  const key = new THREE.DirectionalLight('#eef3fa', 1.7);
  key.position.set(-14, 30, 22);
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight('#dbe6f2', '#6b5244', 1.2));
  const fill = new THREE.DirectionalLight('#ffe7d2', 0.35);
  fill.position.set(24, 10, 18);
  scene.add(fill);
  if (shadow) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 4;
    Object.assign(key.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 2, far: 90 });
  }
  /** The shadow box goes where the camera is going. */
  function setSite(x) {
    key.target.position.set(x, 0, 0);
    key.position.set(x - 14, 30, 22);
    key.target.updateMatrixWorld();
    key.updateMatrixWorld();
  }

  // ── the table ───────────────────────────────────────────────────────────────────────────────────────────
  // no front or back edge: it fades out behind the scene along the view's own depth, so that the line where it meets the
  // backdrop is level at any camera angle (as in plane-mirror-image and parallel-mirrors)
  const TABLE = {
    pmFar: { value: new THREE.Color('#c9c2bd') },
    pmNear: { value: new THREE.Color('#ffffff') },
    pmView: { value: new THREE.Vector3(0, 0, -1) },
    pmFrom: { value: new THREE.Vector3() },
    pmSpan: { value: new THREE.Vector4(0, 1, 0, 1) },
  };
  const tableMat = new THREE.MeshStandardMaterial({ name: 'Table', map: woodTexture(), roughness: 0.62, metalness: 0, transparent: true });
  tableMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TABLE);
    sh.vertexShader = `varying vec3 pmF;\n${sh.vertexShader}`.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\n  pmF = (modelMatrix * vec4(transformed, 1.0)).xyz;',
    );
    sh.fragmentShader = `varying vec3 pmF;
uniform vec3 pmFar; uniform vec3 pmNear; uniform vec3 pmView; uniform vec3 pmFrom; uniform vec4 pmSpan;
${sh.fragmentShader}`.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
  {
    float along = dot(pmF.xz - pmFrom.xz, pmView.xz);
    diffuseColor.rgb *= mix(pmNear, pmFar, smoothstep(pmSpan.x, pmSpan.y, along));
    diffuseColor.a = 1.0 - smoothstep(pmSpan.z, pmSpan.w, along);
  }`,
    );
  };
  tableMat.customProgramCacheKey = () => 'kld-table-1';
  const table = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200).rotateX(-Math.PI / 2).translate(70, 0, 0), tableMat);
  table.name = 'Table';
  table.receiveShadow = true;
  table.renderOrder = -1;
  table.userData.noExport = true;
  scene.add(table);
  const hx = new THREE.Vector3();
  /** Sets the table's fade for a camera: it starts just behind the farthest thing shown. */
  function setFloorFade(cam, box3) {
    cam.getWorldDirection(hx);
    hx.y = 0;
    if (hx.lengthSq() < 1e-6) return;
    hx.normalize();
    const from = cam.position;
    let far = Number.NEGATIVE_INFINITY;
    let near = Number.POSITIVE_INFINITY;
    for (const x of [box3.min.x, box3.max.x])
      for (const z of [box3.min.z, box3.max.z]) {
        const d = (x - from.x) * hx.x + (z - from.z) * hx.z;
        far = Math.max(far, d);
        near = Math.min(near, d);
      }
    TABLE.pmView.value.copy(hx);
    TABLE.pmFrom.value.set(from.x, 0, from.z);
    TABLE.pmSpan.value.set(near, far + 4, far + 4, far + 44);
  }

  scene.add(tube.root);

  const steelMat = new THREE.MeshStandardMaterial({ name: 'Steel', color: '#46505c', roughness: 0.42, metalness: 0.7 });
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'GlassEdge', color: '#58c4a0', roughness: 0.16, emissive: '#10382c' });

  // ── one strip of glass, the bead on a pin, its image ────────────────────────────────────────────────────────
  const { half, height, thick, a0, b0, ray } = STRIP;
  const stripGroup = new THREE.Group();
  stripGroup.name = 'OneStrip';
  stripGroup.position.set(SITES.strip, 0, 0);
  const pane = new THREE.Mesh(
    box(2 * half, height, thick, 0, 0.5 + height / 2, -thick / 2),
    new THREE.MeshStandardMaterial({
      name: 'Glass',
      color: '#d8efe6',
      roughness: 0.06,
      metalness: 0.1,
      transparent: true,
      opacity: 0.26,
      envMapIntensity: 2.2,
      depthWrite: false,
    }),
  );
  pane.renderOrder = 22;
  const paneEdge = new THREE.Mesh(
    mergeGeometries([
      box(2 * half, 0.07, thick, 0, 0.5 + height, -thick / 2),
      box(2 * half, 0.07, thick, 0, 0.5, -thick / 2),
      box(0.07, height, thick, half, 0.5 + height / 2, -thick / 2),
      box(0.07, height, thick, -half, 0.5 + height / 2, -thick / 2),
    ]),
    edgeMat,
  );
  const clips = new THREE.Mesh(
    mergeGeometries([box(3, 0.5, 1.2, -half * 0.42, 0.25, -thick / 2), box(3, 0.5, 1.2, half * 0.72, 0.25, -thick / 2)]),
    steelMat,
  );
  clips.castShadow = shadow;
  paneEdge.castShadow = shadow;
  stripGroup.add(paneEdge, clips, pane);
  const stone = new THREE.IcosahedronGeometry(0.42, 1);
  const pin = new THREE.CylinderGeometry(0.07, 0.07, ray, 8).translate(0, ray / 2, 0);
  const foot = new THREE.CylinderGeometry(0.5, 0.58, 0.16, 20).translate(0, 0.08, 0);
  const stoneMat = new THREE.MeshStandardMaterial({ name: 'RedStone', color: '#e0203a', roughness: 0.2, flatShading: true, emissive: '#5a0512' });
  const beadStand = new THREE.Group();
  beadStand.position.set(a0, 0, b0);
  const stoneMesh = new THREE.Mesh(stone, stoneMat);
  stoneMesh.position.y = ray;
  stoneMesh.castShadow = shadow;
  const pinMesh = new THREE.Mesh(mergeGeometries([pin, foot]), steelMat);
  pinMesh.castShadow = shadow;
  beadStand.add(stoneMesh, pinMesh);
  stripGroup.add(beadStand);
  // the image: the same stand mirrored in the glass's front, as bright as the glass reflects
  const ghostStone = new THREE.MeshBasicMaterial({ name: 'ImageStone', color: '#ff3a52', transparent: true, depthWrite: false });
  const ghostPin = new THREE.MeshBasicMaterial({ name: 'ImagePin', color: '#8b97a5', transparent: true, depthWrite: false });
  const image = new THREE.Group();
  image.name = 'Image';
  image.userData.noExport = true;
  image.position.set(a0, 0, -b0);
  const imageStone = new THREE.Mesh(stone, ghostStone);
  imageStone.position.y = ray;
  image.add(imageStone, new THREE.Mesh(mergeGeometries([pin, foot]), ghostPin));
  image.renderOrder = 21;
  stripGroup.add(image);
  scene.add(stripGroup);
  /** How much of the light the glass reflects, 0 … 1. */
  function setImage(r) {
    const a = Math.min(1, 0.06 + r * 1.3);
    ghostStone.opacity = a;
    ghostPin.opacity = a * 0.8;
  }

  // ── two silvered mirrors at 60°, and the ray box ────────────────────────────────────────────────────────────
  const twoGroup = new THREE.Group();
  twoGroup.name = 'TwoMirrors';
  const silverMat = new THREE.MeshBasicMaterial({ name: 'Silver', map: silverTexture(), toneMapped: false });
  const backMat = new THREE.MeshStandardMaterial({ name: 'MirrorBack', color: '#b9c2cc', roughness: 0.42, metalness: 0.55 });
  const H = 5.2;
  const G = 0.32; // the glass
  function mirror(name, from, to) {
    const a = wedgeWorld(from[0], from[1], 0);
    const b = wedgeWorld(to[0], to[1], 0);
    const length = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const g = new THREE.Group();
    g.name = name;
    g.position.set((a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2);
    g.rotation.y = -Math.atan2(b[2] - a[2], b[0] - a[0]);
    return { g, length };
  }
  // the silver in the plane of the mirror's line, the glass behind it toward the back, so that rays meet the true line
  const parts = (length) => {
    const y = 0.42 + H / 2;
    return {
      face: new THREE.PlaneGeometry(length, H).translate(0, y, 0.005),
      edge: mergeGeometries([
        box(length, 0.1, G, 0, 0.42 + H, -G / 2),
        box(0.1, H, G, -length / 2, y, -G / 2),
        box(0.1, H, G, length / 2, y, -G / 2),
      ]),
      back: box(length, H, 0.1, 0, y, -G - 0.05),
      base: mergeGeometries([box(length * 0.8, 0.42, 1.1, 0, 0.21, -G - 0.45), box(length * 0.5, 0.2, 0.8, 0, 0.5, -G - 0.4)]),
    };
  };
  for (const [name, from, to] of [
    ['MirrorA', [0, 0], [-WEDGE.arm, 0]],
    ['MirrorB', [-WEDGE.arm / 2, (WEDGE.arm * Math.sqrt(3)) / 2], [0, 0]],
  ]) {
    const { g, length } = mirror(name, from, to);
    const p = parts(length);
    const front = new THREE.Mesh(p.face, silverMat);
    const rim = new THREE.Mesh(p.edge, edgeMat);
    const back = new THREE.Mesh(p.back, backMat);
    const base = new THREE.Mesh(p.base, steelMat);
    for (const m of [rim, back, base]) m.castShadow = shadow;
    g.add(front, rim, back, base);
    twoGroup.add(g);
  }
  // the ray box: a dark steel lamp with a slit, turning on its arc round the point on A
  const lamp = new THREE.Group();
  lamp.name = 'RayBox';
  const dark = new THREE.MeshStandardMaterial({ name: 'RayBox', color: '#2b3038', roughness: 0.5, metalness: 0.45 });
  const lampBody = new THREE.Mesh(
    mergeGeometries([
      new THREE.CylinderGeometry(0.62, 0.62, 2.6, 24).rotateZ(Math.PI / 2).translate(-1.3, 0, 0),
      new THREE.CylinderGeometry(0.76, 0.66, 0.4, 24).rotateZ(Math.PI / 2).translate(0.15, 0, 0),
    ]),
    dark,
  );
  lampBody.position.y = WEDGE.ray;
  lampBody.castShadow = shadow;
  const lampFoot = new THREE.Mesh(
    mergeGeometries([
      new THREE.CylinderGeometry(0.1, 0.1, WEDGE.ray, 8).translate(0, WEDGE.ray / 2, 0),
      new THREE.CylinderGeometry(0.72, 0.8, 0.2, 24).translate(0, 0.1, 0),
    ]),
    steelMat,
  );
  lampFoot.position.x = -1.3;
  lampFoot.castShadow = shadow;
  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 20).rotateY(Math.PI / 2).translate(0.36, WEDGE.ray, 0),
    new THREE.MeshBasicMaterial({ name: 'Lens', color: '#ffe08a', toneMapped: false }),
  );
  lamp.add(lampBody, lampFoot, lens);
  twoGroup.add(lamp);
  scene.add(twoGroup);
  const AT = new THREE.Vector3();
  /** Turns the ray box to θ. */
  function setLamp(theta) {
    const s = wedgeSource(theta);
    const w = wedgeWorld(s[0], s[1], 0);
    const hit = traceWedge(theta).hits[0].point;
    const h = wedgeWorld(hit[0], hit[1], 0);
    lamp.position.set(w[0], 0, w[2]);
    AT.set(h[0] - w[0], 0, h[2] - w[2]);
    lamp.rotation.y = -Math.atan2(AT.z, AT.x);
  }

  return { setSite, setFloorFade, setImage, setLamp, stripGroup };
}
