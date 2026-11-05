// The setting: a calm slate wall, a dark lab bench, and on the bench only what চিত্র ৮.০৫ needs: the boy at one end, a
// hibiscus in a pot at the other, and between them a slab of clear glass on a laboratory scissor jack that lifts it toward
// the line from the flower to his eye. Centimetres.
//
// How the glass shows the world. What is above the glass is really there a second time, below it: the flower, the boy and the
// wall as mirrored copies (mirror()). These are drawn first, then the depth is cleared, then the top of the glass is laid over
// them, with what lies under the glass (the printed paper) at the opacity 1 − R. So each pixel of the glass is exactly
// (1 − R) × what is under it + R × what it mirrors. Everything else is then drawn over all of this, and covers whatever of the
// mirror world lies outside the glass, because the wall fills the view. No stencil and no second pass of the scene.
// The top is one square: a pale printed card in the middle, and round it the clear margin of the glass in its pale tint. That
// margin mirrors the world like the rest; what lies under it is only its tint (NOTES.md, Honest stylisation).
// R is Fresnel's for the boy's angle in the outside view (the amount the figure is about), and worked out for each pixel in the
// boy's own view, drawn by renderEye() from his eye.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { boyGeometry } from './boy.js';
import { createPlant } from './flower.js';
import { EYE_Y, fresnel, GLASS, N_GLASS, points, rad, SPAN, START_ANGLE } from './reading.js';

const BLEND = 0.62; // see paperMaterial
const NOD_MAX = 30; // how far his head may bow, degrees
const BENCH_LEFT = -19; // the bench ends where the boy stands
const LINK = 22; // the jack's arms, from pin to pin
const BASE = 1.4; // the jack's foot plate
const PLATE = 1.2; // its top plate
const MARGIN = '#cdeee6'; // the clear margin of the glass: a pale blue-green

