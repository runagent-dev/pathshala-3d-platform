// The courtyard well (metres; the courtyard is y = 0, x to the right, z towards the viewer): a round brick well with a
// low parapet and a cement cap, cut in half by the plane z = 0 so the shaft, the water and the bucket inside it can
// be seen (the cut faces show the brick courses and the layers of soil, like the book's "physical picture"). Over it
// stands a wooden frame (two sal posts and a beam) with an iron pulley hanging from the middle of the beam. Behind:
// a village yard of packed earth with a cement apron round the well, a house with a terracotta mud wall, blue doors
// and a corrugated tin roof, a haystack, clay pots, a bamboo fence and a deep blue sky. Everything is procedural
// (canvas textures, no files), so the figure works offline.
import * as THREE from 'three';

/** The well: inner and outer radius, the parapet's top, the water's surface and the floor of the cut. */
export const WELL = { rIn: 0.5, rOut: 0.72, top: 0.72, water: -1.0, floor: -1.75 };
/** The pulley: the centre of its axle (over the middle of the well) and the radius the rope wraps at. */
export const PULLEY = { x: 0, y: 1.98, z: 0, r: 0.12 };
/** The frame: its posts (x, z) and the beam's height. */
export const FRAME = { x: 0.95, z: -0.12, beam: 2.28 };

const rand = (() => {
  let seed = 7;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
})();

/** A canvas texture (sRGB) drawn by `draw(ctx, w, h)`. */
function canvasTexture(w, h, draw, { repeat = [1, 1], wrap = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (wrap) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  return tex;
}

/** Speckles of colour over a canvas (grain of earth, cement, plaster). */
function grain(ctx, w, h, n, colours, size = [1, 3]) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colours[Math.floor(rand() * colours.length)];
    const s = size[0] + rand() * (size[1] - size[0]);
    ctx.globalAlpha = 0.25 + rand() * 0.5;
    ctx.fillRect(rand() * w, rand() * h, s, s);
  }
  ctx.globalAlpha = 1;
}

/** Brick courses: rows of red bricks in mortar, each brick a slightly different red. 1 repeat = 8 courses × 2 bricks. */
function brickTexture({ dark = false } = {}) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = dark ? '#5e4a3c' : '#b9a58c';
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const bh = h / rows;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? w / 4 : 0;
      for (let k = -1; k < 3; k++) {
        const x = off + (k * w) / 2;
        const tone = rand();
        const base = dark ? [120 + tone * 30, 52 + tone * 18, 38 + tone * 10] : [176 + tone * 40, 70 + tone * 30, 46 + tone * 18];
        ctx.fillStyle = `rgb(${base.map(Math.round).join(',')})`;
        ctx.fillRect(x + 3, r * bh + 3, w / 2 - 6, bh - 6);
        // a little wear on each brick
        ctx.fillStyle = 'rgba(60,20,10,0.18)';
        ctx.fillRect(x + 3, r * bh + bh - 7, w / 2 - 6, 4);
        grain(ctx, w / 2 - 6, bh - 6, 30, ['rgba(255,220,190,0.5)', 'rgba(70,25,15,0.5)'], [1, 2.5]);
      }
    }
    if (dark) {
      // damp near the water: darker streaks running down
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = `rgba(${30 + rand() * 20},${40 + rand() * 25},${28 + rand() * 10},${0.15 + rand() * 0.25})`;
        ctx.fillRect(rand() * w, rand() * h * 0.6, 2 + rand() * 6, 40 + rand() * 120);
      }
    }
  });
}

