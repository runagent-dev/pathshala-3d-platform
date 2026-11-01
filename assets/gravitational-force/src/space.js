// The space stops, in scene centimetres and not to scale (the figure says so): the Moon going round the Earth, the
// Earth going round the Sun, and the stars of a spiral galaxy going round its centre. Each pair pulls each other
// with equal pulls (two violet arrows of the same length, from the near sides of the two bodies along the line
// between their centres); a faint ring is the path. Orbits lie in the x–z plane, anticlockwise seen from above.
// With its pull taken away, the moving body leaves a dashed straight path, ending in an arrowhead where it left the
// picture. The Earth is tilted so that its middle latitudes (and Asia), not the white Arctic, face the camera above.
// They happen in a night sky (./setting.js): the drawing is in light inks (a pale path, light dashes in a dark rim, a
// white straight path), the arrows violet inside a white outline.
import * as THREE from 'three';
import { createArrow, createDashes, createDot, createRing, ink } from './draw.js';
import { earthTexture, moonTexture, spotTexture, sunTexture } from './maps.js';
import { orbitPoint } from './physics.js';
import { createHalo } from './setting.js';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * A body going round a heavier one: { kind: 'moon' } (the Moon round the Earth) or { kind: 'sun' } (the Earth round
 * the Sun). setAngle(φ) puts the moving body at φ on its circle; setFree(x, z) puts it anywhere (the "no pull" demo).
 */
