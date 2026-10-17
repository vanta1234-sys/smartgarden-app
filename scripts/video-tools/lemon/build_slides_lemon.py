# Builds slides_lemon.py from the garlic deck's machinery (same design language), with the lemon/orange-in-winter content.
import re
src = open('../garlic_long/slides_garlic.py', encoding='utf-8').read()
head = src[:src.index('def s1(d):')]
# headings printed in the lower third while each slide is up (scene headings of the scenes the slide covers)
heads = """HEADS = {
    1: ['Σύντομη απάντηση'], 2: ['Πόσο κρύο αντέχουν'], 3: ['Θέση: έξω ή μέσα;'],
    4: ['Πότισμα τον χειμώνα'], 5: ['Λίπανση'], 6: ['Προστασία από παγετό'],
    7: ['Διαχείμαση μέσα στο σπίτι', 'Πότε μπαίνει και πότε βγαίνει'], 8: ['Τι σημαίνουν τα φύλλα'],
    9: ['Υπόστρωμα και γλάστρα'], 10: ['Ο χειμώνας, μήνα με μήνα'], 11: ['Συχνά λάθη'], 12: ['Τι κρατάς από όλα'],
}
"""
head = re.sub(r"HEADS = \{.*?\n\}\n", lambda m: heads, head, flags=re.S)
assert "'Σύντομη απάντηση'" in head and 'garlicc-' in head
head = head.replace("'garlicc-%02d.png'", "'lemona-%02d.png'")
body = open('slides_lemon_body.py', encoding='utf-8').read()
open('slides_lemon.py', 'w', encoding='utf-8').write(head + body)
print('slides_lemon.py written')
