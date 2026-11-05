// The scene, in metres: a soft sky-to-blush backdrop, a plain floor, the boy, the mirror on its stand in the plane x = 0,
// and his image. The image is the mirror's own transform: the same geometry under a group with scale.x = −1, so it is
// exactly where a plane mirror puts it, wherever he stands, faded because no light is really there.
//
// The ghost is drawn in two passes (depth first, then colour on the nearest surface only), so it is an even 45 % with no
// limbs showing through the body. A little shader on it shows the part the eye can reach through the mirror at 45 % and
// the rest very faint, cut by the exact planes from the eye through the mirror's edges.
//
// renderEyeView draws the small picture of what he sees: a second pass from his eye, with an off-axis frustum whose
// picture plane is the mirror itself, scissored to the mirror's rectangle. So the mirror keeps its size in the picture at
// any distance, and what lies outside its edges is really gone.
import * as THREE from 'three';
import { boyGeometry } from './boy.js';
import { BOY } from './reading.js';

const GHOST = 0.45; // the image, common.md: a translucent ghost of about 45 %
const UNSEEN = 0.11; // the part of it the mirror cannot show
export const MIRROR = { halfW: 0.25, post: 0.05 };
/** The part of the mirror's plane the small picture shows, m. */
export const VIEW = { y0: 0.4, y1: 1.65, z: 0.36 };
const SKY = [
  [0, '#9ccdee'],
  [0.34, '#cfe4f3'],
  [0.56, '#f7e0d8'],
  [1, '#f3c6bc'],
];

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
const texture = (c) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
};
/** The glass: it shows the backdrop behind the camera, a soft gradient, with one slanting sheen. */
function glassTexture() {
  const { c, g } = gradient(
    [
      [0, '#a9cfe4'],
      [0.55, '#d3e6f0'],
      [1, '#c7bcc4'],
    ],
    64,
    256,
  );
  g.fillStyle = 'rgba(255,255,255,0.5)';
  for (const [y0, wide] of [
    [176, 44],
    [122, 14],
  ]) {
    g.beginPath();
    g.moveTo(0, y0);
    g.lineTo(64, y0 - 96);
    g.lineTo(64, y0 - 96 + wide);
    g.lineTo(0, y0 + wide);
    g.closePath();
    g.fill();
  }
  const t = texture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function createSetting({ stage, shadow }) {
  const { scene } = stage;
  const sky = texture(gradient(SKY).c);
  scene.background = sky;

  // ── light ───────────────────────────────────────────────────────────────────────────────────────────────
  const sun = new THREE.DirectionalLight('#fff6ea', 2.1);
  sun.position.set(-2.2, 4.2, 3.4);
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#dcecf8', '#c9a79c', 0.75));
  const fill = new THREE.DirectionalLight('#ffe9e0', 0.55);
  fill.position.set(2, 1.4, 2.6);
  scene.add(fill);
  if (shadow) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.012;
    sun.shadow.radius = 4;
  }

  // ── the floor ───────────────────────────────────────────────────────────────────────────────────────────
  // warm sand, a little deeper near the viewer; it fades out behind the scene along the view's own depth, so whatever
  // the angle the line where it meets the sky is level
  const FLOOR = {
    pmFar: { value: new THREE.Color('#f8e3cf') },
    pmNear: { value: new THREE.Color('#e7bd9a') },
    pmView: { value: new THREE.Vector3(0, 0, -1) }, // x, z: the view's direction along the floor; y: unused
    pmFrom: { value: new THREE.Vector3() }, // x, z of the camera
    pmSpan: { value: new THREE.Vector4(0, 1, 0, 1) }, // near tone from, to; fade from, to (m along the view)
  };
  const floorMat = new THREE.MeshStandardMaterial({ name: 'Floor', color: '#ffffff', roughness: 0.9, metalness: 0, transparent: true });
  floorMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, FLOOR);
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
    diffuseColor.rgb = mix(pmNear, pmFar, smoothstep(pmSpan.x, pmSpan.y, along));
    diffuseColor.a = 1.0 - smoothstep(pmSpan.z, pmSpan.w, along);
  }`,
    );
  };
  floorMat.customProgramCacheKey = () => 'pm-floor-1';
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), floorMat);
  floor.name = 'Floor';
  floor.receiveShadow = true;
  floor.renderOrder = -1;
  floor.userData.noExport = true;
  scene.add(floor);
  const hx = new THREE.Vector3();
  /** Sets the floor's tones and its fade for a camera: the fade starts just behind the farthest thing shown. */
  function setFloorFade(cam, xmin, xmax) {
    cam.getWorldDirection(hx);
    hx.y = 0;
    hx.normalize();
    const from = cam.position;
    const back = -0.5;
    const along = (x, z) => (x - from.x) * hx.x + (z - from.z) * hx.z;
    const far = Math.max(along(xmin, back), along(xmax, back));
    const near = Math.min(along(xmin, 1), along(xmax, 1));
    FLOOR.pmView.value.copy(hx);
    FLOOR.pmFrom.value.set(from.x, 0, from.z);
    FLOOR.pmSpan.value.set(near, far, far, far + 1.8);
  }

  // ── the boy and his image ───────────────────────────────────────────────────────────────────────────────
  const made = boyGeometry();
  const matte = new THREE.MeshStandardMaterial({ name: 'BoyCloth', vertexColors: true, roughness: 0.74, metalness: 0 });
  const gloss = new THREE.MeshStandardMaterial({ name: 'BoyPolish', vertexColors: true, roughness: 0.42, metalness: 0 });
  const boy = new THREE.Group();
  boy.name = 'Boy';
  const shapes = [
    [made.geometry.matte, matte],
    [made.geometry.gloss, gloss],
  ];
  for (const [geometry, material] of shapes) {
    const m = new THREE.Mesh(geometry, material);
    m.name = `Boy-${material.name}`;
    m.castShadow = true;
    m.receiveShadow = true;
    boy.add(m);
  }
  boy.rotation.y = Math.PI / 2;
  scene.add(boy);

  const U = {
    pmEye: { value: new THREE.Vector2() },
    pmTop: { value: new THREE.Vector2() },
    pmBot: { value: new THREE.Vector2() },
    pmUse: { value: new THREE.Vector2(0, 0) }, // whether the top and the bottom cut apply
    pmAlpha: { value: GHOST },
    pmFaint: { value: UNSEEN },
  };
  function ghostMaterial(from) {
    const m = from.clone();
    m.name = `Ghost-${from.name}`;
    m.transparent = true;
    m.depthWrite = false;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = `varying vec2 pmW;\n${sh.vertexShader}`.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n  pmW = (modelMatrix * vec4(transformed, 1.0)).xy;',
      );
      sh.fragmentShader = `varying vec2 pmW;
