#!/bin/sh
# Render 1 died when the Gemini daily quota (30 requests on three keys) ran out after 9 of 12 chunks; those 9 are in the server cache.
# This generates the missing chunks once the quota is back (retrying every 5 minutes), checks all cuts, uploads the hints, starts the render
# (all cache hits, hint cuts) and then runs the post-render steps. Nothing is uploaded to YouTube.
cd "$(dirname "$0")"
K=smartgarden_cron_x7K9pQ2026
mkdir -p prep && cd prep
TRY=0
while [ $TRY -lt 80 ]; do
  TRY=$((TRY+1))
  echo "prep attempt $TRY at $(date -u)"
  PYTHONIOENCODING=utf-8 python -u /c/Users/me/Desktop/smartgarden.gr_fixed/scripts/video-tools/ops/narration_prep.py /c/Users/me/Desktop/smartgarden.gr_fixed/public/video-scripts/lemonia-long.json --upload > ../prep_final.log 2>&1
  grep -E "^chunk|cuts|GEMINI|no transcript|SUMMARY" ../prep_final.log | tail -20
  if grep -q "GEMINI FAILED" ../prep_final.log; then echo "Gemini TTS quota not back yet, waiting 5 minutes"; sleep 300
  elif grep -q "no transcript" ../prep_final.log; then echo "transcription not available, waiting 10 minutes"; sleep 600
  else break; fi
done
cd ..
echo "prep finished at $(date -u); starting the render"
curl -s -m 100 "https://smartgarden.gr/video-render.php?action=start&slug=lemonia-portokalia-glastra-ximonas-potisma-pagetos-20261010&mode=long&script=lemonia-long&key=$K" -o start_lemon2.json
JOB=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('start_lemon2.json','utf8')).job||'')}catch(e){console.log('')}")
echo "render job: $JOB at $(date -u)"
[ -z "$JOB" ] && exit 1
echo "$JOB" > job_lemon.txt
node ../garlic_long/wait_job.cjs "$JOB" 150
node post_render_lemon.cjs
