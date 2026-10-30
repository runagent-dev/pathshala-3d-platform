// The planner: what the library holds vs what the repo says, and what to do about each figure. Pure functions on plain data
// (no files, no network), so every case is a unit test.
//
// What the library holds is read from item tags (manifest.mjs recordTags), not from the bytes:
//   kind:manifest|lab|poster|glb   state:current|superseded   figure:<id>   source:<fp8>   fp-lab/fp-glb/fp-poster:<hash16>
//   pose:<name> (glb)   published:<stamp>
// "Current" is the item with state:current; if a crash left two, the one published last.
import { tagValue } from './manifest.mjs';

export const CATEGORIES = ['new', 'changed', 'repair', 'unchanged', 'withdraw', 'blocked'];

const FP_LEN = 16;
const short = (h) => (h ? h.slice(0, FP_LEN) : h);
const newest = (records) => [...records].sort((a, b) => (tagValue(b, 'published') || '').localeCompare(tagValue(a, 'published') || ''))[0] || null;
const isCurrent = (r) => tagValue(r, 'state') !== 'superseded';

/** Groups the snapshot of the library by figure: { manifests, artifacts } of every item tagged figure:<id>. */
export function groupByFigure(records) {
  const out = new Map();
  for (const r of records) {
    const id = tagValue(r, 'figure');
    if (!id) continue;
    if (!out.has(id)) out.set(id, { manifests: [], artifacts: [] });
    (tagValue(r, 'kind') === 'manifest' ? out.get(id).manifests : out.get(id).artifacts).push(r);
  }
  return out;
}

/** The library items that are the figure's current ones: manifest, lab, poster and one glb per pose. */
export function currentItems(remote) {
  const cur = (kind, pose) =>
    newest(
      (remote?.artifacts || []).filter((r) => isCurrent(r) && tagValue(r, 'kind') === kind && (pose === undefined || tagValue(r, 'pose') === pose)),
    );
  const manifestsCurrent = (remote?.manifests || []).filter(isCurrent);
  const poses = [...new Set((remote?.artifacts || []).filter((r) => isCurrent(r) && tagValue(r, 'kind') === 'glb').map((r) => tagValue(r, 'pose')))];
  const duplicates = [];
  if (manifestsCurrent.length > 1) duplicates.push(...manifestsCurrent.filter((r) => r !== newest(manifestsCurrent)));
  for (const kind of ['lab', 'poster', 'video']) {
    const all = (remote?.artifacts || []).filter((r) => isCurrent(r) && tagValue(r, 'kind') === kind);
    if (all.length > 1) duplicates.push(...all.filter((r) => r !== newest(all)));
  }
  for (const pose of poses) {
    const all = (remote?.artifacts || []).filter((r) => isCurrent(r) && tagValue(r, 'kind') === 'glb' && tagValue(r, 'pose') === pose);
    if (all.length > 1) duplicates.push(...all.filter((r) => r !== newest(all)));
  }
  return {
    manifest: newest(manifestsCurrent),
    lab: cur('lab'),
    poster: cur('poster'),
    video: cur('video'),
    glb: Object.fromEntries(poses.map((p) => [p, cur('glb', p)])),
    duplicates,
  };
}

/**
 * Plans one figure.
 *
 * `local` is null when the figure is not in the repo (it was removed). Otherwise:
 *   { id, fp8, fp: { lab, glb, poster, video }, isPage, hasVideo, poses: string[], formats: Set<'lab'|'glb'|'poster'|'video'>, problems: string[] }
 *   where `problems` are reasons the figure may not be published at all (gates, validation).
 * `remote` is { manifests, artifacts } from groupByFigure, or undefined.
 *
 * @param {{ id: string, local: any, remote?: any }} o
 * @returns {{ id: string, category: string, reasons: string[], build: { lab: boolean, poster: boolean, video: boolean, glb: string[], manifest: boolean },
 *             demote: any[], withdraw: any[], problems: string[] }}
 */
