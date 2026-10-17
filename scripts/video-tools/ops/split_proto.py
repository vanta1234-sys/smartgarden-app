# Prototype of the chunk splitter: one WAV that holds several scenes' narration -> the cut time between scenes.
# usage: python split_proto.py <chunk.wav> <firstScene> <lastScene> [threshold dB] [min silence s]
import sys, re, json, subprocess
wav, a, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
db = sys.argv[4] if len(sys.argv) > 4 else '-42'
dmin = sys.argv[5] if len(sys.argv) > 5 else '0.10'
scenes = json.load(open(r'C:\Users\me\Desktop\smartgarden.gr_fixed\public\video-scripts\garlic-long.json', encoding='utf-8'))['scenes'][a:b + 1]
texts = [s['voiceover'].strip() for s in scenes]

# audio length and silences
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', wav, '-af', 'silencedetect=n=%sdB:d=%s' % (db, dmin), '-f', 'null', '-'], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', out)]
ends = [(float(x), float(y)) for x, y in re.findall(r'silence_end: ([0-9.]+) \| silence_duration: ([0-9.]+)', out)]
sil = []
for s, (e, d) in zip(starts, ends):
    sil.append((s, e, d, (s + e) / 2))
sil = [x for x in sil if 0.4 < x[3] < dur - 0.4]

# sentences
sent = []  # (scene index, text)
for i, t in enumerate(texts):
    for p in re.split(r'(?<=[.!;?])\s+', t):
        if p.strip(): sent.append((i, p.strip()))
S = len(sent); C = sum(len(p) for _, p in sent)
cum = []; c = 0
for _, p in sent:
    c += len(p); cum.append(c)
exp = [dur * cum[k] / C for k in range(S - 1)]  # expected end time of sentence k (k = 0..S-2)
M = len(sil)
print('duration %.1fs  chars %d  scenes %d  sentences %d  silences %d' % (dur, C, len(texts), S, M))
if M < S - 1:
    print('NOT ENOUGH SILENCES'); sys.exit(1)

# Monotone assignment of S-1 silences to the sentence ends. A sentence is spoken at roughly the chunk's own pace, so each
# one is charged for how far its speed is from the chunk's average (in log terms: 20% too fast or slow costs the same),
# and a long silence earns a little. No absolute positions are used, so a slow stretch cannot drag later cuts off course.
import math
INF = 1e18
rbar = C / dur
LO, HI = 1 / 24.5, 1 / 6.5
slen = [len(p) for _, p in sent]
def trans(k, t0, t1, endsil):
    d = t1 - t0
    if d < slen[k] * LO or d > slen[k] * HI: return INF
    return abs(math.log((slen[k] / d) / rbar)) - 0.6 * min(endsil, 0.7)
f = [[INF] * M for _ in range(S - 1)]; back = [[-1] * M for _ in range(S - 1)]
for m in range(M):
    f[0][m] = trans(0, 0.0, sil[m][3], sil[m][2])
for k in range(1, S - 1):
    for m in range(M):
        best = INF; bi = -1
        for m2 in range(m):
            if f[k - 1][m2] >= INF: continue
            c = f[k - 1][m2] + trans(k, sil[m2][3], sil[m][3], sil[m][2])
            if c < best: best = c; bi = m2
        if bi >= 0: f[k][m] = best; back[k][m] = bi
tot = [INF] * M
for m in range(M):
    if f[S - 2][m] < INF:
        c = trans(S - 1, sil[m][3], dur, 0.0)
        if c < INF: tot[m] = f[S - 2][m] + c
if min(tot) >= INF:
    print('NO CONSISTENT SPLIT'); sys.exit(2)
m = min(range(M), key=lambda x: tot[x]); pick = [0] * (S - 1)
for k in range(S - 2, -1, -1):
    pick[k] = m; m = back[k][m]
cuts_s = [0.0] + [sil[pick[k]][3] for k in range(S - 1)] + [dur]
# per-sentence rates
bad = 0
for k in range(S):
    secs = cuts_s[k + 1] - cuts_s[k]; rate = len(sent[k][1]) / secs
    flag = '' if 8 <= rate <= 24 else '   <-- ODD'
    if flag: bad += 1
    print('  s%02d scene %d  %5.1fs  %4.1f c/s  %s%s' % (k, sent[k][0] + a, secs, rate, sent[k][1][:48].replace('\n', ' '), flag))
# scene boundaries
ends_k = [k for k in range(S) if k == S - 1 or sent[k][0] != sent[k + 1][0]]
t0 = 0.0
for k in ends_k:
    t1 = cuts_s[k + 1]; n = sent[k][0]
    print('SCENE %d: %.2f-%.2f  (%.1fs, %d chars, %.1f c/s)' % (n + a, t0, t1, t1 - t0, len(texts[n]), len(texts[n]) / (t1 - t0))); t0 = t1
print('odd sentence rates:', bad)
