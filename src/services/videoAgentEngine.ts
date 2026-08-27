import { CartoonSceneStep, MultiAgentVideoProject, Article, Language } from '../types';

export const ARTICLE_CARTOON_PRESETS: Record<string, CartoonSceneStep[]> = {
  // 1. Drip Irrigation
  '1': [
    {
      id: 'step-1-1',
      timeStart: 0,
      timeEnd: 2.5,
      phaseName: { el: '1. Διάγνωση & Προετοιμασία', en: '1. Diagnosis & Setup' },
      actionDescription: { el: 'Έλεγχος ξηρασίας γλάστρας και τοποθέτηση μειωτή πίεσης 1.5 bar στη βρύση.', en: 'Checking dry balcony pot and attaching 1.5 bar pressure regulator to tap.' },
      botanicalFocus: { el: 'Πρόληψη υπερβολικής πίεσης & καταστροφής συνδέσμων.', en: 'Preventing connector pop-off from high water pressure.' },
      cartoonElements: {
        characterAction: 'inspecting',
        tool: 'iot_sensor',
        plantState: 'wilting',
        particles: 'sun_rays',
        onScreenBanner: { el: '⏱️ 0-2.5s: Σύνδεση Μειωτή 1.5 bar & Φίλτρου', en: '⏱️ 0-2.5s: Connect 1.5 Bar Regulator & Filter' },
        audioEffect: 'whoosh'
      }
    },
    {
      id: 'step-1-2',
      timeStart: 2.5,
      timeEnd: 5.5,
      phaseName: { el: '2. Γρήγορη Εγκατάσταση Σταλακτών (Fast-Motion)', en: '2. Fast-Motion Dripper Punching' },
      actionDescription: { el: 'Τρύπημα κεντρικού σωλήνα Φ16 και κούμπωμα αυτορρυθμιζόμενου σταλάκτη PC 2 L/h.', en: 'Punching Φ16 LDPE line and snapping pressure-compensating PC 2 L/h dripper.' },
      botanicalFocus: { el: 'Ακριβής παροχή 2 λίτρων ανά ώρα ακριβώς στη ριζόσφαιρα.', en: 'Targeted root-zone micro delivery with zero waste.' },
      cartoonElements: {
        characterAction: 'snipping',
        tool: 'pruning_shears',
        plantState: 'wilting',
        particles: 'sparkles',
        onScreenBanner: { el: '⚡ 2.5-5.5s: Fast-Snap Σταλάκτη 2 L/h στη Ρίζα', en: '⚡ 2.5-5.5s: Fast-Snap 2 L/h Dripper at Rootzone' },
        audioEffect: 'snip'
      }
    },
    {
      id: 'step-1-3',
      timeStart: 5.5,
      timeEnd: 8.0,
      phaseName: { el: '3. Έναρξη Έξυπνου Ποτίσματος & Ροή', en: '3. Automated Flow & Absorption' },
      actionDescription: { el: 'Η ηλεκτροβάνα ανοίγει, κρυστάλλινες σταγόνες ποτίζουν ομοιόμορφα και το χώμα σκουραίνει.', en: 'Solenoid valve triggers, rhythmic droplets soak soil substrate.' },
      botanicalFocus: { el: 'Πλήρης ενυδάτωση χωρίς στάσιμο νερό στο πιατάκι.', en: 'Full capillary hydration with optimal drainage.' },
      cartoonElements: {
        characterAction: 'watering',
        tool: 'water_can',
        plantState: 'lush_green',
        particles: 'water_drops',
        onScreenBanner: { el: '💧 5.5-8.0s: Ομοιόμορφη Στάγδην Διαβροχή (7 λεπτά)', en: '💧 5.5-8.0s: Precision Drip Soak (7 mins duration)' },
        audioEffect: 'water_flow'
      }
    },
    {
      id: 'step-1-4',
      timeStart: 8.0,
      timeEnd: 10.0,
      phaseName: { el: '4. Αποτέλεσμα & Έξυπνη Εξοικονόμηση', en: '4. Result & Water Saved' },
      actionDescription: { el: 'Το φυτό ξαναζωντανεύει αστραπιαία, καταπράσινα φύλλα και -70% κατανάλωση νερού!', en: 'Plant surges with vitality, lush green foliage and -70% water savings badge.' },
      botanicalFocus: { el: '100% προστασία από θερμικό σοκ & καύσωνα.', en: 'Maximum heatwave resilience and lush growth.' },
      cartoonElements: {
        characterAction: 'celebrating',
        tool: 'iot_sensor',
        plantState: 'blooming',
        particles: 'sparkles',
        onScreenBanner: { el: '🏆 8-10s: +100% Ζωντάνια | 0% Σπατάλη Νερού!', en: '🏆 8-10s: Max Vitality | Zero Water Waste!' },
        audioEffect: 'ding'
      }
    }
  ],

  // 2. Gardenia Iron Chelate
  '2': [
    {
      id: 'step-2-1',
      timeStart: 0,
      timeEnd: 2.5,
      phaseName: { el: '1. Διάγνωση Χλώρωσης', en: '1. Chlorosis Diagnosis' },
      actionDescription: { el: 'Εντοπισμός κίτρινων φύλλων με σκούρα πράσινα νεύρα (έλλειψη σιδήρου λόγω pH > 6.5).', en: 'Diagnosing yellow leaves with dark green veins caused by alkaline pH block.' },
      botanicalFocus: { el: 'Χλώρωση σιδήρου στα νεαρά φύλλα της γαρδένιας.', en: 'Iron chlorosis on new flushes.' },
      cartoonElements: {
        characterAction: 'inspecting',
        tool: 'iot_sensor',
        plantState: 'yellowing',
        particles: 'leaves',
        onScreenBanner: { el: '🔍 0-2.5s: Διάγνωση Κίτρινων Φύλλων (Χλώρωση Fe)', en: '🔍 0-2.5s: Iron Chlorosis Diagnosis' },
        audioEffect: 'whoosh'
      }
    },
    {
      id: 'step-2-2',
      timeStart: 2.5,
      timeEnd: 5.5,
      phaseName: { el: '2. Διάλυση Κόκκινης Σκόνης EDDHA', en: '2. Fe-EDDHA Red Powder Dissolution' },
      actionDescription: { el: 'Ανάδευση 1 κουταλακιού χηλικού σιδήρου EDDHA σε 2L νερό μέχρι να γίνει βαθύ κόκκινο.', en: 'Stirring 1 tsp of red Fe-EDDHA powder into 2L water.' },
      botanicalFocus: { el: 'Ο μόνος σίδηρος που δεν αδρανοποιείται σε αλκαλικό νερό βρύσης.', en: 'Active up to pH 9.0 in hard tap water.' },
      cartoonElements: {
        characterAction: 'fertilizing',
        tool: 'iron_chelate',
        plantState: 'yellowing',
        particles: 'red_powder',
        onScreenBanner: { el: '🧪 2.5-5.5s: Διάλυση Fe-EDDHA (Κόκκινο Διάλυμα)', en: '🧪 2.5-5.5s: Dissolving Fe-EDDHA Iron Chelate' },
        audioEffect: 'water_flow'
      }
    },
    {
      id: 'step-2-3',
      timeStart: 5.5,
      timeEnd: 8.0,
      phaseName: { el: '3. Ριζοπότισμα & Απορρόφηση (Fast-Motion)', en: '3. Fast-Motion Root Uptake' },
      actionDescription: { el: 'Το κόκκινο διάλυμα εισχωρεί στις ρίζες. Σε fast-motion, τα κίτρινα φύλλα πρασινίζουν!', en: 'Red tonic rushes into roots. Leaves transition to deep glossy emerald.' },
      botanicalFocus: { el: 'Άμεση σύνθεση χλωροφύλλης και αναγέννηση κυττάρων.', en: 'Rapid chlorophyll synthesis and foliar greening.' },
      cartoonElements: {
        characterAction: 'watering',
        tool: 'water_can',
        plantState: 'lush_green',
        particles: 'sparkles',
        onScreenBanner: { el: '🌿 5.5-8.0s: Fast-Motion Πρασίνισμα & Χλωροφύλλη!', en: '🌿 5.5-8.0s: Rapid Greening & Chlorophyll Boost!' },
        audioEffect: 'whoosh'
      }
    },
    {
      id: 'step-2-4',
      timeStart: 8.0,
      timeEnd: 10.0,
      phaseName: { el: '4. Έκρηξη Ανθοφορίας', en: '4. Fragrant Blooming' },
      actionDescription: { el: 'Καταπράσινα γυαλιστερά φύλλα και μεγάλα λευκά αρωματικά άνθη γαρδένιας!', en: 'Glossy dark green leaves and huge fragrant white blossoms popping open!' },
      botanicalFocus: { el: 'Σταθερό pH 5.5 και πλούσια μπουμπούκια.', en: 'Optimal pH 5.5 with profuse fragrant buds.' },
      cartoonElements: {
        characterAction: 'celebrating',
        tool: 'iot_sensor',
        plantState: 'blooming',
        particles: 'sparkles',
        onScreenBanner: { el: '🌸 8-10s: Καταπράσινη Γαρδένια & Άρωμα!', en: '🌸 8-10s: Lush Emerald Gardenia in Full Bloom!' },
        audioEffect: 'ding'
      }
    }
  ],

  // 3. Robotic Mower RTK LiDAR
  '3': [
    {
      id: 'step-3-1',
      timeStart: 0,
      timeEnd: 2.5,
      phaseName: { el: '1. Δορυφορική Χαρτογράφηση RTK', en: '1. RTK Satellite Mapping' },
      actionDescription: { el: 'Το ρομπότ ενεργοποιεί το LiDAR και συνδέεται με τον σταθμό βάσης RTK με ακρίβεια εκατοστού.', en: 'Robot initializes 3D LiDAR and connects to RTK base station with cm accuracy.' },
      botanicalFocus: { el: 'Χαρτογράφηση χωρίς περιμετρικά καλώδια.', en: 'Virtual perimeter setup with zero physical wires.' },
      cartoonElements: {
        characterAction: 'inspecting',
        tool: 'mower_robot',
        plantState: 'wilting',
        particles: 'laser_scans',
        onScreenBanner: { el: '📡 0-2.5s: 3D LiDAR & RTK-GPS Χαρτογράφηση', en: '📡 0-2.5s: 3D LiDAR & RTK-GPS Virtual Mapping' },
        audioEffect: 'robot_hum'
      }
    },
    {
      id: 'step-3-2',
      timeStart: 2.5,
      timeEnd: 5.5,
      phaseName: { el: '2. Fast-Motion Παράλληλο Κούρεμα', en: '2. Fast-Motion Striping' },
      actionDescription: { el: 'Το ρομπότ κινείται σε απόλυτα ευθείες γραμμές με ταχύτητα, κόβοντας το γρασίδι στα 45mm.', en: 'Mower cuts in perfectly parallel stripes at 45mm height with AWD traction.' },
      botanicalFocus: { el: 'Καθαρή κοπή χωρίς καταπόνηση των φύλλων του γκαζόν.', en: 'Clean razor micro-cut preventing brown tips.' },
      cartoonElements: {
        characterAction: 'snipping',
        tool: 'mower_robot',
        plantState: 'cut',
        particles: 'leaves',
        onScreenBanner: { el: '⚡ 2.5-5.5s: Fast-Motion Κοπή σε Παράλληλες Γραμμές', en: '⚡ 2.5-5.5s: Parallel Striping in Fast-Motion' },
        audioEffect: 'snip'
      }
    },
    {
      id: 'step-3-3',
      timeStart: 5.5,
      timeEnd: 8.0,
      phaseName: { el: '3. AI Αποφυγή Εμποδίων & Micro-Mulching', en: '3. AI Obstacle Avoidance & Mulching' },
      actionDescription: { el: 'Η AI κάμερα εντοπίζει ένα παιχνίδι και στρίβει ομαλά, ανακυκλώνοντας το κομμένο χόρτο.', en: 'AI vision camera spots obstacle, dodges smoothly while micro-mulching nitrogen.' },
      botanicalFocus: { el: 'Φυσική λίπανση αζώτου και συγκράτηση υγρασίας.', en: 'Natural organic nitrogen recycling and moisture retention.' },
      cartoonElements: {
        characterAction: 'inspecting',
        tool: 'mower_robot',
        plantState: 'lush_green',
        particles: 'laser_scans',
        onScreenBanner: { el: '🤖 5.5-8.0s: AI Αποφυγή Εμποδίου & Micro-Mulching', en: '🤖 5.5-8.0s: AI Avoidance & Organic Mulch Feed' },
        audioEffect: 'whoosh'
      }
    },
    {
      id: 'step-3-4',
      timeStart: 8.0,
      timeEnd: 10.0,
      phaseName: { el: '4. Τέλειος Αγγλικός Τάπητας & Αυτόματη Φόρτιση', en: '4. Carpet Lawn & Auto Dock' },
      actionDescription: { el: 'Επιστροφή στη βάση φόρτισης, το γκαζόν μοιάζει με βελούδινο χαλί γηπέδου!', en: 'Docks automatically, lush velvet lawn looking pristine like a golf green!' },
      botanicalFocus: { el: 'Μόνιμα πυκνό, πράσινο και απαλλαγμένο από ζιζάνια γρασίδι.', en: 'Permanently dense weed-free turf carpet.' },
      cartoonElements: {
        characterAction: 'celebrating',
        tool: 'mower_robot',
        plantState: 'blooming',
        particles: 'sparkles',
        onScreenBanner: { el: '🏆 8-10s: Τέλειος Χλοοτάπητας & Αυτόνομη Φόρτιση!', en: '🏆 8-10s: Pristine Lawn Carpet & Autonomous Docking!' },
        audioEffect: 'ding'
      }
    }
  ],

  // 4. Tomato Suckering & Pruning
  '4': [
    {
      id: 'step-4-1',
      timeStart: 0,
      timeEnd: 2.5,
      phaseName: { el: '1. Εντοπισμός Πλαϊνού Βλαστού (Μασχάλη)', en: '1. Sucker Identification' },
      actionDescription: { el: 'Εντοπισμός του περιττού λαίμαργου βλαστού στη γωνία 45° ανάμεσα στο στέλεχος και το φύλλο.', en: 'Spotting the 45-degree sucker shoot between the main stem and leaf branch.' },
      botanicalFocus: { el: 'Αφαίρεση για να μην κλέβει ενέργεια και χυμούς από τις ντομάτες.', en: 'Preventing energy drain away from flower trusses.' },
      cartoonElements: {
        characterAction: 'inspecting',
        tool: 'pruning_shears',
        plantState: 'wilting',
        particles: 'leaves',
        onScreenBanner: { el: '✂️ 0-2.5s: Εντοπισμός Λαίμαργου Βλαστού (Sucker)', en: '✂️ 0-2.5s: Spotting the 45° Sucker Shoot' },
        audioEffect: 'whoosh'
      }
    },
    {
      id: 'step-4-2',
      timeStart: 2.5,
      timeEnd: 5.5,
      phaseName: { el: '2. Fast-Motion Αφαίρεση (Ξεβλαστάρωμα)', en: '2. Fast-Motion Pinch / Snip' },
      actionDescription: { el: 'Καθαρό κόψιμο με απολυμασμένο ψαλιδάκι σε γρήγορη κίνηση.', en: 'Clean diagonal snip with sterilized shears.' },
      botanicalFocus: { el: 'Άμεσος αερισμός φυτού και αποφυγή μυκήτων (περονόσπορος).', en: 'Maximizing light penetration and air circulation against blight.' },
      cartoonElements: {
        characterAction: 'snipping',
        tool: 'pruning_shears',
        plantState: 'cut',
        particles: 'sparkles',
        onScreenBanner: { el: '⚡ 2.5-5.5s: Fast-Snip με Απολυμασμένο Ψαλίδι', en: '⚡ 2.5-5.5s: Clean Diagonal Snip with Shears' },
        audioEffect: 'snip'
      }
    },
    {
      id: 'step-4-3',
      timeStart: 5.5,
      timeEnd: 8.0,
      phaseName: { el: '3. Fast-Motion Ανάπτυξη Καρπών', en: '3. Fast-Motion Fruit Sizing' },
      actionDescription: { el: 'Σε fast-motion, τα άνθη γονιμοποιούνται και μικρές πράσινες ντομάτες διογκώνονται ταχύτατα!', en: 'In fast-motion, flowers turn into plump green cluster tomatoes growing fast!' },
      botanicalFocus: { el: 'Συγκέντρωση όλων των σακχάρων στον καρπό.', en: 'Directing all sugars and potassium into fruit swell.' },
      cartoonElements: {
        characterAction: 'watering',
        tool: 'water_can',
        plantState: 'fruiting',
        particles: 'sun_rays',
        onScreenBanner: { el: '🍅 5.5-8.0s: Fast-Motion Διόγκωση Καρπών & Ωρίμανση', en: '🍅 5.5-8.0s: Rapid Fruit Swelling & Ripening' },
        audioEffect: 'whoosh'
      }
    },
    {
      id: 'step-4-4',
      timeStart: 8.0,
      timeEnd: 10.0,
      phaseName: { el: '4. Συγκομιδή Κατακόκκινων Ντοματών!', en: '4. Bountiful Harvest' },
      actionDescription: { el: 'Ζουμερές κατακόκκινες γλυκιές ντομάτες γεμίζουν το καλάθι στο μπαλκόνι!', en: 'Bountiful basket overflowing with sweet, aromatic red tomatoes!' },
      botanicalFocus: { el: 'Μέγιστη γεύση, λυκοπένιο και τραγανή σάρκα.', en: 'Peak sweetness, lycopene, and thick juicy walls.' },
      cartoonElements: {
        characterAction: 'celebrating',
        tool: 'iot_sensor',
        plantState: 'blooming',
        particles: 'sparkles',
        onScreenBanner: { el: '🏆 8-10s: 100% Βιολογικές Ζουμερές Ντομάτες!', en: '🏆 8-10s: 100% Organic Sweet Balcony Harvest!' },
        audioEffect: 'ding'
      }
    }
  ],

  // 5. Potted Citrus & Lemon Care
  '5': [
    {
      id: 'step-5-1',
      timeStart: 0,
      timeEnd: 2.5,
      phaseName: { el: '1. Διάγνωση Πτώσης Καρπών', en: '1. Fruit Drop Diagnosis' },
      actionDescription: { el: 'Έλεγχος ανεμοπίεσης και έλλειψης μαγνησίου/ψευδαργύρου στα άνθη λεμονιάς.', en: 'Diagnosing blossom drop caused by hot wind or micronutrient deficiency.' },
      botanicalFocus: { el: 'Αποφυγή διακυμάνσεων υγρασίας στις ρίζες λεμονιάς.', en: 'Stabilizing root hydration to prevent premature drop.' },
      cartoonElements: {
        characterAction: 'inspecting',
        tool: 'iot_sensor',
        plantState: 'wilting',
        particles: 'sun_rays',
        onScreenBanner: { el: '🍋 0-2.5s: Έλεγχος & Προστασία από Πτώση Καρπιδίων', en: '🍋 0-2.5s: Preventing Citrus Blossom & Fruit Drop' },
        audioEffect: 'whoosh'
      }
    },
    {
      id: 'step-5-2',
      timeStart: 2.5,
      timeEnd: 5.5,
      phaseName: { el: '2. Fast-Motion Ειδική Λίπανση Εσπεριδοειδών', en: '2. Citrus Micronutrient Feed' },
      actionDescription: { el: 'Εφαρμογή ισορροπημένου λιπάσματος NPK με μαγνήσιο & ιχνοστοιχεία στη γλάστρα.', en: 'Applying balanced organic citrus food enriched with Magnesium & Zinc.' },
      botanicalFocus: { el: 'Άμεση ενίσχυση του κοτσανιού των μικρών λεμονιών.', en: 'Strengthening fruit calyx attachments against drop.' },
      cartoonElements: {
        characterAction: 'fertilizing',
        tool: 'iron_chelate',
        plantState: 'yellowing',
        particles: 'sparkles',
        onScreenBanner: { el: '⚡ 2.5-5.5s: Fast-Feed NPK + Μαγνήσιο & Ιχνοστοιχεία', en: '⚡ 2.5-5.5s: NPK + Magnesium Root Booster' },
        audioEffect: 'snip'
      }
    },
    {
      id: 'step-5-3',
      timeStart: 5.5,
      timeEnd: 8.0,
      phaseName: { el: '3. Σταθερό Πρωινό Πότισμα & Δέσιμο', en: '3. Steady Drip & Fruit Swell' },
      actionDescription: { el: 'Αυτόματο στάγδην πότισμα κάθε πρωί, τα λεμονάκια αρχίζουν να μεγαλώνουν γρήγορα!', en: 'Morning precision drip keeps soil evenly moist, lemons swelling fast!' },
      botanicalFocus: { el: 'Σταθερότητα υγρασίας χωρίς να στεγνώνει η ρίζα.', en: 'Constant soil moisture prevents fruit splitting.' },
      cartoonElements: {
        characterAction: 'watering',
        tool: 'water_can',
        plantState: 'fruiting',
        particles: 'water_drops',
        onScreenBanner: { el: '💧 5.5-8.0s: Σταθερό Πότισμα -> 100% Δέσιμο Καρπού', en: '💧 5.5-8.0s: Stable Moisture = 100% Fruit Set' },
        audioEffect: 'water_flow'
      }
    },
    {
      id: 'step-5-4',
      timeStart: 8.0,
      timeEnd: 10.0,
      phaseName: { el: '4. Άφθονα Ζουμερά Κίτρινα Λεμόνια!', en: '4. Golden Harvest' },
      actionDescription: { el: 'Το δεντράκι στο μπαλκόνι γεμίζει μεγάλα, ευωδιαστά κίτρινα λεμόνια!', en: 'Balcony tree packed with fragrant, heavy golden lemons!' },
      botanicalFocus: { el: 'Πλούσιος χυμός, αιθέρια έλαια στη φλούδα & άρωμα.', en: 'Abundant juice and aromatic citrus zest.' },
      cartoonElements: {
        characterAction: 'celebrating',
        tool: 'iot_sensor',
        plantState: 'blooming',
        particles: 'sparkles',
        onScreenBanner: { el: '🏆 8-10s: Γεμάτο Κλαδιά με Ζουμερά Λεμόνια!', en: '🏆 8-10s: Bountiful Juicy Citrus on the Veranda!' },
        audioEffect: 'ding'
      }
    }
  ],

  // 6. Mediterranean Aromatic Herbs & Pinching
  '6': [
    {
      id: 'step-6-1',
      timeStart: 0,
      timeEnd: 2.5,
      phaseName: { el: '1. Εντοπισμός Ανθικών Σταχύων Βασιλικού', en: '1. Basil Flower Spike Check' },
      actionDescription: { el: 'Εντοπισμός των λευκών ανθικών στελεχών που απειλούν να ξυλοποιήσουν το φυτό.', en: 'Spotting white flower spikes that cause basil leaves to turn bitter and woody.' },
      botanicalFocus: { el: 'Αποτροπή πρόωρης γήρανσης και ξυλοποίησης των κλαδιών.', en: 'Preventing premature plant senescence and leaf loss.' },
      cartoonElements: {
        characterAction: 'inspecting',
        tool: 'pruning_shears',
        plantState: 'wilting',
        particles: 'leaves',
        onScreenBanner: { el: '🌿 0-2.5s: Εντοπισμός Ανθέων Βασιλικού', en: '🌿 0-2.5s: Spotting Early Basil Flower Spikes' },
        audioEffect: 'whoosh'
      }
    },
    {
      id: 'step-6-2',
      timeStart: 2.5,
      timeEnd: 5.5,
      phaseName: { el: '2. Fast-Motion Κορυφολόγημα (Pinching)', en: '2. Fast-Motion Flower Pinching' },
      actionDescription: { el: 'Κόψιμο της κορυφής ακριβώς πάνω από το 2ο ζευγάρι φύλλων με καθαρό ψαλίδι σε γρήγορη κίνηση.', en: 'Pinching the top right above the second node in rapid fast-motion.' },
      botanicalFocus: { el: 'Διπλασιασμός των πλάγιων βλαστών για πυκνή φούντα.', en: 'Triggering dormant nodes for dense bushy branching.' },
      cartoonElements: {
        characterAction: 'snipping',
        tool: 'pruning_shears',
        plantState: 'cut',
        particles: 'sparkles',
        onScreenBanner: { el: '✂️ 2.5-5.5s: Fast-Pinch Κορυφής -> 2x Νέοι Βλαστοί', en: '✂️ 2.5-5.5s: Fast-Pinch = 2x Bushy Branching' },
        audioEffect: 'snip'
      }
    },
    {
      id: 'step-6-3',
      timeStart: 5.5,
      timeEnd: 8.0,
      phaseName: { el: '3. Έκρηξη Νέας Πράσινης Φυλλωσιάς', en: '3. Foliage Explosion' },
      actionDescription: { el: 'Σε fast-motion, δύο νέα δυνατά κλαδιά πετάγονται γεμάτα τρυφερά, αρωματικά φύλλα!', en: 'In fast-motion, double shoots emerge packed with aromatic emerald leaves!' },
      botanicalFocus: { el: 'Μέγιστη συγκέντρωση αιθέριων ελαίων και αρώματος.', en: 'Peak concentration of natural essential oils.' },
      cartoonElements: {
        characterAction: 'watering',
        tool: 'water_can',
        plantState: 'lush_green',
        particles: 'leaves',
        onScreenBanner: { el: '🍃 5.5-8.0s: Πυκνή Ανάπτυξη & Αρωματικά Φύλλα', en: '🍃 5.5-8.0s: Dense Green Growth & Peak Aroma' },
        audioEffect: 'water_flow'
      }
    },
    {
      id: 'step-6-4',
      timeStart: 8.0,
      timeEnd: 10.0,
      phaseName: { el: '4. Πλούσια Συγκομιδή για Φρέσκο Pesto!', en: '4. Fresh Pesto Harvest' },
      actionDescription: { el: 'Πυκνότατος βασιλικός και αρωματικά έτοιμα για την κουζίνα!', en: 'Incredibly lush aromatic bush ready for fresh Mediterranean recipes!' },
      botanicalFocus: { el: 'Διαρκής παραγωγή φύλλων μέχρι τα τέλη του φθινοπώρου.', en: 'Continuous fresh harvest lasting till late autumn.' },
      cartoonElements: {
        characterAction: 'celebrating',
        tool: 'iot_sensor',
        plantState: 'blooming',
        particles: 'sparkles',
        onScreenBanner: { el: '🏆 8-10s: Πλούσια Αρωματική Παραγωγή!', en: '🏆 8-10s: Gourmet Fresh Herb Harvest!' },
        audioEffect: 'ding'
      }
    }
  ]
};

