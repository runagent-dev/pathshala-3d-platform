// A small JSON Schema validator for the subset our specs use: type, enum, const, pattern, minLength, maxLength,
// minimum, maximum, required, properties, additionalProperties, items, minItems, maxItems, uniqueItems, oneOf,
// anyOf and local $ref ("#/$defs/…"). Node built-ins only, so the studio needs no install. `patternHint` (our own
// keyword, ignored by other validators) says in words what a pattern expects.

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const isType = (v, t) => (t === 'number' ? typeof v === 'number' && Number.isFinite(v) : typeOf(v) === t);
const show = (v) => JSON.stringify(v);

function resolve(schema, root) {
  if (!schema.$ref) return schema;
  const m = /^#\/\$defs\/(.+)$/.exec(schema.$ref);
  if (!m || !root.$defs?.[m[1]]) throw new Error(`Unsupported $ref ${schema.$ref}`);
  return root.$defs[m[1]];
}

const join = (path, key) => (typeof key === 'number' ? `${path}[${key}]` : path ? `${path}.${key}` : key);

/** Returns a list of { path, message }; empty when `value` matches `schema`. */
export function validateSchema(schema, value, root = schema, path = '') {
  const s = resolve(schema, root);
  const errors = [];
  const fail = (message, at = path) => errors.push({ path: at || '(root)', message });

  if (s.oneOf || s.anyOf) {
    const branches = s.oneOf || s.anyOf;
    const results = branches.map((b) => validateSchema(b, value, root, path));
    const passing = results.filter((r) => r.length === 0).length;
    if (s.oneOf ? passing === 1 : passing >= 1) return errors;
    if (passing > 1) return [{ path: path || '(root)', message: 'matches more than one allowed form' }];
    // Report the branch that has the right type (it is the one the author meant), else a summary.
    const typed = branches.findIndex((b) => {
      const t = resolve(b, root).type;
      return t && [].concat(t).some((x) => isType(value, x));
    });
    if (typed >= 0) return results[typed];
    return [{ path: path || '(root)', message: `has the wrong form (${typeOf(value)})` }];
  }

  if ('const' in s && value !== s.const) fail(`must be ${show(s.const)}`);
  if (s.enum && !s.enum.includes(value)) fail(`must be one of ${s.enum.map(show).join(', ')}`);
  if (s.type) {
    const types = [].concat(s.type);
    if (!types.some((t) => isType(value, t))) {
      fail(`must be ${types.join(' or ')}, not ${typeOf(value)}`);
      return errors;
    }
  }

  if (typeof value === 'string') {
    if (s.minLength != null && value.length < s.minLength) fail(s.minLength === 1 ? 'must not be empty' : `must be at least ${s.minLength} characters`);
    if (s.maxLength != null && value.length > s.maxLength) fail(`must be at most ${s.maxLength} characters`);
    if (s.pattern && !new RegExp(s.pattern, 'u').test(value)) fail(`${show(value)} should be ${s.patternHint || `in the form ${s.pattern}`}`);
  }
  if (typeof value === 'number') {
    if (s.minimum != null && value < s.minimum) fail(`must be at least ${s.minimum}`);
    if (s.maximum != null && value > s.maximum) fail(`must be at most ${s.maximum}`);
  }
  if (Array.isArray(value)) {
    if (s.minItems != null && value.length < s.minItems) fail(`needs at least ${s.minItems} item${s.minItems === 1 ? '' : 's'}`);
    if (s.maxItems != null && value.length > s.maxItems) fail(`may have at most ${s.maxItems} items`);
    if (s.uniqueItems) {
      const seen = new Set();
      value.forEach((v, i) => {
        const key = show(v);
        if (seen.has(key)) fail(`repeats ${key}`, join(path, i));
        seen.add(key);
      });
    }
    if (s.items) value.forEach((v, i) => errors.push(...validateSchema(s.items, v, root, join(path, i))));
  }
  if (typeOf(value) === 'object') {
    for (const k of s.required || []) if (!(k in value)) fail(`is missing "${k}"`);
    for (const [k, v] of Object.entries(value)) {
      if (s.properties && k in s.properties) errors.push(...validateSchema(s.properties[k], v, root, join(path, k)));
      else if (s.additionalProperties === false) fail(`unknown field "${k}"`, join(path, k));
      else if (typeof s.additionalProperties === 'object') errors.push(...validateSchema(s.additionalProperties, v, root, join(path, k)));
    }
  }
  return errors;
}
