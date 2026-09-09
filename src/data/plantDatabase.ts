// Greek-climate plant reference. Every entry carries real, plant-specific values —
// especially `minTempC`, which is what lets the frost-dates tool (/pagetos) turn a
// region's last-frost date into a concrete "plant this after DD Month" answer.
// Deliberately kept to plants actually grown on Greek balconies and gardens, with
// researched data per plant, rather than padded out with template rows.

export type PlantCategory =
  | 'lachanika'
  | 'aromatika'
  | 'anthofora'
  | 'dentra'
  | 'esoterikou';

export interface Plant {
  slug: string;
  name: string;
  botanical: string;
  family: string;
  category: PlantCategory;
  /** Lowest temperature the plant survives without damage, in °C. Drives frost advice. */
  minTempC: number;
  sun: 'Πλήρης ήλιος' | 'Ήλιος / ημισκιά' | 'Ημισκιά' | 'Σκιά / έμμεσο φως';
  water: 'Χαμηλό' | 'Μέτριο' | 'Υψηλό';
  ph: string;
  potLitres: string;
  /** Month numbers (1-12) for sowing/planting in Greece. */
  sowMonths: number[];
  /** Month numbers (1-12) for harvest or peak flowering. */
  harvestMonths: number[];
  difficulty: 'Εύκολο' | 'Μέτριο' | 'Απαιτητικό';
  /** What makes this plant fail most often, specifically. */
  commonProblem: string;
  /** The single most useful piece of advice a Greek grower needs. */
  keyTip: string;
  companions?: string[];
}

export const PLANT_CATEGORY_LABELS: Record<PlantCategory, string> = {
  lachanika: 'Λαχανικά',
  aromatika: 'Αρωματικά & Βότανα',
  anthofora: 'Ανθοφόρα',
  dentra: 'Δέντρα & Θάμνοι σε Γλάστρα',
  esoterikou: 'Φυτά Εσωτερικού',
};

