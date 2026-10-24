// Module resolve hook used by test/register.mjs. Mirrors the import map in every figure's index.html.
const ROOT = new URL('../', import.meta.url);
const EXACT = { three: 'shared/vendor/three/three.module.min.js' };
const PREFIX = { 'three/addons/': 'shared/vendor/three/addons/', '@shared/': 'shared/lib/' };

export async function resolve(specifier, context, next) {
  if (EXACT[specifier]) return next(new URL(EXACT[specifier], ROOT).href, context);
  for (const [prefix, dir] of Object.entries(PREFIX)) {
    if (specifier.startsWith(prefix)) return next(new URL(dir + specifier.slice(prefix.length), ROOT).href, context);
  }
  return next(specifier, context);
}
