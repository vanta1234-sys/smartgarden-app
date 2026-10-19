// Opens EVERY article page of the live site in a real headless Chrome (as a visitor, at a desktop and a phone width), scrolls through it and
// reports what a reader would notice: pictures that did not load, empty blocks, a second h1, sideways overflow.
// It exists because on 2026-10-20 the redesigned article page went live with two empty 280px AdSense blocks on every article (one above the text,
// one below it) that nobody had looked for: the local dev server has no ad slot ids, the live server has. Run it AFTER every front-end deploy.
//
// usage (cwd = repo root, Node 22+, Chrome or Edge installed):
//   node scripts/ops/check_articles.mjs [--base https://smartgarden.gr] [--only slug1,slug2] [--limit N] [--concurrency 4]
// Exit code 0 = every page clean, 1 = at least one finding (printed per slug).
import { readFileSync } from 'fs';
import { Browser } from './lib/cdp.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const base = opt('base', 'https://smartgarden.gr').replace(/\/$/, '');
const only = opt('only', '') ? opt('only', '').split(',') : null;
const limit = parseInt(opt('limit', '0'), 10);
const concurrency = parseInt(opt('concurrency', '4'), 10);

let slugs = JSON.parse(readFileSync('public/latest_articles.json', 'utf8'));
slugs = (Array.isArray(slugs) ? slugs : slugs.articles).map((a) => a.slug).filter(Boolean);
if (only) slugs = slugs.filter((s) => only.includes(s));
if (limit) slugs = slugs.slice(0, limit);

// Runs inside the page. Scrolls the reading view top to bottom (so lazy pictures load), then measures it.
const inspect = async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const root = document.querySelector('.sg-read');
  if (!root) return { problems: ['the article page did not open (no .sg-read overlay)'] };
  const problems = [];
  for (let y = 0; y < root.scrollHeight + 600; y += 650) { root.scrollTop = y; await wait(120); }
  await wait(1200);
  root.scrollTop = 0;
  await wait(200);

  if (document.querySelectorAll('h1').length !== 1) problems.push('h1 count is ' + document.querySelectorAll('h1').length);
  if (document.documentElement.scrollWidth > innerWidth + 1) problems.push('sideways overflow: page ' + document.documentElement.scrollWidth + ' wide in a ' + innerWidth + ' window');

  const broken = [...root.querySelectorAll('img')].filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => (i.getAttribute('src') || '').slice(-60));
  if (broken.length) problems.push(broken.length + ' picture(s) not loaded: ' + broken.slice(0, 3).join(' | '));

  // a block of the reading column that is tall and holds nothing a reader can see
  const col = root.querySelector('.sg-read-col');
  const holds = (el) => (el.innerText || '').trim().length > 0 || el.querySelector('img,video,svg,table,canvas,iframe');
  const blanks = [];
  for (const el of col ? col.children : []) {
    const h = el.getBoundingClientRect().height;
    if (h > 120 && !holds(el)) blanks.push(el.tagName + '.' + String(el.className).slice(0, 20) + ' ' + Math.round(h) + 'px');
  }
  if (blanks.length) problems.push('empty block(s): ' + blanks.join(', '));
  // an ad unit that takes room without holding an ad
  for (const ins of root.querySelectorAll('ins.adsbygoogle')) {
    const box = ins.parentElement.getBoundingClientRect();
    if (box.height > 8 && ins.getAttribute('data-ad-status') !== 'filled') problems.push('ad unit takes ' + Math.round(box.height) + 'px without an ad (status ' + ins.getAttribute('data-ad-status') + ')');
  }
  return { problems, textLength: (col ? col.innerText : '').length };
};

const sizes = [['desktop', 1440, 900, false], ['phone', 390, 844, true]];
const results = [];
const queue = slugs.flatMap((s) => sizes.map((z) => ({ slug: s, size: z })));
const browser = await Browser.launch({ width: 1440, height: 900 });
async function worker() {
  while (queue.length) {
    const job = queue.shift();
    const [name, w, h, mobile] = job.size;
    const page = await browser.newPage({ width: w, height: h, mobile });
    let res;
    try {
      await page.goto(`${base}/article/${job.slug}`, { settleMs: 2500, timeoutMs: 40000 });
      res = await page.eval(inspect);
      if (res && !res.problems.length && res.textLength < 1500) res.problems.push('very little text on the page (' + res.textLength + ' characters)');
    } catch (e) { res = { problems: ['could not check: ' + String(e.message).slice(0, 120)] }; }
    await page.close();
    results.push({ slug: job.slug, size: name, problems: res.problems });
    if (res.problems.length) console.log(`[${name}] ${job.slug}\n   - ${res.problems.join('\n   - ')}`);
  }
}
try { await Promise.all(Array.from({ length: concurrency }, worker)); } finally { await browser.close(); }

const bad = results.filter((r) => r.problems.length);
console.log(`\nchecked ${slugs.length} article(s) at ${sizes.length} widths: ${results.length - bad.length} page(s) clean, ${bad.length} with findings`);
process.exit(bad.length ? 1 : 0);
