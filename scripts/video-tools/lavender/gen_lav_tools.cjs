// Generates the lavender run scripts from the lemon ones (same pipeline, other names/slide holds/chapters). Run once from this folder.
const fs = require('fs'), path = require('path');
const lem = path.join(__dirname, '..', 'lemon');
const must = (s, a, b) => { if (!s.includes(a)) throw new Error('not found: ' + a.slice(0, 60)); return s.split(a).join(b); };

// ---- post_render_lav.cjs
let p = fs.readFileSync(path.join(lem, 'post_render_lemon.cjs'), 'utf8');
p = must(p, 'job_lemon.txt', 'job_lav.txt');
p = must(p, 'spec_lemon.txt', 'spec_lav.txt');
p = must(p, 'durs.length !== 53', 'durs.length !== 52');
p = must(p, 'lemon_base.mp4', 'lav_base.mp4');
p = must(p, 'lemon_slides.mp4', 'lav_slides.mp4');
p = must(p, 'lemonia-long.json', 'levanta-long.json');
p = must(p, 'post_render_lemon.cjs', 'post_render_lav.cjs');
p = must(p, 'After the lemon long render', 'After the lavender long render');
const i0 = p.indexOf('const HOLDS = ['), i1 = p.indexOf(']];', i0) + 3;
p = p.slice(0, i0) + "const HOLDS = [['levanta-01', 2, 4], ['levanta-02', 5, 8], ['levanta-03', 11, 13], ['levanta-04', 15, 18], ['levanta-05', 19, 21], ['levanta-06', 25, 27],\n"
  + "  ['levanta-07', 30, 32], ['levanta-08', 34, 36], ['levanta-09', 37, 39], ['levanta-10', 40, 42], ['levanta-11', 43, 45], ['levanta-12', 50, 50]];" + p.slice(i1);
fs.writeFileSync(path.join(__dirname, 'post_render_lav.cjs'), p);

// ---- yt_upload_lav.cjs
let y = fs.readFileSync(path.join(lem, 'yt_upload_lemon.cjs'), 'utf8');
y = must(y, 'job_lemon.txt', 'job_lav.txt');
y = must(y, 'uploaded_lemon.json', 'uploaded_lav.json');
y = must(y, 'ytbody_lemon.json', 'ytbody_lav.json');
y = must(y, 'durs.length !== 53', 'durs.length !== 52');
y = must(y, "'lemonia-ximonas.jpg'", "'levanta-xerainetai.jpg'");
y = must(y, 'the lemon/orange-in-winter long video', 'the lavender-in-a-pot long video');
y = must(y, 'yt_upload_lemon.cjs', 'yt_upload_lav.cjs');
const c0 = y.indexOf('const chapters = ['), c1 = y.indexOf("const slug =");
y = y.slice(0, c0) + "const chapters = [[0, 'Εισαγωγή'], [2, 'Η σύντομη απάντηση'], [5, 'Τι ακριβώς βλέπεις'], [9, 'Γιατί ξεραίνεται στη γλάστρα'], [15, 'Διάγνωση σε 10 λεπτά'],\n"
  + "  [19, 'Η διάσωση βήμα προς βήμα'], [25, 'Το σωστό υπόστρωμα και η γλάστρα'], [29, 'Πότισμα και λίπανση'], [34, 'Κλάδεμα'], [37, 'Ποιο είδος λεβάντας έχεις'],\n"
  + "  [40, 'Η χρονιά της λεβάντας'], [43, 'Τα συχνά λάθη'], [46, 'Συχνές ερωτήσεις'], [50, 'Τι κρατάς από όλα']].map(([i, l]) => (i === 0 ? '0:00' : mmss(starts[i])) + ' ' + l);\n" + y.slice(c1);
