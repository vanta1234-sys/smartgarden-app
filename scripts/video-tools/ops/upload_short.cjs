// Uploads a reviewed held Short to YouTube. Part two of the daily review: run review_short.cjs first, LOOK at its two frame sheets, then run this.
// usage (cwd = repo root):  node scripts/video-tools/ops/upload_short.cjs <jobId> <public|private> [--dry]
// Refuses unless review_short.cjs wrote a report.json for this job in the last 36 hours with autoPass=true, so a failed or skipped check cannot be uploaded by accident.
// Title and description come from the job's own job.json (script.youtubeTitle / youtubeDescription); a summary line cut off with "…" is ended at its last comma instead.
// On success it writes uploaded_<job>.json next to the video folder (the marker review_short.cjs uses to know the Short is done) and appends a line to NIGHTLY-LOG.txt.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const SHORTS = 'C:/Users/me/Desktop/smartgarden-videos/shorts';
const K = 'smartgarden_cron_x7K9pQ2026';
const [job, privacy] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dry = process.argv.includes('--dry');
if (!job || !['public', 'private'].includes(privacy)) { console.log('usage: node upload_short.cjs <jobId> <public|private> [--dry]'); process.exit(1); }
const marker = path.join(SHORTS, 'uploaded_' + job + '.json');
if (fs.existsSync(marker)) { console.log('ALREADY UPLOADED', fs.readFileSync(marker, 'utf8')); process.exit(0); }
const dir = path.join(SHORTS, job);
const repFile = path.join(dir, 'report.json');
if (!fs.existsSync(repFile)) { console.log('REFUSED: no report.json, run review_short.cjs first'); process.exit(2); }
const rep = JSON.parse(fs.readFileSync(repFile, 'utf8'));
if (rep.job !== job || !rep.autoPass) { console.log('REFUSED: the automatic checks did not pass for this job'); process.exit(2); }
if (Date.now() - new Date(rep.when).getTime() > 36 * 3600 * 1000) { console.log('REFUSED: the report is older than 36 hours, run review_short.cjs again'); process.exit(2); }
const j = JSON.parse(fs.readFileSync(path.join(dir, 'job.json'), 'utf8'));
const description = String(j.script.youtubeDescription).split('\n').map((line) => {
  const i = line.lastIndexOf('…');
  if (i < 0) return line;
  const head = line.slice(0, i), c = head.lastIndexOf(',');
  return (c > 40 ? head.slice(0, c) : head.replace(/[\s,;:·-]+$/, '')) + '.';
}).join('\n');
const body = { job, key: K, title: j.script.youtubeTitle, description, privacyStatus: privacy, isShort: true };
console.log(body.title + '\n\n' + description + '\n\nprivacy:', privacy);
if (dry) { console.log('(dry run, nothing sent)'); process.exit(0); }
const bodyFile = path.join(dir, 'ytbody.json');
fs.writeFileSync(bodyFile, JSON.stringify(body));
const out = execSync('curl -s -m 290 -X POST -H "Content-Type: application/json; charset=utf-8" --data-binary @"' + bodyFile + '" https://smartgarden.gr/youtube-publish.php', { encoding: 'utf8' });
console.log(out.slice(0, 500));
let r = {};
try { r = JSON.parse(out); } catch (e) { /* printed above */ }
const stamp = new Date().toISOString();
if (r.success && r.privacyStatusActual === privacy) {
  fs.writeFileSync(marker, out);
  fs.appendFileSync(path.join(SHORTS, 'NIGHTLY-LOG.txt'), stamp + ' UPLOADED ' + privacy + ' ' + r.url + ' ' + body.title + '\n');
  console.log('UPLOADED', privacy, r.url);
} else {
  fs.appendFileSync(path.join(SHORTS, 'NIGHTLY-LOG.txt'), stamp + ' UPLOAD FAILED ' + job + ' ' + out.slice(0, 200) + '\n');
  console.log('UPLOAD DID NOT COMPLETE AS REQUESTED'); process.exit(4);
}
