import { CityTelemetry, Article, SocialScript, RoboticMower } from '../types';

export const CITIES_TELEMETRY: CityTelemetry[] = [
  {
    id: 'athens',
    name: { el: 'Αθήνα (Αττική)', en: 'Athens (Attica)' },
    region: { el: 'Κεντρική Ελλάδα', en: 'Central Greece' },
    temp: 31,
    condition: { el: 'Ηλιοφάνεια', en: 'Sunny', icon: 'Sun' },
    humidity: 42,
    uvIndex: 9,
    uvLevel: { el: '9 (Very High)', en: '9 (Very High)', color: 'text-amber-500' },
    evapotranspiration: 6.8,
    solarRadiation: 890,
    windSpeed: 14,
    soilMoistureLevel: 32,
    smartTip: {
      el: 'Υψηλή ηλιοφάνεια & ζέστη. Προτείνεται πότισμα νωρίς το πρωί (05:30 - 06:45) για ελαχιστοποίηση εξάτμισης.',
      en: 'High solar intensity & heat. Recommended watering early morning (05:30 - 06:45) to minimize evapotranspiration.'
    },
    recommendedWateringTime: {
      el: '05:30 - 06:45',
      en: '05:30 - 06:45 AM'
    }
  },
  {
    id: 'mykonos',
    name: { el: 'Μύκονος (Κυκλάδες)', en: 'Mykonos (Cyclades)' },
    region: { el: 'Νότιο Αιγαίο', en: 'South Aegean' },
    temp: 28,
    condition: { el: 'Έντονοι Άνεμοι (Μελτέμια)', en: 'High Winds (Meltemi)', icon: 'Wind' },
    humidity: 55,
    uvIndex: 10,
    uvLevel: { el: '10 (Extreme)', en: '10 (Extreme)', color: 'text-orange-600' },
    evapotranspiration: 7.9,
    solarRadiation: 940,
    windSpeed: 42,
    soilMoistureLevel: 21,
    smartTip: {
      el: 'Ισχυρά μελτέμια (6-7 μποφόρ) επιταχύνουν την ξήρανση του χώματος στις γλάστρες. Ελέγξτε δεσίματα και προσθέστε mulching (φλοιό πεύκου).',
      en: 'Strong meltemi winds (6-7 Bft) accelerate soil drying in pots. Check plant stakes and apply pine bark mulching.'
    },
    recommendedWateringTime: {
      el: '06:00 - 07:00 & 20:30',
      en: '06:00 - 07:00 & 20:30'
    }
  },
  {
    id: 'thessaloniki',
    name: { el: 'Θεσσαλονίκη (Κεντρική Μακεδονία)', en: 'Thessaloniki (Macedonia)' },
    region: { el: 'Βόρεια Ελλάδα', en: 'Northern Greece' },
    temp: 29,
    condition: { el: 'Αίθριος με ελαφριά υγρασία', en: 'Clear & Humid', icon: 'Sun' },
    humidity: 58,
    uvIndex: 8,
    uvLevel: { el: '8 (High)', en: '8 (High)', color: 'text-amber-500' },
    evapotranspiration: 5.4,
    solarRadiation: 810,
    windSpeed: 10,
    soilMoistureLevel: 45,
    smartTip: {
      el: 'Ιδανικές συνθήκες για λίπανση με βιολογικό εκχύλισμα φυκιών. Αποφύγετε να βρέχετε το φύλλωμα σε ντομάτες για πρόληψη περονόσπορου.',
      en: 'Ideal conditions for organic seaweed bio-fertilizer. Avoid wetting tomato foliage to prevent blight.'
    },
    recommendedWateringTime: {
      el: '06:15 - 07:30',
      en: '06:15 - 07:30 AM'
    }
  },
  {
    id: 'chania',
    name: { el: 'Χανιά (Κρήτη)', en: 'Chania (Crete)' },
    region: { el: 'Κρήτη', en: 'Crete' },
    temp: 32,
    condition: { el: 'Θερμός & Ηλιόλουστος', en: 'Warm & Sunny', icon: 'Sun' },
    humidity: 48,
    uvIndex: 10,
    uvLevel: { el: '10 (Extreme)', en: '10 (Extreme)', color: 'text-red-500' },
    evapotranspiration: 7.2,
    solarRadiation: 960,
    windSpeed: 16,
    soilMoistureLevel: 28,
    smartTip: {
      el: 'Αυξημένες ανάγκες άρδευσης σε εσπεριδοειδή & ελιές σε γλάστρες. Ρυθμίστε το IoT στάγδην πότισμα σε 2 κύκλους ανά ημέρα.',
      en: 'Increased irrigation needs for potted citrus and olive trees. Set smart drip irrigation to 2 cycles per day.'
    },
    recommendedWateringTime: {
      el: '05:45 - 07:00 & 21:00',
      en: '05:45 - 07:00 & 21:00'
    }
  },
  {
    id: 'patras',
    name: { el: 'Πάτρα (Αχαΐα)', en: 'Patras (Achaea)' },
    region: { el: 'Δυτική Ελλάδα', en: 'Western Greece' },
    temp: 30,
    condition: { el: 'Ηλιοφάνεια με αύρα', en: 'Sunny with Breeze', icon: 'Sun' },
    humidity: 50,
    uvIndex: 8,
    uvLevel: { el: '8 (High)', en: '8 (High)', color: 'text-amber-500' },
    evapotranspiration: 6.1,
    solarRadiation: 870,
    windSpeed: 12,
    soilMoistureLevel: 36,
    smartTip: {
      el: 'Ευνοϊκός καιρός για κλάδεμα κορυφολόγησης σε βασιλικούς και δυόσμους για πυκνή διακλάδωση.',
      en: 'Favorable weather for pinching basil and mint tips to promote bushy lateral growth.'
    },
    recommendedWateringTime: {
      el: '06:00 - 07:15',
      en: '06:00 - 07:15 AM'
    }
  }
];

