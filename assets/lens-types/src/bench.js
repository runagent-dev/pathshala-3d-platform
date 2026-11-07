// The setting and the apparatus, in centimetres: the calm deep-blue backdrop of the owner's latest figures, a plain light-sand table
// top with the blue all round it, and on it the chapter's optical bench (an anodised rail with a printed cm scale on its sloping
// front, 0 in the middle; black sliding carriers), as in the sister figures convex-lens-image and spherical-mirror-focus. On the rail:
// two glass lenses in black ring holders (a biconvex and a biconcave lens), a ray box, a glass slab and a laser pointer, each on its
// own carrier, put on the rail or lifted off it as the story needs. x runs along the rail (the light goes toward +x), y is up, the
// principal axis is at y = RAIL.axis, z = 0. Each lens and its ring are made of two halves split in the plane z = 0, so that the
// front half can be taken away and the section (প্রস্থচ্ছেদ) seen, as in চিত্র ৯.১৪.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HOLES, LENS, leftFace, rightFace, SLAB } from './reading.js';

/** The heights that matter, cm: the rail's top, the carriers' top, the principal axis; the rail's two ends. */
export const RAIL = { top: 3.2, carrier: 5.6, axis: 19, left: -46, right: 46 };
/** The scale strip on the sloping front of the rail. */
const STRIP = { y0: 0.55, z0: 5.5, y1: 2.35, z1: 3.3 };
/** The calm deep blue of the backdrop, top and bottom (as equations-of-motion, newtons-second-law and the sister lens figures). */
export const BG = ['#0b2a5b', '#123d7a'];
/** The ring round a lens: inner and outer radius, half its width. */
export const RING = { in: LENS.half + 0.25, out: LENS.half + 0.8, w: 0.55 };
/** How high a part goes when it is lifted off the rail (cm): out of every frame. */
export const LIFT = 70;

