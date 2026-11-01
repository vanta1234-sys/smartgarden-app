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
    p = os.path.join(OUT, 'kompost-%02d.png' % n)
    img.save(p, 'PNG', optimize=True)
    SLIDES.append(p)


def s1(d):
    title(d, 'ΦΥΛΛΟΧΩΜΑ Ή ΚΟΜΠΟΣΤ', 'Δύο δρόμοι για τα φύλλα του κήπου')
    table(d, ['', 'Φυλλόχωμα', 'Κομπόστ'], [
        ['Υλικά', 'Μόνο φύλλα', 'Ξερά και φρέσκα υλικά'],
        ['Πώς δουλεύει', 'Αργά, με μύκητες', 'Γρήγορα, με βακτήρια και θερμότητα'],
        ['Χρόνος', '1–2 χρόνια για λεπτό χώμα', '2–6 μήνες αν το γυρίζεις'],
        ['Προσπάθεια', 'Σχεδόν καμία', 'Υγρασία και ανάδευση'],
        ['Καλύτερη χρήση', 'Κάλυψη, δομή, γλάστρες', 'Λίπανση παρτεριών και λαχανόκηπου'],
    ], [400, 640, 660], size=40, top=430)


def s2(d):
    title(d, 'ΦΥΛΛΟΧΩΜΑ ΣΕ ΕΞΙ ΒΗΜΑΤΑ')
    bullets(d, [
        ('1 —', 'μάζεψε φύλλα υγρά· αν είναι ξερά, βρέξε τα'),
        ('2 —', 'τρίψε τα, για παράδειγμα με το χλοοκοπτικό'),
        ('3 —', 'κλουβί από πασσάλους και σύρμα κοτέτσι'),
        ('4 —', 'πάτησε τα και βρέξε τα σε όλο το βάθος'),
        ('5 —', 'κάλυψε με μουσαμά ή ύφασμα'),
        ('6 —', 'περίμενε: 6–12 μήνες ή 1–2 χρόνια'),
    ])


def s3(d):
    title(d, 'ΠΟΙΑ ΦΥΛΛΑ ΑΠΟΣΥΝΤΙΘΕΝΤΑΙ', 'Δεν είναι όλα τα φύλλα ίδια')
    table(d, ['Φύλλα', 'Τι ισχύει'], [
        ['Πλάτανος, μουριά, κερασιά, οπωροφόρα', 'Πηγαίνουν γρήγορα'],
        ['Δάφνη, μανόλια, λιγούστρο, ελιά', 'Πολύ αργά: λίγα και τριμμένα'],
        ['Καρυδιά', 'Ιουγκλόνη: χρήση του κομπόστ μετά από ένα χρόνο'],
        ['Πικροδάφνη', 'Τοξική: όχι σε κομπόστ για φαγώσιμα φυτά'],
    ], [760, 940], size=40, top=430)


def s4(d):
    title(d, 'ΚΑΦΕ ΚΑΙ ΠΡΑΣΙΝΑ ΥΛΙΚΑ')
    table(d, ['Καφέ: ο άνθρακας', 'Πράσινα: το άζωτο'], [
        ['Ξερά φύλλα', 'Κομμένο φρέσκο γκαζόν'],
        ['Ξερά κλαδάκια 2–5 εκ.', 'Υπολείμματα λαχανικών και φρούτων'],
        ['Άχυρο', 'Υπολείμματα από τον λαχανόκηπο'],
        ['Κομμένο χαρτόνι, χαρτί χωρίς γυαλάδα', 'Κατακάθι καφέ, φίλτρα, τσάι'],
        ['Πριονίδι ακατέργαστου ξύλου, λίγο', 'Κοπριά: κότα, πρόβατο, κουνέλι, άλογο'],
        ['Τσόφλια ξηρών καρπών', 'Τσόφλια αυγών, θρυμματισμένα'],
    ], [820, 880], size=40, top=420)


