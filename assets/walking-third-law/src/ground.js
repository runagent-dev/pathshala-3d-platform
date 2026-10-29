// The ground the student walks on, seen from the side as a slab (its front face shows below the line the feet stand
// on): firm ground, loose sand, or a floor made slippery with soapy water or oil. Real size in metres; the top is at
// y = 0, the student's feet are at z = +0.1. Each ground also shows what the foot did to it: nothing on firm ground, a
// heap of sand pushed back on sand, a smear of foam where the foot slid on the slippery floor.
import * as THREE from 'three';

export const SLAB = { x0: -2.6, x1: 3.4, depth: 0.8, thick: 0.34 };
const FOOT_Z = 0.1;

const LOOKS = {
  hard: { top: '#088b85', side: '#076470', rough: 0.95 },
  sand: { top: '#f5b32d', side: '#bf681c', rough: 1 },
  slip: { top: '#2557bf', side: '#12387e', rough: 0.07 },
};

/** A small tiling picture for the top: speckled ground, grains of sand, or smooth tiles with joints. */
function makeTexture(id, anisotropy) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = LOOKS[id].top;
  g.fillRect(0, 0, size, size);
  let seed = id === 'hard' ? 11 : id === 'sand' ? 23 : 37;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  if (id === 'slip') {
    // tiles: a joint every half of the picture, a faint sheen
    g.strokeStyle = '#133c8d';
    g.lineWidth = 4;
    g.strokeRect(0, 0, size, size);
    g.strokeRect(size / 2, 0, 0, size);
    g.strokeRect(0, size / 2, size, 0);
    const grad = g.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(160,190,205,0.25)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  } else {
    const dark = id === 'hard' ? ['#075960', '#12b5a6', '#086e70'] : ['#b6691e', '#ffda63', '#db8f16'];
    const n = id === 'hard' ? 520 : 1400;
    for (let i = 0; i < n; i++) {
      g.fillStyle = dark[Math.floor(rnd() * dark.length)];
      const r = id === 'hard' ? 1 + rnd() * 3 : 0.8 + rnd() * 1.4;
      g.globalAlpha = 0.55 + rnd() * 0.4;
      g.beginPath();
      g.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((SLAB.x1 - SLAB.x0) / 0.8, SLAB.depth / 0.8);
  tex.anisotropy = anisotropy || 4;
  return tex;
}

export function createGround({ anisotropy = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'Ground';
  const len = SLAB.x1 - SLAB.x0;
  const tops = {};
  const sides = {};
  for (const id of Object.keys(LOOKS)) {
    const look = LOOKS[id];
    tops[id] =
      id === 'slip'
        ? new THREE.MeshPhysicalMaterial({
            name: 'WetTiles',
            map: makeTexture(id, anisotropy),
            roughness: look.rough,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.04,
          })
        : new THREE.MeshStandardMaterial({
            name: id === 'hard' ? 'FirmGround' : 'Sand',
            map: makeTexture(id, anisotropy),
            roughness: look.rough,
            metalness: 0,
          });
    sides[id] = new THREE.MeshStandardMaterial({ name: `${id}Side`, color: look.side, roughness: 0.95, metalness: 0 });
  }
  const slab = new THREE.Mesh(new THREE.BoxGeometry(len, SLAB.thick, SLAB.depth), [
    sides.hard,
    sides.hard,
    tops.hard,
    sides.hard,
    sides.hard,
    sides.hard,
  ]);
  slab.position.set((SLAB.x0 + SLAB.x1) / 2, -SLAB.thick / 2, 0);
  slab.name = 'GroundSlab';
  slab.receiveShadow = true;
  root.add(slab);

  // the slippery floor's puddle of soapy water, with a few bubbles
  const puddleMat = new THREE.MeshStandardMaterial({
    name: 'Puddle',
    color: '#cfe6f2',
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.62, 40), puddleMat);
  puddle.rotation.x = -Math.PI / 2;
  puddle.scale.set(1.25, 0.5, 1);
  puddle.position.set(0.1, 0.002, 0.04);
  puddle.renderOrder = 1;
  const foam = new THREE.MeshStandardMaterial({ name: 'Foam', color: '#ffffff', roughness: 0.3, metalness: 0, transparent: true, opacity: 0.9 });
  const bubbles = new THREE.Group();
  [
    [-0.46, 0.17, 0.02],
    [-0.36, 0.28, 0.014],
    [0.62, 0.2, 0.022],
    [0.74, 0.05, 0.012],
    [0.5, 0.3, 0.016],
    [-0.58, -0.02, 0.012],
  ].forEach(([x, z, r]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), foam);
    b.position.set(x, r * 0.7, z);
    bubbles.add(b);
  });
  const smear = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 1, 6, 10), foam);
  smear.rotation.z = Math.PI / 2;
  smear.scale.set(0.3, 1, 1.8); // flat (local x is up after the turn), the long axis along the ground
  smear.visible = false;
  smear.name = 'FootSlide';
  const wet = new THREE.Group();
  wet.name = 'Wet';
  wet.userData.noExport = true;
  wet.add(puddle, bubbles, smear);
  root.add(wet);

  // the heap of sand the foot pushes back, and the grains it throws behind
  const sandMat = new THREE.MeshStandardMaterial({ name: 'SandHeap', color: '#e1911a', roughness: 1, metalness: 0 });
  const heap = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), sandMat);
  heap.name = 'SandHeap';
  heap.visible = false;
  heap.castShadow = true;
  const grains = new THREE.Group();
  grains.name = 'SandGrains';
  grains.visible = false;
  const grainSpots = [];
  let seed = 5;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.007 + rnd() * 0.007, 8, 6), sandMat);
    grains.add(m);
    grainSpots.push({ m, u: 0.25 + rnd() * 0.75, v: rnd(), w: rnd() - 0.5 });
  }
  const sand = new THREE.Group();
  sand.name = 'Sand';
  sand.userData.noExport = true;
  sand.add(heap, grains);
  root.add(sand);

  // the line the student starts from: dashes standing on the ground at x = 0, so a step forward can be seen
  const dashMat = new THREE.MeshBasicMaterial({ color: '#ffe28a' });
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.014, 0.034, 0.014), dashMat, 24);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 24; i++) dash.setMatrixAt(i, m4.makeTranslation(0, 0.02 + i * 0.068, 0));
  dash.name = 'StartLine';
  dash.userData.noExport = true;
  root.add(dash);

  let id = 'hard';
  const api = {
    root,
    get surface() {
      return id;
    },
    setSurface(next) {
      id = next;
      slab.material[2] = tops[next];
      for (const k of [0, 1, 3, 4, 5]) slab.material[k] = sides[next];
      wet.visible = next === 'slip';
      heap.visible = grains.visible = false;
      smear.visible = false;
    },
    /**
     * What the foot did to the ground: `toe` the rear toe's x now, `slip` how far it has slid back (m).
     * Sand: the heap it pushed back; the slippery floor: the smear it left.
     */
    foot(toe, slip) {
      const sliding = slip > 0.012;
      if (id === 'sand') {
        heap.visible = grains.visible = sliding;
        if (sliding) {
          const w = 0.08 + slip * 0.9;
          heap.scale.set(w, 0.035 + slip * 0.3, 0.1);
          heap.position.set(toe - w * 0.8, 0, FOOT_Z);
          for (const { m, u, v, w: z } of grainSpots) {
            const d = 0.05 + u * (0.1 + slip * 1.2);
            m.position.set(toe - w * 1.2 - d, 0.01 + Math.sin(v * Math.PI) * (0.04 + slip * 0.25), FOOT_Z + z * 0.18);
          }
        }
      }
      if (id === 'slip') {
        smear.visible = sliding;
        if (sliding) {
          smear.scale.y = slip + 0.05; // the capsule's long axis
          smear.position.set(toe + slip / 2, 0.006, FOOT_Z);
        }
      }
    },
    /** The ground, as the model the book gets. */
    exportGroup() {
      const g = new THREE.Group();
      g.name = 'Ground';
      g.add(slab.clone());
      return g;
    },
    anchors: { footZ: FOOT_Z },
  };
  api.setSurface('hard');
  return api;
}
