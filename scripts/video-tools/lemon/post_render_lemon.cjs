// After the lemon long render is done: slide timings from the real scene starts, overlay run (restart only while encoding pieces),
// download of both versions, checks (duration, audio md5, motion under slides) and contact sheets. NEVER uploads to YouTube.
// usage: node post_render_lemon.cjs        (reads job_lemon.txt in this folder; progress in post_render.log by the caller)
const fs = require('fs'), path = require('path'), { execSync, spawnSync } = require('child_process');
const here = __dirname;
const K = 'smartgarden_cron_x7K9pQ2026';
const job = fs.readFileSync(path.join(here, 'job_lemon.txt'), 'utf8').trim();
const out = path.join(here, 'out'); fs.mkdirSync(out, { recursive: true });
const curl = (url, t = 120) => execSync('curl -s -m ' + t + ' "' + url + '"', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const say = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const st = JSON.parse(curl('https://smartgarden.gr/video-render.php?action=status&job=' + job + '&log=1&key=' + K));
if (st.state !== 'done') { say('render not done:', st.state, st.message); process.exit(2); }
const durs = []; const engines = new Set(); const rates = [];
(st.log || []).forEach((l) => {
  let m = l.match(/scene (\d+): engine=(\w+) audio=[\d.]+s dur=([\d.]+)s/); if (m) { durs[+m[1]] = parseFloat(m[3]); engines.add(m[2]); }
  m = l.match(/scene (\d+): [\d.]+s, ([\d.]+) chars\/s \(cut from/); if (m) rates[+m[1]] = parseFloat(m[2]);
});
say('scenes', durs.length, 'engines', [...engines].join(','), 'duration', st.duration, 'chunk rates min/max',
  Math.min(...rates.filter(Boolean)), Math.max(...rates.filter(Boolean)));
if (durs.length !== 53 || durs.some((d) => !(d > 0)) || engines.size !== 1 || !engines.has('gemini')) { say('ABORT: unexpected narration result'); process.exit(3); }
const starts = []; let t = 0; durs.forEach((d) => { starts.push(t); t += d; });

// slide -> first and last scene it covers (checked against the script text)
const HOLDS = [['lemona-01', 2, 4], ['lemona-02', 6, 8], ['lemona-03', 9, 11], ['lemona-04', 13, 15], ['lemona-05', 16, 18], ['lemona-06', 19, 22],
  ['lemona-07', 23, 26], ['lemona-08', 27, 30], ['lemona-09', 33, 36], ['lemona-10', 39, 41], ['lemona-11', 46, 47], ['lemona-12', 51, 51]];
let cov = 0;
const spec = HOLDS.map(([n, a, b]) => { const s = starts[a] + 0.06, e = starts[b] + durs[b] + 0.06; cov += e - s; return n + ':' + s.toFixed(2) + ':' + (e - s).toFixed(2); }).join(',');
fs.writeFileSync(path.join(here, 'spec_lemon.txt'), spec);
say('slide spec covers', Math.round(cov), 's of', Math.round(t), 's');

// the endpoint must not be the empty file the host once left behind
const probe = curl('https://smartgarden.gr/video-inserts.php?key=' + K + '&job=' + job + '&status=1', 60);
if (!probe.trim()) { say('ABORT: video-inserts.php answers with an empty body (host blanked it again?)'); process.exit(4); }
const dry = JSON.parse(curl('https://smartgarden.gr/video-inserts.php?key=' + K + '&job=' + job + '&spec=' + spec + '&overlay=1&dry=1', 90));
if (!dry.success || (dry.inserts || []).length !== 12) { say('ABORT: dry run said', JSON.stringify(dry).slice(0, 200)); process.exit(5); }
say('dry run ok: 12 inserts');
{ let cur = null; try { cur = JSON.parse(curl('https://smartgarden.gr/video-inserts.php?key=' + K + '&job=' + job + '&status=1', 60)); } catch (e) {}
  if (cur && cur.state === 'running') say('overlay already running on the server:', cur.message);
  else { try { curl('https://smartgarden.gr/video-inserts.php?key=' + K + '&job=' + job + '&spec=' + spec + '&overlay=1&run=1', 100); } catch (e) { say('start call timed out (the overlay keeps running on the server)'); } } }

// wait; restart (force=1, same spec) ONLY while the message says "Κομμάτι" and nothing moved for 4 minutes; never during the join
const t0 = Date.now(); let last = '', restarts = 0, final = null;
while (Date.now() - t0 < 90 * 60000) {
  let s = null; try { s = JSON.parse(curl('https://smartgarden.gr/video-inserts.php?key=' + K + '&job=' + job + '&status=1', 100)); } catch (e) {}
  if (s) {
    const line = s.state + ' ' + s.message; if (line !== last) { say(line); last = line; }
    if (s.state === 'done') { final = s; break; }
    if (s.state === 'error') { say('ERROR', JSON.stringify(s).slice(0, 300)); process.exit(6); }
    const age = s.updated ? Date.now() - Date.parse(s.updated) : 0, encoding = /Κομμάτι/.test(s.message || '');
    if (s.state === 'running' && encoding && age > 4 * 60000) {
      if (restarts >= 8) { say('too many restarts'); process.exit(7); }
      restarts++; say('restart', restarts); try { curl('https://smartgarden.gr/video-inserts.php?key=' + K + '&job=' + job + '&spec=' + spec + '&overlay=1&run=1&force=1', 100); } catch (e) { say('restart call timed out (keeps running)'); }
    }
    if (s.state === 'running' && !encoding && age > 20 * 60000) { say('join stalled for 20 minutes'); process.exit(8); }
  }
  sleep(20000);
}
if (!final) { say('overlay timeout'); process.exit(9); }
say('overlay done:', JSON.stringify(final).slice(0, 200));

const base = path.join(out, 'lemon_base.mp4'), sl = path.join(out, 'lemon_slides.mp4');
execSync('curl -s -m 900 -o "' + base + '" "https://smartgarden.gr/video-render.php?action=file&job=' + job + '&key=' + K + '"');
execSync('curl -s -m 900 -o "' + sl + '" "https://smartgarden.gr/video-render.php?action=file&variant=slides&job=' + job + '&key=' + K + '"');
const dur = (f) => parseFloat(execSync('ffprobe -v error -show_entries format=duration -of csv=p=0 "' + f + '"', { encoding: 'utf8' }));
const md5 = (f) => execSync('ffmpeg -loglevel error -i "' + f + '" -vn -f md5 -', { encoding: 'utf8' }).trim();
const dB = dur(base), dS = dur(sl), mB = md5(base), mS = md5(sl);
say('durations base/slides', dB.toFixed(2), dS.toFixed(2), '| audio md5 equal:', mB === mS);
let moving = 0;
spec.split(',').forEach((p, i) => {
  const [, s, d] = p.split(':'); const mid = parseFloat(s) + parseFloat(d) / 2; const h = [];
  [mid, mid + 2].forEach((tt, k) => {
    const f = path.join(out, 'm_' + String(i + 1).padStart(2, '0') + '_' + k + '.png');
    spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', tt.toFixed(2), '-i', sl, '-frames:v', '1', '-vf', 'scale=480:270', f]);
    h.push(require('crypto').createHash('md5').update(fs.readFileSync(f)).digest('hex'));
  });
  if (h[0] !== h[1]) moving++;
});
say('slides with motion underneath:', moving, 'of 12');
spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '1', '-i', path.join(out, 'm_%02d_0.png'), '-vf', 'tile=4x3', '-frames:v', '1', path.join(out, 'sheet_slides.png')]);
spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', sl, '-vf', 'fps=1/46,scale=384:216,tile=6x4', '-frames:v', '1', path.join(out, 'sheet_all.jpg')]);
const ok = Math.abs(dB - dS) < 0.5 && mB === mS && moving === 12;
fs.writeFileSync(path.join(here, 'post_render_result.json'), JSON.stringify({ ok, job, baseDuration: dB, slidesDuration: dS, audioMd5Equal: mB === mS, moving, restarts, spec }, null, 1));
say(ok ? 'ALL CHECKS PASSED' : 'CHECKS FAILED');

// Word-level check of the narration: every scene's audio is transcribed (asr-check.php, Gemini) and compared with the script.
// It is what shows whether the pause-matching cuts of the chunked narration fell on the right sentences.
fs.writeFileSync(path.join(out, 'durs.json'), JSON.stringify(durs));
say('verifying the narration scene by scene (about 10 minutes)...');
const vr = spawnSync('node', ['C:/Users/me/Desktop/smartgarden.gr_fixed/scripts/video-tools/ops/verify_narration.cjs', base, path.join(out, 'durs.json'),
  'C:/Users/me/Desktop/smartgarden.gr_fixed/public/video-scripts/lemonia-long.json', path.join(here, 'verify_result.json')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
console.log((vr.stdout || '').split('\n').filter((l) => /suspicious|START\?|END\?|NO TEXT/.test(l)).join('\n'));
say('narration check finished');
