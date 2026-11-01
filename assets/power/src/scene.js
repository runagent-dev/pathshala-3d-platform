// The place: a sunny Bangladeshi house and its courtyard, procedural three.js, in metres. A one-storey house painted
// warm yellow and weathered as such walls are (rain streaks, a damp band over the plinth, hairline cracks). Three
// windows with teak casements, curtains behind the glass, iron grills, sills and sunshades; a panelled teak door with
// two steps, a doormat and sandals, a bulb over it. The flat roof edged with a low parapet, rain spouts and
// downpipes; on it a stair room, and at the front edge the two tanks on low stands.
// The electrics: the service wire comes in from the lane at the right, runs along the wall to the meter, then in
// conduit to the pump switch board (a switch and a lamp for each pump, lit while it runs) and out to each pump.
// In the brick-paved courtyard: the open hatch of the underground tank between the two pumps; white PVC pipes from the
// hatch to each pump and from each pump (through a gate valve) up the wall, over the parapet and into its tank. A
// tubewell with a bucket and a pitcher, a clothes line, a bicycle against the wall, flower pots, wet patches. Around: see
// surroundings.js.
// +x to the right, +y up, the camera looks from +z; the house's front wall is the plane z = 0, the ground y = 0.
import * as THREE from 'three';
import { bake, cable, merged, parts, pipeRun, rod, tint } from './build.js';
import { H } from './power.js';
import { createSurroundings } from './surroundings.js';
import { TANK } from './tank.js';
import {
  brickTexture,
  canvasTexture,
  cementTexture,
  doorTexture,
  frontWallTexture,
  plasterTexture,
  seeded,
  wheelTexture,
  windowAtlas,
} from './textures.js';

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
const WINDOWS = [0, 4.2, -6.2];
const PIPE_R = 0.027;
const WIRE_Y = 2.5; // the service wire along the top of the wall
const METER = new THREE.Vector3(3.0, 1.92, 0); // the meter box's centre on the wall
const BOARD = new THREE.Vector3(1.15, 1.32, 0); // the pump switch board's centre
const JUNCTION_Y = 0.62; // the conduit's run along the bottom of the wall, over the plinth band

/**
 * @param {{ pumps: { small: any, big: any }, tanks: { small: any, big: any } }} parts placed pumps and tanks
 */
