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
}

header('Content-Type: text/html; charset=utf-8');
echo $html;
