// Uploads a finished long video (Gemini voice + slides variant) to YouTube as PRIVATE, with chapters from the real scene starts.
// NOT to be run without the owner's go-ahead (standing rule: look at it first, upload only on his word). The token cannot pick the
// visibility of a video that is already up unless the owner's admin secret is used (youtube-set-status.php); a public upload needs "public".
//
// usage (cwd = the run folder):  node yt_upload.cjs <config.json> [public] [--dry]
// --dry prints the title, description and chapters and stops (nothing is sent).
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const cfgFile = process.argv[2];
if (!cfgFile) { console.log('usage: node yt_upload.cjs <config.json> [public] [--dry]'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const here = process.cwd();
const K = 'smartgarden_cron_x7K9pQ2026';
const job = fs.readFileSync(path.join(here, cfg.jobFile || ('job_' + cfg.name + '.txt')), 'utf8').trim();
const privacy = process.argv.includes('public') ? 'public' : 'private';
const dry = process.argv.includes('--dry');
const done = path.join(here, 'uploaded_' + cfg.name + '.json');
if (!dry && fs.existsSync(done)) { console.log('ALREADY UPLOADED', fs.readFileSync(done, 'utf8')); process.exit(0); }
// The scene lengths come from the render log of the job. The server deletes job folders after 48 hours (video-worker.php), so a video that waits longer
// than that is staged again as a job folder (video-jobs/_up_<name>/video-slides.mp4, put there over FTP, its name written in the job file) and the
// lengths are read from out/durs.json, which post_render.cjs saved next to it.
const localDurs = path.join(here, 'out', 'durs.json');
let durs = [];
if (fs.existsSync(localDurs)) {
  durs = JSON.parse(fs.readFileSync(localDurs, 'utf8'));
} else {
  const st = JSON.parse(execSync('curl -s -m 60 "https://smartgarden.gr/video-render.php?action=status&job=' + job + '&log=1&key=' + K + '"', { encoding: 'utf8' }));
  if (st.state !== 'done') { console.log('render not done:', st.state); process.exit(2); }
  (st.log || []).forEach((l) => { const m = l.match(/scene (\d+): engine=\w+ audio=[\d.]+s dur=([\d.]+)s/); if (m) durs[+m[1]] = parseFloat(m[2]); });
}
if (durs.length !== cfg.scenes || durs.some((d) => !(d > 0))) { console.log('scene durations incomplete', durs.length); process.exit(3); }
const starts = []; let t = 0; durs.forEach((d) => { starts.push(t); t += d; });
const mmss = (s) => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const chapters = cfg.chapters.map(([i, l]) => (i === 0 ? '0:00' : mmss(starts[i])) + ' ' + l);
const description = cfg.title + ': ο πλήρης οδηγός βήμα-βήμα.\n\n'
  + cfg.intro + '\n\n'
  + 'Περιεχόμενα:\n' + chapters.join('\n') + '\n\n'
  + '📖 Ολόκληρος ο οδηγός, με τους πίνακες και τις μετρήσεις: https://smartgarden.gr/article/' + cfg.articleSlug + '\n'
  + '🌱 Καθημερινοί οδηγοί κηπουρικής: https://smartgarden.gr\n\n'
  + cfg.hashtags;
console.log(chapters.join('\n'));
if (dry) { console.log('\n--- title\n' + cfg.title + '\n--- description\n' + description); process.exit(0); }
const body = { job, key: K, variant: 'slides', isShort: false, privacyStatus: privacy, title: cfg.title, description, thumbnailFile: cfg.thumbnail };
const bf = path.join(here, 'ytbody_' + cfg.name + '.json'); fs.writeFileSync(bf, JSON.stringify(body));
const outp = execSync('curl -s -m 900 -X POST -H "Content-Type: application/json; charset=utf-8" --data-binary @"' + bf + '" https://smartgarden.gr/youtube-publish.php', { encoding: 'utf8' });
console.log(outp.slice(0, 700));
try { const j = JSON.parse(outp); if (j.success) fs.writeFileSync(done, outp); } catch (e) {}
