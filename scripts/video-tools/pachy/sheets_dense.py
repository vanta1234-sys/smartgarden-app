# Contact sheets of the candidate photos (16:9 centre crop, as the renderer shows them), labelled with the kNNN number.
import os, sys, subprocess
from PIL import Image, ImageDraw, ImageFont
here = os.path.dirname(os.path.abspath(__file__))
th = os.path.join(here, 'thumbs'); os.makedirs(th, exist_ok=True)
rows = []
for l in open(os.path.join(here, 'cand_raw.txt'), encoding='utf-8').read().splitlines():
    p = l.split(' ')
    if len(p) >= 2: rows.append((p[0], p[1], ' '.join(p[3:])))
W, H, C, R = 200, 113, 8, 7
try: font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 15)
except Exception: font = ImageFont.load_default()
lo, hi = int(sys.argv[1]) if len(sys.argv) > 1 else 1, int(sys.argv[2]) if len(sys.argv) > 2 else len(rows)
sel = [r for r in rows if lo <= int(r[0][1:]) <= hi]
for s in range(0, len(sel), C * R):
    chunk = sel[s:s + C * R]
    sheet = Image.new('RGB', (W * C, H * R), (30, 30, 30))
    for i, (k, pid, lab) in enumerate(chunk):
        f = os.path.join(th, k + '.jpg')
        if not os.path.exists(f) or os.path.getsize(f) < 3000:
            subprocess.run(['curl', '-s', '-m', '40', '-o', f, 'https://images.unsplash.com/photo-%s?w=480&q=70' % pid])
        try:
            im = Image.open(f).convert('RGB')
            r = max(W / im.width, H / im.height)
            im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1))
            x0, y0 = (im.width - W) // 2, (im.height - H) // 2
            im = im.crop((x0, y0, x0 + W, y0 + H))
        except Exception:
            im = Image.new('RGB', (W, H), (90, 0, 0))
        d = ImageDraw.Draw(im)
        d.rectangle((0, 0, 40, 18), fill=(0, 0, 0)); d.text((2, 1), k, fill=(255, 255, 0), font=font)
        sheet.paste(im, ((i % C) * W, (i // C) * H))
    out = os.path.join(here, 'dense_%03d_%03d.jpg' % (int(chunk[0][0][1:]), int(chunk[-1][0][1:])))
    sheet.save(out, quality=82); print(out)
