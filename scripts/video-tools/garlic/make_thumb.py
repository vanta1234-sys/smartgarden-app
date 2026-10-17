# 1280x720 thumbnail: verified garlic photo on the right, dark scrim on the left, three words and a number.
from PIL import Image, ImageDraw, ImageFont
import sys
W, H = 1280, 720
FONT = r'C:\Users\me\Desktop\smartgarden.gr_fixed\public\fonts\NotoSans-Variable.ttf'
def font(size, weight='Bold'):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_name(weight)
    except Exception: pass
    return f
def make(src, out):
    im = Image.open(src).convert('RGB')
    r = max(W / im.width, H / im.height); im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1))
    l = int((im.width - W) * 0.65); t = (im.height - H) // 2
    im = im.crop((l, t, l + W, t + H)).convert('RGBA')
    scrim = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(scrim)
    for x in range(W):
        a = int(235 * max(0.0, 1 - x / (W * 0.78)) ** 0.85)
        d.line([(x, 0), (x, H)], fill=(6, 22, 12, a))
    im.alpha_composite(scrim)
    d = ImageDraw.Draw(im)
    white = (255, 255, 255, 255); lime = (176, 224, 92, 255)
    y = 70
    for word, size in (('ΦΥΤΕΨΕ', 168), ('ΣΚΟΡΔΟ', 168), ('ΤΩΡΑ', 168)):
        f = font(size)
        w = d.textlength(word, font=f)
        assert 70 + w < W * 0.78, (word, w)
        for dx in (-3, 0, 3):
            for dy in (-3, 0, 3):
                if dx or dy: d.text((70 + dx, y + dy), word, font=f, fill=(0, 0, 0, 255))
        d.text((70, y), word, font=f, fill=white if word != 'ΤΩΡΑ' else lime)
        y += int(size * 1.02)
    f2 = font(54, 'SemiBold'); txt = 'Οκτώβριος – Δεκέμβριος'
    assert 70 + d.textlength(txt, font=f2) < W * 0.9
    d.text((72, H - 96), txt, font=f2, fill=lime)
    im.convert('RGB').save(out, quality=92)
make('thumb_src_G3.jpg', 'thumb_garlic_a.jpg'); make('thumb_src_G8.jpg', 'thumb_garlic_b.jpg')
print('ok')
