// The studio's git writer on throwaway repositories: commits as the user, push and pull with a remote, and a
// rescue branch when a pull conflicts.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { createGitWriter } from '../../scripts/lib/gitwriter.mjs';
import { tempDir } from '../helpers.mjs';

// Run from a git hook, GIT_DIR and friends would point these throwaway repositories at the real one.
for (const name of Object.keys(process.env)) if (name.startsWith('GIT_')) delete process.env[name];

const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=T', '-c', 'user.email=t@t', ...args], { cwd, encoding: 'utf8' }).trim();
function repos() {
  const top = tempDir();
  const remote = path.join(top, 'remote.git');
  git(top, 'init', '-q', '--bare', '-b', 'main', remote);
  const a = path.join(top, 'a');
  git(top, 'clone', '-q', remote, a);
  fs.writeFileSync(path.join(a, 'file.txt'), 'one\n');
  git(a, 'add', '.');
  git(a, 'commit', '-q', '-m', 'first');
  git(a, 'push', '-q', 'origin', 'main');
  const b = path.join(top, 'b');
  git(top, 'clone', '-q', remote, b);
  return { a, b };
}
const user = { username: 'rahim', name: 'Rahim', role: 'reviewer' };

describe('git writer', () => {
  it('commits only the given paths, as the user, with trailers', async () => {
    const { a } = repos();
    fs.writeFileSync(path.join(a, 'review.json'), '{}\n');
    fs.writeFileSync(path.join(a, 'other.txt'), 'not mine\n');
    const w = createGitWriter({ root: a });
    assert.match(await w.commit({ paths: ['review.json'], message: 'review(x): from Rahim', user }), /^[0-9a-f]{40}$/);
    assert.equal(git(a, 'log', '-1', '--format=%an <%ae>|%s'), 'Rahim <rahim@studio.local>|review(x): from Rahim');
    assert.match(git(a, 'log', '-1', '--format=%b'), /Studio-User: rahim/);
    assert.equal(git(a, 'status', '--porcelain'), '?? other.txt');
    assert.equal(await w.commit({ paths: ['review.json'], message: 'nothing new', user }), null);
  });

  it('pushes its commits and pulls others', async () => {
    const { a, b } = repos();
    const w = createGitWriter({ root: a });
    fs.writeFileSync(path.join(a, 'status.json'), '{"status":"review"}\n');
    await w.commit({ paths: ['status.json'], message: 'status', user });
    fs.writeFileSync(path.join(b, 'figure.js'), 'export {}\n');
    git(b, 'add', '.');
    git(b, 'commit', '-q', '-m', 'merged pull request');
    git(b, 'push', '-q', 'origin', 'main');
    const pulled = await w.sync();
    assert.deepEqual(pulled, ['figure.js']);
    assert.ok(fs.existsSync(path.join(a, 'figure.js')));
    git(b, 'pull', '-q');
    assert.ok(fs.existsSync(path.join(b, 'status.json')), 'the studio commit reached the remote');
    assert.equal(w.status().ahead, 0);
  });

  it('keeps its commits on a rescue branch when the same file changed on both sides', async () => {
    const { a, b } = repos();
    const w = createGitWriter({ root: a });
    fs.writeFileSync(path.join(a, 'file.txt'), 'studio\n');
    await w.commit({ paths: ['file.txt'], message: 'studio edit', user });
    fs.writeFileSync(path.join(b, 'file.txt'), 'remote\n');
    git(b, 'commit', '-q', '-am', 'remote edit');
    git(b, 'push', '-q', 'origin', 'main');
    await w.sync();
    const s = w.status();
    assert.match(s.rescue.branch, /^studio\/rescue-/);
    assert.equal(fs.readFileSync(path.join(a, 'file.txt'), 'utf8'), 'remote\n', 'the checkout follows the remote');
    assert.equal(git(a, 'show', `${s.rescue.branch}:file.txt`), 'studio', 'the studio edit is kept');
    git(b, 'fetch', '-q', 'origin');
    assert.ok(git(b, 'branch', '-r').includes(s.rescue.branch), 'and pushed for someone to merge');
  });

  it('commitLater waits for a pause, flush commits at once', async () => {
    const { a } = repos();
    const w = createGitWriter({ root: a });
    fs.writeFileSync(path.join(a, 'NOTES.md'), 'one\n');
    w.commitLater('notes', { paths: ['NOTES.md'], message: 'notes', user }, 60_000);
    assert.equal(git(a, 'log', '--oneline').split('\n').length, 1);
    await w.flush();
    assert.equal(git(a, 'log', '-1', '--format=%s'), 'notes');
  });

  it('neither commits nor pushes while the checkout is on another branch', async () => {
    const { a, b } = repos();
    const w = createGitWriter({ root: a });
    git(a, 'switch', '-q', '-c', 'fig/x/work');
    fs.writeFileSync(path.join(a, 'figure.js'), 'unmerged work\n');
    git(a, 'add', '.');
    git(a, 'commit', '-q', '-m', 'unmerged figure');
    fs.writeFileSync(path.join(a, 'review.json'), '{}\n');
    assert.equal(await w.commit({ paths: ['review.json'], message: 'review', user }), null);
    await w.sync();
    assert.match(w.status().lastError, /not "main"/);
    git(b, 'pull', '-q');
    assert.ok(!fs.existsSync(path.join(b, 'figure.js')), 'the branch was not pushed to main');
  });
});
