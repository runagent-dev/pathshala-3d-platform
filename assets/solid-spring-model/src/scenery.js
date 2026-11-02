// The setting: a plain wooden bench top before a soft blue-grey wall. Nothing else. Units are centimetres, the bench
// top is y = 0. It is scenery only (never exported).
import * as THREE from 'three';

function plankTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const tones = ['#c29566', '#bd9061', '#c69a6b', '#ba8d5f', '#c09364', '#c39667', '#bb8f61', '#bf9264'];
  const h = S / tones.length;
  tones.forEach((tone, i) => {
    ctx.fillStyle = tone;
    ctx.fillRect(0, i * h, S, h);
    ctx.fillStyle = 'rgba(90,55,25,0.30)';
    ctx.fillRect(0, i * h, S, 2);
    // a few long grain lines, deterministic
    for (let k = 0; k < 5; k++) {
      const y = i * h + 8 + ((k * 37 + i * 11) % (h - 14));
      ctx.fillStyle = 'rgba(90,55,25,0.06)';
      ctx.fillRect(((k * 97 + i * 53) % 200) - 40, y, 220 + ((k * 61) % 180), 1.5);
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.repeat.set(3, 2);
  return tex;
}

function wallTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#9db9cd');
  g.addColorStop(0.6, '#7f9fb7');
  g.addColorStop(1, '#668aa6');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRoom() {
  const root = new THREE.Group();
  root.name = 'Bench';
  root.userData.noExport = true;
  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 40),
    new THREE.MeshStandardMaterial({ name: 'BenchTop', map: plankTexture(), roughness: 0.7 }),
  );
  top.rotation.x = -Math.PI / 2;
  top.position.set(0, 0, -6);
  const background = wallTexture();
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), new THREE.MeshBasicMaterial({ name: 'Wall', map: background }));
  wall.position.set(0, 20, -26);
  root.add(top, wall);
  return { root, background };
}
