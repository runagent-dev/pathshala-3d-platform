import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { recordTags } from '../../scripts/lib/library/manifest.mjs';
import { currentItems, groupByFigure, planAll, planFigure, summarize } from '../../scripts/lib/library/plan.mjs';

const H = (c) => c.repeat(64);
const FP = { lab: H('a'), glb: H('b'), poster: H('c'), video: H('d') };
const ALL = new Set(['lab', 'poster', 'glb']);
let n = 0;
const key = () => `c1:${String(++n).padStart(25, 'a')}a`.slice(0, 29);

/** A library item as the library returns it. */
function item(figure, kind, over = {}) {
  const { pose, state = 'current', published = '20260101T000000000Z', fp = FP, fp8 = 'aaaaaaaa', version = '0.1.0' } = over;
  return {
    key: over.key || key(),
    type: 'x',
    tags: recordTags({ kind, figure, figureVersion: version, fp8, fingerprints: fp, pose, state, published }),
  };
}

/** A figure as the repo describes it. */
const local = (over = {}) => ({
  id: 'f',
  fp8: 'aaaaaaaa',
  fp: FP,
  isPage: true,
  hasVideo: false,
  poses: ['default'],
  formats: ALL,
  problems: [],
  ...over,
});

/** The library's items for a figure that is fully published and matches `local()`. */
const complete = (figure = 'f') => [item(figure, 'manifest'), item(figure, 'lab'), item(figure, 'poster'), item(figure, 'glb', { pose: 'default' })];
const plan = (records, l = local()) => planFigure({ id: 'f', local: l, remote: groupByFigure(records).get('f') });

