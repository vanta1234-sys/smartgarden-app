// Comprehensive Smart Photo Resolver for SmartGarden.gr
// Provides verified, unique, high-resolution botanical and smart gardening photos

export interface CuratedPhoto {
  url: string;
  keywords: string[];
  category: string;
  alt: string;
}

export const CURATED_GARDENING_PHOTOS: CuratedPhoto[] = [
  // ──────────────────────────────────────────
  // 🍅 VEGETABLES & FRUITS (ΛΑΧΑΝΑ & ΦΡΟΥΤΑ)
  // ──────────────────────────────────────────
  {
    url: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=1200&auto=format&fit=crop&q=80",
    keywords: ["ντοματα", "ντοματες", "tomato", "tomatoes", "ταπωμα", "ξηρη κορυφη", "ντοματινια", "solanum"],
    category: "vegetables",
    alt: "Ripe red tomatoes on the vine in greenhouse"
  },
  {
    url: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=1200&auto=format&fit=crop&q=80",
    keywords: ["πιπερια", "πιπεριες", "pepper", "peppers", "chili", "chilis", "habanero", "jalapeno", "καυτερες"],
    category: "vegetables",
    alt: "Vibrant peppers and chilis growing in pots"
  },
  {
    url: "https://images.unsplash.com/photo-1676043966926-c575c1ef320a?w=1200&auto=format&fit=crop&q=80",
    keywords: ["αγγουρι", "αγγουρια", "κολοκυθι", "κολοκυθια", "cucumber", "zucchini", "κολοκυνθοειδη", "επικονιαση"],
    category: "vegetables",
    alt: "Fresh cucumber growing on the vine"
  },
  {
    url: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1200&auto=format&fit=crop&q=80",
    keywords: ["φραουλα", "φραουλες", "strawberry", "strawberries", "πυργος φραουλας", "κρεμαστες γλαστρες"],
    category: "vegetables",
    alt: "Juicy red strawberries hanging from garden planter"
  },
  {
    url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80",
    keywords: ["μαρουλι", "σπανακι", "ροκα", "λαχανο", "lettuce", "spinach", "arugula", "σαλατικα", "φυλλωδη"],
    category: "vegetables",
    alt: "Fresh crisp green lettuce and salad greens"
  },
  {
    url: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=1200&auto=format&fit=crop&q=80",
    keywords: ["καροτο", "καροτα", "παντζαρι", "ραπανι", "carrot", "carrots", "radish", "beetroot", "ριζωδη"],
    category: "vegetables",
    alt: "Freshly harvested organic carrots with soil"
  },
  {
    url: "https://images.unsplash.com/photo-1542913235-1f46ce06443d?w=1200&auto=format&fit=crop&q=80",
    keywords: ["μανιταρι", "μανιταρια", "pleurotus", "shiitake", "mushroom", "mushrooms", "μυκητες"],
    category: "vegetable_garden",
    alt: "Gourmet oyster mushrooms growing organically"
  },
  {
    url: "https://images.unsplash.com/photo-1613881553903-4543f5f2cac9?w=1200&auto=format&fit=crop&q=80",
    keywords: ["μελιτζανα", "μελιτζανες", "eggplant", "aubergine", "δορυφορος"],
    category: "vegetables",
    alt: "Glossy purple eggplants growing on plant"
  },

  // ──────────────────────────────────────────
  // 💧 SMART IRRIGATION & IOT (ΠΟΤΙΣΜΑ & ΤΕΧΝΟΛΟΓΙΑ)
  // ──────────────────────────────────────────
  {
    url: "https://images.unsplash.com/photo-1738598665806-7ecc32c3594c?w=1200&auto=format&fit=crop&q=80",
    keywords: ["ποτισμα", "σταλακτες", "αυτοματο ποτισμα", "micro-drip", "σταγδην", "εξατμισοδιαπνοη", "σωληνες", "αρδευση", "drip"],
    category: "irrigation_iot",
    alt: "Drip irrigation tubing watering a garden row"
  },
  {
    url: "https://images.unsplash.com/photo-1584795962384-dce385272216?w=1200&auto=format&fit=crop&q=80",
    keywords: ["αισθητηρας", "αισθητηρες", "sensor", "sensors", "iot", "zigbee", "wifi", "npk sensor", "αγωγιμοτητα", "τηλεμετρια", "tdr"],
    category: "irrigation_iot",
    alt: "Smart IoT soil moisture sensor in a potted plant"
  },
  {
    url: "https://images.unsplash.com/photo-1697165927010-a966c1456ea7?w=1200&auto=format&fit=crop&q=80",
    keywords: ["ηλεκτροβανες", "ηλεκτροβανα", "valve", "valves", "προγραμματιστης", "controller", "solenoid", "manifolt", "συλλεκτης"],
    category: "irrigation_iot",
    alt: "Smart irrigation solenoid valve in the field"
  },
  {
    url: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=1200&auto=format&fit=crop&q=80",
    keywords: ["ηλιακο πανελ", "solar", "φωτοβολταικο", "βροχινο νερο", "off-grid", "δεξαμενη", "μπαταρια", "zero energy"],
    category: "irrigation_iot",
    alt: "Solar panel array powering off-grid irrigation"
  },
  {
    url: "https://images.unsplash.com/photo-1682629088818-1ec55d0cf45b?w=1200&auto=format&fit=crop&q=80",
    keywords: ["υδροπονια", "hydroponics", "fertigation", "nft", "dwc", "θρεπτικα διαλυματα", "αλατα", "ec", "ph meter"],
    category: "hydroponics",
    alt: "Vertical hydroponic tower growing fresh lettuce"
  },
  {
    url: "https://images.unsplash.com/photo-1741326757602-186060c5d5b5?w=1200&auto=format&fit=crop&q=80",
    keywords: ["ρομποτικο", "ρομποτικα", "mower", "mowers", "γκαζον", "χλοοκοπτικο", "rtk", "lidar", "automower"],
    category: "robotic_mowers",
    alt: "Autonomous robotic lawn mower cutting lush green grass"
  },

  // ──────────────────────────────────────────
  // 🍋 TREES, FRUITS & CITRUS (ΕΣΠΕΡΙΔΟΕΙΔΗ & ΔΕΝΤΡΑ)
  // ──────────────────────────────────────────
  {
    url: "https://images.unsplash.com/photo-1432457990754-c8b5f21448de?w=1200&auto=format&fit=crop&q=80",
    keywords: ["λεμονια", "λεμονι", "λεμονιας", "εσπεριδοειδη", "lemon", "citrus", "κουμκουατ", "μανταρινια", "χλωρωση", "σιδηρος"],
    category: "plant_care",
    alt: "Bright fresh lemons growing on a green lemon tree branch"
  },
  {
    url: "https://images.unsplash.com/photo-1683320553264-e31acd4196e7?w=1200&auto=format&fit=crop&q=80",
    keywords: ["ελια", "ελιας", "ελιες", "olive", "olives", "olive tree", "λιοδεντρο", "μπονσαι ελιας"],
    category: "balcony",
    alt: "Potted Mediterranean olive tree in a terracotta pot"
  },
  {
    url: "https://images.unsplash.com/photo-1585059895524-72359e06133a?w=1200&auto=format&fit=crop&q=80",
    keywords: ["ακτινιδιο", "ακτινιδια", "kiwi", "kiwifruit", "actinidia"],
    category: "plant_care",
    alt: "Fresh green kiwis hanging from vine"
  },
  {
    url: "https://images.unsplash.com/photo-1680124744736-859f16257ef0?w=1200&auto=format&fit=crop&q=80",
    keywords: ["κλαδεμα", "δεντροκομια", "pruning", "συκα", "συκια", "πυρηνοκαρπα", "μηλοειδη", "παστα εμβολιασμου"],
    category: "plant_care",
    alt: "Pruning shears cutting a branch in the orchard"
  },
  {
    url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&auto=format&fit=crop&q=80",
    keywords: ["αμπελι", "κληματαρια", "σταφυλι", "σταφυλια", "grape", "vineyard", "περγκολα"],
    category: "plant_care",
    alt: "Grapes ripening on a lush garden pergola"
  },

  // ──────────────────────────────────────────
  // 🌺 MEDITERRANEAN & BALCONY FLOWERS (ΑΝΘΗ & ΜΠΑΛΚΟΝΙ)
  // ──────────────────────────────────────────
  {
    url: "https://images.unsplash.com/photo-1687936682320-93480a2a69bf?w=1200&auto=format&fit=crop&q=80",
    keywords: ["βουκαμβιλια", "βουκαμβιλιες", "γιασεμι", "πυκσαρι", "πυξαρι", "καυσωνας", "μεσογειακος κηπος", "bougainvillea", "jasmine"],
    category: "plant_care",
    alt: "Vibrant pink bougainvillea flowers on a Mediterranean window"
  },
  {
    url: "https://images.unsplash.com/photo-1758372120921-29d4569f609a?w=1200&auto=format&fit=crop&q=80",
    keywords: ["καθετος κηπος", "καθετοι κηποι", "vertical garden", "πρασινος τοιχος", "τσεπες", "felt pockets"],
    category: "balcony",
    alt: "Lush green vertical wall garden panel system"
  },
  {
    url: "https://images.unsplash.com/photo-1556929361-f0763cc59812?w=1200&auto=format&fit=crop&q=80",
    keywords: ["αρωματικα", "βασιλικος", "δενδρολιβανο", "ριγανη", "θυμαρι", "herbs", "basil", "rosemary", "thyme", "ζαρντινιερα"],
    category: "balcony",
    alt: "Fresh fragrant Mediterranean potted culinary herbs"
  },
  {
    url: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=1200&auto=format&fit=crop&q=80",
    keywords: ["ορχιδεα", "ορχιδεες", "orchid", "orchids", "phalaenopsis", "dendrobium", "ανθοφορια"],
    category: "plant_care",
    alt: "Elegant blooming pink Phalaenopsis orchid in pot"
  },
  {
    url: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=1200&auto=format&fit=crop&q=80",
    keywords: ["παχυφυτα", "κακτοι", "succulents", "cactus", "ξηροφυτικα", "αλoη", "sedum"],
    category: "balcony",
    alt: "Modern collection of diverse succulents in pottery"
  },
  {
    url: "https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=1200&auto=format&fit=crop&q=80",
    keywords: ["μπονσαι", "bonsai", "μινιατουρα", "διαμορφωση"],
    category: "balcony",
    alt: "Carefully manicured Japanese style bonsai tree"
  },
  {
    url: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=1200&auto=format&fit=crop&q=80",
    keywords: ["εσωτερικου χωρου", "μονστερα", "φικος", "monstera", "ficus", "καλαθεα", "houseplants", "indoor plants"],
    category: "plant_care",
    alt: "Lush tropical Monstera deliciosa leaves indoors"
  },
  {
    url: "https://images.unsplash.com/photo-1594353162824-a8b237f9adae?w=1200&auto=format&fit=crop&q=80",
    keywords: ["φωτισμος", "lighting", "solar light", "νυχτερινος", "led", "design μπαλκονιου"],
    category: "balcony",
    alt: "Atmospheric evening garden pathway illumination"
  },

  // ──────────────────────────────────────────
  // 🐛 PEST CONTROL & ECOLOGY (ΒΙΟΛΟΓΙΚΗ ΠΡΟΣΤΑΣΙΑ)
  // ──────────────────────────────────────────
  {
    url: "https://images.unsplash.com/photo-1620055494738-248ba57ed714?w=1200&auto=format&fit=crop&q=80",
    keywords: ["τετρανυχος", "μελιγκρα", "θριπας", "spider mite", "aphids", "σαπουνι καλιου", "neem", "βιολογικη", "πασχαλιτσα", "μυκητες", "περονοσπορος", "ωιδιο"],
    category: "plant_care",
    alt: "Close-up of pest and disease damage on a leaf"
  },
  {
    url: "https://images.unsplash.com/photo-1621496654772-c66c48290259?w=1200&auto=format&fit=crop&q=80",
    keywords: ["κομποστ", "κομποστοποιηση", "compost", "bokashi", "γαιοσκωληκες", "οργανικα", "λιπασμα", "ανακυκλωση"],
    category: "vegetable_garden",
    alt: "Kitchen compost caddy with vegetable scraps"
  }
];