function backdropGeometry() {
  const g = new THREE.SphereGeometry(320, 40, 24);
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  const d = new THREE.Vector3();
  const back = new THREE.Vector3(-0.28, 0.14, -1).normalize();
  const low = new THREE.Vector3(1, 0.1, 0).normalize();
  for (let i = 0; i < p.count; i++) {
    d.fromBufferAttribute(p, i).normalize();
    // slate, lighter behind the scene so that the rays glow; lightest low on the right, where the boy's eye looks at a grazing angle
    const k = Math.max(0, d.dot(back));
    const m = Math.max(0, d.dot(low));
    const v = 0.05 + 0.13 * k ** 4 + 0.05 * k ** 20 + 0.42 * m ** 5;
    c[i * 3] = v * 0.84;
    c[i * 3 + 1] = v;
    c[i * 3 + 2] = v * 1.24;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
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

/** What lies under the glass: a pale card printed with an alpona in indigo (fine lines, so that one sees when they fade), and round it the clear margin of the glass. */
function paperTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = MARGIN;
  g.fillRect(0, 0, S, S);
  g.translate(S / 2, S / 2);
  g.scale(GLASS.card / GLASS.halfX, GLASS.card / GLASS.halfX);
  g.fillStyle = '#f3efe0';
  g.fillRect(-512, -512, 1024, 1024);
  g.strokeStyle = g.fillStyle = '#27408f';
  g.lineCap = 'round';
  const ring = (r, w) => {
    g.lineWidth = w;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();
  };
  const each = (n, fn) => {
    for (let i = 0; i < n; i++) {
      g.save();
      g.rotate((i / n) * Math.PI * 2);
      fn(i);
      g.restore();
    }
  };
  const petal = (r0, r1, w, lw) => {
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(0, -r0);
    g.quadraticCurveTo(w, -(r0 + r1) / 2, 0, -r1);
    g.quadraticCurveTo(-w, -(r0 + r1) / 2, 0, -r0);
    g.stroke();
  };
  ring(52, 9);
  each(8, () => petal(60, 150, 44, 8));
  ring(166, 7);
  each(24, () => {
    g.beginPath();
    g.arc(0, -184, 8, 0, Math.PI * 2);
    g.fill();
  });
  ring(204, 6);
  each(16, (i) => {
    g.rotate(((i % 2) * Math.PI) / 16);
    petal(212, 318, 36, 7);
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(0, -232);
    g.lineTo(0, -296);
    g.stroke();
  });
  ring(336, 7);
  ring(352, 3);
  each(48, () => {
    g.beginPath();
    g.moveTo(-20, -372);
    g.quadraticCurveTo(0, -402, 20, -372);
    g.lineWidth = 5;
    g.stroke();
  });
  // the corners
  for (const [x, y] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    g.save();
    g.translate(x * 452, y * 452);
    each(8, () => petal(10, 58, 17, 5));
    g.restore();
  }
  g.lineWidth = 8;
  g.strokeRect(-492, -492, 984, 984);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Fresnel's equations in the shader: the same numbers as reading.js. c: the cosine of the angle of incidence. */
const FRESNEL_GLSL = `
  float ra_fresnel(float c) {
    float n = ${N_GLASS.toFixed(3)};
    float ct = sqrt(max(0.0, 1.0 - (1.0 - c * c) / (n * n)));
    float rs = (c - n * ct) / (c + n * ct);
    float rp = (ct - n * c) / (ct + n * c);
    return 0.5 * (rs * rs + rp * rp);
  }`;

/** The top of the glass: the paper under it, seen through it, covering the mirror world by 1 − R. */
function paperMaterial() {
  const m = new THREE.MeshStandardMaterial({
    name: 'paper-under-glass',
    map: paperTexture(),
    roughness: 0.72,
    envMapIntensity: 0.4,
    transparent: false, // it stays in the opaque pass, and blends: see the note at the top of this file
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const fixedR = { value: 0.04 };
  m.userData.fixedR = fixedR;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.raFixedR = fixedR;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n varying vec3 raWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n raWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 raWorld;
        uniform float raFixedR;
        ${FRESNEL_GLSL}`,
      )
      .replace(
        '#include <map_fragment>',
        // the paper lies under the slab: the ray bends as it goes in, so it lands nearer the point under the eye
        `vec3 raV = normalize(cameraPosition - raWorld);
        float raS = sqrt(max(0.0, 1.0 - raV.y * raV.y)) / ${N_GLASS.toFixed(3)};
        float raShift = ${GLASS.thick.toFixed(1)} * raS / sqrt(1.0 - raS * raS);
        vec2 raH = normalize(raV.xz + vec2(1e-5, 0.0));
        vec2 raUv = vMapUv + vec2(-raH.x, raH.y) * raShift / ${(GLASS.halfX * 2).toFixed(1)};
        diffuseColor *= texture2D(map, raUv);
        diffuseColor.rgb *= vec3(0.9, 0.98, 0.96);`,
      )
      .replace(
        '#include <opaque_fragment>',
        // the canvas blends encoded colours, not light: this power makes 1 − R of a dark paper and R of a bright flower add up as
        // light does (R = 4 % of the flower on the paper shows as it would in the room, not as 4 % of a pixel value)
        `diffuseColor.a = 1.0 - pow(raFixedR >= 0.0 ? raFixedR : ra_fresnel(max(raV.y, 0.0)), ${BLEND.toFixed(2)});
        #include <opaque_fragment>`,
      );
  };
  return m;
}

/** The sides of the slab: a strong blue-green, as the edge of a sheet of glass is; over the top, hardly anything. */
function glassMaterial() {
  const m = new THREE.MeshStandardMaterial({
    name: 'glass',
    color: new THREE.Color(0.62, 0.93, 0.82),
    roughness: 0.08,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    envMapIntensity: 0.9,
  });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
      float ra_side = 1.0 - abs(dot(normalize(normal), normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)));
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.42, 0.93, 0.74), ra_side * 0.7);
      gl_FragColor.a = mix(0.05, 0.62, ra_side);`,
    );
  };
  return m;
}

/** The bright lines along the slab's edges, merged: one draw call. */
function glassEdges() {
  const { halfX: x, halfZ: z, thick } = GLASS;
  const w = 0.22;
  const bar = (sx, sy, sz, px, py, pz) => new THREE.BoxGeometry(sx, sy, sz).translate(px, py, pz);
  const parts = [];
  for (const y of [-w / 2, -thick + w / 2]) {
    parts.push(bar(x * 2, w, w, 0, y, z), bar(x * 2, w, w, 0, y, -z), bar(w, w, z * 2, x, y, 0), bar(w, w, z * 2, -x, y, 0));
  }
  for (const [px, pz] of [
    [-x, -z],
    [-x, z],
    [x, -z],
    [x, z],
  ])
    parts.push(bar(w, thick, w, px, -thick / 2, pz));
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshBasicMaterial({ name: 'glass-edge', color: 0xb9ffe4, toneMapped: false }));
  mesh.renderOrder = 3;
  return mesh;
}

/** A soft highlight across the top: two pale diagonal bands, as a window lights a sheet of glass. Not in the view from his eye. */
function glassSheen() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const band = g.createLinearGradient(0, 0, S, S);
  band.addColorStop(0.16, 'rgba(255,255,255,0)');
  band.addColorStop(0.3, 'rgba(255,255,255,0.62)');
  band.addColorStop(0.42, 'rgba(255,255,255,0)');
  band.addColorStop(0.5, 'rgba(255,255,255,0)');
  band.addColorStop(0.56, 'rgba(255,255,255,0.36)');
  band.addColorStop(0.63, 'rgba(255,255,255,0)');
  g.fillStyle = band;
  g.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GLASS.halfX * 2, GLASS.halfZ * 2).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ name: 'glass-sheen', map: t, transparent: true, depthWrite: false, toneMapped: false }),
  );
  mesh.position.y = 0.04;
  mesh.renderOrder = 3;
  mesh.layers.set(1);
  mesh.userData.noExport = true;
  return mesh;
}

/** A material for a mirrored copy: lit as the real object is, cut off at the glass. */
function mirrored(material, plane) {
  const m = material.clone();
  m.name = `${material.name}-mirrored`;
  m.clippingPlanes = [plane];
  m.onBeforeCompile = (shader) => {
    // the copy's normals are upside down, the lights are not: turn each normal back, so that a petal is as bright as the real one
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      normal = reflect(normal, normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz));`,
    );
  };
  m.customProgramCacheKey = () => 'ra-mirrored';
  return m;
}

