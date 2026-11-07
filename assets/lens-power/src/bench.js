// The chapter's optical bench, in centimetres, in the calm setting of the owner's latest figures: a deep-blue backdrop (the scene's
// background, one small gradient) and a plain light-sand table top with the blue all round it. On the table: an anodised aluminium
// rail with a printed cm scale on its sloping front (0 at the lens, counting away on both sides, as convex-lens-image), black sliding
// carriers; the lens in its black ring holder at 0, lifted off the rail and set down again to change it; the ray box with its column
// of five holes on the left; the book's pencil XY on its stand. The carriers, the lens stand (ring and glass in two halves), the lens
// glass and the ray box are copied from the sister figure lens-types, the rail, scale and pencil from convex-lens-image (a shared
// optics-bench module will come later), so the chapter's lens figures look alike. x runs along the rail, the light goes toward +x.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { pencilParts } from './pencil.js';
import { HOLES, LENS, leftFace, lensOf, LENSES, rightFace } from './reading.js';

/** The heights that matter, cm: the rail's top, the carriers' top, the principal axis; the rail's two ends. */
export const RAIL = { top: 3.2, carrier: 5.6, axis: 19, left: -68, right: 82 };
/** The scale strip on the sloping front of the rail: where it lies. */
const STRIP = { y0: 0.55, z0: 5.5, y1: 2.35, z1: 3.3 };
export const SCALE_POINT = { y: (STRIP.y0 + STRIP.y1) / 2, z: (STRIP.z0 + STRIP.z1) / 2 };
/** The colours of the backdrop, top and bottom (the calm deep blue of equations-of-motion and newtons-second-law). */
export const BG = ['#0b2a5b', '#123d7a'];
/** The ring round a lens: inner and outer radius, half its width (the sisters'). */
export const RING = { in: LENS.half + 0.25, out: LENS.half + 0.8, w: 0.55 };
/** The ray box: its plate (the holes) is its origin; where it stands for the lens steps and for the others. */
export const BOX = { near: -30, far: -56, height: 16 };
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

/**
 * The printed scale: two strips in one 1024 × 256 texture, 14 px to the centimetre. Row 0 runs 0 → 80 cm to the right of the lens,
 * row 1 runs 70 → 0 to its left. Black on satin silver: a tick each cm, longer each 5, a number each 10.
 */
function scaleTexture(t) {
  const W = 1024;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#c4cbd3';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#14181d';
  g.fillStyle = '#14181d';
  g.textBaseline = 'alphabetic';
  const row = (y0, length, dir) => {
    const px = (W - 8) / length;
    const x0 = dir > 0 ? 4 : W - 4;
    for (let i = 0; i <= length; i++) {
      const x = x0 + dir * i * px;
      const major = i % 10 === 0;
      const mid = i % 5 === 0;
      g.lineWidth = major ? 3.5 : 2;
      g.beginPath();
      g.moveTo(x, y0 + 3);
      g.lineTo(x, y0 + (major ? 40 : mid ? 28 : 18));
      g.stroke();
      if (major) {
        // the strip has more pixels to a centimetre across than along: the digits are drawn narrow to come out true
        g.save();
        g.translate(x, y0 + 116);
        g.scale(0.6, 1);
        g.font = '700 84px "Noto Sans Bengali", sans-serif';
        g.textAlign = i === 0 ? (dir > 0 ? 'left' : 'right') : 'center';
        g.fillText(t.num(i), 0, 0);
        g.restore();
      }
    }
  };
  row(0, 80, 1);
  row(128, 70, -1);
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
    const [zb, yb] = section[(i + 1) % section.length];
    if (i === section.length - 1) return; // the underside lies on the table
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
  // the two printed strips on the slope, in one mesh
  const tex = scaleTexture(t);
  const scaleMat = new THREE.MeshStandardMaterial({ name: 'Scale', map: tex, roughness: 0.46, metalness: 0.15 });
  const inset = 0.08;
  const y0 = STRIP.y0 + inset * 0.6;
  const y1 = STRIP.y1 - inset * 0.6;
  const z0 = STRIP.z0 - inset * 0.8;
  const z1 = STRIP.z1 + inset * 0.8;
  const lift = 0.012;
  const pad = 0.0078 * 80; // the 4 px at the ends of a row, in cm
  const pos2 = [];
  const uv = [];
  const idx = [];
  const strip = (xa, xb, v0, v1) => {
    const b = pos2.length / 3;
    pos2.push(xa, y0 + lift, z0 + lift, xb, y0 + lift, z0 + lift, xb, y1 + lift, z1 + lift, xa, y1 + lift, z1 + lift);
    uv.push(0, v0, 1, v0, 1, v1, 0, v1);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  strip(-pad * (70 / 80), 80 + pad, 0.5, 1); // 0 → 80, the top row of the canvas
  strip(-70 - pad * (70 / 80), pad * (70 / 80), 0, 0.5); // 70 → 0, its bottom row
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pos2, 3));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  sg.setIndex(idx);
  sg.computeVertexNormals();
  root.add(new THREE.Mesh(sg, scaleMat));
  const caps = [RAIL.left - 0.3, RAIL.right + 0.3].map((x) =>
    new RoundedBoxGeometry(0.6, RAIL.top + 0.2, 11.4, 2, 0.1).translate(x, RAIL.top / 2, 0),
  );
  root.add(new THREE.Mesh(mergeGeometries(caps), black));
  return root;
}

