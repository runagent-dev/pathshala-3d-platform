// The apparatus, in centimetres, procedural three.js: a magnified optical fibre (a clear glass core, a pale-blue glass clad
// and a thin dark plastic coating cut away on the near side so the inside shows), held level at both ends by black ring
// clamps on steel posts; the far clamp slides up and down its rod, so the fibre bends into an S. A small light source on a
// swing arm that turns about the near end face's centre, and a white screen fixed to the far clamp, where the light lands.
// The fibre is swept along the centre line of reading.js (exact lines and arcs) and re-swept in place when it bends.
// The fibre's centre line lies in the plane z = 0; its near end face is at (X0, Y0, 0).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BEND_MAX, centreAt, centreLine, FIBRE, SCREEN_GAP, SCREEN_HALF, SOURCE_GAP } from './reading.js';

export const X0 = -37; // world x of the near end face
export const Y0 = 15; // the fibre's height over the table at the near end
const POST_Z = -4.6; // the posts stand behind the fibre
const NEAR_CLAMP = 9.5; // fibre x of the near clamp (clear of the first walls, where light leaks in step ⑤)
const FAR_CLAMP = FIBRE.length - 3.6;
const BODY = 9.5; // the source's body length
const BODY_R = 1.05;
const PER_ARC = 22; // rings along each arc of the bend (a straight piece needs only its two end rings)
const ALONG = 2 * PER_ARC + 2; // the sweep's segments along the fibre: start, the two arcs, the end
const ROUND = 24; // points round each ring
/** The coating is cut away on the near side (toward +z), between these angles from the top. */
const CUT = [THREE.MathUtils.degToRad(22), THREE.MathUtils.degToRad(158)];

/**
 * Where the rings go along the centre line (arc length, cm): both ends of the straight start, PER_ARC along each arc,
 * the far end. A straight fibre keeps the same rings (as if its middle were two arcs), so the surface is rewritten in place.
 */
const RINGS = new Float64Array(ALONG + 1);
function ringsAlong(line) {
  const p = line.pieces;
  const lens =
    p.length === 4 ? [p[0].len, p[1].len, p[2].len, p[3].len] : [FIBRE.s1, FIBRE.span / 2, FIBRE.span / 2, FIBRE.length - FIBRE.s1 - FIBRE.span];
  let i = 0;
  RINGS[i++] = 0;
  RINGS[i++] = lens[0];
  for (let k = 1; k <= PER_ARC; k++) RINGS[i++] = lens[0] + (lens[1] * k) / PER_ARC;
  for (let k = 1; k <= PER_ARC; k++) RINGS[i++] = lens[0] + lens[1] + (lens[2] * k) / PER_ARC;
  RINGS[i] = lens[0] + lens[1] + lens[2] + lens[3];
}