const d0 = y.indexOf("const slug ="), d1 = y.indexOf("console.log(chapters.join");
// the backslash is built from its char code: a doubled backslash typed through the shell tools gets halved (see memory php-regex-through-heredoc)
const B = String.fromCharCode(92), NL = B + 'n', NN = NL + NL;
y = y.slice(0, d0)
  + "const slug = 'levanta-se-glastra-giati-xerainetai-sosimo-20261013';\n"
  + "const title = 'Λεβάντα σε Γλάστρα: Γιατί Ξεραίνεται και Πώς τη Σώζεις';\n"
  + "const description = title + ': ο πλήρης οδηγός βήμα-βήμα." + NN + "'\n"
  + "  + 'Γιατί η λεβάντα ξεραίνεται στη γλάστρα, πώς καταλαβαίνεις τι έχει πάθει, τέσσερα τεστ διάγνωσης σε 10 λεπτά, η διάσωση βήμα προς βήμα, το σωστό υπόστρωμα και η σωστή γλάστρα, πότισμα, κλάδεμα και η χρονιά της λεβάντας." + NN + "'\n"
  + "  + 'Περιεχόμενα:" + NL + "' + chapters.join('" + NL + "') + '" + NN + "'\n"
  + "  + '📖 Ολόκληρος ο οδηγός, με τους πίνακες και τις μετρήσεις: https://smartgarden.gr/article/' + slug + '" + NL + "'\n"
  + "  + '🌱 Καθημερινοί οδηγοί κηπουρικής: https://smartgarden.gr" + NN + "'\n"
  + "  + '#λεβάντα #γλάστρα #κηπουρική #gardening #smartgarden';\n" + y.slice(d1);
fs.writeFileSync(path.join(__dirname, 'yt_upload_lav.cjs'), y);

// ---- start_lav.sh  (waits for the Gemini daily window, prepares the narration, renders, post-renders; never uploads)
const sh = `#!/bin/sh
# Lavender long video. Waits until the Gemini TTS daily quota has renewed (midnight Pacific = about 07:00 UTC; the gate below is 07:05 UTC on
# 2026-10-19), then retries every 5 minutes while the quota says no. Prepares and checks the narration locally (narration_prep.py), starts the
# render (all cache hits, hint cuts), waits for it and runs post_render_lav.cjs. NOTHING is uploaded to YouTube: that waits for the owner.
# Run from a scratch folder that holds a copy of these scripts and a prep/ subfolder; paths below are absolute.
cd "$(dirname "$0")"
K=smartgarden_cron_x7K9pQ2026
REPO=/c/Users/me/Desktop/smartgarden.gr_fixed
until [ "$(date -u +%Y%m%d%H%M)" -ge 202610190705 ]; do sleep 60; done
mkdir -p prep && cd prep && cp $REPO/.env.deploy .
TRY=0
while [ $TRY -lt 80 ]; do
  TRY=$((TRY+1))
  echo "prep attempt $TRY at $(date -u)"
  PYTHONIOENCODING=utf-8 python -u $REPO/scripts/video-tools/ops/narration_prep.py $REPO/public/video-scripts/levanta-long.json --upload > ../prep_final.log 2>&1
  grep -E "^chunk|cuts|GEMINI|no transcript|SUMMARY" ../prep_final.log | tail -20
  if grep -q "GEMINI FAILED" ../prep_final.log; then echo "Gemini TTS quota not back yet, waiting 5 minutes"; sleep 300
  elif grep -q "no transcript" ../prep_final.log; then echo "transcription not available, waiting 10 minutes"; sleep 600
  else break; fi
done
cd ..
echo "prep finished at $(date -u); starting the render"
curl -s -m 100 "https://smartgarden.gr/video-render.php?action=start&slug=levanta-se-glastra-giati-xerainetai-sosimo-20261013&mode=long&script=levanta-long&key=$K" -o start_lav.json
JOB=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('start_lav.json','utf8')).job||'')}catch(e){console.log('')}")
echo "render job: $JOB at $(date -u)"
[ -z "$JOB" ] && exit 1
echo "$JOB" > job_lav.txt
node $REPO/scripts/video-tools/garlic/wait_job.cjs "$JOB" 150
node post_render_lav.cjs
`;
fs.writeFileSync(path.join(__dirname, 'start_lav.sh'), sh);
console.log('written');
