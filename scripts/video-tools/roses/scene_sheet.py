# Scene-ordered contact sheet of roses-long.json (number = scene index, small text = heading).
import os, json
from PIL import Image, ImageDraw, ImageFont
here = os.path.dirname(os.path.abspath(__file__))
sc = json.load(open(os.path.join(here, 'roses-long.json'), encoding='utf-8'))['scenes']
W, H, C, R = 320, 180, 5, 6
fb = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 20); fs = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
for part in range(0, len(sc), C * R):
    sheet = Image.new('RGB', (W * C, H * R))
    for i, s in enumerate(sc[part:part + C * R]):
        im = Image.open(os.path.join(here, 'thumbs', s['photoName'] + '.jpg')).convert('RGB')
        r = max(W / im.width, H / im.height); im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1))
        x0, y0 = (im.width - W) // 2, (im.height - H) // 2; im = im.crop((x0, y0, x0 + W, y0 + H))
        d = ImageDraw.Draw(im); d.rectangle((0, 0, W, 24), fill=(0, 0, 0))
        d.text((3, 1), str(part + i), fill=(255, 255, 0), font=fb); d.text((34, 4), s['onScreenText'][:34], fill=(255, 255, 255), font=fs)
        sheet.paste(im, ((i % C) * W, (i // C) * H))
    sheet.save(os.path.join(here, 'scenes_%02d.jpg' % (part // (C * R) + 1)), quality=82)
print('ok')
