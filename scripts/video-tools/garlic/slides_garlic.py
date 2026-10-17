# 12 transparent slides, 1920x1080, for the long garlic video. Same design language as the
# water and olive decks (left-hand wash, green edge rule, lime accent). Written to the scratchpad
# first, composited over the brightest photos of the video and looked at before they go anywhere.
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os, sys

W, H = 1920, 1080
FONT = r'C:\Users\me\Desktop\smartgarden.gr_fixed\public\fonts\NotoSans-Variable.ttf'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'slides_out')
os.makedirs(OUT, exist_ok=True)

WHITE = (255, 255, 255, 255)
DIM = (233, 243, 235, 255)
LIME = (164, 214, 86, 255)
GREEN = (47, 143, 62)


def font(size, weight='Bold'):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass
    return f


BODY_TOP, BODY_BOT = 380, 980


def title(d, text, sub=None):
    size = 84
    maxW = W - 92 - 120
    tf = font(size, 'Bold')
    while size > 52 and tf.getlength(text) > maxW:
        size -= 4
        tf = font(size, 'Bold')
    d.text((92, 96 + (84 - size)), text, font=tf, fill=WHITE)
    y = 96 + (84 - size) + size + 26
    if sub:
        d.text((94, y), sub, font=font(38, 'Regular'), fill=DIM)
        y += 62
    d.rectangle([92, y + 10, 92 + 210, y + 18], fill=LIME)
    return y + 70


def bullets(d, items, size=46):
    """items: str or (label, text). Shrinks until the widest line fits and the block fits the band."""
    MAXW = W - 136 - 150
    gap = int(size * 2.0)
    while True:
        f, fb = font(size, 'Regular'), font(size, 'SemiBold')
        widest = max(d.textlength(it[0], font=fb) + 14 + d.textlength(it[1], font=f)
                     if isinstance(it, tuple) else d.textlength(it, font=f) for it in items)
        if widest <= MAXW and len(items) * gap <= (BODY_BOT - BODY_TOP):
            break
        size -= 2
        gap = int(size * 2.0)
        if size < 26:
            raise SystemExit('bullets do not fit: %r' % (items,))
    f, fb = font(size, 'Regular'), font(size, 'SemiBold')
    y = BODY_TOP + ((BODY_BOT - BODY_TOP) - len(items) * gap) // 2
    for it in items:
        d.ellipse([96, y + size * 0.42, 96 + 14, y + size * 0.42 + 14], fill=LIME)
        if isinstance(it, tuple):
            d.text((136, y), it[0], font=fb, fill=WHITE)
            d.text((136 + d.textlength(it[0], font=fb) + 14, y), it[1], font=f, fill=DIM)
        else:
            d.text((136, y), it, font=f, fill=DIM)
        y += gap


def figures(d, items, note=None):
    x = 100
    fv = font(112, 'Bold')
    fc = font(34, 'SemiBold')
    y = BODY_TOP + 40
    for val, cap in items:
        d.text((x, y), val, font=fv, fill=LIME)
        w = max(d.textlength(val, font=fv), d.textlength(cap, font=fc))
        d.text((x + 6, y + 150), cap, font=fc, fill=DIM)
        x += w
        if x > W - 110:
            raise SystemExit('figures run off the frame: %r' % (items,))
        x += 100
    if note:
        nf = font(34, 'Regular')
        if d.textlength(note, font=nf) > W - 100 - 110:
            raise SystemExit('figure note too wide: %s' % note)
        d.text((100, y + 290), note, font=nf, fill=DIM)


