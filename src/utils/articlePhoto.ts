import { REAL_PHOTOS, RealPhoto } from '../data/realPhotos';

/**
 * Pick one of our own garden photographs for an article, and drop it into the body.
 *
 * Deliberately not the lead image: a reader arriving from search should meet the article's
 * own header photo, and the evidence that a person grew these plants belongs inside the
 * text, next to the claim it supports.
 *
 * The same rule is implemented in ssr-lib.php so that the HTML a crawler receives and the
 * page React renders agree — if they disagree, the photo is the thing Google decides was
 * injected afterwards.
 */

/** Stable per-slug pick, so two tomato articles do not both get the same tomato photo. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function pickRealPhoto(article: {
  slug?: string;
  title?: { el?: string } | string;
  summary?: { el?: string } | string;
}): RealPhoto | null {
  // Greek moves its accent when a word inflects — "κρεμμύδι" becomes "κρεμμυδιού" — so
  // matching on the accented form silently misses half the titles. Keywords in
  // realPhotos.ts are stored unaccented and the text is stripped to match.
  const flat = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const title = flat(typeof article.title === 'string' ? article.title : article.title?.el || '');
  const summary = flat(typeof article.summary === 'string' ? article.summary : article.summary?.el || '');
  // The slug carries the subject as well, and one article's title is truncated to the
  // point that only the slug still says what it is about.
  const secondary = summary + ' ' + flat((article.slug || '').replace(/-/g, ' '));
  if (!title.trim() && !summary.trim()) return null;

  // A hit in the title outranks a hit in the summary: the title says what the article is
  // about, while a summary mentions half the garden in passing.
  let best = 0;
  const hits: RealPhoto[] = [];
  for (const p of REAL_PHOTOS) {
    let score = 0;
    for (const m of p.match) {
      const k = flat(m);
      if (title.includes(k)) score = Math.max(score, 2);
      else if (secondary.includes(k)) score = Math.max(score, 1);
    }
    if (!score) continue;
    if (score > best) { best = score; hits.length = 0; }
    if (score === best) hits.push(p);
  }
  if (!hits.length) return null;
  return hits[hash(article.slug || title) % hits.length];
}

/**
 * Insert the photo before the third `##` heading — far enough in that it is not the first
 * thing on the page, early enough that most readers reach it. Articles with fewer sections
 * take the last heading, and one with no headings at all gets it appended.
 */
export function insertRealPhoto(markdown: string, photo: RealPhoto | null): string {
  if (!photo || !markdown) return markdown;
  if (markdown.includes(photo.file)) return markdown;

  const block = `\n\n![${photo.alt}](${photo.file})\n\n`;
  const positions: number[] = [];
  const re = /^##\s+/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) positions.push(m.index);

  if (!positions.length) return markdown + block;
  const at = positions[Math.min(2, positions.length - 1)];
  return markdown.slice(0, at) + block.trimStart() + '\n' + markdown.slice(at);
}
