// Vector readings for book p38, Figure 2.03. Angles run from east towards north; moving a tail changes no vector.
export const DIRS = ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'];
export const QUANTITIES = {
  temp: 'scalar',
  time: 'scalar',
  length: 'scalar',
  mass: 'scalar',
  position: 'vector',
  velocity: 'vector',
  force: 'vector',
};
export const VECTORS = {
  A: { tail: [-22, -11], length: 25, angle: 45 },
  B: { tail: [2, -11], length: 25, angle: 45 },
  C: { tail: [20, -11], length: 25, angle: 135 },
  D: { tail: [20, -11], length: 12.5, angle: 135 },
};
export const PAIRS = { B: 'A', C: 'A', D: 'C' };
const EPS = 1e-6;
export const tidy = (x) => +x.toFixed(9) + 0;
export const norm360 = (degrees) => tidy(((degrees % 360) + 360) % 360);
export function compass(angle) {
  const a = norm360(angle);
  const index = Math.round(a / 45);
  return Math.abs(a - index * 45) < EPS ? DIRS[index % 8] : null;
}
export function components(length, angle) {
  const radians = (angle * Math.PI) / 180;
  return [tidy(length * Math.cos(radians)), tidy(length * Math.sin(radians))];
}
export function polar(x, y) {
  return { length: tidy(Math.hypot(x, y)), angle: norm360((Math.atan2(y, x) * 180) / Math.PI) };
}
export function headOf({ tail, length, angle }) {
  const [x, y] = components(length, angle);
  return [tidy(tail[0] + x), tidy(tail[1] + y)];
}
export const sameMagnitude = (a, b) => Math.abs(a.length - b.length) < EPS;
export const sameDirection = (a, b) => norm360(a.angle - b.angle) < EPS || norm360(b.angle - a.angle) < EPS;
export function compare(a, b) {
  const magnitude = sameMagnitude(a, b);
  const direction = sameDirection(a, b);
  return {
    sameMagnitude: magnitude,
    sameDirection: direction,
    equal: magnitude && direction,
    opposite: magnitude && Math.abs(norm360(a.angle - b.angle) - 180) < EPS,
  };
}
export function verdict(a, b) {
  const c = compare(a, b);
  return c.equal ? 'equal' : c.sameMagnitude ? 'direction' : c.sameDirection ? 'magnitude' : 'both';
}