export function createScene({ pumps, tanks }) {
  const root = new THREE.Group();
  root.name = 'HouseAndCourtyard';
  const decor = createSurroundings(); // far things and props: not exported
  const near = new THREE.Group(); // props by the house: not exported either
  near.name = 'Props';
  near.userData.noExport = true;

  const white = new THREE.MeshStandardMaterial({ color: '#f5f2ea', roughness: 0.82 });
  const offWhite = new THREE.MeshStandardMaterial({ color: '#e7e1d4', roughness: 0.88 });
  const iron = new THREE.MeshStandardMaterial({ color: '#2d3136', metalness: 0.55, roughness: 0.45 });
  const teak = new THREE.MeshStandardMaterial({ color: '#5e321b', roughness: 0.6 });
  const greyPvc = new THREE.MeshStandardMaterial({ color: '#8d969d', roughness: 0.5 });
  const black = new THREE.MeshStandardMaterial({ color: '#1d1f22', roughness: 0.55 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c99a3c', metalness: 0.85, roughness: 0.3 });
  const steel = new THREE.MeshStandardMaterial({ color: '#c3c9ce', metalness: 0.85, roughness: 0.28 });

  // ── the ground: the brick courtyard, a cement apron along the wall ───────────
  const bricks = brickTexture();
  bricks.repeat.set(16 / 1.2, 9 / 1.2);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshStandardMaterial({ map: bricks, roughness: 0.9 }));
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(0, 0, 4.5);
  yard.name = 'Courtyard';
  root.add(yard);
  const apronTex = cementTexture('#c4bdb1', 4);
  apronTex.repeat.set(14.4 / 1.5, 1);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.03, 0.42), new THREE.MeshStandardMaterial({ map: apronTex, roughness: 0.9 }));
  apron.position.set(0, 0.015, 0.21);
  apron.name = 'Apron';
  root.add(apron);
  // wet patches round the hatch and the tubewell, darker bricks
  const wetTex = canvasTexture(
    128,
    128,
    (ctx, w) => {
      const rand = seeded(71);
      for (let i = 0; i < 9; i++) {
        const x = 30 + rand() * 68;
        const y = 30 + rand() * 68;
        const r = 18 + rand() * 26;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(40,18,8,0.5)');
        g.addColorStop(1, 'rgba(40,18,8,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, w);
      }
    },
    false,
  );
  const wetMat = new THREE.MeshStandardMaterial({
    map: wetTex,
    transparent: true,
    depthWrite: false,
    roughness: 0.25,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  for (const [x, z, s] of [
    [0.15, 1.15, 1.3],
    [-0.9, 0.95, 0.7],
    [5.0, 2.7, 1.6],
  ]) {
    const wet = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.8), wetMat);
    wet.rotation.x = -Math.PI / 2;
    wet.position.set(x, 0.003, z);
    near.add(wet);
  }

  // ── the house ─────────────────────────────────────────────────────────────
  const house = new THREE.Group();
  house.name = 'House';
  root.add(house);
  const W = HOUSE.x1 - HOUSE.x0;
  const wallH = ROOF - 0.16;
  const front = frontWallTexture({ x0: HOUSE.x0, x1: HOUSE.x1, height: wallH, windows: WINDOWS, door: LAYOUT.door, spouts: [-5.5, 5.5] });
  const frontMat = new THREE.MeshStandardMaterial({ map: front, roughness: 0.88 });
  const sideTex = plasterTexture('#e6b356', 19);
  sideTex.repeat.set(HOUSE.depth / 3, wallH / 3);
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, HOUSE.depth), [sideMat, sideMat, white, white, frontMat, sideMat]);
  block.position.set((HOUSE.x0 + HOUSE.x1) / 2, wallH / 2, -HOUSE.depth / 2);
  house.add(block);
  const plinthMat = new THREE.MeshStandardMaterial({ map: plasterTexture('#8b3a2e', 27), roughness: 0.85 });
  const plinthBand = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.42, 0.06), plinthMat);
  plinthBand.position.set(block.position.x, 0.21, 0.03);
  house.add(plinthBand);
  const plinthLip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, 0.03, 0.08), offWhite);
  plinthLip.position.set(block.position.x, 0.435, 0.04);
  house.add(plinthLip);
  // the roof slab (its top in cement), the parapet and its cap
  const roofTex = cementTexture('#c9c2b5', 8);
  roofTex.repeat.set((W + 0.24) / 2.5, (HOUSE.depth + 0.24) / 2.5);
  const roofTop = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.92 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.24, 0.18, HOUSE.depth + 0.24), [white, white, roofTop, white, white, white]);
  slab.position.set(block.position.x, ROOF - 0.09, -HOUSE.depth / 2);
  house.add(slab);
  const slabDrip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.28, 0.025, 0.03), offWhite);
  slabDrip.position.set(block.position.x, ROOF - 0.19, 0.12);
  house.add(slabDrip);
  // a low parapet only (no railing), so the tanks on the roof's front edge show whole; round the whole roof
  const parTex = plasterTexture('#efc062', 33);
  parTex.repeat.set(W / 3, 0.1);
  const parMat = new THREE.MeshStandardMaterial({ map: parTex, roughness: 0.88 });
  const par = parts();
  const capP = parts();
  const zc = -HOUSE.depth / 2;
  for (const [w, d, x, z] of [
    [W + 0.24, 0.16, block.position.x, 0.04],
    [W + 0.24, 0.16, block.position.x, -HOUSE.depth - 0.04],
    [0.16, HOUSE.depth, HOUSE.x0 - 0.04, zc],
    [0.16, HOUSE.depth, HOUSE.x1 + 0.04, zc],
  ]) {
    par.add(new THREE.BoxGeometry(w, 0.16, d), x, ROOF + 0.08, z);
    capP.add(new THREE.BoxGeometry(w + 0.06, 0.04, d + 0.06), x, ROOF + 0.18, z);
  }
  house.add(par.mesh(parMat, 'Parapet'), capP.mesh(white, 'ParapetCap'));

  // rain spouts through the parapet, downpipes at the corners
  const rain = parts();
  for (const x of [-5.5, 5.5]) rain.push(rod(new THREE.Vector3(x, ROOF + 0.04, -0.05), new THREE.Vector3(x, ROOF - 0.02, 0.32), 0.035, 12));
  for (const x of [HOUSE.x0 + 0.12, HOUSE.x1 - 0.12]) {
    rain.push(rod(new THREE.Vector3(x, ROOF + 0.05, 0.1), new THREE.Vector3(x, 0.18, 0.1), 0.04, 14));
    rain.push(rod(new THREE.Vector3(x, 0.18, 0.1), new THREE.Vector3(x, 0.06, 0.28), 0.04, 14));
    for (let y = 0.6; y < ROOF; y += 0.7) rain.add(new THREE.TorusGeometry(0.045, 0.008, 6, 16), x, y, 0.1, Math.PI / 2);
  }
  house.add(rain.mesh(greyPvc, 'RainPipes'));

  // ── windows: casements behind glass, an iron grill, a surround, a sill and a sunshade ──
  // the three windows and the stair room's drawn in one texture (one material for all of them)
  const windows = windowAtlas([0, 1, 2, 4]);
  const windowMat = new THREE.MeshStandardMaterial({ name: 'Windows', map: windows.texture, roughness: 0.35, metalness: 0.1 });
  WINDOWS.forEach((wx, i) => {
    const win = new THREE.Mesh(windows.uv(i, new THREE.PlaneGeometry(1.2, 1.2)), windowMat);
    win.position.set(wx, 1.45, 0.006);
    house.add(win);
    const surround = parts();
    surround.add(new THREE.BoxGeometry(1.44, 0.1, 0.05), wx, 2.1, 0.025); // the lintel band
    for (const sx of [-1, 1]) surround.add(new THREE.BoxGeometry(0.1, 1.3, 0.05), wx + sx * 0.67, 1.45, 0.025);
    surround.add(new THREE.BoxGeometry(1.56, 0.07, 0.17), wx, 0.8, 0.075); // the sill
    surround.add(new THREE.BoxGeometry(1.6, 0.07, 0.44), wx, 2.25, 0.22, 0.08); // the sunshade
    surround.add(new THREE.BoxGeometry(1.6, 0.11, 0.03), wx, 2.2, 0.43); // its front lip
    house.add(surround.mesh(white, 'WindowSurround'));
    // the grill: flat bars, two rails, a row of arches along the top rail
    const grill = parts();
    const gz = 0.05;
    for (const [w, h, x, y] of [
      [1.24, 0.03, 0, 0.6],
      [1.24, 0.03, 0, -0.6],
      [0.03, 1.24, -0.6, 0],
      [0.03, 1.24, 0.6, 0],
      [1.2, 0.02, 0, 0.3],
      [1.2, 0.02, 0, -0.25],
    ])
      grill.add(new THREE.BoxGeometry(w, h, 0.016), wx + x, 1.45 + y, gz);
    for (let x = -0.5; x <= 0.51; x += 0.1) grill.add(new THREE.BoxGeometry(0.014, 1.2, 0.012), wx + x, 1.45, gz);
    for (let k = 0; k < 6; k++) grill.add(new THREE.TorusGeometry(0.1, 0.007, 6, 18, Math.PI), wx - 0.5 + k * 0.2, 1.45 + 0.31, gz);
    house.add(grill.mesh(iron, 'WindowGrill'));
  });

  // ── the door: teak leaves in a teak frame, a plaster surround, steps, a mat, sandals ──
  const { door } = LAYOUT;
  const doorMesh = new THREE.Mesh(new THREE.PlaneGeometry(door.w, door.h), new THREE.MeshStandardMaterial({ map: doorTexture(), roughness: 0.6 }));
  doorMesh.position.set(door.x, door.h / 2 + 0.1, 0.012);
  house.add(doorMesh);
  const frame = parts();
  frame.add(new THREE.BoxGeometry(door.w + 0.16, 0.08, 0.07), door.x, door.h + 0.14, 0.035);
  for (const sx of [-1, 1]) frame.add(new THREE.BoxGeometry(0.08, door.h + 0.08, 0.07), door.x + sx * (door.w / 2 + 0.04), door.h / 2 + 0.1, 0.035);
  house.add(frame.mesh(teak, 'DoorFrame'));
  const dSurround = parts();
  dSurround.add(new THREE.BoxGeometry(door.w + 0.4, 0.1, 0.04), door.x, door.h + 0.23, 0.02);
  for (const sx of [-1, 1]) dSurround.add(new THREE.BoxGeometry(0.12, door.h + 0.2, 0.04), door.x + sx * (door.w / 2 + 0.14), door.h / 2 + 0.1, 0.02);
  house.add(dSurround.mesh(white, 'DoorSurround'));
  const stone = new THREE.MeshStandardMaterial({ map: cementTexture('#bdb4a6', 12), roughness: 0.55 });
  const steps = parts();
  steps.add(new THREE.BoxGeometry(door.w + 0.6, 0.1, 0.62), door.x, 0.05, 0.31);
  steps.add(new THREE.BoxGeometry(door.w + 0.3, 0.1, 0.34), door.x, 0.15, 0.17);
  const stepMesh = steps.mesh(stone, 'DoorSteps');
  house.add(stepMesh);
  const matTex = canvasTexture(
    64,
    32,
    (ctx, w, h) => {
      for (let x = 0; x < w; x += 4) {
        ctx.fillStyle = (x / 4) % 4 < 2 ? '#c49a58' : (x / 4) % 8 < 4 ? '#8a5a2b' : '#b33a2a';
        ctx.fillRect(x, 0, 4, h);
      }
    },
    false,
  );
  const doormat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.012, 0.42), new THREE.MeshStandardMaterial({ map: matTex, roughness: 1 }));
  doormat.position.set(door.x, 0.106, 0.43);
  near.add(doormat);
  const sandals = parts();
  for (const [x, z, r] of [
    [-0.28, 0.5, 0.2],
    [-0.16, 0.52, -0.1],
    [0.22, 0.46, 0.3],
    [0.33, 0.5, 0.05],
  ])
    sandals.add(new THREE.BoxGeometry(0.1, 0.02, 0.25), door.x + x, 0.11 + 0.01, z, 0, r);
  near.add(sandals.mesh(new THREE.MeshStandardMaterial({ color: '#4b2e2a', roughness: 0.8 }), 'Sandals'));
  // a brass nameplate and the bell switch beside the door
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.012), brass);
  plate.position.set(door.x + 0.82, 1.62, 0.006);
  house.add(plate);
  const bell = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.02), white);
  bell.position.set(door.x + 0.72, 1.32, 0.01);
  house.add(bell);
  const bellBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.01, 12),
    new THREE.MeshStandardMaterial({ color: '#c92a2a', roughness: 0.4 }),
  );
  bellBtn.rotation.x = Math.PI / 2;
  bellBtn.position.set(door.x + 0.72, 1.32, 0.022);
  house.add(bellBtn);

  // ── the bulb over the door ────────────────────────────────────────────────
  const bulbGroup = new THREE.Group();
  bulbGroup.name = 'Bulb100W';
  bulbGroup.position.copy(LAYOUT.bulb);
  house.add(bulbGroup);
  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 10), iron);
  bracket.rotation.x = Math.PI / 2;
  bracket.position.set(0, 0.12, -0.1);
  bulbGroup.add(bracket);
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.07, 16), black);
  holder.position.set(0, 0.085, 0);
  bulbGroup.add(holder);
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#f1efe8', metalness: 0.2, roughness: 0.35, side: THREE.DoubleSide });
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.08, 28, 1, true), shadeMat);
  lampShade.position.set(0, 0.1, 0);
  bulbGroup.add(lampShade);
  const glassOff = { color: new THREE.Color('#e9edf1'), emissive: new THREE.Color('#000000') };
  const glass = new THREE.MeshStandardMaterial({ color: '#e9edf1', roughness: 0.15, transparent: true, opacity: 0.9, emissive: '#000000' });
  const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 18), glass);
  bulbMesh.scale.y = 1.18;
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
  let bulbOn = null;
  function setBulb(on) {
    if (on === bulbOn) return;
    bulbOn = on;
    glass.emissive.set(on ? '#ffd27a' : glassOff.emissive);
    glass.emissiveIntensity = on ? 2.2 : 1; // (1 with a black emissive: no glow, and a clean export)
    glass.color.set(on ? '#fff6dc' : glassOff.color);
    glow.visible = on;
    bulbLight.intensity = on ? 2.4 : 0; // a warm pool on the wall and the door, in daylight (not a floodlight)
  }

  // ── the hatch of the underground tank ─────────────────────────────────────
  const { hatch } = LAYOUT;
  const concrete = new THREE.MeshStandardMaterial({ map: cementTexture('#bdb5a8', 21), roughness: 0.9 });
  const rimW = 0.09;
  const rim = parts();
  for (const [w, d, x, z] of [
    [hatch.w + 2 * rimW, rimW, 0, -(hatch.d + rimW) / 2],
    [hatch.w + 2 * rimW, rimW, 0, (hatch.d + rimW) / 2],
    [rimW, hatch.d, -(hatch.w + rimW) / 2, 0],
    [rimW, hatch.d, (hatch.w + rimW) / 2, 0],
  ])
    rim.add(new THREE.BoxGeometry(w, 0.07, d), hatch.x + x, 0.035, LAYOUT.pumpZ + z);
  root.add(rim.mesh(concrete, 'HatchRim'));
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
  const lidMat = new THREE.MeshStandardMaterial({ color: '#59616a', metalness: 0.6, roughness: 0.45 });
  const lid = new THREE.Group();
  lid.position.set(hatch.x, 0.075, LAYOUT.pumpZ - hatch.d / 2 - rimW - 0.01);
  lid.rotation.x = -1.25;
  const lidPlate = new THREE.Mesh(new THREE.BoxGeometry(hatch.w + 0.1, 0.03, hatch.d + 0.1), lidMat);
  lidPlate.position.z = (hatch.d + 0.1) / 2;
  lid.add(lidPlate);
  const lidRibs = parts();
  for (let k = -2; k <= 2; k++) lidRibs.add(new THREE.BoxGeometry(0.02, 0.012, hatch.d), k * 0.15, 0.02, (hatch.d + 0.1) / 2);
  lidRibs.add(new THREE.TorusGeometry(0.04, 0.008, 6, 14, Math.PI), 0, 0.016, hatch.d + 0.02, Math.PI / 2);
  lid.add(lidRibs.mesh(lidMat, 'LidRibs'));
  root.add(lid);

  // ── the plumbing: suction from the hatch, delivery up the wall into each tank ──
  const pvc = new THREE.MeshStandardMaterial({ color: '#eef0f1', roughness: 0.42 });
  const fitting = new THREE.MeshStandardMaterial({ color: '#d9dcde', roughness: 0.5 });
  const clampMat = new THREE.MeshStandardMaterial({ color: '#9aa2a8', metalness: 0.7, roughness: 0.35 });
  const valveWheel = new THREE.MeshStandardMaterial({ color: '#25282c', metalness: 0.3, roughness: 0.5 });
  const PIPE_TOP = ROOF + TANK.FLOOR + TANK.BODY + 0.3; // over the tank's dome
  const clamps = parts();
  const valves = parts();
  const wheels = parts();
  const posts = parts();
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
      PIPE_R,
    );
    delivery.name = `DeliveryPipe_${id}`;
    root.add(delivery);
    // a brass gate valve on the riser, its wheel facing out
    const vy = out.y + 0.6;
    valves.add(new THREE.CylinderGeometry(0.042, 0.042, 0.12, 16), xs, vy, pipeZ);
    valves.add(new THREE.CylinderGeometry(0.024, 0.03, 0.08, 12), xs, vy, pipeZ + 0.06, Math.PI / 2);
    valves.add(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 8), xs, vy, pipeZ + 0.12, Math.PI / 2);
    wheels.add(new THREE.TorusGeometry(0.045, 0.008, 8, 20), xs, vy, pipeZ + 0.14);
    wheels.add(new THREE.BoxGeometry(0.09, 0.008, 0.006), xs, vy, pipeZ + 0.14);
    wheels.add(new THREE.BoxGeometry(0.008, 0.09, 0.006), xs, vy, pipeZ + 0.14);
    // a small post under the run across the courtyard
    const postZ = (out.z + pipeZ) / 2;
    posts.add(new THREE.BoxGeometry(0.14, out.y + 0.16 - PIPE_R, 0.14), x, (out.y + 0.16 - PIPE_R) / 2, postZ);
    for (let y = 0.85; y < ROOF; y += 0.8) {
      if (Math.abs(y - vy) < 0.15) continue;
      clamps.add(new THREE.TorusGeometry(PIPE_R + 0.006, 0.006, 6, 16), xs, y, pipeZ, Math.PI / 2);
      clamps.add(new THREE.BoxGeometry(0.12, 0.02, 0.012), xs, y, 0.012);
    }
    // suction: from the pump's front port to the hatch and down into the water
    const toward = Math.sign(hatch.x - inl.x);
    const sx = hatch.x - toward * 0.17;
    const suction = pipeRun([inl, new THREE.Vector3(sx, inl.y, inl.z), new THREE.Vector3(sx, -0.25, inl.z)], pvc, fitting, PIPE_R);
    suction.name = `SuctionPipe_${id}`;
    root.add(suction);
  }
  root.add(
    clamps.mesh(clampMat, 'PipeClamps'),
    valves.mesh(brass, 'GateValves'),
    wheels.mesh(valveWheel, 'ValveWheels'),
    posts.mesh(concrete, 'PipePosts'),
  );

  // ── the electrics: service wire → meter → switch board → each pump ─────────
  const elec = new THREE.Group();
  elec.name = 'Electrics';
  root.add(elec);
  const boxMat = new THREE.MeshStandardMaterial({ color: '#dfe2e4', roughness: 0.6 });
  const conduit = parts();
  const cables = parts();
  const clips = parts();
  // the service wire from the lane comes in at the right corner and runs along the top of the wall to the meter
  const corner = new THREE.Vector3(HOUSE.x1 + 0.02, WIRE_Y, 0.02);
  const drop = new THREE.Mesh(
    cable([new THREE.Vector3(10.6, 7.75, -1.2), new THREE.Vector3(9.4, 4.7, -0.6), new THREE.Vector3(8, 3.2, -0.15), corner], 0.009),
    black,
  );
  drop.name = 'ServiceDrop'; // from the pole: in the picture, not in the model
  near.add(drop);
  cables.push(
    cable(
      [
        corner,
        new THREE.Vector3(METER.x + 0.6, WIRE_Y, 0.02),
        new THREE.Vector3(METER.x + 0.12, WIRE_Y - 0.03, 0.02),
        new THREE.Vector3(METER.x + 0.08, METER.y + 0.26, 0.03),
      ],
      0.008,
    ),
  );
  for (let x = METER.x + 0.5; x < HOUSE.x1; x += 0.55) clips.add(new THREE.BoxGeometry(0.03, 0.03, 0.02), x, WIRE_Y, 0.02);
  // the meter: a grey box with a window on the dial and a main switch below
  const meterBox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.11), boxMat);
  meterBox.position.set(METER.x, METER.y, 0.055);
  elec.add(meterBox);
  const meterFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.17, 0.12),
    new THREE.MeshStandardMaterial({
      map: canvasTexture(
        64,
        48,
        (ctx, w, h) => {
          ctx.fillStyle = '#1b2a33';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#9fe3c9';
          ctx.fillRect(8, 10, w - 16, 14);
          ctx.fillStyle = '#e03131';
          ctx.fillRect(10, 32, 6, 6);
          ctx.fillStyle = '#c1c7cd';
          for (let i = 0; i < 6; i++) ctx.fillRect(22 + i * 6, 32, 4, 6);
        },
        false,
      ),
      roughness: 0.2,
    }),
  );
  meterFace.position.set(METER.x, METER.y + 0.06, 0.111);
  elec.add(meterFace);
  const mainSw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.08), black);
  mainSw.position.set(METER.x, METER.y - 0.3, 0.04);
  elec.add(mainSw);
  conduit.push(rod(new THREE.Vector3(METER.x, METER.y - 0.17, 0.03), new THREE.Vector3(METER.x, METER.y - 0.24, 0.03), 0.012, 8));
  // conduit from the main switch to the pump switch board (behind the big pump's riser)
  const run = [
    new THREE.Vector3(METER.x - 0.07, METER.y - 0.3, 0.02),
    new THREE.Vector3(BOARD.x, METER.y - 0.3, 0.02),
    new THREE.Vector3(BOARD.x, BOARD.y + 0.13, 0.02),
  ];
  for (let i = 0; i < run.length - 1; i++) conduit.push(rod(run[i], run[i + 1], 0.011, 8));
  conduit.add(new THREE.SphereGeometry(0.014, 8, 6), BOARD.x, METER.y - 0.3, 0.02);
  // the pump switch board: a switch and a lamp for each pump (left: small, right: big)
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.04), new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.5 }));
  board.position.set(BOARD.x, BOARD.y, 0.02);
  elec.add(board);
  const rockers = {};
  const lamps = {};
  const lampMeshes = [];
  for (const [id, dx] of /** @type {const} */ ([
    ['small', -0.07],
    ['big', 0.07],
  ])) {
    const plateM = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.008), boxMat);
    plateM.position.set(BOARD.x + dx, BOARD.y - 0.025, 0.044);
    elec.add(plateM);
    const rocker = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.012), black);
    rocker.position.set(BOARD.x + dx, BOARD.y - 0.025, 0.052);
    elec.add(rocker);
    rockers[id] = rocker;
    const lampMat = new THREE.MeshStandardMaterial({ color: '#7a2a20', emissive: '#000000', roughness: 0.3 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8), lampMat);
    lamp.position.set(BOARD.x + dx, BOARD.y + 0.065, 0.044);
    elec.add(lamp);
    lamps[id] = lampMat;
    lampMeshes.push(lamp);
  }
  // from the board down to the bottom of the wall, along it to each pump, a junction box, a flexible cable
  conduit.push(rod(new THREE.Vector3(BOARD.x, BOARD.y - 0.11, 0.02), new THREE.Vector3(BOARD.x, JUNCTION_Y, 0.02), 0.011, 8));
  conduit.push(rod(new THREE.Vector3(pumps.small.root.position.x, JUNCTION_Y, 0.02), new THREE.Vector3(BOARD.x, JUNCTION_Y, 0.02), 0.011, 8));
  conduit.add(new THREE.SphereGeometry(0.014, 8, 6), BOARD.x, JUNCTION_Y, 0.02);
  const pvcBlack = new THREE.MeshStandardMaterial({ color: '#202225', roughness: 0.45 });
  for (const id of /** @type {const} */ (['small', 'big'])) {
    const pump = pumps[id];
    const jx = pump.root.position.x + (id === 'big' ? 0.22 : -0.1);
    const jb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), boxMat);
    jb.position.set(jx, JUNCTION_Y, 0.03);
    elec.add(jb);
    if (id === 'big') conduit.push(rod(new THREE.Vector3(BOARD.x, JUNCTION_Y, 0.02), new THREE.Vector3(jx, JUNCTION_Y, 0.02), 0.011, 8));
    const g = pump.root.localToWorld(pump.cableIn.clone());
    const pz = LAYOUT.pumpZ - 0.27;
    cables.push(
      cable(
        [
          new THREE.Vector3(jx, JUNCTION_Y - 0.05, 0.04),
          new THREE.Vector3(jx, 0.47, 0.1),
          new THREE.Vector3(jx + (g.x - jx) * 0.3, 0.05, 0.2),
          new THREE.Vector3(g.x + 0.05, 0.03, pz),
          new THREE.Vector3(g.x, 0.12, pz + 0.04),
          new THREE.Vector3(g.x, g.y, g.z - 0.06),
          g,
        ],
        0.008,
      ),
    );
  }
  for (let x = METER.x - 0.4; x > BOARD.x + 0.1; x -= 0.45) clips.add(new THREE.BoxGeometry(0.035, 0.035, 0.015), x, METER.y - 0.3, 0.02);
  elec.add(conduit.mesh(new THREE.MeshStandardMaterial({ color: '#e9ebe8', roughness: 0.5 }), 'Conduit'));
  elec.add(cables.mesh(pvcBlack, 'Cables'));
  elec.add(clips.mesh(boxMat, 'Clips'));
  const switched = {};
  function switches(id, on) {
    if (switched[id] === on) return;
    switched[id] = on;
    rockers[id].rotation.x = on ? -0.3 : 0.3;
    lamps[id].emissive.set(on ? '#ff4d2e' : '#000000');
    lamps[id].emissiveIntensity = on ? 2 : 1;
    lamps[id].color.set(on ? '#ff8a6a' : '#7a2a20');
  }
  switches('small', false);
  switches('big', false);

  // ── on the roof: the stair room ─────────────────────────────────────────
  const stair = new THREE.Group();
  stair.name = 'StairRoom';
  stair.userData.noExport = true;
  stair.position.set(5.9, ROOF, -5.9);
  const stairTex = plasterTexture('#efc062', 37);
  stairTex.repeat.set(1, 1);
  const stairMat = new THREE.MeshStandardMaterial({ map: stairTex, roughness: 0.9 });
  const room = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.1, 2.4), stairMat);
  room.position.y = 1.05;
  stair.add(room);
  const sRoof = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.12, 2.7), white);
  sRoof.position.y = 2.16;
  stair.add(sRoof);
  const sDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.9, 0.04),
    new THREE.MeshStandardMaterial({ color: '#9aa6b2', metalness: 0.4, roughness: 0.45 }),
  );
  sDoor.position.set(-0.5, 0.9, 1.21);
  stair.add(sDoor);
  const sWin = new THREE.Mesh(windows.uv(3, new THREE.PlaneGeometry(0.5, 0.5)), windowMat);
  sWin.position.set(0.55, 1.3, 1.205);
  stair.add(sWin);
  const dishMat = new THREE.MeshStandardMaterial({ color: '#e9ecef', roughness: 0.4, side: THREE.DoubleSide });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 10, 0, Math.PI * 2, 0, 0.6), dishMat);
  dish.position.set(0.6, 2.55, 0.2);
  dish.rotation.x = 1.1;
  stair.add(dish);
  const dishPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), iron);
  dishPole.position.set(0.6, 2.42, 0.05);
  stair.add(dishPole);
  near.add(stair);
  // a clothes line across the courtyard's right side: from a hook on the wall to a bamboo pole
  const line = new THREE.Group();
  line.name = 'ClothesLine';
  const lx = 7.45;
  const lz0 = 0.03;
  const lz1 = 4.4;
  const ly = 1.9;
  const linePoles = parts();
  linePoles.add(new THREE.CylinderGeometry(0.035, 0.045, 2.1, 8), lx, 1.05, lz1);
  linePoles.push(cable([new THREE.Vector3(lx, ly, lz0), new THREE.Vector3(lx, ly - 0.14, (lz0 + lz1) / 2), new THREE.Vector3(lx, ly, lz1)], 0.006));
  line.add(linePoles.mesh(new THREE.MeshStandardMaterial({ color: '#b08d57', roughness: 0.8 }), 'LinePole'));
  const clothes = [
    ['#c2255c', 1.0, 1.0], // a sari's end
    ['#f59f00', 0.45, 0.6], // a towel
    ['#3b5bdb', 0.55, 0.8], // a lungi
    ['#f8f9fa', 0.45, 0.55], // a shirt
    ['#e8590c', 0.4, 0.5],
  ];
  let cz = lz0 + 0.5;
  const clothMat = new THREE.MeshStandardMaterial({ name: 'Washing', roughness: 0.85, side: THREE.DoubleSide, vertexColors: true });
  for (const [c, w, h] of clothes) {
    const cloth = new THREE.Mesh(tint(new THREE.PlaneGeometry(w, h, 4, 1), c), clothMat);
    const t = (cz + w / 2 - lz0) / (lz1 - lz0);
    cloth.position.set(lx, ly - 0.14 * Math.sin(Math.PI * t) - h / 2 - 0.01, cz + w / 2);
    cloth.rotation.y = Math.PI / 2 + 0.12 * Math.sin(cz * 3);
    line.add(cloth);
    cz += w + 0.06;
  }
  near.add(line);

  // ── props in the courtyard: flower pots, the tubewell, a bicycle ──────────
  // pots, leaves and flowers painted, one mesh for all of them
  const flowerColors = { marigold: '#f08c00', bougainvillea: '#d6336c', hibiscus: '#e03131', white: '#fff4e6' };
  const pots = parts('#b5522f');
  const leaves = parts('#35562a');
  /** @type {Record<string, ReturnType<typeof parts>>} */
  const flowers = Object.fromEntries(Object.entries(flowerColors).map(([k, c]) => [k, parts(c)]));
  const rand = seeded(23);
  for (const [px, pz, s, kind] of /** @type {const} */ ([
    [-5.05, 0.5, 1, 'bougainvillea'],
    [-3.05, 0.55, 0.85, 'marigold'],
    [2.75, 0.55, 0.9, 'hibiscus'],
    [3.35, 0.5, 0.7, 'marigold'],
    [6.4, 0.55, 1.1, 'bougainvillea'],
  ])) {
    pots.add(new THREE.CylinderGeometry(0.17 * s, 0.12 * s, 0.28 * s, 18), px, 0.14 * s, pz);
    pots.add(new THREE.TorusGeometry(0.17 * s, 0.02 * s, 6, 18), px, 0.28 * s, pz, Math.PI / 2);
    for (let i = 0; i < 9; i++)
      leaves.add(
        new THREE.IcosahedronGeometry(0.07 * s, 0),
        px + (rand() - 0.5) * 0.26 * s,
        0.32 * s + rand() * 0.2 * s,
        pz + (rand() - 0.5) * 0.24 * s,
        rand(),
        rand(),
        0,
      );
    for (let i = 0; i < 12; i++) {
      const k = i % 5 === 4 ? 'white' : kind;
      flowers[k].add(
        new THREE.IcosahedronGeometry((kind === 'marigold' ? 0.045 : 0.035) * s, 1),
        px + (rand() - 0.5) * 0.3 * s,
        0.38 * s + rand() * 0.18 * s,
        pz + 0.04 + (rand() - 0.4) * 0.22 * s,
      );
    }
  }
  near.add(merged([pots, leaves, ...Object.values(flowers)], new THREE.MeshStandardMaterial({ name: 'FlowerPots', roughness: 0.75 }), 'FlowerPots'));

  // the tubewell on its platform, a bucket and an aluminium pitcher under the spout
  const tw = new THREE.Group();
  tw.name = 'Tubewell';
  tw.position.set(5.2, 0, 2.6);
  tw.rotation.y = -0.5;
  const plat = parts();
  plat.add(new THREE.BoxGeometry(1.1, 0.1, 0.9), 0, 0.05, 0);
  plat.add(new THREE.BoxGeometry(1.1, 0.06, 0.06), 0, 0.13, -0.42);
  plat.add(new THREE.BoxGeometry(0.06, 0.06, 0.9), -0.52, 0.13, 0);
  plat.add(new THREE.BoxGeometry(0.06, 0.06, 0.9), 0.52, 0.13, 0);
  tw.add(plat.mesh(concrete, 'Platform'));
  const castIron = new THREE.MeshStandardMaterial({ color: '#3b4046', metalness: 0.5, roughness: 0.5 });
  const pumpBody = parts();
  pumpBody.add(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 16), -0.25, 0.35, -0.2);
  pumpBody.add(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 16), -0.25, 0.75, -0.2);
  pumpBody.add(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16), -0.25, 0.91, -0.2);
  pumpBody.push(rod(new THREE.Vector3(-0.25, 0.68, -0.15), new THREE.Vector3(-0.25, 0.62, 0.12), 0.03, 10)); // the spout
  pumpBody.push(rod(new THREE.Vector3(-0.25, 0.93, -0.24), new THREE.Vector3(-0.25, 1.12, -0.85), 0.018, 8)); // the handle
  tw.add(pumpBody.mesh(castIron, 'TubewellPump'));
  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.11, 0.26, 20, 1, true),
    new THREE.MeshStandardMaterial({ color: '#f2a20c', roughness: 0.5, side: THREE.DoubleSide }),
  );
  bucket.position.set(-0.22, 0.23, 0.2);
  tw.add(bucket);
  const bucketWater = new THREE.Mesh(new THREE.CircleGeometry(0.14, 20), new THREE.MeshStandardMaterial({ color: '#4b93c9', roughness: 0.1 }));
  bucketWater.rotation.x = -Math.PI / 2;
  bucketWater.position.set(-0.22, 0.32, 0.2);
  tw.add(bucketWater);
  const pitcherPts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const r = 0.04 + 0.11 * Math.sin(Math.PI * Math.min(1, t * 1.25)) + (t > 0.85 ? (t - 0.85) * 0.4 : 0);
    pitcherPts.push(new THREE.Vector2(Math.max(0.03, r), t * 0.32));
  }
  const pitcher = new THREE.Mesh(new THREE.LatheGeometry(pitcherPts, 24), steel);
  pitcher.position.set(0.25, 0.1, 0.05);
  tw.add(pitcher);
  near.add(tw);

  // a bicycle leaning on the wall by the left window
  const bike = new THREE.Group();
  bike.name = 'Bicycle';
  bike.position.set(-6.15, 0, 0.42);
  bike.rotation.z = -0.06;
  const wheelMat = new THREE.MeshStandardMaterial({
    map: wheelTexture(),
    transparent: true,
    alphaTest: 0.3,
    side: THREE.DoubleSide,
    metalness: 0.6,
    roughness: 0.35,
  });
  const tyres = parts();
  const frameP = parts();
  const WR = 0.33;
  for (const x of [-0.52, 0.52]) {
    tyres.add(new THREE.TorusGeometry(WR, 0.022, 8, 32), x, WR + 0.02, 0);
    const spokes = new THREE.Mesh(new THREE.CircleGeometry(WR - 0.01, 32), wheelMat);
    spokes.position.set(x, WR + 0.02, 0);
    bike.add(spokes);
  }
  const P = (x, y) => new THREE.Vector3(x, y, 0);
  const seat = P(-0.18, 0.92);
  const head = P(0.36, 0.9);
  const crank = P(-0.02, 0.36);
  for (const [a, b] of [
    [P(-0.52, 0.35), crank],
    [P(-0.52, 0.35), P(-0.2, 0.86)],
    [crank, P(-0.2, 0.86)],
    [crank, P(0.34, 0.82)],
    [P(-0.2, 0.86), P(0.34, 0.86)],
    [P(0.34, 0.9), P(0.52, 0.35)],
    [head, P(0.36, 1.02)],
  ])
    frameP.push(rod(a, b, 0.016, 8));
  frameP.push(rod(new THREE.Vector3(0.36, 1.02, -0.26), new THREE.Vector3(0.36, 1.02, 0.26), 0.012, 8));
  frameP.push(rod(seat, P(-0.2, 0.86), 0.012, 8));
  frameP.push(rod(new THREE.Vector3(-0.68, 0.72, -0.1), new THREE.Vector3(-0.3, 0.72, -0.1), 0.01, 6)); // the carrier
  frameP.push(rod(new THREE.Vector3(-0.68, 0.72, 0.1), new THREE.Vector3(-0.3, 0.72, 0.1), 0.01, 6));
  frameP.push(rod(new THREE.Vector3(-0.68, 0.72, -0.1), new THREE.Vector3(-0.68, 0.72, 0.1), 0.01, 6));
  bike.add(
    tyres.mesh(black, 'Tyres'),
    frameP.mesh(new THREE.MeshStandardMaterial({ color: '#1b1d20', metalness: 0.6, roughness: 0.35 }), 'BikeFrame'),
  );
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.12), new THREE.MeshStandardMaterial({ color: '#5a2a1c', roughness: 0.6 }));
  saddle.position.copy(seat).add(new THREE.Vector3(0, 0.02, 0));
  bike.add(saddle);
  const basket = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.18, 0.3),
    new THREE.MeshStandardMaterial({ color: '#9aa1a8', metalness: 0.6, roughness: 0.4, wireframe: false }),
  );
  basket.position.set(0.5, 0.98, 0);
  bike.add(basket);
  near.add(bike);

  root.add(near, decor);

  // shadows: the house, the courtyard and the plumbing take them; only what throws a shadow that is seen casts one (the pumps' and pipes'
  // on the wall and the bricks, the grills' and sunshades' on the wall, the pots' and the bicycle's), not the flat
  // or far things (the walls' faces, the windows, the door, the stair room and the washing at the back)
  const flat = new Set([yard, apron, pit, shine, doormat]);
  const quietMats = new Set([frontMat, sideMat, windowMat, doorMesh.material, parMat, roofTop, plinthMat, meterFace.material, clothMat]);
  const quiet = (o) => isIn(o, stair) || isIn(o, line) || o.name === 'Sandals' || o === drop;
  root.traverse((o) => {
    const mesh = /** @type {THREE.Mesh} */ (o);
    if (!mesh.isMesh || isIn(o, decor)) return;
    const mat = /** @type {THREE.Material} */ (mesh.material);
    const mats = Array.isArray(mesh.material) ? mesh.material : [mat];
    // (soft VSM shadows draw every receiver into the shadow map too, so the props by the wall, which nothing
    // shades, do not take them; the ground under them does)
    mesh.receiveShadow = !isIn(o, near) || flat.has(mesh) || mat === wetMat;
    mesh.castShadow = !flat.has(mesh) && !mats.some((x) => x.transparent || quietMats.has(x)) && !quiet(o);
  });
  // the still parts in one mesh per material (a few hundred parts become a few dozen draw calls, every detail kept);
  // what moves or lights up stays apart: the bulb's glass, the switches' rockers and lamps
  bake(bulbGroup, { keep: [bulbMesh], name: 'Bulb' });
  bake(root, { keep: [bulbGroup, ...Object.values(rockers), ...lampMeshes], name: 'House' });
  bake(near, { name: 'Props' });
  return { root, decor, bulb: { group: bulbGroup, mesh: bulbMesh, hit: bulbHit, set: setBulb }, switches };
}

function isIn(o, group) {
  for (let a = o; a; a = a.parent) if (a === group) return true;
  return false;
}
