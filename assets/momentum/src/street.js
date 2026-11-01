// The street, in metres (x along the road, +x to the right on screen; z toward the viewer; y up): a wide town
// road of three lanes with dashed lane lines, kerbs painted black and white as on Bangladesh's roads, a footpath of
// warm concrete pavers on each side. Along the far footpath a row of two-storey shops in warm plaster colours
// (terracotta, mustard, salmon, sand), each with its signboard, a striped awning, an open front with goods on the
// shelves or a half-raised shutter, and windows with grilles above; along the near one a strip of brick paving and a
// low plastered wall. The truck runs in the far lane, the bicycle in the near one; the middle lane stays empty, so
// nothing of one lane ever sits over the other on screen. The arrows' colours (blue, green) appear nowhere in the
// setting. Long enough for every run (x from -72 m to +72 m), and only nine draw calls: each surface is one mesh,
// its detail in one canvas texture drawn once.
import * as THREE from 'three';
import { mergePlaced } from './merge.js';

export const LANES = { far: -4.2, near: 4.4 };
export const ROAD = { half: 6.2, length: 144, kerb: 0.16 };
const PERIOD = 24; // m of shop row in the façade texture (it repeats along the street)
const SHOPS = [
  // width (m), upper plaster, signboard, awning, front ('goods' | 'shutter' | 'cloth' | 'pots')
  { w: 4.4, wall: '#d98a5c', sign: '#b8322a', awn: '#c0392b', front: 'goods' },
  { w: 3.6, wall: '#e3b25a', sign: '#7a2333', awn: '#e07b24', front: 'shutter' },
  { w: 4.0, wall: '#e2a49b', sign: '#e8b52e', awn: '#8e2c48', front: 'cloth' },
  { w: 3.2, wall: '#c9a982', sign: '#d4572a', awn: '#b8862a', front: 'goods' },
  { w: 4.8, wall: '#cf7b5e', sign: '#f2efe6', awn: '#a8322b', front: 'pots' },
  { w: 4.0, wall: '#dcb877', sign: '#9e2a2b', awn: '#d9622b', front: 'shutter' },
];
const H = { base: ROAD.kerb, front: 3.0, sign: 3.75, top: 6.7 }; // façade heights (m)

const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const texture = (c, repeatX = 1, repeatY = 1) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
};
/** A colour a little darker or lighter (k < 1 darker). */
const shade = (hex, k) => {
  const c = new THREE.Color(hex);
  if (k < 1) c.multiplyScalar(k);
  else c.lerp(new THREE.Color('#ffffff'), k - 1);
  return `#${c.getHexString()}`;
};

