// A small burner as the book draws it (চিত্র ৬.০৪): a pale stick with a flame on top. The flame grows with the heat
// (0 = unlit … 1 = full) and flickers a little. Units are centimetres; the stick stands on y = 0.
import * as THREE from 'three';

const FLAME_PROFILE = [
  [0, 0],
  [0.3, 0.05],
  [0.42, 0.28],
  [0.38, 0.55],
  [0.24, 0.95],
  [0.1, 1.3],
  [0, 1.55],
].map(([r, y]) => new THREE.Vector2(r, y));

export function createBurner({ height = 2.2, radius = 0.3, flame = 1.5 } = {}) {
  const root = new THREE.Group();
  root.name = 'Burner';
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.15, height, 24),
    new THREE.MeshStandardMaterial({ name: 'BurnerStick', color: '#a9c3dc', roughness: 0.45, metalness: 0.2 }),
  );
  stick.position.y = height / 2;
  const tip = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.8, radius, 0.25, 24),
    new THREE.MeshStandardMaterial({ name: 'BurnerTip', color: '#4f6479', roughness: 0.4, metalness: 0.5 }),
  );
  tip.position.y = height + 0.12;
  const fire = new THREE.Group();
  fire.position.y = height + 0.2;
  const outer = new THREE.Mesh(
    new THREE.LatheGeometry(FLAME_PROFILE, 20),
    new THREE.MeshBasicMaterial({ name: 'Flame', color: '#ff8a1f', transparent: true, opacity: 0.93 }),
  );
  const inner = new THREE.Mesh(
    new THREE.LatheGeometry(FLAME_PROFILE, 16),
    new THREE.MeshBasicMaterial({ name: 'FlameCore', color: '#ffe06b', transparent: true, opacity: 0.95 }),
  );
  inner.scale.set(0.55, 0.62, 0.55);
  fire.add(outer, inner);
  fire.visible = false;
  // a touch target round the flame, never drawn
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = height + 0.9;
  hit.name = 'BurnerHit';
  root.add(stick, tip, fire, hit);
  const scale = flame / 1.55;

  return {
    root,
    hit,
    /** where the flame's middle is (a point in the burner's own space) */
    flamePoint: (target) => target.set(0, height + 0.2 + flame * 0.35, 0),
    /** heat 0…1 (a flame only above 0) and the clock for the flicker; returns whether it is lit */
    set(heat, time = 0) {
      const lit = heat > 0.001;
      fire.visible = lit;
      if (!lit) return false;
      const f = 0.45 + 0.55 * heat;
      const flick = 1 + 0.05 * Math.sin(time * 19) + 0.03 * Math.sin(time * 31 + 1);
      fire.scale.set(scale * f * (1.02 - 0.02 * flick), scale * f * flick, scale * f * (1.02 - 0.02 * flick));
      return true;
    },
  };
}
