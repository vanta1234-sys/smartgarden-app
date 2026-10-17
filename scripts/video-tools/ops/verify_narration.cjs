// Checks a long render's narration against its script, scene by scene, without Whisper:
// every scene's audio window is cut out of the video, sent to asr-check.php (Gemini transcription) and compared with the script text.
// usage (cwd = a folder with ffmpeg on PATH):
//   node verify_narration.cjs <video.mp4> <durs.json> <script.json> [out.json] [firstScene lastScene]
// durs.json = array of scene durations (from the render log lines "scene N: engine=.. dur=..s"), script.json = public/video-scripts/NAME.json
const fs = require('fs'), path = require('path'), { execSync, spawnSync } = require('child_process');
const [video, dursFile, scriptFile, outFile, a, b] = process.argv.slice(2);
const K = 'smartgarden_cron_x7K9pQ2026';
const durs = JSON.parse(fs.readFileSync(dursFile, 'utf8'));
const script = JSON.parse(fs.readFileSync(scriptFile, 'utf8')).scenes;
const first = a ? +a : 0, last = b ? +b : durs.length - 1;
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
// spoken forms the script writes differently from the audio (digits are transcribed as digits, words as words): compare on words only,
// so numbers are ignored on both sides
const words = (s) => norm(s).filter((w) => !/^\d+$/.test(w));
const starts = []; let t = 0; durs.forEach((d) => { starts.push(t); t += d; });
const tmp = path.join(require('os').tmpdir(), 'sg_asr_scene.mp3');
const results = [];
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
for (let i = first; i <= last; i++) {
  const s = starts[i], d = durs[i];
  spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', s.toFixed(2), '-t', d.toFixed(2), '-i', video, '-vn', '-ac', '1', '-ar', '24000', '-b:a', '48k', tmp]);
  const b64 = fs.readFileSync(tmp).toString('base64');
  fs.writeFileSync(tmp + '.json', JSON.stringify({ audioBase64: b64, mime: 'audio/mpeg' }));
  let text = '', model = '', err = '';
  for (let attempt = 0; attempt < 4 && !text; attempt++) {
    try {
      const r = JSON.parse(execSync('curl -s -m 110 -X POST -H "Content-Type: application/json" -H "X-Cron-Key: ' + K + '" --data-binary @"' + tmp + '.json" https://smartgarden.gr/asr-check.php', { encoding: 'utf8', maxBuffer: 16e6 }));
      if (r.success) { text = r.text; model = r.model; } else { err = JSON.stringify(r).slice(0, 120); sleep(8000); }
    } catch (e) { err = String(e.message).slice(0, 100); sleep(8000); }
  }
  const want = words(script[i].voiceover), got = words(text);
  const gotSet = new Map(); got.forEach((w) => gotSet.set(w, (gotSet.get(w) || 0) + 1));
  let hit = 0; want.forEach((w) => { if (gotSet.get(w) > 0) { hit++; gotSet.set(w, gotSet.get(w) - 1); } });
  const recall = want.length ? hit / want.length : 1;
  const extra = got.length ? Math.max(0, got.length - hit) / got.length : 0; // heard words that the script does not have here
  const head = want.slice(0, 3).join(' '), tail = want.slice(-3).join(' ');
  const gotJoined = got.join(' ');
  const row = { scene: i, seconds: +d.toFixed(1), recall: +recall.toFixed(2), extraShare: +extra.toFixed(2),
    startsRight: gotJoined.startsWith(want.slice(0, 2).join(' ')) || got.slice(0, 4).join(' ').includes(want[0] || ''),
    endsRight: got.slice(-5).join(' ').includes(want[want.length - 1] || ''), model, err: text ? '' : err, heard: text };
  results.push(row);
  console.log('scene', String(i).padStart(2), 'recall', row.recall, 'extra', row.extraShare, row.startsRight ? 'start ok' : 'START?', row.endsRight ? 'end ok' : 'END?', text ? '' : 'NO TEXT ' + err);
}
const ok = results.filter((r) => r.recall >= 0.85 && r.extraShare <= 0.2 && r.startsRight && r.endsRight).length;
console.log('scenes', results.length, 'clean', ok, 'suspicious', results.length - ok, 'mean recall', (results.reduce((x, r) => x + r.recall, 0) / results.length).toFixed(3));
if (outFile) fs.writeFileSync(outFile, JSON.stringify(results, null, 1), 'utf8');
