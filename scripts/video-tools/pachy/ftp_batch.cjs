// usage (cwd = repo root): node scripts/video-tools/pachy/ftp_batch.cjs <public-relative path> ...
// Uploads NEW files from public/ to /httpdocs/ over one FTP connection; refuses to overwrite a remote file unless --force is given.
const fs = require('fs'), path = require('path');
const env = {};
for (const l of fs.readFileSync('.env.deploy', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !l.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const force = process.argv.includes('--force');
const names = process.argv.slice(2).filter((a) => a !== '--force');
(async () => {
  const { Client } = require(path.join(process.cwd(), 'node_modules', 'basic-ftp'));
  const c = new Client(60000);
  try {
    await c.access({ host: '185.29.24.7', user: env.FTP_USER, password: env.FTP_PASSWORD, secure: false });
    for (const n of names) {
      const rp = '/httpdocs/' + n.replace(/\\/g, '/');
      await c.cd('/');
      await c.ensureDir(path.posix.dirname(rp));
      await c.cd('/');
      let size = -1; try { size = await c.size(rp); } catch (e) { size = -1; }
      if (size >= 0 && !force) { console.log('EXISTS (skipped)', n, size); continue; }
      await c.uploadFrom(path.join('public', n), rp);
      console.log('put', n, fs.statSync(path.join('public', n)).size);
    }
  } catch (e) { console.log('ERROR', String(e.message || e).slice(0, 200)); process.exitCode = 1; }
  c.close();
})();
