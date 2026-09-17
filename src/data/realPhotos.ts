/**
 * Photographs taken in a real Greek vegetable garden on 12 September 2026.
 *
 * The site's articles are written by a model and illustrated from stock, which is exactly
 * the profile Google's helpful-content guidance treats as mass-produced. Original photos
 * of the thing the article is about are the cheapest honest signal that a person is behind
 * the site. They are placed mid-article rather than as the lead image, so they read as
 * evidence inside the text rather than decoration at the top.
 *
 * `match` are words that appear in the title or summary of an article this photo suits.
 * EXIF is stripped at build time — the originals carry the GPS coordinates of the garden.
 */
export interface RealPhoto {
  /** Path under /photos, written by scripts/build-real-photos.ts. */
  file: string;
  alt: string;
  match: string[];
  /** Original filename in the phone dump; the build reads it, the site never sees it. */
  source: string;
  /** Where to crop the portrait original from. Defaults to centre; set when that misses. */
  crop?: 'top' | 'centre' | 'bottom';
}

export const REAL_PHOTOS: RealPhoto[] = [
  {
    "file": "/photos/lemonia-karpoi.jpg",
    "alt": "Λεμόνια που ωριμάζουν σε κλαδί λεμονιάς σε ελληνικό κήπο",
    "match": [
      "λεμονι",
      "εσπεριδοειδ"
    ],
    "source": "20260912_122729.jpg"
  },
  {
    "file": "/photos/lemoni-klado.jpg",
    "alt": "Λεμόνι σε κλαδί με φόντο τον ουρανό",
    "match": [
      "λεμονι",
      "εσπεριδοειδ"
    ],
    "source": "20260912_122755.jpg"
  },
  {
    "file": "/photos/lemoni-orimo.jpg",
    "alt": "Ώριμο λεμόνι ανάμεσα σε φύλλα λεμονιάς",
    "match": [
      "λεμονι",
      "εσπεριδοειδ",
      "κουμκουατ",
      "μανταριν"
    ],
    "source": "20260912_122757.jpg"
  },
  {
    "file": "/photos/lemonia-talaipwrimena-fylla.jpg",
    "alt": "Κλαδιά λεμονιάς με ταλαιπωρημένα, κρεμασμένα φύλλα μετά από ζέστη",
    "match": [
      "καυσων",
      "ξηρανσ",
      "μαρανσ",
      "ηλιακο εγκαυμ"
    ],
    "source": "20260912_122744.jpg"
  },
  {
    "file": "/photos/nearo-esperidoeides.jpg",
    "alt": "Νεαρό δεντράκι εσπεριδοειδούς λίγο μετά τη φύτευση",
    "match": [
      "μεταφυτευσ",
      "αλλαγη γλαστρ",
      "μοσχευμ",
      "πολλαπλασιασμ"
    ],
    "source": "20260912_123139.jpg"
  },
  {
    "file": "/photos/piperia-prasini.jpg",
    "alt": "Πράσινη πιπεριά έτοιμη για συγκομιδή στο φυτό",
    "match": [
      "πιπερι",
      "πιπεριε"
    ],
    "source": "20260912_122813.jpg"
  },
  {
    "file": "/photos/piperia-keratos.jpg",
    "alt": "Μακρόστενη πιπεριά κέρατο στο φυτό",
    "match": [
      "πιπερι",
      "πιπεριε"
    ],
    "source": "20260912_122828.jpg"
  },
  {
    "file": "/photos/piperies-karpoi.jpg",
    "alt": "Δύο πιπεριές σε φυτό με πλούσιο φύλλωμα",
    "match": [
      "πιπερι",
      "πιπεριε"
    ],
    "source": "20260912_123052.jpg"
  },
  {
    "file": "/photos/piperia-fyto.jpg",
    "alt": "Φυτό πιπεριάς με καρπούς σε διάφορα στάδια",
    "match": [
      "πιπερι",
      "πιπεριε",
      "μελιτζαν"
    ],
    "source": "20260912_122809.jpg"
  },
  {
    "file": "/photos/ntomatia-karpoforia.jpg",
    "alt": "Ντοματιά σε καρποφορία με ώριμη ντομάτα",
    "match": [
      "ντοματ"
    ],
    "source": "20260912_122901.jpg"
  },
  {
    "file": "/photos/ntomata-orimi.jpg",
    "alt": "Ώριμη ντομάτα πάνω σε στρώση ξερών φύλλων",
    "match": [
      "ντοματ"
    ],
    "source": "20260912_122934.jpg"
  },
  {
    "file": "/photos/prasines-ntomates.jpg",
    "alt": "Πράσινες ντομάτες που δεν έχουν ωριμάσει ακόμα",
    "match": [
      "ντοματ"
    ],
    "source": "20260912_122917.jpg"
  },
  {
    "file": "/photos/ntomaties-ypostylosi.jpg",
    "alt": "Ντοματιές δεμένες σε υποστύλωση με δίχτυ",
    "match": [
      "υποστυλωσ",
      "λαιμαργ",
      "καθετη καλλιεργ"
    ],
    "source": "20260912_123005.jpg"
  },
  {
    "file": "/photos/kolokythia-fyta.jpg",
    "alt": "Φυτά κολοκυθιάς σε ανοιχτό λαχανόκηπο",
    "match": [
      "κολοκυθ"
    ],
    "source": "20260912_123008.jpg"
  },
  {
    "file": "/photos/anthos-kolokythias.jpg",
    "alt": "Άνθος κολοκυθιάς λίγο πριν ανοίξει",
    "match": [
      "κολοκυθ",
      "επικονιασ"
    ],
    "source": "20260912_123038.jpg"
  },
  {
    "file": "/photos/aggouri-fyto.jpg",
    "alt": "Αγγούρι που μεγαλώνει σε υποστυλωμένο φυτό",
    "match": [
      "αγγουρ"
    ],
    "source": "20260912_123034.jpg"
  },
  {
    "file": "/photos/stagdin-ardefsi.jpg",
    "alt": "Σταλακτηφόροι άρδευσης πάνω σε οργανική εδαφοκάλυψη",
    "match": [
      "σταγδην",
      "σταλακτ",
      "αρδευσ",
      "αυτοματο ποτισμ",
      "εξυπνο ποτισμ",
      "αισθητηρ",
      "ηλεκτροβαν",
      "προγραμματιστ",
      "δοσομετρητ",
      "fertigation",
      "υδροπον",
      "ποτισμ"
    ],
    "source": "20260912_123111.jpg"
  },
  {
    "file": "/photos/mavro-mulch-anarrixomena.jpg",
    "alt": "Αναρριχώμενα λαχανικά σε γραμμή με μαύρο πλαστικό εδαφοκάλυψης",
    "match": [
      "εδαφοκαλυψ",
      "ζιζαν",
      "mulch",
      "ξηροφυτ",
      "xeriscap"
    ],
    "source": "20260912_123102.jpg"
  },
  {
    "file": "/photos/kitrina-fylla.jpg",
    "alt": "Φυτά με κιτρινισμένα φύλλα στα χαμηλά κλαδιά",
    "match": [
      "κιτριν",
      "χλωρωσ",
      "τροφοπεν",
      "τετρανυχ",
      "μελιγκρ",
      "αφιδ",
      "περονοσπορ",
      "ωιδιο",
      "μυκητ",
      "ασθενει"
    ],
    "source": "20260912_123002.jpg"
  },
  {
    "file": "/photos/fasolia-anarrixomena.jpg",
    "alt": "Αναρριχώμενα φασόλια σε κάθετη υποστύλωση",
    "match": [
      "φασολ",
      "μπιζελ",
      "αναρριχ"
    ],
    "source": "20260912_123054.jpg"
  },
  {
    "file": "/photos/lachanika-seires.jpg",
    "alt": "Σειρές λαχανικών σε λαχανόκηπο στα τέλη καλοκαιριού",
    "match": [
      "λαχανοκηπ",
      "παρτερ",
      "αμειψισπορ",
      "μαρουλ",
      "σπανακ",
      "ροκα",
      "φυλλωδ",
      "συγκαλλιεργ",
      "καροτ",
      "παντζαρ",
      "ραπαν",
      "σκορδ",
      "κρεμμυδ",
      "φραουλ",
      "σπορα",
      "αρχαρι",
      "σχοινοπρασ"
    ],
    "source": "20260912_123040.jpg"
  },
  {
    "file": "/photos/dentrakia-seira.jpg",
    "alt": "Νεαρά δεντράκια φυτεμένα σε σειρά με πρωινό φως",
    "match": [
      "οπωροφορ",
      "δεντροφυτευσ",
      "συκι",
      "συκια",
      "ροδι",
      "αβοκαντο",
      "μπανανι",
      "αμπελ",
      "κληματαρ",
      "θαμν",
      "ελια",
      "ελιες"
    ],
    "source": "20260912_123106.jpg"
  }
];