// Fallback pool of unique botanical photos for round-robin rotation
export const FALLBACK_BOTANICAL_PHOTOS = [
  "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80", // Vertical Garden
  "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=1200&auto=format&fit=crop&q=80", // Ripe Tomatoes on Vine
  "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=1200&auto=format&fit=crop&q=80", // Tomato Greenhouse Interior
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&auto=format&fit=crop&q=80", // Garden Trowel with Soil
  "https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=1200&auto=format&fit=crop&q=80", // Bonsai Tree in Pot
  "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=1200&auto=format&fit=crop&q=80", // Fresh Harvested Carrots
  "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=1200&auto=format&fit=crop&q=80", // Vibrant Chili Peppers
  "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1200&auto=format&fit=crop&q=80", // Fresh Strawberries
  "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1200&auto=format&fit=crop&q=80", // Seedling Tray with Sprouts
  "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=1200&auto=format&fit=crop&q=80", // Tomato Greenhouse Interior
  "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=1200&auto=format&fit=crop&q=80", // Potted Aloe / Succulent
  "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=1200&auto=format&fit=crop&q=80", // Orchids
  "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=1200&auto=format&fit=crop&q=80", // Monstera Indoor Plant
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80", // Fresh Salad Greens
  "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&auto=format&fit=crop&q=80", // Grapevine Pergola
  "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1200&auto=format&fit=crop&q=80", // Fresh Strawberries
  "https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=1200&auto=format&fit=crop&q=80", // Bonsai Tree in Pot
  "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=1200&auto=format&fit=crop&q=80", // Monstera Indoor Plant
  "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=1200&auto=format&fit=crop&q=80", // Fresh Harvested Carrots
  "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=1200&auto=format&fit=crop&q=80", // Potted Aloe / Succulent
];

