// waits for video-inserts to finish. Restarts (force=1, resumes finished pieces) ONLY while it is encoding pieces
// ("Κομμάτι N από M") and has not moved for 4 minutes. Never during the final join: a restart there starts a second
// process on the same work directory and corrupts the output (it produced a 436 s file instead of 985 s).
const { execSync } = require('child_process'); const fs = require('fs');
const job = process.argv[2]; const spec = fs.readFileSync(process.argv[3], 'utf8').trim(); const K = 'smartgarden_cron_x7K9pQ2026';
const t0 = Date.now(); let last = ''; let restarts = 0;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const get = (q) => { try { return JSON.parse(execSync('curl -s -m 100 "https://smartgarden.gr/video-inserts.php?key=' + K + '&job=' + job + q + '"', { encoding: 'utf8' })); } catch (e) { return null; } };
while (Date.now() - t0 < 70 * 60000) {
  const st = get('&status=1');
  if (st) {
    const line = st.state + ' ' + st.message; if (line !== last) { console.log(new Date().toISOString().slice(11, 19), line); last = line; }
    if (st.state === 'done') { console.log('FINAL', JSON.stringify(st).slice(0, 500)); process.exit(0); }
    if (st.state === 'error') { console.log('ERROR', JSON.stringify(st).slice(0, 500)); process.exit(3); }
    const age = st.updated ? Date.now() - Date.parse(st.updated) : 0;
    const encoding = /Κομμάτι/.test(st.message || '');
    if (st.state === 'running' && encoding && age > 4 * 60000) {
      if (restarts >= 8) { console.log('too many restarts'); process.exit(4); }
      restarts++; console.log('restart', restarts, 'at', st.message); get('&spec=' + spec + '&overlay=1&run=1&force=1');
    }
    if (st.state === 'running' && !encoding && age > 20 * 60000) { console.log('join stalled for 20 min', JSON.stringify(st)); process.exit(5); }
  }
  sleep(15000);
}
console.log('TIMEOUT'); process.exit(6);
