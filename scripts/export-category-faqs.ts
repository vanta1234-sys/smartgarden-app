/**
 * Mirror the per-category FAQs into public/category-faqs.json for article.php.
 *
 * The questions were rendered and marked up only after React mounted. Google does run
 * JavaScript, but it runs it late and only if the page's own fetch of latest_articles.json
 * succeeds during that render — so the one piece of markup most likely to earn a rich
 * result was the least reliably seen. Serving it in the HTML removes both conditions.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATEGORY_FAQS, DEFAULT_FAQS } from '../src/data/categoryFaqs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, '..', 'public', 'category-faqs.json');

fs.writeFileSync(out, JSON.stringify({ byCategory: CATEGORY_FAQS, default: DEFAULT_FAQS }, null, 2), 'utf8');
const n = Object.values(CATEGORY_FAQS).reduce((s, v) => s + v.length, 0);
console.log(`category-faqs.json: ${Object.keys(CATEGORY_FAQS).length} categories, ${n} questions`);
