# Own photos used by the video: EXIF-free 2400 px copies for the server (own_out/pachy-pNN.jpg) + 480 px thumbs for the contact sheets.
import os, json
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
src = r'C:\Users\me\Desktop\smartgarden-photos\04-pachyfyta-kaktoi'
lst = {l.split(' ')[0]: l.split(' ')[1] for l in open(os.path.join(here, 'own_list.txt'), encoding='utf-8').read().splitlines()}
sc = json.load(open(os.path.join(here, 'pachy-long.json'), encoding='utf-8'))['scenes']
os.makedirs(os.path.join(here, 'own_out'), exist_ok=True); os.makedirs(os.path.join(here, 'thumbs'), exist_ok=True)
for s in sc:
    n = s['photoName']
    if not (n.startswith('p') and n[1:].isdigit()): continue
    im = Image.open(os.path.join(src, lst[n])).convert('RGB')
    big = im.copy(); big.thumbnail((2400, 2400))
    big.save(os.path.join(here, 'own_out', 'pachy-%s.jpg' % n), quality=90)
    th = im.copy(); th.thumbnail((480, 480)); th.save(os.path.join(here, 'thumbs', n + '.jpg'), quality=80)
    print(n, im.size, '->', big.size)
