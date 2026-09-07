// Advanced Greek phonetic acoustic transliteration for English Text-To-Speech synthesis engine
// Converts Greek spelling into Anglo-phonetic syllables so an English TTS engine pronounces
// fluent, accent-correct, natural sounding Greek with zero spell-out and zero English butchering.

export function convertGreekToAcousticPhonetic(greekText: string): string {
  let s = greekText;

  // Common botanical & gardening words optimized for English TTS ear
  const wordReplacements: [RegExp, string][] = [
    [/\bφυτά\b|\bφυτα\b/gi, 'feet-TAH'],
    [/\bφυτό\b|\bφυτο\b/gi, 'feet-TOH'],
    [/\bκήπος\b|\bκηπος\b/gi, 'KEE-poss'],
    [/\bκήπο\b|\bκηπο\b/gi, 'KEE-poh'],
    [/\bμπαλκόνι\b|\bμπαλκονι\b/gi, 'bahl-KOH-nee'],
    [/\bμπαλκόνια\b|\bμπαλκονια\b/gi, 'bahl-KOH-nyah'],
    [/\bπότισμα\b|\bποτισμα\b/gi, 'POH-tees-mah'],
    [/\bποτίζετε\b|\bποτιζετε\b/gi, 'poh-TEE-zeh-teh'],
    [/\bπότισες\b|\bποτισες\b/gi, 'POH-tee-ses'],
    [/\bλίπασμα\b|\bλιπασμα\b/gi, 'LEE-pahs-mah'],
    [/\bλίπανση\b|\bλιπανση\b/gi, 'LEE-pahn-see'],
    [/\bχώμα\b|\bχωμα\b/gi, 'HOH-mah'],
    [/\bγλάστρα\b|\bγλαστρα\b/gi, 'GLAHS-trah'],
    [/\bγλάστρες\b|\bγλαστρες\b/gi, 'GLAHS-tres'],
    [/\bλουλούδια\b|\bλουλουδια\b/gi, 'loo-LOO-dyah'],
    [/\bρίζες\b|\bριζες\b/gi, 'REE-zes'],
    [/\bφύλλα\b|\bφυλλα\b/gi, 'FEE-lah'],
    [/\bφως\b/gi, 'foss'],
    [/\bήλιος\b|\bηλιος\b/gi, 'EE-lee-oss'],
    [/\bήλιο\b|\bηλιο\b/gi, 'EE-lee-oh'],
    [/\bσκιά\b|\bσκια\b/gi, 'skee-AH'],
    [/\bνερό\b|\bνερο\b/gi, 'neh-ROH'],
    [/\bνερού\b|\bνερου\b/gi, 'neh-ROO'],
    [/\bλάθος\b|\bλαθος\b/gi, 'LAH-thoss'],
    [/\bλάθη\b|\bλαθη\b/gi, 'LAH-thee'],
    [/\bμυστικό\b|\bμυστικο\b/gi, 'mee-stee-KOH'],
    [/\bμυστικά\b|\bμυστικα\b/gi, 'mee-stee-KAH'],
    [/\bσυμβουλή\b|\bσυμβουλη\b/gi, 'seem-voo-LEE'],
    [/\bσυμβουλές\b|\bσυμβουλες\b/gi, 'seem-voo-LES'],
    [/\bπροσοχή\b|\bπροσοχη\b/gi, 'proh-soh-HEE'],
    [/\bπάντα\b|\bπαντα\b/gi, 'PAHN-tah'],
    [/\bποτέ\b|\bποτε\b/gi, 'poh-TEH'],
    [/\bτώρα\b|\bτωρα\b/gi, 'TOH-rah'],
    [/\bσήμερα\b|\bσημερα\b/gi, 'SEE-meh-rah'],
    [/\bSmartGarden\b|\bSmart Garden\b/gi, 'Smart Garden'],
    [/\bκαι\b/gi, 'keh'],
    [/\bγια\b/gi, 'yah'],
    [/\bνα\b/gi, 'nah'],
    [/\bτο\b/gi, 'toh'],
    [/\bτα\b/gi, 'tah'],
    [/\bτα\b/gi, 'tah'],
    [/\bτη\b|\bτην\b/gi, 'teen'],
    [/\bτο\b|\bτον\b/gi, 'tohn'],
    [/\bτους\b/gi, 'toos'],
    [/\bτης\b/gi, 'tees'],
    [/\bτων\b/gi, 'tohn'],
    [/\bστο\b/gi, 'stoh'],
    [/\bστη\b|\bστην\b/gi, 'steen'],
    [/\bστα\b/gi, 'stah'],
    [/\bστους\b/gi, 'stoos'],
    [/\bστις\b/gi, 'stees'],
    [/\bαπό\b|\bαπο\b/gi, 'ah-POH'],
    [/\bμε\b/gi, 'meh'],
    [/\bσε\b/gi, 'seh'],
    [/\bδεν\b/gi, 'then'],
    [/\bμην\b|\bμη\b/gi, 'mee'],
    [/\bείναι\b|\bειναι\b/gi, 'EE-neh'],
    [/\bέχει\b|\bεχει\b/gi, 'EH-hee'],
    [/\bέχουν\b|\bεχουν\b/gi, 'EH-hoon'],
    [/\bπώς\b|\bπως\b/gi, 'pohss'],
    [/\bπού\b|\bπου\b/gi, 'poo'],
    [/\bόταν\b|\bοταν\b/gi, 'OH-tahn'],
    [/\bόπως\b|\bοπως\b/gi, 'OH-pohss'],
    [/\bγιατί\b|\bγιατι\b/gi, 'yah-TEE'],
    [/\bπολύ\b|\bπολυ\b/gi, 'poh-LEE'],
    [/\bκαλά\b|\bκαλα\b/gi, 'kah-LAH'],
    [/\bπρώτο\b|\bπρωτο\b/gi, 'PROH-toh'],
    [/\bδεύτερο\b|\bδευτερο\b/gi, 'THEF-teh-roh'],
    [/\bτρίτο\b|\bτριτο\b/gi, 'TREE-toh']
  ];

  for (const [pattern, repl] of wordReplacements) {
    s = s.replace(pattern, repl);
  }

  // Digraphs & Diphthongs
  const digraphs: [RegExp, string][] = [
    [/μπ/gi, 'b'],
    [/ντ/gi, 'd'],
    [/γκ/gi, 'g'],
    [/γγ/gi, 'ng'],
    [/τσ/gi, 'ts'],
    [/τζ/gi, 'dz'],
    [/αι/gi, 'eh'],
    [/άι|αϊ/gi, 'ah-ee'],
    [/ει/gi, 'ee'],
    [/οι/gi, 'ee'],
    [/ου/gi, 'oo'],
    [/αυ(?=[θκξπστφχψ\s]|$)/gi, 'af'],
    [/αυ/gi, 'av'],
    [/ευ(?=[θκξπστφχψ\s]|$)/gi, 'ef'],
    [/ευ/gi, 'ev'],
    [/ηυ/gi, 'eev']
  ];

  for (const [pattern, repl] of digraphs) {
    s = s.replace(pattern, repl);
  }

  // Individual character transliteration
  const charMap: { [key: string]: string } = {
    'α': 'ah', 'ά': 'ah', 'Α': 'Ah', 'Ά': 'Ah',
    'β': 'v', 'Β': 'V',
    'γ': 'gh', 'Γ': 'Gh',
    'δ': 'th', 'Δ': 'Th',
    'ε': 'eh', 'έ': 'eh', 'Ε': 'Eh', 'Έ': 'Eh',
    'ζ': 'z', 'Ζ': 'Z',
    'η': 'ee', 'ή': 'ee', 'Η': 'Ee', 'Ή': 'Ee',
    'θ': 'th', 'Θ': 'Th',
    'ι': 'ee', 'ί': 'ee', 'ΐ': 'ee', 'ϊ': 'ee', 'Ι': 'Ee', 'Ί': 'Ee',
    'κ': 'k', 'Κ': 'K',
    'λ': 'l', 'Λ': 'L',
    'μ': 'm', 'Μ': 'M',
    'ν': 'n', 'Ν': 'N',
    'ξ': 'x', 'Ξ': 'X',
    'ο': 'oh', 'ό': 'oh', 'Ο': 'Oh', 'Ό': 'Oh',
    'π': 'p', 'Π': 'P',
    'ρ': 'r', 'Ρ': 'R',
    'σ': 's', 'ς': 's', 'Σ': 'S',
    'τ': 't', 'Τ': 'T',
    'υ': 'ee', 'ύ': 'ee', 'ΰ': 'ee', 'ϋ': 'ee', 'Υ': 'Ee', 'Ύ': 'Ee',
    'φ': 'f', 'Φ': 'F',
    'χ': 'h', 'Χ': 'H',
    'ψ': 'ps', 'Ψ': 'Ps',
    'ω': 'oh', 'ώ': 'oh', 'Ω': 'Oh', 'Ώ': 'Oh'
  };

  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    out += charMap[ch] !== undefined ? charMap[ch] : ch;
  }

  // Clean up double vowels or harsh breaks created by character joining
  return out
    .replace(/ee-ee/g, 'ee')
    .replace(/ah-ah/g, 'ah')
    .replace(/oh-oh/g, 'oh')
    .replace(/\s+/g, ' ')
    .trim();
}
