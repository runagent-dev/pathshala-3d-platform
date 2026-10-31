// Around the house (not exported, not to scale with care): bare earth and lanes, brick boundary walls round the
// courtyard, the neighbours' two- to four-storey houses with balconies, washing and their own roof tanks, a far row
// of buildings in the haze, flame trees (krishnachura) in flower, coconut palms, an electric pole on the lane with its
// wires, clouds. Few greens on purpose: the picture's colour belongs to the house, the pumps and the water.
import * as THREE from 'three';
import { cable, parts, rod } from './build.js';
import { cementTexture, cloudTexture, earthTexture, facadeTexture, frondTexture, seeded, wallBrickTexture } from './textures.js';

const FACADES = ['#efe2c6', '#f2b9a1', '#d9dde3', '#c3d6ec', '#f4cf9e', '#ece6dc', '#d99a78', '#e8c9d6'];

export function createSurroundings() {
  const g = new THREE.Group();
  g.name = 'Surroundings';
  g.userData.noExport = true;
  const rand = seeded(41);

  // ── the ground: bare earth, a sandy lane on each side ──────────────────────
  const earth = earthTexture();
  earth.repeat.set(60, 60);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ map: earth, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.012;
  g.add(ground);
  const laneTex = cementTexture('#b8b0a2', 52);
  laneTex.repeat.set(1, 30);
  const laneMat = new THREE.MeshStandardMaterial({ map: laneTex, roughness: 0.95 });
  for (const x of [-10.6, 10.6]) {
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 120), laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(x, -0.006, -20);
    g.add(lane);
  }

  // ── boundary walls of exposed brick with a plastered coping ────────────────
  const bTex = wallBrickTexture();
  bTex.repeat.set(9.5 / 1.2, 1.5 / 1.2);
  const brickMat = new THREE.MeshStandardMaterial({ map: bTex, roughness: 0.9 });
  const coping = new THREE.MeshStandardMaterial({ color: '#d8d1c4', roughness: 0.9 });
  const walls = parts();
  const caps = parts();
  for (const x of [-8.2, 8.2]) {
    walls.add(new THREE.BoxGeometry(0.24, 1.5, 16.6), x, 0.75, 1.0);
    caps.add(new THREE.BoxGeometry(0.32, 0.07, 16.6), x, 1.53, 1.0);
    for (let z = -7; z <= 9; z += 2.4) caps.add(new THREE.BoxGeometry(0.34, 1.62, 0.34), x, 0.81, z); // piers
  }
  walls.add(new THREE.BoxGeometry(16.64, 1.5, 0.24), 0, 0.75, -7.4);
  caps.add(new THREE.BoxGeometry(16.7, 0.07, 0.32), 0, 1.53, -7.4);
  g.add(walls.mesh(brickMat, 'BoundaryWalls'), caps.mesh(coping, 'Coping'));

  // ── the neighbours' houses: near ones in detail, a far row in the haze ─────
  const roofMat = new THREE.MeshStandardMaterial({ map: cementTexture('#bfb8ab', 44), roughness: 0.95 });
  const tankBlack = new THREE.MeshStandardMaterial({ color: '#25282b', roughness: 0.5 });
  const tankWhite = new THREE.MeshStandardMaterial({ color: '#e9e4d6', roughness: 0.55 });
  const parapetP = parts();
  const tanksB = parts();
  const tanksW = parts();
  const slabs = parts();
  /** One building: a box with a façade of floors and bays, a parapet, water tanks and maybe a stair room on top. */
  function building(x, z, w, d, floors, color, seed) {
    const h = floors * 3;
    const tex = facadeTexture(color, seed);
    tex.repeat.set(Math.max(1, Math.round(w / 4)), floors);
    const wall = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [wall, wall, roofMat, wall, wall, wall]);
    b.position.set(x, h / 2, z);
    g.add(b);
    for (const [pw, pd, px, pz] of [
      [w, 0.15, 0, d / 2],
      [w, 0.15, 0, -d / 2],
      [0.15, d, w / 2, 0],
      [0.15, d, -w / 2, 0],
    ])
      parapetP.add(new THREE.BoxGeometry(pw, 0.9, pd), x + px, h + 0.45, z + pz);
    for (let f = 1; f < floors; f++) slabs.add(new THREE.BoxGeometry(w + 0.2, 0.12, d + 0.2), x, f * 3, z); // floor bands
    const nT = 1 + Math.floor(rand() * 2);
    for (let k = 0; k < nT; k++) {
      const tx = x + (rand() - 0.5) * w * 0.6;
      const tz = z + (rand() - 0.5) * d * 0.5;
      const target = rand() < 0.6 ? tanksB : tanksW;
      target.add(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 20), tx, h + 0.75, tz);
      target.add(new THREE.SphereGeometry(0.45, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), tx, h + 1.3, tz);
      slabs.add(new THREE.BoxGeometry(1.1, 0.2, 1.1), tx, h + 0.1, tz);
    }
    if (rand() < 0.5) {
      const sr = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), wall);
      sr.position.set(x + w * 0.3 * (rand() < 0.5 ? -1 : 1), h + 1.2, z - d * 0.2);
      g.add(sr);
    }
  }
  // behind the house: lower ones behind the tanks, taller to the sides
  building(-24, -27, 10, 9, 4, FACADES[3], 3);
  building(-13.5, -28, 9, 8, 3, FACADES[1], 5);
  building(-3.5, -32, 9, 8, 2, FACADES[0], 7);
  building(6.5, -32, 10, 8, 2, FACADES[5], 11);
  building(17, -27, 9, 9, 3, FACADES[4], 13);
  building(27.5, -28, 10, 9, 4, FACADES[2], 17);
  // across the lanes, beside the courtyard
  building(-17, -2, 8, 12, 3, FACADES[6], 19);
  building(19, 0, 8, 12, 2, FACADES[7], 23);
  building(-17, 13, 8, 10, 2, FACADES[2], 29);
  building(17.5, 13, 8, 10, 3, FACADES[0], 31);
  g.add(
    parapetP.mesh(new THREE.MeshStandardMaterial({ color: '#e2dbcd', roughness: 0.9 }), 'NeighbourParapets'),
    slabs.mesh(new THREE.MeshStandardMaterial({ color: '#d6d0c4', roughness: 0.9 }), 'NeighbourSlabs'),
    tanksB.mesh(tankBlack, 'NeighbourTanksBlack'),
    tanksW.mesh(tankWhite, 'NeighbourTanksWhite'),
  );
  // the far row, pale in the haze
  for (let i = 0; i < 11; i++) {
    const w = 8 + rand() * 7;
    const floors = 2 + Math.floor(rand() * 3);
    const h = floors * 3;
    const tex = facadeTexture(FACADES[i % FACADES.length], 50 + i);
    tex.repeat.set(Math.round(w / 4), floors);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    b.position.set(-70 + i * 14 + rand() * 4, h / 2, -52 - rand() * 12);
    g.add(b);
  }

  // ── flame trees in flower, a mango tree, coconut palms ─────────────────────
  const bark = new THREE.MeshStandardMaterial({ color: '#5b4636', roughness: 0.95 });
  const trunks = parts();
  const blossom = { '#e8461e': parts(), '#f2701f': parts(), '#c9341b': parts(), '#4f6b2c': parts(), '#3e5a2a': parts() };
  function flameTree(x, z, s, seed) {
    const r = seeded(seed);
    trunks.push(rod(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, 2.4 * s, z), 0.22 * s, 10));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + r();
      trunks.push(
        rod(new THREE.Vector3(x, 2.2 * s, z), new THREE.Vector3(x + Math.cos(a) * 2.2 * s, 3.9 * s, z + Math.sin(a) * 1.6 * s), 0.1 * s, 8),
      );
    }
    // a wide umbrella of blossom, a little foliage under it
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 3.2 * s;
      const y = 3.9 * s + (1 - d / (3.2 * s)) * 1.2 * s + (r() - 0.5) * 0.6 * s;
      const keys = ['#e8461e', '#f2701f', '#c9341b', '#e8461e', '#4f6b2c'];
      const key = keys[Math.floor(r() * keys.length)];
      blossom[key].add(
        new THREE.IcosahedronGeometry((0.55 + r() * 0.45) * s, 1),
        x + Math.cos(a) * d,
        y,
        z + Math.sin(a) * d * 0.8,
        r(),
        r(),
        0,
        new THREE.Vector3(1, 0.7, 1),
      );
    }
  }
  flameTree(-13, -15, 1, 3);
  flameTree(14.5, -16, 0.95, 9);
  flameTree(-21, 6, 0.9, 15);
  // a mango tree, dark and round, off to the left
  trunks.push(rod(new THREE.Vector3(-29, 0, -14), new THREE.Vector3(-29, 3, -14), 0.3, 8));
  for (let i = 0; i < 18; i++)
    blossom['#3e5a2a'].add(
      new THREE.IcosahedronGeometry(1.1 + rand() * 0.6, 1),
      -29 + (rand() - 0.5) * 4,
      4 + rand() * 2.2,
      -14 + (rand() - 0.5) * 3,
    );
  g.add(trunks.mesh(bark, 'TreeTrunks'));
  for (const [c, p] of Object.entries(blossom))
    g.add(p.mesh(new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true }), `Canopy_${c}`));

  const trunkTexMat = new THREE.MeshStandardMaterial({ color: '#8a6c4a', roughness: 0.95 });
  const frondMats = [0, 1].map(
    (dry) => new THREE.MeshStandardMaterial({ map: frondTexture(dry), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.75 }),
  );
  const nutMat = new THREE.MeshStandardMaterial({ color: '#7a6a2a', roughness: 0.6 });
  function palm(x, z, height, lean, seed) {
    const p = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(lean * 0.25, height * 0.35, 0),
      new THREE.Vector3(lean * 0.7, height * 0.7, 0.1),
      new THREE.Vector3(lean, height, 0.15),
    ]);
    p.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.13, 10), trunkTexMat));
    const top = curve.getPoint(1);
    const r = seeded(seed);
    const fronds = [parts(), parts()];
    for (let i = 0; i < 12; i++) {
      const len = 2.2 + r() * 0.8;
      const geo = new THREE.PlaneGeometry(len, 0.55, 12, 1);
      const pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const u = (pos.getX(k) + len / 2) / len;
        pos.setX(k, u * len);
        pos.setZ(k, -u * u * 0.9 * len * 0.5);
      }
      geo.computeVertexNormals();
      const dry = i % 4 === 3 ? 1 : 0;
      geo.rotateX(-Math.PI / 2 + 0.25 + r() * 0.3 + dry * 0.5);
      geo.rotateY((i / 12) * Math.PI * 2 + r() * 0.3);
      geo.translate(top.x, top.y, top.z);
      fronds[dry].push(geo);
    }
    p.add(fronds[0].mesh(frondMats[0], 'Fronds'), fronds[1].mesh(frondMats[1], 'DryFronds'));
    const nuts = parts();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      nuts.add(new THREE.SphereGeometry(0.11, 12, 10), top.x + Math.cos(a) * 0.16, top.y - 0.16, top.z + Math.sin(a) * 0.16);
    }
    p.add(nuts.mesh(nutMat, 'Coconuts'));
    p.position.set(x, 0, z);
    return p;
  }
  g.add(palm(-7.75, 1.9, 7.2, 0.9, 31), palm(9.6, -2.5, 8.4, -0.7, 37), palm(-10.4, -12, 9, 0.5, 43));

  // ── the electric pole on the right lane and its wires ──────────────────────
  const poleMat = new THREE.MeshStandardMaterial({ color: '#a7a39b', roughness: 0.9 });
  const poles = parts();
  const insul = parts();
  const wires = parts();
  const poleZ = [-14, -1.2, 11.6];
  for (const z of poleZ) {
    poles.add(new THREE.BoxGeometry(0.22, 8.4, 0.22), 11.2, 4.2, z);
    poles.add(new THREE.BoxGeometry(1.4, 0.1, 0.1), 11.2, 7.6, z);
    for (const dx of [-0.6, 0, 0.6]) insul.add(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 8), 11.2 + dx, 7.72, z);
  }
  for (let i = 0; i < poleZ.length - 1; i++)
    for (const dx of [-0.6, 0, 0.6]) {
      const a = new THREE.Vector3(11.2 + dx, 7.78, poleZ[i]);
      const b = new THREE.Vector3(11.2 + dx, 7.78, poleZ[i + 1]);
      wires.push(
        cable(
          [
            a,
            a
              .clone()
              .lerp(b, 0.5)
              .add(new THREE.Vector3(0, -0.5, 0)),
            b,
          ],
          0.012,
        ),
      );
    }
  const transformer = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.9, 0.5),
    new THREE.MeshStandardMaterial({ color: '#7d8790', metalness: 0.4, roughness: 0.5 }),
  );
  transformer.position.set(11.2, 5.8, -14.4);
  g.add(poles.mesh(poleMat, 'Poles'), insul.mesh(new THREE.MeshStandardMaterial({ color: '#8a5a3c', roughness: 0.4 }), 'Insulators'));
  g.add(wires.mesh(new THREE.MeshStandardMaterial({ color: '#202224', roughness: 0.6 }), 'Wires'), transformer);

  // ── clouds ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < 7; i++) {
    const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(50 + i), transparent: true, depthWrite: false, fog: false }));
    cl.scale.set(18 + rand() * 10, 8 + rand() * 3, 1);
    cl.position.set(-60 + i * 20 + rand() * 8, 17 + rand() * 10, -75);
    g.add(cl);
  }
  return g;
}