/** A black sliding carrier, with a thumb screw and a brass pointer that reads the scale. Its origin is on the rail's top, at the pointer. */
function createCarrier({ black, brass, steel }, geos) {
  const root = new THREE.Group();
  root.name = 'carrier';
  const H = RAIL.carrier - RAIL.top;
  const body = new THREE.Mesh(geos.carrier, black);
  body.position.y = H / 2 - 0.17;
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

/** The pencil's stand: a carrier, a steel rod up to the axis and a brass cup. Its origin is on the rail's top. */
function createStand(mats, geos) {
  const root = new THREE.Group();
  root.name = 'pencil-stand';
  root.add(createCarrier(mats, geos));
  const rise = RAIL.axis - RAIL.carrier;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, rise - 0.2, 14), mats.steel);
  rod.position.y = RAIL.carrier - RAIL.top + rise / 2 - 0.25;
  root.add(rod);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.52, 0.32, 18), mats.brass);
  cup.position.y = RAIL.axis - RAIL.top - 0.14;
  root.add(cup);
  return root;
}

export function createSetting({ stage, shadow, t, transparent = false }) {
  const { scene, renderer } = stage;
  if (!transparent) scene.background = backdropTexture();

  // the table: a plain light-sand top, finite, the blue all round it
  const table = new THREE.Mesh(
    new RoundedBoxGeometry(176, 3, 56, 2, 0.9),
    new THREE.MeshStandardMaterial({ name: 'Table', color: 0xcdbb98, roughness: 0.86, metalness: 0, envMapIntensity: 0.4 }),
  );
  table.position.set(4, -1.5, 2);
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
    screwCap: new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16),
    pin: new THREE.CylinderGeometry(0.2, 0.2, 0.5, 10),
    ringBack: ringHalfGeometry(false),
    ringFront: ringHalfGeometry(true),
  };

  const apparatus = new THREE.Group();
  apparatus.name = 'optical-bench';
  scene.add(apparatus);
  apparatus.add(createRail(t, mats));

  // a convex and a concave lens stand at 0 (one on the rail at a time); each takes the shape of the lens of its kind in use
  const stands = { convex: createLensStand('convex', mats, geos), concave: createLensStand('concave', mats, geos) };
  for (const L of Object.values(stands)) {
    L.root.position.y = RAIL.top;
    L.setCut(0);
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

  // the pencil XY on its stand
  const parts = pencilParts();
  const pencil = new THREE.Group();
  pencil.name = 'pencil-XY';
  const stand = createStand(mats, geos);
  stand.position.y = RAIL.top;
  const paint = new THREE.Mesh(parts.paintGeo, parts.paint);
  const metal = new THREE.Mesh(parts.metalGeo, parts.metal);
  paint.castShadow = true;
  const body = new THREE.Group();
  body.position.y = RAIL.axis;
  body.add(paint, metal);
  pencil.add(stand, body);
  pencil.visible = false;
  apparatus.add(pencil);

  // The image X′Y′: a ghost at 45 % standing upright (virtual) or a solid pencil hanging upside down (real), as the sisters draw them.
  // Both draw last, each from a fresh depth: an image is not stopped by the rail or the glass.
  const whole = parts.wholeGeo();
  const solid = new THREE.Mesh(
    whole,
    new THREE.MeshStandardMaterial({ name: 'ImageReal', vertexColors: true, roughness: 0.46, transparent: true, side: THREE.DoubleSide }),
  );
  const ghost = new THREE.Mesh(
    whole,
    new THREE.MeshStandardMaterial({
      name: 'ImageGhost',
      vertexColors: true,
      roughness: 0.5,
      transparent: true,
      opacity: 0.45,
      emissive: 0x6a5a3a,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  for (const m of [solid, ghost]) {
    m.renderOrder = 6;
    m.visible = false;
    m.userData.noExport = true;
    m.onBeforeRender = (r) => r.clearDepth();
    scene.add(m);
  }
  solid.rotation.x = Math.PI; // upside down, its Y′ on the axis

  // big invisible targets for a finger: the lens with its ring (the action's place), the ray box
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const lensHit = new THREE.Mesh(new THREE.BoxGeometry(10, 20, 18), hidden);
  lensHit.position.y = RAIL.axis - 1;
  lensHit.userData.noExport = true;
  apparatus.add(lensHit);
  const boxHit = new THREE.Mesh(new THREE.BoxGeometry(10, 18, 13), hidden);
  boxHit.position.set(-3.5, RAIL.axis - RAIL.top, 0);
  boxHit.userData.noExport = true;
  boxRoot.add(boxHit);

  // the lights: a warm key from the front right (soft shadows on the table) and a cool sky fill
  const key = new THREE.DirectionalLight(0xfff3e4, transparent || !shadow ? 2.2 : 2);
  key.position.set(30, 95, 60);
  key.target.position.set(-6, 0, 0);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 4;
    Object.assign(key.shadow.camera, { left: -72, right: 72, top: 34, bottom: -26, near: 40, far: 190 });
    key.shadow.camera.updateProjectionMatrix();
  }
  key.target.updateMatrixWorld();
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x5a5040, 1.15));

  return {
    apparatus,
    lensHit,
    boxHit,
    /** Parts of later steps, hidden at the start: the stage compiles their shaders ahead. */
    later: [pencil, solid, ghost, stands.convex.root, stands.concave.root],
    /** The lens id on its stand at 0, lifted by k (0 on the rail … 1 out of the frame); the other kind's stand off the rail. */
    placeLens(id, k = 0) {
      const kind = LENSES[id].kind;
      const L = stands[kind];
      L.setShape(lensOf(id));
      L.root.position.y = RAIL.top + k * LIFT;
      L.root.visible = k < 0.999;
      const other = stands[kind === 'convex' ? 'concave' : 'convex'];
      other.root.visible = false;
    },
    /** The ray box at x (its plate), its lamp at strength k (0 off, 1 on). */
    placeBox(x, k) {
      boxRoot.position.x = x;
      rayBox.set(k);
    },
    /** The pencil at x = −u, k: 0 lifted away … 1 standing on the rail. */
    placePencil(u, k) {
      pencil.visible = k > 0.001;
      pencil.position.x = -u;
      pencil.position.y = (1 - k) * LIFT * 0.5;
    },
    /** The image at x, of size m (× the pencil), grown to the share k from Y′: real ones hang under the axis, virtual ones stand on it. */
    placeImage(kind, x, m, k) {
      const show = kind === 'real' ? solid : ghost;
      const hide = kind === 'real' ? ghost : solid;
      hide.visible = false;
      show.visible = (kind === 'real' || kind === 'virtual') && k > 0.01 && Number.isFinite(x);
      if (!show.visible) return;
      show.position.set(x, RAIL.axis, 0);
      show.scale.set(Math.max(0.6, m), Math.max(0.001, m * k), Math.max(0.6, m));
    },
    /** What exports: the bench with the lens in use on its stand, the ray box, the pencil's stand, in cm. */
    exportParts() {
      return apparatus;
    },
  };
}
