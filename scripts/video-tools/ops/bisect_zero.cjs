// Finds which lines of public/video-inserts.php make the live server truncate an uploaded PHP file to 0 bytes.
// Uploads line ranges of the file as zz-bisect-N.php (test names, removed at the end) and lists their live sizes.
// usage (cwd = repo root): node bisect_zero.cjs from-to [from-to ...]     e.g. 1-230 231-463
const fs = require('fs'), path = require('path'), os = require('os');
const env = {};
for (const l of fs.readFileSync('.env.deploy', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !l.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const lines = fs.readFileSync('public/video-inserts.php', 'utf8').split('\n');
(async () => {
  const { Client } = require(path.join(process.cwd(), 'node_modules', 'basic-ftp'));
  const c = new Client(60000);
  try {
    await c.access({ host: '185.29.24.7', user: env.FTP_USER, password: env.FTP_PASSWORD, secure: false });
    const names = [];
    for (const r of process.argv.slice(2)) {
      const parts = r.split('+').map((x) => x.split('-').map(Number));
      const body = parts.map(([x, y]) => lines.slice(x - 1, y).join('\n')).join('\n') + '\n';
      const a = parts.map((x) => x[0]).join('_'), b = parts.map((x) => x[1]).join('_');
      const local = path.join(os.tmpdir(), 'zzb.php');
      fs.writeFileSync(local, body);
      const name = 'zz-bisect-' + a + '-' + b + '.php';
      await c.uploadFrom(local, '/httpdocs/' + name);
      names.push([name, Buffer.byteLength(body)]);
    }
    await new Promise((r) => setTimeout(r, 4000));
    const list = await c.list('/httpdocs');
    for (const [n, size] of names) {
      const f = list.find((x) => x.name === n);
      console.log(n, 'sent', size, 'live', f ? f.size : '?', f && f.size === 0 ? '  <-- ZEROED' : '');
    }
    if (process.env.KEEP !== '1') for (const [n] of names) { try { await c.remove('/httpdocs/' + n); } catch (e) {} }
  } catch (e) { console.log('ERROR', String(e.message || e).slice(0, 200)); }
  c.close();
})();
