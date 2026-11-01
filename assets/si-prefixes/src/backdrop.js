// The coloured setting behind the objects: one full-screen quad drawn before everything else (one draw call, no
// texture). Each stop has its own sky, chosen so its object stands out: violet and deep blue in the world of
// particles, a cell's slate and warm plasma, sand under the ant, a day sky with soft clouds from the ball to the
// bridge, and night space with stars from the Earth to the galaxy. Between stops the colours blend; motes (small
// world) and stars (space) stream outward while zooming in and inward while zooming out, so the zoom is felt.
import * as THREE from 'three';

/** Per stop: top and bottom colour (sRGB), and how much of stars, motes and clouds to show (0–1). */
export const BACKDROPS = {
  quark: { top: '#2a1f4f', bottom: '#4b3679', stars: 0, motes: 0.9, clouds: 0 },
  nucleus: { top: '#2b2557', bottom: '#4b3e82', stars: 0, motes: 0.8, clouds: 0 },
  atom: { top: '#1c2c5a', bottom: '#33508f', stars: 0, motes: 0.7, clouds: 0 },
  dna: { top: '#1f2e45', bottom: '#3d5171', stars: 0, motes: 0.7, clouds: 0 },
  rbc: { top: '#f2d49b', bottom: '#dca561', stars: 0, motes: 0.6, clouds: 0 },
  ant: { top: '#e3cc9c', bottom: '#b98f55', stars: 0, motes: 0.25, clouds: 0 },
  ball: { top: '#7fb4e6', bottom: '#b4d3ec', stars: 0, motes: 0, clouds: 0.6 },
  mango: { top: '#79b0e3', bottom: '#b0d0ea', stars: 0, motes: 0, clouds: 0.6 },
  student: { top: '#74abe0', bottom: '#acc9e3', stars: 0, motes: 0, clouds: 0.7 },
  bus: { top: '#6ea6dc', bottom: '#a8c6e2', stars: 0, motes: 0, clouds: 0.7 },
  field: { top: '#5f97d0', bottom: '#97b9dc', stars: 0, motes: 0, clouds: 0.6 },
  bridge: { top: '#4a78b4', bottom: '#86a9d2', stars: 0, motes: 0, clouds: 0.5 },
  earth: { top: '#0c1530', bottom: '#1b2a50', stars: 1, motes: 0, clouds: 0 },
  sun: { top: '#0e1430', bottom: '#20214a', stars: 1, motes: 0, clouds: 0 },
  solar: { top: '#0b1229', bottom: '#1a2444', stars: 1, motes: 0, clouds: 0 },
  star: { top: '#0a1026', bottom: '#1b1d40', stars: 1, motes: 0, clouds: 0 },
  galaxy: { top: '#0d0b24', bottom: '#241c4a', stars: 0.8, motes: 0, clouds: 0 },
};

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
/** A stop's backdrop as 9 numbers: top rgb, bottom rgb, stars, motes, clouds (blended with mixBackdrop). */
export const backdropOf = (id) => {
  const b = BACKDROPS[id];
  return [...rgb(b.top), ...rgb(b.bottom), b.stars, b.motes, b.clouds];
};
/** a + (b − a)·u, into out. */
export function mixBackdrop(out, a, b, u) {
  for (let i = 0; i < out.length; i++) out[i] = a[i] + (b[i] - a[i]) * u;
  return out;
}

export function createBackdrop() {
  const uniforms = {
    uTop: { value: new THREE.Vector3() },
    uBottom: { value: new THREE.Vector3() },
    uMix: { value: new THREE.Vector3() }, // stars, motes, clouds
    uZoom: { value: 0 },
    uSize: { value: new THREE.Vector2(1, 1) },
  };
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      depthTest: false,
      depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }',
      fragmentShader: `uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uMix; uniform float uZoom; uniform vec2 uSize; varying vec2 vUv;
        float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
        // one dot in a share (keep) of the cells of a grid; r and soft in the cell's own units, or px > 0: that many pixels wide
        float dots(vec2 q, float cells, float seed, float r, float soft, float px, float scale, float keep){
          vec2 g = q * cells; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
          float h = hash(id + seed);
          vec2 off = vec2(hash(id + seed + 7.1), hash(id + seed + 3.7)) - 0.5;
          float d = length(f - off * 0.55);
          if (px > 0.0) { d *= scale * uSize.y / cells; r = px * (0.5 + h); }
          return step(1.0 - keep, h) * (1.0 - smoothstep(r * (1.0 - soft), r, d)) * (0.55 + 0.45 * h);
        }
        void main(){
          vec2 p = vUv - 0.5; p.x *= uSize.x / uSize.y;
          vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
          float r = length(p);
          col *= 1.0 + 0.09 * (1.0 - smoothstep(0.0, 0.55, r)) - 0.14 * smoothstep(0.45, 1.0, r);
          if (uMix.z > 0.0) {
            vec2 c = p * vec2(1.6, 4.2) + vec2(3.1, 1.7);
            float n = noise(c) * 0.6 + noise(c * 2.3 + 5.0) * 0.3 + noise(c * 5.1) * 0.1;
            float cloud = smoothstep(0.52, 0.78, n) * smoothstep(-0.25, 0.3, p.y);
            col = mix(col, vec3(0.97, 0.98, 1.0), cloud * 0.55 * uMix.z);
          }
          if (uMix.x + uMix.y > 0.0) {
            float s = 0.0;
            float m = 0.0;
            for (int k = 0; k < 3; k++) {
              float z = uZoom + float(k);
              float tk = fract(z / 3.0);
              float sc = exp2(tk * 3.0);
              float a = sin(3.14159 * tk);
              float seed = float(k) * 17.0 + floor(z / 3.0) * 31.0;
              vec2 q = p / sc;
              s += a * dots(q, 36.0, seed, 0.0, 0.5, 1.1, sc, 0.3);
              m += a * dots(q, 7.0, seed + 5.0, 0.24, 0.85, 0.0, sc, 0.5);
            }
            col = mix(col, vec3(1.0, 0.97, 0.9), clamp(s, 0.0, 1.0) * uMix.x);
            col = mix(col, uTop * 0.4 + 0.6, clamp(m, 0.0, 1.0) * 0.16 * uMix.y);
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  quad.frustumCulled = false;
  quad.renderOrder = -1;
  quad.raycast = () => {};
  return {
    object: quad,
    /** b: 9 numbers from backdropOf/mixBackdrop; W: metres across the view (the zoom). */
    set(b, W, width, height) {
      uniforms.uTop.value.set(b[0], b[1], b[2]);
      uniforms.uBottom.value.set(b[3], b[4], b[5]);
      uniforms.uMix.value.set(b[6], b[7], b[8]);
      uniforms.uZoom.value = -Math.log2(W) * 0.6;
      uniforms.uSize.value.set(width, height);
    },
  };
}
