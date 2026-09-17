<?php
/**
 * SmartGarden.gr - Put real content in the HTML for every page, not just articles.
 *
 * article.php was fixed on 2026-09-17 and went from 0 to ~3,800 characters of crawlable
 * text. The other 75 URLs in the sitemap — the homepage included — still answered with a
 * single character: the SPA shell, identical on every one of them. Search Console had
 * already filed 158 pages as duplicates, and pages that look identical to a crawler is
 * exactly how that happens.
 *
 * Everything rendered here comes from data the server already holds. React replaces the
 * markup the moment it mounts, so a reader never sees it; a crawler sees a different,
 * genuinely descriptive page at every URL.
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

function sg_e($t) {
    return htmlspecialchars((string) $t, ENT_QUOTES, 'UTF-8');
}

/**
 * Drop a block of markup inside #root, plus optional structured data.
 *
 * Inside #root specifically: React owns that node and wipes it on mount, so there is no
 * chance of the server copy lingering under the live app and showing twice.
 */
function sg_inject_body($html, $blockHtml, $ld = null) {
    $insert = '<div id="root">' . $blockHtml . '</div>';
    if ($ld) {
        $insert .= "\n" . '<script type="application/ld+json">'
                 . json_encode($ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>';
    }
    return preg_replace('/<div id="root">\s*<\/div>/', $insert, $html, 1);
}

/** Article teaser list — the main source of internal links for a crawler. */
function sg_article_list($articles, $limit = 24, $heading = null) {
    $out = $heading ? '<h2>' . sg_e($heading) . '</h2>' : '';
    $out .= '<ul>';
    $n = 0;
    foreach ($articles as $a) {
        if ($n++ >= $limit) break;
        // Older records store title/summary as plain strings, newer ones as {el, en}.
        // Falling through to the array itself would reach htmlspecialchars and fatal.
        $t = $a['title']['el'] ?? (is_string($a['title'] ?? null) ? $a['title'] : '');
        $s = $a['summary']['el'] ?? (is_string($a['summary'] ?? null) ? $a['summary'] : '');
        $slug = $a['slug'] ?? '';
        if ($t === '' || $slug === '') continue;
        $out .= '<li><a href="/article/' . sg_e(rawurlencode($slug)) . '">' . sg_e($t) . '</a>'
              . ($s !== '' ? ' — ' . sg_e(mb_substr($s, 0, 160, 'UTF-8')) : '') . '</li>';
    }
    return $out . '</ul>';
}

/** Breadcrumbs, so Google can see where a page sits rather than inferring it. */
function sg_breadcrumbs(array $trail) {
    $items = array();
    $i = 1;
    foreach ($trail as $name => $url) {
        $items[] = array(
            '@type' => 'ListItem',
            'position' => $i++,
            'name' => $name,
            'item' => $url,
        );
    }
    return array('@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $items);
}

/**
 * A <title> that survives the search results page.
 *
 * 62 of 71 article titles were over 65 characters before the " | SmartGarden.gr" suffix
 * was even added, so Google truncated them mid-word and the reader saw a headline with
 * its point cut off. The <h1> keeps the full title; only the tab and the result snippet
 * get the short form, cut at a boundary the author already put there.
 */
function sg_seo_title($title, $brand = ' | SmartGarden.gr', $max = 60) {
    $t = trim(preg_replace('/\s+/u', ' ', (string) $title));
    if ($t === '') return 'SmartGarden.gr';
    if (mb_strlen($t . $brand, 'UTF-8') <= $max) return $t . $brand;
    if (mb_strlen($t, 'UTF-8') <= $max) return $t;

    // Prefer cutting where the title already breaks. ';' is the Greek question mark, so
    // cutting there keeps the question — and the question is the reason to click.
    $best = '';
    $keep = '';
    foreach (array(';' => true, '?' => true, '!' => true, ':' => false, '(' => false,
                   '—' => false, '–' => false) as $sep => $isSentenceEnd) {
        $pos = mb_strrpos(mb_substr($t, 0, $max, 'UTF-8'), $sep, 0, 'UTF-8');
        if ($pos !== false && $pos >= 30 && $pos > mb_strlen($best, 'UTF-8')) {
            $best = mb_substr($t, 0, $pos, 'UTF-8');
            $keep = $isSentenceEnd ? $sep : '';
        }
    }
    if ($best !== '') return sg_trim_dangling($best) . $keep;

    $cut = mb_substr($t, 0, $max - 1, 'UTF-8');
    $sp = mb_strrpos($cut, ' ', 0, 'UTF-8');
    if ($sp !== false && $sp >= 30) $cut = mb_substr($cut, 0, $sp, 'UTF-8');
    return sg_trim_dangling($cut) . '…';
}

/**
 * Tidy the end of a cut title.
 *
 * Cutting mid-phrase left things like "Εσπεριδοειδή σε Γλάστρα (Λεμονιά…", where the
 * bracket never closes, and "Κομποστοποίηση στο Μπαλκόνι με…", which ends on a preposition
 * and reads as though the sentence broke. Both are the first thing a searcher sees.
 */
function sg_trim_dangling($cut) {
    $cut = preg_replace('/[\s:;(—–,\-]+$/u', '', (string) $cut);
    // An opening bracket with no closing one: drop the fragment it opened.
    if (mb_substr_count($cut, '(', 'UTF-8') > mb_substr_count($cut, ')', 'UTF-8')) {
        $pos = mb_strrpos($cut, '(', 0, 'UTF-8');
        if ($pos !== false && $pos >= 20) $cut = mb_substr($cut, 0, $pos, 'UTF-8');
    }
    // Trailing function words, which carry nothing and look like a dropped line.
    $stop = array('με', 'και', 'σε', 'για', 'στο', 'στη', 'στην', 'στον', 'στα', 'στις',
                  'από', 'του', 'της', 'των', 'το', 'τα', 'τη', 'την', 'τον', 'οι', 'ο', 'η', '&');
    for ($i = 0; $i < 3; $i++) {
        $cut = preg_replace('/[\s:;(—–,\-]+$/u', '', $cut);
        $sp = mb_strrpos($cut, ' ', 0, 'UTF-8');
        if ($sp === false || $sp < 20) break;
        $last = mb_strtolower(mb_substr($cut, $sp + 1, null, 'UTF-8'), 'UTF-8');
        if (!in_array($last, $stop, true)) break;
        $cut = mb_substr($cut, 0, $sp, 'UTF-8');
    }
    return preg_replace('/[\s:;(—–,\-]+$/u', '', $cut);
}

/**
 * A description no other page on the site is also using.
 *
 * The publisher gives a republished topic a new angle and a new title but copies the
 * summary across, so five pairs of articles were handing Google the same meta description
 * on two URLs — which is one of the ways a page gets filed as a duplicate of another.
 * When the summary is not unique, the article's own opening prose stands in.
 */
function sg_unique_description($article, $allArticles, $max = 200) {
    $g = function ($f) use ($article) {
        return $f['el'] ?? (is_string($f ?? null) ? $f : '');
    };
    $summary = trim($g($article['summary'] ?? ''));
    $slug = $article['slug'] ?? '';

    $clashes = 0;
    foreach ($allArticles as $a) {
        if (($a['slug'] ?? '') === $slug) continue;
        $other = $a['summary']['el'] ?? (is_string($a['summary'] ?? null) ? $a['summary'] : '');
        if (trim($other) !== '' && trim($other) === $summary) { $clashes++; break; }
    }
    if ($summary !== '' && !$clashes) return mb_substr($summary, 0, $max, 'UTF-8');

    // Fall back to the first real paragraph: skip headings, lists, tables and emphasis-only
    // lines, and strip the markdown so what lands in the tag is prose.
    $body = $article['content']['el'] ?? (is_string($article['content'] ?? null) ? $article['content'] : '');
    foreach (preg_split("/[\r\n]+/", (string) $body) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || $line[0] === '|' || $line[0] === '-'
            || $line[0] === '*' || $line[0] === '>') continue;
        $line = trim(preg_replace('/[*_`#]/u', '', $line));
        if (mb_strlen($line, 'UTF-8') < 80) continue;
        $cut = mb_substr($line, 0, $max, 'UTF-8');
        $sp = mb_strrpos($cut, ' ', 0, 'UTF-8');
        if ($sp !== false && $sp > 120) $cut = mb_substr($cut, 0, $sp, 'UTF-8');
        return rtrim($cut) . (mb_strlen($line, 'UTF-8') > mb_strlen($cut, 'UTF-8') ? '…' : '');
    }
    return mb_substr($summary, 0, $max, 'UTF-8');
}

/**
 * The short title, kept distinct from every other article's.
 *
 * A republished topic gets a new angle appended to the old title (": Προχωρημένος Οδηγός",
 * ": Ερωτήσεις & Απαντήσεις") — so the one part that tells the two articles apart is the
 * part at the very end, which is exactly what truncation removes. Four pairs came out of
 * sg_seo_title() with identical titles. When that happens the angle is kept and the base
 * gives up the room for it.
 */
function sg_seo_title_unique($rawTitle, $allArticles, $slug, $max = 60) {
    $short = sg_seo_title($rawTitle, ' | SmartGarden.gr', $max);

    $clash = false;
    foreach ($allArticles as $a) {
        if (($a['slug'] ?? '') === $slug) continue;
        $other = $a['title']['el'] ?? (is_string($a['title'] ?? null) ? $a['title'] : '');
        if ($other !== '' && sg_seo_title($other, ' | SmartGarden.gr', $max) === $short) { $clash = true; break; }
    }
    if (!$clash) return $short;

    $parts = preg_split('/\s*:\s*/u', trim(preg_replace('/\s+/u', ' ', (string) $rawTitle)));
    if (count($parts) < 2) return $short;
    $angle = array_pop($parts);
    $base = implode(': ', $parts);
    $budget = $max - mb_strlen($angle, 'UTF-8') - 3;
    if ($budget < 20) return $short;

    return sg_seo_title($base, '', $budget) . ' · ' . $angle;
}

/**
 * Our own garden photographs, placed inside the article body.
 *
 * Mirrors src/utils/articlePhoto.ts. Both must agree: the crawler is served this version
 * and then renders the React one, and a photo that appears in only one of them looks like
 * something injected for the crawler's benefit.
 */
/**
 * Lowercase and drop Greek accents.
 *
 * Greek moves its accent when a word inflects — "κρεμμύδι" becomes "κρεμμυδιού" — so a
 * keyword written in one form silently misses the other. Mirrors the NFD normalisation in
 * src/utils/articlePhoto.ts.
 */
function sg_flatten_greek($t) {
    $t = mb_strtolower((string) $t, 'UTF-8');
    return strtr($t, array(
        'ά' => 'α', 'έ' => 'ε', 'ή' => 'η', 'ί' => 'ι', 'ό' => 'ο', 'ύ' => 'υ', 'ώ' => 'ω',
        'ϊ' => 'ι', 'ϋ' => 'υ', 'ΐ' => 'ι', 'ΰ' => 'υ',
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
    ));
}

function sg_real_photos() {
    static $cache = null;
    if ($cache === null) {
        $cache = json_decode((string) @file_get_contents(__DIR__ . '/real-photos.json'), true) ?: array();
    }
    return $cache;
}

/** Stable per-slug pick, so two tomato articles do not get the same tomato photo. */
function sg_pick_real_photo($article) {
    $title = $article['title']['el'] ?? (is_string($article['title'] ?? null) ? $article['title'] : '');
    $summary = $article['summary']['el'] ?? (is_string($article['summary'] ?? null) ? $article['summary'] : '');
    $title = sg_flatten_greek($title);
    // The slug names the subject too, and one article's title is truncated to the point
    // that only its slug still says what it is about.
    $secondary = sg_flatten_greek($summary . ' ' . str_replace('-', ' ', $article['slug'] ?? ''));
    if (trim($title) === '' && trim($secondary) === '') return null;

    // Score by the longest keyword that matched, so the most specific photo wins: an article
    // about tomatoes that also mentions watering gets the tomato, not the drip line.
    // A hit in the title outranks a hit in the summary or slug: the title says what the
    // article is about, while a summary mentions half the garden in passing.
    $best = 0;
    $hits = array();
    foreach (sg_real_photos() as $photo) {
        $score = 0;
        foreach ($photo['match'] ?? array() as $needle) {
            $k = sg_flatten_greek($needle);
            if ($k !== '' && mb_strpos($title, $k) !== false) $score = max($score, 2);
            elseif ($k !== '' && mb_strpos($secondary, $k) !== false) $score = max($score, 1);
        }
        if (!$score) continue;
        if ($score > $best) { $best = $score; $hits = array(); }
        if ($score === $best) $hits[] = $photo;
    }
    if (!count($hits)) return null;

    $key = $article['slug'] ?? $title;
    $h = 0;
    foreach (preg_split('//u', $key, -1, PREG_SPLIT_NO_EMPTY) as $ch) {
        $h = ($h * 31 + mb_ord($ch, 'UTF-8')) % 4294967296;
    }
    return $hits[$h % count($hits)];
}

/**
 * Put it before the third `##` heading — past the opening, but early enough that most
 * readers reach it. Never the lead image: the header photo is the article's own.
 */
function sg_insert_real_photo($markdown, $photo) {
    if (!$photo || $markdown === '') return $markdown;
    if (strpos($markdown, $photo['file']) !== false) return $markdown;

    $block = "
![" . $photo['alt'] . "](" . $photo['file'] . ")

";
    if (!preg_match_all('/^##[ 	]+/mu', $markdown, $m, PREG_OFFSET_CAPTURE)) {
        return $markdown . "

" . ltrim($block);
    }
    $positions = array_map(function ($x) { return $x[1]; }, $m[0]);
    $at = $positions[min(2, count($positions) - 1)];
    return substr($markdown, 0, $at) . ltrim($block) . "
" . substr($markdown, $at);
}

/**
 * Repair text that lost a character somewhere upstream.
 *
 * Two published articles carry U+FFFD REPLACEMENT CHARACTER pairs where a kappa should be
 * — "Ανθε??τικά", "Θερμο??οιτίδες" — one pair per lost two-byte letter, so something
 * re-encoded the JSON a byte at a time. The stored data is owned by the live cron, so it
 * is repaired here, where every reader and crawler passes through.
 *
 * The known cases are listed rather than guessed at: a rule that replaced any pair with a
 * kappa would confidently invent the wrong letter the next time this happens. Anything not
 * listed has the marker removed, so a reader sees a missing letter and not a black diamond.
 */
function sg_repair_text($t) {
    if (!is_string($t)) return $t;
    $bad = "\xEF\xBF\xBD";
    if (strpos($t, $bad) === false) return $t;
    $t = strtr($t, array(
        'Ανθε' . $bad . $bad . 'τικά' => 'Ανθεκτικά',
        'Θερμο' . $bad . $bad . 'οιτίδες' => 'Θερμοκοιτίδες',
    ));
    return str_replace($bad, '', $t);
}

/** Apply sg_repair_text to the fields a reader ever sees. */
function sg_repair_article($a) {
    if (!is_array($a)) return $a;
    foreach (array('title', 'summary', 'content') as $field) {
        if (!isset($a[$field])) continue;
        if (is_string($a[$field])) {
            $a[$field] = sg_repair_text($a[$field]);
        } elseif (is_array($a[$field])) {
            foreach ($a[$field] as $lang => $v) {
                if (is_string($v)) $a[$field][$lang] = sg_repair_text($v);
            }
        }
    }
    return $a;
}

/**
 * Which plants an article actually talks about. Mirrors src/utils/plantMentions.ts.
 *
 * The 57 /fyta pages are the thinnest thing in the sitemap and almost nothing links to
 * them. An article about tomatoes should point at the tomato page.
 */
function sg_plant_stems($name) {
    $out = array();
    foreach (explode('/', $name) as $part) {
        $f = sg_flatten_greek(trim($part));
        // "Ντομάτα" must match "ντομάτας" and "ντομάτες", so a long name gives up its last
        // letter. Short ones do not: "Λάχανο" shortened to "λαχαν" matches "λαχανικά",
        // which is a different word, and "Ελιά" shortened matches half the dictionary.
        if (mb_strlen($f, 'UTF-8') > 6) $f = mb_substr($f, 0, -1, 'UTF-8');
        if (mb_strlen($f, 'UTF-8') >= 4) $out[] = $f;
    }
    return $out;
}

/**
 * The stem has to be a whole word, give or take an ending.
 *
 * Starting a word is not enough on its own: without the leading check "παρακάτω" was an
 * Αρακάς, "υδροδιαλυτό" a Ροδιά and "προκαλεί" a Ρόκα, which put those three links on all
 * 71 articles — and without the trailing one, "λαχανόκηπος" was a Λάχανο. Greek inflection
 * adds at most a few letters, so anything longer is a different word.
 */
function sg_first_mention($hay, $stem) {
    $pattern = '/(?:^|[^\p{L}])' . preg_quote($stem, '/') . '\p{L}{0,3}(?![\p{L}])/u';
    if (!preg_match($pattern, $hay, $m, PREG_OFFSET_CAPTURE)) return -1;
    return $m[0][1];
}

function sg_plants_mentioned($text, $limit = 6) {
    $hay = sg_flatten_greek((string) $text);
    if ($hay === '') return array();
    $plants = json_decode((string) @file_get_contents(__DIR__ . '/plants.json'), true) ?: array();

    $found = array();
    foreach ($plants as $p) {
        $at = -1;
        foreach (sg_plant_stems($p['name'] ?? '') as $stem) {
            $i = sg_first_mention($hay, $stem);
            if ($i >= 0 && ($at < 0 || $i < $at)) $at = $i;
        }
        if ($at >= 0) $found[] = array('slug' => $p['slug'], 'name' => $p['name'], 'at' => $at);
    }
    // Earliest mention first: the plant the article opens with is the one it is about.
    usort($found, function ($a, $b) { return $a['at'] - $b['at']; });
    return array_slice($found, 0, $limit);
}

/**
 * The short <title> for a page that is not an article. Mirrors pageTitle in
 * src/utils/seoTitle.ts.
 *
 * The plant pages, the tools and the homepage each wrote their own title with the brand
 * already on the end — 69 to 94 characters, every one cut off in a search result.
 */
function sg_page_title($full) {
    $withoutBrand = trim(preg_replace('/\s*[|\x{2014}\x{2013}-]\s*SmartGarden\.gr\s*$/u', '', (string) $full));
    return sg_seo_title($withoutBrand !== '' ? $withoutBrand : 'SmartGarden.gr');
}