describe('library planner', () => {
  it('a figure the library has never seen is new, and everything is built', () => {
    const p = plan([]);
    assert.equal(p.category, 'new');
    assert.deepEqual(p.build, { lab: true, poster: true, video: false, glb: ['default'], manifest: true });
  });

  it('a figure that matches the library is unchanged and nothing is built', () => {
    const p = plan(complete());
    assert.equal(p.category, 'unchanged');
    assert.deepEqual(p.build, { lab: false, poster: false, video: false, glb: [], manifest: false });
    assert.deepEqual(p.reasons, []);
  });

  it('a changed lab fingerprint rebuilds the lab and the manifest, not the poster or the model', () => {
    const p = plan(complete(), local({ fp: { ...FP, lab: H('9') } }));
    assert.equal(p.category, 'changed');
    assert.deepEqual(p.build, { lab: true, poster: false, video: false, glb: [], manifest: true });
    assert.match(p.reasons.join(), /the lab changed/);
  });

  it('a changed model fingerprint rebuilds the models and the manifest only', () => {
    const p = plan(complete(), local({ fp: { ...FP, glb: H('9') } }));
    assert.equal(p.category, 'changed');
    assert.deepEqual(p.build, { lab: false, poster: false, video: false, glb: ['default'], manifest: true });
  });

  it('a changed poster fingerprint rebuilds the poster and the manifest only', () => {
    const p = plan(complete(), local({ fp: { ...FP, poster: H('9') } }));
    assert.deepEqual(p.build, { lab: false, poster: true, video: false, glb: [], manifest: true });
  });

  it('a change that is only in the descriptive fields rewrites the manifest and builds nothing else', () => {
    const p = plan(complete(), local({ fp8: 'bbbbbbbb' }));
    assert.equal(p.category, 'changed');
    assert.deepEqual(p.build, { lab: false, poster: false, video: false, glb: [], manifest: true });
  });

  it('an item missing from a figure that is otherwise current is a repair', () => {
    const records = complete().filter((r) => !r.tags.includes('kind:poster'));
    const p = plan(records);
    assert.equal(p.category, 'repair');
    assert.deepEqual(p.build, { lab: false, poster: true, video: false, glb: [], manifest: true });
    assert.match(p.reasons.join(), /poster is not in the library/);
  });

  it('a missing manifest is a repair that writes the manifest again without rebuilding anything else', () => {
    const p = plan(complete().filter((r) => !r.tags.includes('kind:manifest')));
    assert.equal(p.category, 'repair');
    assert.deepEqual(p.build, { lab: false, poster: false, video: false, glb: [], manifest: true });
  });

  it('a model missing for one of several poses is rebuilt alone', () => {
    const l = local({ poses: ['default', 'open'] });
    const p = plan(complete(), l);
    assert.equal(p.category, 'repair');
    assert.deepEqual(p.build.glb, ['open']);
  });

  it('a pose the figure no longer has is demoted, not withdrawn', () => {
    const records = [...complete(), item('f', 'glb', { pose: 'gone' })];
    const p = plan(records);
    assert.equal(p.category, 'repair');
    assert.equal(p.demote.length, 1);
    assert.deepEqual(p.withdraw, []);
    assert.match(p.reasons.join(), /"gone" is no longer a pose/);
  });

  it('items marked superseded are not the current ones', () => {
    const records = [
      item('f', 'manifest', { state: 'superseded' }),
      item('f', 'lab', { state: 'superseded' }),
      item('f', 'poster'),
      item('f', 'glb', { pose: 'default' }),
    ];
    const p = plan(records);
    assert.equal(p.build.lab, true);
    assert.equal(p.build.manifest, true);
    assert.equal(p.build.poster, false);
  });

  it('two current items for the same part (an interrupted run): the newest wins and the older is demoted', () => {
    const old = item('f', 'lab', { published: '20260101T000000000Z', fp: { ...FP, lab: H('0') } });
    const fresh = item('f', 'lab', { published: '20260202T000000000Z' });
    const records = [item('f', 'manifest'), old, fresh, item('f', 'poster'), item('f', 'glb', { pose: 'default' })];
    const cur = currentItems(groupByFigure(records).get('f'));
    assert.equal(cur.lab.key, fresh.key);
    assert.deepEqual(
      cur.duplicates.map((d) => d.key),
      [old.key],
    );
    const p = plan(records);
    assert.equal(p.category, 'repair');
    assert.equal(p.demote.length, 1);
    assert.equal(p.build.lab, false, 'the newest lab already matches, nothing is rebuilt');
  });

  it('an interrupted run that wrote the new lab but not the manifest finishes with only the manifest', () => {
    const records = [
      item('f', 'manifest', { fp8: 'oldoldol' }),
      item('f', 'lab', { published: '20260202T000000000Z' }),
      item('f', 'poster'),
      item('f', 'glb', { pose: 'default' }),
    ];
    const p = plan(records);
    assert.equal(p.category, 'changed');
    assert.deepEqual(p.build, { lab: false, poster: false, video: false, glb: [], manifest: true });
  });

  it('a figure that is no longer in the repo is planned as withdraw, with its current items only', () => {
    const records = [...complete(), item('f', 'lab', { state: 'superseded' })];
    const p = planFigure({ id: 'f', local: null, remote: groupByFigure(records).get('f') });
    assert.equal(p.category, 'withdraw');
    assert.equal(p.withdraw.length, 4, 'the superseded lab is left alone');
  });

  it('a figure that is in neither place is nothing to do', () => {
    assert.equal(planFigure({ id: 'f', local: null, remote: undefined }).category, 'unchanged');
  });

  it('a figure that may not be published is blocked, whatever the library holds', () => {
    const p = plan(
      complete(),
      local({ problems: ['the figure or the kit files it imports have uncommitted changes: production publishes from a clean worktree'] }),
    );
    assert.equal(p.category, 'blocked');
    assert.deepEqual(p.build, { lab: false, poster: false, video: false, glb: [], manifest: false });
    assert.match(p.reasons[0], /uncommitted/);
  });

  it('formats limit what is expected: lab only expects no poster and no model', () => {
    const p = plan([item('f', 'manifest'), item('f', 'lab')], local({ formats: new Set(['lab']) }));
    assert.equal(p.category, 'unchanged');
  });

  it('a figure with no page (a model) is published as models only, with no manifest', () => {
    const l = local({ isPage: false });
    assert.equal(plan([], l).category, 'new');
    assert.deepEqual(plan([], l).build, { lab: false, poster: false, video: false, glb: ['default'], manifest: false });
    assert.equal(plan([item('f', 'glb', { pose: 'default' })], l).category, 'unchanged');
  });

  it('video is expected only when asked for and the figure has one', () => {
    const asked = local({ hasVideo: true, formats: new Set([...ALL, 'video']) });
    assert.equal(plan(complete(), asked).build.video, true);
    assert.equal(plan(complete(), local({ hasVideo: false, formats: new Set([...ALL, 'video']) })).build.video, false);
    assert.equal(plan(complete(), local({ hasVideo: true })).build.video, false);
  });

  it('planAll covers the repo and the library, and counts', () => {
    const records = [...complete('present'), ...complete('removed')];
    const locals = [local({ id: 'present' }), local({ id: 'fresh' })];
    const plans = planAll({ locals, records });
    assert.deepEqual(
      plans.map((p) => `${p.id}:${p.category}`),
      ['present:unchanged', 'fresh:new', 'removed:withdraw'],
    );
    assert.deepEqual(summarize(plans), { new: 1, changed: 0, repair: 0, unchanged: 1, withdraw: 1, blocked: 0 });
  });

  it('with a selection of figures, nothing is planned for withdrawal', () => {
    const plans = planAll({ locals: [local({ id: 'present' })], records: [...complete('present'), ...complete('removed')], detectRemoved: false });
    assert.deepEqual(
      plans.map((p) => p.id),
      ['present'],
    );
  });
});
