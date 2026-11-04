// The start of the call as a train of waves, in metres: a voice is many waves, not a burst of two, so five wavelengths
// spread from the mouth at the speed of sound, compressions (সংকোচন, the chapter's teal, darker) and rarefactions
// (প্রসারণ, lighter) evenly spaced at full strength, then dying away in a decaying tail. Seen three ways at once, all
// from the same profile:
// - the fronts as thin spherical shells, only the part heading for the cliff (a cap of ±66°) and only their lower part,
//   up to 2.5 m (a little over the student's head), fading at the top: upright curved bands that sweep over the
//   ground and over the student, while the cliff above stays clear;
// - the rings where those spheres meet the ground, at full strength, in a wide fan in front of the source;
// - a row of air particles on the ground between the cliff and the student, each moving back and forth in place as
//   the pulse passes (bunched at a compression, spread at a rarefaction; the movement is drawn far bigger than life).
// The echo is the reflected wave: by the law of reflection it spreads as a sphere centred on the image of the mouth
// behind the cliff face (x = −x_mouth), drawn only in front of the face. The incoming wave
// is cut off at the face (x = 0) by clipping planes. set(...) places everything for a moment.
import * as THREE from 'three';

const CAP = 1.15; // half-angle of the drawn cap (rad): wide, so its rim is seen edge-on and outlines the front
export const LAMBDA = 1; // m: the drawn wavelength (chosen to be seen)
export const WAVES = 5; // the wavelengths in the drawn train
const BURST = WAVES * LAMBDA;
const FAN = 1.25; // half-angle of the ground rings' fan (rad)
const PARTICLE_STEP = 0.25; // m between the air particles at rest
const PARTICLES = 180; // enough for 0 … 45 m
const AMP = 0.55; // the particles' movement, drawn bigger than life (× the profile's λ/2π)
const DARK = '#0b7285';
const LIGHT = '#c5f6fa';
/** The train's strength at s m behind its leading edge: full for the first half, then a decaying tail, 0 at its end. */
export function envelope(s) {
  const x = s / BURST;
  if (x <= 0 || x >= 1) return 0;
  return x < 0.5 ? 1 : (2 - 2 * x) ** 1.5;
}

/** The shells: a compression at (k + ¼)λ behind the leading edge, a rarefaction at (k + ¾)λ, weaker along the tail. */
const SHELLS = [];
for (let k = 0; k < WAVES; k++) {
  const c = (k + 0.25) * LAMBDA;
  const r = (k + 0.75) * LAMBDA;
  SHELLS.push({ s: c, color: DARK, opacity: 0.32 * envelope(c) }, { s: r, color: LIGHT, opacity: 0.3 * envelope(r) });
}

/** The particles' displacement (m, away from the source) at s m behind the leading edge: compression = ∂u/∂s. */
export function displacement(s) {
  return ((AMP * LAMBDA) / (2 * Math.PI)) * (1 - Math.cos((2 * Math.PI * s) / LAMBDA)) * envelope(s);
}

/** A cap of a unit sphere about +y, then turned so its axis points along ±x. */
function capGeometry(sign) {
  const g = new THREE.SphereGeometry(1, 64, 24, 0, Math.PI * 2, 0, CAP);
  g.rotateZ(sign < 0 ? Math.PI / 2 : -Math.PI / 2); // +y → −x (toward the cliff) or +x (back)
  return g;
}

/** How high the fronts are drawn (m): their lower part, from the ground to a little over the student's head. */
export const CURTAIN = 2.5;

/** A front's film: its lower part only, from the ground up to CURTAIN, fading out over its top metre, a little
 * stronger where it is seen edge-on. Seen from the low camera it is an upright curved band sweeping over the ground
 * (and over the student), and the cliff above stays clear. */