/** A swept surface round the centre line: rings of `round` points at radius r, from angle psi0 to psi1 (from the top, toward +z). */
function sweep(r, psi0, psi1, round) {
  const rows = ALONG + 1;
  const cols = round + 1;
  const pos = new Float32Array(rows * cols * 3);
  const nor = new Float32Array(rows * cols * 3);
  const index = [];
  for (let i = 0; i < ALONG; i++)
    for (let j = 0; j < round; j++) {
      const a = i * cols + j;
      const b = a + cols;
      index.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
  g.setIndex(index);
  const cs = new Float32Array(cols);
  const sn = new Float32Array(cols);
  for (let j = 0; j < cols; j++) {
    const psi = psi0 + ((psi1 - psi0) * j) / round;
    cs[j] = Math.cos(psi);
    sn[j] = Math.sin(psi);
  }
  const c = { x: 0, y: 0, tx: 1, ty: 0, nx: 0, ny: 1 };
  /** Writes the surface for a centre line, in place (no new arrays). */
  function update(line) {
    ringsAlong(line);
    for (let i = 0; i < rows; i++) {
      centreAt(line, RINGS[i], c);
      for (let j = 0; j < cols; j++) {
        const k = (i * cols + j) * 3;
        const dx = cs[j] * c.nx;
        const dy = cs[j] * c.ny;
        const dz = sn[j];
        pos[k] = X0 + c.x + r * dx;
        pos[k + 1] = Y0 + c.y + r * dy;
        pos[k + 2] = r * dz;
        nor[k] = dx;
        nor[k + 1] = dy;
        nor[k + 2] = dz;
      }
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
    g.computeBoundingSphere();
    g.computeBoundingBox();
  }
  return { geometry: g, update };
}

/** A flat ring (or disc, r0 = 0) in the plane x = 0, from psi0 to psi1 (from +y toward +z), facing +x or −x. */
function annulus(r0, r1, psi0, psi1, n, facing) {
  const pos = [];
  const idx = [];
  for (let j = 0; j <= n; j++) {
    const psi = psi0 + ((psi1 - psi0) * j) / n;
    pos.push(0, r0 * Math.cos(psi), r0 * Math.sin(psi), 0, r1 * Math.cos(psi), r1 * Math.sin(psi));
  }
  for (let j = 0; j < n; j++) {
    const a = j * 2;
    // (inner j, outer j, outer j+1) faces +x when psi grows
    if (facing > 0) idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
    else idx.push(a, a + 3, a + 1, a, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(
      new Array(pos.length / 3).fill(0).flatMap(() => [facing, 0, 0]),
      3,
    ),
  );
  g.setIndex(idx);
  return g;
}

/** A soft round glow, white in the middle (64², made once): the spot of light on the screen. */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,240,1)');
  grad.addColorStop(0.18, 'rgba(255,214,110,1)');
  grad.addColorStop(0.45, 'rgba(245,159,0,0.55)');
  grad.addColorStop(1, 'rgba(245,159,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const cyl = (r, h, seg = 24, open = false) => new THREE.CylinderGeometry(r, r, h, seg, 1, open);
const at = (geo, x, y, z) => geo.translate(x, y, z);

export function createApparatus() {
  const root = new THREE.Group();
  root.name = 'OpticalFibre';

  // ── materials: glass (core, clad), plastic, steel, black clamps, the source's anodised body ──
  const glass = (name, color, opacity, side) =>
    new THREE.MeshStandardMaterial({
      name,
      color,
      roughness: 0.06,
      metalness: 0,
      transparent: true,
      opacity,
      depthWrite: false,
      envMapIntensity: 1.6,
      side,
    });
  const mat = {
    coreFront: glass('Core', '#f3fbff', 0.2, THREE.FrontSide),
    coreBack: glass('CoreBack', '#e6f6ff', 0.16, THREE.BackSide),
    cladFront: glass('Clad', '#79c3ea', 0.3, THREE.FrontSide),
    cladBack: glass('CladBack', '#5fb0dc', 0.26, THREE.BackSide),
    coreFace: glass('CoreFace', '#fbfeff', 0.55, THREE.FrontSide),
    cladFace: glass('CladFace', '#8ccbee', 0.7, THREE.FrontSide),
    coating: new THREE.MeshStandardMaterial({ name: 'Coating', color: '#26303d', roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide }),
    steel: new THREE.MeshStandardMaterial({ name: 'Steel', color: '#c3cad2', roughness: 0.32, metalness: 0.85 }),
    black: new THREE.MeshStandardMaterial({ name: 'Clamp', color: '#1d2229', roughness: 0.5, metalness: 0.25 }),
    body: new THREE.MeshStandardMaterial({ name: 'SourceBody', color: '#34465c', roughness: 0.34, metalness: 0.65 }),
    screen: new THREE.MeshStandardMaterial({ name: 'Screen', color: '#f3efe4', roughness: 0.9, metalness: 0 }),
    lamp: new THREE.MeshBasicMaterial({ name: 'Aperture', color: '#3a2a10', toneMapped: false }),
  };

  // ── the fibre: core and clad as two glass tubes (back faces first, then front), the coating cut away near side ──
  const coreS = sweep(FIBRE.core, 0, Math.PI * 2, ROUND);
  const cladS = sweep(FIBRE.clad, 0, Math.PI * 2, ROUND);
  const coatS = sweep(FIBRE.jacket, CUT[1], CUT[0] + Math.PI * 2, 18);
  const fibre = new THREE.Group();
  fibre.name = 'Fibre';
  const mk = (geo, m, order, name) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.renderOrder = order;
    mesh.name = name;
    fibre.add(mesh);
    return mesh;
  };
  const coat = mk(coatS.geometry, mat.coating, 0, 'Coating');
  coat.castShadow = true;
  mk(cladS.geometry, mat.cladBack, 1, 'CladBack');
  mk(coreS.geometry, mat.coreBack, 2, 'CoreBack');
  mk(coreS.geometry, mat.coreFront, 3, 'Core');
  mk(cladS.geometry, mat.cladFront, 4, 'Clad');

  // the end faces: the core's disc, the clad's ring, the coating's ring (cut away as the coating is)
  function ends(facing) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(annulus(0, FIBRE.core, 0, Math.PI * 2, ROUND, facing), mat.coreFace);
    const clad = new THREE.Mesh(annulus(FIBRE.core, FIBRE.clad, 0, Math.PI * 2, ROUND, facing), mat.cladFace);
    const coatRing = new THREE.Mesh(annulus(FIBRE.clad, FIBRE.jacket, CUT[1], CUT[0] + Math.PI * 2, 18, facing), mat.coating);
    core.renderOrder = 5;
    clad.renderOrder = 5;
    g.add(coatRing, clad, core);
    return g;
  }
  const nearEnd = ends(-1);
  nearEnd.name = 'NearEnd';
  nearEnd.position.set(X0 - 0.002, Y0, 0);
  const farEnd = ends(1);
  farEnd.name = 'FarEnd';
  fibre.add(nearEnd, farEnd);
  root.add(fibre);

  // ── the near holder: a post, a boss, a ring clamp round the coating, and the hub the source turns about ──
  const nearX = X0 + NEAR_CLAMP;
  const ringGeo = (x) => {
    const ring = new THREE.TorusGeometry(FIBRE.jacket + 0.22, 0.24, 10, 36).rotateY(Math.PI / 2);
    return at(ring, x, 0, 0);
  };
  const steelNear = [at(cyl(0.45, Y0 - 1.2, 20), nearX, (Y0 - 1.2) / 2 + 0.6, POST_Z)];
  const blackNear = [
    at(cyl(3.2, 1.1, 36), nearX, 0.55, POST_Z), // the foot
    at(new THREE.BoxGeometry(2.6, 2.4, 2.4), nearX, Y0, POST_Z), // the boss
    at(new THREE.BoxGeometry(0.9, 0.7, -POST_Z - FIBRE.jacket - 0.4), nearX, Y0, (POST_Z - FIBRE.jacket - 0.2) / 2 - 0.05),
    at(ringGeo(nearX), 0, Y0, 0),
    at(cyl(0.95, 1.5, 28).rotateX(Math.PI / 2), X0, Y0, -3.4), // the hub, behind the near end face
    at(new THREE.BoxGeometry(NEAR_CLAMP + 0.6, 0.9, 0.9), X0 + NEAR_CLAMP / 2 - 0.2, Y0, -4.0), // the hub's arm to the boss
  ];
  const holderNear = new THREE.Group();
  holderNear.name = 'NearHolder';
  holderNear.add(new THREE.Mesh(mergeGeometries(steelNear), mat.steel), new THREE.Mesh(mergeGeometries(blackNear), mat.black));

  // ── the far holder: a tall rod on a foot; the slider (boss, ring clamp, the screen and its arm) moves with the bend ──
  const farX = X0 + FAR_CLAMP;
  const rodTop = Y0 + BEND_MAX + 5;
  const holderFar = new THREE.Group();
  holderFar.name = 'FarHolder';
  holderFar.add(
    new THREE.Mesh(at(cyl(0.45, rodTop, 20), farX, rodTop / 2, POST_Z), mat.steel),
    new THREE.Mesh(mergeGeometries([at(cyl(3.2, 1.1, 36), farX, 0.55, POST_Z), at(cyl(0.7, 0.6, 20), farX, rodTop + 0.3, POST_Z)]), mat.black),
  );
  const screenX = X0 + FIBRE.length + SCREEN_GAP;
  const slider = new THREE.Group();
  slider.name = 'Slider';
  const sliderBlack = [
    at(new THREE.BoxGeometry(2.6, 2.6, 2.6), farX, Y0, POST_Z),
    at(new THREE.BoxGeometry(0.9, 0.7, -POST_Z - FIBRE.jacket - 0.4), farX, Y0, (POST_Z - FIBRE.jacket - 0.2) / 2 - 0.05),
    at(ringGeo(farX), 0, Y0, 0),
    at(cyl(0.3, 1.4, 12).rotateX(Math.PI / 2), farX + 1.3, Y0 + 0.4, POST_Z - 1.6), // the thumb screw
    // the screen's arm, behind, and its frame
    at(new THREE.BoxGeometry(screenX - farX - 1.2, 0.8, 0.8), (farX + screenX) / 2 + 0.4, Y0 - 1.2, POST_Z),
    at(new THREE.BoxGeometry(0.7, SCREEN_HALF * 2 + 0.9, 0.7), screenX + 0.35, Y0, POST_Z + 0.35),
  ];
  slider.add(new THREE.Mesh(mergeGeometries(sliderBlack), mat.black));
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.3, SCREEN_HALF * 2, -POST_Z * 2 - 0.4), mat.screen);
  card.name = 'Screen';
  card.position.set(screenX + 0.15, Y0, 0);
  card.castShadow = true;
  slider.add(card);
  // the spot of light on the screen
  const spot = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateY(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      name: 'Spot',
      map: glowTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  spot.name = 'Spot';
  spot.userData.noExport = true;
  spot.renderOrder = 6;
  spot.visible = false;
  slider.add(spot);

  // ── the source: on a swing arm that turns about the near end face's centre (the group's origin) ──
  const source = new THREE.Group();
  source.name = 'Source';
  source.position.set(X0, Y0, 0);
  const back = -SOURCE_GAP - BODY;
  const bodyParts = [at(cyl(BODY_R, BODY - 1.4, 32).rotateZ(Math.PI / 2), back + 0.8 + (BODY - 1.4) / 2, 0, 0)];
  const steelParts = [
    at(cyl(BODY_R + 0.12, 0.7, 32).rotateZ(Math.PI / 2), -SOURCE_GAP - 0.35, 0, 0), // the front bezel
    at(cyl(BODY_R + 0.06, 0.8, 32).rotateZ(Math.PI / 2), back + 0.4, 0, 0), // the back cap
    at(cyl(0.3, 0.5, 14), back + 3, BODY_R + 0.2, 0), // the switch
  ];
  const armLen = SOURCE_GAP + 5.2;
  const blackParts = [
    at(new THREE.BoxGeometry(armLen, 0.8, 0.45), -armLen / 2, 0, -3.4), // the swing arm, behind the beam
    at(new THREE.BoxGeometry(1.6, 0.8, 2.4), -SOURCE_GAP - 4.6, 0, -2.3), // the bracket to the body
    at(new THREE.BoxGeometry(1.8, 0.45, 2.2), -SOURCE_GAP - 4.6, -BODY_R - 0.1, -0.6),
  ];
  const aperture = new THREE.Mesh(annulus(0, 0.42, 0, Math.PI * 2, 24, 1), mat.lamp);
  aperture.position.x = -SOURCE_GAP + 0.01;
  aperture.name = 'Aperture';
  const sBody = new THREE.Mesh(mergeGeometries(bodyParts), mat.body);
  const sSteel = new THREE.Mesh(mergeGeometries(steelParts), mat.steel);
  const sBlack = new THREE.Mesh(mergeGeometries(blackParts), mat.black);
  source.add(sBody, sSteel, sBlack, aperture);
  for (const m of [sBody, sSteel, sBlack, ...holderNear.children, ...holderFar.children, ...slider.children]) {
    if (m.name !== 'Spot') m.castShadow = true;
  }
  root.add(holderNear, holderFar, slider, source);

  // ── state ──
  const s = { h: Number.NaN, alpha: Number.NaN, on: false, spot: null, power: 0 };
  let line = centreLine(0);
  /** Bends the fibre: the far end raised by h (cm). Returns the centre line. */
  function setBend(h) {
    if (h === s.h) return line;
    s.h = h;
    line = centreLine(h);
    coreS.update(line);
    cladS.update(line);
    coatS.update(line);
    farEnd.position.set(X0 + FIBRE.length + 0.002, Y0 + h, 0);
    slider.position.y = h;
    return line;
  }
  /** Turns the source (degrees, + up). */
  function setTilt(alpha) {
    s.alpha = alpha;
    source.rotation.z = THREE.MathUtils.degToRad(alpha);
  }
  /** The light: the source's aperture lit or not; the spot on the screen (fibre coordinates) and its share of the light. */
  function setLight(on, spotAt, power) {
    s.on = on;
    mat.lamp.color.set(on ? '#ffd166' : '#3a2a10');
    const show = Boolean(on && spotAt && power > 0.004);
    spot.visible = show;
    if (show) {
      const k = Math.max(0.25, Math.min(1, Math.sqrt(power)));
      spot.position.set(screenX - 0.03, Y0 + spotAt.y - s.h, spotAt.z ?? 0);
      spot.scale.setScalar(2.6 * k + 0.8);
      spot.material.opacity = Math.min(1, 0.25 + power);
    }
  }
  setBend(0);
  setTilt(0);

  return {
    root,
    fibre,
    source,
    slider,
    card,
    nearEnd,
    farEnd,
    setBend,
    setTilt,
    setLight,
    get line() {
      return line;
    },
    POST_Z,
    farX,
    screenX,
  };
}
