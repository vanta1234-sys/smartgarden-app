# 1280x720 thumbnail for the olive-harvest long video: olive photo on the right, dark scrim left, big words.
from PIL import Image, ImageDraw, ImageFont
import sys, os
W, H = 1280, 720
FONT = r'C:\Users\me\Desktop\smartgarden.gr_fixed\public\fonts\NotoSans-Variable.ttf'
here = os.path.dirname(os.path.abspath(__file__))
def font(size, weight='Bold'):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_name(weight)
    except Exception: pass
    return f
def make(src, out, shift=0.65):
    im = Image.open(os.path.join(here, 'thumbsrc', src)).convert('RGB')
    r = max(W / im.width, H / im.height); im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1))
    l = int((im.width - W) * shift); t = (im.height - H) // 2
    im = im.crop((l, t, l + W, t + H)).convert('RGBA')
    scrim = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(scrim)
    for x in range(W):
        a = int(235 * max(0.0, 1 - x / (W * 0.80)) ** 0.85)
        d.line([(x, 0), (x, H)], fill=(6, 22, 12, a))
    im.alpha_composite(scrim)
    d = ImageDraw.Draw(im)
    white = (255, 255, 255, 255); lime = (255, 224, 70, 255)
    y = 60
    for word, size, col in (('ΜΑΖΕΜΑ', 176, white), ('ΤΗΣ ΕΛΙΑΣ', 118, white), ('ΣΩΣΤΑ', 118, lime)):
        f = font(size)
        w = d.textlength(word, font=f)
        assert 70 + w < W * 0.86, (word, w)
        for dx in (-3, 0, 3):
            for dy in (-3, 0, 3):
                if dx or dy: d.text((70 + dx, y + dy), word, font=f, fill=(0, 0, 0, 255))
        d.text((70, y), word, font=f, fill=col)
        y += int(size * 1.04)
    f2 = font(52, 'SemiBold'); txt = 'Χρώμα · Δάκος · Ελαιοτριβείο'
    assert 70 + d.textlength(txt, font=f2) < W * 0.92
    for dx in (-2, 0, 2):
        for dy in (-2, 0, 2):
            if dx or dy: d.text((72 + dx, H - 96 + dy), txt, font=f2, fill=(0, 0, 0, 255))
    d.text((72, H - 96), txt, font=f2, fill=white)
    im.convert('RGB').save(os.path.join(here, out), quality=92)
make('o012.jpg', 'thumb_olive_a.jpg'); make('o002.jpg', 'thumb_olive_b.jpg', 0.5); make('o006.jpg', 'thumb_olive_c.jpg', 0.5); make('o010.jpg', 'thumb_olive_d.jpg', 0.6)
print('ok')