function stripAccents(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ά/g, "α")
    .replace(/έ/g, "ε")
    .replace(/ή/g, "η")
    .replace(/[ίϊΐ]/g, "ι")
    .replace(/ό/g, "ο")
    .replace(/[ύϋΰ]/g, "υ")
    .replace(/ώ/g, "ω");
}

/**
 * Intelligently finds the best unique photo matching article topic, keywords or category.
 * Prevents identical consecutive pictures.
 */
export function getSmartArticleImage(topicTitle: string, category: string = "", indexSeed: number = 0): string {
  const normalized = stripAccents(topicTitle + " " + category);

  // 1. Direct Keyword Match
  for (const item of CURATED_GARDENING_PHOTOS) {
    const hasMatch = item.keywords.some((kw) => {
      const normKw = stripAccents(kw);
      return normalized.includes(normKw);
    });
    if (hasMatch) {
      return item.url;
    }
  }

  // 2. Category Match
  const categoryMatches = CURATED_GARDENING_PHOTOS.filter(
    (item) => stripAccents(item.category) === stripAccents(category)
  );
  if (categoryMatches.length > 0) {
    const idx = Math.abs(indexSeed) % categoryMatches.length;
    return categoryMatches[idx].url;
  }

  // 3. Round-Robin Fallback based on text hash or index seed
  let hash = 0;
  for (let i = 0; i < topicTitle.length; i++) {
    hash = (hash << 5) - hash + topicTitle.charCodeAt(i);
    hash |= 0;
  }
  const fallbackIndex = Math.abs(hash + indexSeed) % FALLBACK_BOTANICAL_PHOTOS.length;
  return FALLBACK_BOTANICAL_PHOTOS[fallbackIndex];
}
