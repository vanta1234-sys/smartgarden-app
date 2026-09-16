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

$slug = $_GET['slug'] ?? '';
$slug = preg_replace('/[^a-zA-Z0-9\-_]/', '', $slug);

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
                $article = $a;
                break;
            }
        }
    }
}

if ($article) {
    $title = ($article['title']['el'] ?? $article['title'] ?? 'Άρθρο') . ' | SmartGarden.gr';
    $description = mb_substr($article['summary']['el'] ?? $article['summary'] ?? '', 0, 200);
    $image = $article['image'] ?? $article['imageUrl'] ?? 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80';
    $url = 'https://smartgarden.gr/article/' . $slug;

    $replacements = [
        '/<title>.*?<\/title>/s' => '<title>' . htmlspecialchars($title, ENT_QUOTES) . '</title>',
        '/<meta name="description" content=".*?"/s' => '<meta name="description" content="' . htmlspecialchars($description, ENT_QUOTES) . '"',
        '/<link rel="canonical" href=".*?"/s' => '<link rel="canonical" href="' . htmlspecialchars($url, ENT_QUOTES) . '"',
        '/<meta property="og:url" content=".*?"/s' => '<meta property="og:url" content="' . htmlspecialchars($url, ENT_QUOTES) . '"',
        '/<meta property="og:title" content=".*?"/s' => '<meta property="og:title" content="' . htmlspecialchars($title, ENT_QUOTES) . '"',
        '/<meta property="og:description" content=".*?"/s' => '<meta property="og:description" content="' . htmlspecialchars($description, ENT_QUOTES) . '"',
        '/<meta property="og:image" content=".*?"/s' => '<meta property="og:image" content="' . htmlspecialchars($image, ENT_QUOTES) . '"',
        '/<meta property="og:type" content=".*?"/s' => '<meta property="og:type" content="article"',
        '/<meta name="twitter:title" content=".*?"/s' => '<meta name="twitter:title" content="' . htmlspecialchars($title, ENT_QUOTES) . '"',
        '/<meta name="twitter:description" content=".*?"/s' => '<meta name="twitter:description" content="' . htmlspecialchars($description, ENT_QUOTES) . '"',
        '/<meta name="twitter:image" content=".*?"/s' => '<meta name="twitter:image" content="' . htmlspecialchars($image, ENT_QUOTES) . '"',
    ];

    foreach ($replacements as $pattern => $replacement) {
        $html = preg_replace($pattern, $replacement, $html, 1);
    }

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
        foreach (preg_split('/\R/', (string) $md) as $line) {
            $line = rtrim($line);
            if ($line === '') {
                if ($listOpen) { $out .= "</ul>
"; $listOpen = false; }
                continue;
            }
            $esc = function ($t) { return htmlspecialchars($t, ENT_QUOTES, 'UTF-8'); };
            // Inline bold first, so it survives the escaping around it.
            $inline = function ($t) use ($esc) {
                return preg_replace('/\*\*(.+?)\*\*/u', '<strong>$1</strong>', $esc($t));
            };
            if (preg_match('/^###\s+(.*)$/u', $line, $m)) {
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
        $ssr .= '<img src="' . htmlspecialchars($article['image'], ENT_QUOTES) . '" alt="'
              . htmlspecialchars($h1, ENT_QUOTES, 'UTF-8') . '" width="1200" height="900">';
    }
    if ($summaryFull !== '') {
        $ssr .= '<p>' . htmlspecialchars($summaryFull, ENT_QUOTES, 'UTF-8') . '</p>';
    }
    if (is_array($takeaways) && count($takeaways)) {
        $ssr .= '<h2>Βασικά σημεία</h2><ul>';
        foreach ($takeaways as $t) $ssr .= '<li>' . htmlspecialchars((string) $t, ENT_QUOTES, 'UTF-8') . '</li>';
        $ssr .= '</ul>';
    }
    $ssr .= $mdToHtml($bodyMd);
    $ssr .= '</article>';

    // Related reading. Two jobs at once: it gives a crawler eight internal links out of
    // every article — which is how the other seventy get discovered and how link equity
    // moves around a flat site — and it gives a reader somewhere to go next, which is the
    // only thing that turns one pageview into several.
    require_once __DIR__ . '/ssr-lib.php';
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

    // Structured data, which also only ever existed client-side.
    $ld = json_encode(array(
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => mb_substr($h1, 0, 110),
        'description' => $summaryFull,
        'image' => $article['image'] ?? '',
        'datePublished' => $article['date'] ?? '',
        'dateModified' => $article['date'] ?? '',
        'author' => array('@type' => 'Organization', 'name' => 'SmartGarden.gr', 'url' => 'https://smartgarden.gr'),
        'publisher' => array('@type' => 'Organization', 'name' => 'SmartGarden.gr'),
        'mainEntityOfPage' => array('@type' => 'WebPage', '@id' => $url),
        'inLanguage' => 'el',
    ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $html = preg_replace(
        '/<div id="root">\s*<\/div>/',
        '<div id="root">' . $ssr . '</div>' . "
"
            . '<script type="application/ld+json">' . $ld . '</script>',
        $html,
        1
    );
}

header('Content-Type: text/html; charset=utf-8');
echo $html;
