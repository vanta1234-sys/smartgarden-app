# Each slide composited over the photo of the first scene it covers (as it will look in the video), on a 3 x 4 sheet.
import os, json, subprocess
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
cfg = json.load(open(os.path.join(here, 'olive.config.json'), encoding='utf-8'))
script = json.load(open(os.path.join(here, 'olive-long.json'), encoding='utf-8'))
os.makedirs(os.path.join(here, 'big'), exist_ok=True)
tiles = []
for n, (name, a, b) in enumerate(cfg['holds'], 1):
    sc = script['scenes'][a]
    f = os.path.join(here, 'big', sc['photoName'] + '.jpg')
    if not os.path.exists(f) or os.path.getsize(f) < 5000:
        subprocess.run(['curl', '-s', '-m', '60', '-o', f, sc['photo'].replace('w=2400&q=85', 'w=1400&q=80')], check=True)
    bg = Image.open(f).convert('RGB')
    r = max(1920 / bg.width, 1080 / bg.height)   # same crop as the renderer: cover 1920x1080
    bg = bg.resize((int(bg.width * r) + 1, int(bg.height * r) + 1))
    x0, y0 = (bg.width - 1920) // 2, (bg.height - 1080) // 2
    bg = bg.crop((x0, y0, x0 + 1920, y0 + 1080)).convert('RGBA')
    sl = Image.open(os.path.join(here, 'slides_out', name + '.png')).convert('RGBA')
    bg.alpha_composite(sl)
    tiles.append(bg.convert('RGB'))
    if os.environ.get('FULL'):
        bg.convert('RGB').save(os.path.join(here, 'big', 'full_%02d.jpg' % n), quality=88)
sheet = Image.new('RGB', (640 * 3, 360 * 4))
for i, t in enumerate(tiles):
    sheet.paste(t.resize((640, 360)), ((i % 3) * 640, (i // 3) * 360))
sheet.save(os.path.join(here, 'slides_preview.jpg'), quality=85)
print('ok', len(tiles))
