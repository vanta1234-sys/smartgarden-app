// Upload a few specific public/ files. For each: confirm the live copy equals the committed HEAD copy first.
// usage (cwd = repo root): node <scratch>/upload_files.cjs file1 file2 ...   (names relative to public/)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const env = {};
for (const l of fs.readFileSync('.env.deploy', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !l.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const names = process.argv.slice(2);
(async () => {
  const { Client } = require(path.join(process.cwd(), 'node_modules', 'basic-ftp'));
  const c = new Client(30000);
  try {
    await c.access({ host: '185.29.24.7', user: env.FTP_USER, password: env.FTP_PASSWORD, secure: false });
    for (const n of names) {
      const tmp = path.join(__dirname, 'live_' + n);
      await c.downloadTo(tmp, '/httpdocs/' + n);
      const live = fs.readFileSync(tmp).toString('utf8').replace(/\r\n/g, '\n');
      const head = cp.execSync('git show HEAD:public/' + n, { maxBuffer: 64 * 1024 * 1024 }).toString('utf8').replace(/\r\n/g, '\n');
      if (live !== head) { console.log(n, ': ABORT, live differs from committed HEAD'); continue; }
      await c.uploadFrom('public/' + n, '/httpdocs/' + n);
      const back = path.join(__dirname, 'after_' + n);
      await c.downloadTo(back, '/httpdocs/' + n);
      console.log(n, ': uploaded, identical to local:', Buffer.compare(fs.readFileSync(back), fs.readFileSync('public/' + n)) === 0);
    }
  } catch (e) { console.log('ERROR', String(e.message || e).slice(0, 200)); process.exitCode = 1; }
  c.close();
})();