export function getArticleCartoonStoryboard(article: Article): CartoonSceneStep[] {
  if (ARTICLE_CARTOON_PRESETS[article.id]) {
    return ARTICLE_CARTOON_PRESETS[article.id];
  }
  // Generic intelligent fallback for custom / WordPress articles
  return [
    {
      id: `gen-${article.id}-1`,
      timeStart: 0,
      timeEnd: 2.5,
      phaseName: { el: '1. Διάγνωση & Ανάλυση Ανάγκης', en: '1. Diagnosis & Setup' },
      actionDescription: { el: `Έλεγχος κατάστασης φυτού & προετοιμασία: ${article.title.el}`, en: `Plant diagnostic check: ${article.title.en}` },
      botanicalFocus: { el: 'Ακριβής εντοπισμός προβλήματος & κατάλληλα εργαλεία.', en: 'Precision diagnostics and tool preparation.' },
      cartoonElements: {
        characterAction: 'inspecting',
        tool: 'iot_sensor',
        plantState: 'wilting',
        particles: 'sun_rays',
        onScreenBanner: { el: `🔍 0-2.5s: Έλεγχος & Διάγνωση`, en: `🔍 0-2.5s: Setup & Diagnosis` },
        audioEffect: 'whoosh'
      }
    },
    {
      id: `gen-${article.id}-2`,
      timeStart: 2.5,
      timeEnd: 5.5,
      phaseName: { el: '2. Fast-Motion Εφαρμογή Οδηγού', en: '2. Fast-Motion Action' },
      actionDescription: { el: 'Εκτέλεση βημάτων με ακρίβεια σε γρήγορη κίνηση.', en: 'Executing steps with precision in fast-motion.' },
      botanicalFocus: { el: 'Άμεση εφαρμογή σύμφωνα με τις βέλτιστες πρακτικές.', en: 'Direct execution following best practices.' },
      cartoonElements: {
        characterAction: 'snipping',
        tool: 'pruning_shears',
        plantState: 'cut',
        particles: 'sparkles',
        onScreenBanner: { el: `⚡ 2.5-5.5s: Fast-Motion Εφαρμογή`, en: `⚡ 2.5-5.5s: Fast-Motion Action` },
        audioEffect: 'snip'
      }
    },
    {
      id: `gen-${article.id}-3`,
      timeStart: 5.5,
      timeEnd: 8.0,
      phaseName: { el: '3. Ενυδάτωση & Ταχεία Μεταμόρφωση', en: '3. Transformation' },
      actionDescription: { el: 'Ροή θρεπτικών & ομοιόμορφη ανάπτυξη φυτού.', en: 'Rapid nutrient flow and healthy vitality surge.' },
      botanicalFocus: { el: 'Πλήρης απορρόφηση και προστασία από στρες.', en: 'Optimal absorption and stress protection.' },
      cartoonElements: {
        characterAction: 'watering',
        tool: 'water_can',
        plantState: 'lush_green',
        particles: 'water_drops',
        onScreenBanner: { el: `💧 5.5-8.0s: Ταχεία Μεταμόρφωση`, en: `💧 5.5-8.0s: Rapid Transformation` },
        audioEffect: 'water_flow'
      }
    },
    {
      id: `gen-${article.id}-4`,
      timeStart: 8.0,
      timeEnd: 10.0,
      phaseName: { el: '4. Τέλειο Αποτέλεσμα & Επιτυχία!', en: '4. Peak Result' },
      actionDescription: { el: 'Υγιές, πανέμορφο και αποδοτικό αποτέλεσμα στο μπαλκόνι!', en: 'Lush, productive and resilient balcony results!' },
      botanicalFocus: { el: 'Μέγιστη ανθοφορία, ευρωστία & μακροζωία.', en: 'Maximum blooming and long-term health.' },
      cartoonElements: {
        characterAction: 'celebrating',
        tool: 'iot_sensor',
        plantState: 'blooming',
        particles: 'sparkles',
        onScreenBanner: { el: `🏆 8-10s: 100% Επιτυχία & Υγεία!`, en: `🏆 8-10s: 100% Success & Vitality!` },
        audioEffect: 'ding'
      }
    }
  ];
}

