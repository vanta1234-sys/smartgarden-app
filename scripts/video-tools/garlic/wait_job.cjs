// usage: node wait_job.cjs <jobId> [maxMinutes]  -- exits when the job is done / errored / has not moved for 15 minutes
const { execSync } = require('child_process');
const job = process.argv[2]; const max = parseInt(process.argv[3] || '120', 10);
const K = 'smartgarden_cron_x7K9pQ2026';
const t0 = Date.now(); let last = '';
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
while (Date.now() - t0 < max * 60000) {
  let st = null;
  try { st = JSON.parse(execSync('curl -s -m 30 "https://smartgarden.gr/video-render.php?action=status&job=' + job + '&key=' + K + '"', { encoding: 'utf8' })); } catch (e) {}
  if (st) {
    const line = st.state + ' ' + st.progress + '% ' + st.message;
    if (line !== last) { console.log(new Date().toISOString().slice(11, 19), line); last = line; }
    if (st.state === 'done' || st.state === 'error') { console.log('FINAL', JSON.stringify(st).slice(0, 400)); process.exit(st.state === 'done' ? 0 : 3); }
    if (st.updated && Date.now() - Date.parse(st.updated) > 15 * 60000) { console.log('STALLED', JSON.stringify(st).slice(0, 300)); process.exit(4); }
  }
  sleep(20000);
}
console.log('TIMEOUT'); process.exit(5);
