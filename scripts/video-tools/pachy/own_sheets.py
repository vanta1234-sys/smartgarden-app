# Contact sheets of the owner's succulent/cactus photos (04-pachyfyta-kaktoi), 16:9 centre crop, numbered p01.. with size + quality.
import os, csv, sys
from PIL import Image, ImageDraw, ImageFont
src = r'C:\Users\me\Desktop\smartgarden-photos'
rows = [r for r in csv.DictReader(open(os.path.join(src, 'index.csv'), encoding='utf-8-sig')) if r['folder'].startswith('04-')]
rows.sort(key=lambda r: r['file'])
here = os.path.dirname(os.path.abspath(__file__))
open(os.path.join(here, 'own_list.txt'), 'w', encoding='utf-8').write('\n'.join('p%02d %s %s %s %s' % (i + 1, r['file'], r['size'], r['orientation'], r['quality']) for i, r in enumerate(rows)))
W, H, C, R = 320, 180, 5, 6
fb = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 18)
for part in range(0, len(rows), C * R):
    sheet = Image.new('RGB', (W * C, H * R), (30, 30, 30))
    for i, r in enumerate(rows[part:part + C * R]):
        im = Image.open(os.path.join(src, r['folder'], r['file'])).convert('RGB')
        im.thumbnail((640, 640))
        k = max(W / im.width, H / im.height); im = im.resize((int(im.width * k) + 1, int(im.height * k) + 1))
        x0, y0 = (im.width - W) // 2, (im.height - H) // 2; im = im.crop((x0, y0, x0 + W, y0 + H))
        d = ImageDraw.Draw(im); d.rectangle((0, 0, 150, 22), fill=(0, 0, 0)); d.text((3, 1), 'p%02d %s %s' % (part + i + 1, r['size'].split('x')[0], r['quality'][:4]), fill=(255, 255, 0), font=fb)
        sheet.paste(im, ((i % C) * W, (i // C) * H))
    sheet.save(os.path.join(here, 'own_sheet_%d.jpg' % (part // (C * R) + 1)), quality=84)
print(len(rows), 'photos')