/** The cut through the ground: layers of soil from the dark topsoil to the grey clay by the water, with pebbles. */
function soilTexture() {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      // the texture covers y = 0 (top) … WELL.floor (bottom); the bands are at real depths
      const depth = -WELL.floor;
      const band = (from, to, colour) => {
        ctx.fillStyle = colour;
        ctx.fillRect(0, (from / depth) * h, w, ((to - from) / depth) * h + 1);
      };
      band(0, 0.22, '#6b4426'); // topsoil
      band(0.22, 0.62, '#b5562b'); // red laterite
      band(0.62, 0.98, '#cf9a52'); // sand
      band(0.98, depth, '#7d7d86'); // clay by the water
      // wavy edges between the layers
      for (const [d, colour] of [
        [0.22, '#6b4426'],
        [0.62, '#b5562b'],
        [0.98, '#cf9a52'],
      ]) {
        ctx.fillStyle = colour;
        for (let x = 0; x < w; x += 6) {
          const y = (d / depth) * h + Math.sin(x * 0.05 + d * 9) * 4 + Math.sin(x * 0.013) * 5;
          ctx.fillRect(x, y - 3, 6, 6 + rand() * 4);
        }
      }
      grain(ctx, w, h, 5000, ['#3d2412', '#e2b074', '#8e3d1c', '#f0d4a0', '#4d4d55'], [1, 3]);
      // pebbles and a few roots near the top
      for (let i = 0; i < 160; i++) {
        const y = rand() * h;
        ctx.fillStyle = y / h < 0.65 ? `rgba(${200 + rand() * 40},${150 + rand() * 50},${100 + rand() * 40},0.8)` : 'rgba(170,170,178,0.8)';
        ctx.beginPath();
        ctx.ellipse(rand() * w, y, 2 + rand() * 4, 1.5 + rand() * 3, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(40,24,12,0.7)';
      for (let i = 0; i < 18; i++) {
        ctx.lineWidth = 0.8 + rand() * 1.4;
        ctx.beginPath();
        let x = rand() * w;
        let y = 0;
        ctx.moveTo(x, y);
        for (let k = 0; k < 6; k++) {
          x += (rand() - 0.5) * 24;
          y += 6 + rand() * 12;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    { wrap: true },
  );
}

/** Packed earth of the yard: warm ochre with darker patches, grit and a few swept arcs. */
function earthTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c98f55';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const g = ctx.createRadialGradient(rand() * w, rand() * h, 2, rand() * w, rand() * h, 40 + rand() * 90);
      g.addColorStop(0, rand() > 0.5 ? 'rgba(150,92,48,0.35)' : 'rgba(224,170,110,0.35)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    grain(ctx, w, h, 9000, ['#8d5a30', '#e8bf86', '#a86c3a', '#f3d6a6', '#6e4424'], [1, 2.6]);
    ctx.strokeStyle = 'rgba(120,74,38,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, 20 + rand() * 50, rand() * 6, rand() * 6 + 1.2);
      ctx.stroke();
    }
  });
}

/** Cement: warm grey-beige, grain, a few cracks; `wet` darkens a ring (water spilled round the well). */
function cementTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b6a996';
    ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, 3500, ['#8f8475', '#d3c8b6', '#9e9282', '#7b7064'], [1, 2.2]);
    ctx.strokeStyle = 'rgba(70,60,50,0.35)';
    for (let i = 0; i < 6; i++) {
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      let x = rand() * w;
      let y = rand() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 7; k++) {
        x += (rand() - 0.5) * 30;
        y += (rand() - 0.5) * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

/** Mud plaster on the house wall, in a terracotta wash with a darker plinth band. */
function plasterTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d9773f';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const g = ctx.createRadialGradient(rand() * w, rand() * h, 4, rand() * w, rand() * h, 30 + rand() * 70);
      g.addColorStop(0, rand() > 0.5 ? 'rgba(240,150,90,0.35)' : 'rgba(170,80,40,0.3)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    grain(ctx, w, h, 4000, ['#b85a2a', '#f0a070', '#9c4a22'], [1, 2]);
    // hand-smoothed strokes
    ctx.strokeStyle = 'rgba(255,190,140,0.18)';
    for (let i = 0; i < 50; i++) {
      ctx.lineWidth = 6 + rand() * 10;
      ctx.beginPath();
      const x = rand() * w;
      const y = rand() * h;
      ctx.arc(x, y, 30 + rand() * 40, rand() * 6, rand() * 6 + 0.8);
      ctx.stroke();
    }
  });
}

