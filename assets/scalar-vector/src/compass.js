// Cardinal directions are projected from the same world axes as the path, so the compass follows a tilted camera.
import * as THREE from 'three';
const SVG = 'http://www.w3.org/2000/svg';
const DIRECTIONS = { n: [0, 0, -1], e: [1, 0, 0], s: [0, 0, 1], w: [-1, 0, 0] };
export function createCompass(stage, t) {
  const el = document.createElement('div');
  el.className = 'sv-compass';
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', t('compass_aria'));
  svg.innerHTML = '<circle cx="32" cy="32" r="31" fill="#fffdf1" stroke="#204c43" stroke-width="1.2"/>';
  const entries = Object.entries(DIRECTIONS).map(([name, direction]) => {
    const arm = document.createElementNS(SVG, 'polygon');
    arm.setAttribute('fill', name === 'n' ? '#d84f42' : name === 's' ? '#21455b' : '#288472');
    const text = document.createElementNS(SVG, 'text');
    text.textContent = t(`compass_${name}`);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', name === 'n' ? '#b82f2b' : '#173e37');
    text.setAttribute('font-weight', '700');
    text.setAttribute('font-size', '12');
    svg.append(arm, text);
    return { name, vector: new THREE.Vector3(...direction), arm, text, screen: { x: 0, y: 0 } };
  });
  const center = document.createElementNS(SVG, 'circle');
  center.setAttribute('cx', '32');
  center.setAttribute('cy', '32');
  center.setAttribute('r', '2.3');
  center.setAttribute('fill', '#fffdf1');
  svg.append(center);
  const caption = document.createElement('span');
  caption.textContent = t('compass');
  el.append(svg, caption);
  const origin = new THREE.Vector3(),
    p = new THREE.Vector3();
  function update() {
    origin.copy(stage.controls.target).project(stage.camera);
    for (const item of entries) {
      p.copy(stage.controls.target).add(item.vector).project(stage.camera);
      const dx = (p.x - origin.x) * stage.width;
      const dy = -(p.y - origin.y) * stage.height;
      const length = Math.hypot(dx, dy) || 1;
      const x = dx / length,
        y = dy / length;
      item.screen = { x, y };
      item.arm.setAttribute('points', `${32 - y * 4},${32 + x * 4} ${32 + x * 17},${32 + y * 17} ${32 + y * 4},${32 - x * 4} 32,32`);
      item.text.setAttribute('x', String(32 + x * 25));
      item.text.setAttribute('y', String(32 + y * 25));
    }
  }
  const stop = stage.onAfterRender(update);
  return { el, update, directions: () => Object.fromEntries(entries.map((item) => [item.name, { ...item.screen }])), dispose: stop };
}