export const PLANTS: Plant[] = [
  // ---------- ΛΑΧΑΝΙΚΑ ----------
  {
    slug: 'ntomata', name: 'Ντομάτα', botanical: 'Solanum lycopersicum', family: 'Solanaceae',
    category: 'lachanika', minTempC: 5, sun: 'Πλήρης ήλιος', water: 'Υψηλό', ph: '6.0-6.8',
    potLitres: '20-40 L', sowMonths: [3, 4, 5], harvestMonths: [6, 7, 8, 9], difficulty: 'Μέτριο',
    commonProblem: 'Ξηρή κορυφή (Blossom End Rot) — δεν οφείλεται σε έλλειψη ασβεστίου στο χώμα αλλά σε ανομοιόμορφο πότισμα που εμποδίζει την πρόσληψή του.',
    keyTip: 'Πότισμα σταθερό και βαθύ, ποτέ λίγο-λίγο κάθε μέρα. Αφαιρείτε τους λαίμαργους βλαστούς στις μασχάλες των φύλλων εβδομαδιαία.',
    companions: ['Βασιλικός', 'Καλέντουλα', 'Κρεμμύδι'],
  },
  {
    slug: 'piperia', name: 'Πιπεριά', botanical: 'Capsicum annuum', family: 'Solanaceae',
    category: 'lachanika', minTempC: 8, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-6.8',
    potLitres: '15-25 L', sowMonths: [3, 4, 5], harvestMonths: [7, 8, 9, 10], difficulty: 'Μέτριο',
    commonProblem: 'Πτώση ανθέων όταν η νυχτερινή θερμοκρασία ξεπερνά τους 24°C ή πέφτει κάτω από 15°C.',
    keyTip: 'Χρειάζεται περισσότερη ζέστη από την ντομάτα — μη βιαστείτε να τη βγάλετε έξω. Κάλιο στην καρποφορία, όχι άζωτο.',
    companions: ['Βασιλικός', 'Καρότο'],
  },
  {
    slug: 'melitzana', name: 'Μελιτζάνα', botanical: 'Solanum melongena', family: 'Solanaceae',
    category: 'lachanika', minTempC: 10, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '5.8-6.8',
    potLitres: '25-30 L', sowMonths: [3, 4, 5], harvestMonths: [7, 8, 9], difficulty: 'Μέτριο',
    commonProblem: 'Τετράνυχος σε ξηρό, ζεστό μπαλκόνι — εμφανίζεται ως λεπτός ιστός και κιτρινίλα στην κάτω πλευρά των φύλλων.',
    keyTip: 'Το πιο θερμόφιλο από τα σολανώδη. Ψεκασμός με νερό στην κάτω πλευρά των φύλλων αποτρέπει τον τετράνυχο.',
  },
  {
    slug: 'aggouri', name: 'Αγγούρι', botanical: 'Cucumis sativus', family: 'Cucurbitaceae',
    category: 'lachanika', minTempC: 10, sun: 'Πλήρης ήλιος', water: 'Υψηλό', ph: '6.0-7.0',
    potLitres: '20-30 L', sowMonths: [4, 5, 6], harvestMonths: [6, 7, 8, 9], difficulty: 'Μέτριο',
    commonProblem: 'Ωίδιο (λευκή σκόνη στα φύλλα) σε συνθήκες υγρασίας με κακό αερισμό.',
    keyTip: 'Απαιτεί υποστύλωση — κάθετη ανάπτυξη μειώνει δραστικά τις ασθένειες φυλλώματος. Ποτέ πότισμα στο φύλλωμα.',
  },
  {
    slug: 'kolokythi', name: 'Κολοκύθι', botanical: 'Cucurbita pepo', family: 'Cucurbitaceae',
    category: 'lachanika', minTempC: 10, sun: 'Πλήρης ήλιος', water: 'Υψηλό', ph: '6.0-7.0',
    potLitres: '30-40 L', sowMonths: [4, 5, 6], harvestMonths: [6, 7, 8, 9], difficulty: 'Εύκολο',
    commonProblem: 'Καρποί που κιτρινίζουν και πέφτουν μικροί — αποτυχία επικονίασης, συχνό σε κλειστά μπαλκόνια χωρίς έντομα.',
    keyTip: 'Αν δεν δένουν καρποί, κάντε επικονίαση με το χέρι: αρσενικό άνθος (λεπτό μίσχο) πάνω στο θηλυκό (με μικρό καρπό).',
  },
  {
    slug: 'fasolakia', name: 'Φασολάκια', botanical: 'Phaseolus vulgaris', family: 'Fabaceae',
    category: 'lachanika', minTempC: 8, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '15-20 L', sowMonths: [4, 5, 6, 7], harvestMonths: [6, 7, 8, 9], difficulty: 'Εύκολο',
    commonProblem: 'Υπερβολικό άζωτο δίνει πλούσιο φύλλωμα με ελάχιστους λοβούς.',
    keyTip: 'Δεσμεύουν μόνα τους άζωτο — μη λιπαίνετε με αζωτούχο λίπασμα. Σπείρετε απευθείας, δεν μεταφυτεύονται καλά.',
  },
  {
    slug: 'marouli', name: 'Μαρούλι', botanical: 'Lactuca sativa', family: 'Asteraceae',
    category: 'lachanika', minTempC: -6, sun: 'Ήλιος / ημισκιά', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '5-10 L', sowMonths: [2, 3, 9, 10, 11], harvestMonths: [4, 5, 11, 12, 1], difficulty: 'Εύκολο',
    commonProblem: 'Πρόωρη άνθηση (σπόριασμα) με τη ζέστη — το φύλλωμα πικρίζει και σκληραίνει.',
    keyTip: 'Καλλιέργεια φθινοπώρου και χειμώνα στην Ελλάδα, όχι καλοκαιριού. Πάνω από 25°C σποριάζει.',
    companions: ['Ραπανάκι', 'Καρότο'],
  },
  {
    slug: 'spanaki', name: 'Σπανάκι', botanical: 'Spinacia oleracea', family: 'Amaranthaceae',
    category: 'lachanika', minTempC: -9, sun: 'Ήλιος / ημισκιά', water: 'Μέτριο', ph: '6.5-7.5',
    potLitres: '5-10 L', sowMonths: [9, 10, 11, 2], harvestMonths: [11, 12, 1, 2, 3], difficulty: 'Εύκολο',
    commonProblem: 'Σποριάζει γρήγορα με την αύξηση της διάρκειας της ημέρας την άνοιξη.',
    keyTip: 'Από τα πιο ανθεκτικά στο κρύο — αντέχει έως -9°C. Ιδανικό για χειμερινή ζαρντινιέρα.',
  },
  {
    slug: 'roka', name: 'Ρόκα', botanical: 'Eruca vesicaria', family: 'Brassicaceae',
    category: 'lachanika', minTempC: -7, sun: 'Ήλιος / ημισκιά', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '4-8 L', sowMonths: [9, 10, 11, 2, 3], harvestMonths: [10, 11, 12, 1, 3, 4], difficulty: 'Εύκολο',
    commonProblem: 'Ψύλλες (μικρές τρύπες στα φύλλα) την άνοιξη.',
    keyTip: 'Έτοιμη σε 25-30 ημέρες. Κόβετε τα εξωτερικά φύλλα και το φυτό ξαναβγάζει — δεν χρειάζεται νέα σπορά.',
  },
  {
    slug: 'rapanaki', name: 'Ραπανάκι', botanical: 'Raphanus sativus', family: 'Brassicaceae',
    category: 'lachanika', minTempC: -5, sun: 'Ήλιος / ημισκιά', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '4-8 L', sowMonths: [2, 3, 9, 10, 11], harvestMonths: [3, 4, 10, 11, 12], difficulty: 'Εύκολο',
    commonProblem: 'Πολύ φύλλωμα και μικρή ρίζα — αποτέλεσμα πυκνής σποράς ή υπερβολικού αζώτου.',
    keyTip: 'Το ταχύτερο λαχανικό: 25-30 ημέρες. Αραιώστε στα 5 cm μόλις βγουν τα πρώτα φύλλα.',
  },
  {
    slug: 'karoto', name: 'Καρότο', botanical: 'Daucus carota', family: 'Apiaceae',
    category: 'lachanika', minTempC: -6, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-6.8',
    potLitres: '15-20 L (βάθος 30cm+)', sowMonths: [2, 3, 8, 9, 10], harvestMonths: [5, 6, 12, 1, 2], difficulty: 'Μέτριο',
    commonProblem: 'Διχαλωτές ρίζες από πέτρες, σβώλους ή φρέσκια κοπριά στο υπόστρωμα.',
    keyTip: 'Θέλει βαθιά γλάστρα και ψιλόκοκκο, χαλαρό υπόστρωμα χωρίς εμπόδια. Ποτέ φρέσκια κοπριά.',
  },
  {
    slug: 'kremmydi', name: 'Κρεμμύδι', botanical: 'Allium cepa', family: 'Amaryllidaceae',
    category: 'lachanika', minTempC: -8, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '10-15 L', sowMonths: [9, 10, 11, 2], harvestMonths: [5, 6, 7], difficulty: 'Εύκολο',
    commonProblem: 'Βολβοί που σαπίζουν από υπερβολικό πότισμα στο τελικό στάδιο ωρίμανσης.',
    keyTip: 'Σταματήστε εντελώς το πότισμα όταν το φύλλωμα αρχίσει να γέρνει — τότε ωριμάζει ο βολβός.',
  },
  {
    slug: 'skordo', name: 'Σκόρδο', botanical: 'Allium sativum', family: 'Amaryllidaceae',
    category: 'lachanika', minTempC: -10, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '6.0-7.5',
    potLitres: '10-15 L', sowMonths: [10, 11, 12], harvestMonths: [6, 7], difficulty: 'Εύκολο',
    commonProblem: 'Μικρές κεφαλές επειδή φυτεύτηκε πολύ αργά — χρειάζεται ψυχρή περίοδο για να σχηματίσει σκελίδες.',
    keyTip: 'Φυτεύεται φθινόπωρο, μαζεύεται αρχές καλοκαιριού. Φυτέψτε τη σκελίδα με τη μύτη προς τα πάνω, 5 cm βάθος.',
  },
  {
    slug: 'lachano', name: 'Λάχανο', botanical: 'Brassica oleracea var. capitata', family: 'Brassicaceae',
    category: 'lachanika', minTempC: -10, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.5-7.5',
    potLitres: '20-25 L', sowMonths: [7, 8, 9], harvestMonths: [11, 12, 1, 2], difficulty: 'Μέτριο',
    commonProblem: 'Κάμπιες πιερίδας (λευκή πεταλούδα) που τρώνε το φύλλωμα.',
    keyTip: 'Βιολογική αντιμετώπιση καμπιών με Bacillus thuringiensis. Το κρύο γλυκαίνει τη γεύση.',
  },
  {
    slug: 'brokolo', name: 'Μπρόκολο', botanical: 'Brassica oleracea var. italica', family: 'Brassicaceae',
    category: 'lachanika', minTempC: -8, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.5-7.5',
    potLitres: '20-25 L', sowMonths: [7, 8, 9], harvestMonths: [11, 12, 1, 2], difficulty: 'Μέτριο',
    commonProblem: 'Χαλαρές, «ανοιχτές» κεφαλές όταν η θερμοκρασία ανεβαίνει πριν ωριμάσουν.',
    keyTip: 'Μετά την κοπή της κεντρικής κεφαλής, το φυτό βγάζει μικρότερες πλάγιες για εβδομάδες — μην το ξεριζώνετε.',
  },
  {
    slug: 'arakas', name: 'Αρακάς', botanical: 'Pisum sativum', family: 'Fabaceae',
    category: 'lachanika', minTempC: -6, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.5',
    potLitres: '15-20 L', sowMonths: [10, 11, 1, 2], harvestMonths: [3, 4, 5], difficulty: 'Εύκολο',
    commonProblem: 'Ωίδιο στο τέλος της σεζόν καθώς ανεβαίνει η θερμοκρασία.',
    keyTip: 'Χειμερινή καλλιέργεια στην Ελλάδα. Χρειάζεται δίχτυ ή καλάμια για αναρρίχηση από την αρχή.',
  },
  {
    slug: 'fraoula', name: 'Φράουλα', botanical: 'Fragaria × ananassa', family: 'Rosaceae',
    category: 'lachanika', minTempC: -12, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '5.5-6.5',
    potLitres: '5-8 L ανά φυτό', sowMonths: [9, 10, 2, 3], harvestMonths: [4, 5, 6], difficulty: 'Εύκολο',
    commonProblem: 'Καρποί που σαπίζουν επειδή ακουμπούν στο υγρό υπόστρωμα (Botrytis).',
    keyTip: 'Κρεμαστή γλάστρα ή στρώση άχυρου κάτω από τους καρπούς. Αφαιρέστε τα στολονοφόρα («μουστάκια») για μεγαλύτερους καρπούς.',
  },
  {
    slug: 'patata', name: 'Πατάτα', botanical: 'Solanum tuberosum', family: 'Solanaceae',
    category: 'lachanika', minTempC: 2, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '5.0-6.5',
    potLitres: '30-40 L', sowMonths: [2, 3, 8, 9], harvestMonths: [6, 7, 12, 1], difficulty: 'Εύκολο',
    commonProblem: 'Πράσινοι κόνδυλοι εκτεθειμένοι στο φως — περιέχουν σολανίνη και δεν τρώγονται.',
    keyTip: 'Παραγέμισμα: καθώς ψηλώνει το φυτό, προσθέτετε χώμα ώστε οι κόνδυλοι να μένουν στο σκοτάδι.',
  },
  {
    slug: 'maintanos', name: 'Μαϊντανός', botanical: 'Petroselinum crispum', family: 'Apiaceae',
    category: 'lachanika', minTempC: -10, sun: 'Ήλιος / ημισκιά', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '5-10 L', sowMonths: [2, 3, 9, 10], harvestMonths: [5, 6, 7, 11, 12, 1], difficulty: 'Εύκολο',
    commonProblem: 'Πολύ αργό φύτρωμα (3-4 εβδομάδες) που κάνει πολλούς να νομίζουν ότι απέτυχε η σπορά.',
    keyTip: 'Μούλιασμα σπόρων 24 ώρες πριν τη σπορά επιταχύνει αισθητά το φύτρωμα. Διετές — τη 2η χρονιά σποριάζει.',
  },
  {
    slug: 'anithos', name: 'Άνηθος', botanical: 'Anethum graveolens', family: 'Apiaceae',
    category: 'lachanika', minTempC: -5, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '5-10 L', sowMonths: [9, 10, 2, 3], harvestMonths: [11, 12, 4, 5], difficulty: 'Εύκολο',
    commonProblem: 'Σποριάζει γρήγορα στη ζέστη και το φύλλωμα σκληραίνει.',
    keyTip: 'Δεν μεταφυτεύεται — σπείρετε απευθείας στη θέση του. Διαδοχικές σπορές κάθε 3 εβδομάδες για συνεχή παραγωγή.',
  },

  // ---------- ΑΡΩΜΑΤΙΚΑ ----------
  {
    slug: 'vasilikos', name: 'Βασιλικός', botanical: 'Ocimum basilicum', family: 'Lamiaceae',
    category: 'aromatika', minTempC: 10, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '5-10 L', sowMonths: [4, 5, 6], harvestMonths: [6, 7, 8, 9], difficulty: 'Εύκολο',
    commonProblem: 'Μαυρίζει και καταρρέει με την πρώτη ψυχρή νύχτα — δεν αντέχει κάτω από 10°C.',
    keyTip: 'Κόβετε συνεχώς τις ανθοφόρες κορυφές: μόλις ανθίσει, τα φύλλα πικρίζουν και το φυτό σταματά την ανάπτυξη.',
    companions: ['Ντομάτα', 'Πιπεριά'],
  },
  {
    slug: 'rigani', name: 'Ρίγανη', botanical: 'Origanum vulgare', family: 'Lamiaceae',
    category: 'aromatika', minTempC: -15, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '6.0-8.0',
    potLitres: '5-10 L', sowMonths: [3, 4, 9, 10], harvestMonths: [6, 7, 8], difficulty: 'Εύκολο',
    commonProblem: 'Σήψη ριζών από υπερβολικό πότισμα — το συχνότερο λάθος σε μεσογειακά αρωματικά.',
    keyTip: 'Το άρωμα είναι εντονότερο σε φτωχό, στεγνό έδαφος. Η λίπανση μειώνει την περιεκτικότητα σε αιθέρια έλαια.',
  },
  {
    slug: 'thymari', name: 'Θυμάρι', botanical: 'Thymus vulgaris', family: 'Lamiaceae',
    category: 'aromatika', minTempC: -12, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '6.0-8.0',
    potLitres: '4-8 L', sowMonths: [3, 4, 9], harvestMonths: [5, 6, 7, 8], difficulty: 'Εύκολο',
    commonProblem: 'Ξυλοποίηση και «γύμνωμα» στη βάση μετά από 3-4 χρόνια χωρίς κλάδεμα.',
    keyTip: 'Ελαφρύ κλάδεμα κάθε άνοιξη, ποτέ σε ξυλοποιημένο τμήμα χωρίς φύλλα — από εκεί δεν ξαναβγάζει.',
  },
  {
    slug: 'dendrolivano', name: 'Δεντρολίβανο', botanical: 'Salvia rosmarinus', family: 'Lamiaceae',
    category: 'aromatika', minTempC: -10, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '6.0-7.5',
    potLitres: '10-20 L', sowMonths: [3, 4, 9, 10], harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], difficulty: 'Εύκολο',
    commonProblem: 'Ξαφνικός θάνατος από ασφυξία ριζών σε γλάστρα με κακή αποστράγγιση.',
    keyTip: 'Θέλει αμμώδες, φτωχό υπόστρωμα και να στεγνώνει εντελώς ανάμεσα στα ποτίσματα. Πολλαπλασιάζεται εύκολα με μοσχεύματα.',
  },
  {
    slug: 'menta', name: 'Μέντα / Δυόσμος', botanical: 'Mentha spicata', family: 'Lamiaceae',
    category: 'aromatika', minTempC: -15, sun: 'Ήλιος / ημισκιά', water: 'Υψηλό', ph: '6.0-7.5',
    potLitres: '8-15 L', sowMonths: [3, 4, 9, 10], harvestMonths: [5, 6, 7, 8, 9], difficulty: 'Εύκολο',
    commonProblem: 'Εξαπλώνεται επιθετικά με υπόγεια ριζώματα και πνίγει ό,τι είναι δίπλα του.',
    keyTip: 'ΠΑΝΤΑ σε ξεχωριστή γλάστρα, ποτέ σε κοινή ζαρντινιέρα με άλλα φυτά. Το μόνο αρωματικό που θέλει σταθερή υγρασία.',
  },
  {
    slug: 'levanta', name: 'Λεβάντα', botanical: 'Lavandula angustifolia', family: 'Lamiaceae',
    category: 'aromatika', minTempC: -15, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '6.5-8.0',
    potLitres: '10-20 L', sowMonths: [3, 4, 9, 10], harvestMonths: [6, 7], difficulty: 'Εύκολο',
    commonProblem: 'Σήψη σε βαρύ, υγρό υπόστρωμα — προτιμά αλκαλικό και στεγνό.',
    keyTip: 'Κλάδεμα αμέσως μετά την ανθοφορία, αφαιρώντας το 1/3 του φυτού, κρατά το σχήμα συμπαγές για χρόνια.',
  },
  {
    slug: 'faskomilo', name: 'Φασκόμηλο', botanical: 'Salvia officinalis', family: 'Lamiaceae',
    category: 'aromatika', minTempC: -12, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '6.0-7.5',
    potLitres: '10-15 L', sowMonths: [3, 4, 9], harvestMonths: [5, 6, 7, 8], difficulty: 'Εύκολο',
    commonProblem: 'Ωίδιο σε συνθήκες υψηλής υγρασίας με κακό αερισμό.',
    keyTip: 'Αντέχει εξαιρετικά στην ξηρασία. Ανανεώστε το φυτό κάθε 4-5 χρόνια με μοσχεύματα — τα παλιά ξυλοποιούνται.',
  },
  {
    slug: 'melissochorto', name: 'Μελισσόχορτο', botanical: 'Melissa officinalis', family: 'Lamiaceae',
    category: 'aromatika', minTempC: -15, sun: 'Ήλιος / ημισκιά', water: 'Μέτριο', ph: '6.0-7.5',
    potLitres: '8-12 L', sowMonths: [3, 4, 9], harvestMonths: [5, 6, 7, 8, 9], difficulty: 'Εύκολο',
    commonProblem: 'Αυτοσπείρεται και εξαπλώνεται αν αφεθεί να ανθίσει και να σποριάσει.',
    keyTip: 'Κόψτε το χαμηλά μετά την ανθοφορία και θα ξαναβγάλει φρέσκο, αρωματικό φύλλωμα.',
  },
  {
    slug: 'dafni', name: 'Δάφνη', botanical: 'Laurus nobilis', family: 'Lauraceae',
    category: 'aromatika', minTempC: -8, sun: 'Ήλιος / ημισκιά', water: 'Μέτριο', ph: '6.0-7.5',
    potLitres: '25-40 L', sowMonths: [3, 4, 10], harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], difficulty: 'Εύκολο',
    commonProblem: 'Κολλώδη φύλλα με μαύρη καπνιά — προσβολή από κοκκοειδή.',
    keyTip: 'Αντιμετώπιση κοκκοειδών με θερινό πολτό ή σαπούνι καλίου. Αναπτύσσεται αργά, ιδανικό για μεγάλη γλάστρα δεκαετίας.',
  },
  {
    slug: 'chamomili', name: 'Χαμομήλι', botanical: 'Matricaria chamomilla', family: 'Asteraceae',
    category: 'aromatika', minTempC: -10, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '6.0-7.5',
    potLitres: '5-10 L', sowMonths: [9, 10, 2, 3], harvestMonths: [4, 5, 6], difficulty: 'Εύκολο',
    commonProblem: 'Οι σπόροι δεν φυτρώνουν αν σκεπαστούν — χρειάζονται φως για βλάστηση.',
    keyTip: 'Σπείρετε επιφανειακά, πατώντας απλά τους σπόρους στο χώμα χωρίς να τους καλύψετε.',
  },

  // ---------- ΑΝΘΟΦΟΡΑ ----------
  {
    slug: 'gerani', name: 'Γεράνι / Πελαργόνιο', botanical: 'Pelargonium spp.', family: 'Geraniaceae',
    category: 'anthofora', minTempC: 0, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '8-15 L', sowMonths: [3, 4, 9, 10], harvestMonths: [4, 5, 6, 7, 8, 9, 10], difficulty: 'Εύκολο',
    commonProblem: 'Αφρικανική πεταλούδα (Cacyreus marshalli) — οι κάμπιες τρυπούν και αδειάζουν τους βλαστούς από μέσα.',
    keyTip: 'Έλεγχος με Bacillus thuringiensis kurstaki κάθε 15 μέρες την άνοιξη. Κλάδεμα ανανέωσης μετά τον καύσωνα.',
  },
  {
    slug: 'petounia', name: 'Πετούνια', botanical: 'Petunia × atkinsiana', family: 'Solanaceae',
    category: 'anthofora', minTempC: 2, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '5.5-6.5',
    potLitres: '5-10 L', sowMonths: [3, 4, 9], harvestMonths: [4, 5, 6, 7, 8, 9, 10], difficulty: 'Εύκολο',
    commonProblem: 'Μακριά, «γυμνά» κλαδιά με λίγα άνθη στις άκρες προς το μέσο του καλοκαιριού.',
    keyTip: 'Κόψτε το φυτό κατά το 1/3 στα μέσα του καλοκαιριού και λιπάνετε — ξαναβγάζει πυκνή ανθοφορία μέσα σε 2-3 εβδομάδες.',
  },
  {
    slug: 'triantafyllia', name: 'Τριανταφυλλιά', botanical: 'Rosa spp.', family: 'Rosaceae',
    category: 'anthofora', minTempC: -15, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-6.8',
    potLitres: '30-40 L', sowMonths: [11, 12, 1, 2], harvestMonths: [4, 5, 6, 9, 10], difficulty: 'Μέτριο',
    commonProblem: 'Μαύρη κηλίδωση και ωίδιο σε φύλλωμα που βρέχεται και δεν στεγνώνει.',
    keyTip: 'Κλάδεμα τον Ιανουάριο-Φεβρουάριο σε εξωτερικό μάτι. Πότισμα μόνο στη ρίζα, ποτέ στο φύλλωμα.',
  },
  {
    slug: 'ortansia', name: 'Ορτανσία', botanical: 'Hydrangea macrophylla', family: 'Hydrangeaceae',
    category: 'anthofora', minTempC: -12, sun: 'Ημισκιά', water: 'Υψηλό', ph: '5.0-6.0 (μπλε) / 6.5-7.0 (ροζ)',
    potLitres: '25-40 L', sowMonths: [3, 4, 10], harvestMonths: [5, 6, 7], difficulty: 'Μέτριο',
    commonProblem: 'Καμένα, καφέ άκρα φύλλων από απογευματινό ήλιο και ξηρασία.',
    keyTip: 'Το χρώμα των ανθέων ελέγχεται από το pH: όξινο υπόστρωμα με θειικό αργίλιο δίνει μπλε, ουδέτερο δίνει ροζ.',
  },
  {
    slug: 'gardenia', name: 'Γαρδένια', botanical: 'Gardenia jasminoides', family: 'Rubiaceae',
    category: 'anthofora', minTempC: -3, sun: 'Ήλιος / ημισκιά', water: 'Υψηλό', ph: '5.0-6.0',
    potLitres: '15-25 L', sowMonths: [3, 4, 9], harvestMonths: [5, 6, 7, 8], difficulty: 'Απαιτητικό',
    commonProblem: 'Χλώρωση σιδήρου: κίτρινα φύλλα με πράσινα νεύρα, επειδή το ασβεστούχο νερό ανεβάζει το pH και δεσμεύει τον σίδηρο.',
    keyTip: 'Όξινο υπόστρωμα και χηλικός σίδηρος EDDHA (όχι EDTA, που αδρανοποιείται σε pH>7). Πότισμα με νερό βροχής αν γίνεται.',
  },
  {
    slug: 'voukamvilia', name: 'Βουκαμβίλια', botanical: 'Bougainvillea glabra', family: 'Nyctaginaceae',
    category: 'anthofora', minTempC: 0, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '5.5-7.0',
    potLitres: '30-50 L', sowMonths: [3, 4, 5], harvestMonths: [5, 6, 7, 8, 9, 10], difficulty: 'Εύκολο',
    commonProblem: 'Πλούσιο φύλλωμα χωρίς άνθη — αποτέλεσμα υπερβολικού ποτίσματος και αζώτου.',
    keyTip: 'Ανθίζει από ελεγχόμενη καταπόνηση: λιγότερο νερό και λίπασμα υψηλού φωσφόρου προκαλούν ανθοφορία.',
  },
  {
    slug: 'giasemi', name: 'Γιασεμί', botanical: 'Jasminum officinale', family: 'Oleaceae',
    category: 'anthofora', minTempC: -7, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.5',
    potLitres: '20-30 L', sowMonths: [3, 4, 9, 10], harvestMonths: [5, 6, 7, 8, 9], difficulty: 'Εύκολο',
    commonProblem: 'Απώλεια ανθοφορίας μετά από λάθος χρόνο κλαδέματος.',
    keyTip: 'Κλαδεύετε αμέσως μετά την ανθοφορία — τα άνθη σχηματίζονται σε βλαστούς της προηγούμενης χρονιάς.',
  },
  {
    slug: 'chrysanthemo', name: 'Χρυσάνθεμο', botanical: 'Chrysanthemum × morifolium', family: 'Asteraceae',
    category: 'anthofora', minTempC: -8, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '10-15 L', sowMonths: [4, 5, 6], harvestMonths: [10, 11, 12], difficulty: 'Εύκολο',
    commonProblem: 'Δεν ξαναανθίζει αν βρίσκεται κάτω από τεχνητό φωτισμό τη νύχτα το φθινόπωρο.',
    keyTip: 'Φυτό βραχείας ημέρας: ανθίζει μόνο όταν οι νύχτες ξεπεράσουν τις ~13 ώρες αδιάκοπου σκότους.',
  },
  {
    slug: 'kyklamino', name: 'Κυκλάμινο', botanical: 'Cyclamen persicum', family: 'Primulaceae',
    category: 'anthofora', minTempC: -2, sun: 'Ημισκιά', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '2-5 L', sowMonths: [8, 9], harvestMonths: [11, 12, 1, 2, 3], difficulty: 'Μέτριο',
    commonProblem: 'Σήψη κονδύλου από πότισμα στην κορυφή του φυτού.',
    keyTip: 'Πότισμα ΜΟΝΟ από το πιατάκι ή στην άκρη της γλάστρας. Το καλοκαίρι μπαίνει σε φυσιολογική αδράνεια — δεν πέθανε.',
  },
  {
    slug: 'alexandrino', name: 'Αλεξανδρινό', botanical: 'Euphorbia pulcherrima', family: 'Euphorbiaceae',
    category: 'anthofora', minTempC: 10, sun: 'Ήλιος / ημισκιά', water: 'Μέτριο', ph: '5.5-6.5',
    potLitres: '5-10 L', sowMonths: [4, 5], harvestMonths: [12, 1], difficulty: 'Απαιτητικό',
    commonProblem: 'Πτώση φύλλων από ρεύματα αέρα ή απότομη αλλαγή θερμοκρασίας.',
    keyTip: 'Για να ξανακοκκινίσει: από τα μέσα Οκτωβρίου, 14 ώρες απόλυτου σκότους κάθε νύχτα για 8 εβδομάδες.',
  },
  {
    slug: 'toulipa', name: 'Τουλίπα', botanical: 'Tulipa gesneriana', family: 'Liliaceae',
    category: 'anthofora', minTempC: -15, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '5-10 L', sowMonths: [10, 11, 12], harvestMonths: [3, 4], difficulty: 'Εύκολο',
    commonProblem: 'Δεν ξαναανθίζει τη 2η χρονιά στο ήπιο ελληνικό κλίμα — δεν παίρνει αρκετό ψύχος.',
    keyTip: 'Στην Ελλάδα χρειάζεται προψύξη: 6-8 εβδομάδες στο ψυγείο (όχι δίπλα σε φρούτα) πριν τη φύτευση.',
  },
  {
    slug: 'narkissos', name: 'Νάρκισσος', botanical: 'Narcissus spp.', family: 'Amaryllidaceae',
    category: 'anthofora', minTempC: -15, sun: 'Ήλιος / ημισκιά', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '5-10 L', sowMonths: [9, 10, 11], harvestMonths: [2, 3, 4], difficulty: 'Εύκολο',
    commonProblem: 'Φύλλωμα που κόβεται πολύ νωρίς, αδυνατίζοντας τον βολβό για την επόμενη χρονιά.',
    keyTip: 'Σε αντίθεση με την τουλίπα, πολυετίζει φυσικά στην Ελλάδα χωρίς προψύξη. Αφήστε το φύλλωμα να κιτρινίσει πλήρως.',
  },

  // ---------- ΔΕΝΤΡΑ & ΘΑΜΝΟΙ ΣΕ ΓΛΑΣΤΡΑ ----------
  {
    slug: 'lemonia', name: 'Λεμονιά', botanical: 'Citrus limon', family: 'Rutaceae',
    category: 'dentra', minTempC: -3, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '50-80 L', sowMonths: [3, 4, 9, 10], harvestMonths: [11, 12, 1, 2, 3], difficulty: 'Μέτριο',
    commonProblem: 'Χλώρωση σιδήρου (κίτρινα φύλλα με πράσινα νεύρα) από ασβεστούχο νερό και υψηλό pH.',
    keyTip: 'Χηλικός σίδηρος EDDHA την άνοιξη. Η πτώση μικρών καρπών τον Ιούνιο είναι φυσιολογική αυτοαραίωση, όχι πρόβλημα.',
  },
  {
    slug: 'portokalia', name: 'Πορτοκαλιά', botanical: 'Citrus × sinensis', family: 'Rutaceae',
    category: 'dentra', minTempC: -4, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '60-100 L', sowMonths: [3, 4, 9, 10], harvestMonths: [12, 1, 2, 3], difficulty: 'Μέτριο',
    commonProblem: 'Φυλλοκνίστης (Phyllocnistis citrella) — φιδίσιες στοές στα νεαρά φύλλα.',
    keyTip: 'Ψεκασμός με Spinosad στη νέα βλάστηση. Χρειάζεται μεγαλύτερη γλάστρα από τη λεμονιά για ισοδύναμη παραγωγή.',
  },
  {
    slug: 'koumkouat', name: 'Κουμκουάτ', botanical: 'Citrus japonica', family: 'Rutaceae',
    category: 'dentra', minTempC: -6, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '30-50 L', sowMonths: [3, 4, 9], harvestMonths: [12, 1, 2], difficulty: 'Εύκολο',
    commonProblem: 'Υπερβολικό πότισμα τον χειμώνα όταν η ανάπτυξη έχει σταματήσει.',
    keyTip: 'Το πιο ανθεκτικό στο κρύο και το πιο κατάλληλο εσπεριδοειδές για γλάστρα σε μπαλκόνι — μένει συμπαγές.',
  },
  {
    slug: 'elia', name: 'Ελιά', botanical: 'Olea europaea', family: 'Oleaceae',
    category: 'dentra', minTempC: -10, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '6.5-8.0',
    potLitres: '50-100 L', sowMonths: [3, 4, 10, 11], harvestMonths: [10, 11, 12], difficulty: 'Εύκολο',
    commonProblem: 'Λεκάνιο (κοκκοειδές) με μαύρη καπνιά, ευνοείται από πυκνό, ασυδότητο φύλλωμα.',
    keyTip: 'Κλάδεμα σε ανοιχτό κύπελλο ώστε να μπαίνει φως και αέρας στο εσωτερικό — η καλύτερη πρόληψη κατά του λεκανίου.',
  },
  {
    slug: 'sykia', name: 'Συκιά', botanical: 'Ficus carica', family: 'Moraceae',
    category: 'dentra', minTempC: -12, sun: 'Πλήρης ήλιος', water: 'Μέτριο', ph: '6.0-7.5',
    potLitres: '50-80 L', sowMonths: [11, 12, 1, 2], harvestMonths: [7, 8, 9], difficulty: 'Εύκολο',
    commonProblem: 'Καρποί που πέφτουν άγουροι λόγω ακανόνιστου ποτίσματος στη διάρκεια της ωρίμανσης.',
    keyTip: 'Ανέχεται εξαιρετικά τον περιορισμό ρίζας — η γλάστρα στην ουσία ελέγχει το μέγεθος και αυξάνει την καρποφορία.',
  },
  {
    slug: 'rodia', name: 'Ροδιά', botanical: 'Punica granatum', family: 'Lythraceae',
    category: 'dentra', minTempC: -12, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '5.5-7.5',
    potLitres: '40-60 L', sowMonths: [11, 12, 1, 2], harvestMonths: [9, 10], difficulty: 'Εύκολο',
    commonProblem: 'Σκάσιμο καρπών από απότομο πότισμα μετά από περίοδο ξηρασίας.',
    keyTip: 'Σταθερή υγρασία στην ωρίμανση αποτρέπει το σκάσιμο. Αντέχει αλατότητα και ξηρασία καλύτερα από κάθε άλλο οπωροφόρο.',
  },
  {
    slug: 'pyxari', name: 'Πυξάρι', botanical: 'Buxus sempervirens', family: 'Buxaceae',
    category: 'dentra', minTempC: -18, sun: 'Ήλιος / ημισκιά', water: 'Μέτριο', ph: '6.5-7.5',
    potLitres: '20-40 L', sowMonths: [3, 4, 9, 10], harvestMonths: [], difficulty: 'Μέτριο',
    commonProblem: 'Πυραλίδα του πυξαριού (Cydalima perspectalis) — αποφυλλώνει ολόκληρο τον θάμνο μέσα σε ημέρες.',
    keyTip: 'Έλεγχος με Bacillus thuringiensis μόλις εμφανιστούν οι πρώτες κάμπιες. Ελέγχετε το εσωτερικό του θάμνου εβδομαδιαία την άνοιξη.',
  },

  // ---------- ΦΥΤΑ ΕΣΩΤΕΡΙΚΟΥ ----------
  {
    slug: 'monstera', name: 'Μονστέρα', botanical: 'Monstera deliciosa', family: 'Araceae',
    category: 'esoterikou', minTempC: 10, sun: 'Σκιά / έμμεσο φως', water: 'Μέτριο', ph: '5.5-7.0',
    potLitres: '15-30 L', sowMonths: [3, 4, 5, 6], harvestMonths: [], difficulty: 'Εύκολο',
    commonProblem: 'Φύλλα χωρίς τις χαρακτηριστικές σχισμές — ένδειξη ανεπαρκούς φωτός, όχι ηλικίας.',
    keyTip: 'Θέλει έντονο έμμεσο φως και στήριγμα με βρύα για να βγάλει μεγάλα, σχισμένα φύλλα. Πότισμα μόνο όταν στεγνώσουν τα πρώτα 5 cm.',
  },
  {
    slug: 'zamioulkas', name: 'Ζαμιοκούλκας', botanical: 'Zamioculcas zamiifolia', family: 'Araceae',
    category: 'esoterikou', minTempC: 12, sun: 'Σκιά / έμμεσο φως', water: 'Χαμηλό', ph: '6.0-7.0',
    potLitres: '8-15 L', sowMonths: [3, 4, 5, 6], harvestMonths: [], difficulty: 'Εύκολο',
    commonProblem: 'Κίτρινα φύλλα και μαλακοί βλαστοί — σχεδόν πάντα υπερβολικό πότισμα, ποτέ έλλειψη.',
    keyTip: 'Αποθηκεύει νερό σε υπόγειους κονδύλους. Πότισμα κάθε 2-3 εβδομάδες τον χειμώνα αρκεί — το πιο ανθεκτικό φυτό εσωτερικού.',
  },
  {
    slug: 'sansevieria', name: 'Σανσεβιέρια', botanical: 'Dracaena trifasciata', family: 'Asparagaceae',
    category: 'esoterikou', minTempC: 10, sun: 'Σκιά / έμμεσο φως', water: 'Χαμηλό', ph: '5.5-7.5',
    potLitres: '5-12 L', sowMonths: [3, 4, 5, 6], harvestMonths: [], difficulty: 'Εύκολο',
    commonProblem: 'Σήψη βάσης από νερό που στέκεται στο κέντρο της ροζέτας.',
    keyTip: 'Ποτίζετε στην άκρη της γλάστρας, ποτέ στο κέντρο. Αντέχει σε χαμηλό φως αλλά αναπτύσσεται πολύ πιο γρήγορα σε φωτεινό σημείο.',
  },
  {
    slug: 'pothos', name: 'Πόθος', botanical: 'Epipremnum aureum', family: 'Araceae',
    category: 'esoterikou', minTempC: 12, sun: 'Σκιά / έμμεσο φως', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '5-10 L', sowMonths: [3, 4, 5, 6, 7, 8, 9], harvestMonths: [], difficulty: 'Εύκολο',
    commonProblem: 'Χάνει τα κίτρινα/λευκά σχέδια και γίνεται μονόχρωμα πράσινο σε πολύ σκοτεινό σημείο.',
    keyTip: 'Ριζοβολεί μέσα σε νερό σε 2 εβδομάδες — το ευκολότερο φυτό για πολλαπλασιασμό με μοσχεύματα κόμβου.',
  },
  {
    slug: 'spathifyllo', name: 'Σπαθίφυλλο', botanical: 'Spathiphyllum wallisii', family: 'Araceae',
    category: 'esoterikou', minTempC: 12, sun: 'Σκιά / έμμεσο φως', water: 'Μέτριο', ph: '5.5-6.5',
    potLitres: '5-12 L', sowMonths: [3, 4, 5, 6], harvestMonths: [], difficulty: 'Εύκολο',
    commonProblem: 'Καφέ άκρες φύλλων από το χλώριο και τα άλατα του νερού βρύσης.',
    keyTip: 'Αφήστε το νερό να σταθεί 24 ώρες πριν το πότισμα. «Γέρνει» χαρακτηριστικά όταν διψά και επανέρχεται σε ώρες.',
  },
  {
    slug: 'aloe-vera', name: 'Αλόη', botanical: 'Aloe vera', family: 'Asphodelaceae',
    category: 'esoterikou', minTempC: 5, sun: 'Πλήρης ήλιος', water: 'Χαμηλό', ph: '6.0-7.5',
    potLitres: '4-10 L', sowMonths: [3, 4, 5, 9], harvestMonths: [], difficulty: 'Εύκολο',
    commonProblem: 'Μαλακά, διάφανα φύλλα που καταρρέουν — υπερβολικό πότισμα, ειδικά τον χειμώνα.',
    keyTip: 'Υπόστρωμα κάκτου με περλίτη και πότισμα μόνο όταν στεγνώσει τελείως. Το καλοκαίρι μπορεί να βγει στο μπαλκόνι με σταδιακή προσαρμογή.',
  },
  {
    slug: 'orchidea', name: 'Ορχιδέα Φαλαινόψις', botanical: 'Phalaenopsis spp.', family: 'Orchidaceae',
    category: 'esoterikou', minTempC: 15, sun: 'Σκιά / έμμεσο φως', water: 'Μέτριο', ph: '5.5-6.5',
    potLitres: 'Ειδική διάφανη γλάστρα', sowMonths: [], harvestMonths: [1, 2, 3, 4, 11, 12], difficulty: 'Μέτριο',
    commonProblem: 'Σήψη ριζών από φύτευση σε κανονικό χώμα αντί για φλοιό πεύκου.',
    keyTip: 'Είναι επίφυτο: θέλει φλοιό, όχι χώμα. Για νέα ανθοφορία, διαφορά 8-10°C ανάμεσα σε ημέρα και νύχτα για 3-4 εβδομάδες.',
  },
  {
    slug: 'ficus-lyrata', name: 'Φίκος Λυράτα', botanical: 'Ficus lyrata', family: 'Moraceae',
    category: 'esoterikou', minTempC: 12, sun: 'Σκιά / έμμεσο φως', water: 'Μέτριο', ph: '6.0-7.0',
    potLitres: '20-40 L', sowMonths: [3, 4, 5, 6], harvestMonths: [], difficulty: 'Απαιτητικό',
    commonProblem: 'Ξαφνική πτώση φύλλων μετά από μετακίνηση — αντιδρά έντονα σε κάθε αλλαγή θέσης.',
    keyTip: 'Βρείτε του μια φωτεινή θέση και ΜΗΝ το μετακινείτε. Γυρίζετε τη γλάστρα λίγο κάθε εβδομάδα για ομοιόμορφη ανάπτυξη.',
  },
];

export function getPlantBySlug(slug: string): Plant | undefined {
  return PLANTS.find((p) => p.slug === slug);
}
