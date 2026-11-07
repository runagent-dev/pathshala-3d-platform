// Clear glass for the prisms and lenses, in the style of the sister figure total-internal-reflection: pale see-through
// faces with a faint green tint and crisp edges in the green of thick glass, so a prism reads as glass on the blue and
// on the sand. One set of materials, shared by every piece.
import * as THREE from 'three';

let shared = null;
export function glassMaterials() {
  if (shared) return shared;
  const face = new THREE.MeshPhysicalMaterial({
    name: 'Glass',
    color: '#b3eadb',
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.5,
    depthWrite: false,
  });
  const line = new THREE.LineBasicMaterial({ name: 'GlassEdge', color: '#2f7d66', transparent: true, opacity: 0.95 });
  shared = { face, line };
  return shared;
}

/**
 * A right-angle (45°-45°-90°) prism with legs L and thickness `depth`, its triangle in the x-y plane with the right
 * angle at the origin and the legs along +x and +y, extruded along +z from −depth/2. Slightly bevelled edges.
 */
export function prismGeometry(L, depth, bevel = 0.08) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(L, 0);
  s.lineTo(0, L);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: depth - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 1,
  });
  geo.translate(0, 0, -depth / 2 + bevel);
  return geo;
}

/** A glass piece: the body and its outline (edges sharper than 25°), drawn after the opaque parts. */
export function glassPiece(name, geo) {
  const { face, line } = glassMaterials();
  const g = new THREE.Group();
  g.name = name;
  const body = new THREE.Mesh(geo, face);
  body.name = `${name}Glass`;
  body.renderOrder = 4;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), line);
  edges.name = `${name}Edges`;
  edges.renderOrder = 5;
  edges.userData.noExport = true;
  g.add(body, edges);
  return { group: g, body, edges };
}

/** A lens about the x axis: radius r, thickness at the middle `mid`, at the rim `rim` (a lathe of two arcs). */
export function lensGeometry(r, mid, rim, seg = 28) {
  const pts = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const y = (r * i) / n;
    const x = rim / 2 + (mid / 2 - rim / 2) * (1 - (y / r) ** 2);
    pts.push(new THREE.Vector2(y, x));
  }
  for (let i = n; i >= 0; i--) {
    const y = (r * i) / n;
    const x = rim / 2 + (mid / 2 - rim / 2) * (1 - (y / r) ** 2);
    pts.push(new THREE.Vector2(y, -x));
  }
  // lathe about y, then turn so the axis is x
  const geo = new THREE.LatheGeometry(
    pts.map((p) => new THREE.Vector2(Math.max(0.0001, p.x), p.y)),
    seg,
  );
  geo.rotateZ(-Math.PI / 2);
  return geo;
}
