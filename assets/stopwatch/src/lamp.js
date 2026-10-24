// A small lamp on a stand, in millimetres, for the timing game: it lights up for a few seconds and the student
// times it with the stopwatch. The table is y = 0.
import * as THREE from 'three';

export function createLamp(M) {
  const root = new THREE.Group();
  root.name = 'Lamp';
  const dark = new THREE.MeshPhysicalMaterial({ name: 'LampBase', color: 0x2a2e35, roughness: 0.5, clearcoat: 0.3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(20, 23, 9, 40), dark);
  base.position.y = 4.5;
  root.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 34, 20), M.chrome);
  post.position.y = 9 + 17;
  root.add(post);
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 6.5, 12, 28), M.brass);
  socket.position.y = 43 + 6;
  root.add(socket);
  const glass = new THREE.MeshStandardMaterial({ name: 'Bulb', color: 0xf4f1e6, roughness: 0.25, emissive: 0xffbf1f, emissiveIntensity: 0 });
  const bulbGeo = new THREE.LatheGeometry(
    [
      [6.5, 0],
      [7.2, 5],
      [10.5, 11],
      [13, 18],
      [13.4, 23],
      [12, 29],
      [8, 33.5],
      [0, 35],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    40,
  );
  const bulb = new THREE.Mesh(bulbGeo, glass);
  bulb.name = 'Bulb';
  bulb.position.y = 55;
  root.add(bulb);

  // a soft glow behind the bulb while it is on (a picture, not exported)
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 214, 90, 0.95)');
  grad.addColorStop(0.35, 'rgba(255, 200, 60, 0.45)');
  grad.addColorStop(1, 'rgba(255, 200, 60, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, depthWrite: false, transparent: true, toneMapped: false }));
  glow.scale.set(74, 74, 1);
  glow.position.y = 55 + 19;
  glow.visible = false;
  glow.userData.noExport = true;
  root.add(glow);

  let on = false;
  function set(value) {
    on = Boolean(value);
    glass.emissiveIntensity = on ? 2.2 : 0;
    glass.color.set(on ? 0xfff3c4 : 0xf4f1e6);
    glow.visible = on;
  }
  return {
    root,
    set,
    get on() {
      return on;
    },
    top: () => root.localToWorld(new THREE.Vector3(0, 92, 0)),
  };
}