def s5(d):
    title(d, 'ΑΝΘΡΑΚΑΣ ΠΡΟΣ ΑΖΩΤΟ', 'Πόσος άνθρακας για κάθε μέρος αζώτου')
    table(d, ['Υλικό', 'Είδος', 'Αναλογία'], [
        ['Ξερά φύλλα', 'Καφέ', '40–80 προς 1'],
        ['Άχυρο', 'Καφέ', 'περίπου 80 προς 1'],
        ['Χαρτόνι', 'Καφέ', '200 και πάνω προς 1'],
        ['Κομμένο γκαζόν', 'Πράσινο', '15–25 προς 1'],
        ['Υπολείμματα κουζίνας', 'Πράσινο', '15–20 προς 1'],
        ['Κοπριά κότας', 'Πράσινο', '5–10 προς 1'],
    ], [640, 420, 640], size=40, top=400)
    d.text((100, 905), 'Στόχος 25–30 προς 1 · στην πράξη: 2–3 κουβάδες ξερά για 1 κουβά φρέσκα',
           font=font(34, 'Regular'), fill=DIM)


def s6(d):
    title(d, 'ΤΙ ΔΕΝ ΜΠΑΙΝΕΙ ΣΤΟΝ ΣΩΡΟ')
    bullets(d, [
        'Κρέας, ψάρι, λίπη, λάδια, γαλακτοκομικά, μαγειρεμένα',
        'Κοπριά σκύλου και γάτας',
        'Άρρωστα φυτά, εκτός αν ο σωρός ζεσταίνεται πάνω από 55 °C',
        'Ζιζάνια με σπόρους ή ρίζες που ξαναβλασταίνουν',
        'Επεξεργασμένο ή βαμμένο ξύλο, γυαλιστερό χαρτί',
        'Φυτά που ψεκάστηκαν με ζιζανιοκτόνο τις τελευταίες εβδομάδες',
        'Πολλά εσπεριδοειδή, κρεμμύδια, σκόρδο',
    ], size=42)


def s7(d):
    title(d, 'Ο ΣΩΡΟΣ ΒΗΜΑ ΠΡΟΣ ΒΗΜΑ', 'Ελάχιστος όγκος: ένα κυβικό μέτρο')
    bullets(d, [
        ('1 —', 'θέση σε μερική σκιά, σε γυμνό χώμα, κοντά σε νερό'),
        ('2 —', 'πάτος από χοντρά κλαδάκια, 10–15 εκ.'),
        ('3 —', 'στρώσεις 10–15 εκ.: καφέ και πράσινα, με νερό'),
        ('4 —', 'φτυαριά έτοιμο κομπόστ σε κάθε δεύτερο στρώμα'),
        ('5 —', 'κάλυψη με μουσαμά ή άχυρο'),
        ('6 —', 'γύρισμα κάθε 2–4 εβδομάδες'),
    ], size=44)


def s8(d):
    title(d, 'ΤΟ ΤΕΣΤ ΤΗΣ ΓΡΟΘΙΑΣ', 'Σφίξε μια χούφτα υλικό από τον σωρό')
    table(d, ['Τι συμβαίνει', 'Τι σημαίνει'], [
        ['Στάζει νερό', 'Πολύ υγρό'],
        ['Θρυμματίζεται και δεν κρατά σχήμα', 'Πολύ στεγνό'],
        ['Κρατά ελαφρά σχήμα, σαν στυμμένο σφουγγάρι', 'Σωστό'],
    ], [1100, 600], size=44, top=450)


def s9(d):
    title(d, 'ΠΟΣΟ ΓΡΗΓΟΡΑ ΓΙΝΕΤΑΙ')
    table(d, ['Τρόπος', 'Στο κέντρο', 'Χρόνος'], [
        ['Θερμός: κομμένα υλικά, γύρισμα', '55–65 °C', '2–4 μήνες'],
        ['Μέτριος: χωρίς γύρισμα', '30–45 °C', '6–12 μήνες'],
        ['Κρύος: μεγάλα κομμάτια', 'όσο ο αέρας', '12 μήνες και πάνω'],
    ], [820, 420, 460], size=42, top=430)
    d.text((100, 800), 'Πάνω από 55 °C για μερικές μέρες: χάνονται σπόροι ζιζανίων και ασθένειες',
           font=font(34, 'Regular'), fill=DIM)


def s10(d):
    title(d, 'ΠΟΤΕ ΕΙΝΑΙ ΕΤΟΙΜΟ')
    bullets(d, [
        'Σκούρο καφέ, σχεδόν μαύρο, θρυμματίζεται στο χέρι',
        'Μυρίζει δάσος ή υγρό χώμα, όχι αμμωνία',
        'Δεν ξεχωρίζουν τα αρχικά υλικά',
        'Δεν ζεσταίνεται πια, ούτε αν το ανακατέψεις',
        'Τεστ: κάρδαμο ή ραπανάκι σε βάζο, βλαστάνουν σε 3–5 ημέρες',
        'Το θες νωρίτερα; Κοσκίνισμα με σίτα 1 εκ.',
    ], size=44)


