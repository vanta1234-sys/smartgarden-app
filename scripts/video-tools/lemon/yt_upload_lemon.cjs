// Uploads the lemon/orange-in-winter long video (Gemini voice + slides variant) to YouTube as PRIVATE.
// NOT to be run without the owner's go-ahead (standing rule: look at it first, upload only on his word).
// usage: node yt_upload_lemon.cjs [public]      (default private; the owner flips it in Studio, the token cannot)
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const K = 'smartgarden_cron_x7K9pQ2026';
const job = fs.readFileSync(path.join(__dirname, 'job_lemon.txt'), 'utf8').trim();
const privacy = process.argv[2] === 'public' ? 'public' : 'private';
const done = path.join(__dirname, 'uploaded_lemon.json');
if (fs.existsSync(done)) { console.log('ALREADY UPLOADED', fs.readFileSync(done, 'utf8')); process.exit(0); }
const st = JSON.parse(execSync('curl -s -m 60 "https://smartgarden.gr/video-render.php?action=status&job=' + job + '&log=1&key=' + K + '"', { encoding: 'utf8' }));
if (st.state !== 'done') { console.log('render not done:', st.state); process.exit(2); }
const durs = []; (st.log || []).forEach((l) => { const m = l.match(/scene (\d+): engine=\w+ audio=[\d.]+s dur=([\d.]+)s/); if (m) durs[+m[1]] = parseFloat(m[2]); });
if (durs.length !== 53 || durs.some((d) => !(d > 0))) { console.log('scene durations incomplete', durs.length); process.exit(3); }
const starts = []; let t = 0; durs.forEach((d) => { starts.push(t); t += d; });
const mmss = (s) => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const chapters = [[0, 'Εισαγωγή'], [2, 'Η σύντομη απάντηση'], [5, 'Πόσο κρύο αντέχουν'], [9, 'Θέση: έξω ή μέσα;'], [12, 'Πότισμα τον χειμώνα'],
  [16, 'Λίπανση'], [19, 'Προστασία από παγετό βήμα-βήμα'], [23, 'Διαχείμαση μέσα στο σπίτι'], [27, 'Τι σημαίνουν τα φύλλα και οι καρποί'],
  [31, 'Έντομα του χειμώνα'], [33, 'Υπόστρωμα και γλάστρα'], [37, 'Χειμερινή ανθοφορία και καρποφορία'], [39, 'Ο χειμώνας, μήνα με μήνα'],
  [42, 'Η άνοιξη: πώς βγαίνει το φυτό έξω'], [44, 'Κλάδεμα: όχι τώρα'], [45, 'Συγκομιδή του χειμώνα'], [46, 'Συχνά λάθη'],
  [48, 'Συχνές ερωτήσεις'], [51, 'Τι κρατάς από όλα']].map(([i, l]) => (i === 0 ? '0:00' : mmss(starts[i])) + ' ' + l);
const slug = 'lemonia-portokalia-glastra-ximonas-potisma-pagetos-20261010';
const title = 'Λεμονιά και Πορτοκαλιά σε Γλάστρα τον Χειμώνα: Πότισμα, Λίπανση και Προστασία από Παγετό';
const description = title + ': ο πλήρης οδηγός βήμα-βήμα.\n\n'
  + 'Πόσο κρύο αντέχει κάθε είδος, πού βάζεις τη γλάστρα, πότισμα και λίπανση τον χειμώνα, προστασία από τον παγετό, διαχείμαση μέσα στο σπίτι, έντομα, υπόστρωμα και πότε βγαίνει το φυτό ξανά έξω.\n\n'
  + 'Περιεχόμενα:\n' + chapters.join('\n') + '\n\n'
  + '📖 Ολόκληρος ο οδηγός, με τους πίνακες και τις μετρήσεις: https://smartgarden.gr/article/' + slug + '\n'
  + '🌱 Καθημερινοί οδηγοί κηπουρικής: https://smartgarden.gr\n\n'
  + '#λεμονιά #πορτοκαλιά #γλάστρα #κηπουρική #gardening #smartgarden';
console.log(chapters.join('\n'));
const body = { job, key: K, variant: 'slides', isShort: false, privacyStatus: privacy, title, description, thumbnailFile: 'lemonia-ximonas.jpg' };
const bf = path.join(__dirname, 'ytbody_lemon.json'); fs.writeFileSync(bf, JSON.stringify(body));
const out = execSync('curl -s -m 900 -X POST -H "Content-Type: application/json; charset=utf-8" --data-binary @"' + bf + '" https://smartgarden.gr/youtube-publish.php', { encoding: 'utf8' });
console.log(out.slice(0, 700));
try { const j = JSON.parse(out); if (j.success) fs.writeFileSync(done, out); } catch (e) {}
