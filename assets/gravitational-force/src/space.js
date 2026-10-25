// The space stops, in scene centimetres and not to scale (the figure says so): the Moon going round the Earth, the
// Earth going round the Sun, and the stars of a spiral galaxy going round its centre. Each pair pulls each other
// with equal pulls (two violet arrows of the same length, from the near sides of the two bodies along the line
// between their centres); a faint ring is the path. Orbits lie in the x–z plane, anticlockwise seen from above.
import * as THREE from 'three';
import { createArrow, createDashes, createDot, createRing } from './draw.js';
import { earthTexture, moonTexture, spotTexture, sunTexture } from './maps.js';
import { orbitPoint } from './physics.js';

/**
 * A body going round a heavier one: { kind: 'moon' } (the Moon round the Earth) or { kind: 'sun' } (the Earth round
 * the Sun). setAngle(φ) puts the moving body at φ on its circle; setFree(x, z) puts it anywhere (the "no pull" demo).
 */
export function createOrbit({ kind, renderer, earthMap }) {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const moon = kind === 'moon';
  const S = moon ? { r: 30, big: 6.5, small: 2.5, arrow: 8 } : { r: 32, big: 7.5, small: 3, arrow: 8 };
  const root = new THREE.Group();
  root.name = moon ? 'EarthAndMoon' : 'SunAndEarth';

  const map = earthMap ?? earthTexture(aniso);
  const earthMat = new THREE.MeshStandardMaterial({ name: 'Earth', map, roughness: 0.78, metalness: 0 });
  let big;
  let small;
  if (moon) {
    big = new THREE.Mesh(new THREE.SphereGeometry(S.big, 64, 40), earthMat);
    big.name = 'Earth';
    big.rotation.y = 0.6; // Asia towards the viewer
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

  const ring = createRing(S.r, 0.12);
  root.add(ring);
  const line = createDashes({ radius: 0.11, dash: 0.9, gap: 0.7, top: false, opacity: 0.85, name: 'Between' });
  root.add(line.mesh);
  const onSmall = createArrow({ radius: 0.32, head: 1.9, headRadius: 0.8, name: moon ? 'PullOnMoon' : 'PullOnEarth' });
  const onBig = createArrow({ radius: 0.32, head: 1.9, headRadius: 0.8, name: moon ? 'PullOnEarth' : 'PullOnSun' });
  root.add(onSmall.root, onBig.root);

  const c = new THREE.Vector3();
  const p = new THREE.Vector3();
  const d = new THREE.Vector3();
  const a = new THREE.Vector3();
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
    kind,
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
 * A spiral galaxy seen as a printed drawing: a few thousand dots (blue-grey in two trailing arms, warm in the
 * bulge), our Sun marked about half-way out with a ring, its pull towards the centre and a dashed line to the centre.
 * The whole disc turns (setAngle): stylised, real galaxies turn faster near the middle.
 */
export function createGalaxy() {
  const root = new THREE.Group();
  root.name = 'Galaxy';
  const disc = new THREE.Group();
  disc.name = 'GalaxyDisc';
  root.add(disc);
  const RG = 42;
  const SUN_R = 22; // about half-way out, as the Sun is (26 thousand of some 50 thousand light-years)
  let seed = 11;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  const N = 4400;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const cBulge = new THREE.Color('#e8590c');
  const cArm = new THREE.Color('#364fc7');
  const cDisc = new THREE.Color('#748ffc');
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
      tmp.copy(cBulge).lerp(new THREE.Color('#ffa94d'), rnd() * 0.7);
    } else if (i < N * 0.82) {
      // two trailing arms (logarithmic spirals), with scatter
      const arm = i % 2;
      const t = rnd();
      r = 5 + t * (RG - 5);
      th = arm * Math.PI + Math.log(r / 5) * 2.1 + gauss() * 0.24;
      r += gauss() * 1.1;
      y = gauss() * 0.7;
      tmp.copy(cArm).lerp(cDisc, rnd() * 0.6);
    } else {
      // a thin sprinkle all over the disc
      r = 6 + rnd() * (RG - 4);
      th = rnd() * Math.PI * 2;
      y = gauss() * 0.6;
      tmp.copy(cDisc).lerp(new THREE.Color('#adb5bd'), 0.5);
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
      size: 1.05,
      map: spotTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  stars.name = 'Stars';
  disc.add(stars);

  // our Sun: a bright yellow dot in a dark ring, on an arm
  const sunAt = new THREE.Vector3(SUN_R * Math.cos(2.1), 0, -SUN_R * Math.sin(2.1));
  const sun = new THREE.Group();
  sun.name = 'OurSun';
  sun.position.copy(sunAt);
  const sunBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 20, 14),
    new THREE.MeshStandardMaterial({ name: 'SunDot', color: '#fcc419', emissive: '#f59f00', emissiveIntensity: 0.6 }),
  );
  const mark = new THREE.Mesh(new THREE.TorusGeometry(2, 0.16, 8, 40), new THREE.MeshBasicMaterial({ color: '#1d2733', toneMapped: false }));
  mark.rotation.x = Math.PI / 2;
  mark.userData.noExport = true;
  sun.add(sunBall, mark);
  disc.add(sun);
  const centre = createDot(0.6, '#1d2733');
  root.add(centre);
  const line = createDashes({ radius: 0.13, dash: 1.1, gap: 0.8, top: false, opacity: 0.9, name: 'ToCentre' });
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
    SUN_R,
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
      lineMid: (out = new THREE.Vector3()) => disc.localToWorld(out.copy(sunAt).multiplyScalar(0.42)),
    },
  };
}
