// The polished convex mirror of the chapter's optical bench (the dish of spherical-mirror-focus), in centimetres: a thin dish of glass,
// cut from a hollow sphere and silvered on its outer surface, in a black ring on a post. Its pole P is at x = 0, its axis along +x,
// toward the pencil. Here it never turns: its face is the exact sphere of radius r, rewritten in place when the mirror becomes a
// plane one and back (topic 8.8.2).
//
// What the student sees IN the silver is traced, not faked: for each pixel of the face the shader reflects the line of sight in the
// exact sphere and asks what it meets: the pencil and its rod, the row of coloured posts, the rail and the table. The image in the
// mirror is therefore exactly right for any eye, at the cost of one short loop on one small dish. Above the table the silver gives
// back a plain pale room: no lamp in it to be taken for an image.
import * as THREE from 'three';
import { MIRROR, PENCIL, POST, sag } from './reading.js';
import { SHAPE } from './pencil.js';

const RINGS = 14;
const SEGS = 56;
const PER_FACE = RINGS * SEGS + 1; // the middle point, then the rings

/** Indices of one face, starting at vertex `base`, the middle first. flip: wound the other way. */
function faceIndex(base, flip) {
  const out = [];
  const tri = (a, b, c) => (flip ? out.push(a, c, b) : out.push(a, b, c));
  const at = (ring, seg) => base + 1 + (ring - 1) * SEGS + ((seg + SEGS) % SEGS);
  for (let s = 0; s < SEGS; s++) tri(base, at(1, s), at(1, s + 1));
  for (let ring = 1; ring < RINGS; ring++)
    for (let s = 0; s < SEGS; s++) {
      tri(at(ring, s), at(ring + 1, s), at(ring + 1, s + 1));
      tri(at(ring, s), at(ring + 1, s + 1), at(ring, s + 1));
    }
  return out;
}

const POSTS = 7;
const TRACE_HEAD = /* glsl */ `
  uniform vec3 labPencil;              // x, z, 1 when it is seen in the mirror
  uniform vec3 labPost[${POSTS}];         // x, z, 1 when it is there
  uniform vec3 labPostColor[${POSTS}];
  uniform float labCurve;              // 1 / r
  uniform float labAxis;
  uniform vec2 labRail;                // the rail's top, its half width
  varying vec3 vLabWorld;
  const float LAB_L = ${PENCIL.toFixed(1)};
  const float LAB_R = ${SHAPE.radius.toFixed(2)};
  vec3 labLin(vec3 c) { return pow(c, vec3(2.2)); }
  // the colours of the pencil at a height h (0 at Y, 1 at X) and a place across it, a (0 in the middle, 1 at the edge)
  vec3 labPaint(float h, float a) {
    float y = h * LAB_L;
    if (y < ${SHAPE.eraser.toFixed(2)}) return labLin(vec3(0.95, 0.60, 0.66));
    if (y < ${SHAPE.ferrule.toFixed(2)}) return labLin(vec3(0.78, 0.80, 0.83));
    if (y < ${SHAPE.body.toFixed(2)}) return a < 0.26 ? labLin(vec3(0.96, 0.75, 0.15)) : labLin(vec3(0.79, 0.17, 0.17));
    if (y < ${SHAPE.wood.toFixed(2)}) return labLin(vec3(0.86, 0.70, 0.49));
    return labLin(vec3(0.19, 0.2, 0.23));
  }
  // half the pencil's width at a height h
  float labWidth(float h) {
    float y = h * LAB_L;
    if (y > ${SHAPE.body.toFixed(2)}) return LAB_R * clamp((LAB_L - y) / ${(PENCIL - SHAPE.body).toFixed(2)}, 0.0, 1.0);
    return LAB_R;
  }`;
