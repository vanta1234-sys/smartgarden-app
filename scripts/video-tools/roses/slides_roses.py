# 12 transparent slides, 1920x1080, for the long garlic video. Same design language as the
# water and olive decks (left-hand wash, green edge rule, lime accent). Written to the scratchpad
# first, composited over the brightest photos of the video and looked at before they go anywhere.
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os, sys, unicodedata


def caps(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.upper()) if unicodedata.category(c) != "Mn")

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
        d.text((x + 12, y), caps(h), font=fh, fill=LIME)
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
    p = os.path.join(OUT, 'roses-%02d.png' % n)
    img.save(p, 'PNG', optimize=True)
    SLIDES.append(p)


def s1(d):
    title(d, 'ΓΥΜΝΟΡΙΖΑ Ή ΓΛΑΣΤΡΑ', 'Τι αγοράζεις και πότε το φυτεύεις')
    table(d, ['', 'Γυμνόριζα', 'Σε γλάστρα'], [
        ['Πώς είναι', 'Ξερά κλαδιά, χωρίς φύλλα', 'Με φύλλα και μπουμπούκια'],
        ['Πότε φυτεύεται', 'Μέσα Νοεμβρίου – Φεβρουάριος', 'Σχεδόν όλο τον χρόνο'],
        ['Πλεονέκτημα', 'Φθηνότερα, μεγάλη ποικιλία', 'Τα βλέπεις ανθισμένα'],
        ['Μειονέκτημα', 'Πρέπει να φυτευτούν γρήγορα', 'Ακριβότερα, ρίζες που στριφογυρίζουν'],
    ], [400, 640, 660], size=40, top=430)


def s2(d):
    title(d, 'ΠΩΣ ΚΑΤΑΛΑΒΑΙΝΕΙΣ ΟΤΙ ΤΟ ΦΥΤΟ ΕΙΝΑΙ ΚΑΛΟ')
    bullets(d, [
        'Τρεις ή περισσότεροι δυνατοί κλάδοι, πράσινοι και ζωντανοί',
        'Ξύσε τον φλοιό: αν βγει πράσινο από κάτω, το φυτό ζει',
        'Ρίζες σκούρες και ινώδεις, όχι ξερές ή μαλακές',
        'Σημείο εμβολίου: διόγκωση στη βάση',
        'Ετικέτα με το όνομα της ποικιλίας',
    ], size=44)


def s3(d):
    title(d, 'ΦΥΤΕΥΣΗ ΓΥΜΝΟΡΙΖΟΥ: ΒΗΜΑΤΑ 1–4')
    bullets(d, [
        ('1 —', 'μούλιασε τις ρίζες: λίγες ώρες ως ένα βράδυ'),
        ('2 —', 'τρύπα 40–50 εκ., χώμα με ώριμο κομπόστ'),
        ('3 —', 'κόψε ό,τι έσπασε: ρίζες στα 25 εκ., κλάδοι στα 15–20 εκ.'),
        ('4 —', 'εμβόλιο στο ύψος του εδάφους ή 2–3 εκ. πάνω'),
    ], size=44)


def s4(d):
    title(d, 'ΦΥΤΕΥΣΗ ΓΥΜΝΟΡΙΖΟΥ: ΒΗΜΑΤΑ 5–7')
    bullets(d, [
        ('5 —', 'γέμισε με χώμα και πάτησε ελαφρά'),
        ('6 —', 'πότισε με 8–10 λίτρα νερό'),
        ('7 —', 'στρώμα 5 εκ. κομπόστ ή φλοιός πεύκου'),
    ], size=46)
    d.text((100, 870), 'Παγίδα: χώμα που είχε τριαντάφυλλο τα τελευταία 3–5 χρόνια',
           font=font(36, 'Regular'), fill=DIM)
    d.text((100, 920), 'Άλλαξε το χώμα σε τρύπα 50 × 50 × 50 εκ. ή διάλεξε άλλο σημείο',
           font=font(36, 'Regular'), fill=DIM)


def s5(d):
    title(d, 'ΤΟ ΜΕΓΕΘΟΣ ΤΗΣ ΓΛΑΣΤΡΑΣ', 'Οι ρίζες του τριαντάφυλλου κατεβαίνουν βαθιά')
    table(d, ['Τύπος', 'Ελάχιστη γλάστρα'], [
        ['Μινιατούρες, μικρά πολυάνθη', '25 εκ. βάθος · 10–15 λίτρα'],
        ['Πολυάνθη, θαμνώδη συμπαγή', '40 εκ. βάθος · 30–40 λίτρα'],
        ['Hybrid tea (ένα άνθος ανά κλαδί)', '40–50 εκ. βάθος · 40 λίτρα'],
        ['Αναρριχώμενα', '50 εκ. βάθος · 50+ λίτρα και στήριγμα'],
    ], [880, 820], size=40, top=430)


