// Moon phase from date — pure arithmetic, no API, no key, works offline.
//
// Reference new moon: 2000-01-06 18:14 UTC. The synodic month (new moon to new moon)
// averages 29.530588853 days. That average drifts by a few hours against any single
// real lunation because the Moon's orbit is elliptical, which is well inside the
// tolerance of "which phase are we in today".

const SYNODIC_MONTH = 29.530588853;
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

export type PhaseId =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export interface LunarInfo {
  /** 0 = new moon, 0.5 = full moon, approaches 1 back at new. */
  fraction: number;
  /** Days elapsed since the last new moon. */
  ageDays: number;
  /** Illuminated share of the disc, 0-1. */
  illumination: number;
  phaseId: PhaseId;
  phaseName: string;
  emoji: string;
  /** Γέμιση (waxing) or Χάση (waning) — the distinction Greek tradition turns on. */
  waxing: boolean;
  periodLabel: string;
  daysToNextNewMoon: number;
  daysToNextFullMoon: number;
}

export function getLunarInfo(date: Date = new Date()): LunarInfo {
  const elapsed = date.getTime() - REFERENCE_NEW_MOON;
  const days = elapsed / 86400000;
  let age = days % SYNODIC_MONTH;
  if (age < 0) age += SYNODIC_MONTH;
  const fraction = age / SYNODIC_MONTH;

  // Illuminated fraction of the disc, from the phase angle.
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2;

  const table: { id: PhaseId; name: string; emoji: string }[] = [
    { id: 'new', name: 'Νέα Σελήνη', emoji: '🌑' },
    { id: 'waxing-crescent', name: 'Αύξων Μηνίσκος', emoji: '🌒' },
    { id: 'first-quarter', name: 'Πρώτο Τέταρτο', emoji: '🌓' },
    { id: 'waxing-gibbous', name: 'Αύξουσα Αμφίκυρτος', emoji: '🌔' },
    { id: 'full', name: 'Πανσέληνος', emoji: '🌕' },
    { id: 'waning-gibbous', name: 'Φθίνουσα Αμφίκυρτος', emoji: '🌖' },
    { id: 'last-quarter', name: 'Τελευταίο Τέταρτο', emoji: '🌗' },
    { id: 'waning-crescent', name: 'Φθίνων Μηνίσκος', emoji: '🌘' },
  ];
  // Eight equal segments, offset by half a segment so each named phase is centred on
  // its exact moment rather than starting at it.
  const index = Math.floor((fraction * 8 + 0.5) % 8);
  const phase = table[index];

  const waxing = fraction < 0.5;
  const daysToNextNewMoon = SYNODIC_MONTH - age;
  const daysToNextFullMoon = age < SYNODIC_MONTH / 2
    ? SYNODIC_MONTH / 2 - age
    : SYNODIC_MONTH + SYNODIC_MONTH / 2 - age;

  return {
    fraction,
    ageDays: age,
    illumination,
    phaseId: phase.id,
    phaseName: phase.name,
    emoji: phase.emoji,
    waxing,
    periodLabel: waxing ? 'Γέμιση' : 'Χάση',
    daysToNextNewMoon,
    daysToNextFullMoon,
  };
}

export interface LunarGuidance {
  headline: string;
  /** What the tradition says to do in this phase. */
  traditional: string[];
  /** What the tradition says to avoid. */
  avoid: string[];
  /**
   * The honest part. Where a traditional practice lines up with a real agronomic
   * reason, say so; where it does not, say that too. The site's whole claim is
   * scientific accuracy, so presenting folklore as fact would cost more than the
   * search traffic is worth.
   */
  agronomyNote: string;
}

