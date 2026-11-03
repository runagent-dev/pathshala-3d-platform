// The clap's sound pulse, in metres: a short burst of three spherical wavefronts (a compression, a rarefaction, a
// compression: the chapter's teal, darker for সংকোচন and lighter for প্রসারণ) spreading from the hands at the speed of
// sound. Only the part of each sphere heading for the cliff is drawn (a cap of about ±35°), so the view stays clear.
// The echo is the reflected wave: by the law of reflection it spreads as a sphere centred on the image of the hands
// behind the cliff face (x = −x_hands), drawn only in front of the face and below the cliff's top. The incoming wave
// is cut off at the face (x = 0) by clipping planes. set(...) places everything for a moment; nothing per frame else.
import * as THREE from 'three';

const CAP = 0.5; // half-angle of the drawn cap (rad)
const SPACING = 0.8; // m between the three fronts
const LAYERS = [
  { color: '#0b7285', opacity: 0.3 }, // compression (darker)
  { color: '#99e9f2', opacity: 0.22 }, // rarefaction (lighter)
  { color: '#0b7285', opacity: 0.18 }, // compression
];

/** A cap of a unit sphere about +y, then turned so its axis points along ±x. */
function capGeometry(sign) {
  const g = new THREE.SphereGeometry(1, 56, 14, 0, Math.PI * 2, 0, CAP);
  g.rotateZ(sign < 0 ? Math.PI / 2 : -Math.PI / 2); // +y → −x (toward the cliff) or +x (back)
  return g;
}

/**
 * The fronts where they meet the ground: rings of the same spheres drawn on the ground (darker compressions, a lighter
 * rarefaction between them), only in front of the cliff and inside the drawn cap. A shader on one flat plane.
 */
function groundRipples() {
  const uniforms = {
    uSrc: { value: new THREE.Vector3() },
    uOut: { value: 0 },
    uBack: { value: 0 },
    uFadeOut: { value: 1 },
    uFadeBack: { value: 1 },
    uCos: { value: Math.cos(CAP) },
    uGap: { value: SPACING },
    uDark: { value: new THREE.Color(LAYERS[0].color) },
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
      uniform float uCos; uniform float uGap; uniform vec3 uDark; uniform vec3 uLight;
      varying vec3 vP;
      float bump(float x, float w) { return smoothstep(w, 0.0, abs(x)); }
      // three fronts behind the leading radius r: compression, rarefaction, compression
      vec2 fronts(float dist, float r, float c) {
        if (r <= 0.05) return vec2(0.0);
        float dark = max(bump(dist - r, 0.26), 0.7 * bump(dist - r + 2.0 * uGap, 0.24));
        float light = bump(dist - r + uGap, 0.3);
        float edge = smoothstep(uCos - 0.04, uCos + 0.06, c);
        return vec2(dark, light) * edge;
      }
      void main() {
        if (vP.x < 0.0) discard;
        vec3 a = vP - uSrc;
        float da = length(a);
        vec2 o = fronts(da, uOut, -a.x / max(da, 1e-3)) * uFadeOut;
        vec3 img = vec3(-uSrc.x, uSrc.y, uSrc.z);
        vec3 b = vP - img;
        float db = length(b);
        vec2 e = fronts(db, uBack, b.x / max(db, 1e-3)) * uFadeBack;
        float dark = max(o.x, e.x);
        float light = max(o.y, e.y);
        float alpha = max(dark * 0.95, light * 0.85);
        if (alpha < 0.01) discard;
        vec3 col = mix(uLight, uDark, dark / max(dark + light, 1e-3));
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 70).rotateX(-Math.PI / 2).translate(30, 0.02, 0), mat);
  mesh.name = 'GroundRipples';
  mesh.renderOrder = 2;
  mesh.userData.noExport = true;
  return { mesh, uniforms };
}

export function createPulse({ cliffTop }) {
  const root = new THREE.Group();
  root.name = 'SoundPulse';
  const ripples = groundRipples();
  root.add(ripples.mesh);
  const face = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0); // keep x ≥ 0
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // keep y ≥ 0
  const top = new THREE.Plane(new THREE.Vector3(0, -1, 0), cliffTop); // keep y ≤ the cliff's top
  const make = (sign, planes, name) => {
    const geo = capGeometry(sign);
    const group = new THREE.Group();
    group.name = name;
    const shells = LAYERS.map((l, i) => {
      const m = new THREE.MeshStandardMaterial({
        name: `${name}${i}`,
        color: l.color,
        emissive: l.color,
        emissiveIntensity: 0.35,
        roughness: 0.5,
        transparent: true,
        opacity: l.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        clippingPlanes: planes,
      });
      const mesh = new THREE.Mesh(geo, m);
      mesh.renderOrder = 3 + i;
      mesh.userData.base = l.opacity;
      group.add(mesh);
      return mesh;
    });
    root.add(group);
    return { group, shells };
  };
  const out = make(-1, [face, ground], 'Sound');
  const back = make(1, [face, ground, top], 'Echo');

  function place(w, cx, cy, cz, r, fade) {
    w.group.visible = r > 0.05 && fade > 0.01;
    w.group.position.set(cx, cy, cz);
    w.shells.forEach((m, i) => {
      const ri = r - i * SPACING;
      m.visible = ri > 0.12;
      m.scale.setScalar(Math.max(0.01, ri));
      // the wave weakens as it spreads: the surfaces fade with the radius (the rings on the ground stay)
      m.material.opacity = m.userData.base * fade * Math.min(1, 14 / Math.max(1, ri));
    });
  }

  /**
   * src: the hands (Vector3, x > 0); rOut: the outgoing front's radius (m); rBack: the echo's radius from the image
   * (0: none yet); fadeOut / fadeBack: 0…1.
   */
  function set(src, rOut, rBack, fadeOut = 1, fadeBack = 1) {
    // the outgoing wave is gone once it has all reached the face (its cap's rim at r cos(CAP) = x)
    const outFade = rOut * Math.cos(CAP) > src.x + SPACING * 2 ? 0 : fadeOut;
    place(out, src.x, src.y, src.z, rOut, outFade);
    place(back, -src.x, src.y, src.z, rBack, fadeBack);
    const u = ripples.uniforms;
    u.uSrc.value.copy(src);
    u.uOut.value = rOut;
    u.uBack.value = rBack;
    u.uFadeOut.value = fadeOut;
    u.uFadeBack.value = fadeBack;
    ripples.mesh.visible = true;
  }
  function hide() {
    out.group.visible = false;
    back.group.visible = false;
    ripples.mesh.visible = false;
  }
  /** The front's point on the axis, for its label: the outgoing one or the echo. */
  function frontPoint(which, src, r, target = new THREE.Vector3()) {
    if (which === 'out') return target.set(src.x - r, src.y + 0.0, src.z);
    return target.set(-src.x + r, src.y, src.z);
  }
  hide();
  return { root, set, hide, frontPoint, cap: CAP };
}