/** The boy, his head a part of its own. wrap: what to do to each material. Layer 1: not in the view from his own eye. */
function makeBoy(made, wrap = (m) => m) {
  const root = new THREE.Group();
  root.name = 'boy';
  const mat = wrap(made.matte);
  const gloss = wrap(made.gloss);
  const add = (parent, geo, material) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.layers.set(1);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  add(root, made.geometry.matte, mat);
  add(root, made.geometry.gloss, gloss);
  const head = new THREE.Group();
  head.position.copy(made.neck);
  root.add(head);
  add(head, made.geometry.headMatte, mat);
  add(head, made.geometry.headGloss, gloss);
  root.scale.setScalar(100);
  root.rotation.y = Math.PI / 2; // he faces the glass, +x
  return { root, head };
}

/** The laboratory jack: a foot plate, two stages of scissors on each side, the lead screw with its knob, the top plate. */
function createJack(materials) {
  const root = new THREE.Group();
  root.name = 'scissor-jack';
  const { steel, dark, bakelite } = materials;
  const foot = new THREE.Mesh(new RoundedBoxGeometry(26, BASE, 22, 2, 0.3), dark);
  foot.position.y = BASE / 2;
  foot.castShadow = true;
  const plate = new THREE.Mesh(new RoundedBoxGeometry(26, PLATE, 22, 2, 0.25), dark);
  plate.castShadow = true;
  const armG = new RoundedBoxGeometry(LINK + 2.4, 1.7, 0.5, 1, 0.2);
  const arms = new THREE.InstancedMesh(armG, steel, 8);
  arms.castShadow = true;
  arms.frustumCulled = false;
  const pinG = new THREE.CylinderGeometry(0.42, 0.42, 18, 10);
  pinG.rotateX(Math.PI / 2);
  const pins = new THREE.InstancedMesh(pinG, dark, 8);
  pins.frustumCulled = false;
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 10).rotateZ(Math.PI / 2), steel);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 2.4, 20).rotateZ(Math.PI / 2), bakelite);
  knob.castShadow = true;
  root.add(foot, arms, pins, screw, knob, plate);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const P = new THREE.Vector3();
  const S = new THREE.Vector3(1, 1, 1);
  const Z = new THREE.Vector3(0, 0, 1);
  return {
    root,
    /** top: the height of the top of its plate. */
    set(top) {
      const H = top - PLATE - BASE;
      const s = H / 2;
      const a = Math.asin(Math.min(0.99, s / LINK));
      const w = LINK * Math.cos(a);
      let k = 0;
      for (const side of [-8, 8])
        for (const stage of [0, 1])
          for (const sign of [-1, 1]) {
            Q.setFromAxisAngle(Z, sign * a);
            arms.setMatrixAt(k++, M.compose(P.set(0, BASE + s * (stage + 0.5), side), Q, S));
          }
      arms.instanceMatrix.needsUpdate = true;
      k = 0;
      Q.identity();
      for (let level = 0; level <= 2; level++)
        for (const sign of [-1, 1]) pins.setMatrixAt(k++, M.compose(P.set((sign * w) / 2, BASE + s * level, 0), Q, S));
      for (const stage of [0, 1]) pins.setMatrixAt(k++, M.compose(P.set(0, BASE + s * (stage + 0.5), 0), Q, S));
      pins.instanceMatrix.needsUpdate = true;
      const y = BASE + s;
      screw.scale.x = w + 7;
      screw.position.set(3.5, y, 0);
      knob.position.set(w / 2 + 7.6, y, 0);
      knob.rotation.x = s * 1.3; // it turns as the jack rises
      plate.position.y = top - PLATE / 2;
    },
  };
}

