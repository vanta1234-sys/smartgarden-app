#!/bin/sh
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
