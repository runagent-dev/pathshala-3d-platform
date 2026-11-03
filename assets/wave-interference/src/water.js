// The water in the tank, computed on the GPU: a fine grid (about 3 mm between points, 16 to a wavelength) whose
// vertex shader lifts each point by the sum of the two dippers' ripples (the same formula as src/reading.js), and a
// fragment shader that, for every pixel, works out the exact slope (smooth light at any zoom), the colour from the
// height (crests a light aqua, troughs a deep blue, over a deep saturated blue), a calm grey-blue where the two waves
// cancel (the steady amplitude is small), and faint white dashed lines exactly on the still lines (path difference
// ½λ, 1½λ …), a constant 2–3 px wide on any screen. The CPU does nothing per vertex; it only sets a few uniforms a
// frame. Heights are drawn EXAG times taller than real ripples (about 1 mm), as the picture says. For the GLB, bake()
// writes the same surface into a plain mesh.
import * as THREE from 'three';
import { A0, K, LAMBDA, OMEGA, R0, TANK, V, amplitudeAt, envelope, sources } from './reading.js';

export const EXAG = 12;
const NX = 200;
const NZ = 148;
const EDGE = 0.025; // the last 2.5 cm run onto the foam beaches and die out
const NEAR = [0.006, 0.03]; // right at a dipper the drawn ripple grows from 0 (the bead fills that ring)
const NSCALE = 0.25; // the light sees slopes this fraction of the drawn ones (no glare spots on steep rings)

const DEEP = new THREE.Color('#06306b');
const MID = new THREE.Color('#0f5aa6');
const CREST = new THREE.Color('#66c0ea');
const CALM = new THREE.Color('#5b84a6'); // where the waves cancel: a flat, quiet grey-blue

