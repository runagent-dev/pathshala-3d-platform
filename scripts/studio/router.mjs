// A small router for the studio API: routes are (method, pattern, permission, handler). The permission is checked
// against the policy before the handler runs; ":name" segments become ctx.params.name.
import { allowed } from './policy.mjs';
import { json } from './http.mjs';

export function createRouter() {
  const routes = [];
  const add = (method) => (pattern, permission, handler) => {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)'))}/?$`);
    routes.push({ method, re, keys, permission, handler });
  };
  return {
    get: add('GET'),
    post: add('POST'),
    put: add('PUT'),
    patch: add('PATCH'),
    delete: add('DELETE'),
    /** Handles the request if a route matches; returns false otherwise. */
    async handle(req, res, url, user) {
      const matching = routes.filter((r) => r.re.test(url.pathname));
      if (!matching.length) return false;
      const route = matching.find((r) => r.method === req.method || (req.method === 'HEAD' && r.method === 'GET'));
      if (!route) return json(res, 405, { error: 'Method not allowed' }), true;
      if (route.permission && !user) return json(res, 401, { error: 'Please log in' }), true;
      if (route.permission && !allowed(user.role, route.permission)) {
        const error =
          user.role === 'reviewer' ? 'Reviewers can look at the figures and add reviews, but not change them.' : 'You are not allowed to do this.';
        return json(res, 403, { error }), true;
      }
      const m = route.re.exec(url.pathname);
      const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      await route.handler({ req, res, url, user, params });
      return true;
    },
  };
}
