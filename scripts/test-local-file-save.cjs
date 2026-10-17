const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const express = require('../server/node_modules/express');
const { createLocalFileSaveRouter } = require('../server/src/routes/localFileSave');

(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'momo-save-test-'));
  const selected = path.join(directory, '선택한 이름.mp4');
  let canceled = false;
  let time = Date.now();
  let block = false;
  const waiting = [];
  const app = express();
  app.use(express.json());
  app.use('/save', createLocalFileSaveRouter({ supported: true, now: () => time, choosePath: async (_name, _extension, signal) => {
    if (!block) return canceled ? null : selected;
    return new Promise((resolve, reject) => {
      waiting.push({ resolve, signal });
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    });
  } }));
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const url = `http://127.0.0.1:${server.address().port}/save`;
  const headers = { Origin: 'http://localhost:8081', 'Content-Type': 'application/json' };
  const choose = () => fetch(url, { method: 'POST', headers, body: JSON.stringify({ filename: 'story.mp4', extension: 'mp4' }) });
  try {
    assert.equal((await fetch(url)).status, 403);
    assert.equal((await fetch(url, { headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal((await fetch(url, { headers: { Origin: 'http://localhost.evil.example:8081' } })).status, 403);
    assert.deepEqual(await (await fetch(url, { headers })).json(), { supported: true });
    assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify({ filename: '../bad.mp4', extension: 'mp4' }) })).status, 400);
    canceled = true;
    assert.deepEqual(await (await choose()).json(), { canceled: true });
    canceled = false;
    const { token } = await (await choose()).json();
    assert.match(token, /^[a-f0-9]{64}$/);
    await fs.writeFile(selected, 'existing');
    const upload = () => fetch(`${url}/${token}`, { method: 'PUT', headers: { Origin: headers.Origin, 'Content-Type': 'application/octet-stream' }, body: new Uint8Array([0, 1, 255]) });
    assert.equal((await upload()).status, 204);
    assert.deepEqual(await fs.readFile(selected), Buffer.from([0, 1, 255]));
    assert.equal((await upload()).status, 404);
    const expired = await (await choose()).json();
    time += 3600001;
    assert.equal((await fetch(`${url}/${expired.token}`, { method: 'PUT', headers, body: '{}' })).status, 404);
    assert.deepEqual(await fs.readdir(directory), ['선택한 이름.mp4']);
    // Retrying an orphaned dialog cancels it instead of failing with HTTP 409.
    block = true;
    const until = async (predicate) => {
      for (let i = 0; i < 100 && !predicate(); i++) await new Promise(resolve => setTimeout(resolve, 10));
      assert.ok(predicate());
    };
    const first = choose();
    await until(() => waiting.length === 1);
    const second = choose();
    await until(() => waiting.length === 2);
    assert.equal(waiting[0].signal.aborted, true);
    assert.deepEqual(await (await first).json(), { canceled: true });
    waiting[1].resolve(selected);
    assert.equal((await second).status, 200);
    // Closing the client also closes its pending native dialog.
    const abort = new AbortController();
    const disconnected = fetch(url, { method: 'POST', headers, signal: abort.signal, body: JSON.stringify({ filename: 'story.mp4', extension: 'mp4' }) });
    await until(() => waiting.length === 3);
    abort.abort();
    await assert.rejects(disconnected, { name: 'AbortError' });
    await until(() => waiting[2].signal.aborted);
    console.log('PASS local Save As: trusted origin only, validation, cancellation, exact bytes, replacement, single-use tokens, expiry, temp cleanup');
  } finally {
    await new Promise(resolve => server.close(resolve));
    // Only the explicitly created test file and its empty temporary directory are removed.
    await fs.unlink(selected).catch(() => {});
    await fs.rmdir(directory);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
