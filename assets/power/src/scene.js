// The place: a sunny Bangladeshi house and its courtyard, procedural three.js, in metres. A one-storey house painted
// warm yellow (a white sunshade over each green-shuttered window with an iron grill, a wooden door with a bulb over
// it, a dark plinth band), its flat roof edged with a low parapet; at the roof's front edge two tanks on low stands. In the brick-paved courtyard, the open hatch of the underground water tank between the two pumps; white PVC
// pipes from the hatch to each pump and from each pump up the wall, over the parapet and into its tank. A coconut
// palm and a banana plant, flower pots by the door, neighbours' houses and trees behind, a blue sky with clouds.
// +x to the right, +y up, the camera looks from +z; the house's front wall is the plane z = 0, the ground y = 0.
import * as THREE from 'three';
import { H } from './power.js';
import { TANK } from './tank.js';

export const ROOF = H - TANK.FLOOR; // m: the roof slab's top (the tank stands on it, its floor at h = H)
export const LAYOUT = {
  pumpX: { small: -1.3, big: 1.3 },
  pumpZ: 0.75, // in the courtyard, in front of the wall
  tankZ: -0.55,
  door: { x: -4.1, w: 1.0, h: 2.05 },
  bulb: new THREE.Vector3(-4.1, 2.42, 0.2),
  hArrowX: -2.25,
  hatch: { x: 0, w: 0.7, d: 0.5 },
};
const HOUSE = { x0: -7.2, x1: 7.2, depth: 7 };
const PIPE_R = 0.027;

const seeded = (s) => () => {
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
};
function canvasTexture(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Red bricks laid in a herringbone, one 1.2 m square repeat. */
function brickTexture() {
  return canvasTexture(256, 256, (ctx, w) => {
    ctx.fillStyle = '#8f5a3f';
    ctx.fillRect(0, 0, w, w);
    const rand = seeded(5);
    const u = w / 12; // a brick is 2u × 1u
    for (let i = -14; i < 26; i++)
      for (let j = -14; j < 26; j++) {
        const x = (i + j) * u;
        const y = (j - i) * u;
        for (const [bx, by, bw, bh] of [
          [x, y, 2 * u, u],
          [x + u, y + u, u, 2 * u],
        ]) {
          if (bx > w || by > w || bx + bw < 0 || by + bh < 0) continue;
          const r = 168 + Math.floor(rand() * 40);
          const g = 74 + Math.floor(rand() * 26);
          const b = 46 + Math.floor(rand() * 18);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(bx + 1.2, by + 1.2, bw - 2.4, bh - 2.4);
          ctx.fillStyle = 'rgba(255,230,200,0.08)';
          ctx.fillRect(bx + 2, by + 2, bw - 4, 2);
        }
      }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,240,220,0.08)';
      ctx.fillRect(rand() * w, rand() * w, 2, 2);
    }
  });
}

/** Painted plaster: a warm wall colour with a soft mottle and a few rain streaks. */
function wallTexture(color) {
  return canvasTexture(256, 256, (ctx, w) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, w);
    const rand = seeded(9);
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(120,70,0,0.04)';
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * w, 8 + rand() * 26, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 1500; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(80,50,0,0.06)';
      ctx.fillRect(rand() * w, rand() * w, 1.5, 1.5);
    }
  });
}

/** Grass: green with blades of lighter and darker green. */
function grassTexture() {
  return canvasTexture(128, 128, (ctx, w) => {
    ctx.fillStyle = '#4f9a35';
    ctx.fillRect(0, 0, w, w);
    const rand = seeded(13);
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(160,220,90,0.35)' : 'rgba(20,70,20,0.3)';
      ctx.fillRect(rand() * w, rand() * w, 1.2, 3 + rand() * 3);
    }
  });
}

/** A window: glass with the sky in it behind an iron grill, in a green frame. */
function windowTexture() {
  return canvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#2f7d4f';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 8, 0, h - 8);
      g.addColorStop(0, '#a9d4ee');
      g.addColorStop(0.55, '#4f7f9e');
      g.addColorStop(1, '#27445a');
      ctx.fillStyle = g;
      ctx.fillRect(9, 9, 52, h - 18);
      ctx.fillRect(67, 9, 52, h - 18);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(14, h - 14);
      ctx.lineTo(40, 12);
      ctx.lineTo(54, 12);
      ctx.lineTo(28, h - 14);
      ctx.fill();
      ctx.fillStyle = '#22262a'; // the grill
      for (let x = 16; x < w - 8; x += 12) ctx.fillRect(x, 6, 3, h - 12);
      ctx.fillRect(6, h * 0.36, w - 12, 3);
      ctx.fillRect(6, h * 0.68, w - 12, 3);
    },
    false,
  );
}

