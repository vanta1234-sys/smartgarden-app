// The owner's TikTok post for an already uploaded Short, made by me in TikTok Studio (his Chrome, claude-in-chrome tools) instead of an inbox draft.
// Standing order of 2026-11-04: "ανέλαβε να το κάνεις εσύ. Όχι draft": one TikTok every 2nd day, posted by me. The browser steps are in the memory file tiktok_web_posting.md
// and in the nightly task; this script only does the parts that need no browser: the every-2-days guard, the files to upload, and the log.
//
// usage (cwd = repo root):
//   node scripts/video-tools/ops/tiktok_web_post.cjs prepare [latest|<jobId>]   -> prints DUE or SKIP; when DUE it copies the video to tiktok-out/video.mp4 and the caption to tiktok-out/caption.txt
//   node scripts/video-tools/ops/tiktok_web_post.cjs done [latest|<jobId>]      -> call ONLY after the Posts list in TikTok Studio shows the new post; writes the POSTED_WEB line
// The video goes into the repo folder because the browser upload tool reads only the session's own folders (the Short folder on the Desktop is refused).
// Guard: at most one TikTok every 2 calendar days, counted from the last SENT / DELIVERED / POSTED_WEB line of TIKTOK-LOG.txt (the old inbox drafts count too),
// never twice for a job, and only for a Short whose YouTube upload is done.
const fs = require('fs'), path = require('path');
const SHORTS = 'C:/Users/me/Desktop/smartgarden-videos/shorts';
const LOG = path.join(SHORTS, 'TIKTOK-LOG.txt');
const OUT = path.join(__dirname, '..', '..', '..', 'tiktok-out');
const [mode, jobArg] = process.argv.slice(2);
if (!['prepare', 'done'].includes(mode)) { console.log('usage: node tiktok_web_post.cjs prepare|done [latest|<jobId>]'); process.exit(1); }
let job = jobArg || 'latest';
if (job === 'latest') { try { job = fs.readFileSync(path.join(SHORTS, 'latest', 'job.txt'), 'utf8').trim(); } catch (e) { console.log('no latest job: run review_short.cjs first'); process.exit(1); } }

const lines = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').split(/\r?\n/).filter((l) => /^\d{4}-\d{2}-\d{2}T/.test(l)) : [];
const counts = (l) => /\bDELIVERED\b|\bSENT\b|\bPOSTED_WEB\b/.test(l);
const dayNo = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

if (mode === 'done') {
  if (lines.some((l) => l.includes(' ' + job + ' ') && /\bPOSTED_WEB\b/.test(l))) { console.log('already logged for this job'); process.exit(0); }
  fs.appendFileSync(LOG, new Date().toISOString() + ' ' + job + ' POSTED_WEB (TikTok Studio)\n');
  console.log('logged POSTED_WEB for', job);
  process.exit(0);
}

if (lines.some((l) => l.includes(' ' + job + ' ') && counts(l))) { console.log('SKIP: this job already went to TikTok'); process.exit(0); }
const last = lines.filter(counts).map((l) => new Date(l.split(' ')[0])).sort((a, b) => b - a)[0];
const gap = last ? dayNo(new Date()) - dayNo(last) : 99;
console.log('last TikTok:', last ? last.toISOString() : 'none', '| days since:', gap);
if (gap < 2) { console.log('SKIP: too soon, a TikTok goes out at most every 2 days (next one is due ' + new Date(dayNo(last) * 86400000 + 2 * 86400000).toISOString().slice(0, 10) + ')'); process.exit(0); }
if (!fs.existsSync(path.join(SHORTS, 'uploaded_' + job + '.json'))) { console.log('REFUSED: this Short has not been uploaded to YouTube (no uploaded_ marker)'); process.exit(2); }
const dir = path.join(SHORTS, job);
if (!fs.existsSync(path.join(dir, 'video.mp4')) || !fs.existsSync(path.join(dir, 'job.json'))) { console.log('REFUSED: video.mp4 or job.json missing in the Short folder'); process.exit(2); }
const j = JSON.parse(fs.readFileSync(path.join(dir, 'job.json'), 'utf8'));
const src = path.join(dir, 'video.mp4');
const srcSize = fs.statSync(src).size;
let size = srcSize, note = '';
fs.mkdirSync(OUT, { recursive: true });
const dest = path.join(OUT, 'video.mp4');
if (srcSize > 9.5 * 1024 * 1024) {
  // The browser upload tool takes under 10 MB. On 2026-11-06 the tomato Short (10.8 MB) was refused here and no TikTok went out for two days, so a TikTok
  // copy is made instead: same picture size and audio, video bitrate chosen from the length so that the file lands near 8.8 MB (TikTok re-encodes anyway).
  const { spawnSync } = require('child_process');
  const dur = parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], { encoding: 'utf8' }).stdout);
  let ok = false;
  if (dur > 1) {
    let kbps = Math.floor((8.8 * 8 * 1024 * 1024 / dur) / 1000) - 132;
    for (let k = 0; k < 4 && !ok; k++) {
      try { fs.unlinkSync(dest); } catch (e) { /* none yet */ }
      spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-b:v', kbps + 'k', '-maxrate', Math.floor(kbps * 1.25) + 'k',
        '-bufsize', (kbps * 2) + 'k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dest]);
      const s = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
      if (s > 0 && s <= 9.5 * 1024 * 1024) { ok = true; size = s; } else kbps = Math.floor(kbps * 0.85);
    }
  }
  if (!ok) { console.log('REFUSED: the video is ' + (srcSize / 1048576).toFixed(1) + ' MB, the upload tool takes under 10 MB, and the smaller copy could not be made'); process.exit(2); }
  note = ' (smaller copy for the upload tool, made from the ' + (srcSize / 1048576).toFixed(1) + ' MB original)';
} else fs.copyFileSync(src, dest);
fs.writeFileSync(path.join(OUT, 'caption.txt'), j.script.tiktokCaption, 'utf8');
console.log('DUE: ' + job);
console.log('video  :', path.resolve(OUT, 'video.mp4'), (size / 1048576).toFixed(1) + ' MB' + note);
console.log('caption: ' + path.resolve(OUT, 'caption.txt') + ' (' + j.script.tiktokCaption.length + ' chars)');
console.log('----- caption -----\n' + j.script.tiktokCaption + '\n-------------------');
