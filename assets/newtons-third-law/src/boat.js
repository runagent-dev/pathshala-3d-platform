import * as THREE from 'three';
import { createPerson } from './person.js';
import { BOAT } from './physics.js';
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const material = (name, color, roughness = 0.6) => new THREE.MeshPhysicalMaterial({ name, color, roughness, clearcoat: 0.2 });
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#b66d38';
  g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = i % 3 ? 'rgba(75,34,13,.22)' : 'rgba(255,211,143,.35)';
    g.lineWidth = i % 3 ? 1 : 2;
    g.beginPath();
    g.moveTo(0, i * 3.3);
    g.bezierCurveTo(160, i * 3.3 + 8, 320, i * 3.3 - 9, 512, i * 3.3 + 2);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function createBoatScene() {
  const root = new THREE.Group();
  root.name = 'BoatAndBoy';
  const boat = new THREE.Group();
  boat.name = 'WoodenBoat';
  root.add(boat);
  const wood = material('VarnishedCedar', 0xe9b975, 0.38);
  wood.map = woodTexture();
  wood.clearcoat = 0.45;
  const inside = material('InsideWood', 0xf1c282, 0.6);
  const dark = material('DarkTimber', 0x603923, 0.65);
  const width = (x) => 0.48 * Math.max(0, 1 - (x / 1.2) ** 2) ** 0.6;
  const top = (x) => 0.36 + 0.09 * (Math.abs(x) / 1.2) ** 2;
  const positions = [],
    indices = [],
    uv = [];
  const NX = 56,
    NY = 14;
  for (let i = 0; i <= NX; i++)
    for (let j = 0; j <= NY; j++) {
      const x = -1.2 + (2.4 * i) / NX,
        angle = -Math.PI / 2 + (Math.PI * j) / NY;
      uv.push(i / NX, j / NY);
      positions.push(x, -0.14 + (top(x) + 0.14) * (1 - Math.cos(angle)), width(x) * Math.sin(angle));
    }
  for (let i = 0; i < NX; i++)
    for (let j = 0; j < NY; j++) {
      const a = i * (NY + 1) + j;
      indices.push(a, a + 1, a + NY + 1, a + 1, a + NY + 2, a + NY + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  wood.side = THREE.DoubleSide;
  const hull = new THREE.Mesh(geo, wood);
  hull.name = 'Hull';
  boat.add(hull);
  const rim = [];
  for (let i = 0; i <= 56; i++) {
    const x = -1.2 + (2.4 * i) / 56;
    rim.push(v(x, top(x), width(x)));
  }
  for (let i = 56; i >= 0; i--) {
    const x = -1.2 + (2.4 * i) / 56;
    rim.push(v(x, top(x), -width(x)));
  }
  boat.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 180, 0.025, 8, true), dark));
  for (let i = -6; i <= 6; i++) {
    const x = i * 0.16;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.153, 0.025, width(x) * 1.5), inside);
    plank.position.set(x, 0.05, 0);
    boat.add(plank);
  }
  for (const x of [-0.72, -0.05, 0.68]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, width(x) * 1.87), wood);
    seat.position.set(x, 0.28, 0);
    boat.add(seat);
  }
  for (const side of [-1, 1])
    for (const f of [0.25, 0.5, 0.75]) {
      const pts = [];
      for (let i = 0; i <= 56; i++) {
        const x = -1.2 + (2.4 * i) / 56;
        const angle = (f * Math.PI) / 2;
        pts.push(v(x, -0.14 + (top(x) + 0.14) * (1 - Math.cos(angle)), side * width(x) * Math.sin(angle)));
      }
      boat.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 70, 0.004, 4, false), dark));
    }
  const person = createPerson();
  person.root.name = 'Boy';
  person.root.scale.setScalar(0.9);
  root.add(person.root);
  const waterGeo = new THREE.PlaneGeometry(12, 10, 100, 60);
  waterGeo.rotateX(-Math.PI / 2);
  const p = waterGeo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, 0.025 * Math.sin(p.getX(i) * 3.5 + p.getZ(i) * 2) + 0.012 * Math.sin(p.getZ(i) * 8));
  waterGeo.computeVertexNormals();
  const water = new THREE.Mesh(waterGeo, new THREE.MeshPhongMaterial({ name: 'RiverWater', color: 0x087caa, specular: 0x38a8c4, shininess: 55 }));
  water.position.y = -0.13;
  water.receiveShadow = true;
  root.add(water);
  const dock = new THREE.Group();
  dock.name = 'Jetty';
  root.add(dock);
  for (let i = 0; i < 18; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.1, 1.55), wood);
    plank.position.set(1.78 + i * 0.16, BOAT.dockY - 0.05, 0);
    plank.receiveShadow = true;
    dock.add(plank);
  }
  for (const x of [1.9, 3.1, 4.3])
    for (const z of [-0.64, 0.64]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.8, 12), dark);
      post.position.set(x, -0.12, z);
      dock.add(post);
    }
  // Small wave lines give the boat a clear waterline without a distracting grid.
  const wake = new THREE.Group();
  wake.userData.noExport = true;
  boat.add(wake);
  const rippleMat = new THREE.MeshBasicMaterial({ color: 0x96eff5, transparent: true, opacity: 0.55 });
  for (const side of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const x = -1.12 + (2.24 * i) / 32;
      pts.push(v(x, -0.105, side * (width(x) + 0.07)));
    }
    wake.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.008, 4, false), rippleMat));
  }
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 0.7), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.8;
  hit.userData.noExport = true;
  person.root.add(hit);
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && o !== water) o.castShadow = true;
  });
  return {
    root,
    boat,
    person: person.root,
    hit,
    set(state) {
      boat.position.x = state.boatX;
      person.root.position.set(state.personX, state.personY, 0);
      const air = state.phase === 'flight';
      person.pose({
        lean: state.phase === 'push' ? 0.3 : air ? 0.12 : 0.03,
        stance: air ? 0.28 : 0.09,
        jump: air ? 1 : 0,
        hands: air ? [v(0.42, 1.4, 0.2), v(0.05, 1.1, -0.25)] : [v(0.25, 1.2, 0.2), v(0.17, 1.08, -0.2)],
      });
    },
    bounds: new THREE.Box3(v(-2.3, -0.3, -0.75), v(2.6, 2.55, 0.75)),
  };
}
