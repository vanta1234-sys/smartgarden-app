# Builds slides_lav.py from the garlic deck machinery with the lavender content (headings = the scene headings the base video prints).
import re
src = open('../garlic_long/slides_garlic.py', encoding='utf-8').read()
head = src[:src.index('def s1(d):')]
heads = """HEADS = {
    1: ['Σύντομη απάντηση'], 2: ['Τι ακριβώς βλέπεις'], 3: ['Γιατί συμβαίνει στη γλάστρα'],
    4: ['Διάγνωση σε 10 λεπτά'], 5: ['Η διάσωση βήμα-βήμα'], 6: ['Το σωστό υπόστρωμα'],
    7: ['Πότισμα και λίπανση'], 8: ['Κλάδεμα'], 9: ['Ποιο είδος έχεις'],
    10: ['Η χρονιά της λεβάντας'], 11: ['Τα συχνά λάθη'], 12: ['Τι κρατάς από όλα'],
}
"""
head = re.sub(r"HEADS = \{.*?\n\}\n", lambda m: heads, head, flags=re.S)
assert "'Σύντομη απάντηση'" in head and 'garlicc-' in head
head = head.replace("'garlicc-%02d.png'", "'levanta-%02d.png'")
body = open('slides_lav_body.py', encoding='utf-8').read()
open('slides_lav.py', 'w', encoding='utf-8').write(head + body)
print('slides_lav.py written')