// Procedural Sound Synthesizer via Web Audio API (Zero external assets needed)
class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playEffect(type: string) {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      if (type === 'snip') {
        // Crisp scissor snip noise + metallic click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
      } else if (type === 'water_flow') {
        // Water splash / drip bubbling
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      } else if (type === 'ding') {
        // Bright congratulatory chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1760, t + 0.35);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      } else if (type === 'whoosh') {
        // Fast-motion swoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, t);
        osc.frequency.exponentialRampToValueAtTime(750, t + 0.12);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.13);
      } else if (type === 'robot_hum') {
        // Tech LiDAR pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(880, t + 0.06);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
      }
    } catch {
      // Audio not permitted in current context
    }
  }
}

export const soundFx = new SoundSynthesizer();

// Multi-Agent Pipeline Simulator
export function createMultiAgentProject(article: Article, customTopic?: string): MultiAgentVideoProject {
  const defaultStoryboard = ARTICLE_CARTOON_PRESETS[article.id] || ARTICLE_CARTOON_PRESETS['1'];

  return {
    id: `project-${Date.now()}`,
    articleId: article.id,
    articleTitle: article.title,
    topic: customTopic || article.title.el,
    status: 'idle',
    durationSeconds: 10,
    agent1Script: {
      agentName: 'Agent 1: Script & Motion Storyboarder (Σκηνοθέτης)',
      status: 'pending',
      storyboard: defaultStoryboard,
      notes: {
        el: 'Διαχωρισμός 10 δευτερολέπτων σε 4 φάσεις γρήγορης κίνησης (Fast-Motion) με έντονα cartoon οπτικά εφέ και ξεκάθαρα βήματα.',
        en: '10-second timeline split into 4 high-speed cartoon phases with bold visual overlays and crisp action steps.'
      }
    },
    agent2Review: {
      agentName: 'Agent 2: Botanical & Tech QA Inspector (Επιθεωρητής Γεωπόνος)',
      status: 'pending',
      accuracyScore: 98,
      botanicalCorrections: {
        el: [
          'Έλεγχος γωνίας κοπής (45 μοίρες) για αποφυγή συγκέντρωσης υγρασίας.',
          'Επιβεβαίωση δοσολογίας και αποφυγή υπερβολικής πίεσης στο δίκτυο.',
          'Προσθήκη σήμανσης ασφαλείας και ώρας εφαρμογής (πρωί/απόγευμα).'
        ],
        en: [
          'Verified 45-degree angle cut to prevent pathogen moisture build-up.',
          'Confirmed accurate dilution ratio and water pressure ceiling.',
          'Added application timing recommendation (early morning/dusk).'
        ]
      },
      safetyNotice: {
        el: 'Εγκεκριμένο σύμφωνα με τους κανόνες βιολογικής καλλιέργειας & IoT προστασίας.',
        en: 'Certified in accordance with organic gardening & IoT safety benchmarks.'
      },
      approvedSeal: true
    },
    agent3Animator: {
      agentName: 'Agent 3: 2D Cartoon Animator & 60fps Renderer (Animator)',
      status: 'pending',
      fps: 60,
      motionSpeedMultiplier: 2.0,
      colorPalette: 'Vibrant Botanical (Emerald #059669, Amber #F59E0B, Sky #0284C7)'
    }
  };
}