const smooth = (a, b, x) => {
  const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
const edgeFade = (x, z) => smooth(0, EDGE, Math.min(TANK.w / 2 - Math.abs(x), TANK.d / 2 - Math.abs(z)));

const glslVec3 = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
const f = (x) => (Number.isInteger(x) ? `${x}.0` : String(x));

const COMMON = /* glsl */ `
uniform float uPhase;  // ω t, wrapped to 0…2π
uniform vec2 uAge;     // t − (when each dipper touched), real s; < 0: not in
uniform vec2 uSince;   // t − (when it left); < 0: still dipping
uniform vec4 uSrc;     // x₁, z₁, x₂, z₂
uniform float uGain;   // EXAG · the calming fade
uniform float uRef;    // one wave's amplitude at cork A (m, real)
uniform float uLines;  // 0…1: the dashed still lines
varying vec2 vWiXZ;
const float WI_K = ${f(K)};
const float WI_V = ${f(V)};
const float WI_A0 = ${f(A0)};
const float WI_R0 = ${f(R0)};
const float WI_FRONT = ${f(0.6 * LAMBDA)};
float wiAmp(float r) { return WI_A0 * sqrt(WI_R0 / (WI_R0 + r)); }
float wiEnv(float r, float age, float since) {
  if (age < 0.0) return 0.0;
  float e = smoothstep(0.0, 1.0, (WI_V * age - r) / WI_FRONT);
  if (since >= 0.0) e *= smoothstep(0.0, 1.0, (r - WI_V * since) / WI_FRONT + 1.0);
  return e * smoothstep(${f(NEAR[0])}, ${f(NEAR[1])}, r);
}
float wiFade(vec2 p) {
  float d = min(${f(TANK.w / 2)} - abs(p.x), ${f(TANK.d / 2)} - abs(p.y));
  return smoothstep(0.0, ${f(EDGE)}, d);
}
`;

export function createWater() {
  const geo = new THREE.PlaneGeometry(TANK.w, TANK.d, NX, NZ);
  geo.rotateX(-Math.PI / 2);
  // the surface moves in the shader: keep a box that holds any wave
  geo.computeBoundingBox();
  geo.boundingBox.min.y = -0.03;
  geo.boundingBox.max.y = 0.03;
  geo.computeBoundingSphere();

  const uniforms = {
    uPhase: { value: 0 },
    uAge: { value: new THREE.Vector2(-1, -1) },
    uSince: { value: new THREE.Vector2(-1, -1) },
    uSrc: { value: new THREE.Vector4() },
    uGain: { value: 0 },
    uRef: { value: A0 },
    uLines: { value: 0 },
  };
  const mat = new THREE.MeshStandardMaterial({
    name: 'Water',
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 0.3,
    transparent: true,
    opacity: 0.9,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `${COMMON}\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      /* glsl */ `#include <begin_vertex>
      vWiXZ = position.xz;
      {
        float h = 0.0;
        for (int j = 0; j < 2; j++) {
          vec2 s = j == 0 ? uSrc.xy : uSrc.zw;
          float r = length(position.xz - s) + 1e-6;
          float e = wiEnv(r, uAge[j], uSince[j]);
          h += e * wiAmp(r) * sin(uPhase - WI_K * r);
        }
        transformed.y += h * uGain * wiFade(position.xz);
      }`,
    );
    shader.fragmentShader = `${COMMON}
      vec3 wiNormal;
      vec3 wiColour() {
        float h = 0.0, gx = 0.0, gz = 0.0, re = 0.0, im = 0.0;
        float w[2];
        float rr[2];
        for (int j = 0; j < 2; j++) {
          vec2 s = j == 0 ? uSrc.xy : uSrc.zw;
          vec2 d = vWiXZ - s;
          float r = length(d) + 1e-6;
          float e = wiEnv(r, uAge[j], uSince[j]);
          float a = wiAmp(r);
          float ph = uPhase - WI_K * r;
          float sn = sin(ph);
          h += e * a * sn;
          float dadr = -0.5 * a / (WI_R0 + r);
          float dhdr = e * (dadr * sn - WI_K * a * cos(ph));
          gx += dhdr * d.x / r;
          gz += dhdr * d.y / r;
          re += e * a * cos(WI_K * r);
          im -= e * a * sin(WI_K * r);
          w[j] = e;
          rr[j] = r;
        }
        float fade = wiFade(vWiXZ);
        vec2 g = vec2(gx, gz) * uGain * fade * ${f(NSCALE)};
        float gl = length(g);
        if (gl > 0.45) g *= 0.45 / gl;
        wiNormal = normalize(vec3(-g.x, 1.0, -g.y));
        float hx = h * fade * uGain / (${f(EXAG)} * 2.0 * uRef);
        float hn = hx / sqrt(1.0 + hx * hx); // soft: the tall rings by the dippers never turn white
        vec3 col = hn >= 0.0 ? mix(${glslVec3(MID)}, ${glslVec3(CREST)}, hn) : mix(${glslVec3(MID)}, ${glslVec3(DEEP)}, -hn);
        // where waves are present but cancel: a calm grey-blue (the steady amplitude is small)
        float present = max(w[0], w[1]) * fade * clamp(uGain / ${f(EXAG)}, 0.0, 1.0);
        float ratio = length(vec2(re, im)) / uRef;
        col = mix(col, ${glslVec3(CALM)}, present * (1.0 - smoothstep(0.12, 0.75, ratio)) * 0.9);
        // the still lines: path difference (n + ½)λ, dashed, a constant width on screen
        if (uLines > 0.001) {
          float dl = (rr[1] - rr[0]) / ${f(LAMBDA)};
          float fw = max(fwidth(dl), 1e-5);
          float px = abs(fract(dl) - 0.5) / fw;
          float line = 1.0 - smoothstep(1.0, 1.9, px);
          float dash = smoothstep(0.38, 0.46, fract((rr[0] + rr[1]) / 0.018));
          float crowd = 1.0 - smoothstep(0.12, 0.3, fw); // lines too close together on screen: leave them out
          float away = smoothstep(0.03, 0.06, min(rr[0], rr[1]));
          col = mix(col, vec3(1.0), line * dash * crowd * away * w[0] * w[1] * fade * uLines * 0.7);
        }
        return col;
      }
      ${shader.fragmentShader}`
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb = wiColour();')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  normal = normalize((viewMatrix * vec4(wiNormal, 0.0)).xyz);');
  };
  mat.customProgramCacheKey = () => 'wave-interference-water-1';
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'Water';
  mesh.receiveShadow = true;

  const TWO_PI = 2 * Math.PI;
  /**
   * Sets the surface for time t (real seconds) for sources that touched at on[i] and left at off[i] (null: none /
   * still dipping), gap between them (m), gain (0…1: a quick calming fade), ref: one wave's amplitude at cork A (m),
   * lines: 0…1 for the dashed still lines.
   */
  function update(t, on, off, gap, gain = 1, ref = A0, lines = 0) {
    const src = sources(gap);
    const u = uniforms;
    u.uPhase.value = (((OMEGA * t) % TWO_PI) + TWO_PI) % TWO_PI;
    for (const j of [0, 1]) {
      const age = on[j] == null ? -1 : t - on[j];
      u.uAge.value.setComponent(j, age);
      u.uSince.value.setComponent(j, on[j] == null || off[j] == null ? -1 : Math.max(0, t - off[j]));
    }
    u.uSrc.value.set(src[0].x, src[0].z, src[1].x, src[1].z);
    u.uGain.value = EXAG * gain;
    u.uRef.value = ref;
    u.uLines.value = lines;
  }

  /** The drawn height at (x, z) (the same sum as the shader, for the floating corks and the GLB). */
  function heightAt(x, z, t, on, off, gap, gain = 1) {
    const src = sources(gap);
    let h = 0;
    for (const j of [0, 1]) {
      if (on[j] == null) continue;
      const r = Math.hypot(x - src[j].x, z - src[j].z);
      const e = envelope(r, t, on[j], off[j]) * smooth(NEAR[0], NEAR[1], r);
      if (e) h += e * amplitudeAt(r) * Math.sin(OMEGA * t - K * r);
    }
    return h * EXAG * gain * edgeFade(x, z);
  }

  /** A plain mesh of the surface as it is now (heights and colours baked in), for the GLB. */
  function bake(t, on, off, gap, gain = 1, ref = A0) {
    const g = geo.clone();
    const pos = /** @type {THREE.BufferAttribute} */ (g.attributes.position);
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const h = heightAt(pos.getX(i), pos.getZ(i), t, on, off, gap, gain);
      pos.setY(i, h);
      const hx = h / (EXAG * 2 * ref);
      const hn = hx / Math.sqrt(1 + hx * hx);
      if (hn >= 0) c.copy(MID).lerp(CREST, hn);
      else c.copy(MID).lerp(DEEP, -hn);
      c.toArray(colors, i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ name: 'Water', vertexColors: true, roughness: 0.22, transparent: true, opacity: 0.9 });
    const out = new THREE.Mesh(g, m);
    out.name = 'Water';
    return out;
  }

  update(0, [null, null], [null, null], 0.15, 0);
  return { mesh, update, heightAt, bake };
}
