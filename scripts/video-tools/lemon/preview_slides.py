# Each slide composited over the photo of the first scene it covers (as it will look in the video), on a 3 x 4 sheet.
import os, subprocess
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
ids = dict(l.split() for l in open(os.path.join(here, 'cand_raw.txt'), encoding='utf-8') if l.strip())
pairs = [('a11', 1), ('g1', 2), ('q8', 3), ('h3', 4), ('n7', 5), ('d9', 6), ('i3', 7), ('a19', 8), ('l1', 9), ('q6', 10), ('i11', 11), ('a12', 12)]
os.makedirs(os.path.join(here, 'big'), exist_ok=True)
tiles = []
for name, n in pairs:
    f = os.path.join(here, 'big', name + '.jpg')
    if not os.path.exists(f) or os.path.getsize(f) < 5000:
        subprocess.run(['curl', '-s', '-m', '60', '-o', f, 'https://images.unsplash.com/photo-%s?w=1400&q=80&fit=max' % ids[name]], check=True)
    bg = Image.open(f).convert('RGB')
    # same crop as the renderer: cover 1920x1080
    r = max(1920 / bg.width, 1080 / bg.height)
    bg = bg.resize((int(bg.width * r) + 1, int(bg.height * r) + 1))
    x0, y0 = (bg.width - 1920) // 2, (bg.height - 1080) // 2
    bg = bg.crop((x0, y0, x0 + 1920, y0 + 1080)).convert('RGBA')
    sl = Image.open(os.path.join(here, 'slides_out', 'lemona-%02d.png' % n)).convert('RGBA')
    bg.alpha_composite(sl)
    tiles.append(bg.convert('RGB').resize((640, 360)))
sheet = Image.new('RGB', (640 * 3, 360 * 4))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % 3) * 640, (i // 3) * 360))
sheet.save(os.path.join(here, 'slides_preview.jpg'), quality=85)
print('ok')
