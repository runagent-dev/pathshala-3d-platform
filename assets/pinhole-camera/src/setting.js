// The setting: a dark room's slate wall, a bench, and on it only what the book names: the candle, the board with its hole, the
// white paper, all three on an aluminium rail with a printed cm scale whose zero is the hole. Centimetres.
// The candle is the only warm light. It is not a three.js light: each material adds it by hand (`lit`), and every point past
// the board asks whether the line back to the flame passes through the board, so the board's shadow is exact, moves with the
// candle, and costs no shadow map. The image on the paper is the flame's own picture read through the same straight lines.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createCandle, FLAME_UV, flameTexture, IMAGE_AT, WAX } from './candle.js';
import { BOARD, flicker, FLAME, HOLE_Y, imageGain, HOLES, PAPER, U, V } from './reading.js';

const RAIL = { from: -26, to: 31, height: 1.5, width: 3.8 };
const LIFT = RAIL.height + 0.9; // the top of a carrier on the rail

/** The camera's frames: a box to fill and the angle to see it from. All read as 3D; they follow the candle and the paper. */
const b = new THREE.Box3();
const f = { box: b, az: -30, el: 13 }; // the one object every call returns: this runs on every frame
const set = (x0, y0, z0, x1, y1, z1) => b.set(b.min.set(x0, y0, z0), b.max.set(x1, y1, z1));
/** The paper's face, seen past the board's edge: the closer the paper, the more from the side the camera has to look. */
const paperAz = (v) => -Math.min(38, Math.max(24, THREE.MathUtils.radToDeg(Math.atan(v / 11.5))));
export function frameOf(name, u, v) {
  f.az = -30;
  f.el = 13;
  if (name === 'hole') {
    set(-3, HOLE_Y - 5, -4, 2, HOLE_Y + 5, 4);
    f.az = -36;
    f.el = 9;
  } else if (name === 'both') {
    // the upright flame and the image on the paper, in one picture
    const r = Math.max(9, (2.2 * v) / u + 3);
    set(-u - 2.5, HOLE_Y - r, -2, v + 1, HOLE_Y + r, 2);
    f.az = paperAz(v);
    f.el = 8;
  } else if (name === 'big') {
    // the hole and the paper together: the hole widens here and the image blurs there
    const r = Math.max(8, (2.2 * v) / u + 2.5);
    set(-3.5, HOLE_Y - r, -3, v + 1, HOLE_Y + r, 3);
    f.az = paperAz(v);
    f.el = 8;
  } else if (name === 'rays') {
    set(-u - 2.5, HOLE_Y - 9, -2, v + 1, HOLE_Y + 9, 2);
    f.az = -34;
    f.el = 10;
  } else if (name === 'drag') {
    set(-U.max - 3, 1, -3, V.max + 0.5, HOLE_Y + 13.5, PAPER.width / 2); // the whole paper, even at the end of the rail
    f.az = -32; // the closest paper still shows past the board's edge
    f.el = 11;
  } else {
    set(-u - 3, 0.5, -3, v + 1.5, HOLE_Y + 14, 3);
  }
  return f;
}

/** The candle's light on a surface; `extra` is more GLSL at the same place. Uniforms are shared, so the flame moves one value. */
function makeLit(shared) {
  return function lit(material, { extra = '' } = {}) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uFlame = shared.uFlame;
      shader.uniforms.uFlameLight = shared.uFlameLight;
      shader.vertexShader = `varying vec3 vPhWorld;\n${shader.vertexShader.replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vPhWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      )}`;
      shader.fragmentShader = `varying vec3 vPhWorld;\nuniform vec3 uFlame;\nuniform float uFlameLight;\n${shader.fragmentShader.replace(
        '#include <lights_fragment_end>',
        `#include <lights_fragment_end>
        {
          vec3 toL = uFlame - vPhWorld;
          float d2 = dot(toL, toL);
          float nl = saturate(dot(normal, normalize((viewMatrix * vec4(toL, 0.0)).xyz)));
          float seen = 1.0;
          if (vPhWorld.x > 0.3) {
            // past the board: does the line back to the flame go through it?
            vec3 at = uFlame + (vPhWorld - uFlame) * (-uFlame.x / (vPhWorld.x - uFlame.x));
            seen = max(smoothstep(-0.3, 0.7, abs(at.y - ${HOLE_Y.toFixed(1)}) - ${(BOARD.height / 2).toFixed(1)}),
                       smoothstep(-0.3, 0.7, abs(at.z) - ${(BOARD.width / 2).toFixed(1)}));
          }
          vec3 warm = vec3(1.0, 0.7, 0.42) * nl * seen * uFlameLight * 460.0 / (d2 + 70.0);
          reflectedLight.directDiffuse += material.diffuseColor * warm;
          reflectedLight.directSpecular += material.specularColor * warm * 0.22;
        }
        ${extra}`,
      )}`;
    };
    material.customProgramCacheKey = () => `ph-lit-${material.name}`;
    return material;
  };
}