export function createOrbit({ kind, renderer, earthMap }) {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const moon = kind === 'moon';
  const S = moon ? { r: 30, big: 8, small: 3, arrow: 8 } : { r: 32, big: 8.5, small: 4, arrow: 8 };
  // longitude 90° E (Bangladesh's) turned to the front, then about 25° N tipped up towards the camera above
  const tilt = (mesh) => mesh.rotation.set(-1.13, Math.PI, 0);
  const root = new THREE.Group();
  root.name = moon ? 'EarthAndMoon' : 'SunAndEarth';

  const map = earthMap ?? earthTexture(aniso);
  const earthMat = new THREE.MeshStandardMaterial({ name: 'Earth', map, roughness: 0.78, metalness: 0 });
  let big;
  let small;
  if (moon) {
    big = new THREE.Mesh(new THREE.SphereGeometry(S.big, 64, 40), earthMat);
    big.name = 'Earth';
    tilt(big);
    root.add(createHalo(S.big));
    small = new THREE.Mesh(
      new THREE.SphereGeometry(S.small, 40, 28),
      new THREE.MeshStandardMaterial({ name: 'Moon', map: moonTexture(aniso), roughness: 0.95 }),
    );
    small.name = 'Moon';
  } else {
    big = new THREE.Mesh(
      new THREE.SphereGeometry(S.big, 64, 40),
      new THREE.MeshStandardMaterial({
        name: 'Sun',
        map: sunTexture(aniso),
        emissive: '#ffb100',
        emissiveMap: sunTexture(aniso),
        emissiveIntensity: 0.9,
      }),
    );
    big.name = 'Sun';
    small = new THREE.Mesh(new THREE.SphereGeometry(S.small, 48, 32), earthMat);
    small.name = 'Earth';
    tilt(small);
    small.add(createHalo(S.small)); // turns with the Earth: a sphere round its centre looks the same
    // a soft yellow glow round the Sun (a drawing, not exported)
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: spotTexture(), color: '#ffd43b', transparent: true, opacity: 0.55, depthWrite: false }),
    );
    glow.scale.setScalar(S.big * 3.4);
    glow.userData.noExport = true;
    glow.renderOrder = 1;
    root.add(glow);
  }
  root.add(big, small);

  const ring = createRing(S.r, 0.3, '#b8c7e6', 0.55);
  root.add(ring);
  // the straight path without the pull (drawn thick: it is seen from further away), and its arrowhead, white on the sky
  const trail = createDashes({ radius: 0.42, dash: 2.4, gap: 1.6, color: '#ffffff', top: false, max: 60, name: 'StraightPath' });
  const trailHead = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4, 18).translate(0, 2, 0), ink('#ffffff', { top: false }));
  trailHead.userData.noExport = true;
  trail.mesh.visible = trailHead.visible = false;
  root.add(trail.mesh, trailHead);
  const line = createDashes({ radius: 0.11, dash: 0.9, gap: 0.7, color: '#e9eef8', rim: '#1d2733', top: false, name: 'Between' });
  root.add(line.mesh);
  const onSmall = createArrow({ radius: 0.32, head: 1.9, headRadius: 0.8, name: moon ? 'PullOnMoon' : 'PullOnEarth' });
  const onBig = createArrow({ radius: 0.32, head: 1.9, headRadius: 0.8, name: moon ? 'PullOnEarth' : 'PullOnSun' });
  root.add(onSmall.root, onBig.root);

  const c = new THREE.Vector3();
  const p = new THREE.Vector3();
  const d = new THREE.Vector3();
  const a = new THREE.Vector3();
  const ta = new THREE.Vector3();
  const tb = new THREE.Vector3();
  const tdir = new THREE.Vector3();
  let pulls = true;
  /** The moving body at (x, z); the arrows point along the line between the two centres. */
  function setFree(x, z) {
    small.position.set(x, 0, z);
    d.subVectors(c, small.position).normalize(); // from the small body towards the big one
    onSmall.set(a.copy(small.position).addScaledVector(d, S.small), d, S.arrow);
    onBig.set(a.copy(c).addScaledVector(d, -S.big), p.copy(d).negate(), S.arrow);
    line.set(c, small.position);
    onSmall.root.visible = onBig.root.visible = pulls;
  }
  return {
    root,
    big,
    small,
    ring,
    line,
    S,
    setAngle(phi) {
      const q = orbitPoint(S.r, phi);
      setFree(q.x, q.z);
    },
    setFree,
    setPulls(on) {
      pulls = on;
      onSmall.root.visible = onBig.root.visible = on;
    },
    /** Hide the drawing (the dashed line), for a test question. */
    setLine(on) {
      line.mesh.visible = on;
    },
    /** The straight path from `from` to `to` (local x–z points), with an arrowhead at `to` if `head`; null hides it. */
    setTrail(from, to, head = false) {
      trail.mesh.visible = Boolean(from);
      trailHead.visible = Boolean(from) && head;
      if (!from) return;
      ta.set(from.x, 0, from.z);
      tb.set(to.x, 0, to.z);
      tdir.subVectors(tb, ta).normalize();
      trailHead.position.copy(tb).addScaledVector(tdir, -2.5);
      trailHead.quaternion.setFromUnitVectors(UP, tdir);
      trail.set(ta, tb.addScaledVector(tdir, head ? -1.5 : 0));
    },
    points: {
      big: (out = new THREE.Vector3()) => big.getWorldPosition(out),
      small: (out = new THREE.Vector3()) => small.getWorldPosition(out),
      /** The middle of the small body's arrow, where its label goes beside. */
      arrowMid: (out = new THREE.Vector3()) => {
        out.subVectors(c, small.position).normalize();
        return root.localToWorld(out.multiplyScalar(S.small + S.arrow * 0.5).add(small.position));
      },
    },
  };
}

/**
 * A spiral galaxy in the night sky: a few thousand glowing dots (pale blue in two trailing arms, warm in the bulge,
 * with a soft glow in the middle), our Sun marked about half-way out with a white ring, its pull towards the centre
 * and a dashed line to the centre. The whole disc turns (setAngle): stylised, real galaxies turn faster near the
 * middle.
 */
