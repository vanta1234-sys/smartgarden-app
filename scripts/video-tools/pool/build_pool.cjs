// Builds the PHP for four new topicPool entries from the .md articles and inserts them at the END of $topicPool in
// public/cron-publish.php (CRLF file). Usage (cwd = repo root): node build_pool.cjs [--write]
const fs = require('fs'), path = require('path');
const here = __dirname;
const T = [
  {
    md: 'fraoules.md',
    slug: 'fraoules-se-glastra-fyteysi-fthinoporo-zardinieira',
    title: 'Φράουλες σε Γλάστρα: Φύτευση το Φθινόπωρο για Καρπό από τον Απρίλιο',
    category: 'Λαχανόκηπος σε Γλάστρα', category_slug: 'vegetables', readTime: '13 min', difficulty: 'Μέτριο',
    image: 'photo-1621702992993-2c89c2953fa4',
    summary: 'Πότε και πώς φυτεύονται οι φράουλες σε γλάστρα και ζαρντινιέρα στην Ελλάδα: ποικιλίες, υπόστρωμα, πότισμα, λίπανση, προστασία των ανθέων από παγετό, επικονίαση με πινέλο και συγκομιδή από τον Απρίλιο ως τον Ιούνιο.',
    botanical: 'Fragaria × ananassa', ph: '5.5 - 6.5', ec: '1.0 - 1.4', temp: '5 - 28',
    keyTakeaways: [
      'Φύτεψε από τα μέσα Οκτωβρίου ως τον Νοέμβριο: οι ποικιλίες βραχείας ημέρας φτιάχνουν τους οφθαλμούς τους το φθινόπωρο και δίνουν καρπό από τον Απρίλιο.',
      'Η κορώνα του φυτού μένει ακριβώς στο ύψος του χώματος. Αν τη θάψεις, σαπίζει.',
      'Υπόστρωμα ελαφρύ, με περλίτη και κομπόστ, pH 5,5-6,5, και ποτέ χώμα από ντομάτες, πιπεριές ή πατάτες.',
      'Λίγο άζωτο, περισσότερο κάλιο από τα πρώτα άνθη. Το πολύ άζωτο δίνει φύλλα αντί για καρπούς.',
      'Τα ανοιχτά άνθη πονούν γύρω στους -1 °C: σκέπασέ τα τις νύχτες με παγετό και βοήθησε την επικονίαση με πινέλο.',
    ],
    prompt_focus: 'Γράψε οδηγό για φράουλες σε γλάστρα και ζαρντινιέρα στην Ελλάδα: φύτευση το φθινόπωρο, ποικιλίες βραχείας και ουδέτερης ημέρας, υπόστρωμα, πότισμα, λίπανση, παγετός στα άνθη, επικονίαση, στολόνια, ασθένειες και συγκομιδή.',
  },
  {
    md: 'aromatika.md',
    slug: 'aromatika-fyta-ximonas-balkoni-dendrolivano-thymari-rigani',
    title: 'Αρωματικά Φυτά τον Χειμώνα στο Μπαλκόνι: Δενδρολίβανο, Θυμάρι, Ρίγανη, Δυόσμος και τι Σπέρνεις Τώρα',
    category: 'Μπαλκόνι & Γλάστρες', category_slug: 'balcony', readTime: '13 min', difficulty: 'Εύκολο',
    image: 'photo-1751158300809-987009170634',
    summary: 'Πώς περνούν τον χειμώνα τα αρωματικά στη γλάστρα: τι αντέχει το κρύο και τι όχι, γιατί το πρόβλημα είναι το βρεγμένο χώμα, πότισμα, κλάδεμα, σκαθάρι του δενδρολίβανου και ποια δροσερά αρωματικά σπέρνεις τον Οκτώβριο.',
    botanical: 'Salvia rosmarinus, Thymus vulgaris, Origanum vulgare, Mentha spp.', ph: '6.5 - 7.5', ec: '0.5 - 1.0', temp: '0 - 30',
    keyTakeaways: [
      'Το δενδρολίβανο, το θυμάρι, η ρίγανη και το φασκόμηλο αντέχουν το κρύο. Τα σκοτώνει το βρεγμένο χώμα, όχι ο χειμώνας.',
      'Πότισε μόνο όταν το χώμα είναι στεγνό σε βάθος 4-5 εκατοστών, με ελαφρύ αμμώδες υπόστρωμα και μεγάλες τρύπες στη γλάστρα.',
      'Καθόλου λίπασμα ως το τέλος του χειμώνα και όχι σκληρό κλάδεμα μέσα στο γυμνό ξύλο.',
      'Ο δυόσμος και το σχοινόπρασο ξεραίνονται τον χειμώνα και ξαναβγαίνουν την άνοιξη. Ο βασιλικός δεν αντέχει κάτω από περίπου 10 °C.',
      'Τον Οκτώβριο σπέρνεις μαϊντανό, κόλιανδρο και άνηθο. Μάζεψε με το χέρι τα μεταλλικά σκαθάρια του δενδρολίβανου.',
    ],
    prompt_focus: 'Γράψε οδηγό για τα αρωματικά φυτά στο μπαλκόνι τον χειμώνα στην Ελλάδα: ποια αντέχουν, πότισμα, αποστράγγιση, προστασία από παγετό, σκαθάρι του δενδρολίβανου, μοσχεύματα και σπορά δροσερών αρωματικών.',
  },
  {
    md: 'ortansia.md',
    slug: 'ortansia-se-glastra-fthinoporo-ximonas-kladema-frontida',
    title: 'Ορτανσία σε Γλάστρα το Φθινόπωρο και τον Χειμώνα: Πότε Κλαδεύεις, τι Κάνεις με τα Μαραμένα Άνθη και Πώς Ανθίζει Ξανά',
    category: 'Μπαλκόνι & Γλάστρες', category_slug: 'balcony', readTime: '14 min', difficulty: 'Μέτριο',
    image: 'photo-1775678180194-7ef54e248e5b',
    summary: 'Τι κάνεις με την ορτανσία σε γλάστρα από το φθινόπωρο ως την άνοιξη: γιατί δεν κλαδεύεις νωρίς, γιατί αφήνεις τα μαραμένα άνθη, πώς μειώνεις το πότισμα, τι θέση και προστασία χρειάζεται και πώς αλλάζει το χρώμα των ανθέων.',
    botanical: 'Hydrangea macrophylla', ph: '5.0 - 6.5', ec: '0.8 - 1.4', temp: '0 - 25',
    keyTakeaways: [
      'Η κοινή ορτανσία ανθίζει σε παλιό ξύλο: ένα φθινοπωρινό κλάδεμα κόβει τους ανθοφόρους οφθαλμούς. Κλάδεψε στο τέλος του χειμώνα.',
      'Άφησε τα μαραμένα άνθη ως τον Φεβρουάριο ή τον Μάρτιο: προστατεύουν τους οφθαλμούς από το κρύο.',
      'Μείωσε σταδιακά το πότισμα όσο πέφτουν τα φύλλα και σταμάτα το λίπασμα από τα τέλη του καλοκαιριού.',
      'Χρειάζεται χειμερινό κρύο για να ανθίσει: όχι σε ζεστό δωμάτιο. Μόνωσε τη γλάστρα στον παγετό.',
      'Το χρώμα (μπλε, ροζ) εξαρτάται από το pH και το αλουμίνιο. Τα λευκά δεν αλλάζουν. Διόρθωσέ το την άνοιξη, όχι τον χειμώνα.',
    ],
    prompt_focus: 'Γράψε οδηγό για την ορτανσία σε γλάστρα το φθινόπωρο και τον χειμώνα στην Ελλάδα: είδη και εποχή κλαδέματος, μαραμένα άνθη, πότισμα, λίπανση, θέση και παγετός, χρώμα ανθέων, μεταφύτευση και λόγοι που δεν ανθίζει.',
  },
  {
    md: 'alexandrino.md',
    slug: 'alexandrino-christougenniatiko-asteri-meta-ta-christougenna-ksanaanthisi',
    title: 'Αλεξανδρινό (Χριστουγεννιάτικο Αστέρι): Πώς Επιβιώνει μετά τις Γιορτές και Πώς Ξαναβγάζει Κόκκινα Βράκτια',
    category: 'Φροντίδα Φυτών', category_slug: 'plant_care', readTime: '13 min', difficulty: 'Μέτριο',
    image: 'photo-1787095634322-5a115ca007f5',
    summary: 'Πώς κρατάς ζωντανό το αλεξανδρινό μετά τα Χριστούγεννα και πώς το κάνεις να ξαναβγάλει χρώμα: αγορά και μεταφορά, φως και θερμοκρασία, πότισμα, κλάδεμα την άνοιξη και το πρόγραμμα σκοταδιού από τον Οκτώβριο.',
    botanical: 'Euphorbia pulcherrima', ph: '6.0 - 6.5', ec: '1.0 - 1.5', temp: '13 - 24',
    keyTakeaways: [
      'Το κόκκινο δεν είναι πέταλα αλλά βράκτια. Τα πραγματικά άνθη είναι τα μικρά κίτρινα κυάθια στο κέντρο.',
      'Δεν αντέχει το κρύο: κάτω από περίπου 10-12 °C ρίχνει φύλλα. Τύλιξέ το στη μεταφορά και κράτα το μακριά από ρεύματα και καλοριφέρ.',
      'Πότισε όταν στεγνώσουν τα πάνω 2-3 εκατοστά και βγάλε το διακοσμητικό περιτύλιγμα χωρίς τρύπες. Το πιατάκι αδειάζει.',
      'Μετά τις γιορτές: ξεκούραση τον Μάρτιο, κλάδεμα στα 10-15 εκατοστά τον Απρίλιο-Μάιο, ημισκιά το καλοκαίρι.',
      'Για χρώμα: από περίπου 1 Οκτωβρίου, 14 ώρες πλήρους σκοταδιού κάθε νύχτα για 8-10 εβδομάδες. Ούτε μια λάμπα τη νύχτα.',
    ],
    prompt_focus: 'Γράψε οδηγό για το αλεξανδρινό (χριστουγεννιάτικο αστέρι): αγορά και μεταφορά, φως και θερμοκρασία, πότισμα, διάγνωση φύλλων, τοξικότητα, φροντίδα μετά τα Χριστούγεννα και πρόγραμμα σκοταδιού για να ξαναβγάλει βράκτια.',
  },
];
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
const q = (s) => '"' + esc(s) + '"';
let out = '';
for (const t of T) {
  const md = fs.readFileSync(path.join(here, t.md), 'utf8').replace(/\r\n/g, '\n').trim();
  if (/^BESPOKE\s*$/m.test(md)) throw new Error('md contains the nowdoc terminator: ' + t.md);
  if (!md.startsWith('## Σύντομη Απάντηση')) throw new Error('article must start with the short answer: ' + t.md);
  const words = (md.match(/[\p{L}\p{N}]+(?:[’‘'-][\p{L}\p{N}]+)*/gu) || []).length;
  if (words < 2200) throw new Error(t.md + ' has only ' + words + ' words');
  console.log(t.slug, words, 'words');
  out += '    array(\n'
    + '        "slug" => ' + q(t.slug) + ',\n'
    + '        "title" => ' + q(t.title) + ',\n'
    + '        "category" => ' + q(t.category) + ',\n'
    + '        "category_slug" => ' + q(t.category_slug) + ',\n'
    + '        "readTime" => ' + q(t.readTime) + ',\n'
    + '        "difficulty" => ' + q(t.difficulty) + ',\n'
    + '        "difficultyLabel" => ' + q(t.difficulty) + ',\n'
    + '        "image" => ' + q('https://images.unsplash.com/' + t.image + '?w=1200&auto=format&fit=crop&q=80') + ',\n'
    + '        "summary" => ' + q(t.summary) + ',\n'
    + '        "botanical" => ' + q(t.botanical) + ',\n'
    + '        "ph" => ' + q(t.ph) + ',\n'
    + '        "ec" => ' + q(t.ec) + ',\n'
    + '        "temp" => ' + q(t.temp) + ',\n'
    + '        "keyTakeaways" => array(\n' + t.keyTakeaways.map((k) => '            ' + q(k)).join(',\n') + '\n        ),\n'
    + '        "prompt_focus" => ' + q(t.prompt_focus) + ',\n'
    + '        "bespoke_article" => <<<\'BESPOKE\'\n' + md + '\nBESPOKE\n,\n    ),\n';
}
out = out.replace(/\n/g, '\r\n');
fs.writeFileSync(path.join(here, 'pool_entries.php.txt'), out, 'utf8');
if (process.argv.includes('--write')) {
  const file = 'public/cron-publish.php';
  let src = fs.readFileSync(file, 'utf8');
  const anchor = '    ),\r\n);\r\n\r\n// ==========================================\r\n// 4. LOAD & RESOLVE EXISTING ARTICLES';
  if (src.split(anchor).length !== 2) throw new Error('anchor not found exactly once');
  for (const t of T) if (src.includes('"' + t.slug + '"')) throw new Error('slug already in the file: ' + t.slug);
  src = src.replace(anchor, () => '    ),\r\n' + out + ');\r\n\r\n// ==========================================\r\n// 4. LOAD & RESOLVE EXISTING ARTICLES');
  fs.writeFileSync(file, src, 'utf8');
  console.log('written to', file);
}
