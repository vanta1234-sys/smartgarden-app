// The automatic half of the daily Short review (owner's standing order of 2026-10-21: after exhaustive, successful checks the Short goes up PUBLIC).
// It downloads the held render, transcribes EVERY scene with several ears and builds the frame sheets that a person (me) must LOOK at before upload_short.cjs is run.
// usage (cwd = repo root, ffmpeg on PATH):  node scripts/video-tools/ops/review_short.cjs [jobId]
//   no jobId -> the newest finished, held Short that has no uploaded_<job>.json yet.
// Output folder: C:/Users/me/Desktop/smartgarden-videos/shorts/<job>/ with video.mp4, job.json, report.json, sheet_every3s.jpg, sheet_scene_edges.jpg.
// A scene passes when at least TWO independent opinions are clean: Gemini 3.6-flash, Gemini 3.1-flash-lite, Gemini 3.7-flash (tried in that order, only as many as needed)
// and local Whisper (tolerant character-trigram match, Whisper garbles Greek words but notices cut or missing sentences). The cheap "flash-lite" model alone is NOT trusted:
// on 2026-10-21 it heard "Η σήψη ριζών" as "Η ΣΥΡΙΖΑΝ".  Passing here is necessary, not sufficient: the frames still have to be looked at.
const fs = require('fs'), path = require('path'), { execSync, spawnSync } = require('child_process');
const K = 'smartgarden_cron_x7K9pQ2026';
const SHORTS = 'C:/Users/me/Desktop/smartgarden-videos/shorts';
const WHISPER_PY = 'C:/Users/me/smartgarden-tools/whisper/venv/Scripts/python.exe';
const SYS_PY = 'C:/Users/me/AppData/Local/Programs/Python/Python314/python.exe';
const here = __dirname;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const sh = (cmd, o = {}) => execSync(cmd, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...o });
// the closing line is written phonetically in the script ("Σμαρτ Γκάρντεν τελεία τζι-αρ") and transcribed as the web address: compare both as the spoken form
const spoken = (s) => String(s).replace(/smart\s*garden\s*(\.|\s)?\s*gr/gi, 'σμαρτ γκάρντεν τελεία τζι αρ');
const norm = (s) => spoken(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
const words = (s) => norm(s).filter((w) => !/^\d+$/.test(w));
const tri = (s) => { const t = words(s).join(''); const set = new Set(); for (let i = 0; i + 3 <= t.length; i++) set.add(t.slice(i, i + 3)); return set; };

fs.mkdirSync(SHORTS, { recursive: true });
let job = process.argv[2];
const jobs = JSON.parse(sh('curl -s -m 60 "https://smartgarden.gr/video-render.php?action=jobs&limit=12&key=' + K + '"')).jobs;
if (!job) {
  // only today's Short: the article date in the slug (…-YYYYMMDD) must be yesterday, today or tomorrow (local). Older held renders are parked on purpose or were uploaded
  // before the uploaded_<job>.json marker existed (the 10-20 ficus Short), and must never be picked up again.
  const dayNo = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  const today = dayNo(new Date());
  const fresh = (j) => { const m = String(j.article || '').match(/-(\d{4})(\d{2})(\d{2})$/); if (!m) return false; const n = Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000); return n >= today - 1 && n <= today + 1; };
  const c = jobs.find((j) => j.state === 'done' && j.published && j.published.held && fresh(j) && !fs.existsSync(path.join(SHORTS, 'uploaded_' + j.job + '.json')));
  if (!c) { console.log('NO HELD SHORT WAITING (nothing finished and held without an upload marker)'); process.exit(10); }
  job = c.job;
}
const row = jobs.find((j) => j.job === job);
const out = path.join(SHORTS, job); fs.mkdirSync(out, { recursive: true });
console.log('job', job, row ? row.article + ' ' + row.duration + 's state=' + row.state : '(not in the 12 newest)');

// --- files
const video = path.join(out, 'video.mp4');
if (!fs.existsSync(video) || fs.statSync(video).size < 100000) sh('curl -s -m 280 -o "' + video + '" "https://smartgarden.gr/video-render.php?action=file&job=' + job + '&key=' + K + '"');
const r = spawnSync('node', [path.join(here, 'ftp_put.cjs'), 'get', '../video-jobs/' + job + '/job.json', path.join(out, 'job.json')], { cwd: process.cwd(), encoding: 'utf8' });
if (!fs.existsSync(path.join(out, 'job.json'))) { console.log('cannot fetch job.json', r.stdout, r.stderr); process.exit(2); }
const jobj = JSON.parse(fs.readFileSync(path.join(out, 'job.json'), 'utf8'));
const scenes = jobj.script.scenes;
const st = JSON.parse(sh('curl -s -m 60 "https://smartgarden.gr/video-render.php?action=status&job=' + job + '&log=1&key=' + K + '"'));
const durs = [];
(st.log || []).forEach((l) => { const m = l.match(/scene (\d+): engine=\w+ audio=[\d.]+s dur=([\d.]+)s/); if (m) durs[+m[1]] = parseFloat(m[2]); });
const problems = [];
if (st.state !== 'done') problems.push('render state is ' + st.state);
if (durs.length !== scenes.length || durs.some((d) => !(d > 0))) problems.push('scene durations incomplete in the render log (' + durs.length + ' of ' + scenes.length + ')');
if (problems.length) { console.log('STOP:', problems.join('; ')); process.exit(3); }
fs.writeFileSync(path.join(out, 'durs.json'), JSON.stringify(durs));
const log = (st.log || []).join('\n');

