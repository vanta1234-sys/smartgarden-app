# usage: python long_sheets.py <tag>   -> one mid-scene frame per scene, 12 per sheet, labelled with the scene number
import sys, os, re, subprocess
from PIL import Image, ImageDraw, ImageFont
tag = sys.argv[1]
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
log = open(os.path.join(root, 'rc_%s.log' % tag), encoding='utf-8').read()
durs = [float(m.group(1)) for m in re.finditer(r'scene \d+: engine=\w+ audio=[\d.]+s dur=([\d.]+)s', log)]
mp4 = os.path.join(root, 'r_%s' % tag, '%s.mp4' % tag)
outdir = os.path.join(root, 'r_%s' % tag, 'frames'); os.makedirs(outdir, exist_ok=True)
t = 0.0; starts = []
for d in durs:
    starts.append(t); t += d
font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 30)
frames = []
for i, (s, d) in enumerate(zip(starts, durs)):
    f = os.path.join(outdir, 'f%02d.jpg' % i)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '%.2f' % (s + d * 0.55), '-i', mp4, '-frames:v', '1', '-vf', 'scale=480:270', f], check=True)
    frames.append(f)
per = 12
for k in range(0, len(frames), per):
    sheet = Image.new('RGB', (480 * 4, 270 * 3), (20, 20, 20))
    for j, f in enumerate(frames[k:k + per]):
        im = Image.open(f).convert('RGB'); dr = ImageDraw.Draw(im)
        dr.rectangle((0, 0, 64, 36), fill=(0, 0, 0)); dr.text((6, 2), str(k + j), fill=(255, 255, 0), font=font)
        sheet.paste(im, ((j % 4) * 480, (j // 4) * 270))
    sheet.save(os.path.join(root, 'r_%s' % tag, 'lsheet_%d.jpg' % (k // per)), quality=85)
print('scenes', len(frames), 'sheets', (len(frames) + per - 1) // per, 'total', round(t, 1))
