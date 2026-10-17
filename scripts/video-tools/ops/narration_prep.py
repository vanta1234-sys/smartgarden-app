# Prepares the narration of a long video BEFORE it is rendered, so the render finds every chunk in the server cache and every cut checked.
#
#   python narration_prep.py <script.json> [--upload] [--no-generate] [--only a-b]
#
# For each chunk of about 1,400 characters (same plan, same text and same cache name as sg_chunk_plan / sg_narrate_chunk in
# public/video-worker.php):
#   1. take the chunk audio from the server cache (video-jobs/_tts-cache/<sha1>.wav), or ask Gemini for it through tts-edge.php
#      (paced like the worker: at least 21 s, and 1.3 x the audio length, between requests; stops at the first quota error);
#   2. find the scene cuts with the same pause-matching as the worker, then CHECK them: every scene's audio is transcribed
#      (asr-check.php) and compared with its script; a cut that is words too late or too early is moved and checked again;
#   3. with --upload, put the audio (if it was generated here) and <sha1>.cuts.json into the server cache; the worker then uses those cuts.
# Needs ffmpeg/ffprobe on PATH and .env.deploy (FTP) in the current folder. Never uploads to YouTube.
import argparse, base64, difflib, ftplib, hashlib, json, math, os, re, subprocess, sys, time, unicodedata, urllib.error, urllib.parse, urllib.request

KEY = 'smartgarden_cron_x7K9pQ2026'
MODEL = 'gemini-3.8-flash-tts'
UA = 'Mozilla/5.0 (compatible; SmartGardenPrep/1.0)'
INF = 1e18
WORK = os.path.join(os.getcwd(), 'narration_work')
os.makedirs(WORK, exist_ok=True)
ASR_FILE = os.path.join(WORK, 'asr_cache.json')
ASR = json.load(open(ASR_FILE, encoding='utf-8')) if os.path.exists(ASR_FILE) else {}


def env():
    d = {}
    for line in open('.env.deploy', encoding='utf-8'):
        m = re.match(r'\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$', line)
        if m and not line.strip().startswith('#'): d[m.group(1)] = m.group(2).strip('"\'')
    return d


def clean(t): return t.replace('«', '').replace('»', '').strip()


def chunk_plan(scenes, max_chars=1400):
    chunks, cur, ln = [], [], 0
    for i, s in enumerate(scenes):
        l = len(s['voiceover'].strip()) + 2
        if cur and ln + l > max_chars: chunks.append(cur); cur = []; ln = 0
        cur.append(i); ln += l
    if cur: chunks.append(cur)
    return chunks


def sha_name(text): return hashlib.sha1((MODEL + '|Kore|' + text).encode('utf-8')).hexdigest()


def probe_duration(wav):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav], capture_output=True, text=True).stdout)


def silences(wav, dur, db='-42', dmin='0.10'):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', wav, '-af', 'silencedetect=n=%sdB:d=%s' % (db, dmin), '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', out)]
    en = [(float(x), float(y)) for x, y in re.findall(r'silence_end: ([0-9.]+) \| silence_duration: ([0-9.]+)', out)]
    return [x for x in [(s, e, d, (s + e) / 2) for s, (e, d) in zip(st, en)] if 0.4 < x[3] < dur - 0.4]


def split_points(texts, sil, dur):
    """The worker's pause-matching (sg_split_points), see public/video-worker.php."""
    sent = []
    for i, t in enumerate(texts):
        for p in re.split(r'(?<=[.!;?])\s+', t.strip()):
            if p.strip(): sent.append((i, p.strip()))
    S, M = len(sent), len(sil)
    if S < 2 or M < S - 1: return None
    C = sum(len(p) for _, p in sent); rbar = C / dur; slen = [len(p) for _, p in sent]

    def trans(k, t0, t1, endsil):
        d = t1 - t0
        if d <= 0 or d < slen[k] / 24.5 or d > slen[k] / 6.5: return INF
        return abs(math.log((slen[k] / d) / rbar)) - 0.6 * min(endsil, 0.7)
    f = [[INF] * M for _ in range(S - 1)]; back = [[-1] * M for _ in range(S - 1)]
    for m in range(M): f[0][m] = trans(0, 0.0, sil[m][3], sil[m][2])
    for k in range(1, S - 1):
        for m in range(M):
            best, bi = INF, -1
            for m2 in range(m):
                if f[k - 1][m2] >= INF: continue
                c = f[k - 1][m2] + trans(k, sil[m2][3], sil[m][3], sil[m][2])
                if c < best: best, bi = c, m2
            if bi >= 0: f[k][m] = best; back[k][m] = bi
    tot = [INF] * M
    for m in range(M):
        if f[S - 2][m] < INF:
            c = trans(S - 1, sil[m][3], dur, 0.0)
            if c < INF: tot[m] = f[S - 2][m] + c
    if min(tot) >= INF: return None
    m = min(range(M), key=lambda x: tot[x]); pick = [0] * (S - 1)
    for k in range(S - 2, -1, -1): pick[k] = m; m = back[k][m]
    cuts = [sil[pick[k]][3] for k in range(S - 1) if sent[k][0] != sent[k + 1][0]]
    return cuts if len(cuts) == len(texts) - 1 else None


