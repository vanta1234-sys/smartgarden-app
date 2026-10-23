// Sends an already uploaded Short to the owner's TikTok INBOX as a draft (he taps Post in the app and pastes the caption from https://smartgarden.gr/tt.html).
// Standing orders: 2026-10-22 "όχι άλλο στο TikTok, κάθε 2 μέρες" and "θα στέλνεις κάθε 2η μέρα και όταν με βλέπεις εδώ θα μου το λες".
// So: at most one draft every 2 days (counted from the last line of TIKTOK-LOG.txt), only for a Short whose YouTube upload is done, and the owner is told in chat
// the next time he writes (the log is the memory of what was sent; the nightly task also mentions it in its email).
// usage (cwd = repo root, for .env.deploy):  node scripts/video-tools/ops/send_tiktok_draft.cjs <jobId> [--dry] [--force]
//   exit 0 = sent and delivered to the inbox, or skipped because it is too soon / already sent (message says which); 1 = could not send; 2 = refused (no YouTube marker)
// INTERNAL_SECRET comes from the git-ignored .env.deploy and is never printed.
const fs = require('fs'), path = require('path');
const SHORTS = 'C:/Users/me/Desktop/smartgarden-videos/shorts';
const LOG = path.join(SHORTS, 'TIKTOK-LOG.txt');
const K = 'smartgarden_cron_x7K9pQ2026';
let job = process.argv[2];
if (job === 'latest') { try { job = fs.readFileSync(path.join(SHORTS, 'latest', 'job.txt'), 'utf8').trim(); } catch (e) { console.log('no latest job: run review_short.cjs first'); process.exit(1); } }
const dry = process.argv.includes('--dry'), force = process.argv.includes('--force');
if (!job || job.startsWith('--')) { console.log('usage: node send_tiktok_draft.cjs <jobId> [--dry] [--force]'); process.exit(1); }

const lines = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split(/\r?\n/).filter((l) => /^\d{4}-\d{2}-\d{2}T/.test(l)) : [];
if (lines.some((l) => l.includes(' ' + job + ' ') && /\bDELIVERED\b|\bSENT\b/.test(l))) { console.log('SKIP: a draft for this job was already sent'); process.exit(0); }
const dayNo = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
const last = lines.filter((l) => /\bDELIVERED\b|\bSENT\b/.test(l)).map((l) => new Date(l.split(' ')[0])).sort((a, b) => b - a)[0];
const gap = last ? dayNo(new Date()) - dayNo(last) : 99;
console.log('last TikTok draft:', last ? last.toISOString() : 'none', '| days since:', gap);
if (gap < 2 && !force) { console.log('SKIP: too soon, a TikTok draft goes out at most every 2 days (next one is due ' + (last ? new Date(dayNo(last) * 86400000 + 2 * 86400000).toISOString().slice(0, 10) : 'now') + ')'); process.exit(0); }
if (!fs.existsSync(path.join(SHORTS, 'uploaded_' + job + '.json'))) { console.log('REFUSED: this Short has not been uploaded to YouTube (no uploaded_ marker)'); process.exit(2); }
const jfile = path.join(SHORTS, job, 'job.json');
if (!fs.existsSync(jfile)) { console.log('REFUSED: no job.json in the Short folder'); process.exit(2); }
const j = JSON.parse(fs.readFileSync(jfile, 'utf8'));
const env = {};
for (const l of fs.readFileSync('.env.deploy', 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
if (!env.INTERNAL_SECRET) { console.log('INTERNAL_SECRET missing in .env.deploy'); process.exit(1); }
const stamp = () => new Date().toISOString();
console.log('title:', j.script.youtubeTitle, '\ncaption:\n' + j.script.tiktokCaption);
if (dry) { console.log('(dry run, nothing sent)'); process.exit(0); }

(async () => {
  const videoUrl = 'https://smartgarden.gr/video-render.php?action=file&job=' + job + '&key=' + encodeURIComponent(K);
  const head = await fetch(videoUrl, { headers: { Range: 'bytes=0-1000' } });
  if (head.status >= 400) { console.log('the video is no longer on the server (' + head.status + '): stage it again before sending'); process.exit(1); }
  const r = await fetch('https://smartgarden.gr/tiktok-publish.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Internal': env.INTERNAL_SECRET, 'User-Agent': 'Mozilla/5.0 (compatible; SmartGardenOps/1.0)' },
    body: JSON.stringify({ videoUrl, caption: j.script.tiktokCaption, title: j.script.youtubeTitle, articleId: j.article.id }),
    signal: AbortSignal.timeout(280000),
  });
  const t = await r.text();
  let o; try { o = JSON.parse(t); } catch (e) { console.log('bad answer', r.status, t.slice(0, 300)); process.exit(1); }
  const pid = o.post && o.post.id;
  console.log('sent:', r.status, o.success, o.post && o.post.status, o.error || '', 'PUBLISH_ID', pid);
  if (!o.success || !pid) { fs.appendFileSync(LOG, stamp() + ' ' + job + ' FAILED ' + (o.error || t.slice(0, 120)) + '\n'); process.exit(1); }
  fs.appendFileSync(LOG, stamp() + ' ' + job + ' SENT ' + pid + ' (waiting for the inbox)\n');
  // TikTok needs a few seconds up to ~15 minutes to put the draft in the inbox (2026-10-22: 14 min)
  const deadline = Date.now() + 30 * 60 * 1000; let st = '';
  while (Date.now() < deadline) {
    await new Promise((res) => setTimeout(res, 20000));
    try {
      const s = await (await fetch('https://smartgarden.gr/tiktok-check-status.php?publish_id=' + encodeURIComponent(pid) + '&key=' + K, { signal: AbortSignal.timeout(40000) })).json();
      st = (s.data && s.data.status) || ''; console.log(new Date().toTimeString().slice(0, 8), st);
      if (st === 'SEND_TO_USER_INBOX' || st === 'PUBLISH_COMPLETE') { fs.appendFileSync(LOG, stamp() + ' ' + job + ' DELIVERED ' + pid + '\n'); console.log('DELIVERED to the TikTok inbox'); process.exit(0); }
      if (st === 'FAILED') { fs.appendFileSync(LOG, stamp() + ' ' + job + ' FAILED ' + JSON.stringify(s.data).slice(0, 160) + '\n'); console.log('TikTok FAILED the draft', JSON.stringify(s.data)); process.exit(1); }
    } catch (e) { /* transient, keep polling */ }
  }
  fs.appendFileSync(LOG, stamp() + ' ' + job + ' STILL-PROCESSING ' + pid + ' after 30 minutes\n');
  console.log('still processing after 30 minutes (the draft was sent, TikTok has not confirmed the inbox yet)'); process.exit(1);
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
