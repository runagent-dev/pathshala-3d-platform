// What the eye can't see, drawn: the air in the jar as many small particles (a stand-in for the molecules, each
// jiggling about its place); the bell's sound as rings that leave the gong and spread through the jar, across the
// glass and out into the room (each ring a compression, dark teal in a thin white outline, followed by a lighter
// rarefaction, as the chapter's sister figures shade a sound wave); and the bell itself working: a short flash where
// the hammer hits the gong, and amber vibration arcs round the gong's rim that shiver after every strike, with or
// without air (the book: "ভেতরে কলিং বেলটি কাঁপতে থাকলেও"). With less air there are fewer particles and fainter rings
// (never thinner); with none, no ring leaves the gong. The rings are slowed down very much (real sound crosses the jar
// in under a millisecond): the panel says so. All are helpers (userData.noExport), not part of the GLB.
import * as THREE from 'three';
import { BALL_R, BELL, GONG, GONG_W, JAR, PLATE_Y, STRIKE_W, worldToBell } from './apparatus.js';

/** How many air particles a full jar shows. */
export const PARTICLES = 900;
/** The rings: how fast they spread (m/s, slowed), how far they go (m), their half width (m), how many at once. */
export const RING = { speed: 0.24, reach: 0.25, width: 0.0016, count: 10 };

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const local = new THREE.Vector3();
const probe = new THREE.Vector3();
/** Is a point inside the jar's air (not in the glass, the bell or the gong)? */
function inJar(x, y, z) {
  const rr = Math.hypot(x, z);
  const yTop = PLATE_Y + JAR.h - 0.08;
  if (y < PLATE_Y + 0.008 || rr > JAR.r - 0.012) return false;
  if (y > yTop) {
    const k = (y - yTop) / 0.05;
    if (k >= 1) return false;
    const rMax = JAR.neckR + (JAR.r - 0.012 - JAR.neckR) * Math.sqrt(1 - k * k);
    if (rr > rMax - 0.006) return false;
  }
  if (Math.hypot(x, z + 0.02) < 0.008 && y > 0.29) return false; // the hanging rod
  // the bell (its board and coils) and the gong, in the bell's own frame, with a little room
  worldToBell(probe.set(x, y, z), local);
  const { x: lx, y: ly, z: lz } = local;
  if (Math.abs(lx) < BELL.w / 2 + 0.012 && ly > BELL.y0 - 0.006 && ly < BELL.y1 + 0.008 && lz > -0.035 && lz < 0.02) return false;
  if (Math.hypot(lx - GONG.x, ly - GONG.y) < GONG.r + 0.016 && lz > -0.03 && lz < GONG.z + GONG.depth + 0.008) return false;
  return true;
}

/**
 * The air particles: one instanced mesh of small camera-facing beads (a soft, slightly translucent, slate-blue disc with
 * a pale highlight, so it shows on a light backdrop as well as against the bell). Each jiggles about its place in the
 * vertex shader, so a frame costs one draw call and no matrices are rewritten. `update(f, time)` shows the share f.
 */