/** A wooden door with two panels and a brass handle. */
function doorTexture() {
  return canvasTexture(
    128,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#7a4527';
      ctx.fillRect(0, 0, w, h);
      const rand = seeded(17);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(${rand() < 0.5 ? '40,18,6' : '160,100,60'},0.18)`;
        ctx.fillRect(rand() * w, 0, 1 + rand() * 2, h);
      }
      ctx.strokeStyle = '#4e2a15';
      ctx.lineWidth = 5;
      ctx.strokeRect(14, 16, w / 2 - 20, h * 0.42);
      ctx.strokeRect(w / 2 + 6, 16, w / 2 - 20, h * 0.42);
      ctx.strokeRect(14, h * 0.52, w / 2 - 20, h * 0.42);
      ctx.strokeRect(w / 2 + 6, h * 0.52, w / 2 - 20, h * 0.42);
      ctx.fillStyle = '#3a1f10';
      ctx.fillRect(w / 2 - 1.5, 0, 3, h);
      ctx.fillStyle = '#d7aa4a';
      ctx.fillRect(w / 2 + 6, h * 0.48, 5, 14);
    },
    false,
  );
}

/** A palm frond: leaflets on a midrib, on a transparent ground (alpha). */
function frondTexture() {
  return canvasTexture(
    256,
    64,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#8a7a2c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      for (let x = 8; x < w - 4; x += 5) {
        const len = (h / 2 - 2) * Math.sin((Math.PI * (x + 20)) / (w + 30));
        for (const s of [-1, 1]) {
          ctx.strokeStyle = (x / 5) % 3 === 0 ? '#3f8a2a' : (x / 5) % 3 === 1 ? '#2f7a22' : '#5aa236';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(x, h / 2);
          ctx.lineTo(x + 9, h / 2 + s * len);
          ctx.stroke();
        }
      }
    },
    false,
  );
}

/** A soft white cloud on transparent. */
function cloudTexture(seed) {
  return canvasTexture(
    256,
    128,
    (ctx, w, h) => {
      const rand = seeded(seed);
      for (let i = 0; i < 16; i++) {
        const x = w * (0.2 + rand() * 0.6);
        const y = h * (0.45 + rand() * 0.25);
        const r = 18 + rand() * 30;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    false,
  );
}

/** Neighbours' walls: rows of windows on a wall colour. */
function facadeTexture(color) {
  return canvasTexture(64, 64, (ctx, w) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, w);
    ctx.fillStyle = '#3c5568';
    ctx.fillRect(14, 16, 36, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(10, 12, 44, 4);
    ctx.fillStyle = '#2b2f33';
    for (let x = 18; x < 50; x += 7) ctx.fillRect(x, 16, 1.5, 30);
  });
}

/** A run of pipe through points, with a fitting at every bend. */
function pipeRun(points, mat, fitMat, r = PIPE_R) {
  const g = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = a.distanceTo(b);
    if (len < 1e-4) continue;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
    g.add(m);
  }
  for (let i = 1; i < points.length - 1; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(r * 1.3, 16, 12), fitMat);
    f.position.copy(points[i]);
    g.add(f);
  }
  return g;
}

/**
 * @param {{ pumps: { small: any, big: any }, tanks: { small: any, big: any } }} parts placed pumps and tanks
 */
export function createScene({ pumps, tanks }) {
  const root = new THREE.Group();
  root.name = 'HouseAndCourtyard';
  const decor = new THREE.Group(); // far things: not exported
  decor.name = 'Surroundings';
  decor.userData.noExport = true;

  // ── the ground: the brick courtyard, grass beyond ─────────────────────────
  const bricks = brickTexture();
  bricks.repeat.set(16 / 1.2, 9 / 1.2);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshStandardMaterial({ map: bricks, roughness: 0.9 }));
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(0, 0, 4.5);
  yard.name = 'Courtyard';
  root.add(yard);
  const grass = grassTexture();
  grass.repeat.set(60, 40);
  const field = new THREE.Mesh(new THREE.PlaneGeometry(240, 160), new THREE.MeshStandardMaterial({ map: grass, roughness: 1 }));
  field.rotation.x = -Math.PI / 2;
  field.position.set(0, -0.01, -20);
  decor.add(field);
  // a kerb round the courtyard
  const kerbMat = new THREE.MeshStandardMaterial({ color: '#c9bfae', roughness: 0.9 });
  for (const x of [-8.05, 8.05]) {
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 9), kerbMat);
    k.position.set(x, 0.03, 4.5);
    decor.add(k);
  }

  // ── the house ─────────────────────────────────────────────────────────────
  const house = new THREE.Group();
  house.name = 'House';
  root.add(house);
  const W = HOUSE.x1 - HOUSE.x0;
  const wallTex = wallTexture('#f2c463');
  wallTex.repeat.set(W / 3, ROOF / 3);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.88 });
  const sideTex = wallTexture('#e6b356');
  sideTex.repeat.set(HOUSE.depth / 3, ROOF / 3);
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9 });
  const white = new THREE.MeshStandardMaterial({ color: '#f7f4ec', roughness: 0.8 });
  const plinthMat = new THREE.MeshStandardMaterial({ color: '#8b3a2e', roughness: 0.85 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(W, ROOF - 0.16, HOUSE.depth), [sideMat, sideMat, white, white, wallMat, wallMat]);
  block.position.set((HOUSE.x0 + HOUSE.x1) / 2, (ROOF - 0.16) / 2, -HOUSE.depth / 2);
  house.add(block);
  const plinthBand = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.42, 0.06), plinthMat);
  plinthBand.position.set(block.position.x, 0.21, 0.03);
  house.add(plinthBand);
  // the roof slab's edge and the parapet with its railing
  const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.24, 0.18, HOUSE.depth + 0.24), white);
  slab.position.set(block.position.x, ROOF - 0.09, -HOUSE.depth / 2);
  house.add(slab);
  // a low parapet only (no railing), so the tanks on the roof's front edge show whole
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(W + 0.24, 0.16, 0.16), wallMat);
  parapet.position.set(block.position.x, ROOF + 0.08, 0.04);
  house.add(parapet);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.04, 0.22), white);
  cap.position.set(block.position.x, ROOF + 0.18, 0.04);
  house.add(cap);
  const iron = new THREE.MeshStandardMaterial({ color: '#2c4f45', metalness: 0.5, roughness: 0.45 });

  // windows (with a sunshade) and the door
  const winMat = new THREE.MeshStandardMaterial({ map: windowTexture(), roughness: 0.4, metalness: 0.1 });
  for (const wx of [0, 4.2, -6.2]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), winMat);
    win.position.set(wx, 1.45, 0.012);
    house.add(win);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.08, 0.1), white);
    frame.position.set(wx, 0.82, 0.05);
    house.add(frame);
    const shade = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.07, 0.42), white);
    shade.position.set(wx, 2.24, 0.2);
    shade.rotation.x = 0.08;
    house.add(shade);
  }
  const { door } = LAYOUT;
  const doorMesh = new THREE.Mesh(new THREE.PlaneGeometry(door.w, door.h), new THREE.MeshStandardMaterial({ map: doorTexture(), roughness: 0.7 }));
  doorMesh.position.set(door.x, door.h / 2 + 0.05, 0.015);
  house.add(doorMesh);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(door.w + 0.16, 0.1, 0.1), white);
  doorFrame.position.set(door.x, door.h + 0.1, 0.05);
  house.add(doorFrame);
  for (const sx of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.08, door.h + 0.05, 0.1), white);
    jamb.position.set(door.x + sx * (door.w / 2 + 0.04), door.h / 2 + 0.05, 0.05);
    house.add(jamb);
  }
  const step = new THREE.Mesh(new THREE.BoxGeometry(door.w + 0.5, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: '#b7aea0', roughness: 0.9 }));
  step.position.set(door.x, 0.05, 0.25);
  house.add(step);

  // ── the bulb over the door ────────────────────────────────────────────────
  const bulbGroup = new THREE.Group();
  bulbGroup.name = 'Bulb100W';
  bulbGroup.position.copy(LAYOUT.bulb);
  house.add(bulbGroup);
  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 10), iron);
  bracket.rotation.x = Math.PI / 2;
  bracket.position.set(0, 0.12, -0.1);
  bulbGroup.add(bracket);
  const holder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.026, 0.07, 16),
    new THREE.MeshStandardMaterial({ color: '#1e1f22', roughness: 0.5 }),
  );
  holder.position.set(0, 0.085, 0);
  bulbGroup.add(holder);
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#2f7d4f', metalness: 0.4, roughness: 0.4, side: THREE.DoubleSide });
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.08, 28, 1, true), shadeMat);
  lampShade.position.set(0, 0.1, 0);
  bulbGroup.add(lampShade);
  const glassOff = { color: new THREE.Color('#e9edf1'), emissive: new THREE.Color('#000000') };
  const glass = new THREE.MeshStandardMaterial({ color: '#e9edf1', roughness: 0.15, transparent: true, opacity: 0.9, emissive: '#000000' });
  const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 18), glass);
  bulbMesh.scale.y = 1.18;
  bulbMesh.position.set(0, 0.0, 0);
  bulbGroup.add(bulbMesh);
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
  glow.scale.set(0.7, 0.7, 1);
  glow.visible = false;
  glow.userData.noExport = true;
  bulbGroup.add(glow);
  const bulbLight = new THREE.PointLight('#ffd58a', 0, 3, 1.4);
  bulbLight.position.set(0, -0.05, 0.1);
  bulbGroup.add(bulbLight);
  const bulbHit = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  bulbHit.userData.noExport = true;
  bulbGroup.add(bulbHit);
  function setBulb(on) {
    glass.emissive.set(on ? '#ffd27a' : glassOff.emissive);
    glass.emissiveIntensity = on ? 2.2 : 0;
    glass.color.set(on ? '#fff6dc' : glassOff.color);
    glow.visible = on;
    bulbLight.intensity = on ? 7 : 0;
  }

  // ── flower pots by the door, the hatch, the plumbing ───────────────────────
  const potMat = new THREE.MeshStandardMaterial({ color: '#b5522f', roughness: 0.85 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#3d8b2f', roughness: 0.8 });
  const flowerMats = ['#e8384f', '#ffb000', '#f06595'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
  const rand = seeded(23);
  for (const [px, pz, s] of [
    [-5.05, 0.45, 1],
    [-3.05, 0.5, 0.85],
    [2.75, 0.5, 0.9],
  ]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17 * s, 0.12 * s, 0.28 * s, 18), potMat);
    pot.position.set(px, 0.14 * s, pz);
    house.add(pot);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1 * s, 10, 8), leafMat);
      leaf.position.set(px + (rand() - 0.5) * 0.2 * s, 0.34 * s + rand() * 0.14 * s, pz + (rand() - 0.5) * 0.2 * s);
      house.add(leaf);
    }
    for (let i = 0; i < 4; i++) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.035 * s, 8, 6), flowerMats[i % 3]);
      fl.position.set(px + (rand() - 0.5) * 0.24 * s, 0.42 * s + rand() * 0.12 * s, pz + 0.06 + (rand() - 0.3) * 0.18 * s);
      house.add(fl);
    }
  }

  const { hatch } = LAYOUT;
  const concrete = new THREE.MeshStandardMaterial({ color: '#bdb5a8', roughness: 0.9 });
  const rimW = 0.09;
  for (const [w, d, x, z] of [
    [hatch.w + 2 * rimW, rimW, 0, -(hatch.d + rimW) / 2],
    [hatch.w + 2 * rimW, rimW, 0, (hatch.d + rimW) / 2],
    [rimW, hatch.d, -(hatch.w + rimW) / 2, 0],
    [rimW, hatch.d, (hatch.w + rimW) / 2, 0],
  ]) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, d), concrete);
    rim.position.set(hatch.x + x, 0.035, LAYOUT.pumpZ + z);
    root.add(rim);
  }
  const pit = new THREE.Mesh(new THREE.PlaneGeometry(hatch.w, hatch.d), new THREE.MeshStandardMaterial({ color: '#173c5a', roughness: 0.2 }));
  pit.rotation.x = -Math.PI / 2;
  pit.position.set(hatch.x, 0.004, LAYOUT.pumpZ);
  root.add(pit);
  const shine = new THREE.Mesh(
    new THREE.PlaneGeometry(hatch.w * 0.7, hatch.d * 0.5),
    new THREE.MeshStandardMaterial({ color: '#3f86b8', roughness: 0.1, transparent: true, opacity: 0.7 }),
  );
  shine.rotation.x = -Math.PI / 2;
  shine.position.set(hatch.x + 0.05, 0.006, LAYOUT.pumpZ + 0.04);
  root.add(shine);
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(hatch.w + 0.1, 0.03, hatch.d + 0.1),
    new THREE.MeshStandardMaterial({ color: '#59616a', metalness: 0.6, roughness: 0.45 }),
  );
  lid.position.set(hatch.x, 0.07 + ((hatch.d + 0.1) / 2) * Math.sin(1.25) - 0.01, LAYOUT.pumpZ - hatch.d / 2 - rimW - 0.02 - Math.cos(1.25) * 0.05);
  lid.rotation.x = -1.25;
  root.add(lid);

  const pvc = new THREE.MeshStandardMaterial({ color: '#eef0f1', roughness: 0.42 });
  const fitting = new THREE.MeshStandardMaterial({ color: '#d9dcde', roughness: 0.5 });
  const clampMat = new THREE.MeshStandardMaterial({ color: '#9aa2a8', metalness: 0.7, roughness: 0.35 });
  const PIPE_TOP = ROOF + TANK.FLOOR + TANK.BODY + 0.3; // over the tank's dome
  for (const id of /** @type {const} */ (['small', 'big'])) {
    const pump = pumps[id];
    const tank = tanks[id];
    pump.root.updateMatrixWorld(true);
    tank.root.updateMatrixWorld(true);
    const out = pump.root.localToWorld(pump.outlet.clone());
    const inl = pump.root.localToWorld(pump.inlet.clone());
    const into = tank.root.localToWorld(tank.inlet.clone());
    const x = out.x;
    const xs = x + Math.sign(x) * (TANK.R + 0.2); // up the wall beside the tank, never over its cutaway
    const pipeZ = 0.07;
    // delivery: up from the pump, back to the wall, up the wall, over the parapet, into the tank
    const delivery = pipeRun(
      [
        out,
        new THREE.Vector3(x, out.y + 0.16, out.z),
        new THREE.Vector3(x, out.y + 0.16, pipeZ),
        new THREE.Vector3(xs, out.y + 0.16, pipeZ),
        new THREE.Vector3(xs, PIPE_TOP, pipeZ),
        new THREE.Vector3(xs, PIPE_TOP, into.z),
        new THREE.Vector3(into.x, PIPE_TOP, into.z),
        new THREE.Vector3(into.x, into.y + 0.04, into.z),
      ],
      pvc,
      fitting,
    );
    delivery.name = `DeliveryPipe_${id}`;
    root.add(delivery);
    // a small brick post under the run across the courtyard, with a clamp
    const postZ = (out.z + pipeZ) / 2;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, out.y + 0.16 - PIPE_R, 0.14), concrete);
    post.position.set(x, (out.y + 0.16 - PIPE_R) / 2, postZ);
    root.add(post);
    for (let y = 0.85; y < ROOF; y += 0.8) {
      const c = new THREE.Mesh(new THREE.TorusGeometry(PIPE_R + 0.006, 0.006, 6, 16), clampMat);
      c.rotation.x = Math.PI / 2;
      c.position.set(xs, y, pipeZ);
      root.add(c);
    }
    // suction: from the pump's front port to the hatch and down into the water
    const toward = Math.sign(hatch.x - inl.x);
    const sx = hatch.x - toward * 0.17;
    const suction = pipeRun([inl, new THREE.Vector3(sx, inl.y, inl.z), new THREE.Vector3(sx, -0.25, inl.z)], pvc, fitting);
    suction.name = `SuctionPipe_${id}`;
    root.add(suction);
  }

  // ── the palm and the banana plant ─────────────────────────────────────────
  const trunkTex = canvasTexture(64, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8a6c4a';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10) {
      ctx.fillStyle = 'rgba(60,40,20,0.45)';
      ctx.fillRect(0, y, w, 3);
      ctx.fillStyle = 'rgba(200,170,120,0.25)';
      ctx.fillRect(0, y + 3, w, 2);
    }
  });
  trunkTex.repeat.set(2, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ map: trunkTex, roughness: 0.95 });
  function palm(x, z, height, lean, seed) {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(lean * 0.25, height * 0.35, 0),
      new THREE.Vector3(lean * 0.7, height * 0.7, 0.1),
      new THREE.Vector3(lean, height, 0.15),
    ]);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.13, 10), trunkMat);
    g.add(trunk);
    const top = curve.getPoint(1);
    const frondMat = new THREE.MeshStandardMaterial({
      map: frondTexture(),
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.75,
    });
    const r = seeded(seed);
    for (let i = 0; i < 11; i++) {
      const len = 2.2 + r() * 0.8;
      const geo = new THREE.PlaneGeometry(len, 0.55, 12, 1);
      const pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const u = (pos.getX(k) + len / 2) / len;
        pos.setX(k, u * len);
        pos.setY(k, pos.getY(k));
        pos.setZ(k, -u * u * 0.9 * len * 0.5);
      }
      geo.computeVertexNormals();
      const f = new THREE.Mesh(geo, frondMat);
      f.rotation.order = 'YXZ';
      f.rotation.y = (i / 11) * Math.PI * 2 + r() * 0.3;
      f.rotation.x = -Math.PI / 2 + 0.25 + r() * 0.3;
      f.position.copy(top);
      g.add(f);
    }
    const nutMat = new THREE.MeshStandardMaterial({ color: '#5f7a22', roughness: 0.6 });
    for (let i = 0; i < 5; i++) {
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), nutMat);
      const a = (i / 5) * Math.PI * 2;
      nut.position.set(top.x + Math.cos(a) * 0.15, top.y - 0.15, top.z + Math.sin(a) * 0.15);
      g.add(nut);
    }
    g.position.set(x, 0, z);
    return g;
  }
  decor.add(palm(-7.9, 1.6, 7.2, 0.9, 31), palm(9.6, -1.5, 8.4, -0.7, 37));
  const bananaMat = new THREE.MeshStandardMaterial({ color: '#4c9e2c', roughness: 0.7, side: THREE.DoubleSide });
  const stemMat = new THREE.MeshStandardMaterial({ color: '#6f8f3a', roughness: 0.8 });
  function banana(x, z, s) {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 1.6 * s, 12), stemMat);
    stem.position.y = 0.8 * s;
    g.add(stem);
    for (let i = 0; i < 7; i++) {
      const geo = new THREE.PlaneGeometry(1.4 * s, 0.42 * s, 8, 1);
      const pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const u = (pos.getX(k) + 0.7 * s) / (1.4 * s);
        pos.setX(k, u * 1.4 * s);
        pos.setZ(k, -u * u * 0.5 * s);
      }
      geo.computeVertexNormals();
      const leaf = new THREE.Mesh(geo, bananaMat);
      leaf.rotation.order = 'YXZ';
      leaf.rotation.y = (i / 7) * Math.PI * 2;
      leaf.rotation.x = -Math.PI / 2 + 0.6;
      leaf.rotation.z = 0.5;
      leaf.position.y = 1.55 * s;
      g.add(leaf);
    }
    g.position.set(x, 0, z);
    return g;
  }
  decor.add(banana(7.4, 1.4, 1.2), banana(-8.6, -2.2, 1));

  // ── the neighbourhood: houses and trees behind, clouds ────────────────────
  const r2 = seeded(41);
  const facades = ['#f4a6a0', '#9fd3c7', '#f6e3b4', '#b9c8f0', '#f1c28f', '#d7e8a6'];
  for (let i = 0; i < 9; i++) {
    const w = 7 + r2() * 6;
    const h = 5 + r2() * 5;
    const tex = facadeTexture(facades[i % facades.length]);
    tex.repeat.set(w / 2.6, h / 3);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    b.position.set(-58 + i * 14 + r2() * 3, h / 2, -60 - r2() * 10);
    decor.add(b);
  }
  const treeMats = ['#2f7d32', '#3f9142', '#26692b'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
  for (let i = 0; i < 16; i++) {
    const t = new THREE.Mesh(new THREE.SphereGeometry(1.6 + r2() * 1.6, 14, 10), treeMats[i % 3]);
    t.position.set(-48 + i * 6.5 + r2() * 2, 1.6 + r2() * 1.2, -26 - r2() * 4);
    t.scale.y = 0.85;
    decor.add(t);
  }
  for (let i = 0; i < 6; i++) {
    const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(50 + i), transparent: true, depthWrite: false, fog: false }));
    cl.scale.set(18 + r2() * 10, 8 + r2() * 3, 1);
    cl.position.set(-50 + i * 20 + r2() * 8, 16 + r2() * 10, -70);
    decor.add(cl);
  }

  root.add(decor);
  return { root, decor, bulb: { group: bulbGroup, mesh: bulbMesh, hit: bulbHit, set: setBulb }, yard };
}
