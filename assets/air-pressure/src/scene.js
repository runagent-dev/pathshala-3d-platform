// The world around the box, in metres: a school yard paved with red bricks at golden hour, the school's ochre wall
// with green shutters, a flame tree (কৃষ্ণচূড়া) in bloom, pots of marigolds, the wooden lab table (its top is y = 0),
// the air column standing on a 1 m × 1 m square of the yard, an elephant beside it for the book's comparison, and a
// student standing in the yard (for "why we don't feel it"). Everything procedural and modest in triangles.
import * as THREE from 'three';

export const GROUND = -0.76; // the yard, below the table's top
export const COLUMN_AT = new THREE.Vector3(-2.7, GROUND, -1.5);
export const COLUMN_H = 7; // drawn this tall, fading out (the real column is many kilometres high)
export const ELEPHANT_AT = new THREE.Vector3(-6.3, GROUND, -2.4);
export const PERSON_AT = new THREE.Vector3(2.8, GROUND, 0.55);
export const PERSON_H = 1.56;

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });

function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 8;
  return t;
}

// a little deterministic randomness
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Red bricks in a running bond, with pale mortar. One tile of the pattern; repeated over the yard. */
function brickTexture() {
  return canvasTex(
    512,
    512,
    (g) => {
      const r = rng(7);
      g.fillStyle = '#d9c3a5';
      g.fillRect(0, 0, 512, 512);
      const bw = 64;
      const bh = 32;
      const tones = ['#b5482c', '#c4552f', '#a83f27', '#cf6236', '#b84f33', '#9e3a24'];
      for (let row = -2; row < 18; row++)
        for (let col = -2; col < 10; col++) {
          const x0 = col * bw + (row % 2) * 32;
          const y0 = row * bh;
          const w = bw - 4;
          const h = bh - 4;
          g.fillStyle = tones[Math.floor(r() * tones.length)];
          g.fillRect(x0 + 2, y0 + 2, w, h);
          g.fillStyle = `rgba(255,220,180,${0.05 + r() * 0.08})`;
          g.fillRect(x0 + 4, y0 + 4, w - 6, 5);
          g.fillStyle = `rgba(40,10,0,${0.05 + r() * 0.1})`;
          g.fillRect(x0 + 2, y0 + h - 3, w, 4);
        }
    },
    { repeat: [10, 10] },
  );
}

/** The sky behind everything: deep blue high up, warm gold at the horizon (screen space). */
export function skyTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#1d5fd6');
    s.addColorStop(0.38, '#4f95ec');
    s.addColorStop(0.66, '#a9cff5');
    s.addColorStop(0.84, '#ffd9a8');
    s.addColorStop(1, '#ffc27a');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/** Space, for "what if there were no air": deep blue-black with stars (still a picture, never flat black). */