/** Corrugated tin: silver-blue ridges with rust streaks; u runs across the ridges. */
function tinTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    for (let x = 0; x < w; x++) {
      const k = 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 2 * 8);
      const v = Math.round(120 + 70 * k);
      ctx.fillStyle = `rgb(${v - 6},${v + 2},${v + 12})`;
      ctx.fillRect(x, 0, 1, h);
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${150 + rand() * 50},${70 + rand() * 30},${30},${0.15 + rand() * 0.3})`;
      ctx.fillRect(rand() * w, rand() * h * 0.3, 2 + rand() * 5, 30 + rand() * 140);
    }
  });
}

/** Wood grain along v (posts, beam, doors). */
function woodTexture(base = '#7a4a26', line = 'rgba(40,20,8,0.35)') {
  return canvasTexture(128, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = line;
    for (let i = 0; i < 26; i++) {
      ctx.lineWidth = 0.6 + rand() * 1.6;
      ctx.beginPath();
      let x = rand() * w;
      ctx.moveTo(x, 0);
      for (let y = 0; y <= h; y += 16) {
        x += (rand() - 0.5) * 3;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    grain(ctx, w, h, 900, ['rgba(255,210,160,0.4)', 'rgba(30,15,5,0.4)'], [1, 2]);
  });
}

export function createWell() {
  const root = new THREE.Group();
  root.name = 'CourtyardWell';
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.85, metalness: 0, ...o });
  const brick = brickTexture();
  const brickDark = brickTexture({ dark: true });
  const soil = soilTexture();
  const cement = cementTexture();
  const mats = {
    brickOut: std('BrickOutside', { map: brick }),
    brickIn: std('BrickInside', { map: brickDark, roughness: 0.75 }),
    brickCut: std('BrickCut', { map: Object.assign(brick.clone(), { needsUpdate: true }) }),
    cap: std('CementCap', { map: cement, roughness: 0.8 }),
    soil: std('SoilSection', { map: soil, roughness: 0.95 }),
    earth: std('YardEarth', { map: earthTexture(), roughness: 0.95 }),
    apron: std('CementApron', { map: Object.assign(cement.clone(), { needsUpdate: true }), roughness: 0.6 }),
    water: new THREE.MeshPhysicalMaterial({
      name: 'WellWater',
      color: '#1d6f86',
      roughness: 0.08,
      metalness: 0,
      transmission: 0,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.2,
    }),
    waterSide: std('WaterDepth', { color: '#165567', transparent: true, opacity: 0.78, roughness: 0.3 }),
    post: std('SalWood', { map: woodTexture('#6e3f1e'), roughness: 0.75 }),
    iron: std('Iron', { color: '#3b3f45', roughness: 0.45, metalness: 0.75 }),
    wheel: std('PulleyWheel', { color: '#c22f2f', roughness: 0.4, metalness: 0.35 }),
    groove: std('PulleyGroove', { color: '#5a5f66', roughness: 0.35, metalness: 0.85 }),
  };

  const cutNote = (m) => {
    m.userData.cut = true;
    return m;
  };
  const add = (geo, mat, name, parent = root) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ── the well: the back half of the parapet and the shaft, and the cut faces at z = 0 ──────────────────────────────
  const { rIn, rOut, top, water, floor } = WELL;
  // the parapet and the shaft are turned through the back half only (z ≤ 0)
  const BACK = [Math.PI / 2, Math.PI];
  // brick u around, v up: 8 courses = 0.52 m
  brick.repeat.set(9, top / 0.52);
  add(new THREE.LatheGeometry([new THREE.Vector2(rOut, 0), new THREE.Vector2(rOut, top - 0.06)], 48, ...BACK), mats.brickOut, 'ParapetOutside');
  // the cement cap on top, a little proud of the bricks
  const cap = add(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(rIn - 0.015, top - 0.07),
        new THREE.Vector2(rIn - 0.015, top + 0.01),
        new THREE.Vector2(rIn + 0.01, top + 0.03),
        new THREE.Vector2(rOut + 0.01, top + 0.03),
        new THREE.Vector2(rOut + 0.025, top + 0.01),
        new THREE.Vector2(rOut + 0.025, top - 0.07),
      ],
      48,
      ...BACK,
    ),
    mats.cap,
    'ParapetCap',
  );
  cement.repeat.set(3, 1);
  cap.receiveShadow = true;
  // the inside of the shaft, from the floor of the cut to the parapet's top
  brickDark.repeat.set(7, (top - floor) / 0.52);
  const inside = add(
    new THREE.LatheGeometry([new THREE.Vector2(rIn, top - 0.07), new THREE.Vector2(rIn, floor)], 48, ...BACK),
    mats.brickIn,
    'ShaftInside',
  );
  inside.material.side = THREE.DoubleSide;
  // the two cut faces of the brick ring (x from ±rIn to ±rOut, from the floor to the cap)
  mats.brickCut.map.repeat.set(0.5, (top - floor) / 0.52);
  for (const side of [-1, 1]) {
    const g = new THREE.PlaneGeometry(rOut - rIn, top - 0.07 - floor);
    const m = add(g, mats.brickCut, 'BrickCutFace');
    m.position.set(side * (rIn + rOut) * 0.5, (top - 0.07 + floor) / 2, 0.001);
    cutNote(m);
    // the cap's cut end
    const c = add(new THREE.PlaneGeometry(rOut - rIn + 0.04, 0.1), mats.cap, 'CapCutFace');
    c.position.set(side * (rIn + rOut) * 0.5, top - 0.02, 0.002);
  }

  // the water: its surface (the back half disc) and its depth seen through the cut
  const surface = add(new THREE.CircleGeometry(rIn - 0.005, 48, 0, Math.PI), mats.water, 'WaterSurface');
  surface.rotation.x = -Math.PI / 2; // the half with +y in the circle's plane goes to −z (the back), facing up
  surface.position.y = water;
  surface.castShadow = false;
  const depth = add(new THREE.PlaneGeometry(2 * rIn - 0.01, water - floor), mats.waterSide, 'WaterDepth');
  depth.position.set(0, (water + floor) / 2, 0.003);
  depth.castShadow = false;
  // rings on the water after a splash (scaled and faded by splash())
  const ripples = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1, 48, 1, 0, Math.PI),
      new THREE.MeshBasicMaterial({ color: '#bfe6f0', transparent: true, opacity: 0, depthWrite: false }),
    );
    r.rotation.x = -Math.PI / 2;
    r.position.set(-PULLEY.r, water + 0.004, 0);
    r.userData.noExport = true;
    root.add(r);
    ripples.push(r);
  }

  // ── the ground: the yard behind the cut, the cut face of the soil, the cement apron round the well ─────────────────
  const yard = add(new THREE.PlaneGeometry(30, 14), mats.earth, 'Yard');
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(0, 0, -7);
  mats.earth.map.repeat.set(24, 11);
  yard.castShadow = false;
  yard.userData.noExport = true; // the GLB is the well, its frame and pulley (the yard is scenery)
  // the cut face of the soil: two slabs either side of the shaft (x beyond ±rOut), from y = 0 down to the floor
  const soilW = 12;
  soil.repeat.set(soilW / 3, 1);
  for (const side of [-1, 1]) {
    const g = new THREE.PlaneGeometry(soilW, -floor);
    // the texture runs across the slab; keep its bands at the same depths on both sides
    const m = add(g, mats.soil, 'SoilCut');
    m.position.set(side * (rOut + soilW / 2), floor / 2, 0);
    m.castShadow = false;
    m.userData.noExport = true;
    cutNote(m);
  }
  // under the well's floor: the soil continues
  const under = add(new THREE.PlaneGeometry(2 * rOut, 0.6), mats.soil, 'SoilUnder');
  under.position.set(0, floor - 0.3, 0);
  under.userData.noExport = true;
  // the cement apron: a raised half disc round the parapet, a little wet near the well
  const apron = add(new THREE.CylinderGeometry(1.35, 1.38, 0.05, 56, 1, false, Math.PI / 2, Math.PI), mats.apron, 'Apron');
  apron.position.y = 0.025;
  mats.apron.map.repeat.set(3, 3);
  const apronEdge = add(new THREE.PlaneGeometry(2.76, 0.05), mats.apron, 'ApronCut');
  apronEdge.position.set(0, 0.025, 0.001);
  const wet = new THREE.Mesh(
    new THREE.RingGeometry(rOut + 0.02, 1.15, 48, 1, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: '#6d6355', transparent: true, opacity: 0.35, roughness: 0.25, depthWrite: false }),
  );
  wet.rotation.x = -Math.PI / 2;
  wet.position.y = 0.052;
  wet.name = 'WetCement';
  root.add(wet);

  // ── the frame: two sal posts on the apron, a beam, an iron pulley hanging from a fork ──────────────────────────────
  const frame = new THREE.Group();
  frame.name = 'PulleyFrame';
  root.add(frame);
  const postGeo = new THREE.BoxGeometry(0.11, FRAME.beam + 0.06, 0.11);
  mats.post.map.repeat.set(1, 2);
  for (const side of [-1, 1]) {
    const p = add(postGeo, mats.post, 'Post', frame);
    p.position.set(side * FRAME.x, (FRAME.beam + 0.06) / 2 + 0.05, FRAME.z);
    // an iron foot plate and two bolts
    const plate = add(new THREE.BoxGeometry(0.2, 0.02, 0.2), mats.iron, 'PostFoot', frame);
    plate.position.set(side * FRAME.x, 0.06, FRAME.z);
  }
  const beam = add(new THREE.BoxGeometry(2 * FRAME.x + 0.34, 0.12, 0.13), mats.post, 'Beam', frame);
  beam.position.set(0, FRAME.beam + 0.06, FRAME.z);
  // braces between the posts and the beam
  for (const side of [-1, 1]) {
    const b = add(new THREE.BoxGeometry(0.06, 0.42, 0.06), mats.post, 'Brace', frame);
    b.position.set(side * (FRAME.x - 0.15), FRAME.beam - 0.13, FRAME.z);
    b.rotation.z = side * 0.78;
  }
  // the hanger: a strap round the beam, a rod down to the fork, the fork's cheeks either side of the wheel
  const strap = add(new THREE.BoxGeometry(0.05, 0.16, 0.16), mats.iron, 'Strap', frame);
  strap.position.set(PULLEY.x, FRAME.beam + 0.06, FRAME.z);
  const rodLen = FRAME.beam - (PULLEY.y + PULLEY.r + 0.05);
  const rod = add(new THREE.CylinderGeometry(0.014, 0.014, rodLen + 0.02, 12), mats.iron, 'HangerRod', frame);
  rod.position.set(PULLEY.x, PULLEY.y + PULLEY.r + 0.05 + rodLen / 2, (FRAME.z + PULLEY.z) / 2);
  rod.rotation.x = Math.atan2(PULLEY.z - FRAME.z, rodLen);
  for (const side of [-1, 1]) {
    const cheek = add(new THREE.BoxGeometry(0.05, 0.24, 0.012), mats.iron, 'ForkCheek', frame);
    cheek.position.set(PULLEY.x, PULLEY.y + 0.06, PULLEY.z + side * 0.04);
  }
  const forkTop = add(new THREE.BoxGeometry(0.06, 0.02, 0.1), mats.iron, 'ForkTop', frame);
  forkTop.position.set(PULLEY.x, PULLEY.y + PULLEY.r + 0.06, PULLEY.z);
  // the wheel: a grooved rim, spokes, a hub on its axle; it turns with the rope (spin())
  const wheel = new THREE.Group();
  wheel.name = 'PulleyWheel';
  wheel.position.set(PULLEY.x, PULLEY.y, PULLEY.z);
  frame.add(wheel);
  const rim = add(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(PULLEY.r + 0.03, -0.028),
        new THREE.Vector2(PULLEY.r + 0.026, -0.022),
        new THREE.Vector2(PULLEY.r + 0.004, -0.008),
        new THREE.Vector2(PULLEY.r, 0),
        new THREE.Vector2(PULLEY.r + 0.004, 0.008),
        new THREE.Vector2(PULLEY.r + 0.026, 0.022),
        new THREE.Vector2(PULLEY.r + 0.03, 0.028),
        new THREE.Vector2(PULLEY.r - 0.012, 0.028),
        new THREE.Vector2(PULLEY.r - 0.012, -0.028),
        new THREE.Vector2(PULLEY.r + 0.03, -0.028),
      ],
      48,
    ),
    mats.wheel,
    'PulleyRim',
    wheel,
  );
  rim.rotation.x = Math.PI / 2; // the wheel's axle along z
  const groove = add(new THREE.TorusGeometry(PULLEY.r + 0.002, 0.006, 8, 48), mats.groove, 'Groove', wheel);
  groove.scale.z = 1.4;
  for (let i = 0; i < 6; i++) {
    const s = add(new THREE.BoxGeometry(0.014, PULLEY.r - 0.02, 0.012), mats.wheel, 'Spoke', wheel);
    const ang = (i / 6) * Math.PI * 2;
    s.position.set(Math.sin(ang) * (PULLEY.r / 2), Math.cos(ang) * (PULLEY.r / 2), 0);
    s.rotation.z = -ang;
  }
  const hub = add(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 20), mats.groove, 'Hub', wheel);
  hub.rotation.x = Math.PI / 2;
  const axle = add(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 12), mats.iron, 'Axle', frame);
  axle.position.set(PULLEY.x, PULLEY.y, PULLEY.z);
  axle.rotation.x = Math.PI / 2;

  // ── the yard behind ────────────────────────────────────────────────────────────────────────────────────────────
  const yardItems = createYard();
  yardItems.userData.noExport = true;
  root.add(yardItems);

  // ── a few things at the well: a clay pitcher (কলসি) and a second bucket on the apron ───────────────────────────────
  const pot = createPot('#b4532a');
  pot.position.set(-1.05, 0.05, -0.55);
  root.add(pot);
  const pot2 = createPot('#a1471f', 0.8);
  pot2.position.set(-1.35, 0.05, -0.85);
  root.add(pot2);

  let wheelTurn = 0;
  return {
    root,
    wheel,
    /** Turns the wheel as the rope runs over it: `run` metres of rope (positive: towards the person). */
    spin(run) {
      wheelTurn = -run / PULLEY.r;
      wheel.rotation.z = wheelTurn;
    },
    /** Rings spread on the water: 0 … 1 of a splash (null: none). */
    splash(k) {
      ripples.forEach((r, i) => {
        const p = k == null ? 1 : Math.min(1, Math.max(0, k * 1.3 - i * 0.15));
        const s = 0.08 + p * (rIn - 0.1);
        r.scale.set(s, s, s);
        r.material.opacity = k == null ? 0 : 0.75 * (1 - p);
      });
    },
  };
}

/** A clay pitcher: a lathe of a round belly, a narrow neck and a lip, in terracotta. */
function createPot(colour, scale = 1) {
  const g = new THREE.Group();
  g.name = 'ClayPot';
  const pts = [
    [0.0, 0],
    [0.09, 0.005],
    [0.16, 0.06],
    [0.19, 0.16],
    [0.17, 0.26],
    [0.1, 0.33],
    [0.07, 0.37],
    [0.075, 0.4],
    [0.095, 0.41],
    [0.09, 0.425],
    [0.065, 0.42],
  ].map(([r, y]) => new THREE.Vector2(r * scale, y * scale));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), new THREE.MeshStandardMaterial({ name: 'Terracotta', color: colour, roughness: 0.75 }));
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  // a painted band
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.188 * scale, 0.006 * scale, 6, 40),
    new THREE.MeshStandardMaterial({ name: 'PotBand', color: '#f2d27a', roughness: 0.7 }),
  );
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.17 * scale;
  g.add(band);
  return g;
}

/** The yard: a house (terracotta mud wall, blue doors and windows, tin roof), a haystack, a bamboo fence. */
function createYard() {
  const g = new THREE.Group();
  g.name = 'Yard';
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.85, metalness: 0, ...o });
  const add = (geo, mat, name, parent = g) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const plaster = plasterTexture();
  const tin = tinTexture();
  const doorWood = woodTexture('#1f5fb8', 'rgba(10,30,80,0.35)');
  const M = {
    wall: std('MudWall', { map: plaster }),
    plinth: std('Plinth', { color: '#8a4b26', roughness: 0.95 }),
    tin: std('TinRoof', { map: tin, roughness: 0.35, metalness: 0.6 }),
    door: std('BlueDoor', { map: doorWood, roughness: 0.6 }),
    frame: std('DoorFrame', { color: '#f2c94c', roughness: 0.6 }),
    dark: std('Inside', { color: '#3b2a20', roughness: 1 }),
    hay: std('Hay', { color: '#d9a43c', roughness: 1 }),
    hayDark: std('HayShade', { color: '#b98326', roughness: 1 }),
    bamboo: std('Bamboo', { color: '#d2b26a', roughness: 0.7 }),
    pole: std('Pole', { color: '#6b4a2a', roughness: 0.9 }),
    leaf: std('BananaLeaf', { color: '#3f8f3a', roughness: 0.8, side: THREE.DoubleSide }),
    trunk: std('BananaTrunk', { color: '#8d8a4a', roughness: 0.9 }),
  };
  // the house: a long low wall with a plinth, a door, two windows, a sloping tin roof on posts (a veranda)
  const H = { x0: -3.6, x1: 2.6, z: -3.4, h: 2.35 };
  const W = H.x1 - H.x0;
  plaster.repeat.set(W / 3, 1);
  const wall = add(new THREE.BoxGeometry(W, H.h, 0.3), M.wall, 'HouseWall');
  wall.position.set((H.x0 + H.x1) / 2, H.h / 2, H.z);
  const plinth = add(new THREE.BoxGeometry(W + 0.4, 0.32, 1.5), M.plinth, 'Plinth');
  plinth.position.set((H.x0 + H.x1) / 2, 0.16, H.z + 0.6);
  // the door: dark inside, two blue leaves open a little, a yellow frame
  const door = new THREE.Group();
  door.position.set(-0.4, 0.32, H.z + 0.16);
  g.add(door);
  add(new THREE.PlaneGeometry(0.9, 1.75), M.dark, 'Doorway', door).position.set(0, 0.875, 0.001);
  for (const side of [-1, 1]) {
    const leaf = add(new THREE.BoxGeometry(0.45, 1.72, 0.04), M.door, 'DoorLeaf', door);
    leaf.position.set(side * 0.43, 0.86, 0.12);
    leaf.rotation.y = side * 0.55;
    // panels on the leaf
    const panel = add(new THREE.BoxGeometry(0.3, 0.5, 0.012), M.frame, 'DoorPanel', leaf);
    panel.position.set(0, 0.35, 0.025);
    const panel2 = panel.clone();
    panel2.position.y = -0.35;
    leaf.add(panel2);
  }
  for (const [w, h, x, y] of [
    [1.04, 0.07, 0, 1.79],
    [0.07, 1.82, -0.5, 0.9],
    [0.07, 1.82, 0.5, 0.9],
  ])
    add(new THREE.BoxGeometry(w, h, 0.06), M.frame, 'DoorFrame', door).position.set(x, y, 0.02);
  // two windows with blue shutters and bars
  for (const wx of [-2.4, 1.5]) {
    const win = new THREE.Group();
    win.position.set(wx, 1.35, H.z + 0.16);
    g.add(win);
    add(new THREE.PlaneGeometry(0.7, 0.75), M.dark, 'Window', win);
    for (let i = 0; i < 4; i++)
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 8), M.pole, 'WindowBar', win).position.set(-0.24 + i * 0.16, 0, 0.02);
    for (const side of [-1, 1]) {
      const sh = add(new THREE.BoxGeometry(0.36, 0.78, 0.03), M.door, 'Shutter', win);
      sh.position.set(side * 0.55, 0, 0.08);
      sh.rotation.y = side * -0.35;
    }
    add(new THREE.BoxGeometry(0.84, 0.06, 0.08), M.frame, 'Sill', win).position.set(0, -0.42, 0.04);
  }
  // the roof: a corrugated sheet sloping over the veranda, on bamboo posts
  tin.repeat.set(W / 0.9, 1);
  const roof = add(new THREE.BoxGeometry(W + 0.6, 0.03, 2.2), M.tin, 'TinRoof');
  roof.position.set((H.x0 + H.x1) / 2, H.h + 0.42, H.z + 0.55);
  roof.rotation.x = 0.36;
  const ridge = add(new THREE.BoxGeometry(W + 0.6, 0.6, 0.03), M.tin, 'TinGable');
  ridge.position.set((H.x0 + H.x1) / 2, H.h + 0.85, H.z - 0.45);
  for (const px of [-3.3, -1.3, 0.7, 2.3]) {
    const p = add(new THREE.CylinderGeometry(0.05, 0.055, 2.15, 10), M.bamboo, 'VerandaPost');
    p.position.set(px, 0.32 + 1.07, H.z + 1.25);
  }
  // a haystack on the left: a dome of hay round a pole, with a cap
  const stack = new THREE.Group();
  stack.position.set(-4.3, 0, -2.2);
  g.add(stack);
  add(
    new THREE.LatheGeometry(
      [
        [0, 0],
        [0.85, 0],
        [0.95, 0.4],
        [0.9, 1.0],
        [0.65, 1.55],
        [0.3, 1.9],
        [0, 2.0],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      28,
    ),
    M.hay,
    'Haystack',
    stack,
  );
  add(new THREE.ConeGeometry(0.35, 0.4, 16), M.hayDark, 'HayCap', stack).position.y = 2.05;
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), M.pole, 'HayPole', stack).position.y = 2.4;
  // a bamboo fence on the right, running back
  const fence = new THREE.Group();
  fence.position.set(3.6, 0, -0.6);
  g.add(fence);
  for (let i = 0; i < 9; i++) {
    const p = add(new THREE.CylinderGeometry(0.035, 0.04, 1.25, 8), M.bamboo, 'FencePost', fence);
    p.position.set(0, 0.62, -i * 0.42);
  }
  for (const y of [0.35, 0.75, 1.1]) {
    const rail = add(new THREE.CylinderGeometry(0.025, 0.025, 3.5, 8), M.bamboo, 'FenceRail', fence);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(0.04, y, -1.68);
  }
  // a banana plant by the fence (a few leaves, not a garden)
  const banana = new THREE.Group();
  banana.position.set(4.1, 0, -2.9);
  g.add(banana);
  add(new THREE.CylinderGeometry(0.1, 0.14, 1.9, 12), M.trunk, 'BananaTrunk', banana).position.y = 0.95;
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.3, 1, 4), M.leaf);
    const pos = leaf.geometry.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const y = pos.getY(k) + 0.65;
      pos.setZ(k, -0.18 * y * y);
      pos.setX(k, pos.getX(k) * Math.sin((y / 1.3) * Math.PI) * 1.2);
    }
    leaf.geometry.computeVertexNormals();
    leaf.geometry.translate(0, 0.65, 0);
    leaf.position.y = 1.85;
    leaf.rotation.y = (i / 6) * Math.PI * 2;
    leaf.rotation.x = -0.55 - (i % 2) * 0.25;
    leaf.castShadow = true;
    banana.add(leaf);
  }
  return g;
}