export function getRelativeGreekDate(daysAgo: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const ARTICLES_DATA: Article[] = [
  {
    id: '1',
    slug: 'astiko-mpalkoni-aftomato-potisma-iot',
    title: {
      el: 'Έξυπνο Αυτόματο Πότισμα στο Ελληνικό Μπαλκόνι: Ο Απόλυτος Οδηγός Μελέτης, Εξατμισοδιαπνοής & IoT',
      en: 'Smart Balcony Drip Irrigation: The Ultimate Guide to Evapotranspiration, Hydraulics & IoT'
    },
    category: 'irrigation_iot',
    categoryLabel: { el: 'Αυτόματο Πότισμα & IoT', en: 'Smart Irrigation & IoT' },
    readTime: '10 min',
    difficulty: 'medium',
    difficultyLabel: { el: 'Μέτριο', en: 'Medium' },
    date: getRelativeGreekDate(0),
    author: {
      name: 'Κώστας Αναστασιάδης',
      role: { el: 'Γεωπόνος & IoT Specialist', en: 'Agronomist & IoT Specialist' },
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000&auto=format&fit=crop&q=80',
    summary: {
      el: 'Πλήρης τεχνικός οδηγός για εγκατάσταση στάγδην άρδευσης με αυτορυθμιζόμενους σταλάκτες (PC), υπολογισμό εξάτμισης ανά όγκο γλάστρας, έξυπνους προγραμματιστές Bluetooth/WiFi και προστασία από καύσωνες.',
      en: 'Complete technical guide to micro-drip irrigation sizing, pressure-compensating emitters, evapotranspiration calculation per container, and smart Bluetooth/WiFi timers.'
    },
    content: {
      el: `Το ελληνικό καλοκαίρι θέτει ακραίες υδρολογικές απαιτήσεις για τα φυτά σε γλάστρες. Η συνδυασμένη επίδραση υψηλής θερμοκρασίας (35-42°C), πολύ χαμηλής σχετικής υγρασίας (<35%) και έντονων καλοκαιρινών ανέμων (μελτέμια 5-7 μποφόρ) εκτοξεύει την εξατμισοδιαπνοή αναφοράς (ET0) πάνω από 6.5 έως 8.2 mm ημερησίως.

---

### 1. Γιατί το κλασικό αναλογικό ρολόι αποτυγχάνει
Τα απλά μηχανικά ρολόγια βρύσης ποτίζουν με σταθερό χρόνο ανεξάρτητα από τις καιρικές συνθήκες. Το αποτέλεσμα είναι:
- **Υπο-άρδευση** κατά τη διάρκεια καύσωνα, οδηγώντας σε μόνιμο σημείο μάρανσης και θερμικό στρες.
- **Υπερ-άρδευση** σε συννεφιασμένες ημέρες ή μετά από βροχή, προκαλώντας ασφυξία στις ρίζες και σήψη από Pythium και Phytophthora.

Οι σύγχρονοι έξυπνοι προγραμματιστές (όπως Gardena Smart, RainPoint WiFi, LinkTap ή Tuya Zigbee) συνδέονται σε τοπικά μετεωρολογικά δεδομένα και προσαρμόζουν αυτόματα τον χρόνο ποτίσματος βάσει της πραγματικής εξάτμισης.

---

### 2. Υδραυλικός Σχεδιασμός: Κεντρικός Σωλήνας & Σταλάκτες

#### Α. Ο βασικός σκελετός του δικτύου
* **Μειωτής Πίεσης (Pressure Regulator):** Απαραίτητος στη βρύση! Ρυθμίζει την πίεση του δικτύου στα 1.5 - 1.8 bar, αποτρέποντας το σκάσιμο των συνδέσεων.
* **Κεντρικός Σωλήνας LDPE Φ16mm (τυφλός):** Τρέχει περιμετρικά σε όλο το μήκος του μπαλκονιού. Μην χρησιμοποιείτε λεπτό σωληνάκι 6mm για μεγάλες αποστάσεις, καθώς παρουσιάζει τεράστια πτώση πίεσης μετά τα πρώτα 3 μέτρα.
* **Μικροσωληνάκια Φ6mm (Spaghetti):** Ξεκινούν από τον κεντρικό Φ16mm με ειδικά ρακόρ λήψης και οδηγούν το νερό σε κάθε γλάστρα (μέγιστο μήκος ανά λήψη: 60-80 cm).

#### Β. Επιλογή Σταλακτών (Drippers)
Χρησιμοποιείτε **αποκλειστικά αυτορυθμιζόμενους σταλάκτες πίεσης (Pressure Compensating - PC)**. Οι απλοί ρυθμιζόμενοι σταλάκτες τύπου βίδας βγάζουν τεράστια ποσότητα στην αρχή της γραμμής και σταγονίδια στο τέλος.
* **Μικρές γλάστρες (διάμετρος έως 20cm):** 1 σταλάκτης PC παροχής 2 L/h.
* **Μεσαίες γλάστρες & ζαρντινιέρες (25-35cm):** 2 σταλάκτες PC των 2 L/h (συνολικά 4 L/h) τοποθετημένοι διαμετρικά αντίθετα.
* **Μεγάλες γλάστρες / Δέντρα σε πιθάρια (40-60cm):** 3-4 σταλάκτες PC των 4 L/h (συνολικά 12-16 L/h) ή δακτύλιος σταλακτηφόρου σωλήνα.

---

### 3. Πίνακας Υπολογισμού Διάρκειας Ποτίσματος

* **Αρωματικά (Βασιλικός, Δυόσμος) σε 5-10L:** 1x 2 L/h PC -> 6-8 λεπτά κανονικά (12-15 λεπτά σε καύσωνα).
* **Καλλωπιστικά (Γαρδένια, Ορτανσία) σε 15-25L:** 2x 2 L/h PC -> 12-15 λεπτά κανονικά (22-25 λεπτά σε καύσωνα).
* **Λαχανικά (Ντομάτα, Πιπεριά) σε 20-30L:** 2x 2 L/h PC -> 15-18 λεπτά κανονικά (28-32 λεπτά σε καύσωνα).
* **Καρποφόρα (Λεμονιά, Ελιά) σε 50-80L:** 3x 4 L/h PC -> 20-25 λεπτά κανονικά (35-40 λεπτά σε καύσωνα).

---

### 4. Το Ιδανικό Χρονοδιάγραμμα Άρδευσης για την Ελλάδα
* **Ώρα Έναρξης:** Ποτίζετε αυστηρά μεταξύ **05:30 και 07:00 το πρωί**.
* **Σε Περιόδους Ακραίου Καύσωνα:** Εφαρμόστε **διακεκομμένη άρδευση (pulse irrigation)**:
  * 1ος κύκλος: 06:00 π.μ. (60% της ημερήσιας δόσης)
  * 2ος κύκλος: 20:30 μ.μ. (40% της ημερήσιας δόσης)
* **Τι να αποφεύγετε:** Μην ποτίζετε ποτέ μεταξύ 12:00 και 17:00 (το ζεστό νερό μέσα στους σωλήνες μπορεί να φτάσει τους 50°C και να κάψει το ριζικό σύστημα).`,
      en: `Complete technical guide to micro-drip irrigation sizing, pressure-compensating emitters, evapotranspiration calculation per container, and smart Bluetooth/WiFi timers.`
    },
    keyTakeaways: {
      el: [
        'Χρησιμοποιείτε αποκλειστικά αυτορυθμιζόμενους σταλάκτες πίεσης (PC Drippers) για ομοιόμορφη παροχή.',
        'Ποτίζετε νωρίς το πρωί (05:30 - 07:00) για εξοικονόμηση νερού έως και 40% και αποφυγή θερμικού σοκ.',
        'Τοποθετήστε μειωτή πίεσης 1.5 bar στη βρύση για να αποτρέψετε αποσυνδέσεις υπό πίεση.',
        'Εφαρμόστε ελαφρόπετρα ή φλοιό πεύκου (mulching) στην επιφάνεια του χώματος για διατήρηση της υγρασίας.'
      ],
      en: [
        'Use pressure-compensating (PC) drippers for equal flow across all containers.',
        'Water early in the morning (05:30 - 07:00) to cut evaporation losses by 40%.',
        'Install a 1.5 bar pressure regulator at the faucet to prevent line blowouts.',
        'Apply organic mulching (pine bark or volcanic pumice) to lock in soil moisture.'
      ]
    },
    socialScriptReady: true,
    socialScriptPreview: {
      hook: 'Σταμάτα να ποτίζεις τις γλάστρες σου με το λάστιχο το μεσημέρι! Εδώ είναι ο σωστός IoT οδηγός.',
      caption: 'Πώς να φτιάξεις επαγγελματικό αυτόματο πότισμα στο μπαλκόνι με σωλήνα Φ16, σταλάκτες PC και προγραμματιστή Bluetooth.',
      hashtags: ['#SmartGardenGR', '#GardeningGreece', '#MpalkoniHacks', '#Potisma', '#SmartIrrigation']
    },
    likes: 184,
    featured: true
  },
  {
    id: '2',
    slug: 'gardenia-kitrina-fylla-aitia-antimetopisi',
    title: {
      el: 'Κιτρίνισαν τα Φύλλα της Γαρδένιας & των Οξύφιλων; Ο Απόλυτος Οδηγός Χλώρωσης Σιδήρου & pH',
      en: 'Gardenia & Acid-Loving Plants: Complete Guide to Iron Chlorosis, Tap Water & Soil pH'
    },
    category: 'balcony',
    categoryLabel: { el: 'Μπαλκόνι & Γλάστρες', en: 'Balcony & Pots' },
    readTime: '9 min',
    difficulty: 'easy',
    difficultyLabel: { el: 'Εύκολο', en: 'Easy' },
    date: getRelativeGreekDate(0),
    author: {
      name: 'Μαρία Παπαδοπούλου',
      role: { el: 'Γεωπόνος Ανθοκομίας', en: 'Horticulturalist' },
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
    },
    image: 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=1000&auto=format&fit=crop&q=80',
    summary: {
      el: 'Πλήρης διαγνωστικός οδηγός για Γαρδένια, Καμέλια, Ορτανσία και Αζαλέα: Διαφορά χηλικού σιδήρου EDDHA vs EDTA, ρύθμιση pH χώματος, σκληρότητα νερού βρύσης και αποφυγή πτώσης μπουμπουκιών.',
      en: 'Complete diagnosis and care guide for acid-loving plants: EDDHA vs EDTA chelated iron, soil acidification, managing alkaline city tap water, and curing leaf yellowing.'
    },
    content: {
      el: `Η γαρδένια (Gardenia jasminoides), η καμέλια (Camellia japonica), η ορτανσία (Hydrangea macrophylla) και η αζαλέα ανήκουν στην κατηγορία των **οξύφιλων φυτών**. Απαιτούν όξινο περιβάλλον ριζών με pH μεταξύ **5.0 και 5.8** προκειμένου να απορροφήσουν θρεπτικά στοιχεία, ιδίως τον σίδηρο (Fe), το μαγγάνιο (Mn) και το μαγνήσιο (Mg).

Στην Ελλάδα, το νερό της βρύσης στις περισσότερες πόλεις είναι πλούσιο σε ανθρακικό ασβέστιο (σκληρό νερό με pH 7.5 - 8.2). Μετά από λίγους μήνες ποτίσματος, το χώμα της γλάστρας αλκαλοποιείται, δεσμεύοντας τον σίδηρο σε αδιάλυτη μορφή.

---

### 1. Διαγνωστικός Οδηγός Συμπτωμάτων
- **Κίτρινο έλασμα με έντονα πράσινα νεύρα (μόνο στα νέα φύλλα):** Τροφοπενία Σιδήρου (Χλώρωση) λόγω αλκαλικού pH χώματος -> Εφαρμογή **χηλικού σιδήρου EDDHA** (κόκκινη σκόνη) στη ρίζα.
- **Γενικό κιτρίνισμα & πτώση κατώτερων φύλλων:** Ασφυξία ριζών από υπερβολικό πότισμα ή στάσιμο νερό στο πιατάκι -> Αδειάστε αμέσως το πιατάκι και αφήστε το χώμα να στεγνώσει 2-3 μέρες.
- **Ξηρά καφέ περιφερειακά καψίματα στις άκρες των φύλλων:** Συσσώρευση αλάτων ή καυτό ρεύμα αέρα / μελτέμι -> Έκπλυση με απιονισμένο νερό και μετακίνηση σε απάνεμο σημείο.
- **Μαύρισμα και πρόωρη πτώση κλειστών μπουμπουκιών:** Απότομες διακυμάνσεις υγρασίας, έλλειψη καλίου ή μετακίνηση της γλάστρας -> Σταθεροποιήστε τη θέση της γλάστρας και εφαρμόστε λίπασμα οξύφιλων.

---

### 2. Χηλικός Σίδηρος: Γιατί το EDDHA είναι το Μόνο που Λειτουργεί στην Ελλάδα
- **Fe-EDTA (ή Fe-DTPA):** Αποδομείται ταχύτατα σε pH πάνω από 6.5. Στο σκληρό ελληνικό νερό, είναι σχεδόν αδρανές.
- **Fe-EDDHA (Κόκκινη/Βυσσινί σκόνη):** Παραμένει 100% σταθερό και πλήρως απορροφήσιμο ακόμα και σε εξαιρετικά αλκαλικά εδάφη με **pH έως 9.0**.

**Δοσολογία Εφαρμογής:**
Διαλύστε **1 κοφτό κουταλάκι του γλυκού (3-5 γραμμάρια)** Fe-EDDHA σε 5 λίτρα νερό. Ποτίστε τη γαρδένια νωρίς το πρωί σε ήδη ελαφρώς υγρό χώμα μία φορά κάθε 15-20 ημέρες από τον Μάρτιο έως τον Οκτώβριο.

---

### 3. Το Ιδανικό Υπόστρωμα Μεταφύτευσης
* **60% Καστανόχωμα / Ξανθιά Τύρφη (Acid Peat)** με αναγραφόμενο pH 4.5 - 5.5.
* **20% Περλίτης ή Ελαφρόπετρα** για μέγιστο αερισμό ριζών.
* **20% Φλοιός Πεύκου (λεπτοκομμένος)** για φυσική οξίνιση και αντιμυκητιακή προστασία.
* **Στρώση Αποστράγγισης:** 3-4 cm ελαφρόπετρα στον πάτο της γλάστρας.`,
      en: `Acid-loving plants like Gardenia, Camellia, and Hydrangea require low soil pH (5.0 - 5.8) to uptake critical micronutrients, especially Iron and Magnesium.`
    },
    keyTakeaways: {
      el: [
        'Χρησιμοποιείτε πάντα χηλικό σίδηρο EDDHA (κόκκινη σκόνη), καθώς παραμένει ενεργός σε σκληρό αλκαλικό νερό βρύσης.',
        'Μην αφήνετε ποτέ στάσιμο νερό στο πιατάκι της γλάστρας πάνω από 15 λεπτά μετά το πότισμα.',
        'Τοποθετήστε τα οξύφιλα σε θέση με ανατολικό πρωινό φως και πλήρη προστασία από τον καυτό μεσημεριανό ήλιο.',
        'Ποτίζετε με όξινο υπόστρωμα τύρφης (pH 5.0 - 5.5) και προσθέστε φλοιό πεύκου στην επιφάνεια.'
      ],
      en: [
        'Always apply EDDHA chelated iron for swift uptake in alkaline conditions.',
        'Never let standing water sit in the saucer longer than 15 minutes.',
        'Place gardenias in morning eastern light and shield from harsh afternoon sun.',
        'Maintain soil acidity using blonde peat moss and pine bark mulching.'
      ]
    },
    socialScriptReady: true,
    likes: 274,
    featured: true
  },
  {
    id: '3',
    slug: 'robotic-mowers-guide-ellada-2026',
    title: {
      el: 'Ρομποτικά Χλοοκοπτικά 2026: Χωρίς Καλώδιο με RTK-GPS, 3D LiDAR & AI Όραση σε Ελληνικούς Κήπους',
      en: 'Wire-Free Robotic Mowers 2026: RTK-GPS, 3D LiDAR & AI Vision in Mediterranean Gardens'
    },
    category: 'robotic_mowers',
    categoryLabel: { el: 'Ρομποτικά Mowers', en: 'Robotic Mowers' },
    readTime: '10 min',
    difficulty: 'advanced',
    difficultyLabel: { el: 'Προχωρημένο', en: 'Advanced' },
    date: getRelativeGreekDate(1),
    author: {
      name: 'Νίκος Σταματάκης',
      role: { el: 'Tech Editor & Landscape Designer', en: 'Tech Editor & Landscape Designer' },
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    image: 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?w=1000&auto=format&fit=crop&q=80',
    summary: {
      el: 'Πλήρης οδηγός επιλογής ρομποτικής χλοοκοπτικής μηχανής χωρίς περιμετρικό καλώδιο: Σύγκριση τεχνολογιών RTK-GNSS vs 3D LiDAR, διαχείριση κλίσεων, ριζών ελιάς, πολλαπλών ζωνών και οικολογικού mulching.',
      en: 'Comprehensive wire-free robotic mower buying guide: RTK-GNSS vs solid-state 3D LiDAR, handling olive roots, steep inclines, multi-zone pathways, and organic micro-mulching.'
    },
    content: {
      el: `Το 2026 σηματοδοτεί την οριστική κατάργηση του παραδοσιακού περιμετρικού καλωδίου (perimeter wire). Οι νέες γενιές ρομποτικών χλοοκοπτικών συνδυάζουν **δορυφορικό εντοπισμό RTK-GNSS ακρίβειας 1-2 εκατοστών**, **στερεάς κατάστασης 3D LiDAR** και **κάμερες AI Deep Learning**, επιτρέποντας πλήρη χαρτογράφηση του κήπου μέσα από το smartphone σε μόλις 15 λεπτά.

---

### 1. Σύγκριση Τεχνολογιών Πλοήγησης Χωρίς Καλώδιο
* **RTK-GNSS + AI Vision (Segway Navimow, Husqvarna EPOS, Mammotion Luba 2):** Εξαιρετική ακρίβεια σε ανοιχτούς χώρους, χαμηλό κόστος, γρήγορη χαρτογράφηση.
* **3D Solid-State LiDAR (Dreame A1, Ecovacs GOAT):** Λειτουργεί ανεξάρτητα από δορυφόρους και καιρικές συνθήκες (ακόμα και σε απόλυτο σκοτάδι ή κάτω από πυκνά πεύκα/πλατάνια).
* **AI Binocular Vision:** Καμία ανάγκη τοποθέτησης κεραίας βάσης RTK. Αναγνωρίζει αυτόματα τα όρια του χλοοτάπητα.

---

### 2. Διαχείριση Προκλήσεων σε Μεσογειακούς Κήπους
- **Ρίζες Δέντρων & Ανώμαλο Έδαφος:** Σε κήπους με παλιές ελιές, επιλέξτε μοντέλο με τετρακίνηση (AWD) όπως το Mammotion Luba 2 AWD, ή ορίστε ψηφιακές No-Go Zones γύρω από τους κορμούς.
- **Κλίσεις Εδάφους:** Σε κλίσεις άνω του 40% (22 μοίρες), απαιτείται τετρακίνητο ρομπότ (AWD) με ανεξάρτητους κινητήρες σε κάθε τροχό.
- **Πολλαπλές Ζώνες:** Σχεδιάστε εύκολα διαύλους μετάβασης πάνω από πλακόστρωτα μονοπάτια χωρίς να χαλάσουν τα μαχαίρια κοπής.

---

### 3. Το Οικολογικό Όφελος του Micro-Mulching
Τα ρομποτικά χλοοκοπτικά κόβουν μόνο 1-3 mm γρασιδιού καθημερινά. Αυτά τα μικροσκοπικά υπολείμματα πέφτουν ανάμεσα στις ρίζες, αποσυντίθενται μέσα σε 48 ώρες και:
1. **Επιστρέφουν το 25-30% του απαιτούμενου Αζώτου** πίσω στο έδαφος με φυσικό τρόπο.
2. **Μειώνουν την εξάτμιση νερού από το χώμα κατά 20%**, λειτουργώντας ως φυσικό στρώμα σκίασης.
3. **Εξαφανίζουν τα πλατύφυλλα ζιζάνια**, καθώς το συνεχές κούρεμα δεν τους επιτρέπει να ανθίσουν.`,
      en: `Wire-free robotic mowers with RTK-GNSS and 3D LiDAR eliminate boundary wire burying, adapting dynamically to complex landscape layouts.`
    },
    keyTakeaways: {
      el: [
        'Τα ρομποτικά mowers χωρίς καλώδιο μειώνουν τον χρόνο εγκατάστασης από 8 ώρες σε 15 λεπτά μέσω εφαρμογής.',
        'Για κήπους με πυκνά δέντρα και σκιά, προτιμήστε 3D LiDAR ή υβριδικό σύστημα RTK + AI κάμερας.',
        'Το καθημερινό micro-mulching επιστρέφει οργανικό άζωτο στο έδαφος και μειώνει την ανάγκη για πότισμα.',
        'Σε εδάφη με κλίση άνω του 40% επιλέξτε τετρακίνητο μοντέλο (AWD) για αποφυγή ολίσθησης.'
      ],
      en: [
        'Wire-free mowers cut setup time down to 15 minutes via smartphone mapping.',
        'For shaded gardens with heavy tree cover, choose 3D LiDAR or hybrid RTK+AI vision.',
        'Daily micro-mulching recycles organic nitrogen back into the soil naturally.',
        'Select an AWD model for inclines exceeding 40% to prevent wheel slippage.'
      ]
    },
    socialScriptReady: true,
    likes: 138,
    featured: false
  },
  {
    id: '4',
    slug: 'laxanokipos-sto-mpalkoni-ntomates-piperies',
    title: {
      el: 'Βιολογικός Λαχανόκηπος σε Γλάστρες: Ολοκληρωμένος Οδηγός για Ντοματίνια, Πιπεριές & Αγγούρια',
      en: 'Organic Container Vegetable Garden: Comprehensive Guide for Balcony Tomatoes & Peppers'
    },
    category: 'vegetable_garden',
    categoryLabel: { el: 'Λαχανόκηπος', en: 'Vegetable Garden' },
    readTime: '9 min',
    difficulty: 'easy',
    difficultyLabel: { el: 'Εύκολο', en: 'Easy' },
    date: getRelativeGreekDate(2),
    author: {
      name: 'Μαρία Παπαδοπούλου',
      role: { el: 'Γεωπόνος Ανθοκομίας', en: 'Horticulturalist' },
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
    },
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?w=1000&auto=format&fit=crop&q=80',
    summary: {
      el: 'Πώς να στήσετε έναν υπερπαραγωγικό αστικό λαχανόκηπο σε γλάστρες: Επιλογή ποικιλιών, μίγμα υποστρώματος πλούσιο σε οργανική ουσία, κλάδεμα/ξεβλαστάρωμα και βιολογική φυτοπροστασία χωρίς φυτοφάρμακα.',
      en: 'How to build a high-yielding balcony vegetable garden: cultivar selection, organic compost substrates, sucker pruning, and 100% organic pest prevention.'
    },
    content: {
      el: `Ακόμα και σε ένα μπαλκόνι 4-6 τετραγωνικών μέτρων στην πόλη, μπορείτε να παράγετε πεντανόστιμα, 100% βιολογικά ντοματίνια, τραγανά αγγουράκια και πιπεριές από τον Μάιο έως τα τέλη Οκτωβρίου.

---

### 1. Επιλογή Γλάστρας & Ποικιλιών
* **Ντομάτα & Μελιτζάνα:** Απαιτούν γλάστρα τουλάχιστον **20-25 λίτρων** ανά φυτό (βάθος 30-35 cm).
* **Πιπεριές:** 15-20 λίτρα ανά φυτό.
* **Αγγούρι (αναρριχώμενο σε καλαμωτή):** 15-20 λίτρα ανά φυτό.
* **Ποικιλίες:** Προτιμήστε *Cherry* ντοματίνια (Sweet 100, Black Cherry, Vilma) που δένουν εύκολα καρπό στη ζέστη.

---

### 2. Το Ιδανικό Μίγμα Υποστρώματος
* **45% Εμπλουτισμένο φυτόχωμα λαχανικών** (με τύρφη).
* **30% Ώριμο Bio-Compost ή Χούμο Γαιοσκωλήκων** (παρέχει φυσική οργανική ουσία και ωφέλιμους μικροοργανισμούς).
* **15% Περλίτης** (εξασφαλίζει οξυγόνο στις ρίζες).
* **10% Ζεόλιθος ή Ελαφρόπετρα** (δεσμεύει και αποδεσμεύει σταδιακά τα θρεπτικά στοιχεία).

---

### 3. Τεχνική Κλαδέματος: Ξεβλαστάρωμα (Suckering)
Στις αναρριχώμενες ντομάτες, αφαιρούμε τους πλάγιους παραβλαστούς ("μασχαλιάρια") μόλις φτάσουν τα 3-5 cm. Έτσι όλη η ενέργεια πηγαίνει στην ανθοφορία και το μέγεθος των καρπών.

---

### 4. Βιολογική Φυτοπροστασία (Συνταγές Σπιτιού)
- **Αφίδες (Μελίγκρα):** 1 Λίτρο νερό + 10 ml πράσινο σαπούνι + 5 ml οινόπνευμα. Ψεκασμός αργά το σούρουπο.
- **Τετράνυχος:** Βιολογικό Έλαιο Neem (Neem Oil 0.3%) με καλό κατάβρεγμα της κάτω πλευράς των φύλλων.
- **Κάμπιες & Tuta absoluta:** Βάκιλος Θουριγγίας (Bacillus thuringiensis) - 100% βιολογικό.
- **Ωίδιο (Άσπρη σκόνη):** 1 Λίτρο νερό + 5 gr μαγειρική σόδα + 3 σταγόνες ελαιόλαδο.`,
      en: `Comprehensive blueprint for high-density balcony organic vegetable production. Covers pot sizing, porous organic substrates, tomato sucker pruning, and 100% bio-organic homemade sprays for aphids and powdery mildew.`
    },
    keyTakeaways: {
      el: [
        'Χρησιμοποιείτε γλάστρες τουλάχιστον 20-25 λίτρων ανά φυτό ντομάτας με εξαιρετική αποστράγγιση.',
        'Αφαιρείτε τακτικά τους πλάγιους παραβλαστούς (ξεβλαστάρωμα) για μεγαλύτερους και πιο γλυκούς καρπούς.',
        'Καταπολεμήστε αφίδες και τετράνυχο με σαπούνι καλίου και neem oil χωρίς καθόλου χημικά φάρμακα.',
        'Συνδυάστε ντομάτα με βασιλικό και κατιφέδες στην ίδια γλάστρα για φυσική εντομοαπώθηση.'
      ],
      en: [
        'Use minimum 20-25 liter containers per tomato plant.',
        'Prune suckers early to direct nutrients toward fruit cluster development.',
        'Deter aphids with potassium soap and neem oil without chemical pesticides.',
        'Plant sweet basil and marigolds as companion plants for natural pest control.'
      ]
    },
    socialScriptReady: true,
    likes: 342,
    featured: false
  },
  {
    id: '5',
    slug: 'esperidoeidi-se-glastra-lemonia-koumkuat-frontida',
    title: {
      el: 'Λεμονιά & Εσπεριδοειδή σε Γλάστρα: Πώς να Έχετε Άφθονα Λεμόνια Χωρίς να Πέφτουν τα Άνθη',
      en: 'Potted Citrus Care: Growing Abundant Lemons & Kumquats on Mediterranean Verandas'
    },
    category: 'plant_care',
    categoryLabel: { el: 'Φροντίδα Φυτών', en: 'Plant Care' },
    readTime: '8 min',
    difficulty: 'medium',
    difficultyLabel: { el: 'Μεσαίο', en: 'Medium' },
    date: getRelativeGreekDate(3),
    author: {
      name: 'Κώστας Αναστασιάδης',
      role: { el: 'Γεωπόνος & IoT Specialist', en: 'Agronomist & IoT Specialist' },
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=1000&auto=format&fit=crop&q=80',
    summary: {
      el: 'Γιατί πέφτουν τα μικρά λεμονάκια και τα άνθη, σωστό πρόγραμμα λίπανσης με NPK & ιχνοστοιχεία (ψευδάργυρος/μαγνήσιο), καταπολέμηση φυλλοκνίστη και προστασία από παγετό.',
      en: 'Why potted citrus trees drop their fruitlets and blossoms, balanced NPK fertilization schedules, citrus leafminer control, and winter frost shielding.'
    },
    content: {
      el: `Η λεμονιά (Citrus limon), το κουμκουάτ και το καλαμοντίν είναι από τα πιο εντυπωσιακά και αρωματικά καρποφόρα δέντρα για το ελληνικό μπαλκόνι.

---

### 1. Γιατί πέφτουν τα άνθη και τα μικρά λεμονάκια (Fruit Drop);
* **Αιτία 1: Ακανόνιστο Πότισμα.** Το δέντρο πρέπει να ποτίζεται βαθιά και σταθερά. Αν διψάσει έντονα και μετά πλημμυρίσει, αποβάλλει αμέσως τους καρπούς.
* **Αιτία 2: Έλλειψη Θρεπτικών Στοιχείων.** Το δέντρο χρειάζεται ισορροπημένο Άζωτο, Κάλιο και Ιχνοστοιχεία (Ψευδάργυρο Zn, Βόριο B και Μαγνήσιο Mg).
* **Αιτία 3: Έντονα Θερμά Ρεύματα Αέρα.** Τα καλοκαιρινά μελτέμια αφυδατώνουν τα τρυφερά κοτσανάκια των νεαρών καρπών.

---

### 2. Πρόγραμμα Λίπανσης
* **Άνοιξη (Μάρτιος - Μάιος):** NPK 20-20-20 + Ιχνοστοιχεία κάθε 15 ημέρες για έντονη βλάστηση και ανθοφορία.
* **Καλοκαίρι (Ιούνιος - Αύγουστος):** Λίπασμα πλούσιο σε Κάλιο (π.χ. NPK 12-12-36) για μέγεθος και χυμό καρπών.
* **Φθινόπωρο:** Χηλικός σίδηρος και εκχύλισμα φυκιών για ενδυνάμωση ριζών.

---

### 3. Αντιμετώπιση Εχθρών (Φυλλοκνίστης & Ψώρα)
- **Φυλλοκνίστης (κατσαρά φύλλα με ασημένιες στοές):** Ψεκασμός με Βιολογικό Έλαιο Neem ή Θερινό Ορυκτέλαιο στη νέα βλάστηση.
- **Ψώρα (Κοκκοειδή):** Καθαρισμός κλαδιών με βαμβάκι με πράσινο σαπούνι και οινόπνευμα.`,
      en: `Essential guide for abundant potted citrus harvest. Diagnosing premature fruit drop, balanced NPK micro-fertilization schedules, controlling citrus leafminer with neem oil, and winter frost wrapping.`
    },
    keyTakeaways: {
      el: [
        'Διατηρείτε σταθερό πρόγραμμα ποτίσματος για να αποτρέψετε την πτώση των μικρών καρπών.',
        'Εφαρμόζετε λίπασμα με ιχνοστοιχεία (ψευδάργυρο, βόριο και σίδηρο) από τον Μάρτιο έως τον Οκτώβριο.',
        'Προστατέψτε τη νέα βλάστηση από τον φυλλοκνίστη με έλαιο neem ή θερινό ορυκτέλαιο.',
        'Τυλίξτε τη γλάστρα με αντιπαγετικό ύφασμα τον χειμώνα σε θερμοκρασίες κάτω από 0°C.'
      ],
      en: [
        'Maintain uniform moisture to prevent physiological fruitlet shedding.',
        'Fertilize with balanced NPK plus Zinc and Boron from spring to autumn.',
        'Shield new flushes from citrus leafminer using organic neem oil.',
        'Wrap containers with horticultural fleece when frost threatens.'
      ]
    },
    socialScriptReady: true,
    likes: 215,
    featured: false
  },
  {
    id: '6',
    slug: 'aromatika-fyta-ellada-frontida-kalokairi',
    title: {
      el: 'Βασιλικός, Δεντρολίβανο, Ρίγανη & Θυμάρι: Πλήρης Οδηγός Φροντίδας, Κλαδέματος & Συγκομιδής',
      en: 'Mediterranean Culinary Herbs: Complete Care, Pruning, Harvesting & Essential Oils Guide'
    },
    category: 'plant_care',
    categoryLabel: { el: 'Φροντίδα Φυτών', en: 'Plant Care' },
    readTime: '8 min',
    difficulty: 'easy',
    difficultyLabel: { el: 'Εύκολο', en: 'Easy' },
    date: getRelativeGreekDate(4),
    author: {
      name: 'Κώστας Αναστασιάδης',
      role: { el: 'Γεωπόνος & IoT Specialist', en: 'Agronomist & IoT Specialist' },
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1000&auto=format&fit=crop&q=80',
    summary: {
      el: 'Ο διαχωρισμός αναγκών ανάμεσα στα μεσογειακά ξυλώδη (δεντρολίβανο/θυμάρι) και τα πλατύφυλλα (βασιλικός/δυόσμος), τεχνικές κορυφολογήματος (pinching) και σωστή αποξήραση.',
      en: 'Understanding the hydrological split between drought-hardy woody herbs and moisture-loving basil, flower pinching methods, and preserving maximum essential oils.'
    },
    content: {
      el: `Τα μεσογειακά αρωματικά φυτά είναι η ψυχή της ελληνικής χλωρίδας.

Πρέπει να διαχωρίζουμε αυστηρά δύο βασικές ομάδες:
1. **Τα Ξυλώδη Μεσογειακά Σκληροφυλλικά:** Δεντρολίβανο, Ρίγανη, Θυμάρι, Φασκόμηλο, Λεβάντα.
2. **Τα Πλατύφυλλα Υδρόφιλα Αρωματικά:** Βασιλικός, Δυόσμος, Μαϊντανός.

---

### 1. Διαφορές στη Διαχείριση
* **Δεντρολίβανο, Θυμάρι, Ρίγανη:** Ποτίζουμε μόνο όταν το χώμα στεγνώσει εντελώς σε βάθος 4-5 cm. Απαιτούν φτωχό, πολύ καλά στραγγιζόμενο μίγμα (με άμμο/περλίτη) και πλήρη ήλιο.
* **Βασιλικός, Δυόσμος:** Απαιτούν καθημερινό πότισμα το καλοκαίρι, πλούσιο οργανικό χώμα και ελαφριά σκιά τις μεσημεριανές ώρες του Αυγούστου.

---

### 2. Το Μυστικό του Κορυφολογήματος (Pinching)
Μόλις ο βασιλικός βγάλει τα λευκά ανθικά στάχυα στην κορυφή, κόψτε τα αμέσως με κοφτερό ψαλίδι πάνω από το 2ο ζευγάρι φύλλων. Έτσι το φυτό θα συνεχίσει να βγάζει νέα, τρυφερά φύλλα αντί να ξυλοποιηθεί.

---

### 3. Συγκομιδή & Αποξήραση
* **Ώρα Συγκομιδής:** 09:00 - 10:30 το πρωί, αφού στεγνώσει η πρωινή δροσιά (τότε τα αιθέρια έλαια είναι στο αποκορύφωμά τους).
* **Αποξήραση:** Σε σκιερό, καλά αεριζόμενο μέρος (ποτέ απευθείας στον ήλιο).`,
      en: `Comprehensive handbook on growing Mediterranean herbs in containers. Contrasting water-sipping woody perennials (rosemary, thyme, oregano) with moisture-loving broadleaf annuals (basil, mint), pinch-pruning techniques, and optimal drying methods.`
    },
    keyTakeaways: {
      el: [
        'Μην φυτεύετε ποτέ δεντρολίβανο και βασιλικό στην ίδια γλάστρα (έχουν εκ διαμέτρου αντίθετες ανάγκες νερού).',
        'Κορυφολογείτε συνεχώς τα άνθη του βασιλικού για να διατηρείτε τα φύλλα τρυφερά και αρωματικά.',
        'Συλλέγετε τα αρωματικά το πρωί (09:00 - 10:30) για μέγιστη περιεκτικότητα σε αιθέρια έλαια.',
        'Αποξηραίνετε πάντα σε σκιερό και καλά αεριζόμενο μέρος, ποτέ κάτω από τον ήλιο.'
      ],
      en: [
        'Never pair rosemary and basil in the same container due to opposing water needs.',
        'Pinch basil flower spikes continuously to stimulate tender aromatic leaf growth.',
        'Harvest herbs mid-morning (09:00 - 10:30) for peak essential oil concentration.',
        'Dry herb bundles in shaded, airy spaces—never in direct sunlight.'
      ]
    },
    socialScriptReady: true,
    socialScriptPreview: {
      hook: 'Κόψε τα άνθη του βασιλικού σου ΤΩΡΑ αν δεν θες να σου ξεραθεί σε μια βδομάδα!',
      caption: 'Το μυστικό του κορυφολογήματος (pinching) και πώς να κάνεις ένα δεντρολίβανο να ζήσει 10 χρόνια στο μπαλκόνι σου.',
      hashtags: ['#HerbsGreece', '#SmartGardenGR', '#Vasilikos', '#Aromatika', '#BalconyGarden']
    },
    likes: 198,
    featured: false
  }
];

export const SOCIAL_SCRIPTS_DATA: SocialScript[] = [
  {
    id: 'script-1',
    title: {
      el: 'Reel/TikTok: 3 Λάθη που σκοτώνουν τα φυτά στο μπαλκόνι τον Αύγουστο',
      en: 'Reel/TikTok: 3 Balcony Plant Mistakes in August Heat'
    },
    platform: 'tiktok',
    category: 'Viral Balcony Tips',
    targetDuration: '35 seconds',
    hook: {
      el: 'Αν έχεις φυτά στο μπαλκόνι, σταμάτα να κάνεις αυτό το λάθος ΑΜΕΣΩΣ! 🛑🌿',
      en: 'If you have plants on your balcony, stop doing this right now! 🛑🌿'
    },
    scriptScenes: [
      {
        timestamp: '0:00 - 0:04',
        visual: {
          el: 'Κοντινό πλάνο σε μαραμένο βασιλικό και μετά στο πρόσωπο που κουνάει το δάχτυλο "όχι".',
          en: 'Close up on wilted basil and camera pan to creator shaking finger "no".'
        },
        voiceover: {
          el: 'Το ήξερες ότι το 80% των φυτών στο ελληνικό μπαλκόνι δεν ξεραίνονται από τον ήλιο, αλλά από αυτό;',
          en: 'Did you know 80% of Mediterranean container plants die from this single mistake?'
        },
        onScreenText: {
          el: '❌ ΛΑΘΟΣ #1: Πότισμα το μεσημέρι',
          en: '❌ MISTAKE #1: Midday Watering'
        }
      },
      {
        timestamp: '0:04 - 0:14',
        visual: {
          el: 'Δείχνουμε το νερό να εξατμίζεται σε ζεστό πήλινο και θερμοκρασία θερμόμετρου 38°C.',
          en: 'Showing water steaming on hot terracotta and digital thermometer 38C.'
        },
        voiceover: {
          el: 'Όταν ποτίζεις 2 το μεσημέρι, το νερό στη γλάστρα βράζει κυριολεκτικά τις ρίζες. Πότισε ΜΟΝΟ 05:30 με 07:00 το πρωί!',
          en: 'When you water at 2 PM, the pot temperature literally bakes the roots. Water early at 6 AM.'
        },
        onScreenText: {
          el: '💧 Σωστή ώρα: 05:30 - 07:00 π.μ.',
          en: '💧 Best time: 05:30 - 07:00 AM'
        }
      },
      {
        timestamp: '0:14 - 0:25',
        visual: {
          el: 'Δείχνουμε πιατάκι γεμάτο στάσιμο νερό κάτω από γαρδένια.',
          en: 'Showing flooded saucer with stagnant water under gardenia.'
        },
        voiceover: {
          el: 'Λάθος δεύτερο: Στάσιμο νερό στο πιατάκι. Αφήνεις το πιατάκι γεμάτο; Οι ρίζες σαπίζουν από ασφυξία σε 48 ώρες.',
          en: 'Mistake two: Standing water in saucers suffocates roots within 48 hours.'
        },
        onScreenText: {
          el: '❌ ΛΑΘΟΣ #2: Στάσιμο νερό στο πιατάκι',
          en: '❌ MISTAKE #2: Stagnant Saucer Water'
        }
      },
      {
        timestamp: '0:25 - 0:35',
        visual: {
          el: 'Δείχνουμε το SmartGarden.gr στο κινητό με το Live IoT Feed και το κουμπί follow.',
          en: 'Displaying SmartGarden.gr telemetry on smartphone.'
        },
        voiceover: {
          el: 'Μπες στο SmartGarden.gr για να δεις τη ζωντανή εξάτμιση στην πόλη σου και ρώτα τον AI Γεωπόνο δωρεάν! Κάνε follow για μέρος 2!',
          en: 'Visit SmartGarden.gr for real-time evapotranspiration in your city. Follow for part 2!'
        },
        onScreenText: {
          el: '🌿 SmartGarden.gr - Link in Bio!',
          en: '🌿 SmartGarden.gr - Link in Bio!'
        }
      }
    ],
    caption: {
      el: 'Πότισες ποτέ το μεσημέρι και αναρωτήθηκες γιατί μαράθηκε το φυτό σου; 🌿 Σώσε αυτό το βίντεο για το επόμενο καύσωνα! Περισσότεροι οδηγοί στο SmartGarden.gr ✨',
      en: 'Did you ever water at noon and wonder why your plants died? 🌿 Save this video for the next heatwave! More guides on SmartGarden.gr ✨'
    },
    hashtags: ['#SmartGardenGR', '#GardeningTips', '#Mpalkoni', '#Fyta', '#PlantTokGreece', '#GreekGardening', '#ViralGreece'],
    callToAction: {
      el: 'Γράψε στα σχόλια ποιο φυτό σου κιτρίνισε φέτος για να σου πει ο AI Γεωπόνος τη λύση!',
      en: 'Drop your wilting plant name in the comments for an instant AI plant doctor diagnosis!'
    }
  },
  {
    id: 'script-2',
    title: {
      el: 'Instagram Carousel: Το Μυστικό για Γαρδένια γεμάτη Μπουμπούκια',
      en: 'Instagram Carousel: Secret to Blooming Gardenias in Greece'
    },
    platform: 'instagram',
    category: 'Balcony Flower Care',
    targetDuration: 'Carousel 6 Slides',
    hook: {
      el: 'Slide 1: Γιατί η γαρδένια σου ρίχνει τα μπουμπούκια πριν ανοίξουν; (Το κόλπο των 3€)',
      en: 'Slide 1: Why gardenias drop flower buds before opening? (The 3€ fix)'
    },
    scriptScenes: [
      {
        timestamp: 'Slide 1',
        visual: { el: 'Φωτογραφία γαρδένιας με κίτρινα φύλλα vs καταπράσινη ανθισμένη.', en: 'Split photo of yellowing vs blooming gardenia.' },
        voiceover: { el: 'Χλώρωση σιδήρου & pH νερού.', en: 'Iron chlorosis & tap water pH.' },
        onScreenText: { el: 'Πώς να κάνεις τη Γαρδένια να ανθίσει ασταμάτητα.', en: 'How to make Gardenia bloom continuously.' }
      },
      {
        timestamp: 'Slide 2',
        visual: { el: 'Σύμβολο βρύσης και κλίμακα pH.', en: 'Tap water icon and pH scale.' },
        voiceover: { el: 'Το νερό της βρύσης μπλοκάρει την απορρόφηση σιδήρου.', en: 'Tap water raises soil alkalinity.' },
        onScreenText: { el: 'Το πρόβλημα: Το ελληνικό σκληρό νερό.', en: 'The issue: Hard alkaline tap water.' }
      },
      {
        timestamp: 'Slide 3',
        visual: { el: 'Χηλικός σίδηρος EDDHA σε κόκκινο χρώμα.', en: 'Red EDDHA iron chelate powder.' },
        voiceover: { el: 'Χρησιμοποίησε χηλικό σίδηρο EDDHA μία φορά κάθε 15 μέρες.', en: 'Use EDDHA iron every 2 weeks.' },
        onScreenText: { el: 'Η λύση: Χηλικός Σίδηρος EDDHA.', en: 'The solution: EDDHA chelate.' }
      }
    ],
    caption: {
      el: 'Η γαρδένια είναι το πιο απαιτητικό αλλά και το πιο εντυπωσιακό φυτό του ελληνικού μπαλκονιού! Σώσε το post για να το έχεις εύκαιρο 🌸💚',
      en: 'Gardenias are demanding yet rewarding. Save this post for your veranda checklist 🌸💚'
    },
    hashtags: ['#Gardenia', '#BalconyGarden', '#SmartGarden', '#GreekPlants', '#Anthokomia', '#GardenLife'],
    callToAction: {
      el: 'Κάνε Save & Share σε κάποιον που του ξεράθηκε η γαρδένια!',
      en: 'Save & Share with a fellow plant lover!'
    }
  }
];

export const ROBOTIC_MOWERS_DATA: RoboticMower[] = [
  {
    id: 'segway-navimow-i105e',
    name: 'Segway Navimow i105E',
    brand: 'Segway',
    badge: 'Best Value Wire-Free 2026',
    coverageM2: 500,
    maxSlope: 30,
    navigation: 'EFLS 2.0 (RTK-GPS + AI Vision Assist)',
    cuttingHeight: '20 - 60 mm (Manual Dial)',
    batteryLife: '60 min (Auto Recharge & Resume)',
    rating: 4.8,
    reviewsCount: 142,
    price: '€999',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?w=600&auto=format&fit=crop&q=80',
    pros: {
      el: [
        'Μηδέν περιμετρικό καλώδιο — χαρτογράφηση με εφαρμογή σε 15 λεπτά',
        'AI κάμερα αναγνωρίζει και αποφεύγει σωλήνες ποτίσματος και ζώα',
        'Εξαιρετική εφαρμογή στα Ελληνικά με live χάρτη κοπής',
        'Πολύ χαμηλό επίπεδο θορύβου (<58 dB)'
      ],
      en: [
        'No boundary wire needed — 15 min app setup',
        'AI camera detects garden hoses, toys, and small animals',
        'Comprehensive mobile app with live satellite map',
        'Ultra-quiet operation (<58 dB)'
      ]
    },
    cons: {
      el: [
        'Χρειάζεται καθαρό οπτικό πεδίο προς τον ουρανό για την κεραία RTK',
        'Μέγιστη κλίση 30% (όχι για έντονα επικλινή οικόπεδα)'
      ],
      en: [
        'Requires clear sky line-of-sight for RTK base antenna',
        '30% max slope limit (not for steep hills)'
      ]
    },
    bestFor: {
      el: 'Ιδανικό για αστικούς κήπους και προαστιακές μονοκατοικίες έως 500 m².',
      en: 'Ideal for suburban residential lawns up to 500 m².'
    },
    affiliateLink: '#'
  },
  {
    id: 'dreame-roboticmower-a1',
    name: 'Dreame Roboticmower A1 Pro',
    brand: 'Dreame Technology',
    badge: 'Top LiDAR Precision',
    coverageM2: 2000,
    maxSlope: 45,
    navigation: 'OmniSense 3D High-Precision LiDAR (No RTK Antenna needed)',
    cuttingHeight: '30 - 70 mm (App Controlled)',
    batteryLife: '120 min',
    rating: 4.9,
    reviewsCount: 88,
    price: '€1,799',
    image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop&q=80',
    pros: {
      el: [
        'Δεν απαιτεί εξωτερική κεραία RTK — δουλεύει κάτω από πυκνά δέντρα και πέργκολες',
        'Ηλεκτρονική ρύθμιση ύψους κοπής απευθείας από το κινητό',
        'Αισθητήρας βροχής που επιστρέφει αυτόματα στη βάση',
        'Αντέχει κλίσεις έως 45% (24 μοίρες)'
      ],
      en: [
        'No RTK antenna setup required — operates under dense trees',
        'In-app motorized blade height adjustment',
        'Smart rain sensor with auto-docking',
        'Handles steep inclines up to 45%'
      ]
    },
    cons: {
      el: ['Υψηλότερο κόστος αγοράς', 'Μεγαλύτερο βάρος συσκευής (12 kg)'],
      en: ['Higher price tier', 'Heavier unit (12 kg)']
    },
    bestFor: {
      el: 'Ιδανικό για μεγάλα κτήματα, εξοχικά με ελιές και περίπλοκη δεντροφύτευση.',
      en: 'Best for large estates with olive trees and shaded pergola areas.'
    },
    affiliateLink: '#'
  },
  {
    id: 'husqvarna-automower-405x',
    name: 'Husqvarna Automower 405X (EPOS Wire-Free)',
    brand: 'Husqvarna',
    badge: 'Commercial Grade Reliability',
    coverageM2: 800,
    maxSlope: 40,
    navigation: 'Husqvarna EPOS Satellite + Cellular IoT',
    cuttingHeight: '20 - 50 mm',
    batteryLife: '70 min',
    rating: 4.7,
    reviewsCount: 210,
    price: '€2,190',
    image: 'https://images.unsplash.com/photo-1617886322207-6f504e7472c5?w=600&auto=format&fit=crop&q=80',
    pros: {
      el: [
        'Κορυφαία αντοχή σε σκόνη, χώμα και καλοκαιρινή ζέστη της Ελλάδας',
        'Ενσωματωμένη κάρτα 4G/GPS με αντικλεπτική προστασία Geofence',
        'Εξαιρετική ποιότητα λεπίδων διπλής όψης για τέλειο mulching'
      ],
      en: [
        'Unmatched build durability against Greek heat and dust',
        'Built-in 4G Cellular IoT with anti-theft GPS Geofence',
        'Dual-edge razor blades for superior mulching finish'
      ]
    },
    cons: {
      el: ['Απαιτεί ξεχωριστό σταθμό αναφοράς EPOS', 'Premium κόστος ανταλλακτικών'],
      en: ['Requires separate EPOS reference station', 'Premium spare parts cost']
    },
    bestFor: {
      el: 'Για όσους αναζητούν την απόλυτη αξιοπιστία της Σουηδικής τεχνολογίας.',
      en: 'For homeowners demanding industrial-grade Swedish engineering.'
    },
    affiliateLink: '#'
  }
];

export const AGRONOMIST_QUICK_PROMPTS = [
  {
    id: 'q1',
    label: { el: '🌿 Κίτρινα φύλλα σε γλάστρα', en: '🌿 Yellow leaves on potted plant' },
    prompt: {
      el: 'Τα φύλλα στα φυτά του μπαλκονιού μου άρχισαν να κιτρινίζουν. Τι μπορεί να φταίει και πώς να το αντιμετωπίσω;',
      en: 'My balcony plant leaves started turning yellow. What could be the cause and how to fix it?'
    }
  },
  {
    id: 'q2',
    label: { el: '💧 Πόσο να ποτίζω σήμερα;', en: '💧 How much to water today?' },
    prompt: {
      el: 'Με βάση τη σημερινή εξάτμιση και ζέστη στην Αθήνα, πόσα λίτρα νερό και τι ώρα χρειάζονται οι γλάστρες μου;',
      en: 'Based on today\'s evapotranspiration and heat in Athens, how much water and what time do my plants need?'
    }
  },
  {
    id: 'q3',
    label: { el: '🍅 Ντοματίνια στο μπαλκόνι', en: '🍅 Balcony Cherry Tomatoes' },
    prompt: {
      el: 'Πώς να φροντίσω τα ντοματίνια στο μπαλκόνι μου για να μην σκάσουν οι καρποί και να έχω πλούσια παραγωγή;',
      en: 'How do I care for balcony cherry tomatoes to prevent fruit cracking and maximize yield?'
    }
  },
  {
    id: 'q4',
    label: { el: '🤖 Ρομποτικό για κήπο με κλίση', en: '🤖 Robot mower for sloping lawn' },
    prompt: {
      el: 'Ποιο ρομποτικό χλοοκοπτικό χωρίς καλώδιο προτείνεις για κήπο 400τμ με ανηφόρα και δέντρα;',
      en: 'Which wire-free robotic lawnmower do you recommend for a 400m² lawn with slope and trees?'
    }
  }
];
