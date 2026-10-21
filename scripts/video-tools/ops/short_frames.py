# Frame sheets for the human look at a Short. usage: python -I short_frames.py <video.mp4> <durs.json> <outdir>
#   sheet_every3s.jpg     one frame every 3 seconds (labelled with the time)
#   sheet_scene_edges.jpg 0.6 s after the start and 0.6 s before the end of every scene (labelled scene/start|end): catches cut-off text, fades and wrong photos
import json, os, subprocess, sys
from PIL import Image, ImageDraw

video, durs_file, outdir = sys.argv[1:4]
durs = json.load(open(durs_file, encoding='utf-8'))
tmp = os.path.join(outdir, '_frames'); os.makedirs(tmp, exist_ok=True)

def grab(t, name, w=270, h=480):
    p = os.path.join(tmp, name)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '%.2f' % t, '-i', video, '-frames:v', '1', '-vf', 'scale=%d:%d' % (w, h), p], check=True)
    return Image.open(p).convert('RGB')

def sheet(items, cols, w, h, dest):
    rows = (len(items) + cols - 1) // cols
    s = Image.new('RGB', (cols * w, rows * (h + 16)), 'white'); d = ImageDraw.Draw(s)
    for i, (img, label) in enumerate(items):
        x, y = (i % cols) * w, (i // cols) * (h + 16)
        s.paste(img, (x, y)); d.rectangle([x, y + h, x + w, y + h + 16], fill='black'); d.text((x + 4, y + h + 3), label, fill='white')
    s.save(dest, quality=82)

total = sum(durs)
items = []
t = 0.0; k = 0
while t < total - 0.2:
    items.append((grab(t, 'a%03d.png' % k), 't=%.0fs' % t)); t += 3; k += 1
sheet(items, 8, 270, 480, os.path.join(outdir, 'sheet_every3s.jpg'))

edges = []; start = 0.0
for i, d in enumerate(durs):
    edges.append((grab(start + 0.6, 'e%02da.png' % i, 300, 533), 'scene %d start' % i))
    edges.append((grab(start + d - 0.6, 'e%02db.png' % i, 300, 533), 'scene %d end' % i))
    start += d
sheet(edges, 6, 300, 533, os.path.join(outdir, 'sheet_scene_edges.jpg'))
for f in os.listdir(tmp):
    os.remove(os.path.join(tmp, f))
os.rmdir(tmp)
print('sheets written to', outdir)
