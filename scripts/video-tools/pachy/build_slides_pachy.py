# Builds slides_pachy.py from the olive deck's machinery (same design language), with the succulent content,
# and runs it: seventeen 1920x1080 transparent PNGs in slides_out/pachy-NN.png.
import re, os, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', 'olive', 'slides_olive.py'), encoding='utf-8').read()
head = src[:src.index('def s1(d):')]
HEADS = {
    1: ['Σύντομη απάντηση'],
    2: ['Πρώτο πρόβλημα: σήψη', 'Δεύτερο πρόβλημα: πάγωμα', 'Τρίτο πρόβλημα: λίγο φως'],
    3: ['Σέμπερβιβουμ και σέδουμ', 'Οπούντια', 'Αγαύη', 'Αιόνιουμ'],
    4: ['Αλόη βέρα', 'Εχεβέρια, κράσουλα, χαβόρθια', 'Κάλανχοε και ευφορβίες', 'Κάκτοι της ερήμου'],
    5: ['Καλοκαιρινά παχύφυτα', 'Χειμερινά παχύφυτα', 'Πώς τα ξεχωρίζεις'],
    6: ['Στέγαστρο', 'Ανέβασε τις γλάστρες', 'Πήλινες γλάστρες', 'Στα ψυχρά μέρη', 'Στον κήπο'],
    7: ['Η αλόη βέρα τον χειμώνα', 'Αλόη βέρα: παράλια και ενδοχώρα', 'Αλόη βέρα: τα φύλλα που πάγωσαν'],
    8: ['Πρώτο βήμα: έλεγχος', 'Καραντίνα και στέγνωμα', 'Μην αλλάξεις το φως απότομα'],
    9: ['Στο σπίτι: το φως', 'Το κρύο τζάμι', 'Λάμπα για φυτά', 'Θερμοκρασία', 'Ποτέ πάνω από καλοριφέρ'],
    10: ['Πότισμα: κάκτοι', 'Πότισμα: παχύφυτα', 'Πότισμα: αιόνιουμ και κάλανχοε'],
    11: ['Οι κανόνες του ποτίσματος', 'Βρέξε το χώμα, όχι το φυτό'],
    12: ['Το χώμα και η γλάστρα', 'Μια συνταγή που δουλεύει', 'Η δοκιμή του νερού', 'Η γλάστρα'],
    13: ['Τι σημαίνουν τα σημάδια', 'Σημάδια: το φυτό τεντώνεται', 'Σημάδια: παγετός', 'Σημάδια: κόκκινα και μωβ φύλλα', 'Σημάδια: έντομα'],
    14: ['Πώς σώζεις ένα φυτό που σαπίζει', 'Κόψε ό,τι σαπίζει', 'Στέγνωμα και ξερό υπόστρωμα', 'Ρίζωμα'],
    15: ['Μήνα μήνα: φθινόπωρο', 'Μήνα μήνα: χειμώνας και άνοιξη'],
    16: ['Τα συχνά λάθη'],
    17: ['Τι κρατάς από όλα'],
}
heads = 'HEADS = ' + repr(HEADS) + '\n'
head = re.sub(r"HEADS = \{.*?\n\}\n", lambda m: heads, head, flags=re.S)
assert "'Σύντομη απάντηση'" in head and 'mazema-%02d.png' in head
head = head.replace("'mazema-%02d.png'", "'pachy-%02d.png'")
# table headers: capitals carry no tonos
assert 'h.upper()' in head
head = head.replace('h.upper()', 'caps(h)')
CAPS = ('import os, sys, unicodedata\n\n\ndef caps(s):\n'
        '    return "".join(c for c in unicodedata.normalize("NFD", s.upper()) if unicodedata.category(c) != "Mn")\n')
head = head.replace('import os, sys\n', CAPS, 1)
assert 'def caps' in head
body = open(os.path.join(here, 'slides_pachy_body.py'), encoding='utf-8').read()
out = os.path.join(here, 'slides_pachy.py')
open(out, 'w', encoding='utf-8').write(head + body)
print('slides_pachy.py written')
if '--run' in sys.argv:
    subprocess.run([sys.executable, out], check=True)
