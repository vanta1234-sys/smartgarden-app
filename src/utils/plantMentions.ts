import { PLANT_INDEX } from '../data/plantIndex';

/**
 * Which plants an article actually talks about.
 *
 * The 57 /fyta pages are the thinnest thing in the sitemap and almost nothing links to
 * them, so they have little reason to be crawled. An article that discusses tomatoes
 * should point at the tomato page; that is a real link for a reader and the only inbound
 * link most of those pages get.
 *
 * Mirrored by sg_plants_mentioned in public/ssr-lib.php — the crawler is served that
 * version and then renders this one, and they have to agree.
 */

/** Greek moves its accent when a word inflects, so both sides are compared unaccented. */
const flat = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * "Ντομάτα" has to match "ντομάτας" and "ντομάτες", so a long name gives up its last
 * letter. Short ones do not: "Λάχανο" shortened to "λαχαν" matches "λαχανικά", which is a
 * different word, and "Ελιά" shortened matches half the dictionary.
 */
function stems(name: string): string[] {
  return name.split('/').map((part) => {
    const f = flat(part.trim());
    return f.length > 6 ? f.slice(0, -1) : f;
  }).filter((s) => s.length >= 4);
}

const TABLE = PLANT_INDEX.map((p) => ({ ...p, stems: stems(p.name) }));

/**
 * The stem has to be a whole word, give or take an ending.
 *
 * Starting a word is not enough on its own: without the leading check "παρακάτω" was an
 * Αρακάς, "υδροδιαλυτό" a Ροδιά and "προκαλεί" a Ρόκα, which put those three links on all
 * 71 articles — and without the trailing one, "λαχανόκηπος" was a Λάχανο. Greek inflection
 * adds at most a few letters, so anything longer is a different word.
 */
const MAX_ENDING = 3;

function firstMention(hay: string, stem: string): number {
  let from = 0;
  for (;;) {
    const i = hay.indexOf(stem, from);
    if (i < 0) return -1;
    from = i + 1;
    const before = i === 0 ? '' : hay[i - 1];
    if (before && /\p{L}/u.test(before)) continue;
    let after = 0;
    while (after <= MAX_ENDING && /\p{L}/u.test(hay[i + stem.length + after] || '')) after++;
    if (after <= MAX_ENDING) return i;
  }
}

export function plantsMentioned(text: string, limit = 6): Array<{ slug: string; name: string }> {
  const hay = flat(text || '');
  if (!hay) return [];
  const found: Array<{ slug: string; name: string; at: number }> = [];
  for (const p of TABLE) {
    let at = -1;
    for (const s of p.stems) {
      const i = firstMention(hay, s);
      if (i >= 0 && (at < 0 || i < at)) at = i;
    }
    if (at >= 0) found.push({ slug: p.slug, name: p.name, at });
  }
  // Earliest mention first: the plant the article opens with is the one it is about.
  found.sort((a, b) => a.at - b.at);
  return found.slice(0, limit).map(({ slug, name }) => ({ slug, name }));
}