def s6(d):
    title(d, 'ΠΟΤΙΣΜΑ ΦΘΙΝΟΠΩΡΟ ΚΑΙ ΧΕΙΜΩΝΑ')
    table(d, ['Πότε', 'Τι κάνεις'], [
        ['Σεπτέμβριος – Νοέμβριος', 'Όταν στεγνώσουν 3–4 εκ. · γλάστρα κάθε 4–6 ημέρες'],
        ['Δεκέμβριος – Φεβρουάριος', 'Βροχή: τίποτα · ξηρασία 2–3 εβδομάδες: πότισμα'],
        ['Στον κήπο', 'Όχι, εκτός από πολύ ξηρές περιόδους'],
        ['Πιατάκι', 'Χωρίς νερό: οι ρίζες σαπίζουν'],
    ], [640, 1060], size=40, top=430)
    d.text((100, 800), 'Πάντα πρωί, στο έδαφος, όχι στα φύλλα',
           font=font(34, 'Regular'), fill=DIM)


def s7(d):
    title(d, 'ΜΑΥΡΗ ΚΗΛΙΔΩΣΗ: ΠΩΣ ΤΗ ΣΤΑΜΑΤΑΣ')
    bullets(d, [
        ('1 —', 'μάζεψε κάθε άρρωστο φύλλο· στα σκουπίδια'),
        ('2 —', 'πότιζε μόνο το χώμα και μόνο το πρωί'),
        ('3 —', 'άφησε χώρο γύρω από το φυτό'),
        ('4 —', 'όχι άζωτο το φθινόπωρο'),
        ('5 —', 'χαλκούχο στο τέλος του χειμώνα, πριν σκάσουν οι οφθαλμοί'),
        ('6 —', 'ανθεκτικές ποικιλίες την επόμενη χρονιά'),
    ], size=42)


def s8(d):
    title(d, 'ΠΩΣ ΤΟ ΞΕΧΩΡΙΖΕΙΣ')
    table(d, ['Τι βλέπεις', 'Τι είναι', 'Τι κάνεις'], [
        ['Μαύρες κηλίδες, κίτρινο φωτοστέφανο', 'Μαύρη κηλίδωση', 'Καθάρισμα, χαλκός στο τέλος'],
        ['Πορτοκαλί σκόνη κάτω από το φύλλο', 'Σκωρίαση', 'Ίδια μέτρα, αφαίρεση φύλλων'],
        ['Λευκή επικάλυψη σε βλαστούς', 'Ωίδιο', 'Αερισμός, λιγότερο άζωτο'],
        ['Έντομα στις άκρες των βλαστών', 'Μελίγκρες', 'Πλύσιμο, σαπούνι καλίου'],
        ['Κίτρινα φύλλα, πράσινα νεύρα', 'Έλλειψη σιδήρου', 'Έλεγχος αποστράγγισης'],
    ], [740, 440, 520], size=36, top=400)


def s9(d):
    title(d, 'ΚΛΑΔΕΜΑ: ΤΩΡΑ ΚΑΙ ΑΡΓΟΤΕΡΑ')
    table(d, ['Πότε', 'Τι κάνεις'], [
        ['Τώρα, το φθινόπωρο', 'Μαραμένα άνθη, νεκρά ή άρρωστα κλαδιά'],
        ['Τώρα, το φθινόπωρο', 'Κλαδιά πάνω από 1 μ.: κατά το ένα τρίτο'],
        ['Τέλη Ιανουαρίου – Φεβρουάριος', 'Κύριο κλάδεμα, όταν πρήζονται οι οφθαλμοί'],
        ['Όχι τώρα', 'Δυνατό κλάδεμα: ο παγετός καίει τους βλαστούς'],
    ], [760, 940], size=40, top=430)


