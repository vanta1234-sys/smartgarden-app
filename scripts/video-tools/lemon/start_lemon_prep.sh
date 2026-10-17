#!/bin/sh
# 1. waits for the Gemini daily quota to reset (about 00:00 UTC; retries every 10 minutes if it has not),
# 2. prepares the narration of the lemon video locally (chunks, checked cuts) and puts it into the server cache,
# 3. starts the render (which then finds everything in the cache) and waits for it.  post_render runs from watch_post.sh.
cd "$(dirname "$0")"
K=smartgarden_cron_x7K9pQ2026
until [ "$(date -u +%Y%m%d%H%M)" -ge 202610180003 ]; do sleep 30; done
mkdir -p prep && cd prep && cp /c/Users/me/Desktop/smartgarden.gr_fixed/.env.deploy .
TRY=0
while [ $TRY -lt 60 ]; do
  TRY=$((TRY+1))
  echo "prep attempt $TRY at $(date -u)"
  PYTHONIOENCODING=utf-8 python /c/Users/me/Desktop/smartgarden.gr_fixed/scripts/video-tools/ops/narration_prep.py /c/Users/me/Desktop/smartgarden.gr_fixed/public/video-scripts/lemonia-long.json --upload > ../prep_attempt.log 2>&1
  cat ../prep_attempt.log | tail -25
  if grep -q "GEMINI FAILED" ../prep_attempt.log; then echo "Gemini not available yet, waiting 10 minutes"; sleep 600; else break; fi
done
cd ..
echo "prep finished at $(date -u); starting the render"
curl -s -m 100 "https://smartgarden.gr/video-render.php?action=start&slug=lemonia-portokalia-glastra-ximonas-potisma-pagetos-20261010&mode=long&script=lemonia-long&key=$K" -o start_lemon.json
JOB=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('start_lemon.json','utf8')).job||'')}catch(e){console.log('')}")
echo "started job: $JOB at $(date -u)"
echo "$JOB" > job_lemon.txt
[ -n "$JOB" ] && node ../garlic_long/wait_job.cjs "$JOB" 150
