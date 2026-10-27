// Builds the PHP for the eight refill #8 topics (T8.cjs) from the .md articles and inserts them at the END of $topicPool in public/cron-publish.php (CRLF file).
// Usage (cwd = repo root): node scripts/video-tools/pool/build_pool8.cjs [--write]
const fs = require('fs'), path = require('path');
const here = __dirname;
const T = require('./T8.cjs');
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
const q = (s) => '"' + esc(s) + '"';
let out = '';
for (const t of T) {
  const md = fs.readFileSync(path.join(here, t.md), 'utf8').replace(/\r\n/g, '\n').trim();
  if (/^BESPOKE\s*$/m.test(md)) throw new Error('md contains the nowdoc terminator: ' + t.md);
  if (!md.startsWith('## Σύντομη Απάντηση')) throw new Error('article must start with the short answer: ' + t.md);
  const words = (md.match(/[\p{L}\p{N}]+(?:[’‘'-][\p{L}\p{N}]+)*/gu) || []).length;
  if (words < 2200) throw new Error(t.md + ' has only ' + words + ' words');
  console.log(t.slug, words, 'words');
  out += '    array(\n'
    + '        "slug" => ' + q(t.slug) + ',\n'
    + '        "title" => ' + q(t.title) + ',\n'
    + '        "category" => ' + q(t.category) + ',\n'
    + '        "category_slug" => ' + q(t.category_slug) + ',\n'
    + '        "readTime" => ' + q(t.readTime) + ',\n'
    + '        "difficulty" => ' + q(t.difficulty) + ',\n'
    + '        "difficultyLabel" => ' + q(t.difficulty) + ',\n'
    + '        "image" => ' + q(/^https?:/.test(t.image) ? t.image : 'https://images.unsplash.com/' + t.image + '?w=1200&auto=format&fit=crop&q=80') + ',\n'
    + '        "summary" => ' + q(t.summary) + ',\n'
    + '        "botanical" => ' + q(t.botanical) + ',\n'
    + '        "ph" => ' + q(t.ph) + ',\n'
    + '        "ec" => ' + q(t.ec) + ',\n'
    + '        "temp" => ' + q(t.temp) + ',\n'
    + '        "keyTakeaways" => array(\n' + t.keyTakeaways.map((k) => '            ' + q(k)).join(',\n') + '\n        ),\n'
    + '        "prompt_focus" => ' + q(t.prompt_focus) + ',\n'
    + '        "bespoke_article" => <<<\'BESPOKE\'\n' + md + '\nBESPOKE\n,\n    ),\n';
}
out = out.replace(/\n/g, '\r\n');
fs.writeFileSync(path.join(here, 'pool_entries.php.txt'), out, 'utf8');
if (process.argv.includes('--write')) {
  const file = 'public/cron-publish.php';
  let src = fs.readFileSync(file, 'utf8');
  const anchor = '    ),\r\n);\r\n\r\n// ==========================================\r\n// 4. LOAD & RESOLVE EXISTING ARTICLES';
  if (src.split(anchor).length !== 2) throw new Error('anchor not found exactly once');
  for (const t of T) if (src.includes('"' + t.slug + '"')) throw new Error('slug already in the file: ' + t.slug);
  src = src.replace(anchor, () => '    ),\r\n' + out + ');\r\n\r\n// ==========================================\r\n// 4. LOAD & RESOLVE EXISTING ARTICLES');
  fs.writeFileSync(file, src, 'utf8');
  console.log('written to', file);
}