export function planFigure({ id, local, remote }) {
  const cur = currentItems(remote);
  const has = Boolean(cur.manifest || cur.lab || cur.poster || cur.video || Object.keys(cur.glb).length);
  const plan = {
    id,
    category: 'unchanged',
    reasons: [],
    build: { lab: false, poster: false, video: false, glb: [], manifest: false },
    demote: [],
    withdraw: [],
    problems: [],
  };

  if (!local) {
    // removed from the repo: its current items are withdrawn, but only when the caller allows it
    const items = [cur.manifest, cur.lab, cur.poster, cur.video, ...Object.values(cur.glb)].filter(Boolean);
    plan.category = has ? 'withdraw' : 'unchanged';
    plan.withdraw = items;
    plan.reasons.push('the figure is no longer in the repo');
    return plan;
  }

  if (local.problems.length) {
    plan.category = 'blocked';
    plan.problems = [...local.problems];
    plan.reasons.push(...local.problems);
    return plan;
  }

  const want = local.formats;
  const reasons = [];
  let missing = false;
  let changed = false;

  const wantLab = local.isPage && want.has('lab');
  const wantPoster = local.isPage && want.has('poster');
  const wantGlb = want.has('glb') ? local.poses : [];
  const wantVideo = local.isPage && want.has('video') && local.hasVideo;

  // one part (lab, poster, a pose): absent from the library is 'missing', present with another fingerprint is 'changed'
  const part = (item, tagKey, fp, what) => {
    if (!item) {
      missing = true;
      reasons.push(`${what} is not in the library`);
      return true;
    }
    if (tagValue(item, tagKey) !== short(fp)) {
      changed = true;
      reasons.push(`${what} changed`);
      return true;
    }
    return false;
  };
  if (wantLab) plan.build.lab = part(cur.lab, 'fp-lab', local.fp.lab, 'the lab');
  if (wantPoster) plan.build.poster = part(cur.poster, 'fp-poster', local.fp.poster, 'the poster');
  if (wantVideo) plan.build.video = part(cur.video, 'fp-video', local.fp.video, 'the video');
  for (const pose of wantGlb) if (part(cur.glb[pose], 'fp-glb', local.fp.glb, `the model "${pose}"`)) plan.build.glb.push(pose);
  // poses the repo no longer has: not withdrawn, only no longer current
  if (want.has('glb')) {
    for (const [pose, item] of Object.entries(cur.glb)) {
      if (item && !local.poses.includes(pose)) {
        plan.demote.push(item);
        reasons.push(`the model "${pose}" is no longer a pose`);
      }
    }
  }

  if (local.isPage && (wantLab || wantPoster)) {
    if (!cur.manifest) {
      missing = true;
      reasons.push('the lab manifest is not in the library');
      plan.build.manifest = true;
    } else if (tagValue(cur.manifest, 'source') !== local.fp8) {
      changed = true;
      reasons.push('the figure changed (manifest)');
      plan.build.manifest = true;
    }
    // a poster exists but the manifest's record does not name it: the picker shows no thumbnail until the record is written again
    if (cur.manifest && cur.poster && wantPoster && !cur.manifest.poster) {
      missing = true;
      reasons.push('the lab manifest record does not name its poster (no thumbnail in the picker)');
      plan.build.manifest = true;
    }
    // anything rebuilt means the manifest (the commit point) is written again so it points at the new items
    if (plan.build.lab || plan.build.poster || plan.build.video || plan.build.glb.length) plan.build.manifest = true;
  }

  for (const d of cur.duplicates) {
    plan.demote.push(d);
    reasons.push('two items were current for the same part (an interrupted run): the older is demoted');
  }

  const nothingLeft = !plan.build.manifest && !plan.build.lab && !plan.build.poster && !plan.build.video && !plan.build.glb.length;
  if (!has) plan.category = 'new';
  else if (changed) plan.category = 'changed';
  else if (missing || (nothingLeft && plan.demote.length)) plan.category = 'repair';
  else plan.category = 'unchanged';
  plan.reasons = [...new Set(reasons)];
  return plan;
}

/** Plans all figures; figures in the library but not in `locals` or `knownIds` (when `detectRemoved`) are planned for withdrawal. */
export function planAll({ locals, records, detectRemoved = true, knownIds = [] }) {
  const remote = groupByFigure(records);
  const plans = locals.map((local) => planFigure({ id: local.id, local, remote: remote.get(local.id) }));
  if (detectRemoved) {
    // knownIds: figures that exist in the repo but could not be planned (a broken asset.json): they are blocked, never "removed"
    const present = new Set([...locals.map((l) => l.id), ...knownIds]);
    for (const [id, r] of [...remote].sort(([a], [b]) => a.localeCompare(b)))
      if (!present.has(id)) plans.push(planFigure({ id, local: null, remote: r }));
  }
  return plans;
}

export function summarize(plans) {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const p of plans) counts[p.category] += 1;
  return counts;
}
