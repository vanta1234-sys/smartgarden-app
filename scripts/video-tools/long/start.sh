#!/bin/sh
# Starts a long video: waits (optionally) for the Gemini daily quota to renew, prepares and checks the narration locally
# (narration_prep.py), starts the render (all cache hits, hint cuts), waits for it and runs post_render.cjs. NOTHING is uploaded to YouTube.
#
# usage (from an empty scratch folder, which then holds prep/, the logs, the job file and out/):
#   sh <repo>/scripts/video-tools/long/start.sh <config.json>
# "startAfterUtc" in the config (yyyymmddHHMM) holds the start until then: the Gemini free tier renews at midnight Pacific = about 07:00 UTC,
# and while the quota says no, the preparation is retried every 5 minutes anyway.
CFG="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
K=smartgarden_cron_x7K9pQ2026
cfg() { node -e "const c=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));const v=c[process.argv[2]];console.log(v==null?'':v)" "$CFG" "$1"; }
NAME=$(cfg name); SLUG=$(cfg articleSlug); SCRIPTNAME=$(cfg scriptName); SCRIPTFILE=$(cfg scriptFile); GATE=$(cfg startAfterUtc)
JOBFILE=$(cfg jobFile); [ -z "$JOBFILE" ] && JOBFILE="job_$NAME.txt"

if [ -n "$GATE" ]; then
  until [ "$(date -u +%Y%m%d%H%M)" -ge "$GATE" ]; do sleep 60; done
fi
mkdir -p prep && cd prep && cp "$REPO/.env.deploy" .
TRY=0
while [ $TRY -lt 80 ]; do
  TRY=$((TRY+1))
  echo "prep attempt $TRY at $(date -u)"
  PYTHONIOENCODING=utf-8 python -u "$REPO/scripts/video-tools/ops/narration_prep.py" "$REPO/$SCRIPTFILE" --upload > ../prep_final.log 2>&1
  grep -E "^chunk|cuts|GEMINI|no transcript|SUMMARY" ../prep_final.log | tail -20
  if grep -q "GEMINI FAILED" ../prep_final.log; then echo "Gemini TTS quota not back yet, waiting 5 minutes"; sleep 300
  elif grep -q "no transcript" ../prep_final.log; then echo "transcription not available, waiting 10 minutes"; sleep 600
  else break; fi
done
cd ..
echo "prep finished at $(date -u); starting the render"
curl -s -m 100 "https://smartgarden.gr/video-render.php?action=start&slug=$SLUG&mode=long&script=$SCRIPTNAME&key=$K" -o "start_$NAME.json"
JOB=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).job||'')}catch(e){console.log('')}" "start_$NAME.json")
echo "render job: $JOB at $(date -u)"
[ -z "$JOB" ] && exit 1
echo "$JOB" > "$JOBFILE"
node "$REPO/scripts/video-tools/garlic/wait_job.cjs" "$JOB" 150
node "$HERE/post_render.cjs" "$CFG"