export function createSetting({ stage, shadow }) {
  const { scene, renderer } = stage;
  renderer.localClippingEnabled = true;
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const backG = backdropGeometry();
  const wall = new THREE.Mesh(
    backG,
    new THREE.MeshBasicMaterial({ name: 'backdrop', vertexColors: true, side: THREE.BackSide, dithering: true, toneMapped: false, fog: false }),
  );
  wall.userData.noExport = true;
  scene.add(wall);

  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(420, 6, 96),
    new THREE.MeshStandardMaterial({ name: 'bench', color: 0x47566a, map: benchTexture(), roughness: 0.58, metalness: 0.05, envMapIntensity: 0.5 }),
  );
  bench.position.set(BENCH_LEFT + 210, -3, 10);
  bench.receiveShadow = true;
  bench.userData.noExport = true;
  scene.add(bench);

  const steel = new THREE.MeshStandardMaterial({ name: 'jack-steel', color: 0xc4cad2, roughness: 0.38, metalness: 0.92 });
  const dark = new THREE.MeshStandardMaterial({ name: 'jack-dark', color: 0x2c3138, roughness: 0.5, metalness: 0.6 });
  const bakelite = new THREE.MeshStandardMaterial({ name: 'jack-knob', color: 0x16191d, roughness: 0.42 });

  const apparatus = new THREE.Group();
  apparatus.name = 'apparatus';
  scene.add(apparatus);
  const jack = createJack({ steel, dark, bakelite });
  const plant = createPlant(new THREE.Vector3(SPAN, EYE_Y, 0));
  const made = boyGeometry();
  const clothMat = new THREE.MeshStandardMaterial({ name: 'boy', vertexColors: true, roughness: 0.74, envMapIntensity: 0.6 });
  const glossMat = new THREE.MeshStandardMaterial({ name: 'boy-gloss', vertexColors: true, roughness: 0.32, envMapIntensity: 0.8 });
  const parts = { ...made, matte: clothMat, gloss: glossMat };
  const boy = makeBoy(parts);
  boy.root.userData.noExport = true; // the GLB keeps the apparatus and the flower: with him it would pass 1 MB
  apparatus.add(jack.root, plant, boy.root);

  // the glass, on the jack
  const slab = new THREE.Group();
  slab.name = 'glass-slab';
  const paperMat = paperMaterial();
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(GLASS.halfX * 2, GLASS.halfZ * 2), paperMat);
  paper.rotation.x = -Math.PI / 2;
  paper.renderOrder = -17;
  paper.receiveShadow = true;
  const shell = new THREE.Mesh(new RoundedBoxGeometry(GLASS.halfX * 2, GLASS.thick, GLASS.halfZ * 2, 3, 0.12), glassMaterial());
  shell.position.y = -GLASS.thick / 2 + 0.03;
  shell.renderOrder = 2;
  // its underside, for a camera that goes low when the glass is high
  const under = new THREE.Mesh(
    new THREE.PlaneGeometry(GLASS.halfX * 2 - 0.1, GLASS.halfZ * 2 - 0.1),
    new THREE.MeshStandardMaterial({ name: 'glass-under', color: MARGIN, roughness: 0.3, side: THREE.DoubleSide }),
  );
  under.rotation.x = -Math.PI / 2;
  under.position.y = -GLASS.thick + 0.02;
  // four rubber feet: a gap between the glass and the jack's plate, so that nobody takes one for the other
  const feet = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.2, 1.2, GLASS.gap, 12), bakelite, 4);
  feet.frustumCulled = false;
  [
    [-10, -8],
    [-10, 8],
    [10, -8],
    [10, 8],
  ].forEach(([x, z], i) => {
    feet.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, -GLASS.thick - GLASS.gap / 2, z));
  });
  slab.add(under, paper, shell, glassEdges(), glassSheen(), feet);
  apparatus.add(slab);

  // the world in the glass
  const world = new THREE.Group();
  world.name = 'mirror-world';
  world.userData.noExport = true;
  world.scale.y = -1;
  scene.add(world);
  const wallCopy = new THREE.Mesh(backG, wall.material);
  wallCopy.renderOrder = -20;
  world.add(wallCopy);
  const copies = new Map();
  const mirrorOf = (m) => {
    if (!copies.has(m)) copies.set(m, mirrored(m, clip));
    return copies.get(m);
  };
  const plantCopy = plant.clone(true);
  plantCopy.traverse((o) => {
    if (!o.isMesh) return;
    o.material = mirrorOf(o.material);
    o.castShadow = false;
  });
  world.add(plantCopy);
  const boyCopy = makeBoy(parts, mirrorOf);
  world.add(boyCopy.root);
  world.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = false;
    if (o !== wallCopy) o.renderOrder = -19;
  });
  // between the mirror world and the rest: everything after this is drawn as if the mirror world's depth was never there
  const clearGeo = new THREE.BufferGeometry();
  clearGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
  const clear = new THREE.Mesh(clearGeo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false }));
  clear.frustumCulled = false;
  clear.renderOrder = -18;
  clear.userData.noExport = true;
  clear.onBeforeRender = (r) => {
    r.clearDepth();
  };
  scene.add(clear);

  // the big invisible target for a finger, over the glass and the jack
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  scene.add(hit);

  // the lights
  const key = new THREE.DirectionalLight(0xfff3e4, 2.3);
  key.position.set(-22, 96, 58);
  key.target.position.set(0, 20, 0);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 5;
    Object.assign(key.shadow.camera, { left: -62, right: 70, top: 62, bottom: -46, near: 20, far: 190 });
  }
  scene.add(new THREE.HemisphereLight(0xdbe7f6, 0x262c34, 1.15));
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.5);
  fill.position.set(60, 30, 80);
  scene.add(fill);

  // the place of the near eye in the boy's frame, once his head is bowed
  const eyeNow = new THREE.Vector3();
  const YAW = new THREE.Euler(0, Math.PI / 2, 0);
  const NOD = new THREE.Euler();
  const pose = (b, nod, g) => {
    b.head.rotation.x = nod;
    NOD.set(nod, 0, 0);
    eyeNow.copy(made.eye).applyEuler(NOD).add(made.neck).multiplyScalar(100).applyEuler(YAW);
    b.root.position.set(g.eye.x - eyeNow.x, g.eye.y - eyeNow.y, -eyeNow.z);
  };

  // the view from his eye
  const eyeCam = new THREE.PerspectiveCamera(24, 4 / 3, 1, 900);
  eyeCam.layers.set(0);
  const look = new THREE.Vector3();
  const place = (theta) => {
    const g = points(theta);
    const y = g.plane;
    slab.position.y = y;
    jack.set(y - GLASS.thick - GLASS.gap);
    world.position.y = 2 * y;
    clip.constant = y;
    paperMat.userData.fixedR.value = fresnel(g.angle);
    // his head bows part of the way down the line to the glass
    const gaze = THREE.MathUtils.radToDeg(Math.atan2(g.eye.y - y, SPAN));
    const nod = rad(Math.min(NOD_MAX, gaze * 0.55));
    pose(boy, nod, g);
    pose(boyCopy, nod, g);
    const hh = y + 3;
    hit.scale.set(GLASS.halfX * 2 + 4, hh, GLASS.halfZ * 2 + 4);
    hit.position.set(0, hh / 2, 0);
    return g;
  };
  place(START_ANGLE);

  return {
    apparatus,
    hit,
    bench,
    place,
    /** Draws what the boy sees into the bottom-left of the view (the main pass draws over it): css pixels. */
    renderEye(theta, w, h) {
      const g = points(theta);
      const dist = Math.hypot(SPAN, EYE_Y - g.plane); // to the point on the glass
      eyeCam.aspect = w / h;
      eyeCam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.max(0.2, 13 / (2 * dist))));
      eyeCam.position.set(g.eye.x, g.eye.y, 0);
      eyeCam.lookAt(look.set(g.hit.x, g.hit.y, g.hit.z));
      eyeCam.updateProjectionMatrix();
      eyeCam.updateMatrixWorld();
      const fixed = paperMat.userData.fixedR;
      const was = fixed.value;
      fixed.value = -1;
      renderer.setViewport(0, 0, w, h);
      renderer.setScissor(0, 0, w, h);
      renderer.setScissorTest(true);
      renderer.render(scene, eyeCam);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, stage.width, stage.height);
      fixed.value = was;
    },
  };
}