/** The backdrop: a vertical gradient on a 4 × 256 canvas, made once. As the scene's background it fills the view from any angle. */
export function backdropTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, BG[0]);
  grad.addColorStop(1, BG[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** A soft round glow (white in the middle), tinted by the material. */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0.5, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.3, 'rgba(255,255,255,0.46)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The printed scale: one row, −40 … 40 cm, 0 in the middle, black on the rail's satin silver; a tick each cm, a number each 10. */
function scaleTexture(t) {
  const W = 1024;
  const H = 128;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#b7bfc9';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#14181d';
  g.fillStyle = '#14181d';
  const px = (W - 16) / 80;
  for (let i = -40; i <= 40; i++) {
    const x = 8 + (i + 40) * px;
    const major = i % 10 === 0;
    const mid = i % 5 === 0;
    g.lineWidth = major ? 3 : 1.6;
    g.beginPath();
    g.moveTo(x, 3);
    g.lineTo(x, major ? 40 : mid ? 28 : 18);
    g.stroke();
    if (major) {
      g.save();
      g.translate(x, 112);
      g.scale(0.62, 1);
      g.font = '700 70px "Noto Sans Bengali", sans-serif';
      g.textAlign = 'center';
      g.fillText(t.num(Math.abs(i)), 0, 0);
      g.restore();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** The rail: an extruded aluminium section with a groove on top and a sloping front for the scale. */
function createRail(t, { alu, black }) {
  const root = new THREE.Group();
  root.name = 'rail';
  const section = [
    [-5.5, 0],
    [-5.5, RAIL.top],
    [-1.5, RAIL.top],
    [-1.5, 2.3],
    [1.5, 2.3],
    [1.5, RAIL.top],
    [3.3, RAIL.top],
    [STRIP.z1, STRIP.y1],
    [STRIP.z0, STRIP.y0],
    [5.5, 0],
  ];
  const pos = [];
  const nor = [];
  const { left: x0, right: x1 } = RAIL;
  section.forEach(([z, y], i) => {
    if (i === section.length - 1) return; // the underside lies on the table
    const [zb, yb] = section[i + 1];
    const l = Math.hypot(zb - z, yb - y);
    const nz = -(yb - y) / l;
    const ny = (zb - z) / l;
    pos.push(x0, y, z, x1, yb, zb, x1, y, z, x0, y, z, x0, yb, zb, x1, yb, zb);
    for (let k = 0; k < 6; k++) nor.push(0, ny, nz);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const rail = new THREE.Mesh(g, alu);
  rail.castShadow = true;
  rail.receiveShadow = true;
  root.add(rail);
  // the printed strip on the slope: −40 … 40 cm
  const geo = new THREE.BufferGeometry();
  const inset = 0.08;
  const y0 = STRIP.y0 + inset * 0.6;
  const y1 = STRIP.y1 - inset * 0.6;
  const z0 = STRIP.z0 - inset * 0.8;
  const z1 = STRIP.z1 + inset * 0.8;
  const lift = 0.012;
  const pad = (8 / (1024 - 16)) * 80; // the 8 px at the ends of the strip, in cm
  const xa = -40 - pad;
  const xb = 40 + pad;
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([xa, y0 + lift, z0 + lift, xb, y0 + lift, z0 + lift, xb, y1 + lift, z1 + lift, xa, y1 + lift, z1 + lift], 3),
  );
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.computeVertexNormals();
  const scaleMat = new THREE.MeshStandardMaterial({ name: 'Scale', map: scaleTexture(t), roughness: 0.46, metalness: 0.15 });
  root.add(new THREE.Mesh(geo, scaleMat));
  for (const x of [RAIL.left - 0.3, RAIL.right + 0.3]) {
    const cap = new THREE.Mesh(new RoundedBoxGeometry(0.6, RAIL.top + 0.2, 11.4, 2, 0.1), black);
    cap.position.set(x, RAIL.top / 2, 0);
    root.add(cap);
  }
  return root;
}

/** A black sliding carrier, with a thumb screw and a brass pointer that reads the scale. Its origin is on the rail's top, at the pointer. */
function createCarrier({ black, brass, steel }, geos) {
  const root = new THREE.Group();
  root.name = 'carrier';
  const H = RAIL.carrier - RAIL.top;
  const body = new THREE.Mesh(geos.carrier, black);
  body.position.y = H / 2 - 0.17;
  body.castShadow = true;
  root.add(body);
  const screw = new THREE.Mesh(geos.screw, steel);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(2.1, H / 2, 6.2);
  root.add(screw);
  const pointer = new THREE.Mesh(geos.pointer, brass);
  pointer.position.set(0, -0.32, 6.0);
  pointer.rotation.x = 0.68;
  root.add(pointer);
  return root;
}

/**
 * A surface of revolution round the x axis, from φ0 to φ1 (y = r cos φ, z = r sin φ), for a profile of (x, r) points: an indexed
 * grid, so that a lens can rewrite its positions in place. Returns the geometry and a function writing a new profile into it.
 */
function revolve(n, segs, phi0, phi1) {
  const pos = new Float32Array(n * (segs + 1) * 3);
  const idx = [];
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j;
      const b = a + segs + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  const cos = [];
  const sin = [];
  for (let j = 0; j <= segs; j++) {
    const p = phi0 + ((phi1 - phi0) * j) / segs;
    cos.push(Math.cos(p));
    sin.push(Math.sin(p));
  }
  /** profile: flat [x0, r0, x1, r1, …] of n points */
  function write(profile) {
    for (let i = 0; i < n; i++) {
      const x = profile[i * 2];
      const r = profile[i * 2 + 1];
      for (let j = 0; j <= segs; j++) {
        const k = (i * (segs + 1) + j) * 3;
        pos[k] = x;
        pos[k + 1] = r * cos[j];
        pos[k + 2] = r * sin[j];
      }
    }
    g.attributes.position.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
  }
  return { geometry: g, write };
}

/** Glass: faint and clear, brighter and a little green where the surface turns away from the eye (the edges real glass shows). */
export function glassMaterial(name, opacity = 0.2, rim = 0.5) {
  const m = new THREE.MeshStandardMaterial({
    name,
    color: new THREE.Color(0.86, 0.97, 0.95),
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.8,
  });
  const fade = { value: 1 };
  m.userData.fade = fade;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.labFade = fade;
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float labFade;').replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
        float lab_f = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 2.2);
        gl_FragColor.rgb += vec3(0.36, 0.72, 0.62) * lab_f * ${rim.toFixed(2)};
        gl_FragColor.a = clamp(gl_FragColor.a + lab_f * ${(rim * 1.1).toFixed(2)}, 0.0, 1.0) * labFade;`,
    );
  };
  m.customProgramCacheKey = () => `lab-glass-${rim.toFixed(2)}`;
  return m;
}

/** The lens glass of the sister figure convex-lens-image: faint, clear, with the studio's highlights; its rim the faint green of real glass. */
const GLASS_OPACITY = 0.26;
const EDGE_OPACITY = { convex: 0.85, concave: 0.5 }; // the concave lens's rim is wide: the same green, fainter
function lensGlass(name) {
  return new THREE.MeshPhysicalMaterial({
    name,
    color: 0xeafcf7,
    roughness: 0.03,
    metalness: 0,
    transparent: true,
    opacity: GLASS_OPACITY,
    envMapIntensity: 2.2,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
function lensEdge(name, kind) {
  return new THREE.MeshStandardMaterial({
    name,
    color: 0x8fcab4,
    roughness: 0.2,
    transparent: true,
    opacity: EDGE_OPACITY[kind],
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

const M = 14; // rings from the axis to the rim, on each face
const SEG = 32; // segments round each half (64 round the lens)
/** The section's rows, from the bottom of the rim to the top. */
const ROWS = 2 * M + 1;

/**
 * One half of a lens (back: z ≤ 0, front: z ≥ 0): its two curved faces, its rim, and its cut face in the plane z = 0 (the
 * section, pale blue as in the book). setShape(L) rewrites the positions in place.
 */
function createLensHalf(front, glass, edgeMat, cutMat) {
  const root = new THREE.Group();
  root.name = front ? 'lens-front-half' : 'lens-back-half';
  const [p0, p1] = front ? [0, Math.PI] : [Math.PI, 2 * Math.PI];
  const f1 = revolve(M + 1, SEG, p0, p1);
  const f2 = revolve(M + 1, SEG, p0, p1);
  const rim = revolve(2, SEG, p0, p1);
  for (const [r, mat] of [
    [f1, glass],
    [f2, glass],
    [rim, edgeMat],
  ]) {
    const m = new THREE.Mesh(r.geometry, mat);
    m.renderOrder = 3;
    root.add(m);
  }
  // the cut face: a strip of quads between the two faces, row by row from the bottom of the rim to the top
  const cutPos = new Float32Array(ROWS * 2 * 3);
  const cutIdx = [];
  for (let i = 0; i < ROWS - 1; i++) {
    const a = i * 2;
    // counter-clockwise seen from the side the face looks to: +z for the back half, −z for the front half
    if (front) cutIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    else cutIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const cutGeo = new THREE.BufferGeometry();
  cutGeo.setAttribute('position', new THREE.BufferAttribute(cutPos, 3));
  const nz = front ? -1 : 1;
  const cutNor = new Float32Array(ROWS * 2 * 3);
  for (let i = 0; i < ROWS * 2; i++) cutNor[i * 3 + 2] = nz;
  cutGeo.setAttribute('normal', new THREE.BufferAttribute(cutNor, 3));
  cutGeo.setIndex(cutIdx);
  const cut = new THREE.Mesh(cutGeo, cutMat);
  cut.renderOrder = 2;
  cut.position.z = front ? -0.004 : 0.004;
  root.add(cut);
  const a = new Float32Array((M + 1) * 2);
  const b = new Float32Array((M + 1) * 2);
  const c = new Float32Array(4);
  return {
    root,
    cut,
    setShape(L) {
      for (let i = 0; i <= M; i++) {
        const r = (i / M) * L.h;
        a[i * 2] = leftFace(L, r);
        a[i * 2 + 1] = r;
        b[i * 2] = rightFace(L, r);
        b[i * 2 + 1] = r;
      }
      c[0] = a[M * 2];
      c[1] = L.h;
      c[2] = b[M * 2];
      c[3] = L.h;
      f1.write(a);
      f2.write(b);
      rim.write(c);
      for (let i = 0; i < ROWS; i++) {
        const y = -L.h + (i / (ROWS - 1)) * 2 * L.h;
        const k = i * 6;
        cutPos[k] = leftFace(L, Math.abs(y));
        cutPos[k + 1] = y;
        cutPos[k + 3] = rightFace(L, Math.abs(y));
        cutPos[k + 4] = y;
      }
      cutGeo.attributes.position.needsUpdate = true;
      cutGeo.computeBoundingSphere();
    },
  };
}

/** Half of the black ring that holds a lens by its rim (back or front), its own small section end faces included (double-sided). */
function ringHalfGeometry(front) {
  const { in: IN, out: OUT, w: W } = RING;
  // the sister figure's ring section (bevelled corners), and a lip on each side that keeps the glass
  const prof = [-W, IN, -W - 0.1, IN + 0.1, -W - 0.1, OUT - 0.1, -W, OUT, W, OUT, W + 0.1, OUT - 0.1, W + 0.1, IN + 0.1, W, IN, -W, IN];
  const [p0, p1] = front ? [0, Math.PI] : [Math.PI, 2 * Math.PI];
  const r = revolve(9, 40, p0, p1);
  r.write(prof);
  const parts = [r.geometry.toNonIndexed()];
  for (const sx of [1, -1]) {
    const lip = new THREE.TorusGeometry(IN - 0.05, 0.12, 6, 36, Math.PI);
    lip.rotateZ(front ? Math.PI / 2 : -Math.PI / 2);
    lip.rotateY(Math.PI / 2);
    lip.translate(sx * (W - 0.1), 0, 0);
    lip.deleteAttribute('uv');
    parts.push(lip.toNonIndexed());
  }
  parts[0].deleteAttribute('uv');
  const merged = mergeGeometries(parts);
  merged.computeVertexNormals();
  return merged;
}

/** A lens on its stand: a carrier, a post, the ring in two halves and the glass in two halves. Its origin is on the rail's top. */
function createLensStand(kind, mats, geos) {
  const root = new THREE.Group();
  root.name = kind === 'convex' ? 'convex-lens' : 'concave-lens';
  root.add(createCarrier(mats, geos));
  const POST = RAIL.axis - RING.out - RAIL.carrier;
  const post = new THREE.Mesh(geos.post, mats.steel);
  post.scale.y = POST + 0.4;
  post.position.y = RAIL.carrier - RAIL.top + POST / 2;
  post.castShadow = true;
  root.add(post);
  // the back half stays; the front half (ring and glass together) can be taken away toward the viewer
  const glassBack = lensGlass(`${kind}-glass`);
  const glassFront = lensGlass(`${kind}-glass-front`);
  const edgeBack = lensEdge(`${kind}-edge`, kind);
  const edgeFront = lensEdge(`${kind}-edge-front`, kind);
  // the section: an opaque pale blue, as the book prints it (the front half's copy fades as it goes)
  const cutMat = new THREE.MeshStandardMaterial({ name: 'LensSection', color: 0xc8e6f4, emissive: 0x2a4a5c, roughness: 0.35 });
  const cutFront = new THREE.MeshStandardMaterial({
    name: 'LensSectionFront',
    color: 0xc8e6f4,
    emissive: 0x2a4a5c,
    roughness: 0.35,
    transparent: true,
    depthWrite: false,
  });
  const ringBackMat = mats.black;
  const ringFrontMat = mats.black.clone();
  ringFrontMat.name = 'BlackAnodisedFront';
  ringFrontMat.transparent = true;
  const back = new THREE.Group();
  back.position.y = RAIL.axis - RAIL.top;
  const front = new THREE.Group();
  front.position.y = RAIL.axis - RAIL.top;
  const ringBack = new THREE.Mesh(geos.ringBack, ringBackMat);
  ringBack.castShadow = true;
  const ringFront = new THREE.Mesh(geos.ringFront, ringFrontMat);
  ringFront.castShadow = true;
  const halfBack = createLensHalf(false, glassBack, edgeBack, cutMat);
  const halfFront = createLensHalf(true, glassFront, edgeFront, cutFront);
  back.add(ringBack, halfBack.root);
  front.add(ringFront, halfFront.root);
  // a brass screw on top of the ring, with its steel pin
  const cap = new THREE.Mesh(geos.screwCap, mats.brass);
  cap.position.y = RING.out + 0.2;
  const pin = new THREE.Mesh(geos.pin, mats.steel);
  pin.position.y = RING.out + 0.55;
  back.add(cap, pin);
  root.add(back, front);
  let shape = null;
  return {
    root,
    back,
    front,
    halfBack,
    halfFront,
    /** The glass's shape (a lens of reading.js); the ring, its screw and the post follow its size. */
    setShape(L) {
      if (shape && shape.t === L.t && shape.c1 === L.c1 && shape.c2 === L.c2 && shape.h === L.h) return;
      shape = L;
      halfBack.setShape(L);
      halfFront.setShape(L);
      const k = (L.h + 0.25) / RING.in;
      ringBack.scale.set(1, k, k);
      ringFront.scale.set(1, k, k);
      cap.position.y = RING.out * k + 0.2;
      pin.position.y = RING.out * k + 0.55;
      const len = RAIL.axis - RING.out * k - RAIL.carrier;
      post.scale.y = len + 0.4;
      post.position.y = RAIL.carrier - RAIL.top + len / 2;
    },
    /** cut 0 … 1: the front half goes toward the viewer and fades; the section shows. */
    setCut(cut) {
      front.position.z = cut * 16;
      front.visible = cut < 0.995;
      const a = 1 - cut;
      glassFront.opacity = GLASS_OPACITY * a;
      edgeFront.opacity = EDGE_OPACITY[kind] * a;
      ringFrontMat.opacity = a;
      cutFront.opacity = a;
      ringFrontMat.depthWrite = a > 0.98;
      halfBack.cut.visible = cut > 0.01;
      halfFront.cut.visible = cut > 0.01 && cut < 0.995;
    },
  };
}

/** The ray box of the sister figures: a lamp in a dark steel case, parallel light through a column of small holes. Faces +x; its origin is at the plate, on the axis. */
function createRayBox({ black, steel, paint }, glow, geos) {
  const root = new THREE.Group();
  root.name = 'ray-box';
  const W = 6.5;
  const H = 16;
  const D = 11;
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, 0.4), paint);
  body.position.x = -W / 2 - 0.25;
  body.castShadow = true;
  root.add(body);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.4, H - 3, D - 3, 2, 0.1), black);
  plate.position.x = -0.15;
  root.add(plate);
  const slots = new THREE.InstancedMesh(new THREE.BoxGeometry(5.2, 0.1, 0.5), black, 6);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 6; i++) slots.setMatrixAt(i, m.makeTranslation(-W / 2 - 0.25, H / 2 + 0.03, -3.2 + i * 1.3));
  root.add(slots);
  const post = new THREE.Mesh(geos.post, steel);
  post.scale.y = RAIL.axis - H / 2 - RAIL.carrier + 0.4;
  post.position.set(-W / 2, -(RAIL.axis - H / 2 - RAIL.carrier) / 2 - H / 2, 0);
  root.add(post);
  const hole = new THREE.CircleGeometry(0.36, 16);
  hole.rotateY(Math.PI / 2);
  const litMat = new THREE.MeshBasicMaterial({ name: 'RayBoxHole', color: 0x4a4436, toneMapped: false });
  const holes = new THREE.InstancedMesh(hole, litMat, HOLES.length);
  HOLES.forEach((y, i) => holes.setMatrixAt(i, m.makeTranslation(0.07, y, 0)));
  root.add(holes);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xffc95e,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      opacity: 0,
    }),
  );
  halo.position.x = 0.5;
  halo.scale.set(9, 12, 1);
  halo.userData.noExport = true;
  root.add(halo);
  const off = new THREE.Color(0x4a4436);
  const on = new THREE.Color(0xffe9a8);
  return {
    root,
    set(k) {
      litMat.color.copy(off).lerp(on, k);
      halo.material.opacity = 0.42 * k;
      halo.visible = k > 0.01;
    },
  };
}

/** The laser pointer: a slim dark metal body with a red button, held by a clamp on a rod. Its origin is the aperture; it shines along +x. */
function createLaser({ black, steel }, glow) {
  const root = new THREE.Group();
  root.name = 'laser-pointer';
  const bodyMat = new THREE.MeshStandardMaterial({ name: 'LaserBody', color: 0x3a4250, roughness: 0.32, metalness: 0.85 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 10, 24), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.position.x = -5.4;
  body.castShadow = true;
  root.add(body);
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.8, 24), steel);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = -0.4;
  root.add(nose);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.5, 24), black);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -10.6;
  root.add(tail);
  const button = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12),
    new THREE.MeshStandardMaterial({ name: 'LaserButton', color: 0xd9302f, roughness: 0.4 }),
  );
  button.position.set(-3.4, 0.66, 0);
  root.add(button);
  const dotMat = new THREE.MeshBasicMaterial({ name: 'LaserAperture', color: 0x401010, toneMapped: false });
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), dotMat);
  dot.rotation.y = Math.PI / 2;
  dot.position.x = 0.01;
  root.add(dot);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xff4d4d,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      opacity: 0,
    }),
  );
  halo.position.x = 0.3;
  halo.scale.setScalar(2.6);
  halo.userData.noExport = true;
  root.add(halo);
  const off = new THREE.Color(0x401010);
  const on = new THREE.Color(0xff6b6b);
  return {
    root,
    set(k) {
      dotMat.color.copy(off).lerp(on, k);
      halo.material.opacity = 0.9 * k;
      halo.visible = k > 0.01;
    },
  };
}

export function createSetting({ stage, shadow, t, transparent = false }) {
  const { scene, renderer } = stage;
  if (!transparent) scene.background = backdropTexture();

  // the table: a plain light-sand top, finite, the blue all round it
  const table = new THREE.Mesh(
    new RoundedBoxGeometry(124, 3, 56, 2, 0.9),
    new THREE.MeshStandardMaterial({ name: 'Table', color: 0xcdbb98, roughness: 0.86, metalness: 0, envMapIntensity: 0.4 }),
  );
  table.position.set(0, -1.5, 2);
  table.receiveShadow = true;
  table.userData.noExport = true;
  scene.add(table);

  const glow = glowTexture();
  const mats = {
    alu: new THREE.MeshStandardMaterial({ name: 'Aluminium', color: 0xb4bcc6, roughness: 0.42, metalness: 0.85 }),
    black: new THREE.MeshStandardMaterial({ name: 'BlackAnodised', color: 0x1b1f24, roughness: 0.46, metalness: 0.55, side: THREE.DoubleSide }),
    steel: new THREE.MeshStandardMaterial({ name: 'Steel', color: 0xb9c0c9, roughness: 0.3, metalness: 0.92 }),
    brass: new THREE.MeshStandardMaterial({ name: 'Brass', color: 0xc9a227, roughness: 0.34, metalness: 0.95 }),
    paint: new THREE.MeshStandardMaterial({ name: 'RayBoxPaint', color: 0x2f3e52, roughness: 0.56, metalness: 0.4 }),
  };
  // shared geometry: the carriers, posts and rings are the same on every stand
  const geos = {
    carrier: new RoundedBoxGeometry(6, RAIL.carrier - RAIL.top + 0.35, 11.6, 3, 0.26),
    screw: new THREE.CylinderGeometry(0.7, 0.7, 1, 16),
    pointer: new THREE.BoxGeometry(0.22, 0.14, 1.9),
    post: new THREE.CylinderGeometry(0.75, 0.95, 1, 20),
    rod: new THREE.CylinderGeometry(0.42, 0.42, 1, 14),
    screwCap: new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16),
    pin: new THREE.CylinderGeometry(0.2, 0.2, 0.5, 10),
    ringBack: ringHalfGeometry(false),
    ringFront: ringHalfGeometry(true),
  };

  const apparatus = new THREE.Group();
  apparatus.name = 'optical-bench';
  scene.add(apparatus);
  apparatus.add(createRail(t, mats));

  const lenses = {
    convex: createLensStand('convex', mats, geos),
    concave: createLensStand('concave', mats, geos),
  };
  for (const L of Object.values(lenses)) {
    L.root.position.y = RAIL.top;
    apparatus.add(L.root);
  }

  // the ray box on its carrier
  const boxRoot = new THREE.Group();
  boxRoot.name = 'ray-box-on-carrier';
  const rayBox = createRayBox(mats, glow, geos);
  rayBox.root.position.y = RAIL.axis - RAIL.top;
  const boxCarrier = createCarrier(mats, geos);
  boxCarrier.position.x = -3.25;
  boxRoot.add(rayBox.root, boxCarrier);
  boxRoot.position.y = RAIL.top;
  apparatus.add(boxRoot);

  // the glass slab of চিত্র ৯.১৬ on a small black platform; its thickness is the box's x scale
  const slabRoot = new THREE.Group();
  slabRoot.name = 'glass-slab';
  slabRoot.add(createCarrier(mats, geos));
  const plat = new THREE.Mesh(new RoundedBoxGeometry(11.5, 0.6, 6, 2, 0.12), mats.black);
  const SLAB_BOTTOM = RAIL.axis - SLAB.half - RAIL.top;
  plat.position.y = SLAB_BOTTOM - 0.3;
  plat.castShadow = true;
  const slabPost = new THREE.Mesh(geos.post, mats.steel);
  slabPost.scale.y = SLAB_BOTTOM - (RAIL.carrier - RAIL.top) - 0.4;
  slabPost.position.y = (SLAB_BOTTOM + RAIL.carrier - RAIL.top) / 2 - 0.3;
  const slabGlass = new THREE.Mesh(new THREE.BoxGeometry(1, 2 * SLAB.half, 2 * SLAB.depth), glassMaterial('SlabGlass', 0.22, 0.6));
  slabGlass.position.y = RAIL.axis - RAIL.top;
  slabGlass.renderOrder = 3;
  slabRoot.add(plat, slabPost, slabGlass);
  slabRoot.position.y = RAIL.top;
  apparatus.add(slabRoot);

  // the laser on a clamp and rod; placed so that its beam runs along the ray the figure traces
  const laserRoot = new THREE.Group();
  laserRoot.name = 'laser-on-stand';
  const laser = createLaser(mats, glow);
  const laserCarrier = createCarrier(mats, geos);
  const rod = new THREE.Mesh(geos.rod, mats.steel);
  rod.castShadow = true;
  const clamp = new THREE.Mesh(new RoundedBoxGeometry(1.8, 1.8, 2.4, 2, 0.2), mats.black);
  laserRoot.add(laser.root, laserCarrier, rod, clamp);
  apparatus.add(laserRoot);

  // the two spheres of চিত্র ৯.১৫: faint glass balls, their front halves cut away like the lens's
  const sphereGeo = new THREE.SphereGeometry(1, 48, 24, Math.PI, Math.PI);
  const sphereMat = glassMaterial('Sphere', 0.05, 0.42);
  const spheres = [0, 1].map(() => {
    const m = new THREE.Mesh(sphereGeo, sphereMat);
    m.renderOrder = 1;
    m.visible = false;
    m.userData.noExport = true;
    scene.add(m);
    return m;
  });

  // the bright spot where the light gathers
  const star = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xffd76e,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      opacity: 0,
    }),
  );
  star.renderOrder = 6;
  star.visible = false;
  star.userData.noExport = true;
  scene.add(star);

  // big invisible targets for a finger, one per thing the action may point at
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const hit = new THREE.Mesh(new THREE.SphereGeometry(8, 10, 8), hidden);
  hit.userData.noExport = true;
  scene.add(hit);

  // the lights: a warm key from the front left (soft shadows on the table) and a cool sky fill
  const key = new THREE.DirectionalLight(0xfff3e4, 2.1);
  key.position.set(-30, 95, 60);
  key.target.position.set(0, 0, 0);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 4;
    Object.assign(key.shadow.camera, { left: -55, right: 55, top: 30, bottom: -30, near: 50, far: 190 });
    key.shadow.camera.updateProjectionMatrix();
  }
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x5a5040, 1.15));

  const dIn = new THREE.Vector3();
  return {
    apparatus,
    lenses,
    hit,
    /** Parts of later steps, hidden at the start: the stage compiles their shaders ahead. */
    later: [boxRoot, slabRoot, laserRoot, star, lenses.convex.front, lenses.concave.front, ...spheres],
    /** A lens stand at x on the rail; up 0 … 1 lifts it off. */
    placeLens(kind, x, up) {
      const L = lenses[kind];
      L.root.position.x = x;
      L.root.position.y = RAIL.top + up * LIFT;
      L.root.visible = up < 0.999;
    },
    placeBox(x, up, lamp) {
      boxRoot.position.x = x;
      boxRoot.position.y = RAIL.top + up * LIFT;
      boxRoot.visible = up < 0.999;
      rayBox.set(lamp);
    },
    placeSlab(T, up) {
      slabRoot.position.y = RAIL.top + up * LIFT;
      slabRoot.visible = up < 0.999;
      slabGlass.scale.x = T;
    },
    /** The laser with its aperture at `tip` (cm, x and height above the axis), shining along `dir` (a unit 2D vector, down to the right). */
    placeLaser(tip, dir, up, on) {
      laserRoot.visible = up < 0.999;
      const lift = up * LIFT;
      const ang = Math.atan2(dir.y, dir.x);
      laser.root.position.set(tip.x, RAIL.axis + tip.y + lift, 0);
      laser.root.rotation.z = ang;
      // the clamp holds the body 5 cm behind the aperture; the rod comes up to it from a carrier on the rail
      dIn.set(dir.x, dir.y, 0);
      const cx = tip.x - dir.x * 5.6;
      const cy = RAIL.axis + tip.y - dir.y * 5.6;
      clamp.position.set(cx, cy + lift - 0.2, 0);
      clamp.rotation.z = ang;
      const rodTop = cy - 0.8;
      rod.scale.y = rodTop - RAIL.carrier;
      rod.position.set(cx, (rodTop + RAIL.carrier) / 2 + lift, 0);
      laserCarrier.position.set(cx, RAIL.top + lift, 0);
      laser.set(on);
    },
    /** The spheres round a lens's faces: centres x1, x2 on the axis, radius r, shown as far as k. */
    placeSpheres(x1, x2, r, k) {
      spheres.forEach((m, i) => {
        m.visible = k > 0.01;
        m.position.set(i ? x2 : x1, RAIL.axis, 0);
        m.scale.setScalar(r);
      });
      sphereMat.userData.fade.value = Math.min(1, k);
    },
    /** The bright spot at (x, y above the axis) of strength k. */
    placeStar(x, y, k, size = 4) {
      star.visible = k > 0.01;
      star.position.set(x, RAIL.axis + y, 0);
      star.scale.setScalar(size);
      star.material.opacity = k;
    },
  };
}