/** Specks of grit and a few darker patches over a filled canvas. */
function grit(ctx, w, h, n, seed, light, dark) {
  const r = rand(seed);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = r() < 0.5 ? light : dark;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

/** The shop row: 24 m of façade, 2048 × 512 px (85 px per metre along, 79 up). */
function facadeTexture() {
  const W = 2048;
  const Hp = 512;
  const c = canvas(W, Hp);
  const ctx = c.getContext('2d');
  const ppm = W / PERIOD;
  const span = H.top - H.base;
  const Y = (y) => Hp - ((y - H.base) / span) * Hp; // canvas row of a height
  const r = rand(31);
  let x0 = 0;
  for (const shop of SHOPS) {
    const X = (m) => (x0 + m) * ppm;
    const w = shop.w;
    // upper storey: plaster with weather streaks
    ctx.fillStyle = shop.wall;
    ctx.fillRect(X(0), 0, w * ppm + 1, Y(H.sign));
    for (let i = 0; i < 9; i++) {
      const sx = X(r() * w);
      const g = ctx.createLinearGradient(0, Y(H.top - 0.3), 0, Y(H.sign + 0.4 + r()));
      g.addColorStop(0, 'rgba(70, 50, 35, 0.16)');
      g.addColorStop(1, 'rgba(70, 50, 35, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx, Y(H.top - 0.3), 4 + r() * 10, Y(H.sign) * 0.8);
    }
    grit(ctx, w * ppm, Y(H.sign), 900, 40 + x0, 'rgba(255,255,255,0.10)', 'rgba(60,40,30,0.10)');
    // parapet and the floor band
    ctx.fillStyle = shade(shop.wall, 0.78);
    ctx.fillRect(X(0), 0, w * ppm + 1, Y(H.top - 0.32));
    ctx.fillStyle = shade(shop.wall, 1.18);
    ctx.fillRect(X(0), Y(H.top - 0.32), w * ppm + 1, 4);
    // windows with white grilles and a sunshade over each
    const nWin = w > 3.9 ? 2 : 1;
    for (let k = 0; k < nWin; k++) {
      const cx = X(((k + 0.5) / nWin) * w);
      const ww = 1.05 * ppm;
      const top = Y(5.95);
      const bot = Y(4.45);
      ctx.fillStyle = shade(shop.wall, 0.62);
      ctx.fillRect(cx - ww / 2 - 6, top - 10, ww + 12, 10); // sunshade
      ctx.fillStyle = '#f4efe4';
      ctx.fillRect(cx - ww / 2 - 4, top - 1, ww + 8, bot - top + 6); // frame
      const g = ctx.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, '#3b3a3c');
      g.addColorStop(1, '#5c5550');
      ctx.fillStyle = g;
      ctx.fillRect(cx - ww / 2, top + 3, ww, bot - top - 3);
      ctx.strokeStyle = 'rgba(245, 240, 230, 0.9)';
      ctx.lineWidth = 2;
      for (let j = 1; j < 6; j++) {
        ctx.beginPath();
        ctx.moveTo(cx - ww / 2 + (j * ww) / 6, top + 3);
        ctx.lineTo(cx - ww / 2 + (j * ww) / 6, bot);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx - ww / 2, (top + bot) / 2);
      ctx.lineTo(cx + ww / 2, (top + bot) / 2);
      ctx.stroke();
      ctx.fillStyle = shade(shop.wall, 0.7); // sill
      ctx.fillRect(cx - ww / 2 - 8, bot + 4, ww + 16, 5);
    }
    // an air conditioner on some
    if (shop.front !== 'cloth') {
      const ax = X(w * (nWin === 2 ? 0.5 : 0.82));
      ctx.fillStyle = '#e9e6df';
      ctx.fillRect(ax - 24, Y(4.35), 48, 26);
      ctx.fillStyle = '#9b978f';
      for (let j = 0; j < 4; j++) ctx.fillRect(ax - 20, Y(4.35) + 5 + j * 5, 40, 2);
    }
    // the signboard: a coloured board with a round emblem and pale bands (no words)
    const sTop = Y(H.sign - 0.05);
    const sBot = Y(H.front + 0.05);
    ctx.fillStyle = shade(shop.wall, 0.7);
    ctx.fillRect(X(0), sTop - 4, w * ppm + 1, sBot - sTop + 8);
    ctx.fillStyle = shop.sign;
    ctx.fillRect(X(0.12), sTop, (w - 0.24) * ppm, sBot - sTop);
    const ink = shop.sign === '#f2efe6' || shop.sign === '#e8b52e' ? '#9e2a2b' : '#f6e7c4';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(X(0.2), sTop + 5, (w - 0.4) * ppm, sBot - sTop - 10);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(X(0.62), (sTop + sBot) / 2, (sBot - sTop) * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shop.sign;
    ctx.beginPath();
    ctx.arc(X(0.62), (sTop + sBot) / 2, (sBot - sTop) * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(X(1.05), sTop + (sBot - sTop) * 0.3, (w - 1.5) * ppm, (sBot - sTop) * 0.18);
    ctx.globalAlpha = 0.55;
    ctx.fillRect(X(1.05), sTop + (sBot - sTop) * 0.6, (w - 2.3) * ppm, (sBot - sTop) * 0.12);
    ctx.globalAlpha = 1;
    // the ground storey: plastered piers either side of the opening
    const pier = shade(shop.wall, 0.86);
    ctx.fillStyle = pier;
    ctx.fillRect(X(0), Y(H.front), 0.3 * ppm, Y(H.base) - Y(H.front));
    ctx.fillRect(X(w - 0.3), Y(H.front), 0.3 * ppm + 1, Y(H.base) - Y(H.front));
    const oL = X(0.3);
    const oR = X(w - 0.3);
    const oT = Y(H.front);
    const oB = Y(H.base + 0.12);
    // the shop inside: warm shadow, darker at the back
    const g = ctx.createLinearGradient(0, oT, 0, oB);
    g.addColorStop(0, '#2a211c');
    g.addColorStop(1, '#4a3a30');
    ctx.fillStyle = g;
    ctx.fillRect(oL, oT, oR - oL, oB - oT);
    if (shop.front === 'goods' || shop.front === 'pots' || shop.front === 'cloth') {
      // shelves along the back, stocked; a counter at the front
      const goods =
        shop.front === 'cloth'
          ? ['#c0392b', '#e8b52e', '#f2efe6', '#b5487a', '#e07b24', '#7a2333']
          : shop.front === 'pots'
            ? ['#b5652e', '#c97a3a', '#8f4a22', '#d8a15a', '#e5d2b0']
            : ['#d8452c', '#f0c23a', '#f2efe6', '#e07b24', '#a8322b', '#c99b5c'];
      for (let row = 0; row < 4; row++) {
        const sy = Y(2.55 - row * 0.52);
        ctx.fillStyle = '#6b4a30';
        ctx.fillRect(oL + 4, sy, oR - oL - 8, 4);
        if (shop.front === 'cloth') {
          for (let x = oL + 8; x < oR - 12; x += 9 + r() * 5) {
            ctx.fillStyle = goods[Math.floor(r() * goods.length)];
            ctx.fillRect(x, sy - 34, 7, 34);
          }
        } else if (shop.front === 'pots') {
          for (let x = oL + 14; x < oR - 14; x += 22 + r() * 6) {
            ctx.fillStyle = goods[Math.floor(r() * goods.length)];
            ctx.beginPath();
            ctx.ellipse(x, sy - 14, 10, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,240,220,0.25)';
            ctx.fillRect(x - 6, sy - 24, 4, 12);
          }
        } else {
          for (let x = oL + 8; x < oR - 12; ) {
            const bw = 8 + r() * 16;
            const bh = 12 + r() * 22;
            ctx.fillStyle = goods[Math.floor(r() * goods.length)];
            ctx.fillRect(x, sy - bh, bw, bh);
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.fillRect(x + bw - 2, sy - bh, 2, bh);
            x += bw + 2;
          }
        }
      }
      // the counter, with sacks in front of some
      ctx.fillStyle = '#8a5a34';
      ctx.fillRect(oL + 6, Y(1.0), oR - oL - 12, Y(H.base + 0.12) - Y(1.0));
      ctx.fillStyle = '#6f4728';
      ctx.fillRect(oL + 6, Y(1.0), oR - oL - 12, 5);
      if (shop.front === 'goods')
        for (let x = oL + 16; x < oR - 30; x += 46 + r() * 30) {
          ctx.fillStyle = r() < 0.5 ? '#e9dcc0' : '#d7c19a';
          ctx.beginPath();
          ctx.ellipse(x, Y(H.base + 0.45), 15, 24, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#c0392b';
          ctx.fillRect(x - 13, Y(H.base + 0.55), 26, 4);
        }
    }
    if (shop.front === 'shutter') {
      // a rolling shutter, half raised: ribbed steel, a darker bottom rail, the room dark beneath it
      const sh = Y(1.55);
      const sg = ctx.createLinearGradient(0, oT, 0, sh);
      sg.addColorStop(0, '#9aa0a3');
      sg.addColorStop(1, '#b9bcbc');
      ctx.fillStyle = sg;
      ctx.fillRect(oL, oT, oR - oL, sh - oT);
      ctx.fillStyle = 'rgba(60, 64, 68, 0.35)';
      for (let y = oT + 5; y < sh; y += 7) ctx.fillRect(oL, y, oR - oL, 2);
      ctx.fillStyle = '#4b4f53';
      ctx.fillRect(oL, sh - 6, oR - oL, 6);
      ctx.fillStyle = '#c9a463'; // a lock hasp
      ctx.fillRect((oL + oR) / 2 - 5, sh - 14, 10, 8);
    }
    // the step at the shop's foot
    ctx.fillStyle = '#8f8a82';
    ctx.fillRect(X(0), Y(H.base + 0.12), w * ppm + 1, Hp - Y(H.base + 0.12));
    ctx.fillStyle = '#a7a199';
    ctx.fillRect(X(0), Y(H.base + 0.12), w * ppm + 1, 3);
    // a drainpipe between some shops
    if (shop.front !== 'pots') {
      ctx.fillStyle = 'rgba(70, 60, 55, 0.55)';
      ctx.fillRect(X(w) - 4, 0, 6, Y(H.front));
    }
    x0 += w;
  }
  return texture(c, 1, 1);
}

/** The awnings' stripes: one row per shop, its colour and cream, 256 × 64. */
function awningTexture() {
  const c = canvas(256, 64);
  const ctx = c.getContext('2d');
  SHOPS.forEach((shop, i) => {
    const y = (i * 64) / SHOPS.length;
    const h = 64 / SHOPS.length;
    ctx.fillStyle = '#f3e6c8';
    ctx.fillRect(0, y, 256, h);
    ctx.fillStyle = shop.awn;
    for (let x = 0; x < 256; x += 32) ctx.fillRect(x, y, 18, h);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export function createStreet() {
  const root = new THREE.Group();
  root.name = 'Street';
  const L = ROAD.length;
  const W = ROAD.half * 2;
  const pathW = 2.2;
  const zFar = -ROAD.half - 0.22 - pathW; // the far footpath's back edge, where the shops stand
  const zNear = ROAD.half + 0.22 + pathW; // the near footpath's outer edge

  // asphalt: 8 m of road in the texture (3 m dash, 5 m gap), 48 px per metre, with grit and wear in the
  // wheel tracks
  {
    const ppm = 48;
    const c = canvas(8 * ppm, Math.round(W * ppm));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#7d8187';
    ctx.fillRect(0, 0, c.width, c.height);
    const zpx = (z) => (z + ROAD.half) * ppm; // canvas row of a z (the plane's v runs with z after the rotation)
    // darker wheel tracks in each lane, a lighter middle
    for (const z of [-5.0, -3.4, -0.8, 0.8, 3.6, 5.2]) {
      const g = ctx.createLinearGradient(0, zpx(z) - 22, 0, zpx(z) + 22);
      g.addColorStop(0, 'rgba(40, 44, 50, 0)');
      g.addColorStop(0.5, 'rgba(40, 44, 50, 0.22)');
      g.addColorStop(1, 'rgba(40, 44, 50, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, zpx(z) - 22, c.width, 44);
    }
    const r = rand(7);
    for (let i = 0; i < 6400; i++) {
      const v = 96 + Math.floor(r() * 60);
      ctx.fillStyle = `rgba(${v},${v + 3},${v + 6},0.5)`;
      ctx.fillRect(r() * c.width, r() * c.height, 2, 2);
    }
    ctx.fillStyle = '#f1efe6';
    for (const z of [-2.07, 2.07]) ctx.fillRect(0, zpx(z) - 4, 3 * ppm, 8); // lane dashes
    ctx.fillStyle = '#eecb4a';
    for (const z of [-ROAD.half + 0.22, ROAD.half - 0.22]) ctx.fillRect(0, zpx(z) - 4, c.width, 7); // edge lines
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(L, W),
      new THREE.MeshStandardMaterial({ name: 'Asphalt', map: texture(c, L / 8, 1), roughness: 0.93 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    road.name = 'Road';
    root.add(road);
  }

  // kerbs: black and white, half a metre each (both sides, one mesh)
  {
    const c = canvas(128, 8);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f2f0e8';
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = '#2b2e33';
    ctx.fillRect(64, 0, 64, 8);
    const box = new THREE.BoxGeometry(L, ROAD.kerb, 0.22);
    const kerb = new THREE.Mesh(
      mergePlaced([-ROAD.half - 0.11, ROAD.half + 0.11].map((z) => [box, new THREE.Matrix4().makeTranslation(0, ROAD.kerb / 2, z)])),
      new THREE.MeshStandardMaterial({ name: 'Kerb', map: texture(c, L, 1), roughness: 0.8 }),
    );
    box.dispose();
    kerb.receiveShadow = true;
    kerb.name = 'Kerbs';
    root.add(kerb);
  }

  // footpaths of warm concrete pavers, 0.5 m, a few a shade darker or lighter (both sides, one mesh)
  {
    const c = canvas(256, 256); // 2 m × 2 m
    const ctx = c.getContext('2d');
    const r = rand(17);
    const tones = ['#c8b294', '#bfa785', '#cdb89b', '#b89e7c', '#c4ad8d'];
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        ctx.fillStyle = tones[Math.floor(r() * tones.length)];
        ctx.fillRect(i * 64, j * 64, 64, 64);
      }
    grit(ctx, 256, 256, 1800, 23, 'rgba(255,250,240,0.18)', 'rgba(80,60,40,0.14)');
    ctx.strokeStyle = '#8f7a60';
    ctx.lineWidth = 3;
    for (let k = 0; k <= 256; k += 64) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k, 256);
      ctx.moveTo(0, k);
      ctx.lineTo(256, k);
      ctx.stroke();
    }
    const plane = new THREE.PlaneGeometry(L, pathW).rotateX(-Math.PI / 2);
    const path = new THREE.Mesh(
      mergePlaced(
        [-ROAD.half - 0.22 - pathW / 2, ROAD.half + 0.22 + pathW / 2].map((z) => [
          plane,
          new THREE.Matrix4().makeTranslation(0, ROAD.kerb - 0.005, z),
        ]),
      ),
      new THREE.MeshStandardMaterial({ name: 'Pavers', map: texture(c, L / 2, pathW / 2), roughness: 0.95 }),
    );
    plane.dispose();
    path.receiveShadow = true;
    path.name = 'Footpaths';
    root.add(path);
  }

  // the shop row: the façade (one textured face), the flat roofs behind its parapet, the awnings
  {
    const depth = 9;
    const facadeGeo = new THREE.PlaneGeometry(L, H.top - H.base);
    const uv = facadeGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (L / PERIOD));
    const facade = new THREE.Mesh(facadeGeo, new THREE.MeshStandardMaterial({ name: 'ShopFronts', map: facadeTexture(), roughness: 0.9 }));
    facade.position.set(0, (H.base + H.top) / 2, zFar);
    facade.receiveShadow = true;
    facade.name = 'ShopRow';
    root.add(facade);
    // roofs: weathered concrete with water tanks, seen only when the view is turned
    const rc = canvas(256, 128);
    const rctx = rc.getContext('2d');
    rctx.fillStyle = '#a99d8c';
    rctx.fillRect(0, 0, 256, 128);
    grit(rctx, 256, 128, 1500, 5, 'rgba(255,255,255,0.12)', 'rgba(50,40,30,0.15)');
    for (const [x, y] of [
      [40, 50],
      [150, 80],
      [215, 35],
    ]) {
      rctx.fillStyle = '#2f3134';
      rctx.beginPath();
      rctx.arc(x, y, 13, 0, Math.PI * 2);
      rctx.fill();
      rctx.fillStyle = '#4a4d51';
      rctx.beginPath();
      rctx.arc(x - 3, y - 3, 6, 0, Math.PI * 2);
      rctx.fill();
    }
    const roof = new THREE.Mesh(
      new THREE.PlaneGeometry(L, depth).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ name: 'Roofs', map: texture(rc, L / 12, 1), roughness: 0.95 }),
    );
    roof.position.set(0, H.top - 0.25, zFar - depth / 2);
    roof.name = 'Roofs';
    root.add(roof);
    // awnings: a sloped striped canvas over each shop's opening, in that shop's colour (one mesh for all)
    const awn = [];
    const slab = new THREE.BoxGeometry(1, 0.03, 1);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.42);
    for (let x = -L / 2; x < L / 2; x += PERIOD) {
      let x0 = x;
      SHOPS.forEach((shop, i) => {
        const w = shop.w - 0.7;
        const g = slab.clone();
        // its row of the stripe texture
        const uvs = g.attributes.uv;
        for (let k = 0; k < uvs.count; k++) uvs.setXY(k, uvs.getX(k) * (w / 1.2), (SHOPS.length - 1 - i + 0.2 + uvs.getY(k) * 0.6) / SHOPS.length);
        m.compose(new THREE.Vector3(x0 + shop.w / 2, H.front - 0.12, zFar + 0.5), q, new THREE.Vector3(w, 1, 1.1));
        awn.push([g, m.clone()]);
        x0 += shop.w;
      });
    }
    const awnings = new THREE.Mesh(mergePlaced(awn), new THREE.MeshStandardMaterial({ name: 'Awnings', map: awningTexture(), roughness: 0.85 }));
    for (const [g] of awn) g.dispose();
    slab.dispose();
    awnings.castShadow = true;
    awnings.receiveShadow = true;
    awnings.name = 'Awnings';
    root.add(awnings);
  }

  // beyond the near footpath: a strip of red brick paving in a herringbone, then a low plastered wall
  {
    const c = canvas(256, 256); // 2 m × 2 m
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#7d4a36';
    ctx.fillRect(0, 0, 256, 256);
    const r = rand(3);
    const tones = ['#a5563a', '#b3633f', '#9a4c34', '#b86b48', '#a85d3e'];
    const bw = 32;
    const bh = 16;
    for (let i = -8; i < 16; i++)
      for (let j = -8; j < 16; j++) {
        const x = i * bw + (j % 2) * (bw / 2);
        const y = j * bh;
        ctx.fillStyle = tones[Math.floor(r() * tones.length)];
        ctx.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      }
    grit(ctx, 256, 256, 1400, 9, 'rgba(255,230,200,0.12)', 'rgba(40,20,10,0.16)');
    const depth = 3;
    const brick = new THREE.Mesh(
      new THREE.PlaneGeometry(L, depth).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ name: 'Bricks', map: texture(c, L / 2, depth / 2), roughness: 0.95 }),
    );
    brick.position.set(0, ROAD.kerb - 0.01, zNear + depth / 2);
    brick.receiveShadow = true;
    brick.name = 'BrickPaving';
    root.add(brick);
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(L, 0.9, 0.25),
      new THREE.MeshStandardMaterial({ name: 'LowWall', color: '#d9a27a', roughness: 0.92 }),
    );
    wall.position.set(0, ROAD.kerb + 0.45, zNear + depth + 0.125);
    wall.name = 'LowWall';
    root.add(wall);
  }

  // the ground further off, for the turned view: packed earth, warm
  {
    const earth = new THREE.MeshStandardMaterial({ name: 'Earth', color: '#b39a78', roughness: 1 });
    const plane = new THREE.PlaneGeometry(L, 70).rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(
      mergePlaced([
        [plane, new THREE.Matrix4().makeTranslation(0, -0.02, zFar - 35)],
        [plane, new THREE.Matrix4().makeTranslation(0, ROAD.kerb - 0.03, zNear + 3.25 + 35)],
      ]),
      earth,
    );
    plane.dispose();
    ground.name = 'Ground';
    root.add(ground);
  }
  return { root };
}

/** The sky behind the turned view: blue overhead, a warm haze at the horizon (made once, screen-filling). */
export function skyTexture() {
  const c = canvas(4, 256);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6fa6dc');
  g.addColorStop(0.55, '#a9cbe8');
  g.addColorStop(1, '#f1d7b0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A soft round shadow under a body (a texture, so it shows without real shadows too). One texture for all. */
let blobTex = null;
export function blobShadow(length, width, opacity = 0.42) {
  if (!blobTex) {
    const c = canvas(128, 128);
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, 'rgba(20, 26, 34, 1)');
    g.addColorStop(0.6, 'rgba(20, 26, 34, 0.45)');
    g.addColorStop(1, 'rgba(20, 26, 34, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    blobTex = new THREE.CanvasTexture(c);
    blobTex.colorSpace = THREE.SRGBColorSpace;
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(length, width),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  m.renderOrder = 1;
  m.userData.noExport = true;
  m.name = 'BlobShadow';
  return m;
}