function backdropGeometry() {
  const g = new THREE.SphereGeometry(320, 40, 20);
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  const d = new THREE.Vector3();
  const back = new THREE.Vector3(0.5, 0.1, -0.86).normalize();
  for (let i = 0; i < p.count; i++) {
    d.fromBufferAttribute(p, i).normalize();
    // a dim slate room: a little lighter behind the apparatus, so that its edges stand out
    const k = Math.max(0, d.dot(back));
    const v = 0.022 + 0.07 * k ** 5 + 0.035 * k ** 22;
    c[i * 3] = v * 0.84;
    c[i * 3 + 1] = v;
    c[i * 3 + 2] = v * 1.3;
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
  r.addColorStop(0.25, 'rgba(255,255,255,0.4)');
  r.addColorStop(0.6, 'rgba(255,255,255,0.08)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The bench top: painted slate with a fine grain. */
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

/** The kraft fibre of the board: a little mottling, very fine. */
function boardTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    g.fillStyle = `rgba(60,40,20,${0.012 + Math.random() * 0.03})`;
    const l = 2 + Math.random() * 12;
    g.save();
    g.translate(Math.random() * 256, Math.random() * 256);
    g.rotate(Math.random() * Math.PI);
    g.fillRect(-l / 2, -0.4, l, 0.8);
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** The paper: white, a faint fibre, and the soft shadows of the two clips that hold it. */
function paperTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = `rgba(70,74,84,${0.012 + Math.random() * 0.03})`;
    g.lineWidth = 0.6;
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const a = Math.random() * Math.PI;
    const l = 3 + Math.random() * 9;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  // nested boxes: soft on every browser
  g.fillStyle = 'rgba(30,34,44,0.05)';
  for (const u of [0.2, 0.8]) {
    for (let i = 0; i < 10; i++) g.fillRect(256 * u - 34 + i, 0, 68 - 2 * i, 30 - i);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** The printed scale on the rail's front face: its zero under the hole, counted both ways, a long tick each 5 cm. */
function scaleTexture(num) {
  const W = 1024;
  const H = 64;
  const len = RAIL.to - RAIL.from;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#c4cad2';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#16191d';
  g.strokeStyle = '#16191d';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = '600 26px "Noto Sans Bengali", sans-serif';
  for (let x = Math.ceil(RAIL.from); x <= RAIL.to; x++) {
    const px = ((x - RAIL.from) / len) * W;
    const five = x % 5 === 0;
    g.lineWidth = five ? 2.2 : 1.3;
    g.beginPath();
    g.moveTo(px, 0);
    g.lineTo(px, five ? 26 : 13);
    g.stroke();
    if (five) g.fillText(num(Math.abs(x)), px, H - 7);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A black sliding carrier on the rail, with its locking screw: the middle of its foot at x = 0. */
function carrier(lit) {
  const root = new THREE.Group();
  const black = lit(new THREE.MeshStandardMaterial({ name: 'carrier', color: 0x1d2024, roughness: 0.5, metalness: 0.35 }));
  const steel = lit(new THREE.MeshStandardMaterial({ name: 'screw', color: 0xaab1ba, roughness: 0.3, metalness: 0.9 }));
  const body = new THREE.Mesh(new RoundedBoxGeometry(4.2, 1.5, 5.2, 2, 0.14), black);
  body.position.y = RAIL.height + 0.15;
  body.castShadow = true;
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.8, 16), steel);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(0, RAIL.height, 2.9);
  root.add(body, screw);
  return root;
}

export function createSetting({ stage, shadow, num }) {
  const { scene, renderer } = stage;
  const flameMap = flameTexture();
  const glow = glowTexture();
  const shared = {
    uFlame: { value: new THREE.Vector3(-U.start, FLAME.base + 1.6, 0) },
    uFlameLight: { value: 1 },
    uFlameMap: { value: flameMap },
    uFlick: { value: new THREE.Vector3(1, 1, 0) },
    uFlameT: { value: 0 },
    uM: { value: 1 }, // v/u
    uSpread: { value: 0 }, // the blur's radius, cm on the paper
    uGain: { value: 0 },
  };
  const lit = makeLit(shared);

  const back = new THREE.Mesh(
    backdropGeometry(),
    new THREE.MeshBasicMaterial({ name: 'backdrop', vertexColors: true, side: THREE.BackSide, dithering: true, toneMapped: false, fog: false }),
  );
  back.userData.noExport = true;
  scene.add(back);

  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(420, 4, 86),
    lit(
      new THREE.MeshStandardMaterial({ name: 'bench', color: 0x45505e, map: benchTexture(), roughness: 0.62, metalness: 0.05, envMapIntensity: 0.4 }),
    ),
  );
  bench.position.set(0, -2, 18);
  bench.receiveShadow = true;
  bench.userData.noExport = true;
  scene.add(bench);

  const apparatus = new THREE.Group();
  apparatus.name = 'pinhole-apparatus';
  scene.add(apparatus);

  // ── the rail ──────────────────────────────────────────────────────────────────────────────────────────────
  const alu = lit(new THREE.MeshStandardMaterial({ name: 'rail', color: 0xb4bbc4, roughness: 0.4, metalness: 0.78 }));
  const railLen = RAIL.to - RAIL.from;
  const rail = new THREE.Mesh(new RoundedBoxGeometry(railLen, RAIL.height, RAIL.width, 2, 0.1), alu);
  rail.name = 'rail';
  rail.position.set((RAIL.to + RAIL.from) / 2, RAIL.height / 2, 0);
  rail.castShadow = true;
  rail.receiveShadow = true;
  const printed = new THREE.Mesh(
    new THREE.PlaneGeometry(railLen, RAIL.height * 0.86),
    lit(new THREE.MeshStandardMaterial({ name: 'rail-scale', map: scaleTexture(num), roughness: 0.55, metalness: 0.1 })),
  );
  printed.name = 'rail-scale';
  printed.position.set(rail.position.x, RAIL.height / 2, RAIL.width / 2 + 0.012);
  apparatus.add(rail, printed);

  // ── the candle on its carrier ─────────────────────────────────────────────────────────────────────────────
  const candleBase = new THREE.Group();
  candleBase.name = 'candle-carrier';
  candleBase.add(carrier(lit));
  const candle = createCandle({ lit, uniforms: shared, foot: LIFT + 0.55, glow });
  candleBase.add(candle.root);
  apparatus.add(candleBase);

  // ── the board with its hole ───────────────────────────────────────────────────────────────────────────────
  const boardBase = new THREE.Group();
  boardBase.name = 'board';
  const boardMat = lit(
    new THREE.MeshStandardMaterial({
      name: 'board',
      color: 0x7d6c58,
      map: boardTexture(),
      roughness: 0.82,
      metalness: 0,
      transparent: true,
      opacity: 1,
    }),
  );
  const board = new THREE.Mesh(new RoundedBoxGeometry(0.5, BOARD.height, BOARD.width, 2, 0.08), boardMat);
  board.name = 'board-sheet';
  board.position.y = HOLE_Y;
  board.castShadow = true;
  const foot = carrier(lit);
  const post = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, HOLE_Y - BOARD.height / 2 - LIFT + 1.2, 6),
    lit(new THREE.MeshStandardMaterial({ name: 'board-clamp', color: 0x25292f, roughness: 0.5, metalness: 0.4 })),
  );
  post.position.y = (HOLE_Y - BOARD.height / 2 + LIFT + 1.2) / 2 - 0.6;
  boardBase.add(foot, post, board);
  // the hole itself: dark from the candle's side; drawn no smaller than a finger's mark (the note says so)
  const holeMat = new THREE.MeshBasicMaterial({ name: 'hole', color: 0x050403 });
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1, 32), holeMat);
  hole.name = 'hole';
  hole.rotation.y = -Math.PI / 2;
  hole.position.set(-0.256, HOLE_Y, 0);
  hole.visible = false;
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(0.86, 1.3, 32),
    new THREE.MeshBasicMaterial({ name: 'hole-rim', color: 0x2c1f12, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  rim.rotation.y = -Math.PI / 2;
  rim.position.set(-0.254, HOLE_Y, 0);
  rim.visible = false;
  rim.userData.noExport = true;
  boardBase.add(hole, rim);
  apparatus.add(boardBase);

  // ── the white paper, clipped to a stiff back ──────────────────────────────────────────────────────────────
  const paperBase = new THREE.Group();
  paperBase.name = 'paper-carrier';
  const paperMat = new THREE.MeshStandardMaterial({ name: 'paper', color: 0xf6f4ee, map: paperTexture(), roughness: 0.92, metalness: 0 });
  // the paper is drawn by itself: the palest large thing in the room, whatever the lights do, with the image glowing on it
  paperMat.onBeforeCompile = (shader) => {
    for (const k of ['uFlameMap', 'uFlick', 'uFlameT', 'uM', 'uSpread', 'uGain']) shader.uniforms[k] = shared[k];
    shader.vertexShader = `varying vec3 vPhWorld;\n${shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      vPhWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
    )}`;
    shader.fragmentShader = `varying vec3 vPhWorld;\n${FLAME_UV}\n${IMAGE_AT}\nuniform float uM;\nuniform float uSpread;\nuniform float uGain;\n${shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
      vec3 paper = diffuseColor.rgb * vec3(0.335, 0.36, 0.41);
      if (uGain > 0.0) {
        // this point of the paper looks back through the hole at one spot of the candle, a little disc of them if the hole is wide
        vec2 c = vec2(-vPhWorld.z, ${HOLE_Y.toFixed(1)} - vPhWorld.y) / uM + vec2(0.0, ${(FLAME.length / 2).toFixed(1)});
        float r = uSpread / uM;
        float halo = exp(-(c.x * c.x / 5.0 + (c.y - 1.7) * (c.y - 1.7) / 9.0));
        paper *= 1.0 - 0.3 * halo * min(1.0, uGain); // the lit patch stands out from the paper round it
        paper += vec3(0.16, 0.085, 0.025) * halo * uGain;
        if (abs(c.x) < 2.0 + r && c.y > ${(-WAX.reach).toFixed(1)} - r && c.y < 5.4 + r) {
          float lod = log2(max(1.0, r * 17.0)); // the taps are r/2 apart, the picture has 35 texels to the cm
          vec3 sum = vec3(0.0);
          vec2 S = uSpread > 0.0 ? vec2(r) : vec2(0.0);
          ${[
            [0, 0],
            [0.5, 0],
            [-0.5, 0],
            [0, 0.5],
            [0, -0.5],
            [0.68, 0.68],
            [-0.68, 0.68],
            [0.68, -0.68],
            [-0.68, -0.68],
            [0.96, 0],
            [-0.96, 0],
            [0, 0.96],
            [0, -0.96],
          ]
            .map(([x, y]) => `sum += imageAt(c + S * vec2(${x.toFixed(2)}, ${y.toFixed(2)}), lod);`)
            .join('\n')}
          vec3 glow = sum / 13.0 * uGain;
          float cover = clamp(max(glow.r, max(glow.g, glow.b)) * 1.15, 0.0, 1.0);
          paper = paper * (1.0 - 0.82 * cover) + glow * 1.5;
        }
      }
      gl_FragColor.rgb = paper;`,
    )}`;
  };
  paperMat.customProgramCacheKey = () => 'ph-paper';
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(PAPER.width, PAPER.height), paperMat);
  paper.name = 'white-paper';
  paper.rotation.y = -Math.PI / 2;
  paper.position.set(-0.13, HOLE_Y, 0);
  paper.receiveShadow = true;
  const backing = new THREE.Mesh(
    new RoundedBoxGeometry(0.16, PAPER.height + 1.2, PAPER.width + 1.2, 2, 0.06),
    lit(new THREE.MeshStandardMaterial({ name: 'paper-back', color: 0xa4acb6, roughness: 0.74, metalness: 0.05 })),
  );
  backing.name = 'paper-back';
  backing.position.y = HOLE_Y;
  backing.castShadow = true;
  const steel = lit(new THREE.MeshStandardMaterial({ name: 'clip', color: 0x23262b, roughness: 0.38, metalness: 0.7 }));
  const clip = (z) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.5, 1.6, 2.4, 2, 0.1), steel);
    m.position.set(-0.1, HOLE_Y + PAPER.height / 2 - 0.2, z);
    return m;
  };
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, HOLE_Y - PAPER.height / 2 - LIFT + 1.2, 14),
    lit(new THREE.MeshStandardMaterial({ name: 'paper-stem', color: 0xaab1ba, roughness: 0.32, metalness: 0.9 })),
  );
  stem.position.y = (HOLE_Y - PAPER.height / 2 + LIFT + 1.2) / 2 - 0.6;
  paperBase.add(carrier(lit), stem, backing, paper, clip(-6), clip(6));
  apparatus.add(paperBase);

  // the room: dim, cool, enough to see the things by
  const key = new THREE.DirectionalLight(0xbfd2ee, 0.42);
  key.position.set(-30, 60, 40);
  key.target.position.set(4, 8, 0);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.04;
    key.shadow.radius = 5;
    Object.assign(key.shadow.camera, { left: -44, right: 44, top: 40, bottom: -30, near: 10, far: 130 });
  }
  const room = new THREE.HemisphereLight(0xb9cce6, 0x20262e, 0.72);
  scene.add(room);

  // big invisible targets for a finger
  const invisible = new THREE.MeshBasicMaterial({ visible: false });
  const hitHole = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 8), invisible);
  hitHole.position.set(0, HOLE_Y, 0);
  hitHole.userData.noExport = true;
  scene.add(hitHole);

  let u = U.start;
  let v = V.start;
  let d = HOLES.none;
  let imageK = 0;
  const lighting = () => {
    shared.uM.value = v / u;
    shared.uSpread.value = (d * (u + v)) / u / 2;
    shared.uGain.value = imageGain(d, v) * imageK;
  };

  return {
    apparatus,
    hitHole,
    /** The candle at x = −u, the paper at x = +v; d: the hole's diameter, cm. */
    place(nu, nv) {
      u = nu;
      v = nv;
      candleBase.position.x = -u;
      paperBase.position.x = v;
      shared.uFlame.value.x = -u;
      lighting();
    },
    /** d: the hole's diameter, cm; its picture never smaller than 2.8 mm, or a phone could not show it. */
    hole(nd) {
      d = nd;
      hole.visible = rim.visible = d > 0;
      const r = Math.max(d / 2, 0.14);
      hole.scale.setScalar(r);
      rim.scale.setScalar(r);
      lighting();
    },
    /** k: how far the image has come, 0 … 1. */
    image(k) {
      imageK = k;
      lighting();
    },
    /** The board, thinned so that the rays behind it show (the note says so). */
    boardAlpha(a) {
      boardMat.opacity = a;
      boardMat.depthWrite = a > 0.98;
    },
    /** t: seconds since the start. */
    flick(t) {
      const f = flicker(t);
      shared.uFlick.value.set(f.height, f.width, f.lean);
      shared.uFlameT.value = t;
      shared.uFlameLight.value = f.light;
      candle.halo.material.opacity = 0.3 * f.light;
    },
    /** The flame's picture turns to the camera. */
    face(camera) {
      candle.flame.rotation.y = Math.atan2(camera.position.x + u, camera.position.z);
    },
  };
}
