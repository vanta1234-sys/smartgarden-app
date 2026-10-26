# Builds slides_olive.py from the garlic deck's machinery (same design language), with the olive-harvest content,
# and runs it: twelve 1920x1080 transparent PNGs in slides_out/mazema-NN.png.
import re, os, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', 'garlic', 'slides_garlic.py'), encoding='utf-8').read()
head = src[:src.index('def s1(d):')]
# headings printed in the lower third while each slide is up (scene headings of the scenes the slide covers)
heads = """HEADS = {
    1: ['Σύντομη απάντηση'], 2: ['Τα πέντε στάδια ωρίμανσης'], 3: ['Νωρίς, κανονικά ή αργά'],
    4: ['Το τεστ της κουζίνας'], 5: ['Πώς τον παρακολουθείς', 'Στα λίγα δέντρα του κήπου'],
    6: ['Πώς μαζεύεις: οι μέθοδοι'], 7: ['Μετά το μάζεμα: ο καρπός', 'Οξύτητα και αποθήκευση'],
    8: ['Μετά τη συγκομιδή: το δέντρο'], 9: ['Κακοκαιρία: χαλάζι', 'Κακοκαιρία: παγετός', 'Κακοκαιρία: βροχή και άνεμος'],
    10: ['Το ημερολόγιο του ελαιώνα'], 11: ['Τα συχνά λάθη'], 12: ['Τι κρατάς από όλα'],
}
"""
head = re.sub(r"HEADS = \{.*?\n\}\n", lambda m: heads, head, flags=re.S)
assert "'Σύντομη απάντηση'" in head and 'garlicc-' in head
head = head.replace("'garlicc-%02d.png'", "'mazema-%02d.png'")
body = open(os.path.join(here, 'slides_olive_body.py'), encoding='utf-8').read()
out = os.path.join(here, 'slides_olive.py')
open(out, 'w', encoding='utf-8').write(head + body)
print('slides_olive.py written')
if '--run' in sys.argv:
    subprocess.run([sys.executable, out], check=True)