export function createGalaxy() {
  const root = new THREE.Group();
  root.name = 'Galaxy';
  const disc = new THREE.Group();
  disc.name = 'GalaxyDisc';
  root.add(disc);
  const RG = 42;
  const SUN_R = 22; // about half-way out, as the Sun is (26 thousand of some 50 thousand light-years)
  const armAngle = (arm, r) => arm * Math.PI - Math.log(r / 5) * 2.1;
  let seed = 11;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  const N = 6000;
  const spot = spotTexture();
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const cBulge = new THREE.Color('#ff9f4a');
  const cBulge2 = new THREE.Color('#ffe2b0');
  const cArm = new THREE.Color('#6f9bff');
  const cDisc = new THREE.Color('#c4d4ff');
  const cDust = new THREE.Color('#7f8fb5');
  const tmp = new THREE.Color();
  for (let i = 0; i < N; i++) {
    let r;
    let th;
    let y;
    if (i < N * 0.22) {
      // the bulge: a dense round middle
      r = Math.abs(gauss()) * 7.5;
      th = rnd() * Math.PI * 2;
      y = gauss() * 2.2 * (1 - r / 9);
      tmp.copy(cBulge).lerp(cBulge2, rnd() * 0.8);
    } else if (i < N * 0.82) {
      // two arms (logarithmic spirals) that trail behind the turning disc: they wind clockwise outwards while the
      // disc turns anticlockwise, as real spiral arms do; with scatter
      const arm = i % 2;
      const t = rnd();
      r = 5 + t * (RG - 5);
      th = armAngle(arm, r) + gauss() * 0.24;
      r += gauss() * 1.1;
      y = gauss() * 0.7;
      tmp.copy(cArm).lerp(cDisc, rnd() * 0.6);
    } else {
      // a thin sprinkle all over the disc
      r = 6 + rnd() * (RG - 4);
      th = rnd() * Math.PI * 2;
      y = gauss() * 0.6;
      tmp.copy(cDust).lerp(cDisc, rnd() * 0.4);
    }
    pos[i * 3] = r * Math.cos(th);
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = -r * Math.sin(th);
    col[i * 3] = tmp.r;
    col[i * 3 + 1] = tmp.g;
    col[i * 3 + 2] = tmp.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const stars = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 1.5,
      map: spot,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
  stars.name = 'Stars';
  disc.add(stars);
  // the bulge's soft glow (a drawing, not exported)
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: spot, color: '#ffb46b', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  glow.scale.setScalar(26);
  glow.renderOrder = 1;
  root.add(glow);

  // our Sun: a bright yellow dot in a dark ring, on an arm
  const sunTh = armAngle(1, SUN_R) + 0.12;
  const sunAt = new THREE.Vector3(SUN_R * Math.cos(sunTh), 0, -SUN_R * Math.sin(sunTh));
  const sun = new THREE.Group();
  sun.name = 'OurSun';
  sun.position.copy(sunAt);
  const sunBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 20, 14),
    new THREE.MeshStandardMaterial({ name: 'SunDot', color: '#fcc419', emissive: '#f59f00', emissiveIntensity: 0.6 }),
  );
  const mark = new THREE.Mesh(new THREE.TorusGeometry(2, 0.2, 8, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
  mark.rotation.x = Math.PI / 2;
  mark.userData.noExport = true;
  sun.add(sunBall, mark);
  disc.add(sun);
  const centre = createDot(0.6, '#1d2733');
  root.add(centre);
  const line = createDashes({ radius: 0.13, dash: 1.1, gap: 0.8, color: '#e9eef8', rim: '#1d2733', top: false, name: 'ToCentre' });
  disc.add(line.mesh);
  const arrow = createArrow({ radius: 0.34, head: 2, headRadius: 0.85, name: 'PullOnSun' });
  disc.add(arrow.root);
  const toward = sunAt.clone().negate().normalize();
  arrow.set(sunAt.clone().addScaledVector(toward, 2.2), toward, 7.5);
  line.set(sunAt.clone().addScaledVector(toward, 2.2), new THREE.Vector3());

  return {
    root,
    disc,
    sun,
    RG,
    arrow,
    line,
    setAngle(deg) {
      disc.rotation.y = (deg * Math.PI) / 180;
    },
    setPulls(on) {
      arrow.root.visible = on;
    },
    points: {
      sun: (out = new THREE.Vector3()) => sun.getWorldPosition(out),
      centre: (out = new THREE.Vector3()) => root.getWorldPosition(out),
      arrowMid: (out = new THREE.Vector3()) => disc.localToWorld(out.copy(sunAt).addScaledVector(toward, 2.2 + 3.75)),
    },
  };
}
