# Lab for the chunk splitter: runs variants of the pause-matching algorithm on the real garlic chunks and compares the cuts
# with the cuts that were used (cumulative audio durations from the render log; ASR showed scenes 17-20 shifted, the rest right).
import json, math, re, subprocess, sys, os
here = os.path.dirname(os.path.abspath(__file__))
sc = json.load(open(r'C:\Users\me\Desktop\smartgarden.gr_fixed\public\video-scripts\garlic-long.json', encoding='utf-8'))['scenes']
durs = json.load(open(os.path.join(here, '..', 'r_garlicL', 'durs.json')))
chunks = json.load(open(os.path.join(here, 'garlic_chunks.json')))
INF = 1e18

def silences(wav, dur, db='-42', dmin='0.10'):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', wav, '-af', 'silencedetect=n=%sdB:d=%s' % (db, dmin), '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', out)]
    en = [(float(x), float(y)) for x, y in re.findall(r'silence_end: ([0-9.]+) \| silence_duration: ([0-9.]+)', out)]
    sil = [(s, e, d, (s + e) / 2) for s, (e, d) in zip(st, en)]
    return [x for x in sil if 0.4 < x[3] < dur - 0.4]

def split(texts, sil, dur, w_sil=0.6, cap=0.7, w_pos=0.0, pos_tol=0.12, lo=1 / 24.5, hi=1 / 6.5):
    sent = []
    for i, t in enumerate(texts):
        for p in re.split(r'(?<=[.!;?])\s+', t.strip()):
            if p.strip(): sent.append((i, p.strip()))
    S = len(sent); M = len(sil)
    C = sum(len(p) for _, p in sent)
    rbar = C / dur
    cum = []; c = 0
    for _, p in sent: c += len(p); cum.append(c)
    slen = [len(p) for _, p in sent]
    def trans(k, t0, t1, endsil):
        d = t1 - t0
        if d <= 0 or d < slen[k] * lo or d > slen[k] * hi: return INF
        cost = abs(math.log((slen[k] / d) / rbar)) - w_sil * min(endsil, cap)
        if w_pos and k < S - 1:
            exp_end = dur * cum[k] / C
            cost += w_pos * max(0.0, abs(t1 - exp_end) / dur - pos_tol)
        return cost
    f = [[INF] * M for _ in range(S - 1)]; back = [[-1] * M for _ in range(S - 1)]
    for m in range(M): f[0][m] = trans(0, 0.0, sil[m][3], sil[m][2])
    for k in range(1, S - 1):
        for m in range(M):
            best = INF; bi = -1
            for m2 in range(m):
                if f[k - 1][m2] >= INF: continue
                cc = f[k - 1][m2] + trans(k, sil[m2][3], sil[m][3], sil[m][2])
                if cc < best: best = cc; bi = m2
            if bi >= 0: f[k][m] = best; back[k][m] = bi
    tot = [INF] * M
    for m in range(M):
        if f[S - 2][m] < INF:
            cc = trans(S - 1, sil[m][3], dur, 0.0)
            if cc < INF: tot[m] = f[S - 2][m] + cc
    if min(tot) >= INF: return None
    m = min(range(M), key=lambda x: tot[x]); pick = [0] * (S - 1)
    for k in range(S - 2, -1, -1): pick[k] = m; m = back[k][m]
    cuts = [sil[pick[k]][3] for k in range(S - 1) if sent[k][0] != sent[k + 1][0]]
    return cuts

def run(variant, verbose=True):
    res = {}
    for a, b, h in chunks:
        wav = os.path.join(here, 'chunk_%d_%d.wav' % (a, b))
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)
        texts = [sc[i]['voiceover'].replace('«', '').replace('»', '').strip() for i in range(a, b + 1)]
        if a == b: continue
        sil = silences(wav, dur)
        cuts = split(texts, sil, dur, **variant)
        # cuts actually used: cumulative audio (= dur - 0.45) of the scenes
        used = []; t = 0.0
        for i in range(a, b): t += durs[i] - 0.45; used.append(t)
        res[(a, b)] = (cuts, used)
        if verbose:
            if cuts is None: print('chunk %d-%d: NO SPLIT' % (a, b)); continue
            diffs = [round(x - y, 2) for x, y in zip(cuts, used)]
            flag = '' if all(abs(d) < 0.15 for d in diffs) else '   <-- differs'
            print('chunk %2d-%2d  diffs vs used: %s%s' % (a, b, diffs, flag))
    return res

if __name__ == '__main__':
    variants = {
        'current (0.6, cap 0.7)': dict(w_sil=0.6, cap=0.7),
        'sil x3 (1.8, cap 0.8)': dict(w_sil=1.8, cap=0.8),
        'sil x5 (3.0, cap 0.9)': dict(w_sil=3.0, cap=0.9),
        'sil x3 + position prior': dict(w_sil=1.8, cap=0.8, w_pos=6.0, pos_tol=0.10),
    }
    for name, v in variants.items():
        print('=== ', name)
        run(v)
