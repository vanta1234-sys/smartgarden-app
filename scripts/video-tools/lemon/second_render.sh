#!/bin/sh
# Waits for render 1 (the one that generated the narration, cuts unchecked) and for the checking tool to finish, then runs render 2
# with the same script: every chunk is a cache hit and every checked cut comes from its hint file. Then the post-render steps.
cd "$(dirname "$0")"
K=smartgarden_cron_x7K9pQ2026
J1=$(cat job_lemon.txt)
echo "waiting for render 1 ($J1) at $(date -u)"
until curl -s -m 30 "https://smartgarden.gr/video-render.php?action=status&job=$J1&key=$K" | grep -q '"state": "done"\|"state": "error"'; do sleep 30; done
echo "render 1 finished at $(date -u); waiting for the cut check"
N=0
until grep -q "SUMMARY" prep_follow.log 2>/dev/null || [ $N -ge 360 ]; do sleep 30; N=$((N+1)); done
echo "cut check finished (or gave up) at $(date -u); starting render 2"
tail -15 prep_follow.log
curl -s -m 100 "https://smartgarden.gr/video-render.php?action=start&slug=lemonia-portokalia-glastra-ximonas-potisma-pagetos-20261010&mode=long&script=lemonia-long&key=$K" -o start_lemon2.json
JOB2=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('start_lemon2.json','utf8')).job||'')}catch(e){console.log('')}")
echo "render 2 job: $JOB2 at $(date -u)"
[ -z "$JOB2" ] && exit 1
echo "$JOB2" > job_lemon.txt
node ../garlic_long/wait_job.cjs "$JOB2" 150
node post_render_lemon.cjs
