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
const size = fs.statSync(path.join(dir, 'video.mp4')).size;
if (size > 9.5 * 1024 * 1024) { console.log('REFUSED: the video is ' + (size / 1048576).toFixed(1) + ' MB, the upload tool takes under 10 MB'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(path.join(dir, 'video.mp4'), path.join(OUT, 'video.mp4'));
fs.writeFileSync(path.join(OUT, 'caption.txt'), j.script.tiktokCaption, 'utf8');
console.log('DUE: ' + job);
console.log('video  :', path.resolve(OUT, 'video.mp4'), (size / 1048576).toFixed(1) + ' MB');
console.log('caption: ' + path.resolve(OUT, 'caption.txt') + ' (' + j.script.tiktokCaption.length + ' chars)');
console.log('----- caption -----\n' + j.script.tiktokCaption + '\n-------------------');
