// Who may do what in the studio. One table, checked by the router before any handler runs (and by a few handlers
// for finer rules, e.g. which statuses a contributor may set). Roles:
//   admin        the platform owner(s): everything
//   contributor  makes figures: edit, upload, export previews, answer reviews; status up to "review"
//   reviewer     invited to look and comment: sees figures in review, writes reviews
export const ROLES = ['admin', 'contributor', 'reviewer'];

const ALL = ROLES;
const MAKERS = ['admin', 'contributor'];

export const PERMISSIONS = {
  'me:read': ALL,
  'books:read': ALL,
  'events:read': ALL,
  'figures:read': ALL,
  'reviews:read': ALL,
  'reviews:add': ALL,
  'reviews:manage': MAKERS, // mark done, reply, delete
  'figures:create': MAKERS,
  'figures:edit': MAKERS,
  'status:set': MAKERS,
  'notes:read': MAKERS,
  'notes:write': MAKERS,
  'thumbnails:write': MAKERS,
  'package:build': MAKERS,
  'exports:read': MAKERS,
  'exports:preview': MAKERS,
  'exports:release': ['admin'],
  'uploads:create': MAKERS,
  'jobs:read': MAKERS,
  'jobs:cancel': MAKERS,
  'git:read': MAKERS,
  'git:sync': ['admin'],
};

/** Statuses each role may set (approving is the admin's call). */
export const STATUS_RIGHTS = {
  admin: ['idea', 'in-progress', 'review', 'changes', 'approved'],
  contributor: ['idea', 'in-progress', 'review'],
  reviewer: [],
};
/** Statuses a reviewer can see (the rest are not ready to be looked at). */
export const REVIEWER_STATUSES = ['review', 'changes', 'approved'];

export function allowed(role, permission) {
  const who = PERMISSIONS[permission];
  if (!who) throw new Error(`Unknown permission "${permission}"`);
  return who.includes(role);
}
