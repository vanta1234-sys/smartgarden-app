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
