<?php
/**
 * SmartGarden.gr - Server-side meta tags for article pages.
 * Social crawlers (Facebook/WhatsApp/Twitter/etc.) and some search bots don't
 * execute JavaScript, so without this every shared article link showed the
 * generic homepage title/description/image instead of the article's own.
 *
 * .htaccess rewrites /article/<slug> to this script before falling through
 * to the SPA's own catch-all. The React app still boots normally afterwards.
 */

require_once __DIR__ . '/ssr-lib.php';

$slug = $_GET['slug'] ?? '';
$slug = preg_replace('/[^\p{L}\p{N}\-_]/u', '', (string) $slug);

$indexPath = __DIR__ . '/index.html';
$html = file_exists($indexPath) ? file_get_contents($indexPath) : false;

if (!$html) {
    http_response_code(500);
    echo 'Site build not found.';
    exit;
}

$article = null;
$articlesPath = __DIR__ . '/latest_articles.json';
if ($slug && file_exists($articlesPath)) {
    $articles = json_decode(file_get_contents($articlesPath), true);
    if (is_array($articles)) {
        foreach ($articles as $a) {
            if (($a['slug'] ?? '') === $slug) {
                $article = sg_repair_article($a);
                break;
            }
        }
    }
}

if ($article) {
    $rawTitle = $article['title']['el'] ?? $article['title'] ?? 'Άρθρο';
    // Social cards have room for the whole headline; a search result does not.
    $title = $rawTitle . ' | SmartGarden.gr';
    $seoTitle = sg_seo_title_unique($rawTitle, is_array($articles ?? null) ? $articles : array(), $slug);
    $description = sg_unique_description($article, is_array($articles ?? null) ? $articles : array());
    $image = $article['image'] ?? $article['imageUrl'] ?? 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80';
    $url = 'https://smartgarden.gr/article/' . rawurlencode($slug);

    // Same fixed w=700/h=359 transform AnimatedShortVideo.tsx applies to this exact hero
    // (cardImageWidth/cardImageHeight there) -- a preload for the raw 1200w image was
    // worse than no preload at all: it's a different URL than the one the <img> tag
    // actually requests, so the browser fetched BOTH (the preload, unused, plus the real
    // one, still starting late), burning bandwidth under throttled mobile for zero LCP
    // benefit (confirmed via PageSpeed 2026-09-30: LCP got worse, 9.5s -> 10.2s, after
    // adding the mismatched preload). Keeping this in exact sync with that file's own
    // math, not just today's numbers, is what makes the preload actually hit.
    $heroImageForPreload = $image;
    if (strpos($heroImageForPreload, 'images.unsplash.com') !== false) {
        $cardW = 700;
        $cardH = (int) round($cardW / 1.95);
        if (preg_match('/[?&]w=\d+/', $heroImageForPreload)) {
            $heroImageForPreload = preg_replace('/([?&])w=\d+/', '${1}w=' . $cardW, $heroImageForPreload, 1);
        } else {
            $heroImageForPreload .= (strpos($heroImageForPreload, '?') !== false ? '&' : '?') . 'w=' . $cardW;
        }
        if (preg_match('/[?&]h=\d+/', $heroImageForPreload)) {
            $heroImageForPreload = preg_replace('/([?&])h=\d+/', '${1}h=' . $cardH, $heroImageForPreload, 1);
        } else {
            $heroImageForPreload = preg_replace('/([?&])w=\d+/', '${1}w=' . $cardW . '&h=' . $cardH, $heroImageForPreload, 1);
        }
    }

    $replacements = [
        '/<title>.*?<\/title>/s' => '<title>' . htmlspecialchars($seoTitle, ENT_QUOTES) . '</title>',
        '/<meta name="description" content=".*?"/s' => '<meta name="description" content="' . htmlspecialchars(sg_meta_description($description), ENT_QUOTES) . '"',
        '/<link rel="canonical" href=".*?"/s' => '<link rel="canonical" href="' . htmlspecialchars($url, ENT_QUOTES) . '"',
        '/<meta property="og:url" content=".*?"/s' => '<meta property="og:url" content="' . htmlspecialchars($url, ENT_QUOTES) . '"',
        '/<meta property="og:title" content=".*?"/s' => '<meta property="og:title" content="' . htmlspecialchars($title, ENT_QUOTES) . '"',
        '/<meta property="og:description" content=".*?"/s' => '<meta property="og:description" content="' . htmlspecialchars(sg_meta_description($description), ENT_QUOTES) . '"',
        '/<meta property="og:image" content=".*?"/s' => '<meta property="og:image" content="' . htmlspecialchars($image, ENT_QUOTES) . '"',
        '/<meta property="og:type" content=".*?"/s' => '<meta property="og:type" content="article"',
        '/<meta name="twitter:title" content=".*?"/s' => '<meta name="twitter:title" content="' . htmlspecialchars($title, ENT_QUOTES) . '"',
        '/<meta name="twitter:description" content=".*?"/s' => '<meta name="twitter:description" content="' . htmlspecialchars(sg_meta_description($description), ENT_QUOTES) . '"',
        '/<meta name="twitter:image" content=".*?"/s' => '<meta name="twitter:image" content="' . htmlspecialchars($image, ENT_QUOTES) . '"',
    ];

    foreach ($replacements as $pattern => $replacement) {
        $html = preg_replace($pattern, $replacement, $html, 1);
    }

    // Pinterest Rich Pins read og:type=article plus og:site_name and, optionally, the
    // article:* tags; without site_name a pin cannot show the site's name under the image.
    // The author is the organisation, same as the Article schema further down: this file
    // does not know of a named writer, so it does not invent one.
    $ogExtra = '<meta property="og:site_name" content="SmartGarden.gr" />';
    $pubDate = (string) ($article['date'] ?? '');
    if (preg_match('/^\d{4}-\d{2}-\d{2}/', $pubDate)) {
        $ogExtra .= '<meta property="article:published_time" content="' . htmlspecialchars(substr($pubDate, 0, 10), ENT_QUOTES) . '" />';
    }
    $ogCat = $article['categoryLabel']['el'] ?? (is_string($article['categoryLabel'] ?? null) ? $article['categoryLabel'] : '');
    if ($ogCat !== '') {
        $ogExtra .= '<meta property="article:section" content="' . htmlspecialchars($ogCat, ENT_QUOTES) . '" />';
    }
    $ogExtra .= '<meta property="article:author" content="SmartGarden.gr" />';
    $html = preg_replace_callback('/<\/head>/', function () use ($ogExtra) {
        return $ogExtra . '</head>';
    }, $html, 1);

    // The hero/featured image is the LCP element on every article page (confirmed via
    // PageSpeed 2026-09-30: 9.5s LCP, 1,590ms of it just the browser not even starting the
    // fetch yet), but it's rendered by React with loading="lazy" -- lazy-loading defers
    // discovery on purpose, which is exactly backwards for the single largest element on
    // the page. A preload hint in <head> starts the fetch immediately from the raw HTML
    // response, in parallel with the JS bundle, instead of waiting for React to mount and
    // build the <img> tag before the browser even knows the image exists.
    $html = preg_replace(
        '/<\/head>/',
        '<link rel="preload" as="image" fetchpriority="high" href="' . htmlspecialchars($heroImageForPreload, ENT_QUOTES) . '" /></head>',
        $html,
        1
    );

    // ---------------------------------------------------------------------------
    // Server-render the article itself.
    //
    // Until now only the <head> was filled in: every one of the 70 article URLs served
    // a byte-identical 6KB shell with an empty <body>, because the text was added by
    // React after load. Search Console's verdict was exactly what that deserves —
    // 158 pages "not indexed", most of them "Duplicate: Google chose a different
    // canonical", since to a crawler that does not run JavaScript the pages really were
    // identical.
    //
    // The content is already on the server in latest_articles.json. This prints it into
    // #root, which React replaces the moment it mounts, so readers see no difference and
    // crawlers see 70 distinct pages.

    /** Markdown subset to HTML. The articles only use headings, bold, lists and paragraphs. */
    $mdToHtml = function ($md) {
        $out = '';
        $listOpen = false;
        // Not '/\R/': without the u modifier PCRE matches the raw byte 0x85 as NEL, and
        // 0x85 is the second byte of υ (U+03C5). Every υ in the article was a line break,
        // so each one split a character in half — 186 of them in one article — and
        // htmlspecialchars returns an empty string for invalid UTF-8, which is why the
        // server-rendered body was a run of empty <p> tags and half-words. Spelling the
        // line endings out leaves nothing to interpret.
        foreach (explode("\n", str_replace(array("\r\n", "\r"), "\n", (string) $md)) as $line) {
            $line = rtrim($line);
            if ($line === '') {
                if ($listOpen) { $out .= "</ul>
"; $listOpen = false; }
                continue;
            }
            $esc = function ($t) { return htmlspecialchars($t, ENT_QUOTES, 'UTF-8'); };
            // Inline bold first, so it survives the escaping around it.
            $inline = function ($t) use ($esc) {
                $h = preg_replace('/\*\*(.+?)\*\*/u', '<strong>$1</strong>', $esc($t));
                // [text](/path): site-relative targets only, so an article body can never emit an off-site link here.
                return preg_replace('/\[([^\]]+)\]\((\/[^)\s]*)\)/u', '<a href="$2">$1</a>', $h);
            };
            // A line that is only an image is one of our own photographs.
            if (preg_match('/^!\\[(.*?)\\]\\((.+?)\\)$/u', $line, $m)) {
                if ($listOpen) { $out .= "</ul>
"; $listOpen = false; }
                $out .= '<figure><img src="' . $esc($m[2]) . '" alt="' . $esc($m[1])
                      . '" width="900" height="675" loading="lazy" decoding="async">'
                      . '<figcaption>' . $esc($m[1]) . ' — δική μας φωτογραφία από τον κήπο μας, Σεπτέμβριος 2026.</figcaption>'
                      . "</figure>
";
            } elseif (preg_match('/^###\s+(.*)$/u', $line, $m)) {

                if ($listOpen) { $out .= "</ul>
"; $listOpen = false; }
                $out .= '<h3>' . $inline($m[1]) . "</h3>
";
            } elseif (preg_match('/^##\s+(.*)$/u', $line, $m)) {
                if ($listOpen) { $out .= "</ul>
"; $listOpen = false; }
                $out .= '<h2>' . $inline($m[1]) . "</h2>
";
            } elseif (preg_match('/^[-*]\s+(.*)$/u', $line, $m)) {
                if (!$listOpen) { $out .= "<ul>
"; $listOpen = true; }
                $out .= '<li>' . $inline($m[1]) . "</li>
";
            } else {
                if ($listOpen) { $out .= "</ul>
"; $listOpen = false; }
                $out .= '<p>' . $inline($line) . "</p>
";
            }
        }
        if ($listOpen) $out .= "</ul>
";
        return $out;
    };

    $bodyMd = $article['content']['el'] ?? (is_string($article['content'] ?? null) ? $article['content'] : '');
    $takeaways = $article['keyTakeaways']['el'] ?? array();
    $h1 = $article['title']['el'] ?? ($article['title'] ?? '');
    $summaryFull = $article['summary']['el'] ?? ($article['summary'] ?? '');

    $ssr = '<article>';
    $ssr .= '<h1>' . htmlspecialchars($h1, ENT_QUOTES, 'UTF-8') . '</h1>';
    if (!empty($article['image'])) {
        // Ask for exactly what AnimatedShortVideo will ask for once React mounts (700x359).
        // The stored URL is w=1200, so the browser was fetching a 175KB image for this tag
        // and then a second, smaller one for the same slot - the large one never displayed.
        $heroW = 700;
        $heroH = (int) round($heroW / 1.95);
        $hero = preg_replace('/([?&])w=\d+/', '${1}w=' . $heroW, $article['image']);
        $hero = preg_match('/[?&]h=\d+/', $hero)
            ? preg_replace('/([?&])h=\d+/', '${1}h=' . $heroH, $hero)
            : preg_replace('/([?&])w=\d+/', '${1}w=' . $heroW . '&h=' . $heroH, $hero);
        $ssr .= '<img src="' . htmlspecialchars($hero, ENT_QUOTES) . '" alt="'
              . htmlspecialchars($h1, ENT_QUOTES, 'UTF-8') . '" width="' . $heroW . '" height="' . $heroH
              . '" fetchpriority="high" decoding="async">';
    }
    if ($summaryFull !== '') {
        $ssr .= '<p>' . htmlspecialchars($summaryFull, ENT_QUOTES, 'UTF-8') . '</p>';
    }
    if (is_array($takeaways) && count($takeaways)) {
        $ssr .= '<h2>Βασικά σημεία</h2><ul>';
        foreach ($takeaways as $t) $ssr .= '<li>' . htmlspecialchars((string) $t, ENT_QUOTES, 'UTF-8') . '</li>';
        $ssr .= '</ul>';
    }
    // One of our own garden photographs, dropped into the body rather than used as the
    // lead image. src/utils/articlePhoto.ts does the same to what React renders.
    $realPhoto = sg_pick_real_photo($article);
    $ssr .= $mdToHtml(sg_insert_real_photo($bodyMd, $realPhoto));
    $ssr .= '</article>';

    // The plants this article discusses. The /fyta pages are the thinnest thing in the
    // sitemap and almost nothing points at them; an article about tomatoes linking to the
    // tomato page is a real link for a reader and the only inbound link most of them get.
    $mentioned = sg_plants_mentioned($h1 . ' ' . $summaryFull . ' ' . $bodyMd);
    if (count($mentioned)) {
        $ssr .= '<nav><h2>Φυτά που αναφέρονται</h2><ul>';
        foreach ($mentioned as $pl) {
            $ssr .= '<li><a href="/fyta/' . sg_e(rawurlencode($pl['slug'])) . '">'
                  . sg_e($pl['name']) . '</a></li>';
        }
        $ssr .= '</ul></nav>';
    }

    // Related reading. Two jobs at once: it gives a crawler eight internal links out of
    // every article — which is how the other seventy get discovered and how link equity
    // moves around a flat site — and it gives a reader somewhere to go next, which is the
    // only thing that turns one pageview into several.
    $all = json_decode((string) @file_get_contents(__DIR__ . '/latest_articles.json'), true) ?: array();
    $cat = $article['category'] ?? '';
    $sameCat = array();
    $others = array();
    foreach ($all as $a) {
        if (($a['slug'] ?? '') === $slug) continue;
        if ($cat !== '' && ($a['category'] ?? '') === $cat) $sameCat[] = $a;
        else $others[] = $a;
    }
    // Same category first, then the newest of anything else, so a thin category still
    // produces a full block rather than one lonely link.
    $related = array_slice(array_merge($sameCat, $others), 0, 8);
    if (count($related)) {
        $ssr .= '<nav>' . sg_article_list($related, 8, 'Σχετικά άρθρα') . '</nav>';
    }
    $ssr .= '<p><a href="/">Όλοι οι οδηγοί του SmartGarden.gr</a>'
          . ($cat !== '' ? ' · <a href="/kategoria/' . sg_e(rawurlencode($cat)) . '">Περισσότερα στην ίδια κατηγορία</a>' : '')
          . '</p>';

    // The questions this category answers, rendered as text before they are marked up:
    // Google requires FAQ markup to match content the reader can actually see.
    $faqs = array();
    $faqData = json_decode((string) @file_get_contents(__DIR__ . '/category-faqs.json'), true);
    if (is_array($faqData)) {
        $faqs = $faqData['byCategory'][$cat] ?? ($faqData['default'] ?? array());
    }
    if (count($faqs)) {
        $ssr .= '<section><h2>Συχνές ερωτήσεις</h2><dl>';
        foreach ($faqs as $f) {
            $ssr .= '<dt>' . sg_e($f['question'] ?? '') . '</dt><dd>' . sg_e($f['answer'] ?? '') . '</dd>';
        }
        $ssr .= '</dl></section>';
    }

    // Structured data, which also only ever existed client-side.
    $graph = array();
    $graph[] = array(
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => mb_substr($h1, 0, 110),
        'description' => $summaryFull,
        // Both images: the article's own header photo, and — where there is one — the
        // photograph we took of the thing the article is about. Article accepts a list, and
        // a page whose structured data points at an original photo is making a different
        // claim from one that points only at stock.
        'image' => $realPhoto
            ? array($article['image'] ?? '', 'https://smartgarden.gr' . $realPhoto['file'])
            : ($article['image'] ?? ''),
        'datePublished' => $article['date'] ?? '',
        'dateModified' => $article['date'] ?? '',
        'author' => array('@type' => 'Organization', 'name' => 'SmartGarden.gr', 'url' => 'https://smartgarden.gr'),
        'publisher' => array('@type' => 'Organization', 'name' => 'SmartGarden.gr'),
        'mainEntityOfPage' => array('@type' => 'WebPage', '@id' => $url),
        'inLanguage' => 'el',
    );

    $catLabel = $article['categoryLabel']['el'] ?? (is_string($article['categoryLabel'] ?? null) ? $article['categoryLabel'] : '');
    $trail = array('Αρχική' => 'https://smartgarden.gr/');
    if ($cat !== '' && $catLabel !== '') {
        $trail[$catLabel] = 'https://smartgarden.gr/kategoria/' . rawurlencode($cat);
    }
    $trail[$h1] = $url;
    $graph[] = sg_breadcrumbs($trail);

    if (count($faqs)) {
        $graph[] = array(
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            '@id' => $url . '#faq',
            'mainEntity' => array_map(function ($f) {
                return array('@type' => 'Question', 'name' => $f['question'] ?? '',
                    'acceptedAnswer' => array('@type' => 'Answer', 'text' => $f['answer'] ?? ''));
            }, $faqs),
        );
    }

    // HowTo only when the body genuinely contains a numbered sequence. The generator's
    // prompt produces "**Βήμα N: title**" headings; an article without them gets no HowTo,
    // because markup that describes steps the page does not show is a manual action.
    if (preg_match_all(
        '/(?:\\*\\*|^#{2,3}\\s*)Βήμα\\s*\\d+[:.]?\\s*([^*\\n]+?)(?:\\*\\*)?\\s*\\n+(.*?)(?=\\n(?:\\*\\*|#{2,3}\\s*)Βήμα\\s*\\d+|\\n#{2,3}\\s|\\n\\*\\*Εργαλεία|$)/ums',
        $bodyMd, $stepM, PREG_SET_ORDER
    ) && count($stepM) >= 2) {
        $steps = array();
        foreach (array_slice($stepM, 0, 12) as $sm) {
            $text = trim(preg_replace('/\s+/u', ' ', preg_replace('/[*_#]/u', '', $sm[2])));
            if ($text === '') continue;
            $steps[] = array('@type' => 'HowToStep', 'name' => trim($sm[1]),
                'text' => mb_substr($text, 0, 500, 'UTF-8'));
        }
        if (count($steps) >= 2) {
            $graph[] = array('@context' => 'https://schema.org', '@type' => 'HowTo',
                '@id' => $url . '#howto', 'name' => mb_substr($h1, 0, 110, 'UTF-8'), 'step' => $steps);
        }
    }

    $ld = json_encode($graph, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    // Matches the root div by anchoring on </body>, which always follows it in the built
    // index.html, not by requiring the div to be empty -- index.html now ships a static
    // homepage hero inside #root (for LCP), so an empty-only match silently stopped firing
    // here and every article page lost its SSR body, JSON-LD, ad slots and embedded article
    // JSON with no error anywhere (found 2026-09-30 via a live CLS investigation that turned
    // up window.__SG_ADS__ missing entirely from the served HTML). Vite hoists the built
    // page's <script type="module"> into <head>, so that tag is not a usable anchor here --
    // confirmed by testing this exact regex against the real dist/index.html before deploying.
    $html = preg_replace(
        '/<div id="root">.*?<\/div>(?=\s*<\/body>)/s',
        '<div id="root">' . $ssr . '</div>' . "
"
            . '<script type="application/ld+json" id="smartgarden-article-schema">' . $ld . '</script>'
            // The reader's own copy, so the page it landed on needs no second request for
            // its body. HEX_TAG/HEX_AMP keep any '</script>' inside the article text from
            // ending this one.
            // The AdSense slot ids, so the reader's page needs no extra request to know
            // whether there are ads to place. Pasted on the live site via ads-admin.php.
            . '<script>window.__SG_ADS__=' . (json_encode(json_decode((string) @file_get_contents(__DIR__ . '/ads-slots.json'), true) ?: new stdClass()) ?: '{}') . ';</script>'
            . '<script>window.__SG_ARTICLE__=' . json_encode($article,
                  JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
                  | JSON_HEX_APOS | JSON_HEX_QUOT) . ';</script>',
        $html,
        1
    );
}

header('Content-Type: text/html; charset=utf-8');
echo $html;