def table(d, header, rows, colw, size=40, top=None):
    """header: list of str; rows: list of list of str; colw: pixel widths of the columns."""
    total = sum(colw)
    if 96 + total > W - 110:
        raise SystemExit('table too wide: %d' % total)
    while True:
        fb, f = font(size, 'SemiBold'), font(size, 'Regular')
        rowh = int(size * 1.75)
        need = rowh * (len(rows) + 1)
        bad = [(j, c) for r in rows for j, c in enumerate(r)
               if d.textlength(c, font=(fb if j == 0 else f)) > colw[j] - 24]
        if need <= BODY_BOT - BODY_TOP + 40 and not bad:
            break
        size -= 2
        if size < 26:
            raise SystemExit('table does not fit: %r' % (bad[:3],))
    fh = font(max(size - 6, 24), 'SemiBold')
    y = (BODY_TOP + ((BODY_BOT - BODY_TOP) - need) // 2) if top is None else top
    x = 96
    for j, h in enumerate(header):
        d.text((x + 12, y), h.upper(), font=fh, fill=LIME)
        x += colw[j]
    y += rowh
    d.rectangle([96, y - 10, 96 + total, y - 6], fill=LIME)
    for i, r in enumerate(rows):
        if i % 2 == 0:
            d.rectangle([96, y - 6, 96 + total, y + rowh - 10], fill=(255, 255, 255, 22))
        x = 96
        for j, c in enumerate(r):
            d.text((x + 12, y), c, font=(fb if j == 0 else f), fill=(WHITE if j == 0 else DIM))
            x += colw[j]
        y += rowh
    return size


SLIDES = []


# The headings the base video prints in its lower third while each slide is up. They sat ghosted
# under the slide (and over its last row) until a near-opaque plate was put behind them.
HEADS = {
    1: ['Σύντομη απάντηση'], 2: ['Το πρόγραμμα, μήνα με μήνα'],
    3: ['Δύο τύποι σκόρδου'], 4: ['Ποιο σκόρδο να φυτέψεις'], 5: ['Φύτευση βήμα-βήμα'],
    6: ['Σκόρδο σε γλάστρα ή ζαρντινιέρα'], 7: ['Λίπανση', 'Πότισμα'], 8: ['Ασθένειες και προβλήματα'],
    9: ['Πότε είναι έτοιμο και πώς το αποθηκεύεις'], 10: ['Καλοί και κακοί γείτονες'],
    11: ['Συχνά λάθη'], 12: ['Τι κρατάς από όλα'],
}


def plate(img, n):
    hf = font(54, 'Regular')
    need = 96 + 1.3 * max(hf.getlength(h) for h in HEADS[n]) + 140  # the base video's font is wider than this one
    top, feather_y, feather_x = 868, 40, 160
    right = int(need)
    a = np.zeros((H, W), dtype=np.float32)
    for y in range(top - feather_y, H):
        ay = 1.0 if y >= top else (y - (top - feather_y)) / feather_y
        a[y, :right] = ay
        for x in range(right, min(W, right + feather_x)):
            a[y, x] = ay * (1 - (x - right) / feather_x)
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = 4, 14, 9
    rgba[..., 3] = (a * 253).astype(np.uint8)
    img.alpha_composite(Image.fromarray(rgba, 'RGBA'))


def slide(n, build):
    # The wash is sized to the content: a table that runs to x=1700 needs the dark panel behind
    # all of it, or its right-hand columns disappear into a bright photo (first attempt).
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    build(ImageDraw.Draw(layer))
    bb = layer.getbbox()
    right = min(W - 60, bb[2] + 90)
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fade = 220
    for x in range(0, right + fade):
        a = 214 if x <= right else int(214 * (1 - (x - right) / fade))
        d.line([(x, 0), (x, H)], fill=(6, 20, 12, max(a, 0)))
    d.rectangle([0, 0, 14, H], fill=GREEN + (255,))
    plate(img, n)
    d.rectangle([0, 0, 14, H], fill=GREEN + (255,))
    img.alpha_composite(layer)
    d = ImageDraw.Draw(img)
    d.text((W - 92 - 40, H - 74), '%02d' % n, font=font(30, 'SemiBold'), fill=(235, 245, 238, 200))
    d.text((92, H - 74), 'SMARTGARDEN.GR', font=font(26, 'SemiBold'), fill=(200, 224, 204, 190))
    p = os.path.join(OUT, 'garlicc-%02d.png' % n)
    img.save(p, 'PNG', optimize=True)
    SLIDES.append(p)


def s1(d):
    title(d, 'ΣΕ ΜΙΑ ΝΤΟΠΙΑ', 'Φύτευση σκόρδου στην Ελλάδα')
    figures(d, [('Οκτ–Δεκ', 'ΦΥΤΕΥΣΗ'), ('4–5 cm', 'ΒΑΘΟΣ'), ('10–12 cm', 'ΑΠΟΣΤΑΣΗ')],
            'Ανάμεσα στις γραμμές 20–25 cm · Γλάστρα: βάθος τουλάχιστον 25 cm')


def s2(d):
    title(d, 'ΤΟ ΠΡΟΓΡΑΜΜΑ, ΜΗΝΑ ΜΗΝΑ')
    table(d, ['Περίοδος', 'Τι γίνεται'], [
        ['Σεπτέμβριος', 'Αγορά σκόρδου σποράς · ετοιμασία εδάφους'],
        ['Οκτώβριος – Νοέμβριος', 'Φύτευση · κάλυψη με άχυρο'],
        ['Δεκέμβριος', 'Τελευταία φύτευση στις ήπιες περιοχές'],
        ['Ιανουάριος – Φεβρουάριος', 'Βγάζεις ζιζάνια · κανένα λίπασμα'],
        ['Μάρτιος', 'Μία ελαφριά λίπανση με άζωτο'],
        ['Απρίλιος – Μάιος', 'Πότισμα · σκωρίαση · τέλος αζώτου'],
        ['Ιούνιος', 'Στοπ στο πότισμα · κόψιμο ανθικών στελεχών'],
        ['Ιούνιος – Ιούλιος', 'Συγκομιδή · στέγνωμα 2–3 εβδομάδες'],
    ], [640, 1000], top=330)


def s3(d):
    title(d, 'ΔΥΟ ΤΥΠΟΙ ΣΚΟΡΔΟΥ', 'Ποιος ταιριάζει στη δική σου περιοχή')
    table(d, ['Τύπος', 'Σκελίδες', 'Αποθήκευση'], [
        ['Μαλακός λαιμός', 'Πολλές, σε στρώσεις · πλέκεται', '8–10 μήνες'],
        ['Σκληρός λαιμός', 'Λιγότερες, μεγαλύτερες · θέλει κρύο', '4–6 μήνες'],
    ], [440, 840, 380], size=42, top=430)
    d.text((100, 800), 'Νησιά και ήπιοι χειμώνες: συνήθως ο μαλακός λαιμός.',
           font=font(34, 'Regular'), fill=DIM)


def s4(d):
    title(d, 'ΠΟΙΟ ΣΚΟΡΔΟ ΝΑ ΦΥΤΕΨΕΙΣ')
    bullets(d, [
        ('Ναι —', 'σκόρδο σποράς από φυτώριο ή κατάστημα'),
        ('Ναι —', 'τοπικός παραγωγός ή λαϊκή αγορά'),
        ('Ναι —', 'δικό σου, από υγιείς κεφαλές'),
        ('Όχι —', 'σούπερ μάρκετ με άγνωστη προέλευση'),
    ])


def s5(d):
    title(d, 'ΦΥΤΕΥΣΗ ΒΗΜΑ-ΒΗΜΑ')
    bullets(d, [
        ('Θέση —', 'ήλιος τουλάχιστον 6 ώρες'),
        ('Έδαφος —', 'ελαφρύ, στραγγιστό, pH 6–7'),
        ('Σκελίδα —', 'μεγάλη και σκληρή, με τη φλούδα'),
        ('Βάθος —', '4–5 cm, μύτη προς τα πάνω'),
        ('Απόσταση —', '10–12 cm · γραμμές 20–25 cm'),
        ('Πότισμα —', 'μία φορά καλά, μετά μόνο σε ξηρό καιρό'),
        ('Κάλυψη —', '3–5 cm άχυρο ή ξερά φύλλα'),
    ])


def s6(d):
    title(d, 'ΣΚΟΡΔΟ ΣΕ ΓΛΑΣΤΡΑ', 'Βάθος τουλάχιστον 25 cm και αποστράγγιση')
    table(d, ['Δοχείο', 'Σκελίδες', 'Σχόλιο'], [
        ['Γλάστρα 25–30 cm', '4–6', 'Μικρή ποσότητα'],
        ['Ζαρντινιέρα 60 cm', '10–12', 'Δύο σειρές, ζικ-ζακ'],
        ['Ζαρντινιέρα 80 cm', '14–16', 'Η πιο πρακτική επιλογή'],
    ], [620, 300, 720], size=44, top=430)


def s7(d):
    title(d, 'ΛΙΠΑΝΣΗ ΚΑΙ ΠΟΤΙΣΜΑ')
    bullets(d, [
        ('Φύτευση —', 'κομπόστ ή οργανικό λίπασμα'),
        ('Αρχές Μαρτίου —', 'ελαφριά δόση αζώτου'),
        ('Απρίλιος —', 'ίσως δεύτερη ελαφριά δόση'),
        ('Από μέσα Μαΐου —', 'κανένα άζωτο'),
        ('Μάρτιος – Μάιος —', 'σταθερή, όχι υπερβολική υγρασία'),
        ('Πριν τη συγκομιδή —', 'στοπ το πότισμα 2–3 εβδομάδες'),
    ])


def s8(d):
    title(d, 'ΑΣΘΕΝΕΙΕΣ ΚΑΙ ΠΡΟΒΛΗΜΑΤΑ')
    table(d, ['Πρόβλημα', 'Τι βλέπεις', 'Τι κάνεις'], [
        ['Σκωρίαση', 'Πορτοκαλί κηλίδες στα φύλλα', 'Αφαίρεση φύλλων, αερισμός'],
        ['Λευκή σήψη', 'Κιτρίνισμα, λευκή γούνα στη βάση', 'Ίδιο σημείο μετά από 3–4 χρόνια'],
        ['Σήψη σκελίδων', 'Σκελίδες μαλακές, χωρίς βλαστό', 'Καλύτερη αποστράγγιση'],
        ['Θρίπες', 'Ασημί γραμμές στα φύλλα', 'Μπλε παγίδες, σαπούνι καλίου'],
        ['Κρεμμυδόμυγα', 'Κίτρινα φύλλα, μαλακή βάση', 'Δίχτυ εντόμων, αμειψισπορά'],
    ], [390, 600, 680], size=38, top=340)


def s9(d):
    title(d, 'ΠΟΤΕ ΕΙΝΑΙ ΕΤΟΙΜΟ', 'Και πώς το αποθηκεύεις')
    figures(d, [('½', 'ΤΑ ΦΥΛΛΑ ΚΙΤΡΙΝΑ'), ('2–3', 'ΕΒΔΟΜΑΔΕΣ ΣΤΕΓΝΩΜΑ'), ('10–15 °C', 'ΑΠΟΘΗΚΕΥΣΗ')],
            'Σε σκιά, με αέρα · όχι στον ήλιο, όχι στο ψυγείο, όχι σε πλαστική σακούλα')


def s10(d):
    title(d, 'ΚΑΛΟΙ ΚΑΙ ΚΑΚΟΙ ΓΕΙΤΟΝΕΣ')
    bullets(d, [
        ('Κοντά του —', 'φράουλες, τριανταφυλλιές, τομάτες'),
        ('Κοντά του —', 'καρότα, παντζάρια, μαρούλια'),
        ('Κοντά του —', 'σπανάκι και ρόκα τον χειμώνα'),
        ('Μακριά —', 'όσπρια: κουκιά, μπιζέλια, φασόλια'),
    ])


def s11(d):
    title(d, 'ΤΑ ΣΥΧΝΑ ΛΑΘΗ', 'Αν αποφύγεις αυτά, έχεις κερδίσει τη σοδειά')
    bullets(d, [
        'Σκόρδο από σούπερ μάρκετ, άγνωστης προέλευσης',
        'Βαθιά φύτευση σε βαρύ, υγρό χώμα',
        'Φύτευση ανάποδα, με τη μύτη προς τα κάτω',
        'Υπερβολικό πότισμα τον χειμώνα',
        'Άζωτο μετά τον Μάιο',
        'Συγκομιδή πολύ αργά · στέγνωμα στον ήλιο',
        'Το ίδιο σημείο κάθε χρόνο',
    ], size=42)


def s12(d):
    title(d, 'ΤΙ ΚΡΑΤΑΣ ΑΠΟ ΟΛΑ')
    bullets(d, [
        ('1 —', 'σωστή εποχή: Οκτώβριος – Δεκέμβριος'),
        ('2 —', 'καλές σκελίδες γνωστής προέλευσης'),
        ('3 —', 'ρηχή φύτευση, μύτη προς τα πάνω'),
        ('4 —', 'στέγνωμα πριν την αποθήκευση'),
    ])


for i, fn in enumerate([s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12], 1):
    slide(i, fn)

print('wrote %d slides to %s' % (len(SLIDES), OUT))
