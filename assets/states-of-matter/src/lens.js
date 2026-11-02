// The magnifiers: round windows drawn over the 3D view that show the water's molecules (glossy red oxygen, white
// hydrogens) far bigger than life. The molecules are a second, flat-lit WebGL pass in pixel coordinates after the
// kitchen (so the stage's capture includes them); the brass rims, the cone from the object to the lens and the
// curved arrows are SVG on top; the words are HTML. app.js decides what is where at each moment and calls draw().
import * as THREE from 'three';
import { atoms } from './molecules.js';

const CAPACITY = 180; // molecules drawn at once (1 + 73 + 73 + 12 at most)
const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}, parent) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
};

function discTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const r = g.createRadialGradient(110, 100, 10, 128, 128, 128);
  r.addColorStop(0, '#2c4c8f');
  r.addColorStop(0.65, '#1a2f66');
  r.addColorStop(1, '#0f1c45');
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLenses(stage, host) {
  const { renderer } = stage;
  const scene = new THREE.Scene();
  scene.environment = stage.scene.environment;
  const cam = new THREE.OrthographicCamera(0, 1, 0, -1, 1, 4000);
  cam.position.z = 1000;
  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  key.position.set(-0.5, 0.7, 1);
  const fill = new THREE.DirectionalLight('#9fc2ff', 0.6);
  fill.position.set(0.7, -0.4, 0.6);
  scene.add(key, fill, new THREE.AmbientLight('#ffffff', 0.45));

  // the scene behind dims in the last part, so the three lenses and the arrows stand out
  const dim = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: '#0b1033', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
  );
  // (the dim veil and the discs are transparent, so three.js draws them after the molecules: they sit far behind)
  dim.renderOrder = -10;
  scene.add(dim);
  const discMap = discTexture();
  const discs = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(1, 96),
      new THREE.MeshBasicMaterial({ map: discMap, transparent: true, depthWrite: false, toneMapped: false }),
    );
    m.renderOrder = -5;
    scene.add(m);
    return m;
  });
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const oxygen = new THREE.InstancedMesh(
    sphere,
    new THREE.MeshPhysicalMaterial({ name: 'Oxygen', color: '#e8383d', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
    CAPACITY,
  );
  const hydrogen = new THREE.InstancedMesh(
    sphere,
    new THREE.MeshPhysicalMaterial({ name: 'Hydrogen', color: '#f4f6fa', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
    CAPACITY * 2,
  );
  oxygen.frustumCulled = hydrogen.frustumCulled = false;
  scene.add(oxygen, hydrogen);

  stage.onResize((w, h) => {
    cam.right = w;
    cam.bottom = -h;
    cam.updateProjectionMatrix();
    dim.scale.set(w, h, 1);
    dim.position.set(w / 2, -h / 2, -1800);
  });
  stage.onAfterRender(() => {
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(scene, cam);
    renderer.autoClear = auto;
  });

  // ── SVG: the cone to the object, the rims, the arrows ─────────────────────
  const svg = el('svg', { class: 'sm-svg', 'aria-hidden': 'true' });
  host.appendChild(svg);
  const defs = el('defs', {}, svg);
  const rimGrad = el('linearGradient', { id: 'sm-rim', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
  el('stop', { offset: '0', 'stop-color': '#fff2c4' }, rimGrad);
  el('stop', { offset: '0.45', 'stop-color': '#e0a93a' }, rimGrad);
  el('stop', { offset: '1', 'stop-color': '#8a5a12' }, rimGrad);
  const mask = el('mask', { id: 'sm-cone-mask', maskUnits: 'userSpaceOnUse' }, defs);
  const maskRect = el('rect', { x: 0, y: 0, width: 10, height: 10, fill: '#fff' }, mask);
  const maskHole = el('circle', { fill: '#000' }, mask);
  for (const kind of ['heat', 'cool'])
    el(
      'path',
      { d: 'M0,0 L10,5 L0,10 z', class: `sm-head ${kind}` },
      el(
        'marker',
        {
          id: `sm-head-${kind}`,
          viewBox: '0 0 10 10',
          refX: 6,
          refY: 5,
          markerWidth: 3.2,
          markerHeight: 3.2,
          orient: 'auto-start-reverse',
          markerUnits: 'strokeWidth',
        },
        defs,
      ),
    );
  const cone = el('g', { mask: 'url(#sm-cone-mask)' }, svg);
  const conePath = el('path', { class: 'sm-cone' }, cone);
  const target = el('circle', { class: 'sm-target', r: 9 }, svg);
  const arrowsG = el('g', {}, svg);
  const arrows = [0, 1, 2, 3].map(() => {
    const g = el('g', {}, arrowsG);
    return { g, halo: el('path', { class: 'sm-arrow-halo' }, g), line: el('path', { class: 'sm-arrow' }, g) };
  });
  const rims = [0, 1, 2].map(() => {
    const g = el('g', {}, svg);
    return {
      g,
      outer: el('circle', { class: 'sm-rim-shadow' }, g),
      rim: el('circle', { class: 'sm-rim' }, g),
      inner: el('circle', { class: 'sm-rim-in' }, g),
    };
  });

  // ── HTML words ────────────────────────────────────────────────────────────
  const words = document.createElement('div');
  words.className = 'sm-words';
  host.appendChild(words);
  const word = (cls) => {
    const d = document.createElement('div');
    d.className = cls;
    words.appendChild(d);
    return d;
  };

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();
  let nO = 0;
  let nH = 0;
  let W = 1;
  let H = 1;

  function put(mesh, i, x, y, z, r) {
    v.set(x, -y, z);
    s.setScalar(Math.max(r, 1e-4));
    m4.compose(v, q, s);
    mesh.setMatrixAt(i, m4);
  }

  return {
    word,
    /** Start a frame: nothing drawn yet. */
    begin(w, h) {
      W = w;
      H = h;
      nO = nH = 0;
      for (const d of discs) d.visible = false;
      for (const r of rims) r.g.style.display = 'none';
      for (const a of arrows) a.g.style.display = 'none';
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      maskRect.setAttribute('width', String(w));
      maskRect.setAttribute('height', String(h));
    },
    dim(alpha) {
      dim.material.opacity = alpha;
      dim.visible = alpha > 0.001;
    },
    /** Lens i at (cx, cy) radius r (px), seen `alpha` (0…1); `lit` brightens its rim. */
    lens(i, { cx, cy, r }, alpha = 1, lit = false) {
      if (alpha <= 0.001 || r < 2) return;
      const d = discs[i];
      d.visible = true;
      d.position.set(cx, -cy, -1500);
      d.scale.set(r, r, 1);
      d.material.opacity = alpha;
      const g = rims[i];
      g.g.style.display = '';
      g.g.style.opacity = String(alpha);
      const w = Math.max(3.5, r * 0.055);
      for (const [c, rr, sw] of [
        [g.outer, r + w * 0.5, w + 3],
        [g.rim, r + w * 0.5, w],
        [g.inner, r + 0.5, 1.4],
      ]) {
        c.setAttribute('cx', cx);
        c.setAttribute('cy', cy);
        c.setAttribute('r', rr);
        c.setAttribute('stroke-width', sw);
      }
      g.g.classList.toggle('lit', lit);
    },
    /** Molecules (lens units) into a lens, each drawn at `size` × the normal molecule (0 hides it). */
    molecules(list, { cx, cy, r }, size = 1, sizes = null) {
      for (let i = 0; i < list.length; i++) {
        const k = sizes ? sizes[i] * size : size;
        if (k <= 0.01 || nO >= CAPACITY) continue;
        const [o, h1, h2] = atoms(list[i], k);
        put(oxygen, nO++, cx + o.x * r, cy - o.y * r, 0, o.r * r);
        // the hydrogens sit a little in front, the way a space-filling model looks
        put(hydrogen, nH++, cx + h1.x * r, cy - h1.y * r, o.r * r * 0.5, h1.r * r);
        put(hydrogen, nH++, cx + h2.x * r, cy - h2.y * r, o.r * r * 0.5, h2.r * r);
      }
    },
    /** Separate atoms (the molecule pulled apart), lens units: [{ x, y, r, kind: 'o' | 'h' }]. */
    atoms(list, { cx, cy, r }) {
      for (const a of list) {
        if (a.kind === 'o') put(oxygen, nO++, cx + a.x * r, cy - a.y * r, 0, a.r * r);
        else put(hydrogen, nH++, cx + a.x * r, cy - a.y * r, a.z ?? 0, a.r * r);
      }
    },
    /** The cone from a point on the object (px) to lens i's rim, `alpha` 0…1. */
    cone(from, { cx, cy, r }, alpha) {
      const show = alpha > 0.01 && from;
      conePath.style.display = target.style.display = show ? '' : 'none';
      if (!show) return;
      const dx = cx - from.x;
      const dy = cy - from.y;
      const d = Math.hypot(dx, dy);
      if (d <= r + 4) {
        conePath.style.display = 'none';
      } else {
        // the two tangents from the point to the circle
        const base = Math.atan2(-dy, -dx);
        const off = Math.acos(r / d);
        const t1 = { x: cx + r * Math.cos(base + off), y: cy + r * Math.sin(base + off) };
        const t2 = { x: cx + r * Math.cos(base - off), y: cy + r * Math.sin(base - off) };
        conePath.setAttribute('d', `M${from.x},${from.y} L${t1.x},${t1.y} L${t2.x},${t2.y} Z`);
      }
      maskHole.setAttribute('cx', cx);
      maskHole.setAttribute('cy', cy);
      maskHole.setAttribute('r', r);
      target.setAttribute('cx', from.x);
      target.setAttribute('cy', from.y);
      conePath.style.opacity = target.style.opacity = String(alpha);
    },
    /** Curved arrow i: { p0, c, p1 } in px, heat or cool, how strongly it shows and whether it is the lit one. */
    arrow(i, a, kind, alpha, width) {
      const g = arrows[i];
      if (alpha <= 0.01) return;
      g.g.style.display = '';
      g.g.style.opacity = String(alpha);
      const d = `M${a.p0.x},${a.p0.y} Q${a.c.x},${a.c.y} ${a.p1.x},${a.p1.y}`;
      for (const p of [g.halo, g.line]) p.setAttribute('d', d);
      g.line.setAttribute('class', `sm-arrow ${kind}`);
      g.line.setAttribute('marker-end', `url(#sm-head-${kind})`);
      g.line.setAttribute('stroke-width', String(width));
      g.halo.setAttribute('stroke-width', String(width + 4));
    },
    /** Finish the frame: tell three.js how many molecules there are. */
    end() {
      oxygen.count = nO;
      hydrogen.count = nH;
      oxygen.instanceMatrix.needsUpdate = true;
      hydrogen.instanceMatrix.needsUpdate = true;
    },
    get size() {
      return { W, H };
    },
  };
}