def norm_words(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').replace('ς', 'σ')
    return [w for w in re.sub(r'[^\w\s]', ' ', s).split() if not w.isdigit() and w != '_']


def transcribe(wav, t0, t1):
    key = '%s|%.2f|%.2f' % (os.path.basename(wav), t0, t1)
    if key in ASR: return ASR[key]
    tmp = os.path.join(WORK, '_seg.mp3')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '%.2f' % t0, '-t', '%.2f' % (t1 - t0), '-i', wav, '-vn', '-ac', '1', '-ar', '24000', '-b:a', '48k', tmp], check=True)
    body = json.dumps({'audioBase64': base64.b64encode(open(tmp, 'rb').read()).decode(), 'mime': 'audio/mpeg'}).encode()
    text = ''
    for _ in range(5):
        try:
            req = urllib.request.Request('https://smartgarden.gr/asr-check.php', data=body, headers={'Content-Type': 'application/json', 'X-Cron-Key': KEY, 'User-Agent': UA})
            r = json.load(urllib.request.urlopen(req, timeout=110))
            if r.get('success'): text = r['text']; break
        except Exception as e:
            time.sleep(6)
    if text:
        ASR[key] = text; json.dump(ASR, open(ASR_FILE, 'w', encoding='utf-8'))
    return text


def align_end(sw, hw):
    blocks = [b for b in difflib.SequenceMatcher(None, sw, hw, autojunk=False).get_matching_blocks() if b.size >= 2]
    if not blocks: return 0, 0
    l = blocks[-1]
    return l.a + l.size, l.b + l.size


def fuzzy_find(needle, hay, start=0, need=4):
    """Index in `hay` where most of the `needle` words (compared with a similarity of at least 0.72, since the transcription spells
    words slightly differently every time) line up one after the other, or None."""
    best = None
    for p in range(max(0, start), max(0, len(hay) - 3)):
        score = 0
        for k, w in enumerate(needle):
            if p + k < len(hay) and difflib.SequenceMatcher(None, w, hay[p + k]).ratio() >= 0.72: score += 1
        if score >= need and (best is None or score > best[1]): best = (p, score)
    return best[0] if best else None


