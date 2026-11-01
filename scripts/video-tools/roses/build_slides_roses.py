# Builds slides_roses.py from the olive deck's machinery (same design language), with the rose content,
# and runs it: fifteen 1920x1080 transparent PNGs in slides_out/roses-NN.png.
import re, os, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', 'olive', 'slides_olive.py'), encoding='utf-8').read()
head = src[:src.index('def s1(d):')]
# headings printed in the lower third while each slide is up (scene headings of the scenes the slide covers)
heads = """HEADS = {
    1: ['Γυμνόριζα ή γλάστρα'],
    2: ['Πώς καταλαβαίνεις ότι το φυτό είναι καλό'],
    3: ['Φύτευση: μούλιασε τις ρίζες', 'Φύτευση: η τρύπα', 'Φύτευση: κόψε ό,τι έσπασε', 'Φύτευση: στη θέση του'],
    4: ['Φύτευση: χώμα και πότισμα', 'Φύτευση: κάλυψη και μια παγίδα'],
    5: ['Τριαντάφυλλο σε γλάστρα', 'Το μέγεθος της γλάστρας'],
    6: ['Πότισμα το φθινόπωρο', 'Πότισμα τον χειμώνα'],
    7: ['Μαύρη κηλίδωση: πώς τη σταματάς', 'Ανθεκτικές ποικιλίες'],
    8: ['Πώς το ξεχωρίζεις'],
    9: ['Το κλάδεμα: τι τώρα και τι αργότερα', 'Κλάδεμα: τι κάνεις τώρα'],
    10: ['Το κύριο κλάδεμα'],
    11: ['Λίπανση: τι δίνεις και πότε', 'Λίπανση: κομπόστ γύρω από το φυτό', 'Λίπανση την άνοιξη'],
    12: ['Πεδιάδες και παράλια', 'Ψυχρές περιοχές', 'Όταν παγώνει'],
    13: ['Τι κάνεις μήνα μήνα', 'Το ημερολόγιο: χειμώνας και άνοιξη'],
    14: ['Τα συχνά λάθη'],
    15: ['Τι κρατάς από όλα'],
}
"""
head = re.sub(r"HEADS = \{.*?\n\}\n", lambda m: heads, head, flags=re.S)
assert "'Γυμνόριζα ή γλάστρα'" in head and 'mazema-%02d.png' in head
head = head.replace("'mazema-%02d.png'", "'roses-%02d.png'")
# table headers are upper-cased with Python's upper(), which keeps the tonos (ΦΥΛΛΌΧΩΜΑ); capitals carry none
assert 'h.upper()' in head
head = head.replace('h.upper()', 'caps(h)')
CAPS = ('import os, sys, unicodedata\n\n\ndef caps(s):\n'
        '    return "".join(c for c in unicodedata.normalize("NFD", s.upper()) if unicodedata.category(c) != "Mn")\n')
head = head.replace('import os, sys\n', CAPS, 1)
assert 'def caps' in head
body = open(os.path.join(here, 'slides_roses_body.py'), encoding='utf-8').read()
out = os.path.join(here, 'slides_roses.py')
open(out, 'w', encoding='utf-8').write(head + body)
print('slides_roses.py written')
if '--run' in sys.argv:
    subprocess.run([sys.executable, out], check=True)
