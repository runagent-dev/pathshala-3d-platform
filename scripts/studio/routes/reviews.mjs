// Reviews: everyone who can see a figure reads its reviews and writes new ones; makers mark them done, reply or
// delete. Each review is its own file (reviews/<rid>.json), committed as its author.
import path from 'node:path';
import { addReview, deleteReview, readReviews, updateReview } from '../../lib/reviews.mjs';
import { json, readJson } from '../http.mjs';
import { figure } from './figures.mjs';

export function register(router, { git, rel }) {
  router.get('/api/assets/:id/reviews', 'reviews:read', async ({ res, params, user }) => {
    await figure(params.id, user);
    json(res, 200, { reviews: await readReviews(params.id) });
  });
  router.post('/api/assets/:id/reviews', 'reviews:add', async ({ req, res, params, user }) => {
    const dir = await figure(params.id, user);
    const body = await readJson(req, 2 * 1024 * 1024);
    // with an account the review carries the account's name; on an open local studio, the name typed in
    const author = user.username === 'local' ? body.author : user.name || user.username;
    const review = await addReview(params.id, { ...body, author });
    git.commit({ paths: [rel(path.join(dir, 'reviews'))], message: `review(${params.id}): from ${review.author}`, user });
    json(res, 201, review);
  });
  router.patch('/api/assets/:id/reviews/:rid', 'reviews:manage', async ({ req, res, params, user }) => {
    const dir = await figure(params.id, user);
    const review = await updateReview(params.id, params.rid, await readJson(req));
    git.commit({
      paths: [rel(path.join(dir, 'reviews'))],
      message: `review(${params.id}): ${review.status === 'done' ? 'done' : 'reopened'}${review.reply ? ' with a reply' : ''}`,
      user,
    });
    json(res, 200, review);
  });
  router.delete('/api/assets/:id/reviews/:rid', 'reviews:manage', async ({ res, params, user }) => {
    const dir = await figure(params.id, user);
    const r = await deleteReview(params.id, params.rid);
    git.commit({ paths: [rel(path.join(dir, 'reviews'))], message: `review(${params.id}): deleted ${params.rid}`, user });
    json(res, 200, r);
  });
}