export function createAir() {
  const r = rng(29);
  const base = [];
  while (base.length < PARTICLES) {
    const x = (r() * 2 - 1) * JAR.r;
    const z = (r() * 2 - 1) * JAR.r;
    const y = PLATE_Y + r() * JAR.h;
    if (inJar(x, y, z)) base.push({ x, y, z, s: 0.75 + r() * 0.55 });
  }
  const mat = new THREE.ShaderMaterial({
    name: 'AirMolecule',
    transparent: true,
    depthWrite: false,
    uniforms: {
      radius: { value: 0.002 },
      time: { value: 0 },
      amp: { value: 0.0035 },
      tint: { value: new THREE.Color(0.2, 0.34, 0.45) },
      shine: { value: new THREE.Color(0.72, 0.84, 0.92) },
      alpha: { value: 0.7 },
    },
    vertexShader: `uniform float radius; uniform float time; uniform float amp; varying vec2 vP;
      void main() {
        vP = position.xy;
        vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float k = dot(c, vec3(311.7, 127.1, 523.3));
        float w = 1.6 + 2.2 * fract(sin(k) * 43758.5453);
        float a = time * w + k;
        c += amp * vec3(sin(a), sin(a * 1.3 + 2.0), cos(a * 0.9 + 1.0));
        vec4 mv = viewMatrix * vec4(c, 1.0);
        mv.xy += position.xy * radius * length(instanceMatrix[0].xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform vec3 tint; uniform vec3 shine; uniform float alpha; varying vec2 vP;
      void main() {
        float d = length(vP);
        if (d > 1.0) discard;
        float h = clamp(1.0 - length(vP - vec2(-0.3, 0.35)) * 0.95, 0.0, 1.0);
        vec3 c = mix(tint, shine, h * h);
        gl_FragColor = vec4(c, alpha * (1.0 - smoothstep(0.7, 1.0, d)));
      }`,
  });
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), mat, PARTICLES);
  mesh.name = 'AirParticles';
  mesh.userData.noExport = true;
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  const m4 = new THREE.Matrix4();
  base.forEach((b, i) => {
    m4.makeScale(b.s, b.s, b.s).setPosition(b.x, b.y, b.z);
    mesh.setMatrixAt(i, m4);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return {
    mesh,
    /** f: the share of air left (0–1); time in s. The particles kept are spread through the jar (a random order). */
    update(f, time) {
      mesh.count = Math.round(PARTICLES * Math.max(0, Math.min(1, f)));
      mat.uniforms.time.value = time;
    },
  };
}

/**
 * One ring as a shader on a camera-facing square: a thin teal line of a fixed width in metres at radius R, a faint pale
 * outline on both sides and a lighter, softer band just inside it (the rarefaction behind each compression).
 */
function ringMaterial() {
  return new THREE.ShaderMaterial({
    name: 'SoundRing',
    transparent: true,
    depthWrite: false,
    uniforms: { R: { value: 0.05 }, W: { value: RING.width }, size: { value: 0.06 }, opacity: { value: 1 } },
    vertexShader: `varying vec2 vP; uniform float size;
      void main() { vP = position.xy * size; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vP; uniform float R; uniform float W; uniform float opacity;
      void main() {
        float x = (length(vP) - R) / W;
        float core = exp(-x * x * 1.6);
        float outline = smoothstep(0.9, 1.9, abs(x)) * (1.0 - smoothstep(1.9, 3.0, abs(x)));
        float rare = smoothstep(-9.0, -3.0, x) * (1.0 - smoothstep(-3.0, -1.2, x));
        float wc = core * 0.92;
        float wp = max(outline * 0.4, rare * 0.2);
        float a = max(wc, wp);
        if (a < 0.01) discard;
        vec3 c = mix(vec3(0.82, 0.95, 0.97), vec3(0.05, 0.47, 0.57), wc / (wc + wp + 1e-4));
        gl_FragColor = vec4(c, a * opacity);
      }`,
  });
}

/**
 * The sound rings round the gong, always facing the camera. `strike(time, f)` starts one; `update(time, f, camera)`
 * grows them and sets their strength from the air left now (at least 15 % while there is any air, none without).
 */
export function createRings() {
  const root = new THREE.Group();
  root.name = 'SoundRings';
  root.userData.noExport = true;
  const geo = new THREE.PlaneGeometry(2, 2);
  const rings = [];
  for (let i = 0; i < RING.count; i++) {
    const m = new THREE.Mesh(geo, ringMaterial());
    m.renderOrder = 6;
    m.visible = false;
    m.position.copy(GONG_W);
    m.frustumCulled = false;
    root.add(m);
    rings.push({ mesh: m, born: Number.NEGATIVE_INFINITY });
  }
  let next = 0;
  let hidden = false;
  return {
    root,
    strike(time, f) {
      if (f <= 0.005) return;
      rings[next].born = time;
      next = (next + 1) % rings.length;
    },
    /** How many rings show now. */
    visibleCount() {
      return rings.filter((r) => r.mesh.visible).length;
    },
    /** Hide them all for a while (a test question that must not show the answer). */
    setHidden(v) {
      hidden = v;
    },
    clear() {
      for (const r of rings) {
        r.born = Number.NEGATIVE_INFINITY;
        r.mesh.visible = false;
      }
    },
    update(time, f, camera) {
      const strength = f > 0.005 ? 0.15 + 0.85 * Math.min(1, f) : 0;
      for (const r of rings) {
        const age = time - r.born;
        const rad = GONG.r * 1.4 + age * RING.speed; // from just outside the gong (drawn 1.3 times larger)
        if (hidden || age < 0 || rad > RING.reach || strength <= 0) {
          r.mesh.visible = false;
          continue;
        }
        r.mesh.visible = true;
        r.mesh.quaternion.copy(camera.quaternion);
        const size = rad + RING.width * 3.5;
        r.mesh.scale.setScalar(size);
        const u = r.mesh.material.uniforms;
        u.R.value = rad;
        u.size.value = size;
        // strong at the gong, thinning out with the distance, gone at the end of the reach
        const fade = Math.max(0, (RING.reach - rad) / (RING.reach - GONG.r * 1.4)) ** 1.3;
        u.opacity.value = 0.9 * strength * fade;
      }
    },
  };
}

/** A small canvas picture for a sprite. */
function spriteTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * The bell working, drawn: a short star-shaped flash where the ball hits the gong, and amber arcs just outside the
 * gong's rim (on both sides) that flash with every strike and fade before the next. `update(time, lastStrike, camera)`.
 */
export function createStrikeCue() {
  const root = new THREE.Group();
  root.name = 'StrikeCue';
  root.userData.noExport = true;
  const flashTex = spriteTexture(128, (g, S) => {
    const c = S / 2;
    const grad = g.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,236,153,0.95)');
    grad.addColorStop(1, 'rgba(255,212,59,0)');
    g.fillStyle = grad;
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 ? c * 0.38 : c;
      g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
    }
    g.fill();
  });
  const arcTex = spriteTexture(256, (g, S) => {
    const c = S / 2;
    g.lineCap = 'round';
    for (const [r, w] of [
      [0.78, 1],
      [0.92, 0.75],
    ])
      for (const side of [0, Math.PI]) {
        const a0 = side - 0.55 * w;
        const a1 = side + 0.55 * w;
        g.strokeStyle = 'rgba(33,37,41,0.9)';
        g.lineWidth = 13;
        g.beginPath();
        g.arc(c, c, r * c * 0.95, a0, a1);
        g.stroke();
        g.strokeStyle = '#ffc029';
        g.lineWidth = 7;
        g.beginPath();
        g.arc(c, c, r * c * 0.95, a0, a1);
        g.stroke();
      }
  });
  const sprite = (tex, name) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }),
    );
    m.name = name;
    m.renderOrder = 8;
    m.frustumCulled = false;
    root.add(m);
    return m;
  };
  const flash = sprite(flashTex, 'StrikeFlash');
  flash.position.copy(STRIKE_W);
  const arcs = sprite(arcTex, 'GongVibration');
  arcs.position.copy(GONG_W);
  const arcSize = (GONG.r + 0.02) * 2 * 1.3; // the bell is drawn 1.3 times larger
  return {
    root,
    /** time and the time of the last strike (s). */
    update(time, lastStrike, camera) {
      const age = Math.max(0, time - lastStrike);
      flash.quaternion.copy(camera.quaternion);
      arcs.quaternion.copy(camera.quaternion);
      const fk = Math.exp(-age / 0.035);
      flash.material.opacity = fk;
      flash.visible = fk > 0.02;
      flash.scale.setScalar(BALL_R * 3.2 * (0.8 + 0.6 * fk));
      const ak = Math.exp(-age / 0.07);
      arcs.material.opacity = ak;
      arcs.visible = ak > 0.02;
      // a shiver: the arcs breathe out a little as they fade
      arcs.scale.setScalar(arcSize * (1 + 0.08 * (1 - ak) + 0.02 * Math.sin(age * 220)));
    },
  };
}