export function spaceTexture() {
  return canvasTex(512, 512, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 512);
    s.addColorStop(0, '#060b24');
    s.addColorStop(0.7, '#0d1b4a');
    s.addColorStop(1, '#1b3a7a');
    g.fillStyle = s;
    g.fillRect(0, 0, 512, 512);
    const r = rng(11);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.65})`;
      const d = r() < 0.08 ? 2.4 : 1.2;
      g.fillRect(r() * 512, r() * 512, d, d);
    }
  });
}

function windowGlass() {
  return canvasTex(64, 128, (g) => {
    const s = g.createLinearGradient(0, 0, 64, 128);
    s.addColorStop(0, '#bfe0ff');
    s.addColorStop(0.5, '#5d9fe0');
    s.addColorStop(1, '#2a5f9e');
    g.fillStyle = s;
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.beginPath();
    g.moveTo(8, 0);
    g.lineTo(26, 0);
    g.lineTo(4, 60);
    g.lineTo(-14, 60);
    g.fill();
  });
}

/** The wooden lab table: a warm oiled top with a darker edge, four legs to the yard. */
function createTable() {
  const g = new THREE.Group();
  g.name = 'Table';
  const grain = canvasTex(
    512,
    256,
    (c) => {
      const r = rng(3);
      c.fillStyle = '#9c5a2c';
      c.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 90; i++) {
        c.strokeStyle = `rgba(${60 + r() * 40},${25 + r() * 20},10,${0.12 + r() * 0.2})`;
        c.lineWidth = 1 + r() * 3;
        const y = r() * 256;
        c.beginPath();
        c.moveTo(0, y);
        c.bezierCurveTo(170, y + (r() - 0.5) * 22, 340, y + (r() - 0.5) * 22, 512, y + (r() - 0.5) * 10);
        c.stroke();
      }
      c.fillStyle = 'rgba(255,200,140,0.08)';
      c.fillRect(0, 0, 512, 256);
    },
    { repeat: [1, 1] },
  );
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.045, 0.72), std('#ffffff', { map: grain, roughness: 0.48 }));
  top.position.set(-0.05, -0.0225, -0.02);
  top.receiveShadow = true;
  top.castShadow = true;
  g.add(top);
  const legMat = std('#6b3a1c', { roughness: 0.6 });
  for (const x of [-0.66, 0.56])
    for (const z of [-0.33, 0.29]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, -GROUND - 0.045, 0.05), legMat);
      leg.position.set(x, (GROUND - 0.045) / 2, z);
      leg.castShadow = true;
      g.add(leg);
    }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 0.62), legMat);
  rail.position.set(-0.05, -0.08, -0.02);
  g.add(rail);
  return g;
}

/** The school's wall: warm ochre with a terracotta plinth, tall windows with open green shutters, a blue door. */
function createBuilding() {
  const g = new THREE.Group();
  g.name = 'SchoolWall';
  const z = -5.6;
  const h = 3.4;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(30, h, 0.3), std('#f0b44c', { roughness: 0.92 }));
  wall.position.set(0, GROUND + h / 2, z);
  wall.receiveShadow = true;
  g.add(wall);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(30, 0.55, 0.36), std('#b5532f'));
  plinth.position.set(0, GROUND + 0.275, z + 0.04);
  g.add(plinth);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(30, 0.22, 0.5), std('#fbe3b4'));
  cornice.position.set(0, GROUND + h - 0.1, z + 0.1);
  g.add(cornice);
  const glass = std('#ffffff', { map: windowGlass(), roughness: 0.15, metalness: 0.3 });
  const frame = std('#fff6e6');
  const shutter = std('#2f9e6e', { roughness: 0.7 });
  for (let i = -6; i <= 6; i++) {
    const x = i * 2.1 + 0.4;
    if (Math.abs(x - 0.4) < 0.5) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.3, 0.08), std('#2459b8', { roughness: 0.55 }));
      door.position.set(x, GROUND + 1.15, z + 0.17);
      g.add(door);
      continue;
    }
    const y = GROUND + 1.75;
    const f = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.6, 0.06), frame);
    f.position.set(x, y, z + 0.16);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.44), glass);
    gl.position.set(x, y, z + 0.195);
    g.add(f, gl);
    for (const s of [-1, 1]) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.56, 0.04), shutter);
      sh.position.set(x + s * 0.74, y, z + 0.3);
      sh.rotation.y = s * 0.45;
      g.add(sh);
    }
  }
  return g;
}

/** A flame tree in bloom: a brown trunk and branches, a crown of green leaf clumps and red-orange flower clumps. */
function createFlameTree(at) {
  const g = new THREE.Group();
  g.name = 'FlameTree';
  g.position.copy(at);
  const bark = std('#5c3a24', { roughness: 0.95 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 2.6, 12), bark);
  trunk.position.y = 1.3;
  trunk.castShadow = true;
  g.add(trunk);
  for (const [rx, rz, len] of [
    [0.8, 0.2, 1.6],
    [-0.9, -0.3, 1.5],
    [0.2, 0.9, 1.3],
  ]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, len, 8).translate(0, len / 2, 0), bark);
    b.position.y = 2.3;
    b.rotation.set(rz, 0, -rx);
    g.add(b);
  }
  const r = rng(5);
  const blob = new THREE.IcosahedronGeometry(1, 1);
  const leaves = new THREE.InstancedMesh(blob, std('#3f8f3a', { roughness: 0.9, flatShading: true }), 46);
  const flowers = new THREE.InstancedMesh(blob, std('#f0471f', { roughness: 0.75, flatShading: true }), 70);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const place = (mesh, n, size, lift) => {
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * 2.0;
      p.set(Math.cos(a) * rad, 3.3 + lift + (r() - 0.4) * 0.9 - rad * 0.18, Math.sin(a) * rad * 0.8);
      q.setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3));
      const k = size * (0.7 + r() * 0.6);
      s.set(k, k * 0.75, k);
      mesh.setMatrixAt(i, m.compose(p, q, s));
    }
  };
  place(leaves, 46, 0.55, 0);
  place(flowers, 70, 0.36, 0.25);
  leaves.castShadow = flowers.castShadow = true;
  g.add(leaves, flowers);
  return g;
}

/** Clay pots of marigolds along the wall. */
function createPots() {
  const g = new THREE.Group();
  g.name = 'Marigolds';
  const clay = std('#b85a32');
  const leaf = std('#3a8a3c', { flatShading: true });
  const bloom = std('#ff9f1a', { roughness: 0.7, flatShading: true });
  const r = rng(9);
  for (const x of [-5.2, -4.1, 1.6, 3.4, 6.2, 7.3]) {
    const pot = new THREE.Group();
    pot.position.set(x, GROUND, -5.1);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.4, 16), clay);
    body.position.y = 0.2;
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), leaf);
    bush.position.y = 0.55;
    bush.scale.set(1, 0.7, 1);
    pot.add(body, bush);
    for (let i = 0; i < 9; i++) {
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 0), bloom);
      const a = r() * Math.PI * 2;
      f.position.set(Math.cos(a) * 0.2, 0.62 + r() * 0.12, Math.sin(a) * 0.2);
      pot.add(f);
    }
    g.add(pot);
  }
  return g;
}

/**
 * The air column (চিত্র ৫.০৬): a see-through pale blue 1 m × 1 m box standing on a teal square of the yard, fading out
 * upward, with faint specks of air (fewer higher up), and its four edges drawn.
 */
function createColumn() {
  const g = new THREE.Group();
  g.name = 'AirColumn';
  g.position.copy(COLUMN_AT);
  const fadeUp = canvasTex(
    4,
    256,
    (c) => {
      const s = c.createLinearGradient(0, 0, 0, 256);
      s.addColorStop(0, '#000000');
      s.addColorStop(0.45, '#4a4a4a');
      s.addColorStop(1, '#ffffff');
      c.fillStyle = s;
      c.fillRect(0, 0, 4, 256);
    },
    { srgb: false },
  );
  const side = new THREE.MeshStandardMaterial({
    color: '#8fd0ff',
    emissive: '#3d8fd6',
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: 0.5,
    alphaMap: fadeUp,
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 0.2,
  });
  const none = new THREE.MeshBasicMaterial({ visible: false });
  const box = new THREE.Mesh(new THREE.BoxGeometry(1, COLUMN_H, 1), [side, side, none, none, side, side]);
  box.position.y = COLUMN_H / 2;
  box.renderOrder = 3;
  g.add(box);
  const edgeMat = new THREE.MeshBasicMaterial({ color: '#1c6fd9', transparent: true, alphaMap: fadeUp, depthWrite: false, toneMapped: false });
  for (const x of [-0.5, 0.5])
    for (const z of [-0.5, 0.5]) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.025, COLUMN_H, 0.025), edgeMat);
      e.position.set(x, COLUMN_H / 2, z);
      e.renderOrder = 4;
      g.add(e);
    }
  // the 1 m² on the ground: a teal fill in a white painted outline
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#0c8599', transparent: true, opacity: 0.45, depthWrite: false, toneMapped: false }),
  );
  fill.position.y = 0.004;
  g.add(fill);
  const paint = std('#ffffff', { roughness: 0.6 });
  for (const [x, z, w, d] of [
    [0, 0.5, 1.05, 0.05],
    [0, -0.5, 1.05, 0.05],
    [0.5, 0, 0.05, 1.05],
    [-0.5, 0, 0.05, 1.05],
  ]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(w, 0.008, d), paint);
    line.position.set(x, 0.004, z);
    line.receiveShadow = true;
    g.add(line);
  }
  // specks of air, thinner higher up
  const r = rng(13);
  const n = 150;
  const specks = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.018, 6, 4),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.75, depthWrite: false }),
    n,
  );
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const y = -Math.log(1 - r() * 0.93) * 1.6; // more near the ground
    m.makeTranslation((r() - 0.5) * 0.9, Math.min(COLUMN_H - 0.2, y + 0.05), (r() - 0.5) * 0.9);
    specks.setMatrixAt(i, m);
  }
  specks.renderOrder = 4;
  g.add(specks);
  return g;
}

/** An elephant (grey, wrinkled matt skin), standing on the yard facing the column. About 2.8 m to the top of its back. */
function createElephant() {
  const g = new THREE.Group();
  g.name = 'Elephant';
  g.position.copy(ELEPHANT_AT);
  g.rotation.y = Math.PI + 0.4; // the head (its −x) toward the column
  const skin = std('#8e8a88', { roughness: 0.95 });
  const dark = std('#6f6a68', { roughness: 0.95 });
  const ivory = std('#f3ead2', { roughness: 0.4 });
  const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  const sph = new THREE.SphereGeometry(1, 28, 18);
  add(sph, skin, 0, 1.75, 0, 1.45, 0.98, 0.92); // body
  add(sph, skin, -0.55, 2.25, 0, 0.75, 0.55, 0.7); // shoulders
  for (const [x, z] of [
    [-0.85, 0.5],
    [-0.85, -0.5],
    [0.85, 0.5],
    [0.85, -0.5],
  ]) {
    add(new THREE.CylinderGeometry(0.3, 0.33, 1.3, 16), skin, x, 0.65, z);
    add(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 16), dark, x, 0.04, z);
  }
  add(sph, skin, -1.55, 2.25, 0, 0.62, 0.66, 0.6); // head
  add(sph, skin, -1.62, 2.75, 0, 0.42, 0.25, 0.42); // the domed top of the head
  for (const s of [-1, 1]) {
    const ear = add(sph, dark, -1.2, 2.25, s * 0.55, 0.1, 0.62, 0.55);
    ear.rotation.y = s * 0.5;
    add(new THREE.SphereGeometry(0.06, 10, 8), std('#1a1a1a', { roughness: 0.3 }), -1.98, 2.38, s * 0.33); // eyes
    const tusk = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.9, 1.95, s * 0.22),
          new THREE.Vector3(-2.25, 1.75, s * 0.28),
          new THREE.Vector3(-2.45, 1.9, s * 0.3),
        ]),
        12,
        0.05,
        8,
      ),
      ivory,
    );
    tusk.castShadow = true;
    g.add(tusk);
  }
  const trunk = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.05, 2.1, 0),
        new THREE.Vector3(-2.3, 1.6, 0),
        new THREE.Vector3(-2.35, 1.0, 0),
        new THREE.Vector3(-2.3, 0.55, 0),
        new THREE.Vector3(-2.45, 0.35, 0),
      ]),
      30,
      0.15,
      14,
    ),
    skin,
  );
  trunk.castShadow = true;
  g.add(trunk);
  const tail = add(new THREE.CylinderGeometry(0.03, 0.05, 0.9, 8), dark, 1.5, 1.5, 0);
  tail.rotation.z = -0.35;
  return g;
}

/** A student in school uniform (white shirt, navy trousers), standing with the arms a little out from the sides. */
function createPerson() {
  const g = new THREE.Group();
  g.name = 'Student';
  g.position.copy(PERSON_AT);
  const skinM = std('#b97a4e', { roughness: 0.7 });
  const shirt = std('#f8f9fa', { roughness: 0.8 });
  const navy = std('#23306b', { roughness: 0.8 });
  const hair = std('#1b1410', { roughness: 0.6 });
  const shoe = std('#1a1a1a', { roughness: 0.45 });
  const parts = [];
  const add = (geo, mat, x, y, z, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.z = rz;
    m.castShadow = true;
    g.add(m);
    parts.push(m);
    return m;
  };
  for (const s of [-1, 1]) {
    add(new THREE.CapsuleGeometry(0.068, 0.62, 6, 14), navy, s * 0.09, 0.44, 0);
    add(new THREE.BoxGeometry(0.11, 0.07, 0.24), shoe, s * 0.09, 0.035, 0.04);
    add(new THREE.CapsuleGeometry(0.05, 0.27, 6, 12), shirt, s * 0.24, 1.17, 0, s * 0.22);
    add(new THREE.CapsuleGeometry(0.04, 0.24, 6, 12), skinM, s * 0.31, 0.89, 0.02, s * 0.12);
    add(new THREE.SphereGeometry(0.048, 12, 10), skinM, s * 0.335, 0.73, 0.03);
  }
  add(new THREE.CapsuleGeometry(0.16, 0.36, 8, 18), shirt, 0, 1.08, 0).scale.set(1, 1, 0.66);
  add(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 18), navy, 0, 0.82, 0).scale.set(1, 1, 0.68);
  add(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 12), skinM, 0, 1.37, 0);
  add(new THREE.SphereGeometry(0.11, 22, 16), skinM, 0, 1.47, 0).scale.set(0.92, 1.05, 0.98);
  const hairCap = add(new THREE.SphereGeometry(0.115, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 1.49, -0.008);
  hairCap.rotation.x = -0.25;
  return { root: g, parts };
}

/**
 * Everything around the box. `outdoors` holds what goes away in space (the yard, the wall, the tree, the pots, the
 * table); the column, the elephant and the student are their own groups.
 */
export function createWorld() {
  const root = new THREE.Group();
  root.name = 'Yard';
  const outdoors = new THREE.Group();
  outdoors.name = 'Outdoors';
  root.add(outdoors);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), std('#ffffff', { map: brickTexture(), roughness: 0.88 }));
  ground.position.y = GROUND;
  ground.receiveShadow = true;
  outdoors.add(ground);
  outdoors.add(createBuilding(), createFlameTree(new THREE.Vector3(3.6, GROUND, -4.3)), createPots());
  const table = createTable();
  outdoors.add(table);
  const column = createColumn();
  const elephant = createElephant();
  const person = createPerson();
  root.add(column, elephant, person.root);
  return { root, outdoors, table, column, elephant, person };
}
