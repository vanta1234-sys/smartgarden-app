// Uploads the lavender-in-a-pot long video (Gemini voice + slides variant) to YouTube as PRIVATE.
// NOT to be run without the owner's go-ahead (standing rule: look at it first, upload only on his word).
// usage: node yt_upload_lav.cjs [public]      (default private; the owner flips it in Studio, the token cannot)
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const K = 'smartgarden_cron_x7K9pQ2026';
const job = fs.readFileSync(path.join(__dirname, 'job_lav.txt'), 'utf8').trim();
const privacy = process.argv[2] === 'public' ? 'public' : 'private';
const done = path.join(__dirname, 'uploaded_lav.json');
if (fs.existsSync(done)) { console.log('ALREADY UPLOADED', fs.readFileSync(done, 'utf8')); process.exit(0); }
const st = JSON.parse(execSync('curl -s -m 60 "https://smartgarden.gr/video-render.php?action=status&job=' + job + '&log=1&key=' + K + '"', { encoding: 'utf8' }));
if (st.state !== 'done') { console.log('render not done:', st.state); process.exit(2); }
const durs = []; (st.log || []).forEach((l) => { const m = l.match(/scene (\d+): engine=\w+ audio=[\d.]+s dur=([\d.]+)s/); if (m) durs[+m[1]] = parseFloat(m[2]); });
if (durs.length !== 52 || durs.some((d) => !(d > 0))) { console.log('scene durations incomplete', durs.length); process.exit(3); }
const starts = []; let t = 0; durs.forEach((d) => { starts.push(t); t += d; });
const mmss = (s) => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const chapters = [[0, 'Εισαγωγή'], [2, 'Η σύντομη απάντηση'], [5, 'Τι ακριβώς βλέπεις'], [9, 'Γιατί ξεραίνεται στη γλάστρα'], [15, 'Διάγνωση σε 10 λεπτά'],
  [19, 'Η διάσωση βήμα προς βήμα'], [25, 'Το σωστό υπόστρωμα και η γλάστρα'], [29, 'Πότισμα και λίπανση'], [34, 'Κλάδεμα'], [37, 'Ποιο είδος λεβάντας έχεις'],
  [40, 'Η χρονιά της λεβάντας'], [43, 'Τα συχνά λάθη'], [46, 'Συχνές ερωτήσεις'], [50, 'Τι κρατάς από όλα']].map(([i, l]) => (i === 0 ? '0:00' : mmss(starts[i])) + ' ' + l);
const slug = 'levanta-se-glastra-giati-xerainetai-sosimo-20261013';
const title = 'Λεβάντα σε Γλάστρα: Γιατί Ξεραίνεται και Πώς τη Σώζεις';
const description = title + ': ο πλήρης οδηγός βήμα-βήμα.\n\n'
  + 'Γιατί η λεβάντα ξεραίνεται στη γλάστρα, πώς καταλαβαίνεις τι έχει πάθει, τέσσερα τεστ διάγνωσης σε 10 λεπτά, η διάσωση βήμα προς βήμα, το σωστό υπόστρωμα και η σωστή γλάστρα, πότισμα, κλάδεμα και η χρονιά της λεβάντας.\n\n'
  + 'Περιεχόμενα:\n' + chapters.join('\n') + '\n\n'
  + '📖 Ολόκληρος ο οδηγός, με τους πίνακες και τις μετρήσεις: https://smartgarden.gr/article/' + slug + '\n'
  + '🌱 Καθημερινοί οδηγοί κηπουρικής: https://smartgarden.gr\n\n'
  + '#λεβάντα #γλάστρα #κηπουρική #gardening #smartgarden';
console.log(chapters.join('\n'));
const body = { job, key: K, variant: 'slides', isShort: false, privacyStatus: privacy, title, description, thumbnailFile: 'levanta-xerainetai.jpg' };
const bf = path.join(__dirname, 'ytbody_lav.json'); fs.writeFileSync(bf, JSON.stringify(body));
const out = execSync('curl -s -m 900 -X POST -H "Content-Type: application/json; charset=utf-8" --data-binary @"' + bf + '" https://smartgarden.gr/youtube-publish.php', { encoding: 'utf8' });
console.log(out.slice(0, 700));
try { const j = JSON.parse(out); if (j.success) fs.writeFileSync(done, out); } catch (e) {}
