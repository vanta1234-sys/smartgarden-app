/**
 * The short <title>, client side.
 *
 * article.php works out a title that fits a search result and writes it into the HTML —
 * and then injectArticleSchema overwrote it with the full headline plus the brand, on
 * every article. Google renders JavaScript, so the version it kept was the long one and
 * the server-side work counted for nothing.
 *
 * Mirrors sg_seo_title / sg_seo_title_unique in public/ssr-lib.php. Both must agree.
 */

const BRAND = ' | SmartGarden.gr';
const MAX = 60;
const STOP = new Set([
  'με', 'και', 'σε', 'για', 'στο', 'στη', 'στην', 'στον', 'στα', 'στις', 'από', 'του',
  'της', 'των', 'το', 'τα', 'τη', 'την', 'τον', 'οι', 'ο', 'η', '&',
]);

/** Tidy the end of a cut title: no unclosed bracket, no trailing function word. */
function trimDangling(cut: string): string {
  let s = cut.replace(/[\s:;(—–,\-]+$/u, '');
  const opens = (s.match(/\(/g) || []).length;
  const closes = (s.match(/\)/g) || []).length;
  if (opens > closes) {
    const at = s.lastIndexOf('(');
    if (at >= 20) s = s.slice(0, at);
  }
  for (let i = 0; i < 3; i++) {
    s = s.replace(/[\s:;(—–,\-]+$/u, '');
    const sp = s.lastIndexOf(' ');
    if (sp < 20) break;
    if (!STOP.has(s.slice(sp + 1).toLowerCase())) break;
    s = s.slice(0, sp);
  }
  return s.replace(/[\s:;(—–,\-]+$/u, '');
}

export function seoTitle(title: string, max = MAX): string {
  const t = (title || '').replace(/\s+/g, ' ').trim();
  if (!t) return 'SmartGarden.gr';
  if ((t + BRAND).length <= max) return t + BRAND;
  if (t.length <= max) return t;

  // Cut where the title already breaks. ';' is the Greek question mark, so cutting there
  // keeps the question — and the question is the reason to click.
  let best = '';
  let keep = '';
  const seps: Array<[string, boolean]> = [
    [';', true], ['?', true], ['!', true], [':', false], ['(', false], ['—', false], ['–', false],
  ];
  for (const [sep, isEnd] of seps) {
    const at = t.slice(0, max).lastIndexOf(sep);
    if (at >= 30 && at > best.length) { best = t.slice(0, at); keep = isEnd ? sep : ''; }
  }
  if (best) return trimDangling(best) + keep;

  let cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  if (sp >= 30) cut = cut.slice(0, sp);
  return trimDangling(cut) + '…';
}

/**
 * The same, but distinct from every other article's.
 *
 * A republished topic is told apart only by the angle at the end of its title, which is
 * exactly what truncation removes. The corpus is set once the article list loads.
 */
let corpus: Array<{ slug?: string; title?: { el?: string } | string }> = [];
export function setSeoTitleCorpus(articles: typeof corpus) { corpus = articles || []; }

export function seoTitleFor(article: { slug?: string; title?: { el?: string } | string }): string {
  const raw = typeof article.title === 'string' ? article.title : article.title?.el || '';
  const short = seoTitle(raw);

  const clash = corpus.some((a) => {
    if (a.slug === article.slug) return false;
    const other = typeof a.title === 'string' ? a.title : a.title?.el || '';
    return other !== '' && seoTitle(other) === short;
  });
  if (!clash) return short;

  const parts = raw.replace(/\s+/g, ' ').trim().split(/\s*:\s*/);
  if (parts.length < 2) return short;
  const angle = parts.pop() as string;
  const budget = MAX - angle.length - 3;
  if (budget < 20) return short;
  return seoTitle(parts.join(': '), budget).replace(BRAND, '') + ' · ' + angle;
}

/**
 * The short <title> for a page that is not an article.
 *
 * The plant pages, the tools and the homepage were all writing their own title with the
 * brand already on the end — 69 to 94 characters, every one of them cut off in a search
 * result. This strips whatever brand suffix is there, shortens what is left, and puts the
 * brand back only if it fits.
 */
export function pageTitle(full: string): string {
  const withoutBrand = (full || '').replace(/\s*[|—–-]\s*SmartGarden\.gr\s*$/u, '').trim();
  return seoTitle(withoutBrand || 'SmartGarden.gr');
}

/**
 * A meta description that fits the snippet.
 *
 * 76 of 146 pages ran past 165 characters, so Google cut the tail — which on the plant
 * pages was the part that said what the page answers. Trimmed on a word boundary at 155,
 * which is inside every rendering width Google uses.
 */
export function metaDescription(text: string, max = 155): string {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,·;:\-]+$/u, '') + '…';
}