const TRACE_BODY = /* glsl */ `
  {
    vec3 labO = vLabWorld;
    vec2 labY = vec2(labO.y - labAxis, labO.z);
    vec3 labN = normalize(vec3(sqrt(max(0.0, 1.0 - dot(labY, labY) * labCurve * labCurve)), labY * labCurve));
    vec3 labR = reflect(normalize(labO - cameraPosition), labN);
    // bright polished silver: a plain pale room, a little lighter upward
    vec3 labC = mix(vec3(0.74, 0.78, 0.83), vec3(0.97, 0.98, 0.99), smoothstep(0.0, 0.7, labR.y));
    // the table and the rail under the line of sight, dark, so that what stands on them reads
    if (labR.y < 0.0) {
      float labT = (labRail.x - labO.y) / labR.y;
      vec3 labP = labO + labR * labT;
      bool labOnRail = labT > 0.0 && abs(labP.z) < labRail.y;
      labC = labOnRail ? labLin(vec3(0.36, 0.4, 0.45)) : labLin(vec3(0.2, 0.25, 0.31));
    }
    // the posts of the row: the nearest approach of the line of sight to each vertical axis
    for (int i = 0; i < ${POSTS}; i++) {
      if (labPost[i].z < 0.5) continue;
      vec2 labA = labPost[i].xy - labO.xz;
      float labS = dot(labA, labR.xz) / dot(labR.xz, labR.xz);
      if (labS <= 0.0) continue;
      float labD = length(labA - labR.xz * labS);
      float labH = labO.y + labR.y * labS;
      if (labH < 0.0 || labH > ${POST.top.toFixed(1)}) continue;
      float labE = fwidth(labD) + 0.002;
      float labW = ${POST.radius.toFixed(1)} * clamp((${POST.top.toFixed(1)} - labH) / ${(POST.top - POST.shoulder).toFixed(1)}, 0.0, 1.0);
      labW = max(labW, labE);
      float labV = labD / labW;
      labC = mix(labC, labPostColor[i] * (0.7 + 0.45 * sqrt(max(0.0, 1.0 - labV * labV))), smoothstep(labW + labE, labW - labE, labD));
    }
    // the pencil and the rod it stands on
    if (labPencil.z > 0.5) {
      vec2 labA = labPencil.xy - labO.xz;
      float labS = dot(labA, labR.xz) / dot(labR.xz, labR.xz);
      if (labS > 0.0) {
        float labD = length(labA - labR.xz * labS);
        float labH = (labO.y + labR.y * labS - labAxis) / LAB_L;
        float labE = fwidth(labD) + 0.002;
        if (labH >= 0.0 && labH <= 1.0) {
          float labW = max(labWidth(labH), labE * (labH < 0.9 ? 1.5 : 0.8)); // a far pencil never thins away to nothing
          float labV = labD / max(labW, 0.02);
          float labA2 = labW > 5.0 * labE ? labV : 1.0; // a stripe needs room: on a tiny pencil it would only turn it yellow
          labC = mix(labC, labPaint(labH, labA2) * (0.62 + 0.5 * sqrt(max(0.0, 1.0 - labV * labV))), smoothstep(labW + labE, labW - labE, labD));
        } else if (labH < 0.0) {
          labC = mix(labC, labLin(vec3(0.62, 0.65, 0.7)), smoothstep(0.34 + labE, 0.34 - labE, labD));
        }
      }
    }
    gl_FragColor.rgb = labC;
  }`;