uniform vec2 pmEye; uniform vec2 pmTop; uniform vec2 pmBot; uniform vec2 pmUse; uniform float pmAlpha; uniform float pmFaint;
${sh.fragmentShader}`.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  {
    vec2 q = pmW - pmEye;
    float out0 = pmUse.x * smoothstep(-0.004, 0.004, dot(q, pmTop));
    float out1 = pmUse.y * smoothstep(-0.004, 0.004, -dot(q, pmBot));
    diffuseColor.a *= mix(pmAlpha, pmFaint, max(out0, out1));
  }`,
      );
    };
    m.customProgramCacheKey = () => 'pm-ghost-1';
    return m;
  }
  // scale.x = −1 about the plane x = 0: this is the mirror
  const reflected = new THREE.Group();
  reflected.name = 'Image';
  reflected.scale.x = -1;
  const inner = new THREE.Group();
  inner.rotation.y = Math.PI / 2;
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true });
  for (const [geometry, material] of shapes) {
    const pre = new THREE.Mesh(geometry, depthOnly);
    pre.renderOrder = 1;
    pre.userData.noExport = true;
    const m = new THREE.Mesh(geometry, ghostMaterial(material));
    m.name = `Image-${material.name}`;
    m.renderOrder = 2;
    inner.add(pre, m);
  }
  reflected.add(inner);
  scene.add(reflected);

  // ── the mirror ──────────────────────────────────────────────────────────────────────────────────────────
  const mirror = new THREE.Group();
  mirror.name = 'Mirror';
  const steel = new THREE.MeshStandardMaterial({ name: 'Steel', color: '#59616c', roughness: 0.4, metalness: 0.75 });
  const wood = new THREE.MeshStandardMaterial({ name: 'Frame', color: '#5b3f2d', roughness: 0.48, metalness: 0.05 });
  const silver = new THREE.MeshStandardMaterial({ name: 'Silvering', color: '#b9bec4', roughness: 0.3, metalness: 0.9 });
  const edge = new THREE.MeshStandardMaterial({ name: 'GlassEdge', color: '#8ccdb0', roughness: 0.2, metalness: 0 });
  const glassMap = glassTexture();
  const glassMat = new THREE.MeshBasicMaterial({ name: 'Glass', map: glassMap, toneMapped: false });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const part = (name, material, cast = true) => {
    const m = new THREE.Mesh(box, material);
    m.name = name;
    m.castShadow = cast;
    mirror.add(m);
    return m;
  };
  const W = MIRROR.halfW * 2;
  // the stand: a slim upright on a floor bar, standing just behind the mirror
  const post = part('Post', steel);
  post.scale.set(0.022, 1.66, 0.03);
  post.position.set(MIRROR.post, 0.84, 0);
  const foot = part('Foot', steel);
  foot.scale.set(0.05, 0.022, 0.5);
  foot.position.set(MIRROR.post, 0.011, 0);
  const foot2 = part('Foot2', steel);
  foot2.scale.set(0.3, 0.018, 0.04);
  foot2.position.set(MIRROR.post + 0.08, 0.009, 0);
  // the glass in front, its green edge, the silver on its back, a thin frame round it, two clamps on the upright
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateY(-Math.PI / 2), glassMat);
  glass.name = 'Glass';
  mirror.add(glass);
  const rim = part('GlassEdge', edge, false);
  const back = part('Silvering', silver);
  const side0 = part('FrameSide', wood);
  const side1 = part('FrameSide2', wood);
  const barT = part('FrameTop', wood);
  const barB = part('FrameBottom', wood);
  const clampT = part('ClampTop', steel, false);
  const clampB = part('ClampBottom', steel, false);
  scene.add(mirror);

  function setMirror(top, bottom) {
    const h = top - bottom;
    const mid = (top + bottom) / 2;
    glass.position.set(-0.0015, mid, 0);
    glass.scale.set(1, h, W);
    // the glass shows the same height of the backdrop whatever its size
    glassMap.repeat.set(1, h / 1.7);
    glassMap.offset.set(0, bottom / 1.7);
    rim.position.set(0.0015, mid, 0);
    rim.scale.set(0.004, h + 0.007, W + 0.007);
    back.position.set(0.006, mid, 0);
    back.scale.set(0.004, h + 0.007, W + 0.007);
    for (const [bar, s] of [
      [side0, -1],
      [side1, 1],
    ]) {
      bar.position.set(0.0065, mid, s * (MIRROR.halfW + 0.01));
      bar.scale.set(0.025, h + 0.04, 0.016);
    }
    barT.position.set(0.0065, top + 0.01, 0);
    barT.scale.set(0.025, 0.016, W + 0.036);
    barB.position.set(0.0065, bottom - 0.01, 0);
    barB.scale.set(0.025, 0.016, W + 0.036);
    clampT.position.set((0.012 + MIRROR.post) / 2 + 0.004, top - 0.05, 0);
    clampT.scale.set(MIRROR.post, 0.024, 0.05);
    clampB.position.set((0.012 + MIRROR.post) / 2 + 0.004, bottom + 0.05, 0);
    clampB.scale.set(MIRROR.post, 0.024, 0.05);
  }

  // the boy's reference: his eye's vertical stands g·k ahead of X
  function setBoy(d, H = BOY.H) {
    const k = H / BOY.H;
    const x = -d + BOY.g * k - made.eye.z * k;
    for (const g of [boy, inner]) {
      g.position.set(x, 0, 0);
      g.scale.setScalar(k);
    }
    if (shadow) {
      const half = d / 2 + 1.2;
      Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 0.5, far: 12 + d });
      sun.target.position.set(-d / 2, 0, 0);
      sun.position.set(-d / 2 - 2.2, 4.2, 3.4);
      sun.target.updateMatrixWorld();
    }
  }
  const pa = new THREE.Vector2();
  /** What the eye reaches through the mirror: the cuts on the ghost, or none where the whole of him shows. */
  function setImage(k) {
    reflected.visible = k > 0;
    U.pmAlpha.value = GHOST * k;
    U.pmFaint.value = UNSEEN * k;
  }
  function setCuts(e, top, bottom, showsHead, showsFeet) {
    U.pmEye.value.set(e.x, e.y);
    pa.set(-e.x, top - e.y);
    U.pmTop.value.set(-pa.y, pa.x);
    pa.set(-e.x, bottom - e.y);
    U.pmBot.value.set(-pa.y, pa.x);
    U.pmUse.value.set(showsHead ? 0 : 1, showsFeet ? 0 : 1);
  }

  // ── what he sees ────────────────────────────────────────────────────────────────────────────────────────
  const eyeCam = new THREE.PerspectiveCamera();
  eyeCam.rotation.set(0, -Math.PI / 2, 0);
  /** rect: the small picture, css px from the stage's top left; e: the eye; the mirror between top and bottom. */
  function renderEyeView(rect, e, top, bottom) {
    const R = stage.renderer;
    const { width: W0, height: H0 } = stage;
    const n = 0.04;
    const k = n / -e.x;
    eyeCam.projectionMatrix.makePerspective(-VIEW.z * k, VIEW.z * k, (VIEW.y1 - e.y) * k, (VIEW.y0 - e.y) * k, n, 80);
    eyeCam.projectionMatrixInverse.copy(eyeCam.projectionMatrix).invert();
    eyeCam.position.set(e.x, e.y, 0);
    eyeCam.updateMatrixWorld(true);
    const py = rect.h / (VIEW.y1 - VIEW.y0);
    const pz = rect.w / (2 * VIEW.z);
    const my = rect.y + (VIEW.y1 - top) * py;
    const mh = (top - bottom) * py;
    const mw = 2 * MIRROR.halfW * pz;
    const mx = rect.x + (rect.w - mw) / 2;
    const alpha = U.pmAlpha.value;
    const faint = U.pmFaint.value;
    const was = reflected.visible;
    const use = U.pmUse.value.clone();
    reflected.visible = true;
    boy.visible = false;
    mirror.visible = false;
    U.pmAlpha.value = 1;
    U.pmUse.value.set(0, 0);
    const span = FLOOR.pmSpan.value.clone();
    const view = FLOOR.pmView.value.clone();
    const from = FLOOR.pmFrom.value.clone();
    setFloorFade(eyeCam, -e.x * 2, -e.x * 2);
    FLOOR.pmSpan.value.set(0, -e.x * 2, -e.x * 2 + 0.6, -e.x * 2 + 2.4);
    R.setViewport(rect.x, H0 - rect.y - rect.h, rect.w, rect.h);
    R.setScissorTest(true);
    R.setScissor(mx, H0 - my - mh, mw, mh);
    R.render(scene, eyeCam);
    R.setScissorTest(false);
    R.setViewport(0, 0, W0, H0);
    FLOOR.pmSpan.value.copy(span);
    FLOOR.pmView.value.copy(view);
    FLOOR.pmFrom.value.copy(from);
    U.pmAlpha.value = alpha;
    U.pmFaint.value = faint;
    reflected.visible = was;
    U.pmUse.value.copy(use);
    boy.visible = true;
    mirror.visible = true;
  }

  /** The three objects for the book's GLB: the image with a plain faded material. */
  function exportModel() {
    const g = new THREE.Group();
    g.name = 'plane-mirror-image';
    const clean = (o) => {
      const c = o.clone(true);
      c.traverse((n) => {
        if (n.isMesh) n.castShadow = n.receiveShadow = false;
      });
      return c;
    };
    g.add(clean(boy), clean(mirror));
    const image = new THREE.Group();
    image.name = 'Image';
    image.scale.x = -1;
    const copy = clean(boy);
    copy.name = 'BoyImage';
    copy.traverse((n) => {
      if (n.isMesh) {
        n.material = n.material.clone();
        n.material.name = `${n.material.name}-faded`;
        n.material.transparent = true;
        n.material.opacity = GHOST;
      }
    });
    image.add(copy);
    g.add(image);
    return g;
  }

  return { setMirror, setBoy, setImage, setCuts, setFloorFade, renderEyeView, exportModel, made, boy, mirror };
}