def s11(d):
    title(d, 'ΤΙ ΚΑΝΕΙΣ ΜΕ ΤΟ ΕΤΟΙΜΟ ΚΟΜΠΟΣΤ')
    table(d, ['Χρήση', 'Πόσο', 'Πότε'], [
        ['Παρτέρια, λαχανόκηπος', 'Στρώμα 3–5 εκ.', 'Φθινόπωρο ή άνοιξη'],
        ['Δέντρα και θάμνοι', 'Έως 20–25% στο χώμα του λάκκου', 'Στη φύτευση'],
        ['Μείγμα για γλάστρες', 'Έως 20–30%, με φυτόχωμα', 'Όλο τον χρόνο'],
        ['Κάλυψη κάτω από φυτά', 'Στρώμα 2–3 εκ., όχι στον κορμό', 'Άνοιξη, μετά το πότισμα'],
        ['Ανασπορά γκαζόν', 'Κοσκινισμένο, 0,5–1 εκ.', 'Φθινόπωρο'],
    ], [520, 720, 460], size=40, top=420)


def s12(d):
    title(d, 'ΠΡΟΒΛΗΜΑΤΑ ΚΑΙ ΛΥΣΕΙΣ')
    table(d, ['Τι βλέπεις', 'Τι κάνεις'], [
        ['Μυρίζει αμμωνία ή σάπιο', 'Ξερά υλικά και ανάδευση'],
        ['Δεν ζεσταίνεται', 'Νερό, φρέσκα υλικά, μεγαλύτερος σωρός'],
        ['Μυγάκια', 'Θάψε τα υπολείμματα, σκέπασε με ξερά'],
        ['Τρωκτικά', 'Όχι φαγητό · κλειστός κάδος, σύρμα στον πάτο'],
        ['Μυρμήγκια', 'Ο σωρός είναι στεγνός: βρέξε καλά'],
        ['Λευκή σκόνη, νήματα', 'Μύκητες: καλό σημάδι αν υπάρχει υγρασία'],
        ['Γλοιώδες υλικό', 'Ξερά υλικά και ανάδευση'],
    ], [560, 1140], size=38, top=350)


def s13(d):
    title(d, 'ΤΟ ΗΜΕΡΟΛΟΓΙΟ ΤΟΥ ΣΩΡΟΥ')
    table(d, ['Περίοδος', 'Τι κάνεις'], [
        ['Οκτώβριος – Νοέμβριος', 'Μαζεύεις φύλλα · κλουβί φυλλοχώματος · νέος σωρός'],
        ['Δεκέμβριος – Φεβρουάριος', 'Σκέπασμα · υπολείμματα κουζίνας, θαμμένα'],
        ['Μάρτιος – Απρίλιος', 'Γύρισμα · έτοιμο κομπόστ στα παρτέρια'],
        ['Μάιος – Σεπτέμβριος', 'Πότισμα όταν στεγνώνει · γκαζόν σε λεπτά στρώματα'],
    ], [600, 1100], size=40, top=430)


def s14(d):
    title(d, 'ΤΑ ΣΥΧΝΑ ΛΑΘΗ')
    bullets(d, [
        'Μόνο φύλλα στον κάδο, χωρίς φρέσκο υλικό',
        'Μόνο κομμένο γκαζόν: κολλά και βρομάει',
        'Ξερός σωρός το καλοκαίρι',
        'Πολύ νερό τον χειμώνα, χωρίς κάλυψη',
        'Μαγειρεμένα φαγητά και κρέας στον ανοιχτό σωρό',
        'Φρέσκο κομπόστ γύρω από νεαρά φυτά',
        'Ολόκληρα μεγάλα κλαδιά',
        'Σωρός εκεί που λιμνάζει νερό',
    ], size=44)


def s15(d):
    title(d, 'ΤΙ ΚΡΑΤΑΣ ΑΠΟ ΟΛΑ')
    bullets(d, [
        ('1 —', 'ισορροπία ξερών και φρέσκων υλικών'),
        ('2 —', 'υγρασία σαν στυμμένο σφουγγάρι'),
        ('3 —', 'λίγος αέρας'),
    ])


for i, fn in enumerate([s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15], 1):
    slide(i, fn)

print('wrote %d slides to %s' % (len(SLIDES), OUT))
