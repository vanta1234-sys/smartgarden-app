# Transcribes every scene of a render with local Whisper (medium, CPU) as an ear independent of the Gemini transcribers.
# usage: C:/Users/me/smartgarden-tools/whisper/venv/Scripts/python.exe whisper_scenes.py <video.mp4> <durs.json> <out.json>
# durs.json = array of scene durations in seconds (from the render log). ffmpeg must be on PATH.
# The environment lives OUTSIDE any temporary folder on purpose: C:/Users/me/smartgarden-tools/whisper/{venv,models}
# (the old copy in a session scratchpad was emptied by something and stopped importing on 2026-10-21).
import json, os, subprocess, sys, tempfile, wave
import numpy as np
from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding='utf-8')  # the Windows console is cp1252
video, durs_file, out_file = sys.argv[1:4]
durs = json.load(open(durs_file, encoding='utf-8'))
root = r'C:\Users\me\smartgarden-tools\whisper\models'
model = WhisperModel('medium', device='cpu', compute_type='int8', download_root=root)
tmp = os.path.join(tempfile.gettempdir(), 'sg_whisper_scene.wav')
res = []
t = 0.0
for i, d in enumerate(durs):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '%.2f' % t, '-t', '%.2f' % d, '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', tmp], check=True)
    with wave.open(tmp, 'rb') as w:
        audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    segs, _ = model.transcribe(audio, language='el', beam_size=5, vad_filter=True, condition_on_previous_text=False)
    text = ' '.join(s.text.strip() for s in segs).strip()
    res.append({'scene': i, 'text': text})
    print('scene', i, text, flush=True)
    t += d
json.dump(res, open(out_file, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
