// Reviews and status, against a temporary copy of a figure (PATHSHALA_ASSETS_DIR).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import { copyFigure, readJson, tempDir } from '../helpers.mjs';

const assets = tempDir({ inRepo: true });
process.env.PATHSHALA_ASSETS_DIR = assets;
const dir = copyFigure('screw-gauge', assets);
const { addReview, deleteReview, readReviews, reviewCounts, updateReview } = await import('../../scripts/lib/reviews.mjs');
const { readStatus, writeStatus } = await import('../../scripts/lib/status.mjs');

const PNG = `data:image/png;base64,${Buffer.from('89504e470d0a1a0a', 'hex').toString('base64')}`;

describe('reviews', () => {
  before(() => fs.rmSync(path.join(dir, 'reviews'), { recursive: true, force: true }));

  it('stores each review in its own file', async () => {
    const r = await addReview('screw-gauge', { author: 'রহিম', text: 'ভালো হয়েছে', image: PNG, context: { frame: 'fill' } });
    assert.ok(fs.existsSync(path.join(dir, 'reviews', `${r.id}.json`)));
    assert.ok(fs.existsSync(path.join(dir, r.image)));
    assert.deepEqual(readJson(path.join(dir, 'reviews', `${r.id}.json`)), r);
  });

  it('keeps reviews sent at the same time apart', async () => {
    await Promise.all(Array.from({ length: 8 }, (_, i) => addReview('screw-gauge', { author: `r${i}`, text: `t${i}` })));
    assert.equal((await readReviews('screw-gauge')).length, 9);
  });

  it('marks done, replies and counts', async () => {
    const [first] = await readReviews('screw-gauge');
    const r = await updateReview('screw-gauge', first.id, { status: 'done', reply: 'Fixed in 0.1.1' });
    assert.equal(r.status, 'done');
    assert.equal(r.reply, 'Fixed in 0.1.1');
    assert.deepEqual(await reviewCounts('screw-gauge'), { open: 8, total: 9 });
  });

  it('deletes the review and its picture', async () => {
    const [first] = await readReviews('screw-gauge');
    await deleteReview('screw-gauge', first.id);
    assert.ok(!fs.existsSync(path.join(dir, 'reviews', `${first.id}.json`)));
    assert.ok(!fs.existsSync(path.join(dir, first.image)));
  });

  it('refuses bad input', async () => {
    await assert.rejects(addReview('screw-gauge', { author: '', text: 'x' }), { status: 400 });
    await assert.rejects(addReview('screw-gauge', { author: 'a', text: 'x', image: 'data:image/gif;base64,AAAA' }), { status: 400 });
    const big = `data:image/png;base64,${Buffer.alloc(1024 * 1024 + 1).toString('base64')}`;
    await assert.rejects(addReview('screw-gauge', { author: 'a', text: 'x', image: big }), { status: 413 });
    await assert.rejects(updateReview('screw-gauge', '../../asset', { status: 'done' }), { status: 404 });
    await assert.rejects(updateReview('screw-gauge', 'abcdef123', { status: /** @type {any} */ ('maybe') }), { status: 404 });
  });

  it('still reads an old reviews.json and moves a review out of it when it changes', async () => {
    const legacy = [{ id: 'old000aa', author: 'x', text: 'old', createdAt: '2026-01-01T00:00:00.000Z', status: 'open' }];
    fs.writeFileSync(path.join(dir, 'reviews', 'reviews.json'), JSON.stringify(legacy));
    assert.ok((await readReviews('screw-gauge')).some((r) => r.id === 'old000aa'));
    await updateReview('screw-gauge', 'old000aa', { status: 'done' });
    assert.ok(fs.existsSync(path.join(dir, 'reviews', 'old000aa.json')));
    assert.ok(!fs.existsSync(path.join(dir, 'reviews', 'reviews.json')));
    assert.equal((await readReviews('screw-gauge')).find((r) => r.id === 'old000aa').status, 'done');
  });
});

describe('status.json', () => {
  it('appends to the history', async () => {
    const before = (await readStatus('screw-gauge')).history.length;
    const s = await writeStatus('screw-gauge', 'approved', { by: 'owner', version: '0.1.0' });
    assert.equal(s.status, 'approved');
    assert.equal(s.history.length, before + 1);
    assert.equal(readJson(path.join(dir, 'status.json')).status, 'approved');
  });
  it('refuses an unknown status', async () => {
    await assert.rejects(writeStatus('screw-gauge', 'shipped'), { status: 400 });
  });
});
