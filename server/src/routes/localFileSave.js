const express = require('express');
const { execFile } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const loopback = (host) => ['localhost', '127.0.0.1', '[::1]'].includes(host);
function chooseWindowsPath(filename, extension, signal) {
  // Read as UTF-8 explicitly (Windows PowerShell otherwise interprets UTF-8 PS1
  // files without a BOM as the system code page, corrupting Korean text).
  const dialogScript = path.join(__dirname, '..', 'services', 'windowsSaveDialog.ps1');
  const script = `& ([scriptblock]::Create([System.IO.File]::ReadAllText($env:MOMO_SAVE_SCRIPT, [System.Text.Encoding]::UTF8)))`;
  return new Promise((resolve, reject) => execFile('powershell.exe', [
    '-NoProfile', '-STA', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64'),
  ], { windowsHide: true, timeout: 180000, maxBuffer: 65536, signal,
    env: { ...process.env, MOMO_SAVE_SCRIPT: dialogScript, MOMO_SAVE_FILENAME: filename, MOMO_SAVE_EXTENSION: extension },
  }, (error, stdout) => error ? reject(error) : resolve(stdout.trim() || null)));
}

// Only local pages may request a dialog. The browser never supplies a filesystem path.
function createLocalFileSaveRouter({ choosePath = chooseWindowsPath, supported = process.platform === 'win32', now = Date.now } = {}) {
  const router = express.Router();
  const targets = new Map();
  let activeDialog;
  router.use((req, res, next) => {
    let origin;
    try { origin = new URL(req.headers.origin); } catch { return res.sendStatus(403); }
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)
      || !loopback(req.hostname) || !loopback(origin.hostname)
      || origin.protocol !== 'http:' || !['8081', '19006'].includes(origin.port)) return res.sendStatus(403);
    for (const [token, target] of targets) if (target.expires < now() && !target.busy) targets.delete(token);
    next();
  });
  router.get('/', (_, res) => res.json({ supported }));
  router.post('/', async (req, res) => {
    if (!supported) return res.sendStatus(501);
    const { filename, extension } = req.body || {};
    if (!['mp4', 'txt'].includes(extension) || typeof filename !== 'string'
      || filename.length > 180 || !filename || /[<>:"/\\|?*\x00-\x1f]/.test(filename)) return res.sendStatus(400);
    // A closed/reloaded tab must not leave a native dialog locking all later requests.
    activeDialog?.abort();
    const dialogController = new AbortController();
    activeDialog = dialogController;
    const disconnected = () => { if (!res.writableEnded) dialogController.abort(); };
    res.on('close', disconnected);
    try {
      const selected = await choosePath(filename, extension, dialogController.signal);
      if (dialogController.signal.aborted || res.destroyed) {
        if (!res.destroyed) res.json({ canceled: true });
        return;
      }
      if (!selected) return res.json({ canceled: true });
      // Discard old unused selections, not active file writes, rather than blocking a new dialog.
      if (targets.size >= 8) {
        const unused = [...targets].find(([, target]) => !target.busy);
        if (unused) targets.delete(unused[0]);
      }
      const token = randomBytes(32).toString('hex');
      targets.set(token, { path: selected, origin: req.headers.origin, expires: now() + 3600000, busy: false });
      res.json({ token });
    } catch {
      if (!res.destroyed) {
        if (dialogController.signal.aborted) res.json({ canceled: true });
        else res.status(500).json({ error: 'SAVE_DIALOG_FAILED' });
      }
    } finally {
      res.off('close', disconnected);
      if (activeDialog === dialogController) activeDialog = undefined;
    }
  });
  router.delete('/:token', (req, res) => {
    const target = targets.get(req.params.token);
    if (target && !target.busy && target.origin === req.headers.origin) targets.delete(req.params.token);
    res.sendStatus(204);
  });
  // Bound the payload before buffering it; write a sibling temporary file before replacement.
  router.put('/:token', (req, res, next) => {
    const target = targets.get(req.params.token);
    if (!target || target.busy || target.origin !== req.headers.origin) return res.sendStatus(404);
    target.busy = true;
    req.saveToken = req.params.token;
    next();
  }, express.raw({ type: 'application/octet-stream', limit: '150mb' }), async (req, res) => {
    const target = targets.get(req.params.token);
    const temp = path.join(path.dirname(target.path), `.momo-${req.params.token}.part`);
    try {
      if (!Buffer.isBuffer(req.body)) return res.sendStatus(400);
      await fs.writeFile(temp, req.body, { flag: 'wx' });
      await fs.rename(temp, target.path);
      res.sendStatus(204);
    } catch { res.status(500).json({ error: 'FILE_SAVE_FAILED' }); }
    finally { targets.delete(req.params.token); await fs.rm(temp, { force: true }).catch(() => {}); }
  });
  router.use((error, req, res, next) => {
    targets.delete(req.saveToken);
    res.status(error.status || 500).json({ error: 'FILE_SAVE_FAILED' });
  });
  return router;
}
module.exports = { createLocalFileSaveRouter };
