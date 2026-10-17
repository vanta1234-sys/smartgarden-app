# Labelled contact sheets of the candidate thumbnails: python sheets.py  -> sheet_N.jpg (30 per sheet, 6 x 5)
import os, glob
from PIL import Image, ImageDraw, ImageFont
here = os.path.dirname(os.path.abspath(__file__))
names = [l.split()[0] for l in open(os.path.join(here, 'cand_raw.txt'), encoding='utf-8') if l.strip()]
names = [n for n in names if os.path.getsize(os.path.join(here, 'th', n + '.jpg')) > 2000]
font = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 26)
CW, CH, COLS, ROWS = 320, 214, 6, 5
per = COLS * ROWS
for s in range(0, len(names), per):
    sheet = Image.new('RGB', (COLS * CW, ROWS * CH), (20, 20, 20))
    for k, n in enumerate(names[s:s + per]):
        im = Image.open(os.path.join(here, 'th', n + '.jpg')).convert('RGB')
        im.thumbnail((CW - 4, CH - 4))
        x, y = (k % COLS) * CW, (k // COLS) * CH
        sheet.paste(im, (x + 2, y + 2))
        d = ImageDraw.Draw(sheet)
        d.rectangle([x + 2, y + 2, x + 2 + 12 + 17 * len(n), y + 34], fill=(0, 0, 0))
        d.text((x + 8, y + 4), n, font=font, fill=(255, 235, 59))
    sheet.save(os.path.join(here, 'sheet_%d.jpg' % (s // per + 1)), quality=82)
print(len(names), 'images,', (len(names) + per - 1) // per, 'sheets')