def s10(d):
    title(d, 'ΤΟ ΚΥΡΙΟ ΚΛΑΔΕΜΑ, ΤΕΛΟΣ ΧΕΙΜΩΝΑ')
    bullets(d, [
        ('1 —', 'πρώτα τα τρία Δ: ξερό, σπασμένο, άρρωστο'),
        ('2 —', 'αφαίρεσε τους κλάδους που διασταυρώνονται'),
        ('3 —', 'Hybrid tea: 3–5 κλάδοι, στα 20–30 εκ. από το χώμα'),
        ('4 —', 'θαμνώδη και πολυάνθη: κόντυνε κατά το ένα τρίτο'),
        ('5 —', 'κόψιμο 5 χιλ. πάνω από οφθαλμό προς τα έξω, κλίση 45°'),
        ('6 —', 'αναρριχώμενα: πλάγια βλαστάρια στους 2–3 οφθαλμούς'),
    ], size=40)


def s11(d):
    title(d, 'ΛΙΠΑΝΣΗ: ΤΙ ΔΙΝΕΙΣ ΚΑΙ ΠΟΤΕ')
    table(d, ['Πότε', 'Τι δίνεις'], [
        ['Αύγουστος – Σεπτέμβριος', 'Το τελευταίο λίπασμα με άζωτο'],
        ['Οκτώβριος – Νοέμβριος', 'Λίπασμα πλούσιο σε κάλιο, μικρή δόση'],
        ['Νοέμβριος', 'Ώριμο κομπόστ ή κοπριά, στρώμα 5 εκ.'],
        ['Φεβρουάριος – Μάρτιος', 'Ισορροπημένο λίπασμα, μετά κάθε 4–6 εβδομάδες'],
    ], [640, 1060], size=40, top=430)


def s12(d):
    title(d, 'Ο ΧΕΙΜΩΝΑΣ ΣΤΗ ΓΛΑΣΤΡΑ ΚΑΙ ΣΤΟΝ ΚΗΠΟ')
    table(d, ['Πού', 'Τι κάνεις'], [
        ['Πεδιάδες, παράλια', 'Συνήθως τίποτα · γλάστρα στον τοίχο'],
        ['Ψυχρές περιοχές', 'Πλαστικό ή λινάτσα στη γλάστρα · φλοιός πάνω'],
        ['Στον κήπο', 'Λοφάκι χώμα ή κομπόστ 15–20 εκ. στη βάση'],
        ['Παγωμένο χώμα', 'Μην ποτίσεις: περίμενε να ξεπαγώσει'],
    ], [520, 1180], size=40, top=420)


def s13(d):
    title(d, 'ΤΙ ΚΑΝΕΙΣ ΜΗΝΑ ΜΗΝΑ')
    table(d, ['Μήνας', 'Εργασία'], [
        ['Οκτώβριος', 'Μαραμένα άνθη · άρρωστα φύλλα · μαύρη κηλίδωση'],
        ['Νοέμβριος', 'Κάλιο · κομπόστ · αρχή φύτευσης γυμνόριζων'],
        ['Δεκέμβριος', 'Φύτευση · κάλυψη γλάστρας · όχι κλάδεμα'],
        ['Ιανουάριος', 'Φύτευση γυμνόριζων · έλεγχος σπασμένων κλάδων'],
        ['Φεβρουάριος', 'Κύριο κλάδεμα · αγριόβλαστα · χαλκός'],
        ['Μάρτιος', 'Πρώτη λίπανση · σάπια φύλλα · ξεκινά το πότισμα'],
    ], [480, 1220], size=40, top=370)


def s14(d):
    title(d, 'ΤΑ ΣΥΧΝΑ ΛΑΘΗ')
    bullets(d, [
        'Δυνατό κλάδεμα τον Οκτώβριο ή τον Νοέμβριο',
        'Σημείο εμβολίου θαμμένο πολύ βαθιά',
        'Πότισμα στα φύλλα το βράδυ',
        'Άζωτο το φθινόπωρο',
        'Ρηχή γλάστρα',
        'Πότισμα κάθε μέρα τον χειμώνα',
        'Άρρωστα φύλλα στον κομποστοποιητή',
        'Στριμωγμένα φυτά, χωρίς κυκλοφορία αέρα',
    ], size=44)


def s15(d):
    title(d, 'ΤΙ ΚΡΑΤΑΣ ΑΠΟ ΟΛΑ', 'Λιγότερο νερό, καθόλου άζωτο, καθόλου δυνατό κλάδεμα')
    bullets(d, [
        ('1 —', 'καθάρισμα των άρρωστων φύλλων από φυτό και χώμα'),
        ('2 —', 'σωστό σημείο εμβολίου όταν φυτεύεις'),
        ('3 —', 'μεγάλη, βαθιά γλάστρα'),
    ])


for i, fn in enumerate([s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15], 1):
    slide(i, fn)

print('wrote %d slides to %s' % (len(SLIDES), OUT))
