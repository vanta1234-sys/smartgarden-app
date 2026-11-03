// Local fallback for the server's slide overlay (video-inserts.php) when that stalls: the roses video (2026-11-02) hung on the same piece (the first
// 30 s chunk of the third slide) twice and came out 243 s instead of 1109 s, because a restart takes the half-written piece for a finished one.
// This builds the same strip on this PC: stretches of the original, each slide's lettering laid over the picture, joined without re-encoding,
// and the untouched original audio put back. Same encoder settings and the same overlay graph as the server, so the look is identical.
//
// usage (any cwd):  node overlay_local.cjs <base.mp4> <spec.txt> <out.mp4> [work dir]
//   spec.txt = the line post_render.cjs wrote ("roses-01:142.28:60.78,roses-02:..."), name:start:duration, one PNG per name in public/_slides/<name>.png
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const [base, specFile, outFile, workArg] = process.argv.slice(2);
if (!base || !specFile || !outFile) { console.log('usage: node overlay_local.cjs <base.mp4> <spec.txt> <out.mp4> [work dir]'); process.exit(1); }
const repo = path.join(__dirname, '..', '..', '..');
const work = path.resolve(workArg || path.join(path.dirname(outFile), 'overlay_work'));
const baseAbs = path.resolve(base), outAbs = path.resolve(outFile);
fs.mkdirSync(work, { recursive: true });
const say = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const probe = (f, what) => parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout);

const items = fs.readFileSync(specFile, 'utf8').trim().split(',').map((p) => { const [name, s, d] = p.split(':'); return { name, start: parseFloat(s), dur: parseFloat(d) }; });
const total = probe(baseAbs);
const strip = []; let cursor = 0;
items.forEach((it) => {
  if (it.start > cursor + 0.05) strip.push({ kind: 'src', from: cursor, to: it.start });
  strip.push({ kind: 'over', png: path.join(repo, 'public', '_slides', it.name + '.png'), from: it.start, to: it.start + it.dur });
  cursor = it.start + it.dur;
});
if (cursor < total - 0.05) strip.push({ kind: 'src', from: cursor, to: total });

const VENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-r', '30', '-fps_mode', 'cfr', '-g', '60', '-bf', '0', '-refs', '1', '-an'];
const pieces = [];
strip.forEach((p, i) => {
  const dst = path.join(work, 'p' + String(i).padStart(3, '0') + '.mp4'); pieces.push(dst);
  const len = p.to - p.from; const ss = ['-ss', p.from.toFixed(3), '-t', len.toFixed(3), '-i', baseAbs];
  let args;
  if (p.kind === 'over') {
    const fc = '[0:v]scale=1920:1080,setsar=1,setpts=PTS-STARTPTS[bg];[1:v]format=yuva420p[ov];[bg][ov]overlay=0:0:eof_action=repeat:format=yuv420';
    args = ['-y', '-hide_banner', '-loglevel', 'error', ...ss, '-i', p.png, '-filter_complex', fc, ...VENC, dst];
  } else {
    args = ['-y', '-hide_banner', '-loglevel', 'error', ...ss, '-vf', 'scale=1920:1080,setsar=1', ...VENC, dst];
  }
  // a piece left by an earlier run counts only if its length is right (a half-written one is NOT finished: that is what broke the server's resume)
  if (fs.existsSync(dst) && Math.abs(probe(dst) - len) < 0.2) { say('piece', i + 1, 'of', strip.length, 'already done'); return; }
  say('piece', i + 1, 'of', strip.length, p.kind, p.from.toFixed(2), '->', p.to.toFixed(2));
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  const d = r.status === 0 && fs.existsSync(dst) ? probe(dst) : 0;
  if (!(Math.abs(d - len) < 0.2)) { say('FAILED piece', i + 1, 'wanted', len.toFixed(2), 'got', d.toFixed(2), (r.stderr || '').slice(0, 300)); process.exit(2); }
});
fs.writeFileSync(path.join(work, 'concat.txt'), pieces.map((f) => "file '" + f.replace(/\\/g, '/') + "'").join('\n'));
const joined = path.join(work, 'joined.mp4');
let r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(work, 'concat.txt'), '-c', 'copy', joined], { encoding: 'utf8' });
if (r.status !== 0) { say('JOIN FAILED', (r.stderr || '').slice(0, 300)); process.exit(3); }
r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', joined, '-i', baseAbs, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', outAbs], { encoding: 'utf8' });
if (r.status !== 0) { say('MUX FAILED', (r.stderr || '').slice(0, 300)); process.exit(4); }
say('DONE', outAbs, 'duration', probe(outAbs).toFixed(2), 'of', total.toFixed(2));
