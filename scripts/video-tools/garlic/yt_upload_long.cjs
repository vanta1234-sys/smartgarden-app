// Uploads the verified garlic episode (slides version) to YouTube. Public, on the owner's word of 2026-10-14.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const root = path.join(__dirname, '..');
const job = fs.readFileSync(path.join(__dirname, 'job.txt'), 'utf8').trim();
const done = path.join(__dirname, 'uploaded_garlic_long.json');
if (fs.existsSync(done)) { console.log('ALREADY UPLOADED', fs.readFileSync(done, 'utf8')); process.exit(0); }
const log = fs.readFileSync(path.join(root, 'rc_garlicA.log'), 'utf8');
const durs = [...log.matchAll(/scene \d+: engine=\w+ audio=[\d.]+s dur=([\d.]+)s/g)].map((m) => parseFloat(m[1]));
const starts = []; let t = 0; durs.forEach((d) => { starts.push(t); t += d; });
const mmss = (s) => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const chapters = [[0, 'Εισαγωγή'], [2, 'Η σύντομη απάντηση'], [5, 'Γιατί το φθινόπωρο και όχι η άνοιξη'], [9, 'Το πρόγραμμα, μήνα με μήνα'],
  [12, 'Ποιο σκόρδο να φυτέψεις'], [15, 'Δύο τύποι σκόρδου'], [17, 'Φύτευση βήμα-βήμα'], [21, 'Σκόρδο σε γλάστρα ή ζαρντινιέρα'],
  [25, 'Λίπανση και πότισμα'], [28, 'Ασθένειες και προβλήματα'], [31, 'Πότε είναι έτοιμο και πώς το αποθηκεύεις'], [35, 'Τι γίνεται τον χειμώνα'],
  [38, 'Ανθικά στελέχη'], [40, 'Καλοί και κακοί γείτονες'], [42, 'Πόσο σκόρδο να φυτέψεις'], [44, 'Σπρέι από σκόρδο'], [46, 'Συχνά λάθη'],
  [48, 'Συχνές ερωτήσεις'], [51, 'Τι κρατάς από όλα']].map(([i, l]) => (i === 0 ? '0:00' : mmss(starts[i])) + ' ' + l).join('\n');
const slug = 'skordo-fyteysi-glastra-kipos-pote-pos-20261011';
const title = 'Σκόρδο: Πότε και Πώς Φυτεύεται σε Γλάστρα και Κήπο στην Ελλάδα';
const description = title + ' (Οκτώβριος – Δεκέμβριος): ο πλήρης οδηγός βήμα-βήμα.\n\n'
  + 'Πότε φυτεύεται το σκόρδο, ποιες σκελίδες διαλέγεις, βάθος και απόσταση φύτευσης, γλάστρα και ζαρντινιέρα, λίπανση, ασθένειες, συγκομιδή και στέγνωμα για αποθήκευση μηνών.\n\n'
  + 'Περιεχόμενα:\n' + chapters + '\n\n'
  + '📖 Ολόκληρος ο οδηγός, με τους πίνακες και τις μετρήσεις: https://smartgarden.gr/article/' + slug + '\n'
  + '🌱 Καθημερινοί οδηγοί κηπουρικής: https://smartgarden.gr\n\n'
  + '#κηπουρική #σκόρδο #γλάστρα #gardening #smartgarden';
const body = { job, key: 'smartgarden_cron_x7K9pQ2026', variant: 'slides', isShort: false, privacyStatus: 'public', title, description, thumbnailFile: 'garlic-skordo.jpg' };
const bf = path.join(__dirname, 'ytbody_garlic_long.json'); fs.writeFileSync(bf, JSON.stringify(body));
console.log(description.slice(0, 900));
const out = execSync('curl -s -m 900 -X POST -H "Content-Type: application/json; charset=utf-8" --data-binary @"' + bf + '" https://smartgarden.gr/youtube-publish.php', { encoding: 'utf8' });
console.log(out.slice(0, 700));
try { const j = JSON.parse(out); if (j.success) fs.writeFileSync(done, out); } catch (e) {}
