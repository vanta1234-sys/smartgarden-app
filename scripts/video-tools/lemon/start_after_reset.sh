#!/bin/sh
# Waits for the Gemini daily quota reset (00:00 UTC), then starts the long lemon render and waits for it.
K=smartgarden_cron_x7K9pQ2026
until [ "$(date -u +%Y%m%d%H%M)" -ge 202610180005 ]; do sleep 30; done
curl -s -m 100 "https://smartgarden.gr/video-render.php?action=start&slug=lemonia-portokalia-glastra-ximonas-potisma-pagetos-20261010&mode=long&script=lemonia-long&key=$K" -o start_lemon.json
JOB=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('start_lemon.json','utf8')).job||'')}catch(e){console.log('')}")
echo "started job: $JOB at $(date -u)"
echo "$JOB" > job_lemon.txt
[ -n "$JOB" ] && node ../garlic_long/wait_job.cjs "$JOB" 150
