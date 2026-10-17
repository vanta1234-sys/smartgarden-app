// Dry check before a full deploy: for every top-level file in public/ (the ones deploy.ts uploads in pass 1), compare the
// live copy with the local one and list the differences. Nothing is uploaded. usage (cwd = repo root): node compare_public.cjs
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const env = {};
for (const l of fs.readFileSync('.env.deploy', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !l.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const OWNED = new Set(['latest_articles.json', 'sitemap.xml', 'rss.xml', 'tiktok_posts.json', 'qa_questions.json', 'tiktok_tokens.json', 'tiktok_tokens_sandbox.json', 'youtube_tokens.json', 'facebook_tokens.json', 'pinterest_tokens.json', 'pinterest_boards.json', 'plant_diagnosis_usage.json', 'newsletter_signup_usage.json', 'qa_usage.json', 'gemini_usage.json', 'articles-index.cache.json', 'ads-slots.json', 'pinterest_posts.json']);
const md5 = (b) => crypto.createHash('md5').update(b).digest('hex');
(async () => {
  const { Client } = require(path.join(process.cwd(), 'node_modules', 'basic-ftp'));
  const c = new Client(60000);
  const tmp = path.join(os.tmpdir(), 'sg_cmp.bin');
  const diff = [], missing = [];
  let same = 0;
  try {
    await c.access({ host: '185.29.24.7', user: env.FTP_USER, password: env.FTP_PASSWORD, secure: false });
    const files = fs.readdirSync('public').filter((f) => fs.statSync(path.join('public', f)).isFile() && !OWNED.has(f));
    for (const f of files) {
      try { await c.downloadTo(tmp, '/httpdocs/' + f); } catch (e) { missing.push(f); continue; }
      const a = fs.readFileSync(tmp), b = fs.readFileSync(path.join('public', f));
      if (md5(a) === md5(b)) same++; else diff.push(f + ' (live ' + a.length + ' / local ' + b.length + ')');
    }
    console.log('compared', files.length, 'files:', same, 'identical,', diff.length, 'different,', missing.length, 'not on live');
    diff.forEach((d) => console.log('DIFF', d));
    missing.forEach((d) => console.log('NEW ', d));
  } catch (e) { console.log('ERROR', String(e.message || e).slice(0, 200)); }
  c.close();
})();