// --- metadata checks
const meta = [];
const probe = JSON.parse(sh('ffprobe -v error -show_entries stream=codec_type,width,height,duration -of json "' + video + '"'));
const vs = probe.streams.find((s) => s.codec_type === 'video'), as = probe.streams.find((s) => s.codec_type === 'audio');
const total = durs.reduce((a, b) => a + b, 0);
meta.push(['video 1080x1920', vs && vs.width === 1080 && vs.height === 1920]);
meta.push(['has audio', !!as]);
meta.push(['length 20-75 s (' + total.toFixed(1) + ')', total >= 20 && total <= 75]);
meta.push(['file length matches the scenes (' + parseFloat(vs.duration).toFixed(1) + ' vs ' + total.toFixed(1) + ')', Math.abs(parseFloat(vs.duration) - total) < 1.5]);
const vol = spawnSync('ffmpeg', ['-hide_banner', '-i', video, '-af', 'volumedetect', '-vn', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '';
const mean = (vol.match(/mean_volume: (-?[\d.]+) dB/) || [])[1];
meta.push(['audio is not silent (mean ' + mean + ' dB)', mean !== undefined && parseFloat(mean) > -40]);
const yt = jobj.script.youtubeTitle || '', yd = jobj.script.youtubeDescription || '';
meta.push(['YouTube title 10-100 chars (' + yt.length + ')', yt.length >= 10 && yt.length <= 100]);
const slug = jobj.article && jobj.article.slug;
meta.push(['description links to the article', !!slug && yd.includes('https://smartgarden.gr/article/' + slug)]);
const pageCode = sh('curl -s -o NUL -w "%{http_code}" -m 40 "https://smartgarden.gr/article/' + slug + '"').trim();
meta.push(['the article page answers 200 (' + pageCode + ')', pageCode === '200']);
meta.push(['render log has no failed scene without a later success', !/failed/.test(log) || /done:/.test(log)]);
const todays = fs.readdirSync(SHORTS).filter((f) => /^uploaded_.*\.json$/.test(f) && f !== 'uploaded_' + job + '.json' && new Date(fs.statSync(path.join(SHORTS, f)).mtime).toDateString() === new Date().toDateString());
meta.push(['no other Short uploaded today (one new topic a day)', todays.length === 0]);
meta.forEach(([k, v]) => console.log(v ? '  ok  ' : '  FAIL', k));

// --- Gemini ears
const tmp = path.join(require('os').tmpdir(), 'sg_review_scene');
const starts = []; let acc = 0; durs.forEach((d) => { starts.push(acc); acc += d; });
function gemini(i, model) {
  spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', starts[i].toFixed(2), '-t', durs[i].toFixed(2), '-i', video, '-vn', '-ac', '1', '-ar', '24000', '-b:a', '48k', tmp + '.mp3']);
  fs.writeFileSync(tmp + '.json', JSON.stringify({ audioBase64: fs.readFileSync(tmp + '.mp3').toString('base64'), mime: 'audio/mpeg', model }));
  for (let a = 0; a < 4; a++) {
    try {
      const x = JSON.parse(sh('curl -s -m 110 -X POST -H "Content-Type: application/json" -H "X-Cron-Key: ' + K + '" --data-binary @"' + tmp + '.json" https://smartgarden.gr/asr-check.php'));
      if (x.success) return x.text;
    } catch (e) { /* retry */ }
    sleep(8000);
  }
  return '';
}
function judge(i, text) {
  const want = words(scenes[i].voiceover), got = words(text);
  const gotCount = new Map(); got.forEach((w) => gotCount.set(w, (gotCount.get(w) || 0) + 1));
  let hit = 0; want.forEach((w) => { if (gotCount.get(w) > 0) { hit++; gotCount.set(w, gotCount.get(w) - 1); } });
  const recall = want.length ? hit / want.length : 1, extra = got.length ? Math.max(0, got.length - hit) / got.length : 0;
  const joined = got.join(' ');
  // the first word is often a rare plant name or a verb the transcribers spell differently but that SOUNDS the same ("Γκαϊλάρδια" heard as "Γαϊλάρδια", "Ανέχεται" heard as
  // "Αν έχετε"): accept it when it is within a small edit distance of the first script word, alone or merged with the next heard word
  const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  const simW = (a, b) => (a && b ? 1 - lev(a, b) / Math.max(a.length, b.length) : 0);
  const firstClose = want[0] && (simW(want[0], got[0]) >= 0.7 || simW(want[0], (got[0] || '') + (got[1] || '')) >= 0.7);
  const startsRight = joined.startsWith(want.slice(0, 2).join(' ')) || got.slice(0, 4).join(' ').includes(want[0] || '') || !!firstClose;
  const endsRight = got.slice(-5).join(' ').includes(want[want.length - 1] || '');
  return { recall: +recall.toFixed(2), extra: +extra.toFixed(2), startsRight, endsRight, clean: !!text && recall >= 0.85 && extra <= 0.2 && startsRight && endsRight };
}
const rep = scenes.map((s, i) => ({ scene: i, script: s.voiceover, opinions: {} }));
const MODELS = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash'];
// whisper first (one process for all scenes), it is the independent ear
let whisperOk = false;
if (fs.existsSync(WHISPER_PY)) {
  const w = spawnSync(WHISPER_PY, [path.join(here, 'whisper_scenes.py'), video, path.join(out, 'durs.json'), path.join(out, 'whisper.json')], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, timeout: 900000 });
  whisperOk = fs.existsSync(path.join(out, 'whisper.json'));
  if (!whisperOk) console.log('whisper failed:', (w.stderr || '').slice(-300));
}
if (whisperOk) {
  JSON.parse(fs.readFileSync(path.join(out, 'whisper.json'), 'utf8')).forEach((x) => {
    const a = tri(scenes[x.scene].voiceover), b = tri(x.text);
    let hit = 0; a.forEach((g) => { if (b.has(g)) hit++; });
    const t = a.size ? hit / a.size : 1;
    rep[x.scene].opinions.whisper = { text: x.text, trigramRecall: +t.toFixed(2), clean: t >= 0.6 };
  });
}
for (let i = 0; i < scenes.length; i++) {
  for (const m of MODELS) {
    const clean = Object.values(rep[i].opinions).filter((o) => o.clean).length;
    if (clean >= 2 && Object.keys(rep[i].opinions).some((k) => k.startsWith('gemini'))) break;
    const text = gemini(i, m);
    rep[i].opinions[m] = { text, ...judge(i, text) };
  }
  rep[i].cleanOpinions = Object.entries(rep[i].opinions).filter(([, o]) => o.clean).map(([k]) => k);
  rep[i].pass = rep[i].cleanOpinions.length >= 2 && rep[i].cleanOpinions.some((k) => k.startsWith('gemini'));
  console.log('scene', i, rep[i].pass ? 'PASS' : 'FAIL', rep[i].cleanOpinions.join(', ') || '(no clean opinion)');
  if (!rep[i].pass) Object.entries(rep[i].opinions).forEach(([k, o]) => console.log('     ', k, '=>', (o.text || '').slice(0, 160)));
}

// --- frames
const fr = spawnSync(SYS_PY, ['-I', path.join(here, 'short_frames.py'), video, path.join(out, 'durs.json'), out], { encoding: 'utf8' });
const sheets = ['sheet_every3s.jpg', 'sheet_scene_edges.jpg'].map((f) => path.join(out, f)).filter((f) => fs.existsSync(f));
if (sheets.length !== 2) console.log('frame sheets failed:', (fr.stderr || fr.stdout || '').slice(-300));

const metaPass = meta.every(([, v]) => v), asrPass = rep.every((s) => s.pass);
const report = { job, article: slug, seconds: +total.toFixed(2), title: yt, meta: meta.map(([k, v]) => ({ check: k, ok: v })), whisper: whisperOk, scenes: rep, asrPass, metaPass, autoPass: asrPass && metaPass && sheets.length === 2, sheets, when: new Date().toISOString() };
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
console.log('\nASR', asrPass ? 'PASS' : 'FAIL', '| metadata', metaPass ? 'PASS' : 'FAIL', '| whisper', whisperOk ? 'used' : 'NOT available');
console.log('AUTOMATIC CHECKS:', report.autoPass ? 'PASS (now LOOK at the sheets, then upload_short.cjs)' : 'FAIL (do not upload)');
console.log('sheets:', sheets.join('  '));
console.log('report:', path.join(out, 'report.json'));
process.exit(report.autoPass ? 0 : 1);
