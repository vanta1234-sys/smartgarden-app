// Clean up text for natural Greek Text-To-Speech (TTS) pronunciation
// Removes abbreviations, markdown, symbols, English letters and brackets
// that cause browsers with English default voices to spell out letter by letter ("ΜΙ ΕΨΙΛΟΝ...").

export function cleanGreekTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove markdown bold, italic, quotes, asterisks, brackets
  text = text.replace(/[*_#`~«»"'\(\)\[\]\{\}]/g, ' ');

  // 2. Replace common Greek abbreviations with full spoken words
  text = text.replace(/\b1ον\b|\b1ο\b/gi, 'Πρώτον, ');
  text = text.replace(/\b2ον\b|\b2ο\b/gi, 'Δεύτερον, ');
  text = text.replace(/\b3ον\b|\b3ο\b/gi, 'Τρίτον, ');
  text = text.replace(/\b4ον\b|\b4ο\b/gi, 'Τέταρτον, ');
  text = text.replace(/\bΝο1\b|\bNo1\b|\bΝο\.1\b/gi, 'νούμερο ένα');
  text = text.replace(/\bπ\.χ\./gi, 'για παράδειγμα');
  text = text.replace(/\bδηλ\./gi, 'δηλαδή');
  text = text.replace(/\bεκ\./gi, 'εκατοστά');
  text = text.replace(/\bSmartGarden\.gr\b/gi, 'Smart Garden');
  text = text.replace(/\.gr\b/gi, '');

  // 3. Remove Latin / English botanical codes or spell-out triggers (e.g. "TDR/FDR", "VPD", "pH", "Lactuca sativa")
  text = text.replace(/\bpH\b/gi, 'πε χα');
  text = text.replace(/\bTDR\/FDR\b/gi, 'αισθητήρων');
  text = text.replace(/\bVPD\b/gi, 'υγρασίας');
  text = text.replace(/\btip burn\b/gi, 'ξηράνσεων');
  text = text.replace(/\bEC\b/gi, 'αγωγιμότητας');
  text = text.replace(/[A-Za-z]+/g, ' '); // remove any remaining English words to avoid spelling out

  // 4. Remove emojis and special non-alphanumeric chars
  text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, ' ');
  text = text.replace(/[•|—–\-_/\\+=<>~@$%^&]/g, ' ');

  // 5. Normalize whitespace and punctuation
  text = text.replace(/\s+/g, ' ').trim();

  // Ensure it ends with a period for calm voice inflection
  if (text && !/[.!?]$/.test(text)) {
    text += '.';
  }

  return text;
}
