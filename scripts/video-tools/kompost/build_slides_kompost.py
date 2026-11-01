# Builds slides_kompost.py from the olive deck's machinery (same design language), with the leaf-compost content,
# and runs it: fifteen 1920x1080 transparent PNGs in slides_out/kompost-NN.png.
import re, os, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', 'olive', 'slides_olive.py'), encoding='utf-8').read()
head = src[:src.index('def s1(d):')]
# headings printed in the lower third while each slide is up (scene headings of the scenes the slide covers)
heads = """HEADS = {
    1: ['Φυλλόχωμα ή κομπόστ', 'Και τα δύο μαζί'],
    2: ['Φυλλόχωμα: μάζεψε τα φύλλα', 'Φυλλόχωμα: τρίψε τα', 'Φυλλόχωμα: φτιάξε κλουβί', 'Φυλλόχωμα: κάλυψε και περίμενε'],
    3: ['Ποια φύλλα αποσυντίθενται εύκολα', 'Προσοχή: καρυδιά και πικροδάφνη'],
    4: ['Κομπόστ: τα καφέ υλικά', 'Κομπόστ: τα πράσινα υλικά'],
    5: ['Άνθρακας προς άζωτο', 'Ο κανόνας του όγκου'],
    6: ['Τι δεν μπαίνει: φαγητό και κοπριά', 'Τι δεν μπαίνει: ασθένειες και ζιζάνια', 'Τι δεν μπαίνει: ξύλο, χαρτί, ζιζανιοκτόνα', 'Εσπεριδοειδή, κρεμμύδια, σκόρδο'],
    7: ['Βήμα προς βήμα: θέση και πάτος', 'Βήμα προς βήμα: στρώσεις', 'Βήμα προς βήμα: κάλυψη και γύρισμα'],
    8: ['Ο έλεγχος της υγρασίας', 'Το τεστ της γροθιάς'],
    9: ['Πόσο γρήγορα γίνεται', 'Η θερμοκρασία του σωρού'],
    10: ['Πότε είναι έτοιμο', 'Το τεστ βλάστησης', 'Κοσκίνισμα'],
    11: ['Έτοιμο κομπόστ: παρτέρια και δέντρα', 'Έτοιμο κομπόστ: γλάστρες, κάλυψη, γκαζόν'],
    12: ['Προβλήματα: μυρωδιά και θερμότητα', 'Προβλήματα: μυγάκια και τρωκτικά', 'Προβλήματα: μυρμήγκια, μύκητες, λάσπη'],
    13: ['Το ημερολόγιο του σωρού', 'Το ημερολόγιο: άνοιξη και καλοκαίρι'],
    14: ['Τα συχνά λάθη'],
    15: ['Τι κρατάς από όλα'],
}
"""
head = re.sub(r"HEADS = \{.*?\n\}\n", lambda m: heads, head, flags=re.S)
assert "'Φυλλόχωμα ή κομπόστ'" in head and 'mazema-%02d.png' in head
head = head.replace("'mazema-%02d.png'", "'kompost-%02d.png'")
# table headers are upper-cased with Python's upper(), which keeps the tonos (ΦΥΛΛΌΧΩΜΑ); capitals carry none
assert 'h.upper()' in head
head = head.replace('h.upper()', 'caps(h)')
CAPS = ('import os, sys, unicodedata\n\n\ndef caps(s):\n'
        '    return "".join(c for c in unicodedata.normalize("NFD", s.upper()) if unicodedata.category(c) != "Mn")\n')
head = head.replace('import os, sys\n', CAPS, 1)
assert 'def caps' in head
body = open(os.path.join(here, 'slides_kompost_body.py'), encoding='utf-8').read()
out = os.path.join(here, 'slides_kompost.py')
open(out, 'w', encoding='utf-8').write(head + body)
print('slides_kompost.py written')
if '--run' in sys.argv:
    subprocess.run([sys.executable, out], check=True)