export function createDish() {
  const root = new THREE.Group(); // on the pins, half a glass thickness behind P
  root.name = 'convex-mirror';
  const count = PER_FACE * 2 + SEGS * 2;
  const position = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
  const normal = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
  position.setUsage(THREE.DynamicDrawUsage);
  normal.setUsage(THREE.DynamicDrawUsage);

  const of = (index) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', position);
    g.setAttribute('normal', normal);
    g.setIndex(index);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 14);
    return g;
  };
  const a = faceIndex(0, true);
  const b = faceIndex(PER_FACE, false);
  const rim = [];
  const r0 = PER_FACE * 2;
  for (let s = 0; s < SEGS; s++) {
    const n = (s + 1) % SEGS;
    rim.push(r0 + s, r0 + n, r0 + SEGS + s, r0 + n, r0 + SEGS + n, r0 + SEGS + s);
  }

  // clear glass: mostly see-through, a pale tint, its green only at the ground edge
  const glassMat = new THREE.MeshStandardMaterial({
    name: 'MirrorGlass',
    color: 0xdff3ee,
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.8,
  });
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'MirrorEdge', color: 0x58c4a0, roughness: 0.16, emissive: 0x10382c });
  // bright polished silver (its picture is the shader's, above). It draws after the glass, so nothing tints the coated face
  const silverMat = new THREE.MeshStandardMaterial({
    name: 'Silver',
    color: 0xffffff,
    roughness: 0.06,
    metalness: 1,
    side: THREE.DoubleSide,
    envMapIntensity: 1.1,
    transparent: true,
  });
  const uniforms = {
    labPencil: { value: new THREE.Vector3() },
    labPost: { value: Array.from({ length: POSTS }, () => new THREE.Vector3()) },
    labPostColor: { value: Array.from({ length: POSTS }, () => new THREE.Color()) },
    labCurve: { value: 1 / 30 },
    labAxis: { value: 19 },
    labRail: { value: new THREE.Vector2(3.2, 5.5) },
  };
  silverMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLabWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvLabWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${TRACE_HEAD}`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>\n${TRACE_BODY}`);
  };
  const faces = new THREE.Mesh(of([...a, ...b]), glassMat);
  faces.renderOrder = 3;
  const edge = new THREE.Mesh(of(rim), edgeMat);
  const coat = new THREE.Mesh(of(b), silverMat);
  for (const m of [edge, coat]) m.castShadow = true;
  coat.renderOrder = 4;
  const body = new THREE.Group();
  body.position.x = MIRROR.thick / 2;
  body.add(faces, edge, coat);
  root.add(body);
  root.rotation.y = Math.PI; // the outer surface toward the pencil

  let radius = 0;
  function setRadius(r) {
    if (r === radius) return;
    radius = r;
    uniforms.labCurve.value = 1 / r;
    const p = position.array;
    const n = normal.array;
    const t = MIRROR.thick;
    const put = (i, x, y, z, nx, ny, nz) => {
      p[i * 3] = x;
      p[i * 3 + 1] = y;
      p[i * 3 + 2] = z;
      n[i * 3] = nx;
      n[i * 3 + 1] = ny;
      n[i * 3 + 2] = nz;
    };
    // face A (x = +sag, the inner surface) and face B (t behind it, the outer one, silvered); the normal is along the radius
    for (let face = 0; face < 2; face++) {
      const base = face * PER_FACE;
      const sign = face === 0 ? 1 : -1;
      const off = face === 0 ? 0 : -t;
      put(base, off, 0, 0, sign, 0, 0);
      for (let ring = 1; ring <= RINGS; ring++) {
        const rho = (MIRROR.half * ring) / RINGS;
        const s = sag(r, rho);
        const c = (r - s) / r;
        const q = rho / r;
        for (let k = 0; k < SEGS; k++) {
          const th = (k / SEGS) * Math.PI * 2;
          const y = rho * Math.cos(th);
          const z = rho * Math.sin(th);
          put(base + 1 + (ring - 1) * SEGS + k, s + off, y, z, sign * c, -sign * q * Math.cos(th), -sign * q * Math.sin(th));
        }
      }
    }
    // the ground edge of the glass, straight across
    const s = sag(r, MIRROR.half);
    for (let k = 0; k < SEGS; k++) {
      const th = (k / SEGS) * Math.PI * 2;
      const y = MIRROR.half * Math.cos(th);
      const z = MIRROR.half * Math.sin(th);
      put(r0 + k, s, y, z, 0, Math.cos(th), Math.sin(th));
      put(r0 + SEGS + k, s - t, y, z, 0, Math.cos(th), Math.sin(th));
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
  }

  return { root, setRadius, uniforms };
}

const v2 = (x, y) => new THREE.Vector2(x, y);

/** The holder: a black ring on a post, standing on the rail at x = 0. The dish hangs in it on two pins, top and bottom. Its origin is on the principal axis. */
export function createHolder({ black, steel, brass }) {
  const root = new THREE.Group();
  root.name = 'ring-holder';
  const IN = MIRROR.half + 0.45;
  const OUT = MIRROR.half + 1.15;
  const W = 1.05;
  const ring = new THREE.LatheGeometry(
    [
      v2(IN, -W),
      v2(IN + 0.1, -W - 0.1),
      v2(OUT - 0.1, -W - 0.1),
      v2(OUT, -W),
      v2(OUT, W),
      v2(OUT - 0.1, W + 0.1),
      v2(IN + 0.1, W + 0.1),
      v2(IN, W),
      v2(IN, -W),
    ],
    72,
  );
  ring.rotateZ(Math.PI / 2); // the lathe turns round y: the ring's axis goes along x
  const mesh = new THREE.Mesh(ring, black);
  mesh.castShadow = true;
  root.add(mesh);
  // the two pins, and their little brass caps outside the ring
  for (const s of [1, -1]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, OUT - MIRROR.half + 0.3, 10), steel);
    pin.position.y = s * ((OUT + MIRROR.half) / 2 + 0.1);
    root.add(pin);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 18), brass);
    cap.position.y = s * (OUT + 0.17);
    root.add(cap);
  }
  return root;
}
