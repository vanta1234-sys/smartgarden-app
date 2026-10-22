// Changes the visibility of ONE of the channel's videos. usage (cwd = repo root):  node scripts/video-tools/ops/set_video_status.cjs <videoId> <public|unlisted|private>
// Only ever run on the owner's explicit word for that specific video (standing rule: youtube_channel_features.md). The admin secret comes from the git-ignored
// .env.deploy (YT_ADMIN_SECRET) and is never printed.
const fs = require('fs');
const [videoId, privacyStatus] = process.argv.slice(2);
if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId || '') || !['public', 'unlisted', 'private'].includes(privacyStatus)) { console.log('usage: node set_video_status.cjs <videoId> <public|unlisted|private>'); process.exit(1); }
const env = {};
for (const l of fs.readFileSync('.env.deploy', 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
if (!env.YT_ADMIN_SECRET) { console.log('YT_ADMIN_SECRET missing in .env.deploy'); process.exit(1); }
(async () => {
  const r = await fetch('https://smartgarden.gr/youtube-set-status.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Cron-Key': 'smartgarden_cron_x7K9pQ2026', 'X-YT-Admin': env.YT_ADMIN_SECRET, 'User-Agent': 'Mozilla/5.0 (compatible; SmartGardenOps/1.0)' },
    body: JSON.stringify({ videoId, privacyStatus }),
    signal: AbortSignal.timeout(60000),
  });
  const t = await r.text();
  console.log(r.status, t.slice(0, 400));
})().catch((e) => console.log('ERR', e.message));