def repair(wav, texts, cuts, dur, rounds=6):
    """Moves a cut only on evidence from the other side of it: words that open the NEXT scene turn up at the end of this scene's audio
    (the cut is late by those words), or words that close THIS scene turn up at the start of the next scene's audio (it is early).
    The move is the duration of those words, snapped to the nearest pause (never more than 12 s). A cut that flips direction between rounds
    moves half as far; the best configuration seen is kept."""
    sil_all = silences(wav, dur, '-34', '0.05')
    prev = {}; best = None
    for rnd in range(rounds):
        bounds = [0.0] + cuts + [dur]
        heard = [transcribe(wav, bounds[k], bounds[k + 1]) for k in range(len(texts))]
        if not all(heard): print('    (no transcript for some scene, keeping the cuts)'); return cuts, False
        hw = [norm_words(h) for h in heard]; sw = [norm_words(t) for t in texts]
        moves = []; total = 0
        for j in range(len(cuts)):
            seg_j = bounds[j + 1] - bounds[j]; seg_n = bounds[j + 2] - bounds[j + 1]
            delta = 0.0
            # late: the next scene's first words are inside this scene's audio, in its second half
            late = fuzzy_find(sw[j + 1][:6], hw[j], int(0.4 * len(hw[j])))
            if late is not None:
                extra = len(hw[j]) - late; delta = -extra * seg_j / max(1, len(hw[j])); total += extra
            else:
                # early: this scene's last words are inside the next scene's audio, near its start
                tail = sw[j][-8:]
                early = fuzzy_find(tail[-6:], hw[j + 1][:max(14, len(hw[j + 1]) // 3)], 0)
                if early is not None:
                    missing = early + 6; delta = missing * seg_n / max(1, len(hw[j + 1])); total += missing
            delta = max(-12.0, min(12.0, delta))
            if delta:
                if j in prev and prev[j] * delta < 0: delta /= 2
                moves.append((j, delta))
        if best is None or total < best[0]: best = (total, list(cuts))
        if not moves: return cuts, True
        print('    round', rnd, 'moves', [(j, round(d, 1)) for j, d in moves])
        for j, delta in moves:
            prev[j] = delta
            target = cuts[j] + delta
            cand = [s for s in sil_all if abs(s[3] - target) < 1.4 and s[3] > (cuts[j - 1] if j > 0 else 0.0) + 3 and (j == len(cuts) - 1 or s[3] < cuts[j + 1] - 3) and s[3] < dur - 3]
            if cand: cuts[j] = max(cand, key=lambda s: s[2] - 0.25 * abs(s[3] - target))[3]
    return best[1], best[0] <= 3


def gemini_chunk(text, dest):
    body = urllib.parse.urlencode({'text': text}).encode()
    req = urllib.request.Request('https://smartgarden.gr/tts-edge.php?meta=1&engine=gemini&gmodel=' + MODEL, data=body, headers={'User-Agent': UA})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=110))
    except urllib.error.HTTPError as e:
        try: info = json.load(e)
        except Exception: info = {}
        return None, 'HTTP %d %s' % (e.code, json.dumps(info)[:160])
    except Exception as e:
        return None, str(e)[:160]
    if not r.get('audioBase64'): return None, 'no audio in the answer'
    data = base64.b64decode(r['audioBase64'])
    open(dest, 'wb').write(data)
    return len(data) / 48000.0, ''


def ftp():
    e = env(); f = ftplib.FTP(); f.connect('185.29.24.7', 21, timeout=60); f.login(e['FTP_USER'], e['FTP_PASSWORD']); return f


def ftp_do(fn):
    """One short-lived connection per action: the server drops an idle control connection after 120 seconds."""
    f = ftp()
    try: return fn(f)
    finally:
        try: f.quit()
        except Exception: pass


def cache_names():
    try: return {os.path.basename(n)[:-4] for n in ftp_do(lambda f: f.nlst('/video-jobs/_tts-cache')) if n.endswith('.wav')}
    except Exception as e: print('cache listing failed', e); return set()


def download_chunk(h, wav):
    def go(f):
        with open(wav, 'wb') as fh: f.retrbinary('RETR /video-jobs/_tts-cache/' + h + '.wav', fh.write)
    ftp_do(go)


def upload_file(local, remote):
    def go(f):
        with open(local, 'rb') as fh: f.storbinary('STOR ' + remote, fh)
    ftp_do(go)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('script'); ap.add_argument('--upload', action='store_true'); ap.add_argument('--no-generate', action='store_true'); ap.add_argument('--only'); ap.add_argument('--wait-cache', action='store_true', help='never ask Gemini: wait for the chunks to appear in the server cache (a render is generating them)')
    a = ap.parse_args()
    scenes = json.load(open(a.script, encoding='utf-8'))['scenes']
    plan = chunk_plan(scenes)
    if a.only:
        lo, hi = [int(x) for x in a.only.split('-')]; plan = [c for c in plan if c[0] >= lo and c[-1] <= hi]
    print(len(plan), 'chunks')
    cached = cache_names() if (a.upload or a.wait_cache or not a.no_generate) else set()
    next_ok = 0.0
    summary = []
    for idx in plan:
        texts = [clean(scenes[i]['voiceover']) for i in idx]
        text = '\n\n'.join(texts); h = sha_name(text)
        wav = os.path.join(WORK, h + '.wav'); generated = False
        print('chunk', idx[0], '-', idx[-1], h[:10])
        if a.wait_cache:
            waited = 0
            while h not in cached and waited < 5400:
                time.sleep(30); waited += 30; cached = cache_names()
            if h not in cached: print('  never appeared in the cache, skipped'); continue
            if not os.path.exists(wav):
                time.sleep(5); download_chunk(h, wav); print('  audio from the server cache (generated by the render)')
        if not os.path.exists(wav):
            if h in cached:
                download_chunk(h, wav)
                print('  audio from the server cache')
            elif a.no_generate:
                print('  not in the cache and --no-generate: skipped'); continue
            else:
                wait = next_ok - time.time()
                if wait > 0: print('  pacing, waiting %.0f s' % wait); time.sleep(wait)
                secs, err = gemini_chunk(text, wav)
                if secs is None: print('  GEMINI FAILED:', err); break
                generated = True; next_ok = time.time() + max(21.0, 1.3 * secs)
                print('  generated %.1f s of audio' % secs)
        if len(idx) == 1:
            if a.upload and generated: upload_file(wav, '/video-jobs/_tts-cache/' + h + '.wav')
            continue
        dur = probe_duration(wav)
        cuts = split_points(texts, silences(wav, dur), dur)
        if cuts is None: print('  no consistent split'); summary.append((idx[0], idx[-1], 'NO SPLIT')); continue
        cuts, ok = repair(wav, texts, cuts, dur)
        hint = os.path.join(WORK, h + '.cuts.json'); json.dump({'cuts': [round(c, 3) for c in cuts], 'checked': ok}, open(hint, 'w'))
        print('  cuts', [round(c, 1) for c in cuts], 'checked' if ok else 'NOT fully checked')
        summary.append((idx[0], idx[-1], 'ok' if ok else 'unchecked'))
        if a.upload:
            if generated: upload_file(wav, '/video-jobs/_tts-cache/' + h + '.wav')
            if ok: upload_file(hint, '/video-jobs/_tts-cache/' + h + '.cuts.json'); print('  uploaded the cut hints')
    print('SUMMARY', summary)


if __name__ == '__main__':
    main()
