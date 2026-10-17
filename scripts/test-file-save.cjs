const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, mocks = {}, globals = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)((id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id), mod, mod.exports, ...Object.values(globals));
  return mod.exports;
}
(async () => {
  const events = [];
  let blob;
  let picked;
  let failWrite = false;
  const writable = {
    write: async (value) => { if (failWrite) throw new Error('disk full'); blob = value; events.push('write'); },
    close: async () => events.push('close'),
    abort: async () => events.push('abort'),
  };
  const browser = { showSaveFilePicker: async (options) => { picked = options; events.push('pick'); return { createWritable: async () => { events.push('permission'); return writable; } }; } };
  const api = load('platform/fileSave.web.ts', {}, { window: browser, navigator: { userAgent: 'Windows Chrome', platform: 'Win32', maxTouchPoints: 0 } });
  const pending = api.chooseFileSaveTarget('story.mp4', 'video/mp4', 'mp4');
  assert.deepEqual(events, ['pick']);
  const target = await pending;
  assert.deepEqual(events, ['pick', 'permission']);
  assert.equal(target.kind, 'save-as');
  assert.equal(picked.suggestedName, 'story.mp4');
  assert.deepEqual(picked.types[0].accept, { 'video/mp4': ['.mp4'] });
  await target.save(new Uint8Array([0, 1, 255]).buffer);
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), new Uint8Array([0, 1, 255]));
  assert.deepEqual(events, ['pick', 'permission', 'write', 'close']);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(() => target.save(new ArrayBuffer(1), abort.signal), /EXPORT_CANCELED/);
  failWrite = true;
  const failingTarget = await api.chooseFileSaveTarget('retry.mp4', 'video/mp4', 'mp4');
  await assert.rejects(() => failingTarget.save(new ArrayBuffer(1)), /disk full/);
  assert.equal(events.at(-1), 'abort');
  browser.showSaveFilePicker = async () => { throw { name: 'AbortError' }; };
  assert.equal(await api.chooseFileSaveTarget('a.txt', 'text/plain', 'txt'), null);
  delete browser.showSaveFilePicker;
  assert.equal((await api.chooseFileSaveTarget('a.txt', 'text/plain', 'txt')).kind, 'download');

  const localCalls = [];
  let canceled = false;
  const local = load('platform/fileSave.web.ts', {}, {
    window: { location: { hostname: 'localhost' } }, navigator: { userAgent: 'Windows Brave' },
    fetch: async (url, options = {}) => {
      localCalls.push([url, options]);
      return { ok: true, json: async () => options.method === 'POST' ? (canceled ? { canceled: true } : { token: 'a'.repeat(64) }) : { supported: true } };
    },
  });
  const localTarget = await local.chooseFileSaveTarget('story.mp4', 'video/mp4', 'mp4');
  assert.equal(localTarget.kind, 'save-as');
  await localTarget.save(new Uint8Array([7, 8]).buffer);
  assert.equal(localCalls[2][1].method, 'PUT');
  assert.deepEqual(new Uint8Array(localCalls[2][1].body), new Uint8Array([7, 8]));
  canceled = true;
  assert.equal(await local.chooseFileSaveTarget('story.mp4', 'video/mp4', 'mp4'), null);

  browser.showSaveFilePicker = async () => { throw { name: 'SecurityError' }; };
  assert.equal((await api.chooseFileSaveTarget('story.mp4', 'video/mp4', 'mp4')).kind, 'download');

  let destination;
  let bytes;
  const desktop = load('platform/fileSave.web.ts', {
    '@tauri-apps/plugin-dialog': { save: async (options) => { assert.equal(options.defaultPath, 'story.mp4'); return destination; } },
    '@tauri-apps/plugin-fs': { writeFile: async (file, data) => { assert.equal(file, destination); bytes = data; } },
  }, { window: { __TAURI_INTERNALS__: {} } });
  destination = null;
  assert.equal(await desktop.chooseFileSaveTarget('story.mp4', 'video/mp4', 'mp4'), null);
  destination = 'D:\\chosen\\renamed.mp4';
  const nativeTarget = await desktop.chooseFileSaveTarget('story.mp4', 'video/mp4', 'mp4');
  await nativeTarget.save(new Uint8Array([3, 4, 5]).buffer);
  assert.deepEqual(bytes, new Uint8Array([3, 4, 5]));

  let download = false;
  let cleanup;
  const mobile = load('platform/fileSave.web.ts', {}, {
    window: {}, navigator: { userAgent: 'Android Chrome' },
    document: { body: { appendChild() {} }, createElement: () => ({ click() { download = true; }, remove() {} }) },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, setTimeout: (fn) => { cleanup = fn; },
  });
  const mobileTarget = await mobile.chooseFileSaveTarget('story.mp4', 'video/mp4', 'mp4');
  assert.equal(mobileTarget.kind, 'download');
  await mobileTarget.save(new ArrayBuffer(1)); assert.equal(download, true); cleanup();

  let savedText;
  const text = load('platform/fileExport.web.ts', { './fileSave.web': { chooseFileSaveTarget: async () => ({ save: async (buffer) => { savedText = new TextDecoder().decode(buffer); } }) } });
  await text.exportTextFile('story.txt', '한글 대본'); assert.equal(savedText, '한글 대본');
  let videoTarget = { kind: 'download', save: async () => {} };
  const video = load('platform/videoSave.web.ts', {
    './fileSave.web': { chooseFileSaveTarget: async () => videoTarget },
  }, { navigator: { userAgent: 'Windows Brave' } });
  await assert.rejects(() => video.chooseVideoSaveTarget('story.mp4'), /SAVE_LOCATION_UNSUPPORTED/);
  videoTarget = { kind: 'save-as', save: async () => {} };
  assert.equal(await video.chooseVideoSaveTarget('story.mp4'), videoTarget);
  videoTarget = null;
  assert.equal(await video.chooseVideoSaveTarget('story.mp4'), null);
  console.log('PASS browser Save As, cancel, write abort, Brave local Save As, local cancel, unsupported browser fallback, Tauri chosen path, mobile download, text export');
})().catch((error) => { console.error(error); process.exitCode = 1; });