export function getLunarGuidance(info: LunarInfo): LunarGuidance {
  if (info.phaseId === 'new' || info.phaseId === 'waxing-crescent') {
    return {
      headline: 'Περίοδος σποράς φυλλωδών',
      traditional: [
        'Σπορά φυλλωδών λαχανικών: μαρούλι, σπανάκι, ρόκα, λάχανο',
        'Σπορά αρωματικών με φύλλωμα: μαϊντανός, άνηθος, βασιλικός',
        'Εμβολιασμοί και πολλαπλασιασμός με μοσχεύματα',
      ],
      avoid: ['Αυστηρό κλάδεμα', 'Συγκομιδή για μακρά αποθήκευση'],
      agronomyNote:
        'Η παράδοση λέει ότι οι χυμοί ανεβαίνουν προς το φύλλωμα καθώς γεμίζει το φεγγάρι. Ελεγχόμενες μελέτες δεν έχουν επιβεβαιώσει επίδραση της σελήνης στη βλάστηση. Αυτό που μετράει αποδεδειγμένα αυτή την εποχή είναι η θερμοκρασία εδάφους και η υγρασία — δείτε τις ημερομηνίες παγετού της περιοχής σας.',
    };
  }
  if (info.phaseId === 'first-quarter' || info.phaseId === 'waxing-gibbous') {
    return {
      headline: 'Περίοδος σποράς καρποφόρων',
      traditional: [
        'Σπορά και φύτευση καρποφόρων: ντομάτα, πιπεριά, μελιτζάνα, κολοκύθι',
        'Φύτευση οσπρίων: φασόλια, αρακάς',
        'Λίπανση με έμφαση στην ανθοφορία',
      ],
      avoid: ['Μεταφύτευση ριζωδών', 'Κλάδεμα αναζωογόνησης'],
      agronomyNote:
        'Η διάκριση «καρποφόρα στη γέμιση» δεν έχει πειραματική στήριξη. Ο πραγματικός παράγοντας επιτυχίας για ντομάτα και πιπεριά είναι η νυχτερινή θερμοκρασία: κάτω από 15°C η γονιμοποίηση αποτυγχάνει, όσο ευνοϊκό κι αν είναι το φεγγάρι.',
    };
  }
  if (info.phaseId === 'full' || info.phaseId === 'waning-gibbous') {
    return {
      headline: 'Περίοδος ριζωδών και μεταφύτευσης',
      traditional: [
        'Σπορά ριζωδών: καρότο, ραπανάκι, παντζάρι, κρεμμύδι, σκόρδο',
        'Μεταφύτευση δενδρυλλίων και θάμνων',
        'Φύτευση βολβών',
      ],
      avoid: ['Σπορά φυλλωδών', 'Ψεκασμοί με λιπάσματα φυλλώματος'],
      agronomyNote:
        'Η μεταφύτευση όντως πετυχαίνει καλύτερα αυτή την περίοδο του φθινοπώρου — αλλά ο λόγος είναι το δροσερότερο έδαφος και η μειωμένη διαπνοή, όχι η φάση της σελήνης. Η ίδια εργασία σε πανσέληνο μέσα στον καύσωνα αποτυγχάνει εξίσου.',
    };
  }
  return {
    headline: 'Περίοδος κλαδέματος και εδάφους',
    traditional: [
      'Κλάδεμα δέντρων και θάμνων',
      'Βοτάνισμα και καταπολέμηση ζιζανίων',
      'Προετοιμασία εδάφους, κομποστοποίηση, λίπανση βάσης',
      'Συγκομιδή για αποθήκευση',
    ],
    avoid: ['Σπορά', 'Μεταφύτευση'],
    agronomyNote:
      'Το κλάδεμα «στη χάση» είναι η πιο διαδεδομένη ελληνική πρακτική. Δεν υπάρχει τεκμηρίωση ότι η σελήνη επηρεάζει την επούλωση των τομών. Αυτό που επηρεάζει πραγματικά είναι η εποχή και ο καιρός: κλαδεύετε σε στεγνή μέρα, εκτός περιόδου παγετού, με απολυμασμένο εργαλείο.',
  };
}
