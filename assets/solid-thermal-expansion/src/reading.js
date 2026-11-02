// The maths of the expansion of solids (book pp167–171), pure functions, unit-tested.
// The book's rule: L₂ = L₁ + αL₁(T₂ − T₁), A₂ = A₁ + βA₁(T₂ − T₁), V₂ = V₁ + γV₁(T₂ − T₁), with β = 2α and γ = 3α
// (the α² and α³ parts are left out because α is so small). The worked example is a copper rod: 10 m at 20° C,
// 10.0167 m at 120° C, so α = 16.7 × 10⁻⁶ °C⁻¹.

export const QUANTITIES = ['length', 'area', 'volume'];
/** The book's example: a copper rod, 10 m long at 20° C; the plate and cube have sides of 10 m too. */
export const COPPER = { alpha: 16.7e-6, side: 10, t1: 20, t2: 120 };
export const T1 = COPPER.t1;
export const T2_MAX = COPPER.t2;
/** The drawing shows the expansion this many times too big, else nothing could be seen. */
export const EXAGGERATION = 100;

/** The book's coefficients: α for length, β = 2α for area, γ = 3α for volume. */
export const coefficient = (q, alpha = COPPER.alpha) => alpha * (q === 'area' ? 2 : q === 'volume' ? 3 : 1);

/** Size of the body at T₂: L₂, A₂ or V₂ (the book's first-order rule). */
export function sizeAt(q, t2, { alpha = COPPER.alpha, side = COPPER.side, t1 = T1 } = {}) {
  const size1 = side ** (q === 'area' ? 2 : q === 'volume' ? 3 : 1);
  return size1 + coefficient(q, alpha) * size1 * (t2 - t1);
}

/** How much bigger than before, as a percentage. */
export const percentGrowth = (q, t2, p = {}) => coefficient(q, p.alpha ?? COPPER.alpha) * (t2 - (p.t1 ?? T1)) * 100;

/** α from a measurement, as the book's worked example: α = (L₂ − L₁) / (L₁ (T₂ − T₁)). */
export const alphaFrom = (l1, l2, t1, t2) => (l2 - l1) / (l1 * (t2 - t1));

/** Density after heating (book p171): ρ' = ρ / (1 + γ ΔT), γ = 3α. */
export const densityAfter = (rho, alpha, dT) => rho / (1 + 3 * alpha * dT);

/** How much each side of the drawn body grows (1 = the cold size): drawn too big by EXAGGERATION. */
export const drawnScale = (t2, p = {}) => 1 + EXAGGERATION * (p.alpha ?? COPPER.alpha) * (t2 - (p.t1 ?? T1));

/** Number to text with a fixed number of decimals, dropping trailing zeros only when asked. */
export function fixed(x, decimals, trim = false) {
  const s = x.toFixed(decimals);
  return trim && s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}
