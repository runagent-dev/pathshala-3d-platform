// The setting both examples share: a soft muted wall (a calm blue-grey, lighter low down) and a plain warm floor.
// No furniture or props: only the student, the comb, the paper and the magnet draw the eye. Two planes without
// textures, in millimetres; it never moves and casts no shadow. Not exported to the GLB (the figure exports only the
// experiment).
import * as THREE from 'three';

/** The floor's height (the tables' legs stand on it). */
export const FLOOR_Y = -724;
const WALL_Z = -470;
const WALL = { x0: -1500, x1: 1700, h: 2100 }; // mm, from the floor up

export function createRoom() {
  const room = new THREE.Group();
  room.name = 'Room';
  room.userData.noExport = true;
  const geo = new THREE.PlaneGeometry(WALL.x1 - WALL.x0, WALL.h, 1, 8);
  // a gentle gradient in vertex colours: a little lighter near the floor
  const top = new THREE.Color('#8fa6b8');
  const low = new THREE.Color('#c3cfd6');
  const col = new THREE.Color();
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    col.lerpColors(low, top, pos.getY(i) / WALL.h + 0.5);
    colors.set([col.r, col.g, col.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const wall = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'Wall', vertexColors: true, roughness: 0.95 }));
  wall.position.set((WALL.x0 + WALL.x1) / 2, FLOOR_Y + WALL.h / 2, WALL_Z);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WALL.x1 - WALL.x0, 2600).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Floor', color: '#a77a62', roughness: 0.8 }),
  );
  floor.position.set(wall.position.x, FLOOR_Y, WALL_Z + 1300);
  room.add(wall, floor);
  return room;
}
