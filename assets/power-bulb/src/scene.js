// The place: a piece of a Bangladeshi house's front wall (plain, calm plaster) under the edge of the roof slab, and the
// book's 100 W bulb on its bracket, procedural three.js, in metres. Nothing else is built: the bulb is the lesson.
// +x to the right, +y up, the camera looks from +z; the wall is the plane z = 0.
import * as THREE from 'three';
import { canvasTexture, plasterTexture } from './textures.js';

export const LAYOUT = { bulb: new THREE.Vector3(0, 2.42, 0.2) };
const ROOF = 2.75; // m: the roof slab's top

export function createScene() {
  const root = new THREE.Group();
  root.name = 'WallAndBulb';
  const white = new THREE.MeshStandardMaterial({ color: '#f5f2ea', roughness: 0.82 });
  const iron = new THREE.MeshStandardMaterial({ color: '#2d3136', metalness: 0.55, roughness: 0.45 });
  const black = new THREE.MeshStandardMaterial({ color: '#1d1f22', roughness: 0.55 });

  // the wall, the roof slab's edge over it with its drip line, and the bulb's wire in a thin white conduit
  const plaster = plasterTexture('#e6cd96', 19);
  plaster.repeat.set(1, 1);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshStandardMaterial({ map: plaster, roughness: 0.9 }));
  wall.position.set(0, ROOF - 1.5, 0);
  wall.name = 'Wall';
  root.add(wall);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(3, 0.18, 0.24), white);
  slab.position.set(0, ROOF - 0.09, 0.12);
  slab.name = 'RoofSlab';
  root.add(slab);
  const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, ROOF - 0.18 - LAYOUT.bulb.y - 0.12, 10), white);
  conduit.position.set(0, (ROOF - 0.18 + LAYOUT.bulb.y + 0.12) / 2, 0.012);
  conduit.name = 'Conduit';
  root.add(conduit);

  const bulbGroup = new THREE.Group();
  bulbGroup.name = 'Bulb100W';
  bulbGroup.position.copy(LAYOUT.bulb);
  root.add(bulbGroup);
  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 10), iron);
  bracket.rotation.x = Math.PI / 2;
  bracket.position.set(0, 0.12, -0.1);
  bulbGroup.add(bracket);
  // a white bakelite batten holder (B22) on the bracket, and the bulb itself at its real size (an A60 incandescent
  // lamp, 60 mm across and 11 cm long): a clear glass globe on a narrow neck, a brass bayonet cap with its two pins,
  // and inside the glass stem, the two lead wires and the coiled tungsten filament that glows when it is on
  const bakelite = new THREE.MeshStandardMaterial({ color: '#f3f0e6', roughness: 0.45 });
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.05, 24), bakelite);
  holder.position.set(0, 0.083, 0);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.0215, 0.0215, 0.012, 24), bakelite);
  skirt.position.set(0, 0.062, 0);
  const holderTop = new THREE.Mesh(new THREE.SphereGeometry(0.019, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), bakelite);
  holderTop.position.set(0, 0.108, 0);
  bulbGroup.add(holder, skirt, holderTop);
  const capBrass = new THREE.MeshStandardMaterial({ color: '#c9a04a', metalness: 0.85, roughness: 0.3 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0112, 0.0112, 0.022, 24), capBrass);
  cap.position.set(0, 0.047, 0);
  const capRing = new THREE.Mesh(new THREE.CylinderGeometry(0.0116, 0.0118, 0.004, 24), black);
  capRing.position.set(0, 0.036, 0);
  bulbGroup.add(cap, capRing);
  for (const sx of [-1, 1]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.006, 8).rotateZ(Math.PI / 2), capBrass);
    pin.position.set(sx * 0.0135, 0.05, 0);
    bulbGroup.add(pin);
  }
  const globe = [
    [0.0115, 0.036],
    [0.013, 0.03],
    [0.016, 0.02],
    [0.022, 0.008],
    [0.028, -0.004],
    [0.0305, -0.016],
    [0.03, -0.028],
    [0.026, -0.04],
    [0.018, -0.048],
    [0.008, -0.052],
    [0, -0.053],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const glassOff = { color: new THREE.Color('#eef3f7'), emissive: new THREE.Color('#000000') };
  const glass = new THREE.MeshStandardMaterial({
    color: '#eef3f7',
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.38,
    emissive: '#000000',
    depthWrite: false,
  });
  const bulbMesh = new THREE.Mesh(new THREE.LatheGeometry(globe, 40), glass);
  bulbMesh.renderOrder = 2;
  bulbGroup.add(bulbMesh);
  const stemGlass = new THREE.MeshStandardMaterial({ color: '#dfe8ee', roughness: 0.1, transparent: true, opacity: 0.6 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.005, 0.034, 10), stemGlass);
  stem.position.set(0, 0.016, 0);
  bulbGroup.add(stem);
  const wire = new THREE.MeshStandardMaterial({ color: '#8a8f94', metalness: 0.8, roughness: 0.4 });
  const tube = (pts, r, m) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 6), m);
  const fy = -0.014; // the filament hangs across the middle of the globe
  for (const sx of [-1, 1]) {
    bulbGroup.add(
      tube([new THREE.Vector3(sx * 0.002, 0.004, 0), new THREE.Vector3(sx * 0.006, -0.004, 0), new THREE.Vector3(sx * 0.009, fy, 0)], 0.0005, wire),
    );
  }
  const coil = [];
  for (let i = 0; i <= 120; i++) {
    const u = i / 120;
    const a = u * Math.PI * 2 * 14;
    coil.push(new THREE.Vector3(-0.009 + 0.018 * u, fy - Math.sin(Math.PI * u) * 0.003 + Math.cos(a) * 0.0009, Math.sin(a) * 0.0009));
  }
  const filamentOff = new THREE.Color('#3a3330');
  const filamentMat = new THREE.MeshStandardMaterial({ color: '#3a3330', metalness: 0.6, roughness: 0.4, emissive: '#000000' });
  const filament = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 240, 0.00035, 5), filamentMat);
  filament.name = 'Filament';
  bulbGroup.add(filament);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: canvasTexture(
        64,
        64,
        (ctx) => {
          const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          g.addColorStop(0, 'rgba(255,236,170,0.95)');
          g.addColorStop(0.35, 'rgba(255,214,120,0.45)');
          g.addColorStop(1, 'rgba(255,200,90,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 64, 64);
        },
        false,
      ),
      depthWrite: false,
      transparent: true,
    }),
  );
  glow.scale.set(0.32, 0.32, 1);
  glow.visible = false;
  glow.userData.noExport = true;
  bulbGroup.add(glow);
  const bulbLight = new THREE.PointLight('#ffd58a', 0, 3, 1.4);
  bulbLight.position.set(0, -0.05, 0.1);
  bulbGroup.add(bulbLight);
  const bulbHit = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  bulbHit.userData.noExport = true;
  bulbGroup.add(bulbHit);
  let bulbOn = null;
  function setBulb(on) {
    if (on === bulbOn) return;
    bulbOn = on;
    glass.emissive.set(on ? '#ffd27a' : glassOff.emissive);
    glass.emissiveIntensity = on ? 0.9 : 1; // (1 with a black emissive: no glow, and a clean export)
    glass.color.set(on ? '#fff6dc' : glassOff.color);
    glass.opacity = on ? 0.6 : 0.38;
    filamentMat.emissive.set(on ? '#fff1c4' : '#000000');
    filamentMat.emissiveIntensity = on ? 3 : 1;
    filamentMat.color.set(on ? '#fff1c4' : filamentOff);
    glow.visible = on;
    bulbLight.intensity = on ? 2.4 : 0; // a warm pool on the wall and the door, in daylight (not a floodlight)
  }

  setBulb(false);
  return { root, bulb: { group: bulbGroup, mesh: bulbMesh, hit: bulbHit, set: setBulb } };
}