function filmMaterial(name, color, opacity, planes) {
  const m = new THREE.MeshStandardMaterial({
    name,
    color,
    emissive: color,
    emissiveIntensity: 0.5,
    roughness: 0.4,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    clippingPlanes: planes,
  });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vEcY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEcY = (modelMatrix * vec4(transformed, 1.0)).y;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vEcY;').replace(
      '#include <opaque_fragment>',
      `float ecRim = 1.0 - abs(dot(normalize(vViewPosition), normal));
      float ecTop = 1.0 - smoothstep(${(CURTAIN - 1.1).toFixed(2)}, ${CURTAIN.toFixed(2)}, vEcY);
      diffuseColor.a *= ecTop * (0.6 + 0.6 * ecRim * ecRim);
      #include <opaque_fragment>`,
    );
  };
  m.customProgramCacheKey = () => 'echo-curtain';
  return m;
}

/** The fronts where they meet the ground: rings of the same spheres (dark compressions, light rarefactions). */
function groundRipples() {
  const uniforms = {
    uSrc: { value: new THREE.Vector3() },
    uOut: { value: 0 },
    uBack: { value: 0 },
    uFadeOut: { value: 1 },
    uFadeBack: { value: 1 },
    uCos: { value: Math.cos(FAN) },
    uLambda: { value: LAMBDA },
    uBurst: { value: BURST },
    uDark: { value: new THREE.Color(DARK) },
    uLight: { value: new THREE.Color('#e3fafc') },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    vertexShader: /* glsl */ `
      varying vec3 vP;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vP = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSrc; uniform float uOut; uniform float uBack; uniform float uFadeOut; uniform float uFadeBack;
      uniform float uCos; uniform float uLambda; uniform float uBurst; uniform vec3 uDark; uniform vec3 uLight;
      varying vec3 vP;
      // the compression profile s m behind the leading edge: + compression, − rarefaction, the same envelope as in JS
      float profile(float s) {
        if (s <= 0.0 || s >= uBurst) return 0.0;
        float x = s / uBurst;
        float env = x < 0.5 ? 1.0 : pow(2.0 - 2.0 * x, 1.5);
        return sin(6.2831853 * s / uLambda) * env;
      }
      float fan(float c) { return smoothstep(uCos - 0.08, uCos + 0.12, c); }
      void main() {
        if (vP.x < 0.0) discard;
        vec3 a = vP - uSrc;
        float da = length(a);
        float po = profile(uOut - da) * fan(-a.x / max(da, 1e-3)) * uFadeOut;
        vec3 img = vec3(-uSrc.x, uSrc.y, uSrc.z);
        vec3 b = vP - img;
        float db = length(b);
        float pb = profile(uBack - db) * fan(b.x / max(db, 1e-3)) * uFadeBack;
        float p = abs(po) > abs(pb) ? po : pb;
        float band = smoothstep(0.3, 0.62, abs(p));
        if (band < 0.01) discard;
        vec3 col = p > 0.0 ? uDark : uLight;
        gl_FragColor = vec4(col, band * (p > 0.0 ? 0.92 : 0.88));
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(70, 80).rotateX(-Math.PI / 2).translate(35, 0.02, 0), mat);
  mesh.name = 'GroundRipples';
  mesh.renderOrder = 2;
  mesh.userData.noExport = true;
  return { mesh, uniforms };
}

export function createPulse({ cliffTop, rowZ = -0.45 }) {
  const root = new THREE.Group();
  root.name = 'SoundPulse';
  root.userData.noExport = true;
  const ripples = groundRipples();
  root.add(ripples.mesh);
  const face = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0); // keep x ≥ 0
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // keep y ≥ 0
  const top = new THREE.Plane(new THREE.Vector3(0, -1, 0), Math.min(cliffTop, CURTAIN)); // keep y ≤ the curtain's top
  const make = (sign, planes, name, strength) => {
    const geo = capGeometry(sign);
    const group = new THREE.Group();
    group.name = name;
    const shells = SHELLS.map((l, i) => {
      const mesh = new THREE.Mesh(geo, filmMaterial(`${name}${i}`, l.color, l.opacity * strength, planes));
      mesh.renderOrder = 3 + i;
      mesh.userData.base = l.opacity * strength;
      mesh.userData.s = l.s;
      group.add(mesh);
      return mesh;
    });
    root.add(group);
    return { group, shells };
  };
  const out = make(-1, [face, ground, top], 'Sound', 1);
  // the echo is drawn a little lighter: the rock behind it stays readable
  const back = make(1, [face, ground, top], 'Echo', 0.75);

  // the air particles: a row on the ground, each at rest at x = (i + ½) step
  const dots = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.05, 12, 8),
    new THREE.MeshStandardMaterial({ name: 'Air', color: '#0a4f5c', roughness: 0.5 }),
    PARTICLES,
  );
  dots.name = 'AirParticles';
  dots.frustumCulled = false;
  root.add(dots);
  const m4 = new THREE.Matrix4();
  const rowY = 0.06;

  function place(w, cx, cy, cz, r, fade) {
    w.group.visible = r > 0.05 && fade > 0.01;
    w.group.position.set(cx, cy, cz);
    for (const m of w.shells) {
      const ri = r - m.userData.s;
      m.visible = ri > 0.12;
      m.scale.setScalar(Math.max(0.01, ri));
      // the wave weakens as it spreads: the films fade with the radius (the rings on the ground stay)
      m.material.opacity = m.userData.base * fade * Math.min(1, 16 / Math.max(1, ri));
    }
  }

  /**
   * src: the mouth (Vector3, x > 0); rOut: the outgoing front's radius (m); rBack: the echo's radius from the image
   * (0: none yet); fadeOut / fadeBack: 0…1; rowEnd: the particles' row runs from the cliff to here (m).
   */
  function set(src, rOut, rBack, fadeOut = 1, fadeBack = 1, rowEnd = src.x) {
    // the outgoing films fade once the front has reached the face (what is left of them is off to the sides), so the
    // echo coming back is the one front seen
    const outFade = fadeOut * Math.max(0, Math.min(1, 1 - (rOut - src.x - BURST) / (0.6 * src.x)));
    place(out, src.x, src.y, src.z, rOut, outFade);
    place(back, -src.x, src.y, src.z, rBack, fadeBack);
    const u = ripples.uniforms;
    u.uSrc.value.copy(src);
    u.uOut.value = rOut;
    u.uBack.value = rBack;
    u.uFadeOut.value = fadeOut;
    u.uFadeBack.value = fadeBack;
    ripples.mesh.visible = true;
    // the particles: pushed away from the source by the outgoing wave, away from the image by the echo
    let n = 0;
    const dy = rowY - src.y;
    const dz = rowZ - src.z;
    for (let i = 0; i < PARTICLES; i++) {
      const x0 = (i + 0.5) * PARTICLE_STEP;
      if (x0 > rowEnd) break;
      const ax = x0 - src.x;
      const da = Math.hypot(ax, dy, dz);
      const bx = x0 + src.x;
      const db = Math.hypot(bx, dy, dz);
      const ux = displacement(rOut - da) * (ax / da) * fadeOut + (rBack > 0 ? displacement(rBack - db) * (bx / db) * fadeBack : 0);
      m4.makeTranslation(Math.max(0.05, x0 + ux), rowY, rowZ);
      dots.setMatrixAt(n++, m4);
    }
    dots.count = n;
    dots.instanceMatrix.needsUpdate = true;
    dots.visible = n > 0;
  }
  function hide() {
    out.group.visible = false;
    back.group.visible = false;
    ripples.mesh.visible = false;
    dots.visible = false;
  }
  /** The front's point on the axis, for its label: the outgoing one or the echo. */
  function frontPoint(which, src, r, target = new THREE.Vector3()) {
    if (which === 'out') return target.set(src.x - r, src.y, src.z);
    return target.set(-src.x + r, src.y, src.z);
  }
  hide();
  return { root, set, hide, frontPoint, cap: CAP, burst: BURST };
}
