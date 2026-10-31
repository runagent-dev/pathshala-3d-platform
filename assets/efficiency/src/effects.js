// Where the wasted energy goes, made visible on the winch: heat shimmering up off the motor (its windings glow),
// sparks and a warm glow where the gear teeth rub, rings of sound spreading from the gears, and the current running
// in the cables (bright beads, out along the red and back along the blue). Each effect's strength follows the power
// that goes that way; render(time) depends only on the time and the strengths, so pictures are repeatable.
// Nothing here is exported to the GLB (userData.noExport).
import * as THREE from 'three';

/** A soft round dot (sparks, beads). */
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Heat haze: wavy warm streaks rising, fading at the top and the edges. */
const shimmerShader = {
  uniforms: { uTime: { value: 0 }, uStrength: { value: 0 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform float uTime; uniform float uStrength; varying vec2 vUv;
    void main() {
      float y = vUv.y; float x = vUv.x;
      float wave = sin((x * 9.0 + sin(y * 7.0 - uTime * 3.1) * 1.4) * 3.1416 + uTime * 0.7);
      float streak = smoothstep(0.35, 1.0, wave) * 0.8 + 0.2;
      float rise = 0.55 + 0.45 * sin(y * 18.0 - uTime * 6.0 + x * 4.0);
      float edge = smoothstep(0.0, 0.25, x) * smoothstep(1.0, 0.75, x);
      float fade = smoothstep(0.0, 0.15, y) * (1.0 - smoothstep(0.35, 1.0, y));
      float a = uStrength * streak * rise * edge * fade * 0.55;
      vec3 col = mix(vec3(1.0, 0.45, 0.08), vec3(1.0, 0.85, 0.35), y);
      gl_FragColor = vec4(col, a);
    }`,
};

/**
 * @param {{ points: Record<string, THREE.Vector3>, curves: { red: THREE.Curve<THREE.Vector3>, blue: THREE.Curve<THREE.Vector3> }, camera: THREE.Camera }} o
 */
export function createEffects({ points, curves, camera }) {
  const root = new THREE.Group();
  root.name = 'WasteEffects';
  root.userData.noExport = true;
  const dot = dotTexture();

  // heat haze over the motor: three crossed planes, always drawn after the scene
  const haze = new THREE.Group();
  const hazeMat = new THREE.ShaderMaterial({
    ...shimmerShader,
    uniforms: THREE.UniformsUtils.clone(shimmerShader.uniforms),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 3; i++) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.55), hazeMat);
    plane.rotation.y = (i * Math.PI) / 3;
    plane.position.y = 0.3;
    haze.add(plane);
  }
  haze.position.copy(points.motorTop);
  haze.renderOrder = 5;
  root.add(haze);

  // sparks where the teeth rub: short bright streaks thrown out of the two meshes
  const SPARKS = 60;
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(SPARKS * 3), 3));
  sparkGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(SPARKS * 3), 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({ size: 0.022, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  sparks.frustumCulled = false;
  sparks.renderOrder = 6;
  root.add(sparks);
  // a warm glow on each mesh
  const glowMat = new THREE.SpriteMaterial({
    map: dot,
    color: '#ff8a1f',
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const glows = [points.wormMesh, points.gearMesh].map((p) => {
    const s = new THREE.Sprite(glowMat);
    s.position.copy(p);
    s.renderOrder = 6;
    root.add(s);
    return s;
  });

  // sound: rings spreading from the gears, facing the camera
  const RINGS = 4;
  const ringMat = new THREE.MeshBasicMaterial({ color: '#7048e8', transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const rings = Array.from({ length: RINGS }, () => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 48, 1, -Math.PI * 0.42, Math.PI * 0.84), ringMat.clone());
    m.renderOrder = 6;
    root.add(m);
    return m;
  });

  // the current: beads running along the cables
  const BEADS = 9;
  const beadMat = new THREE.SpriteMaterial({ map: dot, color: '#fff3a0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const beads = [];
  for (const [k, dir] of [
    ['red', 1],
    ['blue', -1],
  ])
    for (let i = 0; i < BEADS; i++) {
      const s = new THREE.Sprite(beadMat);
      s.scale.setScalar(0.04);
      s.userData = { curve: curves[k], dir, phase: i / BEADS };
      s.renderOrder = 6;
      root.add(s);
      beads.push(s);
    }

  const strength = { heat: 0, motorPower: 0, friction: 0, sound: 0, current: 0 };
  const tmp = new THREE.Vector3();
  /** A repeatable pseudo-random number for spark i in burst n. */
  const hash = (i, n) => {
    const s = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  /**
   * Strengths 0…1: heat (how hot the motor has become), motorPower (the motor's heat flow now), friction (the gears'),
   * sound, current (0 off, 1 running).
   */
  function set(next) {
    Object.assign(strength, next);
  }
  function render(time) {
    hazeMat.uniforms.uTime.value = time;
    hazeMat.uniforms.uStrength.value = Math.min(1, strength.heat * 0.6 + strength.motorPower * 0.7);
    haze.visible = hazeMat.uniforms.uStrength.value > 0.02;
    haze.quaternion.copy(camera.quaternion);
    haze.rotation.set(0, Math.atan2(camera.position.x - haze.position.x, camera.position.z - haze.position.z), 0);
    // sparks: each lives 0.35 s; how many are alive follows the friction
    const pos = sparkGeo.attributes.position;
    const col = sparkGeo.attributes.color;
    const alive = Math.round(SPARKS * Math.min(1, strength.friction));
    for (let i = 0; i < SPARKS; i++) {
      const life = 0.35;
      const t0 = time + (i / SPARKS) * life;
      const n = Math.floor(t0 / life);
      const age = (t0 % life) / life;
      const on = i < alive;
      const at = i % 2 ? points.gearMesh : points.wormMesh;
      const a = hash(i, n) * Math.PI * 2;
      const speed = 0.25 + hash(i + 7, n) * 0.35;
      tmp.set(Math.cos(a) * speed * age, Math.abs(Math.sin(a)) * speed * age * 0.7 - 0.6 * age * age, (hash(i + 3, n) - 0.2) * speed * age);
      pos.setXYZ(i, at.x + tmp.x, at.y + tmp.y, at.z + tmp.z + 0.02);
      const k = on ? 1 - age : 0;
      col.setXYZ(i, k, k * (0.75 - 0.4 * age), k * 0.25 * (1 - age));
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    sparks.visible = alive > 0;
    const g = Math.min(1, strength.friction * 1.2);
    for (const [i, s] of glows.entries()) {
      const flick = 0.85 + 0.15 * Math.sin(time * 23 + i * 2);
      s.scale.setScalar((0.07 + 0.08 * g) * flick);
      s.visible = g > 0.02;
    }
    glowMat.opacity = 0.35 + 0.5 * g;
    // sound rings, every 0.4 s, growing to 0.45 m and fading
    for (const [i, m] of rings.entries()) {
      const age = (((time / 1.6 + i / RINGS) % 1) + 1) % 1;
      const r = 0.12 + 0.45 * age;
      m.scale.setScalar(r);
      m.position.copy(points.gears);
      m.quaternion.copy(camera.quaternion);
      /** @type {THREE.MeshBasicMaterial} */ (m.material).opacity = Math.min(1, strength.sound) * 0.75 * (1 - age);
      m.visible = strength.sound > 0.01;
    }
    // the current: beads moving at a steady speed, + out along the red, back along the blue
    for (const s of beads) {
      const { curve, dir, phase } = s.userData;
      let u = (phase + time * 0.6) % 1;
      if (dir < 0) u = 1 - u;
      curve.getPointAt(u, s.position);
      s.visible = strength.current > 0;
      s.material.opacity = strength.current;
    }
  }
  render(0);
  return { root, set, render };
}
